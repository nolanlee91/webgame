// supabaseStore + supabaseAuth chạy với một máy chủ GIẢ PostgREST / GoTrue: kiểm dạng request (header, on_conflict, Prefer),
// lần gửi đầu thắng, đếm hạng, nhớ token 60 giây, và service key không bao giờ lọt ra ngoài. `npm run test:account`
import { test } from "node:test";
import assert from "node:assert/strict";
import { createAccountApi } from "../index.mjs";
import { supabaseStore, isJwtKey } from "../stores.mjs";
import { DAY, NOW, sudokuProof, quizProof, moves2048, apiServer, fakeSupabase as fakeSupabaseBase } from "./helpers.mjs";

const ANON = "sb_publishable_ANONKEY123";
const USERS = { "tok-alice-123456": "11111111-1111-4111-8111-111111111111", "tok-bob-12345678": "22222222-2222-4222-8222-222222222222" };
const fakeSupabase = (o) => fakeSupabaseBase({ anonKey: ANON, users: USERS, ...o });

for (const serviceKey of ["sb_secret_SERVICEKEY_DO_NOT_LEAK", "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.SIGNATURE_DO_NOT_LEAK"]) {
  const kind = isJwtKey(serviceKey) ? "key JWT cũ" : "key sb_secret_ mới";
  test(`Supabase (${kind}): gửi điểm, bảng, hạng, profile — đúng dạng request, không lộ service key`, async () => {
    const fake = await fakeSupabase({ serviceKey });
    const logs = [];
    const env = { SUPABASE_URL: fake.base, SUPABASE_ANON_KEY: ANON, SUPABASE_SERVICE_ROLE_KEY: serviceKey, RAILWAY_ENVIRONMENT: "production" };
    const api = createAccountApi({ env, now: () => NOW, log: (m) => logs.push(m) });
    assert.equal(api.mode, "supabase");
    const s = await apiServer(api);
    const bodies = [];
    const call = async (method, path, { token, body, headers = {} } = {}) => {
      const h = { ...headers }; if (token) h.authorization = `Bearer ${token}`;
      if (body) h["content-type"] = "application/json";
      const res = await fetch(s.base + path, { method, headers: h, body: body && JSON.stringify(body) });
      const text = await res.text(); bodies.push(text);
      return { status: res.status, json: JSON.parse(text) };
    };
    try {
      const cfg = await call("GET", "/api/config");
      assert.equal(cfg.json.supabaseAnonKey, ANON);
      // chế độ supabase: header x-dev-user bị phớt lờ
      assert.equal((await call("POST", `/api/daily/do-vui-nhanh/${DAY}`, { headers: { "x-dev-user": "useraaaaaa" }, body: { proof: quizProof(DAY) } })).status, 401);
      assert.equal((await call("POST", `/api/daily/do-vui-nhanh/${DAY}`, { token: "tok-wrong-123456", body: { proof: quizProof(DAY) } })).status, 401);
      const a = await call("POST", `/api/daily/do-vui-nhanh/${DAY}`, { token: "tok-alice-123456", body: { name: "  Alice  ", proof: quizProof(DAY, [true, true, true, false, true]) } });
      assert.equal(a.status, 200, JSON.stringify(a.json));
      assert.equal(a.json.accepted, true); assert.equal(a.json.name, "Alice");
      const b = await call("POST", `/api/daily/do-vui-nhanh/${DAY}`, { token: "tok-bob-12345678", body: { name: "Bob", proof: quizProof(DAY) } });
      assert.deepEqual(b.json.top.map((e) => [e.rank, e.name, e.short, !!e.you]), [[1, "Bob", "5/5", true], [2, "Alice", "4/5", false]]);
      assert.equal(b.json.total, 2);
      // gửi lại ⇒ không đè (ignore-duplicates)
      const again = await call("POST", `/api/daily/do-vui-nhanh/${DAY}`, { token: "tok-alice-123456", body: { name: "Alice", proof: quizProof(DAY) } });
      assert.equal(again.json.accepted, false);
      assert.equal(again.json.me.short, "4/5"); assert.equal(again.json.me.rank, 2);
      assert.equal(fake.tables.daily_scores.length, 2);
      assert.equal(fake.tables.profiles.find((p) => p.id === USERS["tok-alice-123456"]).name, "Alice");
      // GET bảng có token ⇒ me; /api/daily/me gom các game
      await call("POST", `/api/daily/sudoku/${DAY}`, { token: "tok-alice-123456", body: { name: "Alice", proof: sudokuProof(DAY, { time: 200 }) } });
      const me = await call("GET", `/api/daily/me?day=${DAY}`, { token: "tok-alice-123456" });
      assert.deepEqual(me.json.ranks, { "do-vui-nhanh": { rank: 2, total: 2, short: "4/5" }, sudoku: { rank: 1, total: 1, short: "3:20 ⭐" } });
      const g = await call("GET", `/api/daily/2048/${DAY}`, { token: "tok-bob-12345678" });
      assert.deepEqual(g.json, { game: "2048", day: DAY, top: [], total: 0 });

      // ----- dạng request -----
      const rest = fake.log.filter((r) => r.path.startsWith("/rest/"));
      const auth = fake.log.filter((r) => r.path.startsWith("/auth/"));
      assert.ok(rest.length > 0 && auth.length > 0);
      for (const r of rest) {
        assert.equal(r.headers.apikey, serviceKey);
        if (isJwtKey(serviceKey)) assert.equal(r.headers.authorization, `Bearer ${serviceKey}`);
        else assert.equal(r.headers.authorization, undefined, "key sb_secret_ không được gửi ở Authorization");
      }
      for (const r of auth) {
        assert.equal(r.headers.apikey, ANON, "xác thực người dùng bằng anon key");
        assert.ok(!JSON.stringify(r.headers).includes(serviceKey), "service key không đi tới /auth");
      }
      const ins = rest.find((r) => r.method === "POST" && r.path === "/rest/v1/daily_scores");
      assert.equal(ins.query, "?on_conflict=game,day,user_id");
      assert.equal(ins.headers.prefer, "resolution=ignore-duplicates,return=representation");
      assert.deepEqual(Object.keys(ins.body[0]).sort(), ["day", "game", "name", "result", "score", "user_id"]);
      assert.equal(ins.body[0].user_id, USERS["tok-alice-123456"]);
      const prof = rest.find((r) => r.method === "POST" && r.path === "/rest/v1/profiles");
      assert.equal(prof.query, "?on_conflict=id");
      assert.match(prof.headers.prefer, /resolution=merge-duplicates/);
      // token hợp lệ được nhớ: alice gửi nhiều lần nhưng /auth chỉ hỏi 1 lần cho mỗi token
      const aliceAuth = auth.filter((r) => r.headers.authorization === "Bearer tok-alice-123456").length;
      assert.equal(aliceAuth, 1, "token nhớ 60 giây");
      // không response / log nào chứa service key
      for (const t of bodies) assert.ok(!t.includes(serviceKey) && !t.includes("DO_NOT_LEAK"));
      for (const l of logs) assert.ok(!l.includes("DO_NOT_LEAK"));
    } finally { await s.close(); await fake.close(); }
  });
}

