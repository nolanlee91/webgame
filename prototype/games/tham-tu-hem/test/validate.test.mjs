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

test("mọi vụ thật trong data/cases đạt bộ kiểm", async () => {
  const dir = new URL("../data/cases/", import.meta.url);
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".js"))) {
    const c = (await import(new URL(f, dir))).default;
    assert.deepEqual(validateCase(c).errors, [], f);
    assert.ok(c.difficulty >= 1, f + ": vụ thật phải có độ khó 1–3");
  }
});
