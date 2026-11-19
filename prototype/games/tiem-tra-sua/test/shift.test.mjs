// Nhịp ca: khách đi vào, chờ, sốt ruột, bỏ về; hàng chờ tối đa 4; chốt ca; cùng hạt ⇒ cùng kết quả.
import test from "node:test";
import assert from "node:assert/strict";
import { QUEUE_MAX, WALK_MS, TUTORIAL_DAY } from "../data/shift.js";
import { ARCHETYPES } from "../data/customers.js";
import { apply } from "../core/apply.js";
import { shop, act, untilWaiting, serveRight, advance, types } from "./helpers.mjs";

test("ngày học: khách đầu đi từ cửa (enter) rồi đứng chờ sau 2,4 giây và nói món", () => {
  const s = shop();
  act(s, { type: "startShift" });
  advance(s, TUTORIAL_DAY.guests[0].at + 200);
  const c = s.shift.customers[0];
  assert.equal(c.phase, "enter");
  const ev = advance(s, WALK_MS);
  assert.ok(ev.some((e) => e.type === "arrive"));
  assert.equal(s.shift.customers[0].phase, "wait");
  assert.match(s.shift.customers[0].say.text, /trà sữa truyền thống/);
  assert.equal(s.shift.customers[0].patience, Math.round(ARCHETYPES["hoc-sinh"].patience * 1.5));
});

test("hết kiên nhẫn: sốt ruột ở 35%, rồi bỏ về với review 1 sao, phiếu đang ghim bị gỡ", () => {
  const s = shop();
  act(s, { type: "startShift" });
  const c = untilWaiting(s);
  act(s, { type: "pin", cid: c.id });
  const ev = advance(s, c.patience * 0.7);
  assert.ok(ev.some((e) => e.type === "impatient"));
  assert.equal(s.shift.customers.find((q) => q.id === c.id).mood, "impatient");
  const ev2 = advance(s, c.patience * 0.31);
  assert.ok(ev2.some((e) => e.type === "timeout" && e.cid === c.id));
  assert.equal(s.shift.active, null);
  assert.ok(s.shift.ledger.lost >= 1);
  const rv = s.shift.reviews.find((r) => r.cid === c.id);
  assert.equal(rv.stars, 1);
  assert.equal(rv.reason, "timeout");
  advance(s, WALK_MS + 400);
  assert.equal(s.shift.customers.some((q) => q.id === c.id), false, "đi khỏi cảnh");
});

test("giao xong: khách vui, đứng phản ứng rồi ra cửa", () => {
  const s = shop();
  act(s, { type: "startShift" });
  const c = untilWaiting(s);
  serveRight(s, c);
  const k = s.shift.customers.find((q) => q.id === c.id);
  assert.equal(k.phase, "react");
  assert.equal(k.mood, "happy");
  advance(s, 2800);
  assert.equal(s.shift.customers.find((q) => q.id === c.id).phase, "leave");
});

test("hàng chờ tối đa 4 khách; lượt dư lùi lại", () => {
  const s = shop(21);
  s.tutorialDone = true;
  act(s, { type: "startShift" });
  s.shift.schedule = Array.from({ length: 7 }, (_, i) => ({ at: 100 + i, arch: "hoc-sinh", name: "Khách " + i, recipe: "tra-dao", sugar: 50, ice: "vua" }));
  advance(s, 2000);
  assert.equal(s.shift.customers.length, QUEUE_MAX);
  assert.equal(new Set(s.shift.customers.map((c) => c.spot)).size, QUEUE_MAX, "mỗi khách một chỗ đứng");
  assert.equal(s.shift.schedule.length, 3);
});

test("cả ngày học: phục vụ hết 5 khách ⇒ chốt ca có headline, review, XP, ngày tăng", () => {
  const s = shop();
  act(s, { type: "startShift" });
  let served = 0;
  for (let guard = 0; s.shift && guard < 2000; guard++) {
    const c = s.shift.customers.find((q) => q.phase === "wait");
    if (c) { serveRight(s, c); served++; } else act(s, { type: "tick", dt: 200 });
  }
  assert.equal(served, 5);
  const S = s.lastSummary;
  assert.equal(S.cups, 5);
  assert.equal(S.lost, 0);
  assert.ok(S.avgStars >= 4.5, String(S.avgStars));
  assert.ok(S.headline.includes("5 ly"));
  assert.equal(S.reviews.length, 5);
  assert.ok(S.xp >= 40);
  assert.equal(s.day, 2);
  assert.equal(s.journal.length, 1);
});

test("cùng hạt + cùng thao tác ⇒ cùng ca (tất định)", () => {
  const run = () => {
    const s = shop(1234); s.tutorialDone = true;
    act(s, { type: "startShift" });
    for (let i = 0; i < 300 && s.shift; i++) {
      const c = s.shift.customers.find((q) => q.phase === "wait");
      if (c && i % 3 === 0) serveRight(s, c); else act(s, { type: "tick", dt: 400 });
    }
    return JSON.stringify(s);
  };
  assert.equal(run(), run());
});

test("tick âm / sai kiểu bị từ chối; action lạ bị từ chối; trạng thái không đổi khi lỗi", () => {
  const s = shop();
  act(s, { type: "startShift" });
  const snap = JSON.stringify(s);
  assert.equal(apply(s, { type: "tick", dt: -5 }).err, "bad-dt");
  assert.equal(apply(s, { type: "hack" }).err, "bad-action");
  assert.equal(apply(s, null).err, "bad-action");
  assert.equal(JSON.stringify(s), snap);
});

test("ngoài ca không pha / giao được", () => {
  const s = shop();
  assert.equal(apply(s, { type: "brew", step: "cup", id: "ly" }).err, "closed");
  assert.equal(apply(s, { type: "serve", cid: 1 }).err, "closed");
  assert.ok(types(act(s, { type: "startShift" })).includes("shiftStarted"));
});
