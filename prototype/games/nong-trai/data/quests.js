// Nhiệm vụ hướng dẫn (DESIGN-2.0 §5) — mỗi nhiệm vụ dạy 1 cơ chế, tiến độ chỉ tính từ khi nhiệm vụ đang mở.
// event: loại sự kiện từ core/apply.js được đếm; level: điều kiện theo trạng thái (cấp ≥ n).
// target: điều khiển giao diện cần chỉ (mũi tên + viền sáng). arrow: có hiện mũi tên không (vài bước đầu).
export const QUEST_GIVER = "chi-ba";
export const TUTORIAL = [
  { id: "gieo-hat", title: "Gieo hạt đầu tiên", hint: "Chọn hạt cà rốt ở khay dưới, rồi chạm một ô đất trống.", event: "planted", count: 1, reward: { coins: 6, xp: 2 }, target: "plot-empty", arrow: true },
  { id: "tuoi-cay", title: "Tưới cây", hint: "Bấm “Tưới nước” rồi chạm cây đang lớn — cây lớn nhanh hơn 30%.", event: "watered", count: 1, reward: { coins: 6, xp: 2 }, target: "plot-growing", arrow: true },
  { id: "thu-hoach", title: "Thu hoạch 3 nông sản", hint: "Cây chín có viền vàng — chạm để cất vào kho.", event: "harvested", count: 3, reward: { coins: 10, xp: 3 }, target: "plot-ready", arrow: true },
  { id: "ban-hang", title: "Bán nông sản", hint: "Mở Kho (hoặc chạm Quầy nông sản) rồi bấm Bán.", event: "sold", count: 1, reward: { coins: 10, xp: 3 }, target: "sell", arrow: true },
  { id: "giao-don", title: "Giao đơn hàng đầu tiên", hint: "Mở Bảng đơn, gom đủ món rồi bấm “Giao”. Đơn trả cao hơn chợ.", event: "delivered", count: 1, reward: { coins: 20, xp: 5 }, target: "orders", arrow: true },
  { id: "mo-o-dat", title: "Mở thêm 1 ô đất", hint: "Từ cấp 2: chạm ô cỏ có giá cạnh ruộng, chạm lần nữa để mua.", event: "plotBought", count: 1, reward: { coins: 20, xp: 5 }, target: "plot-buy", arrow: false },
  { id: "nang-kho", title: "Nâng cấp Nhà kho", hint: "Kho đầy thì hàng thu hoạch rơi vào giỏ tràn. Mở Kho và nâng lên 90 chỗ.", event: "warehouseUpgraded", count: 1, reward: { coins: 30, xp: 8 }, target: "warehouse-upgrade", arrow: false },
  { id: "len-cap-3", title: "Lên cấp 3", hint: "Thu hoạch và giao đơn để lấy kinh nghiệm. Cấp 3 mở cây ngô và ô đơn thứ 4.", level: 3, count: 1, reward: { coins: 40, xp: 0 }, target: null, arrow: false },
];
