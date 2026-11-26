# D7: online (bộ lọc tên/chat, Nối Từ, Cá Ngựa, tài liệu nội bộ)

Nhánh `claude/d7-online` (từ master `1c31075`). Sửa PARTY2-01 + TTH2-01 (P1, an toàn trẻ em), PARTY2-02, BOARD2-02 / BOARD2-03 /
BRD-15, PARTY2-07. Không đụng trang chủ, Tỷ Phú, các game tiệm, Nông Trại.

## 1. Bộ lọc tên và chat (PARTY2-01, TTH2-01)

Một bộ lọc dùng chung `games-server/moderation.js` + `games-server/account/bad-words.json`, nên mọi chỗ đã đi qua nó đều được sửa
cùng lúc: tên khi tạo / vào phòng và ở `/api/lobby` (7 game cờ, Ma Sói, Nội Gián, Nối Từ, Đặt Bom), chat của mọi game online,
"Gửi riêng" 1-1 của Nội Gián, tên bảng xếp hạng (`account/names.mjs`). Cách so mới:

| Kiểu lách | Cách bắt |
|---|---|
| Full-width "ｆｕｃｋ", chữ toán học "𝐟𝐮𝐜𝐤", chữ khoanh "ⓕⓤⓒⓚ" | NFKC từng ký tự trong `prep()` |
| Chữ giả dạng "fսck" (Armenian), "fuсk" (Cyrillic), "ꜰᴜᴄᴋ" (chữ hoa nhỏ), Hy Lạp | bảng `CONFUSE` (≈ 90 chữ) |
| Leet "l0n", "c4c", "bu0i", "c4k" | từ ≥ 3 ký tự có cả chữ lẫn số leet ⇒ so dạng **bỏ dấu** với **cả** `exact` + `plain` (kể cả "lon", "cac" vốn bỏ qua khi gõ không dấu) |
| Biến thể dấu / phụ âm "kặc", "lìn", "cặk" | thêm vào `exact` |
| Tách chữ "đ ụ m á", "đ.ụ m.á", "đ-ụ-m-á", viết dính "đụmá" | chữ đơn cách nhau ≤ 3 ký hiệu: xét **mọi đoạn con** ≥ 2 chữ; cụm nhiều từ trong danh sách cũng được so khi viết dính (bộ `glued`). "đ.ụ m.á" giờ che **trọn** ("***", trước là "*** m.á") |
| Tiếng Anh "phuck", "kys", "penis", "vagina", "kill yourself", "dildo", "cock", "nude", "horny", "rape"… | `plain` (nguyên từ, không dùng `contains` để "Phúc Khang" không dính "phuck") |
| Câu chửi nhắm vào người: "mày ngu", "thằng ngu", "con ngu", "đồ ngu", "óc chó", "thằng chó", "đồ con chó", "mày là con chó", "mất dạy", "khốn nạn", "câm mồm", "mày chết đi"… | `exact` (cụm tới 4 từ) + vài dạng không dấu an toàn ("thang ngu", "oc cho") |
| "óc chó" nhưng là hạt / quả | nhóm mới `except`: "quả/hạt/trái/sữa/dầu/gỗ/bánh/cây óc chó" ⇒ không che |
| Số điện thoại "0912345678", "0912 345 678", "0912.345.678", "09-12-34-56-78", "+84 912 345 678", số full-width | dãy ≥ 7 chữ số, xen cách / chấm / gạch / phẩy ⇒ `***`. Trừ số tiền kiểu nghìn bắt đầu khác 0 ("10.000.000", "1,500,000") |
| Rủ sang kênh riêng: zalo, fb, facebook, sđt, đt, inbox, ib, tele, telegram, ig, insta, discord, tiktok, messenger… | chỉ che khi câu có kèm số (≥ 3 chữ số), `@tên`, link, hoặc ngay sau là một nick có số / chấm / gạch dưới ("zalo: be.na_09"). Che cả từ đó lẫn nick / số |
| Thư điện tử "abc@gmail.com", link full-width | `[link]` / `***` |

Tên dính số điện thoại / nick liên lạc / link (kể cả phần bị cắt sau 16 ký tự) ⇒ tên thay thế ("Người N", "Người chơi N").
`moderation.hasContact()` mới, `names.mjs` (bảng xếp hạng) dùng chung. Ví dụ:
"vao zalo 0912345678 nha" ⇒ "vao *** *** nha"; "mày ngu vcl" ⇒ "*** ***"; "ăn quả óc chó, mày óc chó" ⇒ "ăn quả óc chó, mày ***".

### Bảng test (`games-server/moderation.test.mjs`)

- `D7_BLOCK` **54 mẫu** phải bắt (chat, tên phòng, tên bảng xếp hạng): leet, biến thể dấu, tách chữ, full-width, chữ giả dạng,
  tiếng Anh, câu chửi người.
