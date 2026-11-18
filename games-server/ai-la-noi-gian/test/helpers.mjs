// Người chơi giả qua WebSocket THẬT (WebSocket có sẵn trong Node ≥ 22) + máy chủ thật trên cổng ngẫu nhiên.
import http from 'node:http';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createNoiGianHost } = require('../host.js');

export const FAST = { reveal: 40, night: 900, dawn: 40, day: 80, vote: 400, verdict: 40 };
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function startServer(opts = {}) {
  const server = http.createServer((q, s) => s.end('x'));
  const host = createNoiGianHost(server, { timings: FAST, lobbyGraceMs: 300, ...opts });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = `ws://127.0.0.1:${server.address().port}/ws/ai-la-noi-gian`;
  return { url, host, server, stop: () => { host.close(); server.closeAllConnections?.(); return new Promise((r) => server.close(r)); } };
}

export class Client {
  constructor(url, name) { this.url = url; this.name = name; this.raw = []; this.msgs = []; this.v = null; this.waiters = []; }
  async open() {
    this.ws = new WebSocket(this.url);
    this.ws.onmessage = (e) => {
      this.raw.push({ at: Date.now(), text: e.data });
      const m = JSON.parse(e.data); this.msgs.push(m);
      if (m.t === 'state') this.v = m.v;
      if (m.t === 'joined') { this.code = m.code; this.token = m.token; }
      for (const w of [...this.waiters]) if (w.f(m)) { this.waiters.splice(this.waiters.indexOf(w), 1); w.r(m); }
    };
    await new Promise((r, j) => { this.ws.onopen = r; this.ws.onerror = j; });
    return this;
  }
  send(o) { this.ws.send(typeof o === 'string' ? o : JSON.stringify(o)); }
  next(f, ms = 3000) {
    return new Promise((r, j) => {
      const w = { f, r }; this.waiters.push(w);
      setTimeout(() => { const i = this.waiters.indexOf(w); if (i >= 0) { this.waiters.splice(i, 1); j(new Error(`${this.name}: hết giờ chờ`)); } }, ms);
    });
  }
  /** gửi rồi chờ phản hồi err của đúng lệnh này (hoặc null nếu trong `ms` không có lỗi) */
  async tryCmd(o, ms = 150) {
    const n = this.msgs.length; this.send(o); await sleep(ms);
    return this.msgs.slice(n).find((m) => m.t === 'err')?.code ?? null;
  }
  waitPhase(ph, ms = 4000) { return this.v?.phase === ph ? Promise.resolve() : this.next((m) => m.t === 'state' && m.v.phase === ph, ms); }
  get me() { return this.v.players[this.v.seat]; }
  get role() { return this.me.role; }
  close() { this.ws.close(); }
}

/** Mở phòng n người: người 0 tạo, các người khác vào bằng mã. */
export async function table(url, n = 6) {
  const cs = [];
  for (let i = 0; i < n; i++) cs.push(await new Client(url, `P${i}`).open());
  cs[0].send({ t: 'create', name: 'Chủ phòng' });
  await cs[0].next((m) => m.t === 'joined');
  for (let i = 1; i < n; i++) { cs[i].send({ t: 'join', code: cs[0].code, name: `Người ${i}` }); await cs[i].next((m) => m.t === 'joined'); }
  await sleep(50);
  return cs;
}

export const allPhase = (cs, ph, ms) => Promise.all(cs.map((c) => c.waitPhase(ph, ms)));

export async function startGame(cs) {
  cs[0].send({ t: 'start' });
  await Promise.all(cs.map((c) => c.waitPhase('night')));
  const by = (r) => cs.filter((c) => c.role === r);
  return { cs, moles: by('mole'), hacker: by('hacker')[0], security: by('security')[0], agents: by('agent') };
}

/**
 * Kiểm toàn bộ gói tin một client đã nhận: không bao giờ thấy vai người khác trừ khi được phép.
 * Trả danh sách vi phạm (rỗng = sạch).
 */
export function leaks(c, moleSeats) {
  const bad = [];
  for (const { text } of c.raw) {
    const m = JSON.parse(text);
    if (m.t !== 'state') continue;
    const v = m.v, me = v.seat, iMole = moleSeats.includes(me), over = v.phase === 'end';
    for (const p of v.players) {
      if (!('role' in p)) continue;
      const ok = p.seat === me || over || !p.alive || (iMole && moleSeats.includes(p.seat) && p.role === 'mole');
      if (!ok) bad.push(`${c.name} thấy vai ghế ${p.seat} (${p.role}) ở pha ${v.phase}`);
    }
    if (!iMole && ('moleChat' in v || v.night?.pack)) bad.push(`${c.name} (không phải Nội Gián) nhận kênh mã hóa`);
    if (v.scan && v.players[me].role !== 'hacker') bad.push(`${c.name} nhận kết quả quét`);
  }
  return bad;
}
