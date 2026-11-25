# D4 · Đánh bóng 8 game: bỏ nhãn nội bộ, hộp hỏi lại pixel, nút ≥ 44 px, chữ cho người chơi

Mục audit: QCK-01, BRD-11 (phần 8 game dưới đây), QCK-04 (phần nút nhỏ ở các game này). Nhánh `claude/d4-polish` (tách từ master fd03559).
Phạm vi: `2048`, `sudoku`, `do-vui-nhanh`, `noi-tu`, `nong-trai`, `ai-la-noi-gian`, `dat-bom`, `ma-soi`. Không sửa `_shared/*`, trang chủ, game khác.

## QCK-01: nhãn nội bộ

| Game | Trước | Sau |
|---|---|---|
| 2048, Sudoku, Đố Vui Nhanh, Nối Từ | thanh trên: "Lụm Kèo · bản chơi thử · pixel V5" | "Lụm Kèo" (giống Nông Trại) |
| Nối Từ | lỗi từ: "“…” chưa có trong từ điển bản thử — thử từ khác nhé." | "“…” chưa có trong từ điển — thử từ khác nhé." |
| Nối Từ | mất mạng: "Không kết nối được máy chủ online (chế độ online có thể chưa bật trên máy chủ này)." | "Không kết nối được máy chủ — kiểm tra mạng rồi thử lại nhé." |
| Nối Từ | lỗi lạ: "Lỗi online (code)." | "Có lỗi khi chơi online (mã code) — thử lại nhé." |
| Đặt Bom | mất mạng: "Chưa kết nối được máy chủ Đặt Bom. Khi chạy thử trên máy: node games-server/dat-bom/dev.js" | "Chưa kết nối được máy chủ. Kiểm tra mạng rồi tải lại trang nhé." |
| Ai Là Nội Gián | "Máy chủ Ai Là Nội Gián chưa bật ở bản này. Khi chạy thử: node games-server/ai-la-noi-gian/dev.js" | như trên |
| Ma Sói | "Máy chủ Ma Sói chưa bật ở bản này. Khi chạy thử: npm run dev:ma-soi" | như trên |

`<title>` của cả 8 game đã sạch ("<Tên game> — Lụm Kèo"), không đổi. Nông Trại: không có chữ nội bộ nào người chơi thấy
(thanh trên đã là "Lụm Kèo"; "Công trình này mở trong bản cập nhật sau." là câu cho người chơi) ⇒ **không sửa file nào của Nông Trại**,
tag module giữ `m12`. Chú thích trong code giữ nguyên.

Còn sót ngoài phạm vi (để agent cờ bàn xử lý): `co-caro`, `co-tuong`, `co-vua` ("Lụm Kèo · bản chơi thử · pixel V5"),
`o-an-quan` ("Lụm Kèo · trò chơi dân gian · pixel V5"), `co-ca-ngua` (`<title>Cờ Cá Ngựa — bản chơi thử</title>` và "Bản chơi thử · Hội đua ngựa làng").

## BRD-11: confirm() → pxConfirm

Nhập `pxConfirm` từ `../_shared/px-confirm.js?v=pc1` (đúng tag `online-kit.js` đang dùng). Không còn `confirm()` / `alert()` / `prompt()` trong 8 game.
Chữ thống nhất: nút huỷ luôn "Thôi", nút làm ghi rõ việc ("Rời ván" / "Hủy phòng"), kiểu `danger` (focus sẵn vào "Thôi", Enter nhầm không sao).

| Game | Chỗ gọi | Hộp |
|---|---|---|
| Ai Là Nội Gián, Ma Sói | link về trang chủ giữa ván; nút "Rời phòng" giữa ván | "Rời ván đang chơi?" · "Ghế của bạn sẽ ở lại như người mất kết nối." · Thôi / Rời ván |
| Ai Là Nội Gián, Ma Sói | nút "Hủy phòng" khi còn người khác | "Hủy phòng?" · "Mọi người trong phòng sẽ bị đưa ra ngoài." · Thôi / Hủy phòng |
| Đặt Bom | `disbandRoom()` (2 nút Hủy phòng) khi còn người khác | như trên |
| Đặt Bom | link sang trang khác khi đang chơi | "Rời ván đang chơi?" · Thôi / Rời ván |
| Nối Từ | link về trang chủ giữa ván online | "Rời ván đang chơi?" · Thôi / Rời ván |

Chuyển sang async:
- Handler thành `async`, `e.preventDefault()` vẫn chạy đồng bộ trước `await` (link không tự đi).
- Chống bấm đúp: link trang chủ có cờ đang rời (`homeLeaving` ở Nội Gián / Ma Sói, `exiting` sẵn có ở Đặt Bom / Nối Từ), kiểm cả trước và sau `await`
  ⇒ lệnh `leave` / `disband` chỉ gửi một lần. Bấm lại khi hộp đang mở: pxConfirm đóng hộp cũ (= Thôi) rồi mở hộp mới, không có hai lệnh.
- Sau `await` kiểm lại trạng thái: phòng đã đóng trong lúc hỏi (`v` = null) thì không gửi lệnh nữa (Đặt Bom: không còn là chủ phòng thì thôi; link thì đi thẳng).
- Esc / bấm ra ngoài = Thôi (hành vi của pxConfirm).

## Nút ≥ 44 px (đo trên 390×844, chạm giả lập)

Script đo (ngoài repo): mọi `button`, `a[href]`, `.btn`, ô chọn (đo cả `label` bọc ngoài) đang hiện; màn đầu và sau một bước vào ván
(2048 / Sudoku / Đố Vui: Bắt đầu; Nối Từ: Chơi với máy → Bắt đầu; Nội Gián / Ma Sói: Chơi với máy; Đặt Bom: Tạo phòng).

