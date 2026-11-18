// Chạy: cd prototype/games/co-ca-ngua && npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { simulateThrow, sampleThrow, releaseVelocity } from "../dice-throw.js";

const B = [64, 512, 384, 832], R = 26; // một sân 5×5 ô (320px)
const inside = (p) => p.x >= B[0] + R - 1e-6 && p.x <= B[2] - R + 1e-6 && p.y >= B[1] + R - 1e-6 && p.y <= B[3] - R + 1e-6;

test("mọi cú tung (vận tốc, seed bất kỳ) luôn nằm trong sân và dừng hẳn", () => {
  for (let seed = 1; seed <= 400; seed++) {
    const ang = seed * 2.399, sp = (seed * 37) % 2600; // cả 0 (bấm không kéo) lẫn rất mạnh
    const start = { x: B[0] + ((seed * 53) % 400) - 40, y: B[1] + ((seed * 71) % 400) - 40 }; // có cả điểm ngoài sân
    const sim = simulateThrow({ ...start, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, bounds: B, r: R, seed });
    for (const f of sim.frames) assert.ok(inside(f), `seed ${seed}: khung ra ngoài sân ${JSON.stringify(f)}`);
    for (const f of sim.frames) assert.ok(f.z >= 0);
    assert.ok(inside(sim.end));
    assert.ok(sim.duration > 300 && sim.duration < 2700, `seed ${seed}: ${sim.duration}ms`);
    const last = sim.frames[sim.frames.length - 1];
    assert.equal(last.z, 0);
    assert.ok(Math.abs(last.a / (Math.PI * 2) - Math.round(last.a / (Math.PI * 2))) < 1e-9, "nằm yên thẳng đứng (mặt trên ngửa lên)");
    const mid = sampleThrow(sim, sim.duration / 2);
    assert.ok(inside(mid));
  }
});

test("mỗi lần tung một khác: đường bay, điểm rơi, số lần nảy khác nhau", () => {
  const ends = new Set(), bounces = new Set(), durs = new Set();
  for (let seed = 1; seed <= 30; seed++) {
    const sim = simulateThrow({ bounds: B, r: R, seed }); // bấm không kéo, cùng điểm xuất phát
    ends.add(Math.round(sim.end.x) + "," + Math.round(sim.end.y));
    bounces.add(sim.bounces.length); durs.add(Math.round(sim.duration / 50));
    assert.ok(sim.bounces.length >= 1, "có nảy");
  }
  assert.ok(ends.size >= 25, "điểm rơi khác nhau: " + ends.size);
  assert.ok(bounces.size >= 3 && durs.size >= 4);
});

test("cùng seed + vận tốc → cùng đường (tái hiện được); kéo mạnh thì nảy vào mép", () => {
  const a = simulateThrow({ x: 200, y: 600, vx: 1400, vy: -300, bounds: B, r: R, seed: 9 });
  const b = simulateThrow({ x: 200, y: 600, vx: 1400, vy: -300, bounds: B, r: R, seed: 9 });
  assert.deepEqual(a, b);
  assert.ok(Math.max(...a.frames.map((f) => f.x)) > B[2] - R - 25 && a.bounces.length >= 2, "bay tới mép phải và nảy");
});

test("giảm chuyển động (prefers-reduced-motion): ngắn, không nảy, vẫn trong sân", () => {
  const s = simulateThrow({ x: 100, y: 540, vx: -3000, vy: -3000, bounds: B, r: R, seed: 3, reduced: true });
  assert.ok(s.duration <= 300 && s.bounces.length === 0);
  for (const f of s.frames) assert.ok(inside(f));
});

test("vận tốc thả tay lấy từ ~100 ms cuối của cú kéo", () => {
  const v = releaseVelocity([{ x: 0, y: 0, t: 0 }, { x: 10, y: 0, t: 850 }, { x: 60, y: 20, t: 950 }, { x: 110, y: 40, t: 1000 }], 1000);
  assert.ok(Math.abs(v.vx - 1000) < 1e-6 && Math.abs(v.vy - 400) < 1e-6);
  assert.deepEqual(releaseVelocity([{ x: 0, y: 0, t: 0 }], 1000), { vx: 0, vy: 0 });
});
