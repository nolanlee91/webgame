#!/usr/bin/env node
// Sinh thẻ xem trước link (Open Graph + Twitter card + meta description) cho trang chủ và mọi trang game,
// lấy danh sách game từ prototype/homepage/games.js và domain từ prototype/games/_shared/site.js (một chỗ duy nhất).
// Đồng thời sinh prototype/games/_shared/games-meta.js (tên, thư mục, thumbnail của từng game) cho share.js dùng.
//
// Cách dùng (chạy từ gốc repo):
//   node tools/og/gen-og.mjs                     # cập nhật mọi trang
//   node tools/og/gen-og.mjs --skip sudoku,2048  # bỏ qua vài game (id trong games.js)
//   node tools/og/gen-og.mjs --only o-an-quan    # chỉ một vài game (trang chủ chỉ chạy khi có "home" trong --only)
//   node tools/og/gen-og.mjs --check             # không ghi, báo trang nào lệch (exit 1 nếu có)
// Thêm game: thêm vào games.js + thêm mô tả vào DESC bên dưới, rồi chạy lại. Đổi domain: sửa site.js rồi chạy lại.
// Ảnh xem trước: dùng prototype/homepage/assets/og/<id>.jpg (1200×630, vẽ bằng tools/og/render-og-images.mjs) nếu có,
// không thì rơi về thumbnail .webp.
// Script chỉ thay phần nằm giữa hai dấu <!-- og:start --> … <!-- og:end --> trong <head>, và gỡ thẻ
// <meta name="description"> cũ nằm ngoài khối đó (khối mới đã có description).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "../..");
const PROTO = join(REPO, "prototype");
const { SITE_URL, SITE_NAME } = await import(pathToFileURL(join(PROTO, "games/_shared/site.js")).href);

