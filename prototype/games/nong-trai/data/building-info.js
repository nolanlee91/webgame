// "Công dụng" của từng công trình / máy, viết cho trẻ em: dùng để làm gì (use), được gì ở level này (gain), làm gì tiếp (next).
// Thuần dữ liệu + hàm nhỏ. MỌI con số lấy từ data (buildings / warehouse / animals / machines / recipes) — không gõ cứng số,
// đổi cân bằng ở data thì chữ tự đổi theo (test/building-info.test.mjs kiểm).
//
// Mỗi mục:
//   use               1 câu "dùng để …" (không có chữ "Dùng để" ở đầu — giao diện tự thêm).
//   stats(lv) → []    chỉ số chính ở level lv (lv = 0: chưa xây) — { label, value, unit? }. Nâng cấp ⇒ giao diện hiện "trước → sau".
//   gain(lv, from)    from = 0 ⇒ mô tả ĐẦY ĐỦ level lv (xây xong / xem công trình); from ≥ 1 ⇒ chỉ phần THÊM khi nâng (dòng "trước → sau"
//                     của stats đã tự có, không lặp lại).
//   next              1 câu hành động.
//   verb?             "xây" (mặc định) | "mở" | "lắp" — tiêu đề "Bạn vừa <verb> <tên>!".
import { BUILDING, FAME_TITLES } from "./buildings.js?v=m8";
import { WAREHOUSE, OVERFLOW_MAX } from "./warehouse.js?v=m8";
import { ANIMAL } from "./animals.js?v=m8";
import { MACHINES, MACHINE, BASE_SLOTS } from "./machines.js?v=m8";
import { recipesOf } from "./recipes.js?v=m8";
import { ITEM } from "./catalog.js?v=m8";
import { CROP } from "./crops.js?v=m8";

const eff = (id, lv) => BUILDING[id]?.levels[Math.max(0, lv - 1)]?.effect || {};
const lower = (t) => t.charAt(0).toLowerCase() + t.slice(1);
const list = (xs) => (xs.length <= 1 ? xs.join("") : xs.slice(0, -1).join(", ") + " và " + xs[xs.length - 1]);
const minutes = (ms) => { const m = ms / 60_000; return Number.isInteger(m) ? `${m} phút` : `${Math.round(ms / 1000)} giây`; };
const pct = (x) => `+${Math.round(x * 100)} %`;
/** Tên món làm ra của máy (theo vật phẩm đầu ra, không kèm "×3"). */
const outputsOf = (machineId) => [...new Set(recipesOf(machineId).map((r) => ITEM[r.output]?.name || r.name))];

/** Ô hàng chờ của máy ở level lv (1 = vừa lắp). */
export const machineSlots = (id, lv) => (lv <= 1 ? BASE_SLOTS : MACHINE[id]?.upgrades[lv - 2]?.slots ?? BASE_SLOTS);

function animalPen(kind, id) {
  const a = ANIMAL[kind], product = lower(ITEM[a.product].name), animal = lower(a.name);
  const cap = (lv) => eff(id, lv)[kind === "ga" ? "chickenCap" : "cowCap"] ?? 0;
  return {
    use: `Nuôi ${animal} để lấy ${product} mang bán hoặc giao đơn.`,
    stats: (lv) => [{ label: `Số ${animal} nuôi được`, value: cap(lv), unit: "con" }],
    gain: (lv, from) => from ? [] : [
      `Nuôi được ${cap(lv)} ${animal} (${a.buy} xu một con).`,
      `Cho ăn ${a.feed} bao thức ăn, ${minutes(a.cycleMs)} sau có ${a.qty} ${product}.`,
    ],
    next: `Chạm vào ${lower(BUILDING[id].name)} để mua ${animal} và cho ăn.`,
  };
}

