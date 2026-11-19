// Danh sách 18 game theo docs/game-catalog-v2.md (thứ tự theo điểm ưu tiên).
// thumb: 6 game đầu cắt từ concept V4; 12 game còn lại là ảnh thumbnail 4:3 riêng (đã được chủ dự án duyệt). icon/hue giữ làm dự phòng.
// mode: "solo" | "multi" | "both" — dùng cho nhãn số người chơi trên thẻ.
// url: game đã có bản chơi thật — thẻ game mở thẳng link này thay vì trang chờ play.html (hiện có Đào Vàng, Cờ Cá Ngựa, Nối Thú, Cờ Caro, Cờ Tướng, Cờ Vua, Ma Sói, Ai Là Nội Gián, Xếp Gạch, 2048, Sudoku, Đố Vui, Rắn Săn Mồi, Cờ Tỷ Phú, Đặt Bom, Nông Trại).
// Game CHƯA có url: thẻ hiện nhãn "Đang cập nhật" + ảnh mờ, bấm vào vẫn mở trang chờ play.html.
window.GAMES = [
  { id: "co-ca-ngua", name: "Cờ Cá Ngựa",      cat: "tri-tue",  mode: "both", players: "2–4 người", thumb: "assets/thumbs/co-ca-ngua.webp", icon: "dice", hue: 0, badge: "Hot", url: "../games/co-ca-ngua/" },
  { id: "co-caro",   name: "Cờ Caro",          cat: "tri-tue",  mode: "multi", players: "2 người", thumb: "assets/thumbs/co-caro.webp",  icon: "caro", badge: "Hot", url: "../games/co-caro/" },
  { id: "ran-san-moi", name: "Rắn Săn Mồi",    cat: "hanh-dong", mode: "solo", players: "1 người", thumb: "assets/thumbs/ran-san-moi.webp", icon: "snake", hue: 140, url: "../games/ran-san-moi/" },
  { id: "noi-thu",   name: "Nối Thú",          cat: "giai-do",  mode: "solo",  players: "1 người", thumb: "assets/thumbs/noi-thu.webp",  icon: "paw", badge: "Mới", url: "../games/noi-thu/" },
  { id: "dao-vang",  name: "Đào Vàng",         cat: "hanh-dong", mode: "solo", players: "1 người", thumb: "assets/thumbs/dao-vang.webp", icon: "gold", badge: "Hot", url: "../games/dao-vang/" },
  { id: "noi-tu",    name: "Nối Từ",           cat: "tri-tue",  mode: "multi", players: "2 người", thumb: "assets/thumbs/noi-tu.webp",   icon: "word", badge: "Mới", url: "../games/noi-tu/" },
  { id: "ban-bong",  name: "Bắn Bóng Khủng Long", cat: "giai-do", mode: "solo", players: "1 người", thumb: "assets/thumbs/ban-bong.webp", icon: "bubble", hue: 200, url: "../games/ban-bong/" },
  { id: "co-tuong",  name: "Cờ Tướng",         cat: "tri-tue",  mode: "multi", players: "2 người", thumb: "assets/thumbs/co-tuong.webp", icon: "xiangqi", badge: "Hot", url: "../games/co-tuong/" },
  { id: "co-vua",    name: "Cờ Vua",           cat: "tri-tue",  mode: "multi", players: "2 người", thumb: "assets/thumbs/co-vua.webp",   icon: "xiangqi", badge: "Mới", url: "../games/co-vua/" },
  { id: "do-vui",    name: "Đố Vui",           cat: "tri-tue",  mode: "solo",  players: "1 người", thumb: "assets/thumbs/do-vui.webp",  icon: "quiz", url: "../games/do-vui-nhanh/" },
  { id: "2048",      name: "2048",             cat: "giai-do",  mode: "solo",  players: "1 người", thumb: "assets/thumbs/2048.webp", icon: "2048", hue: 35, url: "../games/2048/" },
  { id: "dat-bom",   name: "Đặt Bom",          cat: "hanh-dong", mode: "multi", players: "2–4 người", thumb: "assets/thumbs/dat-bom.webp", icon: "bomb", hue: 15, badge: "Mới", url: "../games/dat-bom/" },
  { id: "xep-gach",  name: "Xếp Gạch",         cat: "giai-do",  mode: "solo",  players: "1 người", thumb: "assets/thumbs/xep-gach.webp", icon: "blocks", hue: 265, url: "../games/xep-gach/" },
  { id: "dua-xe",    name: "Đua Xe Vượt Đồi",  cat: "hanh-dong", mode: "solo", players: "1 người", thumb: "assets/thumbs/dua-xe.webp", icon: "car", hue: 55, url: "../games/dua-xe/" },
  { id: "nong-trai", name: "Nông Trại", cat: "tap-lam-chu", mode: "solo", players: "1 người", thumb: "assets/thumbs/cozy-nong-trai.webp?v=pixel2", url: "../games/nong-trai/" },
  { id: "tiem-tra-sua", name: "Tiệm Trà Sữa", cat: "tap-lam-chu", thumb: "assets/thumbs/tiem-tra-sua.webp?v=pixel2" },
  { id: "tiem-banh-mi", name: "Tiệm Bánh Mì", cat: "tap-lam-chu", thumb: "assets/thumbs/tiem-banh-mi.webp?v=pixel2" },
  { id: "quan-com-tam", name: "Quán Cơm Tấm", cat: "tap-lam-chu", thumb: "assets/thumbs/quan-com-tam.webp?v=pixel2" },
  { id: "ghep-keo",  name: "Ghép Kẹo",         cat: "giai-do",  mode: "solo",  players: "1 người", thumb: "assets/thumbs/ghep-keo.webp", icon: "candy", hue: 320, url: "../games/ghep-keo/" },
  { id: "sudoku",    name: "Sudoku",           cat: "tri-tue",  mode: "solo",  players: "1 người", thumb: "assets/thumbs/sudoku.webp", icon: "sudoku", hue: 225, url: "../games/sudoku/" },
  { id: "co-ty-phu", name: "Cờ Tỷ Phú",        cat: "tri-tue",  mode: "both",  players: "2–4 người", thumb: "assets/thumbs/co-ty-phu.webp", icon: "dice", hue: 45, badge: "Mới", url: "../games/co-ty-phu/" },
  { id: "ma-soi",    name: "Ma Sói",           cat: "tri-tue",  mode: "multi", players: "6–8 người", thumb: "assets/thumbs/ma-soi.webp", icon: "quiz", hue: 230, badge: "Mới", url: "../games/ma-soi/" },
  { id: "ai-la-noi-gian", name: "Ai Là Nội Gián", cat: "tri-tue", mode: "multi", players: "6–8 người", thumb: "assets/thumbs/ai-la-noi-gian.webp", icon: "search", hue: 210, badge: "Mới", url: "../games/ai-la-noi-gian/" },
];

