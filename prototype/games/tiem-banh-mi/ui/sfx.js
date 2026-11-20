// Âm thanh Tiệm Bánh Mì — cùng API và cách làm như Tiệm Trà Sữa (ui/sfx.js của Trà Sữa).
// - Bộ tiếng gốc của Codex (codex/banh-mi-audio, e7967c8): 28 MP3 trong assets/audio/, danh sách ở docs/tiem-banh-mi/ASSET-HANDOFF.md.
// - Chỉ tạo AudioContext sau thao tác người chơi (unlockSound gọi từ pointerdown / keydown). Trước đó không tải byte nào.
// - wgp.muted (dùng chung Lụm Kèo) là công tắc tổng; tbm.music = "0" tắt riêng nhạc (nút 3 trạng thái: bật hết / chỉ hiệu ứng / tắt).
// - Hiệu ứng tải lần đầu phát (WARM tải sẵn sau thao tác đầu); vòng lặp tải khi cảnh cần. File thiếu / lỗi: im lặng, ghi vào failed, không thử lại.
// - Bảng ánh xạ sự kiện → tiếng (soundsFor) thuần, test được bằng Node.
export const MUTE_KEY = "wgp.muted";
export const MUSIC_KEY = "tbm.music";

/** Hiệu ứng một lần: tên file (không đuôi, đúng tên Codex giao) → âm lượng. */
export const SFX = {
  "bread-slice": .32, "pate-spread": .30, "filling-place": .31, "herb-sprinkle": .29, "soy-squirt": .29,
  "oven-open": .33, "oven-close": .32, "bread-ready": .34, "bread-burnt": .34, "charcoal-crackle": .28,
  "paper-wrap": .31, "plastic-bag": .30, "change-count": .30, cashbox: .31,
  arrival: .30, "voice-happy": .31, "voice-annoyed": .31, "voice-surprised": .31,
  drama: .34, viral: .32, "level-up": .30, mission: .31, "shift-end": .33, error: .30,
};
/** Vòng lặp: music = nhạc (tắt được riêng), còn lại là âm phố / lò (đi theo hiệu ứng). */
export const LOOPS = {
  "prep-music-loop": { gain: .15, music: true },
  "rush-music-loop": { gain: .16, duck: .06, music: true },
  "dawn-street-loop": { gain: .14, duck: .06 },
  "gas-oven-loop": { gain: .09 },
};
/** File có thật trong assets/audio/ (28 file). Tên không có ở đây thì không tải, không phát. */
export const AVAILABLE = new Set([...Object.keys(SFX), ...Object.keys(LOOPS)]);
/** Tải sẵn ngay sau thao tác đầu tiên (mỗi file vài KB). */
export const WARM = ["bread-slice", "pate-spread", "filling-place", "paper-wrap", "cashbox", "bread-ready", "arrival", "error"];
// Khoảng nghỉ tối thiểu giữa hai lần phát cùng tên (ms): bấm liên tục không thành tràng tiếng.
const GAP = { "bread-slice": 200, "pate-spread": 200, "filling-place": 180, "herb-sprinkle": 200, "soy-squirt": 200, "paper-wrap": 150, arrival: 500, error: 400,
  cashbox: 160, "change-count": 300, "bread-ready": 600, "charcoal-crackle": 900, drama: 1200, viral: 1200 };
const VOICE_GAP = 1600; // ba giọng không lời dùng chung một khoảng nghỉ: khách không "nói" chồng lên nhau

