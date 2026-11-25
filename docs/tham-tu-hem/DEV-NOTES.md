# Thám Tử Hẻm: ghi chú dev

Hợp đồng chung (vòng chơi, dàn nhân vật, 6 vụ, định dạng vụ): `docs/tham-tu-hem/DESIGN.md`. Asset: `docs/tham-tu-hem/asset-spec.json`.
Code: `prototype/games/tham-tu-hem/` (JS module thuần, không build). Tag cache: `?v=t10`–`t12` theo từng file (xem README); file vụ dùng chung tag trong `game.js` (`loadCase`, `prefetchNextCase`), sửa file vụ nào cũng phải tăng tag đó.

## 1. Kiến trúc

```
data/cases/index.js     danh mục 12 vụ (thứ tự mở khoá, `season: 2` cho vụ 7–12) — coordinator giữ
data/cases/<id>.js      dữ liệu từng vụ (agent viết vụ) — nạp ĐỘNG, thiếu file ⇒ thẻ "Sắp ra mắt"
data/asset-manifest.json  bản chép docs/tham-tu-hem/asset-manifest.json (server chỉ phục vụ prototype/)
core/validate.js        bộ kiểm vụ (tham chiếu, đi được tới cuối, lượng nội dung) + evalNeeds / wordsIn / lineOf
core/engine.js          luật một vụ: createRun, apply(c, s, action) = cửa DUY NHẤT đổi state (bản nháp + kiểm bất biến), ★, gợi ý, sanitizeRun
core/text.js            tách [[từ khoá]], RNG có hạt trong state, pickFrom (không lặp liên tiếp)
core/progress.js        hồ sơ người chơi: tên, vụ đã phá, danh tiếng, hạng, mùa (SEASONS, seasonUnlocked, pickSeason), MIGRATIONS bản lưu
core/solver.js          bot giải tự động (nextAction / solve) — dùng ở test và e2e-bot
save.js                 adapter localStorage `wgp.tham-tu-hem.v1` (+ .bak-vN, .corrupt, .backup)
game.js                 nối mọi thứ: manifest → bản lưu → danh mục vụ → màn; app.act() = apply ⇒ hiệu ứng ⇒ thoại ⇒ vẽ lại
ui/dom.js               h(), icon pixel 16×16 (SVG crispEdges), toast, hộp xác nhận / lựa chọn
ui/art.js               manifest → chân dung / cảnh / toạ độ điểm soi; vẽ thay bằng canvas khi chưa có ảnh; crisp
ui/dialog.js            thoại visual novel (gõ chữ dần, bấm qua, Tua, thẻ vật chứng / lời khai trong thoại)
ui/screens.js           màn nền: mở game, bản đồ (tab 2 mùa), màn chuyển mùa 2, văn phòng + bài đăng nhóm, hiện trường, vạch mặt, kết vụ
ui/panels.js            bảng phủ: thẩm vấn, sổ tay, bảng suy luận, chọn vật chứng
ui/fx.js                tem mực (MÂU THUẪN! / BỂ! / TRẬT! / VẠCH MẶT! / ĐÃ KHỚP), rung màn, kính lúp nứt
ui/sfx.js               âm thanh: bộ mp3 riêng, nhạc + nền theo màn (mục 4)
test/                   node --test (*.test.mjs) + e2e.mjs, e2e-bot.mjs, e2e-season.mjs (Chrome headless qua cdp.mjs)
```

### Engine (core/engine.js)

- State một vụ (lưu được, JSON): `phase` (intro → play → finale → done), `loc`, các tập `visited/locs/people/clues/words/stmts/broke/talk/seen/flags/hints`, `cred` (uy tín 1–5), bộ đếm phạt, `board`, `solved`, `fin.step`, `bonus`, `result`, `rng`, `pick`.
- `apply(c, s, action)` trả `{ s, show, ev, error }`. Lỗi ⇒ trả nguyên `s` cũ.
  - `show` là hàng đợi hiển thị: dòng thoại + thẻ (`clue`, `stmt`, `loc`, `person`). Giao diện phát lần lượt.
  - Mỗi mục **hiện ra** thì gửi `{type:"read", text}` ⇒ nhặt `[[từ khoá]]` (DESIGN §4). Tua thoại vẫn tính là đã đọc. Bot giải tự động đọc y như vậy, nên bot qua = người chơi qua.
