// E2E bố cục nhiều khung (TLC2-01 / 03 / 05): mỗi khung chơi trọn 2 đơn ngày 1 bằng chạm thật mà KHÔNG tự cuộn:
// trước mỗi lần chạm, nút của bước (ghim phiếu, lấy, nướng lại, rạch, phết, nhân, rau, gia vị, gói, Giao, Thối đúng) phải bấm được
// ngay tại chỗ (elementFromPoint ở tâm = chính nút) — game tự cuộn tới bước kế. Kèm: không tràn ngang (360, 320 cả màn chào / Chuẩn bị ca),
// máy tính bảng 768: bố cục xếp dọc (cảnh ≥ 700 px ngang, phiếu ≤ 140 px cao, 1 thông báo).
// Gọi từ e2e.mjs (cuối phần mobile) hoặc riêng: LAYOUT_ONLY=1 PORT=… node prototype/games/tiem-banh-mi/test/e2e.mjs <thư mục ảnh>
const VIEWS = [[390, 844], [360, 800], [412, 915], [768, 1024], [320, 568], [844, 390], [568, 320]]; // D5: + điện thoại xoay ngang (TLC2-04)
const CYCLE = [0, 2, 3, 1];
const clicksTo = (cur, want) => { let i = CYCLE.indexOf(cur), n = 0; while (CYCLE[i % 4] !== want && n < 4) { i++; n++; } return n; };

