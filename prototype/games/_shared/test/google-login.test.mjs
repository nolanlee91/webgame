// Đăng nhập Google (D6) phía trình duyệt — phần chạy được trong Node: dò Google bật chưa (/auth/v1/settings) + nhớ trong phiên,
// che email, nhận tên tự sinh, đọc/dọn tham số OAuth khi quay về, các trạng thái lỗi, đăng xuất ⇒ tên khách mới.
// Chạy: node --test prototype/games/_shared/test/google-login.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

let n = 0;
const fresh = () => import(`../account.js?t=${++n}`); // mỗi test một bản module (bộ nhớ đệm riêng)

function memStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), clear: () => m.clear(), _m: m };
}
const json = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
function installFetch(routes) {
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    for (const [re, fn] of routes) if (re.test(String(url))) return fn(String(url), init);
    throw new Error("no route " + url);
  };
  return calls;
}
const SUPA_CFG = { supabase: true, board: "supabase", supabaseUrl: "https://ref.supabase.co", supabaseAnonKey: "sb_publishable_X" };
test.beforeEach(() => { globalThis.sessionStorage = memStorage(); globalThis.localStorage = memStorage(); });

test("parseAuthSettings: chỉ true khi external.google === true", async () => {
  const A = await fresh();
  assert.equal(A.parseAuthSettings({ external: { google: true } }), true);
  for (const v of [null, undefined, {}, { external: {} }, { external: { google: false } }, { external: { google: "true" } }, { external: { google: 1 } }, "x"]) assert.equal(A.parseAuthSettings(v), false, JSON.stringify(v));
});

test("detectGoogle: gọi {url}/auth/v1/settings với apikey; HTTP lỗi / mạng lỗi ⇒ failed", async () => {
  const A = await fresh();
  let seen;
  const r1 = await A.detectGoogle({ url: "https://ref.supabase.co/", anonKey: "K", fetch: async (u, i) => { seen = { u, i }; return json({ external: { google: true } }); } });
  assert.deepEqual(r1, { on: true, failed: false });
  assert.equal(seen.u, "https://ref.supabase.co/auth/v1/settings");
  assert.equal(seen.i.headers.apikey, "K");
  assert.deepEqual(await A.detectGoogle({ url: "u", anonKey: "K", fetch: async () => json({ external: { google: false } }) }), { on: false, failed: false });
  assert.deepEqual(await A.detectGoogle({ url: "u", anonKey: "K", fetch: async () => json({}, 500) }), { on: false, failed: true });
  assert.deepEqual(await A.detectGoogle({ url: "u", anonKey: "K", fetch: async () => { throw new Error("net"); } }), { on: false, failed: true });
  assert.deepEqual(await A.detectGoogle({ url: "", anonKey: "K", fetch: async () => json({}) }), { on: false, failed: false });
});

test("googleEnabled: máy chủ không ở chế độ supabase ⇒ false, không hỏi Supabase", async () => {
  const A = await fresh();
  const calls = installFetch([[/\/api\/config/, () => json({ supabase: false, board: "memory" })]]);
  assert.equal(await A.googleEnabled(), false);
  assert.ok(!calls.some((c) => c.url.includes("/auth/v1/settings")));
});

test("googleEnabled: bật ⇒ true, hỏi settings đúng 1 lần, nhớ vào sessionStorage cho trang sau", async () => {
  let A = await fresh();
  let calls = installFetch([[/\/api\/config/, () => json(SUPA_CFG)], [/\/auth\/v1\/settings/, () => json({ external: { google: true } })]]);
  assert.equal(await A.googleEnabled(), true);
  assert.equal(await A.googleEnabled(), true);
  assert.equal(calls.filter((c) => c.url.includes("/auth/v1/settings")).length, 1);
  assert.equal(calls.find((c) => c.url.includes("/auth/v1/settings")).init.headers.apikey, "sb_publishable_X");
  // "trang sau" (module mới) trong cùng phiên: dùng sessionStorage, không hỏi lại
  A = await fresh();
  calls = installFetch([[/\/api\/config/, () => json(SUPA_CFG)], [/\/auth\/v1\/settings/, () => json({ external: { google: false } })]]);
  assert.equal(await A.googleEnabled(), true);
  assert.equal(calls.filter((c) => c.url.includes("/auth/v1/settings")).length, 0);
});

