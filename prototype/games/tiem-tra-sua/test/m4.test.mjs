// Milestone 4: sổ review (điểm đánh giá ảnh hưởng lượng khách, trả lời một lần, lời hứa), Nhật Ký Làm Chủ (câu meme + nội dung thẻ),
// nâng bản lưu v1 → v2 (giữ bản sao), ly phản ánh 0% đường / không đá, lớp Codex mới tự dùng khi có trong manifest.
import test from "node:test";
import assert from "node:assert/strict";
import { createState, loadSave, dump, SAVE_VERSION, MIGRATIONS } from "../core/state.js";
import { shopSave, KEY, backupKey } from "../save.js";
import { trafficBonus, ratingOf, canReply } from "../core/reviews.js";
import { caption, captionKind, journalCard, journalMoments } from "../core/journal.js";
import { cupLayers, cupNotes, BASE_FRAMES } from "../core/cupview.js";
import { CAPTIONS } from "../data/lines.js";
import { shop, act, err, advance, untilWaiting, serveRight, clearDrama } from "./helpers.mjs";

class Mem { constructor() { this.m = new Map(); } getItem(k) { return this.m.has(k) ? this.m.get(k) : null; } setItem(k, v) { this.m.set(k, String(v)); } }
const rv = (stars, reason = "good", id = 1) => ({ id, day: 1, name: "Khách", arch: "hoc-sinh", recipe: "tra-dao", stars, line: "x", reason, reply: null, src: "quan" });

function playDay(s) {
  clearDrama(s);
  act(s, { type: "startShift" });
  s.shift.drama.max = 0;
  for (let i = 0; i < 6 && s.shift; i++) { try { serveRight(s, untilWaiting(s, 60000)); } catch { break; } }
  advance(s, 400000);
}

test("sổ review: chốt ca chép review vào sổ, điểm đánh giá trung bình 20 review gần nhất, người theo dõi theo sao", () => {
  const s = shop(3);
  playDay(s);
  assert.equal(s.feed.length, s.lastSummary.reviews.length);
  assert.equal(s.rating, ratingOf(s.feed));
  assert.ok(s.followers >= s.feed.filter((r) => r.stars === 5).length * 3);
  assert.ok(s.feed.every((r) => r.id > 0 && r.reply === null && r.day === 1));
  const back = loadSave(dump(s));
  assert.deepEqual(back.feed, s.feed);
  assert.equal(back.rating, s.rating);
});

test("điểm đánh giá + người theo dõi + độ hot đổi lượng khách ca sau", () => {
  const s = createState(1);
  assert.equal(trafficBonus(s), 0);
  s.feed = [rv(5), rv(5), rv(5), rv(4)];
  assert.equal(trafficBonus(s), 2);
  s.feed = [rv(1), rv(2), rv(2), rv(1)];
  assert.equal(trafficBonus(s), -1);
  s.feed = []; s.followers = 1200; s.buzz = 2.5;
  assert.equal(trafficBonus(s), 4);
  const a = shop(9), b = shop(9);
  for (const x of [a, b]) { x.tutorialDone = true; x.day = 3; }
  b.feed = [rv(5), rv(5), rv(5), rv(5)]; b.followers = 300;
  act(a, { type: "startShift" }); act(b, { type: "startShift" });
  assert.ok(b.shift.planned > a.shift.planned, `${b.shift.planned} > ${a.shift.planned}`);
});

test("trả lời review: đúng lựa chọn của tính cách, mỗi review một lần; xin lỗi review có lỗi thật tạo lời hứa, giữ lời ca sau ⇒ +2 danh tiếng", () => {
  const s = shop(4);
  s.tutorialDone = true; s.day = 2;
  act(s, { type: "setPersona", persona: "hien" });
  s.feed = [rv(2, "sugarHigh", 7), rv(5, "good", 8), rv(3, "ok", 9)];
  assert.equal(canReply(s.feed[2], "hien-sorry"), true, "xin lỗi được nhưng không tạo lời hứa");
  assert.equal(err(s, { type: "reply", id: 8, kind: "hien-sorry" }), "not-eligible");
  assert.equal(err(s, { type: "reply", id: 8, kind: "lay-meme" }), "not-eligible", "lựa chọn của tính cách khác");
  assert.equal(err(s, { type: "reply", id: 8, kind: "meme" }), "bad-reply");
  const f = s.followers;
  act(s, { type: "reply", id: 8, kind: "hien-thanks" });
  assert.equal(err(s, { type: "reply", id: 8, kind: "hien-meme" }), "replied");
  act(s, { type: "reply", id: 7, kind: "hien-sorry" });
  act(s, { type: "reply", id: 9, kind: "hien-sorry" });
  assert.equal(s.promises.length, 1);
  assert.ok(s.followers > f);
  const rep = s.rep;
  playDay(s);
  assert.equal(s.promises.length, 0);
  const kept = s.lastSummary.moments.find((m) => m.kind === "promise" || m.kind === "promise-miss");
  assert.ok(kept, "Nhật Ký ghi kết quả lời hứa");
  if (kept.kind === "promise") assert.ok(s.rep >= rep + 2 - 8);
});

