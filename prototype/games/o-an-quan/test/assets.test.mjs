// Manifest asset: bản trong thư mục game (data/asset-manifest.json — máy chủ chỉ phục vụ prototype/) phải khớp hợp đồng.
// Có docs/o-an-quan/asset-manifest.json (Codex đã giao) → bản trong game phải chép nguyên văn (tools/sync-manifest.mjs).
// Chưa có → bản tạm của dev: toạ độ ô = đúng bàn vẽ bằng code (art.js DEFAULT_PLACEMENTS).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { DEFAULT_PLACEMENTS, SCENE } from "../art.js";

const here = (p) => new URL(p, import.meta.url);
const game = JSON.parse(readFileSync(here("../data/asset-manifest.json"), "utf8"));
const spec = JSON.parse(readFileSync(here("../../../../docs/o-an-quan/asset-spec.json"), "utf8"));
const docsPath = here("../../../../docs/o-an-quan/asset-manifest.json");

test("manifest trong game có đủ toạ độ 12 ô theo asset-spec, nằm trong cảnh 1200×480, có bán kính r", () => {
  assert.deepEqual(spec.scene, [SCENE.w, SCENE.h]);
  for (const key of spec.placements) {
    const p = game.placements[key];
    assert.ok(p && Array.isArray(p.at) && p.at.length === 2, key);
    assert.ok(p.at[0] >= 0 && p.at[0] <= SCENE.w && p.at[1] >= 0 && p.at[1] <= SCENE.h, key);
    assert.ok(p.r > 0, key + ".r");
  }
  // hàng dưới trái → phải, hàng trên phải → trái (đúng thứ tự rải +1 của logic.js)
  const x = (i) => game.placements["pit-" + i].at[0], y = (i) => game.placements["pit-" + i].at[1];
  for (let i = 1; i < 5; i++) assert.ok(x(i) < x(i + 1) && x(i + 6) > x(i + 7));
  assert.ok(y(1) > y(7), "hàng dưới (đội A) nằm dưới hàng trên");
  assert.ok(x(0) < x(1) && x(6) > x(5), "quan trái / phải ở hai đầu");
});

test("bản trong game khớp docs/o-an-quan/asset-manifest.json (nếu Codex đã giao), không thì khớp bàn vẽ bằng code", () => {
  if (existsSync(docsPath)) {
    assert.deepEqual(game, JSON.parse(readFileSync(docsPath, "utf8")), "chạy: node prototype/games/o-an-quan/tools/sync-manifest.mjs");
  } else {
    assert.equal(game.phase, "dev-placeholder");
    assert.deepEqual(game.items, []);
    assert.deepEqual(game.placements, JSON.parse(JSON.stringify(DEFAULT_PLACEMENTS)));
  }
});
