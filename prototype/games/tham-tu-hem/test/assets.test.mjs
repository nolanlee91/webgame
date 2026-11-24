// Manifest: bản chép trong game khớp docs/tham-tu-hem/asset-manifest.json (khi Codex đã giao); file ảnh khai trong manifest phải có thật.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
const here = (p) => new URL(p, import.meta.url);
const game = JSON.parse(readFileSync(here("../data/asset-manifest.json"), "utf8"));

test("bản chép manifest trong game khớp docs/tham-tu-hem/asset-manifest.json (nếu đã có)", () => {
  const docs = here("../../../../docs/tham-tu-hem/asset-manifest.json");
  if (!existsSync(docs)) return;
  const d = JSON.parse(readFileSync(docs, "utf8"));
  assert.deepEqual(game.items, d.items);
  assert.deepEqual(game.hotspots || {}, d.hotspots || {});
});

test("mọi file khai trong manifest có thật; frame chân dung đúng ô 256", () => {
  for (const it of game.items || []) {
    assert.ok(existsSync(here("../" + it.filename)), "thiếu file " + it.filename);
    if (/^assets\/portraits-/.test(it.filename)) for (const [n, f] of Object.entries(it.frames || {})) {
      assert.match(n, /^[a-z0-9]+-(neutral|nervous|angry|shock|happy|smug)$/, n);
      assert.equal(f.rect[2], 256, n); assert.equal(f.rect[3], 256, n);
    }
  }
});