// Mô tả ngắn (≤ ~170 ký tự) cho từng game. Viết đúng nội dung game — đừng hứa tính năng không có.
const DESC = {
  home: "Cổng game miễn phí ngay trên trình duyệt: Cờ Cá Ngựa, Ô Ăn Quan, Cờ Caro, Tiệm Trà Sữa, Nông Trại và hơn 20 game. Rủ bạn vào chơi, không cần tải.",
  "co-ca-ngua": "Gieo xúc xắc, xuất chuồng, đá ngựa đối thủ và đua về đích. Rủ 2–4 bạn vào phòng hoặc đấu với máy, không cần tải.",
  "o-an-quan": "Trò dân gian tuổi thơ: rải quân, ăn ô, bắt quan. Đấu với máy hoặc mở phòng rủ bạn bè chơi online, miễn phí.",
  "co-caro": "5 quân liền một hàng là thắng! Đấu caro với máy hoặc mở phòng thách bạn bè, chơi ngay trên trình duyệt.",
  "ran-san-moi": "Rắn săn mồi kiểu điện thoại cục gạch: ăn mồi, dài ra, đừng cắn trúng đuôi. Bạn được bao nhiêu điểm?",
  "tham-tu-hem": "Phá những vụ án dở khóc dở cười trong Hẻm 47: soi hiện trường, thẩm vấn, vạch mâu thuẫn lời khai và chỉ mặt thủ phạm.",
  "noi-thu": "Nối hai con thú giống nhau bằng đường gấp không quá hai khúc. Pikachu tuổi thơ, nhanh tay trước khi hết giờ!",
  "dao-vang": "Thả móc kéo vàng, kim cương, né đá tảng. Đủ chỉ tiêu là qua màn — Đào Vàng huyền thoại, chơi ngay.",
  "noi-tu": "Nối từ tiếng Việt 1v1, 15 giây mỗi lượt. Đấu bạn qua mã phòng hoặc thử vốn từ với máy.",
  "ban-bong": "Ngắm, bật tường, gom 3 bóng cùng màu cho nổ tung cùng chú khủng long. Giải trí nhẹ nhàng mà cuốn.",
  "co-tuong": "Cờ tướng ngay trên trình duyệt: đấu với máy hoặc mở phòng đấu bạn. Pháo đầu, mã nhảy, chiếu bí là thắng.",
  "co-vua": "Cờ vua đủ luật: nhập thành, bắt tốt qua đường, phong cấp. Đấu với máy hoặc thách bạn qua mã phòng.",
  "do-vui": "Đố vui nhanh tay nhanh trí: chọn đáp án trước khi hết giờ, trả lời đúng liên tiếp để ăn nhiều điểm.",
  "2048": "Vuốt để gộp các ô số giống nhau, lên tới 2048. Đơn giản mà gây nghiện, chơi ngay trên điện thoại.",
  "dat-bom": "Đặt bom phá tường, nhặt đồ tăng sức, nổ tung đối thủ. Phòng 2–4 người, chơi ngay trên trình duyệt.",
  "xep-gach": "Xếp gạch kinh điển: xoay khối, lấp kín hàng để ăn điểm, càng chơi càng nhanh. Phá kỷ lục của bạn!",
  "dua-xe": "Lái xe vượt đồi, canh ga canh thắng giữ thăng bằng, đừng để lật xe. Bạn đi được bao xa?",
  "nong-trai": "Trồng cà rốt, dâu tây, lúa; tưới nước, thu hoạch, giao đơn cho bà con và mở rộng ruộng. Cây vẫn lớn khi bạn tắt máy.",
  "tiem-tra-sua": "Tự tay pha từng ly trà sữa, chiều khách đang sốt ruột, nhận review và tính lời lỗ mỗi ca. Làm chủ tiệm từ ly đầu tiên.",
  "tiem-banh-mi": "Nướng từng mẻ bánh vỏ vàng giòn, ráp ổ đúng phiếu (không hành, ít ớt), thối tiền lẻ và tính lời lỗ mỗi ca.",
  "quan-com-tam": "Canh bếp than lật sườn, bày dĩa đủ lớp, bưng ra bàn, châm trà đá và tính tiền. Làm chủ quán cơm tấm giờ cao điểm.",
  "ghep-keo": "Đổi chỗ kẹo, ghép 3 viên cùng màu, tạo kẹo đặc biệt nổ cả hàng. Qua màn ngọt ngào, chơi ngay.",
  "sudoku": "Điền số 1–9 không trùng hàng, cột, khối. Sudoku nhiều độ khó, chơi mọi lúc ngay trên trình duyệt.",
  "co-ty-phu": "Gieo xúc xắc, mua đất, xây nhà, thu tiền thuê cho đối thủ phá sản. 2–4 người cùng phòng hoặc đấu máy.",
  "ma-soi": "Ma Sói online 6–8 người: đêm Sói đi săn, ngày cả làng bàn bạc bỏ phiếu. Ai mới là Sói?",
  "ai-la-noi-gian": "Mỗi người một từ khoá, riêng nội gián lệch một chút. Mô tả, nghi ngờ, bỏ phiếu — 6–8 người cùng phòng.",
};

const args = process.argv.slice(2);
const listArg = (name) => { const i = args.indexOf(name); return i >= 0 ? new Set((args[i + 1] || "").split(",").filter(Boolean)) : null; };
const SKIP = listArg("--skip") || new Set();
const ONLY = listArg("--only");
const CHECK = args.includes("--check");

