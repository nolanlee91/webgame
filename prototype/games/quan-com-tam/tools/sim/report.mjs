// Kết xuất report.md cho bộ mô phỏng cân bằng Quán Cơm Tấm (khung Bánh Mì tools/sim/report.mjs).
// Gộp kết quả chạy song song: node tools/sim/report.mjs careful.json average.json sloppy.json  (mỗi file do sim.mjs --profile X --out X.json ghi).
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
export function renderReport(results, { seed, targets, levels, check, before = null }) {
  const L = [];
  L.push("# Báo cáo cân bằng Quán Cơm Tấm (bộ mô phỏng)", "");
  L.push(`Sinh bởi \`node tools/sim/sim.mjs\` (seed ${seed}). Thời gian = phút chơi thật: thời gian ca (đồng hồ chạy theo thao tác, cô chủ đi bộ trong cảnh) + hội thoại + Chuẩn bị (đầu ngày, giữa hai ca) + Chốt ca.`, "");
  L.push(`Bảng XP: ${levels.join(", ")}.`, "");
  L.push("## Mốc cấp (phút chơi)", "");
  L.push("| Cấp | Mục tiêu | " + results.map((r) => r.profile).join(" | ") + " |", "|---|---|" + results.map(() => "---|").join(""));
  for (let lv = 2; lv <= 20; lv++) {
    const tg = targets[lv] ? `${targets[lv][0]}–${targets[lv][1]}` : "";
    L.push(`| ${lv} | ${tg} | ` + results.map((r) => { const x = r.levels[lv]; return x ? `${x.minutes} (ngày ${x.day})` : "—"; }).join(" | ") + " |");
  }
  L.push("", "## Đạt mục tiêu", "");
  for (const r of results) L.push(`- **${r.profile}**: ` + Object.entries(check(r)).map(([lv, x]) => `cấp ${lv} ${x.minutes ?? "—"} ph ${x.ok ? "đạt" : "LỆCH"}`).join(", "));
  L.push("", "## Tiền theo ngày (mỗi 10 ngày)", "");
  L.push("| Ngày | " + results.map((r) => `${r.profile} tiền · lời ngày · dĩa/khách · cấp`).join(" | ") + " |", "|---|" + results.map(() => "---|").join(""));
  const maxD = Math.max(...results.map((r) => r.money.length));
  for (let i = 0; i < maxD; i += 10) {
    L.push(`| ${i + 1} | ` + results.map((r) => { const m = r.money[i]; return m ? `${m.money}k · ${m.profit}k · ${m.plates}/${m.guests} · ${m.level}` : "—"; }).join(" | ") + " |");
  }
  L.push("", "## Lời vận hành trung bình theo giai đoạn (k / ngày)", "");
  const band = (r, lo, hi, k = "profit") => { const xs = r.money.filter((m) => m.level >= lo && m.level <= hi); return xs.length ? Math.round(xs.reduce((a, m) => a + m[k], 0) / xs.length) : "—"; };
  L.push("| Hồ sơ | ngày 1 | cấp 1–4 | cấp 5–6 | cấp 7–9 | cấp 10–14 | cấp 15–19 | cấp 20 | dĩa/ngày cấp 10 | dĩa/ngày cấp 20 |", "|---|---|---|---|---|---|---|---|---|---|");
  for (const r of results) L.push(`| ${r.profile} | ${r.money[0]?.profit ?? "—"}k | ${band(r, 1, 4)}k | ${band(r, 5, 6)}k | ${band(r, 7, 9)}k | ${band(r, 10, 14)}k | ${band(r, 15, 19)}k | ${band(r, 20, 20)}k | ${band(r, 10, 10, "plates")} | ${band(r, 20, 20, "plates")} |`);
  L.push("", "## Tổng kết", "");
  L.push("| Hồ sơ | Ngày | Phút | Cấp | Tiền cuối | Lên quán (ngày) | Hạng quán | Nước mắm | Đồ chưa mua | Chỗ tiêu còn lại | Ký gửi | Hết hàng giữa ca | Kẹt | Lỗi luật | Hội chợ | Thử thách (đạt) | Huy hiệu |",
    "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of results) {
    const f = r.final, g = r.log;
    L.push(`| ${r.profile} | ${f.day} | ${f.minutes} | ${f.level} | ${f.money}k | ${f.quanDay ?? "—"} | ${f.tier}/8 | ${f.fishSauce}/3 | ${f.gearLeft}k | ${f.sinkLeft}k | ${g.consign} | ${g.stockouts} | ${g.stuck.length} | ${r.errors.length} | ${g.fair} | ${g.challenge} (${g.challengeWin}) | ${f.badges} |`);
  }
  L.push("", "## Khách bỏ về, hao hụt", "");
  for (const r of results) {
    const xs = r.money, g = r.log;
    const plates = xs.reduce((a, m) => a + m.plates, 0), burnt = xs.reduce((a, m) => a + (m.burnt || 0), 0);
    L.push(`- **${r.profile}**: bỏ về ${g.walkouts}/${g.guests} khách (${pct(g.walkouts, g.guests)}%), đi ngang (cửa đầy) ${xs.reduce((a, m) => a + (m.passed || 0), 0)}; cháy đen ${burnt} miếng / ${plates} dĩa (${pct(burnt, plates + burnt)}%), hao TB ${Math.round(xs.reduce((a, m) => a + m.waste, 0) / Math.max(1, xs.length))}k/ngày; vòng lặp kẹt thao tác ${g.loops || 0}.`);
  }
  L.push("", "Kẹt = đầu ngày không đủ tiền + hàng làm một dĩa cơm sườn mà không có gói ký gửi. Lỗi luật = action ném lỗi / bất biến hỏng / ca không kết thúc.", "");
  if (before) L.push("## Trước cân bằng M5", "", before, "");
  return L.join("\n") + "\n";
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  // (không import sim.mjs: sim.mjs import file này ⇒ vòng import treo top-level await)
  const TARGETS = { 4: [7, 14], 7: [30, 50], 10: [100, 140], 20: [600, 720] };
  const checkTargets = (r) => Object.fromEntries(Object.entries(TARGETS).map(([lv, [lo, hi]]) => { const m = r.levels[lv]?.minutes ?? null; return [lv, { minutes: m, lo, hi, ok: m !== null && m >= lo && m <= hi }]; }));
  const { LEVELS } = await import("../../data/economy.js?v=c10");
  const files = process.argv.slice(2).filter((x) => x.endsWith(".json"));
  const results = files.map((f) => JSON.parse(readFileSync(f, "utf8")));
  const dir = dirname(fileURLToPath(import.meta.url));
  let before = null;
  try { before = readFileSync(join(dir, "before.md"), "utf8"); } catch { /* chưa có */ }
  writeFileSync(join(dir, "report.md"), renderReport(results, { seed: results[0]?.seed ?? 12345, targets: TARGETS, levels: LEVELS, check: checkTargets, before }));
  writeFileSync(join(dir, "report.json"), JSON.stringify(results.map((r) => ({ ...r, log: { ...r.log, rejectTypes: undefined }, money: r.money.filter((_, i) => i % 5 === 0) })), null, 1));
  console.log("report.md: " + results.map((r) => r.profile).join(", "));
}
