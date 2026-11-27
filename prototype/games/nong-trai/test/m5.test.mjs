// Milestone 5 — hồi quy: bố cục bản đồ 960 × 640 (không công trình nào bị cắt mép / đè ruộng), bậc Nhà "danh tiếng" (chỗ tiêu xu
// cuối game + đơn hàng thêm xu), đường XP mới + dồn XP save cũ, needsSync một bản chép, một tag module ?v=m18 cho mọi import.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { apply, needsSync } from "../core/apply.js?v=m18";
import { createState, loadSave, dump, carryXp } from "../core/state.js?v=m18";
import { orderPayout } from "../core/orders.js?v=m18";
import { effects } from "../core/build.js?v=m18";
import { xpNeed } from "../core/progression.js?v=m18";
import { BUILDINGS, BUILDING, DECOR_SLOTS, FIELD, MAP_W, MAP_H, FAME_TITLES, FAME_BONUS_STEP } from "../data/buildings.js?v=m18";
import { CURRENT_MILESTONE, LEVELS, featureLevel } from "../data/levels.js?v=m18";
import { TUTORIAL } from "../data/quests.js?v=m18";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = JSON.parse(readFileSync(join(ROOT, "assets/v3/manifest.json"), "utf8"));
const GARDEN = { house: [269, 184], market: [205, 190], fence: [229, 77] }; // = ui/farm-map.js
// Milestone 6: sheet chưa có trong manifest (chờ Codex) ⇒ hộp tính theo hợp đồng docs/nong-trai/asset-spec.json (ô + neo)
const SPEC = JSON.parse(readFileSync(join(ROOT, "../../../docs/nong-trai/asset-spec.json"), "utf8"));
const specFrame = (sp) => { const sh = SPEC.sheets.find((x) => x.file === "assets/v3/" + sp.sheet + ".webp"); return sh ? { width: sh.cell[0], height: sh.cell[1], anchor: sh.anchor } : null; };
const T = 5_000_000, MIN = 60_000;
const act = (s, a, t = T) => { const r = apply(s, a, t); if (r.err) throw new Error(`${a.type}: ${r.err}`); return r; };
function player(lv, coins = 2_000_000, t = T) {
  const s = createState(t, 11);
  s.level = lv; s.coins = coins; s.quests.tut = TUTORIAL.length;
  act(s, { type: "tick" }, t);
  return s;
}
const frameOf = (sp) => MANIFEST.sheets[sp.sheet]?.frames.find((f) => f.id === sp.id);
/** Hộp vẽ (px bản đồ) như ui/farm-map.js place(): neo đáy-giữa theo manifest. */
function box(def, sprite) {
  const x = def.x * MAP_W, y = def.y * MAP_H, w = def.w * MAP_W;
  if (sprite.sheet === "garden") { const [nw, nh] = GARDEN[sprite.id]; return { l: x - w / 2, t: y - (w * nh) / nw, r: x + w / 2, b: y }; }
  const f = frameOf(sprite) || specFrame(sprite); assert.ok(f, `${sprite.sheet}/${sprite.id} có trong manifest / asset-spec`);
  const h = (w * f.height) / f.width, [ax, ay] = sprite.id === "lo-ban-ve" ? [f.width / 2, (f.height * 226) / 256] : f.anchor; // = farm-map place()
  const l = x - (w * ax) / f.width, t = y - (h * ay) / f.height;
  return { l, t, r: l + w, b: t + h };
}
const overlap = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
const FIELD_BOX = { l: FIELD.x * MAP_W, t: FIELD.y * MAP_H, r: (FIELD.x + FIELD.w) * MAP_W, b: (FIELD.y + FIELD.h) * MAP_H };

test("bản đồ 960 × 640: mọi công trình ở khu chính nằm trọn trong bản đồ (kể cả nhãn ở đáy hộp) và không đè ruộng", () => {
  assert.deepEqual([MAP_W, MAP_H], [960, 640]);
  for (const def of BUILDINGS) {
    if (def.area !== "base") continue;
    const sprites = new Set(def.levels.map((l) => l.sprite).filter(Boolean).flatMap((sp) => [sp, sp.fallback].filter(Boolean)).map((sp) => sp.sheet + "/" + sp.id));
    if (def.kind !== "prebuilt") { sprites.add("buildings/lo-ban-ve"); sprites.add("buildings/gian-giao"); } // bản vẽ / giàn giáo cũng vẽ ở lô này
    for (const key of sprites) {
      const [sheet, id] = key.split("/"), bx = box(def, { sheet, id });
      // khung 256 px có lề trong suốt phía trên (neo ở y 226) ⇒ mép trên cho lệch tối đa 16 px; đáy (nơi có nhãn) phải trọn trong bản đồ
      assert.ok(bx.l >= -1 && bx.r <= MAP_W + 1 && bx.t >= -16 && bx.b <= MAP_H + 1, `${def.id} (${key}) tràn mép: ${JSON.stringify(bx)}`);
      if (def.kind !== "auto") assert.ok(!overlap(bx, FIELD_BOX) || def.id === "bang-don-hang", `${def.id} (${key}) đè ruộng`);
    }
  }
  // chuồng gà / chuồng bò / Nhà kính (lỗi M4: bị cắt ở mép dưới) có ít nhất 8 px cỏ bên dưới
  for (const id of ["chuong-ga", "chuong-bo", "nha-kinh"]) {
    const def = BUILDING[id], bx = box(def, def.levels[0].sprite);
    assert.ok(MAP_H - bx.b >= 8, `${id}: đáy ${bx.b.toFixed(1)} sát mép ${MAP_H}`);
  }
  // Nhà kính không đè chân Cối xay gió
  const mill = box(BUILDING["coi-xay-gio"], BUILDING["coi-xay-gio"].levels[0].sprite), gh = box(BUILDING["nha-kinh"], BUILDING["nha-kinh"].levels[0].sprite);
  assert.ok(gh.t >= mill.b - 4, "Nhà kính chồng lên Cối xay gió");
});

