import { test } from "node:test";
import assert from "node:assert/strict";
import { createRun, apply, invariants, nextHint, scoreOf, sanitizeRun, hotspotsAt, topicsOf, textOf, MAX_CRED } from "../core/engine.js";
import { segments, plain, pickFrom } from "../core/text.js";
import mini from "./fixtures/mini-case.js";

const run = (s, ...acts) => { for (const a of acts) { const r = apply(mini, s, a); assert.equal(r.error, null, JSON.stringify(a) + " ⇒ " + r.error); s = r.s; } return s; };
const start = () => run(createRun(mini, 5), { type: "intro" });

test("tạo vụ: địa điểm start, người start, bảng trống, bất biến sạch", () => {
  const s = createRun(mini, 1);
  assert.deepEqual(s.locs, ["xe"]);
  assert.deepEqual(s.people.sort(), ["an", "binh", "chu"]);
  assert.deepEqual(s.board, { ai: { a: null } });
  assert.equal(s.cred, MAX_CRED);
  assert.deepEqual(invariants(mini, s), []);
});

test("intro ⇒ vào địa điểm đầu, hiện lời dẫn một lần", () => {
  const r = apply(mini, createRun(mini, 1), { type: "intro" });
  assert.equal(r.s.phase, "play");
  assert.equal(r.show[0].who, "narr");
  const again = apply(mini, r.s, { type: "go", loc: "xe" });
  assert.equal(again.show.length, 0);
});

test("hành động sai không đổi state (trả nguyên bản cũ + error)", () => {
  const s = start();
  for (const a of [{ type: "go", loc: "khong-co" }, { type: "examine", id: "tui" }, { type: "ask", pid: "an", topic: "x" }, { type: "contradict", stmt: "an-khong-an", clue: "muong" }, { type: "commit" }, { type: "accuse" }, { type: "rebut", clue: "muong" }, { type: "bay" }]) {
    const r = apply(mini, s, a);
    assert.ok(r.error, JSON.stringify(a));
    assert.equal(r.s, s);
  }
});

test("soi điểm: lần đầu nhặt vật chứng + hiện thẻ, lần sau chỉ thoại; điểm có điều kiện ẩn tới khi có lời khai", () => {
  let s = start();
  assert.deepEqual(hotspotsAt(mini, s).map((h) => h.id), ["hu-pate", "ghe"]);
  const r = apply(mini, s, { type: "examine", id: "hu-pate" });
  assert.deepEqual(r.s.clues, ["muong"]);
  assert.deepEqual(r.show.map((x) => x.t), ["line", "clue"]);
  assert.ok(r.ev.some((e) => e.type === "clue"));
  const r2 = apply(mini, r.s, { type: "examine", id: "hu-pate" });
  assert.deepEqual(r2.show.map((x) => x.t), ["line"]);
  s = run(r.s, { type: "ask", pid: "an", topic: "pate" });
  assert.ok(hotspotsAt(mini, s).some((h) => h.id === "tui"));
  assert.equal(topicsOf(mini, s, "an")[0].asked, true);
});

test("nhặt từ khoá khi chữ được đọc (read), không nhặt từ lạ", () => {
  let s = start();
  const r = apply(mini, s, { type: "read", text: "Muỗng dính [[pate]] và [[khong-co]]" });
  assert.deepEqual(r.s.words, ["pate"]);
  assert.deepEqual(r.ev, [{ type: "word", id: "pate" }]);
  assert.equal(apply(mini, r.s, { type: "read", text: "[[pate]]" }).ev.length, 0);
  assert.equal(textOf(mini, { t: "clue", id: "muong" }), mini.clues.muong.desc);
});

test("vạch mâu thuẫn: sai mất uy tín + câu đáp; đúng thì bể + gives", () => {
  let s = run(start(), { type: "examine", id: "hu-pate" }, { type: "ask", pid: "an", topic: "pate" });
  const w = apply(mini, s, { type: "contradict", stmt: "an-khong-an", clue: "muong" });
  assert.equal(w.s.cred, 4);
  assert.equal(w.s.credLost, 1);
  assert.equal(w.show[0].who, "an");
  s = run(w.s, { type: "examine", id: "tui" });
  const ok = apply(mini, s, { type: "contradict", stmt: "an-khong-an", clue: "muong-an" });
  assert.deepEqual(ok.s.broke, ["an-khong-an"]);
  assert.ok(ok.s.flags.includes("an-nhan"));
  assert.equal(ok.s.cred, 4);
  assert.ok(apply(mini, ok.s, { type: "contradict", stmt: "an-khong-an", clue: "muong-an" }).error, "bể rồi không bể lại");
});

