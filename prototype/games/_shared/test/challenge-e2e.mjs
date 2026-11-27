// E2E "Thách cùng màn" + số đếm (Đợt 10) trên Chrome thật: mở link thách của Rắn / 2048 / Đào Vàng, chơi giả lập tới hết ván,
// thấy màn so điểm, kỷ lục không đổi, "Thách bạn" tạo đúng link, link hỏng ⇒ báo nhỏ + chơi thường, ?daily=1 không bị link thách
// ảnh hưởng, cỡ nút / chữ ở 320×568, 390×844, 844×390, 1366×768, và bộ đếm trong RAM của server.js tăng đúng.
//   node prototype/games/_shared/test/challenge-e2e.mjs [thư mục ảnh]     (cổng mặc định 8993, đổi bằng PORT=899x)
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { REPO, launchChrome, sleep } from "./cdp.mjs";

const OUT = process.argv[2] || join(tmpdir(), "lk-d10", "shots");
mkdirSync(OUT, { recursive: true });
delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SERVICE_ROLE_KEY; process.env.STATS = "memory";
process.env.ADMIN_PASSWORD = "e2e-mat-khau";
const require = createRequire(import.meta.url);
const server = require(join(REPO, "server.js"));
const PORT = Number(process.env.PORT) || 8993;
await new Promise((r, j) => { server.once("error", j); server.listen(PORT, "127.0.0.1", r); });
const BASE = `http://127.0.0.1:${PORT}`;

