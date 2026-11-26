# D7 · Tiệm (Cơm Tấm, Bánh Mì, Trà Sữa, Nông Trại)

Mục audit lần 2: TLC22-01 (P1), TLC12-01 (P1), TLC12-04 (P2), TLC22-03 (P2). Nhánh `claude/d7-shops`.

## TLC22-01 · Cơm Tấm đơ cuối ca

**Nguyên nhân:** tick cuối gọi `autoPay` (event `paid`) rồi `endShift` (`s.shift = null`) trong cùng một `apply`. Handler `paid` trong
`game.js` gọi `groupById(state, …)`, mà hàm này đọc `s.shift.groups` nên ném TypeError. Lỗi ném trong `frame()` trước
`requestAnimationFrame(frame)` ở cuối hàm, nên vòng lặp dừng hẳn.

**Sửa:**
- `core/tables.js`: `groupById` / `tableById` trả `null` khi `s.shift` đã null (sửa tận gốc, mọi chỗ gọi đều an toàn).
- `game.js` handler `paid`: `state.shift ? groupById(…) : null`.
- `frame()` ở cả 3 tiệm (Cơm Tấm, Bánh Mì, Trà Sữa): gọi `requestAnimationFrame(frame)` **trước**, phần việc chuyển sang `step()`
  bọc `try/catch` (`console.error`). Một lỗi ở event hay lúc vẽ không còn làm đơ game.
- Nông Trại không có vòng rAF chính (vẽ theo sự kiện / `setTimeout`), các vòng rAF nhỏ ở cảnh phụ tự hẹn lại nên không cần sửa.

**Test:** `quan-com-tam/test/endshift.test.mjs`. Ca chỉ còn 1 nhóm đang ăn, sát hết ân hạn: tick kế tiếp phát `paid` và `shiftEnded`
cùng nhịp. Chạy 20 seed, cả 20 có bảng chốt ca (`lastSummary`), `groupById` trả null, không ném lỗi. Thêm một kiểm tra mã nguồn
bảo đảm `frame()` hẹn rAF trước `step()`.

## TLC12-01 · Nông Trại: làm đúng mũi tên thì kẹt

**Sửa:**
- `data/quests.js`: NV1 "Gieo 3 hạt cà rốt", `count: 3`, đúng bằng 3 hạt tặng. NV3 "Thu hoạch 3" giờ đủ cây từ NV1.
  NV4 có gợi ý mới: bấm "Bán 1" để giữ hàng cho đơn đầu.
- `core/guide.js` (mới, thuần, không DOM): `tutorialGoal(s, t)` trả việc kế tiếp cho NV1–NV5 (`plant` / `water` / `harvest` /
  `wait` / `sell` / `deliver` / `claim`).
  - NV4 luôn là bán **1** món, ưu tiên món dư so với các đơn đang cần. Không bao giờ trỏ "Bán hết".
  - Khi không có mục tiêu (hết cây chín, kho trống, đơn thiếu hàng), hàm đi vòng: thu cây chín, rồi tưới hoặc chờ cây đang lớn
    (gợi ý "Chờ cây chín… 0:12"), rồi gieo món đơn đang thiếu vào ô trống. Mỗi lần đi vòng có `hint` riêng.
- `game.js highlight()`: dùng `tutorialGoal` cho NV1–NV5 và đổi kết quả thành nút trên màn (nút Gieo / Tưới / ô đất / hạt cần chọn /
  nút Bán / "Bán 1" trong Kho / "Bán 1" ở Khu chợ / nút Đơn / nút Giao).
  - Lúc đi vòng, dòng gợi ý đổi theo việc cần làm và thanh nhiệm vụ tự mở trên điện thoại. Nó chỉ mở một lần cho mỗi lượt đi vòng, nên
    trẻ vẫn gập lại được.
  - Nút "Bán" trong thanh công cụ giờ đặt tiêu điểm vào "Bán 1" thay vì "Bán hết".
  - NV6 trở đi giữ nhánh cũ.