test("ô trang trí khu chính: trong bản đồ, không đè ruộng, chuồng gà / chuồng bò, không chồng nhau", () => {
  const slots = DECOR_SLOTS.filter((s) => s.area === "base").map((s) => {
    const w = s.w * MAP_W, x = s.x * MAP_W, y = s.y * MAP_H; // như farm-map: neo (64, 112) của khung 128
    return { id: s.id, l: x - w / 2, t: y - (w * 112) / 128, r: x + w / 2, b: y - (w * 112) / 128 + w };
  });
  const pens = ["chuong-ga", "chuong-bo"].map((id) => box(BUILDING[id], BUILDING[id].levels[0].sprite));
  for (const a of slots) {
    assert.ok(a.l >= 0 && a.r <= MAP_W && a.t >= 0 && a.b <= MAP_H, `${a.id} tràn mép`);
    const core = { l: a.l + 0.2 * (a.r - a.l), r: a.r - 0.2 * (a.r - a.l), t: a.t + 0.2 * (a.b - a.t), b: a.b - 0.2 * (a.b - a.t) }; // ô góc ruộng chạm mép là cố ý
    assert.ok(!overlap(core, FIELD_BOX), `${a.id} đè ruộng`);
    for (const p of pens) assert.ok(!overlap({ ...a, l: a.l + 6, r: a.r - 6, t: a.t + 6 }, p), `${a.id} đè chuồng`);
    for (const b of slots) if (a !== b) assert.ok(!overlap(a, b), `${a.id} chồng ${b.id}`);
  }
});

test("bậc Nhà (danh tiếng): 10 bậc nâng, giá tăng dần ×1,8, tổng ≥ 1 triệu xu, thưởng đơn +2 %/bậc, mở từ cấp 10", () => {
  const L = BUILDING.nha.levels;
  assert.equal(BUILDING.nha.kind, "prebuilt");
  assert.equal(L.length, FAME_TITLES.length);
  assert.equal(L[1].unlock, 10); assert.equal(featureLevel("fame-house"), 10);
  let total = 0;
  for (let i = 1; i < L.length; i++) {
    total += L[i].cost;
    if (i > 1) { assert.ok(L[i].cost > L[i - 1].cost * 1.7, `bậc ${i} rẻ quá`); assert.ok(L[i].unlock >= L[i - 1].unlock); }
    assert.equal(L[i].effect.fameLevel, i + 1);
    assert.equal(L[i].effect.orderBonus, +(FAME_BONUS_STEP * i).toFixed(2));
  }
  assert.ok(total >= 1_000_000, `tổng ${total}`);
  assert.equal(L[L.length - 1].unlock, 20);
});

test("nâng Nhà qua apply: trừ xu + vật liệu, giàn giáo 2 phút, xong ⇒ đơn hàng trả thêm xu đúng bậc", () => {
  const s = player(14);
  s.inv["van-go"] = 10; s.inv["hop-dinh"] = 10;
  assert.equal(apply(structuredClone(s), { type: "startUpgrade", id: "nha" }, T).err === undefined, true);
  // cấp 9 chưa nâng được
  const low = player(9);
  assert.equal(apply(low, { type: "startUpgrade", id: "nha" }, T).err, "locked");
  let t = T;
  for (let k = 1; k <= 3; k++) {
    const coins = s.coins, r = act(s, { type: "startUpgrade", id: "nha" }, t);
    assert.ok(r.events.some((e) => e.type === "upgradeStarted" && e.id === "nha"));
    assert.equal(coins - s.coins, BUILDING.nha.levels[k].cost);
    assert.equal(effects(s, t).fameLevel, k, "đang nâng ⇒ vẫn bậc cũ");
    t += 2 * MIN;
    const d = act(s, { type: "tick" }, t);
    assert.ok(d.events.some((e) => e.type === "buildingDone" && e.id === "nha" && e.level === k + 1));
  }
  assert.equal(effects(s, t).orderBonus, 0.06);
  // giao đơn: xu = round(giá phiếu × 1,06)
  const x = s.orders.slots[0], o = x.order;
  for (const [id, q] of Object.entries(o.items)) s.inv[id] = (s.inv[id] || 0) + q;
  const before = s.coins, r = act(s, { type: "deliver", slot: 0, id: o.id, rev: x.rev }, t);
  const ev = r.events.find((e) => e.type === "delivered");
  assert.equal(ev.coins, Math.round(o.coins * 1.06)); assert.equal(ev.baseCoins, o.coins);
  assert.equal(s.coins - before, ev.coins);
  assert.equal(orderPayout(s, o, t), ev.coins, "giao diện (phiếu đơn) hiện đúng số xu sẽ nhận");
  // lưu / tải giữ bậc Nhà
  const back = loadSave(dump(s), t);
  assert.equal(effects(back, t).fameLevel, 4);
});