const R = [];
const check = (name, ok, detail = "") => { R.push(!!ok); console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail !== "" ? " — " + detail : ""}`); };
const count = (e, g) => Object.entries(server.stats.snapshot()).filter(([k]) => k.endsWith(`|${e}|${g}`)).reduce((a, [, n]) => a + n, 0);
const settle = () => sleep(400); // sendBeacon chạy nền

const NAME = "Heo Cute 15", NAME_Q = encodeURIComponent(NAME);
const chrome = await launchChrome("d10-challenge");
const errors = [];
try {
  // ───────── Rắn (390×844, chạm) ─────────
  {
    const t = await chrome.newTab("ran", 390, 844, true);
    await t.go(`${BASE}/games/ran-san-moi/`); // tạo kỷ lục cũ để kiểm ván thách không đè
    await t.ev(`localStorage.setItem("wgp.ransanmoi.v1", JSON.stringify({ best: { classic: 777, wrap: 0 }, longest: { classic: 9, wrap: 0 }, mode: "classic" }))`);
    const seed = 123456788; // chẵn ⇒ Cổ điển
    const o0 = count("challenge_open", "ran-san-moi"), d0 = count("challenge_done", "ran-san-moi");
    await t.go(`${BASE}/games/ran-san-moi/?thach=${seed}.1240.${NAME_Q}`);
    await t.waitFor(`!!document.getElementById("ovChal") && !document.getElementById("ovChal").hidden`);
    const intro = await t.ev(`document.querySelector("#ovChal .lk-chal").textContent`);
    check("Rắn: màn nhận thách hiện banner", /⚔ Thách đấu từ Heo Cute 15: 1\.240 điểm\./.test(intro) && /Cùng màn, chơi thử xem!/.test(intro), intro);
    check("Rắn: menu thường ẩn", await t.ev(`document.getElementById("ovMenu").hidden`));
    await t.shot(join(OUT, "ran-intro-390.png"));
    await t.click("#chalGo", { touch: true });
    await t.waitFor(`window.__game.state && window.__game.state.status === "play"`);
    check("Rắn: ván thách dùng đúng seed + chế độ trong link", await t.ev(`__game.runSeed === ${seed} && __game.state.mode === "classic"`));
    await t.ev(`__game.steps(400)`); // rắn chạy thẳng tới khi đụng tường
    await t.waitFor(`!document.getElementById("ovEnd").hidden`, 5000);
    const cmp = await t.ev(`document.querySelector("#ovEnd .lk-chal--cmp")?.textContent || ""`);
    check("Rắn: màn so điểm 'Bạn … – Heo Cute 15 1.240'", /^Bạn \d[\d.]*–Heo Cute 15 1\.240/.test(cmp) && /Thiếu|thắng|Hoà/.test(cmp), cmp);
    check("Rắn: nút Thách lại + Chơi màn mới", await t.ev(`document.getElementById("chalBtnE").textContent.includes("Thách lại") && document.getElementById("againBtn").textContent.includes("Chơi màn mới")`));
    check("Rắn: kỷ lục không đổi sau ván thách", await t.ev(`JSON.parse(localStorage.getItem("wgp.ransanmoi.v1")).best.classic === 777`));
    await t.shot(join(OUT, "ran-compare-390.png"));
    await settle();
    check("Rắn: đếm challenge_open + challenge_done", count("challenge_open", "ran-san-moi") === o0 + 1 && count("challenge_done", "ran-san-moi") === d0 + 1,
      `${count("challenge_open", "ran-san-moi")}/${count("challenge_done", "ran-san-moi")}`);
    // Chơi màn mới ⇒ ván thường, link sạch
    await t.click("#againBtn", { touch: true });
    await t.waitFor(`__game.state && __game.state.status === "play" && !__game.challenge`);
    check("Rắn: Chơi màn mới bỏ ?thach khỏi địa chỉ", await t.ev(`!location.search.includes("thach")`));
    t.errors.length && errors.push(...t.errors.map((e) => "ran: " + e));
    await t.closeTab();
  }

  // ───────── Rắn ván thường: "Thách bạn" tạo link đúng seed + điểm (1366×768, bảng chia sẻ) ─────────
  {
    const t = await chrome.newTab("ran-send", 1366, 768);
    await t.go(`${BASE}/games/ran-san-moi/`);
    const c0 = count("challenge_click", "ran-san-moi");
    await t.ev(`__game.start(); __game.steps(400)`);
    await t.waitFor(`!document.getElementById("ovEnd").hidden`, 5000);
    await t.ev(`window.__copied = ""; navigator.clipboard.writeText = (s) => { window.__copied = s; return Promise.resolve(); }`);
    await t.click("#chalBtnE");
    await t.waitFor(`!!document.querySelector(".lk-share")`);
    check("Thách bạn: bảng chia sẻ tiêu đề 'Thách bạn', không có ảnh", await t.ev(`document.getElementById("lk-share-title").textContent === "Thách bạn" && !document.querySelector(".lk-share__img")`));
    await t.click('.lk-share [data-act="copy"]');
    await t.waitFor(`!!window.__copied`);
    const copied = await t.ev(`window.__copied`), want = await t.ev(`"?thach=" + __game.lastRun.seed + "." + __game.lastRun.score`);
    check("Thách bạn: link https://lumkeo.com/games/ran-san-moi/?thach=<seed>.<điểm>.<tên>", copied.includes("https://lumkeo.com/games/ran-san-moi/" + want + ".") && /bạn vượt nổi không\?/.test(copied), copied);
    check("Thách bạn: seed ván thường mang chế độ ở bit thấp", await t.ev(`__game.lastRun.seed % 2 === (__game.lastRun.mode === "wrap" ? 1 : 0)`));
    await settle();
    check("Thách bạn: đếm challenge_click", count("challenge_click", "ran-san-moi") === c0 + 1);
    await t.shot(join(OUT, "ran-share-panel-1366.png"));
    t.errors.length && errors.push(...t.errors.map((e) => "ran-send: " + e));
    await t.closeTab();
  }

  // ───────── 2048 (390×844): ván thách 3×3 tới hết nước ─────────
  {
    const t = await chrome.newTab("2048", 390, 844, true);
    const seed = 3000000001, size = [3, 4, 5][seed % 3]; // cỡ bàn = SIZES[seed % 3]
    await t.go(`${BASE}/games/2048/?thach=${seed}.150.${NAME_Q}`);
    await t.waitFor(`!!document.getElementById("ovChal") && !document.getElementById("ovChal").hidden`);
    // bản lưu thường đặt SAU khi trang thách đã mở (trang thường ghi bản lưu lúc pagehide): ván thách không được ghi đè
    await t.ev(`localStorage.setItem("wgp.2048.v1", JSON.stringify({ size: 4, best: { 3: 5, 4: 99999, 5: 0 }, top: { 3: 8, 4: 2048, 5: 0 }, games: {} }))`);
    check("2048: màn nhận thách ghi đúng cỡ bàn", (await t.ev(`document.querySelector("#ovChal .sub").textContent`)).includes(`${size}×${size}`));
    await t.click("#chalGo", { touch: true });
    await t.waitFor(`__game.state && __game.state.size === ${size} && __game.state.seed0 === ${seed}`);
    const ok = await t.ev(`(async () => { const d = ["left","up","right","down"]; for (let i = 0; i < 4000 && __game.state.status === "playing"; i++) { if (!__game.move(d[i % 4])) for (const x of d) if (__game.move(x)) break; await new Promise(r => setTimeout(r, 0)); } return __game.state.status; })()`);
    await t.waitFor(`!document.querySelector("#ovEnd").hidden`, 8000);
    const cmp = await t.ev(`document.querySelector("#ovEnd .lk-chal--cmp")?.textContent || ""`);
    check("2048: chơi tới hết nước, thấy màn so điểm", ok === "over" && /^Bạn \d[\d.]*–Heo Cute 15 150/.test(cmp), cmp);
    check("2048: kỷ lục + ván lưu không đổi", await t.ev(`(() => { const v = JSON.parse(localStorage.getItem("wgp.2048.v1")); return v.best[3] === 5 && v.best[5] === 0 && v.top[3] === 8 && !Object.keys(v.games).length; })()`));
    await t.shot(join(OUT, "2048-compare-390.png"));
    // Thử thách hôm nay không bị link thách đụng tới
    await t.go(`${BASE}/games/2048/?daily=1&thach=${seed}.150`);
    await t.waitFor(`!!__game.daily`);
    check("2048: ?daily=1 + ?thach ⇒ vẫn là Thử thách hôm nay, không có màn thách", await t.ev(`!document.getElementById("ovChal") && !__game.challenge && document.body.classList.contains("is-daily")`));
    // link hỏng
    await t.go(`${BASE}/games/2048/?thach=abc.12`);
    await t.waitFor(`!!document.querySelector(".lk-chal-toast")`, 5000);
    check("2048: link hỏng ⇒ 'Link thách không hợp lệ' + menu thường", (await t.ev(`document.querySelector(".lk-chal-toast").textContent`)) === "Link thách không hợp lệ"
      && await t.ev(`!document.getElementById("ovMenu").hidden && !location.search.includes("thach")`));
    t.errors.length && errors.push(...t.errors.map((e) => "2048: " + e));
    await t.closeTab();
  }

  // ───────── Đào Vàng (1366×768): hết giờ ⇒ so điểm ─────────
  {
    const t = await chrome.newTab("dv", 1366, 768);
    await t.go(`${BASE}/games/dao-vang/`);
    await t.ev(`localStorage.setItem("wgp.daovang.v1", JSON.stringify({ best: 4321, level: 3 }))`);
    const seed = 2718281828, d0 = count("challenge_done", "dao-vang");
    await t.go(`${BASE}/games/dao-vang/?thach=${seed}.900.${NAME_Q}`);
    await t.waitFor(`!!document.querySelector("#menu .lk-chal")`);
    check("Đào Vàng: menu thành màn nhận thách", (await t.ev(`document.querySelector("#menu h2").textContent`)) === "Thách đấu!"
      && /Heo Cute 15: 900 điểm/.test(await t.ev(`document.querySelector("#menu .lk-chal").textContent`)));
    await t.shot(join(OUT, "dv-intro-1366.png"));
    await t.click("#play1");
    await t.waitFor(`window.__game && __game.state && __game.state.status === "playing"`);
    check("Đào Vàng: ván thách dùng đúng seed màn 1", await t.ev(`__game.runSeed === ${seed} && __game.state.seed === ${seed}`));
    await t.ev(`__game.state.time = 0.02`);
    await t.waitFor(`!!document.querySelector(".dv-card .lk-chal--cmp")`, 5000);
    const cmp = await t.ev(`document.querySelector(".dv-card .lk-chal--cmp").textContent`);
    check("Đào Vàng: so điểm 'Bạn 0 – Heo Cute 15 900' + Thách lại", /^Bạn 0–Heo Cute 15 900/.test(cmp) && await t.ev(`document.getElementById("chalBtn").textContent.includes("Thách lại")`), cmp);
    check("Đào Vàng: kỷ lục không đổi", await t.ev(`JSON.parse(localStorage.getItem("wgp.daovang.v1")).best === 4321`));
    await t.shot(join(OUT, "dv-compare-1366.png"));
    await settle();
    check("Đào Vàng: đếm challenge_done", count("challenge_done", "dao-vang") === d0 + 1);
    await t.click(".dv-go");
    await t.waitFor(`__game.state.status === "playing" && !__game.challenge`);
    check("Đào Vàng: Chơi màn mới ⇒ ván thường, seed khác", await t.ev(`__game.runSeed !== ${seed} && !location.search.includes("thach")`));
    t.errors.length && errors.push(...t.errors.map((e) => "dv: " + e));
    await t.closeTab();
  }

  // ───────── Cỡ nút / chữ ở 4 khung ─────────
  const VIEWS = [[320, 568, true], [390, 844, true], [844, 390, true], [1366, 768, false]];
  const GAMES = [["ran-san-moi", "#ovChal", "#chalGo"], ["2048", "#ovChal", "#chalGo"], ["dao-vang", "#menu", "#play1"]];
  for (const [w, h, mobile] of VIEWS) {
    const t = await chrome.newTab(`v${w}`, w, h, mobile);
    for (const [g, box, go] of GAMES) {
      await t.go(`${BASE}/games/${g}/?thach=${g === "2048" ? 4 : 10}.1240.${NAME_Q}`);
      await t.waitFor(`!!document.querySelector("${box} .lk-chal")`);
      const m = await t.ev(`(() => {
        const bs = [...document.querySelectorAll("${box} button")].filter((b) => b.offsetParent);
        const small = bs.filter((b) => b.getBoundingClientRect().height < 44).map((b) => b.id || b.textContent);
        const fonts = [...document.querySelectorAll("${box} .lk-chal, ${box} .lk-chal *")].map((e) => parseFloat(getComputedStyle(e).fontSize));
        const goEl = document.querySelector("${go}"); goEl.scrollIntoView({ block: "nearest" });
        const r = goEl.getBoundingClientRect(), top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { small, minFont: Math.min(...fonts), goVisible: r.bottom <= innerHeight + 1 && r.top >= 0 && (top === goEl || goEl.contains(top)),
          hscroll: document.documentElement.scrollWidth > innerWidth + 1 };
      })()`);
      check(`${g} ${w}×${h}: nút ≥ 44 px, chữ ≥ 12 px, nút bắt đầu bấm được, không tràn ngang`, !m.small.length && m.minFont >= 12 && m.goVisible && !m.hscroll, JSON.stringify(m));
      await t.shot(join(OUT, `${g}-intro-${w}x${h}.png`));
    }
    t.errors.length && errors.push(...t.errors.map((e) => `v${w}: ` + e));
    await t.closeTab();
  }

  // ───────── share_open + trang admin ─────────
  {
    const t = await chrome.newTab("open", 390, 844, true);
    const s0 = count("share_open", "xep-gach");
    await t.go(`${BASE}/games/xep-gach/?ref=share&g=xep-gach`);
    await settle();
    check("share_open: mở link khoe được đếm", count("share_open", "xep-gach") === s0 + 1);
    await t.closeTab();
    const bad = await fetch(`${BASE}/admin/stats`, { headers: { Authorization: "Basic " + Buffer.from("a:sai").toString("base64") } });
    const good = await fetch(`${BASE}/admin/stats`, { headers: { Authorization: "Basic " + Buffer.from("a:e2e-mat-khau").toString("base64") } });
    const html = await good.text();
    check("admin: sai mật khẩu 401, đúng 200 + thấy số đếm", bad.status === 401 && good.status === 200 && html.includes("ran-san-moi") && html.includes("challenge_done"));
  }
} catch (e) {
  check("không lỗi bất ngờ", false, e.stack || e.message);
} finally {
  chrome.close();
  server.stats.stop();
  server.closeAllConnections?.(); server.close();
}
check("không có lỗi JS trong trang", !errors.length, errors.join(" | "));
const fail = R.filter((x) => !x).length;
console.log(`\n${R.length - fail}/${R.length} PASS — ảnh: ${OUT}`);
if (!process.argv[2] && process.env.KEEP_SHOTS !== "1") try { rmSync(OUT, { recursive: true, force: true }); } catch {}
process.exit(fail ? 1 : 0);
