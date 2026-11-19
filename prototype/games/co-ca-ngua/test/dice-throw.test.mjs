// Chạy: cd prototype/games/co-ca-ngua && npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { simulateThrow, sampleThrow, releaseVelocity, freeSpot } from "../dice-throw.js";

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


// Vùng cấm giống game.js: 4 ngựa đứng trong lán (chân ở SLOT_FEET), tâm vùng = (x+3, chân−24), r = 40.
const FEET = [[104, 206], [204, 206], [104, 270], [204, 270]];
const hutKeepOut = (ox, oy, which = [0, 1, 2, 3]) => which.map((h) => ({ x: ox + FEET[h][0] + 3, y: oy + FEET[h][1] - 24, r: 40 }));
const noOverlap = (p, ko) => ko.every((k) => Math.hypot(p.x - k.x, p.y - k.y) >= k.r + R - 1e-6);

test("xúc xắc không nằm đè lên ngựa: 300 cú tung ngẫu nhiên có vùng cấm — dừng ở chỗ trống, vẫn trong sân", () => {
  let slid = 0;
  for (let seed = 1; seed <= 300; seed++) {
    const subsets = [[0, 1, 2, 3], [0, 1], [2, 3], [1], [0, 3], [0, 1, 2]];
    const ko = hutKeepOut(0, 512, subsets[seed % subsets.length]); // sân B nằm ở khối góc (0, 512)
    const ang = seed * 2.399, sp = (seed * 41) % 2400;
    const start = { x: B[0] + ((seed * 53) % 330), y: B[1] + ((seed * 71) % 330) };
    const reduced = seed % 10 === 0, gentle = seed % 7 === 0;
    const sim = simulateThrow({ ...start, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, bounds: B, r: R, seed, reduced, gentle, keepOut: ko });
    for (const f of sim.frames) assert.ok(inside(f), `seed ${seed}: khung ra ngoài sân`);
    assert.ok(inside(sim.end), `seed ${seed}: dừng ngoài sân`);
    assert.ok(noOverlap(sim.end, ko), `seed ${seed}: dừng đè lên ngựa ${JSON.stringify(sim.end)}`);
    const last = sim.frames[sim.frames.length - 1];
    assert.ok(Math.abs(last.x - sim.end.x) < 1e-9 && Math.abs(last.y - sim.end.y) < 1e-9 && last.z === 0, "khung cuối = chỗ nằm yên");
    if (!reduced) assert.ok(Math.abs(last.a / (Math.PI * 2) - Math.round(last.a / (Math.PI * 2))) < 1e-9, "vẫn nằm thẳng đứng");
    assert.ok(sim.duration < 3200, `seed ${seed}: ${sim.duration}ms`);
    const free = simulateThrow({ ...start, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, bounds: B, r: R, seed, reduced, gentle });
    if (Math.hypot(free.end.x - sim.end.x, free.end.y - sim.end.y) > 1) slid++;
    assert.deepEqual(sim, simulateThrow({ ...start, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, bounds: B, r: R, seed, reduced, gentle, keepOut: ko }), "tất định");
  }
  assert.ok(slid > 20, "có những cú phải trượt khỏi ngựa: " + slid);
});

test("freeSpot: chỗ đã trống thì giữ nguyên; đè ngựa thì sang chỗ trống gần nhất trong sân", () => {
  const ko = hutKeepOut(0, 512);
  assert.deepEqual(freeSpot(120, 590, B, R, ko), { x: 120, y: 590 }); // phía trên lán: trống
  assert.deepEqual(freeSpot(120, 590, B, R, []), { x: 120, y: 590 });
  const p = freeSpot(160, 512 + 221, B, R, ko); // chỗ xúc xắc chờ mặc định (giữa 4 ngựa)
  assert.ok(inside(p) && noOverlap(p, ko), JSON.stringify(p));
  const q = freeSpot(107, 512 + 182, B, R, ko); // ngay giữa một con ngựa
  assert.ok(inside(q) && noOverlap(q, ko));
  // không còn chỗ trống nào → chỗ ít đè nhất, vẫn trong sân
  const w = freeSpot(200, 650, B, R, [{ x: 224, y: 672, r: 400 }]);
  assert.ok(inside(w));
});
