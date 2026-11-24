// Âm thanh Thám Tử Hẻm: bộ mp3 riêng của Codex trong assets/audio/ (docs/tham-tu-hem/WAVE3.md mục D, AUDIO.md).
// - Nạp lười: chỉ tạo Audio / tải file sau thao tác đầu tiên, và chỉ khi cần tới tiếng đó.
// - Nhạc + tiếng nền đổi theo màn (setScene), đổi màn thì fade ngắn.
// - Công tắc tổng "wgp.muted" (chung Lụm Kèo, phím M); "tth.music" = "0" tắt riêng nhạc (tiếng nền + hiệu ứng vẫn còn).
// - Tiếng bấm nút: click.mp3 (game tự phát; feedback.js chung được tắt bằng data-nosfx trên body để không kêu hai lần).
export const MUTE_KEY = "wgp.muted";
export const MUSIC_KEY = "tth.music";
const BASE = "assets/audio/";

/** Hiệu ứng: tên file (không đuôi) ⇒ âm lượng. */
export const SFX = {
  click: 0.35, "page-flip": 0.45, "clue-found": 0.55, keyword: 0.4, inspect: 0.4, objection: 0.6, wrong: 0.5, "lose-cred": 0.5,
  "deduce-ok": 0.55, "deduce-bad": 0.5, confront: 0.55, confess: 0.55, "case-solved": 0.6, "rank-up": 0.55, "zalo-ping": 0.5,
  "like-pop": 0.45, "door-bell": 0.5, "teo-hint": 0.5, "map-select": 0.5,
};
export const BLIPS = ["type-blip", "type-blip-2", "type-blip-3"];
/** Vòng lặp: music = nhạc (tắt riêng được), còn lại là tiếng nền. */
export const LOOPS = {
  "music-map": { gain: 0.32, music: true }, "music-investigate": { gain: 0.28, music: true }, "music-interrogate": { gain: 0.3, music: true },
  "music-finale": { gain: 0.32, music: true }, "music-solved": { gain: 0.32, music: true },
  "amb-rain-alley": { gain: 0.22 }, "amb-office": { gain: 0.25 },
  // Mùa 2 (Chợ Hẻm): tuỳ chọn, chưa có file thì phát bản dự phòng của mùa 1.
  "music-map-2": { gain: 0.32, music: true, fallback: "music-map" }, "amb-market": { gain: 0.2, fallback: "amb-rain-alley" },
};
/** Màn ⇒ vòng lặp đang phát. */
export const SCENES = {
  title: ["amb-rain-alley"], map: ["music-map", "amb-rain-alley"], office: ["amb-office"], scene: ["music-investigate"],
  talk: ["music-interrogate"], finale: ["music-finale"], result: ["music-solved"], season: ["music-map-2"],
  map2: ["music-map-2", "amb-market"],
};

const ls = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
export const muted = () => ls(MUTE_KEY) === "1";
export const musicOn = () => ls(MUSIC_KEY) !== "0";
export function setMuted(on) { lsSet(MUTE_KEY, on ? "1" : "0"); sync(); }
export function setMusic(on) { lsSet(MUSIC_KEY, on ? "1" : "0"); sync(); }

let unlocked = false, want = [], blipI = 0, lastBlip = 0;
const cache = new Map(), last = {}, loops = new Map();
// Cảm ứng: pointerdown (touchstart) chưa tính là thao tác ⇒ play() bị chặn (NotAllowedError), vòng lặp nằm im ở trạng thái paused.
// Gọi lại ở pointerup / touchend: còn vòng lặp nào paused thì sync() tạo lại.
export function unlockSound() { if (unlocked && ![...loops.values()].some((a) => a.paused)) return; unlocked = true; sync(); }
function base(name) {
  if (cache.has(name)) return cache.get(name);
  const a = new Audio(); a.preload = "auto"; a.src = BASE + name + ".mp3";
  a.addEventListener("error", () => cache.set(name, null), { once: true });
  cache.set(name, a);
  return a;
}
export function play(name, delay = 0) {
  if (muted() || !unlocked || !(name in SFX)) return;
  const now = performance.now(); if (now - (last[name] || 0) < 90) return; last[name] = now;
  const go = () => { const b = base(name); if (!b) return; try { const a = b.cloneNode(); a.volume = SFX[name]; a.play().catch(() => {}); } catch {} };
  delay ? setTimeout(go, delay * 1000) : go();
}
/** Tiếng gõ chữ: xoay vòng 3 file, nhỏ, tối đa ~12 lần / giây. */
export function blip() {
  if (muted() || !unlocked) return;
  const now = performance.now(); if (now - lastBlip < 80) return; lastBlip = now;
  const b = base(BLIPS[blipI++ % BLIPS.length]); if (!b) return;
  try { const a = b.cloneNode(); a.volume = 0.18; a.play().catch(() => {}); } catch {}
}

// ---------- vòng lặp theo màn ----------
function fade(a, to, ms, done) {
  clearInterval(a._fade);
  const from = a.volume, t0 = performance.now();
  a._fade = setInterval(() => {
    const k = Math.min(1, (performance.now() - t0) / ms);
    a.volume = Math.max(0, Math.min(1, from + (to - from) * k));
    if (k >= 1) { clearInterval(a._fade); done?.(); }
  }, 40);
}
export function setScene(name) { want = SCENES[name] || []; sync(); }
const missing = new Set(); // vòng lặp tuỳ chọn không tải được ⇒ dùng fallback
const resolve = (n) => (missing.has(n) && LOOPS[n].fallback ? resolve(LOOPS[n].fallback) : n);
function sync() {
  const on = new Set(unlocked && !muted() ? want.map(resolve).filter((n) => !LOOPS[n].music || musicOn()) : []);
  for (const [n, a] of loops) if (!on.has(n)) { fade(a, 0, 500, () => { a.pause(); if (loops.get(n) === a) loops.delete(n); }); }
  for (const n of on) {
    let a = loops.get(n);
    if (a && !a.paused) { fade(a, LOOPS[n].gain, 300); continue; }
    a = new Audio(BASE + n + ".mp3"); a.loop = true; a.volume = 0;
    a.addEventListener("error", () => { loops.delete(n); if (LOOPS[n].fallback) { missing.add(n); sync(); } }, { once: true });
    loops.set(n, a);
    a.play().then(() => fade(a, LOOPS[n].gain, 700)).catch(() => {});
  }
}
export const soundDebug = () => ({ unlocked, want, playing: [...loops.keys()] });

/** Sự kiện engine (cả danh sách của một lần apply) ⇒ tiếng. */
export function soundsFor(evs) {
  const has = (t) => evs.some((e) => e.type === t);
  if (has("break")) play("objection");
  if (has("clue")) play("clue-found");
  else if (has("seen")) play("inspect");
  if (has("word")) play("keyword", 0.05);
  if (has("wrong") || has("stepWrong")) play("wrong");
  if (has("cred")) play("lose-cred", 0.2);
  if (has("boardWrong")) play("deduce-bad");
  if (has("boardSolved")) play("deduce-ok");
  if (has("finale")) play("confront");
  if (has("stepRight") && !has("done")) play("objection");
  if (has("done")) play("confess");
  if (has("hint")) play("teo-hint");
}