// Đọc games.js như trình duyệt (nó gán window.GAMES).
const ctx = { window: {} };
vm.runInNewContext(readFileSync(join(PROTO, "homepage/games.js"), "utf8"), ctx);
const GAMES = ctx.window.GAMES.filter((g) => g.url && /^\.\.\/games\/[^/]+\/$/.test(g.url));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const thumbFile = (g) => g.thumb.replace(/^assets\/thumbs\//, "").replace(/\?.*$/, "");
const folderOf = (g) => g.url.split("/")[2];

function ogImage(id, fallbackThumb) {
  if (existsSync(join(PROTO, `homepage/assets/og/${id}.jpg`))) return { url: `${SITE_URL}/homepage/assets/og/${id}.jpg`, w: 1200, h: 630, type: "image/jpeg" };
  return { url: `${SITE_URL}/homepage/assets/thumbs/${fallbackThumb}`, w: 0, h: 0, type: "image/webp" };
}

function block({ title, desc, url, img, alt, type = "website" }) {
  const L = [
    `<!-- og:start — sinh bởi tools/og/gen-og.mjs, đừng sửa tay -->`,
    `<meta name="description" content="${esc(desc)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta property="og:locale" content="vi_VN" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(img.url)}" />`,
    `<meta property="og:image:type" content="${img.type}" />`,
    ...(img.w ? [`<meta property="og:image:width" content="${img.w}" />`, `<meta property="og:image:height" content="${img.h}" />`] : []),
    `<meta property="og:image:alt" content="${esc(alt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(desc)}" />`,
    `<meta name="twitter:image" content="${esc(img.url)}" />`,
    `<!-- og:end -->`,
  ];
  return L.map((l) => "  " + l).join("\n");
}

const RE_BLOCK = /[ \t]*<!-- og:start[\s\S]*?<!-- og:end -->/;
const RE_DESC = /[ \t]*<meta name="description"[^>]*>\r?\n?/g;
function applyBlock(html, b) {
  const nl = html.includes("\r\n") ? "\r\n" : "\n";
  b = b.replace(/\n/g, nl);
  if (RE_BLOCK.test(html)) return html.replace(RE_BLOCK, () => b);
  html = html.replace(RE_DESC, "");
  const m = html.match(/[ \t]*<title>[^<]*<\/title>\r?\n/);
  if (m) return html.replace(m[0], () => m[0] + b + nl);
  return html.replace(/<\/head>/, () => b + nl + "</head>");
}

const pages = [];
if (!ONLY || ONLY.has("home")) {
  pages.push({ id: "home", file: join(PROTO, "homepage/index.html"), b: block({
    title: `${SITE_NAME} — Rủ bạn vào chơi game miễn phí`, desc: DESC.home, url: `${SITE_URL}/homepage/`,
    img: ogImage("home", "co-ca-ngua.webp"), alt: `${SITE_NAME} — cổng game miễn phí trên trình duyệt` }) });
}
const missing = [];
for (const g of GAMES) {
  if (SKIP.has(g.id) || (ONLY && !ONLY.has(g.id))) continue;
  const file = join(PROTO, "games", folderOf(g), "index.html");
  if (!existsSync(file)) continue;
  if (!DESC[g.id]) missing.push(g.id);
  pages.push({ id: g.id, file, b: block({
    title: `${g.name} — chơi miễn phí trên ${SITE_NAME}`, desc: DESC[g.id] || `${g.name}: chơi miễn phí ngay trên trình duyệt, không cần tải.`,
    url: `${SITE_URL}/games/${folderOf(g)}/`, img: ogImage(g.id, thumbFile(g)), alt: `${g.name} — ${SITE_NAME}` }) });
}

let changed = 0;
for (const p of pages) {
  const before = readFileSync(p.file, "utf8");
  const after = applyBlock(before, p.b);
  if (after === before) continue;
  changed++;
  if (CHECK) console.log(`lệch: ${p.file.slice(REPO.length + 1)}`);
  else { writeFileSync(p.file, after); console.log(`đã ghi: ${p.file.slice(REPO.length + 1)}`); }
}

// games-meta.js cho share.js (luôn sinh đủ mọi game, không theo --skip/--only).
const meta = Object.fromEntries(GAMES.map((g) => [g.id, { name: g.name, folder: folderOf(g), thumb: thumbFile(g) }]));
const metaSrc = `// SINH TỰ ĐỘNG bởi tools/og/gen-og.mjs từ prototype/homepage/games.js — đừng sửa tay, chạy lại script.\n` +
  `export const GAMES_META = ${JSON.stringify(meta, null, 1).replace(/\n\s*/g, " ")};\n`;
const metaFile = join(PROTO, "games/_shared/games-meta.js");
if ((existsSync(metaFile) ? readFileSync(metaFile, "utf8") : "").replace(/\r\n/g, "\n") !== metaSrc) {
  changed++;
  if (CHECK) console.log("lệch: prototype/games/_shared/games-meta.js");
  else { writeFileSync(metaFile, metaSrc); console.log("đã ghi: prototype/games/_shared/games-meta.js"); }
}
if (missing.length) console.warn(`Thiếu mô tả trong DESC (đang dùng câu mặc định): ${missing.join(", ")}`);
console.log(CHECK ? (changed ? `${changed} tệp lệch` : "Khớp hết") : `Xong — ${changed} tệp thay đổi (${pages.length} trang đã xét)`);
if (CHECK && changed) process.exit(1);
