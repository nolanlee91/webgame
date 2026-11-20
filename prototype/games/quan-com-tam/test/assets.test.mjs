// Manifest điều khiển sprite: bản chép trong game khớp docs; mọi tên frame code dùng có trong asset-spec (ảnh thật tự thay hình dự phòng);
// cảnh thật đợt 0 có file + sceneScale; toạ độ manifest đè dự phòng ART-DIRECTION, thiếu khoá nào thì dùng dự phòng; giá vốn khớp bảng ECONOMY; ô nhân vật 288 hiện ×1.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { makeAtlas, SHEETS, OPTIONAL_SHEETS, HD_SHEETS } from "../render/atlas.js?v=c1";
import { CELL } from "../render/placeholder.js?v=c1";
import { buildPoints } from "../core/placements.js?v=c1";
import { STREET, QUAN } from "../data/scene.js?v=c1";
import { DISHES, dishCost } from "../data/economy.js?v=c1";
import { ARCHETYPES } from "../data/customers.js?v=c1";
import { plateFrames, emptyPlate } from "../core/plate.js?v=c1";
import { GRILL } from "../data/economy.js?v=c1";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const game = JSON.parse(readFileSync(here("../data/asset-manifest.json"), "utf8"));
const docs = JSON.parse(readFileSync(here("../../../../docs/quan-com-tam/asset-manifest.json"), "utf8"));
const spec = JSON.parse(readFileSync(here("../../../../docs/quan-com-tam/asset-spec.json"), "utf8"));
const CHAR_H = 288;
const charScale = (f) => (f ? Math.max(1, Math.round((CHAR_H / f.h) * 2) / 2) : 1);

function expand(p) {
  const m = p.match(/\{([^}]+)\}/);
  if (!m) return [p];
  const r = m[1].match(/^(\d+)\.\.(\d+)$/);
  const opts = r ? Array.from({ length: +r[2] - +r[1] + 1 }, (_, i) => String(+r[1] + i)) : m[1].split(",");
  return opts.flatMap((o) => expand(p.replace(m[0], o)));
}
const specSheets = new Map(spec.sheets.map((sh) => [sh.file, sh]));
const specFrames = new Map(spec.sheets.map((sh) => [sh.file, new Set((sh.frames || []).flatMap(expand))]));

test("bản chép manifest trong game khớp docs/quan-com-tam/asset-manifest.json", () => {
  assert.deepEqual(game, docs);
});

test("đợt 0: 4 tranh cảnh có file thật 1280×720 và sceneScale (người ≈ 260 px, ±10%)", () => {
  for (const f of ["assets/street-scene.webp", "assets/street-foreground.webp", "assets/quan-scene.webp", "assets/quan-foreground.webp"]) {
    const it = game.items.find((i) => i.filename === f);
    assert.ok(it && existsSync(here("../" + f)), f);
    assert.deepEqual(it.dimensions, [1280, 720]);
  }
  for (const sc of spec.scenes) assert.ok(Math.abs(game.sceneScale[sc].humanHeight - 260) <= 26, sc);
  for (const it of game.items) assert.ok(existsSync(here("../" + it.filename)), it.filename);
});

test("mọi bí danh sheet trong code trùng tên file trong asset-spec; ô dự phòng đúng ô + anchor của spec", () => {
  for (const f of [...Object.values(SHEETS), ...Object.values(HD_SHEETS)]) assert.ok(specSheets.has(f), f);
  for (const [alias, c] of Object.entries(CELL)) {
    const sh = specSheets.get(SHEETS[alias]);
    if (!sh?.cell) continue;
    assert.deepEqual([c[0], c[1], c[2], c[3]], [...sh.cell, ...sh.anchor], alias);
  }
});

