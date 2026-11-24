// E2E tiếng + độ lún nút cho trang chủ và 10 game giải trí nhanh (Chrome headless thật, server.js thật):
//  1. Mỗi game: mọi file tiếng được tải (HTTP 200) và giải mã được; không có tiếng nào trước cử chỉ đầu tiên.
//  2. Bấm Chơi + vài thao tác thật ⇒ có tiếng; phím M ⇒ thao tác sau đó im hẳn, khoá wgp.muted="1" còn sau khi tải lại.
//  3. wgp.muted="1" đặt trước khi mở trang ⇒ cả ván không phát tiếng nào (kể cả tiếng "tách" của feedback.js).
//  4. Nút âm thanh ở chân trang chủ ⇒ game mở sau đó im.
//  5. Đua Xe: tiếng máy (oscillator) về gain 0 khi tạm dừng / hết ván.
//  6. Mọi phần tử bấm được đang hiện phải lún khi :active (1366×768 và 390×844), nút bị vô hiệu thì không lún.
// Chạy: node prototype/games/_shared/test/sound-press-e2e.mjs
import { startServer, launchChrome, sleep } from "./cdp.mjs";
import { SOUND_HOOK, pressAudit, summarizePress } from "./audit-lib.mjs";

let fails = 0, passes = 0;
const ok = (c, msg) => { console.log(`${c ? "PASS" : "FAIL"} ${msg}`); c ? passes++ : fails++; };

