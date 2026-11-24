// API bảng xếp hạng (chế độ RAM + danh tính x-dev-user), chọn chế độ theo biến môi trường, lọc tên. `npm run test:account`
import { test } from "node:test";
import assert from "node:assert/strict";
import { createAccountApi, resolveMode, BODY_MAX } from "../index.mjs";
import { cleanName, isProfane, DEFAULT_NAME } from "../names.mjs";
import { memoryStore } from "../stores.mjs";
import { DAY, NOW, sudokuProof, moves2048, quizProof, apiServer } from "./helpers.mjs";

function setup(extra = {}) {
  let t = NOW;
  const clock = { now: () => t, advance: (ms) => { t += ms; } };
  const api = createAccountApi({ env: {}, mode: "memory", now: clock.now, log: () => {}, ...extra });
  return { api, clock };
}
async function req(base, method, path, { user, body, headers = {}, raw } = {}) {
  const h = { ...headers };
  if (user) h["x-dev-user"] = user;
  if (body !== undefined || raw !== undefined) h["content-type"] = "application/json";
  const res = await fetch(base + path, { method, headers: h, body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined) });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  return { status: res.status, json };
}

test("chọn chế độ: đủ 3 biến ⇒ supabase; máy dev ⇒ memory; Railway chưa cấu hình / cấu hình dở ⇒ off", () => {
  const full = { SUPABASE_URL: "https://abc.supabase.co", SUPABASE_ANON_KEY: "sb_publishable_x", SUPABASE_SERVICE_ROLE_KEY: "sb_secret_y" };
  assert.equal(resolveMode(full), "supabase");
  assert.equal(resolveMode({ ...full, RAILWAY_ENVIRONMENT: "production" }), "supabase");
  assert.equal(resolveMode({}), "memory");
  assert.equal(resolveMode({ RAILWAY_ENVIRONMENT: "production" }), "off");
  assert.equal(resolveMode({ NODE_ENV: "production" }), "off");
  assert.equal(resolveMode({ SUPABASE_URL: "https://abc.supabase.co", SUPABASE_ANON_KEY: "k" }), "off");
  assert.equal(resolveMode({ DAILY_BOARD: "off" }), "off");
  assert.equal(resolveMode({ RAILWAY_ENVIRONMENT: "x", DAILY_BOARD: "memory" }), "memory");
  assert.equal(resolveMode({ ...full, SUPABASE_URL: "not a url" }), "off");
});

test("/api/config chỉ trả giá trị công khai, không bao giờ có service key", async () => {
  const env = { SUPABASE_URL: "https://abc.supabase.co/", SUPABASE_ANON_KEY: "sb_publishable_PUBLIC", SUPABASE_SERVICE_ROLE_KEY: "sb_secret_TOPSECRET" };
  const api = createAccountApi({ env, log: () => {} });
  const s = await apiServer(api);
  const r = await req(s.base, "GET", "/api/config");
  assert.deepEqual(r.json, { supabase: true, board: "supabase", supabaseUrl: "https://abc.supabase.co", supabaseAnonKey: "sb_publishable_PUBLIC" });
  assert.ok(!JSON.stringify(r.json).includes("TOPSECRET"));
  await s.close();
  const off = createAccountApi({ env: { RAILWAY_ENVIRONMENT: "production" }, log: () => {} });
  const s2 = await apiServer(off);
  assert.deepEqual((await req(s2.base, "GET", "/api/config")).json, { supabase: false, board: false });
  const p = await req(s2.base, "POST", `/api/daily/2048/${DAY}`, { user: "useraaaa", body: { proof: { moves: "L" } } });
  assert.equal(p.status, 503);
  await s2.close();
  const mem = createAccountApi({ env: {}, log: () => {} });
  const s3 = await apiServer(mem);
  assert.deepEqual((await req(s3.base, "GET", "/api/config")).json, { supabase: false, board: "memory" });
  await s3.close();
});