- Action: `read, intro, go, examine, ask, contradict, present, fill, commit, accuse, rebut, hint, bonus`.
- Sai khi vạch mâu thuẫn / vạch mặt: −1 uy tín. Về 0 ⇒ Tèo can (`teoRescue` hoặc câu chung), hồi về 1, `rescues++`.
- Chốt bảng: cả bảng một lần, chỉ báo **số** chỗ sai.
- ★: phạt = uy tín mất + chốt sai + số gợi ý MỚI + 2 × lần Tèo can. ≤ 2 ⇒ 3★, ≤ 5 ⇒ 2★, còn lại 1★; có Tèo can thì tối đa 2★.
- Gợi ý Tèo: gợi ý đầu tiên (theo thứ tự mảng) có `needs` đạt, bỏ gợi ý có `done` đạt, bỏ gợi ý có `stmt:x` mà mọi lời khai đó đã bể; ưu tiên câu chưa nói. Hỏi lại câu đã nói không bị phạt. Lúc vạch mặt dùng `finale.steps[].hint`.
- Danh tiếng (core/progress.js): (50 + 50 × độ khó) × 60/80/100% theo ★, + 20 mỗi câu hỏi phụ đúng. Phá lại chỉ cộng phần vượt kỷ lục cũ của vụ. Hạng: tập sự 0 · hẻm 120 · phường 350 · quận 650 · Huyền thoại Hẻm 47 1000 · Thám tử Chợ Hẻm 1300 · Thám tử thành phố 1600 · Huyền thoại Sài Gòn 1950 (= đúng 12 vụ 3★, chưa tính câu hỏi phụ; mùa 1 tối đa 1260 nên người chơi cũ không nhảy hạng khi cập nhật).
- Ghi kết quả khi rời màn kết vụ (câu hỏi phụ trả lời trước đó được cộng). Đóng trang ở màn kết ⇒ lần mở sau tự ghi.

### Trường tuỳ chọn engine thêm vào định dạng vụ (DESIGN §4, bộ kiểm có kiểm)

`needs` phủ định `"!x:y"`, `stmts.<id>.break.also`, `hints[].done`, `finale.steps[].hint`, `teoRescue`, `people.<pid>.sheet` (mùa 2, phải là id vụ trong danh mục). Bộ kiểm cảnh báo từ khoá không bao giờ nhặt được.

`soiOn: true` (cấp vụ, không qua engine): mở vụ là Chế độ soi đã bật (viền + nhãn mọi điểm soi). Chỉ Vụ 1 (vụ hướng dẫn) dùng, TTH-02; người chơi vẫn tắt được.

### Bản lưu

- `wgp.tham-tu-hem.v1` = `{ v, name, rep, solved: {id: {stars, rep, times, last}}, runs: {id: state vụ đang dở}, flags: {s2intro} }`.
- `flags` (mùa 2) là trường **tuỳ chọn**, nên vẫn `v: 1`, không thêm MIGRATIONS: bản cũ không có thì đọc ra `{}`; code cũ đọc bản mới thì bỏ qua trường này, không coi là hỏng. Nâng `v` sẽ làm code cũ (cache, rollback) coi bản lưu là "phiên bản tương lai" ⇒ hồ sơ mới, nên chỉ nâng khi đổi nghĩa trường cũ.
- `MIGRATIONS[0]` nâng bản v0 (thử nghiệm, không có `v`) lên v1. Nâng thì chép thô sang `.bak-v0` một lần. Bản hỏng chép sang `.corrupt`, không xoá.
- Tiến độ từng vụ đọc qua `sanitizeRun` (bỏ id không còn trong file vụ, kẹp số), nên người viết sửa vụ không làm vỡ bản lưu.
- **Chơi lại vụ** (khi mở vụ đang dở, hoặc nút ở màn kết): có xác nhận, chỉ xoá tiến độ dở của vụ đó. **Xoá tiến độ** (màn mở → Cách chơi): có xác nhận, cất `.backup` rồi xoá, khoá ghi tới khi tải lại.

### Giao diện