// Miễn kiểm lún: link chữ (← Trang chủ, logo, link chân trang), nhãn ô nhập, ô Sudoku (chọn ô ⇒ tô sáng ngay khi chạm).
const EXEMPT = /^(a «← Trang chủ»|a\.logo|a\.footer__link|label[.#]|div\.cell)/;
// Ngoài trang chủ, dùng phím thật; `play` = thao tác đầu tiên chắc chắn kêu (sau Chơi).
const GAMES = {
  "2048":        { start: "#playBtn", play: async (t, key) => { for (const k of ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]) { await key(k); await sleep(160); } } },
  sudoku:        { start: "#playBtn", play: async (t, key) => { const e = await t.ev("__game.state.cells.findIndex((v)=>!v)"); await t.ev(`__game.select(${e})`); await key("Digit" + await t.ev(`__game.state.solution[${e}]`)); } },
  "do-vui-nhanh":{ start: "#playBtn", play: async (t) => { if (await t.ev("!!document.querySelector('#nextBtn')?.offsetParent")) { await t.click("#nextBtn"); await sleep(600); } await t.click(".ans"); } },
  "ran-san-moi": { start: "#playBtn", play: async (t, key) => { await key("ArrowUp"); await sleep(150); await key("ArrowRight"); } },
  "xep-gach":    { start: "#playBtn", play: async (t, key) => { await key("ArrowLeft"); await key("Space"); } },
  "dao-vang":    { start: "#play1", wait: 900, play: async (t, key) => { await key("Space"); await sleep(3500); } },
  "ban-bong":    { start: "#playBtn", play: async (t, key) => { await key("Space"); await sleep(900); } },
  "ghep-keo":    { start: "#playBtn", play: async (t) => { await t.ev("(async()=>{ const L=await import('./logic.js'); const m=L.findMove(__game.state.cells); return __game.swap(m[0]??m.a, m[1]??m.b); })()"); await sleep(900); } },
  "noi-thu":     { start: "#playBtn", play: async (t) => { await t.click("#hintBtn"); } },
  "dua-xe":      { start: "#playBtn", play: async (t) => { await t.ev("__game.step(20, {gas:true, brake:false})"); } },
};

const { server, base } = await startServer();
const chrome = await launchChrome();
const KC = { ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Space: 32, KeyM: 77, KeyP: 80 };
const keyer = (t) => async (code) => {
  const k = code === "Space" ? " " : code.startsWith("Key") ? code.slice(3).toLowerCase() : code.startsWith("Digit") ? code.slice(5) : code;
  const vk = KC[code] || (code.startsWith("Digit") ? 48 + +code.slice(5) : 0);
  await t.cmd("Input.dispatchKeyEvent", { type: "rawKeyDown", code, key: k, windowsVirtualKeyCode: vk, text: k.length === 1 ? k : undefined });
  if (k.length === 1) await t.cmd("Input.dispatchKeyEvent", { type: "char", code, key: k, text: k });
  await t.cmd("Input.dispatchKeyEvent", { type: "keyUp", code, key: k, windowsVirtualKeyCode: vk });
};
// tiếng "nghe được": bỏ oscillator tiếng máy Đua Xe (chạy liên tục, gain 0 khi im)
const audible = (list) => list.filter((n) => n !== "osc50" && n !== "osc25");
async function tab(name, mobile = false, { muted = null } = {}) {
  const t = await chrome.newTab(name, mobile ? 390 : 1366, mobile ? 844 : 768, mobile);
  const pre = muted === null ? "" : `try{if(!sessionStorage.__lkm){localStorage.setItem("wgp.muted",${JSON.stringify(muted)});sessionStorage.__lkm=1}}catch{}`;
  await t.cmd("Page.addScriptToEvaluateOnNewDocument", { source: pre + SOUND_HOOK });
  return t;
}

try {
  // ── 1–3: từng game ──
  for (const [g, G] of Object.entries(GAMES)) {
    const url = `${base}/games/${g}/`;
    {
      const t = await tab(g, false, { muted: "0" }), key = keyer(t);
      await t.go(url); await sleep(1500);
      if (g === "dao-vang") { await t.click(G.start); await sleep(1500); }
      const L = await t.ev("({ f: __sndLoad.fetched, d: Object.keys(__sndLoad.decoded).length, x: __sndLoad.failed })");
      const st = Object.values(L.f);
      ok(st.length > 0 && st.every((s) => s === 200) && L.d === st.length && !Object.keys(L.x).length, `${g}: ${st.length} file tiếng tải 200 + giải mã (${L.d})`);
      ok((await t.ev("__sndSince(0)")).length === 0 || g === "dao-vang", `${g}: không phát tiếng trước cử chỉ đầu tiên`);
      if (g !== "dao-vang") { await t.click(G.start); await sleep(G.wait || 600); }
      let m = await t.ev("__sndMark()");
      await G.play(t, key); await sleep(500);
      const heard = audible(await t.ev(`__sndSince(${m})`)).filter((n) => !n.startsWith("osc"));
      ok(heard.length > 0, `${g}: thao tác trong ván có tiếng (${heard.slice(0, 4).join(", ")})`);
      await key("KeyM"); await sleep(150);
      m = await t.ev("__sndMark()");
      await G.play(t, key); await sleep(500);
      const after = audible(await t.ev(`__sndSince(${m})`));
      ok(after.length === 0, `${g}: phím M ⇒ im (${after.join(", ") || "không tiếng"})`);
      ok(await t.ev("localStorage.getItem('wgp.muted') === '1'"), `${g}: M ghi wgp.muted=1`);
      if (t.errors.length) ok(false, `${g}: lỗi console ${JSON.stringify(t.errors).slice(0, 300)}`);
      t.close();
    }
    {
      const t = await tab(g + "-muted", false, { muted: "1" }), key = keyer(t);
      await t.go(url); await sleep(1200);
      await t.click(G.start); await sleep(G.wait || 600);
      await G.play(t, key); await sleep(500);
      const s = audible(await t.ev("__sndSince(0)"));
      ok(s.length === 0, `${g}: wgp.muted=1 trước khi mở ⇒ cả ván im (${s.join(", ") || "không tiếng"})`);
      t.close();
    }
  }

  // ── 4: nút âm thanh chân trang chủ ⇒ game im ──
  {
    const t = await tab("home-mute", false, { muted: "0" });
    await t.go(`${base}/homepage/`); await sleep(800);
    await t.click("#soundBtn"); await sleep(200);
    ok(await t.ev("localStorage.getItem('wgp.muted') === '1' && document.getElementById('soundBtn').getAttribute('aria-pressed') === 'true'"), "trang chủ: nút âm thanh ghi wgp.muted=1");
    await t.go(`${base}/games/2048/`); await sleep(1200);
    await t.click("#playBtn"); await sleep(400);
    await GAMES["2048"].play(t, keyer(t)); await sleep(400);
    const s = await t.ev("__sndSince(0)");
    ok(s.length === 0, `trang chủ tắt tiếng ⇒ 2048 im (${s.join(", ") || "không tiếng"})`);
    await t.go(`${base}/homepage/`); await sleep(600);
    await t.click("#soundBtn"); await sleep(200);
    ok(await t.ev("localStorage.getItem('wgp.muted') === '0'"), "trang chủ: bấm lại ⇒ bật tiếng");
    t.close();
  }

  // ── 5: Đua Xe tiếng máy về 0 khi tạm dừng / hết ván ──
  {
    const t = await tab("dua-xe-engine", false, { muted: "0" });
    // móc GainNode để đọc giá trị gain đích của tiếng máy (setTargetAtTime)
    await t.cmd("Page.addScriptToEvaluateOnNewDocument", { source: `(() => { const T = AudioParam.prototype.setTargetAtTime; window.__gainT = new Map();
      AudioParam.prototype.setTargetAtTime = function (v, ...a) { window.__gainT.set(this, v); return T.call(this, v, ...a); }; })();` });
    await t.go(`${base}/games/dua-xe/`); await sleep(1200);
    await t.click("#playBtn"); await sleep(300);
    await t.cmd("Input.dispatchKeyEvent", { type: "rawKeyDown", code: "ArrowRight", key: "ArrowRight", windowsVirtualKeyCode: 39 }); await sleep(600);
    const maxOn = await t.ev("Math.max(...[...__gainT.values()].filter((v) => v < 1))");
    await t.cmd("Input.dispatchKeyEvent", { type: "keyUp", code: "ArrowRight", key: "ArrowRight", windowsVirtualKeyCode: 39 });
    ok(maxOn > 0, `dua-xe: đang chạy có tiếng máy (gain ${maxOn})`);
    const engGain = "(() => { const v = [...__gainT.entries()].filter(([p, v]) => v < 1 && p.maxValue > 1e3).map(([p, v]) => v); return Math.max(...v); })()";
    await keyer(t)("KeyP"); await sleep(300);
    ok(await t.ev(engGain) === 0, "dua-xe: tạm dừng ⇒ tiếng máy gain 0");
    await keyer(t)("KeyP"); await sleep(200);
    await t.ev("for (let i = 0; i < 60 && __game.state.status === 'run'; i++) __game.step(15, { gas: true })"); await sleep(1500);
    ok(await t.ev("__game.mode") === "over" && await t.ev(engGain) === 0, "dua-xe: hết ván ⇒ tiếng máy gain 0");
    t.close();
  }

  // ── 6: nút lún ──
  const press = async (t, label) => {
    const r = summarizePress(await pressAudit(t, { real: 1 }), EXEMPT);
    ok(r.bad.length === 0, `${label}: ${r.total} phần tử bấm được đều lún${r.bad.length ? " — KHÔNG LÚN: " + r.bad.join("; ") : ""}`);
    ok(r.badDis.length === 0, `${label}: nút vô hiệu không lún${r.badDis.length ? " — " + r.badDis.join("; ") : ""}`);
    for (const x of r.real) ok(x.realPressed === x.forced, `${label}: bấm chuột thật khớp :active (${x.sel})`);
  };
  for (const mobile of [false, true]) {
    const sz = mobile ? "390" : "1366";
    {
      const t = await tab("home", mobile);
      await t.go(`${base}/homepage/`); await sleep(1500);
      const H = await t.ev("document.documentElement.scrollHeight"), vh = mobile ? 844 : 768;
      for (let y = 0; y < H; y += Math.round(vh * 0.8)) { await t.ev(`scrollTo(0, ${y})`); await sleep(200); await press(t, `trang chủ ${sz} @${y}`); }
      t.close();
    }
    for (const [g, G] of Object.entries(GAMES)) {
      const t = await tab(g, mobile);
      await t.go(`${base}/games/${g}/`); await sleep(1200);
      await press(t, `${g} ${sz} menu`);
      await t.click(G.start, { touch: mobile }); await sleep(G.wait || 700);
      await press(t, `${g} ${sz} trong ván`);
      if (g === "do-vui-nhanh") { await t.click(".ans", { touch: mobile }); await sleep(600); await press(t, `${g} ${sz} đã trả lời`); }
      if (g === "ran-san-moi") { await t.ev("__game.steps(200)"); await sleep(1500); await press(t, `${g} ${sz} kết thúc`); await t.click("#shareBtnE", { touch: mobile }); await sleep(1500); await press(t, `${g} ${sz} bảng chia sẻ`); }
      if (g === "dua-xe") { await t.ev("for (let i = 0; i < 60 && __game.state.status === 'run'; i++) __game.step(15, { gas: true })"); await sleep(2000); await press(t, `${g} ${sz} kết thúc + cửa hàng`); }
      t.close();
    }
    {
      const t = await tab("2048-daily", mobile);
      await t.go(`${base}/games/2048/?daily=1`); await sleep(1200);
      await press(t, `2048 daily ${sz}`);
      t.close();
    }
  }
} finally {
  chrome.close(); server.close();
}
console.log(`\n${passes} PASS, ${fails} FAIL`);
process.exit(fails ? 1 : 0);
