// Hồ sơ người chơi cho bộ mô phỏng cân bằng Tiệm Bánh Mì (chép khung Trà Sữa tools/sim/profiles.mjs). Thời gian tính bằng ms "chơi thật".
// tap: mỗi lần bấm (một bước ráp, ghim, giao, rút lò). read: đọc phiếu lúc ghim. miss: xác suất sai ở từng bước (đổi lượng phết / ớt, quên "không hành",
// nhầm nhân, gói sai). react: giây trễ từ lúc lò vào vùng chín tới lúc rút [min, max] (người ẩu có khi tới xém / cháy). prepSec: số giây canh mẻ đầu ngày.
// prep / summary / dialog: thời gian ở Chuẩn bị ca (chưa tính canh mẻ đầu, mỗi mẻ ~30 giây thật), Chốt ca, mỗi hội thoại (đồng hồ ca dừng).
// pinSmart: ghim khách sắp hết kiên nhẫn trước. stock: hệ số nhập thêm ngoài "Nhập đủ cho hôm nay". shopping: "plan" | "impulse".
// change: xác suất thối sai một lần (từ ngày 4). toastSoggy: nướng lại ổ ỉu dù phiếu không dặn. cookAhead: chiên trứng / nướng thịt sẵn khi rảnh.
export const PROFILES = {
  careful: {
    id: "careful", name: "Cẩn thận", desc: "Đọc kỹ phiếu (sai 1–3%), canh lò sát, ghim khách sắp bỏ về trước, nhập theo dự báo, để dành mua đồ có ích, nấu sẵn trứng / thịt.",
    tap: 600, read: 1100, miss: { spread: 0.02, veg: 0.02, spice: 0.02, fill: 0.01, wrap: 0.01 }, react: [0.5, 2.5], prepSec: [27, 30], change: 0.01,
    prep: 40000, summary: 22000, dialog: 13000, pinSmart: true, stock: 1.2, shopping: "plan", complaint: "remake", reply: 0.5, toastSoggy: true, cookAhead: true, fair: true, challenge: true,
  },
  average: {
    id: "average", name: "Trung bình", desc: "Sai 3–7% (ớt, rau, lượng phết), rút lò trễ 1–5 giây, nhập vừa đủ, mua đồ khi dư tiền.",
    tap: 720, read: 1400, miss: { spread: 0.06, veg: 0.05, spice: 0.06, fill: 0.02, wrap: 0.03 }, react: [1, 5], prepSec: [25, 32], change: 0.04,
    prep: 30000, summary: 16000, dialog: 10000, pinSmart: true, stock: 1.05, shopping: "plan", complaint: "discount", reply: 0.3, toastSoggy: true, cookAhead: true, fair: true, challenge: false,
  },
  sloppy: {
    id: "sloppy", name: "Ẩu", desc: "Bấm nhanh mà sai nhiều (10–16%), rút lò trễ 2–9 giây (hay xém, đôi khi cháy), ghim theo thứ tự, nhập sát nút, mua đồ theo hứng.",
    tap: 600, read: 800, miss: { spread: 0.14, veg: 0.12, spice: 0.16, fill: 0.05, wrap: 0.08 }, react: [2, 9], prepSec: [22, 36], change: 0.12,
    prep: 18000, summary: 8000, dialog: 6000, pinSmart: false, stock: 0.85, shopping: "impulse", complaint: "free", reply: 0.1, toastSoggy: false, cookAhead: false, fair: false, challenge: false,
  },
};
export const PROFILE_IDS = Object.keys(PROFILES);
