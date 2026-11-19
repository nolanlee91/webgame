// Trả lời review theo tính cách chủ tiệm: chọn / đổi tính cách, lựa chọn theo tính cách + chủ đề review, mọi lựa chọn đăng câu + hậu quả,
// câu đáp lại, khách quay lại, sự kiện R01–R10 mở được từ kết quả trả lời, không lặp câu trong ca, nâng bản lưu v2 → v3, Nhật Ký.
import test from "node:test";
import assert from "node:assert/strict";
import { PERSONAS, PERSONA_IDS, REPLY_OPTIONS, REPLY_LINES, COMEBACK, FLIP_LINES, NET_REVIEW, RETURN_LINES, PERSONA_ASIDE, CAPTIONS_PERSONA, CAPTIONS_REPLY, MISTAKE_TEXT, NET_HANDLES } from "../data/lines-reply.js";
import { EVENTS_REPLY } from "../data/events-reply.js";
import { EVENT } from "../data/events.js";
import { replyOptions, linesFor, topicOf, groupOf, FLIP_DAY, switchesOn } from "../core/reviews.js";
import { createState, loadSave, dump, SAVE_VERSION, MIGRATIONS } from "../core/state.js";
import { shopSave, KEY, backupKey } from "../save.js";
import { eligibleNow, currentEvent, openEvent } from "../core/drama.js";
import { captionKind, journalMoments } from "../core/journal.js";
import { shop, act, err, advance, untilWaiting, serveRight, clearDrama } from "./helpers.mjs";

class Mem { constructor() { this.m = new Map(); } getItem(k) { return this.m.has(k) ? this.m.get(k) : null; } setItem(k, v) { this.m.set(k, String(v)); } }
const TOPICS = [
  { stars: 5, reason: "good" }, { stars: 5, reason: "decor" }, { stars: 4, reason: "multi" },
  { stars: 2, reason: "sugarHigh" }, { stars: 1, reason: "wrongCustomer" }, { stars: 2, reason: "multiWrong" }, { stars: 1, reason: "timeout" }, { stars: 2, reason: "multiLate" },
  { stars: 3, reason: "ok" }, { stars: 2, reason: "mang", src: "mang" },
];
let nid = 1;
const rv = (q) => ({ id: nid++, day: 1, name: "Anh Tùng", arch: "van-phong", recipe: "tra-dao", line: "Review thử.", reply: null, src: "quan", ...q });
function shopWith(persona, seed = 11) {
  const s = shop(seed);
  s.tutorialDone = true; s.introSeen = true; s.day = 3; s.money = 500;
  if (persona) act(s, { type: "setPersona", persona });
  return s;
}
const VARS = new Set(["name", "drink", "mistake", "shop", "stars"]);
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u;
// cục súc thẳng mà không chê người: không có từ chê ngoại hình / giới tính / vùng miền
const BANNED_WORDS = new Set(["xấu", "mập", "béo", "lùn", "ế", "ngu", "điên", "khùng"]);
const BANNED_PHRASES = ["đen thui", "con gái mà", "đàn ông mà", "nhà quê", "dân tỉnh", "bắc kỳ", "nam kỳ", "mặt mũi"];
const insults = (l) => { const low = l.toLocaleLowerCase("vi"); return low.split(/[^\p{L}]+/u).some((w) => BANNED_WORDS.has(w)) || BANNED_PHRASES.some((p) => low.includes(p)); };
const tplRe = (tpl) => new RegExp("^" + tpl.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\{\w+\}/g, ".+?") + "$");
const fromTpl = (list, text) => list.some((tpl) => tplRe(tpl).test(text));

function allNewLines() {
  const out = [];
  for (const L of Object.values(REPLY_LINES)) for (const arr of Object.values(L)) out.push(...arr);
  for (const C of Object.values(COMEBACK)) out.push(...C.reviewer, ...C.net);
  out.push(...FLIP_LINES, ...NET_REVIEW[2], ...NET_REVIEW[5]);
  for (const k of [RETURN_LINES, PERSONA_ASIDE, CAPTIONS_PERSONA, CAPTIONS_REPLY]) for (const arr of Object.values(k)) out.push(...arr);
  for (const ev of EVENTS_REPLY) for (const n of Object.values(ev.nodes)) {
    out.push(n.line, ...(n.me ? [n.me] : []), ...Object.values(n.meBy || {}));
    for (const c of n.choices) out.push(c.label, c.hint, c.say, ...Object.values(c.sayBy || {}), ...(c.roll ? [c.roll.win.say, c.roll.lose.say] : []));
  }
  for (const L of Object.values(REPLY_OPTIONS)) for (const o of L) out.push(o.label, o.hint);
  for (const P of Object.values(PERSONAS)) out.push(P.name, P.desc);
  return out.filter(Boolean);
}

