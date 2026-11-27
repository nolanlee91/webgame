// E2E "bot qua giao diện": mỗi vụ có file trong data/cases được giải trọn bằng BẤM THẬT (chuột / chạm), bước kế tiếp lấy từ core/solver.js nextAction.
// Kiểm: đi hết vụ ra 3★, không lỗi console, nút bấm không bị che; chụp ảnh từng địa điểm + bài đăng + bảng suy luận + vạch mặt + kết vụ để soi bố cục.
// Chạy: PORT=8871 node server.js  rồi  PORT=8871 node prototype/games/tham-tu-hem/test/e2e-bot.mjs <thư mục ảnh> [id vụ…] (mặc định: mọi vụ có file, cả mùa 2; vụ chưa có file ⇒ SKIP)
// FASTREAD=1 ⇒ ở đoạn thoại đầu tiên bấm nút "Đọc nhanh" (D12) rồi đi tiếp; cuối mỗi vụ in "TAPS <vụ>: N" (mọi lần bấm/chạm của bot, kể cả nút Đọc nhanh).
// VIEW=mob ⇒ 390×844 dpr 3 (chạm). VIEW=land ⇒ 844×390 dpr 2 (chạm, điện thoại xoay ngang — D5). Mặc định 1366×768 dpr 1,25.
import { readdirSync } from "node:fs";
import { launch, sleep } from "./cdp.mjs";
import { CASES } from "../data/cases/index.js";
import { shotDir } from "../../_shared/test/lk-temp.mjs";

const OUT = process.argv[2] || shotDir("tham-tu-bot"), PORT = process.env.PORT || 8871, ORIGIN = `http://127.0.0.1:${PORT}`;
const have = new Set(readdirSync(new URL("../data/cases/", import.meta.url)).map((f) => f.replace(/\.js$/, "")));
// mọi vụ trong danh mục (cả mùa 2) có file thì chạy; vụ chưa có file thì bỏ qua (báo SKIP)
const want = process.argv.slice(3).length ? process.argv.slice(3) : CASES.map((c) => c.id);
for (const id of want.filter((id) => !have.has(id))) console.log("SKIP " + id + " — chưa có data/cases/" + id + ".js");
const ids = want.filter((id) => have.has(id));
const land = process.env.VIEW === "land", mob = process.env.VIEW === "mob" || land, V = land ? "l" : mob ? "m" : "d";
const b = await launch(OUT, Number(process.env.CDP_PORT) || 9671);
await b.view(land ? 844 : mob ? 390 : 1366, land ? 390 : mob ? 844 : 768, mob, land ? 2 : mob ? 3 : 1.25);
if (mob) await b.touch(true);
let fails = 0, taps = 0, fastOn = false;
const FAST = process.env.FASTREAD === "1";
const check = (n, c, d = "") => { console.log((c ? "PASS " : "FAIL ") + n + (d ? " — " + d : "")); if (!c) fails++; };
// điểm bấm: tâm phần tử, nếu tâm bị điểm soi nhỏ hơn nằm đè thì dò lưới tìm chỗ lộ ra (như người chơi bấm vào phần còn thấy)
const at = (sel) => b.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.closest('[hidden]')||e.disabled)return null;e.scrollIntoView({block:'nearest',inline:'center'});const r=e.getBoundingClientRect();if(!r.width)return null;
  const ok=(x,y)=>{const h=document.elementFromPoint(x,y);return !!h&&(h===e||e.contains(h))};const c=[r.x+r.width/2,r.y+r.height/2];if(ok(...c))return c;
  for(let fy=.1;fy<.95;fy+=.1)for(let fx=.06;fx<.97;fx+=.06){const x=r.x+r.width*fx,y=r.y+r.height*fy;if(x>=0&&y>=0&&x<innerWidth&&y<innerHeight&&ok(x,y))return [x,y]}return c})()`);
async function press(sel, wait = 40) {
  let p = null;
  for (let i = 0; i < wait && !(p = await at(sel)); i++) await sleep(80);
  if (!p) { await b.shot(`${OUT}/LOI-bot.png`); throw new Error("không thấy " + sel + " :: " + JSON.stringify(await b.ev("({sc:__game.screen,ov:__game.overlay,dlg:__game.dialogOpen})"))); }
  const hit = await b.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});const h=document.elementFromPoint(${p[0]},${p[1]});return !!h&&(h===e||e.contains(h))})()`);
  if (!hit) check("không bị che: " + sel, false);
  if (mob) await b.tap(...p); else await b.click(...p);
  taps++;
  await sleep(80);
}
const waitFor = async (expr, ms = 5000) => { for (let t = 0; t < ms; t += 80) { if (await b.ev(expr).catch(() => false)) return true; await sleep(80); } return false; };
async function talk(ms = 2500) { if (!(await waitFor("__game.dialogOpen", ms))) return;
  if (FAST && !fastOn) { await press("#fastReadBtn"); fastOn = true; check("Đọc nhanh bật (aria-pressed, cả đoạn trong khung)", await b.ev(`document.querySelector('#fastReadBtn').getAttribute('aria-pressed')==='true'&&localStorage.getItem('tth.fastread')==='1'&&(document.querySelector('.dlg-box.fastread')!==null||document.querySelector('.dlg-box.is-card')!==null)`)); }
  for (let n = 0; n < 400 && (await b.ev("__game.dialogOpen")); n++) await press(".dlg-box"); }
