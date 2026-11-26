// E2E bố cục (TLC1-01): ở 390/360/412/320 (chạm), 768×1024, 844×390 và 1366×768, ngày 1 và tiệm cuối game (cấp 20, bếp topping),
// pha trọn 2 đơn bằng chạm thật mà KHÔNG tự cuộn: trước mỗi lần chạm, nút nguyên liệu của bước (ghim phiếu, 7 bước, Giao) phải bấm được
// tại chỗ (elementFromPoint ở tâm = chính nút, không bị thanh Hoàn tác / Đổ bỏ ly / Giao che) — quầy pha tự cuộn tới bước kế. Không tràn ngang.
// Gọi từ e2e.mjs (cuối) hoặc chạy riêng: PORT=… node prototype/games/tiem-tra-sua/test/e2e-layout.mjs <thư mục ảnh>
import { pathToFileURL } from "node:url";
import { launch, sleep } from "./cdp.mjs";
const VIEWS = [[390, 844, true], [360, 800, true], [412, 915, true], [320, 568, true], [768, 1024, true], [844, 390, true], [1366, 768, false]];
const LATE = `(()=>{const s=__game.state;s.xp=999999;s.level=20;s.day=30;s.money=5000;Object.assign(s.owned||(s.owned={}),{"powered-sealer":true,"crate-rack":true,"dual-pot-cooker":true,"upright-fridge":true,"portion-dispenser":true});for(const k of Object.keys(s.stock))s.stock[k]=60;})()`;

export async function runLayout({ b, check, PORT, OUT }) {
  let BASE = `http://127.0.0.1:${PORT}/games/tiem-tra-sua/?seed=777&calm=1`;
  const S = (e) => b.ev(`(()=>{const s=__game.state;return ${e}})()`);
  const hit = (sel) => b.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.closest('[hidden]')||e.disabled)return null;const r=e.getBoundingClientRect();if(!r.width)return null;
    const x=r.x+r.width/2,y=r.y+r.height/2,t=document.elementFromPoint(x,y),v=visualViewport;return {x:x-v.offsetLeft,y:y-v.offsetTop,ok:!!t&&(t===e||e.contains(t))}})()`);
  let missed = [];
  async function press(sel, touch) {
    await sleep(180);
    let h = null; for (let i = 0; i < 30 && !(h = await hit(sel)); i++) await sleep(80);
    if (!h) throw new Error("không thấy " + sel);
    if (!h.ok) { missed.push(sel.replace(/#opts \.opt\[data-step="(\w+)"\].*/, "$1")); await b.ev(`document.querySelector(${JSON.stringify(sel)}).scrollIntoView({block:'center'})`); await sleep(80); h = await hit(sel); }
    if (touch) await b.tap(h.x, h.y); else await b.click(h.x, h.y);
    await sleep(120);
  }
  async function clearDialogs() { for (let i = 0; i < 4; i++) { if (!(await S("s.shift&&s.shift.dialog"))) return; await b.ev("document.querySelector('.sheet .choice:not([disabled])')?.click()"); await sleep(200); await b.ev("document.querySelector('#eventNext')?.click()"); await sleep(150); } }
  // TLC12-05: seed 42 ở 320×568 có dòng "sắp hết" làm quầy pha thấp hơn ⇒ nút gợi ý từng bị thanh Hoàn tác che
  for (const [w, h, touch, seed] of [...VIEWS, [320, 568, true, 42]]) for (const late of seed ? [false] : [false, true]) {
    BASE = `http://127.0.0.1:${PORT}/games/tiem-tra-sua/?seed=${seed || 777}&calm=1`;
    const tag = `${w}×${h} ${late ? "cuối game" : "ngày 1"}${seed ? " seed " + seed : ""}`;
    await b.view(w, h, touch, 2); await b.touch(touch);
    await b.send("Page.navigate", { url: "about:blank" }); await sleep(500);
    await b.send("Storage.clearDataForOrigin", { origin: `http://127.0.0.1:${PORT}`, storageTypes: "local_storage" });
    await b.nav(BASE);
    await b.ev("document.querySelector('#introGo').click()"); await sleep(300);
    if (late) { await b.ev(LATE); await b.ev("__game.save&&__game.save()"); await b.nav(BASE); await sleep(300); }
    await b.ev("document.querySelector('#openShop')?.click()"); await sleep(400);
    if (late) await b.ev("__game.state.shift&&(__game.state.shift.kitchen.ready=60)");
    missed = []; let n = 0;
    for (let k = 0; k < 2; k++) {
      let cid = 0;
      for (let i = 0; i < 300 && !cid; i++) { await clearDialogs(); cid = await S("(s.shift&&(s.shift.customers.find(c=>c.phase==='wait'&&!s.shift.stations.some(st=>st.cid===c.id))||{}).id)||0"); if (!cid) await b.ev("__game.advance(300)"); }
      if (!cid) break;
      await press(`#rail .slip[data-cid="${cid}"]`, touch);
      const items = await S(`s.shift.customers.find(c=>c.id===${cid}).items.length`);
      for (let it = 0; it < items; it++) {
        const o = await S("JSON.stringify((()=>{const st=s.shift.stations[s.shift.sel];const c=s.shift.customers.find(c=>c.id===st.cid);return c.items[st.item??0].order})())").then(JSON.parse);
        for (const [step, id] of [["cup", "ly"], ["base", o.base], ["add", o.add], ["sugar", o.sugar], ["ice", o.ice], ["topping", o.topping], ["lid", "dong-nap"]]) await press(`#opts .opt[data-step="${step}"][data-id="${id}"]`, touch);
        await press("#serveBtn", touch);
        await clearDialogs();
      }
      n++;
    }
    check(`bố cục ${tag}: 2 đơn, nút của bước luôn bấm được tại chỗ (0 lần tự cuộn), không tràn ngang`,
      n === 2 && missed.length === 0 && (await b.ev("document.documentElement.scrollWidth<=document.documentElement.clientWidth")), `${n} đơn · phải cuộn: ${missed.join(" ") || "0"}`);
    if (late) {
      // TLC12-06: HUD 1 hàng cả ở tablet dọc 768 (cuối game: số lớn)
      const rows = await b.ev("new Set([...document.querySelectorAll('#hud > *')].filter(c=>c.offsetParent).map(c=>Math.round(c.getBoundingClientRect().top))).size");
      if (w <= 1024) check(`HUD ${tag}: 1 hàng`, rows === 1, `${rows} hàng`);
    }
    if (OUT && !late) await b.shot(`${OUT}/layout-${w}x${h}.png`);
  }
  await runEventLandscape({ b, check, PORT, OUT });
}

