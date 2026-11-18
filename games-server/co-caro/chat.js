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

// Hạn mức tính trên HAI lớp, đều phải còn mới gửi được:
//  • theo người (token): CHAT.burst tin liền rồi CHAT.perSec tin/giây;
//  • theo IP trong phòng: sống suốt đời phòng (không xoá khi rời) — sức chứa và tốc độ hồi = hạn mức 1 người × số ghế đang ngồi từ IP đó.
//    Rời rồi vào lại (token mới) hay mở thêm kết nối phụ cùng IP không làm đầy lại được; mấy người chung mạng (cùng nhà) vẫn mỗi người đủ phần.
class Chat {
  constructor(clock) { this.clock = clock; this.list = []; this.id = 0; this.buckets = new Map(); this.ips = new Map(); }

  static refill(b, now, k = 1) { b.n = Math.min(CHAT.burst * k, b.n + ((now - b.at) / 1000) * CHAT.perSec * k); b.at = now; return b; }

  /** p: người gửi phía máy chủ ({ token, name, ip }); seats: số ghế đang ngồi từ IP của p (>= 1).
   *  Trả { ok } hoặc { err: "bad" | "long" | "chat-slow" }. */
  post(p, raw, seats = 1) {
    if (typeof raw !== "string" || raw.length > 2000) return { err: raw && raw.length > 2000 ? "long" : "bad" };
    const text = raw.replace(BAD, " ").replace(/\s+/g, " ").trim();
    if (!text) return { err: "bad" };
    if ([...text].length > CHAT.maxLen) return { err: "long" };
    const now = this.clock.now(), k = Math.max(1, seats | 0);
    const b = Chat.refill(this.buckets.get(p.token) || { n: CHAT.burst, at: now }, now);
    this.buckets.set(p.token, b);
    let ib = null;
    if (p.ip) {
      ib = this.ips.get(p.ip);
      if (!ib) { ib = { n: CHAT.burst * k, at: now }; this.ips.set(p.ip, ib); if (this.ips.size > 64) this.ips.delete(this.ips.keys().next().value); }
      Chat.refill(ib, now, k);
    }
    if (b.n < 1 || (ib && ib.n < 1)) return { err: "chat-slow" };
    b.n -= 1; if (ib) ib.n -= 1;
    this.list.push({ id: ++this.id, tok: p.token, name: p.name, text, at: now });
    if (this.list.length > CHAT.keep) this.list.shift();
    return { ok: true };
  }

  /** Người rời phòng: bỏ hạn mức theo token (hạn mức theo IP vẫn giữ nguyên). */
  forget(token) { this.buckets.delete(token); }

  /** Danh sách gửi cho người có token `me` — không chứa token của ai, chỉ đánh dấu tin của chính mình. */
  view(me) { return this.list.map((c) => ({ id: c.id, name: c.name, text: c.text, at: c.at, mine: c.tok === me })); }
}

module.exports = { Chat, CHAT };