export const BUILDING_INFO = Object.freeze({
  "nha-kho": {
    use: "Cất mọi thứ bạn thu hoạch và làm ra, để dành bán hoặc giao đơn.",
    stats: (lv) => [{ label: "Kho", value: WAREHOUSE[Math.max(0, lv - 1)].cap, unit: "chỗ" }],
    gain: (lv, from) => from ? [] : [
      `Kho chứa được ${WAREHOUSE[Math.max(0, lv - 1)].cap} món.`,
      ...(lv === 1 && WAREHOUSE[1] ? [`Từ giờ nâng kho được: lần nâng đầu lên ${WAREHOUSE[1].cap} chỗ.`] : []),
      `Kho đầy thì hàng mới vào giỏ tràn (tối đa ${OVERFLOW_MAX} món).`,
    ],
    next: "Chạm vào Nhà kho để xem đồ của bạn.",
  },
  xuong: {
    use: "Biến nông sản thành món ngon, bán được nhiều xu hơn.",
    stats: (lv) => (lv >= 1 ? [{ label: "Ô chờ thêm cho mỗi máy", value: eff("xuong", lv).extraQueueSlots ?? 0, unit: "ô" }] : []),
    gain: (lv, from) => {
      const extra = eff("xuong", lv).extraQueueSlots ?? 0;
      const up = extra ? [`Mọi máy trong Xưởng xếp thêm được ${extra} món chờ làm.`] : [];
      if (from) return up;
      const kit = MACHINES.find((m) => m.withWorkshop), later = MACHINES.filter((m) => !m.withWorkshop).slice(0, 2);
      return [
        `Có ngay máy ${kit.name}: làm ${list(outputsOf(kit.id).map(lower))}.`,
        `Sau này lắp thêm ${list(later.map((m) => `${m.name} (cấp ${m.unlock})`))}.`,
        ...up,
      ];
    },
    next: "Chạm vào Xưởng, chọn máy rồi chọn món muốn làm.",
  },
  "nha-kinh": {
    use: `Trồng ${lower(CROP.mia.name)} và các cây khác mà không cần tưới.`,
    stats: (lv) => [{ label: "Ô Nhà kính", value: eff("nha-kinh", lv).greenhousePlots ?? 0, unit: "ô" }],
    gain: (lv, from) => from ? [] : [
      `${eff("nha-kinh", lv).greenhousePlots} ô trồng trong nhà, cây không cần tưới.`,
      `Chỉ ở đây mới trồng được ${lower(CROP.mia.name)}.`,
    ],
    next: "Chạm vào Nhà kính để gieo hạt.",
  },
  "dat-phia-dong": {
    verb: "mở",
    use: "Mở rộng nông trại sang bên phải để có thêm ruộng.",
    stats: (lv) => [{ label: "Ô ruộng phía Đông", value: lv >= 1 ? eff("dat-phia-dong", lv).eastPlots : 0, unit: "ô" }],
    gain: (lv) => [`+${eff("dat-phia-dong", Math.max(1, lv)).eastPlots} ô ruộng mới để gieo hạt.`, "Bản đồ rộng ra bên phải."],
    next: "Kéo bản đồ sang phải rồi gieo hạt vào ruộng mới.",
  },
  "chuong-ga": animalPen("ga", "chuong-ga"),
  "chuong-bo": animalPen("bo-sua", "chuong-bo"),
  "sap-cho": {
    use: "Bán nông sản theo giá chợ và mua vật tư, đồ trang trí.",
    stats: () => [],
    gain: (lv) => (lv >= 2 ? ["Sạp nhỏ thành quầy chợ to đẹp trên bản đồ."] : ["Có sẵn từ đầu: bán hàng theo giá chợ hôm nay."]),
    next: "Chạm vào Khu chợ để bán hàng hoặc mua đồ.",
  },
  nha: {
    use: "Nâng Nhà để nông trại nổi tiếng hơn và đơn hàng trả nhiều xu hơn.",
    stats: (lv) => [
      { label: "Danh hiệu", value: `“${FAME_TITLES[Math.max(0, lv - 1)]}”` },
      { label: "Đơn hàng trả thêm", value: pct(eff("nha", Math.max(1, lv)).orderBonus ?? 0), unit: "xu" },
    ],
    gain: (lv, from) => from ? [] : [
      `Danh hiệu “${FAME_TITLES[Math.max(0, lv - 1)]}”.`,
      (eff("nha", lv).orderBonus ?? 0) > 0 ? `Mọi đơn hàng trả thêm ${pct(eff("nha", lv).orderBonus)} xu.`
        : `Từ cấp ${BUILDING.nha.levels[1].unlock} nâng Nhà để có danh hiệu mới và đơn hàng trả thêm xu.`,
    ],
    next: "Giao đơn hàng để nhận thêm xu nhờ danh tiếng mới.",
  },
  "hang-rao": {
    use: "Rào quanh ruộng cho nông trại gọn gàng, đẹp mắt.",
    stats: () => [],
    gain: (lv) => (lv >= 2 ? ["Hàng rào gỗ thành hàng rào đá chắc chắn."]
      : [`Hàng rào gỗ có sẵn quanh ruộng. Từ cấp ${BUILDING["hang-rao"].levels[1].unlock} nâng lên hàng rào đá.`]),
    next: "Nhìn xuống mép dưới bản đồ để ngắm hàng rào.",
  },
  "bang-don-hang": {
    use: "Xem bà con cần mua gì, gom đủ hàng rồi giao để lấy xu.",
    stats: () => [],
    gain: () => ["Có sẵn từ đầu. Giao xong đơn thì đơn mới tự đến."],
    next: "Chạm vào Bảng đơn hàng để xem đơn.",
  },
  "bien-lang": {
    use: "Lối vào Làng, nơi bà con nhờ bạn làm nhiệm vụ.",
    stats: () => [],
    gain: () => [`Tự hiện ở cấp ${BUILDING["bien-lang"].levels[0].unlock}.`],
    next: "Chạm vào biển Làng để vào Làng.",
  },
  "xe-giao-hang": {
    use: "Xe của Anh Út ghé cổng chở hàng mỗi khi bạn giao đơn.",
    stats: () => [],
    gain: () => [`Tự hiện ở cấp ${BUILDING["xe-giao-hang"].levels[0].unlock}.`],
    next: "Giao một đơn hàng để xem xe chạy tới.",
  },
});

