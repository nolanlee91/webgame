// Bếp than: vùng nhiệt, hai mặt + lật, kết quả miếng (mặt kém hơn), cháy cạnh, vùng giữ ấm, than cháy / thêm than / lửa bùng, quạt + khói.
import test from "node:test";
import assert from "node:assert/strict";
import { freshGrill, placeItem, flip, tickGrill, itemResult, sideState, addCoal, setFan, heatMul, moveItem, isCooked, itemFrame } from "../core/grill.js?v=c6";
import { GRILL } from "../data/economy.js?v=c6";

const run = (g, ms, t0 = 0, step = 100) => { const ev = []; for (let t = step; t <= ms; t += step) tickGrill(g, step, t0 + t, ev); return ev; };

test("mặt thịt: < 60 sống · 60–99 tái · 100–114 chín · 115–129 cháy cạnh · ≥ 130 cháy đen", () => {
  assert.deepEqual([0, 59, 60, 99, 100, 114, 115, 129, 130].map(sideState), ["raw", "raw", "half", "half", "done", "done", "charred", "charred", "burnt"]);
});

test("vùng vừa, than vừa: sườn chín một mặt trong 9 giây; chỉ mặt úp xuống than mới chín", () => {
  const g = freshGrill(45);
  placeItem(g, 2, "suon");
  run(g, 8900);
  assert.ok(g.slots[2].sides[0] < 100 && g.slots[2].sides[1] === 0);
  run(g, 300, 8900);
  assert.equal(sideState(g.slots[2].sides[0]), "done");
  assert.equal(g.slots[2].sides[1], 0, "mặt trên không chín");
});

test("vùng nóng ×1,5 nhanh hơn vùng vừa; vùng giữ ấm ×0,25", () => {
  const g = freshGrill(45);
  placeItem(g, 0, "suon"); placeItem(g, 2, "suon"); placeItem(g, 4, "suon");
  run(g, 4000);
  const [hot, mid, warm] = [g.slots[0].sides[0], g.slots[2].sides[0], g.slots[4].sides[0]];
  assert.ok(Math.abs(hot / mid - 1.5) < 0.05 && Math.abs(warm / mid - 0.25) < 0.05, `${hot} ${mid} ${warm}`);
});

test("lật đổi mặt; lật đúng lúc (100–114) được tính tay nướng; kết quả miếng = mặt kém hơn", () => {
  const g = freshGrill(45);
  placeItem(g, 2, "suon");
  run(g, 9200);
  const ev = [];
  const r = flip(g, 2, ev);
  assert.ok(r.perfect && ev[0].perfect);
  assert.equal(itemResult(g.slots[2]), "raw", "mặt mới úp xuống còn sống");
  run(g, 9200, 9200);
  assert.equal(itemResult(g.slots[2]), "done");
  assert.ok(isCooked(g.slots[2]));
  // để lâu ⇒ cháy cạnh rồi cháy đen (M5: vùng vừa chín 6 giây + cháy cạnh 5 giây)
  run(g, 8000, 18400);
  assert.equal(itemResult(g.slots[2]), "charred");
  run(g, 6000, 26400);
  assert.equal(itemResult(g.slots[2]), "burnt");
});

test("lật sớm khi mặt dưới còn sống: mặt đó tái, phải lật lại", () => {
  const g = freshGrill(45);
  placeItem(g, 2, "suon");
  run(g, 6000);
  flip(g, 2);
  run(g, 9500, 6000);
  assert.equal(itemResult(g.slots[2]), "half", "một mặt tái ⇒ chưa bán được");
  flip(g, 2);
  run(g, 4000, 15500);
  assert.equal(itemResult(g.slots[2]), "done");
});

test("vùng giữ ấm: không cháy trước 60 giây, miếng chín khô dần (tươi −1 mỗi 3 giây)", () => {
  const g = freshGrill(70);
  placeItem(g, 4, "suon");
  g.slots[4].sides = [110, 110];
  run(g, 55000, 0, 500);
  assert.ok(g.slots[4].sides[0] <= GRILL.perfect[1] + 1e-9, "chưa cháy");
  assert.ok(Math.abs(g.slots[4].fresh - (100 - 55000 / 3000)) < 1);
  assert.equal(itemFrame(g.slots[4]), "suon-done");
});

test("than: −0,5 mỗi giây, quạt ×2; tàn (< 10) thì không chín; thêm rổ +35 sau 4 giây; thêm khi rực ⇒ lửa bùng vùng nóng ×2", () => {
  const g = freshGrill(50);
  run(g, 10000);
  assert.ok(Math.abs(g.coal - 45) < 0.01);
  setFan(g, true); run(g, 10000, 10000); setFan(g, false);
  assert.ok(Math.abs(g.coal - 35) < 0.01);
  const dead = freshGrill(5); placeItem(dead, 2, "suon"); run(dead, 5000);
  assert.equal(dead.slots[2].sides[0], 0, "than tàn không chín");
  const h = freshGrill(70); const ev = [];
  addCoal(h, 0, ev);
  assert.ok(ev.some((e) => e.type === "flare"));
  placeItem(h, 0, "suon"); placeItem(h, 2, "suon");
  run(h, 2000);
  assert.ok(h.slots[0].sides[0] / h.slots[2].sides[0] > 2.9, "vùng nóng ×1,5 × lửa bùng ×2");
  run(h, 3000, 2000);
  assert.ok(h.coal > 95, `than bén sau 4 giây: ${h.coal}`);
});

