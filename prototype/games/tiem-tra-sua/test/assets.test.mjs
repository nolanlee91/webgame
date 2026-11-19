// Manifest điều khiển sprite: bản chép trong game khớp docs, mọi tham chiếu hình trong data/ và render/ có frame thật.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { makeAtlas, SHEETS, OPTIONAL_SHEETS } from "../render/atlas.js";
import { STOCK, CHOICES, STEP_ICON } from "../data/ingredients.js";
import { ARCHETYPES } from "../data/customers.js";
import { cupLayers } from "../core/cupview.js";
import { STEPS } from "../data/ingredients.js";
import { RECIPES } from "../data/recipes.js";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const game = JSON.parse(readFileSync(here("../data/asset-manifest.json"), "utf8"));
const docs = JSON.parse(readFileSync(here("../../../../docs/tiem-tra-sua/asset-manifest.json"), "utf8"));
const atlas = makeAtlas(game);

test("bản chép manifest trong game khớp docs/tiem-tra-sua/asset-manifest.json", () => {
  assert.deepEqual(game, docs);
});

test("bộ asset Phase 2: ít nhất 24 file, 243 frame, 27 clip (Codex có thể thêm); file tồn tại", () => {
  const items = game.items.filter((i) => i.filename.startsWith("assets/"));
  assert.ok(items.length >= 24);
  assert.ok(items.reduce((a, i) => a + Object.keys(i.frames || {}).length, 0) >= 243);
  assert.ok(items.reduce((a, i) => a + Object.keys(i.animations || {}).length, 0) >= 27);
  for (const i of items) assert.ok(existsSync(here("../" + i.filename)), i.filename);
  for (const [alias, f] of Object.entries(SHEETS)) if (!OPTIONAL_SHEETS.has(alias)) assert.ok(items.some((i) => i.filename === f), f);
});

test("mọi icon nguyên liệu / bước pha có frame trong atlas", () => {
  const refs = [...Object.values(STOCK).map((s) => s.icon), ...Object.values(STEP_ICON)];
  for (const list of Object.values(CHOICES)) for (const c of list) if (c.icon) refs.push(c.icon);
  for (const [a, f] of refs) assert.ok(atlas.has(a, f), `${a}/${f}`);
});

test("mỗi vai khách có dáng chờ / vui / sốt ruột / gọi món / ngạc nhiên", () => {
  for (const a of Object.values(ARCHETYPES)) {
    for (const m of ["waiting", "happy", "impatient"]) assert.ok(atlas.has("reactions", `${a.sprite}-${m}`), `${a.sprite}-${m}`);
    for (const m of ["order-1", "order-2", "surprised-1", "surprised-2"]) assert.ok(atlas.has("actions", `${a.sprite}-${m}`), `${a.sprite}-${m}`);
  }
});

test("mọi lớp ly sinh ra từ 8 công thức (từng bước) đều có frame trong cup-layers", () => {
  for (const r of RECIPES) {
    const spec = { cup: "ly", base: r.base, add: r.add, sugar: r.sugar, ice: r.ice, topping: r.topping, lid: "dong-nap" };
    for (let i = 1; i <= STEPS.length; i++) {
      const cup = { steps: STEPS.slice(0, i).map((step) => ({ step, id: spec[step] })), sealed: i === STEPS.length };
      for (const l of cupLayers(cup).layers) assert.ok(atlas.has("cup", l), `${r.id} bước ${i}: ${l}`);
    }
  }
});

test("clip hiệu ứng dùng trong game tồn tại với fps", () => {
  for (const [a, c] of [["cupfx", "pour"], ["cupfx", "topping"], ["cupfx", "steam"], ["lidfx", "seal"], ["lidfx", "ice"], ["barista", "pour"], ["barista", "topping"], ["barista", "handoff"], ["bfx", "coin"], ["bfx", "success"], ["motion", "walk"], ["walks", "courier-walk"]]) {
    const clip = atlas.clip(a, c);
    assert.ok(clip && clip.fps > 0 && clip.frames.every((f) => atlas.has(a, f)), `${a}/${c}`);
  }
});
