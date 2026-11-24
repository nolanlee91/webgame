// M5 (S): lối chơi còn thiếu sau M3 + M4 và lỗi bộ mô phỏng tìm ra. Mỗi khoảng trống một test.
import test from "node:test";
import assert from "node:assert/strict";
import { apply, must, newGame, prepDay, until, home, openWithOrder, cookedPiece } from "./helpers.mjs";
import { LEVELS, DISHES, GRILL, FAIR, CHALLENGE, DECOR, START_STOCK } from "../data/economy.js?v=c4";
import { loadSave, dump, createState, SAVE_VERSION, LEVELS_V2, rescaleXp } from "../core/state.js?v=c4";
import { shopSave, KEY, backupKey } from "../save.js?v=c4";
import { levelForXp, xpToNext } from "../core/progress.js?v=c4";
import { judge, scorePlate } from "../core/score.js?v=c4";
import { slotOf } from "../core/plate.js?v=c4";
import { isVegSlot, onGrill2, hottestFree, zoneOf } from "../core/grill.js?v=c4";
import { debtTotal } from "../core/progression.js?v=c4";
import { ticketPrice } from "../core/bill.js?v=c4";
import { stockoutOptions } from "../core/rescue.js?v=c4";
import * as EX from "../core/extras.js?v=c4";
import * as LM from "../data/lines-m5.js?v=c4";

const atLevel = (lv, { seed = 5, stage = "street", money = 3000 } = {}) => {
  const s = newGame(seed);
  must(s, { type: "persona", persona: "hien" });
  s.tutorialDone = true; s.day = Math.max(2, s.day); s.xp = LEVELS[lv - 1]; s.level = lv; s.money = money; s.stage = stage;
  if (stage === "quan") s.plates = Math.max(s.plates, 16);
  return s;
};
const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };

// ---------- lỗi bộ mô phỏng tìm ra ----------
test("lỗi sim: gói học (đồ chua, dưa leo) và gói ký gửi không hết hạn sau một đêm", () => {
  const s = newGame(3);
  s.tutorialDone = true;
  s.stock["do-chua"] = START_STOCK["do-chua"]; s.stock["dua-leo"] = START_STOCK["dua-leo"];
  s.dayDone = true;
  must(s, { type: "nextDay" });
  assert.equal(s.stock["do-chua"], START_STOCK["do-chua"], "đồ chua hạn 5 ngày");
  assert.equal(s.stock["dua-leo"], START_STOCK["dua-leo"], "dưa leo hạn 3 ngày");
  s.money = 0; for (const k of Object.keys(s.stock)) s.stock[k] = 0;
  must(s, { type: "consign" });
  const dl = s.stock["dua-leo"];
  s.dayDone = true; must(s, { type: "nextDay" });
  assert.equal(s.stock["dua-leo"], dl, "hàng ký gửi còn trong hạn");
});
test("lỗi sim: hết trứng / hết chả / hết hộp giữa ca ⇒ hội thoại cứu (trước đây chỉ báo lỗi, phiếu kẹt)", () => {
  const { s } = openWithOrder(51, { notTutorial: true });
  home(s);
  s.owned["egg-pan"] = true; s.shift.pan = { egg: null, egg2: null, cap: 1 }; s.stock.trung = 0;
  must(s, { type: "egg" });
  assert.equal(s.shift.dialog?.kind, "stockout"); assert.equal(s.shift.dialog.id, "trung");
  assert.ok(stockoutOptions(s).some((o) => o.free && o.ok));
  must(s, { type: "stockout", choice: "dismiss" });
  s.owned.steamer = true; s.shift.steamer = { done: 0, cooking: null }; s.stock.cha = 0;
  must(s, { type: "steam" });
  assert.equal(s.shift.dialog?.id, "cha");
  must(s, { type: "stockout", choice: "dismiss" });
});
test("lỗi sim: nhập + ướp đủ khi ít tiền mua than trước món phụ (sáng mai nhóm được bếp); ký gửi có 3 rổ than", () => {
  const s = atLevel(4, { money: 175 });
  s.owned["egg-pan"] = true; s.owned.steamer = true; s.menu = ["com-suon", "com-suon-trung", "com-suon-bi", "com-suon-bi-cha"];
  for (const k of Object.keys(s.stock)) s.stock[k] = 0;
  must(s, { type: "restockToday" });
  assert.ok(s.stock.than >= 2, `than ${s.stock.than}`);
  const t = newGame(4); t.money = 0; for (const k of Object.keys(t.stock)) t.stock[k] = 0;
  must(t, { type: "consign" });
  assert.ok(t.stock.than >= 3);
  must(t, { type: "prepLight" });
});
test("đồ chua + dưa leo không tính sức chứa kho (quyết định kho vỉa hè M5)", () => {
  const s = atLevel(5);
  for (const k of Object.keys(s.stock)) s.stock[k] = 0;
  s.stock["do-chua"] = 60; s.stock["dua-leo"] = 60;
  must(s, { type: "restock", id: "suon" });
  must(s, { type: "restock", id: "gao-tam" });
  assert.ok(s.stock.suon >= 10);
});
test("bưng hai dĩa một chuyến: dĩa thứ hai cùng bàn gộp vào chuyến chưa đi", () => {
  const { s, g, t } = openWithOrder(52, { notTutorial: true });
  home(s);
  // giả lập bàn 2 người: thêm phiếu thứ hai cùng nhóm
  // (apply thay s.shift bằng bản nháp sau mỗi thao tác ⇒ luôn đọc lại s.shift)
  const t2 = { ...t, id: s.shift.nextTk++, mi: 1, status: "open" };
  s.shift.tickets.push(t2);
  for (const tk of [t, t2]) {
    must(s, { type: "pin", tk: tk.id });
    const sl = slotOf(s);
    sl.plate = { tk: tk.id, kind: "dia", com: 1, moHanh: 1, hanhPhi: false, meat: { item: "suon", sides: [105, 105], fresh: 100, result: "done", perfect: 1 }, bi: false, cha: false, trung: null, doChua: true, duaLeo: true, sauce: "chan", ngo: false, order: [], used: {}, hist: [] };
    s.shift.cleanPlates--;
    if (tk === t) s.shift.owner.queue.push({ kind: "wash", phase: "queued" }); // cô chủ đang có việc khác: chuyến bưng chưa đi
    must(s, { type: "serve" });
  }
  const del = [s.shift.owner.task, ...s.shift.owner.queue].filter((q) => q?.kind === "deliver");
  assert.equal(del.length, 1, "một chuyến");
  assert.equal(del[0].more?.length, 1);
  assert.ok(g);
});

