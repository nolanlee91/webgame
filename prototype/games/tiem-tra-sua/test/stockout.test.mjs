// Hết hàng giữa ca: dự báo đầu ngày, "Nhập đủ cho hôm nay", nhắc hàng sắp hết, hội thoại hết hàng và từng cách xử lý,
// không bao giờ kẹt (kể cả 0 đồng), sự kiện H01–H03, Nhật Ký, lưu / tải giữa lúc chạy đi mua.
import test from "node:test";
import assert from "node:assert/strict";
import { demandEstimate, stockoutOptions, STOCKOUT, menuStock } from "../core/stockout.js";
import { loadSave, dump } from "../core/state.js";
import { packSize, capacity, stockUsed } from "../core/economy.js";
import { captionKind } from "../core/journal.js";
import { EVENT } from "../data/events.js";
import { LOW_LINES, OUT_LINES, CHOICE_SAY, RUN_REVIEW, SWAP_YES_REVIEW, SWAP_NO_REVIEW, CLOSE_REVIEW, CLOSE_SAY, TEO_WRONG, AWAY_SAY, STOCK_KIND } from "../data/lines-stockout.js";
import { STOCK_IDS } from "../data/ingredients.js";
import { shop, act, err, advance, untilWaiting } from "./helpers.mjs";

const day2 = (seed = 3) => { const s = shop(seed); s.tutorialDone = true; s.day = 2; s.drama.queue = []; return s; };
/** Mở ca ngày 2 không còn ly, ghim khách đầu tiên ⇒ hội thoại hết hàng. */
function outOfCups(seed = 3, money = 100) {
  const s = day2(seed);
  s.stock.ly = 0; s.money = money;
  act(s, { type: "startShift" });
  s.shift.drama.max = 0;
  const c = untilWaiting(s);
  act(s, { type: "pin", cid: c.id });
  return { s, c };
}

test("dự báo đầu ngày: thiếu ly thì báo, đủ hàng thì không; 'Nhập đủ cho hôm nay' giữ tiền phí ca", () => {
  const s = day2();
  Object.assign(s.stock, { ly: 4, "hong-tra": 6, sua: 4, duong: 4, da: 5, "tran-chau-song": 6, dao: 2 }); // sau ngày học
  const est = demandEstimate(s);
  assert.ok(est.guests >= 6 && est.guests <= 13, `khách dự kiến ${est.guests}`);
  assert.equal(est.short[0].id, "ly", "ly lên đầu");
  assert.ok(est.short[0].need > 4);
  s.money = 300;
  const r = act(s, { type: "restockToday" });
  assert.ok(r.events.some((e) => e.type === "restockedToday"));
  const left = demandEstimate(s).short;
  assert.ok(!left.some((x) => x.id === "ly"), "đủ ly");
  // còn thiếu thì chỉ vì kho không còn chỗ cho một gói nữa (sức chứa 60 phần)
  for (const x of left) assert.ok(packSize(x.id) > capacity(s) - stockUsed(s), JSON.stringify(left));
  // ít tiền: mua được gì mua, không đụng phí ca
  const p = day2(); for (const id of STOCK_IDS) p.stock[id] = 0; p.money = 40;
  act(p, { type: "restockToday" });
  assert.ok(p.money >= 12, `còn ${p.money}k cho phí ca`);
  assert.ok(p.stock.ly > 0, "ly nhập trước tiên");
  const z = day2(); z.stock.ly = 0; z.money = 0;
  assert.equal(err(z, { type: "restockToday" }), "money");
});

test("nhắc một lần khi món trên menu còn ≤ 2 phần (toast + câu nhân viên)", () => {
  const s = day2();
  s.stock.ly = 3;
  act(s, { type: "startShift" });
  s.shift.drama.max = 0;
  const r = act(s, { type: "brew", step: "cup", id: "ly" });
  const low = r.events.find((e) => e.type === "lowStock");
  assert.ok(low && low.id === "ly" && low.n === 2 && low.line.includes("2"), JSON.stringify(r.events));
  act(s, { type: "discard" });
  const r2 = act(s, { type: "brew", step: "cup", id: "ly" });
  assert.ok(!r2.events.some((e) => e.type === "lowStock"), "không nhắc lại");
  assert.ok(menuStock(s).has("ly"));
});