test("hết uy tín: Tèo can, hồi về 1, đếm lần can, tối đa 2★", () => {
  let s = run(start(), { type: "examine", id: "hu-pate" }, { type: "ask", pid: "an", topic: "pate" });
  for (let i = 0; i < 5; i++) s = run(s, { type: "contradict", stmt: "an-khong-an", clue: "muong" });
  assert.equal(s.cred, 1);
  assert.equal(s.rescues, 1);
  assert.equal(s.credLost, 5);
  assert.ok(scoreOf(s).stars <= 2);
});

test("đưa vật chứng cho người: câu riêng nếu có, không thì câu chung; không mất uy tín", () => {
  const s = run(start(), { type: "examine", id: "hu-pate" });
  const r = apply(mini, s, { type: "present", pid: "binh", clue: "muong" });
  assert.match(r.show[0].text, /ăn chay/);
  const r2 = apply(mini, s, { type: "present", pid: "an", clue: "muong" });
  assert.equal(r2.show[0].who, "an");
  assert.equal(r2.s.cred, 5);
});

test("bảng suy luận: điền đúng loại, chốt chỉ báo số chỗ sai, đúng thì mở vạch mặt", () => {
  let s = run(start(), { type: "read", text: "[[an]] [[binh]] [[pate]]" });
  assert.ok(apply(mini, s, { type: "fill", ded: "ai", blank: "a", word: "pate" }).error, "sai loại");
  assert.ok(apply(mini, s, { type: "commit" }).error, "chưa điền đủ");
  s = run(s, { type: "fill", ded: "ai", blank: "a", word: "binh" });
  const w = apply(mini, s, { type: "commit" });
  assert.deepEqual(w.ev, [{ type: "boardWrong", n: 1 }]);
  assert.equal(w.s.wrongBoard, 1);
  s = run(w.s, { type: "fill", ded: "ai", blank: "a", word: "an" }, { type: "commit" });
  assert.equal(s.solved, true);
  assert.ok(apply(mini, s, { type: "fill", ded: "ai", blank: "a", word: "binh" }).error, "đã chốt thì khoá");
});

test("vạch mặt: đưa sai mất uy tín + nhắc lại câu chối; đúng hết thì kết vụ + ★", () => {
  let s = run(start(), { type: "examine", id: "hu-pate" }, { type: "ask", pid: "an", topic: "pate" }, { type: "examine", id: "tui" }, { type: "read", text: "[[an]]" }, { type: "fill", ded: "ai", blank: "a", word: "an" }, { type: "commit" }, { type: "accuse" });
  assert.equal(s.phase, "finale");
  const w = apply(mini, s, { type: "rebut", clue: "muong" });
  assert.equal(w.s.cred, 4);
  assert.equal(w.s.fin.step, 0);
  s = run(w.s, { type: "rebut", clue: "muong-an" });
  assert.equal(s.phase, "done");
  assert.deepEqual(s.result.stars, 3); // phạt 1
  s = run(s, { type: "bonus", id: "b1", choice: 0 });
  assert.equal(s.bonus.b1, 0);
  assert.ok(apply(mini, s, { type: "bonus", id: "b1", choice: 1 }).error);
});

test("gợi ý Tèo: chọn gợi ý đầu tiên có điều kiện đạt, ưu tiên câu chưa nói; `done` loại gợi ý đã xong; tính phạt theo gợi ý mới", () => {
  let s = start();
  assert.equal(nextHint(mini, s).text, "Hỏi An xem.");
  s = run(s, { type: "hint" }, { type: "hint" });
  assert.equal(s.hints.length, 1);
  s = run(s, { type: "ask", pid: "an", topic: "pate" });
  assert.match(nextHint(mini, s).text, /soi lại xe/);
  const c = structuredClone(mini);
  c.hints[0].done = "clue:muong-an";
  s = run(s, { type: "examine", id: "tui" });
  assert.equal(nextHint(c, s).text, "Hỏi An xem.");
  // suy ra "đã xong": gợi ý về lời khai đã bể thì bỏ qua
  const c2 = structuredClone(mini);
  c2.hints[0].needs = "stmt:an-khong-an";
  assert.match(nextHint(c2, s).text, /soi lại xe/);
  s = run(s, { type: "contradict", stmt: "an-khong-an", clue: "muong-an" });
  assert.equal(nextHint(c2, s).text, "Hỏi An xem.");
});

