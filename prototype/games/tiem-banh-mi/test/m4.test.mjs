// M4: review lưu sổ + trả lời theo tính cách (đổi ngay trên từng review, câu đáp lại, sự kiện sinh ra từ câu trả lời), người theo dõi / độ hot,
// Nhật Ký Làm Chủ (câu chốt ca theo dữ kiện, thẻ), chơi lại ngày hôm nay (xác nhận + dự phòng), nâng bản lưu v1 → v2 có bản sao, không lặp câu.
import test from "node:test";
import assert from "node:assert/strict";
import { shop, act, err, prepAndOpen, playShift, resolveEvent } from "./helpers.mjs";
import { createState, loadSave, dump, SAVE_VERSION } from "../core/state.js";
import { replyOptions, topicOf, trafficBonus, pushReview, FLIP_DAY } from "../core/reviews.js";
import { captionKind, caption, journalCard, journalMoments } from "../core/journal.js";
import { shopSave, KEY, DAY_KEY, REPLAY_BACKUP_KEY, backupKey } from "../save.js";
import { PERSONAS, PERSONA_IDS, REPLY_OPTIONS, REPLY_LINES } from "../data/lines-reply.js";
import { CAPTIONS } from "../data/lines-m3.js";
import { MISTAKE_IDS } from "../data/lines-mistakes.js";

class Mem { constructor() { this.m = new Map(); } getItem(k) { return this.m.has(k) ? this.m.get(k) : null; } setItem(k, v) { this.m.set(k, String(v)); } removeItem(k) { this.m.delete(k); } }
const withReview = (s, r) => pushReview(s, { name: "Chị Uyên", arch: "office", recipe: "cha-lua", stars: 2, line: "Dặn không hành mà hành ngập.", reason: "onionAnyway", ...r });

test("4 tính cách, mỗi tính cách 3–6 lựa chọn tuỳ sao + lý do; câu trả lời đủ cho mọi lựa chọn (≥ 6 câu mỗi nhóm)", () => {
  assert.deepEqual(PERSONA_IDS, ["hien", "cucsuc", "lay", "sale"]);
  const s = shop(1);
  const up = withReview(s, { stars: 5, reason: "good", line: "Giòn rụm." }), down = withReview(s, {});
  for (const p of PERSONA_IDS) {
    const a = replyOptions(s, up, p), b = replyOptions(s, down, p);
    assert.ok(a.length >= 2 && a.length <= 6, `${p} khen ${a.length}`);
    assert.ok(b.length >= 2 && b.length <= 6, `${p} lỗi ${b.length}`);
    for (const o of REPLY_OPTIONS[p]) assert.ok(Object.values(REPLY_LINES[o.id] || {}).flat().length >= 6, o.id);
  }
  assert.equal(topicOf(up), "praise"); assert.equal(topicOf(down), "mistake");
});

test("trả lời review: lưu nguyên văn dưới review kèm hậu quả + câu đáp lại; mỗi review trả lời một lần; tải lại vẫn còn", () => {
  const s = shop(2); act(s, { type: "persona", persona: "hien" });
  const r = withReview(s, {});
  const opt = replyOptions(s, r)[0];
  const res = act(s, { type: "reply", id: r.id, kind: opt.id });
  const e = res.events.find((x) => x.type === "replied");
  assert.ok(e.line && e.fx.length);
  assert.ok(s.feed[0].reply && s.feed[0].reply.text === e.line && s.feed[0].reply.persona === "hien");
  assert.equal(err(s, { type: "reply", id: r.id, kind: opt.id }), "replied");
  const back = loadSave(dump(s));
  assert.equal(back.feed[0].reply.text, e.line);
  assert.equal(back.owner.persona, "hien");
});

