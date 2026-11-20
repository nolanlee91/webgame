// Manifest điều khiển sprite: bản chép trong game khớp docs; mọi tên frame code dùng có trong asset-spec (code tự nhận ảnh khi Codex giao);
// asset đợt 1 đã có frame thật cho mọi đường vẽ; giá vốn công thức khớp bảng ECONOMY; nhân vật ô 288 hiện ×1.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { makeAtlas, SHEETS, OPTIONAL_SHEETS } from "../render/atlas.js";
import { charScale, CHAR_H, scenePoints } from "../render/scene.js";
import { loafLayers } from "../render/loafview.js";
import { STOCK, RECIPES, BASE_COST, LEVEL_USE, WRAPS, FLOAT_BILLS, BILLS } from "../data/economy.js";
import { ARCHETYPES } from "../data/customers.js";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const game = JSON.parse(readFileSync(here("../data/asset-manifest.json"), "utf8"));
const docs = JSON.parse(readFileSync(here("../../../../docs/tiem-banh-mi/asset-manifest.json"), "utf8"));
const spec = JSON.parse(readFileSync(here("../../../../docs/tiem-banh-mi/asset-spec.json"), "utf8"));
const atlas = makeAtlas(game);

/** Mở rộng mẫu tên frame trong asset-spec: {a,b}-walk-{1..4}. */
function expand(p) {
  const m = p.match(/\{([^}]+)\}/);
  if (!m) return [p];
  const inner = m[1], r = inner.match(/^(\d+)\.\.(\d+)$/);
  const opts = r ? Array.from({ length: +r[2] - +r[1] + 1 }, (_, i) => String(+r[1] + i)) : inner.split(",");
  return opts.flatMap((o) => expand(p.replace(m[0], o)));
}
const specFrames = new Map(spec.sheets.map((sh) => [sh.file, new Set((sh.frames || []).flatMap(expand))]));
const inSpec = (alias, name) => specFrames.get(SHEETS[alias])?.has(name);

test("bản chép manifest trong game khớp docs/tiem-banh-mi/asset-manifest.json", () => {
  assert.deepEqual(game, docs);
});

test("đợt 1: mọi sheet bắt buộc có file thật trong assets/", () => {
  for (const it of game.items) assert.ok(existsSync(here("../" + it.filename)), it.filename);
  for (const [alias, f] of Object.entries(SHEETS)) if (!OPTIONAL_SHEETS.has(alias) && alias !== "shop" && alias !== "shopFg") assert.ok(game.items.some((i) => i.filename === f), f);
});

