// Dò đường cong XP (chép Bánh Mì tools/sim/fit.mjs): chạy hồ sơ "average" với bảng cấp hiện tại (sửa tạm trong bộ nhớ), đo XP tích luỹ
// theo phút chơi, rồi đặt XP mỗi cấp = XP người chơi trung bình có ở phút mục tiêu của cấp đó. Lặp vài vòng vì mở khoá theo cấp đổi tốc độ XP.
// node tools/sim/fit.mjs [vòng] [seed,seed]  ⇒ in bảng XP đề xuất (chép vào data/economy.js LEVELS; đổi bảng thì nâng bản lưu qua rescaleXp giữ cấp + %).
import { LEVELS } from "../../data/economy.js?v=c10";
import { runSim } from "./sim.mjs";

/** Phút chơi mục tiêu tới từng cấp (PLAYBOOK §6: 4 ≈ 10, 7 ≈ 40, 10 ≈ 120, 20 ≈ 660). */
export const TARGET_MIN = [0, 0, 4, 7, 10, 18, 28, 40, 62, 88, 120, 142, 169, 200, 237, 282, 334, 397, 470, 558, 660];

function xpAtMinute(samples, m) {
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1], b = samples[i];
    if (b.minutes >= m) return a.xp + ((b.xp - a.xp) * (m - a.minutes)) / Math.max(1e-6, b.minutes - a.minutes);
  }
  const z = samples.at(-1), y = samples.at(-6) || samples[0];
  return z.xp + ((z.xp - y.xp) / Math.max(1e-6, z.minutes - y.minutes)) * (m - z.minutes);
}

export function fit(rounds = 3, profiles = ["average"], seeds = [12345]) {
  for (let k = 0; k < rounds; k++) {
    const curves = [];
    for (const p of profiles) for (const seed of seeds) {
      const r = runSim(p, { days: 160, seed, untilLevel: 21 });
      curves.push([{ minutes: 0, xp: 0 }, ...r.money.map((d) => ({ minutes: d.minutesExact, xp: d.xp }))]);
    }
    const nx = TARGET_MIN.map((m, lv) => (lv < 2 ? 0 : Math.round(curves.reduce((a, c) => a + xpAtMinute(c, m), 0) / curves.length / 5) * 5));
    for (let lv = 2; lv <= 20; lv++) LEVELS[lv - 1] = Math.max(nx[lv], LEVELS[lv - 2] + 20);
    console.log(`vòng ${k + 1}:`, LEVELS.join(", "));
  }
  return [...LEVELS];
}

if (process.argv[1]?.endsWith("fit.mjs")) fit(Number(process.argv[2] || 3), ["average"], (process.argv[3] || "12345").split(",").map(Number));
