import { test } from "node:test";
import assert from "node:assert/strict";
import { makeSave, KEY, CORRUPT_KEY, BACKUP_KEY, backupKey } from "../save.js";
import { createProfile, loadProfile, recordSolve, rankOf, caseRep, unlocked, cleanName, RANKS } from "../core/progress.js";
import { solve } from "../core/solver.js";
import { createRun, apply, sanitizeRun } from "../core/engine.js";
import mini from "./fixtures/mini-case.js";

const mem = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m }; };

test("lần đầu: hồ sơ mới, ghi rồi đọc lại giữ tên + tiến độ vụ đang dở", () => {
  const st = mem(), sv = makeSave(st);
  const r = sv.read();
  assert.equal(r.fresh, true);
  const p = r.profile;
  p.name = "Thám Tử Mèo";
  let s = createRun(mini, 3);
  s = apply(mini, s, { type: "intro" }).s;
  s = apply(mini, s, { type: "examine", id: "hu-pate" }).s;
  p.runs.mini = s;
  assert.ok(sv.write(p));
  const back = makeSave(st).read();
  assert.equal(back.fresh, false);
  assert.equal(back.profile.name, "Thám Tử Mèo");
  const s2 = sanitizeRun(mini, back.profile.runs.mini);
  assert.deepEqual(s2.clues, ["muong"]);
  assert.equal(s2.phase, "play");
});

test("bản hỏng: chép sang .corrupt một lần, không xoá, tạo hồ sơ mới", () => {
  const st = mem({ [KEY]: "{hỏng" }), sv = makeSave(st);
  const r = sv.read();
  assert.equal(r.corrupt, true);
  assert.equal(st.getItem(CORRUPT_KEY), "{hỏng");
  st.setItem(KEY, "[1,2"); sv.read();
  assert.equal(st.getItem(CORRUPT_KEY), "{hỏng", "không ghi đè bản .corrupt cũ");
});

test("migration v0 → v1: backup thô .bak-v0 một lần, giữ tên + ★", () => {
  const raw = JSON.stringify({ name: "Lụm", rep: 140, stars: { "noi-thit-kho": 3, "chien-ke": 2 } });
  const st = mem({ [KEY]: raw }), sv = makeSave(st);
  const r = sv.read();
  assert.equal(r.migrated, 0);
  assert.equal(st.getItem(backupKey(0)), raw);
  assert.equal(r.profile.v, 1);
  assert.equal(r.profile.name, "Lụm");
  assert.equal(r.profile.rep, 140);
  assert.equal(r.profile.solved["noi-thit-kho"].stars, 3);
  sv.write(r.profile);
  st.setItem(KEY, JSON.stringify({ name: "khác" }));
  sv.read();
  assert.equal(st.getItem(backupKey(0)), raw, "backup chỉ một lần");
});

test("kẹp số khi đọc + phiên bản tương lai coi như hỏng", () => {
  const p = loadProfile(JSON.stringify({ v: 1, name: "<b>X</b>\u0007", rep: -50, solved: { a: { stars: 9, rep: -3 }, "../x": { stars: 3 } }, runs: { a: { id: "a" } } }));
  assert.equal(p.name, "bX/b");
  assert.equal(p.rep, 0);
  assert.deepEqual(p.solved.a, { stars: 3, rep: 0, times: 1, last: 3 });
  assert.equal(p.solved["../x"], undefined);
  assert.equal(loadProfile(JSON.stringify({ v: 99 })), null);
  assert.equal(cleanName("  a   b  "), "a b");
});

test("xoá tiến độ: cất .backup rồi xoá, khoá ghi tới khi tải lại", () => {
  const st = mem(), sv = makeSave(st);
  const p = createProfile("A"); sv.write(p);
  assert.ok(sv.wipe());
  assert.equal(st.getItem(KEY), null);
  assert.equal(JSON.parse(st.getItem(BACKUP_KEY)).name, "A");
  assert.equal(sv.write(p), false);
  assert.equal(st.getItem(KEY), null);
});

test("kết vụ: danh tiếng, ★ cao nhất, phá lại chỉ cộng phần vượt kỷ lục, lên hạng", () => {
  const r = solve(mini);
  let p = createProfile("A");
  p.runs.mini = r.s;
  const a = recordSolve(p, mini, r.s);
  assert.equal(a.p.solved.mini.stars, 3);
  assert.equal(a.gained, caseRep(mini, r.s).total);
  assert.equal(a.p.runs.mini, undefined, "phá xong thì bỏ tiến độ đang dở");
  const worse = { ...r.s, result: { ...r.s.result, stars: 1 } };
  const b = recordSolve(a.p, mini, worse);
  assert.equal(b.gained, 0);
  assert.equal(b.p.solved.mini.stars, 3);
  assert.equal(b.p.solved.mini.times, 2);
  assert.equal(rankOf(0).name, RANKS[0].name);
  assert.equal(rankOf(1000).name, "Huyền thoại Hẻm 47");
  const near = { ...createProfile("B"), rep: RANKS[1].rep - 10 };
  assert.ok(recordSolve(near, mini, r.s).rankUp, "đủ điểm thì lên hạng");
});

test("mở khoá vụ lần lượt", () => {
  const list = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const p = createProfile();
  assert.deepEqual(list.map((_, i) => unlocked(p, list, i)), [true, false, false]);
  p.solved.a = { stars: 1 };
  assert.deepEqual(list.map((_, i) => unlocked(p, list, i)), [true, true, false]);
});