/** Máy trong Xưởng (cùng dạng). Cối xay gió trên bản đồ = máy "coi-xay". */
export const MACHINE_INFO = Object.freeze(Object.fromEntries(MACHINES.map((m) => [m.id, {
  verb: "lắp",
  use: (() => { const o = outputsOf(m.id).map(lower); return o.length > 3 ? `Làm ${o.slice(0, 3).join(", ")} và nhiều món khác.` : `Làm ${list(o)}.`; })(),
  stats: (lv) => (lv >= 1 ? [{ label: "Món chờ làm cùng lúc", value: machineSlots(m.id, lv), unit: "món" }] : []),
  gain: (lv, from) => from ? [] : [
    `Xếp được ${machineSlots(m.id, lv)} món chờ làm cùng lúc.`,
    ...(m.requires ? [`Đặt trong ${BUILDING[m.requires].name}.`] : []),
  ],
  next: `Vào Xưởng, chạm ${lower(m.name)} rồi chọn món muốn làm.`,
}])));

const fmtStat = (st) => `${typeof st.value === "number" ? st.value.toLocaleString("vi-VN") : st.value}${st.unit ? " " + st.unit : ""}`;

/**
 * Công dụng của công trình `id` (hoặc máy, kind = "machine") khi lên level `to` từ level `from` (mặc định to − 1).
 * Trả { id, name, title, use, change[], gain[], next } — change: các dòng "Kho: 60 → 90 chỗ" (chỉ khi nâng, from ≥ 1);
 * gain: change + phần thêm. from = 0 ⇒ gain mô tả đầy đủ level `to`.
 */
export function about(id, to, from = to - 1, kind = "building") {
  const machineId = kind === "machine" ? id : BUILDING[id]?.kind === "machine" ? BUILDING[id].machine : null;
  const info = machineId ? MACHINE_INFO[machineId] : BUILDING_INFO[id];
  if (!info) return null;
  const name = machineId && kind === "machine" ? MACHINE[machineId].name : BUILDING[id]?.name || MACHINE[id]?.name || id;
  const max = kind === "machine" ? MACHINE[id].upgrades.length + 1 : BUILDING[id]?.levels.length || 1;
  const lv = Math.min(max, Math.max(1, to | 0)), fr = Math.min(lv, Math.max(0, from | 0));
  const change = [];
  if (fr >= 1 && fr < lv) {
    const a = info.stats(fr), b = info.stats(lv);
    b.forEach((st, k) => { if (a[k] && a[k].value !== st.value) change.push(`${st.label}: ${a[k].value.toLocaleString?.("vi-VN") ?? a[k].value} → ${fmtStat(st)}`); });
  }
  const title = fr === 0 ? `Bạn vừa ${info.verb || "xây"} ${name}!` : id === "nha" ? `Nhà lên bậc ★${lv - 1}!` : `${name} lên cấp ${lv}!`;
  return { id, name, title, use: info.use, change, gain: [...change, ...info.gain(lv, fr)], next: info.next };
}
/** Chỉ số chính (dòng đầu) ở level lv — để test / giao diện. */
export const statsOf = (id, lv, kind = "building") => (kind === "machine" ? MACHINE_INFO[id] : BUILDING_INFO[id] || MACHINE_INFO[BUILDING[id]?.machine])?.stats(lv) || [];
