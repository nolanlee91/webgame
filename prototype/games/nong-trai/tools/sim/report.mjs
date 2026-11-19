// Kết xuất report.md từ kết quả mô phỏng (report.json có cùng dữ liệu, đầy đủ hơn).
import { TARGETS } from "./analysis.mjs";

const fmtMin = (m) => (m === null || m === undefined ? "—" : m < 90 ? `${Math.round(m)} ph` : `${(m / 60).toFixed(1)} h`);
const fmtH = (h) => (h === null || h === undefined ? "—" : h < 1.5 ? `${Math.round(h * 60)} ph` : h < 48 ? `${h.toFixed(1)} h` : `${(h / 24).toFixed(1)} ngày`);
const n = (x) => (typeof x === "number" ? x.toLocaleString("en") : x ?? "—");
const table = (head, rows) => [`| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`, ...rows.map((r) => `| ${r.join(" | ")} |`)].join("\n");

export function renderReport(j) {
  const { results, analysis: A } = j;
  const name = Object.fromEntries(results.map((r) => [r.profile.id, r.profile.name]));
  const out = [];
  const P = (...l) => out.push(...l, "");
  P(`# Nông Trại 2.0 — báo cáo mô phỏng cân bằng`,
    `Sinh lúc ${j.generated} · ${j.days} ngày mô phỏng · seed ${j.seed} · chạy ${j.elapsedSec.toFixed(1)} s · luật thật từ \`core/*\` + \`data/*\` (xem README.md về giả định).`,
    `Mục tiêu §3 (thời gian **chơi**): cấp 4 ≈ 10 ph · cấp 7 ≈ 40 ph · cấp 10 ≈ 2 h · cấp 20 ≈ 10–12 h.`);

  P("## Tóm tắt",
    ...results.map((r) => `- **${r.profile.name}**: cấp 4 / 7 / 10 / 20 sau ${[4, 7, 10, 20].map((L) => fmtMin(r.levels[L] ? r.levels[L].active / 60_000 : null)).join(" / ")} chơi ` +
      `(${[4, 7, 10, 20].map((L) => fmtH(r.levels[L] ? r.levels[L].real / 3600_000 : null)).join(" / ")} thật); cuối tuần cấp ${r.final.level}, ${n(r.final.coins)} xu.`),
    `- Thu nhập: ${A.income.map((x) => `${name[x.profile]} — đơn ${x.share.orders} %, thô ${x.share.raw} %, thành phẩm ${x.share.products} %, trứng/sữa ${x.share.animals} %, nhiệm vụ ${x.share.quests} %`).join("; ")}.`,
    `- Vòng lặp lời: ${A.runaway.economyOk && !A.runaway.perProfile.some((p) => p.superLinear) ? "không thấy (chợ chặn mua→bán lời; thu nhập/giờ chơi phẳng, không siêu tuyến tính)" : "CÓ DẤU HIỆU — xem §6"}.`,
    `- Lỗi luật còn tái hiện: ${A.bugs.filter((b) => b.confirmed).length} (xem §10).`,
    `- Chỗ tiêu xu còn lại cuối tuần (mọi mốc xây / nâng chưa mua, gồm bậc Nhà "danh tiếng" M5): ${results.map((r) => `${name[r.profile.id]} ${n(A.sinks[r.profile.id].left)} xu`).join(" · ")}.`,
    `- Gợi ý ưu tiên: ${A.recommendations.some((r) => !r.decided) ? A.recommendations.filter((r) => !r.decided).slice(0, 5).map((r, i) => `(${i + 1}) ${r.file.split(" — ")[0]}: ${r.to}`).join(" · ") : "không có — các mốc §3 nằm trong khoảng mục tiêu, xu cuối tuần ít hơn chỗ tiêu còn lại; hai gợi ý cũ của M5 đã xét ở §11 (không áp dụng)"}.`, `- Milestone 6: xem §11 (sổ sưu tập, phiên chợ, đơn đặc biệt hai lúc, so sánh M5 → M6).`);
  P("## Hồ sơ người chơi", table(["Hồ sơ", "Mô tả", "Chơi 7 ngày", "Cấp cuối", "Xu cuối", "Tổng xu kiếm"],
    results.map((r) => [r.profile.name, r.profile.desc, fmtMin(r.activeMin), r.final.level, n(r.final.coins), n(r.final.earned)])));

  // 1. cấp
  P("## 1. Thời gian tới từng cấp (chơi / thật)");
  const maxL = 20;
  P(table(["Cấp", ...results.map((r) => `${r.profile.name} — chơi`), ...results.map((r) => `${r.profile.name} — thật`)],
    Array.from({ length: maxL }, (_, i) => i + 1).map((L) => [L + (TARGETS[L] ? ` (mục tiêu ${fmtMin(TARGETS[L])})` : ""),
      ...results.map((r) => fmtMin(r.levels[L] ? r.levels[L].active / 60_000 : null)),
      ...results.map((r) => fmtH(r.levels[L] ? r.levels[L].real / 3600_000 : null))])));
  P("Tỉ lệ so với mục tiêu (thời gian chơi thực tế ÷ mục tiêu; < 1 = nhanh hơn thiết kế):",
    table(["Hồ sơ", "Cấp 4", "Cấp 7", "Cấp 10", "Cấp 20"], A.targets.map((t) => [name[t.profile], ...t.rows.map((x) => (x.ratio === null ? "chưa tới" : `${x.ratio}×`))])));

  // 2. đường cong
  P("## 2. Đường cong xu / XP (mẫu cuối mỗi phiên)");
  for (const r of results) {
    const s = r.samples, step = Math.max(1, Math.floor(s.length / 14));
    const pick = s.filter((_, i) => i % step === 0 || i === s.length - 1);
    P(`**${r.profile.name}**`, table(["Giờ thật", "Phút chơi", "Cấp", "Tổng XP", "Xu đang có", "Tổng xu kiếm", "Ô đất", "Vật nuôi"],
      pick.map((x) => [fmtH(x.realH), x.activeMin, x.level, n(x.xp), n(x.coins), n(x.earned), x.plots, x.animals])));
  }

  // 3. nguồn thu
  P("## 3. Nguồn thu (xu)", table(["Hồ sơ", "Bán nông sản thô", "Giao đơn", "Bán thành phẩm", "Bán trứng / sữa", "Thưởng nhiệm vụ", "Tổng"],
    A.income.map((x) => [name[x.profile], ...["raw", "orders", "products", "animals", "quests"].map((k) => `${n(x.abs[k])} (${x.share[k]} %)`), n(x.total)])));
  P("XP theo nguồn:", table(["Hồ sơ", "Thu hoạch", "Giao đơn", "Nhận từ máy", "Vật nuôi", "Nhiệm vụ M1", "Nhiệm vụ làng"],
    results.map((r) => [r.profile.name, ...["harvestAll", "deliver", "collect", "collectAnimals", "claimQuest", "villageClaim"].map((k) => n(r.xpBy[k] || 0))])));
  P("Chi tiêu:", table(["Hồ sơ", "Hạt", "Ô đất", "Công trình", "Máy", "Nâng máy", "Vật nuôi", "Vật liệu (chợ)"],
    results.map((r) => [r.profile.name, ...["seeds", "plots", "buildings", "machines", "machineUpgrades", "animals", "materials"].map((k) => n(r.spend[k]))])));

  // 4. tính năng
  P("## 4. Lần đầu dùng được tính năng (phút chơi · thời gian thật)");
  P(table(["Tính năng", ...results.map((r) => r.profile.name)],
    A.features[0].rows.map((row, i) => [row.name, ...A.features.map((f) => { const x = f.rows[i]; return x.activeMin === undefined ? "—" : `${fmtMin(x.activeMin)} · ${fmtH(x.realH)}`; })])));

  // 5. khựng
  P("## 5. Khựng / kẹt",
    `- **Không có gì để làm**: lần nhìn màn hình không có hành động có ích nào (chỉ tưới / chờ); chuỗi > 5 phút chơi được ghi lại.`,
    `- **Chờ gom xu**: mục ưu tiên lớn kế tiếp chưa đủ xu / vật liệu liên tục > 5 phút chơi.`,
    `- **Kẹt**: kho + giỏ tràn đầy chặn thu hoạch, hoặc ruộng trống mà không đủ xu mua hạt.`);
  P(table(["Hồ sơ", "Phút chơi rảnh", "Chuỗi rảnh > 5 ph", "Phút kẹt kho đầy", "Phút hết xu", "Lưới an toàn tặng hạt", "Nhiệm vụ M1 (đã qua / 13)", "Tiến trình làng (/6)", "Chuỗi NPC (bước)"],
    results.map((r) => [r.profile.name, n(r.idleMin), r.stalls.length, n(r.blockedMin), n(r.brokeMin), r.gifts, r.final.questIndex, r.final.villageProg,
      Object.entries(r.final.chains).map(([k, v]) => `${k} ${v}/3`).join(", ")])));
  for (const r of results) {
    const w = [...r.waits].sort((a, b) => b.minutes - a.minutes).slice(0, 6);
    if (w.length) P(`Chờ gom xu lâu nhất — ${r.profile.name}:`, table(["Mục", "Từ phút chơi", "Từ giờ thật", "Kéo dài (phút chơi)", "Cấp lúc đó"],
      w.map((x) => [x.key, x.startActiveMin, fmtH(x.startRealH), Math.round(x.minutes), x.level])));
  }

  // 6. vòng lặp
  const R = A.runaway;
  P("## 6. Vòng lặp lời vô hạn",
    `- \`MARKET.assertEconomy()\` (mua ở chợ → chế biến / nuôi → bán): ${R.economyOk ? "**không có vòng lời** ✔" : "**VI PHẠM**: " + R.violations.join("; ")}.`,
    ...R.perProfile.map((p) => `- ${name[p.profile]}: xu kiếm mỗi giờ chơi theo ngày ${p.days.map((d) => n(d.perActiveHour)).join(" → ")}; tăng ${p.growth ?? "—"}× (ngày 2 → cuối) ⇒ ${p.superLinear ? "**SIÊU TUYẾN TÍNH — nghi vòng lặp**" : "tuyến tính / bão hoà (không vòng lặp)"}; giữ ${p.hoardPct} % tổng xu kiếm được chưa tiêu.`));

  // 7. chuỗi
  P("## 7. Lợi nhuận chuỗi A/B/C theo phút tài nguyên (giá gốc, cây đã tưới)",
    table(["Chuỗi", "Cách làm", "Doanh thu", "Hạt", "Lãi", "Hơn bán thô", "Phút-ô", "Phút-máy", "Phút-vật nuôi", "Lãi / phút-ô", "Lãi / tổng phút", "Thô / phút-ô"],
      A.chains.map((c) => [c.chain, c.label, c.revenue, c.seedCost, c.profit, c.vsRaw, c.plotMin, c.machineMin, c.animalMin, c.perPlotMin, c.perTotalMin, c.rawPerPlotMin])));
  P("Cây (mỗi phút-ô):", table(["Cây", "Cấp", "Lớn (ph)", "Lãi/vụ", "Xu/phút-ô", "Xu/phút-ô (tưới)", "XP/phút-ô", "XP/phút-ô (tưới)"],
    A.crops.map((c) => [c.name, c.level, c.growMin, c.profit, c.coinPerPlotMin, c.coinPerPlotMinWatered, c.xpPerPlotMin, c.xpPerPlotMinWatered])));
  P("Công thức (mỗi phút-máy, giá gốc):", table(["Công thức", "Máy", "Cấp", "Phút", "Giá trị vào", "Giá trị ra", "Ra/vào", "Cộng thêm / phút-máy"],
    A.recipes.map((r) => [r.id, r.machine, r.level, r.min, r.inputValue, r.outputValue, r.ratio, r.valueAddPerMachineMin])));
  P("Vật nuôi:", table(["Con", "Giá", "Chu kỳ (ph)", "Sản phẩm", "Thức ăn tự làm", "Thức ăn mua", "Lãi/giờ (tự làm)", "Lãi/giờ (mua)", "Hoàn vốn (chu kỳ)"],
    A.animals.map((a) => [a.name, a.buy, a.cycleMin, `${a.product} ${a.value}`, a.feedCostFarm, a.feedCostShop, a.profitPerHourFarmFeed, a.profitPerHourShopFeed, a.paybackCycles])));

  // 8. dò XP
  if (A.fit) {
    P("## 8. Dò đường cong XP (hồ sơ chăm, 3 ngày)", `Lưới \`a · lv^b\`; sai số = Σ log²(thực tế / mục tiêu) trên cấp 4/7/10/20.`,
      table(["a", "b", "Tổng XP tới cấp 20", "Cấp 4", "Cấp 7", "Cấp 10", "Cấp 20", "Sai số"],
        A.fit.rows.map((x) => [x.a, x.b, n(x.totalXp20), ...[4, 7, 10, 20].map((L) => fmtMin(x.got[L])), x.err])));
    if (A.fitRuns) P(`Kiểm lại đường cong tốt nhất (${A.fit.best.a} · lv^${A.fit.best.b}) trên mọi hồ sơ, ${j.days} ngày — cột "+XP cây" thêm gợi ý XP cây (đổi tạm trong bộ nhớ):`,
      table(["Hồ sơ", "Cấp 4", "Cấp 7", "Cấp 10", "Cấp 20", "Cấp cuối", "+XP cây: cấp 4 / 7 / 10 / 20", "+XP cây: cấp cuối"],
        A.fitRuns.map((x) => [name[x.profile], ...[4, 7, 10, 20].map((L) => (x.levels[L] ? `${fmtMin(x.levels[L].activeMin)} · ${fmtH(x.levels[L].realH)}` : "—")), x.final.level,
          [4, 7, 10, 20].map((L) => (x.withCropXp.levels[L] ? fmtMin(x.withCropXp.levels[L].activeMin) : "—")).join(" / "), x.withCropXp.final.level])));
  }

  // 9. gợi ý
  P("## 9. Gợi ý chỉnh số (CHƯA áp dụng)");
  if (!A.recommendations.length) P("Không có gợi ý: mọi điều kiện kích hoạt gợi ý (lệch mục tiêu XP, xu dư hơn chỗ tiêu, lỗi còn tái hiện …) đều không xảy ra.");
  A.recommendations.forEach((r, i) => P(`${i + 1}. **${r.file}** — từ \`${r.from}\` → \`${r.to}\`.${r.decided ? ` **(${r.decided})**` : ""}  \n   Lý do: ${r.why}`));

  // 10. lỗi
  P("## 10. Lỗi luật phát hiện (repro tối thiểu — xem tools/sim/bugs.mjs)",
    ...A.bugs.map((b) => `- ${b.confirmed ? "**CÒN**" : "đã sửa / không tái hiện"} — ${b.title}  \n  File: \`${b.file}\` · Repro: \`${b.repro}\` · Kết quả: ${b.detail}`));
  if (results.some((r) => r.errors.length)) P("## Vi phạm bất biến trong mô phỏng", ...results.flatMap((r) => r.errors.map((e) => `- ${r.profile.name} t=${e.t}: ${e.action} ${e.bad.join(", ")}`)));
  // 11. Milestone 6
  const M5 = { cham: { L: [9, 38, 114, 678], level: 20, coins: 249447 }, "thinh-thoang": { L: [8, 31, 102, null], level: 12, coins: 23173 }, "ngay-2-lan": { L: [8, 30, null, null], level: 9, coins: 1000 } };
  P("## 11. Milestone 6 — sổ sưu tập, phiên chợ, đơn đặc biệt hai lúc, 6 công thức mới",
    "Thay đổi kinh tế M6: 6 công thức mới (Bánh ngô, Sinh tố dâu, Bắp rang bơ, Chè bí ngô, Sữa chua, Bánh gạo — ×1,29–1,31, 12–14,5 xu cộng thêm / phút-máy); thưởng Sổ sưu tập 10 / 20 / 30 món (800 + 4 000 + 15 000 xu, vật liệu, trang trí); Phiên chợ 30 ph / ngày từ cấp 18 (thành phẩm ×1,25, 3 hàng săn ×1,5 cho 10 món đầu); đơn đặc biệt thứ hai từ cấp 18; hàng rào đá 6 000 xu (cấp 15); thức ăn mua ở chợ 56 → 72 xu (giữ MARKET.assertEconomy khi có giá phiên chợ).",
    table(["Hồ sơ", "M5: cấp 4 / 7 / 10 / 20 (ph chơi)", "M6: cấp 4 / 7 / 10 / 20", "M5: cấp · xu cuối", "M6: cấp · xu cuối", "Sổ (món · mốc nhận) · giờ chơi tới mốc 10/20/30", "Xu thêm nhờ phiên chợ", "Giao đơn đặc biệt"],
      results.map((r) => { const b = M5[r.profile.id]; return [r.profile.name, b ? b.L.map(fmtMin).join(" / ") : "—", [4, 7, 10, 20].map((L) => fmtMin(r.levels[L] ? r.levels[L].active / 60_000 : null)).join(" / "),
        b ? `${b.level} · ${n(b.coins)}` : "—", `${r.final.level} · ${n(r.final.coins)}`,
        `${r.final.book}/30 · ${r.final.bookClaimed}/3 · ${[10, 20, 30].map((k) => (r.final.bookAt?.[k] !== undefined ? r.final.bookAt[k] + " h" : "—")).join(" / ")}`, n(r.final.fairBonus), r.final.specialDelivered]; })));
  if (A.m6) {
    P("Hai gợi ý còn treo từ M5 — chạy thử 7 ngày, cùng seed (đổi tạm trong bộ nhớ):",
      table(["Hồ sơ", "Hiện tại: cấp 4 / 7 / 10 / 20 · cấp · xu", "XP cây nhanh 1 / 2 / 4", "2 ngô → 4 bao thức ăn"],
        A.m6.whatIf.map((w) => { const r = results.find((x) => x.profile.id === w.profile); const f = (x) => `${[4, 7, 10, 20].map((L) => fmtMin(x.levels[L]?.activeMin ?? null)).join(" / ")} · cấp ${x.final.level} · ${n(x.final.coins)} xu · rảnh ${x.idleMin} ph · trứng/sữa ${n(x.animals)}`;
          return [name[w.profile], `${[4, 7, 10, 20].map((L) => fmtMin(r.levels[L] ? r.levels[L].active / 60_000 : null)).join(" / ")} · cấp ${r.final.level} · ${n(r.final.coins)} xu · rảnh ${r.idleMin.toFixed(1)} ph · trứng/sữa ${n(r.income.animals)}`, f(w.cropXp), f(w.feed4)]; })),
      "**Quyết định M6: không áp dụng cả hai.**",
      "- *Giảm XP cây nhanh (cà rốt 1, cà chua 2, dâu 4)*: làm chậm đúng nhóm đang yếu nhất (\"ngày 2 lần\" kết tuần thấp hơn một cấp, \"chăm\" có phút rảnh trở lại vì phải gieo cây dài hơn), trong khi \"chăm\" vốn đã nằm giữa khoảng mục tiêu §3. Đánh đổi \"cây nhanh / cây dài\" đã có sẵn ở chỗ khác: cây nhanh cần chạm mỗi 30–60 giây, khi rời máy thì cây dài thắng (bộ mô phỏng tự gieo cây dài trước khi rời). Không đáng để đổi một con số người chơi đã quen.",
      "- *Gà / bò lãi mỗi giờ thấp hơn một ô cà chua*: so sánh theo giờ-tài-sản không công bằng — đàn bị chặn ở 10 gà + 6 bò và không chiếm ô ruộng, nên mọi đồng từ đàn là thu nhập CỘNG THÊM; tính theo chạm, một lượt \"cho ăn tất cả + thu tất cả\" (2 chạm) cho cả chuồng lãi hơn hẳn 2 chạm trên ruộng. Tăng giá trứng / sữa phá luật chế biến ×1,25 (bánh trứng, bơ, phô mai…); còn 2 ngô → 4 bao (thử ở bảng trên) gần như không đổi phần thu từ trứng / sữa nhưng đẩy xu cuối tuần của \"chăm\" lên mạnh — ngược mục tiêu M5 (không dư xu). Trứng / sữa còn là đầu vào của 9 / 18 thành phẩm (4 trong 6 công thức M6 mới), đó mới là giá trị chính của vật nuôi.",
      "- Thưởng mới của M6 (sổ sưu tập + phiên chợ) không làm lệch nhịp lên cấp (thưởng sổ không có XP) và xu cuối tuần vẫn dưới chỗ tiêu còn lại ⇒ không cần chỉnh đường XP hay giá.");
  }

  return out.join("\n");
}