test("đổi tính cách ngay trên review: lựa chọn đổi theo tính cách mới, tính cách vừa đổi thành mặc định; đổi 3 lần một ngày ⇒ cờ rep-flip + hẹn R09", () => {
  const s = shop(3); act(s, { type: "persona", persona: "hien" });
  const r = withReview(s, {});
  const a = replyOptions(s, r).map((o) => o.id);
  act(s, { type: "persona", persona: "cucsuc" });
  const b = replyOptions(s, r).map((o) => o.id);
  assert.notDeepEqual(a, b);
  assert.ok(b.every((id) => id.startsWith("cuc")));
  act(s, { type: "reply", id: r.id, kind: b[0] });
  assert.equal(s.feed[0].reply.persona, "cucsuc");
  act(s, { type: "persona", persona: "lay" }); act(s, { type: "persona", persona: "sale" });
  assert.ok(s.owner.switches.length >= FLIP_DAY);
  assert.ok(s.drama.flags["rep-flip"]);
  assert.ok(s.drama.queue.some((q) => q.id === "R09"));
});

test("câu trả lời sinh sự kiện: cục súc cãi tay đôi ⇒ lên mạng (R01) hoặc dính phốt (R04) vào hàng hẹn + review cư dân mạng", () => {
  let viral = 0, phot = 0;
  for (let seed = 1; seed < 40 && !(viral && phot); seed++) {
    const s = shop(seed); act(s, { type: "persona", persona: "cucsuc" });
    const r = withReview(s, {});
    const opt = replyOptions(s, r).find((o) => o.out.roll?.win?.fx?.event);
    if (!opt) continue;
    const n0 = s.feed.length;
    const e = act(s, { type: "reply", id: r.id, kind: opt.id }).events.find((x) => x.type === "replied");
    if (e.outcome === "viral") { viral++; assert.ok(s.drama.flags["rep-viral"]); }
    if (e.outcome === "phot") { phot++; assert.ok(s.drama.flags["rep-phot"]); }
    assert.ok(s.drama.queue.length >= 1);
    assert.ok(s.feed.length > n0);
  }
  assert.ok(viral && phot, `viral ${viral} phốt ${phot}`);
});

test("review chay dính mặn chỉ cho lựa chọn xin lỗi nghiêm túc ở mọi tính cách", () => {
  const s = shop(4);
  const r = withReview(s, { reason: "veganMeat", stars: 1, line: "Ổ chay có pate." });
  for (const p of PERSONA_IDS) for (const o of replyOptions(s, r, p)) assert.match(o.id, /sorry|invite/, `${p} ${o.id}`);
});

test("người theo dõi + độ hot: review 5 sao +3 người theo dõi, điểm đánh giá trung bình 20 review, khách ca sau theo trafficBonus", () => {
  const s = shop(5);
  for (let i = 0; i < 10; i++) pushReview(s, { name: "K" + i, arch: "student", stars: 5, line: "x", reason: "good" });
  assert.equal(s.followers, 30); assert.equal(s.rating, 5);
  assert.ok(trafficBonus(s) >= 2);
  s.buzz = 3; assert.ok(trafficBonus(s) >= 4);
});

test("Nhật Ký: câu chốt ca chọn theo dữ kiện ca, thẻ đủ dòng (tiêu đề, tên tiệm ẩn được, câu trích, ba số, lumkeo.com); journal lưu mỗi ngày", () => {
  const base = { day: 3, profit: 80, revenue: 260, loaves: 14, lost: 0, avg: 4.2, batches: 4, burntBatches: 0, goldenPulls: 2, mistakes: {}, moments: [] };
  assert.equal(captionKind({ ...base, profit: -10 }), "loss");
  assert.equal(captionKind({ ...base, early: true }), "closed");
  assert.equal(captionKind({ ...base, moved: true }), "shop");
  assert.equal(captionKind({ ...base, preorders: 1 }), "preorder");
  assert.equal(captionKind({ ...base, avg: 4.8 }), "perfect");
  assert.equal(captionKind({ ...base, moments: [{ kind: "reply", outcome: "viral", line: "x" }] }), "replyViral");
  for (const k of Object.keys(CAPTIONS)) assert.ok(CAPTIONS[k].length >= 6, k);
  const s = shop(6);
  const cap = caption(s, base);
  assert.ok(cap.length > 10 && !/\{\w+\}/.test(cap), cap);
  const card = journalCard({ ...base, headline: cap, moments: [{ kind: "drama", name: "Chú Tám", line: "Mười hai ổ." }] }, { shopName: "Bánh Mì Hẻm", hideName: false });
  assert.equal(card.brand, "Lụm Kèo"); assert.equal(card.footer, "lumkeo.com"); assert.equal(card.shop, "Bánh Mì Hẻm"); assert.equal(card.stats.length, 3);
  assert.equal(card.quote, "Mười hai ổ.");
  assert.equal(journalCard(base, { shopName: "X", hideName: true }).shop, "");
  assert.ok(journalMoments(base).length >= 1);
  prepAndOpen(s); playShift(s, { rnd: () => 0.2 });
  assert.ok(s.journal.length >= 1 && s.journal[0].headline && s.lastSummary.headline);
  assert.equal(loadSave(dump(s)).journal[0].headline, s.journal[0].headline);
});