test("quạt: +1 nấc nhiệt; khói +1/giây khi quạt, +3/giây khi có miếng sắp cháy, −2/giây khi yên", () => {
  const g = freshGrill(45);
  assert.equal(heatMul(g), 1);
  setFan(g, true); assert.equal(heatMul(g), 1.2);
  const r = freshGrill(70); setFan(r, true); assert.equal(heatMul(r), GRILL.blazeMul);
  run(g, 10000);
  assert.ok(Math.abs(g.smoke - 10) < 0.01);
  setFan(g, false); run(g, 3000, 10000);
  assert.ok(Math.abs(g.smoke - 4) < 0.01);
  placeItem(g, 2, "suon"); g.slots[2].sides = [126, 110];
  run(g, 2000, 13000);
  assert.ok(g.smoke > 9, "miếng sắp cháy sinh khói");
});

test("dời miếng sang vùng giữ ấm; chỗ đã có miếng thì không bỏ thêm", () => {
  const g = freshGrill(45);
  placeItem(g, 0, "suon");
  assert.equal(placeItem(g, 0, "suon").err, "slot-busy");
  assert.ok(moveItem(g, 0, 5).ok);
  assert.equal(g.slots[0], null);
  assert.equal(g.slots[5].item, "suon");
});

// ---- Cân bằng M3: vùng chín đủ rộng để người thật bấm kịp ----
import { windowSec, advanceSide } from "../core/grill.js?v=c6";
const timeIn = (zone, coal, band = "done", item = "suon", fan = false) => {
  // đo thật bằng tickGrill: thời gian mặt dưới nằm trong dải
  const g = freshGrill(coal); g.fan = fan;
  const slot = zone === "hot" ? 0 : zone === "mid" ? 2 : 4;
  placeItem(g, slot, item);
  const lo = band === "done" ? GRILL.doneMin : GRILL.charMin, hi = band === "done" ? GRILL.charMin : GRILL.burntMin;
  let t = 0, a = null, b = null;
  while (t < 120000 && b === null) { t += 20; g.coal = coal; tickGrill(g, 20, t, []); const v = g.slots[slot].sides[0]; if (a === null && v >= lo) a = t; if (a !== null && v >= hi) b = t; }
  return (b - a) / 1000;
};
test("cân bằng: vùng nóng than rực — chín được 2–4 giây (bản M2 chỉ ~0,7 giây; M5: 3,5 giây)", () => {
  const w = timeIn("hot", 80);
  assert.ok(w >= 2 && w <= 4, `vùng nóng chín ${w}s`);
  assert.ok(Math.abs(windowSec(freshGrill(80), "hot") - w) < 0.15);
});
test("cân bằng: vùng vừa rộng rãi (≥ 4 giây), cháy cạnh vẫn đạt được (≥ 1,2 giây ở vùng nóng, ≥ 2 giây ở vùng vừa)", () => {
  assert.ok(timeIn("mid", 80) >= 4, "vừa, than rực");
  assert.ok(timeIn("mid", 45) >= 4.5, "vừa, than vừa");
  const ch = timeIn("hot", 80, "charred"), cm = timeIn("mid", 80, "charred");
  assert.ok(ch >= 1.2 && ch < 4.5, `cháy cạnh nóng ${ch}`); // M5: 3,5 giây (bộ mô phỏng: một chuyến ra bàn ~4 giây)
  assert.ok(cm >= 2 && cm < 6, `cháy cạnh vừa ${cm}`);
});
test("cân bằng: trước 100 vẫn nướng đúng tốc độ món (vùng nóng vẫn nhanh hơn vùng vừa); quạt + lửa bùng co dải lại", () => {
  const g = freshGrill(80);
  placeItem(g, 0, "suon"); placeItem(g, 2, "suon");
  run(g, 3000);
  assert.ok(g.slots[0].sides[0] > g.slots[2].sides[0] * 1.4);
  assert.ok(timeIn("hot", 80, "done", "suon", true) < timeIn("hot", 80));
  // lạp xưởng (5 giây / mặt) và sườn non (14 giây) cùng một cửa sổ chín theo vùng
  assert.ok(Math.abs(timeIn("hot", 80, "done", "lap-xuong") - timeIn("hot", 80, "done", "suon")) < 0.3);
  // dải không bao giờ nhanh hơn tốc độ thường (vùng giữ ấm vẫn chậm)
  assert.equal(advanceSide(100, 0.001, 1000, "warm", 1.2), 101);
});
test("cân bằng: lật trễ tới 1,5 giây ở vùng nóng vẫn còn chín (không còn cháy oan)", () => {
  const g = freshGrill(80);
  placeItem(g, 0, "suon");
  let t = 0; while (g.slots[0].sides[0] < 100) { t += 20; g.coal = 80; tickGrill(g, 20, t, []); }
  for (let k = 0; k < 75; k++) { t += 20; g.coal = 80; tickGrill(g, 20, t, []); }
  assert.equal(sideState(g.slots[0].sides[0]), "done");
  const r = flip(g, 0);
  assert.ok(r.perfect, "lật trễ 1,5 giây vẫn tính đúng lúc");
});
