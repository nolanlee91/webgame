// Milestone 6 — Sổ sưu tập 30 món, đơn đặc biệt hai lúc, Phiên chợ, hàng rào đá, ảnh nhà theo bậc (frame chờ Codex), save v7.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { apply } from "../core/apply.js?v=m12";
import { createState, loadSave, dump, SAVE_VERSION } from "../core/state.js?v=m12";
import { BOOK, BOOK_TIERS, unlockedCount, bookView, sanitize as sanitizeBook } from "../core/collection.js?v=m12";
import { fairAt, fairOfDay, nextFair, activeFair, quote, dayOf, FAIR_LEVEL, HOT_CROPS, HOT_GOODS } from "../core/fair.js?v=m12";
import { MARKET } from "../core/market.js?v=m12";
import { SPECIAL2_LEVEL, specialSlotCount, allOrders } from "../core/orders.js?v=m12";
import { effects, levelOf } from "../core/build.js?v=m12";
import { ITEM, ITEMS, iconCell, ICON2_IDS } from "../data/catalog.js?v=m12";
import { RECIPES } from "../data/recipes.js?v=m12";
import { BUILDING, HOUSE_SHEET, FENCE_SHEET } from "../data/buildings.js?v=m12";
import { FAIR_HOT_CAP, FAIR_DURATION_MS } from "../data/fair.js?v=m12";
import { TUTORIAL } from "../data/quests.js?v=m12";
import { farmSave, KEY, V6_KEY, V6_BACKUP_KEY } from "../save.js?v=m12";

