// Công cụ soi tiếng + độ lún nút trên Chrome headless (dùng chung cho sound-press-e2e.mjs).
//  - SOUND_HOOK: chèn trước script trang, ghi mọi lần phát tiếng vào window.__snd (tên file .ogg/.mp3 nếu biết,
//    "osc" cho tiếng tổng hợp như "tách" của feedback.js, "media" cho <audio>), đếm tải/giải mã ở window.__sndLoad.
//  - pressAudit(tab): mọi phần tử bấm được đang hiện ⇒ ép :active (CSS.forcePseudoState) ⇒ so transform/translate/
//    scale/box-shadow/top/filter trước–sau. Trả về danh sách phần tử không lún (và phần tử bị vô hiệu mà vẫn lún).
import { sleep } from "./cdp.mjs";

export const SOUND_HOOK = `(() => {
  const snd = window.__snd = []; const load = window.__sndLoad = { fetched: {}, decoded: {}, failed: {} };
  const abUrl = new WeakMap(), bufName = new WeakMap();
  const nameOf = (u) => { try { return decodeURIComponent(new URL(u, location.href).pathname.split("/").pop()); } catch { return String(u); } };
  const isAudio = (u) => /\\.(ogg|mp3|wav|m4a|webm)(\\?|$)/i.test(u || "");
  const RA = Response.prototype.arrayBuffer;
  Response.prototype.arrayBuffer = function () {
    const url = this.url, st = this.status;
    if (isAudio(url)) load.fetched[nameOf(url)] = st;
    return RA.call(this).then((ab) => { if (isAudio(url)) abUrl.set(ab, nameOf(url)); return ab; });
  };
  const DA = BaseAudioContext.prototype.decodeAudioData;
  BaseAudioContext.prototype.decodeAudioData = function (ab, ok, bad) {
    const n = abUrl.get(ab) || "?";
    const p = DA.call(this, ab);
    p.then((b) => { bufName.set(b, n); load.decoded[n] = +b.duration.toFixed(3); if (ok) ok(b); },
           (e) => { load.failed[n] = String(e && e.message || e); if (bad) bad(e); });
    return p;
  };
  const acs = window.__acs = [];
  for (const K of ["AudioContext", "webkitAudioContext"]) {
    const C = window[K]; if (!C || C.__wrapped) continue;
    const W = class extends C { constructor(...a) { super(...a); acs.push(this); } }; W.__wrapped = true; window[K] = W;
  }
  const rec = (k, extra) => snd.push(Object.assign({ k, t: Math.round(performance.now()) }, extra));
  const BS = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (...a) { rec("buf", { n: (this.buffer && bufName.get(this.buffer)) || "?", ctx: this.context.state }); return BS.apply(this, a); };
  const OS = OscillatorNode.prototype.start;
  OscillatorNode.prototype.start = function (...a) { rec("osc", { f: Math.round(this.frequency.value), ctx: this.context.state }); return OS.apply(this, a); };
  const MP = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (...a) { rec("media", { n: nameOf(this.currentSrc || this.src), muted: this.muted, vol: this.volume }); return MP.apply(this, a); };
  window.__sndMark = () => snd.length;
  window.__sndSince = (i) => snd.slice(i).map((e) => e.k === "buf" ? e.n.replace(/\\.\\w+$/, "") : e.k === "osc" ? "osc" + e.f : "media:" + e.n);
})();`;

const STYLE_PROPS = ["transform", "translate", "scale", "boxShadow", "top", "filter", "borderTopWidth", "borderBottomWidth", "backgroundColor", "marginTop"];

/** Đánh dấu phần tử bấm được đang hiện (không bị che) bằng data-pa="i" và trả về mô tả. */
const MARK = `(() => {
  document.querySelectorAll("[data-pa]").forEach((e) => e.removeAttribute("data-pa"));
  const SEL = 'button, .btn, [role="button"], a[href], [onclick], summary, label[for], input[type=button], input[type=submit], input[type=checkbox], input[type=radio]';
  const cand = new Set(document.querySelectorAll(SEL));
  for (const el of document.querySelectorAll("body *")) {
    if (el.tagName === "CANVAS" || el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") continue;
    const cs = getComputedStyle(el); if (cs.cursor !== "pointer") continue;
    const p = el.parentElement; if (p && getComputedStyle(p).cursor === "pointer") continue;
    cand.add(el);
  }
  const out = []; let i = 0;
  for (const el of cand) {
    if (el.closest("[data-pa]") && el.closest("[data-pa]") !== el) continue;
    const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4) continue;
    const cs = getComputedStyle(el); if (cs.visibility === "hidden" || +cs.opacity === 0) continue;
    const x = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), y = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
    if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
    const top = document.elementFromPoint(x, y); if (!top || !(top === el || el.contains(top) || top.contains(el))) continue;
    // phần tử con nằm trong một nút đã chọn ⇒ bỏ (nút cha lo)
    let anc = el.parentElement, inside = false; while (anc) { if (anc.dataset && anc.dataset.pa) { inside = true; break; } anc = anc.parentElement; }
    if (inside) continue;
    el.dataset.pa = String(++i);
    const dis = !!(el.disabled || el.getAttribute("aria-disabled") === "true");
    const id = el.id ? "#" + el.id : "", cls = el.classList.length ? "." + [...el.classList].slice(0, 3).join(".") : "";
    out.push({ i, sel: el.tagName.toLowerCase() + id + cls, txt: (el.innerText || el.getAttribute("aria-label") || el.title || "").trim().replace(/\\s+/g, " ").slice(0, 28), dis, x, y });
  }
  return out;
})()`;

