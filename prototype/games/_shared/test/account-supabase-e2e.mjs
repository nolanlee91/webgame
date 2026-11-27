// e2e chế độ Supabase: server.js chạy với SUPABASE_URL trỏ vào một Supabase GIẢ (games-server/account/test/helpers.mjs),
// trình duyệt tải supabase-js thật từ jsDelivr, đăng nhập ẩn danh, chơi Đố Vui daily, máy chủ xác minh token với /auth/v1/user
// rồi ghi điểm bằng service key. Kiểm: điểm vào bảng, service key không tới trình duyệt, trang chủ hiện hạng. Cần mạng (jsDelivr).
// Chạy: node prototype/games/_shared/test/account-supabase-e2e.mjs <thư-mục-ảnh>
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { REPO, sleep, launchChrome } from "./cdp.mjs";
import { fakeSupabase } from "../../../../games-server/account/test/helpers.mjs";
import { shotDir, guardServer } from "./lk-temp.mjs";

const OUT = path.resolve(process.argv[2] || shotDir("account-supabase"));
mkdirSync(OUT, { recursive: true });
const PORT = Number(process.env.E2E_PORT) || 8898, BASE = `http://127.0.0.1:${PORT}`;
const ANON = "sb_publishable_E2E_PUBLIC", SECRET = "sb_secret_E2E_MUST_NOT_LEAK";
const fake = await fakeSupabase({ serviceKey: SECRET, anonKey: ANON });
const env = { ...process.env, PORT: String(PORT), SUPABASE_URL: fake.base, SUPABASE_ANON_KEY: ANON, SUPABASE_SERVICE_ROLE_KEY: SECRET };
delete env.DAILY_BOARD;
const server = guardServer(spawn(process.execPath, ["server.js"], { cwd: REPO, env, stdio: "ignore" })); // tắt cùng test, kể cả khi bị giết cứng
let fails = 0;
const check = (n, c, d = "") => { if (!c) fails++; console.log((c ? "PASS " : "FAIL ") + n + (d !== "" ? " — " + d : "")); };
for (let i = 0; i < 120; i++) { try { if ((await fetch(BASE + "/healthz")).ok) break; } catch {} await sleep(250); }
const chrome = await launchChrome("account-supabase");
const finish = async (code) => { try { chrome.close(); } catch {} try { server.kill(); } catch {} await fake.close(); setTimeout(() => process.exit(code), 900); };

async function nav(tab, url) {
  try { await tab.ev("window.__oldPage = 1"); } catch {}
  await tab.cmd("Page.navigate", { url: BASE + url });
  await tab.waitFor(`!window.__oldPage && document.readyState === "complete"`, 30000);
}