test("needs phủ định ẩn điểm soi khi điều kiện đã đạt; break.also cũng bể được", () => {
  const c = structuredClone(mini);
  c.locations.xe.hotspots[1].needs = "!stmt:an-khong-an";
  c.stmts["an-khong-an"].break.also = ["muong"];
  const ap = (s, a) => { const r = apply(c, s, a); assert.equal(r.error, null); return r.s; };
  let s = ap(createRun(c, 2), { type: "intro" });
  assert.ok(hotspotsAt(c, s).some((h) => h.id === "ghe"));
  s = ap(ap(s, { type: "examine", id: "hu-pate" }), { type: "ask", pid: "an", topic: "pate" });
  assert.ok(!hotspotsAt(c, s).some((h) => h.id === "ghe"));
  s = ap(s, { type: "contradict", stmt: "an-khong-an", clue: "muong" });
  assert.deepEqual(s.broke, ["an-khong-an"]);
  assert.equal(s.cred, 5);
});

test("★ theo điểm phạt", () => {
  const base = { credLost: 0, wrongBoard: 0, hints: [], rescues: 0 };
  assert.equal(scoreOf(base).stars, 3);
  assert.equal(scoreOf({ ...base, credLost: 2 }).stars, 3);
  assert.equal(scoreOf({ ...base, credLost: 2, wrongBoard: 1 }).stars, 2);
  assert.equal(scoreOf({ ...base, credLost: 3, hints: [1, 2, 3] }).stars, 1);
  assert.equal(scoreOf({ ...base, rescues: 1 }).stars, 2);
});

test("pickFrom không lặp liên tiếp và tất định theo hạt", () => {
  const s = { rng: 9, pick: {} };
  let last = null;
  for (let i = 0; i < 200; i++) { const x = pickFrom(s, "k", [1, 2, 3]); assert.notEqual(x, last); last = x; }
  const a = { rng: 3, pick: {} }, b = { rng: 3, pick: {} };
  assert.deepEqual([1, 2, 3, 4].map(() => pickFrom(a, "x", "abcd")), [1, 2, 3, 4].map(() => pickFrom(b, "x", "abcd")));
});

test("segments: [[id]] và [[id|chữ khác]], từ lạ hiện thô", () => {
  const W = { pate: { text: "pate" } };
  assert.deepEqual(segments("Mất [[pate]] và [[pate|bơ gan]] với [[la]]", W), [
    { t: "text", v: "Mất " }, { t: "word", id: "pate", v: "pate" }, { t: "text", v: " và " }, { t: "word", id: "pate", v: "bơ gan" }, { t: "text", v: " với " }, { t: "text", v: "la" },
  ]);
  assert.equal(plain("[[pate|bơ]]!", W), "bơ!");
});

test("sanitizeRun: giữ tiến độ hợp lệ, bỏ id lạ, kẹp uy tín, bản hỏng ⇒ null", () => {
  let s = run(start(), { type: "examine", id: "hu-pate" }, { type: "ask", pid: "an", topic: "pate" });
  const raw = JSON.parse(JSON.stringify(s));
  raw.clues.push("da-xoa"); raw.cred = 99; raw.words.push("la");
  const t = sanitizeRun(mini, raw);
  assert.deepEqual(t.clues, ["muong"]);
  assert.equal(t.cred, 5);
  assert.deepEqual(t.stmts, ["an-khong-an"]);
  assert.equal(sanitizeRun(mini, { id: "khac" }), null);
  assert.equal(sanitizeRun(mini, null), null);
  const f = sanitizeRun(mini, { ...raw, phase: "finale", solved: true });
  assert.equal(f.phase, "play", "chưa điền bảng thì không ở vạch mặt");
});