const T = Date.UTC(2026, 10, 19, 1, 0, 0); // 8:00 giờ Việt Nam
const MIN = 60_000;
const act = (s, a, t = T) => { const r = apply(s, a, t); if (r.err) throw new Error(`${a.type}: ${r.err}`); return r; };
const err = (s, a, t = T) => apply(s, a, t).err;
function player(lv, coins = 1_000_000, t = T) {
  const s = createState(t, 21);
  s.level = lv; s.coins = coins; s.quests.tut = TUTORIAL.length;
  act(s, { type: "tick" }, t);
  return s;
}
const memStorage = (init = {}) => {
  const m = new Map(Object.entries(init));
  return { map: m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};

// ---------------- Sổ sưu tập ----------------
test("sổ sưu tập: đúng 30 món (nông sản, chăn nuôi, thành phẩm, vật liệu), không trùng, đều là vật phẩm có thật", () => {
  assert.equal(BOOK.length, 30);
  assert.equal(new Set(BOOK).size, 30);
  const by = (c) => BOOK.filter((id) => ITEM[id].cat === c).length;
  assert.deepEqual([by("nong-san"), by("chan-nuoi"), by("thanh-pham"), by("vat-lieu")], [7, 2, 18, 3]);
  assert.deepEqual(BOOK_TIERS.map((t) => t.at), [10, 20, 30]);
});

test("sổ ghi khi thu hoạch / nhận lần đầu (đếm số lượng), KHÔNG ghi khi mua ở chợ", () => {
  const s = player(8, 5000);
  act(s, { type: "plant", i: 12, crop: "ca-rot" });
  const r = act(s, { type: "harvest", i: 12 }, T + 31_000);
  assert.ok(r.events.some((e) => e.type === "bookNew" && e.id === "ca-rot"));
  assert.equal(s.collection.counts["ca-rot"], 1);
  act(s, { type: "plant", i: 12, crop: "ca-rot" }, T + 31_000);
  const r2 = act(s, { type: "harvest", i: 12 }, T + 62_000);
  assert.ok(!r2.events.some((e) => e.type === "bookNew"), "lần hai không báo món mới");
  assert.equal(s.collection.counts["ca-rot"], 2);
  act(s, { type: "marketBuy", id: "thuc-an-gia-suc", n: 2 }, T + 62_000);
  assert.equal(s.collection.counts["thuc-an-gia-suc"], undefined, "mua ở chợ không phải làm ra");
  act(s, { type: "marketSell", id: "ca-rot", n: 1 }, T + 62_000);
  assert.equal(s.collection.counts["ca-rot"], 2, "bán không làm giảm sổ");
});

test("mốc sổ: đủ 10 món ⇒ nhận theo thứ tự, thưởng xu + vật liệu + trang trí, không nhận 2 lần, thiếu món ⇒ lỗi, không đổi gì", () => {
  const s = player(12, 0);
  for (const id of BOOK.slice(0, 9)) s.collection.counts[id] = 1;
  const snap = structuredClone(s);
  assert.equal(err(s, { type: "claimBook", tier: 0 }), "book-incomplete");
  assert.deepEqual(s, snap);
  s.collection.counts[BOOK[9]] = 3;
  assert.equal(err(s, { type: "claimBook", tier: 1 }), "book-incomplete", "không nhảy mốc");
  const r = act(s, { type: "claimBook", tier: 0 });
  assert.ok(r.events.some((e) => e.type === "bookClaimed" && e.at === 10));
  assert.equal(s.coins, 800); assert.equal(s.stats.earned, 800);
  assert.equal(s.inv["van-go"], 2); assert.equal(s.inv["hop-dinh"], 2);
  assert.equal(err(s, { type: "claimBook", tier: 0 }), "book-claimed");
  for (const id of BOOK) s.collection.counts[id] = 1;
  act(s, { type: "claimBook", tier: 1 }); act(s, { type: "claimBook", tier: 2 });
  assert.equal(s.decor["ghe-tre"], 1); assert.equal(s.decor["den-long"], 1); assert.equal(s.decor["gieng-da"], 1);
  assert.equal(bookView(s).title, BOOK_TIERS[2].title);
  for (const bad of [3, -1, "0", 1.5, undefined]) assert.ok(err(s, { type: "claimBook", tier: bad }));
  // lưu / tải giữ sổ
  const back = loadSave(dump(s, T), T);
  assert.deepEqual(back.collection, s.collection);
});

test("sổ: bản lưu sửa tay bị kẹp (món lạ, số âm, mốc vượt số món thật)", () => {
  const c = sanitizeBook({ counts: { "ca-rot": 5, "xyz": 9, "ca-chua": -2, "mut-dau": 2.7, "chau-hoa": 3 }, claimed: 3 });
  assert.deepEqual(c.counts, { "ca-rot": 5, "mut-dau": 2 });
  assert.equal(c.claimed, 0, "2 món ⇒ chưa đủ mốc nào");
  assert.equal(unlockedCount({ collection: c }), 2);
});

test("save v6 → v7: giữ mọi thứ, sổ ghi sẵn món đang có trong kho, sao lưu v6 không xoá, đọc lại v7", () => {
  const s6 = createState(T, 5);
  Object.assign(s6, { v: 6, level: 18, coins: 4321, inv: { "mut-dau": 3, "ca-chua": 7, "van-go": 1 } });
  delete s6.collection; delete s6.fair; delete s6.orders.special2;
  const raw6 = JSON.stringify(s6);
  const st = memStorage({ [V6_KEY]: raw6 });
  const save = farmSave(st);
  const first = save.initialize(T);
  assert.equal(first.migrated, true); assert.equal(first.from, "v6");
  assert.equal(st.getItem(V6_BACKUP_KEY), raw6);
  assert.equal(st.getItem(V6_KEY), raw6, "bản v6 gốc vẫn còn");
  assert.equal(KEY, "wgp.nongtrai.v7");
  const v7 = JSON.parse(st.getItem(KEY));
  assert.equal(v7.v, 7); assert.equal(SAVE_VERSION, 7);
  const s = save.read(T + 1000).state;
  assert.equal(s.coins, 4321); assert.equal(s.level, 18);
  assert.deepEqual(s.inv, { "mut-dau": 3, "ca-chua": 7, "van-go": 1 });
  assert.deepEqual(s.collection.counts, { "ca-chua": 7, "mut-dau": 3, "van-go": 1 });
  assert.equal(s.collection.claimed, 0);
  assert.equal(save.read(T + 2000).migrated, false);
});

// ---------------- đơn đặc biệt hai lúc ----------------
test("đơn đặc biệt hai lúc: cấp 11–17 một ô, cấp 18 hai ô (special + special2), giao / bỏ ô thứ hai như ô thứ nhất", () => {
  assert.equal(SPECIAL2_LEVEL, 18);
  assert.deepEqual([specialSlotCount(10), specialSlotCount(11), specialSlotCount(17), specialSlotCount(18)], [0, 1, 1, 2]);
  const a = player(17);
  assert.ok(a.orders.special?.order); assert.equal(a.orders.special2, null);
  const s = player(18);
  const o = s.orders.special2.order;
  assert.ok(o && o.type === "dac-biet" && o.expiresAt === o.createdAt + 2 * 3600_000);
  assert.notEqual(o.id, s.orders.special.order.id);
  assert.equal(allOrders(s).filter((x) => x.type === "dac-biet").length, 2);
  for (const [id, q] of Object.entries(o.items)) s.inv[id] = (s.inv[id] || 0) + q;
  const before = s.coins, rev = s.orders.special2.rev;
  assert.equal(err(s, { type: "deliver", slot: "special2", id: o.id, rev: rev + 1 }), "order-changed");
  const r = act(s, { type: "deliver", slot: "special2", id: o.id, rev });
  assert.ok(s.coins > before);
  assert.ok(r.events.some((e) => e.type === "delivered" && e.slot === "special2" && e.orderType === "dac-biet"));
  assert.equal(s.orders.special2.order, null);
  assert.equal(s.orders.special2.refillAt, T + 15 * MIN);
  act(s, { type: "tick" }, T + 15 * MIN);
  assert.ok(s.orders.special2.order, "đơn mới sau 15 phút");
  // lưu / tải giữ đơn thứ hai; ô thứ hai chỉ nhận đơn đặc biệt
  const back = loadSave(dump(s, T + 15 * MIN), T + 15 * MIN);
  assert.equal(back.orders.special2.order.id, s.orders.special2.order.id);
  const raw = JSON.parse(dump(s, T)); raw.orders.special2.order = { ...raw.orders.slots[0].order };
  assert.equal(loadSave(raw, T).orders.special2.order, null);
  const low = JSON.parse(dump(s, T)); low.level = 12;
  assert.equal(loadSave(low, T).orders.special2, null, "dưới cấp 18 không giữ ô thứ hai");
  // bỏ đơn ô thứ hai
  const x = s.orders.special2;
  act(s, { type: "cancelOrder", slot: "special2", id: x.order.id, rev: x.rev }, T + 15 * MIN);
  assert.equal(s.orders.special2.order, null);
});

// ---------------- Phiên chợ ----------------
test("phiên chợ: mỗi ngày đúng 1 phiên 30 phút trong 9:00–22:00 giờ Việt Nam, tất định, 3 hàng săn (1 nông sản + 2 hàng)", () => {
  const days = new Set();
  for (let d = 0; d < 60; d++) {
    const f = fairOfDay(dayOf(T) + d);
    const vn = new Date(f.startAt + 7 * 3600_000);
    const minutes = vn.getUTCHours() * 60 + vn.getUTCMinutes();
    assert.ok(minutes >= 9 * 60 && minutes + 30 <= 22 * 60, `ngày ${d}: ${minutes}`);
    assert.equal(f.endAt - f.startAt, FAIR_DURATION_MS);
    assert.equal(dayOf(f.startAt), f.day);
    assert.deepEqual(fairOfDay(f.day), f, "tất định");
    assert.equal(f.hot.length, 3); assert.equal(new Set(f.hot).size, 3);
    assert.ok(HOT_CROPS.includes(f.hot[0]) && HOT_GOODS.includes(f.hot[1]) && HOT_GOODS.includes(f.hot[2]));
    days.add(minutes);
  }
  assert.ok(days.size > 10, "giờ phiên đổi theo ngày");
  assert.ok(!HOT_GOODS.includes("thuc-an-gia-suc"));
  const f = fairAt(T);
  assert.equal(fairAt(f.startAt).active, true); assert.equal(fairAt(f.endAt).active, false); assert.equal(fairAt(f.startAt - 1).active, false);
  assert.equal(nextFair(f.endAt).day, f.day + 1);
  assert.equal(nextFair(f.startAt - 1).day, f.day);
});

test("phiên chợ: cấp ≥ 18 trong phiên ⇒ thành phẩm ×1,25 (giá chốt), hàng săn ×1,5 cho 10 món đầu rồi về giá thường; ngoài phiên / dưới cấp ⇒ giá chợ", () => {
  const f = fairAt(T), t = f.startAt + 60_000;
  const s = player(18, 0, t);
  assert.equal(FAIR_LEVEL, 18);
  assert.ok(activeFair(s, t));
  assert.equal(activeFair(player(17, 0, t), t), null);
  assert.equal(activeFair(s, f.endAt + 1), null);
  // thành phẩm thường (không phải hàng săn)
  const prod = ITEMS.find((it) => it.cat === "thanh-pham" && !f.hot.includes(it.id) && it.id !== "thuc-an-gia-suc").id;
  assert.equal(quote(s, prod, 2, t).coins, 2 * Math.round(ITEM[prod].sell * 1.25));
  assert.equal(quote(s, prod, 2, f.endAt).coins, 2 * MARKET.priceOf(prod, f.endAt));
  // nông sản không phải hàng săn: giá chợ thường
  const crop = HOT_CROPS.find((id) => !f.hot.includes(id));
  assert.equal(quote(s, crop, 3, t).coins, 3 * MARKET.priceOf(crop, t));
  // hàng săn: 12 món ⇒ 10 món giá rưỡi + 2 món giá phiên / giá chợ, qua apply (marketSell) + hạn mức lưu trong s.fair
  const hot = f.hot[0], hotPrice = Math.round(ITEM[hot].sell * 1.5), rest = MARKET.priceOf(hot, t);
  s.inv[hot] = 12;
  const r = act(s, { type: "marketSell", id: hot, n: 12 }, t);
  const ev = r.events.find((e) => e.type === "sold");
  assert.equal(ev.coins, 10 * hotPrice + 2 * rest); assert.equal(ev.hot, 10); assert.equal(ev.fair, true);
  assert.equal(s.coins, ev.coins);
  assert.deepEqual(s.fair, { day: f.day, sold: { [hot]: FAIR_HOT_CAP } });
  assert.equal(activeFair(s, t).left[hot], 0);
  s.inv[hot] = 1;
  assert.equal(act(s, { type: "sell", id: hot, n: 1 }, t).events.find((e) => e.type === "sold").coins, rest, "hết hạn mức ⇒ giá thường");
  // lưu / tải giữ hạn mức trong ngày; hôm sau làm lại từ đầu
  const back = loadSave(dump(s, t), t);
  assert.deepEqual(back.fair, s.fair);
  const tomorrow = fairOfDay(f.day + 1);
  const b2 = loadSave(dump(s, t), tomorrow.startAt + 1);
  assert.ok(Object.values(activeFair(b2, tomorrow.startAt + 1).left).every((n) => n === FAIR_HOT_CAP));
  // kẹp: ngày ở tương lai / món lạ
  const raw = JSON.parse(dump(s, t)); raw.fair = { day: f.day + 99, sold: { [hot]: 5 } };
  assert.deepEqual(loadSave(raw, t).fair, { day: null, sold: {} });
  raw.fair = { day: f.day, sold: { "chau-hoa": 4, [hot]: 1e9 } };
  assert.deepEqual(loadSave(raw, t).fair.sold, { [hot]: FAIR_HOT_CAP });
});

test("phiên chợ không mở vòng lời: assertEconomy tính cả giá phiên chợ, thức ăn mua 72 xu", () => {
  const rep = MARKET.assertEconomy();
  assert.deepEqual(rep.violations, []);
  assert.equal(ITEM["thuc-an-gia-suc"].buy, 72);
  assert.ok(rep.costs.bo > ITEM.bo.sell * 1.5 && rep.costs["pho-mai"] > ITEM["pho-mai"].sell * 1.5);
  assert.ok(MARKET.maxSell("bo") >= ITEM.bo.sell * 1.5);
});

// ---------------- 6 công thức mới ----------------
test("6 công thức M6: đúng máy / cấp, giá ra 1,25–1,45 × giá vào, vào được bộ sinh đơn khi làm được", () => {
  const ids = ["banh-ngo", "sinh-to-dau", "bap-rang-bo", "che-bi-ngo", "sua-chua", "banh-gao"];
  for (const id of ids) {
    const r = RECIPES.find((x) => x.output === id);
    assert.ok(r && ITEM[id]?.cat === "thanh-pham", id);
    const raw = Object.entries(r.inputs).reduce((t, [k, q]) => t + ITEM[k].sell * q, 0);
    const k = ITEM[id].sell / raw;
    assert.ok(k >= 1.25 && k <= 1.45, `${id} ×${k.toFixed(2)}`);
    const c = iconCell(id);
    assert.ok(c.sheet === "items" && c.filter !== undefined && c.hd.sheet === "items-2", `${id} icon dự phòng + ô items-2`);
  }
  assert.deepEqual(ICON2_IDS.slice(0, 6), ids);
});

// ---------------- hàng rào đá, nhà theo bậc ----------------
test("hàng rào: có sẵn (gỗ), nâng lên hàng rào đá từ cấp 15 bằng xu + vật liệu, xong ngay, lưu / tải giữ", () => {
  const def = BUILDING["hang-rao"];
  assert.equal(def.kind, "prebuilt"); assert.equal(def.levels[1].unlock, 15);
  assert.equal(def.levels[1].sprite.sheet, FENCE_SHEET); assert.equal(def.levels[1].sprite.fallback.filter, "stone");
  const low = player(14);
  low.inv["hop-dinh"] = 9; low.inv["thung-son"] = 9;
  assert.equal(err(low, { type: "startUpgrade", id: "hang-rao" }), "locked");
  const s = player(15, 10_000);
  assert.equal(err(s, { type: "startUpgrade", id: "hang-rao" }), "materials");
  s.inv["hop-dinh"] = 4; s.inv["thung-son"] = 2;
  const r = act(s, { type: "startUpgrade", id: "hang-rao" });
  assert.ok(r.events.some((e) => e.type === "buildingDone" && e.id === "hang-rao"));
  assert.equal(s.coins, 4000); assert.equal(s.inv["hop-dinh"], undefined);
  assert.equal(effects(s, T).stoneFence, true);
  assert.equal(err(s, { type: "startUpgrade", id: "hang-rao" }), "max");
  assert.equal(levelOf(loadSave(dump(s, T), T), "hang-rao", T), 2);
});

test("ảnh nhà theo bậc: bậc n dùng frame nha-bac-n của sheet house-tiers, dự phòng garden/house; hợp đồng asset liệt kê đủ", () => {
  const L = BUILDING.nha.levels;
  assert.equal(L[0].sprite.sheet, "garden");
  for (let i = 1; i < L.length; i++) {
    assert.deepEqual([L[i].sprite.sheet, L[i].sprite.id, L[i].sprite.tier], [HOUSE_SHEET, `nha-bac-${i}`, i]);
    assert.deepEqual(L[i].sprite.fallback, { sheet: "garden", id: "house" });
  }
  const spec = JSON.parse(readFileSync(new URL("../../../../docs/nong-trai/asset-spec.json", import.meta.url), "utf8"));
  const sheet = (f) => spec.sheets.find((x) => x.file === `assets/v3/${f}.webp`);
  assert.deepEqual(sheet("house-tiers").frames, ["nha-bac-{1..10}"]);
  assert.deepEqual(sheet("hang-rao").frames, ["hang-rao-da"]);
  assert.deepEqual(sheet("items-2").frames, ICON2_IDS);
  for (const f of ["house-tiers", "hang-rao", "items-2", "phien-cho"]) assert.equal(sheet(f).optional, true);
});