- HUD V5: khung pixel-cut (box-shadow 3px), vát, bóng cứng lệch, không bo tròn, Be Vietnam Pro, panel `#1d1a16`, chữ `#f4ead2`. Vàng chỉ cho nút chính của màn.
- Chất liệu hồ sơ: thẻ vụ / folder giấy kraft, lời khai và câu chối trên giấy ghi chú, bảng suy luận = bảng bần (dither) + ghim + dây đỏ (SVG), tem mực "ĐÃ PHÁ".
- Tem riêng của game (không chép game thương mại nào): bấm vạch ⇒ tem đỏ "MÂU THUẪN!" + rung màn, rồi "BỂ!" (đỏ) hoặc "TRẬT!" (xám, kính lúp nứt).
- Crisp (PLAYBOOK §2): cảnh 960×540 hiện với px thiết bị / px file là bội 0,5 (`crispScale`). Điện thoại: cảnh cao ~48% màn, kéo ngang. Điện thoại xoay ngang (`(orientation: landscape) and (max-height: 500px)`, TTH-03): thanh trên 44 px, cảnh cao trọn khung bên trái (844×390 và 568×320 ⇒ 480×270, hẹp thì kéo ngang), địa điểm + Chế độ soi + người trong vụ ở cột phải.
- Thanh trên trong vụ: Sổ tay / Bảng / Tèo dưới 1100 px là icon + nhãn chữ 10 px bên dưới (`.btn--tool .tl`), nút ≥ 44×44; ≤ 400 px kính lúp co 14 px để loa không bị cắt ở 320. Chân dung HD 1×: bội 128 px thiết bị (ảnh đại diện nhỏ thì lọc mượt).
- Toạ độ điểm soi: `manifest.hotspots["assets/scenes/<case>/<scene>.webp"][id]` → `rect` trong vụ → tự xếp lưới.
- Chân dung: frame `<pid>-<mood>` tìm ở `portraits-<people.pid.sheet>.webp` (nếu có), rồi `portraits-<case>.webp`, rồi `portraits-cast.webp`, rồi bất kỳ sheet chân dung (khách mời vụ 6). Thiếu mood ⇒ neutral. Thiếu hết ⇒ chân dung pixel vẽ bằng canvas (màu theo người, chữ cái đầu, biểu cảm theo mood).
- Chưa có cảnh ⇒ cảnh vẽ thay (tường / sàn dither, đèn, khối đồ vật ở vị trí điểm soi đang hiện) và luôn bật nhãn điểm soi.
- Phím: Space/Enter qua thoại, N sổ tay, B bảng suy luận, M tắt tiếng, Esc đóng bảng phủ.
- Móc test: `?case=__mini` thêm vụ mẫu (chỉ localhost hoặc `?dev=1`), `?fast=1` hiện chữ ngay, `window.__game`.

## 1b. Mùa 2 (vụ 7–12, "Chợ Hẻm")

- **Danh mục**: `data/cases/index.js` ghi `season: 2`. Vụ không ghi `season` thuộc mùa 1. Thứ tự mở khoá vẫn là một chuỗi: Vụ 7 mở khi phá Vụ 6.
- **Tab bản đồ** (`SEASONS` trong core/progress.js): "Mùa 1 · Hẻm 47" (`hem-map.webp`) / "Mùa 2 · Chợ Hẻm" (`hem-map-2.webp`). Chấm vụ đọc `manifest.hotspots["assets/scenes/hem-map-2.webp"][caseId]`, chưa có thì dùng `DEFAULT_PINS` trong screens.js. Chưa có ảnh thì vẽ thay khu chợ (`placeholderScene(…, "map2")`: đường lớn, dãy sạp mái bạt sọc, lối gạch, sân khấu, nhà số 13).
- **Khoá**: mùa mở khi vụ đầu của mùa đã mở khoá (`seasonUnlocked`). Tab khoá có ổ khoá + tooltip "Phá xong Vụ 6 để mở Chợ Hẻm"; bấm thì hiện toast đó và ở lại mùa 1.
- **Tab tự chọn** (`pickSeason`): mùa của vụ mới nhất đang dở (phase `play`/`finale`), không có thì mùa của vụ mới nhất đã mở khoá. Chọn tay giữ trong phiên. Rời một vụ thì về tab của vụ đó; riêng lúc vừa mở mùa 2 mà chưa xem màn chuyển thì tự chọn (ra màn chuyển).
- **Màn chuyển** (screen `season`, lần đầu bản đồ ra mùa 2): thoại Tèo + bà Tư (`SEASON2_INTRO`), rồi điện thoại có bài đăng nhóm của bà Tư (`SEASON2_POST`), nút "Ra Chợ Hẻm" ghi `profile.flags.s2intro = 1`.
- **Nạp lười**: mùa còn khoá thì không nạp file vụ (status `pending`, thẻ "Khoá"), nên người chơi mùa 1 không phải tải hay gặp 404 các vụ chưa ra. Phá Vụ 6 xong rời màn kết ⇒ `refreshCatalog` nạp file vụ mùa 2 rồi vẽ lại. Mùa đã mở mà file vụ chưa có (404) ⇒ "Sắp ra mắt", không lỗi JS (dòng 404 mạng của trình duyệt vẫn có, e2e bỏ qua đúng đường `data/cases/*.js?v=t4`).
- **Chân dung dùng lại**: `people.<pid>.sheet: "<id vụ cũ>"` ⇒ `registerSheets(c)` lúc nạp vụ, `portraitFrame` ưu tiên `portraits-<sheet>.webp`.
- **Asset đợt 4** (Codex): `assets/scenes/hem-map-2.webp` + `manifest.hotspots` cho 6 chấm, cảnh `assets/scenes/<vụ>/<cảnh>.webp`, `portraits-<vụ>.webp`, `clues-<vụ>.webp`. Có file là game tự dùng, không cần sửa code.
- **Kiểm**: `test/season.test.mjs` (tab, mở khoá, tab tự chọn, hạng, bản lưu cũ, `sheet`); `test/e2e-season.mjs` (tiêm bản lưu đã phá Vụ 6 ⇒ màn chuyển ⇒ tab mùa 2 ở 1366×768 và 390×844, elementFromPoint, ảnh); `e2e-bot.mjs` chạy mọi vụ có file kể cả mùa 2, vụ chưa có file thì SKIP.

