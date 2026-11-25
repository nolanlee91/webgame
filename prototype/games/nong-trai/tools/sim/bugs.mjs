// Repro tối thiểu cho các lỗi luật mà bộ mô phỏng phát hiện. Mỗi mục tự chạy lại trên luật thật ⇒ `confirmed` cho biết
// lỗi còn hay đã được sửa. KHÔNG sửa luật ở đây — chỉ báo.
import { Farm } from "./harness.mjs";
import { plots, orders, quests, B, P, A, V } from "./harness.mjs";
import { addXp } from "../../core/progression.js?v=m11";
import { MAX_LEVEL } from "../../data/levels.js?v=m11";
import { QUESTS } from "../../data/quests.js?v=m11";

const NOW = 1_000_000;
const fresh = () => new Farm(NOW, 7);

export const BUG_CHECKS = [
  {
    id: "xp-no-cap",
    title: "addXp() không dừng ở cấp tối đa (MAX_LEVEL = 20) — người chơi chăm lên cấp 100+",
    file: "core/progression.js addXp",
    repro: "const s = { level: 1, xp: 0 }; addXp(s, 1e6, []); s.level // > 20",
    run() { const s = { level: 1, xp: 0 }; addXp(s, 1e6, []); return { confirmed: s.level > MAX_LEVEL, detail: `level = ${s.level}` }; },
  },
  {
    id: "orders-no-animal-goods",
    title: "Bộ sinh đơn không bao giờ đòi trứng / sữa, cũng không đòi món cần trứng / sữa (bánh trứng, bánh bí ngô, bơ, phô mai, flan) ⇒ nhiệm vụ M4 \"giao-don-trung-sua\" không thể xong ⇒ chặn mọi nhiệm vụ tiến trình M4 sau nó (lam-banh-trung, xay-chuong-bo)",
    file: "core/orders.js orderableProducts / orderableCrops",
    repro: "trạng thái cấp 12, có Lò bánh + Máy bơ sữa đã xây, gà, bò: orderableItems(s, now) không chứa trung-ga / sua / banh-trung",
    run() {
      const f = fresh(), s = f.s;
      s.level = 16;
      for (const id of ["bep-sen", "coi-xay", "lo-banh", "may-bo-sua"]) P.grantMachine(s.production, id, 0);
      // có đàn thật (2 gà, 1 bò) — bộ sinh đơn chỉ đòi trứng / sữa khi người chơi nuôi được
      s.animals.list.push({ uid: 1, kind: "ga", fedAt: null, readyAt: null }, { uid: 2, kind: "ga", fedAt: null, readyAt: null }, { uid: 3, kind: "bo-sua", fedAt: null, readyAt: null });
      const items = orders.orderableItems(s, NOW);
      const missing = ["trung-ga", "sua", "banh-trung", "banh-bi-ngo", "bo", "pho-mai"].filter((id) => !items.includes(id));
      return { confirmed: missing.length > 0, detail: `không bao giờ có trong đơn: ${missing.join(", ")}` };
    },
  },
  {
    id: "delivered-no-items",
    title: "Sự kiện `delivered` của orders.deliver() thiếu `items` ⇒ nhiệm vụ M4 dùng `hasItem` (giao-don-trung-sua, chuỗi Bác Tư bước 3 \"đơn kết hợp có bánh\") không bao giờ đếm",
    file: "core/orders.js deliver (events.push delivered)",
    repro: "giao 1 đơn ⇒ events.find(e => e.type === 'delivered').items === undefined",
    run() {
      const f = fresh(), s = f.s;
      s.inv["ca-rot"] = 5;
      const x = s.orders.slots[0], ev = [];
      orders.deliver(s, 0, x.order.id, x.rev, NOW, ev);
      const e = ev.find((e) => e.type === "delivered");
      return { confirmed: !!e && e.items === undefined, detail: e ? `fields: ${Object.keys(e).join(", ")}` : "không giao được" };
    },
  },
  {
    id: "tutorial-missed-event",
    title: "Nhiệm vụ hướng dẫn chỉ đếm sự kiện khi đang mở ⇒ nâng kho (một lần, mốc sau cần cấp 6 + vật liệu) TRƯỚC khi tới bước \"nang-kho\" làm sổ nhiệm vụ kẹt; kéo theo cả 5 nhiệm vụ tiến trình M2 (xây Xưởng, làm mứt …) không bao giờ mở",
    file: "core/quests.js track + data/quests.js TUTORIAL (nang-kho)",
    repro: "s.quests.tut = 0; upgradeWarehouse (event warehouseUpgraded) ⇒ hoàn thành các bước trước ⇒ ở bước nang-kho progress = 0 mãi",
    run() {
      const f = fresh(), s = f.s;
      const ev = [{ type: "warehouseUpgraded", level: 1 }];
      s.quests.tut = QUESTS.findIndex((q) => q.id === "mo-o-dat");
      quests.track(s, ev); // nâng kho lúc đang ở bước "mở ô đất" ⇒ không tính
      s.quests.progress = 1; quests.claim(s, "mo-o-dat", []);
      quests.track(s, []);
      return { confirmed: QUESTS[s.quests.tut].id === "nang-kho" && s.quests.progress === 0,
        detail: "sim: hồ sơ \"ngày 2 lần\" kẹt ở bước này suốt 7 ngày" };
    },
  },
  {
    id: "mia-outside-greenhouse",
    title: "Mía gieo được ở MỌI ô ruộng thường: plots.plant chỉ kiểm cropUnlocked (Nhà kính đã xây), không kiểm ô có thuộc Nhà kính không ⇒ 6 ô nhà kính không còn ý nghĩa (người chơi trồng mía cả 25 ô)",
    file: "core/plots.js plant (chưa có khái niệm ô nhà kính)",
    repro: "s.level = 10; s.buildings['nha-kinh'] = { level: 1, done: true }; plant(s, 12 /* ô ruộng giữa */, 'mia', now) ⇒ ok",
    run() {
      const f = fresh(), s = f.s;
      s.level = 10; s.coins = 100;
      s.buildings["nha-kinh"] = { level: 1, done: true, startAt: NOW, readyAt: NOW };
      const r = plots.plant(s, 12, "mia", NOW, []);
      return { confirmed: !!r.ok, detail: r.ok ? "ô ruộng 12 (không phải nhà kính) đang trồng mía" : r.err };
    },
  },
  {
    id: "stuck-ignores-animals",
    title: "Lưới an toàn: stuck() không xét vật nuôi đang làm trứng / sữa (chỉ xét cây + máy) ⇒ có thể tặng hạt dù sắp có hàng bán (nhẹ)",
    file: "core/economy.js stuck",
    repro: "coins 0, ruộng trống, kho trống, 1 gà đang ấp ⇒ stuck(s) === true",
    run() {
      const f = fresh(), s = f.s;
      s.coins = 0; s.freeSeeds = 0;
      s.animals.list.push({ uid: 1, kind: "ga", fedAt: NOW, readyAt: NOW + 240_000 });
      return { confirmed: f.s && (awaitStuck(s)), detail: "gà đang ấp nhưng vẫn coi là kẹt" };
    },
  },
  {
    id: "workshop-level-format",
    title: "Hai định dạng bản ghi Xưởng: core/workshop.js coi `buildings.xuong.level` là level ĐANG xây (M2), core/build.js là level ĐÃ XONG (M3). extraSlots() của workshop.js (orders.productUnit dùng) lệch 1 khi đang nâng Xưởng lên cấp 2 theo kiểu M3 — cần chốt một định dạng khi ghép",
    file: "core/workshop.js extraSlots · core/build.js",
    repro: "bản ghi M2 { level: 2, readyAt: tương lai } ⇒ extraSlots = 1 dù chưa xong; bản ghi M3 đang nâng { level: 1, done: false } ⇒ 0 (đúng)",
    run() {
      // M3 đang nâng Xưởng lên cấp 2 (chưa xong) ⇒ chưa có ô cộng thêm; xong ⇒ +1. workshop.extraSlots đọc build.effects (một định dạng).
      const s = { buildings: { xuong: { level: 1, done: false, startAt: NOW, readyAt: NOW + 60_000 } } };
      const before = B.effects(s, NOW).extraQueueSlots, after = B.effects(s, NOW + 60_000).extraQueueSlots;
      return { confirmed: !(before === 0 && after === 1), detail: `đang nâng ⇒ ${before} ô thêm, xong ⇒ ${after}` };
    },
  },
];

import { stuck } from "../../core/economy.js?v=m11";
function awaitStuck(s) { return stuck(s); }

export function runBugChecks() {
  return BUG_CHECKS.map((b) => {
    let res;
    try { res = b.run(); } catch (e) { res = { confirmed: false, detail: "lỗi khi chạy repro: " + e.message }; }
    return { id: b.id, title: b.title, file: b.file, repro: b.repro, ...res };
  });
}
void A; void V; void B; void addXp;
