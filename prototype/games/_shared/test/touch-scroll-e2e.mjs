// E2E: lướt ngón tay qua thẻ game / nút trên điện thoại KHÔNG được lún, KHÔNG kêu, KHÔNG vào game;
// chạm thật thì lún + kêu + vào game. Chuột (máy tính) vẫn kêu ngay khi nhấn.
// Chạy: node prototype/games/_shared/test/touch-scroll-e2e.mjs   (tự bật server.js + Chrome headless)
import { startServer, launchChrome, sleep } from "./cdp.mjs";

const HOOK = `(() => {
  window.__osc = 0; window.__pressed = 0;
  for (const C of [window.AudioContext, window.webkitAudioContext].filter(Boolean)) {
    const o = C.prototype.createOscillator;
    C.prototype.createOscillator = function () { window.__osc++; return o.apply(this, arguments); };
  }
  new MutationObserver((ms) => { for (const m of ms) if (m.target.classList?.contains("is-pressing")) window.__pressed++; })
    .observe(document, { attributes: true, attributeFilter: ["class"], subtree: true });
})();`;

let pass = 0, fail = 0;
const ok = (c, msg) => { c ? pass++ : fail++; console.log(`${c ? "✔" : "✘"} ${msg}`); };

const { server, base } = await startServer();
const chrome = await launchChrome("touch-scroll");

