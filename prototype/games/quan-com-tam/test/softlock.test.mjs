// Không bao giờ kẹt: bot chơi nhiều ngày × nhiều hạt (chăm + ẩu), mỗi ca đều kết thúc, bất biến luôn giữ; 0 đồng / hết than / hết gạo / hết sườn /
// hết dĩa / kho đầy đều có lối ra (ký gửi, mượn, bao than dự phòng, hộp, hết món).
import test from "node:test";
import assert from "node:assert/strict";
import { apply, must, newGame, prepDay, playDay, playShift, seeded, openWithOrder, home } from "./helpers.mjs";
import { canMakeOne, consignAvailable, stockUsed, capacity } from "../core/stock.js?v=c1";
import { stockoutOptions } from "../core/rescue.js?v=c1";
import { invariantError } from "../core/apply.js?v=c1";

test("bot chơi 6 ngày × 3 hạt × 2 kiểu người chơi: ca nào cũng đóng được, bất biến giữ, luôn làm nổi một dĩa hoặc có ký gửi", () => {
  for (const seed of [1, 2, 3]) for (const skill of ["good", "sloppy"]) {
    const s = newGame(seed);
    for (let d = 0; d < 6; d++) {
      playDay(s, { skill, rnd: seeded(seed * 100 + d) });
      assert.equal(invariantError(s, null), null);
      assert.ok(canMakeOne(s) || consignAvailable(s), `seed ${seed} ${skill} ngày ${s.day}: kẹt (tiền ${s.money})`);
    }
    if (skill === "good") assert.ok(s.level >= 3, `chăm thì lên cấp: ${s.level}`);
  }
});

test("0 đồng, kho trống ⇒ gói ký gửi Cô Ba đủ 10 dĩa (vượt sức chứa được), mở ca chơi được", () => {
  const s = newGame(41);
  s.money = 0;
  for (const k of Object.keys(s.stock)) s.stock[k] = 0;
  assert.ok(!canMakeOne(s) && consignAvailable(s));
  must(s, { type: "consign" });
  assert.ok(s.stock["suon-uop"] >= 10 && s.stock["gao-tam"] >= 10 && s.consign.owed > 0);
  assert.equal(apply(s, { type: "consign" }).err, "no-consign", "một lần mỗi ngày");
  prepDay(s, { restock: false });
  playShift(s, { rnd: seeded(4) });
});

test("kho đầy hàng phụ (đồ chua, dưa leo) mà không chỗ cho sườn ⇒ coi như không làm nổi ⇒ được ký gửi", () => {
  const s = newGame(42);
  for (const k of Object.keys(s.stock)) s.stock[k] = 0;
  s.stock["do-chua"] = 40; s.stock["dua-leo"] = 40;
  s.money = 500;
  assert.ok(stockUsed(s) >= capacity(s));
  assert.ok(!canMakeOne(s) && consignAvailable(s));
});

test("hội thoại hết hàng giữa ca: hết sườn / gạo / than / đồ chua đều có lựa chọn miễn phí; hết than mà có bao dự phòng ⇒ tự mở", () => {
  const { s } = openWithOrder(43);
  home(s);
  for (const id of ["suon-uop", "gao-tam", "than", "do-chua", "nuoc-mam"]) {
    s.shift.dialog = { kind: "stockout", id };
    const opts = stockoutOptions(s);
    assert.ok(opts.some((o) => o.free && o.ok), `${id}: ${opts.map((o) => o.id)}`);
  }
  s.shift.dialog = { kind: "stockout", id: "suon-uop" };
  must(s, { type: "stockout", choice: "borrow" });
  assert.ok(s.stock["suon-uop"] >= 4);
  s.stock.than = 0; s.spareSack = 1;
  const r = must(s, { type: "addCoal" });
  assert.ok(r.events.some((e) => e.type === "spareSack"));
  assert.equal(s.stock.than, 9);
  s.stock.than = 0; s.spareSack = 0;
  must(s, { type: "addCoal" });
  assert.equal(s.shift.dialog?.kind, "stockout");
});

test("hết dĩa sạch ⇒ dùng hộp ăn tại chỗ (trần 4 sao); phiếu không làm được ⇒ báo hết món, khách về, ca vẫn đóng", () => {
  const { s, t } = openWithOrder(44);
  home(s);
  must(s, { type: "pin", tk: t.id });
  s.shift.dirty += s.shift.cleanPlates; s.shift.cleanPlates = 0;
  assert.equal(apply(s, { type: "layer", id: "dia" }).err, "no-plates");
  must(s, { type: "layer", id: "hop" });
  must(s, { type: "discard" });
  must(s, { type: "voidTicket", tk: t.id });
  assert.equal(s.shift.tickets.find((x) => x.id === t.id).status, "void");
  for (let i = 0; i < 4000 && s.shift; i++) { if (s.shift.dialog) break; must(s, { type: "tick", dt: 250 }); }
  assert.ok(!s.shift || s.shift.dialog, "ca kết thúc (khách hướng dẫn về hết)");
});