try {
  const cfg = await (await fetch(BASE + "/api/config")).json();
  check("/api/config: supabase + anon key, KHÔNG có service key", cfg.supabase === true && cfg.supabaseAnonKey === ANON && !JSON.stringify(cfg).includes(SECRET), JSON.stringify(cfg));
  const tab = await chrome.newTab("S", 390, 844, true, await chrome.newContext());
  await tab.cmd("Network.enable");
  const bodies = [];
  tab.ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.method === "Network.responseReceived" && /\/api\//.test(m.params.response.url)) bodies.push(m.params.requestId); });
  // D3 bỏ bước hỏi tên (gửi thẳng bằng getName()) ⇒ đặt sẵn tên chung trước khi chơi
  await nav(tab, "/homepage/");
  await tab.ev(`localStorage.setItem("wgp.account.v1", JSON.stringify({ v: 1, name: "Supa Test", gen: false, asked: true, devId: "", sent: {} }))`);
  await nav(tab, "/games/do-vui-nhanh/?daily=1");
  await tab.waitFor(`window.__game && __game.state && __game.state.phase === "ask"`);
  for (let k = 0; k < 5; k++) {
    await tab.waitFor(`__game.state.i === ${k} && __game.state.phase === "ask" && !document.querySelector(".ans").disabled`);
    const pick = await tab.ev(`__game.state.qs[__game.state.i].correct`);
    await tab.click(`.ans[data-i="${pick}"]`, { touch: true });
    await tab.waitFor(`!document.getElementById("nextBtn").hidden`);
    await tab.click("#nextBtn", { touch: true });
  }
  await tab.waitFor(`["board", "error"].includes(document.getElementById("dlyLb")?.dataset.state)`, 30000);
  const st = await tab.ev(`document.getElementById("dlyLb").dataset.state`);
  const rows = await tab.ev(`JSON.stringify([...document.querySelectorAll("#dlyLbList .dly-lb__row")].map(li => li.textContent))`);
  check("chơi xong ⇒ đăng nhập ẩn danh + gửi điểm ⇒ bảng có mình #1", st === "board" && JSON.parse(rows).length === 1 && /#1Supa Test5\/5/.test(JSON.parse(rows)[0]), rows);
  const signup = fake.log.filter((r) => r.path === "/auth/v1/signup" && r.method === "POST");
  check("supabase-js gọi /auth/v1/signup đúng 1 lần bằng anon key", signup.length === 1 && signup[0].headers.apikey === ANON, String(signup.length));
  const row = fake.tables.daily_scores[0];
  const uid = Object.values(fake.users)[0];
  check("điểm ghi vào daily_scores với user_id = id ẩn danh, score do máy chủ tính", fake.tables.daily_scores.length === 1 && row.user_id === uid && row.name === "Supa Test" && row.score > 400000, JSON.stringify(row));
  check("profiles.name được upsert", fake.tables.profiles.length === 1 && fake.tables.profiles[0].name === "Supa Test");
  const sess = await tab.ev(`Object.keys(localStorage).filter(k => /^sb-.*-auth-token$/.test(k)).length`);
  check("phiên Supabase giữ trong localStorage (persistSession)", sess === 1, String(sess));
  // không response nào của máy mình chứa service key
  let leak = false;
  for (const id of bodies) { const r = await tab.cmd("Network.getResponseBody", { requestId: id }); if ((r.result?.body || "").includes(SECRET)) leak = true; }
  check("không response /api/* nào chứa service key", !leak && bodies.length > 0, bodies.length + " response");
  check("trình duyệt chưa bao giờ gửi service key / gọi thẳng REST", !fake.log.some((r) => JSON.stringify(r.headers).includes(SECRET) && r.path.startsWith("/auth")) && !fake.log.some((r) => r.path.startsWith("/rest") && r.headers.apikey !== SECRET));
  await tab.shot(path.join(OUT, "supabase-do-vui-390.png")); console.log("  ảnh: " + path.join(OUT, "supabase-do-vui-390.png"));
  // trang chủ: hạng #1/1 bằng phiên có sẵn (không tạo người dùng mới)
  await nav(tab, "/homepage/");
  // D3 bỏ 3 thẻ Thử thách lớn ⇒ hạng hôm nay hiện trong ô hồ sơ (#meRanks, chỉ hỏi khi mở popover)
  await tab.ev(`window.__profile.ready`);
  await tab.click("#meBtn", { touch: true });
  await tab.waitFor(`!document.getElementById("meRanks")?.hidden`, 30000).catch(() => {});
  const rank = await tab.ev(`document.getElementById("meRanks")?.textContent || ""`);
  check("trang chủ: ô hồ sơ 'Đố Vui #1/1', không đăng ký thêm người dùng", rank.includes("Đố Vui #1/1") && fake.log.filter((r) => r.path === "/auth/v1/signup" && r.method === "POST").length === 1, rank);
  check("không có lỗi JS / console error", tab.errors.length === 0, tab.errors.join(" || "));
} catch (e) {
  console.log("FAIL ngoại lệ — " + (e && e.stack || e)); fails++;
}
console.log(fails ? `\n${fails} mục FAIL` : "\nTẤT CẢ ĐẠT");
await finish(fails ? 1 : 0);