| Game | Phần tử | Trước | Sau | Cách sửa |
|---|---|---|---|---|
| 2048, Sudoku, Đố Vui, Nối Từ | "← Trang chủ" | 92×23 | 92×44 | `.bar a` inline-flex, `min-height: 44px`, `margin-block: -8px` (thanh trên chỉ cao thêm ~4 px); xoay ngang `margin-block: -12px` (thanh không cao thêm) |
| 2048, Sudoku, Đố Vui | "★ Thử thách hôm nay" | ×32 | ×44 | `.daily-link` `min-height: 44px` |
| Đố Vui | 50:50, Tạm dừng, Âm thanh (≤ 700 px) | ×40 | ×44 | `.tools .btn` 40 → 44 |
| Sudoku (≤ 760 px) | ☰ và Âm thanh trên HUD | 37×41 ở 360 px | 44×44 | `.mini .btn` `min-height/min-width: 44px` |
| Nội Gián, Ma Sói, Đặt Bom | "← Lụm Kèo" | 81×23 | 81×44 | `.bar a` như trên, `margin-block: -6px` |
| Nội Gián, Ma Sói, Đặt Bom | nút loa thanh trên | 40×36 | 44×44 | `margin-block: -4px` ⇒ thanh không cao thêm |
| Nội Gián, Ma Sói | "Phòng kín" (label + ô) | 13 px | ×44 | `.home__opt > label` flex, `min-height: 44px` |
| Nội Gián, Ma Sói | câu nói nhanh dưới chat | ×36 | ×44 | `.quick button` 36 → 44 (hàng cuộn ngang, cao thêm 8 px) |
| Đặt Bom | "Phòng kín" / "Phòng công khai" / "Tắt chat" | ×32 | ×44 | `.check` 32 → 44 |
| Đặt Bom | "Làm mới" (phòng công khai) | 59×32 | 67×44 | `.pub__ref` |
| Đặt Bom | "Rời phòng" (cột người chơi) | ×36 | ×44 | `.ppl__leave` |
| Nông Trại | loa, "?" thanh trên | 40×36 | không đổi | đã có `::after` nở vùng chạm 44×44 (dòng 635), không sửa để khỏi đổi tag m12 |

Sau sửa: 390×844 và 360×740 không còn nút nào < 44 px ở các màn đã đo (trừ Nông Trại như trên); không tràn ngang.
Xoay ngang 844×390: giữ nguyên bố cục, còn nút 36–40 px ở cột trái 2048 / Sudoku, loa Đặt Bom 32 px, ☰ / loa Nối Từ 40 px —
nâng lên 44 thì cột trái / bàn chơi bị đẩy, nên để nguyên (câu hỏi mở bên dưới).

## Chữ cho người chơi

- Đặt Bom: "đường mời" → "link mời" (3 chỗ: lời nhắc phòng chờ, nút "Chép link mời", toast "Đã chép link mời"), cho giống Nối Từ / Nội Gián / Ma Sói.
- Hộp hỏi lại: thống nhất "Thôi" (trước là hộp OK / Cancel của trình duyệt, chữ theo ngôn ngữ máy).
- Các câu báo mất mạng / lỗi kỹ thuật ở trên: bỏ lệnh dev, nói việc người chơi làm được.
- Đã đọc lướt toàn bộ chữ trong HTML + chuỗi trong app.js / game.js của 8 game: không thấy lỗi chính tả. Giữ "bot", "chat", "link",
  "Menu", "50:50", tên phím (Space / Enter) vì đã quen dùng và nhất quán trên cổng.
- 360 px: không thấy chữ bị cắt ngoài ý muốn (tên bot dài ở Ma Sói được cắt "…" có chủ đích).

## Tag đã tăng

| File | Cũ → mới | Tham chiếu |
|---|---|---|
| `ai-la-noi-gian/app.js` | av1 → d4p1 | `ai-la-noi-gian/index.html` |
| `ai-la-noi-gian/style.css` | av1 → d4p1 | `ai-la-noi-gian/index.html` |
| `ma-soi/app.js` | d3oh3 → d4p1 | `ma-soi/index.html` |
| `ma-soi/style.css` | chat1 → d4p1 | `ma-soi/index.html` |
| `dat-bom/app.js` | d3oh3 → d4p1 | `dat-bom/index.html` |
| `dat-bom/style.css` | d3o → d4p1 | `dat-bom/index.html` |
| `noi-tu/game.js` | d3oh3 → d4p1 | `noi-tu/index.html` |

`index.html` của 2048 / Sudoku / Đố Vui / Nối Từ sửa CSS nội tuyến: HTML không có `?v=`, không cần tag.

## Kiểm thử

Xem phần báo cáo cuối (kết quả chạy trên nhánh).

## Câu hỏi mở

1. Xoay ngang (844×390): các nút cột trái 2048 (38 px) / Sudoku (36 px), loa Đặt Bom (32 px), ☰ / loa Nối Từ (40 px) chưa tới 44. Có cần nâng không (sẽ phải bố trí lại cột trái)?
2. Đặt Bom 360×740: khung phòng chờ đè lên bàn chơi vốn đã phải cuộn trong khung mới thấy nút "Bắt đầu" (có từ trước); ô chọn cao 44 làm dài thêm 12 px. Có muốn đưa "Bắt đầu" lên trên không?
3. Nhãn nội bộ ở 5 game cờ (liệt kê ở trên) thuộc phạm vi agent khác.
