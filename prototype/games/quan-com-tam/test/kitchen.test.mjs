// Nồi cơm theo mẻ (gạo tấm), mỡ hành, chảo trứng; bày dĩa xếp lớp (thứ tự tối thiểu, trừ kho đúng một lần, hoàn tác / đổ dĩa tính hao); phiếu biến thể.
import test from "node:test";
import assert from "node:assert/strict";
import { freshRice, startCook, tickRice, takeRice, cookNow, eggState, startEgg, takeEgg, makeJar } from "../core/rice.js?v=c1";
import { targetOf, plateFrames, nextStep } from "../core/plate.js?v=c1";
import { apply, must, openWithOrder, home, cookedPiece, until, newGame } from "./helpers.mjs";

test("nồi cơm: Nấu lấy gạo tấm bù đầy nồi, 40 giây sau mới xới được; hết gạo ⇒ lỗi", () => {
  const s = newGame(1);
  s.stock["gao-tam"] = 7;
  const r = freshRice(3);
  const ev = [];
  assert.ok(startCook(s, r, 0, ev).ok);
  assert.equal(s.stock["gao-tam"], 0, "lấy 7 phần (đủ chỗ 9)");
  assert.equal(takeRice(r, 4).err, "rice-cooking");
  tickRice(r, 39999, ev); assert.equal(r.n, 3);
  tickRice(r, 40000, ev); assert.equal(r.n, 10);
  assert.ok(ev.some((e) => e.type === "riceReady"));
  assert.equal(startCook(s, r, 41000).err, "no-gao");
  const full = freshRice(12);
  assert.equal(startCook(s, full, 0).err, "rice-full");
  s.stock["gao-tam"] = 20;
  const prep = freshRice(0);
  assert.ok(cookNow(s, prep).ok);
  assert.equal(prep.n, 12, "mẻ đầu ở Chuẩn bị: đầy nồi ngay");
});

test("mỡ hành: một bộ ⇒ hũ 20 phần; trứng: sống < 6 · lòng đào 6–9 · vừa 9–13 · kỹ 13–18 · cháy", () => {
  const s = newGame(1);
  s.stock["mo-hanh-bo"] = 1;
  assert.ok(makeJar(s).ok);
  assert.equal(s.moHanh.n, 20);
  assert.equal(makeJar(s).err, "no-mo-hanh-bo");
  s.stock.trung = 1;
  const pan = { egg: null };
  assert.ok(startEgg(s, pan, 0).ok);
  assert.deepEqual([3000, 7000, 10000, 15000, 19000].map((t) => eggState(pan, t)), ["raw", "runny", "set", "hard", "burnt"]);
  assert.equal(takeEgg(pan, 3000).err, "egg-raw");
  assert.equal(takeEgg(pan, 7500).state, "runny");
});

test("mục tiêu phiếu theo biến thể: thêm cơm, không / thêm mỡ hành, mắm để riêng, không đồ chua, cháy cạnh, mang về bắt buộc bịch", () => {
  const t = (quirks, extra = {}) => targetOf({ dish: "com-suon", quirks, ...extra });
  assert.equal(t(["themCom"]).com, 2);
  assert.equal(t(["khongMoHanh"]).moHanh, 0);
  assert.equal(t(["themMoHanh"]).moHanh, 2);
  assert.equal(t(["riengNuocMam"]).sauce, "chen");
  assert.equal(t([]).sauce, "any");
  assert.equal(t(["khongDoChua"]).doChua, false);
  assert.equal(t(["chayCanh"]).charred, true);
  assert.equal(t([], { takeaway: true }).sauce, "bich");
  assert.equal(t([], { takeaway: true }).kind, "hop");
  assert.equal(targetOf({ dish: "com-suon-bi", quirks: ["khongBi"] }).bi, false);
  assert.equal(targetOf({ dish: "com-suon-trung", quirks: ["longDao"] }).trung, "runny");
  assert.equal(targetOf({ dish: "com-chay", quirks: [] }).moHanh, 0, "chay dùng hành phi");
});

