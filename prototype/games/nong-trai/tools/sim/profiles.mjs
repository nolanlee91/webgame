// Hồ sơ người chơi cho bộ mô phỏng. Giờ trong ngày tính theo phút từ 0:00 của ngày mô phỏng.
// sessions: [{ start (phút trong ngày), len (phút) }]. checkSec: khoảng giữa 2 lần "nhìn màn hình" khi đang chơi.
// tapsPerMin: số chạm tối đa mỗi phút khi đang chơi (gieo 1 ô = 1 chạm, tưới 1 ô = 1 chạm, "Thu hết" = 1 chạm, mỗi giao đơn / bán / xây = 1 chạm).
// leaveLong: trước khi rời máy thì gieo cây theo thời gian tới phiên sau (mọi hồ sơ đều làm vậy qua chính sách chọn cây —
// cờ này chỉ để ghi nhận ý định của hồ sơ trong báo cáo).

function every(fromMin, toMin, stepMin, len) {
  const out = [];
  for (let t = fromMin; t + len <= toMin; t += stepMin) out.push({ start: t, len });
  return out;
}

export const PROFILES = {
  cham: {
    id: "cham", name: "Chăm", desc: "Phiên 30 phút liên tục, nghỉ 30 phút, 8:00–22:00 (14 phiên ≈ 7 giờ/ngày), nhìn màn hình mỗi phút",
    sessions: every(8 * 60, 22 * 60, 60, 30), checkSec: 60, tapsPerMin: 30, leaveLong: true,
  },
  "thinh-thoang": {
    id: "thinh-thoang", name: "Thỉnh thoảng", desc: "3 phiên/ngày × 10 phút (8:00, 13:00, 20:00), thao tác mỗi 30 giây khi đang chơi",
    sessions: [{ start: 8 * 60, len: 10 }, { start: 13 * 60, len: 10 }, { start: 20 * 60, len: 10 }], checkSec: 30, tapsPerMin: 30, leaveLong: true,
  },
  "ngay-2-lan": {
    id: "ngay-2-lan", name: "Ngày 2 lần", desc: "2 phiên/ngày × 5 phút (8:00, 20:00), gieo cây dài trước khi rời, thao tác mỗi 30 giây",
    sessions: [{ start: 8 * 60, len: 5 }, { start: 20 * 60, len: 5 }], checkSec: 30, tapsPerMin: 30, leaveLong: true,
  },
};
export const PROFILE_IDS = Object.keys(PROFILES);
/** Bí danh có dấu / không dấu cho dòng lệnh. */
export const ALIASES = { "chăm": "cham", "thỉnh-thoảng": "thinh-thoang", "thinhthoang": "thinh-thoang", "ngay2lan": "ngay-2-lan", "ngày-2-lần": "ngay-2-lan" };

/** Danh sách phiên tuyệt đối (ms từ mốc t0) trong `days` ngày. */
export function sessionTimeline(profile, days, t0) {
  const out = [];
  for (let d = 0; d < days; d++) {
    for (const ses of profile.sessions) {
      const start = t0 + (d * 1440 + ses.start) * 60_000;
      out.push({ start, end: start + ses.len * 60_000 });
    }
  }
  return out;
}
