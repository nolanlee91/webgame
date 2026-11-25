// Giữ ghế online qua việc ĐÓNG TAB (net.js của Cờ Caro / Cờ Vua / Cờ Tướng / Ô Ăn Quan): token lưu localStorage theo mã phòng,
// mở lại link mời ⇒ gửi "resume"; hết hạn 30 phút; "replaced" giữ bản lưu cho tab mới; rời phòng thì xoá.
// Chạy không cần trình duyệt: giả lập sessionStorage / localStorage / location / WebSocket.
// `node --test prototype/games/_shared/test/net-resume.test.mjs`
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";

const GAMES = [["co-caro", "wgp.caro.seat"], ["co-vua", "wgp.covua.seat"], ["co-tuong", "wgp.tuong.seat"], ["o-an-quan", "wgp.o-an-quan.seat"]];
const TOKEN = "a".repeat(32), CODE = "K7M2Q";

class Store {
  constructor() { this.m = new Map(); }
  get length() { return this.m.size; }
  key(i) { return [...this.m.keys()][i] ?? null; }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
}
let sockets = [];
class FakeWS {
  constructor(url) { this.url = url; this.sent = []; this.readyState = 0; sockets.push(this); queueMicrotask(() => { this.readyState = 1; this.onopen?.(); }); }
  send(s) { this.sent.push(JSON.parse(s)); }
  close() { this.readyState = 3; }
  recv(o) { this.onmessage?.({ data: JSON.stringify(o) }); }
}
const tick = () => new Promise((r) => setTimeout(r, 0));
const handlers = (log = []) => new Proxy({}, { get: (_, k) => (...a) => log.push([k, ...a]) });

/** Một "tab" mới: sessionStorage riêng, localStorage dùng chung của hồ sơ trình duyệt. */
function tab(local, search = "") {
  globalThis.sessionStorage = new Store();
  globalThis.localStorage = local;
  globalThis.location = { search, protocol: "http:", host: "x" };
  globalThis.WebSocket = FakeWS;
  sockets = [];
}

const nets = []; // đóng mọi kết nối giả sau mỗi test (dừng ping / nối lại để tiến trình thoát)
afterEach(() => { for (const n of nets.splice(0)) n.close(); });

for (const [game, KEY] of GAMES) {
  const mod = await import(`../../${game}/net.js`);
  const createNet = (...a) => { const n = mod.createNet(...a); nets.push(n); return n; };

  test(`${game}: vào phòng ⇒ lưu ghế cả sessionStorage lẫn localStorage "${KEY}.<MÃ>"`, async () => {
    const local = new Store(); tab(local);
    const net = createNet(handlers(), { url: "ws://x" });
    net.join(CODE, "An"); await tick();
    assert.deepEqual(sockets[0].sent[0], { t: "join", code: CODE, name: "An" });
    sockets[0].recv({ t: "joined", code: CODE, token: TOKEN });
    assert.deepEqual(JSON.parse(sessionStorage.getItem(KEY)), { code: CODE, token: TOKEN });
    const kept = JSON.parse(local.getItem(KEY + "." + CODE));
    assert.equal(kept.token, TOKEN); assert.equal(kept.code, CODE); assert.ok(Date.now() - kept.savedAt < 1000);
  });

  test(`${game}: đóng tab rồi mở lại link mời ⇒ có ghế, gửi "resume" (không gửi "join")`, async () => {
    const local = new Store(); local.setItem(KEY + "." + CODE, JSON.stringify({ code: CODE, token: TOKEN, savedAt: Date.now() - 60000 }));
    tab(local, "?room=" + CODE.toLowerCase());
    const net = createNet(handlers(), { url: "ws://x" });
    assert.deepEqual(net.seat, { code: CODE, token: TOKEN });
    assert.equal(net.resume(), true); await tick();
    assert.deepEqual(sockets[0].sent[0], { t: "resume", code: CODE, token: TOKEN });
    // link phòng khác ⇒ không dùng ghế này
    tab(local, "?room=ABCDE");
    assert.equal(createNet(handlers(), { url: "ws://x" }).seat, null);
  });

  test(`${game}: ghế lưu quá 30 phút ⇒ bỏ (và dọn khỏi localStorage), đi đường join như thường`, async () => {
    const local = new Store(); local.setItem(KEY + "." + CODE, JSON.stringify({ code: CODE, token: TOKEN, savedAt: Date.now() - 31 * 60000 }));
    local.setItem(KEY + ".ZZZZZ", "{hỏng"); local.setItem("wgp.khac", "1");
    tab(local, "?room=" + CODE);
    const net = createNet(handlers(), { url: "ws://x" });
    assert.equal(net.seat, null);
    assert.equal(local.getItem(KEY + "." + CODE), null); assert.equal(local.getItem(KEY + ".ZZZZZ"), null);
    assert.equal(local.getItem("wgp.khac"), "1", "không đụng khoá của game khác");
  });

  test(`${game}: tab mới thay chỗ ⇒ tab cũ nhận "replaced", chỉ xoá ghế của tab cũ, bản lưu localStorage vẫn còn`, async () => {
    const local = new Store(); tab(local);
    const log = [], net = createNet(handlers(log), { url: "ws://x" });
    net.join(CODE, "An"); await tick();
    sockets[0].recv({ t: "joined", code: CODE, token: TOKEN });
    sockets[0].recv({ t: "replaced" });
    assert.equal(log.at(-1)[0], "gone");
    assert.equal(sessionStorage.getItem(KEY), null);
    assert.equal(JSON.parse(local.getItem(KEY + "." + CODE)).token, TOKEN);
  });

  test(`${game}: rời phòng / phòng bị hủy / mất ghế ⇒ xoá bản lưu localStorage`, async () => {
    for (const end of [{ t: "left" }, { t: "closed" }, { t: "kicked" }, { t: "err", code: "no-seat" }]) {
      const local = new Store(); tab(local);
      const net = createNet(handlers(), { url: "ws://x" });
      net.join(CODE, "An"); await tick();
      sockets[0].recv({ t: "joined", code: CODE, token: TOKEN });
      sockets[0].recv(end);
      assert.equal(local.getItem(KEY + "." + CODE), null, JSON.stringify(end));
      assert.equal(net.seat, null);
    }
  });

  test(`${game}: nhập mã phòng còn ghế lưu ⇒ thử "resume" trước; ghế hết ⇒ tự "join" như thường`, async () => {
    const local = new Store(); local.setItem(KEY + "." + CODE, JSON.stringify({ code: CODE, token: TOKEN, savedAt: Date.now() }));
    tab(local);
    const log = [], net = createNet(handlers(log), { url: "ws://x" });
    net.join(CODE, "An"); await tick();
    assert.deepEqual(sockets[0].sent[0], { t: "resume", code: CODE, token: TOKEN });
    sockets[0].recv({ t: "err", code: "no-seat" }); await tick();
    assert.deepEqual(sockets[1].sent[0], { t: "join", code: CODE, name: "An" });
    assert.equal(local.getItem(KEY + "." + CODE), null);
    assert.ok(!log.some(([k]) => k === "gone"), "không báo mất ghế khi còn đường join");
    sockets[1].recv({ t: "joined", code: CODE, token: "b".repeat(32) });
    assert.equal(JSON.parse(local.getItem(KEY + "." + CODE)).token, "b".repeat(32));
  });
}
