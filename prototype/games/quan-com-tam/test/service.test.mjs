// Phục vụ tại bàn: xếp chỗ, bàn dơ chặn khách, châm trà + lấy phiếu, cô chủ đi bộ (thời gian theo quãng đường), bưng dĩa, ăn, tính tiền
// (tay + "Tính đúng" ngày 1–3), dọn + lau, dĩa dơ vào thau, rửa chén; bấm lặp không chạy hai lần.
import test from "node:test";
import assert from "node:assert/strict";
import { apply, must, openWithOrder, home, cookedPiece, until, newGame, prepDay } from "./helpers.mjs";
import { scenePoints, ownerRoute, pathLen } from "../core/placements.js?v=c5";
import { walkMs } from "../core/walker.js?v=c5";
import { canAutoBill, makeBill, settle, realLines } from "../core/bill.js?v=c5";
import { SERVICE, DISHES } from "../data/economy.js?v=c5";

/** Bày + giao đúng phiếu, chờ dĩa xuống bàn. */
function serveTicket(s, t) {
  home(s);
  must(s, { type: "pin", tk: t.id });
  cookedPiece(s, 4);
  for (let i = 0; i < 14; i++) { const r = must(s, { type: "autoStep" }); if (r.events.some((e) => e.type === "serving")) break; }
  until(s, (x) => x.shift.tickets.find((y) => y.id === t.id).status === "served", 20000);
}

test("cô chủ đi bộ thật: bàn xa mất nhiều thời gian hơn bàn gần (đi theo lối đi, ~330 px/giây)", () => {
  const P = scenePoints("street");
  const near = P.tables.find((t) => t.id === "s1"), far = P.tables.find((t) => t.id === "s2");
  const a = pathLen(ownerRoute(P, P.owner, near.servePoint)) / SERVICE.ownerSpeed, b = pathLen(ownerRoute(P, P.owner, far.servePoint)) / SERVICE.ownerSpeed;
  assert.ok(a > 1.2 && b > a && b < 3.2, `${a.toFixed(2)}s · ${b.toFixed(2)}s`);
  const { s, tid } = openWithOrder(11);
  home(s);
  const ms = walkMs(s, scenePoints("street").tables.find((t) => t.id === tid).servePoint);
  // giao việc châm trà: cô chủ rời bếp, tới bàn sau đúng thời gian đi
  s.shift.groups[0].members[0].tea = "empty";
  must(s, { type: "tableTap", tid });
  must(s, { type: "tick", dt: Math.max(100, ms - 300) });
  assert.equal(s.shift.owner.task?.phase, "walk");
  until(s, (x) => x.shift.owner.task?.phase === "work" || !x.shift.owner.task, 3000);
});

test("mời ngồi: chỉ vào bàn sạch đủ chỗ; bàn dơ chặn khách mới; khách tự đi tới ghế", () => {
  const s = newGame(12);
  prepDay(s);
  must(s, { type: "startShift" });
  until(s, (x) => x.shift.groups.some((g) => g.phase === "wait"), 60000);
  const g = s.shift.groups.find((x) => x.phase === "wait");
  s.shift.tables[0].state = "dirty"; s.shift.tables[0].dirtyT = s.shift.t;
  assert.equal(apply(s, { type: "seat", gid: g.id, tid: s.shift.tables[0].id }).err, "table-dirty");
  must(s, { type: "seat", gid: g.id, tid: s.shift.tables[1].id });
  assert.equal(s.shift.groups.find((x) => x.id === g.id).phase, "toTable");
  assert.equal(apply(s, { type: "seat", gid: g.id, tid: s.shift.tables[1].id }).err, "not-waiting", "bấm lặp không xếp hai lần");
  until(s, (x) => x.shift.groups.find((y) => y.id === g.id).phase === "seated", 5000);
  assert.equal(s.shift.tables[1].gid, g.id);
});

test("châm trà + lấy phiếu trong một lần ra bàn; phiếu theo từng người; trà vơi dần rồi cạn", () => {
  const { s, g, t } = openWithOrder(13);
  assert.ok(t && t.gid === g.id && g.members.every((m) => m.tk !== null));
  assert.ok(g.members.every((m) => m.tea === "full"));
  const G = () => s.shift.groups.find((x) => x.id === g.id); // apply chạy trên bản nháp ⇒ đọc lại sau mỗi bước
  until(s, () => G().members[0].tea === "half", SERVICE.teaHalfMs + 500);
  assert.equal(G().members[0].tea, "half");
});

test("bưng dĩa ⇒ khách ăn ⇒ gọi tính tiền ⇒ phiếu tính tiền có dòng thật + dòng nhiễu; Tính đúng chỉ ngày 1–3; tính đúng ⇒ trả tiền, về, bàn dơ có dĩa", () => {
  const { s, g, t, tid } = openWithOrder(14);
  serveTicket(s, t);
  until(s, (x) => x.shift.groups.find((y) => y.id === g.id)?.billT !== null, 60000);
  must(s, { type: "tableTap", tid });
  until(s, (x) => !!x.shift.billing, 10000);
  const b = s.shift.billing;
  assert.ok(b.lines.some((l) => !l.real), "có dòng nhiễu");
  assert.ok(canAutoBill(s));
  const money0 = s.money;
  must(s, { type: "autoBill" });
  const r = must(s, { type: "collect" });
  assert.equal(r.result.over, 0); assert.equal(r.result.under, 0);
  assert.ok(s.money >= money0 + 32 - 1);
  assert.equal(apply(s, { type: "collect" }).err, "no-bill", "bấm lặp không thu hai lần");
  const tb = s.shift.tables.find((x) => x.id === tid);
  assert.equal(tb.state, "dirty"); assert.equal(tb.plates, 1);
  s.day = 4;
  assert.ok(!canAutoBill(s), "từ ngày 4 phải tự cộng");
});

