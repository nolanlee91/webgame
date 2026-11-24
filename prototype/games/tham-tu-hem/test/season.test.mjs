// Mùa 2: tab mùa, mở khoá mùa 2 sau Vụ 6, tab tự chọn, hạng mới, bản lưu cũ chạy tiếp, chân dung people.sheet.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CASES } from "../data/cases/index.js";
import { createProfile, loadProfile, dumpProfile, rankOf, RANKS, SEASONS, seasonOf, seasonUnlocked, pickSeason, unlocked, PROFILE_VERSION } from "../core/progress.js";
import { makeSave, KEY, backupKey } from "../save.js";
import { validateCase } from "../core/validate.js";
import { setManifest, registerSheets, portraitFrame } from "../ui/art.js";
import mini from "./fixtures/mini-case.js";

const mem = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m }; };
const S1 = CASES.filter((c) => seasonOf(c) === 1), S2 = CASES.filter((c) => seasonOf(c) === 2);
const solvedUpTo = (n) => { const p = createProfile("A"); for (const c of CASES.slice(0, n)) p.solved[c.id] = { stars: 3, rep: 100, times: 1, last: 3 }; return p; };

test("danh mục: 6 vụ mùa 1 rồi 6 vụ mùa 2, mỗi mùa có tab", () => {
  assert.equal(S1.length, 6); assert.equal(S2.length, 6);
  assert.equal(CASES.findIndex((c) => seasonOf(c) === 2), 6, "mùa 2 nối ngay sau Vụ 6");
  assert.deepEqual(SEASONS.map((s) => s.tab), ["Mùa 1 · Hẻm 47", "Mùa 2 · Chợ Hẻm"]);
  assert.equal(SEASONS[1].map, "assets/scenes/hem-map-2.webp");
  assert.equal(SEASONS[1].lockMsg, "Phá xong Vụ 6 để mở Chợ Hẻm");
  assert.equal(seasonOf({}), 1); assert.equal(seasonOf({ season: 2 }), 2);
});

test("mùa 2 khoá tới khi phá Vụ 6; Vụ 7 mở khi phá Vụ 6, vụ sau mở lần lượt", () => {
  const p5 = solvedUpTo(5);
  assert.equal(seasonUnlocked(p5, CASES, 1), true);
  assert.equal(seasonUnlocked(p5, CASES, 2), false);
  assert.equal(unlocked(p5, CASES, 6), false);
  const p6 = solvedUpTo(6);
  assert.equal(seasonUnlocked(p6, CASES, 2), true);
  assert.equal(unlocked(p6, CASES, 6), true, "Vụ 7 mở");
  assert.equal(unlocked(p6, CASES, 7), false, "Vụ 8 còn khoá");
  p6.solved["ve-so"] = { stars: 2, rep: 1, times: 1, last: 2 };
  assert.equal(unlocked(p6, CASES, 7), true, "phá Vụ 7 ⇒ Vụ 8 mở");
  // phá Vụ 6 mà bỏ sót vụ trước (bản lưu lạ) vẫn tính theo vụ liền trước
  const odd = createProfile(); odd.solved["nhan-dam-hoi"] = { stars: 1 };
  assert.equal(seasonUnlocked(odd, CASES, 2), true);
  assert.equal(seasonUnlocked(createProfile(), CASES, 3), false, "mùa không có vụ ⇒ khoá");
});

test("tab tự chọn: vụ đang dở, không thì vụ mới nhất đã mở", () => {
  assert.equal(pickSeason(createProfile(), CASES), 1);
  assert.equal(pickSeason(solvedUpTo(5), CASES), 1);
  const p = solvedUpTo(6);
  assert.equal(pickSeason(p, CASES), 2, "vừa phá Vụ 6 ⇒ mùa 2");
  p.runs["mat-wifi"] = { phase: "play" };
  assert.equal(pickSeason(p, CASES), 1, "đang chơi lại vụ mùa 1 ⇒ mùa 1");
  p.runs["ve-so"] = { phase: "finale" };
  assert.equal(pickSeason(p, CASES), 2, "vụ dở mới nhất thắng");
  const q = solvedUpTo(6); q.runs["mat-wifi"] = { phase: "intro" };
  assert.equal(pickSeason(q, CASES), 2, "mới mở văn phòng (intro) chưa tính là đang dở");
  const r = solvedUpTo(3); r.runs["ve-so"] = { phase: "play" };
  assert.equal(pickSeason(r, CASES), 1, "tiến độ vụ còn khoá (bản lưu lạ) bị bỏ qua");
});

test("hạng mới sau Huyền thoại Hẻm 47: phá hết 12 vụ 3★ thì vừa tới hạng cao nhất", () => {
  const names = RANKS.map((r) => r.name);
  assert.ok(names.indexOf("Huyền thoại Hẻm 47") < names.indexOf("Thám tử Chợ Hẻm"));
  assert.equal(names.at(-1), "Huyền thoại Sài Gòn");
  for (let i = 1; i < RANKS.length; i++) assert.ok(RANKS[i].rep > RANKS[i - 1].rep, "tăng dần");
  const full = (d) => 50 + 50 * d; // danh tiếng 3★, không tính câu hỏi phụ
  const s1 = S1.reduce((a, c) => a + full(c.difficulty), 0), all = CASES.reduce((a, c) => a + full(c.difficulty), 0);
  assert.equal(all, RANKS.at(-1).rep, "12 vụ 3★ = đúng mốc hạng cuối");
  assert.ok(rankOf(all - 1).name !== "Huyền thoại Sài Gòn");
  assert.equal(rankOf(all).name, "Huyền thoại Sài Gòn");
  // mùa 1 tối đa (3★ + mọi câu hỏi phụ) chưa vượt hạng mùa 2 đầu tiên ⇒ người chơi cũ không nhảy hạng khi cập nhật
  assert.ok(s1 + 6 * 3 * 20 < RANKS.find((r) => r.id === "cho-hem").rep);
  assert.equal(rankOf(1000).name, "Huyền thoại Hẻm 47");
  assert.equal(rankOf(99999).next, null);
});

