# D3-online — Tên dùng chung + "Mời ra" cho 10 game online

Nhánh `claude/d3-online` (từ master 27ac178, đã merge master dfa1ca2 — giữ `clientIp(req, trustProxy)` ở mọi host.js).
Game: co-caro, co-vua, co-tuong, o-an-quan, co-ca-ngua, co-ty-phu, dat-bom, ma-soi, ai-la-noi-gian, noi-tu.

## 1. Tên dùng chung (`prototype/games/_shared/online-kit.js`)

- `sharedName({ game, input, legacy })`: ô tên mỗi game điền sẵn `account.getName()` (`_shared/account.js`, khoá `wgp.account.v1`).
  Bấm Tạo / Vào phòng ⇒ `commit(name)` ⇒ `account.setName()` nếu khác ⇒ mọi game + bảng xếp hạng cùng đổi.
- Người cũ: lần đầu mở mỗi game sau bản này, nếu có tên riêng của game (`wgp.caro.name`, `wgp.covua.name`, `wgp.tuong.name`,
  `wgp.o-an-quan.name`, `wgp.co-ca-ngua.name`, `wgp.co-ty-phu.name`, `dat-bom:name`, `ma-soi:name`, `ai-la-noi-gian:name`,
  `noi-tu` prefs.name) mà tài khoản **chưa có tên do người dùng tự đặt** ⇒ chuyển tên đó sang tài khoản. Chỉ một lần cho mỗi game
  (đánh dấu `wgp.names.migrated`). Khoá cũ **không xoá**, game vẫn ghi tiếp (quay về bản cũ vẫn thấy tên).
- "Tên do người dùng tự đặt": `account.hasCustomName()` nếu có, không thì `!account.isAutoName()` nếu có, không thì
  `wasAsked() && getName()` (bản hiện tại: `setName` / `renameMe` bật `asked`). **Agent làm tên khách tự sinh:** nếu tên tự sinh
  không bật `asked` thì không cần làm gì; nếu có, hãy thêm `hasCustomName()` hoặc `isAutoName()`.
- Chịu cả hai bản account.js: `setName()` trả chuỗi (cũ) hoặc `{ ok, name, error }` (mới; `ok:false` ⇒ vẫn gửi tên người chơi gõ
  để máy chủ lọc); `onNameChange(cb)` dùng nếu có; thêm nghe sự kiện `storage` (đổi tên ở tab khác) và `pageshow`.
- Import `./account.js?v=board2` (đúng tag hiện có) — **khi account.js đổi tag, sửa luôn dòng import trong online-kit.js** (và tăng
  `?v=ok1` của online-kit.js ở 10 game) để cả trang dùng một bản module.
- "Vào thẳng không gõ lại": ô tên luôn có sẵn tên ⇒ chỉ bấm Tạo / Vào phòng; ô tên vẫn sửa được (chính là "nút sửa tên").
  Không tự vào phòng khi mở link mời (giữ luồng resume hiện có, tránh vào nhầm).
- Tên vẫn qua lọc máy chủ (`games-server/moderation.js` trong room.js / host.js), không đổi.

## 2. "Mời ra" (chủ phòng)

Máy chủ — `games-server/kick.js` (dùng chung) + mỗi `host.js` thêm lệnh `{ t:"kick", target, name }`:
- Chỉ chủ phòng (`room.hostSeat ?? room.host`, kiểm ở máy chủ), không mời chính mình, không mời bot (đã có "kick-bot"),
  `name` phải khớp người đang ngồi ghế đó (ghế dồn trong lúc hộp xác nhận đang mở ⇒ `target`, không mời nhầm).
- Chỉ khi **không có ván đang chạy**: phòng chờ / hết ván (`lobby`, `over`, `end`; Nối Từ: chưa có ván hoặc ván vừa xong).
  Giữa ván **không cho** — mời ra giữa ván = loại người đang chơi (Đặt Bom: giết nhân vật; 1v1: xử ván; Tỷ Phú/Cá Ngựa: máy
  đi thay), chủ phòng có thể đuổi người đang thắng ⇒ phá luật. Chat quấy giữa ván: "Tắt chat" đã có.
