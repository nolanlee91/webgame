// Kết xuất report.md cho bộ mô phỏng cân bằng Tiệm Bánh Mì.
export function renderReport(results, { seed, targets, levels, check, before = null }) {
  const L = [];
  L.push("# Báo cáo cân bằng Tiệm Bánh Mì (bộ mô phỏng)", "");
  L.push(`Sinh bởi \`node tools/sim/sim.mjs\` (seed ${seed}). Thời gian = phút chơi thật: thời gian ca (đồng hồ chạy theo thao tác) + hội thoại + Chuẩn bị ca (gồm canh mẻ đầu ngày) + Chốt ca.`, "");
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
  L.push("| Ngày | " + results.map((r) => `${r.profile} tiền · lời ca · ổ · cấp`).join(" | ") + " |", "|---|" + results.map(() => "---|").join(""));
  const maxD = Math.max(...results.map((r) => r.money.length));
  for (let i = 0; i < maxD; i += 10) {
    L.push(`| ${i + 1} | ` + results.map((r) => { const m = r.money[i]; return m ? `${m.money}k · ${m.profit}k · ${m.loaves} · ${m.level}` : "—"; }).join(" | ") + " |");
  }
  L.push("", "## Lời vận hành trung bình theo giai đoạn (k / ca)", "");
  const band = (r, lo, hi) => { const xs = r.money.filter((m) => m.level >= lo && m.level <= hi); return xs.length ? Math.round(xs.reduce((a, m) => a + m.profit, 0) / xs.length) : "—"; };
  const loaves = (r, lo, hi) => { const xs = r.money.filter((m) => m.level >= lo && m.level <= hi); return xs.length ? Math.round(xs.reduce((a, m) => a + m.loaves, 0) / xs.length) : "—"; };
  L.push("| Hồ sơ | ngày 1 | cấp 1–6 | cấp 7–9 | cấp 10–14 | cấp 15–19 | cấp 20 | ổ/ca cấp 10 | ổ/ca cấp 20 |", "|---|---|---|---|---|---|---|---|---|");
  for (const r of results) L.push(`| ${r.profile} | ${r.money[0]?.profit ?? "—"}k | ${band(r, 1, 6)}k | ${band(r, 7, 9)}k | ${band(r, 10, 14)}k | ${band(r, 15, 19)}k | ${band(r, 20, 20)}k | ${loaves(r, 10, 10)} | ${loaves(r, 20, 20)} |`);
  L.push("", "## Tổng kết", "");
  L.push("| Hồ sơ | Ngày | Phút | Cấp | Tiền cuối | Lên tiệm (ngày) | Hạng tiệm | Pate nhà làm | Đồ chưa mua | Chỗ tiêu còn lại | Ký gửi | Hết hàng giữa ca | Đóng cửa sớm | Kẹt | Lỗi luật | Hội chợ | Thử thách (đạt) | Huy hiệu |",
    "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of results) {
    const f = r.final, g = r.log;
    L.push(`| ${r.profile} | ${f.day} | ${f.minutes} | ${f.level} | ${f.money}k | ${f.shopDay ?? "—"} | ${f.rank}/8 | ${f.pate}/3 | ${f.gearLeft}k | ${f.sinkLeft}k | ${g.consign} | ${g.stockouts} | ${g.closed} | ${g.stuck.length} | ${r.errors.length} | ${g.fair} | ${g.challenge} (${g.challengeWin}) | ${f.badges} |`);
  }
  const waste = (r) => { const xs = r.money; const baked = xs.reduce((a, m) => a + (m.baked || 0), 0), burnt = xs.reduce((a, m) => a + (m.burnt || 0), 0); return `${burnt}/${baked} mẻ cháy, hao TB ${Math.round(xs.reduce((a, m) => a + m.waste, 0) / Math.max(1, xs.length))}k/ca, hết hạn TB ${Math.round(xs.reduce((a, m) => a + (m.expired || 0), 0) / Math.max(1, xs.length))}k/ca`; };
  L.push("", "## Hao hụt", "");
  for (const r of results) L.push(`- **${r.profile}**: ${waste(r)}`);
  L.push("", "Kẹt = ngày không đủ tiền + hàng làm một ổ pate bơ mà gói ký gửi đã dùng. Lỗi luật = action ném lỗi / ca không kết thúc / thớt kẹt.", "");
  if (before) L.push("## Trước cân bằng M5", "", before, "");
  return L.join("\n") + "\n";
}
