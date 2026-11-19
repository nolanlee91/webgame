// Kết xuất report.md cho bộ mô phỏng cân bằng.
export function renderReport(results, { seed, targets, levels, check }) {
  const L = [];
  L.push("# Báo cáo cân bằng Tiệm Trà Sữa (bộ mô phỏng)", "");
  L.push(`Sinh bởi \`node tools/sim/sim.mjs\` (seed ${seed}). Thời gian = phút chơi thật: thời gian ca (đồng hồ chạy theo thao tác) + hội thoại + bảng Chuẩn bị ca + Chốt ca.`, "");
  L.push("## Mốc cấp (phút chơi)", "");
  L.push("| Cấp | Mục tiêu | " + results.map((r) => r.profile).join(" | ") + " |", "|---|---|" + results.map(() => "---|").join(""));
  for (let lv = 2; lv <= 20; lv++) {
    const tg = targets[lv] ? `${targets[lv][0]}–${targets[lv][1]}` : "";
    L.push(`| ${lv} | ${tg} | ` + results.map((r) => { const x = r.levels[lv]; return x ? `${x.minutes} (ngày ${x.day})` : "—"; }).join(" | ") + " |");
  }
  L.push("", "## Đạt mục tiêu", "");
  for (const r of results) L.push(`- **${r.profile}**: ` + Object.entries(check(r)).map(([lv, x]) => `cấp ${lv} ${x.minutes ?? "—"} ph ${x.ok ? "đạt" : "LỆCH"}`).join(", "));
  L.push("", "## Tiền theo ngày (mỗi 10 ngày)", "");
  L.push("| Ngày | " + results.map((r) => `${r.profile} tiền · lãi ca · cấp`).join(" | ") + " |", "|---|" + results.map(() => "---|").join(""));
  const maxD = Math.max(...results.map((r) => r.money.length));
  for (let i = 0; i < maxD; i += 10) {
    L.push(`| ${i + 1} | ` + results.map((r) => { const m = r.money[i]; return m ? `${m.money}k · ${m.profit}k · ${m.level}` : "—"; }).join(" | ") + " |");
  }
  L.push("", "## Tổng kết", "");
  L.push("| Hồ sơ | Ngày | Phút | Cấp | Tiền cuối | Đồ chưa mua | Ký gửi | Hết hàng giữa ca | Đóng cửa sớm | Kẹt | Lỗi luật | Hội chợ | Ca thử thách | Huy hiệu | Hạng tiệm |", "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of results) {
    const f = r.final, g = r.log;
    L.push(`| ${r.profile} | ${f.day} | ${f.minutes} | ${f.level} | ${f.money}k | ${f.gearLeft}k | ${g.consign} | ${g.stockouts} | ${g.closed} | ${g.stuck.length} | ${r.errors.length} | ${g.fair} | ${g.challenge} | ${f.badges} | ${f.tier}/8 |`);
  }
  L.push("", "Kẹt = ngày không đủ tiền + hàng pha một ly cơ bản mà gói ký gửi đã dùng. Lỗi luật = action bị từ chối bất thường hoặc ca không kết thúc.", "");
  return L.join("\n") + "\n";
}