test("googleEnabled: tắt ⇒ false (nhớ); lỗi mạng ⇒ false nhưng KHÔNG nhớ, lần sau hỏi lại", async () => {
  let A = await fresh();
  installFetch([[/\/api\/config/, () => json(SUPA_CFG)], [/\/auth\/v1\/settings/, () => json({ external: { google: false } })]]);
  assert.equal(await A.googleEnabled(), false);
  assert.match(sessionStorage.getItem("wgp.google.v1"), /"on":false/);
  sessionStorage.clear();
  A = await fresh();
  let fail = true;
  const calls = installFetch([[/\/api\/config/, () => json(SUPA_CFG)], [/\/auth\/v1\/settings/, () => { if (fail) throw new Error("net"); return json({ external: { google: true } }); }]]);
  assert.equal(await A.googleEnabled(), false);
  assert.equal(sessionStorage.getItem("wgp.google.v1"), null);
  await new Promise((r) => setTimeout(r, 5));
  fail = false;
  assert.equal(await A.googleEnabled(), true);
  assert.equal(calls.filter((c) => c.url.includes("/auth/v1/settings")).length, 2);
});

test("googleEnabled: Supabase đổi project (url khác) ⇒ bỏ giá trị nhớ cũ", async () => {
  sessionStorage.setItem("wgp.google.v1", JSON.stringify({ url: "https://old.supabase.co", on: true }));
  const A = await fresh();
  installFetch([[/\/api\/config/, () => json(SUPA_CFG)], [/\/auth\/v1\/settings/, () => json({ external: { google: false } })]]);
  assert.equal(await A.googleEnabled(), false);
});

test("accountState: Google tắt ⇒ { google:false } (giao diện không hiện gì)", async () => {
  const A = await fresh();
  installFetch([[/\/api\/config/, () => json(SUPA_CFG)], [/\/auth\/v1\/settings/, () => json({ external: { google: false } })]]);
  assert.deepEqual(await A.accountState(), { google: false, linked: false, email: "" });
});

test("maskEmail, looksGenerated, googleOf (không đọc tên thật)", async () => {
  const A = await fresh();
  assert.equal(A.maskEmail("nguyenvana@gmail.com"), "ng•••@gmail.com");
  assert.equal(A.maskEmail("ab@x.vn"), "a•••@x.vn");
  assert.equal(A.maskEmail("a@x.vn"), "a•••@x.vn");
  assert.equal(A.maskEmail(""), ""); assert.equal(A.maskEmail("không-email"), "");
  assert.equal(A.looksGenerated("Heo Cute 15"), true);
  assert.equal(A.looksGenerated("Gấu Trúc Lầy 07"), true);
  assert.equal(A.looksGenerated("Bé Na"), false);
  assert.equal(A.looksGenerated("Heo Cute"), false);
  assert.equal(A.googleOf({ is_anonymous: true, identities: [] }), null);
  assert.equal(A.googleOf(null), null);
  const g = A.googleOf({ is_anonymous: false, email: "nguyenvana@gmail.com", identities: [{ provider: "google", identity_data: { full_name: "Nguyễn Văn A" } }] });
  assert.deepEqual(g, { email: "ng•••@gmail.com" });
  assert.ok(!JSON.stringify(g).includes("Nguyễn"));
});

