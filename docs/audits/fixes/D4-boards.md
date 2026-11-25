# D4-boards — 6 game cờ: Cờ Caro, Cờ Vua, Cờ Tướng, Ô Ăn Quan, Cờ Cá Ngựa, Cờ Tỷ Phú

Nhánh `claude/d4-boards` (từ master fd03559). Không sửa `_shared/*` hay game ngoài 6 game này.

## BRD-09 (gộp OAQ-07) — "Ván tiếp" hai phía (Caro, Vua, Tướng, Ô Ăn Quan)

Máy chủ — file mới `games-server/rematch.js` (lớp `Rematch`, dùng chung cho 4 `room.js`):
- Hết ván, `{t:"again"}` = "tôi sẵn sàng". Mọi người trong phòng sẵn sàng ⇒ mở ván mới ngay. Chưa đủ ⇒ đếm ngược
  `timings.again` (mặc định 10 000 ms) rồi tự mở ván mới.
- Danh sách sẵn sàng theo token ghế. Rời phòng / bị mời ra / đóng phòng / bắt đầu ván ⇒ `reset()` (huỷ hẹn giờ).
  Ván mới chỉ mở nếu phòng vẫn ở pha `over` và đủ người (kiểm lại trong `nextRound()`).
- `viewFor()` thêm `again: boolean[]` (theo thứ tự ghế) và `againDeadline` (giờ máy chủ, 0 = chưa ai bấm).
- Tương thích ngược: client cũ bỏ qua trường mới, vẫn gửi `again` một lần ⇒ ván mới mở sau 10 giây (thẻ kết quả của người kia
  không bị đóng ngang). Client mới gặp máy chủ cũ (không có `again`) ⇒ hành xử như trước. Lệnh lạ / lặp không làm sập máy chủ
  (bấm lại không dời hạn). Cờ Tướng vẫn kiểm `gid` cũ ⇒ `stale`.

Client: thẻ kết quả có dòng `#eAgain` — "Đối thủ muốn chơi tiếp · ván mới sau N giây" (người kia) / "Đã sẵn sàng — chờ đối thủ"
(mình, nút khoá "Đã sẵn sàng ✓"); nút của người kia đổi thành "Chơi tiếp ngay ▶". Thẻ chỉ đóng khi ván mới thật sự mở ⇒ kịp Khoe.
Đang xem bàn (thẻ đóng) ⇒ toast. Ô Ăn Quan 2v2: "k/4 người muốn chơi tiếp".

## BRD-10 (gộp OAQ-04) — mất kết nối / máy đi thay (Caro, Vua, Tướng, Ô Ăn Quan)
- Nhãn dưới tên trên thẻ người chơi: `Quân X · Bạn · mất kết nối` (span `.sd/.me/.off`), thẻ đối thủ mờ quân (`.pl.away`).
  Trước đây nhãn này bị ẩn trên điện thoại (`.who small {display:none}`); giờ máy hẹp bỏ phần "Quân X", vẫn giữ "Bạn"/"mất kết nối".
- Toast theo `players[i].connected`: "X mất kết nối — chờ quay lại, quá hạn máy sẽ đi thay." / "X đã quay lại."
- Toast khi `act.auto` (nước vừa đi do máy chủ): "Hết giờ — máy đã đi thay bạn một nước." hoặc "X mất kết nối / hết giờ — máy đi thay."
  (Tướng và Ô Ăn Quan bỏ toast cũ trùng.) Giống cách Tỷ Phú hiện "Mất kết nối" trên thẻ.

## BRD-08 — tên
- Ô tên (6 game): bộ đếm `n/16` (`aria-live`, `aria-describedby`), đếm ký tự thật như máy chủ / account.js; quá 16 ⇒ đỏ "· dài quá" và
  Tạo / Vào phòng báo "Tên tối đa 16 ký tự — bớt N ký tự nhé." (không cắt im lặng giữa chữ; `maxlength` 40 chỉ để chặn dán quá dài).
  Đổi tên ở game / tab khác ⇒ cập nhật ô + bộ đếm (`sharedName({ onChange })`).
- Thẻ người chơi điện thoại dọc (≤520 px): tên xuống hàng riêng dưới quân + điểm, tối đa 2 dòng (`-webkit-line-clamp:2`,
  `overflow-wrap:anywhere`) thay vì "N…". Cờ Tướng ≤360 px không còn ẩn tên (thu nhỏ quân/chữ). Thẻ của mình luôn có nhãn "Bạn".
- Cá Ngựa: tên người chơi không viết hoa nữa (sửa luôn BRD-16 dấu chồng bị cắt), thẻ / ghế 2 dòng, "· Bạn" cạnh tên.
  Tỷ Phú: thẻ "Bạn · Tên · Linh vật", tên 2 dòng.

## BRD-12 — "Khoe kết quả" Cá Ngựa, Tỷ Phú
`shareResult` (`_shared/share.js?v=s2`) như Caro: Cá Ngựa nút `data-act="share"` ở bảng kết quả (`shareEnd()` trong hud.js);
Tỷ Phú `#shareBtn` ở bảng tổng kết. Chơi với máy và online đều có; tiêu đề + 4 dòng số thật + câu vui.