test("tính tiền tay: thiếu dòng ⇒ quán mất tiền (không trừ sao); thừa dòng ⇒ khách phản đối, lỗi tính tiền trần 2 sao", () => {
  const { s, g, t, tid } = openWithOrder(15);
  serveTicket(s, t);
  until(s, (x) => x.shift.groups.find((y) => y.id === g.id)?.billT !== null, 60000);
  must(s, { type: "tableTap", tid });
  until(s, (x) => !!x.shift.billing, 10000);
  for (const l of s.shift.billing.lines) must(s, { type: "tapLine", key: l.key }); // cộng cả dòng nhiễu
  must(s, { type: "collect" });
  assert.equal(s.shift.dialog?.kind, "overcharge");
  must(s, { type: "overcharge", choice: "refund" });
  const m = s.shift.groups.find((x) => x.id === g.id)?.members[0] || g.members[0];
  assert.ok(s.feed[0].stars <= 2, `review ${s.feed[0].stars} sao`);
  // tính thiếu
  const b = { lines: [{ key: "a", price: 32, real: true }, { key: "b", price: 4, real: true }], tapped: ["a"] };
  assert.deepEqual(settle(b), { total: 32, correct: 36, over: 0, under: 4 });
});

test("dọn + lau: bàn dơ → ướt → sạch, dĩa dơ vào thau; rửa chén 6 giây cho 6 dĩa; dĩa luôn bảo toàn", () => {
  const { s, g, t, tid } = openWithOrder(16);
  serveTicket(s, t);
  until(s, (x) => x.shift.groups.find((y) => y.id === g.id)?.billT !== null, 60000);
  must(s, { type: "tableTap", tid }); until(s, (x) => !!x.shift.billing, 10000);
  must(s, { type: "autoBill" }); must(s, { type: "collect" });
  const dirty0 = s.shift.dirty;
  must(s, { type: "tableTap", tid });
  until(s, (x) => x.shift.tables.find((y) => y.id === tid).state !== "dirty", 15000);
  assert.equal(s.shift.tables.find((y) => y.id === tid).state, "wet");
  assert.equal(s.shift.dirty, dirty0 + 1);
  until(s, (x) => x.shift.tables.find((y) => y.id === tid).state === "clean", 3000);
  const clean0 = s.shift.cleanPlates;
  must(s, { type: "wash" });
  until(s, (x) => x.shift.dirty === 0, 15000);
  assert.equal(s.shift.cleanPlates, clean0 + dirty0 + 1);
  assert.equal(s.shift.cleanPlates, s.plates, "mọi dĩa đã về chồng sạch");
});

test("khách chờ bàn quá kiên nhẫn thì bỏ về (review 1 sao); khách đã ngồi gọi tính tiền 40 giây không ai tới ⇒ để tiền trên bàn (không kẹt)", () => {
  const s = newGame(17);
  s.tutorialDone = true;
  prepDay(s);
  must(s, { type: "startShift" });
  until(s, (x) => x.shift.groups.some((g) => g.phase === "wait"), 90000);
  const g = s.shift.groups.find((x) => x.phase === "wait");
  until(s, (x) => !x.shift.groups.find((y) => y.id === g.id) || x.shift.groups.find((y) => y.id === g.id).phase === "leave", 120000);
  assert.ok(s.feed.some((r) => r.stars === 1));
  const o = openWithOrder(18);
  serveTicket(o.s, o.t);
  until(o.s, (x) => x.shift.groups.find((y) => y.id === o.g.id)?.billT !== null, 60000);
  const m0 = o.s.money;
  until(o.s, (x) => x.shift.groups.find((y) => y.id === o.g.id)?.paid, SERVICE.billAutoMs + 2000);
  assert.ok(o.s.money > m0, "khách tự để tiền");
});

test("realLines: món đã ăn + thêm cơm dặn lúc gọi + chén cơm / khăn lạnh gọi thêm", () => {
  const s = newGame(19);
  s.shift = { tickets: [{ id: 1, dish: "com-suon", status: "served", quirks: ["themCom"], plateCom: 2 }] };
  const g = { members: [{ idx: 0, name: "Tèo", tk: 1, extras: { com: 1, khan: 2 } }] };
  const L = realLines(s, g);
  assert.equal(L.reduce((a, l) => a + l.price, 0), DISHES["com-suon"].price + 4 + 4 + 2 * 2);
  s.shift.t = 0; g.id = 1; g.table = "s1";
  const b = makeBill(s, g);
  assert.ok(b.lines.length > L.length);
});
