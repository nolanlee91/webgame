// Phân tích kết quả mô phỏng: mục tiêu §3, nguồn thu, khựng, vòng lặp lời vô hạn, lợi nhuận chuỗi A/B/C,
// dò đường cong XP hợp mục tiêu, và gợi ý chỉnh số (KHÔNG áp dụng — chỉ đề xuất).
import { CROP, CROPS, ITEM, RECIPE, ANIMAL, MARKET, xpNeed } from "./harness.mjs";
import { ORDER_TYPES } from "../../data/orders.js?v=m14";
import { WATER_FACTOR, plotCost } from "../../core/plots.js?v=m14";
import { BUILDING, BUILDINGS } from "../../data/buildings.js?v=m14";
import { runBugChecks } from "./bugs.mjs";

/** §3: thời gian CHƠI (phút) mong muốn tới cấp. Cấp 20: 10–12 giờ ⇒ lấy 11 giờ làm điểm giữa. */
export const TARGETS = { 4: 10, 7: 40, 10: 120, 20: 660 };
export const TARGET_RANGE = { 4: [7, 14], 7: [30, 55], 10: [90, 160], 20: [600, 720] };

const base = (id) => ITEM[id]?.sell || 0;
const r1 = (x) => Math.round(x * 10) / 10;
const r2 = (x) => Math.round(x * 100) / 100;

// ---------------- lợi nhuận theo phút tài nguyên ----------------
export function cropTable() {
  return CROPS.map((c) => {
    const m = c.growMs / 60_000, mw = m * WATER_FACTOR;
    return { id: c.id, name: c.name, level: c.level, growMin: r2(m), profit: c.sell - c.seed,
      coinPerPlotMin: r1((c.sell - c.seed) / m), coinPerPlotMinWatered: r1((c.sell - c.seed) / mw),
      xpPerPlotMin: r1(c.xp / m), xpPerPlotMinWatered: r1(c.xp / mw) };
  });
}
export function recipeTable() {
  return Object.values(RECIPE).map((r) => {
    const inVal = Object.entries(r.inputs).reduce((t, [id, q]) => t + base(id) * q, 0);
    const out = base(r.output) * r.qty, m = r.ms / 60_000;
    return { id: r.id, machine: r.machine, level: r.level, min: m, inputValue: inVal, outputValue: out,
      ratio: r2(out / inVal), valueAddPerMachineMin: r1((out - inVal) / m), xp: r.xp };
  });
}
export function animalTable() {
  // thức ăn tự làm: 2 ngô → 3 bao (giá trị thô 2 × 29 / 3), hoặc mua chợ 48 / bao
  const feedFarm = (2 * base("ngo")) / 3, feedShop = MARKET.shop["thuc-an-gia-suc"]?.buy ?? 48;
  return Object.values(ANIMAL).map((a) => {
    const m = a.cycleMs / 60_000, out = base(a.product) * a.qty;
    return { id: a.id, name: a.name, buy: a.buy, cycleMin: m, product: a.product, value: out,
      feedCostFarm: r1(a.feed * feedFarm), feedCostShop: a.feed * feedShop,
      profitPerHourFarmFeed: r1(((out - a.feed * feedFarm) / m) * 60), profitPerHourShopFeed: r1(((out - a.feed * feedShop) / m) * 60),
      paybackCycles: r1(a.buy / Math.max(0.01, out - a.feed * feedFarm)) };
  });
}

