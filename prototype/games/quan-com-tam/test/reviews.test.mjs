// M4 (C): review theo lý do, tính cách cô chủ (chọn, bản lưu cũ, đổi), lựa chọn trả lời theo tính cách, mỗi lựa chọn có câu + hậu quả,
// câu đáp lại / cư dân mạng bình luận đổi tính, review nghiêm trọng chỉ xin lỗi nghiêm túc, câu chốt Nhật Ký, không lặp + không sót biến.
import test from "node:test";
import assert from "node:assert/strict";
import { apply, must, newGame, playDay, playShift, prepDay } from "./helpers.mjs";
import { loadSave, dump } from "../core/state.js?v=c12";
import { reviewPool, pushReview, replyOptions, topicOf, linesFor, needPersona, trafficBonus, ratingOf, onShiftStart, FLIP_DAY, SERIOUS } from "../core/reviews.js?v=c12";
import { captionKind, caption, journalCard, journalMoments } from "../core/journal.js?v=c12";
import { MISTAKE_IDS } from "../core/score.js?v=c12";
import { PERSONAS, PERSONA_IDS, REPLY_OPTIONS, REPLY_LINES, OUTCOME_LABEL, COMEBACK, FLIP_LINES, NET_REVIEW, RETURN_LINES, CAPTIONS_PERSONA, CAPTIONS_REPLY, MISTAKE_TEXT } from "../data/lines-reply.js?v=c12";
import { CAPTIONS } from "../data/lines-journal.js?v=c12";
import * as M4 from "../data/lines-reviews-m4.js?v=c12";
import { freshLine, fill } from "../core/text.js?v=c12";
import { pickFree } from "../core/drama.js?v=c12";

const review = (s, o = {}) => pushReview(s, { name: "Chú Tư", role: "worker", stars: 2, line: "Câu review.", mistake: null, dish: "com-suon", ...o });
const ROLES = ["office", "worker", "student", "regular", "driver", "nurse", "reviewer", "tourist", "worker2", "student2"];

test("review theo lý do: 13 lỗi, hộp mang về, chờ lâu, cháy cạnh, lòng đào, trà đá kịp, khen, tạm", () => {
  for (const m of MISTAKE_IDS) { const r = reviewPool(m, 2, "worker"); assert.equal(r.reason, m); assert.ok(r.lines.length >= 6, m); }
  assert.equal(reviewPool(null, 5, "student", { takeaway: true }).reason, "takeaway");
  assert.equal(reviewPool(null, 2, "shipper", { takeaway: true }).reason, "takeaway");
  assert.equal(reviewPool(null, 3, "office", { slow: true }).reason, "slow");
  assert.equal(reviewPool(null, 5, "driver", { quirks: ["chayCanh"] }).reason, "charred");
  assert.equal(reviewPool(null, 5, "nurse", { quirks: ["longDao"] }).reason, "egg");
  assert.equal(reviewPool(null, 5, "office", { service: true }).reason, "service");
  assert.equal(reviewPool(null, 4, "office").reason, "praise");
  assert.equal(reviewPool(null, 3, "office").reason, "meh");
  // lỗi 4 sao (lòng đào) vẫn là review lỗi; 5 sao thì không còn lỗi
  assert.equal(reviewPool("hardEgg", 4, "nurse").reason, "hardEgg");
  for (const r of ROLES) for (const st of [1, 2, 3, 4, 5]) assert.ok(reviewPool(null, st, r).lines.length >= 6, r + st);
  // lên sổ: lý do, người theo dõi, đánh giá trung bình 20 review, cờ 1 sao
  const s = newGame(41);
  const f0 = s.followers;
  review(s, { stars: 5, reason: "praise" });
  review(s, { stars: 1, mistake: "raw" });
  assert.equal(s.feed[0].reason, "raw"); assert.equal(s.feed[1].reason, "praise");
  assert.equal(s.followers, f0 + 3);
  assert.equal(s.rating, 3);
  assert.equal(s.flags["review-1star-raw"], s.day);
  review(s, { stars: 1, timeout: "wait" });
  assert.equal(s.feed[0].reason, "slow"); assert.equal(s.flags["review-1star-slow"], s.day);
});