// ---------- ánh xạ sự kiện → tiếng (thuần) ----------
const STEP_SOUND = { slice: "bread-slice", spread: "pate-spread", fill: "filling-place", veg: "herb-sprinkle", spice: "soy-squirt" };
const REPLY = { viral: [["viral"]], phot: [["drama"], ["voice-surprised", .25]], annoyed: [["voice-annoyed"]], back: [["voice-happy"]] };
/** Sự kiện từ apply() → danh sách [tên, trễ giây]. Sự kiện không có trong bảng thì im. */
export function soundsFor(e) {
  switch (e?.type) {
    case "step":
      if (e.step === "toast") return e.on ? [["charcoal-crackle"]] : e.burnt ? [["bread-burnt"]] : [["oven-open"]];
      if (e.step === "wrap") return [[e.id === "tui" ? "plastic-bag" : "paper-wrap"]];
      if (e.step === "take") return [["filling-place"]];
      return STEP_SOUND[e.step] && !e.skip && e.on !== false ? [[STEP_SOUND[e.step]]] : [];
    case "arrive": return [["arrival"]];
    case "impatient": return [["voice-annoyed"]];
    case "filled": return [["paper-wrap"]];
    case "batchLoaded": return [["oven-close"]];
    case "batchPulled": return [["oven-open"]];
    case "batchGolden": case "toastReady": case "grillReady": case "eggReady": return [["bread-ready"]];
    case "batchBurnt": case "toastBurnt": case "grillBurnt": return [["bread-burnt"]];
    case "grillLoaded": case "eggFrying": return [["charcoal-crackle"]];
    case "paying": return [["change-count"]];
    case "served": {
      const out = [];
      if (e.price > 0) out.push(["cashbox"]);
      if (e.change) out.push(["change-count", .08]);
      if (e.stars >= 4) out.push(["voice-happy", .3]); else if (e.stars <= 2) out.push(["voice-annoyed", .2]);
      return out.length ? out : [["paper-wrap"]];
    }
    case "complaint": return [["voice-surprised"], ["drama", .2]];
    case "drama": return [["drama"], ["voice-surprised", .2]];
    case "dramaResolved": return [[e.rolled === "lose" ? "voice-annoyed" : e.rolled === "win" ? "viral" : "mission"]];
    case "missionDone": case "missionsAll": case "contractDone": return [["mission"]];
    case "levelUp": case "badge": case "ranked": case "rented": return [["level-up"]];
    case "challengeResult": return [[e.ok ? "level-up" : "voice-annoyed"]];
    case "fair": case "promoted": case "viral": return [["viral"]];
    case "timeout": case "preorderFail": return [["voice-annoyed"]];
    case "consigned": case "exchanged": return [["change-count"]];
    case "bought": case "restocked": case "restockedToday": return [["cashbox"]];
    case "stockout": case "noGas": return [["error"]];
    case "shiftEnded": return [["shift-end"]];
    case "replied": return REPLY[e.outcome] || [];
    default: return [];
  }
}

// ---------- cài đặt ----------
const mem = { muted: false, music: true };
const get = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const put = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
export function isMuted() { const v = get(MUTE_KEY); return v === null ? mem.muted : v === "1"; }
export function musicOn() { const v = get(MUSIC_KEY); return v === null ? mem.music : v !== "0"; }
export function setMuted(value) { mem.muted = !!value; put(MUTE_KEY, mem.muted ? "1" : "0"); refresh(); }
export function setMusic(value) { mem.music = !!value; put(MUSIC_KEY, mem.music ? "1" : "0"); refresh(); }
/** "all" | "sfx" (tắt nhạc) | "off" (wgp.muted). */
export function soundMode() { return isMuted() ? "off" : musicOn() ? "all" : "sfx"; }
/** Nút Tiếng: bật hết → chỉ hiệu ứng → tắt → bật hết. */
export function cycleSoundMode() {
  const m = soundMode();
  if (m === "all") setMusic(false);
  else if (m === "sfx") setMuted(true);
  else { mem.music = true; put(MUSIC_KEY, "1"); setMuted(false); }
  return soundMode();
}

// ---------- phát ----------
const files = new URL("../assets/audio/", import.meta.url);
const exists = (name) => AVAILABLE.has(name);
const decoded = new Map(); // tên → Promise<AudioBuffer|null>
const raw = new Map(); // nhạc: byte MP3 giữ lại để giải mã lại sau khi nhả PCM
const failed = new Set(); // file lỗi: không thử lại liên tục (tránh lặp lỗi mạng trong console)
const loops = new Map(); // tên → { node, gain }
const effects = new Set();
const recent = new Map();
let ctx = null, master = null, scene = "quiet", boiling = false, wanted = new Map();
const stats = { started: 0, loopsStarted: 0, failed };

function bytes(name) {
  if (raw.has(name)) return Promise.resolve(raw.get(name).slice(0));
  return fetch(new URL(name + ".mp3", files)).then((r) => {
    if (!r.ok) throw new Error(String(r.status));
    return r.arrayBuffer();
  }).then((buf) => { if (LOOPS[name]?.music) raw.set(name, buf.slice(0)); return buf; });
}
function load(name) {
  if (failed.has(name) || !ctx || !exists(name)) return Promise.resolve(null);
  if (!decoded.has(name)) {
    decoded.set(name, bytes(name)
      .then((buf) => new Promise((ok, bad) => { const p = ctx.decodeAudioData(buf, ok, bad); if (p?.catch) p.catch(() => {}); }))
      .catch(() => { failed.add(name); decoded.delete(name); return null; }));
  }
  return decoded.get(name);
}

const audible = () => !isMuted() && !(typeof document !== "undefined" && document.hidden);