test("nội dung: ≥ 400 câu mới, không emoji, không chê người, không trùng câu", () => {
  const lines = allNewLines();
  assert.ok(lines.length >= 400, `${lines.length} câu`);
  for (const l of lines) {
    assert.ok(!EMOJI.test(l), "emoji: " + l);
    assert.ok(!insults(l), "câu chê người: " + l);
  }
  const reply = Object.values(REPLY_LINES).flatMap((L) => Object.values(L).flat());
  assert.equal(new Set(reply).size, reply.length, "câu trả lời trùng");
  for (const t of reply) for (const m of t.matchAll(/\{(\w+)\}/g)) assert.ok(VARS.has(m[1]), `biến lạ {${m[1]}} trong: ${t}`);
});

test("tính cách: ít nhất 4, mỗi tính cách 3–4 lựa chọn cho mọi chủ đề review, mỗi lựa chọn 6–10+ câu theo chủ đề", () => {
  assert.ok(PERSONA_IDS.length >= 4);
  for (const p of PERSONA_IDS) {
    for (const q of TOPICS) {
      const r = rv(q);
      const opts = replyOptions(null, r, p);
      assert.ok(opts.length >= 3 && opts.length <= 4, `${p} / ${topicOf(r)}: ${opts.length} lựa chọn`);
      for (const o of opts) assert.ok(linesFor(o.id, topicOf(r)).length >= 6, `${o.id} / ${topicOf(r)}: ${linesFor(o.id, topicOf(r)).length} câu`);
    }
    for (const o of REPLY_OPTIONS[p]) {
      assert.ok(o.label && o.hint, o.id);
      const outs = o.out.roll ? [o.out.roll.win, o.out.roll.lose] : [o.out];
      for (const x of outs) { assert.ok(COMEBACK[x.kind] || x.kind === "promise", `${o.id}: kết quả ${x.kind}`); if (x.fx.event) assert.ok(EVENT[x.fx.event.id], x.fx.event.id); }
    }
  }
  // lựa chọn khác nhau giữa các tính cách
  const sets = PERSONA_IDS.map((p) => replyOptions(null, rv({ stars: 2, reason: "sugarHigh" }), p).map((o) => o.id).join());
  assert.equal(new Set(sets).size, PERSONA_IDS.length);
  assert.ok(MISTAKE_TEXT.sugarHigh && MISTAKE_TEXT.noLid && MISTAKE_TEXT.swapped && MISTAKE_TEXT.multiLate);
  assert.equal(groupOf(topicOf(rv({ stars: 4, reason: "multi" }))), "up");
});

test("chọn tính cách: màn chào đặt mặc định, đổi bất cứ lúc nào (không giới hạn trong ngày), ghi lịch sử, đổi nhiều ⇒ cư dân mạng để ý", () => {
  const s = shop(5);
  assert.equal(s.owner.persona, null);
  assert.equal(err(s, { type: "setPersona", persona: "ninja" }), "bad-persona");
  act(s, { type: "setPersona", persona: "hien" });
  assert.equal(s.owner.persona, "hien");
  assert.equal(s.owner.switches.length, 0, "lần chọn đầu không tính là đổi");
  act(s, { type: "setPersona", persona: "cucsuc" });
  act(s, { type: "setPersona", persona: "lay" });
  assert.equal(switchesOn(s, s.day), 2);
  assert.ok(!s.drama.flags["rep-flip"]);
  s.lastSummary = { day: s.day - 1, cups: 6, avgStars: 4, followersDelta: 3, moments: [], headline: "cũ" };
  s.journal = [{ day: s.day - 1, cups: 6, profit: 10, avgStars: 4, headline: "cũ", moment: "" }];
  const r = act(s, { type: "setPersona", persona: "sale" });
  assert.equal(switchesOn(s, s.day), FLIP_DAY);
  assert.ok(s.drama.flags["rep-flip"], "cờ rep-flip");
  assert.ok(s.drama.queue.some((q) => q.id === "R09"), "hẹn R09");
  assert.ok(r.events.some((e) => e.type === "persona" && e.switches === FLIP_DAY));
  assert.ok(s.lastSummary.moments.some((m) => m.kind === "flip"));
  assert.notEqual(s.lastSummary.headline, "cũ", "câu Nhật Ký ngày đổi tính nhiều lần");
  assert.equal(s.journal[0].headline, s.lastSummary.headline);
  act(s, { type: "setPersona", persona: "hien" });
  assert.equal(s.owner.persona, "hien", "vẫn đổi được tiếp");
});

