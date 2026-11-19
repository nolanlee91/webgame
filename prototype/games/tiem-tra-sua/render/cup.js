// Ly lớn ở Quầy pha: các lớp cup-layers.webp cùng ô 160×192 xếp chồng (core/cupview.js quyết định lớp), hiệu ứng rót / đá / topping / nắp
// từ clip manifest (cup-fx, lid-and-ice-fx), nhân viên thân trên (barista-actions) diễn đúng thao tác. Lớp mới hiện sau ~frame 3–4 của clip.
import { paint } from "./atlas.js";
import { cupLayers } from "../core/cupview.js";

const FX_FOR = { cup: null, base: ["cupfx", "pour"], add: ["cupfx", "pour"], sugar: ["cupfx", "pour"], ice: ["lidfx", "ice"], topping: ["cupfx", "topping"], lid: ["lidfx", "seal"] };
const BARISTA_FOR = { base: "pour", add: "pour", sugar: "pour", ice: "topping", topping: "topping", lid: "handoff", serve: "handoff" };

export function createCupView(root, atlas, { scale = 1.5 } = {}) {
  root.textContent = "";
  const wrap = document.createElement("div"); wrap.className = "bigcup"; root.appendChild(wrap);
  const barista = document.createElement("div"); barista.className = "spr bar-upper"; root.appendChild(barista);
  const layersEl = document.createElement("div"); layersEl.className = "cup-layers"; wrap.appendChild(layersEl);
  const fxEl = document.createElement("div"); fxEl.className = "cup-fx"; wrap.appendChild(fxEl);
  const empty = document.createElement("div"); empty.className = "cup-empty"; empty.textContent = "Chưa có ly. Bắt đầu bằng bước Lấy ly."; root.appendChild(empty);
  let current = "", sc = scale, bTok = 0;

  const idle = () => paint(barista, atlas.frame("barista", "handoff-6"), sc * 0.95);
  function setScale(s) { if (s === sc) return; sc = s; wrap.style.width = 160 * sc + "px"; wrap.style.height = 192 * sc + "px"; current = ""; idle(); }
  wrap.style.width = 160 * sc + "px"; wrap.style.height = 192 * sc + "px";
  idle();

  function playClip(alias, name, el, scl, done, alive = () => true) {
    const clip = atlas.clip(alias, name);
    if (!clip) { done?.(); return; }
    let i = 0;
    const tick = () => {
      if (!alive()) return;
      if (i >= clip.frames.length) { done?.(); return; }
      paint(el, atlas.frame(alias, clip.frames[i++]), scl);
      setTimeout(tick, 1000 / clip.fps);
    };
    tick();
  }

  /** Vẽ theo ly; `justDid` = bước vừa làm để chạy hiệu ứng (bỏ qua nếu reduced). */
  function update(cup, { justDid = null, reduced = false } = {}) {
    const { layers, stage, step } = cupLayers(cup);
    wrap.dataset.stage = stage;
    wrap.dataset.step = step;
    empty.hidden = !!layers.length;
    if (stage === current) return;
    const before = new Set(current.split("+"));
    current = stage;
    layersEl.textContent = "";
    for (const name of layers) {
      const e = document.createElement("i");
      e.className = "spr" + (justDid && !reduced && !before.has(name) ? (justDid === "lid" ? " in-late" : " in") : "");
      e.dataset.layer = name;
      paint(e, atlas.frame("cup", name), sc);
      layersEl.appendChild(e);
    }
    if (justDid && !reduced) {
      const fx = FX_FOR[justDid];
      if (fx) {
        const f = document.createElement("i"); f.className = "spr"; fxEl.appendChild(f);
        playClip(fx[0], fx[1], f, sc, () => f.remove());
        if (justDid === "base") { const s2 = document.createElement("i"); s2.className = "spr steam"; fxEl.appendChild(s2); setTimeout(() => playClip("cupfx", "steam", s2, sc, () => s2.remove()), 400); }
      }
      act(justDid);
    }
  }
  function act(what) {
    const clip = BARISTA_FOR[what];
    if (!clip) return;
    const tok = ++bTok;
    playClip("barista", clip, barista, sc * 0.95, () => setTimeout(() => { if (tok === bTok) idle(); }, 250), () => tok === bTok);
  }
  return { update, setScale, act };
}