const esc = async () => { for (const type of ["keyDown", "keyUp"]) await b.send("Input.dispatchKeyEvent", { type, key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await sleep(80); };
const overlay = () => b.ev("__game.overlay");
async function closeOv() { for (let i = 0; i < 5 && (await overlay()); i++) await esc(); }

for (const id of ids) {
  const idx = CASES.findIndex((c) => c.id === id);
  taps = 0; fastOn = false;
  await b.send("Page.navigate", { url: "about:blank" }); await sleep(200);
  await b.send("Storage.clearDataForOrigin", { origin: ORIGIN, storageTypes: "local_storage" });
  await b.nav(`${ORIGIN}/games/tham-tu-hem/?fast=1`);
  // mở khoá: coi như đã phá các vụ trước
  await b.ev("__game.store.wipe()"); // khoá ghi để pagehide không đè bản lưu tiêm vào
  await b.ev(`(()=>{const solved={};${JSON.stringify(CASES.slice(0, idx).map((c) => c.id))}.forEach(i=>solved[i]={stars:3,rep:100,times:1,last:3});localStorage.setItem('wgp.tham-tu-hem.v1',JSON.stringify({v:1,name:'Bot',rep:100*${idx},solved,runs:{},flags:{s2intro:1}}))})()`);
  await b.nav(`${ORIGIN}/games/tham-tu-hem/?fast=1`);
  const next = () => b.ev(`import("./core/solver.js?v=t10").then(m=>JSON.stringify(m.nextAction(__game.caseData,__game.state)))`).then(JSON.parse);
  try {
    await press("#startBtn");
    const season = CASES[idx]?.season || 1;
    check(`${id}: bản đồ tự chọn tab mùa ${season}`, (await waitFor(`__game.season===${season}&&!!document.querySelector('.season-tab.on[data-season="${season}"]')`)));
    await press(`[data-case="${id}"]`);
    await waitFor("__game.screen==='office'");
    const shotLoc = new Set();
    for (let step = 0; step < 1200; step++) {
      if (await b.ev("__game.dialogOpen")) { await talk(); continue; }
      const sc = await b.ev("__game.screen");
      if (sc === "scene") {
        const l = await b.ev("__game.state.loc");
        if (!shotLoc.has(l)) { shotLoc.add(l); await closeOv(); await b.ev("document.querySelector('#soiBtn:not(.is-on)')?.click()"); await sleep(250); await b.shot(`${OUT}/${id}-${V}-canh-${l}.png`); }
      }
      const a = await next();
      if (!a) break;
      if (a.type === "intro") { await talk(); if (await waitFor("!!document.querySelector('#acceptPhone')", 2500)) { await b.shot(`${OUT}/${id}-${V}-bai-dang.png`); await press("#acceptPhone"); } else await press("#acceptCase"); await talk(); continue; }
      if (a.type === "go") { await closeOv(); await press(`[data-loc="${a.loc}"]`); await talk(); continue; }
      if (a.type === "examine") { await closeOv(); await press(`[data-hs="${a.id}"]`); await talk(); if ((await b.ev(`__game.state.seen.includes(__game.state.loc+".${a.id}")`)) === false) throw new Error("bấm không tới điểm soi " + a.id); continue; }
      if (a.type === "ask") { const t = `.talk-body[data-pid="${a.pid}"] [data-topic="${a.topic}"]`; if ((await overlay()) !== "talk" || !(await at(t))) { await closeOv(); await press(`[data-person="${a.pid}"]`); } await press(t); await talk(); continue; }
      if (a.type === "contradict") { await closeOv(); await press("#btnNotebook"); await press('[data-tab="stmts"]'); await press(`[data-stmt="${a.stmt}"] .stmt-pick`); await press("#contraBtn"); await press(`[data-pick="${a.clue}"]`); await press("#pickGo"); await talk(4000); await closeOv(); continue; }
      if (a.type === "fill") { if ((await overlay()) !== "board") { await closeOv(); await press("#btnBoard"); } await press(`.slot[data-ded="${a.ded}"][data-blank="${a.blank}"]`); await press(`.chip[data-word="${a.word}"]`); continue; }
      if (a.type === "commit") { await b.shot(`${OUT}/${id}-${V}-bang.png`); await press("#commitBtn"); await sleep(900); await talk(); continue; }
      if (a.type === "accuse") { if (await at("#accuseBtn2")) await press("#accuseBtn2"); else { await closeOv(); await press("#accuseBtn"); } await talk(4000); await b.shot(`${OUT}/${id}-${V}-vach-mat.png`); continue; }
      if (a.type === "rebut") { await press("#rebutBtn"); await press(`[data-pick="${a.clue}"]`); await press("#pickGo"); await talk(4000); continue; }
      if (a.type === "bonus") { await waitFor("__game.screen==='result'"); await press(`[data-bonus="${a.id}"][data-choice="${a.choice}"]`); await talk(); continue; }
    }
    await sleep(600); await b.shot(`${OUT}/${id}-${V}-ket-vu.png`);
    console.log(`TAPS ${id}: ${taps}${FAST ? " (Đọc nhanh)" : ""}`);
    check(`${id}: giải trọn qua giao diện ra 3★`, await b.ev("!!__game.state&&__game.state.phase==='done'&&__game.state.result.stars===3"), JSON.stringify(await b.ev("__game.state&&{ph:__game.state.phase,r:__game.state.result}")));
  } catch (e) { check(`${id}: kịch bản`, false, e.message); }
}
// TTH2-08 (D11): Chrome headless báo net::ERR_CACHE_OPERATION_NOT_SUPPORTED cho yêu cầu Range (206) của file .mp3 khi đọc từ cache —
// lỗi của bộ nhớ đệm trình duyệt test, tiếng vẫn phát; trên máy người chơi không có. Chỉ bỏ qua đúng lỗi này với file mp3.
const benign = (e) => /net::ERR_CACHE_OPERATION_NOT_SUPPORTED/.test(e) && /\.mp3(\?|\s|$)/.test(e);
const errs = b.errors.filter((e) => !/data\/cases\/[\w-]+\.js\?v=t\d+/.test(e) && !benign(e));
check("0 lỗi console", !errs.length, errs.slice(0, 5).join(" | "));
b.close();
console.log(fails ? `${fails} FAIL` : "E2E-BOT ĐẠT");
process.exit(fails ? 1 : 0);
