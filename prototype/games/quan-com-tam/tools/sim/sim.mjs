// Bộ mô phỏng cân bằng Quán Cơm Tấm: 3 hồ sơ người chơi chơi từng ngày bằng luật thật (core/apply.js) tới cấp 20.
// node tools/sim/sim.mjs [--profile careful|average|sloppy|all] [--days N] [--seed N] [--no-write]
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Player } from "./harness.mjs";
import { PROFILES, PROFILE_IDS } from "./profiles.mjs";
import { renderReport } from "./report.mjs";
import { LEVELS, GEAR, TIERS, FISH_SAUCE } from "../../data/economy.js?v=c4";

/** Mục tiêu (PLAYBOOK §6, ECONOMY §12): phút chơi thật tới cấp. */
export const TARGETS = { 4: [7, 14], 7: [30, 50], 10: [100, 140], 20: [600, 720] };

export function runSim(profileId, { days = 200, seed = 12345, untilLevel = 20 } = {}) {
  const P = new Player(PROFILES[profileId], { seed, gameSeed: seed * 7 + 1 });
  P.start();
  const levels = { 1: { minutes: 0, day: 1 } };
  const money = [];
  for (let d = 0; d < days; d++) {
    const rec = P.playDay();
    if (!rec) break;
    money.push({ ...rec, minutesExact: P.clock / 60000, minutes: Math.round(P.clock / 60000) });
    for (let lv = 2; lv <= rec.level; lv++) if (!levels[lv]) levels[lv] = { minutes: Math.round(P.clock / 600) / 100, day: rec.day };
    if (rec.level >= untilLevel && d > 3) break;
  }
  const s = P.s;
  const gearLeft = Object.entries(GEAR).filter(([id, it]) => !s.owned[id] && !it.repeat && !(it.street && s.stage === "quan")).reduce((a, [, it]) => a + it.price, 0);
  const sinkLeft = TIERS.slice(s.tier || 0).reduce((a, r) => a + r.price, 0) + FISH_SAUCE.slice(s.fishSauce || 0).reduce((a, r) => a + r.price, 0);
  return {
    profile: profileId, levels, money, errors: P.errors, log: P.log,
    final: { day: s.day, level: s.level, xp: s.xp, money: s.money, minutes: Math.round(P.clock / 60000), owned: Object.keys(s.owned).length, gearLeft, sinkLeft, rep: Math.round(s.rep),
      followers: s.followers, rating: s.rating, tier: s.tier || 0, fishSauce: s.fishSauce || 0, badges: Object.keys(s.badges || {}).length, quanDay: s.streetMemory?.movedDay || null, fairs: s.fair?.count || 0 },
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
  const days = Number(arg("days", 200));
  const results = ids.map((id) => ({ ...runSim(id, { days, seed }), seed }));
  const out = arg("out", null);
  if (out) { writeFileSync(out, JSON.stringify(results.length === 1 ? results[0] : results)); }
  for (const r of results) {
    const t = checkTargets(r);
    const g = r.log;
    console.log(`${r.profile}: ` + Object.entries(t).map(([lv, x]) => `L${lv} ${x.minutes ?? "—"} ph${x.ok ? "" : " (!)"}`).join(" · ") +
      ` | ngày ${r.final.day}, ${r.final.minutes} ph, tiền ${r.final.money}k, hạng ${r.final.tier}/8, mắm ${r.final.fishSauce}/3, còn đồ ${r.final.gearLeft}k, lên quán ngày ${r.final.quanDay}, ký gửi ${g.consign}, hết hàng ${g.stockouts}, kẹt ${g.stuck.length}, bỏ về ${g.walkouts}/${g.guests}, lỗi ${r.errors.length}`);
    if (r.errors.length) console.log("  lỗi:", JSON.stringify(r.errors.slice(0, 4)));
  }
  if (!process.argv.includes("--no-write") && !out) {
    const dir = dirname(fileURLToPath(import.meta.url));
    writeFileSync(join(dir, "report.md"), renderReport(results, { seed, targets: TARGETS, levels: LEVELS, check: checkTargets }));
    writeFileSync(join(dir, "report.json"), JSON.stringify(results.map((r) => ({ ...r, log: { ...r.log, rejectTypes: undefined }, money: r.money.filter((_, i) => i % 5 === 0) })), null, 1));
  }
}
