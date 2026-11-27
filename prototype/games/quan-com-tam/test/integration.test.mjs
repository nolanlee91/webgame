// Gộp A + B + C (M3 + M4): mô phỏng 10 ngày qua cấp 7 có Drama + review, cờ dùng chung qua tải lại, một sổ người theo dõi / độ hot,
// thứ tự móc mở ca không bỏ nhóm có nhãn, đơn đặt của Drama thành mâm cơm thật của A, sự kiện trả nợ dùng sổ nợ thật, nâng bản lưu v1 → v2.
import test from "node:test";
import assert from "node:assert/strict";
import { apply, must, newGame, prepDay, playShift, seeded, botStep } from "./helpers.mjs";
import { shopSave, KEY, backupKey } from "../save.js?v=c10";
import { loadSave, dump, SAVE_VERSION, createState, LEVELS_V2 } from "../core/state.js?v=c10";
import { LEVELS } from "../data/economy.js?v=c10";
import { EVENT } from "../data/events.js?v=c10";
import * as PG from "../core/progression.js?v=c10";
import { pushReview, replyOptions } from "../core/reviews.js?v=c10";
import { pickFree, currentEvent } from "../core/drama.js?v=c10";
import { engineFlag, hasFlag } from "../core/flags.js?v=c10";

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m }; };
const atLevel = (lv, { seed = 5, stage = "street", money = 3000 } = {}) => {
  const s = newGame(seed);
  must(s, { type: "persona", persona: "hien" });
  s.tutorialDone = true; s.day = Math.max(2, s.day); s.xp = LEVELS[lv - 1]; s.level = lv; s.money = money; s.stage = stage;
  if (stage === "quan") s.plates = Math.max(s.plates, 16);
  return s;
};
/** Trả lời Drama đang chờ trên Chuẩn bị (sự kiện giữa hai ngày) bằng một lựa chọn bấm được. */
function settleDay(s, rnd) { for (let i = 0; i < 6 && currentEvent(s) && !s.shift; i++) must(s, { type: "event", choice: pickFree(s, rnd) }); }