test("gửi + bảng: thứ hạng đúng theo luật từng game, lần gửi đầu thắng, me ngoài top 10", async () => {
  const { api } = setup();
  const s = await apiServer(api);
  try {
    // Đố Vui: 12 người, đúng nhiều hơn trên, cùng số đúng thì nhanh hơn trên
    const players = [];
    for (let i = 0; i < 12; i++) {
      const oks = [true, true, true, true, true].map((_, k) => k < (i % 5) + 1);
      players.push({ user: `player${String(i).padStart(2, "0")}`, oks, ms: 2000 + (11 - i) * 100 }); // người số lớn nhanh hơn
    }
    for (const p of players) {
      const r = await req(s.base, "POST", `/api/daily/do-vui-nhanh/${DAY}`, { user: p.user, body: { name: "Bạn " + p.user.slice(-2), proof: quizProof(DAY, p.oks, p.ms) } });
      assert.equal(r.status, 200, JSON.stringify(r.json));
      assert.equal(r.json.accepted, true);
    }
    const b = await req(s.base, "GET", `/api/daily/do-vui-nhanh/${DAY}?limit=10`, { user: "player00" });
    assert.equal(b.status, 200);
    assert.equal(b.json.total, 12);
    assert.equal(b.json.top.length, 10);
    const corr = b.json.top.map((e) => Number(e.short.split("/")[0]));
    assert.deepEqual(corr, [...corr].sort((x, y) => y - x), "đúng nhiều hơn đứng trên");
    assert.equal(b.json.top[0].name, "Bạn 09"); // 5/5 và nhanh hơn player04
    assert.equal(b.json.top[1].name, "Bạn 04");
    assert.ok(b.json.top.every((e) => !("userId" in e) && !("user_id" in e)), "không lộ id người chơi");
    // player00 chỉ đúng 1 câu ⇒ ngoài top 10; me có hạng
    assert.ok(b.json.me && b.json.me.rank > 10, JSON.stringify(b.json.me));
    assert.equal(b.json.top.filter((e) => e.you).length, 0);
    // gửi lại (kết quả tốt hơn) ⇒ không đè, giữ lần đầu
    const again = await req(s.base, "POST", `/api/daily/do-vui-nhanh/${DAY}`, { user: "player00", body: { name: "Gian", proof: quizProof(DAY) } });
    assert.equal(again.status, 200);
    assert.equal(again.json.accepted, false);
    assert.equal(again.json.me.short, "1/5");
    assert.equal(again.json.total, 12);
    // người nằm trong top thấy dòng của mình được đánh dấu
    const top1 = await req(s.base, "GET", `/api/daily/do-vui-nhanh/${DAY}`, { user: "player09" });
    assert.equal(top1.json.top[0].you, true);
    assert.equal(top1.json.me.rank, 1);
    // không danh tính ⇒ vẫn xem được bảng, không có me
    const anon = await req(s.base, "GET", `/api/daily/do-vui-nhanh/${DAY}`);
    assert.equal(anon.status, 200); assert.equal(anon.json.me, undefined);
  } finally { await s.close(); }
});

test("hạng bằng nhau dùng chung (1, 1, 3), Sudoku nhanh hơn trên, 2048 điểm cao hơn trên", async () => {
  const { api } = setup();
  const s = await apiServer(api);
  try {
    for (const [u, t] of [["sudokuaa", 400], ["sudokubb", 300], ["sudokucc", 300]]) {
      const r = await req(s.base, "POST", `/api/daily/sudoku/${DAY}`, { user: u, body: { name: u, proof: sudokuProof(DAY, { time: t }) } });
      assert.equal(r.status, 200, JSON.stringify(r.json));
    }
    const b = await req(s.base, "GET", `/api/daily/sudoku/${DAY}`);
    assert.deepEqual(b.json.top.map((e) => [e.rank, e.name]), [[1, "sudokubb"], [1, "sudokucc"], [3, "sudokuaa"]]);
    const long = moves2048(DAY, 150), short = moves2048(DAY, 20);
    await req(s.base, "POST", `/api/daily/2048/${DAY}`, { user: "t2048aaa", body: { name: "Ngắn", proof: { moves: short } } });
    await req(s.base, "POST", `/api/daily/2048/${DAY}`, { user: "t2048bbb", body: { name: "Dài", proof: { moves: long } } });
    const t = await req(s.base, "GET", `/api/daily/2048/${DAY}`);
    assert.deepEqual(t.json.top.map((e) => e.name), ["Dài", "Ngắn"]);
    assert.ok(t.json.top[0].score > t.json.top[1].score);
    // /api/daily/me gom cả 3 game trong một request
    await req(s.base, "POST", `/api/daily/do-vui-nhanh/${DAY}`, { user: "sudokuaa", body: { name: "x", proof: quizProof(DAY) } });
    const me = await req(s.base, "GET", `/api/daily/me?day=${DAY}`, { user: "sudokuaa" });
    assert.deepEqual(me.json.ranks.sudoku, { rank: 3, total: 3, short: "6:40 ⭐" });
    assert.deepEqual(me.json.ranks["do-vui-nhanh"], { rank: 1, total: 1, short: "5/5" });
    assert.equal(me.json.ranks["2048"], undefined);
    assert.deepEqual((await req(s.base, "GET", `/api/daily/me?day=${DAY}`)).json.ranks, {});
  } finally { await s.close(); }
});

