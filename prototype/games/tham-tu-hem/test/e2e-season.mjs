// E2E mùa 2: tab mùa trên bản đồ, khoá mùa 2, màn chuyển Chợ Hẻm lần đầu, thẻ "Sắp ra mắt" cho vụ chưa có file — bấm / chạm thật.
// Chạy: PORT=8871 node server.js  rồi  PORT=8871 node prototype/games/tham-tu-hem/test/e2e-season.mjs <thư mục ảnh>
// Hai cỡ: desktop 1366×768 dpr 1,25 và điện thoại 390×844 dpr 3 (chạm). Mỗi màn: elementFromPoint 5 điểm cho nút / tab / thẻ vụ / chấm bản đồ, không tràn ngang, ảnh chụp.
import { readdirSync } from "node:fs";
import { launch, sleep } from "./cdp.mjs";
import { CASES } from "../data/cases/index.js";

const OUT = process.argv[2] || ".", PORT = process.env.PORT || 8871, ORIGIN = `http://127.0.0.1:${PORT}`;
const URL0 = `${ORIGIN}/games/tham-tu-hem/?fast=1`;
const have = new Set(readdirSync(new URL("../data/cases/", import.meta.url)).map((f) => f.replace(/\.js$/, "")));
const S1 = CASES.filter((c) => !c.season || c.season === 1), S2 = CASES.filter((c) => c.season === 2);
const b = await launch(OUT, Number(process.env.CDP_PORT) || 9771);
let fails = 0, mob = false;
const check = (n, c, d = "") => { console.log((c ? "PASS " : "FAIL ") + n + (d ? " — " + d : "")); if (!c) fails++; };
const at = (sel) => b.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.closest('[hidden]'))return null;e.scrollIntoView({block:'nearest',inline:'nearest'});const r=e.getBoundingClientRect();return r.width?[r.x+r.width/2,r.y+r.height/2]:null})()`);
async function press(sel, wait = 40) {
  let p = null;
  for (let i = 0; i < wait && !(p = await at(sel)); i++) await sleep(80);
  if (!p) { await b.shot(`${OUT}/LOI-season.png`).catch(() => {}); throw new Error("không thấy " + sel + " :: " + JSON.stringify(await b.ev("({sc:__game.screen,dlg:__game.dialogOpen})"))); }
  if (mob) await b.tap(...p); else await b.click(...p);
  await sleep(100);
}
const waitFor = async (expr, ms = 5000) => { for (let t = 0; t < ms; t += 80) { if (await b.ev(expr).catch(() => false)) return true; await sleep(80); } return false; };
async function talk(ms = 3000) { if (!(await waitFor("__game.dialogOpen", ms))) return 0; let n = 0; for (; n < 60 && (await b.ev("__game.dialogOpen")); n++) await press(".dlg-box"); return n; }
const noOverflowX = () => b.ev("document.documentElement.scrollWidth<=document.documentElement.clientWidth&&document.body.scrollWidth<=innerWidth");
/** Mỗi phần tử khớp sel và đang nằm trong khung nhìn: 5 điểm (giữa + 4 góc trong) phải trúng chính nó. Phần tử ngoài khung thì cuộn tới rồi đo. */
async function notCovered(sels) {
  return b.ev(`(async()=>{const bad=[];for(const sel of ${JSON.stringify(sels)}){for(const e of document.querySelectorAll(sel)){if(e.closest('[hidden]')||!e.getBoundingClientRect().width)continue;
    e.scrollIntoView({block:'nearest',inline:'nearest'});await new Promise(r=>requestAnimationFrame(r));const r=e.getBoundingClientRect();
    for(const[fx,fy]of [[.5,.5],[.2,.25],[.8,.25],[.2,.75],[.8,.75]]){const x=r.left+r.width*fx,y=r.top+r.height*fy;const h=document.elementFromPoint(x,y);if(!h||!(h===e||e.contains(h))){bad.push(sel+(e.dataset.case||e.dataset.season||'')+'@'+Math.round(x)+','+Math.round(y)+' ⇐ '+(h?h.className||h.tagName:'null'));break;}}}}
    document.querySelector('#screen').scrollTop=0;return bad})()`);
}
async function screen(tag, name, sels) {
  await sleep(200);
  await b.ev("document.querySelector('#screen').scrollTop=0");
  await b.shot(`${OUT}/${tag}-${name}.png`);
  const bad = await notCovered(sels);
  check(`${tag} ${name}: không bị che`, !bad.length, bad.slice(0, 4).join(" | "));
  check(`${tag} ${name}: không tràn ngang`, await noOverflowX());
  // ảnh cả trang (điện thoại) chụp SAU khi đo: captureBeyondViewport đổi cỡ khung ⇒ game vẽ lại sau 150 ms
  if (mob) { await b.shot(`${OUT}/${tag}-${name}-full.png`, true).catch(() => {}); await sleep(300); }
}
async function inject(profile) {
  await b.send("Page.navigate", { url: "about:blank" }); await sleep(200);
  await b.send("Storage.clearDataForOrigin", { origin: ORIGIN, storageTypes: "local_storage" });
  await b.nav(URL0);
  await b.ev("__game.store.wipe()");
  if (profile) await b.ev(`localStorage.setItem('wgp.tham-tu-hem.v1',${JSON.stringify(JSON.stringify(profile))})`);
  await b.nav(URL0);
}
const solvedS1 = () => Object.fromEntries(S1.map((c) => [c.id, { stars: 3, rep: c.difficulty * 50 + 50, times: 1, last: 3 }]));
const MAP_SELS = [".season-tab", ".case-card", ".map-pin:not(:disabled)", "#renameBtn"];

for (const view of ["d", "m"]) {
  mob = view === "m";
  await b.view(mob ? 390 : 1366, mob ? 844 : 768, mob, mob ? 3 : 1.25);
  await b.touch(mob);
  const T = "mua2-" + view;
  try {
    // 1) hồ sơ mới: mùa 2 khoá, tab có tooltip, bấm thì báo cách mở và ở lại mùa 1
    await inject(null);
    await press("#startBtn");
    await waitFor("__game.screen==='map'");
    check(`${T} hồ sơ mới: tab mùa 1`, await b.ev("__game.season===1&&!!document.querySelector('.season-tab.on[data-season=\"1\"]')"));
    check(`${T} tab mùa 2 khoá + tooltip`, await b.ev(`(()=>{const t=document.querySelector('.season-tab[data-season="2"]');return !!t&&t.classList.contains('locked')&&t.title==='Phá xong Vụ 6 để mở Chợ Hẻm'})()`));
    check(`${T} mùa khoá chưa nạp file vụ mùa 2`, await b.ev("__game.catalog().filter(e=>e.season===2).every(e=>e.status==='pending')"));
    await press('.season-tab[data-season="2"]');
    check(`${T} bấm tab khoá ⇒ báo cách mở, vẫn mùa 1`, await waitFor("__game.season===1&&[...document.querySelectorAll('.toast')].some(t=>/Phá xong Vụ 6/.test(t.textContent))", 2000));
    await screen(T, "1-moi-khoa", MAP_SELS);

    // 2) bản lưu đã phá Vụ 6 (chưa xem màn chuyển) ⇒ tự chọn mùa 2 ⇒ màn chuyển: Tèo + bà Tư báo tin, rồi bài đăng nhóm
    await inject({ v: 1, name: "Thám Tử E2E", rep: 900, solved: solvedS1(), runs: {}, created: 1 });
    await press("#startBtn");
    check(`${T} đã phá Vụ 6 ⇒ màn chuyển mùa 2`, await waitFor("__game.screen==='season'"));
    await sleep(200); await b.shot(`${OUT}/${T}-2-man-chuyen-thoai.png`);
    const lines = await talk();
    check(`${T} màn chuyển có thoại`, lines >= 3, String(lines));
    await waitFor("!!document.querySelector('#season2Go')&&!document.querySelector('.season-phone[hidden]')", 3000);
    await screen(T, "3-man-chuyen-bai-dang", ["#season2Go", ".season-phone .post"]);
    await press("#season2Go");
    check(`${T} về bản đồ tab mùa 2`, await waitFor("__game.screen==='map'&&__game.season===2&&!!document.querySelector('.season-tab.on[data-season=\"2\"]')"));
    check(`${T} cờ s2intro đã ghi`, await b.ev("__game.profile.flags.s2intro===1&&JSON.parse(localStorage.getItem('wgp.tham-tu-hem.v1')).flags.s2intro===1"));
    await waitFor("__game.catalog().filter(e=>e.season===2).every(e=>e.status!=='pending'&&e.status!=='loading')", 4000);
    const cards = await b.ev("[...document.querySelectorAll('.case-card')].map(e=>({id:e.dataset.case,dis:e.disabled,t:e.textContent}))");
    check(`${T} tab mùa 2 chỉ hiện 6 vụ mùa 2`, cards.length === S2.length && cards.every((c) => S2.some((x) => x.id === c.id)), cards.map((c) => c.id).join(","));
    for (const c of S2) {
      const card = cards.find((x) => x.id === c.id);
      if (!have.has(c.id)) check(`${T} ${c.id}: chưa có file ⇒ "Sắp ra mắt"`, !!card && card.dis && /Sắp ra mắt/.test(card.t));
      else check(`${T} ${c.id}: có file ⇒ ${c.no === 7 ? "mở" : "khoá"}`, !!card && card.dis === (c.no !== 7) && !/Sắp ra mắt/.test(card.t));
    }
    check(`${T} chấm vụ mùa 2 đủ 6`, (await b.ev("document.querySelectorAll('.map-pin').length")) === S2.length);
    await screen(T, "4-ban-do-mua-2", MAP_SELS);

    // 3) đổi tab qua lại: mùa 1 hiện 6 vụ đã phá; quay lại mùa 2 không chiếu lại màn chuyển
    await press('.season-tab[data-season="1"]');
    check(`${T} tab mùa 1: 6 vụ đã phá`, await waitFor("__game.season===1&&document.querySelectorAll('.case-card.st-done').length===6"));
    await screen(T, "5-ban-do-mua-1", MAP_SELS);
    await press('.season-tab[data-season="2"]');
    check(`${T} quay lại mùa 2 không chiếu lại màn chuyển`, await waitFor("__game.screen==='map'&&__game.season===2&&!__game.dialogOpen"));

    // 4) tải lại: đang dở vụ mùa 1 ⇒ tự chọn mùa 1
    await b.ev(`(()=>{const p=JSON.parse(localStorage.getItem('wgp.tham-tu-hem.v1'));p.runs['mat-wifi']={phase:'play'};__game.store.wipe();localStorage.setItem('wgp.tham-tu-hem.v1',JSON.stringify(p))})()`);
    await b.nav(URL0);
    await press("#startBtn");
    check(`${T} tải lại khi đang dở Vụ 4 ⇒ tab mùa 1`, await waitFor("__game.screen==='map'&&__game.season===1"));
  } catch (e) { check(`${T} kịch bản`, false, e.message); }
}
// 404 của file vụ chưa viết là lỗi mạng (không phải lỗi JS) ⇒ bỏ qua; mọi lỗi khác đều tính
const errs = b.errors.filter((e) => !/data\/cases\/[\w-]+\.js\?v=t6/.test(e));
const net404 = b.errors.filter((e) => /404/.test(e));
check("0 lỗi console (ngoài 404 file vụ chưa viết)", !errs.length, errs.slice(0, 5).join(" | "));
console.log(`(404 file vụ chưa viết: ${net404.length} dòng)`);
b.close();
console.log(fails ? `${fails} FAIL` : "E2E-MÙA-2 ĐẠT");
process.exit(fails ? 1 : 0);