test("readOAuthParams / cleanOAuthUrl: code ở query, lỗi ở query hoặc #hash; giữ tham số khác", async () => {
  const A = await fresh();
  const loc = (href) => { const u = new URL(href); return { href, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash }; };
  assert.equal(A.readOAuthParams(loc("https://lumkeo.com/homepage/")), null);
  assert.equal(A.readOAuthParams(loc("https://lumkeo.com/homepage/?game=sudoku#thu-thach")), null);
  assert.equal(A.readOAuthParams(loc("https://lumkeo.com/homepage/?code=abc")).code, "abc");
  const e1 = A.readOAuthParams(loc("https://lumkeo.com/homepage/?error=server_error&error_code=identity_already_exists&error_description=Identity+is+already+linked"));
  assert.equal(e1.errorCode, "identity_already_exists");
  const e2 = A.readOAuthParams(loc("https://lumkeo.com/homepage/#error=access_denied&error_description=denied"));
  assert.equal(e2.errorCode, "access_denied"); assert.equal(e2.hashHadOAuth, true);
  let replaced = null;
  const hist = { state: null, replaceState: (_s, _t, url) => { replaced = url; } };
  A.cleanOAuthUrl(loc("https://lumkeo.com/homepage/bang-xep-hang.html?game=2048&code=abc&state=s#thu-thach"), hist);
  assert.equal(replaced, "/homepage/bang-xep-hang.html?game=2048#thu-thach");
  A.cleanOAuthUrl(loc("https://lumkeo.com/homepage/#error=access_denied&error_description=x"), hist);
  assert.equal(replaced, "/homepage/");
  assert.equal(A.returnUrl(loc("https://lumkeo.com/homepage/?x=1#y")), "https://lumkeo.com/homepage/");
});

test("handleOAuthReturn: không có tham số ⇒ none (không gọi mạng); lỗi đã gắn / huỷ / lỗi khác ⇒ trạng thái + dọn URL", async () => {
  const A = await fresh();
  const calls = installFetch([]);
  const loc = (href) => { const u = new URL(href); return { href, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash }; };
  let replaced = null;
  const hist = { state: null, replaceState: (_s, _t, url) => { replaced = url; } };
  assert.deepEqual(await A.handleOAuthReturn(loc("https://lumkeo.com/homepage/"), hist), { status: "none" });
  assert.equal(calls.length, 0); assert.equal(replaced, null);
  sessionStorage.setItem("wgp.oauth.v1", JSON.stringify({ intent: "link", at: Date.now() }));
  const r1 = await A.handleOAuthReturn(loc("https://lumkeo.com/homepage/?error=server_error&error_code=identity_already_exists&error_description=Identity+is+already+linked+to+another+user"), hist);
  assert.equal(r1.status, "already-linked"); assert.equal(r1.intent, "link");
  assert.equal(replaced, "/homepage/");
  assert.equal(sessionStorage.getItem("wgp.oauth.v1"), null, "ý định dùng 1 lần");
  const r2 = await A.handleOAuthReturn(loc("https://lumkeo.com/homepage/?error=access_denied&error_description=x"), hist);
  assert.equal(r2.status, "cancelled"); assert.match(r2.error, /huỷ/);
  const r3 = await A.handleOAuthReturn(loc("https://lumkeo.com/homepage/?error=server_error&error_code=manual_linking_disabled"), hist);
  assert.equal(r3.status, "error"); assert.match(r3.error, /chưa bật/);
  assert.equal(calls.length, 0, "lỗi trong URL ⇒ không cần gọi mạng");
});

test("signOutAccount (chế độ RAM): đặt tên khách tự sinh MỚI, isGenerated() = true, báo onNameChange", async () => {
  const A = await fresh();
  installFetch([[/\/api\/config/, () => json({ supabase: false, board: "memory" })]]);
  A.setName("Bé Na");
  const seen = [];
  A.onNameChange((nm) => seen.push(nm));
  const nm = await A.signOutAccount();
  assert.notEqual(nm, "Bé Na");
  assert.equal(A.getName(), nm);
  assert.equal(A.isGenerated(), true);
  assert.equal(A.looksGenerated(nm), true);
  assert.deepEqual(seen, [nm]);
});