test("Supabase: đổi tên ⇒ upsert profiles + PATCH daily_scores đúng user và ngày, không lộ service key", async () => {
  const serviceKey = "sb_secret_SERVICEKEY_DO_NOT_LEAK";
  const fake = await fakeSupabase({ serviceKey });
  const env = { SUPABASE_URL: fake.base, SUPABASE_ANON_KEY: ANON, SUPABASE_SERVICE_ROLE_KEY: serviceKey, RAILWAY_ENVIRONMENT: "production" };
  const api = createAccountApi({ env, now: () => NOW, log: () => {} });
  const s = await apiServer(api);
  const call = async (method, path, token, body) => {
    const res = await fetch(s.base + path, { method, headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(body) });
    const text = await res.text(); assert.ok(!text.includes(serviceKey)); return { status: res.status, json: JSON.parse(text) };
  };
  try {
    await call("POST", `/api/daily/do-vui-nhanh/${DAY}`, "tok-alice-123456", { name: "Alice", proof: quizProof(DAY) });
    await call("POST", `/api/daily/do-vui-nhanh/${DAY}`, "tok-bob-12345678", { name: "Bob", proof: quizProof(DAY) });
    const r = await call("POST", "/api/daily/name", "tok-alice-123456", { name: "Alice Mới" });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.deepEqual([r.json.name, r.json.changed], ["Alice Mới", 1]);
    const patch = fake.log.find((e) => e.method === "PATCH");
    assert.ok(patch, "có PATCH");
    assert.equal(patch.path, "/rest/v1/daily_scores");
    assert.ok(patch.query.includes(`user_id=eq.${USERS["tok-alice-123456"]}`) && patch.query.includes(`day=eq.${DAY}`), patch.query);
    assert.deepEqual(patch.body, { name: "Alice Mới" });
    assert.equal(patch.headers.apikey, serviceKey); assert.equal(patch.headers.authorization, undefined);
    assert.deepEqual(fake.tables.daily_scores.map((x) => x.name).sort(), ["Alice Mới", "Bob"]);
    assert.equal(fake.tables.profiles.find((p) => p.id === USERS["tok-alice-123456"]).name, "Alice Mới");
  } finally { await s.close(); await fake.close(); }
});

