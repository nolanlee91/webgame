// "Thách cùng màn" (_shared/challenge.js) + số đếm phía trình duyệt (_shared/stats.js) + seed tái lập được ở 3 game thử.
// `node --test prototype/games/_shared/test/challenge.test.mjs`
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as CH from "../challenge.js";
import * as ST from "../stats.js";
import { SITE_URL } from "../site.js";
import * as RAN from "../../ran-san-moi/logic.js";
import * as DV from "../../dao-vang/logic.js";
import * as G2 from "../../2048/logic.js";

const q = (v) => "?" + CH.PARAM + "=" + v;

test("parseChallenge: link đúng / thiếu / hỏng", () => {
  assert.equal(CH.parseChallenge(""), null);
  assert.equal(CH.parseChallenge("?seed=1"), null);
  assert.deepEqual(CH.parseChallenge(q("123.1240.Minh")), { ok: true, seed: 123, score: 1240, name: "Minh" });
  assert.deepEqual(CH.parseChallenge(q("0.0")), { ok: true, seed: 0, score: 0, name: "" });
  assert.deepEqual(CH.parseChallenge(q("4294967295.99999999")), { ok: true, seed: 4294967295, score: 99999999, name: "" });
  for (const bad of ["", "abc", "1", "1.", ".5", "-1.5", "1.-5", "4294967296.1", "1.100000000", "1.2e3", "1.5.6".replace("5.6", "x5"), "0x10.5", "1,5", "99999999999.1", " 1 . 2 "])
    assert.deepEqual(CH.parseChallenge(q(encodeURIComponent(bad))), { ok: false }, JSON.stringify(bad));
  // tên không hợp lệ (ký tự lạ, quá ngắn) ⇒ vẫn là link đúng nhưng bỏ tên
  assert.deepEqual(CH.parseChallenge(q("7.8." + encodeURIComponent("<script>"))), { ok: true, seed: 7, score: 8, name: "" });
  assert.deepEqual(CH.parseChallenge(q("7.8.A")), { ok: true, seed: 7, score: 8, name: "" });
  // tên dài ⇒ cắt 16 ký tự
  assert.equal(CH.parseChallenge(q("7.8." + encodeURIComponent("Một Cái Tên Rất Rất Dài"))).name.length <= 16, true);
});

test("formatChallenge / challengeUrl: domain từ site.js, tên mã hoá, đọc lại ra đúng", () => {
  const url = CH.challengeUrl("ran-san-moi", { seed: 4294967295, score: 1240, name: "Heo Cute 15" });
  assert.equal(url, `${SITE_URL}/games/ran-san-moi/?thach=4294967295.1240.Heo%20Cute%2015`);
  assert.ok(CH.challengeUrl("do-vui", { seed: 1, score: 2 }).startsWith(`${SITE_URL}/games/do-vui-nhanh/?thach=1.2`));
  assert.equal(CH.challengeUrl("2048", { seed: 5, score: 9 }, "http://127.0.0.1:8991/"), "http://127.0.0.1:8991/games/2048/?thach=5.9");
  for (const name of ["Mèo.Mun 07", "Ánh-Dương", "O'Neil", "Trùm Hẻm 31", ""]) {
    const c = CH.parseChallenge(new URL(CH.challengeUrl("dao-vang", { seed: 77, score: 1, name })).search);
    assert.deepEqual(c, { ok: true, seed: 77, score: 1, name }, name);
  }
  assert.equal(CH.formatChallenge({ seed: -1, score: 1e12 }), "4294967295.99999999"); // kẹp về khoảng hợp lệ
});