- Người bị mời ra nhận `{ t:"kicked", by:"host" }`; kết nối giữ mở (tạo / vào phòng khác ngay). Client cũ hiểu "kicked" là rời phòng.
- Chặn vào lại 10 phút (`KICK_BAN_MS`, test đổi bằng `opts.kickBanMs`): theo token ghế + **mã phiên `sid`**
  (`localStorage "wgp.sid"`, 32 hex ngẫu nhiên, client gửi kèm create / join / resume). **Không theo IP** (cả nhà chung mạng vẫn
  vào được — có test). `join` cùng sid / `resume` bằng token cũ ⇒ `err "banned"`. Client cũ không gửi sid ⇒ chỉ chặn token.
  Xoá localStorage thì lách được — chấp nhận (mức "lịch sự", không phải chống phá).
- Seat resume: người bị mời ra mất ghế; client xoá `wgp.<game>.seat.<MÃ>` / sessionStorage; resume ⇒ "banned".
- Host migration (Ma Sói, Nội Gián): quyền mời ra đi theo `room.host` hiện tại (có test: chủ cũ rời ⇒ người kế nhiệm mời ra được).
  Ma Sói / Nội Gián lúc hết ván (`end`): ghế bị mời ra mất token + `connected:false`; "Chơi ván mới" tự bỏ ghế đó.
- Nối Từ: chủ phòng (ghế 0) mời ghế 1 khi ván xong ⇒ máy chủ dừng trọng tài, phòng về chờ người mới (`{t:"lobby", started:false}`);
  `session/online.js` dừng MatchClient cũ mà không gửi "leave" (`onReset`).

Client:
- `kickButtonHTML(ghế, tên)` + `initKick({ send })` (online-kit.js): nút "Mời ra" (≥ 44 px, lún khi ấn) cạnh tên người khác,
  chỉ khi mình là chủ phòng; bấm ⇒ `pxConfirm` ⇒ gửi lệnh. Thuộc tính `data-pxkick` (Ma Sói / Nội Gián đã dùng `data-kick` cho bot).
- `prototype/games/_shared/px-confirm.js`: hộp xác nhận pixel V5 dùng `<dialog>` (lớp trên cùng, Esc / bấm ra ngoài = Thôi,
  danger ⇒ focus "Thôi"), trả `Promise<boolean>`. Đợt 4 dùng lại để thay mọi `confirm()`.
- Nơi đặt nút: Caro / Vua / Tướng / Ô Ăn Quan: thẻ ghế ở phòng chờ. Cá Ngựa: hàng ghế HUD phòng chờ (kiểu `px-btn mini` của game).
  Tỷ Phú: hàng nút chủ phòng (cạnh "+ Thêm bot"). Đặt Bom: danh sách người (phòng chờ + hết ván). Ma Sói / Nội Gián: chip ở danh
  sách phòng chờ. Nối Từ: thẻ kết thúc ván (chủ phòng).
- Lời báo: "Chủ phòng đã mời bạn ra khỏi phòng." / vào lại: "… 10 phút nữa mới vào lại được. Bạn vẫn tạo hoặc vào phòng khác được nhé."

## Tag `?v=` đã tăng
`game.js?v=d3o` (Caro, Vua, Tướng, Ô Ăn Quan, Cá Ngựa, Tỷ Phú, Nối Từ), `net.js?v=kk1`, Cá Ngựa `online.js?v=d3o` + `hud.js?v=d3o`,
Tỷ Phú `online.js?v=d3o`, Đặt Bom `app.js?v=d3o` + `style.css?v=d3o`, Ma Sói / Nội Gián `app.js?v=d3o`; file mới `online-kit.js?v=ok1`,
`px-confirm.js?v=pc1`. `node tools/cache-tags/check-tags.mjs master` ⇒ OK.

