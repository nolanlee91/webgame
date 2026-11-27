// Số đếm lượt dùng (games-server/stats.js + stats-hook.js + đường /api/ev, /admin/stats trong server.js).
// Kiểm: danh sách sự kiện, game hợp lệ, giới hạn 60/phút/IP, gộp theo ngày giờ VN, gửi Supabase cộng dồn (lỗi ⇒ giữ lại),
// trang admin (404 khi thiếu biến, 401 sai mật khẩu, 200 + noindex khi đúng), /admin không rơi xuống file tĩnh, móc phòng online.
// `node --test --test-concurrency=1 games-server/stats.test.mjs`
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createStats, resolveStatsMode, vnDay, loadGameIds, safeEqual, EVENTS } = require("./stats.js");
const hook = require("./stats-hook.js");

const GAMES = new Set(["2048", "dao-vang", "ran-san-moi", "co-caro"]);
const T0 = Date.UTC(2026, 10, 26, 17, 30); // 00:30 ngày 27/11/2026 giờ VN

async function serve(handler) {
  const server = http.createServer((req, res) => { handler(req, res); });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(r); }) };
}
const post = (base, body, headers = {}) => fetch(base + "/api/ev", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body), headers });

test("vnDay: ngày giờ Việt Nam dạng YYYYMMDD", () => {
  assert.equal(vnDay(T0), 20261127);
  assert.equal(vnDay(Date.UTC(2026, 10, 26, 16, 59)), 20261126); // 23:59 VN
  assert.equal(vnDay(Date.UTC(2026, 11, 31, 17, 0)), 20270101);
});

