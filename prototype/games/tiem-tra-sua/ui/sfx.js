// Âm thanh tổng hợp nhẹ (WebAudio, không file). Tôn trọng khoá tắt tiếng chung "wgp.muted" của Lụm Kèo.
export const MUTE_KEY = "wgp.muted";
export function isMuted() { try { return localStorage.getItem(MUTE_KEY) === "1"; } catch { return false; } }
export function setMuted(m) { try { localStorage.setItem(MUTE_KEY, m ? "1" : "0"); } catch {} }

let ac = null;
function ctx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ac) { try { ac = new AC(); } catch { return null; } }
  if (ac.state === "suspended") ac.resume().catch(() => {});
  return ac;
}
function tone(f0, f1, dur, vol, type = "sine", delay = 0) {
  const a = ctx(); if (!a) return;
  const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.03);
}
const S = {
  pour: () => { tone(380, 240, 0.22, 0.05, "triangle"); tone(520, 300, 0.18, 0.03, "sine", 0.05); },
  ice: () => { tone(1800, 1200, 0.05, 0.05, "square"); tone(2100, 1500, 0.05, 0.04, "square", 0.07); tone(1600, 1100, 0.05, 0.04, "square", 0.13); },
  plop: () => { tone(300, 120, 0.1, 0.07, "sine"); tone(260, 110, 0.1, 0.06, "sine", 0.08); },
  seal: () => { tone(900, 300, 0.06, 0.08, "square"); tone(160, 90, 0.12, 0.09, "triangle", 0.05); },
  coin: () => { tone(988, 988, 0.08, 0.06, "square"); tone(1319, 1319, 0.16, 0.06, "square", 0.08); },
  bell: () => { tone(1568, 1500, 0.3, 0.05, "sine"); tone(2093, 2000, 0.25, 0.03, "sine", 0.02); },
  sad: () => { tone(440, 330, 0.18, 0.06, "triangle"); tone(330, 220, 0.25, 0.06, "triangle", 0.16); },
  level: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.12, 0.05, "square", i * 0.09)); },
  error: () => tone(200, 150, 0.12, 0.06, "square"),
};
export function play(name) { if (isMuted() || !S[name]) return; try { S[name](); } catch {} }
