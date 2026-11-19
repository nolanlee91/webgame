#!/usr/bin/env node
// Bộ mô phỏng cân bằng Nông Trại 2.0 (offline, thời gian giả lập — không chờ giờ thật).
//   node tools/sim/sim.mjs --profile cham --days 7          (một hồ sơ)
//   node tools/sim/sim.mjs --profile all --days 7           (cả 3 hồ sơ, mặc định) ⇒ ghi report.md + report.json
// Tuỳ chọn: --seed N (mặc định 12345) · --no-write (chỉ in tóm tắt) · --no-fit (bỏ dò đường cong XP) · --out <thư mục>
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Farm, totalXp, xpNeed } from "./harness.mjs";
import { tick } from "./policy.mjs";
import { PROFILES, PROFILE_IDS, ALIASES, sessionTimeline } from "./profiles.mjs";
import { analyse, fitXpCurve, CROP_XP_TWEAK } from "./analysis.mjs";
import { CROP } from "./harness.mjs";
import { renderReport } from "./report.mjs";

export const T0 = Date.UTC(2026, 10, 2, 0, 0, 0); // mốc 0:00 ngày 1 (chỉ để hàm giá chợ có thời gian tất định)
export const STALL_MIN = 5; // chuỗi "không có gì để làm" dài hơn X phút chơi ⇒ ghi là khựng
export const MAX_LEVEL = 20;

