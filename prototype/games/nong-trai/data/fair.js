// Phiên chợ (DESIGN-2.0 §3 cấp 18, §2.8 — Milestone 6). Thuần dữ liệu — luật ở core/fair.js.
// Mỗi ngày (giờ Việt Nam, UTC+7) có MỘT phiên 30 phút, giờ bắt đầu tất định theo ngày trong khung 9:00–21:30 (bước 30 phút)
// ⇒ không random giấu, mọi thiết bị thấy cùng giờ, không lưu gì ngoài số món "hàng săn" đã bán trong phiên.
// Trong phiên (người chơi cấp ≥ 18):
//   • mọi thành phẩm bán giá CỐ ĐỊNH gốc × 1,25 (không dao động) — §3 "giá thành phẩm +25 % trong 30 ph";
//   • 3 "hàng săn" của Cô Hai (1 nông sản + 2 món chăn nuôi / thành phẩm, đổi theo ngày): gốc × 1,5 cho 10 món đầu mỗi loại,
//     quá 10 món ⇒ về giá phiên (thành phẩm) hoặc giá chợ thường.
// Chống lời vô hạn (core/market.js assertEconomy): thức ăn mua 72 xu ⇒ mua thức ăn → sữa → bơ / phô mai vẫn lỗ cả ở giá ×1,5.
export const FAIR_DURATION_MS = 30 * 60_000;
export const FAIR_TZ_MS = 7 * 3600_000;          // giờ Việt Nam
export const FAIR_FIRST_MIN = 9 * 60;            // phiên sớm nhất 9:00
export const FAIR_SLOTS = 26;                    // 9:00, 9:30, …, 21:30
export const FAIR_SLOT_MIN = 30;
export const FAIR_GOODS_MULT = 1.25;             // thành phẩm trong phiên
export const FAIR_HOT_MULT = 1.5;                // hàng săn
export const FAIR_HOT_CAP = 10;                  // món mỗi loại hàng săn / phiên
export const FAIR_HOT_COUNT = Object.freeze({ crop: 1, goods: 2 });
/** Câu Cô Hai trong phiên chợ ({hot} = tên hàng săn). Xoay vòng ở cảnh Khu chợ. */
export const FAIR_LINES = [
  "Phiên chợ tới rồi! Thành phẩm hôm nay cô trả thêm một phần tư nha.",
  "Bà con dưới xuôi lên hỏi {hot} quá trời, có bao nhiêu cô lấy hết mười món đầu!",
  "Cờ treo rồi, trống đánh rồi, ai có {hot} thì mang ra đây lẹ.",
  "Phiên này ngắn lắm, nửa tiếng thôi. Bán lẹ kẻo lỡ!",
  "Hồi nãy có ông khách mua một lèo năm hũ mứt, cười tới mang tai.",
  "Giá phiên chợ là giá chốt, không lên không xuống, con khỏi canh mũi tên.",
  "Ai đem {hot} tới trước cô trả giá rưỡi, ai tới sau thì giá phiên thôi nghen.",
  "Chợ đông vầy mới vui, ngày thường cô ngồi đếm ruồi.",
  "Anh Út chở hàng không kịp, phiên sau chắc phải thuê thêm xe.",
  "Bánh trái hôm nay bán chạy như tôm tươi, nhớ để dành vài cái cho đơn Bác Tư.",
];