test("Nhật Ký: câu chốt ca theo dữ kiện (lỗ, bỏ về, drama, 0% đường, lên mạng, đơn nhóm, hoàn hảo)", () => {
  const base = { cups: 8, lost: 0, profit: 90, avgStars: 4.2, multi: 0, followersDelta: 0, moments: [], drama: [] };
  assert.equal(captionKind({ ...base, profit: -5 }), "loss");
  assert.equal(captionKind({ ...base, lost: 2 }), "lost");
  assert.equal(captionKind({ ...base, drama: [{}, {}] }), "drama");
  assert.equal(captionKind({ ...base, moments: [{ kind: "drama", line: "0% đường nghĩa là trung thực" }] }), "sugar0");
  assert.equal(captionKind({ ...base, followersDelta: 30 }), "viral");
  assert.equal(captionKind({ ...base, moments: [{ kind: "mistake" }, { kind: "mistake" }] }), "oops");
  assert.equal(captionKind({ ...base, multi: 2 }), "multi");
  assert.equal(captionKind({ ...base, avgStars: 4.8 }), "perfect");
  assert.equal(captionKind({ ...base, cups: 2 }), "few");
  assert.equal(captionKind(base), "good");
  const s = createState(2);
  for (const kind of Object.keys(CAPTIONS)) for (const tpl of CAPTIONS[kind]) assert.ok(tpl.length < 120, "câu ngắn để chia sẻ: " + tpl);
  const c = caption(s, { ...base, followersDelta: 30 });
  assert.ok(!/\{\w+\}/.test(c) && /30/.test(c), c);
});

test("Nhật Ký: thẻ có tên tiệm (ẩn được), câu trích đổi được giữa các khoảnh khắc, 3 số và lumkeo.com", () => {
  const sum = { day: 4, cups: 7, profit: 82, avgStars: 4.6, headline: "Bán 7 ly.", shopName: "Trà Sữa Hẻm Nhà Mình Có Tên Rất Dài Ơi Là Dài",
    best: { name: "Tí", stars: 5, line: "Ngon tới mức quên deadline." },
    moments: [{ kind: "drama", name: "Mẹ", line: "Con bán đắt lắm mẹ, có người còn khen cái nắp." }, { kind: "five", name: "Bin", line: "Năm sao cho cái nắp." }], reviews: [] };
  const a = journalCard(sum, {});
  assert.equal(a.brand, "Lụm Kèo");
  assert.equal(a.footer, "lumkeo.com");
  assert.equal(a.shop, sum.shopName);
  assert.equal(a.quote, sum.moments[0].line);
  assert.deepEqual(a.stats.map((x) => x.value), ["7", "82k", "4,6"]);
  assert.equal(journalCard(sum, { hideName: true }).shop, "");
  assert.equal(journalCard(sum, { moment: 1 }).quote, sum.moments[1].line);
  assert.equal(journalCard(sum, { moment: 2 }).quote, sum.best.line);
  assert.equal(journalCard(sum, { moment: 3 }).quote, sum.moments[0].line, "vòng lại");
  assert.equal(journalMoments({ moments: [], reviews: [] }).length, 1, "ca trống vẫn có câu");
  assert.equal(journalCard({ ...sum, profit: -12 }).stats[1].value, "−12k");
});

test("chốt ca thật ghi headline meme + khoảnh khắc vào journal", () => {
  const s = shop(6);
  playDay(s);
  const j = s.journal[0];
  assert.ok(j.headline.length > 15 && !/\{\w+\}/.test(j.headline));
  assert.equal(j.headline, s.lastSummary.headline);
  assert.ok(Array.isArray(s.lastSummary.missions) && Array.isArray(s.lastSummary.drama));
});

