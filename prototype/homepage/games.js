// Danh sách 18 game theo docs/game-catalog-v2.md (thứ tự theo điểm ưu tiên).
// thumb: 6 game đầu cắt từ concept V4; 12 game còn lại là ảnh thumbnail 4:3 riêng (đã được chủ dự án duyệt). icon/hue giữ làm dự phòng.
// mode: "solo" | "multi" | "both" — dùng cho bộ lọc "Chơi cùng bạn".
// url: game đã có bản chơi thật — thẻ game mở thẳng link này thay vì trang chờ play.html (hiện có Đào Vàng, Cờ Cá Ngựa, Nối Thú).
// Game CHƯA có url: thẻ hiện nhãn "Đang cập nhật" + ảnh mờ, bấm vào vẫn mở trang chờ play.html.
window.GAMES = [
  { id: "co-caro",   name: "Cờ Caro",          cat: "tri-tue",  mode: "multi", players: "2 người", thumb: "assets/thumbs/co-caro.webp",  icon: "caro", badge: "Hot" },
  { id: "ran-san-moi", name: "Rắn Săn Mồi",    cat: "hanh-dong", mode: "both", players: "1–8 người", thumb: "assets/thumbs/ran-san-moi.webp", icon: "snake", hue: 140 },
  { id: "noi-thu",   name: "Nối Thú",          cat: "giai-do",  mode: "solo",  players: "1 người", thumb: "assets/thumbs/noi-thu.webp",  icon: "paw", badge: "Mới", url: "../games/noi-thu/" },
  { id: "dao-vang",  name: "Đào Vàng",         cat: "hanh-dong", mode: "both", players: "1–2 người", thumb: "assets/thumbs/dao-vang.webp", icon: "gold", badge: "Hot", url: "../games/dao-vang/" },
  { id: "noi-tu",    name: "Nối Từ",           cat: "tri-tue",  mode: "multi", players: "2 người", thumb: "assets/thumbs/noi-tu.webp",   icon: "word", badge: "Mới" },
  { id: "ban-bong",  name: "Bắn Bóng Khủng Long", cat: "giai-do", mode: "solo", players: "1 người", thumb: "assets/thumbs/ban-bong.webp", icon: "bubble", hue: 200 },
  { id: "co-tuong",  name: "Cờ Tướng",         cat: "tri-tue",  mode: "multi", players: "2 người", thumb: "assets/thumbs/co-tuong.webp", icon: "xiangqi", badge: "Hot" },
  { id: "do-vui",    name: "Đố Vui",           cat: "tri-tue",  mode: "both",  players: "1–8 người", thumb: "assets/thumbs/do-vui.webp",  icon: "quiz" },
  { id: "2048",      name: "2048",             cat: "giai-do",  mode: "solo",  players: "1 người", thumb: "assets/thumbs/2048.webp", icon: "2048", hue: 35 },
  { id: "co-ca-ngua", name: "Cờ Cá Ngựa",      cat: "tri-tue",  mode: "multi", players: "2–4 người", thumb: "assets/thumbs/co-ca-ngua.webp", icon: "dice", hue: 0, url: "../games/co-ca-ngua/" },
  { id: "dat-bom",   name: "Đặt Bom",          cat: "hanh-dong", mode: "multi", players: "2–4 người", thumb: "assets/thumbs/dat-bom.webp", icon: "bomb", hue: 15 },
  { id: "ban-cung",  name: "Bắn Cung",         cat: "hanh-dong", mode: "both", players: "1–2 người", thumb: "assets/thumbs/ban-cung.webp", icon: "bow", hue: 95 },
  { id: "xep-gach",  name: "Xếp Gạch",         cat: "giai-do",  mode: "solo",  players: "1 người", thumb: "assets/thumbs/xep-gach.webp", icon: "blocks", hue: 265 },
  { id: "tim-diem-khac", name: "Tìm Điểm Khác", cat: "giai-do", mode: "solo",  players: "1 người", thumb: "assets/thumbs/tim-diem-khac.webp", icon: "search", hue: 180 },
  { id: "dua-xe",    name: "Đua Xe Vượt Đồi",  cat: "hanh-dong", mode: "solo", players: "1 người", thumb: "assets/thumbs/dua-xe.webp", icon: "car", hue: 55 },
  { id: "nong-trai", name: "Nông Trại",        cat: "giai-do",  mode: "solo",  players: "1 người", thumb: "assets/thumbs/nong-trai.webp", icon: "sprout", hue: 110 },
  { id: "ghep-keo",  name: "Ghép Kẹo",         cat: "giai-do",  mode: "solo",  players: "1 người", thumb: "assets/thumbs/ghep-keo.webp", icon: "candy", hue: 320 },
  { id: "sudoku",    name: "Sudoku",           cat: "tri-tue",  mode: "solo",  players: "1 người", thumb: "assets/thumbs/sudoku.webp", icon: "sudoku", hue: 225 },
];

// TẦNG 1 — game tiêu điểm (cột trái 60%). heroImage: cảnh Đào Vàng cắt từ concept V4 (có sẵn, không tạo ảnh mới).
// stat: số minh họa (bản thử nghiệm).
window.FEATURED = {
  hero: "dao-vang",
  heroImage: "assets/thumbs/dao-vang-scene.webp",
  heroText: "Thả móc, gom vàng và kim cương trước khi hết giờ. Chơi một mình hoặc rủ bạn chung máy.",
  stat: "84 trận đang diễn ra"
};

// TẦNG 1 — sảnh chờ trực tiếp (cột phải 40%): phòng công khai đang thiếu người.
// SỐ GIẢ (placeholder) — chủ dự án duyệt giữ số minh họa cho bản thử nghiệm, chưa có multiplayer online thật.
window.LOBBY_ROOMS = [
  { game: "co-ca-ngua", code: "CN4920", no: "492", host: "Tèo", have: 3, max: 4 },
  { game: "co-caro",    code: "CR1080", no: "108", host: "Bé Na", have: 1, max: 2 },
  { game: "dat-bom",    code: "DB3150", no: "315", host: "Khoa", have: 2, max: 4 },
];

// TẦNG 3 — kệ "Đối kháng đông người": 4 game nhiều người nổi bật (thẻ 3:2). rooms = số phòng đang mở (số giả).
window.DUELS = [
  { id: "co-ca-ngua", rooms: 24 },
  { id: "co-caro",    rooms: 41 },
  { id: "dat-bom",    rooms: 12 },
  { id: "noi-tu",     rooms: 9 },
];

window.CATEGORIES = [
  { id: "all",       label: "Tất cả" },
  { id: "multi",     label: "Chơi cùng bạn" },
  { id: "tri-tue",   label: "Trí tuệ" },
  { id: "giai-do",   label: "Giải đố" },
  { id: "hanh-dong", label: "Hành động" },
];