test("từ chối: không danh tính, bằng chứng sai / sửa điểm, sai ngày, body quá lớn, JSON hỏng, game lạ", async () => {
  const { api, clock } = setup();
  const s = await apiServer(api);
  try {
    const P = (path, o) => req(s.base, "POST", path, o);
    assert.equal((await P(`/api/daily/2048/${DAY}`, { body: { proof: { moves: moves2048(DAY, 5) } } })).status, 401);
    assert.equal((await P(`/api/daily/2048/${DAY}`, { user: "bad id!", body: { proof: { moves: moves2048(DAY, 5) } } })).status, 401);
    assert.equal((await P(`/api/daily/2048/${DAY}`, { headers: { authorization: "Bearer abcdefghijklmnop" }, body: { proof: { moves: moves2048(DAY, 5) } } })).status, 401, "chế độ RAM không nhận bearer");
    const tampered = await P(`/api/daily/2048/${DAY}`, { user: "cheater1", body: { proof: { moves: moves2048(DAY, 150) + "LLLL" } } });
    assert.equal(tampered.status, 400); assert.equal(tampered.json.error, "invalid");
    // điểm client gửi kèm bị bỏ qua — máy chủ tự tính
    const r = await P(`/api/daily/2048/${DAY}`, { user: "cheater2", body: { score: 1e9, proof: { moves: moves2048(DAY, 10), score: 1e9 } } });
    assert.equal(r.status, 200); assert.ok(r.json.me.score < 10000);
    const sd = await P(`/api/daily/sudoku/${DAY}`, { user: "cheater3", body: { proof: { ...sudokuProof(DAY), time: 3 } } });
    assert.equal(sd.status, 400); assert.equal(sd.json.detail, "thời gian quá ngắn");
    assert.equal((await P(`/api/daily/sudoku/${DAY - 1}`, { user: "late0001", body: { proof: sudokuProof(DAY - 1) } })).status, 409);
    assert.equal((await P(`/api/daily/sudoku/${DAY + 5}`, { user: "late0001", body: { proof: sudokuProof(DAY) } })).status, 400);
    assert.equal((await P(`/api/daily/xep-gach/${DAY}`, { user: "late0001", body: { proof: {} } })).status, 404);
    assert.equal((await P(`/api/daily/2048/${DAY}`, { user: "late0001", raw: "{not json" })).status, 400);
    const big = await P(`/api/daily/2048/${DAY}`, { user: "late0001", raw: JSON.stringify({ name: "x".repeat(BODY_MAX), proof: {} }) });
    assert.equal(big.status, 413);
    // qua 0h: kết quả hôm qua vẫn nhận trong 10 phút đầu
    clock.advance(19 * 3600 * 1000 + 5 * 60 * 1000); // 0h05 ngày DAY+1
    const late = await P(`/api/daily/do-vui-nhanh/${DAY}`, { user: "late0002", body: { proof: quizProof(DAY) } });
    assert.equal(late.status, 200, JSON.stringify(late.json));
    clock.advance(10 * 60 * 1000);
    assert.equal((await P(`/api/daily/do-vui-nhanh/${DAY}`, { user: "late0003", body: { proof: quizProof(DAY) } })).status, 409);
  } finally { await s.close(); }
});

test("giới hạn 20 POST / phút / IP", async () => {
  const { api, clock } = setup();
  const s = await apiServer(api);
  try {
    const codes = [];
    for (let i = 0; i < 22; i++) codes.push((await req(s.base, "POST", `/api/daily/2048/${DAY}`, { user: `rate${String(i).padStart(4, "0")}`, body: { proof: { moves: moves2048(DAY, 3) } } })).status);
    assert.deepEqual(codes.slice(0, 20), new Array(20).fill(200));
    assert.deepEqual(codes.slice(20), [429, 429]);
    clock.advance(61_000);
    assert.equal((await req(s.base, "POST", `/api/daily/2048/${DAY}`, { user: "rate9999", body: { proof: { moves: moves2048(DAY, 3) } } })).status, 200);
  } finally { await s.close(); }
});

