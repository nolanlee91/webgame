// Không bao giờ kẹt (PLAYBOOK §6): 0 đồng + 0 hàng, hết gas, hết lẻ, kho đầy; bot chơi nhiều ngày (cả ẩu) luôn chốt được ca.
import test from "node:test";
import assert from "node:assert/strict";
import { shop, act, err, openDay, untilWaiting, playShift, prepAndOpen, board } from "./helpers.mjs";
import { stockoutOptions } from "../core/rescue.js";
import { consignAvailable } from "../core/stock.js";
import { invariantError } from "../core/apply.js";
import { STOCK_IDS } from "../data/economy.js";

test("0 đồng + kho trống trước ca ⇒ có gói ký gửi Bà Tư (đủ 10 ổ pate bơ), mở ca bán được", () => {
  const s = shop(2);
  s.money = 0; s.float = {};
  for (const id of STOCK_IDS) s.stock[id] = 0;
  assert.equal(consignAvailable(s), true);
  act(s, { type: "consign" });
  assert.ok(s.stock.phoi >= 10 && s.stock.pate >= 10 && s.stock.gas >= 3);
  assert.ok(s.consign.owed > 0);
  assert.equal(err(s, { type: "consign" }), "consign-unavailable", "một lần mỗi ngày");
  act(s, { type: "startShift" });
  playShift(s);
  assert.equal(s.shift, null);
  assert.ok(s.lastSummary.served > 0);
  assert.ok(!s.consign || s.consign.owed < 70, "bán tới đâu trả tới đó");
});

test("mọi hội thoại hết hàng luôn có lựa chọn miễn phí bấm được (kể cả khi 0 đồng, đã mượn)", () => {
  const s = shop(3); openDay(s);
  const c = untilWaiting(s);
  act(s, { type: "pin", cid: c.id });
  s.money = 0; s.float = {}; s.daily.borrowed = true; s.shift.consignUsed = true;
  for (const id of ["pate", "gia-vi", "giay-goi", "banh", "gas"]) {
    s.shift.dialog = { kind: "stockout", id, cid: id === "gas" ? null : c.id };
    const opts = stockoutOptions(s);
    assert.ok(opts.some((o) => o.ok && o.free), id);
    assert.ok(opts.some((o) => o.id === "close" && o.ok), id + ": luôn đóng cửa sớm được");
  }
  s.shift.dialog = { kind: "stockout", id: "pate", cid: c.id };
  act(s, { type: "stockout", choice: "close" });
  assert.equal(s.shift, null);
  assert.equal(s.lastSummary.early, true);
});

test("kho đầy: nhập hàng bị chặn với lý do; hàng cứu giữa ca được để tạm (vượt sức chứa)", () => {
  const s = shop(); s.money = 999;
  s.stock.phoi = 50;
  assert.equal(err(s, { type: "restock", id: "phoi" }), "capacity");
  openDay(s);
  const c = untilWaiting(s);
  act(s, { type: "pin", cid: c.id });
  s.stock.pate = 0; s.stock["cha-lua"] = 30;
  s.shift.dialog = { kind: "stockout", id: "pate", cid: c.id };
  act(s, { type: "stockout", choice: "borrow" });
  assert.equal(invariantError(s, null, "stockout"), null);
});

test("bot chơi 6 ngày × 3 hạt × (chuẩn / ẩu): ca nào cũng chốt, bất biến giữ, không ngày nào kẹt", () => {
  for (const seed of [1, 21, 77]) for (const sloppy of [0, 0.35]) {
    const s = shop(seed);
    let a = seed * 7 + 1;
    const rnd = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
    for (let d = 0; d < 6; d++) {
      prepAndOpen(s);
      playShift(s, { sloppy, rnd });
      assert.equal(s.shift, null, `hạt ${seed} ẩu ${sloppy} ngày ${d + 1} chưa chốt ca`);
      assert.equal(invariantError(s, s), null);
    }
    assert.equal(s.day, 7);
    if (!sloppy) assert.ok(s.money > 60, `hạt ${seed}: người chơi chuẩn có lời (${s.money}k)`);
  }
});

test("bấm lặp / tải lại không giao, không trừ kho, không thối hai lần (đã kiểm ở assembly / change); tick khi có hội thoại không chạy đồng hồ", () => {
  const s = shop(); openDay(s);
  const c = untilWaiting(s);
  act(s, { type: "pin", cid: c.id });
  s.stock.pate = 0; act(s, { type: "take" }); act(s, { type: "slice" }); act(s, { type: "spread", id: "pate", lvl: 2 });
  const t = s.shift.t;
  act(s, { type: "tick", dt: 200 });
  assert.equal(s.shift.t, t, "đồng hồ ca dừng khi hội thoại mở");
  assert.ok(board(s).loaf);
});