export async function runLayout({ b, check, sleep, OUT, PORT, waitFor }) {
  const BASE = `http://127.0.0.1:${PORT}/games/tiem-banh-mi/?seed=777&prepSpeed=8`;
  const S = (e) => b.ev(`(()=>{const s=__game.state;return ${e}})()`);
  const noOverflowX = () => b.ev("document.documentElement.scrollWidth<=document.documentElement.clientWidth");
  const hit = (sel) => b.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.closest('[hidden]')||e.disabled)return null;const r=e.getBoundingClientRect();if(!r.width)return null;
    const x=r.x+r.width/2,y=r.y+r.height/2,t=document.elementFromPoint(x,y),v=visualViewport;return {x:x-v.offsetLeft,y:y-v.offsetTop,ok:!!t&&(t===e||e.contains(t))}})()`);
  let missed = [], unseen = [];
  // TLC22-02: lúc ráp (sau khi ghim phiếu) HUD (ô Giờ), viên Lò, dòng gợi ý (nếu đang hiện) và thông báo mới nhất phải nằm trong màn, không bị che
  const seen = () => b.ev(`(()=>{const ok=(e)=>{if(!e||e.closest('[hidden]'))return true;const r=e.getBoundingClientRect();if(!r.width||!r.height)return true;
    if(r.top<0||r.bottom>innerHeight)return false;const t=document.elementFromPoint(r.x+r.width/2,r.y+Math.min(r.height/2,10));return !!t&&(e===t||e.contains(t)||t.contains(e))};
    const ts=[...document.querySelectorAll('#toasts .toast')].filter(t=>getComputedStyle(t).display!=='none');
    return [['hud',document.querySelector('#hud .chip')],['lò',document.querySelector('#pills .pill')],['gợi ý',document.querySelector('#hintbar')],['thông báo',ts[ts.length-1]]].filter(([,e])=>!ok(e)).map(([n])=>n)})()`);
  /** Chạm nút tại chỗ; nút không bấm được ngay (phải cuộn tay) ⇒ ghi lại rồi mới cuộn để đi tiếp. */
  async function press(sel) {
    await sleep(160);
    let h = null; for (let i = 0; i < 30 && !(h = await hit(sel)); i++) await sleep(80);
    if (!h) throw new Error("không thấy " + sel);
    if (h.ok && !sel.startsWith("#rail")) { const u = await seen(); if (u.length) unseen.push(sel.replace(/^\[data-(\w+)="?([\w-]+)"?\]$/, "$1:$2") + "→" + u.join("+")); }
    if (!h.ok) { missed.push(sel); await b.ev(`document.querySelector(${JSON.stringify(sel)}).scrollIntoView({block:'center'})`); await sleep(80); h = await hit(sel); }
    await b.tap(h.x, h.y); await sleep(120);
  }
  async function clearDialogs() { for (let i = 0; i < 4; i++) { if (!(await S("s.shift&&s.shift.dialog"))) return; await b.ev("document.querySelector('#sheet .choice:not(:disabled)')?.click()"); await sleep(150); } }

  for (const [w, h] of VIEWS) {
    const tag = `${w}×${h}`;
    await b.view(w, h, true, 2); await b.touch(true);
    // TLC22-06: trang cũ có thể ghi lại bản lưu lúc pagehide sau khi đã xoá ⇒ chưa thấy màn chào thì xoá + mở lại (tối đa 3 lần)
    for (let k = 0; k < 3; k++) {
      await b.send("Page.navigate", { url: "about:blank" }); await sleep(600);
      await b.send("Storage.clearDataForOrigin", { origin: `http://127.0.0.1:${PORT}`, storageTypes: "local_storage" });
      await b.nav(BASE);
      if (await waitFor("!!document.querySelector('#introGo')", 6000)) break;
    }
    let ox = await noOverflowX();
    await b.ev("document.querySelector('#introGo').click()");
    await waitFor("__game.overlay==='prep'");
    for (const t of await b.ev("JSON.stringify([...document.querySelectorAll('#sheet [data-tab]')].map(e=>e.dataset.tab))").then(JSON.parse)) {
      await b.ev(`document.querySelector('#sheet [data-tab="${t}"]').click()`); await sleep(120); ox = ox && (await noOverflowX());
    }
    check(`${tag}: màn chào + mọi tab Chuẩn bị ca không tràn ngang`, ox);
    await b.ev("document.querySelector('#sheet [data-tab]').click()"); await sleep(150);
    await b.ev(`document.querySelector('[data-act="restockToday"]').click()`); await sleep(150);
    await b.ev("document.querySelector('#openShop').click()");
    await waitFor("!!__game.state.shift");
    await b.ev("__game.act({type:'bake',slot:0});__game.advance(28500);__game.act({type:'pull',slot:0})");
    missed = []; unseen = [];
    let orders = 0;
    for (let order = 0; order < 2; order++) {
      let cid = null;
      for (let i = 0; i < 300 && cid === null; i++) { await clearDialogs(); cid = await S("(s.shift.customers.find(c=>c.phase==='wait'&&!c.filled.some(Boolean))||{}).id??null"); if (cid === null) await b.ev("__game.advance(400)"); }
      if (cid === null) break;
      if (await S("s.shift.paying!==null")) { await b.ev("__game.act({type:'autoChange'})"); await clearDialogs(); }
      if ((await S("s.shift.case.length")) < 2) { await b.ev("__game.act({type:'bake',slot:0});__game.advance(28500);__game.act({type:'pull',slot:0})"); await clearDialogs(); }
      await press(`#rail .slip[data-cid="${cid}"]`);
      const it = await S("JSON.stringify((()=>{const b=s.shift.boards[0];return s.shift.customers.find(c=>c.id===b.cid).items[b.item]})())").then(JSON.parse);
      await press('[data-act="take"]'); // ngày 1–3: "Lấy + rạch" một chạm
      if (it.crispy && (await S("s.shift.boards[0].loaf.crisp")) < 85 && !(await S("s.shift.boards[0].loaf.sliced"))) { await press('[data-act="toast"]'); await b.ev("__game.advance(4400)"); await press('[data-act="toast"]'); }
      if (!(await S("s.shift.boards[0].loaf.sliced"))) await press('[data-act="slice"]');
      for (const id of ["pate", "bo", "mayo"]) for (let k = clicksTo(0, it.spreads[id] || 0); k > 0; k--) await press(`[data-spread="${id}"]`);
      for (const id of it.fills) await press(`[data-fill="${id}"]`);
      const vegs = ["do-chua", "dua-leo", "rau-mui", "hanh-la"], on = vegs.filter((x) => it.veg[x]);
      if (on.length === 4) await press('[data-veg="all"]'); else for (const x of on) await press(`[data-veg="${x}"]`);
      for (let k = clicksTo(0, it.ot); k > 0; k--) await press('[data-spice="ot"]');
      for (const id of ["nuoc-tuong", "tuong-ot"]) if (it.sauces[id]) await press(`[data-sauce="${id}"]`);
      await press(`[data-wrap="${it.bag ? "tui" : it.wrap}"]`);
      await press('[data-act="serve"]');
      await clearDialogs();
      if (await S("s.shift&&s.shift.paying!==null")) await press('[data-act="autoChange"]');
      for (let i = 0; i < 5 && (await S("s.shift&&s.shift.paying!==null")); i++) { await b.ev("__game.act({type:'autoChange'})"); await clearDialogs(); }
      orders++;
    }
    check(`${tag}: 2 đơn ngày 1, nút bước kế luôn bấm được tại chỗ (0 lần tự cuộn)`, orders === 2 && missed.length === 0, `${orders} đơn · phải cuộn: ${missed.join(" ") || "0"}`);
    if (h > 500) check(`${tag}: lúc ráp luôn thấy HUD, viên Lò, gợi ý và thông báo mới nhất (dải dính khi cảnh trôi khỏi màn)`, unseen.length === 0, unseen.slice(0, 6).join(" ") || "0");
    check(`${tag}: trong ca không tràn ngang`, await noOverflowX(), String(await b.ev("document.documentElement.scrollWidth")));
    if (w === 768) {
      const g = await b.ev("JSON.stringify({world:document.querySelector('#world').getBoundingClientRect().width,slip:(document.querySelector('#rail .slip')||{getBoundingClientRect:()=>({height:0})}).getBoundingClientRect().height,toasts:[...document.querySelectorAll('#toasts .toast')].filter(t=>getComputedStyle(t).display!=='none').length})").then(JSON.parse);
      check(`${tag}: máy tính bảng dọc dùng bố cục xếp dọc (cảnh ≥ 700 px, phiếu ≤ 140 px, ≤ 1 thông báo)`, g.world >= 700 && g.slip <= 140 && g.toasts <= 1, JSON.stringify(g));
    }
    // TLC2-04: HUD 1 hàng ở mọi khung (cả số cuối game); xoay ngang: thông báo nằm dưới HUD, không đè ô HUD
    await b.ev("(()=>{const s=__game.state;s.money=123456;s.followers=12345;s.xp=Math.max(s.xp,0)})()"); await b.ev("__game.advance(100)"); await sleep(250);
    const hud = await b.ev(`JSON.stringify((()=>{const cs=[...document.querySelectorAll('#hud .chip')].filter(e=>e.getBoundingClientRect().width>0).map(e=>e.getBoundingClientRect());
      const t=document.querySelector('#toasts').getBoundingClientRect();return {n:cs.length,rows:new Set(cs.map(r=>Math.round(r.top))).size,hudB:Math.round(Math.max(...cs.map(r=>r.bottom))),toastT:Math.round(t.top)}})())`).then(JSON.parse);
    check(`${tag}: HUD 1 hàng (cả số lớn cuối game)${h <= 500 ? ", thông báo dưới HUD" : ""}`, hud.rows === 1 && (h > 500 || hud.toastT >= hud.hudB), JSON.stringify(hud));
    await b.shot(`${OUT}/layout-${w}x${h}.png`);
  }
}