- **Bản lưu cũ:**
  - `progress` được kẹp theo `count` mới, nên bản lưu đang ở NV1 1/1 sẽ thành 1/3 và chỉ cần gieo thêm 2 hạt.
  - Người đang kẹt ở NV3 (ruộng trống) hoặc NV5 (kho trống) sẽ thấy mũi tên gieo hạt ngay. Test có nạp qua `loadSave` / `dump`.

**Test:**
- `nong-trai/test/guide.test.mjs` (6 test):
  - Hồ sơ mới chỉ làm đúng việc mũi tên chỉ, 5 seed: đi hết NV1–NV5, gieo đúng 3 hạt, chỉ bán 1, đã giao đơn đầu.
  - Bản lưu cũ kẹt ở NV3 và ở NV5 đều đi tiếp được tới hết NV5.
  - NV3 lúc cây đang lớn thì mũi tên chờ, kèm đồng hồ.
  - NV4 bán món dư.
- `test/quests.test.mjs`: sửa theo NV1 = 3 hạt.
- `test/e2e.mjs`:
  - Thêm kiểm tra NV1 1/3 với mũi tên vẫn chỉ ô trống, NV3 gợi ý chờ / tưới, NV4 mũi tên ở "Bán" rồi ở "Bán 1".
  - Thêm **bot 390×844 chỉ chạm `.qhl`** (tua giờ khi mũi tên là "chờ"): xong NV1–NV5 trong 22 bước, không nhịp nào thiếu ô sáng,
    gợi ý tự mở khi đi vòng.

## TLC12-04 · Nông Trại: HUD xuống 2 hàng khi xu lớn

- `ui/short-num.js` (mới): `shortNum`, ví dụ 9.999 · 148k · 1,2tr · 999tr · 1,5 tỷ. Hàm cắt xuống, không làm tròn lên, nên 999.999.999
  hiện "999tr" chứ không thành "1 tỷ".
- HUD xu dùng `shortNum`; số đủ nằm ở `title` và `aria-label` của ô Xu ("999.999.999 xu"). Chữ XP (màn rộng) cũng rút gọn, `title`
  giữ số đủ.
- Test: `test/hud.test.mjs`. Trong e2e ở 390, đặt 999.999.999 xu: chiều cao `.stats` không tăng, ô hiện "999tr", title đủ số.

## TLC22-03 · Bánh Mì: "Thối 0k" là bẫy

- `core/shift.js giveChange`: không có tờ nào thì trả `{ err: "no-change-picked" }`. Khách luôn cần tiền thối (thối 0 đã được chốt
  trước đó), nên việc này không bao giờ tính là "thối nhầm".
- `ui/bench.js`:
  - Chưa chọn tờ thì nút thối tay bị tắt, chữ là "Chọn tờ để thối" (không còn "Thối 0k").
  - Ngày 1–3, "Thối đúng" là nút chính (`primary`) và đứng đầu hàng. Nút thối tay chỉ thành nút chính khi đã chọn vừa đủ, hoặc khi
    ở ngày ≥ 4 và đã chọn tờ.
- Phím Enter: thối tay nếu đã chọn tờ, nếu chưa thì bấm "Thối đúng".
- Test: `test/change.test.mjs` (bills rỗng / toàn 0 bị từ chối, không tính lỗi, khách vẫn chờ thối). `test/e2e.mjs` kiểm khay ở lần
  thối đầu.

## Tag cache

| Game | Trước | Sau |
|---|---|---|
| Cơm Tấm | mọi module `?v=c6` (overlays `c6f`, game.js `c7`) | mọi module `?v=c8` (cả test / tools/sim import cùng tag) |
| Bánh Mì | mọi module `?v=b8`, game.js `b9` | mọi module `?v=b10`, game.js `b10` |
| Trà Sữa | game.js `?v=m41` | game.js `?v=m42` (chỉ sửa game.js) |
| Nông Trại | một tag `m12` | một tag `m13` (`test/m5.test.mjs` kiểm) |