export function unlockSound() {
  if (!audible()) return;
  if (!ctx) {
    const AC = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return;
    try {
      ctx = new AC();
      master = ctx.createGain();
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -5; limiter.knee.value = 4; limiter.ratio.value = 8;
      master.connect(limiter).connect(ctx.destination);
    } catch { ctx = null; return; }
    for (const n of WARM) void load(n);
  }
  if (ctx.state !== "running") ctx.resume().then(afterResume, () => {}); // trong thao tác người chơi: luôn gọi thẳng
  else refresh();
}
let resuming = false;
function afterResume() { resuming = false; if (ctx.state === "running") refresh(); }
function resume() { if (resuming) return; resuming = true; ctx.resume().then(afterResume, () => { resuming = false; }); }

function refresh() {
  if (!ctx) return;
  const on = audible();
  master.gain.setValueAtTime(on ? 1 : 0, ctx.currentTime);
  if (!on) {
    for (const v of effects) { try { v.stop(); } catch {} }
    effects.clear();
  }
  const next = new Map();
  if (on && ctx.state === "running") {
    const music = musicOn(), duck = scene === "dialog";
    const want = (n) => { const L = LOOPS[n]; if (!L.music || music) next.set(n, duck ? L.duck ?? 0 : L.gain); };
    if (scene === "prep") { want("prep-music-loop"); want("dawn-street-loop"); }
    if (scene === "service" || duck) { want("rush-music-loop"); want("dawn-street-loop"); if (boiling && !duck) want("gas-oven-loop"); }
    for (const n of [...next.keys()]) if (!exists(n)) next.delete(n);
    for (const [n, g] of next) if (!g) next.delete(n);
  }
  wanted = next;
  for (const [name, L] of loops) {
    if (next.has(name)) { L.gain.gain.setTargetAtTime(next.get(name), ctx.currentTime, .06); continue; }
    loops.delete(name);
    L.gain.gain.setTargetAtTime(0, ctx.currentTime, .014);
    try { L.node.stop(ctx.currentTime + .08); } catch {}
    if (LOOPS[name].music) decoded.delete(name); // nhả PCM, giữ byte MP3
  }
  for (const name of next.keys()) {
    if (loops.has(name)) continue;
    void load(name).then((clip) => {
      if (!clip || !wanted.has(name) || loops.has(name) || ctx.state !== "running") return;
      const node = ctx.createBufferSource(), gain = ctx.createGain();
      node.buffer = clip; node.loop = true; gain.gain.value = 0;
      node.connect(gain).connect(master);
      node.onended = () => { node.disconnect(); gain.disconnect(); };
      loops.set(name, { node, gain });
      gain.gain.setTargetAtTime(wanted.get(name), ctx.currentTime, .09);
      node.start(); stats.loopsStarted++;
    });
  }
  // Ẩn tab / tắt tiếng: treo hẳn AudioContext cho đỡ tốn pin; hiện lại thì chạy tiếp (đã có thao tác trước đó).
  if (!on && ctx.state === "running") ctx.suspend().catch(() => {});
  else if (on && ctx.state !== "running" && ctx.state !== "closed") resume();
}

/** mode: "prep" | "service" | "dialog" (hạ âm) | "quiet" (tạm dừng / bảng phủ). Gọi mỗi khung hình được, không đổi thì bỏ qua. */
export function setSoundScene(mode, hasBatch = false) {
  if (scene === mode && boiling === hasBatch) return;
  scene = mode; boiling = hasBatch;
  refresh();
}
export function syncSound() { refresh(); }

/** API chung cho mọi luồng (kể cả luồng hết hàng giữa ca): sfx.play("stock"), play("error")… Tên lạ thì im. */
export function play(name, delay = 0) {
  if (!ctx || !audible() || !Object.hasOwn(SFX, name) || !exists(name)) return false;
  const now = performance.now();
  const voice = name.startsWith("voice-");
  const key = voice ? "voice" : name;
  if (now - (recent.get(key) ?? -Infinity) < (voice ? VOICE_GAP : GAP[name] ?? 150)) return false;
  recent.set(key, now);
  void load(name).then((clip) => {
    if (!clip || ctx.state !== "running" || !audible() || performance.now() - now > 900) return;
    const node = ctx.createBufferSource(), gain = ctx.createGain();
    node.buffer = clip; gain.gain.value = SFX[name];
    node.connect(gain).connect(master);
    effects.add(node);
    node.onended = () => { effects.delete(node); node.disconnect(); gain.disconnect(); };
    node.start(ctx.currentTime + delay); stats.started++;
  });
  return true;
}
/** Phát mọi tiếng của một sự kiện apply(). */
export function playEvent(e) { for (const [n, d] of soundsFor(e)) play(n, d || 0); }

/** Cho test / gỡ lỗi. */
export function soundDebug() { return { ctx: ctx ? ctx.state : null, scene, loops: [...loops.keys()], started: stats.started, loopsStarted: stats.loopsStarted, failed: [...failed] }; }