test("mọi lựa chọn của mọi tính cách đăng câu trả lời + hậu quả thấy được, lưu dưới review và qua tải lại", () => {
  for (const p of PERSONA_IDS) {
    for (const q of TOPICS) {
      for (const o of replyOptions(null, rv(q), p)) {
        for (const seed of [1, 2, 3]) {
          const s = shopWith(p, seed * 31);
          const r = rv(q);
          s.feed = [r];
          const res = act(s, { type: "reply", id: r.id, kind: o.id });
          const R = s.feed.find((x) => x.id === r.id).reply;
          assert.ok(R && R.text.length > 15 && !/\{\w+\}/.test(R.text), `${o.id}: câu trả lời ${R?.text}`);
          assert.ok(R.fx.length >= 1, `${o.id}: hậu quả`);
          assert.equal(R.persona, p);
          const e = res.events.find((x) => x.type === "replied");
          assert.equal(e.line, R.text);
          assert.ok(e.label && e.fx.length);
          for (const c of R.comeback) assert.ok(c.line.length > 5 && !/\{\w+\}/.test(c.line), c.line);
          assert.equal(err(s, { type: "reply", id: r.id, kind: o.id }), "replied");
          assert.deepEqual(loadSave(dump(s)).feed.find((x) => x.id === r.id).reply, R);
        }
      }
    }
  }
});

test("đổi tính cách ngay trên bảng trả lời ⇒ lựa chọn đổi theo; lựa chọn của tính cách khác bị từ chối", () => {
  const s = shopWith("hien");
  const r = rv({ stars: 2, reason: "sugarHigh" });
  s.feed = [r];
  const a = replyOptions(s, r).map((o) => o.id);
  act(s, { type: "setPersona", persona: "cucsuc" });
  const b = replyOptions(s, r).map((o) => o.id);
  assert.notDeepEqual(a, b);
  assert.ok(b.includes("cuc-truth"));
  assert.equal(err(s, { type: "reply", id: r.id, kind: "hien-sorry" }), "not-eligible");
  act(s, { type: "reply", id: r.id, kind: "cuc-sorry" });
  assert.equal(s.feed[0].reply.persona, "cucsuc");
  assert.equal(s.owner.persona, "cucsuc", "tính cách mới thành mặc định");
});

test("cư dân mạng để ý chủ tiệm đổi tính giữa hai câu trả lời", () => {
  let seen = 0;
  for (let seed = 1; seed <= 12; seed++) {
    const s = shopWith("hien", seed);
    const r1 = rv({ stars: 5, reason: "good" }), r2 = rv({ stars: 5, reason: "good" });
    s.feed = [r1, r2];
    act(s, { type: "reply", id: r1.id, kind: "hien-thanks" });
    act(s, { type: "setPersona", persona: "cucsuc" });
    act(s, { type: "reply", id: r2.id, kind: "cuc-thanks" });
    const f = s.feed.find((x) => x.id === r2.id).reply.comeback.find((c) => c.flip);
    if (f) { seen++; assert.ok(f.net && !/\{\w+\}/.test(f.line), f.line); }
  }
  assert.ok(seen >= 4, `chỉ ${seen}/12 lần có câu đổi tính`);
});

test("câu đáp lại: phần lớn review có câu của người viết; viral / phốt luôn có cư dân mạng", () => {
  let withCb = 0, total = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const s = shopWith("cucsuc", seed);
    const r = rv({ stars: 2, reason: "sugarHigh" });
    s.feed = [r];
    act(s, { type: "reply", id: r.id, kind: "cuc-truth" });
    const R = s.feed.find((x) => x.id === r.id).reply;
    total++;
    if (R.comeback.length) withCb++;
    assert.ok(["viral", "phot"].includes(R.outcome));
    assert.ok(R.comeback.some((c) => c.net), "viral / phốt có cư dân mạng");
    assert.ok(R.comeback.length <= 2);
  }
  assert.equal(withCb, total);
});

