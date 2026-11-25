// E2E: nút "Khoe" lúc lên cấp giữa ca (Bánh Mì, Cơm Tấm) + thẻ chốt ca ghi "Lên cấp N!" + nút khoe danh hiệu Nhà (Nông Trại).
// Chạy (ở gốc repo): node prototype/games/_shared/test/levelup-share-e2e.mjs <thư mục ảnh> [game1,game2]
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const OUT = process.argv[2] || "levelup-shots";
mkdirSync(OUT, { recursive: true });
import { startServer, launchChrome, sleep } from "./cdp.mjs";
let fails = 0, passes = 0;
const ok = (c, msg) => { console.log(`${c ? "PASS" : "FAIL"} ${msg}`); c ? passes++ : fails++; };
const { server, base } = await startServer();
const chrome = await launchChrome();
const IPHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const only = process.argv[3] ? process.argv[3].split(",") : null;

async function tab(name, w, h, mobile) {
  const t = await chrome.newTab(name, w, h, mobile);
  if (mobile) await t.cmd("Emulation.setUserAgentOverride", { userAgent: IPHONE_UA, platform: "iPhone" });
  await t.cmd("Storage.clearDataForOrigin", { origin: base, storageTypes: "local_storage" });
  return t;
}
const stubShare = (t) => t.ev(`window.__shareCalls = []; navigator.canShare = () => true;
  navigator.share = (d) => { __shareCalls.push({ n: d.files?.length, type: d.files?.[0]?.type, url: d.url }); return Promise.reject(new DOMException("x", "NotAllowedError")); }; true`);