test("hết ly: ghim khách mở hội thoại, ca dừng, luôn có lựa chọn làm được", () => {
  const { s, c } = outOfCups();
  assert.equal(s.shift.dialog.kind, "stockout");
  assert.equal(s.shift.dialog.id, "ly");
  assert.equal(s.shift.dialog.cid, c.id);
  const t = s.shift.t; advance(s, 2000); assert.equal(s.shift.t, t, "đồng hồ dừng");
  const ids = stockoutOptions(s).map((o) => o.id);
  for (const id of ["run", "shipper", "borrow", "close"]) assert.ok(ids.includes(id), id);
  assert.ok(stockoutOptions(s).some((o) => o.ok));
});

test("Chạy đi mua gấp: +30%, quầy bỏ trống 12 giây (đồng hồ chạy, kiên nhẫn tụt nhanh), về có hàng rồi giao được", () => {
  const { s, c } = outOfCups();
  const m = s.money;
  const r = act(s, { type: "stockout", choice: "run" });
  assert.equal(r.events[0].type, "stockoutResolved");
  assert.ok(s.money < m && s.money === m - Math.ceil(2 * 10 * 1.3));
  assert.equal(s.shift.dialog, null);
  assert.ok(s.shift.away);
  assert.equal(err(s, { type: "brew", step: "cup", id: "ly" }), "away");
  const b0 = c.bonus;
  const ev = advance(s, STOCKOUT.RUN_MS + 200);
  assert.ok(ev.some((e) => e.type === "ranBack"));
  assert.equal(s.shift.away, null);
  assert.equal(s.stock.ly, 10);
  const cc = s.shift.customers.find((x) => x.id === c.id);
  if (cc?.phase === "wait") {
    assert.ok(cc.bonus < b0, "kiên nhẫn tụt nhanh hơn khi quầy trống");
    if (s.shift.stations[0].cid !== cc.id) act(s, { type: "pin", cid: cc.id });
    const o = cc.order;
    for (const [step, id] of [["cup", "ly"], ["base", o.base], ["add", o.add], ["sugar", o.sugar], ["ice", o.ice]]) act(s, { type: "brew", step, id });
    if (o.topping === "tran-chau") { act(s, { type: "cook", size: 3 }); advance(s, 18200); }
    if (s.shift.customers.find((x) => x.id === cc.id)?.phase === "wait") {
      act(s, { type: "brew", step: "topping", id: o.topping });
      act(s, { type: "brew", step: "lid", id: "dong-nap" });
      const sv = act(s, { type: "serve", cid: cc.id });
      assert.ok(sv.events.some((e) => e.type === "served"));
    }
  }
  assert.ok(s.shift.moments.some((x) => x.kind === "ran"));
});

test("Nhờ Anh Tèo: trả trước, hàng tới sau 20 giây (đúng hàng hoặc mua nhầm), không hỏi lại trong lúc chờ", () => {
  let right = 0, wrong = 0;
  for (let seed = 1; seed <= 16; seed++) {
    const { s } = outOfCups(seed);
    if (!stockoutOptions(s).find((o) => o.id === "shipper").ok) continue;
    act(s, { type: "stockout", choice: "shipper" });
    assert.equal(s.shift.deliveries.length, 1);
    const w = s.shift.deliveries[0].wrong;
    if (!w) assert.equal(err(s, { type: "brew", step: "cup", id: "ly" }), "coming");
    const ev = advance(s, STOCKOUT.SHIP_MS + 400);
    const d = ev.find((e) => e.type === "delivered");
    assert.ok(d, "Anh Tèo tới");
    if (d.wrong) { wrong++; assert.equal(s.stock.ly, 0); assert.ok(s.shift.moments.some((m) => m.id === "T01")); } else { right++; assert.equal(s.stock.ly, 10); }
  }
  assert.ok(right > 0 && wrong > 0, `đúng ${right}, nhầm ${wrong}`);
});

