// D9: frame() của 3 game tiệm không làm ngập console khi một lỗi lặp lại mỗi khung.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { frameErrorLog } from "../frame-errors.js";

const setup = () => {
  const lines = []; let t = 0;
  const fe = frameErrorLog("Test", { log: (...a) => lines.push(a), now: () => t });
  return { fe, lines, at: (ms) => { t = ms; } };
};

test("lỗi lặp lại mỗi khung: in đầy đủ 1 lần, rồi mỗi ~5 s một dòng đếm", () => {
  const { fe, lines, at } = setup();
  for (let f = 0; f < 60 * 12; f++) { at(f * 16.7); fe.error(new TypeError("x is null")); } // 12 s ở 60 fps
  assert.equal(lines.length, 3, JSON.stringify(lines.map((l) => String(l[0]))));
  assert.ok(lines[0][1] instanceof TypeError, "dòng đầu kèm chính đối tượng lỗi (có stack)");
  assert.match(lines[1][0], /\[Test\] lỗi lặp lại \d+ lần trong 5 s: TypeError: x is null/);
  assert.equal(fe.total, 720);
});

test("lỗi đổi sang lỗi khác: in ngay số đếm của lỗi cũ + lỗi mới đầy đủ; lỗi cũ quay lại thì chỉ đếm", () => {
  const { fe, lines, at } = setup();
  at(0); fe.error(new Error("A")); at(16); fe.error(new Error("A")); at(32); fe.error(new Error("A"));
  at(48); fe.error(new RangeError("B"));
  assert.equal(lines.length, 3);
  assert.match(lines[1][0], /lặp lại 2 lần.*Error: A/);
  assert.ok(lines[2][1] instanceof RangeError);
  at(64); fe.error(new Error("A")); // đã thấy ⇒ không in lại đầy đủ, chỉ in số đếm của B (0 ⇒ không in)
  assert.equal(lines.length, 3);
  at(80); fe.error(new RangeError("B"));
  assert.equal(lines.length, 4);
  assert.match(lines[3][0], /lặp lại 1 lần.*Error: A/);
});

test("lỗi thôi lặp: ok() in nốt số đếm sau ~5 s, không in gì khi không có lỗi chờ", () => {
  const { fe, lines, at } = setup();
  at(0); fe.error(new Error("A")); at(10); fe.error(new Error("A"));
  for (let f = 1; f < 400; f++) { at(10 + f * 16.7); fe.ok(); }
  assert.equal(lines.length, 2);
  assert.match(lines[1][0], /lặp lại 1 lần/);
  for (let f = 0; f < 1000; f++) { at(7000 + f * 16.7); fe.ok(); }
  assert.equal(lines.length, 2);
});

test("lỗi lặp ngắt quãng (cứ 2 khung 1 lỗi): vẫn không in mỗi khung", () => {
  const { fe, lines, at } = setup();
  for (let f = 0; f < 600; f++) { at(f * 16.7); if (f % 2) fe.error(new Error("A")); else fe.ok(); }
  assert.ok(lines.length <= 3, String(lines.length));
});

test("không bao giờ ném: giá trị lạ, log hỏng", () => {
  const fe = frameErrorLog("T", { log: () => { throw new Error("console hỏng"); } });
  assert.doesNotThrow(() => { fe.error(null); fe.error(undefined); fe.error("chuỗi"); fe.error({ get name() { throw 1; } }); fe.error(42); fe.ok(); });
});

test("3 game tiệm: frame() dùng frameErrorLog, không còn console.error mỗi khung", () => {
  for (const g of ["quan-com-tam", "tiem-banh-mi", "tiem-tra-sua"]) {
    const src = readFileSync(new URL(`../../${g}/game.js`, import.meta.url), "utf8");
    const body = src.slice(src.indexOf("function frame(now)"), src.indexOf("function step(now)"));
    assert.match(src, /import \{ frameErrorLog \} from "\.\.\/_shared\/frame-errors\.js\?v=[\w-]+";/, g);
    assert.match(body, /try \{ step\(now\); frameErr\.ok\(\); \} catch \(err\) \{ frameErr\.error\(err\); \}/, g);
    assert.doesNotMatch(body, /console\.error/, g);
  }
});