test("10 ngày có hạt: bot qua cấp 7 (lên quán, đơn đặt), Drama + review + trả lời, không kẹt, bất biến giữ, Nhật Ký đủ ngày", () => {
  const s = atLevel(6, { seed: 2026, money: 900 });
  s.xp = LEVELS[6] - 60; // còn chút XP nữa là cấp 7
  const rnd = seeded(77);
  const day0 = s.day;
  let crossed = null, rented = null, ordered = 0, replied = 0, dramas = 0;
  for (let d = 0; d < 10; d++) {
    settleDay(s, rnd);
    if (s.level >= 7 && crossed === null) crossed = s.day;
    if (s.level >= 7 && s.stage === "street" && s.money >= 600) { must(s, { type: "rentQuan" }); rented = s.day; }
    if (PG.ordersOpen(s)) { const offers = PG.orderOffers(s); const i = offers.findIndex((o) => o.kind === "pre" && !o.taken); if (i >= 0 && !apply(s, { type: "acceptOrder", idx: i }).err) ordered++; }
    // trả lời một review chưa trả lời (C): lựa chọn an toàn đầu tiên bấm được
    const r = s.feed.find((x) => !x.reply && x.src === "quan");
    if (r) { const o = replyOptions(s, r, s.persona.id).find((x) => !x.cost || x.cost <= s.money); if (o && !apply(s, { type: "reply", id: r.id, kind: o.id }).err) replied++; }
    prepDay(s);
    do {
      const ev = playShift(s, { rnd });
      dramas += ev.filter((e) => e.type === "dramaResolved").length;
      if (!s.dayDone) settleDay(s, rnd);
    } while (!s.dayDone);
    assert.ok(s.journal[0] && s.journal[0].day === s.day && s.journal[0].headline && !/\{/.test(s.journal[0].headline), "Nhật Ký ngày " + s.day);
    must(s, { type: "nextDay" });
  }
  assert.equal(s.day, day0 + 10);
  assert.ok(crossed !== null && s.level >= 7, `qua cấp 7 (cấp ${s.level})`);
  assert.ok(rented !== null && s.stage === "quan", "thuê mặt bằng lên quán");
  assert.ok(ordered >= 1, "nhận đơn đặt trước ở quán");
  assert.ok(replied >= 5, "trả lời review mỗi ngày");
  assert.ok(dramas + s.drama.history.length > 0, "có sự kiện Drama");
  assert.ok(s.journal.length >= 10);
  assert.ok(Number.isSafeInteger(s.money) && s.money >= 0);
  // tải lại sau 10 ngày: y nguyên
  const back = loadSave(dump(s));
  assert.deepEqual(JSON.parse(dump(back)), JSON.parse(dump(s)));
});

test("cờ dùng chung qua tải lại: cờ A (quan-moved, ghiso), cờ C (review 1 sao), cờ B (s.drama.flags) giữ nguyên; một bộ đọc duy nhất", () => {
  const s = atLevel(7, { money: 900 });
  must(s, { type: "rentQuan" });
  pushReview(s, { name: "Tèo", role: "student", stars: 1, line: "Sống.", mistake: "raw" });
  PG.setFlag(s, "ghiso-unpaid-co-ut", 45);
  engineFlag(s, "k01-ok", 3);
  const st = mem(); const sv = shopSave(st);
  sv.write(s);
  const r = sv.read(1).state;
  assert.equal(r.flags["quan-moved"], s.day);
  assert.equal(r.flags["review-1star-raw"], s.day);
  assert.equal(r.flags["ghiso-unpaid-co-ut"], 45);
  assert.deepEqual(r.flags, s.flags);
  assert.deepEqual(r.drama.flags, s.drama.flags);
  assert.ok(hasFlag(r, "k01-ok") && hasFlag(r, "ghiso-unpaid-*"));
  // loadA không còn đọc cờ (chỉ khối B của state.js): cờ rác bị lọc một chỗ
  const d = JSON.parse(dump(s)); d.flags.rac = "chuoi"; d.flags["x".repeat(80)] = 1;
  const r2 = loadSave(JSON.stringify(d));
  assert.equal(r2.flags.rac, undefined); assert.equal(Object.keys(r2.flags).some((k) => k.length > 60), false);
});

test("một sổ người theo dõi / độ hot: review (C), quảng bá (A), sự kiện (B) cùng ghi s.followers / s.hype; Sổ đọc cùng khoá; không còn buzz", () => {
  const s = atLevel(11, { money: 3000 });
  assert.equal("buzz" in s, false);
  const f0 = s.followers;
  pushReview(s, { name: "Bé Su Review", role: "reviewer", stars: 5, line: "Ngon.", mistake: null });
  assert.equal(s.followers, f0 + 3);
  must(s, { type: "promo", kind: "check-in" });
  assert.equal(s.followers, f0 + 3 + 20);
  assert.equal(s.hype, 0.5);
  assert.equal("buzz" in s, false);
  // B: D06 "Nhận, mời đánh giá quán" +30 người theo dõi (trong ca)
  prepDay(s);
  must(s, { type: "startShift" });
  must(s, { type: "eventOpen", id: "D06" });
  const f1 = s.followers;
  must(s, { type: "event", choice: "review" });
  assert.equal(s.followers, f1 + 30);
  // review của A (mâm cơm, trả nợ) đi qua cùng sổ review của C: có lý do, người theo dõi
  const f2 = s.followers;
  PG.addReviewA(s, { name: "Công ty may", role: "office", stars: 5, line: "Đúng giờ.", mistake: null, mech: "catering-ontime" });
  assert.equal(s.feed[0].reason, "takeaway"); assert.equal(s.followers, f2 + 3);
  const r = loadSave(dump(s));
  assert.equal(r.followers, s.followers); assert.equal(r.hype, s.hype);
});

test("mở ca: lịch gốc → A (mưa) → C (khách quay lại) → B (bớt khách, đơn đặt) không bỏ nhóm có nhãn của nhau", () => {
  const s = atLevel(6, { seed: 9 });
  s.weather = { day: s.day, kind: "rain" };
  s.returning = [{ name: "Chị Thảo", arch: "office", persona: "hien", day: s.day }];
  s.drama.nextGuests = -4;
  s.drama.pre = [{ id: "K10", day: s.day, kind: "toi", n: 4, arch: "worker", label: "Sinh nhật anh Hùng", tip: 0, okStars: 3, at: 0.3 }];
  prepDay(s);
  must(s, { type: "startShift" });
  const sched = s.shift.schedule;
  assert.ok(sched.some((g) => g.tag === "back" && !g.done && g.name === "Chị Thảo"), "khách quay lại còn");
  assert.ok(sched.some((g) => g.tag === "dr:K10" && !g.done), "đơn đặt của Drama còn");
  assert.ok(sched.filter((g) => !g.tag && g.done).length >= 1, "Drama bớt khách thường");
  // khách có hẹn không đi ngang khi cửa đầy
  assert.equal(apply(s, { type: "tick", dt: 200 }).ok, true);
});

test("đơn đặt của Drama ở quán (cấp 10) ⇒ phiếu mâm cơm thật của A (bày ×N, giờ hẹn, cờ catering-active); giao đủ ⇒ cờ / tip của Drama", () => {
  const s = atLevel(10, { stage: "quan" });
  s.owned["double-slot"] = true;
  s.drama.pre = [{ id: "X03", day: s.day, kind: "trua", n: 12, arch: "office", label: "Mâm cơm xưởng Bình Minh", tip: 10, flagOk: "x03-ok", okStars: 3, at: 0.2 }];
  s.plan = ["toi"]; // không mở ca trưa ⇒ đơn trưa dồn vào ca cuối ngày
  prepDay(s);
  must(s, { type: "startShift" });
  const o = s.orders.find((x) => x.drama?.id === "X03");
  assert.ok(o && o.status === "open" && o.n === 12, "đơn A từ Drama");
  assert.ok(s.shift.tickets.some((t) => t.catering === o.id), "phiếu mâm cơm");
  assert.ok(!s.shift.schedule.some((g) => g.tag === "dr:X03"), "không còn nhóm khách giả song song");
  assert.equal(s.flags["catering-active"], s.day);
  assert.deepEqual(s.drama.pre, []);
  // chơi hết ca bằng bot (bot bày mâm qua autoStep) ⇒ đơn chốt, không kẹt
  const rnd = seeded(4);
  for (let t = 0; s.shift && t < 900000; t += 200) { botStep(s, "good", rnd); if (s.shift && !s.shift.dialog) must(s, { type: "tick", dt: 200 }); }
  assert.ok(!s.shift);
  const done = s.orders.find((x) => x.id === o.id);
  assert.ok(["done", "late"].includes(done.status));
  if (done.status === "done") assert.ok(s.drama.flags["x03-ok"] >= s.day);
});

test("sự kiện S03 (khách nợ quên trả kèm thư) trả đúng sổ nợ thật của A qua payDebt; sổ trống thì +30k như cũ", () => {
  const s = atLevel(14, { money: 100 });
  s.day = 20;
  s.debts = [{ id: "co-ut", name: "Cô Út", amount: 60, day: 3 }, { id: "chu-tu", name: "Chú Tư", amount: 20, day: 9 }];
  PG.setFlag(s, "ghiso-unpaid-co-ut", 60);
  must(s, { type: "eventOpen", id: "S03" });
  const m0 = s.money;
  must(s, { type: "event", choice: "keep" });
  assert.equal(s.money, m0 + 60, "trả đúng 60k của Cô Út, không cộng thêm 30k");
  assert.deepEqual(s.debts.map((d) => d.id), ["chu-tu"]);
  assert.equal(s.flags["ghiso-unpaid-co-ut"], 0);
  const s2 = atLevel(14, { money: 100 }); s2.day = 20; PG.setFlag(s2, "ghiso-unpaid-x", 5);
  must(s2, { type: "eventOpen", id: "S03" });
  must(s2, { type: "event", choice: "keep" });
  assert.equal(s2.money, 130);
  assert.ok(EVENT.S03);
});

test("nâng bản lưu v1 → v2 (→ v3): chép nguyên văn .bak-v1 một lần, buzz gộp vào hype, cờ rác bỏ, tiến trình giữ", () => {
  assert.equal(SAVE_VERSION, 3); // M5 (S): v3 = bảng XP mới, nợ Drama vào sổ nợ thật
  const s = atLevel(8, { money: 777 });
  const old = JSON.parse(dump(s));
  old.v = 1; old.buzz = 3.5; old.hype = 1; old.flags = { "quan-moved": 4, "rac": "x", "ghiso-open": 2 };
  old.xp = LEVELS_V2[7] + 10; // bản v1 tính XP theo bảng cũ (M5 đổi bảng, nâng v2 → v3 giữ cấp)
  delete old.drama; delete old.mods;
  const raw = JSON.stringify(old);
  const st = mem(); st.setItem(KEY, raw);
  const sv = shopSave(st);
  const r = sv.read(1);
  assert.ok(!r.fresh && !r.corrupt && r.migrated === 1);
  assert.equal(st.getItem(backupKey(1)), raw, "bản sao nguyên văn");
  assert.equal(r.state.v, 3); assert.equal(r.state.hype, 3.5); assert.equal("buzz" in r.state, false);
  assert.deepEqual(r.state.flags, { "quan-moved": 4, "ghiso-open": 2 });
  assert.equal(r.state.money, 777); assert.equal(r.state.level, 8);
  assert.ok(r.state.drama && Array.isArray(r.state.drama.history));
  sv.write(r.state);
  assert.equal(JSON.parse(st.getItem(KEY)).v, 3);
  // bản v1 khác ghi đè lại ⇒ .bak-v1 không bị thay (một lần)
  st.setItem(KEY, JSON.stringify({ ...old, money: 1 }));
  sv.read(1);
  assert.equal(st.getItem(backupKey(1)), raw);
  // bản mới tạo đã là v3
  assert.equal(createState(1).v, 3);
});

test("chảo đôi (cấp 8): chiên trứng thứ hai khi trứng đầu còn trên chảo, gắp lần lượt; chảo đơn vẫn báo bận", async () => {
  const { freshRice, startEgg, takeEgg, eggState } = await import("../core/rice.js?v=c10");
  const s = atLevel(8);
  s.stock.trung = 5;
  const one = { egg: null, egg2: null, cap: 1 };
  assert.ok(startEgg(s, one, 0).ok); assert.equal(startEgg(s, one, 1000).err, "pan-busy");
  const two = { egg: null, egg2: null, cap: 2 };
  assert.ok(startEgg(s, two, 0).ok); assert.ok(startEgg(s, two, 3000).ok); assert.equal(startEgg(s, two, 3500).err, "pan-busy");
  assert.equal(s.stock.trung, 2);
  assert.equal(takeEgg(two, 7500).state, "runny");
  assert.equal(eggState(two, 9000), "runny", "trứng thứ hai lên trước chảo");
  assert.equal(takeEgg(two, 9500).state, "runny");
  assert.equal(eggState(two, 9500), null);
  // trong ca: mua chảo đôi ⇒ chảo 2 chỗ
  s.owned["egg-pan"] = true; s.owned["egg-pan-2"] = true;
  prepDay(s); must(s, { type: "startShift" });
  assert.equal(s.shift.pan.cap, 2);
  assert.ok(freshRice);
});

test("Nhập + ướp đủ ở vỉa hè cấp 6 (kho 80): chia chỗ theo menu, có đủ bì / chả / trứng thay vì để sườn + gạo + một món chiếm hết", async () => {
  const { addNewDishes } = await import("../core/progress.js?v=c10");
  const { stockUsed, capacity } = await import("../core/stock.js?v=c10");
  const s = atLevel(6, { money: 2000 });
  for (const id of ["egg-pan", "steamer", "ban-3"]) s.owned[id] = true;
  addNewDishes(s);
  for (const k of Object.keys(s.stock)) s.stock[k] = Math.min(s.stock[k], 4);
  must(s, { type: "restockToday" });
  for (const k of ["bi", "cha", "trung"]) assert.ok(s.stock[k] >= 8, k + " " + s.stock[k]);
  assert.ok(s.stock["suon-uop"] >= 12 && s.stock["gao-tam"] >= 20);
  assert.ok(stockUsed(s) <= capacity(s));
});