test("challengeText / verdict / compare: câu tiếng Việt, đúng thắng thua", () => {
  assert.equal(CH.challengeText({ game: "dao-vang", score: 1240 }), "Mình được 1.240 điểm ở màn này của Đào Vàng trên Lụm Kèo, bạn vượt nổi không? ⚔");
  assert.match(CH.challengeText({ game: "2048", score: 980, back: { won: true, theirName: "Minh" } }), /vượt Minh với 980 điểm/);
  assert.match(CH.challengeText({ game: "2048", score: 980, back: { won: false, theirName: "" } }), /chưa qua mặt được bạn/);
  assert.equal(CH.verdict(2, 1), "win"); assert.equal(CH.verdict(1, 2), "lose"); assert.equal(CH.verdict(3, 3), "tie");
});

test("seedWithVariant / variantOf: gói chế độ / cỡ bàn vào seed, luôn là uint32", () => {
  for (const raw of [0, 1, 2, 3, 12345, 0x7fffffff, 0xfffffffe, 0xffffffff]) for (const k of [2, 3]) for (let v = 0; v < k; v++) {
    const s = CH.seedWithVariant(raw, v, k);
    assert.ok(Number.isInteger(s) && s >= 0 && s <= 0xffffffff, `${raw},${v},${k}`);
    assert.equal(CH.variantOf(s, k), v);
    assert.ok(Math.abs(s - raw) < k);
  }
});

test("safeName: tên tự sinh dùng thẳng, tên tự đặt hỏi bộ lọc máy chủ, lỗi / bị lọc ⇒ bỏ tên", async () => {
  let calls = 0;
  const reply = (body, status = 200) => async () => { calls++; return new Response(JSON.stringify(body), { status }); };
  assert.equal(await CH.safeName("Heo Cute 15", { fetch: reply({}) }), "Heo Cute 15");
  assert.equal(calls, 0);
  assert.equal(await CH.safeName("Minh", { fetch: reply({ ok: true, name: "Minh" }) }), "Minh");
  assert.equal(await CH.safeName("Minh", { fetch: reply({ ok: false }) }), "");
  assert.equal(await CH.safeName("Minh", { fetch: reply({ ok: true, name: "Người chơi" }) }), "");
  assert.equal(await CH.safeName("Minh", { fetch: reply({}, 429) }), "");
  assert.equal(await CH.safeName("Minh", { fetch: async () => { throw new Error("offline"); } }), "");
  assert.equal(await CH.safeName("Minh", { fetch: (u, o) => new Promise((_, no) => o.signal.addEventListener("abort", () => no(new Error("abort")))), timeoutMs: 30 }), ""); // quá giờ ⇒ ""
  assert.equal(await CH.safeName("<b>", { fetch: reply({ ok: true, name: "<b>" }) }), "");
  assert.equal(await CH.safeName("", { fetch: reply({ ok: true, name: "x" }) }), "");
});

test("stats.js: gameId nhận id lẫn tên thư mục, ev chỉ gửi sự kiện trong danh sách, không gửi gì khác ngoài {e,g}", () => {
  assert.equal(ST.gameId("do-vui-nhanh"), "do-vui");
  assert.equal(ST.gameId("2048"), "2048");
  assert.equal(ST.gameId("khong-co"), "");
  assert.equal(ST.gameId("__proto__"), "");
  assert.equal(ST.gameFromPath("/games/ran-san-moi/index.html"), "ran-san-moi");
  assert.equal(ST.gameFromPath("/homepage/"), "");
  const sent = [];
  const oldNav = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", { value: { sendBeacon: (u, b) => { sent.push([u, b]); return true; } }, configurable: true });
  try {
    assert.equal(ST.ev("challenge_open", "dao-vang"), true);
    assert.equal(ST.ev("page_view", "dao-vang"), false);
    assert.equal(ST.ev("daily_submit", "do-vui-nhanh"), true);
    assert.deepEqual(sent, [["/api/ev", '{"e":"challenge_open","g":"dao-vang"}'], ["/api/ev", '{"e":"daily_submit","g":"do-vui"}']]);
    Object.defineProperty(globalThis, "navigator", { value: { sendBeacon: () => { throw new Error("x"); } }, configurable: true });
    assert.doesNotThrow(() => ST.ev("share_click", "2048")); // lỗi không lọt ra game
  } finally {
    if (oldNav) Object.defineProperty(globalThis, "navigator", oldNav); else delete globalThis.navigator;
  }
});