test("cục súc đánh cược: viral ⇒ người theo dõi + review 5 sao + hẹn R01; phốt ⇒ hot lên, review 2 sao kéo đánh giá xuống, hẹn R04", () => {
  const got = new Set();
  for (let seed = 1; seed <= 40 && got.size < 2; seed++) {
    const s = shopWith("cucsuc", seed);
    s.feed = [rv({ stars: 5, reason: "good" }), rv({ stars: 4, reason: "good" }), rv({ stars: 5, reason: "good" })];
    const r = rv({ stars: 2, reason: "sugarLow" });
    s.feed.unshift(r);
    s.rating = 4;
    const f0 = s.followers, b0 = s.buzz, n0 = s.feed.length;
    act(s, { type: "reply", id: r.id, kind: "cuc-truth" });
    const R = r.reply ?? s.feed.find((x) => x.id === r.id).reply;
    got.add(R.outcome);
    assert.equal(s.feed.length, n0 + 1, "có review của cư dân mạng");
    if (R.outcome === "viral") {
      assert.ok(s.followers >= f0 + 30 && s.feed[0].stars === 5 && s.rating > 4);
      assert.ok(s.drama.flags["rep-viral"] && s.drama.queue.some((q) => q.id === "R01"));
    } else {
      assert.ok(s.buzz > b0 && s.feed[0].stars === 2 && s.rating < 4);
      assert.ok(s.drama.flags["rep-phot"] && s.drama.queue.some((q) => q.id === "R04"));
      assert.ok(R.fx.some((x) => /→/.test(x)), "hiện đánh giá trước → sau");
    }
    assert.ok(s.drama.flags["rep-cuc"], "mẹ có thể đọc được (R07)");
  }
  assert.deepEqual([...got].sort(), ["phot", "viral"]);
});

test("hiền an toàn (không phốt, không review cư dân mạng), meme lầy lên xuống độ hot, sale ra khách quay lại / khách ca sau nhưng có người phiền", () => {
  const kinds = { hien: new Set(), lay: new Set(), sale: new Set() };
  for (let seed = 1; seed <= 30; seed++) {
    for (const [p, kind] of [["hien", "hien-meme"], ["lay", "lay-meme"], ["sale", "sale-combo"]]) {
      const s = shopWith(p, seed);
      const r = rv({ stars: 3, reason: "ok" });
      s.feed = [r];
      const n0 = s.feed.length;
      act(s, { type: "reply", id: r.id, kind });
      kinds[p].add(s.feed.find((x) => x.id === r.id).reply.outcome);
      if (p === "hien") assert.equal(s.feed.length, n0);
      if (p === "sale") assert.ok(s.drama.nextGuests >= 1 && s.drama.demand === "tra-dao");
    }
  }
  assert.ok(!kinds.hien.has("phot") && !kinds.hien.has("viral"));
  assert.ok(kinds.lay.has("viral") && kinds.lay.has("flop"));
  assert.ok(kinds.sale.has("sold") && kinds.sale.has("annoyed"));
});

test("xin lỗi theo tính cách giữ cơ chế lời hứa (chỉ review có lỗi thật)", () => {
  for (const p of PERSONA_IDS) {
    const s = shopWith(p);
    const a = rv({ stars: 2, reason: "noLid" }), b = rv({ stars: 3, reason: "ok" });
    s.feed = [a, b];
    const sorry = replyOptions(s, a).find((o) => o.promise);
    assert.ok(sorry, p + " có lựa chọn xin lỗi");
    act(s, { type: "reply", id: a.id, kind: sorry.id });
    assert.equal(s.promises.length, 1, p);
    assert.equal(s.feed[0].reply.outcome, "promise");
    const sb = replyOptions(s, b).find((o) => o.promise);
    if (sb) { act(s, { type: "reply", id: b.id, kind: sb.id }); assert.equal(s.promises.length, 1, "không lỗi thật thì không hứa"); assert.notEqual(s.feed[1].reply.outcome, "promise"); }
  }
});

