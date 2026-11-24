// E2E "bot qua giao diện": mỗi vụ có file trong data/cases được giải trọn bằng BẤM THẬT (chuột / chạm), bước kế tiếp lấy từ core/solver.js nextAction.
// Kiểm: đi hết vụ ra 3★, không lỗi console, nút bấm không bị che; chụp ảnh từng địa điểm + bài đăng + bảng suy luận + vạch mặt + kết vụ để soi bố cục.
// Chạy: PORT=8871 node server.js  rồi  PORT=8871 node prototype/games/tham-tu-hem/test/e2e-bot.mjs <thư mục ảnh> [id vụ…] (mặc định: mọi vụ có file)
// VIEW=mob ⇒ 390×844 dpr 3 (chạm). Mặc định 1366×768 dpr 1,25.
import { readdirSync } from "node:fs";
import { launch, sleep } from "./cdp.mjs";
import { CASES } from "../data/cases/index.js";

const OUT = process.argv[2] || ".", PORT = process.env.PORT || 8871, ORIGIN = `http://127.0.0.1:${PORT}`;
const have = new Set(readdirSync(new URL("../data/cases/", import.meta.url)).map((f) => f.replace(/\.js$/, "")));
const ids = process.argv.slice(3).length ? process.argv.slice(3) : CASES.map((c) => c.id).filter((id) => have.has(id));
const mob = process.env.VIEW === "mob", V = mob ? "m" : "d";
const b = await launch(OUT, Number(process.env.CDP_PORT) || 9671);
await b.view(mob ? 390 : 1366, mob ? 844 : 768, mob, mob ? 3 : 1.25);
if (mob) await b.touch(true);
let fails = 0;
const check = (n, c, d = "") => { console.log((c ? "PASS " : "FAIL ") + n + (d ? " — " + d : "")); if (!c) fails++; };
const at = (sel) => b.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.closest('[hidden]')||e.disabled)return null;e.scrollIntoView({block:'nearest',inline:'center'});const r=e.getBoundingClientRect();return r.width?[r.x+r.width/2,r.y+r.height/2]:null})()`);
async function press(sel, wait = 40) {
  let p = null;
  for (let i = 0; i < wait && !(p = await at(sel)); i++) await sleep(80);
  if (!p) { await b.shot(`${OUT}/LOI-bot.png`); throw new Error("không thấy " + sel + " :: " + JSON.stringify(await b.ev("({sc:__game.screen,ov:__game.overlay,dlg:__game.dialogOpen})"))); }
  const hit = await b.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});const h=document.elementFromPoint(${p[0]},${p[1]});return !!h&&(h===e||e.contains(h))})()`);
  if (!hit) check("không bị che: " + sel, false);
  if (mob) await b.tap(...p); else await b.click(...p);
  await sleep(80);
}
const waitFor = async (expr, ms = 5000) => { for (let t = 0; t < ms; t += 80) { if (await b.ev(expr).catch(() => false)) return true; await sleep(80); } return false; };
async function talk(ms = 2500) { if (!(await waitFor("__game.dialogOpen", ms))) return; for (let n = 0; n < 400 && (await b.ev("__game.dialogOpen")); n++) await press(".dlg-box"); }
const esc = async () => { for (const type of ["keyDown", "keyUp"]) await b.send("Input.dispatchKeyEvent", { type, key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await sleep(80); };
const overlay = () => b.ev("__game.overlay");
async function closeOv() { for (let i = 0; i < 5 && (await overlay()); i++) await esc(); }

for (const id of ids) {
  const idx = CASES.findIndex((c) => c.id === id);
  await b.send("Page.navigate", { url: "about:blank" }); await sleep(200);
  await b.send("Storage.clearDataForOrigin", { origin: ORIGIN, storageTypes: "local_storage" });
  await b.nav(`${ORIGIN}/games/tham-tu-hem/?fast=1`);
  // mở khoá: coi như đã phá các vụ trước
  await b.ev(`(()=>{const solved={};${JSON.stringify(CASES.slice(0, idx).map((c) => c.id))}.forEach(i=>solved[i]={stars:3,rep:100,times:1,last:3});localStorage.setItem('wgp.tham-tu-hem.v1',JSON.stringify({v:1,name:'Bot',rep:100*${idx},solved,runs:{}}))})()`);
  await b.nav(`${ORIGIN}/games/tham-tu-hem/?fast=1`);
  const next = () => b.ev(`import("./core/solver.js?v=t1").then(m=>JSON.stringify(m.nextAction(__game.caseData,__game.state)))`).then(JSON.parse);
  try {
    await press("#startBtn"); await press(`[data-case="${id}"]`);
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
      if (a.type === "examine") { await closeOv(); await press(`[data-hs="${a.id}"]`); await talk(); continue; }
      if (a.type === "ask") { const t = `.talk-body[data-pid="${a.pid}"] [data-topic="${a.topic}"]`; if ((await overlay()) !== "talk" || !(await at(t))) { await closeOv(); await press(`[data-person="${a.pid}"]`); } await press(t); await talk(); continue; }
      if (a.type === "contradict") { await closeOv(); await press("#btnNotebook"); await press('[data-tab="stmts"]'); await press(`[data-stmt="${a.stmt}"] .stmt-pick`); await press("#contraBtn"); await press(`[data-pick="${a.clue}"]`); await press("#pickGo"); await talk(4000); await closeOv(); continue; }
      if (a.type === "fill") { if ((await overlay()) !== "board") { await closeOv(); await press("#btnBoard"); } await press(`.slot[data-ded="${a.ded}"][data-blank="${a.blank}"]`); await press(`.chip[data-word="${a.word}"]`); continue; }
      if (a.type === "commit") { await b.shot(`${OUT}/${id}-${V}-bang.png`); await press("#commitBtn"); await sleep(900); await talk(); continue; }
      if (a.type === "accuse") { if (await at("#accuseBtn2")) await press("#accuseBtn2"); else { await closeOv(); await press("#accuseBtn"); } await talk(4000); await b.shot(`${OUT}/${id}-${V}-vach-mat.png`); continue; }
      if (a.type === "rebut") { await press("#rebutBtn"); await press(`[data-pick="${a.clue}"]`); await press("#pickGo"); await talk(4000); continue; }
      if (a.type === "bonus") { await waitFor("__game.screen==='result'"); await press(`[data-bonus="${a.id}"][data-choice="${a.choice}"]`); await talk(); continue; }
    }
    await sleep(600); await b.shot(`${OUT}/${id}-${V}-ket-vu.png`);
    check(`${id}: giải trọn qua giao diện ra 3★`, await b.ev("!!__game.state&&__game.state.phase==='done'&&__game.state.result.stars===3"), JSON.stringify(await b.ev("__game.state&&{ph:__game.state.phase,r:__game.state.result}")));
  } catch (e) { check(`${id}: kịch bản`, false, e.message); }
}
const errs = b.errors.filter((e) => !/data\/cases\/[\w-]+\.js\?v=t1/.test(e));
check("0 lỗi console", !errs.length, errs.slice(0, 5).join(" | "));
b.close();
console.log(fails ? `${fails} FAIL` : "E2E-BOT ĐẠT");
process.exit(fails ? 1 : 0);