## 2. Thêm một vụ

1. Viết `prototype/games/tham-tu-hem/data/cases/<id>.js` theo DESIGN §4 (id phải có trong `data/cases/index.js`).
2. `node prototype/games/tham-tu-hem/tools/check-case.mjs data/cases/<id>.js` ⇒ **0 lỗi — ĐẠT**.
3. `cd prototype/games/tham-tu-hem && npm test` ⇒ bộ kiểm + **bot giải tự động ra 3★** cho mọi vụ trong `data/cases`.
4. (Tuỳ) `PORT=8871 node server.js` rồi `PORT=8871 node prototype/games/tham-tu-hem/test/e2e-bot.mjs <thư mục ảnh> <id>` ⇒ giải trọn vụ qua giao diện thật + ảnh từng cảnh.
5. Game tự nạp; thẻ vụ hết "Sắp ra mắt". Không cần sửa engine.

## 3. Kiểm

```
cd prototype/games/tham-tu-hem && npm test
PORT=8871 node server.js
PORT=8871 node prototype/games/tham-tu-hem/test/e2e.mjs <thư mục ảnh>        # vụ mẫu, desktop 1366×768 dpr 1,25 + mobile 390×844 dpr 3
PORT=8871 node prototype/games/tham-tu-hem/test/e2e-bot.mjs <thư mục ảnh>    # mọi vụ có file (cả mùa 2) qua giao diện (VIEW=mob cho điện thoại)
PORT=8871 node prototype/games/tham-tu-hem/test/e2e-season.mjs <thư mục ảnh> # tab mùa, khoá mùa 2, màn chuyển, "Sắp ra mắt" (desktop + điện thoại)
```

## 4. Asset + âm thanh (đợt 3 đã giao)

- Ảnh: 18 cảnh, chân dung cast + 6 vụ, title, office, hem-map, 93 icon vật chứng (`assets/clues-<vụ>.webp`, ô 96, lưới 2×, frame = id vật chứng), `manifest.hotspots` đủ.
- Manifest: `data/asset-manifest.json` là bản chép `docs/tham-tu-hem/asset-manifest.json` (test kiểm khớp). Codex sửa manifest thì chép lại và đổi tag `?v=`.
- Điểm soi lồng nhau (chi tiết nằm trong đồ vật lớn, ví dụ `hop-qua-lac` trong `dong-ho-qua-lac`, `nut-gain` trong `ban-mixer`): điểm nhỏ vẽ sau nên nằm trên; nhãn điểm nhỏ đặt phía trên ô.
- Vùng chạm tối thiểu: `.hs::before` nở đều quanh tâm cho đủ 44×44 px css (trước TTH-03 là 36) (điểm soi nhỏ như `cong-usb`, `nut-gain`, `thu-nhat` trên điện thoại cảnh co 0,5–0,67). Điểm đủ lớn giữ nguyên khung. Vì vậy không cần phóng to rect cho dễ bấm.

### Sửa toạ độ điểm soi chồng nhau (dev, 2026-11)

Quét mọi cảnh (rect hiệu lực = manifest → rect vụ), tìm cặp IoU > 0,3 hoặc ô nhỏ nằm > 50% trong ô lớn mà không phải lồng chủ ý, soi ảnh rồi sửa trong cả hai bản manifest. Không đổi logic vụ.