test("đường XP M5 + save cũ: XP hợp lệ theo 60·cấp² được dồn lên cấp (không mất), XP rác vẫn bị kẹp", () => {
  assert.deepEqual(carryXp(10, 5_900), { level: 11, xp: 5_900 - xpNeed(10) });
  assert.deepEqual(carryXp(10, 100), { level: 10, xp: 100 });
  assert.deepEqual(carryXp(3, 1e9), { level: 3, xp: xpNeed(3) - 1 }, "rác ⇒ kẹp như cũ");
  assert.equal(carryXp(20, 20_000).level, 20);
  assert.ok(carryXp(20, 20_000).xp < xpNeed(20));
  // save v6 thật: cấp 9, 4 000 XP (bản M4 cần 4 860 ⇒ hợp lệ) ⇒ M5 cần 3 650 ⇒ lên cấp 10, dư 350
  const s = createState(T, 3); s.level = 9; s.xp = 0;
  const raw = JSON.parse(dump(s)); raw.xp = 4_000;
  const back = loadSave(JSON.stringify(raw), T);
  assert.equal(back.level, 10); assert.equal(back.xp, 350);
});

test("needsSync (một bản chép) khớp apply tick: có sự kiện ⇔ true, không đổi trạng thái gốc", () => {
  const s = player(12, 50_000);
  act(s, { type: "plant", i: 12, crop: "ca-rot" }, T);
  act(s, { type: "startBuild", id: "chuong-ga" }, T);
  for (const dt of [0, 1_000, 30_000, 2 * MIN + 1, 3 * 3600_000]) {
    const snap = JSON.stringify(s);
    const want = apply(structuredClone(s), { type: "tick" }, T + dt).events.length > 0;
    assert.equal(needsSync(s, T + dt), want, `dt ${dt}`);
    assert.equal(JSON.stringify(s), snap, "needsSync không được sửa trạng thái");
  }
  assert.equal(needsSync(s, NaN), false);
});

test("CURRENT_MILESTONE = 6: đơn đặc biệt hai lúc / Phiên chợ / hàng rào đá thuộc milestone 6 và đã có trong bản này", () => {
  assert.ok(CURRENT_MILESTONE >= 6);
  const ms = Object.fromEntries(LEVELS.flatMap((l) => l.unlocks).map((u) => [u.id, u.milestone]));
  assert.deepEqual([ms["special-2"], ms.fair, ms["stone-fence"]], [6, 6, 6]);
  assert.deepEqual([ms["fame-house"], ms.fame, ms["warehouse-6"]], [5, 5, 5]);
});

test("một tag module ?v=m18 cho mọi import trong game (không lẫn bản cũ trong bộ nhớ đệm)", () => {
  const files = [];
  const walk = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); if (n === "assets" || n === "node_modules") continue; if (statSync(p).isDirectory()) walk(p); else if (/\.(m?js|html)$/.test(n)) files.push(p); } };
  walk(ROOT);
  let count = 0;
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    for (const m of src.matchAll(/([\w./-]*)\.(?:m?js)\?v=([\w-]+)/g)) { if (m[1].includes("_shared/")) continue; count++; assert.equal(m[2], "m18", `${f}: ?v=${m[2]}`); }
    // import tĩnh / động của file .js trong game phải có tag (trừ ../_shared/ dùng chung toàn site)
    for (const m of src.matchAll(/(?:import\s[^"']*?from\s*|import\(\s*)["'](\.{1,2}\/[^"']+\.m?js)["']/g)) {
      if (m[1].includes("_shared/") || f.endsWith(".test.mjs") && /\.\/(harness|policy|sim|analysis|report|profiles|bugs|helpers)\.mjs$/.test(m[1])) continue;
      if (/\/tools\/sim\//.test(f.replace(/\\/g, "/")) && /\.mjs$/.test(m[1])) continue;
      assert.fail(`${f}: import không có tag ?v=m18: ${m[1]}`);
    }
  }
  assert.ok(count > 300, `chỉ thấy ${count} import có tag`);
});