/** Phần tử hiện, tâm + 4 góc không bị che, nằm trong màn hình. */
const freeCheck = (t, sel) => t.ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e || e.closest('[hidden]')) return { ok: false, why: "không thấy" };
  const r = e.getBoundingClientRect(); if (!r.width) return { ok: false, why: "rộng 0" };
  const pts = [[.5,.5],[.15,.25],[.85,.25],[.15,.75],[.85,.75]];
  const bad = pts.filter(([fx, fy]) => { const x = r.left + r.width * fx, y = r.top + r.height * fy; const top = document.elementFromPoint(x, y); return !(top && (top === e || e.contains(top))); });
  return { ok: !bad.length && r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, r: [r.left|0, r.top|0, r.width|0, r.height|0],
    hscroll: document.documentElement.scrollWidth > document.documentElement.clientWidth, bad: bad.length }; })()`);
async function panelCheck(t, tag, game, mobile) {
  await t.waitFor(`document.querySelector(".lk-share .lk-share__img")?.naturalWidth === 1080`, 20000);
  await sleep(250);
  const p = await t.ev(`(() => { const box = document.querySelector(".lk-share__box").getBoundingClientRect();
    return { game: document.querySelector(".lk-share").dataset.game, inView: box.left >= 0 && box.right <= innerWidth && box.top >= 0, hscroll: document.documentElement.scrollWidth > innerWidth }; })()`);
  ok(p.game === game && p.inView && !p.hscroll, `${tag}: ra ảnh 1080×1080 + bảng chia sẻ đúng game, trong màn hình, không tràn ngang`);
  if (mobile) { const c = await t.ev("__shareCalls"); ok(c.length === 1 && c[0].type === "image/png", `${tag}: điện thoại gọi navigator.share với ảnh PNG`); }
}
const esc = async (t) => { await t.ev(`document.querySelector(".lk-share [data-act=close]").click()`); await sleep(200); };

const GAMES = {
  async "tiem-banh-mi"(t, tag, mobile, W) {
    await t.go(`${base}/games/tiem-banh-mi/?seed=777&prepSpeed=8`);
    await t.waitFor("!!window.__game && !!document.querySelector('#introGo')", 30000);
    await t.ev("document.querySelector('#introGo').click()");
    await t.ev(`(async()=>{const L=await import('./data/economy.js?v=b6');const s=__game.state;s.level=5;s.xp=L.LEVELS[4];s.money=2500;s.day=6;s.tutorialDone=true;s.rep=62;s.followers=37;s.shopName="Bánh Mì Cô Út";s.drama.pending=null;__game.act({type:"consign"});__game.act({type:"restockToday"});__game.act({type:"firstBatch",sec:28});__game.save();__game.overlays.prep(s);return true})()`);
    await t.waitFor("__game.overlay==='prep' && !!document.querySelector('#openShop')");
    await t.ev("document.querySelector('#openShop').click()");
    await t.waitFor("!!__game.state.shift && !__game.overlay", 20000);
    await t.ev(`(async()=>{const s=__game.state;s.shift.drama.max=0;const L=await import('./data/economy.js?v=b6');s.xp=L.LEVELS[s.level]-1;return true})()`);
    await t.ev(`(()=>{for(let i=0;i<200&&!__game.state.shift.customers.some(c=>c.phase==='wait'&&!c.pre);i++)__game.advance(400);return true})()`);
    const r = await t.ev("JSON.stringify(__game.openEvent('X01'))");
    await t.waitFor("__game.overlay==='event' && !!document.querySelector('#sheet .choice[data-choice=book]')", 8000).catch(() => { throw new Error("không mở được sự kiện X01 " + r); });
    await t.ev("document.querySelector('#sheet .choice[data-choice=book]').click()");
    for (let i = 0; i < 10 && (await t.ev("__game.overlay==='event'")); i++) { await sleep(150); await t.ev(`(document.querySelector('#sheet [data-act=eventNext],#sheet [data-act=eventDone]')||document.querySelector('#sheet .choice:not(:disabled)'))?.click()`); }
    return { level: await t.ev("__game.state.level"), endShift: async () => { await t.ev("__game.state.shift.closeNow=true"); await t.waitFor("__game.overlay==='summary'", 20000); await sleep(300); },
      summaryCard: () => t.ev(`import('./ui/screens.js?v=b6').then(m=>JSON.stringify(m.summaryShare(__game.state.lastSummary)))`).then(JSON.parse),
      note: '[data-card="levelUp"]', clock: "__game.state.shift.t" };
  },
  async "quan-com-tam"(t, tag, mobile, W) {
    await t.go(`${base}/games/quan-com-tam/?seed=777`);
    await t.waitFor("!!window.__game && !!document.querySelector('#introGo')", 30000);
    await t.ev("document.querySelector('#introGo').click()");
    await t.waitFor("__game.overlay==='prep'");
    await t.ev(`(()=>{const g=__game,s=g.state;s.tutorialDone=true;s.shopName="Cơm Tấm Cô Ba";s.followers=12;g.setLevel(4);for(const a of ["restockToday","prepCook","prepMoHanh","prepLight"])g.act({type:a});g.overlays.prep(s);return true})()`);
    await t.waitFor("!!document.querySelector('#openShop')");
    await t.ev("document.querySelector('#openShop').click()");
    await t.waitFor("!!__game.state.shift && !__game.overlay && !__game.dramaOpen", 20000);
    await t.ev(`(async()=>{const s=__game.state;if(s.shift.drama)s.shift.drama.max=0;const L=await import('./data/economy.js?v=c6');s.xp=L.LEVELS[s.level]-1;return true})()`);
    const r = await t.ev("JSON.stringify(__game.openEvent('G01'))");
    await t.waitFor("!!document.querySelector('.choice[data-choice=thanks]')", 8000).catch(() => { throw new Error("không mở được sự kiện G01 " + r); });
    await t.ev("document.querySelector('.choice[data-choice=thanks]').click()");
    for (let i = 0; i < 10 && (await t.ev("__game.dramaOpen")); i++) { await sleep(150); await t.ev(`(document.querySelector('[data-act=eventNext],[data-act=eventDone]')||document.querySelector('.choice:not(:disabled)'))?.click()`); }
    return { level: await t.ev("__game.state.level"),
      endShift: async () => { await t.ev(`import('./core/shift.js?v=c6').then(m=>{m.endShift(__game.state,[]);__game.overlays.summary(__game.state);return true})`); await t.waitFor("__game.overlay==='summary'"); await sleep(300); },
      summaryCard: () => t.ev(`import('./ui/overlays.js?v=c6').then(m=>JSON.stringify(m.summaryShare(__game.state.lastSummary)))`).then(JSON.parse),
      note: '[data-s="level-up"]', clock: "__game.state.shift.t" };
  },
};

try {
  for (const [game, reach] of Object.entries(GAMES)) {
    if (only && !only.includes(game)) continue;
    for (const [w, h, mobile] of [[1366, 768, false], [390, 844, true]]) {
      const tag = `${game} ${w}×${h}`, W = `${game}-${w}`;
      const t = await tab(W, w, h, mobile);
      try {
        const g = await reach(t, tag, mobile, W);
        const btn = "#toasts .toast-act[data-act=shareLevel]";
        await t.waitFor(`!!document.querySelector(${JSON.stringify(btn)})`, 5000);
        await sleep(350);
        const txt = await t.ev(`document.querySelector(${JSON.stringify(btn)}).closest('.toast').textContent`);
        ok(new RegExp(`Lên cấp ${g.level}!`).test(txt), `${tag}: thông báo "${txt}" có nút Khoe (cấp ${g.level})`);
        // bắn thêm vài thông báo thường: nút Khoe vẫn còn, vẫn hiện
        await t.ev(`__game.act({type:'restock',id:'zzz'});__game.act({type:'pin',cid:-1});true`);
        await sleep(200);
        const fc = await freeCheck(t, btn);
        ok(fc.ok && !fc.hscroll, `${tag}: nút Khoe hiện, không bị che (elementFromPoint 5 điểm), không tràn ngang ${JSON.stringify(fc)}`);
        await t.shot(join(OUT, `${W}-1-thong-bao-len-cap.png`));
        if (mobile) await stubShare(t);
        const c0 = await t.ev(g.clock);
        const free = await t.click(btn, { touch: mobile });
        ok(free, `${tag}: bấm thật vào nút Khoe`);
        await panelCheck(t, `${tag} (giữa ca)`, game, mobile);
        await t.shot(join(OUT, `${W}-2-bang-khoe-giua-ca.png`));
        const c1 = await t.ev(g.clock); await sleep(1200); const c2 = await t.ev(g.clock);
        ok(c1 === c2, `${tag}: bảng chia sẻ mở ⇒ đồng hồ ca dừng (${c0} → ${c1} → ${c2})`);
        await esc(t);
        await sleep(1200);
        const c3 = await t.ev(g.clock);
        ok(c3 > c2, `${tag}: đóng bảng ⇒ ca chạy tiếp (${c2} → ${c3})`);
        // chốt ca: dòng "Lên cấp N" + thẻ khoe ghi "Lên cấp: N!"
        await g.endShift();
        ok(await t.ev(`(()=>{const e=document.querySelector(${JSON.stringify(g.note)});return !!e&&/Lên cấp/.test(e.textContent)})()`), `${tag}: bảng chốt ca ghi "Lên cấp … trong ca!"`);
        const card = await g.summaryCard();
        ok(card.lines.includes(`Lên cấp: ${g.level}!`), `${tag}: thẻ khoe chốt ca có dòng "Lên cấp: ${g.level}!" (${card.lines.join(" | ")})`);
        await t.ev(`document.querySelector(${JSON.stringify(g.note)}).scrollIntoView({block:'center'})`); await sleep(150);
        await t.shot(join(OUT, `${W}-3-chot-ca.png`));
        if (mobile) await stubShare(t);
        const sb = "#sheet [data-act=shareResult]";
        const fs = await freeCheck(t, sb); // freeCheck không cuộn; t.click cuộn rồi kiểm
        const free2 = await t.click(sb, { touch: mobile });
        ok(free2, `${tag}: nút Khoe kết quả ở chốt ca bấm được ${JSON.stringify(fs)}`);
        await panelCheck(t, `${tag} (chốt ca)`, game, mobile);
        await t.shot(join(OUT, `${W}-4-bang-khoe-chot-ca.png`));
        await esc(t);
        ok(!t.errors.length, `${tag}: không lỗi console ${t.errors.join(" | ")}`);
      } catch (e) { ok(false, `${tag}: ${e.message}`); await t.shot(join(OUT, `${W}-LOI.png`)).catch(() => {}); console.log(t.errors.join("\n")); }
      t.close();
    }
  }
  // Nông Trại: thẻ chúc mừng nâng Nhà ⇒ nút khoe danh hiệu
  if (!only || only.includes("nong-trai")) for (const [w, h, mobile] of [[1366, 768, false], [390, 844, true]]) {
    const tag = `nong-trai ${w}×${h}`, W = `nong-trai-${w}`;
    const t = await tab(W, w, h, mobile);
    try {
      await t.go(`${base}/games/nong-trai/?testclock`);
      await t.waitFor("typeof __game==='object'", 30000);
      await sleep(500);
      await t.ev("document.getElementById('helpOk')?.click(); __game.cards.dismissAll(); true");
      await t.ev("(()=>{const s=__game.state;s.level=12;s.coins=99999;__game.state=s;return true})()");
      await sleep(300);
      for (const sel of ["#buildBtn", '.bld[data-id="nha"]', "#buildOk"]) { await t.waitFor(`!!document.querySelector(${JSON.stringify(sel)}) && !document.querySelector(${JSON.stringify(sel)}).closest('[hidden]')`, 5000); await t.click(sel, { touch: mobile }); await sleep(300); }
      ok(await t.ev("__game.state.buildings.nha && !__game.state.buildings.nha.done"), `${tag}: bắt đầu nâng Nhà (2 phút)`);
      await t.ev("window.__ntOffset=(window.__ntOffset||0)+125000; true");
      await t.waitFor("!document.getElementById('ovCelebrate').hidden && /Nhà lên bậc/.test(document.getElementById('celTitle').textContent)", 10000);
      await sleep(700);
      const title = await t.ev("document.getElementById('celTitle').textContent"), body = await t.ev("document.getElementById('celBody').textContent");
      ok(/★1/.test(title) && /Nông trại chăm chỉ/.test(body), `${tag}: thẻ chúc mừng "${title}" kể danh hiệu mới`);
      const fc = await freeCheck(t, "#celShare");
      ok(fc.ok && !fc.hscroll, `${tag}: nút "Khoe danh hiệu mới" hiện, không bị che, không tràn ngang ${JSON.stringify(fc)}`);
      for (const b of ["#celGo", "#celLater"]) { const f = await freeCheck(t, b); ok(f.ok, `${tag}: ${b} vẫn bấm được ${JSON.stringify(f)}`); }
      await t.shot(join(OUT, `${W}-1-the-nang-nha.png`));
      if (mobile) await stubShare(t);
      ok(await t.click("#celShare", { touch: mobile }), `${tag}: bấm thật nút Khoe danh hiệu`);
      await panelCheck(t, `${tag} (danh hiệu Nhà)`, "nong-trai", mobile);
      await t.shot(join(OUT, `${W}-2-bang-khoe-danh-hieu.png`));
      const card = await t.ev(`import('./ui/share-card.js?v=m9').then(m=>JSON.stringify(m.farmShare(__game.state,"fame",null,2)))`).then(JSON.parse);
      ok(card.title === "“Nông trại chăm chỉ”" && card.lines[0] === "Nhà: bậc ★1", `${tag}: nội dung thẻ ${card.title} · ${card.lines.join(" | ")}`);
      await t.cmd("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
      await t.cmd("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
      await sleep(300);
      ok(await t.ev("!document.querySelector('.lk-share') && !document.getElementById('ovCelebrate').hidden"), `${tag}: Esc đóng bảng chia sẻ, thẻ chúc mừng vẫn mở`);
      await t.click("#celLater", { touch: mobile }); await sleep(300);
      ok(await t.ev("document.getElementById('ovCelebrate').hidden"), `${tag}: Để sau đóng thẻ`);
      ok(!t.errors.length, `${tag}: không lỗi console ${t.errors.join(" | ")}`);
      t.close();
    } catch (e) { ok(false, `${tag}: ${e.message}`); t.close(); }
  }
} finally {
  chrome.close();
  server.close();
}
console.log(`\n${passes}/${passes + fails} đạt — ảnh ở ${OUT}`);
process.exit(fails ? 1 : 0);