| Cảnh | Điểm | Trước | Sau | Lý do |
|---|---|---|---|---|
| `nhan-dam-hoi/livingroom` | `mam-qua` | [236,336,450,132] | [618,352,156,112] | Ô cũ trùm cả khay trầu cau và hộp nhẫn (IoU 0,60 với `khay-trau-cau`). Nay ôm hộp mứt bát giác + đĩa cam bên phải hộp nhẫn |
| | `hop-nhan` | [526,350,96,108] | [530,354,86,98] | Ôm sát hộp nhẫn, không lấn sang mâm quả |
| | `hop-qua-lac` | [544,392,60,48] | [868,132,60,140] | Ô cũ nằm đè lên hộp nhẫn; "hộp quả lắc" là khoang kính quả lắc của đồng hồ (lồng chủ ý trong `dong-ho-qua-lac`) |
| | `gam-sofa` | [522,388,272,52] | [772,340,78,60] | Ô cũ vắt ngang mặt bàn (đè hộp nhẫn, mâm quả). Nay ở chân sofa bên phải, chỗ thấy được gầm |
| `nhan-dam-hoi/kitchen2` | `thot-go` | [478,310,232,94] | [480,318,72,84] | Nồi thịt kho vẽ đè lên giữa thớt (IoU 0,37). Ô thớt nay là phần gỗ lộ bên trái nồi |
| `noi-thit-kho/kitchen` | `bon-rua` | [744,266,212,260] | [746,266,210,184] | Ô cũ kéo tới sàn, trùm 73% con mèo `meo-mun`. Nay dừng dưới ống xả |
| `dam-cuoi-toang/tent` | `bong-bay-chu` | [788,40,84,96] | [788,38,84,62] | Chỉ ôm chùm bóng chữ, bỏ bảng 囍 (thuộc cổng hoa) |
| `dam-cuoi-toang/backstage` | `hop-xop` | [512,354,76,54] | [538,350,54,64] | Ôm hình hộp đen cạnh túi, bớt đè túi xách (66% → 44%) |
| `dam-cuoi-toang/soundbooth` | `cuon-day-loa` | [558,402,272,136] | [560,404,246,134] | Bỏ phần thừa bên phải cuộn dây; còn chồng `ghe-dj` vì ảnh vẽ vật đó đè lên cuộn dây |

Giữ nguyên (lồng chủ ý, điểm nhỏ nằm trên): `chien-ke/binroom` `thu-nhat`⊂`poster`, `balo` trước `giuong` (balo vẽ đè giường, giường còn lộ ~60%); `tra-sua-van-phong/serverroom` `khe-day-cap`⊂`day-cap`; `dam-cuoi-toang/tent` `man-hinh-led`⊂`san-khau`; `soundbooth` `nut-gain`⊂`ban-mixer`, `cong-usb`⊂`laptop-nhac`; `backstage` `den-guong`⊂`guong-trang-diem`; `kitchen2` `cat-banh`, `soi-vet-kem`⊂`banh-kem`; `pawnshop` `meo-than-tai`⊂`quay-cam-do`.
- Âm thanh (`ui/sfx.js`, bảng ở `docs/tham-tu-hem/WAVE3.md` mục D):
  - Hiệu ứng nạp lười sau thao tác đầu. Gõ chữ xoay vòng `type-blip/-2/-3`, âm lượng nhỏ, tối đa ~12 lần/giây.
  - Vòng lặp theo màn: mở game = mưa hẻm; bản đồ = `music-map` + mưa; văn phòng = `amb-office`; hiện trường = `music-investigate`; đang thẩm vấn = `music-interrogate`; vạch mặt = `music-finale`; kết vụ = `music-solved`. Đổi màn fade ~0,5 s.
  - Phím M hoặc nút loa = tắt hết (`wgp.muted`, chung Lụm Kèo). Nút nốt nhạc = tắt riêng nhạc (`tth.music`).
  - Tiếng bấm nút dùng `click.mp3` của game; tiếng bấm chung của `_shared/feedback.js` bị tắt bằng `data-nosfx` trên body, hiệu ứng lún nút vẫn giữ.

## 5. Cần Codex

Hiện không còn mục nào bắt buộc. Có thể làm thêm:
- (Đã sửa toạ độ, xem §4 "Sửa toạ độ điểm soi chồng nhau".) Nếu vẽ lại thì: `dam-cuoi-toang/soundbooth` `ghe-dj` ("Ghế xoay") trong ảnh đang là một vòng đèn tròn dán đè lên cuộn dây loa, không giống ghế xoay; `dam-cuoi-toang/backstage` `thung-qua` ("Đống thùng quà") đang ôm hộp quà nhỏ trên ghế, còn đống thùng chất cao thì nằm phía sau.