test("Chơi lại ngày hôm nay: ảnh đầu ngày chụp lúc Chuẩn bị ca; chơi lại cất bản hiện tại sang .before-replay rồi về đầu ngày", () => {
  const mem = new Mem(), store = shopSave(mem);
  const s = shop(7); s.introSeen = true;
  assert.equal(store.snapshotDay(s), true);
  assert.equal(store.snapshotDay(s), false);
  prepAndOpen(s); playShift(s, { rnd: () => 0.4 });
  store.write(s);
  const cur = mem.getItem(KEY);
  assert.equal(store.replayInfo().day, 1);
  assert.equal(store.replayDay(), true);
  assert.equal(mem.getItem(REPLAY_BACKUP_KEY), cur);
  const back = store.read(1).state;
  assert.equal(back.day, 1); assert.equal(back.shift, null);
  assert.ok(mem.getItem(DAY_KEY));
});

test("bản lưu v1 (M2) nâng lên v2: giữ tiền / cấp / kho / review, thêm mặc định M3–M4, cất bản sao .bak-v1 một lần", () => {
  const old = createState(42);
  old.v = 1; old.money = 345; old.level = 4; old.xp = 120; old.day = 6; old.introSeen = true; old.tutorialDone = true;
  old.feed = [{ id: 1, day: 5, name: "Bin", arch: "student", stars: 5, line: "Giòn.", reason: "good" }];
  for (const k of ["owner", "followers", "buzz", "drama", "journal", "mods", "rank", "pate", "house", "preorders", "stale", "placement", "cartMemory"]) delete old[k];
  const raw = JSON.stringify(old);
  const mem = new Mem(); mem.setItem(KEY, raw);
  const store = shopSave(mem);
  const r = store.read(1);
  assert.equal(r.migrated, 1);
  assert.equal(r.state.v, SAVE_VERSION); assert.equal(SAVE_VERSION, 2);
  assert.equal(r.state.money, 345); assert.equal(r.state.level, 4); assert.equal(r.state.feed[0].line, "Giòn.");
  assert.equal(r.state.owner.persona, null); assert.equal(r.state.followers, 0); assert.ok(r.state.drama.flags);
  assert.equal(mem.getItem(backupKey(1)), raw);
  store.write(r.state);
  shopSave(mem).read(1);
  assert.equal(mem.getItem(backupKey(1)), raw, "bản sao chỉ cất một lần");
});

test("không lặp câu: review, câu trả lời, câu sự kiện qua freshLine — 3 ngày liền mỗi ca không trùng review", () => {
  for (const seed of [5, 9]) {
    const s = shop(seed);
    for (let d = 0; d < 4; d++) {
      prepAndOpen(s);
      const from = s.nextReviewId;
      playShift(s, { rnd: () => 0.5 });
      const lines = s.feed.filter((r) => r.id > from && r.src !== "mang").map((r) => r.line);
      assert.equal(new Set(lines).size, lines.length, `hạt ${seed} ngày ${d}: ${lines.length - new Set(lines).size} câu trùng`);
      for (const x of [...s.feed.map((r) => r.line), ...s.drama.history.map((h) => h.line), ...(s.lastSummary?.moments || []).map((m) => m.line), s.lastSummary?.headline || ""]) assert.ok(!/\{\w+\}/.test(x), `biến chưa điền: ${x}`);
    }
  }
  for (const m of MISTAKE_IDS) assert.ok(m);
  assert.ok(Object.keys(PERSONAS).length === 4);
});