## Test
- `npm run test:kick` (mới, `games-server/kick.test.mjs`): 9 game khuôn chung — khách không mời được, không mời mình / ghế lạ,
  kicked + giữ kết nối, banned (join cùng sid, resume token cũ có/không sid), phiên khác cùng IP vào được, hết hạn vào lại được;
  Caro giữa ván ⇒ phase, hết ván mời được; Ma Sói `end`; Ma Sói host migration. Nối Từ: thêm 1 test trong `noi-tu/test/host.test.mjs`.
- `prototype/games/_shared/test/kick-e2e.mjs` (mới, `npm run test:kick:e2e`): 2 hồ sơ Chrome — Cờ Caro, Ma Sói, Cờ Cá Ngựa:
  chỉ chủ phòng thấy 1 nút, hộp pixel (không gọi `confirm()`), Thôi không làm gì, Mời ra ⇒ B thấy lời báo + ghế lưu bị xoá,
  B mở lại link vào lại ⇒ "10 phút". Tên dùng chung: đặt ở Caro ⇒ Ma Sói / Nối Từ / Cá Ngựa điền sẵn; đổi ở Ma Sói ⇒ Caro đổi theo;
  tên cũ của Cờ Vua ⇒ chuyển sang tài khoản ⇒ Đặt Bom điền sẵn, khoá cũ còn nguyên.
- `net-resume.test.mjs`: cập nhật vì create / join / resume gửi kèm `sid`.
- Kết quả các bộ test xem mục "Kết quả chạy" dưới.

## Chưa làm / để ý
- Không mời ra giữa ván (lý do ở trên). Máy chủ đã sẵn tham số `phases` nếu sau này muốn mở cho game nào.
- Nối Từ: báo lỗi "target"/"phase" của lệnh kick không hiện toast (hiếm, nút chỉ hiện khi hợp lệ).
- Chưa giao diện mời ra lúc hết ván ở Caro/Vua/Tướng/Ô Ăn Quan/Cá Ngựa/Tỷ Phú/Ma Sói/Nội Gián (máy chủ cho phép; nút chỉ ở phòng chờ,
  trừ Đặt Bom + Nối Từ).
- `confirm()` cũ (Hủy phòng, Rời ván…) để Đợt 4 thay bằng `pxConfirm`.

## Kết quả chạy (25/11, sau khi merge master 86c0552)
- `node --test --test-concurrency=1 games-server/*.test.mjs`: 96/96 đạt (gồm `kick.test.mjs` 12/12, disband, resume, client-ip).
  Một lần chạy song song với `sound-press-e2e` (Chrome đang chạy) trượt 12 do máy bận; chạy lại riêng: đạt hết.
- `test:ma-soi` 35, `test:ai-la-noi-gian` 32, `test:dat-bom` 21, `test:noi-tu` 14 (thêm test mời ra), `test:ws` 14, `test:esm` 18,
  `test:account` 26, `test:static` 8: đạt hết.
- Unit test game (`prototype/games/{co-caro,co-vua,co-tuong,o-an-quan,co-ca-ngua,co-ty-phu,noi-tu}/test`, `_shared/test/*.test.mjs`):
  209/209 đạt (`net-resume.test.mjs` sửa để chấp nhận `sid`).
- E2E: `kick-e2e.mjs` (Caro, Ma Sói, Cá Ngựa + tên dùng chung) đạt hết; `resume-e2e.mjs` 6 game đạt hết; `test:ma-soi:e2e`,
  `test:ai-la-noi-gian:e2e`, `test:dat-bom:e2e`, `noi-tu/test/browser-e2e.mjs` đạt hết; `sound-press-e2e.mjs` không có FAIL.
- `chat-off-e2e.mjs`: 9 game đạt hết; **Nối Từ chập chờn** (mỗi lần trượt 1–4 mục khác nhau: hết giờ chờ mã phòng / ô chat). Chạy
  cùng test trên master 86c0552 cũng trượt y như vậy (1–4 lỗi) ⇒ có từ trước, không do nhánh này.
- `node tools/cache-tags/check-tags.mjs master`: OK.