/** Chạy 1 hồ sơ. Trả kết quả thô (đã gồm mẫu đường cong, mốc cấp, nguồn thu, khựng ...). */
export function runSim(profileId, { days = 7, seed = 12345, xpNeed = null, stopAtLevel = Infinity } = {}) {
  const profile = PROFILES[profileId];
  if (!profile) throw new Error(`hồ sơ lạ: ${profileId} (có: ${PROFILE_IDS.join(", ")})`);
  const sessions = sessionTimeline(profile, days, T0);
  const firstStart = sessions[0].start;
  const f = new Farm(firstStart, seed, { xpNeed });
  const checkMs = profile.checkSec * 1000;
  let active = 0; // ms chơi tích luỹ
  const levels = { 1: { real: 0, active: 0 } };
  const samples = [];
  const stalls = [];      // { startReal, startActive, minutes, level, coins, reason }
  let idleRun = null;
  let idleMs = 0, blockedMs = 0, brokeMs = 0;
  const reasons = {};
  const waits = []; let saveRun = null;
  const perDay = [];
  let dayEarned = 0, dayActive = 0, lastDay = 0;
  const sample = (t) => samples.push({ realH: +((t - firstStart) / 3600_000).toFixed(3), activeMin: +(active / 60_000).toFixed(1),
    level: f.s.level, xp: f.xpTotal(), coins: f.s.coins, earned: f.s.stats.earned,
    income: { ...f.income }, plots: f.s.plots.filter((p) => p.open).length, animals: f.s.animals.list.length });

  for (let k = 0; k < sessions.length && f.s.level < stopAtLevel; k++) {
    const ses = sessions[k];
    const nextStart = sessions[k + 1]?.start ?? ses.end + 12 * 3600_000;
    const lastCheck = ses.start + Math.floor((ses.end - ses.start - 1) / checkMs) * checkMs;
    const day = Math.floor((ses.start - T0) / 86_400_000);
    if (day !== lastDay) { perDay.push({ day: lastDay + 1, earned: dayEarned, activeMin: dayActive / 60_000, level: f.s.level }); dayEarned = 0; dayActive = 0; lastDay = day; }
    for (let t = ses.start; t <= lastCheck; t += checkMs) {
      const earnedBefore = f.s.stats.earned, lvBefore = f.s.level;
      f.clock = active;
      f.taps = Math.round(profile.tapsPerMin * profile.checkSec / 60);
      const info = tick(f, t, { checkMs, lastCheck, nextStart, activeClock: active });
      active += checkMs; dayActive += checkMs;
      dayEarned += f.s.stats.earned - earnedBefore;
      for (let L = lvBefore + 1; L <= f.s.level; L++) levels[L] = { real: t - firstStart, active: active - checkMs }; // thời điểm của lần nhìn này
      // khựng: không có hành động có ích nào trong lần nhìn này
      if (info.useful === 0) {
        idleMs += checkMs;
        idleRun ||= { startReal: t - firstStart, startActive: active - checkMs, ms: 0, level: f.s.level, coins: f.s.coins };
        idleRun.ms += checkMs;
      } else if (idleRun) { if (idleRun.ms > STALL_MIN * 60_000) stalls.push(closeRun(idleRun, f)); idleRun = null; }
      if (info.blocked) { blockedMs += checkMs; reasons[info.blocked] = (reasons[info.blocked] || 0) + 1; }
      // chờ gom xu cho một mục lớn (cùng mục liên tục) ⇒ "khựng tiến trình"
      if (f.savingFor && saveRun?.key === f.savingFor) saveRun.ms += checkMs;
      else { if (saveRun && saveRun.ms > STALL_MIN * 60_000) waits.push(closeWait(saveRun)); saveRun = f.savingFor ? { key: f.savingFor, startActive: active - checkMs, startReal: t - firstStart, ms: checkMs, level: f.s.level } : null; }
      if (info.broke) { brokeMs += checkMs; reasons.broke = (reasons.broke || 0) + 1; }
    }
    if (idleRun) { if (idleRun.ms > STALL_MIN * 60_000) stalls.push(closeRun(idleRun, f)); idleRun = null; } // hết phiên ⇒ cắt chuỗi
    sample(ses.end);
  }
  perDay.push({ day: lastDay + 1, earned: dayEarned, activeMin: dayActive / 60_000, level: f.s.level });
  if (saveRun && saveRun.ms > STALL_MIN * 60_000) waits.push(closeWait(saveRun));

  return {
    profile: { id: profile.id, name: profile.name, desc: profile.desc, checkSec: profile.checkSec },
    days, seed,
    final: { level: f.s.level, xp: f.xpTotal(), coins: f.s.coins, earned: f.s.stats.earned, delivered: f.s.stats.delivered,
      harvested: f.s.stats.harvested, plots: f.s.plots.filter((p) => p.open).length, animals: { ...countAnimals(f) },
      machines: Object.fromEntries(Object.entries(f.s.production.machines).map(([id, m]) => [id, m.level])),
      buildings: Object.fromEntries(Object.entries(f.s.buildings).map(([id, b]) => [id, b.level])),
      warehouseCap: f.cap(), questIndex: f.s.quests.tut, villageProg: f.s.village.prog.i,
      chains: Object.fromEntries(Object.entries(f.s.village.chains).map(([id, c]) => [id, c.step])),
      inv: { ...f.s.inv }, savingFor: f.savingFor },
    activeMin: active / 60_000,
    levels, samples, perDay,
    income: { ...f.income }, spend: { ...f.spend }, counts: { ...f.counts }, xpBy: { ...f.xpBy },
    firsts: Object.fromEntries(Object.entries(f.firsts).map(([k, v]) => [k, { real: v.t - firstStart, active: v.a }])),
    waits, stalls, idleMin: idleMs / 60_000, blockedMin: blockedMs / 60_000, brokeMin: brokeMs / 60_000, reasons,
    errors: f.errors, gifts: f.eventLog.filter((e) => e.type === "gift").length,
  };
}

function closeRun(run, f) {
  return { startRealH: +(run.startReal / 3600_000).toFixed(2), startActiveMin: +(run.startActive / 60_000).toFixed(1),
    minutes: run.ms / 60_000, level: run.level, coins: run.coins, savingFor: f.savingFor };
}
function closeWait(w) {
  return { key: w.key, startActiveMin: +(w.startActive / 60_000).toFixed(1), startRealH: +(w.startReal / 3600_000).toFixed(2), minutes: w.ms / 60_000, level: w.level };
}
function countAnimals(f) { const c = { ga: 0, bo: 0 }; for (const a of f.s.animals.list) c[a.kind]++; return c; }

