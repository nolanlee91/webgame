# Thám Tử Hẻm: ghi chú dev

Hợp đồng chung (vòng chơi, dàn nhân vật, 6 vụ, định dạng vụ): `docs/tham-tu-hem/DESIGN.md`. Asset: `docs/tham-tu-hem/asset-spec.json`.
Code: `prototype/games/tham-tu-hem/` (JS module thuần, không build). Tag cache thống nhất: **`?v=t1`** cho mọi import và `<script src>`.

## 1. Kiến trúc

```
data/cases/index.js     danh mục 6 vụ (thứ tự mở khoá) — coordinator giữ
data/cases/<id>.js      dữ liệu từng vụ (agent viết vụ) — nạp ĐỘNG, thiếu file ⇒ thẻ "Sắp ra mắt"
data/asset-manifest.json  bản chép docs/tham-tu-hem/asset-manifest.json (server chỉ phục vụ prototype/)
core/validate.js        bộ kiểm vụ (tham chiếu, đi được tới cuối, lượng nội dung) + evalNeeds / wordsIn / lineOf
core/engine.js          luật một vụ: createRun, apply(c, s, action) = cửa DUY NHẤT đổi state (bản nháp + kiểm bất biến), ★, gợi ý, sanitizeRun
core/text.js            tách [[từ khoá]], RNG có hạt trong state, pickFrom (không lặp liên tiếp)
core/progress.js        hồ sơ người chơi: tên, vụ đã phá, danh tiếng, hạng, MIGRATIONS bản lưu
core/solver.js          bot giải tự động (nextAction / solve) — dùng ở test và e2e-bot
save.js                 adapter localStorage `wgp.tham-tu-hem.v1` (+ .bak-vN, .corrupt, .backup)
game.js                 nối mọi thứ: manifest → bản lưu → danh mục vụ → màn; app.act() = apply ⇒ hiệu ứng ⇒ thoại ⇒ vẽ lại
ui/dom.js               h(), icon pixel 16×16 (SVG crispEdges), toast, hộp xác nhận / lựa chọn
ui/art.js               manifest → chân dung / cảnh / toạ độ điểm soi; vẽ thay bằng canvas khi chưa có ảnh; crisp
ui/dialog.js            thoại visual novel (gõ chữ dần, bấm qua, Tua, thẻ vật chứng / lời khai trong thoại)
ui/screens.js           màn nền: mở game, bản đồ, văn phòng + bài đăng nhóm, hiện trường, vạch mặt, kết vụ
ui/panels.js            bảng phủ: thẩm vấn, sổ tay, bảng suy luận, chọn vật chứng
ui/fx.js                tem mực (MÂU THUẪN! / BỂ! / TRẬT! / VẠCH MẶT! / ĐÃ KHỚP), rung màn, kính lúp nứt
ui/sfx.js               âm thanh (mượn tạm, xem "Cần Codex")
test/                   node --test (*.test.mjs) + e2e.mjs, e2e-bot.mjs (Chrome headless qua cdp.mjs)
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
- Danh tiếng (core/progress.js): (50 + 50 × độ khó) × 60/80/100% theo ★, + 20 mỗi câu hỏi phụ đúng. Phá lại chỉ cộng phần vượt kỷ lục cũ của vụ. Hạng: tập sự 0 · hẻm 120 · phường 350 · quận 650 · Huyền thoại Hẻm 47 1000.
- Ghi kết quả khi rời màn kết vụ (câu hỏi phụ trả lời trước đó được cộng). Đóng trang ở màn kết ⇒ lần mở sau tự ghi.

### Trường tuỳ chọn engine thêm vào định dạng vụ (DESIGN §4, bộ kiểm có kiểm)

`needs` phủ định `"!x:y"`, `stmts.<id>.break.also`, `hints[].done`, `finale.steps[].hint`, `teoRescue`. Bộ kiểm cảnh báo từ khoá không bao giờ nhặt được.

### Bản lưu

- `wgp.tham-tu-hem.v1` = `{ v, name, rep, solved: {id: {stars, rep, times, last}}, runs: {id: state vụ đang dở} }`.
- `MIGRATIONS[0]` nâng bản v0 (thử nghiệm, không có `v`) lên v1. Nâng thì chép thô sang `.bak-v0` một lần. Bản hỏng chép sang `.corrupt`, không xoá.
- Tiến độ từng vụ đọc qua `sanitizeRun` (bỏ id không còn trong file vụ, kẹp số), nên người viết sửa vụ không làm vỡ bản lưu.
- **Chơi lại vụ** (khi mở vụ đang dở, hoặc nút ở màn kết): có xác nhận, chỉ xoá tiến độ dở của vụ đó. **Xoá tiến độ** (màn mở → Cách chơi): có xác nhận, cất `.backup` rồi xoá, khoá ghi tới khi tải lại.

### Giao diện

- HUD V5: khung pixel-cut (box-shadow 3px), vát, bóng cứng lệch, không bo tròn, Be Vietnam Pro, panel `#1d1a16`, chữ `#f4ead2`. Vàng chỉ cho nút chính của màn.
- Chất liệu hồ sơ: thẻ vụ / folder giấy kraft, lời khai và câu chối trên giấy ghi chú, bảng suy luận = bảng bần (dither) + ghim + dây đỏ (SVG), tem mực "ĐÃ PHÁ".
- Tem riêng của game (không chép game thương mại nào): bấm vạch ⇒ tem đỏ "MÂU THUẪN!" + rung màn, rồi "BỂ!" (đỏ) hoặc "TRẬT!" (xám, kính lúp nứt).
- Crisp (PLAYBOOK §2): cảnh 960×540 hiện với px thiết bị / px file là bội 0,5 (`crispScale`). Điện thoại: cảnh cao ~48% màn, kéo ngang. Chân dung HD 1×: bội 128 px thiết bị (ảnh đại diện nhỏ thì lọc mượt).
- Toạ độ điểm soi: `manifest.hotspots["assets/scenes/<case>/<scene>.webp"][id]` → `rect` trong vụ → tự xếp lưới.
- Chân dung: frame `<pid>-<mood>` tìm ở `portraits-<case>.webp`, rồi `portraits-cast.webp`, rồi bất kỳ sheet chân dung (khách mời vụ 6). Thiếu mood ⇒ neutral. Thiếu hết ⇒ chân dung pixel vẽ bằng canvas (màu theo người, chữ cái đầu, biểu cảm theo mood).
- Chưa có cảnh ⇒ cảnh vẽ thay (tường / sàn dither, đèn, khối đồ vật ở vị trí điểm soi đang hiện) và luôn bật nhãn điểm soi.
- Phím: Space/Enter qua thoại, N sổ tay, B bảng suy luận, Esc đóng bảng phủ.
- Móc test: `?case=__mini` thêm vụ mẫu (chỉ localhost hoặc `?dev=1`), `?fast=1` hiện chữ ngay, `window.__game`.

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
PORT=8871 node prototype/games/tham-tu-hem/test/e2e-bot.mjs <thư mục ảnh>    # mọi vụ thật qua giao diện (VIEW=mob cho điện thoại)
```

## 4. Cần Codex

### Ảnh (theo asset-spec.json; game đã đón sẵn, giao là tự dùng)

- Đợt 1: `assets/title-art.webp`, `assets/scenes/office.webp`, `assets/scenes/hem-map.webp` (+ `manifest.hotspots["assets/scenes/hem-map.webp"][<id vụ>]` cho chấm vụ), `assets/portraits-cast.webp`, chân dung + 3 cảnh của vụ 1–2.
- Đợt 2: chân dung + cảnh vụ 3–6.
- Mọi cảnh: ghi `manifest.hotspots[<file cảnh>][<id đồ vật>]` = `[x, y, w, h]`. Khi giao, chép `docs/tham-tu-hem/asset-manifest.json` sang `prototype/games/tham-tu-hem/data/asset-manifest.json` (test kiểm khớp).
- Đợt 3 (chưa đón trong code, dev làm khi có danh sách): icon vật chứng ô 96×96 `assets/clue-icons.webp`, frame = id vật chứng. Hiện vẽ thay bằng thẻ chữ cái đầu.

### Tiếng (đang MƯỢN TẠM của game khác, xem `ui/sfx.js` BORROW)

Giao vào `prototype/games/tham-tu-hem/assets/audio/<tên>.mp3` rồi thêm tên vào `AVAILABLE` trong `ui/sfx.js`:

| tên | dùng khi | đang mượn |
|---|---|---|
| `clue` | nhặt vật chứng (giấy sột soạt) | tiem-tra-sua/paper |
| `stmt` | ghi lời khai vào sổ (bút gạch) | quan-com-tam/bill-key |
| `stamp` | đóng tem mực (MÂU THUẪN!/BỂ!) | tiem-tra-sua/seal |
| `break` | nghi phạm bể lời khai (nhạc nhấn) | quan-com-tam/drama |
| `gasp` | nghi phạm hốt hoảng | quan-com-tam/voice-surprised |
| `wrong` | đưa sai | quan-com-tam/error |
| `huh` | nghi phạm cà khịa khi đưa sai | quan-com-tam/voice-annoyed |
| `solved` | bảng suy luận khớp | tiem-tra-sua/ready |
| `win` | phá án xong | quan-com-tam/shift-end |
| `rank` | lên hạng thám tử | quan-com-tam/level-up |
| `viral` | tường bình luận viral | quan-com-tam/viral |
| `hint` | Tèo gợi ý | tiem-tra-sua/voice-happy |
| `phone` | điện thoại rung (bài đăng nhóm) | quan-com-tam/voice-call |
| `door` | khách vào văn phòng | quan-com-tam/arrival |

Thêm nếu được: nhạc nền văn phòng (vòng lặp, lofi đêm hẻm), nhạc căng thẳng màn vạch mặt (vòng lặp), tiếng gõ chữ (hiện tổng hợp bằng WebAudio).