test("ca thật: mọi review có lý do; khách ca sau tăng theo đánh giá + độ hot; khách quay lại giữ tên và nói câu quay lại", () => {
  const s = newGame(42);
  playDay(s); playDay(s);
  assert.ok(s.feed.length >= 6);
  for (const r of s.feed) assert.ok(typeof r.reason === "string" && r.reason.length, JSON.stringify(r));
  assert.ok(s.journal.length === 2 && s.journal[0].day === 2 && s.journal[0].headline && !/\{/.test(s.journal[0].headline));
  // khách thêm nhờ review: đánh giá cao + độ hot
  s.feed = Array.from({ length: 10 }, (_, i) => ({ id: 900 + i, day: 2, name: "K", role: "student", stars: 5, line: "x", reason: "praise", src: "quan", reply: null }));
  s.hype = 3; s.followers = 250;
  assert.equal(trafficBonus(s), 5);
  s.returning = [{ name: "Chị Thảo", arch: "office", persona: "cucsuc", day: s.day }];
  prepDay(s);
  const before = s.rng;
  must(s, { type: "startShift" });
  if (s.shift.drama) s.shift.drama.max = 0; // ca thử chỉ kiểm khách quay lại: tắt Drama trong ca (phần B kiểm riêng)
  const sched = s.shift.schedule;
  assert.ok(sched.filter((g) => g.tag === "buzz").length === 5, "5 khách thêm nhờ review");
  const back = sched.find((g) => g.tag === "back");
  assert.ok(back && back.name === "Chị Thảo" && back.line && !/\{/.test(back.line));
  assert.deepEqual(s.returning, []);
  assert.notEqual(s.rng, before);
  // chạy tới khi khách quay lại vào quán: giữ tên + câu quay lại
  // hội thoại Drama (phần B) có thể mở giữa ca ⇒ chọn một lựa chọn bấm được rồi chạy tiếp; hội thoại khác thì dừng
  for (let t = 0; t < 200000 && !s.shift.groups.some((g) => g.tag === "back"); t += 200) {
    if (s.shift.dialog) { if (s.shift.dialog.kind === "event") { must(s, { type: "event", choice: pickFree(s, () => 0) }); continue; } break; }
    must(s, { type: "tick", dt: 200 });
  }
  const g = s.shift.groups.find((x) => x.tag === "back");
  assert.ok(g, "khách quay lại đã tới");
  assert.equal(g.members[0].name, "Chị Thảo");
  assert.equal(g.say?.text, back.line, "nói câu quay lại");
  assert.ok(RETURN_LINES.cucsuc.some((l) => fill(l, { self: "em", call: "chị" }) === back.line));
});

test("tính cách: chọn ở màn chào; bản lưu cũ chưa có ⇒ hỏi một lần; đổi ⇒ ghi lịch sử, cờ persona-flip, 3 lần ⇒ khoảnh khắc đổi tính", () => {
  const s = newGame(43, { intro: false });
  assert.equal(needPersona(s), false); // chưa qua màn chào thì chưa hỏi
  must(s, { type: "persona", persona: "lay" });
  must(s, { type: "seeIntro" });
  assert.equal(s.persona.id, "lay"); assert.equal(needPersona(s), false); assert.equal(s.persona.switches.length, 0);
  assert.equal(apply(s, { type: "persona", persona: "xyz" }).err, "bad-persona");
  // bản lưu cũ (M2): không có persona / followers / hype / journal, review không có lý do
  const old = JSON.parse(dump(s));
  for (const k of ["persona", "followers", "hype", "nextGuests", "promises", "returning", "journal", "dayLog"]) delete old[k];
  old.feed = [{ id: 0, day: 1, name: "Tèo", role: "student", stars: 2, line: "Bì leo lên dĩa.", mistake: "biAnyway", dish: "com-suon-bi" }, { id: 1, day: 1, name: "Cô Út", role: "regular", stars: 5, line: "Ngon.", mistake: null }];
  const s2 = loadSave(JSON.stringify(old));
  assert.ok(s2, "đọc được bản cũ");
  assert.equal(s2.persona.id, null); assert.equal(needPersona(s2), true);
  assert.equal(s2.followers, 0); assert.equal(s2.hype, 0); assert.deepEqual(s2.journal, []);
  assert.equal(s2.feed[0].reason, "biAnyway"); assert.equal(s2.feed[1].reason, "praise"); assert.equal(s2.feed[0].reply, null);
  must(s2, { type: "persona", persona: "hien" });
  assert.equal(needPersona(s2), false); assert.equal(s2.persona.asked, true);
  // đổi tính: lịch sử + cờ đếm số lần trong ngày
  const ev = [];
  must(s2, { type: "persona", persona: "cucsuc" });
  must(s2, { type: "persona", persona: "sale" });
  assert.equal(s2.flags["persona-flip"], 2);
  const r = apply(s2, { type: "persona", persona: "lay" });
  ev.push(...r.events);
  assert.equal(s2.persona.switches.length, FLIP_DAY);
  assert.equal(s2.flags["persona-flip"], 3);
  assert.ok(s2.dayLog.moments.some((m) => m.kind === "flip"));
  assert.equal(ev[0].switches, 3);
  // lưu / đọc giữ tính cách + lịch sử
  const s3 = loadSave(dump(s2));
  assert.equal(s3.persona.id, "lay"); assert.equal(s3.persona.switches.length, 3);
  // sang ngày mới: cờ đổi tính về 0
  s2.dayDone = true; must(s2, { type: "nextDay" });
  assert.equal(s2.flags["persona-flip"], 0);
});

test("lựa chọn trả lời: 3–4 lựa chọn mỗi tính cách theo sao + lý do; đổi tính ⇒ lựa chọn đổi ngay", () => {
  const s = newGame(44);
  must(s, { type: "persona", persona: "hien" });
  const cases = [
    { stars: 5, reason: "praise" }, { stars: 4, reason: "takeaway", takeaway: true }, { stars: 2, mistake: "biAnyway" }, { stars: 3, mistake: "noTea" },
    { stars: 2, mistake: "dirtyTable" }, { stars: 1, timeout: "wait" }, { stars: 3, reason: "meh" }, { stars: 2, reason: "slow" },
  ];
  for (const c of cases) {
    const r = review(s, c);
    const ids = new Set();
    for (const p of PERSONA_IDS) {
      const opts = replyOptions(s, r, p);
      assert.ok(opts.length >= 3 && opts.length <= 4, `${p} ${JSON.stringify(c)}: ${opts.length}`);
      for (const o of opts) { assert.ok(o.id.startsWith(p === "cucsuc" ? "cuc" : p)); ids.add(o.id); assert.ok(linesFor(o.id, r).length >= 6, o.id + " " + topicOf(r)); }
    }
    assert.ok(ids.size >= 12, "bốn tính cách cho bốn bộ lựa chọn khác nhau");
  }
  // cư dân mạng chê ⇒ chủ đề net
  const net = review(s, { stars: 2, src: "mang", reason: "net", role: "reviewer" });
  assert.equal(topicOf(net), "net");
  // trả lời bằng lựa chọn của tính cách khác ⇒ không được; đổi tính rồi trả lời được
  const r = review(s, { stars: 2, mistake: "burnt" });
  assert.equal(apply(s, { type: "reply", id: r.id, kind: "lay-meme" }).err, "not-eligible");
  must(s, { type: "persona", persona: "lay" });
  must(s, { type: "reply", id: r.id, kind: "lay-meme" });
  assert.equal(s.feed.find((x) => x.id === r.id).reply.persona, "lay");
  assert.equal(apply(s, { type: "reply", id: r.id, kind: "lay-sorry" }).err, "replied");
  assert.equal(apply(s, { type: "reply", id: 99999, kind: "lay-sorry" }).err, "no-review");
});

test("mọi lựa chọn của mọi tính cách đăng câu trả lời (không sót biến) + ít nhất một hậu quả; cờ reply-viral / reply-phot / reply-sale", () => {
  const seen = new Set(), outcomes = new Set();
  const cases = [{ stars: 5, reason: "praise" }, { stars: 4, reason: "takeaway", takeaway: true }, { stars: 2, mistake: "wrongBill" }, { stars: 1, timeout: "food" }, { stars: 3, reason: "meh" },
    { stars: 1, mistake: "raw" }, { stars: 1, mistake: "veganMeat" }, { stars: 2, src: "mang", reason: "net", role: "reviewer" }];
  let seed = 100;
  for (const p of PERSONA_IDS) for (const c of cases) {
    const probe = newGame(seed); const r0 = review(probe, c);
    for (const o of replyOptions(probe, r0, p)) {
      for (let k = 0; k < 3; k++) {
        const s = newGame(seed++);
        s.money = 500; must(s, { type: "persona", persona: p });
        const r = review(s, c);
        const res = must(s, { type: "reply", id: r.id, kind: o.id });
        const done = s.feed.find((x) => x.id === r.id).reply;
        assert.ok(done.text.length > 10 && !/\{\w+\}/.test(done.text), `${o.id}: ${done.text}`);
        assert.ok(done.fx.length >= 1 && done.fx.every((f) => typeof f === "string" && f.length), o.id);
        assert.ok(OUTCOME_LABEL[done.outcome], done.outcome);
        assert.equal(res.events.find((e) => e.type === "replied").line, done.text);
        if (o.cost) assert.equal(s.money, 500 - o.cost);
        outcomes.add(done.outcome); seen.add(o.id);
        if (done.outcome === "viral") assert.equal(s.flags["reply-viral"], s.day);
        if (done.outcome === "phot") { assert.equal(s.flags["reply-phot"], s.day); assert.ok(s.feed.some((x) => x.src === "mang" && x.stars === 2)); }
        if (p === "sale") assert.equal(s.flags["reply-sale"], s.day);
      }
    }
  }
  const all = Object.values(REPLY_OPTIONS).flat().map((o) => o.id);
  assert.deepEqual([...seen].sort(), [...all].sort(), "lựa chọn nào cũng dùng được ở ít nhất một loại review");
  for (const o of ["warm", "promise", "viral", "phot", "flop", "annoyed", "sold", "back", "serious"]) assert.ok(outcomes.has(o), "có kết quả " + o);
  // thiếu tiền ⇒ không trả lời bằng lựa chọn tốn tiền, review chưa bị đánh dấu
  const s = newGame(7); s.money = 0; must(s, { type: "persona", persona: "hien" });
  const r = review(s, { stars: 2, mistake: "noMoHanh" });
  assert.equal(apply(s, { type: "reply", id: r.id, kind: "hien-invite" }).err, "money");
  assert.equal(s.feed.find((x) => x.id === r.id).reply, null);
});

test("hậu quả thấy được: lời hứa (ngày sau ≥ 4 sao ⇒ danh tiếng +2), khách quay lại, khách ca sau, review cư dân mạng làm đổi đánh giá", () => {
  const s = newGame(45); must(s, { type: "persona", persona: "hien" });
  const r = review(s, { stars: 2, mistake: "biAnyway", name: "Tèo", role: "student" });
  must(s, { type: "reply", id: r.id, kind: "hien-sorry" });
  assert.equal(s.promises.length, 1); assert.equal(s.promises[0].name, "Tèo");
  const r2 = review(s, { stars: 3, mistake: "noTea", name: "Chị Thảo", role: "office" });
  s.money = 100; must(s, { type: "reply", id: r2.id, kind: "hien-invite" });
  assert.ok(s.returning.some((g) => g.name === "Chị Thảo" && g.arch === "office"));
  must(s, { type: "persona", persona: "sale" });
  const r3 = review(s, { stars: 5, reason: "praise" });
  must(s, { type: "reply", id: r3.id, kind: "sale-thanks" });
  assert.ok(s.nextGuests >= 1);
  // giữ lời hứa: ngày có trung bình ≥ 4 sao
  const rep0 = s.rep;
  prepDay(s);
  playShift(s);
  while (!s.dayDone) playShift(s);
  const kept = s.journal[0].moments.some((m) => m.kind === "promise" || m.kind === "promise-miss");
  assert.ok(kept, "lời hứa được chấm cuối ngày");
  assert.equal(s.promises.length, 0);
  const pm = s.journal[0].moments.find((m) => m.kind === "promise" || m.kind === "promise-miss");
  if (pm.kind === "promise") assert.match(pm.line, /Danh tiếng \+2/); else assert.match(pm.line, /chưa tới 4 sao/);
  assert.ok(rep0 >= 0);
  // cục súc nói thẳng: lên mạng ⇒ review 5 sao cư dân mạng, phốt ⇒ review 2 sao (đánh giá đổi)
  let viral = 0, phot = 0;
  for (let k = 0; k < 30; k++) {
    const x = newGame(300 + k); must(x, { type: "persona", persona: "cucsuc" });
    const rv = review(x, { stars: 2, mistake: "burnt" });
    const before = ratingOf(x.feed);
    must(x, { type: "reply", id: rv.id, kind: "cuc-truth" });
    const o = x.feed.find((y) => y.id === rv.id).reply.outcome;
    if (o === "viral") { viral++; assert.ok(x.rating > before); } else { phot++; assert.ok(x.rep < 50 && x.hype >= 1.5); }
  }
  assert.ok(viral > 0 && phot > 0, "nói thẳng là đánh cược");
});

test("câu đáp lại: khách / cư dân mạng đáp sau câu trả lời; đổi tính giữa hai lần trả lời ⇒ cư dân mạng bình luận", () => {
  let comebacks = 0, flips = 0;
  for (let k = 0; k < 20; k++) {
    const s = newGame(500 + k); s.money = 200;
    must(s, { type: "persona", persona: "hien" });
    const a = review(s, { stars: 5, reason: "praise" });
    must(s, { type: "reply", id: a.id, kind: "hien-thanks" });
    comebacks += s.feed.find((x) => x.id === a.id).reply.comeback.length;
    must(s, { type: "persona", persona: "cucsuc" });
    const b = review(s, { stars: 2, mistake: "wrongTable" });
    must(s, { type: "reply", id: b.id, kind: "cuc-sorry" });
    const cb = s.feed.find((x) => x.id === b.id).reply.comeback;
    for (const c of cb) { assert.ok(c.line && !/\{\w+\}/.test(c.line)); if (c.flip) { flips++; assert.match(c.line, /hiền lành|cục súc/); } }
  }
  assert.ok(comebacks >= 10, "phần lớn câu trả lời có người đáp");
  assert.ok(flips >= 8, "đổi tính thì cư dân mạng để ý");
});

test("review sườn sống / dĩa chay dính mặn: mọi tính cách chỉ có xin lỗi nghiêm túc, câu nghiêm túc, không đùa / khuyến mãi", () => {
  for (const m of SERIOUS) {
    const s = newGame(46); s.money = 100;
    const r = review(s, { stars: 1, mistake: m });
    assert.equal(topicOf(r), "serious");
    for (const p of PERSONA_IDS) {
      const opts = replyOptions(s, r, p);
      assert.ok(opts.length >= 2, p);
      for (const o of opts) {
        assert.ok(o.on.includes("serious") && o.out.kind === "serious" && !o.out.roll, o.id);
        const L = linesFor(o.id, r);
        assert.ok(L.length >= 6);
        assert.deepEqual(L, REPLY_LINES[o.id].serious);
        for (const l of L) assert.ok(!/#|COMNONG|combo|mã giảm|haha|giảm giá/i.test(l), l);
      }
      const other = REPLY_OPTIONS[p].find((o) => !o.on.includes("serious"));
      must(s, { type: "persona", persona: p });
      assert.equal(apply(s, { type: "reply", id: r.id, kind: other.id }).err, "not-eligible");
    }
    const r2 = s.feed[0];
    must(s, { type: "reply", id: r2.id, kind: replyOptions(s, r2)[0].id });
    assert.equal(s.feed[0].reply.outcome, "serious");
    assert.ok(s.promises.length === 1 || s.feed[0].reply.kind.endsWith("refund"));
  }
});

test("Nhật Ký: chọn câu chốt theo dữ kiện ngày, câu trả lời nổi nhất thay câu chốt, thẻ đủ dòng, ẩn tên quán, đổi khoảnh khắc", () => {
  const base = { day: 5, plates: 20, profit: 120, revenue: 600, stars: 4.2, lost: 0, burnt: 0, perfect: 3, flips: 20, washed: 6, oops: 0, takeaway: 0, soldOut: 0, followers: 4, moments: [] };
  const K = (o) => captionKind({ ...base, ...o });
  assert.equal(K({ tutorial: true, day: 1 }), "tutorial");
  assert.equal(K({ profit: -30 }), "loss");
  assert.equal(K({ moments: [{ kind: "reply", outcome: "viral", line: "x" }] }), "replyViral");
  assert.equal(K({ moments: [{ kind: "reply", outcome: "phot", line: "x" }] }), "replyPhot");
  assert.equal(K({ moments: [{ kind: "flip", line: "x" }] }), "flip");
  assert.equal(K({ moments: [{ kind: "serious", line: "x" }] }), "serious");
  assert.equal(K({ lost: 3 }), "lost");
  assert.equal(K({ burnt: 2 }), "burnt");
  assert.equal(K({ oops: 4 }), "oops");
  assert.equal(K({ moments: [{ kind: "promise", line: "x" }] }), "promise");
  assert.equal(K({ followers: 40 }), "viral");
  assert.equal(K({ perfect: 9 }), "grill");
  assert.equal(K({ soldOut: 1 }), "soldOut");
  assert.equal(K({ takeaway: 4 }), "takeaway");
  assert.equal(K({ washed: 14 }), "wash");
  assert.equal(K({ plates: 3 }), "few");
  assert.equal(K({ stars: 4.7 }), "perfect");
  assert.equal(K({}), "good");
  const s = newGame(47); must(s, { type: "persona", persona: "cucsuc" });
  for (const o of [{ tutorial: true }, { profit: -10 }, { burnt: 3 }, { lost: 2 }, { perfect: 10 }, {}, { followers: 50 }]) {
    const c = caption(s, { ...base, ...o });
    assert.ok(c.headline.length > 10 && !/\{\w+\}/.test(c.headline), c.headline);
  }
  // ngày thật: chốt ngày tạo thẻ, trả lời lên mạng sau đó thay câu chốt + đưa câu trả lời lên đầu khoảnh khắc
  const x = newGame(48); must(x, { type: "persona", persona: "lay" });
  playDay(x);
  prepDay(x);
  do playShift(x); while (!x.dayDone);
  const j = x.journal[0];
  assert.equal(j.day, x.day); assert.ok(j.headline);
  assert.equal(x.lastSummary.headline, j.headline);
  let viral = null;
  for (let k = 0; k < 40 && !viral; k++) { // M5: hên xui theo RNG ván (luật M5 đổi thứ tự tung) — thử tới 40 lần
    const r = review(x, { stars: 5, reason: "praise", name: "Bé Su Review", role: "reviewer" });
    must(x, { type: "reply", id: r.id, kind: "lay-trend" });
    if (x.feed.find((y) => y.id === r.id).reply.outcome === "viral") viral = x.feed.find((y) => y.id === r.id).reply.text;
  }
  assert.ok(viral, "có câu trả lời lên mạng");
  assert.equal(x.journal[0].replyCap, "viral");
  // M5: so cả mẫu bắt đầu bằng biến ({plates} dĩa…): đổi mẫu thành regex
  const re = (t) => new RegExp("^" + t.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\{\w+\}/g, ".+") + "$");
  assert.ok(CAPTIONS_REPLY.viral.some((t) => re(t).test(x.journal[0].headline)), x.journal[0].headline);
  assert.equal(x.journal[0].moments[0].line, viral, "câu trả lời nổi nhất lên đầu khoảnh khắc");
  assert.equal(x.lastSummary.headline, x.journal[0].headline);
  const card = journalCard(x.journal[0], { shopName: "Cơm Tấm Cô Ba", moment: 0 });
  assert.equal(card.shop, "Cơm Tấm Cô Ba"); assert.equal(card.quote, viral); assert.equal(card.stats.length, 3);
  assert.equal(journalCard(x.journal[0], { shopName: "Cơm Tấm Cô Ba", hideName: true }).shop, "");
  const n = journalMoments(x.journal[0]).length;
  assert.ok(n >= 2);
  assert.notEqual(journalCard(x.journal[0], { moment: 1 }).quote, card.quote);
  assert.equal(journalCard(x.journal[0], { moment: n }).quote, card.quote);
  assert.ok(journalCard({ day: 1, plates: 0, profit: 0, stars: 0, moments: [] }).quote.length > 10);
  // lưu / đọc giữ Nhật Ký
  const y = loadSave(dump(x));
  assert.deepEqual(y.journal, x.journal);
  assert.deepEqual(y.feed, x.feed);
});

// ---------- nội dung ----------
const ALLOWED_REPLY = new Set(["name", "dish", "mistake", "shop", "stars"]);
const vars = (t) => [...String(t).matchAll(/\{(\w+)\}/g)].map((m) => m[1][0].toLowerCase() + m[1].slice(1));
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u;
function walk(o, f, path = "") { if (typeof o === "string") f(o, path); else if (Array.isArray(o)) o.forEach((x, i) => walk(x, f, path + "." + i)); else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) walk(v, f, path + "." + k); }

test("nội dung M4 ≥ 450 câu, không emoji, không câu trùng, biến đúng chỗ, 6–10 câu mỗi lựa chọn mỗi tính cách", () => {
  const all = [];
  walk(REPLY_LINES, (t, p) => { all.push(t); for (const v of vars(t)) assert.ok(ALLOWED_REPLY.has(v), p + ": {" + v + "}"); });
  walk(COMEBACK, (t, p) => { all.push(t); for (const v of vars(t)) assert.ok(ALLOWED_REPLY.has(v), p + ": {" + v + "}"); });
  walk(NET_REVIEW, (t, p) => { all.push(t); for (const v of vars(t)) assert.ok(ALLOWED_REPLY.has(v), p); });
  walk(FLIP_LINES, (t, p) => { all.push(t); for (const v of vars(t)) assert.ok(["from", "to"].includes(v), p); });
  walk(RETURN_LINES, (t, p) => { all.push(t); for (const v of vars(t)) assert.ok(["self", "call"].includes(v), p); });
  const CAPV = new Set(["plates", "profit", "revenue", "stars", "lost", "burnt", "perfect", "flips", "washed", "oops", "followers", "takeaway", "day", "shop"]);
  walk({ CAPTIONS, CAPTIONS_PERSONA, CAPTIONS_REPLY }, (t, p) => { all.push(t); for (const v of vars(t)) assert.ok(CAPV.has(v), p + ": {" + v + "}"); });
  walk(M4, (t, p) => { all.push(t); for (const v of vars(t)) assert.ok(["self", "call", "name", "dish"].includes(v), p); });
  for (const t of all) { assert.ok(!EMOJI.test(t), t); assert.ok(!/tiệm/i.test(t), "quán, không phải tiệm: " + t); }
  const dup = all.filter((t, i) => all.indexOf(t) !== i);
  assert.deepEqual(dup, [], "không câu trùng");
  assert.ok(all.length >= 450, `có ${all.length} câu`);
  if (process.env.COUNT) console.log("M4 C:", all.length, "câu");
  // 6–10 câu mỗi lựa chọn mỗi tính cách cho mọi chủ đề nó trả lời
  const cases = [{ stars: 5, reason: "praise" }, { stars: 5, reason: "takeaway" }, { stars: 2, reason: "biAnyway" }, { stars: 2, reason: "slow" }, { stars: 3, reason: "meh" }, { stars: 2, reason: "net", src: "mang" }, { stars: 1, reason: "raw" }];
  for (const c of cases) for (const p of PERSONA_IDS) for (const o of replyOptions(null, c, p)) { const n = linesFor(o.id, c).length; assert.ok(n >= 6, `${o.id} ${c.reason}: ${n}`); }
  for (const id of Object.keys(PERSONAS)) assert.ok(CAPTIONS_PERSONA[id].length >= 5);
  for (const k of Object.keys(MISTAKE_TEXT)) assert.ok(MISTAKE_TEXT[k].length > 2);
  for (const m of MISTAKE_IDS) assert.ok(MISTAKE_TEXT[m], m);
  for (const [k, v] of Object.entries(CAPTIONS)) if (!["replyViral", "replyPhot", "flip"].includes(k)) assert.ok(v.length >= 4, k);
});

test("freshLine: trả lời liên tiếp không lặp câu trong một ngày, không sót biến", () => {
  const s = newGame(49); s.money = 1000;
  must(s, { type: "persona", persona: "hien" });
  const texts = [];
  for (let i = 0; i < 8; i++) { const r = review(s, { stars: 2, mistake: "noTea", name: "Tài xế Lộc", role: "driver" }); must(s, { type: "reply", id: r.id, kind: "hien-sorry" }); texts.push(s.feed.find((x) => x.id === r.id).reply.text); }
  assert.equal(new Set(texts).size, texts.length, "8 câu xin lỗi khác nhau");
  for (const t of texts) assert.ok(!/\{\w+\}/.test(t) && t.includes("Tài xế Lộc") || !t.includes("{"));
  const pool = REPLY_LINES["cuc-thanks"].up;
  const got = Array.from({ length: pool.length }, () => freshLine(s, pool, { name: "A", dish: "cơm sườn", stars: 5 }));
  assert.equal(new Set(got).size, pool.length);
});
