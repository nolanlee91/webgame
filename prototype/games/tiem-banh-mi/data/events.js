// Sự kiện Drama Tiệm Bánh Mì (docs/tiem-banh-mi/DRAMA.md). Engine: core/drama.js. Nhân vật / tiệm / công ty đều hư cấu,
// không thương hiệu thật, không người thật, không emoji. Giọng hài đời thường Việt Nam, châm chọc tình huống, tử tế với nhân vật.
//
// ===== Cấu trúc một sự kiện =====
// {
//   id        mã DRAMA.md (K01…, O01…, U…, T…, M…, V…, D…, X…, F…, L01, Q…, B…, H…, S…, E01, N…, R…, CH1, CH2)
//   group     "khach" | "van-hanh" | "cung-cap" | "doi-thu" | "mang" | "viral" | "doi" | "dac-biet" | "co-che"
//   tone      "good" (vui / đời thường) | "mixed" | "bad"   — engine giữ ≥ 1 "good" mỗi ba sự kiện
//   when      "shift" (trong ca, đồng hồ dừng) | "day" (giữa hai ca, hiện sau bảng chốt ca)
//   priority  1..3 (3 = do người chơi gây ra, ưu tiên) · w trọng số (mặc định 1) · cooldown ngày nghỉ (mặc định 2) · once
//   if        điều kiện khai báo (dưới)
//   who       người nói là khách: "waiting" | { arch: "<nhóm khách>" } | "lastServed"  — HOẶC
//   npc       người nói là NPC: id trong data/npcs.js ("me", "chu-tam", "anh-bay", "ba-tu", "chi-mai", "cau-hung", "co-hai", "co-sau",
//             "co-thanh", "anh-lam", "be-na", "ollie", "cu-nam", "chi-hanh", "chi-thao", "ti-map", "co-giao", "to-truong", "lao-cong", "mc", "cu-dan-mang")
//   nodes     { start: Node, <bước khác>: Node }
// }
// Node   { line (câu người nói mở đầu), me? (câu chủ tiệm), meBy? {hien,cucsuc,lay,sale}, mood?: "neutral"|"happy"|"annoyed"|"surprised",
//          alt? [{ flags: [..], line, me?, mood? }] (câu mở khác theo cờ, cái khớp đầu tiên thắng), choices: Choice[] }
// Choice { id, label, hint (chi phí TRƯỚC rồi hậu quả: "−15k · khách chờ thêm 10 giây"), say (câu đáng trích, lưu vào Nhật Ký),
//          sayBy? {hien,cucsuc,lay,sale}, fx?, goto? (id bước kế), later? { id, days }, roll? { p, win: {say, fx, goto?, later?}, lose: {...} },
//          need? { waitingMin, caseMin, owns, shop, flags: [..], noFlags: [..] } (thiếu điều kiện ⇒ nút mờ; nút có need.flags / noFlags bị ẩn hẳn) }
// Mọi bước phải có ít nhất MỘT lựa chọn không tốn tiền / hàng / bánh (fx.money, fx.stock, fx.bread không âm). Test kiểm.
// later.days: số ngày tính từ ngày xảy ra sự kiện (1 = hôm sau: sự kiện "day" hiện ngay sau ca hôm nay, sự kiện "shift" hiện trong ca ngày mai).
//
// ===== if (điều kiện) =====
//   minDay minLevel maxLevel minRep maxRep minFollowers minMoney maxMoney minBuzz
//   flags [..] (đủ cả) · noFlags [..] (không cái nào) · anyFlags [..] · owns id | [ids] (có một) · notOwns id
//   shop true|false (đã thuê tiệm chưa) · oven "mini"|"gas"|"electric" · weather "rain" · reviewLow (một trong 6 review gần nhất ≤ 2 sao)
//   staleMin n (bánh hôm qua ≥ n ổ, dùng cho sự kiện "day") · chain (chỉ mở qua hẹn later của sự kiện khác)
//   sum { lostMin profitMax profitMin starsMin starsMax loavesMin burntMin batchesMin leftoverMin } (bảng chốt ca vừa xong, sự kiện "day")
//   — chỉ trong ca: waitingMin · queueFree · phase "sang"|"trua"|"chieu" · tMin tMax (ms ca, ca dài 240000) · archWaiting "<nhóm>"
//     caseMin caseMax (số ổ trong tủ) · caseCrispOne (tủ có đúng 1 ổ giòn ≥ 85 và ≥ 2 khách chờ) · boardStep "spread"|"fill"|… (thớt đang ở bước)
//     burntRecent (vừa cháy một mẻ) · gasOut (hết gas, không bình dự phòng) · noChange (quỹ lẻ không thối nổi tờ 500k)
//     lastServe { minStars maxStars arch notArch mistake ("any" | id | [ids]) crispMin loavesMin bachucLow overpaidMin quirk burnt maxAgeMs }
//       (khách vừa nhận ổ, còn ở quầy; mặc định trong 6 giây). Mã lỗi: wrongFilling noPate onionAnyway tooSpicy burnt soggy notToasted wrongWrap wrongChange swapped veganMeat
//
// ===== fx (hậu quả) =====
//   money ±k · rep ±n (danh tiếng 0–100) · followers ±n · buzz ±x (độ hot, 1 = nổi rõ) · xp +n
//   stock { <id kho>: ±n } (id: phoi banh-si phoi-que pate bo mayo cha-lua thit-nguoi xiu-mai trung thit-nuong heo-quay ga-xe cha-chay cha-bong
//         do-chua dua-leo rau gia-vi giay-goi tui than gas) · bread ±n (ổ trong tủ kính: + thêm ổ giòn, − lấy ổ đi tặng / làm lại)
//   patience ±ms (mọi khách đang chờ) · whoPatience ±ms (người nói) · away ms (quầy trống: chủ tiệm chạy đi, đồng hồ vẫn chạy)
//   guests n (thêm khách ngay ca này; sự kiện "day" ⇒ ca sau) · arch { arch, n } (thêm khách một nhóm)
//   group { n, recipe?, arch?, name?, tip?, quirks? [ids], line?, flagOk?, laterOk? {id, days}, okStars? (mặc định 3) } (đơn nhiều ổ tới ngay, n = 2..20;
//            giao trọn ≥ okStars sao ⇒ đặt cờ flagOk và hẹn laterOk — dùng cho chuỗi "hẹn từ K01 giao ≥ 3 sao")
//   contract { id, name, arch, recipe, n, every (ngày), deliveries (số đợt), dueMs, discount?, label } (hợp đồng định kỳ, core/contracts.js: đơn tự sinh đúng lịch)
//   preorder { n, recipe?, mix? [{ recipe, n, quirks? }], name, arch?, when: "now"|"next", dueMs? (now: ms từ lúc này; next: ms sau giờ mở cửa), discount? 0..0.3, tip?, label?,
//            flagOk?, laterOk?, okStars? (mặc định 4) } (đơn đặt trước, cọc 30% nhận ngay; recipe: pate-bo cha-lua trung xiu-mai thap-cam thit-nuong chay ga-xe heo-quay que)
//   flagLast "tiền-tố" (đặt cờ "<tiền-tố>-hi" nếu ổ khách vừa nhận ≥ 4 sao, "-mid" nếu 3, "-lo" nếu ≤ 2 — dùng cho M01 → M02)
//   quirk "<biến thể>" (thêm dặn riêng cho đơn người nói, vd "khong-hanh") · bachucTotal true (phiếu ổ ba chục hiện tổng giá to hơn)
//   nextGuests ±n (khách ca sau) · mod { id, days, guests? n | { <nhóm>: n }, price? ±k mọi ổ, pate? ±k ổ có pate, cost? { <id kho>: hệ số giá nhập },
//         zone? ±giây vùng chín lò, prepMax? ±n mẻ đầu ngày, exchange? +k hạn mức đổi lẻ, patience? ±% kiên nhẫn, sliceMs? +ms mỗi lần rạch }
//   flag "x" | ["x","y"] · flagDays n (mặc định 3) · unflag
//   review { stars, line, name? } (một review lên sổ) · priceWho ±k (giá đơn người nói) · freeWho true (đơn người nói miễn phí)
//   leaveWho true (người nói rời quầy, không phạt) · sell { n, price } (bán thẳng n ổ trong tủ, giá mỗi ổ) · own "<đồ / trang trí>" (có món đó)
//   regular true (ghi người nói vào Sổ khách quen) · helper ms (mẹ / Bé Na tự gói + thối tiền trong ms ca) · debt { name, k } (± nợ khách)
//   ovenPause ms (lò dừng: cúp điện / mất gas) · ovenRaw true (mẻ đang nướng thành bánh sống) · ovenDump true (bỏ mẻ đang nướng, ghi hao)
//   closeEarly true (đóng cửa sớm) · moment "câu" | false (khoảnh khắc Nhật Ký; mặc định = say)
//   Đồ (own / owns): spare-gas egg-pan xiu-mai-pot long-board tray-6 grill warm-case awning vegan-board hood board-2 egg-pan-2 toaster-2 cash-counter
//         long-table tea-jug que-tray fridge electric-oven auto-dose queue-rope board-3 · trang trí: award-frame (và các id ở data/equipment.js DECOR)
//
// ===== Cờ do game tự đặt (không cần sự kiện nào đặt) =====
//   len-tiem (vừa thuê tiệm) · noi-tieng (cấp 16) · lo-dien (có lò điện) · be-na (thuê Bé Na) · promo-to-roi / promo-check-in / promo-livestream (ngày quảng bá)
//   ky-gui (đang nợ ký gửi) · ky-gui-xong (vừa trả đủ) · lo-ngay (ca vừa lỗ) · chay-cho (vừa chạy chợ mua gấp) · muon-hung (vừa mượn hàng Cậu Hưng)
//   dong-som (vừa đóng cửa sớm vì hết hàng) · het-hang (vừa hết hàng giữa ca) · mai-mua (đã nhập Chị Mai) · mai-mua-2 (nhập Chị Mai ≥ 2 lần)
//   me-vang (mẻ đầu ngày vàng đều) · hoi-cho (ca hội chợ) · thu-thach (ca thử thách) · thu-thach-dat (vừa đạt thử thách) · mua (hôm nay mưa)
//   rep-viral rep-phot rep-trend rep-back rep-sale rep-cuc rep-meme rep-flip (câu trả lời review, core/reviews.js)
//
// ===== Biến trong câu =====  {name} {self} {Self} {call} {Call} (người nói) · {shop} tên tiệm · {day} · {followers} · {loaf} món của người nói · {n} · {price}
import { EVENTS_KHACH } from "./events-khach.js?v=b12";
import { EVENTS_VANHANH } from "./events-van-hanh.js?v=b12";
import { EVENTS_MANG } from "./events-mang.js?v=b12";
import { EVENTS_M3 } from "./events-m3.js?v=b12";
import { EVENTS_REPLY } from "./events-reply.js?v=b12";
import { EVENTS_M5 } from "./events-m5.js?v=b12";