test("khách quay lại: mời / thách / mã giảm ⇒ ca sau có khách đó tới sớm, câu gọi món theo tính cách, có tip", () => {
  const s = shopWith("cucsuc", 9);
  const r = rv({ stars: 2, reason: "sugarHigh", name: "Anh Hải" });
  s.feed = [r];
  act(s, { type: "reply", id: r.id, kind: "cuc-dare" });
  assert.equal(s.returning.length, 1);
  assert.ok(s.feed[0].reply.fx.some((x) => /Anh Hải quay lại/.test(x)));
  assert.ok(s.drama.flags["rep-back"]);
  clearDrama(s);
  act(s, { type: "startShift" });
  s.shift.drama.max = 0;
  assert.equal(s.returning.length, 0);
  const g = s.shift.schedule.find((x) => x.name === "Anh Hải");
  assert.ok(g && g.tag === "back" && g.tip === 3 && RETURN_LINES.cucsuc.includes(g.line));
  advance(s, g.at + 3000);
  const c = s.shift.customers.find((x) => x.name === "Anh Hải");
  assert.ok(c && !/\{\w+\}/.test(c.orderLine) && c.orderLine.includes("đường"), c?.orderLine);
});

test("mã giảm / ly mời trừ tiền trước; không đủ tiền thì không chọn được", () => {
  const s = shopWith("hien");
  const r = rv({ stars: 5, reason: "good" });
  s.feed = [r];
  s.money = 5;
  assert.equal(err(s, { type: "reply", id: r.id, kind: "hien-invite" }), "money");
  s.money = 50;
  act(s, { type: "reply", id: r.id, kind: "hien-invite" });
  assert.equal(s.money, 40);
  assert.ok(s.feed[0].reply.fx[0] === "−10k");
});

test("sự kiện R01–R10: cấu trúc, có câu theo tính cách, mở được khi có cờ của câu trả lời, mỗi sự kiện có đường tới từ trả lời", () => {
  assert.ok(EVENTS_REPLY.length >= 8);
  const reach = new Set(["R09"]); // R09 / R10: cờ rep-flip do đổi tính nhiều lần
  for (const L of Object.values(REPLY_OPTIONS)) for (const o of L) for (const x of o.out.roll ? [o.out.roll.win, o.out.roll.lose] : [o.out]) {
    if (x.fx.event) reach.add(x.fx.event.id);
    for (const f of [].concat(x.fx.flag || [])) for (const ev of EVENTS_REPLY) if (ev.if.flags.includes(f)) reach.add(ev.id);
  }
  reach.add("R07"); reach.add("R10"); // rep-cuc: mọi câu trả lời cục súc; rep-flip
  for (const ev of EVENTS_REPLY) {
    assert.ok(reach.has(ev.id), ev.id + " không có đường tới");
    assert.ok(ev.if.flags.every((f) => f.startsWith("rep-")));
    assert.ok(Object.values(ev.nodes).some((n) => n.meBy || n.choices.some((c) => c.sayBy)) || ev.id === "R08", ev.id + " có câu theo tính cách");
  }
  // mở được ngay khi cờ đang bật (giữa hai ca và trong ca)
  for (const ev of EVENTS_REPLY) {
    const s = shopWith("lay", 3);
    for (const f of ev.if.flags) s.drama.flags[f] = s.day + 3;
    if (ev.when === "shift") {
      act(s, { type: "startShift" }); s.shift.drama.max = 0;
      advance(s, 16000);
    }
    assert.ok(eligibleNow(s, ev), ev.id + " chưa mở được");
    assert.ok(openEvent(s, ev.id).ok, ev.id);
    assert.ok(currentEvent(s));
  }
});

test("hẹn sự kiện từ câu trả lời tới đúng hạn: phốt giữa hai ca ⇒ R04 mở sau ca kế tiếp; trend ⇒ R02 trong ca kế tiếp", () => {
  for (let seed = 1; seed <= 40; seed++) {
    const s = shopWith("cucsuc", seed);
    s.drama.queue = [];
    const r = rv({ stars: 2, reason: "sugarHigh" });
    s.feed = [r];
    act(s, { type: "reply", id: r.id, kind: "cuc-truth" });
    if (s.feed.find((x) => x.id === r.id).reply.outcome !== "phot") continue;
    const q = s.drama.queue.find((x) => x.id === "R04");
    clearDrama(s);
    act(s, { type: "startShift" });
    s.shift.drama.max = 0;
    advance(s, 400000);
    assert.ok(q && q.day === s.day + 1, "hẹn sau ca kế tiếp");
    if (currentEvent(s)?.id === "R04") { assert.ok(!s.drama.queue.some((x) => x.id === "R04"), "mở sớm thì bỏ hẹn"); return; }
    clearDrama(s); act(s, { type: "startShift" }); s.shift.drama.max = 0; advance(s, 400000);
    assert.equal(currentEvent(s)?.id, "R04");
    return;
  }
  assert.fail("không có lần phốt nào");
});