/** TLC12-02: bảng sự kiện khi xoay ngang màn thấp — mọi lựa chọn (và nút Tiếp tục của bảng kết quả) nằm trọn trong khung,
 *  bấm được tại tâm và hai góc, không phải cuộn. V12 (2 lựa chọn), R09 / FA2 (3 lựa chọn, chữ dài nhất). */
export async function runEventLandscape({ b, check, PORT, OUT }) {
  const BASE = `http://127.0.0.1:${PORT}/games/tiem-tra-sua/?seed=42&calm=1`;
  const vis = (sel) => `[...document.querySelectorAll(${JSON.stringify(sel)})].map(e=>{const r=e.getBoundingClientRect();const at=(x,y)=>{const t=document.elementFromPoint(x,y);return !!t&&e.contains(t)};
    return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth&&at(r.x+r.width/2,r.y+r.height/2)&&at(r.x+6,r.y+6)&&at(r.right-6,r.bottom-6)})`;
  for (const [w, h] of [[844, 390], [740, 360]]) for (const id of ["V12", "R09", "FA2"]) {
    await b.view(w, h, true, 2); await b.touch(true);
    await b.send("Page.navigate", { url: "about:blank" }); await sleep(500);
    await b.send("Storage.clearDataForOrigin", { origin: `http://127.0.0.1:${PORT}`, storageTypes: "local_storage" });
    await b.nav(BASE);
    await b.ev("document.querySelector('#introGo').click()"); await sleep(300);
    let r = await b.ev(`JSON.stringify(__game.forceEvent(${JSON.stringify(id)}))`);
    if (r.includes("wrong-time")) { await b.ev("document.querySelector('#openShop')?.click()"); await sleep(400); r = await b.ev(`JSON.stringify(__game.forceEvent(${JSON.stringify(id)}))`); }
    await sleep(400);
    const cs = await b.ev(`JSON.stringify(${vis(".sheet.drama .btn.choice")})`).then(JSON.parse);
    check(`sự kiện ${id} ở ${w}×${h}: ${cs.length} lựa chọn đều thấy trọn, bấm được không cuộn`, cs.length >= 2 && cs.every(Boolean), JSON.stringify(cs));
    if (OUT && id === "R09") await b.shot(`${OUT}/event-${w}x${h}.png`);
    await b.ev("document.querySelector('.sheet.drama .btn.choice:not([disabled])')?.click()"); await sleep(400);
    const nx = await b.ev(`JSON.stringify(${vis("#eventNext")})`).then(JSON.parse);
    check(`sự kiện ${id} ở ${w}×${h}: nút Tiếp tục của bảng kết quả bấm được không cuộn`, nx.length === 1 && nx[0], JSON.stringify(nx));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const OUT = process.argv[2] || ".", PORT = process.env.PORT || 8810;
  const b = await launch(OUT, 9393);
  let fails = 0;
  const check = (n, c, d = "") => { console.log((c ? "PASS " : "FAIL ") + n + (d !== "" ? " — " + d : "")); if (!c) fails++; };
  await runLayout({ b, check, PORT, OUT });
  check("0 lỗi console / exception", b.errors.length === 0, b.errors.join(" | "));
  b.close(); await sleep(500);
  console.log(fails ? `\n${fails} FAIL` : "\nE2E BỐ CỤC ĐẠT");
  process.exit(fails ? 1 : 0);
}