// style của phần tử + vài phần tử con (có nút lún phần ảnh bên trong, ví dụ thẻ "Mở phòng nhanh")
const styleOf = (i) => `(() => { const el = document.querySelector('[data-pa="${i}"]'); if (!el) return null;
  return [el, ...[...el.querySelectorAll("*")].slice(0, 12)].map((e) => { const cs = getComputedStyle(e); return ${JSON.stringify(STYLE_PROPS)}.map((p) => cs[p]).join(" | "); }).join(" || "); })()`;

/** realCheck: bấm chuột thật (mousePressed) lên phần tử đầu tiên để đối chiếu với :active ép. */
export async function pressAudit(tab, { real = 1 } = {}) {
  await tab.cmd("DOM.enable"); await tab.cmd("CSS.enable");
  // tắt transition khi đo: cửa sổ headless chạy nền có thể không chạy khung hình ⇒ style kẹt ở giá trị đầu
  await tab.ev(`(() => { const st = document.createElement("style"); st.id = "__pa_nt"; st.textContent = "*,*::before,*::after{transition:none!important}"; document.head.appendChild(st); })()`);
  const items = await tab.ev(MARK);
  const doc = (await tab.cmd("DOM.getDocument", { depth: -1 })).result.root;
  const res = [];
  for (const it of items) {
    const q = await tab.cmd("DOM.querySelector", { nodeId: doc.nodeId, selector: `[data-pa="${it.i}"]` });
    const nodeId = q.result && q.result.nodeId; if (!nodeId) continue;
    const force = async (cls) => { await tab.cmd("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: cls }); await sleep(60); const v = await tab.ev(styleOf(it.i)); return v; };
    // :hover → :active+:hover → :hover; hai lần :hover khác nhau ⇒ phần tử vừa đổi trạng thái (vd nút vừa bật/tắt) ⇒ đo lại
    let r = null;
    for (let tries = 0; tries < 3 && !r; tries++) {
      const h1 = await force(["hover"]), after = await force(["active", "hover"]), h2 = await force(["hover"]);
      const dis = await tab.ev(`(() => { const el = document.querySelector('[data-pa="${it.i}"]'); return !!el && !!(el.disabled || el.getAttribute("aria-disabled") === "true"); })()`);
      if (h1 === h2 && dis === it.dis) r = { pressed: after !== h1, before: h1, after };
      else { it.dis = dis; await sleep(150); }
    }
    await tab.cmd("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: [] });
    // Màn cảm ứng: thẻ link trang chủ cố ý KHÔNG lún theo :active (lướt qua không lún); lún bằng .is-pressing
    // do press-nav.js bật khi là cú chạm thật ⇒ cũng tính là lún.
    if (r && !r.pressed) {
      const base = await tab.ev(styleOf(it.i));
      await tab.ev(`document.querySelector('[data-pa="${it.i}"]').classList.add("is-pressing")`); await sleep(60);
      const viaClass = await tab.ev(styleOf(it.i));
      await tab.ev(`document.querySelector('[data-pa="${it.i}"]').classList.remove("is-pressing")`);
      if (viaClass !== base) r = { ...r, pressed: true, after: viaClass };
    }
    if (r) res.push({ ...it, ...r });
  }
  // đối chiếu bằng chuột thật: nhấn giữ trên phần tử đầu (không phải vô hiệu), đo, kéo ra ngoài rồi thả (không kích click)
  const realRes = [];
  for (const it of res.filter((r) => !r.dis).slice(0, real)) {
    const before = await tab.ev(styleOf(it.i));
    await tab.cmd("Input.dispatchMouseEvent", { type: "mouseMoved", x: it.x, y: it.y });
    await tab.cmd("Input.dispatchMouseEvent", { type: "mousePressed", x: it.x, y: it.y, button: "left", clickCount: 1 });
    await sleep(160);
    const during = await tab.ev(styleOf(it.i));
    await tab.cmd("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1, y: 1, button: "left", buttons: 1 });
    await tab.cmd("Input.dispatchMouseEvent", { type: "mouseReleased", x: 1, y: 1, button: "left", clickCount: 1 });
    realRes.push({ sel: it.sel, realPressed: before !== during, forced: it.pressed });
  }
  await tab.ev(`document.getElementById("__pa_nt")?.remove()`);
  return { items: res, real: realRes };
}

/** exempt: RegExp cho phần tử được miễn (link chữ, nhãn ô nhập, ô bàn cờ có tô sáng riêng…). */
export function summarizePress(r, exempt = null) {
  const name = (x) => `${x.sel}${x.txt ? " «" + x.txt + "»" : ""}`;
  const bad = r.items.filter((x) => !x.dis && !x.pressed).map(name).filter((n) => !(exempt && exempt.test(n)));
  const badDis = r.items.filter((x) => x.dis && x.pressed).map((x) => `${x.sel} (vô hiệu mà vẫn lún)`);
  return { total: r.items.length, bad, badDis, real: r.real };
}