test("bảng được nhớ 15 giây nhưng người vừa gửi thấy ngay mình trên bảng", async () => {
  const { api, clock } = setup();
  const s = await apiServer(api);
  try {
    await req(s.base, "POST", `/api/daily/do-vui-nhanh/${DAY}`, { user: "cacheaaa", body: { name: "Anh", proof: quizProof(DAY) } });
    assert.equal((await req(s.base, "GET", `/api/daily/do-vui-nhanh/${DAY}`)).json.total, 1);
    const r = await req(s.base, "POST", `/api/daily/do-vui-nhanh/${DAY}`, { user: "cachebbb", body: { name: "Bình", proof: quizProof(DAY, [true, true, true, true, true], 100) } });
    assert.equal(r.json.total, 2);
    assert.equal(r.json.top[0].name, "Bình");
    assert.equal(r.json.top[0].you, true);
    clock.advance(16_000);
    assert.equal((await req(s.base, "GET", `/api/daily/do-vui-nhanh/${DAY}`)).json.total, 2);
  } finally { await s.close(); }
});

test("tên: cắt khoảng trắng, gộp khoảng, bỏ ký tự điều khiển, 2–16 ký tự, lọc tục ⇒ 'Người chơi'", () => {
  assert.equal(cleanName("  Đức    Anh  "), "Đức Anh");
  assert.equal(cleanName("Mai\u0000​Linh\n"), "MaiLinh");
  assert.equal(cleanName("Tên\tcó\ttab"), "Tên có tab");
  assert.equal(cleanName("A"), DEFAULT_NAME);
  assert.equal(cleanName(""), DEFAULT_NAME);
  assert.equal(cleanName(null), DEFAULT_NAME);
  assert.equal(cleanName(12345), DEFAULT_NAME);
  assert.equal(cleanName("<script>alert(1)</script>"), "scriptalert1scri");
  assert.equal(cleanName("Nguyễn Thị Minh Khai Phường"), "Nguyễn Thị Minh");
  assert.equal(cleanName("😀😀"), DEFAULT_NAME);
  assert.equal(cleanName("___"), DEFAULT_NAME);
  for (const bad of ["địt mẹ", "DMM", "vcl", "con chó", "Fuck you", "f.u.c.k", "đm", "Óc Chó", "thằng l0zz", "dit con"]) {
    assert.equal(cleanName(bad), DEFAULT_NAME, bad);
  }
  for (const ok of ["Các Bạn", "Lớn Lên", "Bưởi Năm Roi", "Long", "Đức", "Cúc", "Đi Dạo"]) {
    assert.equal(isProfane(ok), false, ok);
  }
  assert.equal(cleanName("Lớn Lên"), "Lớn Lên");
});

test("memoryStore: lần đầu thắng, xếp theo điểm rồi thời điểm, countAbove, mineAll, dọn ngày cũ", async () => {
  let t = 1000;
  const st = memoryStore({ now: () => t });
  assert.deepEqual(await st.submit({ game: "2048", day: 5, userId: "a", name: "A", score: 10, result: {} }), { inserted: true });
  t++; await st.submit({ game: "2048", day: 5, userId: "b", name: "B", score: 30, result: {} });
  t++; await st.submit({ game: "2048", day: 5, userId: "c", name: "C", score: 10, result: {} });
  assert.deepEqual(await st.submit({ game: "2048", day: 5, userId: "a", name: "A2", score: 99, result: {} }), { inserted: false });
  const top = await st.top("2048", 5, 10);
  assert.deepEqual(top.rows.map((r) => r.name), ["B", "A", "C"]);
  assert.equal(top.total, 3);
  assert.equal(await st.countAbove("2048", 5, 10), 1);
  assert.equal((await st.mine("2048", 5, "a")).score, 10);
  assert.equal(await st.mine("2048", 5, "zz"), null);
  await st.submit({ game: "sudoku", day: 5, userId: "a", name: "A", score: -100, result: {} });
  assert.deepEqual((await st.mineAll(5, "a")).map((r) => r.game).sort(), ["2048", "sudoku"]);
  await st.submit({ game: "2048", day: 20, userId: "a", name: "A", score: 1, result: {} });
  assert.equal((await st.top("2048", 5, 10)).total, 0, "ngày cũ hơn 3 ngày đã bị dọn");
});