- `D7_CONTACT` **16 mẫu** số điện thoại / Zalo / FB / @nick / email: chat không còn số hay từ liên lạc, tên bị thay.
- `D7_PASS` **60 câu** phải đi qua nguyên vẹn: "con lợn", "con lon", "lon bia", "các bạn", "cac ban", "lớp 4A", "phòng B1",
  "Phúc Khang", "Phúc Kiên", "con chó này dễ thương", "quả óc chó", "đồ ngủ", "mày ngủ chưa", "may ngu chua", "tao ngu quá",
  "lấy cái thang cho mình", "mặt dày ghê", tên khách "Nai Khó Ở 43", "Đại Ca Lầy 12", "Heo Cute 07"…, số điểm "điểm 120000",
  "10.000.000 đồng", "12:30 nha", "ib mình nha", "chơi zalo không", "@Lâm ơi đi nè", từ trong game "nối từ: lon ton", "chiếu tướng".
- Bảng cũ `SHOULD_BLOCK` / `SHOULD_NOT_BLOCK` vẫn đạt; `name-gen.test.mjs` duyệt hết tên khách tự sinh × 00–99 vẫn đạt.
- `moderation-rooms.test.mjs`: mỗi máy chủ phòng (7 game cờ + Ma Sói + Nội Gián) chặn tên "l0n", "ｆｕｃｋ", "fսck", "kặc",
  "mày ngu", "zalo 0912345678" và che chat; "Gửi riêng" của Nội Gián che "ib zalo 0912 345 678, l0n" ⇒ "*** *** ***, ***".
  Nối Từ: `noi-tu/test/host.test.mjs` (tên + chat qua WebSocket thật).

### Chặn nhầm / lọt đã chấp nhận

- Chặn nhầm: hai số dài liền nhau ("2024 2025", "1 2 3 4 5 6 7") bị che vì giống số điện thoại. Trẻ hiếm khi cần gõ ≥ 7 chữ số.
- Chặn nhầm (chỉ tên): "Quả Óc Chó" làm tên vẫn bị thay (nhóm `nameOnly` khắt khe hơn chat).
- Lọt: số điện thoại bỏ số 0 đầu viết kiểu số tiền ("912.345.678"); số đọc bằng chữ ("không chín một hai…"); "mày ngu" gõ
  không dấu ("may ngu") vì trùng "mày ngủ"; "con chó" đứng riêng trong chat (trùng "con mèo con chó").
- Không chặn "ngu" đứng riêng ("ngu quá", "tao ngu quá"): trẻ hay tự nói về mình.

## 2. Nối Từ: `pinOf(null)` khi ván online bắt đầu (PARTY2-02)

Nguyên nhân: nút Tạo / Vào phòng bấm được trước khi `data/words.json` (≈ 400 KB) nạp xong. `openOnline()` nhận `dict = null`, tới
lúc ván bắt đầu `pinOf(null)` ném `TypeError … 'contentHash'` ở cả hai tab và ván không mở (`state.round` không bao giờ có).
Sửa (`prototype/games/noi-tu/game.js`): `openRoom()` chưa có từ điển thì hiện "Đang tải từ điển…", khoá nút, chờ `ready` rồi mới
mở phòng (bấm nhiều lần chỉ mở một phòng). `browser-e2e.mjs` thêm bước mạng chậm (120 KB/s, tắt cache): C bấm Tạo, D mở link
mời bấm Vào khi từ điển **chưa** nạp ⇒ ván bắt đầu, 0 lỗi JS. Trước khi sửa, đúng bước này hết giờ chờ (đã chạy thử để xác nhận).

## 3. Cá Ngựa online: Ván mới / Về phòng chờ (BOARD2-02, BOARD2-03, BRD-15)

Máy chủ `games-server/co-ca-ngua/room.js`:
- `again` dùng `games-server/rematch.js` như Caro / Vua / Tướng / Ô Ăn Quan: bấm = "tôi sẵn sàng"; mọi **người thật** còn trong
  phòng đã bấm ⇒ mở ngay (ghế bot và người đã rời không cần bấm); chưa đủ ⇒ đếm ngược 10 giây rồi tự mở. Người chưa bấm rời phòng
  lúc đang đếm ⇒ tính lại, những người còn lại đủ thì mở ngay.
- Lệnh mới `lobby` (chỉ ở pha `over`): cả phòng về phòng chờ, giữ mã, người và bot, bỏ người đã rời, huỷ đếm ngược.
- `state.v` thêm `again` (cờ theo ghế) và `againDeadline` (giờ máy chủ, 0 = chưa ai bấm).

Client:
- Thẻ kết quả: "1/3 muốn chơi tiếp · ván mới sau N giây"; nút của người đã bấm thành "Đã sẵn sàng ✓" (khoá), người khác thấy
  "Chơi tiếp ngay ▶". Thẻ không bị đóng ngang khi người khác bấm, kịp "Khoe kết quả".
