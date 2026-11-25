// Tên khách tự sinh (prototype/games/_shared/account.js): MỌI tổ hợp "<đầu> <đuôi> <NN>" phải qua bộ lọc máy chủ nguyên vẹn
// (moderation.cleanPlayerName cho phòng online + names.cleanName cho bảng xếp hạng), không tục, ≤ 16 ký tự, đúng luật ký tự.
// `node --test games-server/name-gen.test.mjs`
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import * as names from "./account/names.mjs";
import * as A from "../prototype/games/_shared/account.js";

const require = createRequire(import.meta.url);
const M = require("./moderation.js");

test("kho tên: đủ lớn, không trùng, trộn cute + cục súc", () => {
  assert.equal(new Set(A.NAME_HEADS).size, A.NAME_HEADS.length, "đầu tên trùng");
  assert.equal(new Set(A.NAME_TAILS).size, A.NAME_TAILS.length, "đuôi tên trùng");
  const pairs = A.allNamePairs();
  assert.ok(pairs.length >= 800, "ít nhất 800 cặp (× 100 số = 80.000 tên), có " + pairs.length);
  for (const w of ["Heo", "Mèo", "Gấu", "Vịt", "Trùm", "Cáo"]) assert.ok(pairs.some(([h]) => h === w), "thiếu đầu " + w);
  for (const w of ["Cute", "Mập", "Cáu Kỉnh", "Láo", "Hẻm", "Lầy"]) assert.ok(pairs.some(([, t]) => t === w), "thiếu đuôi " + w);
  // mọi đầu/đuôi đều dùng được ít nhất một lần (đừng để từ nào bị loại hết vì quá dài)
  for (const h of A.NAME_HEADS) assert.ok(pairs.some((p) => p[0] === h), "đầu không bao giờ dùng được: " + h);
  for (const t of A.NAME_TAILS) assert.ok(pairs.some((p) => p[1] === t), "đuôi không bao giờ dùng được: " + t);
});

test("duyệt HẾT tổ hợp × 00–99 qua bộ lọc máy chủ", () => {
  let n = 0;
  const bad = [];
  for (const [h, t] of A.allNamePairs()) {
    // từng từ / cặp không được dính danh sách tục (kể cả danh sách khắt khe cho tên)
    if (M.isProfane(`${h} ${t}`, { name: true })) bad.push(`${h} ${t}`);
    for (let k = 0; k < 100; k++) {
      const name = `${h} ${t} ${String(k).padStart(2, "0")}`;
      n++;
      if ([...name].length > A.NAME_MAX) { bad.push(name + " (dài)"); continue; }
      if (M.cleanPlayerName(name) !== name) bad.push(name + " (phòng online)");
      else if (names.cleanName(name) !== name) bad.push(name + " (bảng xếp hạng)");
      else if (!A.checkName(name).ok) bad.push(name + " (client)");
    }
  }
  assert.deepEqual(bad.slice(0, 20), [], `${bad.length} tên không qua lọc`);
  assert.ok(n >= 80000);
});

test("randomName: đúng mẫu, ổn định theo hàm ngẫu nhiên", () => {
  let i = 0;
  const seq = [0.01, 0.15, 0.5, 0.42, 0.99, 0.07];
  const rand = () => seq[i++ % seq.length];
  for (let k = 0; k < 3; k++) {
    const n = A.randomName(rand);
    assert.match(n, /^[\p{L} ]+ \d\d$/u);
    assert.ok([...n].length <= 16);
  }
  for (let k = 0; k < 500; k++) assert.ok(A.checkName(A.randomName()).ok);
});

test("checkName / setName: 2–16 ký tự, báo lỗi rõ", () => {
  assert.equal(A.checkName("a").error, "Tên cần ít nhất 2 ký tự.");
  assert.match(A.checkName("x".repeat(17)).error, /tối đa 16/);
  assert.match(A.checkName("Bé 😀").error, /chỉ dùng chữ/);
  assert.equal(A.checkName("   ").error, "Bạn chưa nhập tên.");
  assert.deepEqual(A.checkName("  Bé   Na ").name, "Bé Na");
  assert.equal(A.checkName("Bé_Na-2'").ok, true);
});

test("avatarSvg: cùng tên ⇒ cùng ảnh, khác tên ⇒ thường khác", () => {
  assert.equal(A.avatarSvg("Heo Cute 15"), A.avatarSvg("Heo Cute 15"));
  const set = new Set(["Heo Cute 15", "Mèo Mập 42", "Gấu Cáu Kỉnh 07", "Vịt Láo 22", "Trùm Hẻm 31", "Cáo Lầy 64"].map((n) => A.avatarSvg(n)));
  assert.ok(set.size >= 5);
  assert.match(A.avatarSvg("x", 20), /^<svg[^>]+width="20"/);
});

test("máy chủ: /api/name/check lọc tên", async () => {
  const { createAccountApi } = await import("./account/index.mjs");
  const api = createAccountApi({ mode: "off", env: {}, log: () => {} });
  const call = (body) => new Promise((resolve) => {
    const req = { method: "POST", url: "/api/name/check", headers: { "content-length": String(Buffer.byteLength(JSON.stringify(body))) }, socket: {},
      on(ev, f) { if (ev === "data") setImmediate(() => f(Buffer.from(JSON.stringify(body)))); if (ev === "end") setImmediate(() => setImmediate(f)); } };
    const res = { writeHead(s) { this.s = s; }, end(b) { resolve({ status: this.s, json: JSON.parse(b) }); } };
    api.handle(req, res);
  });
  assert.deepEqual((await call({ name: "  Mèo   Mập 42 " })).json, { ok: true, name: "Mèo Mập 42" });
  assert.equal((await call({ name: "đụ má" })).json.ok, false);
  assert.equal((await call({ name: "a" })).json.ok, false);
  assert.equal((await call({ nope: 1 })).status, 400);
});