test("TTH-02: bản lưu cũ đang dở Vụ 1 (bảng 11 chỗ, từ khoá soi / từ khoá) vẫn đọc được, vụ giải tiếp ra 3★", async () => {
  const { default: c1 } = await import("../data/cases/noi-thit-kho.js");
  const { nextAction } = await import("../core/solver.js");
  // bản lưu tạo bằng file vụ CŨ: có từ khoá đã bỏ + chỗ trống đã bỏ (moc-gio.a, tuan-noi-doi.a, ai-noi-doi.b/c, thu-pham.d)
  const oldBoard = { "moc-gio": { a: "22h30", b: "23h30" }, "tuan-noi-doi": { a: "khong-xuong-bep", b: "sa-te" }, "ai-noi-doi": { a: "ongsau", b: "ngu-som", c: "23h52" }, "thu-pham": { a: "linh", b: "san-thuong", c: "quay-live", d: "cau-view" } };
  const words = ["thit-kho", "9h-toi", "soi", "tu-khoa", "22h30", "23h30", "khong-xuong-bep", "sa-te", "ongsau", "ngu-som", "23h52", "linh", "san-thuong", "quay-live", "cau-view"];
  const base = { v: 1, id: c1.id, loc: "rooftop", visited: ["kitchen", "hallway", "rooftop"], locs: ["kitchen", "hallway", "rooftop"], people: ["cohai", "tuan", "linh", "ongsau"], clues: ["vet-nuoc-mau"], words, stmts: [], broke: [], talk: [], seen: ["kitchen.bep-ga"], flags: [], hints: [],
    cred: 5, credLost: 0, rescues: 0, wrongBoard: 0, wrongPresent: 0, finaleWrong: 0, fin: { step: 0 }, bonus: {}, result: null, rng: 7, pick: {} };
  // đang điều tra, bảng điền dở
  const s1 = sanitizeRun(c1, { ...base, phase: "play", board: oldBoard, solved: false });
  assert.ok(s1, "đọc được");
  assert.equal(s1.phase, "play");
  assert.ok(!s1.words.includes("soi") && !s1.words.includes("tu-khoa"));
  assert.deepEqual(s1.board, { "moc-gio": { b: "23h30" }, "tuan-noi-doi": { b: "sa-te" }, "ai-noi-doi": { a: "ongsau" }, "thu-pham": { a: "linh", b: "san-thuong", c: "quay-live" } });
  assert.deepEqual(invariants(c1, s1), []);
  // đã chốt bảng cũ, đang vạch mặt ⇒ giữ nguyên chỗ đang đứng
  const s2 = sanitizeRun(c1, { ...base, phase: "finale", board: oldBoard, solved: true, fin: { step: 1 } });
  assert.ok(s2 && s2.solved && s2.phase === "finale" && s2.fin.step === 1);
  // đang nghe intro (bản cũ dài) ⇒ phát intro mới từ đầu
  const s3 = sanitizeRun(c1, { ...base, phase: "intro", loc: "kitchen", locs: ["kitchen"], visited: [], board: {}, solved: false });
  assert.ok(s3 && s3.phase === "intro");
  // từ bản lưu dở vẫn giải trọn ra 3★
  let s = s1;
  for (let i = 0, a; i < 3000 && (a = nextAction(c1, s)); i++) {
    const r = apply(c1, s, a); assert.equal(r.error, null, JSON.stringify(a));
    s = r.s; const texts = r.show.map((it) => textOf(c1, it)).filter(Boolean); if (texts.length) s = apply(c1, s, { type: "read", texts }).s;
  }
  assert.equal(s.phase, "done"); assert.equal(s.result.stars, 3);
});

test("TTH-02: Vụ 1 bật sẵn Chế độ soi, bảng ≤ 6 chỗ trống, intro ≤ 6 dòng, không còn chip 'soi' / 'từ khoá'", async () => {
  const { default: c1 } = await import("../data/cases/noi-thit-kho.js");
  assert.equal(c1.soiOn, true);
  const blanks = c1.deduction.reduce((n, d) => n + Object.keys(d.blanks).length, 0);
  assert.ok(blanks >= 5 && blanks <= 6, "chỗ trống " + blanks);
  assert.ok(c1.intro.length <= 6, "intro " + c1.intro.length);
  assert.ok(c1.locations.kitchen.intro.length <= 1);
  assert.ok(!c1.words.soi && !c1.words["tu-khoa"]);
});

test("TTH2-04 (D11): Vụ 1 mỗi chỗ trống bày ≤ 6 chip; choices (nếu có) chứa đáp án, cùng loại; thú nhận / kết gọn", async () => {
  const { default: c1 } = await import("../data/cases/noi-thit-kho.js");
  for (const d of c1.deduction) for (const [b, spec] of Object.entries(d.blanks)) {
    const pool = spec.choices || Object.keys(c1.words).filter((w) => c1.words[w].kind === spec.kind);
    assert.ok(pool.length <= 6, `${d.id}.${b}: ${pool.length} chip`);
    if (spec.choices) {
      assert.ok(spec.choices.includes(spec.answer), `${d.id}.${b}: choices thiếu đáp án`);
      for (const w of spec.choices) assert.equal(c1.words[w]?.kind, spec.kind, `${d.id}.${b}: ${w}`);
    }
  }
  assert.ok(c1.finale.confess.length <= 6 && c1.finale.epilogue.length <= 8, `${c1.finale.confess.length} / ${c1.finale.epilogue.length}`);
});
