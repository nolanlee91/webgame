// Đăng nhập Google (D6): người đã gắn Google (không còn ẩn danh) được nhận y như người ẩn danh, điểm + tên khoá theo user id,
// GET /api/account/me trả tên đã lưu (không bao giờ là tên Google thật). `npm run test:account`
import { test } from "node:test";
import assert from "node:assert/strict";
import { createAccountApi } from "../index.mjs";
import { supabaseAuth } from "../auth.mjs";
import { DAY, NOW, quizProof, sudokuProof, apiServer, fakeSupabase } from "./helpers.mjs";

const ANON = "sb_publishable_GOOGLE_TEST", SECRET = "sb_secret_GOOGLE_TEST_DO_NOT_LEAK";

async function call(base, method, path, { token, user, body } = {}) {
  const h = {};
  if (token) h.authorization = `Bearer ${token}`;
  if (user) h["x-dev-user"] = user;
  if (body !== undefined) h["content-type"] = "application/json";
  const res = await fetch(base + path, { method, headers: h, body: body !== undefined ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}

test("supabaseAuth: user đã gắn Google (is_anonymous=false, có identities) được nhận như user ẩn danh", async () => {
  const id = "33333333-3333-4333-8333-333333333333";
  const replies = [
    { id, is_anonymous: true, identities: [] },
    { id, is_anonymous: false, email: "a@gmail.com", identities: [{ provider: "google", identity_data: { full_name: "Tên Thật" } }] },
  ];
  let i = 0;
  const auth = supabaseAuth({ url: "https://x.supabase.co", anonKey: ANON, fetch: async () => new Response(JSON.stringify(replies[i++]), { status: 200 }) });
  assert.equal(await auth.userOf({ headers: { authorization: "Bearer tok-anon-1234567" } }), id);
  assert.equal(await auth.userOf({ headers: { authorization: "Bearer tok-linked-123456" } }), id, "cùng user id sau khi gắn Google");
});

test("Supabase: ẩn danh gửi điểm → gắn Google (cùng id) → token mới vẫn ghi được, hạng gộp chung, /api/account/me trả tên đã lưu", async () => {
  const fake = await fakeSupabase({ serviceKey: SECRET, anonKey: ANON, google: true });
  const api = createAccountApi({ env: { SUPABASE_URL: fake.base, SUPABASE_ANON_KEY: ANON, SUPABASE_SERVICE_ROLE_KEY: SECRET }, now: () => NOW, log: () => {} });
  const s = await apiServer(api);
  try {
    const uid = "44444444-4444-4444-8444-444444444444";
    fake.users["tok-anon-aaaaaaaa"] = uid;
    // trước khi có profile: name rỗng
    assert.deepEqual((await call(s.base, "GET", "/api/account/me", { token: "tok-anon-aaaaaaaa" })).json, { name: "" });
    const a = await call(s.base, "POST", `/api/daily/do-vui-nhanh/${DAY}`, { token: "tok-anon-aaaaaaaa", body: { name: "Heo Cute 15", proof: quizProof(DAY) } });
    assert.equal(a.status, 200); assert.equal(a.json.accepted, true);
    // gắn Google: cùng uid, user giờ không còn ẩn danh; máy khác đăng nhập nhận token MỚI cho cùng uid
    fake.linkGoogle(uid);
    fake.users["tok-linked-bbbbbbbb"] = uid;
    const who = await fetch(fake.base + "/auth/v1/user", { headers: { apikey: ANON, authorization: "Bearer tok-linked-bbbbbbbb" } }).then((r) => r.json());
    assert.equal(who.is_anonymous, false); assert.equal(who.id, uid);
    const b = await call(s.base, "POST", `/api/daily/sudoku/${DAY}`, { token: "tok-linked-bbbbbbbb", body: { name: "Heo Cute 15", proof: sudokuProof(DAY, { time: 200 }) } });
    assert.equal(b.status, 200, b.text); assert.equal(b.json.accepted, true);
    // gửi lại Đố Vui bằng token mới ⇒ không đè (cùng user id)
    const again = await call(s.base, "POST", `/api/daily/do-vui-nhanh/${DAY}`, { token: "tok-linked-bbbbbbbb", body: { name: "Heo Cute 15", proof: quizProof(DAY, [true, false, false, false, false]) } });
    assert.equal(again.json.accepted, false); assert.equal(again.json.me.short, "5/5");
    const me = await call(s.base, "GET", `/api/daily/me?day=${DAY}`, { token: "tok-linked-bbbbbbbb" });
    assert.deepEqual(Object.keys(me.json.ranks).sort(), ["do-vui-nhanh", "sudoku"]);
    assert.ok(fake.tables.daily_scores.every((r) => r.user_id === uid));
    // đổi tên trên máy mới ⇒ profile theo user id
    const rn = await call(s.base, "POST", "/api/daily/name", { token: "tok-linked-bbbbbbbb", body: { name: "Bé Na" } });
    assert.equal(rn.status, 200);
    const prof = await call(s.base, "GET", "/api/account/me", { token: "tok-anon-aaaaaaaa" });
    assert.deepEqual(prof.json, { name: "Bé Na" }, "token cũ (cùng uid) thấy cùng tên");
    assert.ok(!prof.text.includes("Nguyễn") && !prof.text.includes("gmail"), "không trả tên/email Google");
    // không danh tính / token sai ⇒ 401; sai method ⇒ 405; đường lạ ⇒ 404
    assert.equal((await call(s.base, "GET", "/api/account/me")).status, 401);
    assert.equal((await call(s.base, "GET", "/api/account/me", { token: "tok-wrong-zzzzzzzz" })).status, 401);
    assert.equal((await call(s.base, "POST", "/api/account/me", { token: "tok-linked-bbbbbbbb", body: {} })).status, 405);
    assert.equal((await call(s.base, "GET", "/api/account/other", { token: "tok-linked-bbbbbbbb" })).status, 404);
    // service key không lọt ra
    assert.ok(!JSON.stringify(fake.log.filter((r) => r.path.startsWith("/auth")).map((r) => r.headers)).includes(SECRET));
  } finally { await s.close(); await fake.close(); }
});

test("fake GoTrue: /settings theo cờ google, linkIdentity trả URL, Google đã gắn tài khoản khác ⇒ identity_already_exists", async () => {
  const fake = await fakeSupabase({ serviceKey: SECRET, anonKey: ANON, google: false });
  try {
    const st = (await fetch(fake.base + "/auth/v1/settings", { headers: { apikey: ANON } }).then((r) => r.json()));
    assert.equal(st.external.google, false);
    fake.opts.google = true;
    assert.equal((await fetch(fake.base + "/auth/v1/settings", { headers: { apikey: ANON } }).then((r) => r.json())).external.google, true);
    assert.equal((await fetch(fake.base + "/auth/v1/settings")).status, 401, "cần apikey");
    fake.users["tok-other-12345678"] = "55555555-5555-4555-8555-555555555555";
    fake.linkGoogle("66666666-6666-4666-8666-666666666666");
    const r = await fetch(fake.base + "/auth/v1/user/identities/authorize?provider=google&redirect_to=" + encodeURIComponent("http://app.test/homepage/") + "&skip_http_redirect=true",
      { headers: { apikey: ANON, authorization: "Bearer tok-other-12345678" } }).then((x) => x.json());
    const back = await fetch(r.url, { redirect: "manual" });
    const loc = new URL(back.headers.get("location"));
    assert.equal(loc.origin + loc.pathname, "http://app.test/homepage/");
    assert.equal(loc.searchParams.get("error_code"), "identity_already_exists");
  } finally { await fake.close(); }
});

test("chế độ RAM: /api/account/me cần x-dev-user, trả tên sau khi đổi tên; bảng tắt ⇒ 503", async () => {
  const api = createAccountApi({ env: {}, mode: "memory", now: () => NOW, log: () => {} });
  const s = await apiServer(api);
  try {
    assert.equal((await call(s.base, "GET", "/api/account/me")).status, 401);
    assert.deepEqual((await call(s.base, "GET", "/api/account/me", { user: "devuser01" })).json, { name: "" });
    await call(s.base, "POST", "/api/daily/name", { user: "devuser01", body: { name: "Mèo Mun" } });
    assert.deepEqual((await call(s.base, "GET", "/api/account/me", { user: "devuser01" })).json, { name: "Mèo Mun" });
  } finally { await s.close(); }
  const off = createAccountApi({ env: {}, mode: "off", log: () => {} });
  const s2 = await apiServer(off);
  try { assert.equal((await call(s2.base, "GET", "/api/account/me", { user: "devuser01" })).status, 503); } finally { await s2.close(); }
});
