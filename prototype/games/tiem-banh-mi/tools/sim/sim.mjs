// Bộ mô phỏng cân bằng Tiệm Bánh Mì: 3 hồ sơ người chơi chơi từng ca bằng luật thật (core/apply.js) tới cấp 20.
// node tools/sim/sim.mjs [--profile careful|average|sloppy|all] [--days N] [--seed N] [--no-write]
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Player } from "./harness.mjs";
import { PROFILES, PROFILE_IDS } from "./profiles.mjs";
import { renderReport } from "./report.mjs";
import { LEVELS } from "../../data/economy.js?v=b8";
import { EQUIPMENT, RANKS, HOUSE_PATE } from "../../data/equipment.js?v=b8";

/** Mục tiêu (PLAYBOOK §6, ECONOMY §11): phút chơi thật tới cấp. */
export const TARGETS = { 4: [7, 14], 7: [30, 50], 10: [100, 140], 20: [600, 720] };

export function runSim(profileId, { days = 260, seed = 12345, untilLevel = 20 } = {}) {
  const P = new Player(PROFILES[profileId], { seed, gameSeed: seed * 7 + 1 });
  P.start();
  const levels = { 1: { minutes: 0, day: 1 } };
  const money = [];
  for (let d = 0; d < days; d++) {
    P.prepDay();
    const rec = P.playShift();
    if (!rec) break;
    money.push({ ...rec, minutesExact: P.clock / 60000, minutes: Math.round(P.clock / 60000) });
    for (let lv = 2; lv <= rec.level; lv++) if (!levels[lv]) levels[lv] = { minutes: Math.round(P.clock / 600) / 100, day: rec.day };
    if (rec.level >= untilLevel && d > 3) break;
  }
  const s = P.s;
  const gearLeft = Object.entries(EQUIPMENT).filter(([id, it]) => !s.owned[id] && !it.consumable && !(id === "awning" && s.shop)).reduce((a, [, it]) => a + it.price, 0);
  const sinkLeft = RANKS.slice(s.rank || 0).reduce((a, r) => a + r.price, 0) + HOUSE_PATE.slice(s.pate || 0).reduce((a, r) => a + r.price, 0);
  return {
    profile: profileId, levels, money, errors: P.errors, log: P.log,
    final: { day: s.day, level: s.level, xp: s.xp, money: s.money, minutes: Math.round(P.clock / 60000), owned: Object.keys(s.owned).length, gearLeft, sinkLeft, rep: Math.round(s.rep), followers: s.followers,
      rating: s.rating, rank: s.rank || 0, pate: s.pate || 0, badges: Object.keys(s.badges || {}).length, shopDay: s.cartMemory?.movedDay || null, fairs: s.fairCount || 0 },
  };
}

export function checkTargets(r) {
  const out = {};
  for (const [lv, [lo, hi]] of Object.entries(TARGETS)) {
    const m = r.levels[lv]?.minutes ?? null;
    out[lv] = { minutes: m, lo, hi, ok: m !== null && m >= lo && m <= hi };
  }
  return out;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
  const which = arg("profile", "all");
  const ids = which === "all" ? PROFILE_IDS : [which];
  const seed = Number(arg("seed", 12345));
  const days = Number(arg("days", 260));
  const results = ids.map((id) => runSim(id, { days, seed }));
  for (const r of results) {
    const t = checkTargets(r);
    console.log(`${r.profile}: ` + Object.entries(t).map(([lv, x]) => `L${lv} ${x.minutes ?? "—"} ph${x.ok ? "" : " (!)"}`).join(" · ") +
      ` | ngày ${r.final.day}, ${r.final.minutes} ph, tiền ${r.final.money}k, hạng ${r.final.rank}/8, pate ${r.final.pate}/3, còn đồ ${r.final.gearLeft}k, lên tiệm ngày ${r.final.shopDay}, ký gửi ${r.log.consign}, hết hàng ${r.log.stockouts}, đóng sớm ${r.log.closed}, kẹt ${r.log.stuck.length}, lỗi ${r.errors.length}`);
    if (r.errors.length) console.log("  lỗi:", JSON.stringify(r.errors.slice(0, 4)));
  }
  if (!process.argv.includes("--no-write")) {
    const dir = dirname(fileURLToPath(import.meta.url));
    writeFileSync(join(dir, "report.md"), renderReport(results, { seed, targets: TARGETS, levels: LEVELS, check: checkTargets }));
    writeFileSync(join(dir, "report.json"), JSON.stringify(results.map((r) => ({ ...r, log: { ...r.log, rejectTypes: undefined }, money: r.money.filter((_, i) => i % 5 === 0) })), null, 1));
  }
}
