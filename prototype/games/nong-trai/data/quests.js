// Nhiệm vụ hướng dẫn (DESIGN-2.0 §5) — mỗi nhiệm vụ dạy 1 cơ chế, tiến độ chỉ tính từ khi nhiệm vụ đang mở.
// event: loại sự kiện từ core/apply.js được đếm; level: điều kiện theo trạng thái (cấp ≥ n).
// target: điều khiển giao diện cần chỉ (mũi tên + viền sáng). arrow: có hiện mũi tên không (vài bước đầu).
export const QUEST_GIVER = "chi-ba";
export const TUTORIAL = [
  { id: "gieo-hat", title: "Gieo hạt đầu tiên", hint: "Chọn hạt cà rốt ở khay dưới, rồi chạm một ô đất trống.", event: "planted", count: 1, reward: { coins: 6, xp: 8 }, target: "plot-empty", arrow: true },
  { id: "tuoi-cay", title: "Tưới cây", hint: "Bấm “Tưới nước” rồi chạm cây đang lớn — cây lớn nhanh hơn 30%.", event: "watered", count: 1, reward: { coins: 6, xp: 8 }, target: "plot-growing", arrow: true },
  { id: "thu-hoach", title: "Thu hoạch 3 nông sản", hint: "Cây chín có viền vàng — chạm để cất vào kho.", event: "harvested", count: 3, reward: { coins: 10, xp: 12 }, target: "plot-ready", arrow: true },
  { id: "ban-hang", title: "Bán nông sản", hint: "Mở Kho (hoặc chạm Khu chợ trên bản đồ) rồi bấm Bán — giá theo chợ hôm nay.", event: "sold", count: 1, reward: { coins: 10, xp: 12 }, target: "sell", arrow: true },
  { id: "giao-don", title: "Giao đơn hàng đầu tiên", hint: "Mở Bảng đơn, gom đủ món rồi bấm “Giao”. Đơn trả cao hơn chợ.", event: "delivered", count: 1, reward: { coins: 20, xp: 20 }, target: "orders", arrow: true },
  { id: "mo-o-dat", title: "Mở thêm 1 ô đất", hint: "Từ cấp 2: chạm ô cỏ có giá cạnh ruộng, chạm lần nữa để mua.", event: "plotBought", count: 1, reward: { coins: 20, xp: 60 }, target: "plot-buy", arrow: false },
  { id: "len-cap-3", title: "Lên cấp 3", hint: "Thu hoạch và giao đơn để lấy kinh nghiệm. Cấp 3 mở cây ngô, ô đơn thứ 4 và lô xây Nhà kho.", level: 3, count: 1, reward: { coins: 40, xp: 0 }, target: null, arrow: false },
  // Milestone 3: Nhà kho là công trình trên bản đồ (cấp 3, 60 xu, xây ngay) — thay cho bước "Nâng cấp Nhà kho" cũ (nâng ở cấp 2).
  // cond ⇒ đã xây TRƯỚC khi tới bước này (hoặc kho đã nâng từ bản cũ, được di chuyển thành Nhà kho) thì tới nơi là xong ngay.
  { id: "xay-nha-kho", title: "Xây Nhà kho", hint: "Bấm “Xây” (cái búa) ở thanh trên, chạm lô bản vẽ Nhà kho bên trái ruộng rồi bấm “Xây” — 60 xu, xây ngay. Sau đó nâng kho lên 90 chỗ.", cond: { building: "nha-kho" }, count: 1, reward: { coins: 30, xp: 80 }, target: "build:nha-kho", arrow: true },
];

// Nhiệm vụ tiến trình Milestone 2 (DESIGN-2.0 §5) — nối tiếp hướng dẫn, cùng một sổ theo dõi, nhận thưởng một lần.
// cond: điều kiện theo trạng thái ({ building: id } ⇒ công trình đã xây xong). where: sự kiện phải khớp mọi trường.
export const PROGRESSION = [
  { id: "xay-xuong", title: "Xây Xưởng chế biến", hint: "Từ cấp 4: chạm lô bản vẽ Xưởng trên bản đồ rồi bấm “Xây” (150 xu, xây 1 phút). Xưởng tặng kèm Bếp sên.",
    cond: { building: "xuong" }, count: 1, reward: { coins: 40, xp: 10 }, target: "workshop-lot", arrow: true },
  { id: "lam-mut", title: "Làm hũ mứt dâu đầu tiên", hint: "Vào Xưởng, chạm Bếp sên, chọn Mứt dâu (3 dâu tây) rồi “Bắt đầu”. Xong thì chạm ô hàng chờ để nhận.",
    event: "jobCollected", where: { item: "mut-dau" }, count: 1, reward: { coins: 40, xp: 10 }, target: "workshop", arrow: true },
  { id: "lam-thuc-an", title: "Làm thức ăn gia súc", hint: "Từ cấp 5: xây Cối xay trong Xưởng, xay 2 ngô ra 3 bao thức ăn gia súc.",
    event: "jobCollected", where: { item: "thuc-an-gia-suc" }, count: 1, reward: { coins: 50, xp: 12 }, target: "workshop", arrow: false },
  { id: "giao-ket-hop", title: "Giao đơn kết hợp có thành phẩm", hint: "Từ cấp 5, Bác Tư đặt đơn kết hợp cần cả nông sản lẫn thành phẩm Xưởng — trả cao hơn chợ 30 %.",
    event: "delivered", where: { orderType: "ket-hop", withProduct: true }, count: 1, reward: { coins: 60, xp: 15 }, target: "orders", arrow: false },
  { id: "ban-gia-len", title: "Bán thành phẩm khi giá ↑", hint: "Giá chợ đổi mỗi 3 giờ. Ở Khu chợ, món có mũi tên ↑ đang được giá — bán một thành phẩm lúc đó.",
    event: "sold", where: { productUp: true }, count: 1, reward: { coins: 40, xp: 10 }, target: "market", arrow: false },
];
/** Sổ nhiệm vụ: hướng dẫn rồi tiến trình, theo thứ tự. */
export const QUESTS = [...TUTORIAL, ...PROGRESSION];
