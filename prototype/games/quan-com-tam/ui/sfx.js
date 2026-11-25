// Âm thanh Quán Cơm Tấm — cùng API và cách làm như Tiệm Bánh Mì (ui/sfx.js của Bánh Mì).
// - Bộ tiếng gốc của Codex (codex/com-tam-audio, d59b277): 32 MP3 trong assets/audio/, danh sách ở docs/quan-com-tam/ASSET-HANDOFF.md.
// - Chỉ tạo AudioContext sau thao tác người chơi (unlockSound gọi từ pointerdown / keydown). Trước đó không tải byte nào.
// - wgp.muted (dùng chung Lụm Kèo) là công tắc tổng; qct.music = "0" tắt riêng nhạc (nút 3 trạng thái: bật hết / chỉ hiệu ứng / tắt).
// - Hiệu ứng tải lần đầu phát (WARM tải sẵn sau thao tác đầu); vòng lặp tải khi cảnh cần. File thiếu / lỗi: im lặng, ghi vào failed, không thử lại.
// - Vòng lặp: phố đêm ven sông (chuẩn bị + trong ca), bếp than (chỉ khi bếp đang nhóm), nhạc chuẩn bị / nhạc cao điểm, quán đông (≥ 3 bàn có khách).
// - Bảng ánh xạ sự kiện → tiếng (soundsFor) thuần, test được bằng Node.
export const MUTE_KEY = "wgp.muted";
export const MUSIC_KEY = "qct.music";

/** Hiệu ứng một lần: tên file (không đuôi, đúng tên Codex giao) → âm lượng. */
export const SFX = {
  "pork-sizzle": .30, "pork-flip": .30, "charcoal-crackle": .26, "fan-flap": .24, "charcoal-add": .30,
  "rice-ready": .30, "rice-scoop": .27, "scallion-ladle": .27, "fish-sauce-pour": .27,
  "plate-set": .29, "iced-tea-pour": .28, "table-wipe": .27, "plates-stack": .28, "plates-wash": .28,
  "bill-key": .26, "cash-paper": .30,
  arrival: .29, "voice-call": .30, "voice-happy": .30, "voice-annoyed": .30, "voice-surprised": .30,
  drama: .33, viral: .31, "level-up": .30, mission: .30, "shift-end": .32, error: .28,
  "chair-scrape": .28, marinate: .28, // Codex 11/2026: mời khách ngồi (kéo ghế nhựa), ướp sườn
};
/** Vòng lặp: music = nhạc (tắt được riêng), còn lại là âm phố / bếp / quán (đi theo hiệu ứng). duck = âm lượng khi hội thoại mở. */
export const LOOPS = {
  "prep-music-loop": { gain: .15, music: true },
  "rush-music-loop": { gain: .15, duck: .05, music: true },
  "riverside-night-loop": { gain: .13, duck: .06 },
  "charcoal-grill-loop": { gain: .10 },
  "busy-dining-loop": { gain: .10, duck: .04 },
};
/** File có thật trong assets/audio/ (34 file). Tên không có ở đây thì không tải, không phát. */
export const AVAILABLE = new Set([...Object.keys(SFX), ...Object.keys(LOOPS)]);
/** Tải sẵn ngay sau thao tác đầu tiên (mỗi file vài KB). */
export const WARM = ["pork-sizzle", "pork-flip", "plate-set", "rice-scoop", "cash-paper", "arrival", "error"];
// Khoảng nghỉ tối thiểu giữa hai lần phát cùng tên (ms): bấm / sự kiện dồn dập không thành tràng tiếng.
const GAP = { "pork-sizzle": 260, "pork-flip": 150, "charcoal-crackle": 900, "fan-flap": 380, "charcoal-add": 300, "rice-ready": 500, "rice-scoop": 150,
  "scallion-ladle": 200, "fish-sauce-pour": 300, "plate-set": 120, "iced-tea-pour": 450, "table-wipe": 450, "plates-stack": 300, "plates-wash": 900,
  "bill-key": 110, "cash-paper": 220, arrival: 500, error: 400, drama: 1200, viral: 1200, mission: 600, "level-up": 800 };
const VOICE_GAP = 1600; // giọng không lời dùng chung một khoảng nghỉ: khách không "nói" chồng lên nhau