- "Về phòng chờ" (thẻ kết quả, trước ghi "Rời phòng" và rời hẳn) ⇒ gửi `lobby`. Rời hẳn thì bấm "Rời phòng" ở phòng chờ.
- Nút trên thanh khi **đang chơi**: không thể kéo cả phòng về phòng chờ giữa ván, nên giữ hành vi rời phòng (máy đi thay) nhưng
  sửa nhãn cho đúng: "Rời bàn" (bỏ "— về phòng chờ"), hộp hỏi ghi "Bạn sẽ ra khỏi phòng, máy chủ đi thay phần của bạn." (BRD-15).

Giao thức tương thích ngược: client cũ chỉ gửi `again` ⇒ vẫn chạy (ván mới sau đếm ngược thay vì ngay); client cũ không biết
`again` / `againDeadline` thì bỏ qua. Lệnh lạ / trường rác (`{t:"lobby", x:{…}}`, `{t:null}`, `{}`) trả `err`, máy chủ không sập
(test `giao thức an toàn với client cũ`). Test mới: 4 test đồng hồ giả trong `co-ca-ngua/test/room.test.mjs` + E2E trình duyệt
`games-server/co-ca-ngua/test/rematch-e2e.mjs` (3 người).

## 4. Tài liệu nội bộ bị phục vụ công khai (PARTY2-07)

`server-static.js` `isInternal()` (bật khi `createStatic({ root })`, `server.js` truyền `ROOT`) trả 404 cho mọi file dưới
`prototype/`: `*.md`, tên bắt đầu `HANDOFF` (chữ hoa; tiếng `tiem-tra-sua/assets/audio/handoff.mp3` vẫn phục vụ),
`generation-prompts*.json`, `*-preview*.png`, và `asset-manifest.json` **trừ** 6 bản game thật sự fetch (đã grep):
`co-ty-phu/assets`, `o-an-quan/data`, `quan-com-tam/data`, `tham-tu-hem/data`, `tiem-banh-mi/data`, `tiem-tra-sua/data`.
Không chuyển file. `server-static.test.mjs` kiểm 404 (GET + HEAD) cho HANDOFF / prompts / preview / manifest Nội Gián / README,
200 cho file game thật, và **dò code game** tìm mọi `asset-manifest.json` được nhắc tới: game mới fetch manifest mà chưa thêm vào
`SERVED_MANIFESTS` thì test báo.

## Cache tag

| File | Tag mới | Chỗ tham chiếu |
|---|---|---|
| `noi-tu/game.js` | `d6g` → `d7o` | `noi-tu/index.html` |
| `co-ca-ngua/game.js` | `d6b` → `d7o` | `co-ca-ngua/index.html`, `co-ca-ngua/online.js` |
| `co-ca-ngua/hud.js` | `d6b` → `d7o` | `co-ca-ngua/game.js` |
| `co-ca-ngua/hud.css` | `d6b` → `d7o` | `co-ca-ngua/hud.js`, `co-ca-ngua/online.js` |
| `co-ca-ngua/online.js` | `d6m` → `d7o` | `co-ca-ngua/index.html` |

## Kết quả kiểm thử

Chạy trên nhánh này, mỗi lệnh có `timeout`. Không lệnh nào phải chạy lại.

| Lệnh | Kết quả |
|---|---|
| `node --test --test-concurrency=1 games-server/*.test.mjs games-server/*/test/*.test.mjs games-server/account/test/*.test.mjs server-static.test.mjs` | **381/381 đạt** |
| `node games-server/noi-tu/test/browser-e2e.mjs` (có bước mạng chậm mới) | đạt, 0 lỗi JS |
| `node games-server/ma-soi/test/browser-e2e.mjs` | đạt |
| `node games-server/ai-la-noi-gian/test/browser-e2e.mjs` | đạt |
| `node games-server/dat-bom/test/browser-e2e.mjs` | đạt |
| `node games-server/co-ca-ngua/test/rematch-e2e.mjs` (mới) | 12/12 đạt |
| `node games-server/board-online-e2e.mjs` | Caro / Vua / Tướng / Ô Ăn Quan: tất cả đạt |
| `node prototype/games/_shared/test/kick-e2e.mjs` | tất cả đạt (Caro, Ma Sói, Cá Ngựa, tên dùng chung) |
| `BASE=http://127.0.0.1:8901 node prototype/games/_shared/test/chat-off-e2e.mjs` | 250 đạt, 0 lỗi |
| `node tools/cache-tags/check-tags.mjs master` | `OK: 5 file tĩnh đổi, mọi tham chiếu ?v= tới chúng đã đổi tag.` |

Ghi chú: các E2E tự dựng server trên cổng ngẫu nhiên (`listen(0)`) và Chrome trên cổng gỡ lỗi ngẫu nhiên 9400–9900 như sẵn có;
chỉ chat-off cần server riêng, chạy ở cổng 8901 rồi tắt. Ảnh chụp ghi ra thư mục tạm và đã xoá; hồ sơ Chrome tạm đã xoá.
