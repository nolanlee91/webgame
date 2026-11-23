// Hồ sơ người chơi cho bộ mô phỏng cân bằng Quán Cơm Tấm (chép khung Bánh Mì tools/sim/profiles.mjs). Thời gian tính bằng ms "chơi thật".
// tap: mỗi lần bấm (đồng hồ ca vẫn chạy). react: giây trễ từ lúc mặt dưới miếng thịt chín (≥ 100) tới lúc lật / gắp [min, max].
// miss: xác suất sai mỗi dĩa — layer: quên một lớp phụ (đồ chua / dưa leo / mỡ hành), quirk: bỏ sót một dặn riêng, bill: chạm nhầm dòng nhiễu
// hoặc sót một dòng khi tính tiền tay. leaveSafe: chỉ rời bếp (giao việc ở bàn) khi miếng sắp cần tay còn ≥ n giây (0 = rời bất kể).
// zone: chỗ bỏ thịt ưu tiên ("mid" vùng vừa cửa sổ chín rộng, "hot" vùng nóng nhanh mà hẹp). ahead: số miếng nướng sẵn tối đa so với phiếu chờ.
// prep / between / summary / dialog: thời gian ở Chuẩn bị (đầu ngày), giữa hai ca, Chốt ca, mỗi hội thoại (đồng hồ ca dừng).
// shopping: "plan" để dành theo thứ tự đồ có ích (thuê quán ở cấp 7) | "impulse" mua theo hứng. lunch: mở ca trưa từ cấp 5.
export const PROFILES = {
  careful: {
    id: "careful", name: "Cẩn thận", desc: "Canh bếp sát (lật trễ 0,3–1,6 giây), bỏ thịt vùng vừa, chỉ rời bếp khi miếng còn an toàn, đọc kỹ phiếu (sai 2–3%), nhập theo dự báo, để dành mua đồ có ích.",
    tap: 650, react: [0.3, 1.6], miss: { layer: 0.02, quirk: 0.03, bill: 0.02 }, leaveSafe: 5.5, zone: "mid", ahead: 2, maxPending: 3,
    prep: 50000, between: 20000, summary: 20000, dialog: 12000, shopping: "plan", lunch: true, reply: 0.5, complaint: "remake", fair: true, challenge: true, accept: 2, ghiSo: 0.8,
  },
  average: {
    id: "average", name: "Trung bình", desc: "Lật trễ 0,8–3,2 giây, bỏ thịt vùng vừa, có khi rời bếp lúc miếng sắp chín, sai 5–8%, nhập vừa đủ, mua đồ khi dư tiền.",
    tap: 800, react: [0.8, 3.2], miss: { layer: 0.05, quirk: 0.08, bill: 0.06 }, leaveSafe: 4.5, zone: "mid", ahead: 2, maxPending: 3,
    prep: 40000, between: 15000, summary: 15000, dialog: 9000, shopping: "plan", lunch: true, reply: 0.3, complaint: "discount", fair: true, challenge: true, accept: 1, ghiSo: 0.6,
  },
  sloppy: {
    id: "sloppy", name: "Ẩu", desc: "Bấm nhanh mà sai nhiều (12–20%), lật trễ 1,5–5,5 giây (hay cháy cạnh, đôi khi cháy đen), bỏ thịt vùng nóng, rời bếp bất kể, mua đồ theo hứng.",
    tap: 650, react: [1, 4], miss: { layer: 0.12, quirk: 0.2, bill: 0.14 }, leaveSafe: 0, zone: "hot", ahead: 1,
    prep: 25000, between: 8000, summary: 8000, dialog: 5000, shopping: "impulse", lunch: true, reply: 0.1, complaint: "free", fair: false, challenge: false, accept: 1, ghiSo: 0.4,
  },
};
export const PROFILE_IDS = Object.keys(PROFILES);