test("stats.js: danh sách sự kiện trùng với máy chủ", async () => {
  const { createRequire } = await import("node:module");
  const { EVENTS } = createRequire(import.meta.url)("../../../../games-server/stats.js");
  assert.deepEqual(ST.EVENTS, EVENTS);
});

// ───────────── seed tái lập được: cùng seed ⇒ cùng màn ─────────────

test("Rắn: cùng seed + cùng nước đi ⇒ cùng chuỗi mồi, cùng điểm; logic không dùng Math.random", () => {
  const src = readFileSync(fileURLToPath(new URL("../../ran-san-moi/logic.js", import.meta.url)), "utf8");
  assert.ok(!/Math\.random/.test(src));
  const play = (seed, mode) => {
    const s = RAN.newGame({ seed, mode }), foods = [JSON.stringify(s.food)];
    // bot đơn giản: đi về phía mồi, tránh quay đầu
    for (let i = 0; i < 3000 && s.status === "play"; i++) {
      const h = s.snake[0], f = s.food || h;
      const want = f.x > h.x ? "right" : f.x < h.x ? "left" : f.y > h.y ? "down" : "up";
      RAN.turn(s, want);
      const ev = RAN.step(s);
      if (ev.ate) foods.push(JSON.stringify(s.food) + JSON.stringify(s.gold));
    }
    return { foods, score: s.score, ticks: s.ticks, eaten: s.eaten };
  };
  for (const mode of ["classic", "wrap"]) {
    const seed = CH.seedWithVariant(987654321, mode === "wrap" ? 1 : 0, 2);
    const a = play(seed, mode), b = play(seed, mode);
    assert.deepEqual(a, b);
    assert.ok(a.eaten >= 3, "bot phải ăn được vài mồi");
    assert.notDeepEqual(play(seed + 2, mode).foods.slice(0, 4), a.foods.slice(0, 4));
  }
});

test("Đào Vàng: cùng seed màn 1 ⇒ mọi màn sau (nextLevel) giống hệt, túi bí ẩn ra cùng giá trị", () => {
  const chain = (seed) => {
    let g = DV.createGame({ seed });
    const out = [];
    for (let lv = 1; lv <= 5; lv++) {
      out.push(JSON.stringify(g.objects.map((o) => [o.kind, Math.round(o.x * 100), Math.round(o.y * 100)])));
      out.push(DV.rand({ rng: g.rng })); // trạng thái RNG sau khi dựng màn (túi bí ẩn rút từ đây)
      g.score = g.target; g.status = "cleared";
      g = DV.nextLevel(g);
    }
    return out;
  };
  const seed = 3141592653;
  assert.deepEqual(chain(seed), chain(seed));
  assert.notDeepEqual(chain(seed)[0], chain(seed + 1)[0]);
});

test("2048: cùng seed + cùng nước đi ⇒ cùng bàn, cùng điểm; cỡ bàn suy ra từ seed % 3", () => {
  const play = (seed, size) => {
    const s = G2.newGame({ size, seed }), dirs = ["left", "up", "right", "down"];
    for (let i = 0; i < 400 && s.status === "playing"; i++) { if (!G2.move(s, dirs[i % 4])) G2.move(s, dirs[(i + 1) % 4]) || G2.move(s, dirs[(i + 2) % 4]) || G2.move(s, dirs[(i + 3) % 4]); }
    return JSON.stringify(G2.serialize(s));
  };
  for (const size of G2.SIZES) {
    const seed = CH.seedWithVariant(0xdeadbeef, G2.SIZES.indexOf(size), 3);
    assert.equal(G2.SIZES[CH.variantOf(seed, 3)], size);
    assert.equal(play(seed, size), play(seed, size));
    assert.notEqual(play(seed, size), play(seed + 3, size));
  }
});
