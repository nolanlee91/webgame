// e2e đăng nhập Google (D6) KHÔNG cần Google thật: server.js trỏ SUPABASE_URL vào Supabase GIẢ (games-server/account/test/helpers.mjs)
// có /auth/v1/settings, linkIdentity, signInWithOAuth, /token?grant_type=pkce, /logout; "Google" giả tự chọn tài khoản rồi quay về.
// Trình duyệt tải supabase-js thật từ jsDelivr (cần mạng). Kiểm:
//   1. Google tắt (external.google=false) / settings lỗi ⇒ ô hồ sơ không có gì về Google.
//   2. Google bật ⇒ nút "Lưu tiến độ bằng Google"; bấm ⇒ linkIdentity với redirect_to = trang hiện tại (không query/hash).
//   3. Quay về (?code=) ⇒ URL sạch, "Đã lưu bằng Google · ng•••@gmail.com", cùng user id (điểm giữ), tên Google thật không lộ.
//   4. Đăng xuất (pxConfirm: Thôi giữ nguyên, Đăng xuất ⇒ tên khách mới, phiên Supabase bị xoá, /logout scope=local).
//   5. Máy mới: Google đã gắn tài khoản khác ⇒ "Đăng nhập bằng Google" ⇒ pxConfirm ⇒ vào tài khoản cũ, dùng tên trên máy chủ.
// Chạy: node prototype/games/_shared/test/google-login-e2e.mjs <thư-mục-ảnh>   (E2E_PORT mặc định 8993)
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { REPO, sleep, launchChrome } from "./cdp.mjs";
import { fakeSupabase } from "../../../../games-server/account/test/helpers.mjs";
import { shotDir, guardServer } from "./lk-temp.mjs";

const OUT = path.resolve(process.argv[2] || shotDir("google-login"));
mkdirSync(OUT, { recursive: true });
const PORT = Number(process.env.E2E_PORT) || 8993, BASE = `http://127.0.0.1:${PORT}`;
const ANON = "sb_publishable_E2E_GOOGLE", SECRET = "sb_secret_E2E_GOOGLE_MUST_NOT_LEAK";
const fake = await fakeSupabase({ serviceKey: SECRET, anonKey: ANON, google: false });
const env = { ...process.env, PORT: String(PORT), SUPABASE_URL: fake.base, SUPABASE_ANON_KEY: ANON, SUPABASE_SERVICE_ROLE_KEY: SECRET };
delete env.DAILY_BOARD;
const server = guardServer(spawn(process.execPath, ["server.js"], { cwd: REPO, env, stdio: "ignore" })); // tắt cùng test, kể cả khi bị giết cứng
let fails = 0;
const check = (n, c, d = "") => { if (!c) fails++; console.log((c ? "PASS " : "FAIL ") + n + (d !== "" ? " — " + d : "")); };
for (let i = 0; i < 120; i++) { try { if ((await fetch(BASE + "/healthz")).ok) break; } catch {} await sleep(250); }
const chrome = await launchChrome("google-login");
const finish = async (code) => { try { chrome.close(); } catch {} try { server.kill(); } catch {} await fake.close(); setTimeout(() => process.exit(code), 900); };
const shot = async (tab, name) => { const f = path.join(OUT, name); await tab.shot(f); console.log("  ảnh: " + f); };

async function nav(tab, url) {
  try { await tab.ev("window.__oldPage = 1"); } catch {}
  await tab.cmd("Page.navigate", { url: url.startsWith("http") ? url : BASE + url });
  await tab.waitFor(`!window.__oldPage && document.readyState === "complete" && window.__profile`, 30000);
}
async function openPop(tab) {
  await tab.ev(`window.__profile.ready`);
  if (await tab.ev(`document.getElementById("mePop").hidden`)) await tab.click("#meBtn");
  await tab.waitFor(`!document.getElementById("mePop").hidden`);
}
const settingsCalls = () => fake.log.filter((r) => r.method === "GET" && r.path === "/auth/v1/settings").length;
const acct = (tab) => tab.ev(`(() => { const b = document.getElementById("meAcct"); return b ? { hidden: b.hidden, state: b.dataset.state || "", text: b.textContent.replace(/\\s+/g, " ").trim() } : null; })()`);