test("bản lưu cũ (v1 không có flags) chạy tiếp; flags được kẹp; không đổi phiên bản", () => {
  assert.equal(PROFILE_VERSION, 1, "flags là trường tuỳ chọn ⇒ không cần MIGRATIONS mới");
  const old = { v: 1, name: "Cũ", rep: 1260, solved: { "nhan-dam-hoi": { stars: 3, rep: 260, times: 1, last: 3 } }, runs: { "mat-wifi": { phase: "play" } }, created: 1 };
  const st = mem({ [KEY]: JSON.stringify(old) }), sv = makeSave(st);
  const r = sv.read();
  assert.equal(r.migrated, null); assert.equal(st.getItem(backupKey(1)), null, "không chép backup khi không nâng");
  assert.deepEqual(r.profile.flags, {});
  assert.equal(r.profile.rep, 1260); assert.equal(rankOf(r.profile.rep).name, "Huyền thoại Hẻm 47");
  assert.equal(seasonUnlocked(r.profile, CASES, 2), true);
  r.profile.flags.s2intro = 1; sv.write(r.profile);
  assert.equal(makeSave(st).read().profile.flags.s2intro, 1, "cờ màn chuyển mùa 2 giữ qua lần mở sau");
  const p = loadProfile(JSON.stringify({ ...old, flags: { s2intro: 1, "x y": 1, bad: { a: 1 }, ok: true, [`k${"z".repeat(40)}`]: 1 } }));
  assert.deepEqual(p.flags, { s2intro: 1, ok: true });
  assert.deepEqual(loadProfile(JSON.stringify({ ...old, flags: [1, 2] })).flags, {});
  // code cũ (chỉ biết v1) đọc bản mới: vẫn là v1 hợp lệ, chỉ bỏ qua flags
  const dumped = JSON.parse(dumpProfile(p));
  assert.equal(dumped.v, 1);
});

test("migration v0 → v1 vẫn chạy, ra hồ sơ có flags rỗng + backup .bak-v0", () => {
  const raw = JSON.stringify({ name: "Lụm", rep: 140, stars: { "noi-thit-kho": 3 } });
  const st = mem({ [KEY]: raw }), r = makeSave(st).read();
  assert.equal(r.migrated, 0); assert.equal(st.getItem(backupKey(0)), raw);
  assert.deepEqual(r.profile.flags, {});
  assert.equal(pickSeason(r.profile, CASES), 1);
});

test("chân dung people.sheet: lấy frame từ portraits-<vụ cũ>; cast vẫn từ portraits-cast", () => {
  const sheet = (file, names) => ({ filename: file, dimensions: [1024, 1024], frames: Object.fromEntries(names.map((n, i) => [n, { rect: [(i % 4) * 256, Math.floor(i / 4) * 256, 256, 256] }])) });
  setManifest({ items: [
    sheet("assets/portraits-cast.webp", ["teo-neutral", "teo-happy"]),
    sheet("assets/portraits-mat-wifi.webp", ["ongnam-neutral", "ongnam-angry"]),
    sheet("assets/portraits-karaoke.webp", ["ongnam-neutral", "cothu-neutral", "teo-neutral"]), // ongnam trùng tên ở sheet vụ mới: sheet ghi rõ thắng
  ], hotspots: {} });
  registerSheets({ id: "karaoke", people: { ongnam: { name: "Ông Năm", sheet: "mat-wifi" }, cothu: { name: "Cô Thu" } } });
  assert.equal(portraitFrame("ongnam", "angry", "karaoke").url, "assets/portraits-mat-wifi.webp");
  assert.equal(portraitFrame("ongnam", "shock", "karaoke").url, "assets/portraits-mat-wifi.webp", "thiếu mood ⇒ neutral của sheet cũ");
  assert.equal(portraitFrame("cothu", "neutral", "karaoke").url, "assets/portraits-karaoke.webp");
  assert.equal(portraitFrame("teo", "happy", "karaoke").url, "assets/portraits-cast.webp");
  assert.equal(portraitFrame("ongnam", "neutral", "mat-wifi").url, "assets/portraits-mat-wifi.webp");
  assert.equal(portraitFrame("ai-do", "neutral", "karaoke"), null);
  setManifest(null);
});

test("bộ kiểm: people.<pid>.sheet phải là id vụ trong data/cases/index.js", () => {
  const c = structuredClone(mini);
  c.people.an.sheet = "mat-wifi";
  assert.deepEqual(validateCase(c).errors, []);
  c.people.an.sheet = "khong-co-vu";
  c.people.binh.sheet = 7;
  const e = validateCase(c).errors.join("\n");
  assert.match(e, /people\.an\.sheet: "khong-co-vu"/);
  assert.match(e, /people\.binh\.sheet/);
  const d = structuredClone(mini); d.people.an.sheet = "mini";
  assert.ok(validateCase(d).errors.some((x) => /people\.an\.sheet/.test(x)), "mini không có trong danh mục");
});
