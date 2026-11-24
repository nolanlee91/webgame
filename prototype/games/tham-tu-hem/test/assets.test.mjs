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

test("mọi tiếng khai trong ui/sfx.js có file mp3; mọi icon vật chứng của vụ có frame", async () => {
  const { SFX, LOOPS, BLIPS, SCENES } = await import("../ui/sfx.js");
  for (const n of [...Object.keys(SFX), ...Object.keys(LOOPS), ...BLIPS]) assert.ok(existsSync(here(`../assets/audio/${n}.mp3`)), "thiếu " + n);
  for (const list of Object.values(SCENES)) for (const n of list) assert.ok(LOOPS[n], n);
  const { readdirSync } = await import("node:fs");
  const frames = new Set(game.items.filter((i) => /^assets\/clues-/.test(i.filename)).flatMap((i) => Object.keys(i.frames || {})));
  if (!frames.size) return;
  for (const f of readdirSync(here("../data/cases/")).filter((x) => x.endsWith(".js") && x !== "index.js")) {
    const c = (await import(here("../data/cases/" + f))).default;
    for (const id of Object.keys(c.clues)) assert.ok(frames.has(id), `${c.id}: thiếu icon vật chứng ${id}`);
  }
});
