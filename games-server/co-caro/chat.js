// Trò chuyện trong phòng — tin nhắn đi qua máy chủ rồi máy chủ phát lại cho mọi ghế (các máy không nói chuyện trực tiếp).
// Người gửi do MÁY CHỦ xác định từ ghế của kết nối (token), client không tự khai tên/ghế → không giả danh được người khác.
// Chặn spam: tối đa CHAT.maxLen ký tự / tin, mỗi người tối đa CHAT.burst tin liền nhau rồi CHAT.perSec tin/giây.
// Chỉ giữ CHAT.keep tin gần nhất trong bộ nhớ của phòng — phòng đóng là mất, không lưu đâu cả.
"use strict";

const CHAT = { maxLen: 200, keep: 40, burst: 4, perSec: 0.7 };
// ký tự điều khiển, ký tự vô hình / đảo chiều chữ (đủ nhóm Bidi_Control: U+061C, 200E–200F, 202A–202E, 2066–2069) — dựng từ mã số
// để file không chứa ký tự vô hình
const hex4 = (c) => "\\" + "u" + c.toString(16).padStart(4, "0");
const BAD = new RegExp("[" + [[0, 0x1f], [0x7f, 0x9f], [0x61c, 0x61c], [0x200b, 0x200f], [0x2028, 0x202e], [0x2060, 0x2069], [0xfeff, 0xfeff]].map(([a, b]) => hex4(a) + "-" + hex4(b)).join("") + "]", "g");

class Chat {
  constructor(clock) { this.clock = clock; this.list = []; this.id = 0; this.buckets = new Map(); this.parked = new Map(); }

  refill(b, now) { b.n = Math.min(CHAT.burst, b.n + ((now - b.at) / 1000) * CHAT.perSec); b.at = now; return b; }

  /** p: người gửi phía máy chủ ({ token, name }). Trả { ok } hoặc { err: "bad" | "long" | "chat-slow" }. */
  post(p, raw) {
    if (typeof raw !== "string" || raw.length > 2000) return { err: raw && raw.length > 2000 ? "long" : "bad" };
    const text = raw.replace(BAD, " ").replace(/\s+/g, " ").trim();
    if (!text) return { err: "bad" };
    if ([...text].length > CHAT.maxLen) return { err: "long" };
    const now = this.clock.now();
    const b = this.refill(this.buckets.get(p.token) || { n: CHAT.burst, at: now }, now);
    this.buckets.set(p.token, b);
    if (b.n < 1) return { err: "chat-slow" };
    b.n -= 1;
    this.list.push({ id: ++this.id, tok: p.token, name: p.name, text, at: now });
    if (this.list.length > CHAT.keep) this.list.shift();
    return { ok: true };
  }

  /** Người rời phòng: hạn mức chat còn lại được "gửi giữ" theo IP — rời rồi vào lại (token mới) không được làm mới hạn mức. */
  forget(token, ip) {
    const b = this.buckets.get(token); this.buckets.delete(token);
    if (!b || !ip) return;
    const now = this.clock.now(), old = this.parked.get(ip);
    this.refill(b, now);
    if (!old || this.refill(old, now).n > b.n) this.parked.set(ip, b);
    if (this.parked.size > 64) this.parked.delete(this.parked.keys().next().value);
  }

  /** Người mới vào phòng từ IP từng có người rời: nhận lại hạn mức đã gửi giữ (người cùng IP đang ngồi không bị ảnh hưởng). */
  claim(token, ip) {
    const b = ip && this.parked.get(ip);
    if (b) { this.parked.delete(ip); this.buckets.set(token, b); }
  }

  /** Danh sách gửi cho người có token `me` — không chứa token của ai, chỉ đánh dấu tin của chính mình. */
  view(me) { return this.list.map((c) => ({ id: c.id, name: c.name, text: c.text, at: c.at, mine: c.tok === me })); }
}

module.exports = { Chat, CHAT };