async function open(mobile) {
  const t = await chrome.newTab(mobile ? "phone" : "desktop", mobile ? 390 : 1366, mobile ? 844 : 768, mobile);
  await t.cmd("Page.addScriptToEvaluateOnNewDocument", { source: HOOK });
  await t.go(`${base}/homepage/`);
  await t.waitFor('document.querySelectorAll("a.tile[href]").length > 3');
  await sleep(400);
  return t;
}
const center = async (t, sel) => {
  const p = await t.ev(`(() => { const el = [...document.querySelectorAll(${JSON.stringify(sel)})].find((e) => e.getBoundingClientRect().width > 0);
    if (!el) return null; el.scrollIntoView({ block: "center", behavior: "instant" }); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await sleep(250); // đợi sự kiện scroll của chính lần cuộn này qua hết
  return p;
};
const reset = (t) => t.ev("window.__osc = 0; window.__pressed = 0; true");

async function drag(t, p, { dy = -16, steps = 10, hold = 0 } = {}) {
  await t.cmd("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: p.x, y: p.y }] });
  if (hold) await sleep(hold);
  let mid = null;
  for (let i = 1; i <= steps; i++) {
    await t.cmd("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x, y: p.y + dy * i }] });
    await sleep(16);
    if (i === 3) mid = await t.ev(`(() => { const el = document.elementFromPoint(${p.x}, ${p.y + dy * 3})?.closest("a, button, .btn"); return el ? getComputedStyle(el).transform : "none"; })()`);
  }
  await t.cmd("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(300);
  return mid;
}
const flat = (tf) => tf === "none" || /^matrix\(1, 0, 0, 1, 0, 0\)$/.test(tf);

// ---- Điện thoại ----
{
  const t = await open(true);
  const url0 = await t.ev("location.href");
  for (const [name, sel] of [["thẻ game", "a.tile[href]"], ["slide hero", "a.slide[href]"], ["nút", "button[type=submit].btn"]]) {
    const p = await center(t, sel);
    if (!p) { console.log(`(bỏ qua ${name}: không thấy trên màn)`); continue; }
    await reset(t);
    const tf = await drag(t, p);
    ok(await t.ev("window.__osc") === 0, `điện thoại: lướt qua ${name} ⇒ không kêu`);
    ok(await t.ev("window.__pressed") === 0, `điện thoại: lướt qua ${name} ⇒ không bật lún (.is-pressing)`);
    ok(flat(tf || "none"), `điện thoại: đang lướt qua ${name} ⇒ không lún theo :active (transform ${tf})`);
    ok(await t.ev("location.href") === url0, `điện thoại: lướt qua ${name} ⇒ vẫn ở trang chủ`);
    await t.ev("scrollTo(0, 0)"); await sleep(200);
  }
  // giữ ngón 150 ms rồi mới kéo (kiểu chạm–ngập ngừng–cuộn) ⇒ có thể đã lún, nhưng phải nhả lún và không kêu
  {
    const p = await center(t, "a.tile[href]");
    await reset(t);
    await drag(t, p, { hold: 150 });
    ok(await t.ev("window.__osc") === 0, "điện thoại: chạm giữ rồi cuộn ⇒ không kêu");
    ok(await t.ev("!document.querySelector('.is-pressing')"), "điện thoại: chạm giữ rồi cuộn ⇒ thẻ nhả lún");
    ok(await t.ev("location.href") === url0, "điện thoại: chạm giữ rồi cuộn ⇒ vẫn ở trang chủ");
    await t.ev("scrollTo(0, 0)"); await sleep(200);
  }
  // nút: chạm thật ⇒ kêu
  {
    const p = await center(t, "button[type=submit].btn");
    if (p) {
      await reset(t);
      await t.cmd("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] });
      await sleep(60);
      await t.cmd("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await sleep(200);
      ok(await t.ev("window.__osc") > 0, "điện thoại: chạm thật vào nút ⇒ kêu");
      await t.go(`${base}/homepage/`); await t.waitFor('document.querySelectorAll("a.tile[href]").length > 3'); await sleep(300);
    }
  }
  // thẻ game: chạm thật ⇒ lún + kêu + vào game
  {
    const p = await center(t, "a.tile[href]");
    await reset(t);
    await t.cmd("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] });
    await sleep(100);
    const pressedDuring = await t.ev("!!document.querySelector('a.tile.is-pressing')");
    await t.cmd("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await sleep(60);
    ok(pressedDuring, "điện thoại: chạm giữ 100 ms ⇒ thẻ lún");
    ok(await t.ev("window.__osc") > 0, "điện thoại: chạm thật ⇒ kêu");
    let moved = false;
    for (let i = 0; i < 30 && !moved; i++) { await sleep(100); try { moved = !(await t.ev("location.pathname")).startsWith("/homepage/"); } catch {} }
    ok(moved, "điện thoại: chạm thật ⇒ vào game");
  }
  // chạm rất nhanh (< 70 ms) vẫn kêu + vào game
  {
    await t.go(`${base}/homepage/`); await t.waitFor('document.querySelectorAll("a.tile[href]").length > 3'); await sleep(300);
    const p = await center(t, "a.tile[href]");
    await reset(t);
    await t.cmd("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] });
    await t.cmd("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await sleep(60);
    ok(await t.ev("window.__osc") > 0, "điện thoại: chạm nhanh ⇒ kêu");
    let moved = false;
    for (let i = 0; i < 30 && !moved; i++) { await sleep(100); try { moved = !(await t.ev("location.pathname")).startsWith("/homepage/"); } catch {} }
    ok(moved, "điện thoại: chạm nhanh ⇒ vào game");
  }
  ok(t.errors.length === 0, `điện thoại: không lỗi console ${t.errors.join(" | ")}`);
  t.close();
}

// ---- Máy tính: chuột kêu ngay khi nhấn ----
{
  const t = await open(false);
  const p = await center(t, "a.tile[href]");
  await reset(t);
  await t.cmd("Input.dispatchMouseEvent", { type: "mouseMoved", x: p.x, y: p.y });
  await t.cmd("Input.dispatchMouseEvent", { type: "mousePressed", x: p.x, y: p.y, button: "left", clickCount: 1 });
  await sleep(50);
  ok(await t.ev("window.__osc") > 0, "máy tính: nhấn chuột ⇒ kêu ngay (chưa nhả)");
  ok(await t.ev("!!document.querySelector('a.tile.is-pressing')"), "máy tính: nhấn chuột ⇒ lún ngay");
  await t.cmd("Input.dispatchMouseEvent", { type: "mouseReleased", x: p.x, y: p.y, button: "left", clickCount: 1 });
  let moved = false;
  for (let i = 0; i < 30 && !moved; i++) { await sleep(100); try { moved = !(await t.ev("location.pathname")).startsWith("/homepage/"); } catch {} }
  ok(moved, "máy tính: bấm ⇒ vào game");
  ok(t.errors.length === 0, `máy tính: không lỗi console ${t.errors.join(" | ")}`);
  t.close();
}

chrome.close(); server.close();
console.log(`\n${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);
