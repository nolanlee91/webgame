// Danh mục vụ án (thứ tự mở khoá). Mỗi vụ là một file data/cases/<id>.js do agent viết vụ tạo.
// Game nạp động từng vụ; file chưa có thì thẻ vụ hiện "Sắp ra mắt". KHÔNG sửa danh sách này ngoài coordinator.
export const CASES = [
  { id: "noi-thit-kho", no: 1, title: "Nồi Thịt Kho Bốc Hơi", difficulty: 1 },
  { id: "chien-ke", no: 2, title: "Chiến Kê Mất Tích", difficulty: 1 },
  { id: "tra-sua-van-phong", no: 3, title: "Ly Trà Sữa Văn Phòng", difficulty: 2 },
  { id: "mat-wifi", no: 4, title: "Đêm Chung Kết Mất Wifi", difficulty: 2 },
  { id: "dam-cuoi-toang", no: 5, title: "Livestream Đám Cưới Toang", difficulty: 3 },
  { id: "nhan-dam-hoi", no: 6, title: "Chiếc Nhẫn Trong Đám Hỏi", difficulty: 3 },
];