export const EVENTS = [...EVENTS_KHACH, ...EVENTS_VANHANH, ...EVENTS_MANG, ...EVENTS_M3, ...EVENTS_REPLY, ...EVENTS_M5];
export { M5_IDS } from "./events-m5.js?v=b12";
export const EVENT = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
/** 59 sự kiện của DRAMA.md §2.1–2.5 (test kiểm đủ). */
export const DRAMA_IDS = [
  ...Array.from({ length: 16 }, (_, i) => "K" + String(i + 1).padStart(2, "0")),
  ...Array.from({ length: 10 }, (_, i) => "O" + String(i + 1).padStart(2, "0")),
  "U01", "U02", "U03", "U04", "U05", "T01", "T02", "T03", "M01", "M02", "M03", "M04", "M05",
  "V01", "V02", "V03", "V04", "V05", "V06", ...Array.from({ length: 8 }, (_, i) => "D0" + (i + 1)), "X01", "X02", "X03", "X04", "X05", "F01",
];
/** Sự kiện cơ chế M3 (DRAMA.md §2.7). */
export const M3_IDS = ["L01", ...Array.from({ length: 9 }, (_, i) => "Q0" + (i + 1)), "B01", "B02", "B03", "H01", "H02", "H03", "S01", "S02", "S03", "S04", "E01", "N01", "N02", "F02", "F03", "CH1", "CH2"];
export const REPLY_IDS = Array.from({ length: 10 }, (_, i) => "R" + String(i + 1).padStart(2, "0"));