test("Supabase lỗi ⇒ 502 'upstream', log không chứa key", async () => {
  const serviceKey = "sb_secret_FAILKEY_DO_NOT_LEAK";
  const fake = await fakeSupabase({ serviceKey, failRest: true });
  const logs = [];
  const api = createAccountApi({ env: { SUPABASE_URL: fake.base, SUPABASE_ANON_KEY: ANON, SUPABASE_SERVICE_ROLE_KEY: serviceKey }, now: () => NOW, log: (m) => logs.push(m) });
  const s = await apiServer(api);
  try {
    const r = await fetch(`${s.base}/api/daily/2048/${DAY}`, { method: "POST", headers: { authorization: "Bearer tok-bob-12345678", "content-type": "application/json" }, body: JSON.stringify({ proof: { moves: moves2048(DAY, 5) } }) });
    assert.equal(r.status, 502);
    const text = await r.text();
    assert.deepEqual(JSON.parse(text), { error: "upstream" });
    assert.ok(logs.length > 0);
    for (const l of logs.concat(text)) assert.ok(!l.includes("DO_NOT_LEAK"), l);
  } finally { await s.close(); await fake.close(); }
});

test("Supabase không tới được (mạng) ⇒ 502, không treo", async () => {
  const api = createAccountApi({ env: { SUPABASE_URL: "http://127.0.0.1:9", SUPABASE_ANON_KEY: ANON, SUPABASE_SERVICE_ROLE_KEY: "sb_secret_x" }, now: () => NOW, log: () => {} });
  const s = await apiServer(api);
  try {
    const r = await fetch(`${s.base}/api/daily/2048/${DAY}`);
    assert.equal(r.status, 502);
    const r2 = await fetch(`${s.base}/api/daily/2048/${DAY}`, { method: "POST", headers: { authorization: "Bearer tok-bob-12345678" }, body: "{}" });
    assert.equal(r2.status, 502);
  } finally { await s.close(); }
});

test("supabaseStore: URL có / cuối vẫn đúng, thiếu key thì báo lỗi ngay", () => {
  assert.throws(() => supabaseStore({ url: "https://x.supabase.co" }));
  assert.equal(isJwtKey("eyJabc"), true);
  assert.equal(isJwtKey("sb_secret_abc"), false);
});
