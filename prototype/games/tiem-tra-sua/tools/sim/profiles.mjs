// Hồ sơ người chơi cho bộ mô phỏng cân bằng Tiệm Trà Sữa. Thời gian tính bằng ms "thời gian chơi thật".
// tap: mỗi lần bấm (một bước pha, ghim, giao, nấu) tốn bao lâu. read: đọc phiếu trước khi pha ly đầu của đơn.
// miss: xác suất chọn sai ở từng bước (chọn một lựa chọn khác cùng bước). lid: quên đóng nắp mà vẫn giao.
// prep / summary / dialog: thời gian ở bảng Chuẩn bị ca, Chốt ca, mỗi hội thoại (đồng hồ ca dừng).
// pinSmart: ghim khách sắp hết kiên nhẫn trước (người cẩn thận) hay ghim theo thứ tự tới (người ẩu).
// stockPlan: hệ số nhập hàng so với dự kiến (ẩu: chỉ nhập khi gần hết, hay hết hàng giữa ca và phải nhập gấp).
// shopping: "plan" (để dành mua máy có ích) | "impulse" (thấy đồ trang trí là mua, ít để dành).
export const PROFILES = {
  careful: {
    id: "careful", name: "Cẩn thận", desc: "Đọc kỹ phiếu, ít sai (2–3%), ghim khách sắp bỏ về trước, nhập hàng theo dự báo, để dành mua máy.",
    tap: 700, read: 1400, miss: { base: 0.01, add: 0.01, sugar: 0.03, ice: 0.03, topping: 0.01 }, lid: 0.005,
    prep: 55000, summary: 25000, dialog: 14000, pinSmart: true, stockPlan: 1.3, shopping: "plan", complaint: "remake", reply: 0.5,
  },
  average: {
    id: "average", name: "Trung bình", desc: "Sai 4–8% ở đường / đá, đôi khi quên nắp, nhập hàng đủ dùng, mua máy khi dư tiền.",
    tap: 900, read: 1900, miss: { base: 0.03, add: 0.03, sugar: 0.08, ice: 0.08, topping: 0.04 }, lid: 0.02,
    prep: 45000, summary: 18000, dialog: 11000, pinSmart: true, stockPlan: 1.1, shopping: "plan", complaint: "discount", reply: 0.3,
  },
  sloppy: {
    id: "sloppy", name: "Ẩu", desc: "Bấm nhanh mà sai nhiều (đường / đá 18%, nhầm món 7%), quên nắp 6%, ghim theo thứ tự, nhập hàng sát nút, mua đồ theo hứng.",
    tap: 800, read: 1200, miss: { base: 0.07, add: 0.07, sugar: 0.18, ice: 0.18, topping: 0.08 }, lid: 0.06,
    prep: 30000, summary: 10000, dialog: 7000, pinSmart: false, stockPlan: 0.8, shopping: "impulse", complaint: "refund", reply: 0.1,
  },
};
export const PROFILE_IDS = Object.keys(PROFILES);