try {
  // ---------- 1. Google tắt ----------
  const ctx1 = await chrome.newContext();
  const t1 = await chrome.newTab("off", 1366, 900, false, ctx1);
  await nav(t1, "/homepage/");
  check("chỉ xem trang chủ: chưa hỏi /auth/v1/settings", settingsCalls() === 0, String(settingsCalls()));
  await openPop(t1);
  for (let i = 0; i < 40 && settingsCalls() === 0; i++) await sleep(100);
  await sleep(400);
  let a = await acct(t1);
  check("Google tắt ⇒ mở hồ sơ: đã hỏi settings, khối Google ẩn, không có nút", settingsCalls() >= 1 && a && a.hidden && !(await t1.ev(`!!document.getElementById("meGoogleLink")`)), JSON.stringify(a));
  await shot(t1, "google-off-1366.png");
  fake.opts.settingsStatus = 500; fake.opts.google = true;
  const t1b = await chrome.newTab("err", 1366, 900, false, await chrome.newContext());
  await nav(t1b, "/homepage/");
  await openPop(t1b);
  await sleep(1200);
  a = await acct(t1b);
  check("settings lỗi 500 ⇒ vẫn ẩn (không đoán là bật)", a && a.hidden, JSON.stringify(a));
  await t1b.closeTab();
  fake.opts.settingsStatus = 200;

  // ---------- 2. Google bật: nút hiện, bấm ⇒ linkIdentity ----------
  const ctx2 = await chrome.newContext();
  const t2 = await chrome.newTab("on", 390, 844, true, ctx2);
  await nav(t2, "/homepage/?game=x#top");
  const nameBefore = await t2.ev(`document.getElementById("meName").textContent`);
  await openPop(t2);
  await t2.waitFor(`!!document.getElementById("meGoogleLink")`, 10000).catch(() => {});
  a = await acct(t2);
  check("Google bật ⇒ nút 'Lưu tiến độ bằng Google' hiện, trạng thái guest", a && !a.hidden && a.state === "guest" && /Lưu tiến độ bằng Google/.test(a.text), JSON.stringify(a));
  const btnBox = await t2.ev(`(() => { const r = document.getElementById("meGoogleLink").getBoundingClientRect(); return { h: r.height, w: r.width, bottom: r.bottom }; })()`);
  check("nút ≥ 44 px", btnBox.h >= 44, JSON.stringify(btnBox));
  await shot(t2, "google-on-guest-390.png");
  const signupsBefore = fake.log.filter((r) => r.method === "POST" && r.path === "/auth/v1/signup").length;
  await t2.ev(`window.__oldPage = 1`);
  await t2.click("#meGoogleLink", { touch: true });
  await t2.waitFor(`!window.__oldPage && document.readyState === "complete" && window.__profile`, 30000);
  const authz = fake.log.find((r) => r.method === "GET" && r.path === "/auth/v1/user/identities/authorize");
  const q = authz ? new URLSearchParams(authz.query) : null;
  check("bấm ⇒ linkIdentity: GET /user/identities/authorize?provider=google", !!authz && q.get("provider") === "google", authz ? authz.query.slice(0, 120) : "không có");
  check("redirect_to = trang hiện tại, bỏ query/hash", q && q.get("redirect_to") === BASE + "/homepage/", q && q.get("redirect_to"));
  check("PKCE: có code_challenge (s256)", q && !!q.get("code_challenge") && q.get("code_challenge_method") === "s256");
  const anonUid = authz && fake.users[/^Bearer (.+)$/.exec(authz.headers.authorization || "")?.[1]];
  check("linkIdentity mang token của người ẩn danh vừa tạo", !!anonUid && fake.log.filter((r) => r.method === "POST" && r.path === "/auth/v1/signup").length === signupsBefore + 1, String(anonUid));

  // ---------- 3. Quay về ----------
  await t2.ev(`window.__profile.ready`);
  await t2.waitFor(`document.getElementById("meAcct")?.dataset.state === "linked"`, 15000).catch(() => {});
  a = await acct(t2);
  const loc = await t2.ev(`location.pathname + location.search + location.hash`);
  check("URL đã dọn (không còn ?code=)", loc === "/homepage/", loc);
  check("popover tự mở: 'Đã lưu bằng Google · ng•••@gmail.com'", a && a.state === "linked" && a.text.includes("Đã lưu bằng Google · ng•••@gmail.com"), JSON.stringify(a));
  check("có thông báo xong + nút Đăng xuất", a && /Xong!/.test(a.text) && (await t2.ev(`!!document.getElementById("meSignOut")`)));
  const nameAfter = await t2.ev(`document.getElementById("meName").textContent`);
  const page = await t2.ev(`document.body.innerText`);
  check("tên hiển thị giữ nguyên, tên Google thật không xuất hiện ở đâu", nameAfter === nameBefore && !page.includes("Nguyễn Văn A") && !page.includes("nguyenvana@"), `${nameBefore} → ${nameAfter}`);
  const pkce = fake.log.filter((r) => r.method === "POST" && r.path === "/auth/v1/token" && /grant_type=pkce/.test(r.query));
  check("đổi code lấy phiên: POST /token?grant_type=pkce có code_verifier", pkce.length === 1 && !!pkce[0].body?.code_verifier);
  check("cùng user id sau khi gắn (điểm giữ) + Google gắn vào đúng id", fake.googleLinks["g-sub-1"] === anonUid);
  await sleep(500);
  const prof = fake.tables.profiles.find((p) => p.id === anonUid);
  check("tên hiện tại được lưu lên máy chủ (profiles) theo user id", prof && prof.name === nameBefore, JSON.stringify(prof));
  await shot(t2, "google-linked-390.png");
  // tải lại: vẫn đã lưu
  await nav(t2, "/homepage/");
  await openPop(t2);
  await t2.waitFor(`document.getElementById("meAcct")?.dataset.state === "linked"`, 10000).catch(() => {});
  a = await acct(t2);
  check("tải lại trang: vẫn 'Đã lưu bằng Google', không thông báo cũ", a && a.state === "linked" && !/Xong!/.test(a.text), JSON.stringify(a));
  const settingsBefore = settingsCalls();
  await nav(t2, "/homepage/bang-xep-hang.html");
  await openPop(t2);
  await t2.waitFor(`document.getElementById("meAcct")?.dataset.state === "linked"`, 10000).catch(() => {});
  check("trang Bảng xếp hạng cùng ô hồ sơ: linked; settings nhớ trong phiên (không hỏi lại)", (await acct(t2))?.state === "linked" && settingsCalls() === settingsBefore, `${settingsBefore} → ${settingsCalls()}`);

  // ---------- 4. Đăng xuất ----------
  await t2.click("#meSignOut", { touch: true });
  await t2.waitFor(`!!document.querySelector("dialog.pxc[open], .pxc.pxc--fb")`, 5000);
  check("Đăng xuất ⇒ hỏi lại bằng pxConfirm, popover vẫn mở", /Đăng xuất Google\?/.test(await t2.ev(`document.querySelector(".pxc").textContent`)) && !(await t2.ev(`document.getElementById("mePop").hidden`)));
  await shot(t2, "google-signout-confirm-390.png");
  await t2.click(`[data-pxc="cancel"]`, { touch: true });
  await sleep(300);
  check("bấm Thôi ⇒ vẫn đã lưu, không gọi /logout", (await acct(t2))?.state === "linked" && !fake.log.some((r) => r.path === "/auth/v1/logout"));
  await t2.click("#meSignOut", { touch: true });
  await t2.waitFor(`!!document.querySelector("dialog.pxc[open], .pxc.pxc--fb")`, 5000);
  await t2.click(`[data-pxc="ok"]`, { touch: true });
  await t2.waitFor(`document.getElementById("meAcct")?.dataset.state === "guest"`, 10000).catch(() => {});
  a = await acct(t2);
  const nameOut = await t2.ev(`document.getElementById("meName").textContent`);
  const logout = fake.log.find((r) => r.method === "POST" && r.path === "/auth/v1/logout");
  check("đăng xuất: /logout scope=local (máy khác không bị đăng xuất)", !!logout && /scope=local/.test(logout.query), logout && logout.query);
  check("đăng xuất: tên khách mới, khối Google về 'Lưu tiến độ', báo đã đăng xuất", nameOut !== nameBefore && a.state === "guest" && /Đã đăng xuất/.test(a.text), `${nameOut} | ${a.text}`);
  check("đăng xuất: phiên Supabase bị xoá khỏi localStorage", (await t2.ev(`Object.keys(localStorage).filter(k => /^sb-.*-auth-token$/.test(k)).length`)) === 0);
  check("tên mới là tên tự sinh", await t2.ev(`JSON.parse(localStorage.getItem("wgp.account.v1")).gen === true`));
  await shot(t2, "google-signed-out-390.png");

  // ---------- 5. Máy mới: Google đã gắn tài khoản khác ⇒ Đăng nhập ----------
  fake.tables.profiles.find((p) => p.id === anonUid).name = "Bé Na"; // tên tài khoản đã đổi ở máy cũ
  const t3 = await chrome.newTab("new", 1366, 900, false, await chrome.newContext());
  await nav(t3, "/homepage/");
  const guestName = await t3.ev(`document.getElementById("meName").textContent`);
  await openPop(t3);
  await t3.waitFor(`!!document.getElementById("meGoogleLink")`, 10000);
  await t3.ev(`window.__oldPage = 1`);
  await t3.click("#meGoogleLink");
  await t3.waitFor(`!window.__oldPage && document.readyState === "complete" && window.__profile`, 30000);
  await t3.ev(`window.__profile.ready`);
  await t3.waitFor(`document.getElementById("meAcct")?.dataset.state === "already"`, 10000).catch(() => {});
  a = await acct(t3);
  check("máy mới, Google đã gắn tài khoản khác ⇒ URL sạch + mời 'Đăng nhập bằng Google'", a && a.state === "already" && /Đăng nhập bằng Google/.test(a.text) && (await t3.ev(`location.search`)) === "", JSON.stringify(a));
  await shot(t3, "google-already-1366.png");
  await t3.click("#meGoogleIn");
  await t3.waitFor(`!!document.querySelector("dialog.pxc[open], .pxc.pxc--fb")`, 5000);
  const warn = await t3.ev(`document.querySelector(".pxc").textContent`);
  check("pxConfirm cảnh báo mất tiến độ khách (có tên khách hiện tại)", /sẽ mất/.test(warn) && warn.includes(guestName), warn.slice(0, 160));
  await shot(t3, "google-signin-confirm-1366.png");
  await t3.ev(`window.__oldPage = 1`);
  await t3.click(`[data-pxc="ok"]`);
  await t3.waitFor(`!window.__oldPage && document.readyState === "complete" && window.__profile`, 30000);
  await t3.ev(`window.__profile.ready`);
  await t3.waitFor(`document.getElementById("meAcct")?.dataset.state === "linked"`, 10000).catch(() => {});
  a = await acct(t3);
  const n3 = await t3.ev(`document.getElementById("meName").textContent`);
  const signinReq = fake.log.find((r) => r.method === "GET" && r.path === "/auth/v1/authorize");
  check("signInWithOAuth: /authorize?provider=google, redirect_to = trang hiện tại", !!signinReq && new URLSearchParams(signinReq.query).get("redirect_to") === BASE + "/homepage/");
  check("vào tài khoản cũ: 'Đã lưu bằng Google', tên = tên trên máy chủ 'Bé Na'", a && a.state === "linked" && n3 === "Bé Na" && /Bé Na/.test(a.text), `${n3} | ${a && a.text}`);
  check("tên từ máy chủ không bị đánh dấu là tên tự sinh", await t3.ev(`JSON.parse(localStorage.getItem("wgp.account.v1")).gen === false`));
  const sess = await t3.ev(`(() => { const k = Object.keys(localStorage).find(k => /^sb-.*-auth-token$/.test(k)); return k ? JSON.parse(localStorage.getItem(k)).user.id : ""; })()`);
  check("phiên trên máy mới = user id cũ (điểm + tên theo id)", sess === anonUid, sess);
  await shot(t3, "google-signed-in-1366.png");

  // ---------- an toàn ----------
  check("service key không bao giờ tới /auth (trình duyệt)", !fake.log.some((r) => r.path.startsWith("/auth") && JSON.stringify(r.headers).includes(SECRET)));
  for (const t of [t1, t2, t3]) check(`không lỗi JS / console error (${t.name})`, t.errors.length === 0, t.errors.join(" || "));
} catch (e) {
  console.log("FAIL ngoại lệ — " + (e && e.stack || e)); fails++;
}
console.log(fails ? `\n${fails} mục FAIL` : "\nTẤT CẢ ĐẠT");
await finish(fails ? 1 : 0);
