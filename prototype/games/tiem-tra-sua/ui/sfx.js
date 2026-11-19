// Bản nhạc và Foley nguyên bản của Tiệm Trà Sữa. Khoá tắt tiếng dùng chung với Lụm Kèo.
export const MUTE_KEY = "wgp.muted";

let muted = false;
export function isMuted() {
  try { return (localStorage.getItem(MUTE_KEY) ?? (muted ? "1" : "0")) === "1"; } catch { return muted; }
}
export function setMuted(value) {
  muted = !!value;
  try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch {}
  refresh();
}

const files = new URL("../assets/audio/", import.meta.url);
const gains = {
  "tea-pour": .36, "milk-pour": .36, syrup: .35, ice: .34, topping: .36, seal: .37,
  cup: .31, paper: .30, handoff: .30, stock: .35, discard: .32, cooking: .34,
  error: .30, decorate: .31, arrival: .30, coin: .31, ready: .34, mission: .31,
  level: .30, open: .29, summary: .33, drama: .34, viral: .32, timeout: .31,
  "drama-good": .30, complaint: .35, "voice-happy": .31, "voice-sorry": .31,
  "voice-surprise": .31,
};
const buffers = new Map();
const loops = new Map();
const effects = new Set();
const recent = new Map();
let context;
let master;
let scene = "quiet";
let boiling = false;
let wantsLoops = new Map();

function buffer(name) {
  if (!buffers.has(name)) {
    buffers.set(name, fetch(new URL(name + ".mp3", files))
      .then((r) => {
        if (!r.ok) throw new Error("Audio " + name + ": " + r.status);
        return r.arrayBuffer();
      })
      .then((data) => context.decodeAudioData(data))
      .catch(() => { buffers.delete(name); return null; }));
  }
  return buffers.get(name);
}

export function unlockSound() {
  if (isMuted() || document.hidden) return;
  if (!context) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      context = new AudioContext();
      master = context.createGain();
      const limiter = context.createDynamicsCompressor();
      limiter.threshold.value = -5;
      limiter.knee.value = 4;
      limiter.ratio.value = 8;
      master.connect(limiter).connect(context.destination);
    } catch { context = null; return; }
    for (const key of ["cup", "tea-pour", "milk-pour", "ice", "seal", "arrival", "coin"]) void buffer(key);
  }
  if (context.state !== "running") void context.resume().then(refresh, () => {});
  else refresh();
}

function refresh() {
  if (!context) return;
  const audible = !isMuted() && !document.hidden;
  master.gain.setValueAtTime(audible ? 1 : 0, context.currentTime);
  if (!audible) {
    for (const voice of effects) voice.stop();
    effects.clear();
  }
  const next = new Map();
  if (audible && context.state === "running") {
    if (scene === "prep") next.set("evening-prep", .15);
    if (scene === "service" || scene === "dialog") {
      next.set("counter-rhythm", scene === "service" ? .17 : .065);
      next.set("shop-loop", scene === "service" ? .15 : .06);
      if (boiling && scene === "service") next.set("boil-loop", .10);
    }
  }
  wantsLoops = next;
  for (const [name, source] of loops) {
    if (!next.has(name)) {
      loops.delete(name);
      source.node.stop(context.currentTime + .06);
      source.gain.gain.setTargetAtTime(0, context.currentTime, .014);
    } else {
      source.gain.gain.setTargetAtTime(next.get(name), context.currentTime, .06);
    }
  }
  for (const [name] of next) {
    if (loops.has(name)) continue;
    void buffer(name).then((clip) => {
      if (!clip || !wantsLoops.has(name) || loops.has(name)) return;
      const node = context.createBufferSource();
      const gain = context.createGain();
      node.buffer = clip;
      node.loop = true;
      gain.gain.value = 0;
      node.connect(gain).connect(master);
      node.onended = () => { node.disconnect(); gain.disconnect(); };
      loops.set(name, { node, gain });
      gain.gain.setTargetAtTime(wantsLoops.get(name), context.currentTime, .09);
      node.start();
    });
  }
}

export function setSoundScene(mode, hasBatch = false) {
  if (scene === mode && boiling === hasBatch) return;
  scene = mode;
  boiling = hasBatch;
  refresh();
}

export function syncSound() { refresh(); }

export function play(name, delay = 0) {
  if (!context || isMuted() || document.hidden || !Object.hasOwn(gains, name)) return;
  const now = performance.now();
  if (now - (recent.get(name) ?? -Infinity) < 155) return;
  recent.set(name, now);
  void buffer(name).then((clip) => {
    if (!clip || context.state !== "running" || isMuted() || document.hidden || performance.now() - now > 900) return;
    const node = context.createBufferSource();
    const gain = context.createGain();
    node.buffer = clip;
    gain.gain.value = gains[name];
    node.connect(gain).connect(master);
    effects.add(node);
    node.onended = () => { effects.delete(node); node.disconnect(); gain.disconnect(); };
    node.start(context.currentTime + delay);
  });
}