/** Mọi frame code vẽ (cảnh, nhân vật, lò, thiết bị, lớp ổ, nguyên liệu, tờ tiền, fx). */
function codeFrames() {
  const out = [];
  const roles = Object.values(ARCHETYPES).map((a) => a.sprite);
  for (const r of roles) {
    for (let i = 1; i <= 4; i++) out.push(["walks", `${r}-walk-${i}`]);
    for (const m of ["waiting", "happy", "impatient"]) out.push(["reactions", `${r}-${m}`]);
    for (const m of ["order-1", "order-2", "surprised-1", "surprised-2"]) out.push(["actions", `${r}-${m}`]);
    out.push(["chars", r]);
  }
  out.push(["chars", "baker"]);
  for (const [seq, n] of [["idle", 2], ["slice", 4], ["oven", 4], ["serve", 4], ["wrap", 2], ["change", 2]]) for (let i = 1; i <= n; i++) out.push(["baker", `baker-${seq}-${i}`]);
  out.push(["ovens", "oven-mini-cold"], ["ovens", "oven-mini-ready"], ...[1, 2, 3, 4].map((i) => ["ovens", `oven-mini-baking-${i}`]), ["ovens", "oven-mini-smoke-1"], ["ovens", "oven-mini-smoke-2"]);
  out.push(["equip", "toaster-idle"], ...[1, 2, 3, 4].map((i) => ["equip", `toaster-on-${i}`]));
  for (const n of ["sauce-bottles", "pate-jar", "board-empty", "board-busy", "pickle-jar", "herb-basket", "paper-stack", "cash-tin", "tea-jug", "gas-tank-full", "gas-tank-low", "gas-tank-empty"]) out.push(["equip", n]);
  for (const c of ["raw", "pale", "golden", "dark", "burnt"]) out.push(["loaf", "loaf-whole-" + c]);
  const loaf = { sliced: true, spreads: { pate: 2, bo: 2, mayo: 2 }, fills: ["cha-lua", "thit-nguoi", "xiu-mai", "trung", "thit-nuong", "heo-quay", "ga-xe", "cha-chay", "cha-bong"], veg: { "do-chua": true, "dua-leo": true, "rau-mui": true, "hanh-la": true }, ot: 3, sauces: { "nuoc-tuong": true, "tuong-ot": true }, toasted: true };
  for (const n of loafLayers(loaf)) out.push(["loaf", n]);
  for (const ot of [1, 2]) for (const n of loafLayers({ ...loaf, ot })) out.push(["loaf", n]);
  for (const w of Object.values(WRAPS)) out.push(["loaf", w.layer]);
  for (const s of Object.values(STOCK)) out.push(["ingr", s.icon]);
  for (const b of BILLS) out.push(["bills", `bill-${b}k`]);
  for (const c of ["crumbs", "coin-fly"]) out.push(["fx", c]);
  return out;
}

test("mọi tên frame code dùng có trong hợp đồng asset-spec (sai tên là game không tự nhận ảnh)", () => {
  for (const [a, n] of codeFrames()) if (a !== "fx") assert.ok(inSpec(a, n), `${a}/${n}`);
});

test("asset đợt 1 có frame thật cho mọi đường vẽ của cảnh xe đẩy, quầy ráp, thối tiền", () => {
  const missing = codeFrames().filter(([a, n]) => (a === "fx" ? !atlas.clip(a, n) : !atlas.has(a, n)));
  assert.deepEqual(missing, []);
});

test("thước nhân vật: CHAR_H 288 ⇒ ô 216×288 hiện ×1, ô cũ 144×192 hiện ×1,5 (bội 0,5, giữ nét)", () => {
  assert.equal(CHAR_H, 288);
  assert.equal(charScale(atlas.frame("reactions", "student-waiting")), 1);
  assert.equal(charScale({ h: 192 }), 1.5);
  const f = atlas.frame("reactions", "student-waiting");
  assert.deepEqual([f.w, f.h, f.ax, f.ay], [216, 288, 108, 262]);
  assert.ok(game.sceneScale?.["assets/cart-scene.webp"]?.humanHeight >= 235);
});

test("toạ độ cảnh lấy từ manifest placements (đồ trên xe, chỗ xếp hàng, đường vào / ra)", () => {
  const P = scenePoints(game.placements);
  assert.deepEqual(P.oven, game.placements["cart-oven"].at);
  assert.deepEqual(P.queue, game.placements.cartQueueSpots);
  assert.deepEqual(P.entry, game.placements.cartEntry);
  assert.deepEqual(P.baker, game.placements["cart-baker"].at);
  assert.ok(P.queue.length >= 4);
});

test("giá vốn công thức = phần nền 7k + phần riêng, khớp bảng ECONOMY §2", () => {
  for (const R of RECIPES.filter((r) => !r.que && !r.stale)) {
    let k = BASE_COST;
    for (const [id, lvl] of Object.entries(R.spreads)) k += STOCK[id].cost * LEVEL_USE[lvl];
    for (const id of R.fills) k += STOCK[id].cost;
    assert.equal(k, R.cost, R.id);
    assert.ok(R.price > R.cost, R.id);
  }
  assert.deepEqual(FLOAT_BILLS, [1, 2, 5, 10, 20, 50]);
});