// ---------- khoảng trống lối chơi ----------
test("menu: tắt / bật món; khách không gọi món đã tắt; luôn còn một món", () => {
  const s = atLevel(4);
  s.owned["egg-pan"] = true; s.menu = ["com-suon", "com-suon-trung"];
  must(s, { type: "toggleDish", id: "com-suon-trung", on: false });
  assert.deepEqual(s.menu, ["com-suon"]);
  assert.ok(s.menuOff.includes("com-suon-trung"));
  assert.equal(apply(s, { type: "toggleDish", id: "com-suon", on: false }).err, "last-dish");
  assert.equal(apply(s, { type: "toggleDish", id: "dac-biet", on: true }).err, "locked");
  must(s, { type: "toggleDish", id: "com-suon-trung", on: true });
  assert.ok(s.menu.includes("com-suon-trung"));
});
test("vỉ chay riêng (cấp 11): 2 chỗ chỉ nướng đậu hũ; đậu hũ trên chỗ vừa nướng thịt ⇒ dính mặn ⇒ dĩa chay lỗi 13; trên vỉ chay thì sạch", () => {
  const s = atLevel(11);
  s.owned["veg-grill"] = true; s.owned.steamer = true;
  prepDay(s); s.stock["dau-hu"] = 6; s.stock["suon-uop"] = 6;
  must(s, { type: "startShift" });
  const g = s.shift.grill;
  assert.equal(g.slots.length, GRILL.slots + 2);
  assert.equal(g.vegFrom, GRILL.slots);
  assert.ok(isVegSlot(g, 6) && isVegSlot(g, 7) && zoneOf(6, g) === "veg");
  home(s);
  assert.equal(apply(s, { type: "placeMeat", slot: 6, item: "suon" }).err, "veg-only");
  must(s, { type: "placeMeat", slot: 2, item: "suon" });
  assert.equal(hottestFree(g, "dau-hu"), 6, "đậu hũ ưu tiên vỉ chay");
  // chỗ 2 vừa nướng sườn: bỏ sườn ra, đặt đậu hũ ⇒ dính mặn
  s.shift.grill.slots[2] = null;
  must(s, { type: "placeMeat", slot: 2, item: "dau-hu" });
  assert.equal(s.shift.grill.slots[2].tainted, true);
  must(s, { type: "placeMeat", slot: 6, item: "dau-hu" });
  assert.ok(!s.shift.grill.slots[6].tainted);
  const chay = { dish: "com-chay", quirks: [], takeaway: false };
  const plate = (tainted) => ({ kind: "dia", com: 1, moHanh: 0, hanhPhi: true, meat: { item: "dau-hu", sides: [105, 105], fresh: 100, result: "done", ...(tainted ? { tainted: true } : {}) }, bi: true, cha: true, trung: null, doChua: true, duaLeo: true, sauce: "chan", ngo: false });
  assert.ok(judge(plate(true), chay).mistakes.includes("veganMeat"));
  assert.ok(!judge(plate(false), chay).mistakes.includes("veganMeat"));
});
test("tủ kính giữ ấm (cấp 3): vùng ấm đầy ⇒ miếng chín cất vào tủ (tối đa 6), tươi giảm chậm, không cháy; bày dĩa lấy từ tủ; cuối ca thành hao", () => {
  const { s, t } = openWithOrder(53, { notTutorial: true });
  s.owned["glass-case"] = true; s.shift.case = [];
  home(s);
  cookedPiece(s, 4); cookedPiece(s, 5); cookedPiece(s, 2);
  must(s, { type: "moveWarm", slot: 2 });
  assert.equal(s.shift.case.length, 1);
  assert.equal(s.shift.grill.slots[2], null);
  until(s, () => false, 15000);
  const it = s.shift.case[0];
  assert.ok(it.fresh >= 100 - 15000 / 5000 - 0.5 && it.fresh < 100, `tươi ${it.fresh}`);
  s.shift.grill.slots[4] = null; s.shift.grill.slots[5] = null;
  must(s, { type: "pin", tk: t.id });
  for (let i = 0; i < 6 && slotOf(s).plate?.meat == null; i++) must(s, { type: "autoStep" });
  assert.ok(slotOf(s).plate.meat, "gắp từ tủ kính");
  assert.equal(s.shift.case.length, 0);
});
test("nước mắm nhà pha: +1 điểm kỳ vọng mỗi bậc khi dĩa có nước mắm (không áp dĩa chay); có câu review riêng", () => {
  const t = { dish: "com-suon", quirks: [], takeaway: false };
  const p = { kind: "dia", com: 1, moHanh: 1, hanhPhi: false, meat: { item: "suon", sides: [105, 105], fresh: 100, result: "done" }, bi: false, cha: false, trung: null, doChua: true, duaLeo: true, sauce: "chan", ngo: false, order: [] };
  const a = scorePlate(p, t, {}), b = scorePlate(p, t, { houseSauce: 2 });
  assert.equal(b.partial - a.partial, 2);
  assert.equal(scorePlate({ ...p, sauce: null }, t, { houseSauce: 2 }).partial, scorePlate({ ...p, sauce: null }, t, {}).partial);
  assert.ok(LM.FISH_SAUCE_REVIEW.length >= 8);
});
test("bếp 2 than riêng (cấp 14): nhóm bếp đầu ca tốn 4 rổ; thêm than bếp 2 chỉ lên than bếp 2; chỗ 6–11 nướng theo than bếp 2", () => {
  const s = atLevel(14, { stage: "quan" });
  s.owned["grill-2"] = true;
  prepDay(s, { light: false });
  s.stock.than = 10;
  must(s, { type: "prepLight" });
  assert.equal(s.stock.than, 6);
  assert.equal(s.kitchen.coal2, GRILL.prepLight.level);
  must(s, { type: "startShift" });
  const g = s.shift.grill;
  assert.equal(g.slots.length, 12);
  assert.ok(onGrill2(g, 7) && !onGrill2(g, 3));
  g.coal2 = 0; g.coal = 80;
  home(s);
  must(s, { type: "placeMeat", slot: 8, item: "suon" });
  until(s, () => false, 5000);
  assert.equal(g.slots[8] ? s.shift.grill.slots[8].sides[0] : 0, 0, "bếp 2 nguội thì không chín");
  must(s, { type: "addCoal", grill: 2 });
  until(s, () => false, 6000);
  assert.ok(s.shift.grill.coal2 > 20, `than bếp 2 ${s.shift.grill.coal2}`);
  assert.ok(s.shift.grill.slots[8].sides[0] > 0);
});
test("bày ×N cho bàn: nhóm 3 người cùng món (ô bày đôi + khay) ⇒ một lượt bày 3 dĩa, bưng một chuyến, mỗi người đúng dĩa", () => {
  const { s, g, t } = openWithOrder(54, { notTutorial: true });
  s.owned["double-slot"] = true; s.owned["tray-4"] = true;
  // nhóm 3 người: phiếu đầu + thêm người cho đủ 3, cùng món cơm sườn không dặn riêng
  const G = s.shift.groups.find((x) => x.id === g.id);
  for (const tk of s.shift.tickets.filter((x) => x.gid === g.id)) { tk.dish = "com-suon"; tk.quirks = []; }
  while (G.members.length < 3) { const i = G.members.length; const m = { ...G.members[0], idx: i, name: "Khách " + i, tk: null }; const tk = { ...t, dish: "com-suon", quirks: [], id: s.shift.nextTk++, mi: i, name: m.name, status: "open" }; m.tk = tk.id; G.members.push(m); s.shift.tickets.push(tk); }
  G.size = 3;
  home(s);
  must(s, { type: "pin", tk: t.id });
  assert.equal(EX.batchCandidates(s, t.id).length, 2);
  must(s, { type: "batchPin", on: true });
  cookedPiece(s, 2); cookedPiece(s, 3); cookedPiece(s, 4);
  for (let i = 0; i < 14 && slotOf(s).tk !== null; i++) must(s, { type: "autoStep" });
  const del = [s.shift.owner.task, ...s.shift.owner.queue].find((q) => q?.kind === "deliver");
  assert.ok(del && del.more?.length === 2, "một chuyến khay 3 dĩa");
  const served = () => s.shift.tickets.filter((x) => x.gid === g.id && x.status === "served").length;
  until(s, () => served() === 3, 20000);
  assert.equal(served(), 3);
  for (const m of s.shift.groups.find((x) => x.id === g.id).members) assert.ok(m.score && !m.score.mistakes.length, "đúng dĩa");
});
test("nợ Anh Sáu của Drama vào sổ nợ thật: ghi sổ / trả bớt / xoá; không tự trả lúc sang ngày; tab Sổ nợ xoá được", () => {
  const s = atLevel(6);
  EX.dramaDebt(s, { who: "anh-sau", k: 25 });
  EX.dramaDebt(s, { who: "anh-sau", k: 50 });
  assert.equal(debtTotal(s), 75);
  assert.equal(s.flags["ghiso-unpaid-anh-sau"], 75);
  assert.ok(s.debts.every((d) => d.drama && d.name === "Anh Sáu"));
  EX.dramaDebt(s, { who: "anh-sau", k: -40 });
  assert.equal(debtTotal(s), 35);
  for (let i = 0; i < 6; i++) { s.dayDone = true; must(s, { type: "nextDay" }); }
  assert.equal(debtTotal(s), 35, "không tự trả ngẫu nhiên");
  EX.dramaDebt(s, { who: "anh-sau", k: -999, clear: true });
  assert.equal(debtTotal(s), 0);
  EX.dramaDebt(s, { who: "anh-sau", k: 25 });
  must(s, { type: "forgiveDebt", id: "anh-sau" });
  assert.equal(debtTotal(s), 0);
});
test("đồ trang trí Drama tặng thành đồ kéo thả (đặt được trong quán), mái bạt Drama = có mái bạt", () => {
  const s = atLevel(9, { stage: "quan" });
  assert.ok(EX.grantDramaDecor(s, "hoa-giay") && EX.grantDramaDecor(s, "la-thu"));
  assert.ok(s.decor["hoa-giay"] && DECOR["hoa-giay"].event);
  assert.equal(EX.decorFrame("hoa-giay"), "bougainvillea-pot");
  must(s, { type: "placeDecor", id: "la-thu", x: 640, y: 200 });
  assert.deepEqual(s.placement["la-thu"], [640, 200]);
  assert.equal(apply(s, { type: "buyDecor", id: "hoa-giay" }).err, "bad-item", "đồ Drama không bán");
  const t = atLevel(5); EX.grantDramaDecor(t, "mai-bat"); assert.ok(t.owned.awning);
});
test("hội chợ (cấp 18): thuê gian ⇒ ca tối 4 phút, thêm khách đi nhóm 2–4, giá +15%; mỗi 4 ngày; câu review hội chợ đủ 8–12 mỗi kết quả", () => {
  const s = atLevel(18, { stage: "quan" });
  assert.ok(EX.fairAvailable(s));
  const plain = createState(1); plain.level = 17;
  assert.equal(apply(s, { type: "challenge", on: true }).err, "locked");
  must(s, { type: "fair" });
  assert.equal(s.money, 3000 - FAIR.price);
  assert.equal(apply(s, { type: "fair" }).err, "already");
  prepDay(s);
  must(s, { type: "startShift" });
  assert.ok(s.shift.fair);
  assert.equal(s.shift.len, FAIR.ms);
  const fair = s.shift.schedule.filter((g) => g.tag === "fair");
  assert.ok(fair.reduce((a, g) => a + g.roles.length, 0) >= FAIR.guests);
  assert.ok(fair.every((g) => g.roles.length >= 2 && g.roles.length <= 4));
  assert.equal(ticketPrice({ dish: "com-suon", fairMul: FAIR.priceMul }), Math.round(DISHES["com-suon"].price * FAIR.priceMul));
  for (const k of ["great", "ok", "bad"]) { assert.ok(LM.FAIR_REVIEW[k].length >= 8 && LM.FAIR_REVIEW[k].length <= 12, k); assert.ok(LM.FAIR_DONE[k].length >= 8); }
  s.shift = null; s.day += 1; s.dayDone = false; s.shiftIdx = 0;
  assert.ok(!EX.fairAvailable(s), "mỗi 4 ngày");
  s.day += 3;
  assert.ok(EX.fairAvailable(s));
  assert.ok(plain);
});
test("ca thử thách (cấp 20): lịch 5 ngày xoay vòng, nhận trước ca, đạt ⇒ tiền + XP + huy hiệu lần đầu; mỗi thử thách 8–12 câu đạt / không đạt", () => {
  const s = atLevel(20, { stage: "quan" });
  assert.equal(EX.challengeWeek(s).length, 5);
  s.day = 5; // 5 % 5 = 0 ⇒ "mot-bep"
  must(s, { type: "challenge", on: true });
  assert.equal(s.challenge.id, EX.CHALLENGES[0].id);
  s.owned["grill-2"] = true;
  prepDay(s);
  must(s, { type: "startShift" });
  assert.equal(s.shift.challengeId, "mot-bep");
  assert.equal(s.shift.grill.slots.length, GRILL.slots, "chỉ một bếp");
  assert.ok(s.shift.late);
  for (const c of EX.CHALLENGES) for (const k of ["win", "lose"]) { const n = LM.CHALLENGE_TEXT[c.id][k].length; assert.ok(n >= 8 && n <= 12, `${c.id} ${k} ${n}`); }
  // chốt: giả bảng chốt ca đạt mục tiêu
  const m0 = s.money, xp0 = s.xp;
  const sum = { day: s.day, plates: 20, lost: 1, burnt: 0, avg: 4.5, timeouts: 0, mistakes: {}, takeaway: 0, orders: [], final: true, profit: 0 };
  EX.afterEnd(s, s.shift, sum, []);
  assert.ok(sum.challenge.ok && sum.challenge.first);
  assert.equal(s.money, m0 + CHALLENGE.firstReward.money);
  assert.ok(s.xp >= xp0 + CHALLENGE.firstReward.xp);
  assert.ok(s.badges["tt-mot-bep"]);
  assert.ok(sum.badges.some((b) => b.id === "tt-mot-bep"));
});
test("huy hiệu: 14 huy hiệu, xét lúc chốt ca và khi mua hạng; nhận một lần", () => {
  assert.equal(EX.BADGES.length, 14);
  const s = atLevel(20, { stage: "quan", money: 3500 });
  const got = EX.checkBadges(s, { plates: 15, lost: 0, timeouts: 0, avg: 4.9, perfectFlips: 13, burnt: 0, fair: false }, []);
  const ids = got.map((b) => b.id);
  for (const id of ["chu-quan", "khong-bo-ve", "nam-sao", "tay-nuong", "ket-sat"]) assert.ok(ids.includes(id), id);
  assert.equal(EX.checkBadges(s, { plates: 15, lost: 0, timeouts: 0, avg: 4.9, perfectFlips: 13, burnt: 0 }, []).length, 0, "một lần");
});
test("bản lưu v2 → v3: giữ cấp + % tiến độ theo bảng XP mới, nợ Drama vào sổ nợ thật, đồ Drama thành đồ kéo thả, bản v2 chép nguyên văn .bak-v2 một lần", () => {
  assert.equal(SAVE_VERSION, 3);
  const s = atLevel(9, { stage: "quan" });
  const old = JSON.parse(dump(s));
  old.v = 2;
  old.xp = Math.round(LEVELS_V2[8] + 0.4 * (LEVELS_V2[9] - LEVELS_V2[8])); // cấp 9, 40% tiến độ theo bảng cũ
  old.drama.debt = { "anh-sau": 75 }; old.drama.decor = { "hoa-giay": true, "mai-bat": true };
  delete old.badges; delete old.fair; delete old.challenge;
  const raw = JSON.stringify(old);
  const st = mem(); st.setItem(KEY, raw);
  const r = shopSave(st).read(1);
  assert.ok(!r.corrupt && r.migrated === 2);
  assert.equal(st.getItem(backupKey(2)), raw);
  const n = r.state;
  assert.equal(n.level, 9);
  const nx = xpToNext(n);
  assert.ok(Math.abs(nx.have / nx.need - 0.4) < 0.02, `tiến độ ${nx.have}/${nx.need}`);
  assert.equal(debtTotal(n), 75);
  assert.deepEqual(n.drama.debt, {});
  assert.ok(n.decor["hoa-giay"] && n.owned.awning);
  assert.deepEqual(n.badges, {});
  // quá cấp 20 giữ phần dư; không có XP ⇒ 0
  assert.equal(rescaleXp(0, LEVELS_V2, LEVELS), 0);
  assert.equal(levelForXp(rescaleXp(LEVELS_V2[19] + 500, LEVELS_V2, LEVELS)), 20);
  // ghi lại rồi đọc: v3, không tạo thêm bản sao
  shopSave(st).write(n);
  assert.equal(JSON.parse(st.getItem(KEY)).v, 3);
  assert.ok(loadSave(st.getItem(KEY)));
});