// ---------- bản lưu v1 → v2 ----------
function v1Save() {
  // bản lưu v1 thật (cấu trúc trước Milestone 3–4): một ly sh.cup, một phiếu sh.active, khách một ly
  return {
    v: 1, seed: 5, rng: 12345, shopName: "Tiệm Cũ", introSeen: true, tutorialDone: true, money: 231, xp: 90, level: 3, rep: 41, day: 4, capacity: 60,
    stock: { ly: 7, "hong-tra": 5, sua: 4, duong: 6, da: 9, "tran-chau-song": 3, dao: 2 },
    stats: { cups: 20, revenue: 540, shifts: 3, bestProfit: 120, spentStock: 60, reviews: { 4: 9, 5: 6 } }, owned: { "flowering-pot": true }, carryPearls: 0,
    shift: {
      day: 4, t: 31000, duration: 180000, patienceMult: 1.03, hints: false, tutorial: false, status: "open",
      schedule: [{ at: 60000, arch: "van-phong", name: "Anh Hải", recipe: "tra-dao", sugar: 30, ice: "vua" }], planned: 7,
      customers: [{ id: 3, arch: "hoc-sinh", sprite: "regular", name: "Tí", recipe: "tra-sua-truyen-thong", order: { base: "hong-tra", add: "sua", sugar: 50, ice: "it", topping: "tran-chau" },
        price: 27, patience: 66950, bonus: 0, spot: 0, t0: 20000, arriveT: 22400, phase: "wait", mood: "waiting", pinned: true, impatientSaid: false, remade: false,
        say: null, leaveT: null, reactUntil: null, review: null, orderLine: "Chị ơi cho em ly trà sữa." }],
      nextCid: 4, active: 3, cup: { steps: [{ step: "cup", id: "ly" }, { step: "base", id: "hong-tra" }], sealed: false, forCid: 3 }, dialog: null,
      ledger: { revenue: 54, cogs: 22, waste: 0, fee: 12, restock: 0, cups: 2, served: 2, lost: 0, refunds: 0, remakes: 0, pearlWaste: 0 },
      reviews: [], repDelta: 2, xp: 16, levelUps: [], moments: [], usedLines: [], kitchen: { ready: 2, batches: [] },
    },
    lastSummary: null, journal: [{ day: 3, cups: 6, profit: 90, avgStars: 4.5, headline: "Bán 6 ly." }],
  };
}

test("nâng bản lưu v1 → v2 → v3: giữ tiền / cấp / kho / nhật ký, ca dở dang chuyển sang chỗ pha 0, khách một ly thành đơn 1 ly", () => {
  assert.equal(SAVE_VERSION, 3);
  assert.ok(MIGRATIONS[1] && MIGRATIONS[2]);
  const s = loadSave(JSON.stringify(v1Save()));
  assert.ok(s, "đọc được");
  assert.equal(s.v, SAVE_VERSION);
  assert.equal(s.money, 231); assert.equal(s.level, 3); assert.equal(s.day, 4); assert.equal(s.shopName, "Tiệm Cũ");
  assert.equal(s.stock.ly, 7); assert.equal(s.owned["flowering-pot"], true); assert.equal(s.journal.length, 1);
  assert.deepEqual(s.shift.stations, [{ cup: { steps: [{ step: "cup", id: "ly" }, { step: "base", id: "hong-tra" }], sealed: false, forCid: 3 }, cid: 3, item: 0 }]);
  const c = s.shift.customers[0];
  assert.equal(c.items.length, 1);
  assert.deepEqual(c.items[0].order, c.order);
  assert.deepEqual(c.filled, [null]);
  assert.deepEqual(s.shift.schedule[0].items, [{ recipe: "tra-dao", sugar: 30, ice: "vua" }]);
  assert.deepEqual(s.feed, []); assert.equal(s.followers, 0); assert.deepEqual(s.drama.flags, {});
  // chơi tiếp trên bản đã nâng: pha nốt rồi giao đúng một lần
  for (const [step, id] of [["add", "sua"], ["sugar", 50], ["ice", "it"], ["topping", "tran-chau"], ["lid", "dong-nap"]]) act(s, { type: "brew", step, id });
  const r = act(s, { type: "serve", cid: 3 });
  assert.ok(r.events.some((e) => e.type === "served"));
});

test("nâng bản lưu v1 đang khiếu nại vẫn ở hội thoại", () => {
  const d = v1Save();
  d.shift.cup = null; d.shift.active = null;
  d.shift.dialog = { kind: "complaint", cid: 3, cost: 6, stars: 1, raw: 30, errors: ["addWrong"] };
  const s = loadSave(JSON.stringify(d));
  assert.equal(s.shift.dialog.kind, "complaint");
  assert.deepEqual(s.shift.dialog.wrong, [0]);
  act(s, { type: "resolve", choice: "refund" });
});

