// Sự kiện Drama Quán Cơm Tấm (docs/quan-com-tam/DRAMA.md). Engine: core/drama.js. Nhân vật / quán / công ty đều hư cấu,
// không thương hiệu thật, không người thật, không cơ quan thật, không emoji. Giọng hài đời thường Sài Gòn, châm chọc tình huống, tử tế với nhân vật.
// "Đội trật tự khu phố", "tổ dân phố" là vai chung, không gắn tên cơ quan nào.
//
// ===== Cấu trúc một sự kiện =====
// {
//   id        mã DRAMA.md (K01…, O01…, U…, T…, M…, V…, D…, X…, F01) · cơ chế M3 (G…, C…, P01, B…, W01, H…, S…, L…, Q1x, N…, BO…, KG…, HH…, CT…, SU1)
//             · trả lời review R01–R10
//   group     "khach" | "van-hanh" | "cung-cap" | "doi-thu" | "mang" | "viral" | "doi" | "dac-biet" | "co-che" | "reply"
//   tone      "good" (vui / đời thường) | "mixed" | "bad"   — engine giữ ≥ 1 "good" mỗi ba sự kiện
//   when      "shift" (trong ca, đồng hồ + bếp dừng) | "day" (giữa hai ngày, hiện trên bảng Chuẩn bị)
//   priority  1..3 (3 = do người chơi gây ra, ưu tiên) · w trọng số (mặc định 1) · cooldown số ngày nghỉ (mặc định 2) · once
//   if        điều kiện khai báo (dưới)
//   npc       người nói là NPC: id trong data/npcs.js — HOẶC
//   who       người nói là khách trong cảnh: "waiting" | "seated" | "lastServed" | { arch: "<vai>" }
//   moment    câu Nhật Ký mặc định (mỗi lựa chọn dùng say của nó nếu không có fx.moment)
//   nodes     { start: Node, <bước khác>: Node }
// }
// Node   { line, me?, meBy? {hien,cucsuc,lay,sale}, mood?: "neutral"|"happy"|"annoyed"|"surprised", alt? [{ flags, line, me?, mood? }], choices }
// Choice { id, label, hint (chi phí TRƯỚC rồi hậu quả), say, sayBy?, fx?, goto?, later? { id, days }, roll? { p, win: {say, fx, goto?, later?}, lose },
//          need? { flags, noFlags, stage, minLevel (ẩn hẳn nếu không thoả) · owns, waitingMin (nút mờ) } }
// fx của nhánh hên xui CỘNG DỒN với fx chung của lựa chọn (chi phí chung để ở fx chung).
// Mọi bước phải có ít nhất MỘT lựa chọn không tốn tiền / hàng / dĩa / cơm và không cần điều kiện. Test kiểm.
// later.days: số ngày tính từ hôm xảy ra (1 = hôm sau: sự kiện "day" hiện trên Chuẩn bị ngày mai, sự kiện "shift" hiện trong ca ngày mai).
//
// ===== if (điều kiện) =====
//   minDay maxDay minLevel maxLevel minRep maxRep minMoney maxMoney minFollowers minHype · stage "street"|"quan" · owns id|[ids] · notOwns id
//   flags [..] (đủ cả) · noFlags [..] · anyFlags [..] (tên kết thúc "*" = khớp tiền tố) · flagMin { "persona-flip": 2 } · debtMin k · chain
//   sum { profitMax profitMin starsMin starsMax lostMin burntMin smokeMin riceLeftMin platesMin mistake mistakeMin } (bảng chốt ca vừa xong)
//   — chỉ trong ca: kind "toi"|"trua" · phase "som"|"cao"|"khuya"|"trua" (hoặc mảng) · fMin fMax (phần ca 0..1) · waitingMin seatedMin
//     freeSeats n (bàn trống sạch ≥ n chỗ) · dirtyMin · coalMax coalMin smokeMin · riceCooking · riceMax · stockMax { id: n } · cleanPlatesMax
//     warmMin hotMin grillMin (số miếng ở vùng giữ ấm / vùng nóng / trên vỉ) · archPresent "<vai>"
//     lastServe { mistake: "any"|id|[ids], arch, phone (bàn có người cầm điện thoại: reviewer, sinh viên, văn phòng, du khách), clean, maxAgeMs }
//       (dĩa vừa xuống bàn, bàn còn ngồi). Mã lỗi: wrongDish biAnyway hardEgg burnt raw noMoHanh sauceMixed noTea dirtyTable wrongTable swapped wrongBill veganMeat
//
// ===== fx (hậu quả) =====
//   money ±k · rep ±n (0–100) · xp +n · followers ±n · hype ±n (độ hot 0–20) · stock { <id kho>: ±n }
//   guests ±n (thêm khách ngay ca này; sự kiện "day" ⇒ ca tới) · arch { arch, n } (thêm nhóm một vai) · nextGuests ±n
//   group { roles: [vai…], patienceMul?, tip?, okStars?, flagOk?, laterOk? {id, days}, label?, delay? } (một bàn có nhãn tới ngay; ăn xong ≥ okStars ⇒ tip + cờ + hẹn)
//   preorder { id?, n, arch?, days? (0 = hôm nay, mặc định: "day" 0, "shift" 1), kind? "toi"|"trua", label?, tip?, okStars?, flagOk?, laterOk?, flag?, at? }
//            (đơn đặt trước: lúc mở ca đúng ngày thành ≤ 4 nhóm khách có nhãn; đặt thêm cờ flag để hệ đơn đặt trước / mâm cơm đọc)
//   mod { id, days, guests? n | { <vai>: n }, patience? ±% } · flag "x"|[..] · flagDays (mặc định 3) · unflag "x"|[..] (bỏ cả cờ trơn s.flags)
//   — chỉ trong ca: patience ±ms (mọi bàn đang chờ / ngồi) · whoPatience ±ms (bàn người nói) · away ms (cô chủ rời quán, bếp vẫn chạy)
//     coal ±n · smoke ±n · rice ±n (phần cơm trong nồi) · plates ±n (dĩa sạch; âm = bể / mất) · closeEarly · pauseGuests ms
//     freeWho (bàn người nói quán mời) · teaAll (châm trà mọi bàn) · cleanTables (dọn sạch bàn dơ) · wash n · helper ms (người phụ dọn bàn / rửa dĩa)
//   debt { who, k, clear? } (sổ nợ của Drama, {debt} trong câu) · own "<id đồ nghề GEAR>" · decor "<id>" · catName true · moment "câu" | false
//
// ===== Cờ do hệ khác đặt (s.flags, xem core/flags.js) =====
//   A: ghiso-open ghiso-unpaid-<id> catering-active catering-late quan-moved lunch-today helper-bong charcoal-low smoke-high rain-today
//   C: reply-viral reply-phot reply-sale persona-flip (số) review-1star-<lý do>
//
// ===== Biến trong câu =====  {name} {self} {Self} {call} {Call} (người nói) · {shop} · {day} · {followers} · {debt} (tổng sổ nợ) · {catName} · {n}
import { EVENTS_KHACH } from "./events-khach.js?v=c8";
import { EVENTS_VANHANH } from "./events-van-hanh.js?v=c8";
import { EVENTS_CUNGCAP } from "./events-cung-cap.js?v=c8";
import { EVENTS_MANG } from "./events-mang.js?v=c8";
import { EVENTS_DOI } from "./events-doi.js?v=c8";
import { EVENTS_COCHE } from "./events-co-che.js?v=c8";
import { EVENTS_REPLY } from "./events-reply.js?v=c8";

export const EVENTS = [...EVENTS_KHACH, ...EVENTS_VANHANH, ...EVENTS_CUNGCAP, ...EVENTS_MANG, ...EVENTS_DOI, ...EVENTS_COCHE, ...EVENTS_REPLY];
export const EVENT = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
const seq = (p, n) => Array.from({ length: n }, (_, i) => p + String(i + 1).padStart(2, "0"));
/** 58 sự kiện DRAMA.md §2.1–2.5 (test kiểm đủ). */
export const DRAMA_IDS = [...seq("K", 14), ...seq("O", 12), ...seq("U", 4), ...seq("T", 3), ...seq("M", 4), ...seq("V", 7), ...seq("D", 8), ...seq("X", 5), "F01"];
/** Sự kiện cơ chế M3 (DRAMA.md §2.7). */
export const MECH_IDS = EVENTS_COCHE.map((e) => e.id);
export const REPLY_IDS = seq("R", 10);
