// Dây chuyền ráp 9 bước, thứ tự, hoàn tác, trừ kho đúng một lần, hết hàng giữa bước, lớp ổ bánh (loaf-layers).
import test from "node:test";
import assert from "node:assert/strict";
import { shop, act, err, openDay, untilWaiting, build, serveRight, board, customer } from "./helpers.mjs";
import { loafLayers } from "../render/loafview.js";
import { apply } from "../core/apply.js";

function pinned() { const s = shop(); openDay(s); const c = untilWaiting(s); act(s, { type: "pin", cid: c.id }); return [s, c]; }

test("chưa ghim phiếu thì không lấy bánh; ghim xong lấy ổ giòn nhất", () => {
  const s = shop(); openDay(s);
  assert.equal(err(s, { type: "take" }), "no-ticket");
  const c = untilWaiting(s);
  s.shift.case[1].crisp = 99.5; s.shift.case[0].crisp = 70;
  act(s, { type: "pin", cid: c.id }); act(s, { type: "take" });
  assert.equal(Math.round(board(s).loaf.crisp), 100);
  assert.equal(s.shift.case.length, 3);
});

test("thứ tự: rạch trước rồi mới phết; làm bước sau thì không quay lại bước trước (Hoàn tác mới sửa)", () => {
  const [s] = pinned();
  act(s, { type: "take" });
  assert.equal(err(s, { type: "spread", id: "pate", lvl: 2 }), "wrong-step");
  act(s, { type: "slice" });
  act(s, { type: "spread", id: "pate", lvl: 2 });
  act(s, { type: "veg", id: "all" });
  assert.equal(err(s, { type: "spread", id: "bo", lvl: 2 }), "wrong-step", "đã sang rau dưa thì phết khoá");
  act(s, { type: "undo" });
  act(s, { type: "spread", id: "bo", lvl: 2 });
  assert.equal(board(s).loaf.spreads.bo, 2);
  assert.equal(err(s, { type: "toast" }), "wrong-step", "đã rạch thì không nướng lại");
});

test("nguyên liệu trừ đúng một lần; nhiều pate dùng 2 phần; rau mùi + hành chung một phần rau; gia vị một phần mỗi ổ", () => {
  const [s] = pinned();
  const st = { ...s.stock };
  act(s, { type: "take" }); act(s, { type: "slice" });
  act(s, { type: "spread", id: "pate", lvl: 3 });
  assert.equal(s.stock.pate, st.pate - 2);
  act(s, { type: "veg", id: "rau-mui" }); act(s, { type: "veg", id: "hanh-la" });
  assert.equal(s.stock.rau, st.rau - 1);
  act(s, { type: "spice", id: "ot", lvl: 2 }); act(s, { type: "spice", id: "nuoc-tuong" });
  assert.equal(s.stock["gia-vi"], st["gia-vi"] - 1);
  act(s, { type: "wrap", kind: "giay" });
  assert.equal(s.stock["giay-goi"], st["giay-goi"] - 1);
  assert.equal(err(s, { type: "wrap", kind: "giay" }), "wrapped", "bấm lặp không trừ hai lần");
});

test("hoàn tác / đổ ổ: phần đã dùng ghi hao, không hoàn kho", () => {
  const [s] = pinned();
  act(s, { type: "take" }); act(s, { type: "slice" }); act(s, { type: "spread", id: "pate", lvl: 2 });
  const pate = s.stock.pate;
  act(s, { type: "undo" });
  assert.equal(s.stock.pate, pate);
  assert.ok(s.shift.waste.spoil >= 2);
  act(s, { type: "discard" });
  assert.equal(board(s).loaf, null);
  assert.ok(s.shift.waste.spoil >= 4, "đổ ổ ghi hao phôi");
});

test("hết nguyên liệu ở bước nào thì mở hội thoại hết hàng, bước không làm", () => {
  const [s] = pinned();
  s.stock.pate = 0;
  act(s, { type: "take" }); act(s, { type: "slice" });
  act(s, { type: "spread", id: "pate", lvl: 2 });
  assert.equal(s.shift.dialog.kind, "stockout");
  assert.equal(s.shift.dialog.id, "pate");
  assert.equal(board(s).loaf.spreads.pate, undefined);
  act(s, { type: "stockout", choice: "borrow" });
  assert.equal(s.stock.pate, 4);
  act(s, { type: "spread", id: "pate", lvl: 2 });
  assert.equal(board(s).loaf.spreads.pate, 2);
});

