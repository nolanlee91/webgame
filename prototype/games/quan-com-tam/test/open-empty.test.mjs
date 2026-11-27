// TLC22-04 / TLC2-14: mở quán khi bếp chưa nhóm than thì ca phải nói rõ ngay (trước đây im lặng), và lúc than tàn mà kho hết than
// thì lời nhắc chỉ cách mua gấp. Bảng Chuẩn bị (ui/overlays.js) hỏi lại trước khi mở quán rỗng: kiểm ở e2e.
import test from "node:test";
import assert from "node:assert/strict";
import { newGame, prepDay, must } from "./helpers.mjs?v=c10";

const says = (r) => r.events.filter((e) => e.type === "say" && e.kind === "warn").map((e) => e.text);

test("mở quán khi bếp chưa nhóm ⇒ cảnh báo 'Bếp chưa nhóm than' ngay lúc mở", () => {
  const s = newGame(3);
  prepDay(s, { light: false });
  assert.equal(s.kitchen.coal, 0);
  const r = must(s, { type: "startShift" });
  assert.ok(says(r).some((t) => /Bếp chưa nhóm than/.test(t)), says(r).join(" | "));
});

test("kho hết than ⇒ lời cảnh báo lúc mở chỉ cách nhờ mua gấp", () => {
  const s = newGame(4);
  prepDay(s, { light: false });
  s.stock.than = 0; s.spareSack = 0;
  const r = must(s, { type: "startShift" });
  assert.ok(says(r).some((t) => /kho hết than/.test(t)), says(r).join(" | "));
});

test("bếp đã nhóm ⇒ không có cảnh báo bếp lúc mở", () => {
  const s = newGame(5);
  prepDay(s);
  assert.ok(s.kitchen.coal > 0);
  const r = must(s, { type: "startShift" });
  assert.ok(!says(r).some((t) => /Bếp chưa nhóm|Bếp nguội/.test(t)), says(r).join(" | "));
});

test("than tàn giữa ca khi kho hết than ⇒ coalOut kèm cách mua gấp", () => {
  const s = newGame(6);
  prepDay(s);
  must(s, { type: "startShift" });
  s.stock.than = 0; s.spareSack = 0;
  s.shift.grill.coal = 10.05; s.shift.grill.pending = [];
  let found = [];
  for (let i = 0; i < 20 && !found.length; i++) found = says(must(s, { type: "tick", dt: 200 })).filter((t) => /mua gấp/.test(t));
  assert.ok(found.length, "có lời nhắc mua gấp khi than tàn");
});
