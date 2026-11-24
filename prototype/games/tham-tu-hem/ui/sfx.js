// Âm thanh Thám Tử Hẻm. Tiếng bấm nút do _shared/feedback.js lo. Ở đây: gõ chữ (tổng hợp WebAudio), và tiếng sự kiện MƯỢN TẠM
// của game khác (DEV-NOTES "Cần Codex" ghi bộ tiếng riêng cần làm). File đặt ở assets/audio/<tên>.mp3 thì tự dùng thay bản mượn (AVAILABLE).
// Công tắc tổng: localStorage "wgp.muted" (chung Lụm Kèo). Chỉ tạo AudioContext / tải file sau thao tác đầu tiên.
export const MUTE_KEY = "wgp.muted";
/** Tên tiếng ⇒ [file mượn, âm lượng]. */
export const BORROW = {
  clue: ["../tiem-tra-sua/assets/audio/paper.mp3", 0.5],
  stmt: ["../quan-com-tam/assets/audio/bill-key.mp3", 0.45],
  stamp: ["../tiem-tra-sua/assets/audio/seal.mp3", 0.6],
  break: ["../quan-com-tam/assets/audio/drama.mp3", 0.5],
  gasp: ["../quan-com-tam/assets/audio/voice-surprised.mp3", 0.45],
  wrong: ["../quan-com-tam/assets/audio/error.mp3", 0.45],
  huh: ["../quan-com-tam/assets/audio/voice-annoyed.mp3", 0.4],
  solved: ["../tiem-tra-sua/assets/audio/ready.mp3", 0.5],
  win: ["../quan-com-tam/assets/audio/shift-end.mp3", 0.5],
  rank: ["../quan-com-tam/assets/audio/level-up.mp3", 0.5],
  viral: ["../quan-com-tam/assets/audio/viral.mp3", 0.45],
  hint: ["../tiem-tra-sua/assets/audio/voice-happy.mp3", 0.4],
  phone: ["../quan-com-tam/assets/audio/voice-call.mp3", 0.4],
  door: ["../quan-com-tam/assets/audio/arrival.mp3", 0.4],
};
/** Tiếng riêng Codex giao (assets/audio/<tên>.mp3) — thêm tên vào đây khi có file. */
export const AVAILABLE = new Set([]);

export const muted = () => { try { return localStorage.getItem(MUTE_KEY) === "1"; } catch { return false; } };
export function setMuted(on) { try { localStorage.setItem(MUTE_KEY, on ? "1" : "0"); } catch {} }

let ac = null, unlocked = false;
const cache = new Map(), last = {};
export function unlockSound() {
  if (unlocked) return; unlocked = true;
  for (const n of ["clue", "stamp", "wrong", "break"]) load(n);
}
function load(name) {
  if (cache.has(name)) return cache.get(name);
  const src = AVAILABLE.has(name) ? `assets/audio/${name}.mp3` : BORROW[name]?.[0];
  if (!src) return null;
  const a = new Audio(); a.preload = "auto"; a.src = src;
  a.addEventListener("error", () => cache.set(name, null), { once: true });
  cache.set(name, a);
  return a;
}
export function play(name, delay = 0) {
  if (muted() || !unlocked) return;
  const now = performance.now(); if (now - (last[name] || 0) < 120) return; last[name] = now;
  const base = load(name); if (!base) return;
  const go = () => { try { const a = base.cloneNode(); a.volume = BORROW[name]?.[1] ?? 0.5; a.play().catch(() => {}); } catch {} };
  delay ? setTimeout(go, delay * 1000) : go();
}
/** Tiếng gõ chữ: nhịp ngắn, cao độ theo người nói (tổng hợp, không tải file). */
export function blip(pitch = 1) {
  if (muted() || !unlocked) return;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  try {
    if (!ac) ac = new AC();
    if (ac.state === "suspended") ac.resume().catch(() => {});
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = "square"; o.frequency.setValueAtTime(420 * pitch + Math.random() * 30, t);
    g.gain.setValueAtTime(0.025, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + 0.05);
  } catch {}
}
/** Sự kiện engine ⇒ tiếng. */
export function soundFor(e) {
  switch (e.type) {
    case "clue": return play("clue");
    case "stmt": return play("stmt");
    case "break": play("stamp"); play("break", 0.12); return play("gasp", 0.35);
    case "wrong": case "stepWrong": play("wrong"); return play("huh", 0.25);
    case "boardWrong": return play("wrong");
    case "boardSolved": return play("solved");
    case "stepRight": return play("stamp");
    case "done": return play("win", 0.3);
    case "hint": return play("hint");
    case "word": return blip(1.8);
    default: return undefined;
  }
}