test("Mượn chị Lụa: miễn phí, có hàng ngay, một lần mỗi ngày, mai chị ghé đòi (H01)", () => {
  const { s } = outOfCups();
  const m = s.money;
  act(s, { type: "stockout", choice: "borrow" });
  assert.equal(s.money, m);
  assert.equal(s.stock.ly, STOCKOUT.BORROW_N);
  assert.ok(s.drama.queue.some((q) => q.id === "H01" && q.day === s.day + 1));
  assert.ok(s.debtHB && s.drama.flags["muon-hb"]);
  s.stock.ly = 0;
  act(s, { type: "brew", step: "cup", id: "ly" });
  assert.equal(s.shift.dialog?.kind, "stockout");
  assert.equal(stockoutOptions(s).find((o) => o.id === "borrow").ok, false, "mượn một lần mỗi ngày");
});

test("Đổi món: chỉ khi menu có món không cần thứ đã hết; khách chịu thì đổi đơn, không chịu thì bỏ về + review", () => {
  let yes = 0, no = 0;
  for (let seed = 1; seed <= 30 && (!yes || !no); seed++) {
    const s = day2(seed);
    s.stock.dao = 0; s.stock["tran-chau-song"] = 12;
    act(s, { type: "startShift" });
    s.shift.drama.max = 0;
    const c = untilWaiting(s);
    c.items[0] = { ...c.items[0], recipe: "tra-dao", order: { base: "hong-tra", add: "dao", sugar: 50, ice: "vua", topping: "none" }, price: 26 };
    c.recipe = "tra-dao"; c.order = { ...c.items[0].order };
    act(s, { type: "pin", cid: c.id });
    assert.equal(s.shift.dialog?.id, "dao");
    const o = stockoutOptions(s).find((x) => x.id === "swap");
    assert.ok(o && o.ok && o.sub === "tra-sua-truyen-thong", JSON.stringify(o));
    act(s, { type: "stockout", choice: "swap" });
    const cc = s.shift.customers.find((x) => x.id === c.id);
    if (cc.phase === "wait") { yes++; assert.equal(cc.recipe, "tra-sua-truyen-thong"); assert.equal(cc.price, 27); }
    else { no++; assert.equal(cc.phase, "leave"); assert.equal(s.shift.reviews.at(-1).reason, "stockout"); assert.equal(s.shift.ledger.lost, 1); }
  }
  assert.ok(yes && no, `chịu ${yes}, không ${no}`);
  // menu chỉ còn món cần ly: không có món thay
  const { s } = outOfCups();
  assert.equal(stockoutOptions(s).find((x) => x.id === "swap").ok, false);
});

test("Đóng cửa sớm: khách đang chờ về hết (review), danh tiếng −3, chốt ca có câu Nhật Ký riêng", () => {
  const { s } = outOfCups();
  const rep = s.rep;
  act(s, { type: "stockout", choice: "close" });
  assert.equal(s.shift.schedule.length, 0);
  assert.ok(s.shift.reviews.every((r) => r.reason === "closed"));
  advance(s, 6000);
  assert.equal(s.shift, null, "ca chốt sau khi khách ra hết");
  const sum = s.lastSummary;
  assert.equal(sum.closedEarly, "ly");
  assert.ok(s.rep < rep);
  assert.equal(captionKind(sum), "closed");
  assert.ok(/ly/i.test(sum.headline), sum.headline);
  assert.ok(s.drama.flags["dong-som"] && s.drama.flags["het-hang"]);
});

test("0 đồng: ký gửi Dì Ba lên đầu, nhận được hàng; không bao giờ kẹt", () => {
  const { s } = outOfCups(3, 0);
  const opts = stockoutOptions(s);
  assert.equal(opts[0].id, "consign");
  assert.ok(opts[0].ok);
  assert.ok(!opts.find((o) => o.id === "run").ok && !opts.find((o) => o.id === "shipper").ok);
  act(s, { type: "stockout", choice: "consign" });
  assert.equal(s.stock.ly, 10);
  assert.ok(s.consign.owed >= 20);
  // ký gửi + mượn đã dùng hết trong ngày: vẫn còn "Đóng cửa sớm"
  s.stock.ly = 0; s.shift.borrowDay = s.shift.day;
  act(s, { type: "brew", step: "cup", id: "ly" });
  assert.equal(s.shift.dialog?.kind, "stockout");
  const ok = stockoutOptions(s).filter((o) => o.ok).map((o) => o.id);
  assert.ok(ok.includes("close"), ok.join());
});