test("bày dĩa: phải có dĩa trước, xới cơm trước khi đặt món; mỗi lớp trừ kho đúng một lần; dĩa lớn dần theo plate-layers", () => {
  const { s, t } = openWithOrder(3);
  home(s);
  must(s, { type: "pin", tk: t.id });
  assert.equal(apply(s, { type: "layer", id: "com" }).err, "need-container");
  const plates0 = s.shift.cleanPlates, rice0 = s.shift.rice.n, mo0 = s.moHanh.n, dc0 = s.stock["do-chua"], nm0 = s.stock["nuoc-mam"];
  must(s, { type: "layer", id: "dia" });
  assert.equal(apply(s, { type: "layer", id: "doChua" }).err, "need-com");
  must(s, { type: "layer", id: "com" });
  must(s, { type: "layer", id: "moHanh" });
  cookedPiece(s, 4);
  must(s, { type: "layer", id: "meat" });
  must(s, { type: "layer", id: "doChua" });
  must(s, { type: "layer", id: "duaLeo" });
  must(s, { type: "layer", id: "sauce" });
  const p = s.shift.slots[0].plate;
  assert.equal(s.shift.cleanPlates, plates0 - 1);
  assert.equal(s.shift.rice.n, rice0 - 1);
  assert.equal(s.moHanh.n, mo0 - 1);
  assert.equal(s.stock["do-chua"], dc0 - 1);
  assert.equal(s.stock["nuoc-mam"], nm0 - 1);
  assert.deepEqual(plateFrames(p), ["plate-dia", "com", "mo-hanh", "suon-done", "do-chua", "dua-leo", "ca-chua", "nuoc-mam-chan"]);
  assert.equal(s.shift.grill.slots[4], null, "miếng đã gắp khỏi vỉ");
  assert.equal(apply(s, { type: "layer", id: "dia" }).err, "has-container");
});

test("hoàn tác: miếng sườn quay về vùng giữ ấm; lớp đã bỏ tính hao; đổ dĩa ⇒ dĩa vào thau rửa", () => {
  const { s, t } = openWithOrder(4);
  home(s);
  must(s, { type: "pin", tk: t.id });
  must(s, { type: "layer", id: "dia" }); must(s, { type: "layer", id: "com" });
  cookedPiece(s, 5);
  must(s, { type: "layer", id: "meat" });
  must(s, { type: "undo" });
  assert.equal(s.shift.grill.slots[4]?.item ?? s.shift.grill.slots[5]?.item, "suon");
  const w0 = s.shift.stats.wasteCost;
  must(s, { type: "undo" });
  assert.ok(s.shift.stats.wasteCost > w0, "vá cơm bỏ đi tính hao");
  const dirty0 = s.shift.dirty;
  must(s, { type: "discard" });
  assert.equal(s.shift.dirty, dirty0 + 1);
  assert.equal(s.shift.slots[0].plate, null);
});

test("bước kế tiếp theo phiếu (phím Space): dĩa → cơm → mỡ hành → nướng → … → giao", () => {
  const { s, t } = openWithOrder(5);
  home(s);
  must(s, { type: "pin", tk: t.id });
  const tg = targetOf(t);
  const seen = [];
  cookedPiece(s, 4);
  for (let i = 0; i < 14; i++) {
    const n = nextStep(s); seen.push(n);
    if (n === "serve") break;
    must(s, { type: "autoStep" });
  }
  assert.equal(seen[0], "dia"); assert.equal(seen[1], "com");
  assert.equal(seen.at(-1), "serve");
  const p = s.shift.slots[0].plate;
  assert.equal(p.com, tg.com); assert.equal(p.moHanh, tg.moHanh);
  if (tg.sauce === "chen") assert.equal(p.sauce, "chen");
});

test("lật được trong lúc ô bày đang mở; cô chủ đang đi ở bàn thì không làm được việc bếp", () => {
  const { s, t } = openWithOrder(6);
  home(s);
  must(s, { type: "pin", tk: t.id });
  must(s, { type: "layer", id: "dia" });
  must(s, { type: "placeMeat", slot: 0 });
  s.shift.grill.slots[0].sides = [105, 0];
  must(s, { type: "grillTap", slot: 0 });
  assert.equal(s.shift.grill.slots[0].sides[1], 105, "đã lật dù dĩa đang mở");
  // giao cô chủ một việc ở bàn ⇒ đang đi thì bếp khoá
  s.shift.dirty++; s.shift.cleanPlates--; // bảo toàn số dĩa (bất biến apply)
  must(s, { type: "wash" });
  must(s, { type: "tick", dt: 100 });
  assert.equal(apply(s, { type: "flip", slot: 0 }).err, "owner-busy");
  assert.equal(apply(s, { type: "layer", id: "com" }).err, "owner-busy");
});