Asset (`asset-manifest.json?v=c6` / `b6`), font, `_shared` giữ nguyên.

`node tools/cache-tags/check-tags.mjs master`: `OK: 177 file tĩnh đổi, mọi tham chiếu ?v= tới chúng đã đổi tag.`

## Kết quả test

Unit (`node --test test/*.test.mjs`):

| Game | Kết quả |
|---|---|
| Cơm Tấm | 143/143 (gồm 2 test mới) |
| Bánh Mì | 124/124 (gồm 1 test mới) |
| Trà Sữa | 179/179 |
| Nông Trại | 182/182 (gồm 7 test mới) |

E2E (Chrome headless, server cổng 8911):

| Test | Kết quả |
|---|---|
| Nông Trại `e2e.mjs` | **178/178**, có bot chỉ chạm `.qhl` và HUD 999.999.999 xu |
| Nông Trại `e2e-cards.mjs` | 44/44 |
| Nông Trại `e2e-m4.mjs` | ALL PASS |
| Trà Sữa `e2e.mjs` | 158/158 |
| Trà Sữa `e2e-layout.mjs` | 15/15 |
| Cơm Tấm `e2e.mjs` lần 1 | 197 PASS, 2 FAIL |
| Cơm Tấm `e2e.mjs` lần 2 | dừng sớm ở m5v: không thấy `#introGo`, `ov: "prep"` |
| Bánh Mì `e2e.mjs` lần 1 | 60 PASS, có kiểm tra TLC22-03; phần mobile dừng vì không thấy `#shopName` |
| Bánh Mì `e2e.mjs` lần 2 | dừng ở mobile: không thấy `.pcard`, `ov: "prep"` |

Chi tiết các lần chập chờn:
- Cơm Tấm lần 1: hai FAIL đều ở `e2e-m5v` phần "dĩa HD" (không có phiếu để bày). Bảng chốt ca hiện đủ ở cả 3 ca, 0 lỗi console.
- Bánh Mì: hai lần dừng ở hai chỗ khác nhau. Trong một lần, kiểm tra lớp ổ bánh FAIL.
- **Đối chứng:** chạy `e2e.mjs` của Bánh Mì trên master hiện tại (cổng 8912) cũng dừng giữa chừng: không thấy `[data-spread="pate"]`.
- Kết luận: chập chờn do máy đang chạy nhiều agent, không phải do nhánh này. Ba chỗ dừng khác nhau, đều là lỗi chờ nạp trang hoặc
  `Storage.clearDataForOrigin` chưa xoá kịp (`ov: "prep"` thay vì màn chào).
- Theo luật, mỗi bộ chỉ chạy lại 1 lần. Nên chạy lại hai bộ này lúc máy rảnh.

`quan-com-tam/tools/sim/sim.test.mjs` (không thuộc `npm test`) bị `timeout 300` cắt khi máy bận, nên chưa có kết quả.

## Còn mở

- Cơm Tấm `frame()` nuốt lỗi bằng `console.error`. Một lỗi lặp lại mỗi khung sẽ làm đầy console nhưng game vẫn chạy. Chưa gửi lỗi
  về đâu cả.
- NV1 nay cần 3 hạt. Ai đã nhận thưởng NV1 với 1 hạt thì không bị ảnh hưởng. Ai đang ở NV1 1/1 mà chưa nhận thì phải gieo thêm 2 hạt
  (mũi tên chỉ sẵn).
- Bánh Mì từ ngày 4 (thối tay): nút thối tay tắt tới khi chọn tờ. Nếu muốn nút nổi bật thì cần quyết định có thêm gợi ý tờ hay không
  (hiện chỉ có hộp đếm tiền).