/** Mọi frame code vẽ: nhân vật (đứng, đi, chờ, ngồi), cô chủ, bếp + món trên vỉ, lớp dĩa, thiết bị, bàn, đồ trên bàn. */
function codeFrames() {
  const out = [];
  for (const [id, A] of Object.entries(ARCHETYPES)) {
    const r = A.sprite;
    out.push(["chars", r]);
    for (let i = 1; i <= 4; i++) out.push(["walks", `${r}-walk-${i}`]);
    for (const m of ["waiting", "impatient"]) out.push(["reactions", `${r}-${m}`]);
    for (const m of ["order-1", "order-2"]) out.push(["actions", `${r}-${m}`]);
    if (!A.takeaway) for (const p of ["eat-1", "eat-2", "wait", "call", "happy", "annoyed"]) out.push(["seated", `${r}-sit-${p}`]);
  }
  for (const [seq, n] of [["idle", 2], ["grill", 4], ["fan", 4], ["plate", 4], ["walk", 4], ["carry", 4], ["wipe", 4], ["serve", 2], ["pour", 2], ["box", 2]]) for (let i = 1; i <= n; i++) out.push(["owner", `owner-${seq}-${i}`]);
  for (const k of ["cold", "low", "mid", "high", "ash", "flare-1", "flare-2", "flare-3", "smoke-1", "smoke-2", "smoke-3"]) out.push(["grill", `grill-${k}`]);
  for (const it of Object.keys(GRILL.side)) for (const st of ["raw", "half", "done", "charred", "burnt"]) out.push(["grillItems", `${it}-${st}`]);
  const p = emptyPlate(1, "dia");
  for (const v of [
    { com: 1, moHanh: 1, meat: { item: "suon", result: "done" }, doChua: true, duaLeo: true, sauce: "chan" }, { com: 2, sauce: "chen", meat: { item: "suon", result: "charred" }, bi: true, cha: true, trung: "runny", ngo: true },
    { meat: { item: "suon", result: "burnt" } }, { meat: { item: "suon", result: "half" } }, { meat: { item: "ga", result: "done" } }, { meat: { item: "suon-non", result: "charred" } }, { meat: { item: "lap-xuong", result: "done" } },
  ]) for (const f of plateFrames({ ...p, ...v })) out.push(["plate", f]);
  for (const f of plateFrames({ ...emptyPlate(1, "hop"), sauce: "bich" })) out.push(["plate", f]);
  for (const n of ["rice-cooker-empty", "rice-cooker-ready", "rice-cooker-low", "rice-cooker-cooking-1", "mo-hanh-pot-full", "mo-hanh-pot-low", "mo-hanh-pot-empty", "plate-stack-full", "plate-stack-low", "plate-stack-empty",
    "wash-tub-empty", "wash-tub-half", "wash-tub-full", "charcoal-sack-full", "charcoal-sack-low", "charcoal-sack-empty", "tea-cooler-full", "tea-cooler-low", "suon-tray", "pickle-jar", "cucumber-tray", "sauce-jar", "chili-jar",
    "cash-tin", "box-stack", "egg-pan-idle", "egg-pan-fry-1", "bi-tray", "steamer-idle", "steamer-steam-1"]) out.push(["equip", n]);
  for (const k of ["table2", "table4"]) for (const st of ["clean", "set", "dirty", "wet"]) out.push(["tables", `${k}-${st}`]);
  for (const n of ["stool-red", "stool-blue", "plate-eating-full", "plate-eating-half", "plate-eating-empty", "box-eating", "tea-glass-full", "tea-glass-half", "tea-glass-empty"]) out.push(["tableItems", n]);
  for (const n of ["sizzle-1", "sparkle-1", "coin-fly-1", "wipe-shine-1"]) out.push(["fx", n]);
  return out;
}
test("mọi tên frame code dùng đều có trong asset-spec (Codex giao đúng tên là game tự dùng ảnh thật)", () => {
  const miss = codeFrames().filter(([alias, name]) => !specFrames.get(SHEETS[alias])?.has(name));
  assert.deepEqual(miss, []);
});

test("atlas: frame thật trong manifest thắng hình dự phòng; thiếu thì dùng dự phòng cùng ô + anchor", () => {
  const fake = { items: [{ filename: "assets/characters.webp", dimensions: [432, 288], frames: { worker: { rect: [216, 0, 216, 288], anchor: [108, 262] } } }] };
  const fb = (alias, name) => ({ url: "fb", sw: 216, sh: 288, x: 0, y: 0, w: 216, h: 288, ax: 108, ay: 262, placeholder: true });
  const a = makeAtlas(fake, "", { fallback: fb });
  assert.equal(a.frame("chars", "worker").url, "assets/characters.webp");
  assert.ok(a.has("chars", "worker") && !a.has("chars", "nurse"));
  assert.equal(a.frame("chars", "nurse").url, "fb");
  assert.equal(charScale(a.frame("chars", "worker")), 1, "ô 288 hiện ×1");
  assert.equal(charScale({ h: 192 }), 1.5);
});

test("toạ độ: manifest (owner, grill, door) đè dự phòng; khoá chưa có thì dùng đề xuất ART-DIRECTION", () => {
  const P = buildPoints("street", game.placements), Q = buildPoints("quan", game.placements);
  assert.deepEqual(P.owner, game.placements["street-owner"].at);
  assert.deepEqual(P.grill, game.placements["street-grill"].at);
  assert.deepEqual(Q.entry, game.placements.door);
  assert.deepEqual(P.grillSlots[0], [P.grill[0] - 100, P.grill[1] - 40], "chỗ vỉ tương đối anchor bếp");
  assert.deepEqual(P.tables.map((t) => t.id), STREET.tables.map((t) => t.id));
  assert.deepEqual(P["wash-tub"], STREET["wash-tub"]);
  assert.deepEqual(Q.waitSpots, QUAN.waitSpots);
  // khi Codex ghi bàn: dùng bàn của manifest
  const T = buildPoints("street", { streetTables: [{ id: "s1", seats: 2, at: [760, 540], seatSpots: [{ at: [660, 546], face: "right" }, { at: [860, 546], face: "left" }], servePoint: [760, 612] }] });
  assert.deepEqual(T.tables[0].at, [760, 540]);
  assert.equal(T.tables[0].seatSpots[1].face, "left");
});

test("giá vốn món tính từ thành phần khớp bảng ECONOMY §2", () => {
  for (const [id, d] of Object.entries(DISHES)) assert.equal(dishCost(id), d.cost, id);
});