test("drama theo tính cách: lựa chọn có sayBy dùng câu riêng; bảng hậu quả có câu kèm theo tính cách", () => {
  const s = shopWith("cucsuc", 4);
  s.drama.flags["rep-viral"] = s.day + 3;
  openEvent(s, "R01");
  const r = act(s, { type: "choose", choice: "pin" });
  const e = r.events.find((x) => x.type === "dramaResolved");
  assert.equal(e.say, EVENT.R01.nodes.start.choices[0].sayBy.cucsuc);
  assert.ok(PERSONA_ASIDE.cucsuc.includes(e.aside));
  const t = shop(4); t.drama.flags["rep-viral"] = t.day + 3; openEvent(t, "R01");
  const e2 = act(t, { type: "choose", choice: "pin" }).events.find((x) => x.type === "dramaResolved");
  assert.equal(e2.aside, null, "chưa chọn tính cách: không có câu kèm");
});

test("không lặp câu trả lời trong cùng một ca / cùng một buổi giữa hai ca", () => {
  for (const inShift of [false, true]) {
    const s = shopWith("hien", 21);
    if (inShift) { act(s, { type: "startShift" }); s.shift.drama.max = 0; }
    s.feed = Array.from({ length: 8 }, () => rv({ stars: 5, reason: "good" }));
    for (const r of s.feed) act(s, { type: "reply", id: r.id, kind: "hien-thanks" });
    const texts = s.feed.map((r) => r.reply.text);
    assert.equal(new Set(texts).size, texts.length, (inShift ? "trong ca: " : "giữa hai ca: ") + texts.join(" | "));
  }
});

test("Nhật Ký: câu trả lời lên mạng / dính phốt thành câu chốt ca + khoảnh khắc đầu thẻ; ngày đổi tính nhiều có câu riêng", () => {
  const base = { cups: 8, lost: 0, profit: 90, avgStars: 4.2, multi: 0, followersDelta: 0, moments: [], drama: [] };
  assert.equal(captionKind({ ...base, moments: [{ kind: "reply", outcome: "viral", line: "x" }] }), "replyViral");
  assert.equal(captionKind({ ...base, moments: [{ kind: "reply", outcome: "phot", line: "x" }] }), "replyPhot");
  assert.equal(captionKind({ ...base, moments: [{ kind: "flip", line: "x" }] }), "flip");
  assert.equal(captionKind({ ...base, moments: [{ kind: "reply", outcome: "warm", line: "x" }] }), "good");
  const ms = journalMoments({ ...base, moments: [{ kind: "drama", name: "A", line: "drama" }, { kind: "reply", outcome: "phot", name: "Chủ tiệm trả lời B", line: "câu gắt" }] });
  assert.equal(ms[0].line, "câu gắt");
  // trả lời giữa hai ca sửa câu chốt ca vừa xong + nhật ký
  for (let seed = 1; seed <= 30; seed++) {
    const s = shopWith("lay", seed);
    s.lastSummary = { day: 2, cups: 5, avgStars: 4, followersDelta: 2, moments: [], headline: "cũ" };
    s.journal = [{ day: 2, cups: 5, profit: 1, avgStars: 4, headline: "cũ", moment: "" }];
    const r = rv({ stars: 5, reason: "good" });
    s.feed = [r];
    act(s, { type: "reply", id: r.id, kind: "lay-trend" });
    const R = s.feed[0].reply;
    assert.ok(s.lastSummary.moments.some((m) => m.kind === "reply" && m.line === R.text));
    if (R.outcome !== "viral") continue;
    assert.ok(fromTpl(CAPTIONS_REPLY.viral, s.lastSummary.headline), s.lastSummary.headline);
    assert.equal(s.journal[0].moment, R.text);
    return;
  }
  assert.fail("không có lần viral");
});