## BRD-11 — bỏ `confirm()`
Mọi `confirm()` trong 6 game ⇒ `pxConfirm` (`../_shared/px-confirm.js?v=pc1`): Rời ván, Hủy phòng, "← Trang chủ" giữa ván,
Xin thua, Đồng ý hòa (Tướng chung máy), Bỏ ván (Vua). Sau khi hộp đóng kiểm lại trạng thái (còn trong phòng / còn chủ phòng /
ván chưa xong). Link "← Trang chủ": lấy `href` trước khi chờ. Cờ Tướng `ctx.noConfirm` (test) vẫn chạy đồng bộ.

## QCK-01
Bỏ `<span class="tag">Lụm Kèo · bản chơi thử · pixel V5</span>` (Caro, Vua, Tướng), "… trò chơi dân gian · pixel V5" (Ô Ăn Quan) và
CSS `.tag`; Cá Ngựa `<title>` "Cờ Cá Ngựa — Lụm Kèo", nhãn đầu trang "Hội đua ngựa làng".

## Nút ≥ 44 px trên điện thoại
Caro/Vua/Tướng/Ô Ăn Quan: link "← Trang chủ" (cao 44, thanh trên không cao thêm), `.seg` 40→44, nút chat 36/42→44, công cụ màn ngang
36/38/40→44, hộp mời hòa (Vua `.ask`, Tướng `.offer`) 38→44, Ô Ăn Quan `.anim` 40→44. Cá Ngựa, Tỷ Phú: nút biểu tượng, seg, khay xúc xắc,
nút trong bàn, chat đều ≥44 khi cảm ứng / hẹp / thấp. E2E đo mọi nút hiển thị ở 360×740 và 740×360.

## Tag `?v=` đã tăng (đều `d4b`)
- `co-caro/game.js`, `co-vua/game.js`, `co-tuong/game.js`, `o-an-quan/game.js`, `co-ty-phu/game.js` (tham chiếu ở index.html).
- Cá Ngựa: `game.js` (index.html, online.js), `hud.js` (game.js), `online.js` (index.html), `hud.css` (hud.js, online.js), `online.css` (online.js).
- `net.js`, `logic.js`, `ai.js`, Tỷ Phú `online.js` không đổi. `node tools/cache-tags/check-tags.mjs master` ⇒
  `OK: 10 file tĩnh đổi, mọi tham chiếu ?v= tới chúng đã đổi tag.`

## Test
- Mới `games-server/rematch.test.mjs` (21 test): 4 game × (một người bấm ⇒ chưa mở, cờ + hạn 10 s; người kia bấm ⇒ mở ngay, hẹn giờ huỷ;
  client cũ một phía ⇒ hết hạn tự mở; rời / mời ra giữa đếm ngược ⇒ về phòng chờ, không mở; đóng phòng huỷ hẹn giờ; again giữa ván ⇒ phase)
  + 4 test WebSocket thật. Test cũ của 4 room sửa cho luồng hai phía.
- Server (`node --test --test-concurrency=1` rematch + 6 game + kick, disband, resume, esm-load): 179 test; lần chạy song song với e2e trượt 3 test
  hẹn giờ (resume, Cá Ngựa — không đổi ở đợt này); chạy lại riêng: 88/88 + 32/32 đạt. `co-ca-ngua/test/room.test.mjs` cũng chập chờn trên master khi máy tải nặng.
- Client unit: Caro 13, Tướng 15, Vua 16, Ô Ăn Quan 21, Cá Ngựa 31, Tỷ Phú 7 — đạt.
- Mới `games-server/board-online-e2e.mjs` (Chrome headless, 2 hồ sơ; A trên điện thoại 360 px): bộ đếm + chặn tên dài, tên dài đọc được,
  nhãn "Bạn", nút ≥44 (dọc/ngang), Rời ván ⇒ hộp pixel (Thôi giữ ván), B đóng tab ⇒ nhãn + toast mất kết nối, máy đi thay sau 15 s ⇒ toast
  (Caro, Ô Ăn Quan), B mở lại link ⇒ đúng ghế + "đã quay lại", Xin thua qua hộp pixel (Vua, Tướng), Ván tiếp hai phía + Khoe giữa lúc chờ,
  Caro hết 10 s tự mở ván. Kết quả: 4/4 ĐẠT (Caro 51 s, Vua 16 s, Tướng 24 s, Ô Ăn Quan 43 s).
  Chạy: `node games-server/board-online-e2e.mjs [co-caro co-vua co-tuong o-an-quan]`.
- `prototype/games/_shared/test/kick-e2e.mjs co-caro co-ca-ngua` — đạt (cả tên dùng chung). Cá Ngựa/Tỷ Phú còn được kiểm bằng script tạm (360×640,
  640×360): bộ đếm, chặn tên, không lỗi JS, nút ≥44, Khoe mở bảng chia sẻ, Rời ván dùng hộp pixel.

## Còn lại / câu hỏi cho chủ dự án
- Đếm ngược 10 s vẫn chạy khi đối thủ đang mất kết nối (ván mới mở, máy đi thay sau 15 s như cũ). Có muốn chờ người mất kết nối không?
- Cá Ngựa điện thoại dọc: hộp kết quả cao hơn lớp phủ (có từ trước; nút Khoe thêm một hàng), nút tắt tiếng đè tiêu đề ở 360 px —
  đề xuất `.cn-result { overflow:auto; place-items:start center }`, chưa sửa.
- Màn ngang thấp: thanh trên giờ cao đúng 44 px (link chạm được) ⇒ bàn cờ nhỏ đi ~10 px.
- `package.json` chưa thêm script cho 2 test mới (tránh đụng file chung): `node --test games-server/rematch.test.mjs`, `node games-server/board-online-e2e.mjs`.
