// Bot giải tự động: đi hết vụ chỉ qua apply() + đọc chữ hiện ra, phải ra 3★ (không gợi ý, không đưa sai). Áp cho vụ mẫu và MỌI vụ trong data/cases.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { solve } from "../core/solver.js";
import { caseRep } from "../core/progress.js";
import mini from "./fixtures/mini-case.js";

function check(c) {
  const r = solve(c);
  assert.equal(r.stuck, null, `${c.id}: bot kẹt — ${r.stuck}`);
  assert.equal(r.s.phase, "done");
  assert.equal(r.s.result.stars, 3, `${c.id}: bot phải ra 3★`);
  assert.equal(r.s.credLost, 0);
  assert.equal(r.s.wrongBoard, 0);
  for (const id of Object.keys(c.clues)) assert.ok(r.s.clues.includes(id), `${c.id}: bot không nhặt được vật chứng ${id}`);
  for (const [id, st] of Object.entries(c.stmts)) if (st.break) assert.ok(r.s.broke.includes(id), `${c.id}: lời khai ${id} chưa bể`);
  for (const q of c.bonus || []) assert.equal(r.s.bonus[q.id], q.answer);
  assert.ok(caseRep(c, r.s).total > 0);
  return r;
}

test("bot giải vụ mẫu ra 3★", () => {
  const r = check(mini);
  assert.ok(r.steps > 5);
});

test("bot giải mọi vụ trong data/cases ra 3★", async () => {
  const dir = new URL("../data/cases/", import.meta.url);
  const files = readdirSync(dir).filter((x) => x.endsWith(".js") && x !== "index.js");
  for (const f of files) check((await import(new URL(f, dir))).default);
});