/** Ba chuỗi mẫu §2.5 — tính trên giá gốc, cây đã tưới (người chơi đang chơi). */
export function chains() {
  const w = WATER_FACTOR;
  const plotMin = (id, n) => (CROP[id].growMs / 60_000) * w * n;
  const seeds = (id, n) => CROP[id].seed * n;
  const mult = (t) => (ORDER_TYPES[t].mult[0] + ORDER_TYPES[t].mult[1]) / 2;
  const rows = [];
  // A: Dâu → Mứt → đơn (thường ×1,15–1,2; kết hợp ×1,3)
  {
    const pm = plotMin("dau-tay", 3), mm = RECIPE["mut-dau"].ms / 60_000, cost = seeds("dau-tay", 3);
    const raw = 3 * base("dau-tay") - cost;
    for (const [label, k] of [["bán chợ (giá gốc)", 1], ["đơn thường", mult("thuong")], ["đơn kết hợp", mult("ket-hop")]]) {
      const rev = base("mut-dau") * k, profit = rev - cost;
      rows.push({ chain: "A", label: `Dâu → Mứt dâu → ${label}`, revenue: r1(rev), seedCost: cost, profit: r1(profit), vsRaw: r1(profit - raw),
        plotMin: r2(pm), machineMin: mm, animalMin: 0,
        perPlotMin: r1(profit / pm), perTotalMin: r1(profit / (pm + mm)), rawPerPlotMin: r1(raw / pm) });
    }
  }
  // B: Ngô → thức ăn → gà → trứng (+ Lúa → Bột gạo) → Bánh trứng
  {
    const feedJobs = 2 / 3; // 2 trứng = 2 bao = 2/3 mẻ cối xay
    const pm = plotMin("ngo", 2 * feedJobs) + plotMin("lua", 2);
    const mm = feedJobs * RECIPE["thuc-an-gia-suc"].ms / 60_000 + RECIPE["bot-gao"].ms / 60_000 + RECIPE["banh-trung"].ms / 60_000;
    const am = 2 * ANIMAL.ga.cycleMs / 60_000;
    const cost = seeds("ngo", 2 * feedJobs) + seeds("lua", 2);
    const raw = 2 * feedJobs * base("ngo") + 2 * base("lua") - cost;
    for (const [label, k] of [["bán chợ (giá gốc)", 1], ["bán chợ giá ↑ (+15 %)", 1.15], ["đơn kết hợp", mult("ket-hop")]]) {
      const rev = base("banh-trung") * k, profit = rev - cost;
      rows.push({ chain: "B", label: `Ngô → Thức ăn → Gà → Trứng + Lúa → Bột → Bánh trứng → ${label}`, revenue: r1(rev), seedCost: r1(cost), profit: r1(profit), vsRaw: r1(profit - raw),
        plotMin: r2(pm), machineMin: r2(mm), animalMin: am,
        perPlotMin: r1(profit / pm), perTotalMin: r1(profit / (pm + mm + am)), rawPerPlotMin: r1(raw / pm) });
    }
  }
  // C: Cà chua → bán ngay; và đơn lớn "6 cà chua + 2 sốt" (kết hợp ×1,3)
  {
    const pm1 = plotMin("ca-chua", 1), p1 = base("ca-chua") - CROP["ca-chua"].seed;
    rows.push({ chain: "C", label: "Cà chua → bán ngay", revenue: base("ca-chua"), seedCost: CROP["ca-chua"].seed, profit: p1, vsRaw: 0,
      plotMin: r2(pm1), machineMin: 0, animalMin: 0, perPlotMin: r1(p1 / pm1), perTotalMin: r1(p1 / pm1), rawPerPlotMin: r1(p1 / pm1) });
    const pm = plotMin("ca-chua", 12), mm = 2 * RECIPE["sot-ca-chua"].ms / 60_000, cost = seeds("ca-chua", 12);
    const rev = (6 * base("ca-chua") + 2 * base("sot-ca-chua")) * mult("ket-hop"), profit = rev - cost;
    rows.push({ chain: "C", label: "12 cà chua → đơn \"6 cà chua + 2 sốt\" (kết hợp)", revenue: r1(rev), seedCost: cost, profit: r1(profit), vsRaw: r1(profit - 12 * p1),
      plotMin: r2(pm), machineMin: mm, animalMin: 0, perPlotMin: r1(profit / pm), perTotalMin: r1(profit / (pm + mm)), rawPerPlotMin: r1(p1 / pm1) });
  }
  return rows;
}

// ---------------- vòng lặp lời ----------------
export function runaway(results) {
  const eco = MARKET.assertEconomy();
  const perProfile = results.map((r) => {
    const days = r.perDay.filter((d) => d.activeMin > 0).map((d) => ({ day: d.day, perActiveHour: Math.round(d.earned / (d.activeMin / 60)), earned: d.earned }));
    const rest = days.slice(1);
    const growth = rest.length >= 2 ? r2(rest[rest.length - 1].perActiveHour / Math.max(1, rest[0].perActiveHour)) : null;
    // siêu tuyến tính: thu nhập mỗi giờ chơi tăng đều > 1,5× mỗi ngày sau ngày 1
    const superLinear = rest.length >= 3 && rest.every((d, i) => i === 0 || d.perActiveHour > rest[i - 1].perActiveHour * 1.5);
    return { profile: r.profile.id, days, growth, superLinear, finalCoins: r.final.coins, earned: r.final.earned,
      hoardPct: Math.round((100 * r.final.coins) / Math.max(1, r.final.earned)) };
  });
  return { economyOk: eco.ok, violations: eco.violations, perProfile };
}