// ---------------- CLI ----------------
function parseArgs(argv) {
  const a = { profile: "all", days: 7, seed: 12345, write: true, fit: true, out: dirname(fileURLToPath(import.meta.url)) };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--profile") a.profile = argv[++i];
    else if (k === "--days") a.days = Number(argv[++i]);
    else if (k === "--seed") a.seed = Number(argv[++i]);
    else if (k === "--no-write") a.write = false;
    else if (k === "--no-fit") a.fit = false;
    else if (k === "--out") a.out = argv[++i];
  }
  a.profile = ALIASES[a.profile] || a.profile;
  return a;
}

const fmtMin = (m) => (m === undefined ? "—" : m < 90 ? `${m.toFixed(0)} ph` : `${(m / 60).toFixed(1)} h`);

/** Đổi tạm XP cây trong bộ nhớ (không sửa file), chạy fn, rồi trả lại như cũ. */
export function withCropXp(tweak, fn) {
  const old = {};
  for (const [id, x] of Object.entries(tweak)) { old[id] = CROP[id].xp; CROP[id].xp = x; }
  try { return fn(); } finally { for (const [id, x] of Object.entries(old)) CROP[id].xp = x; }
}
const levelSummary = (r) => Object.fromEntries([4, 7, 10, 20].map((L) => [L, r.levels[L] ? { activeMin: +(r.levels[L].active / 60_000).toFixed(1), realH: +(r.levels[L].real / 3600_000).toFixed(2) } : null]));

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const ids = args.profile === "all" ? PROFILE_IDS : [args.profile];
  const t = Date.now();
  const results = ids.map((id) => runSim(id, { days: args.days, seed: args.seed }));
  const extra = {};
  if (args.fit) {
    extra.fit = fitXpCurve(runSim);
    const { a, b } = extra.fit.best;
    const curve = (lv) => Math.round(a * lv ** b);
    // kiểm lại: đường cong đề xuất trên mọi hồ sơ (7 ngày), và thêm XP cây đề xuất
    extra.fitRuns = ids.map((id) => {
      const r = runSim(id, { days: args.days, seed: args.seed, xpNeed: curve });
      const r2 = withCropXp(CROP_XP_TWEAK, () => runSim(id, { days: args.days, seed: args.seed, xpNeed: curve }));
      return { profile: id, curve: { a, b }, levels: levelSummary(r), final: { level: r.final.level, coins: r.final.coins },
        withCropXp: { levels: levelSummary(r2), final: { level: r2.final.level, coins: r2.final.coins } },
        firsts: Object.fromEntries(["built:xuong@1", "built:chuong-ga@1", "built:nha-kinh@1", "built:dat-phia-dong@1"].map((k) => [k, r.firsts[k] ? +(r.firsts[k].active / 60_000).toFixed(1) : null])) };
    });
  }
  const elapsed = (Date.now() - t) / 1000;
  const analysis = analyse(results, extra);
  for (const r of results) {
    const L = (n) => r.levels[n];
    console.log(`${r.profile.name.padEnd(14)} cấp ${String(r.final.level).padStart(3)} sau ${r.days} ngày · chơi ${fmtMin(r.activeMin)} · ` +
      [4, 7, 10, 20].map((n) => `L${n}: ${L(n) ? fmtMin(L(n).active / 60_000) + " chơi / " + fmtMin(L(n).real / 60_000) + " thật" : "—"}`).join(" · ") +
      (r.errors.length ? ` · LỖI BẤT BIẾN ${r.errors.length}` : ""));
  }
  if (extra.fit) console.log(`đường cong XP hợp mục tiêu nhất: ${extra.fit.best.a} · lv^${extra.fit.best.b} ⇒ chăm L4/7/10/20 = ${Object.values(extra.fit.best.got).join(" / ")} ph chơi`);
  console.log(`(${elapsed.toFixed(1)} s)`);
  if (args.write) {
    const json = { generated: new Date().toISOString(), days: args.days, seed: args.seed, elapsedSec: elapsed, results, analysis };
    writeFileSync(join(args.out, "report.json"), JSON.stringify(json, null, 1));
    writeFileSync(join(args.out, "report.md"), renderReport(json));
    console.log(`đã ghi ${join(args.out, "report.md")} + report.json`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main().catch((e) => { console.error(e); process.exit(1); });

export { xpNeed };
