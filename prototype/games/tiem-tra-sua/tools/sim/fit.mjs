// Dò đường cong XP: chạy hồ sơ "average" với bảng cấp hiện tại (sửa tạm trong bộ nhớ), đo XP tích luỹ theo phút chơi,
// rồi đặt XP mỗi cấp = XP mà người chơi trung bình có ở phút mục tiêu của cấp đó. Lặp vài vòng vì mở khoá theo cấp đổi tốc độ XP.
// node tools/sim/fit.mjs  ⇒ in bảng XP đề xuất (chép vào data/levels.js).
// cùng bản mô-đun mà core/progression.js nạp (tag ?v=), sửa tạm trong bộ nhớ có hiệu lực với luật
import { LEVELS } from "../../data/levels.js?v=m37";
import { runSim } from "./sim.mjs";

/** Phút chơi mục tiêu tới từng cấp (PLAYBOOK §6: 4 ≈ 10, 7 ≈ 40, 10 ≈ 120, 20 ≈ 660). */
export const TARGET_MIN = [0, 0, 3, 6, 10, 18, 28, 40, 62, 88, 120, 142, 169, 200, 237, 282, 334, 397, 470, 558, 660];

function xpAtMinute(samples, m) {
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1], b = samples[i];
    if (b.minutes >= m) return a.xp + ((b.xp - a.xp) * (m - a.minutes)) / Math.max(1e-6, b.minutes - a.minutes);
  }
  const z = samples.at(-1), y = samples.at(-6) || samples[0];
  return z.xp + ((z.xp - y.xp) / Math.max(1e-6, z.minutes - y.minutes)) * (m - z.minutes);
}

export function fit(rounds = 4, profiles = ["average"], seeds = [12345, 777]) {
  for (let k = 0; k < rounds; k++) {
    const curves = [];
    for (const p of profiles) for (const seed of seeds) {
      const r = runSim(p, { days: 400, seed, untilLevel: 21 - 1 });
      curves.push([{ minutes: 0, xp: 0 }, ...r.money.map((d) => ({ minutes: d.minutesExact, xp: d.xp }))]);
    }
    const next = TARGET_MIN.map((m, lv) => (lv < 2 ? 0 : Math.round(curves.reduce((a, c) => a + xpAtMinute(c, m), 0) / curves.length / 5) * 5));
    for (let lv = 2; lv <= 20; lv++) LEVELS[lv - 1].xp = Math.max(next[lv], LEVELS[lv - 2].xp + 20);
    console.log(`vòng ${k + 1}:`, LEVELS.map((L) => L.xp).join(", "));
  }
  return LEVELS.map((L) => L.xp);
}

if (process.argv[1]?.endsWith("fit.mjs")) fit(Number(process.argv[2] || 4));