// ---------------- dò đường cong XP ----------------
/** Lưới a·lv^b trên hồ sơ "chăm" (3 ngày, dừng khi qua cấp 20). Trả bảng + điểm tốt nhất (sai số log so với TARGETS). */
export function fitXpCurve(runSim, { profile = "cham", days = 3, grid = { a: [30, 40, 50, 60], b: [1.9, 2.0, 2.1] } } = {}) {
  const rows = [];
  const score = (got) => Object.entries(TARGETS).reduce((t, [L, T]) => t + Math.log((got[L] ?? T * 3) / T) ** 2, 0);
  for (const a of grid.a) for (const b of grid.b) {
    const r = runSim(profile, { days, xpNeed: (lv) => Math.round(a * lv ** b), stopAtLevel: 21 });
    const got = Object.fromEntries(Object.keys(TARGETS).map((L) => [L, r.levels[L] ? r1(r.levels[L].active / 60_000) : null]));
    rows.push({ a, b, got, err: r2(score(got)), totalXp20: Array.from({ length: 19 }, (_, i) => Math.round(a * (i + 1) ** b)).reduce((x, y) => x + y, 0) });
  }
  rows.sort((x, y) => x.err - y.err);
  return { profile, days, rows, best: rows[0] };
}

// ---------------- tổng hợp ----------------
const FEATURES = [
  ["built:nha-kho@1", "Nhà kho xây xong"], ["built:xuong@1", "Xưởng + Bếp sên dùng được"], ["machine:coi-xay", "Cối xay bắt đầu xây"],
  ["order:ket-hop", "Đơn kết hợp đầu tiên xuất hiện"], ["deliver:ket-hop", "Giao đơn kết hợp đầu"], ["built:chuong-ga@1", "Chuồng gà xây xong"],
  ["animalCollected", "Thu sản phẩm vật nuôi đầu"], ["machine:lo-banh", "Lò bánh bắt đầu xây"], ["built:chuong-bo@1", "Chuồng bò xây xong"],
  ["built:nha-kinh@1", "Nhà kính xây xong"], ["order:dac-biet", "Đơn đặc biệt đầu tiên"], ["deliver:dac-biet", "Giao đơn đặc biệt đầu"],
  ["machine:may-bo-sua", "Máy bơ sữa bắt đầu xây"], ["machine:noi-duong", "Nồi đường bắt đầu xây"], ["built:xuong@2", "Xưởng cấp 2"],
  ["built:dat-phia-dong@1", "Khu đất phía Đông mở"], ["chainComplete", "Hoàn thành chuỗi NPC đầu"], ["gift", "Lưới an toàn tặng hạt (lần đầu)"],
];

export function analyse(results, extra = {}) {
  const targets = results.map((r) => ({
    profile: r.profile.id,
    rows: Object.keys(TARGETS).map((L) => {
      const v = r.levels[L];
      const act = v ? v.active / 60_000 : null;
      return { level: +L, target: TARGETS[L], range: TARGET_RANGE[L], activeMin: act === null ? null : r1(act), realH: v ? r2(v.real / 3600_000) : null,
        ratio: act === null ? null : r2(act / TARGETS[L]) };
    }),
  }));
  const income = results.map((r) => {
    const total = Object.values(r.income).reduce((a, b) => a + b, 0) || 1;
    return { profile: r.profile.id, total, share: Object.fromEntries(Object.entries(r.income).map(([k, v]) => [k, Math.round((100 * v) / total)])), abs: r.income };
  });
  const features = results.map((r) => ({ profile: r.profile.id, rows: FEATURES.map(([k, name]) => ({ key: k, name, ...(r.firsts[k] ? { activeMin: r1(r.firsts[k].active / 60_000), realH: r2(r.firsts[k].real / 3600_000) } : {}) })) }));
  return {
    targets, income, features,
    runaway: runaway(results),
    crops: cropTable(), recipes: recipeTable(), animals: animalTable(), chains: chains(),
    plotCosts: Array.from({ length: 16 }, (_, n) => plotCost({ bought: n })),
    bugs: runBugChecks(),
    fit: extra.fit || null, fitRuns: extra.fitRuns || null,
    recommendations: recommend(results, extra),
    sinks: Object.fromEntries(results.map((r) => [r.profile.id, coinSinkLeft(r)])),
  };
}

