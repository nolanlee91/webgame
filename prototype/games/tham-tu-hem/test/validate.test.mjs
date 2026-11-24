import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { validateCase } from "../core/validate.js";
import mini from "./fixtures/mini-case.js";

test("vụ mẫu đạt bộ kiểm", () => {
  const r = validateCase(mini);
  assert.deepEqual(r.errors, []);
});

test("bộ kiểm bắt: từ khoá lạ, vật chứng không nhặt được, đáp án không thu được", () => {
  const c = structuredClone(mini);
  c.intro.push(["teo", "[[khong-co]]"]);
  c.clues.ma = { name: "Ma", desc: "x" };
  c.deduction[0].blanks.a.answer = "binh";
  delete c.talks.binh[0].gives;
  const e = validateCase(c).errors.join("\n");
  assert.match(e, /khong-co/);
  assert.match(e, /"ma" không nhặt được/);
  assert.match(e, /không bao giờ nhặt được từ khoá "binh"/);
});

test("trường tuỳ chọn: hints[].done, finale.steps[].hint, teoRescue được kiểm", () => {
  const c = structuredClone(mini);
  c.hints[0].done = "clue:muong-an";
  c.finale.steps[0].hint = "Muỗng trong túi ai?";
  c.teoRescue = [[["teo", "Sếp ơi bình tĩnh!", "nervous"]]];
  assert.deepEqual(validateCase(c).errors, []);
  c.hints[0].done = "clue:khong-co";
  c.finale.steps[0].hint = 5;
  c.teoRescue = [[["ai-do", "x"]]];
  const e = validateCase(c).errors.join("\n");
  assert.match(e, /hints\[0\]\.done/);
  assert.match(e, /steps\[0\]\.hint/);
  assert.match(e, /teoRescue\[0\]/);
});

test("needs phủ định \"!\", break.also, cảnh báo từ khoá không nhặt được", () => {
  const c = structuredClone(mini);
  c.locations.xe.hotspots[1].needs = "!broke:an-khong-an";
  c.stmts["an-khong-an"].break.also = ["muong"];
  c.words.thua = { text: "thừa", kind: "khac" };
  const r = validateCase(c);
  assert.deepEqual(r.errors, []);
  assert.ok(r.warns.some((w) => /"thua" không bao giờ nhặt được/.test(w)));
  c.stmts["an-khong-an"].break.also = ["khong-co"];
  c.locations.xe.hotspots[1].needs = "!broke:la";
  const e = validateCase(c).errors.join("\n");
  assert.match(e, /break\.also: vật chứng "khong-co"/);
  assert.match(e, /"broke:la" trỏ tới/);
});

test("mọi vụ thật trong data/cases đạt bộ kiểm", async () => {
  const dir = new URL("../data/cases/", import.meta.url);
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".js") && x !== "index.js")) {
    const c = (await import(new URL(f, dir))).default;
    assert.deepEqual(validateCase(c).errors, [], f);
    assert.ok(c.difficulty >= 1, f + ": vụ thật phải có độ khó 1–3");
  }
});