test("resolveStatsMode: Supabase khi có URL + service key; STATS=off/memory ép chế độ", () => {
  assert.equal(resolveStatsMode({}), "memory");
  assert.equal(resolveStatsMode({ SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k" }), "supabase");
  assert.equal(resolveStatsMode({ SUPABASE_URL: "https://x.supabase.co" }), "memory");
  assert.equal(resolveStatsMode({ STATS: "off", SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k" }), "off");
  assert.equal(resolveStatsMode({ STATS: "memory", SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k" }), "memory");
});

test("loadGameIds: lấy id game từ games-meta.js (sinh từ homepage/games.js)", () => {
  const ids = loadGameIds();
  for (const id of ["2048", "dao-vang", "ran-san-moi", "do-vui", "co-caro", "ma-soi"]) assert.ok(ids.has(id), id);
  assert.ok(!ids.has("do-vui-nhanh")); // tên thư mục, không phải id
});

test("count: chỉ nhận sự kiện trong danh sách và game hợp lệ (hoặc rỗng)", () => {
  const s = createStats({ env: {}, games: GAMES, now: () => T0 });
  assert.equal(s.mode, "memory");
  assert.deepEqual(EVENTS, ["share_click", "challenge_click", "share_open", "challenge_open", "challenge_done", "room_create", "room_join_link", "room_join_lobby", "daily_submit", "donate_open"]);
  for (const e of EVENTS) assert.equal(s.count(e, "2048"), true, e);
  assert.equal(s.count("share_open", ""), true);
  assert.equal(s.count("page_view", "2048"), false);
  assert.equal(s.count("__proto__", ""), false);
  assert.equal(s.count("share_click", "khong-co"), false);
  assert.equal(s.count("share_click", "2048|x"), false);
  assert.equal(s.count("share_click", { a: 1 }), true); // g lạ kiểu ⇒ coi như rỗng
  const snap = s.snapshot();
  assert.equal(snap["20261127|share_click|2048"], 1);
  assert.equal(snap["20261127|share_open|"], 1);
  assert.equal(snap["20261127|share_click|"], 1);
  assert.ok(!Object.keys(snap).some((k) => k.includes("page_view") || k.includes("khong-co")));
});

test("count: STATS=off không đếm gì", () => {
  const s = createStats({ env: { STATS: "off" }, games: GAMES, now: () => T0 });
  assert.equal(s.count("share_click", "2048"), false);
  assert.deepEqual(s.snapshot(), {});
});

test("POST /api/ev: 204, sự kiện lạ / JSON hỏng / thân quá to bị bỏ qua, GET ⇒ 405", async () => {
  const s = createStats({ env: {}, games: GAMES, now: () => T0 });
  const srv = await serve((q, r) => s.handleEvent(q, r));
  try {
    let r = await post(srv.base, { e: "challenge_open", g: "dao-vang" }, { "Content-Type": "text/plain;charset=UTF-8" }); // sendBeacon gửi text/plain
    assert.equal(r.status, 204); assert.equal(await r.text(), "");
    r = await post(srv.base, { e: "bogus", g: "dao-vang" }); assert.equal(r.status, 204);
    r = await post(srv.base, "{not json"); assert.equal(r.status, 204);
    r = await post(srv.base, JSON.stringify({ e: "share_click", g: "2048", pad: "x".repeat(800) })); assert.equal(r.status, 204);
    r = await post(srv.base, [1, 2]); assert.equal(r.status, 204);
    r = await fetch(srv.base + "/api/ev"); assert.equal(r.status, 405);
    assert.deepEqual(s.snapshot(), { "20261127|challenge_open|dao-vang": 1 });
  } finally { await srv.close(); }
});

test("giới hạn tần suất theo IP (chỉ trong RAM): quá ngưỡng ⇒ 429, không đếm; sang phút sau đếm lại", async () => {
  let now = T0;
  const s = createStats({ env: {}, games: GAMES, now: () => now, perMin: 3 });
  const srv = await serve((q, r) => s.handleEvent(q, r));
  try {
    for (let i = 0; i < 3; i++) assert.equal((await post(srv.base, { e: "share_click", g: "2048" })).status, 204);
    assert.equal((await post(srv.base, { e: "share_click", g: "2048" })).status, 429);
    assert.equal(s.snapshot()["20261127|share_click|2048"], 3);
    now += 61_000;
    assert.equal((await post(srv.base, { e: "share_click", g: "2048" })).status, 204);
    assert.equal(s.snapshot()["20261127|share_click|2048"], 4);
  } finally { await srv.close(); }
});

test("gộp theo ngày giờ VN: qua nửa đêm VN sang dòng mới", () => {
  let now = Date.UTC(2026, 10, 27, 16, 59, 30); // 23:59:30 ngày 27/11 giờ VN
  const s = createStats({ env: {}, games: GAMES, now: () => now });
  s.count("room_create", "co-caro"); s.count("room_create", "co-caro");
  now += 60_000; // 00:00:30 ngày 28/11
  s.count("room_create", "co-caro");
  assert.deepEqual(s.snapshot(), { "20261127|room_create|co-caro": 2, "20261128|room_create|co-caro": 1 });
});

function fakeSupabase({ fail = 0, remote = [] } = {}) {
  const calls = [];
  let left = fail;
  const f = async (url, init = {}) => {
    calls.push({ url, init });
    if (url.includes("/rpc/stats_add")) {
      if (left > 0) { left--; return new Response("boom", { status: 500 }); }
      return new Response(null, { status: 204 });
    }
    if (url.includes("/rest/v1/stats_daily")) return Response.json(remote);
    return new Response("?", { status: 404 });
  };
  return { f, calls };
}
const SUPA_ENV = { SUPABASE_URL: "https://demo.supabase.co/", SUPABASE_SERVICE_ROLE_KEY: "sb_secret_test" };

test("Supabase: gom trong RAM, flush gửi RPC stats_add một lần (đã cộng dồn), lỗi ⇒ giữ lại gửi lần sau", async () => {
  const sb = fakeSupabase({ fail: 1 });
  const s = createStats({ env: SUPA_ENV, games: GAMES, now: () => T0, fetch: sb.f, timer: false, log: () => {} });
  assert.equal(s.mode, "supabase");
  s.count("share_click", "2048"); s.count("share_click", "2048"); s.count("challenge_open", "dao-vang");
  assert.equal(sb.calls.length, 0); // chưa gửi gì cho tới khi flush
  let r = await s.flush();
  assert.equal(r.ok, false);
  assert.equal(s.pendingSize, 2); // trả lại hàng đợi
  s.count("share_click", "2048");
  r = await s.flush();
  assert.equal(r.ok, true);
  assert.equal(s.pendingSize, 0);
  assert.equal(sb.calls.length, 2);
  const last = sb.calls[1];
  assert.equal(last.url, "https://demo.supabase.co/rest/v1/rpc/stats_add");
  assert.equal(last.init.method, "POST");
  assert.equal(last.init.headers.apikey, "sb_secret_test");
  assert.equal(last.init.headers.Authorization, undefined); // key sb_secret_ không gửi ở Authorization
  const rows = JSON.parse(last.init.body).p_rows.sort((a, b) => a.event.localeCompare(b.event));
  assert.deepEqual(rows, [
    { day: 20261127, event: "challenge_open", game: "dao-vang", n: 1 },
    { day: 20261127, event: "share_click", game: "2048", n: 3 },
  ]);
  for (const row of rows) assert.deepEqual(Object.keys(row).sort(), ["day", "event", "game", "n"]); // không có IP / id / tên
  await s.flush(); // không còn gì ⇒ không gọi thêm
  assert.equal(sb.calls.length, 2);
});

test("Supabase: key JWT kiểu cũ gửi thêm Authorization; rows() cộng số trên Supabase với số chưa gửi", async () => {
  const sb = fakeSupabase({ remote: [{ day: 20261127, event: "share_click", game: "2048", n: 10 }, { day: 20261101, event: "share_click", game: "2048", n: 99 }] });
  const s = createStats({ env: { ...SUPA_ENV, SUPABASE_SERVICE_ROLE_KEY: "eyJabc" }, games: GAMES, now: () => T0, fetch: sb.f, timer: false, log: () => {} });
  s.count("share_click", "2048");
  const rows = await s.rows(14);
  assert.equal(rows.error, "");
  const hit = rows.filter((r) => r.event === "share_click" && r.game === "2048");
  assert.deepEqual(hit, [{ day: 20261127, event: "share_click", game: "2048", n: 11 }]); // 01/11 ngoài 14 ngày ⇒ bỏ
  assert.match(sb.calls[0].url, /stats_daily\?select=day,event,game,n&day=gte\.20261114/);
  assert.equal(sb.calls[0].init.headers.Authorization, "Bearer eyJabc");
});

test("safeEqual: so mật khẩu", () => {
  assert.equal(safeEqual("abc", "abc"), true);
  assert.equal(safeEqual("abc", "abd"), false);
  assert.equal(safeEqual("", "abc"), false);
  assert.equal(safeEqual("abc".repeat(100), "abc"), false);
});

test("/admin/stats: 404 khi chưa đặt ADMIN_PASSWORD, 401 khi thiếu / sai mật khẩu, 200 + noindex khi đúng", async () => {
  const basic = (u, p) => ({ Authorization: "Basic " + Buffer.from(`${u}:${p}`).toString("base64") });
  {
    const s = createStats({ env: {}, games: GAMES, now: () => T0 });
    const srv = await serve((q, r) => s.handleAdmin(q, r));
    try {
      const r = await fetch(srv.base + "/admin/stats", { headers: basic("admin", "x") });
      assert.equal(r.status, 404);
    } finally { await srv.close(); }
  }
  const s = createStats({ env: { ADMIN_PASSWORD: "đúng-rồi 123" }, games: GAMES, now: () => T0, adminPerMin: 5 });
  s.count("challenge_click", "ran-san-moi"); s.count("challenge_open", "ran-san-moi"); s.count("challenge_open", "ran-san-moi");
  const srv = await serve((q, r) => s.handleAdmin(q, r));
  try {
    let r = await fetch(srv.base + "/admin/stats");
    assert.equal(r.status, 401);
    assert.match(r.headers.get("www-authenticate"), /^Basic realm=/);
    r = await fetch(srv.base + "/admin/stats", { headers: basic("admin", "sai") });
    assert.equal(r.status, 401);
    r = await fetch(srv.base + "/admin/stats", { headers: { Authorization: "Bearer abc" } });
    assert.equal(r.status, 401);
    r = await fetch(srv.base + "/admin/stats?days=30", { headers: basic("ai-cung-duoc", "đúng-rồi 123") });
    assert.equal(r.status, 200);
    assert.match(r.headers.get("x-robots-tag"), /noindex/);
    assert.equal(r.headers.get("cache-control"), "no-store");
    const html = await r.text();
    assert.match(html, /<meta name="robots" content="noindex,nofollow">/);
    assert.match(html, /ran-san-moi/);
    assert.match(html, /aria-current="page">30 ngày/);
    assert.match(html, /mở link thách \/ bấm Thách bạn = <b>200%<\/b>/);
    assert.ok(!/<script/i.test(html)); // HTML thuần, không thư viện ngoài
    // sai liên tục ⇒ 429
    for (let i = 0; i < 6; i++) r = await fetch(srv.base + "/admin/stats", { headers: basic("a", "sai" + i) });
    assert.equal(r.status, 429);
  } finally { await srv.close(); }
});

test("stats-hook: viaOf đọc cookie lk_via=sanh; roomEvent phân loại tạo / vào bằng link / vào từ sảnh, bỏ qua resume", () => {
  assert.equal(hook.viaOf({ headers: { cookie: "a=1; lk_via=sanh" } }), "sanh");
  assert.equal(hook.viaOf({ headers: { cookie: "lk_via=sanh2" } }), "");
  assert.equal(hook.viaOf({ headers: {} }), "");
  assert.equal(hook.viaOf(null), "");
  const got = [];
  hook.roomEvent("co-caro", "create", ""); // chưa gắn sink ⇒ không làm gì, không lỗi
  hook.setSink((e, g) => got.push(`${e}:${g}`));
  try {
    hook.roomEvent("co-caro", "create", "");
    hook.roomEvent("co-caro", "join", "");
    hook.roomEvent("co-caro", "join", "sanh");
    hook.roomEvent("co-caro", "resume", "sanh");
    assert.deepEqual(got, ["room_create:co-caro", "room_join_link:co-caro", "room_join_lobby:co-caro"]);
    hook.setSink(() => { throw new Error("hỏng"); });
    hook.roomEvent("co-caro", "create", ""); // sink lỗi không ném ra host
  } finally { hook.setSink(null); }
});

test("phòng online thật (Cờ Caro qua WebSocket): tạo phòng + vào bằng mã + vào từ sảnh (cookie) được đếm", async () => {
  const server = http.createServer((q, s) => s.end("x"));
  const host = require("./co-caro/host.js").createCoCaroHost(server, {});
  await host.ready;
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const got = [];
  hook.setSink((e, g) => got.push(`${e}:${g}`));
  const url = `ws://127.0.0.1:${server.address().port}/ws/co-caro`;
  const open = (opts) => new Promise((ok, bad) => {
    const ws = new WebSocket(url, opts), msgs = [];
    ws.onmessage = (e) => msgs.push(JSON.parse(e.data));
    ws.onopen = () => ok({ ws, msgs, send: (o) => ws.send(JSON.stringify(o)) }); ws.onerror = bad;
  });
  const wait = async (c, f) => { for (let i = 0; i < 100; i++) { const m = c.msgs.find(f); if (m) return m; await new Promise((r) => setTimeout(r, 20)); } throw new Error("hết giờ"); };
  try {
    const a = await open();
    a.send({ t: "create", name: "Chủ Phòng", public: true });
    const { code } = await wait(a, (m) => m.t === "joined");
    const b = await open();
    b.send({ t: "join", code, name: "Khách Một" });
    await wait(b, (m) => m.t === "joined" || m.t === "err");
    let lobbyOk = false;
    try { // WebSocket của Node (undici) cho gửi header Cookie — trình duyệt tự gửi cookie lk_via do trang chủ đặt
      const a2 = await open(); a2.send({ t: "create", name: "Chủ Hai", public: true });
      const { code: c2 } = await wait(a2, (m) => m.t === "joined");
      const c = await open({ headers: { Cookie: "lk_via=sanh" } });
      c.send({ t: "join", code: c2, name: "Khách Sảnh" });
      await wait(c, (m) => m.t === "joined" || m.t === "err");
      lobbyOk = true;
    } catch { /* bản Node không hỗ trợ header ⇒ chỉ kiểm phần trên */ }
    assert.ok(got.includes("room_create:co-caro"));
    assert.equal(got.filter((x) => x === "room_join_link:co-caro").length, 1);
    if (lobbyOk) assert.equal(got.filter((x) => x === "room_join_lobby:co-caro").length, 1);
  } finally {
    hook.setSink(null);
    host.close(); server.closeAllConnections?.(); await new Promise((r) => server.close(r));
  }
});

test("server.js: /api/ev đếm vào RAM, /admin/* luôn 404 khi chưa có ADMIN_PASSWORD, không rơi xuống file tĩnh", async () => {
  delete process.env.ADMIN_PASSWORD;
  const server = require("../server.js");
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal(server.stats.mode, "memory");
    const before = server.stats.snapshot();
    const r = await post(base, { e: "share_open", g: "ran-san-moi" });
    assert.equal(r.status, 204);
    const k = Object.keys(server.stats.snapshot()).find((x) => x.endsWith("|share_open|ran-san-moi"));
    assert.equal(server.stats.snapshot()[k], (before[k] || 0) + 1);
    for (const p of ["/admin", "/admin/", "/admin/stats", "/Admin/stats", "/admin/index.html", "/admin/../admin/stats", "/admin%2fstats"]) {
      const res = await fetch(base + p);
      assert.equal(res.status, 404, p);
    }
    assert.equal((await fetch(base + "/homepage/")).status, 200); // file tĩnh vẫn chạy
  } finally {
    server.stats.stop();
    server.closeAllConnections?.(); await new Promise((r) => server.close(r));
  }
});