test("tủ trống khi lấy bánh ⇒ hội thoại hết bánh (chờ lò / bánh sỉ / mượn / ký gửi / đóng cửa)", async () => {
  const [s] = pinned();
  s.shift.case = [];
  act(s, { type: "take" });
  assert.equal(s.shift.dialog.id, "banh");
  const { stockoutOptions } = await import("../core/rescue.js");
  const ids = stockoutOptions(s).map((o) => o.id);
  assert.ok(ids.includes("waitOven") && ids.includes("si") && ids.includes("close"));
  act(s, { type: "stockout", choice: "si" });
  assert.ok(s.shift.away);
  assert.equal(err(s, { type: "take" }), "away");
  for (let i = 0; i < 80; i++) act(s, { type: "tick", dt: 200 });
  assert.equal(s.shift.case.filter((l) => l.src === "si").length, 10);
  assert.ok(s.shift.case.every((l) => l.crisp <= 80));
});

test("giao chỉ khi đã gói; giao xong thớt trống, bấm Giao lặp không giao hai lần", () => {
  const [s, c] = pinned();
  act(s, { type: "take" });
  assert.equal(err(s, { type: "serve" }), "not-wrapped");
  build(s, customer(s, c.id).items[0]);
  act(s, { type: "serve" });
  assert.equal(board(s).cid, null);
  assert.notEqual(err(s, { type: "serve" }), undefined);
});

test("ổ bánh dày dần từng bước: lớp loaf-layers theo thứ tự ART-DIRECTION §5", () => {
  const [s, c] = pinned();
  act(s, { type: "take" });
  assert.deepEqual(loafLayers(board(s).loaf), ["loaf-whole-golden"]);
  act(s, { type: "slice" }); act(s, { type: "spread", id: "pate", lvl: 2 }); act(s, { type: "fill", id: "cha-lua" });
  act(s, { type: "veg", id: "all" }); act(s, { type: "spice", id: "ot", lvl: 1 }); act(s, { type: "spice", id: "nuoc-tuong" });
  assert.deepEqual(loafLayers(board(s).loaf), ["loaf-open-back", "spread-pate", "fill-cha-lua", "do-chua", "dua-leo", "rau-mui", "hanh-la", "ot-it", "sauce-nuoc-tuong", "loaf-open-front"]);
  act(s, { type: "wrap", kind: "cat-doi" });
  assert.deepEqual(loafLayers(board(s).loaf), ["wrap-paper-half"]);
});

test("đơn nhiều ổ: ghép từng ổ, đủ mới chấm; chọn ổ đang ráp", () => {
  const s = shop(); openDay(s);
  const c = untilWaiting(s);
  const cc = customer(s, c.id);
  cc.items = [cc.items[0], { ...structuredClone(cc.items[0]), quirks: ["khong-hanh"], veg: { ...cc.items[0].veg, "hanh-la": false } }];
  cc.filled = [null, null];
  act(s, { type: "pin", cid: c.id });
  act(s, { type: "selectItem", idx: 1 });
  build(s, cc.items[1]);
  const r = act(s, { type: "serve" });
  assert.ok(r.events.some((e) => e.type === "filled" && e.n === 1 && e.of === 2));
  assert.equal(board(s).item, 0);
  build(s, customer(s, c.id).items[0]);
  act(s, { type: "serve" });
  assert.equal(customer(s, c.id).phase === "pay" || customer(s, c.id).phase === "react", true);
});

test("apply lỗi không đổi trạng thái (bản nháp)", () => {
  const [s] = pinned();
  const before = JSON.stringify(s);
  assert.ok(apply(s, { type: "spread", id: "pate", lvl: 9 }).err);
  assert.ok(apply(s, { type: "nope" }).err);
  assert.equal(JSON.stringify(s), before);
  serveRight; // dùng ở test khác
});
