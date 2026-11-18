// Trò chuyện trong phòng — tin nhắn đi qua máy chủ rồi máy chủ phát lại cho mọi ghế (các máy không nói chuyện trực tiếp).
// Người gửi do MÁY CHỦ xác định từ ghế của kết nối (token), client không tự khai tên/ghế → không giả danh được người khác.
// Chặn spam: tối đa CHAT.maxLen ký tự / tin, mỗi người tối đa CHAT.burst tin liền nhau rồi CHAT.perSec tin/giây.
// Chỉ giữ CHAT.keep tin gần nhất trong bộ nhớ của phòng — phòng đóng là mất, không lưu đâu cả.
"use strict";

const CHAT = { maxLen: 200, keep: 40, burst: 4, perSec: 0.7 };
// ký tự điều khiển, ký tự vô hình / đảo chiều chữ (bidi) — dựng từ mã số để file không chứa ký tự vô hình
const hex4 = (c) => "\\" + "u" + c.toString(16).padStart(4, "0");
const BAD = new RegExp("[" + [[0, 0x1f], [0x7f, 0x9f], [0x200b, 0x200f], [0x2028, 0x202e], [0x2066, 0x2069], [0xfeff, 0xfeff]].map(([a, b]) => hex4(a) + "-" + hex4(b)).join("") + "]", "g");

class Chat {
  constructor(clock) { this.clock = clock; this.list = []; this.id = 0; this.buckets = new Map(); }

  /** p: người gửi phía máy chủ ({ token, name }). Trả { ok } hoặc { err: "bad" | "long" | "chat-slow" }. */
  post(p, raw) {
    if (typeof raw !== "string" || raw.length > 2000) return { err: raw && raw.length > 2000 ? "long" : "bad" };
    const text = raw.replace(BAD, " ").replace(/\s+/g, " ").trim();
    if (!text) return { err: "bad" };
    if ([...text].length > CHAT.maxLen) return { err: "long" };
    const now = this.clock.now();
    const b = this.buckets.get(p.token) || { n: CHAT.burst, at: now };
    b.n = Math.min(CHAT.burst, b.n + ((now - b.at) / 1000) * CHAT.perSec); b.at = now;
    this.buckets.set(p.token, b);
    if (b.n < 1) return { err: "chat-slow" };
    b.n -= 1;
    this.list.push({ id: ++this.id, tok: p.token, name: p.name, text, at: now });
    if (this.list.length > CHAT.keep) this.list.shift();
    return { ok: true };
  }

  forget(token) { this.buckets.delete(token); }

  /** Danh sách gửi cho người có token `me` — không chứa token của ai, chỉ đánh dấu tin của chính mình. */
  view(me) { return this.list.map((c) => ({ id: c.id, name: c.name, text: c.text, at: c.at, mine: c.tok === me })); }
}

module.exports = { Chat, CHAT };