// ---------- ánh xạ sự kiện → tiếng (thuần) ----------
const LAYER = { dia: "plate-set", hop: "plate-set", com: "rice-scoop", moHanh: "scallion-ladle", hanhPhi: "scallion-ladle", sauce: "fish-sauce-pour", meat: "pork-flip" };
const REPLY = { viral: [["viral"]], phot: [["drama"], ["voice-surprised", .25]], annoyed: [["voice-annoyed"]], back: [["voice-happy"]] };
/** Sự kiện từ apply() → danh sách [tên, trễ giây]. Sự kiện không có trong bảng thì im. */
export function soundsFor(e) {
  switch (e?.type) {
    // bếp than
    case "flip": return e.perfect ? [["pork-flip"], ["pork-sizzle", .05]] : [["pork-flip"]];
    case "placed": case "eggFrying": return [["pork-sizzle"]];
    case "sideDone": return e.both ? [["pork-sizzle"]] : [];
    case "nearBurn": case "flare": return [["charcoal-crackle"]];
    case "burnt": return [["charcoal-crackle"], ["error", .15]];
    case "coalAdded": return [["charcoal-add"]];
    case "lit": return [["charcoal-add"], ["charcoal-crackle", .35]];
    case "fan": case "blower": return [["fan-flap"]];
    case "coalOut": return [["error"]];
    // nồi cơm, bày dĩa
    case "riceCooking": return [["rice-ready"]];
    case "riceReady": return e.prep ? [] : [["rice-ready"]];
    case "chaReady": return [["rice-ready"]];
    case "moHanhReady": return [["scallion-ladle"]];
    case "layer": return [[LAYER[e.id] || "rice-scoop"]];
    case "discarded": return [["plates-stack"]];
    case "plateDropped": return [["plates-stack"], ["error", .1]];
    // bàn
    case "teaPoured": return [["iced-tea-pour"]];
    case "extraServed": return [[e.kind === "com" ? "rice-scoop" : "plate-set"]];
    case "cleaned": return e.plates > 0 ? [["plates-stack"], ["table-wipe", .2]] : [["table-wipe"]];
    case "washed": return [["plates-wash"]];
    case "delivered": return e.mistakes?.length ? [["plate-set"], ["voice-annoyed", .3]] : [["plate-set"]];
    case "billOpen": case "ghiSo": return [["bill-key"]];
    case "paid": case "debtPaid": return [["bill-key"], ["cash-paper", .12]];
    // khách
    case "arrive": return [["arrival"]];
    case "seated": return [["chair-scrape"]];
    case "marinated": return [["marinate"]];
    case "request": case "billCall": case "noTea": return [["voice-call"]];
    case "groupDone": return e.stars >= 4 ? [["voice-happy", .2]] : e.stars <= 2 ? [["voice-annoyed", .2]] : [];
    case "timeout": case "orderLate": return [["voice-annoyed"]];
    case "complaint": case "overcharge": return [["voice-surprised"], ["drama", .2]];
    // sự kiện, tiến trình
    case "drama": return [["drama"], ["voice-surprised", .2]];
    case "dramaResolved": return [[e.rolled === "lose" ? "voice-annoyed" : e.rolled === "win" ? "viral" : "mission"]];
    case "missionDone": case "orderDone": case "newDish": return [["mission"]];
    case "levelUp": case "rented": case "tier": case "badge": return [["level-up"]];
    case "fair": return [["viral"]];
    case "promoted": return [[e.roll === "flop" ? "voice-annoyed" : e.roll === "viral" || !e.roll ? "viral" : "mission"]];
    case "replied": return REPLY[e.outcome] || [];
    case "stockout": return [["error"]];
    case "restocked": case "restockedToday": case "bought": case "consigned": case "staff": case "fishSauce": return [["cash-paper"]];
    case "decorPlaced": return [["plate-set"]];
    case "shiftEnded": return [["shift-end"]];
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
const failed = new Set(); // file lỗi: không thử lại (tránh lặp lỗi mạng trong console)
const loops = new Map(); // tên → { node, gain }
const effects = new Set();
const recent = new Map();
let ctx = null, master = null, scene = "quiet", grillOn = false, busy = false, wanted = new Map();
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

/** Vòng lặp cần cho cảnh hiện tại: tên → âm lượng (thuần, test được). */
export function loopsFor(mode, { grill = false, busy: crowd = false, music = true } = {}) {
  const next = new Map(), duck = mode === "dialog";
  const want = (n) => { const L = LOOPS[n]; if (L.music && !music) return; const g = duck ? L.duck ?? 0 : L.gain; if (g) next.set(n, g); };
  if (mode === "prep") { want("prep-music-loop"); want("riverside-night-loop"); if (grill) want("charcoal-grill-loop"); }
  if (mode === "service" || duck) { want("rush-music-loop"); want("riverside-night-loop"); if (grill) want("charcoal-grill-loop"); if (crowd) want("busy-dining-loop"); }
  return next;
}

function refresh() {
  if (!ctx) return;
  const on = audible();
  master.gain.setValueAtTime(on ? 1 : 0, ctx.currentTime);
  if (!on) {
    for (const v of effects) { try { v.stop(); } catch {} }
    effects.clear();
  }
  let next = new Map();
  if (on && ctx.state === "running") {
    next = loopsFor(scene, { grill: grillOn, busy, music: musicOn() });
    for (const n of [...next.keys()]) if (!exists(n) || failed.has(n)) next.delete(n);
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

/** mode: "prep" | "service" | "dialog" (hạ âm) | "quiet" (tạm dừng / bảng phủ). opts: { grill: bếp đang nhóm, busy: ≥ 3 bàn có khách }
 *  (boolean cũ = grill). Gọi mỗi khung hình được, không đổi thì bỏ qua. */
export function setSoundScene(mode, opts = {}) {
  const g = typeof opts === "boolean" ? opts : !!opts.grill, b = typeof opts === "object" && !!opts.busy;
  if (scene === mode && grillOn === g && busy === b) return;
  scene = mode; grillOn = g; busy = b;
  refresh();
}
export function syncSound() { refresh(); }

/** API chung cho mọi luồng: sfx.play("cash-paper"), play("error")… Tên lạ thì im. */
export function play(name, delay = 0) {
  if (!ctx || !audible() || !Object.hasOwn(SFX, name) || !exists(name) || failed.has(name)) return false;
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
export function soundDebug() { return { ctx: ctx ? ctx.state : null, scene, grill: grillOn, busy, loops: [...loops.keys()], started: stats.started, loopsStarted: stats.loopsStarted, failed: [...failed] }; }