// ---------------- gợi ý chỉnh số ----------------
/** XP cây đề xuất (thử bằng --what-if trong sim.mjs: đổi tạm trong bộ nhớ, không sửa file). */
export const CROP_XP_TWEAK = { "ca-rot": 1, "ca-chua": 2, "dau-tay": 4 };

/** Xu còn tiêu được vào công trình (mọi mốc xây / nâng chưa mua, kể cả bậc Nhà M5) theo level cuối của hồ sơ. */
export function coinSinkLeft(r) {
  const lv = r.final.buildings || {};
  let left = 0, next = null;
  for (const def of BUILDINGS) {
    if (!["build", "expansion", "prebuilt"].includes(def.kind)) continue;
    const have = lv[def.id] ?? (def.kind === "prebuilt" ? 1 : 0);
    def.levels.forEach((st, i) => { if (i >= have && st.cost) { left += st.cost; if (!next || st.cost < next.cost) next = { id: def.id, level: i + 1, cost: st.cost }; } });
  }
  return { left, next };
}

export function recommend(results, extra = {}) {
  const recs = [];
  const by = Object.fromEntries(results.map((r) => [r.profile.id, r]));
  const act = (r, L) => (r?.levels[L] ? r.levels[L].active / 60_000 : null);
  const cham = by.cham || results[0];
  const fitCham = extra.fitRuns?.find((x) => x.profile === "cham");
  const fmt = (m) => (m === null ? "chưa tới" : m < 90 ? `${Math.round(m)} ph` : `${(m / 60).toFixed(1)} h`);
  // 1) đường cong XP — chỉ khi "chăm" lệch khỏi khoảng mục tiêu §3
  const off = Object.keys(TARGETS).filter((L) => { const m = act(cham, L); return m === null || m < TARGET_RANGE[L][0] || m > TARGET_RANGE[L][1]; });
  if (extra.fit?.best && off.length) {
    const { a, b, got } = extra.fit.best;
    recs.push({ priority: 1, file: "data/levels.js — XP_TO_NEXT (core/progression.js xpNeed đọc bảng)",
      from: `bảng hiện tại (tổng tới cấp 20 ≈ ${Array.from({ length: 19 }, (_, i) => xpNeed(i + 1)).reduce((x, y) => x + y, 0).toLocaleString("en")} XP)`,
      to: `≈ ${a} · lv^${b} (tổng ≈ ${extra.fit.best.totalXp20.toLocaleString("en")} XP)`,
      why: `Người chơi "chăm" tới cấp 4/7/10/20 sau ${[4, 7, 10, 20].map((L) => fmt(act(cham, L))).join(" / ")} chơi (mục tiêu 10 ph / 40 ph / 2 h / 10–12 h; lệch ở cấp ${off.join(", ")}). ` +
        `Với đường cong đề xuất, mô phỏng "chăm" cho ${[4, 7, 10, 20].map((L) => fmt(got[L])).join(" / ")}.` });
  }
  // 2) chặn cấp tối đa
  if (results.some((r) => r.final.level > 20)) {
    recs.push({ priority: 2, file: "core/progression.js — addXp", from: "không giới hạn", to: "dừng ở MAX_LEVEL (data/levels.js)",
      why: `Sau 7 ngày: ${results.map((r) => `${r.profile.name} cấp ${r.final.level}`).join(", ")}.` });
  }
  // 3) kinh tế bão hoà: xu cuối tuần nhiều hơn mọi chỗ tiêu còn lại (công trình + bậc Nhà)
  const sink = coinSinkLeft(cham);
  if (cham.final.coins > sink.left) {
    recs.push({ priority: 3, file: "data/buildings.js — thêm bậc Nhà / mốc công trình cuối game",
      from: `còn ${sink.left.toLocaleString("en")} xu chỗ tiêu`, to: "thêm vật phẩm tiêu xu lặp lại hoặc mốc nâng cao hơn",
      why: `"Chăm" kết thúc tuần với ${cham.final.coins.toLocaleString("en")} xu, nhiều hơn tổng giá mọi mốc xây / nâng còn lại (${sink.left.toLocaleString("en")} xu) — thu ${Math.round(cham.final.earned / cham.activeMin * 60).toLocaleString("en")} xu/giờ chơi.` });
  }
  // 4) vật nuôi lãi quá thấp so với 1 ô ruộng (vật nuôi còn phục vụ chuỗi bánh / nhiệm vụ ⇒ chỉ báo khi dưới 40 %)
  const ga = animalTable().find((a) => a.id === "ga"), bo = animalTable().find((a) => a.id === "bo-sua");
  const tomato = cropTable().find((c) => c.id === "ca-chua");
  if (ga.profitPerHourFarmFeed < tomato.coinPerPlotMin * 60 * 0.4) {
    recs.push({ priority: 4, decided: "M6: đã xét, không áp dụng — xem §11", file: "data/catalog.js — trung-ga.sell, sua.sell (và ANIMAL_REF); hoặc data/recipes.js thuc-an-gia-suc qty",
      from: `trứng ${ITEM["trung-ga"].sell}, sữa ${ITEM.sua.sell}`, to: "tăng giá trứng / sữa ~15 % hoặc 2 ngô → 4 bao thức ăn",
      why: `Một con gà lãi ${ga.profitPerHourFarmFeed} xu/giờ, bò ${bo.profitPerHourFarmFeed} xu/giờ (thức ăn tự làm) — dưới 40 % một ô cà chua (${Math.round(tomato.coinPerPlotMin * 60)} xu/giờ chưa tưới). Kiểm lại MARKET.assertEconomy() sau khi đổi.` });
  }
  // 5) vật liệu Nhà kính — chỉ khi có hồ sơ đủ cấp mà 7 ngày chưa xây được
  const greenhouse = BUILDING["nha-kinh"].levels[0];
  const slow = results.filter((r) => !r.firsts["built:nha-kinh@1"] && r.final.level >= 12);
  if (slow.length) recs.push({ priority: 5, file: "data/buildings.js — nha-kinh.levels[0].materials", from: `${JSON.stringify(greenhouse.materials)} + ${greenhouse.cost} xu`,
    to: "bớt ván gỗ (hoặc tăng MATERIAL_DROP 2 % → 5 % trong core/plots.js)",
    why: `${slow.map((r) => r.profile.name).join(", ")} đã cấp ≥ 12 nhưng 7 ngày chưa xây được Nhà kính.` });
  // 6) cây nhanh cho XP/phút như cây chậm ⇒ không có đánh đổi "cây nhanh khi đang chơi" (ưu tiên thấp, chỉ cảm giác lựa chọn)
  const crops = cropTable();
  const flat = Math.max(...crops.map((c) => c.xpPerPlotMin)) / Math.min(...crops.map((c) => c.xpPerPlotMin)) < 1.8;
  if (flat) recs.push({ priority: 6, decided: "M6: đã xét, không áp dụng — xem §11", file: "data/crops.js — xp", from: Object.keys(CROP_XP_TWEAK).map((id) => `${id} ${CROP[id].xp}`).join(", "),
    to: Object.entries(CROP_XP_TWEAK).map(([id, x]) => `${id} ${x}`).join(", ") + " (XP/phút-ô thấp hơn cho cây rất nhanh)",
    why: `XP mỗi phút-ô gần như phẳng (${crops.map((c) => c.xpPerPlotMin).join(" / ")}) nên cây 30 giây ăn đứt khi đang chơi. Giảm XP cây rất nhanh tạo đánh đổi "cây nhanh lấy xu / cây dài lấy XP".` +
      (fitCham ? ` Mô phỏng (đường cong dò được): chăm cấp 4/7/10/20 = ${[4, 7, 10, 20].map((L) => fmt(fitCham.withCropXp.levels[L]?.activeMin ?? null)).join(" / ")} so với ${[4, 7, 10, 20].map((L) => fmt(fitCham.levels[L]?.activeMin ?? null)).join(" / ")} không đổi XP cây — ưu tiên thấp.` : "") });
  // 7) lỗi nhiệm vụ chặn tiến trình (chỉ khi repro còn tái hiện)
  const bugs = Object.fromEntries(runBugChecks().map((b) => [b.id, b]));
  if (bugs["orders-no-animal-goods"]?.confirmed || bugs["delivered-no-items"]?.confirmed) {
    recs.push({ priority: 7, file: "core/orders.js (orderableProducts + deliver) — lỗi, không phải số", from: "đơn không đòi trứng/sữa; delivered thiếu items",
      to: "cho trứng/sữa + món làm từ chúng vào bộ sinh đơn khi có vật nuôi; thêm items: { ...order.items } vào sự kiện delivered",
      why: `Tiến trình M4 theo hồ sơ: ${results.map((r) => `${r.profile.name}: ${r.final.villageProg}/6`).join(", ")}.` });
  }
  return recs;
}
