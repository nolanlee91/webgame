// "Ván tiếp" hai phía cho các phòng cờ 1v1 / 2v2 (Cờ Caro, Cờ Vua, Cờ Tướng, Ô Ăn Quan) — BRD-09.
// Trước đây một người bấm "Ván tiếp" là ván mới chạy ngay, thẻ kết quả của người kia tự đóng (không kịp Khoe kết quả).
// Giờ: bấm "Ván tiếp" = "tôi sẵn sàng". Mọi người trong phòng đều sẵn sàng ⇒ mở ván mới ngay; chưa đủ ⇒ đếm ngược
// (mặc định 10 giây, cả phòng cùng thấy hạn `againDeadline` theo giờ máy chủ) rồi mới mở ván mới.
// Danh sách sẵn sàng theo token ghế (không theo số ghế — ghế có thể dồn khi có người rời; rời / mời ra thì phòng về phòng chờ
// và room gọi reset()). Client cũ không biết các trường mới: vẫn gửi "again" như trước, ván mới mở sau đếm ngược.
"use strict";

const AGAIN_MS = 10000;

class Rematch {
  constructor(clock, ms = AGAIN_MS) {
    this.clock = clock;
    this.ms = Number.isFinite(ms) && ms >= 0 ? ms : AGAIN_MS;
    this.ready = new Set(); // token các ghế đã bấm "Ván tiếp"
    this.deadline = 0;      // giờ máy chủ (ms) sẽ tự mở ván mới; 0 = chưa ai bấm
    this.timer = null;
  }

  /**
   * Ghế `token` bấm "Ván tiếp". players: ghế hiện tại ({ token }); go(): mở ván mới (room tự kiểm pha / đủ người).
   * Trả "go" (mọi người đã sẵn sàng — đã gọi go) hoặc "wait" (đang đếm ngược).
   */
  vote(token, players, go) {
    if (token) this.ready.add(token);
    const all = players.length > 0 && players.every((p) => p && p.token && this.ready.has(p.token));
    if (all) { this.reset(); go(); return "go"; }
    if (!this.deadline) {
      this.deadline = this.clock.now() + this.ms;
      this.timer = this.clock.setTimeout(() => { this.timer = null; this.reset(); go(); }, this.ms);
      this.timer?.unref?.();
    }
    return "wait";
  }

  /** Huỷ đếm ngược + quên ai đã sẵn sàng (mở ván mới, về phòng chờ, đóng phòng). */
  reset() {
    if (this.timer) this.clock.clearTimeout(this.timer);
    this.timer = null; this.deadline = 0; this.ready.clear();
  }

  /** Cờ sẵn sàng theo thứ tự ghế — gửi trong viewFor() để client hiện "Đối thủ muốn chơi tiếp". */
  flags(players) { return players.map((p) => !!(p && p.token && this.ready.has(p.token))); }
}

module.exports = { Rematch, AGAIN_MS };
