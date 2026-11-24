// Danh mục vụ án (thứ tự mở khoá). Mỗi vụ là một file data/cases/<id>.js do agent viết vụ tạo.
// Game nạp động từng vụ; file chưa có thì thẻ vụ hiện "Sắp ra mắt". KHÔNG sửa danh sách này ngoài coordinator.
export const CASES = [
  { id: "noi-thit-kho", no: 1, title: "Nồi Thịt Kho Bốc Hơi", difficulty: 1 },
  { id: "chien-ke", no: 2, title: "Chiến Kê Mất Tích", difficulty: 1 },
  { id: "tra-sua-van-phong", no: 3, title: "Ly Trà Sữa Văn Phòng", difficulty: 2 },
  { id: "mat-wifi", no: 4, title: "Đêm Chung Kết Mất Wifi", difficulty: 2 },
  { id: "dam-cuoi-toang", no: 5, title: "Livestream Đám Cưới Toang", difficulty: 3 },
  { id: "nhan-dam-hoi", no: 6, title: "Chiếc Nhẫn Trong Đám Hỏi", difficulty: 3 },
  // Mùa 2: Chợ Hẻm 47 (bản đồ hem-map-2)
  { id: "ve-so", no: 7, title: "Tờ Vé Số Bốc Hơi", difficulty: 2, season: 2 },
  { id: "karaoke", no: 8, title: "Đêm Karaoke Cúp Điện", difficulty: 2, season: 2 },
  { id: "meo-mat-tich", no: 9, title: "Hoàng Thượng Mất Tích", difficulty: 2, season: 2 },
  { id: "tat-nien", no: 10, title: "Phong Bì Tất Niên", difficulty: 3, season: 2 },
  { id: "ma-nha-13", no: 11, title: "Con Ma Nhà Số 13", difficulty: 3, season: 2 },
  { id: "tham-tu-gia", no: 12, title: "Thám Tử Giả Mạo", difficulty: 3, season: 2 },
];