test("hết trân châu sống (chưa có mẻ chín): hội thoại cho trân châu", () => {
  const s = day2();
  s.stock["tran-chau-song"] = 0;
  act(s, { type: "startShift" });
  s.shift.drama.max = 0;
  for (const [step, id] of [["cup", "ly"], ["base", "hong-tra"], ["add", "sua"], ["sugar", 50], ["ice", "it"]]) act(s, { type: "brew", step, id });
  act(s, { type: "brew", step: "topping", id: "tran-chau" });
  assert.equal(s.shift.dialog?.id, "tran-chau-song");
});

test("lưu / tải giữa lúc chạy đi mua và giữa hội thoại hết hàng", () => {
  const { s } = outOfCups();
  const a = loadSave(dump(s));
  assert.equal(a.shift.dialog.kind, "stockout");
  act(s, { type: "stockout", choice: "run" });
  const b = loadSave(dump(s));
  assert.deepEqual(b.shift.away, s.shift.away);
  advance(b, STOCKOUT.RUN_MS + 200);
  assert.equal(b.stock.ly, 10);
});

test("H01–H03 mở được và mọi lựa chọn giải quyết được", () => {
  for (const id of ["H01", "H02", "H03"]) {
    const ev = EVENT[id];
    assert.ok(ev, id);
    for (const ch of ev.nodes.start.choices) {
      const s = day2(); s.money = 100; s.day = 3;
      s.drama.flags = { "muon-hb": 9, "dong-som": 9, "het-hang": 9 };
      s.drama.pending = { kind: "event", id, node: "start", cid: null, npc: ev.npc, steps: 0 };
      act(s, { type: "choose", choice: ch.id });
      assert.equal(s.drama.pending, null);
    }
  }
});

test("nội dung: câu nhân viên mỗi nhóm hàng, review mỗi kết cục đủ số, không emoji", () => {
  for (const id of STOCK_IDS) assert.ok(STOCK_KIND[id], id);
  for (const k of Object.keys(LOW_LINES)) { assert.ok(LOW_LINES[k].length >= 8, k); assert.ok(OUT_LINES[k].length >= 6, k); }
  for (const [n, list] of Object.entries({ RUN_REVIEW, SWAP_YES_REVIEW, SWAP_NO_REVIEW, CLOSE_REVIEW, CLOSE_SAY, TEO_WRONG, AWAY_SAY })) assert.ok(list.length >= 8, n);
  for (const k of ["run", "shipper", "borrow", "swap", "close"]) assert.ok(CHOICE_SAY[k].length >= 6, k);
  const all = JSON.stringify([LOW_LINES, OUT_LINES, CHOICE_SAY, RUN_REVIEW, SWAP_YES_REVIEW, SWAP_NO_REVIEW, CLOSE_REVIEW, CLOSE_SAY, TEO_WRONG, AWAY_SAY]);
  assert.ok(!/\p{Extended_Pictographic}/u.test(all), "không emoji");
});

test("kho đầy hàng khác: chạy đi mua / ký gửi vẫn có hàng (để dưới gầm quầy), trả tiền là có hàng; hết tiền thì ký gửi lại được", () => {
  const { s } = outOfCups();
  s.stock.thach = capacity(s); // kho chật cứng thạch
  act(s, { type: "stockout", choice: "run" });
  advance(s, STOCKOUT.RUN_MS + 200);
  assert.equal(s.stock.ly, 10, "mua gấp không bị sức chứa nuốt mất");
  // hết tiền, ký gửi đã nhận hôm nay: vẫn được ký gửi thêm (nợ cộng dồn)
  const p = outOfCups(5, 0).s;
  act(p, { type: "stockout", choice: "consign" });
  p.stock.ly = 0;
  act(p, { type: "brew", step: "cup", id: "ly" });
  const o = stockoutOptions(p).find((x) => x.id === "consign");
  assert.ok(o && o.ok, "ký gửi lần hai khi không đủ tiền");
});