// TẦNG 1 — hero trượt (carousel): các game đã chơi được thay phiên giới thiệu, tự chuyển sau vài giây.
// Ảnh = thumbnail 4:3 có sẵn (khung hero cũng 4:3 nên thấy trọn ảnh, không cắt, không tạo ảnh mới).
window.HERO_SLIDES = [
  { id: "co-ca-ngua", kicker: "Tựa game của tuần", text: "Gieo xúc xắc, xuất chuồng và đua ngựa về lầu giữa. Rủ 2–4 người cùng chơi." },
  { id: "ma-soi",     kicker: "Đông người · Mới",   text: "Đêm Sói đi săn, ngày cả làng bàn bạc bỏ phiếu. 6–8 người vào chung một phòng." },
  { id: "noi-tu",     kicker: "Đấu trí 1v1 · Mới",  text: "Nối từ tiếng Việt, 15 giây mỗi lượt. Đấu với bạn qua mã phòng hoặc đấu với máy." },
  { id: "dao-vang",   kicker: "Chơi nhanh",          text: "Thả móc kéo vàng, né đá tảng, đủ chỉ tiêu là qua màn." },
  { id: "co-caro",    kicker: "Đối kháng",           text: "5 quân liền một hàng là thắng. Đấu với bạn bè hoặc thử sức với máy." },
];

// Các game có phòng multiplayer.
window.DUEL_IDS = ["co-ca-ngua", "co-caro", "dat-bom", "noi-tu", "ma-soi", "ai-la-noi-gian", "co-ty-phu", "co-vua", "co-tuong"];

// Kệ theo thứ tự hiển thị khi xem "Tất cả".
// Tab lọc phía trên lưới dùng CHÍNH danh sách kệ này ⇒ tên + số đếm luôn khớp kệ bên dưới.
// Mỗi game nằm đúng 1 kệ: game trong DUEL_IDS thuộc kệ "duel", còn lại theo cat.
window.SHELVES = [
  { cat: "tap-lam-chu", title: "Tập Làm Chủ", hint: "" },
  { cat: "duel",      title: "Đối Kháng", hint: "Rủ bạn vào phòng, chơi ngay trên trình duyệt" },
  { cat: "giai-do",   title: "Giải đố",   hint: "Thư giãn đầu óc, chơi một mình" },
  { cat: "hanh-dong", title: "Hành động", hint: "Nhanh tay, bấm là chơi" },
  { cat: "tri-tue",   title: "Trí tuệ",   hint: "Suy nghĩ từng nước" },
];

window.CATEGORIES = [{ id: "all", label: "Tất cả" }].concat(window.SHELVES.map(function (s) { return { id: s.cat, label: s.title }; }));