test("trả lời trong ca: khoảnh khắc vào ca, câu chốt ca theo câu trả lời nổi bật", () => {
  for (let seed = 1; seed <= 30; seed++) {
    const s = shopWith("cucsuc", seed);
    act(s, { type: "startShift" }); s.shift.drama.max = 0;
    const r = rv({ stars: 2, reason: "iceHigh" });
    s.feed = [r];
    act(s, { type: "reply", id: r.id, kind: "cuc-truth" });
    advance(s, 400000);
    const S = s.lastSummary;
    assert.ok(S.moments.some((m) => m.kind === "reply"));
    const k = s.feed.find((x) => x.id === r.id).reply.outcome === "viral" ? "viral" : "phot";
    if (S.profit < 0) continue;
    assert.ok(fromTpl(CAPTIONS_REPLY[k], S.headline), S.headline);
    return;
  }
});

test("bản lưu v2 → v3: chép bản cũ sang khoá dự phòng, trả lời cũ giữ câu, chưa có tính cách (hỏi một lần), dữ liệu khác giữ nguyên", () => {
  assert.equal(SAVE_VERSION, 4);
  assert.ok(MIGRATIONS[2]);
  const s = shop(8);
  s.introSeen = true; s.tutorialDone = true; s.money = 321; s.day = 6; s.followers = 77;
  s.feed = [rv({ stars: 4, reason: "good" }), rv({ stars: 2, reason: "noLid" }), rv({ stars: 3, reason: "ok" })];
  const old = JSON.parse(dump(s));
  old.v = 2;
  delete old.owner; delete old.returning; delete old.usedDay;
  old.feed[0].reply = "meme"; old.feed[1].reply = "sorry"; old.feed[2].reply = null;
  const raw = JSON.stringify(old);
  const mem = new Mem();
  mem.setItem(KEY, raw);
  const st = shopSave(mem);
  const a = st.read(1);
  assert.equal(a.migrated, 2);
  assert.equal(mem.getItem(backupKey(2)), raw, "bản v2 nguyên văn");
  const t = a.state;
  assert.equal(t.v, SAVE_VERSION);
  assert.equal(t.money, 321); assert.equal(t.day, 6); assert.equal(t.followers, 77);
  assert.equal(t.owner.persona, null);
  assert.equal(t.feed[0].reply.outcome, "legacy");
  assert.match(t.feed[0].reply.text, /im lặng 3 giây/);
  assert.equal(t.feed[1].reply.kind, "legacy-sorry");
  assert.equal(t.feed[2].reply, null);
  assert.deepEqual(t.returning, []);
  st.write(t);
  assert.equal(JSON.parse(mem.getItem(KEY)).v, SAVE_VERSION);
  assert.equal(mem.getItem(backupKey(2)), raw);
  // bản đã nâng: chọn tính cách rồi trả lời tiếp review chưa trả lời
  act(t, { type: "setPersona", persona: "sale" });
  act(t, { type: "reply", id: t.feed[2].id, kind: "sale-combo" });
  assert.ok(t.feed[2].reply.text.length > 10);
  // bản lưu lạ: kẹp
  const bad = JSON.parse(dump(t));
  bad.owner = { persona: "ninja", switches: [{ day: "x", from: "a", to: "b" }] };
  bad.feed[0].reply = { text: 42 };
  bad.returning = [{ name: 5, arch: "?", recipe: "?", day: -1 }];
  const c = loadSave(JSON.stringify(bad));
  assert.equal(c.owner.persona, null);
  assert.deepEqual(c.owner.switches, []);
  assert.equal(c.feed[0].reply, null);
  assert.equal(c.returning[0].arch, "hoc-sinh");
});

test("chơi trọn: trả lời review sau chốt ca, ca sau khách quay lại, sổ vẫn hợp lệ qua tải lại", () => {
  const s = shopWith("sale", 13);
  clearDrama(s);
  act(s, { type: "startShift" }); s.shift.drama.max = 0;
  for (let i = 0; i < 4 && s.shift; i++) { try { serveRight(s, untilWaiting(s, 60000)); } catch { break; } }
  advance(s, 400000);
  for (const r of s.feed.filter((x) => !x.reply)) {
    const o = replyOptions(s, r)[0];
    act(s, { type: "reply", id: r.id, kind: o.id });
  }
  assert.ok(s.feed.every((r) => r.reply));
  const back = loadSave(dump(s));
  assert.deepEqual(back.feed, s.feed);
  assert.deepEqual(back.owner, s.owner);
  assert.ok(NET_HANDLES.length >= 8);
});