test("adapter: bản v1 được chép nguyên văn sang khoá sao lưu trước khi nâng, ghi lại thành bản mới nhất, không ghi đè bản sao", () => {
  const mem = new Mem();
  const raw = JSON.stringify(v1Save());
  mem.setItem(KEY, raw);
  const st = shopSave(mem);
  const a = st.read(1);
  assert.equal(a.migrated, 1);
  assert.equal(a.fresh, false);
  assert.equal(mem.getItem(backupKey(1)), raw);
  st.write(a.state);
  assert.equal(JSON.parse(mem.getItem(KEY)).v, SAVE_VERSION);
  assert.equal(mem.getItem(backupKey(1)), raw, "bản sao giữ nguyên");
  const b = st.read(1);
  assert.equal(b.migrated, null);
  assert.equal(b.state.money, 231);
});

test("bản lưu v2 đầy đủ (drama, review, trang trí, ký gửi) ghi rồi đọc lại y nguyên", () => {
  const s = shop(12);
  playDay(s);
  s.placement = {}; s.owned["flowering-pot"] = true; s.placement["flowering-pot"] = [1200, 690];
  s.consign = { day: 2, owed: 14 };
  s.promises = [{ day: 3, name: "Tí", reviewId: 1 }];
  s.drama.flags["s01-ok"] = 5; s.drama.queue.push({ id: "C05", day: 3, from: "C02" });
  const back = loadSave(dump(s));
  assert.deepEqual(back, s);
});

// ---------- ly ----------
const cupOf = (steps, sealed = false) => ({ steps: steps.map(([step, id]) => ({ step, id })), sealed });
test("ly phản ánh 'không đá' (thêm trà thay chỗ đá, không lớp đá) và 0% đường (mực nước không nhích) bằng lớp có sẵn", () => {
  const base = [["cup", "ly"], ["base", "hong-tra"], ["add", "sua"]];
  const s50 = cupLayers(cupOf([...base, ["sugar", 50]])).stage, s0 = cupLayers(cupOf([...base, ["sugar", 0]])).stage;
  assert.notEqual(s50, s0, "0% khác 50%");
  const noIce = cupLayers(cupOf([...base, ["sugar", 0], ["ice", "khong"]]));
  const ice = cupLayers(cupOf([...base, ["sugar", 0], ["ice", "vua"]]));
  assert.notEqual(noIce.stage, ice.stage);
  assert.ok(!noIce.layers.includes("ice-top"));
  assert.notEqual(noIce.stage, cupLayers(cupOf([...base, ["sugar", 0]])).stage, "chọn không đá cũng đổi hình");
  assert.deepEqual(cupNotes(cupOf([...base, ["sugar", 0], ["ice", "khong"], ["topping", "none"]])), ["0% đường", "Không đá", "Không topping"]);
  for (const l of [...noIce.layers, ...ice.layers]) assert.ok(BASE_FRAMES.has(l));
});

test("lớp Codex mới (siro, miếng trái, pudding, kem, matcha) tự dùng khi manifest có frame", () => {
  const all = (n) => BASE_FRAMES.has(n) || ["syrup-swirl", "brown-sugar-streak", "fruit-peach", "fruit-lychee", "fruit-passion", "pudding-bottom", "cream-top", "matcha-50", "matcha-milk-75"].includes(n);
  const peach = cupLayers(cupOf([["cup", "ly"], ["base", "hong-tra"], ["add", "dao"], ["sugar", 50]]), all).layers;
  assert.ok(peach.includes("fruit-peach") && peach.includes("syrup-swirl"));
  const mp = cupLayers(cupOf([["cup", "ly"], ["base", "matcha"], ["add", "sua"], ["sugar", 50], ["ice", "it"], ["topping", "pudding"]]), all).layers;
  assert.ok(mp.includes("matcha-milk-75") && mp.includes("pudding-bottom"));
  const kem = cupLayers(cupOf([["cup", "ly"], ["base", "o-long"], ["add", "kem-sua"]]), all).layers;
  assert.ok(kem.includes("cream-top"));
  // không có frame ⇒ giữ lớp cũ
  assert.ok(!cupLayers(cupOf([["cup", "ly"], ["base", "hong-tra"], ["add", "dao"], ["sugar", 50]])).layers.includes("fruit-peach"));
});
