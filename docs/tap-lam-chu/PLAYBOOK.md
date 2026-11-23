# Playbook: game "Tập Làm Chủ" (tiệm, quán)

Áp dụng cho mọi game quản lý cửa hàng của Lụm Kèo. Rút ra từ Nông Trại 2.0 và Tiệm Trà Sữa (tháng 11/2026).
Game kế tiếp: **Tiệm Bánh Mì** (`tiem-banh-mi`), **Quán Cơm Tấm** (`quan-com-tam`).

Người đọc:
- **Codex** (vẽ asset): đọc §1 và §2.
- **Claude / agent dev** (code): đọc toàn bộ, nhất là §3–§7.
- **Chủ dự án**: §0, §6, §8.

Tài liệu tham khảo gốc:
- Trà Sữa: `docs/tiem-tra-sua/` (GAME-DESIGN, ECONOMY, DRAMA, DEV-NOTES, asset-manifest.json).
- Nông Trại: `prototype/games/nong-trai/DESIGN-2.0.md`.

---

## 0. Ba điều quan trọng nhất

1. **Cái hay của thể loại này là drama, pha nhầm và review**, không phải bấm nút pha chế. Mỗi cơ chế mới (đơn nhiều phần, bàn đôi, nhà cung cấp, quảng bá…) phải đi kèm kịch bản, câu thoại và review riêng, với số lượng lớn (§5).
2. **Asset phải vẽ đúng chuẩn độ phân giải ngay từ đầu** (§1). Code không thêm được chi tiết. Lỗi "mờ" ở Trà Sữa mất nhiều vòng sửa vì nhân vật vẽ nhỏ hơn tỉ lệ cảnh, nên phải phóng to.
3. **Push lên master là lên bản thật** (Railway tự deploy). Chỉ push khi chủ dự án đồng ý. Không bao giờ làm mất bản lưu của người chơi (§4).

---

## 1. Chuẩn asset (cho Codex)

### 1.1 Lưới điểm ảnh

- Mọi tranh vẽ trên **lưới 2×**: 1 điểm vẽ = ô 2×2 px trong file. WebP lossless, alpha cứng (không bán trong suốt).
- Cả bộ dùng **cùng một mật độ điểm vẽ**: cảnh, nhân vật, máy móc. Không vẽ nhân vật thô hơn cảnh.
- Kiểm nhanh: thu file ½ rồi phóng lại ×2 theo nearest, phải ra y hệt bản gốc.

### 1.2 Kích thước chuẩn

| Loại | Ô (px file) | Anchor | Ghi chú |
|---|---|---|---|
| Cảnh tiệm | 1280×720 | — | Kèm 1 lớp che quầy (foreground) cùng cỡ. |
| Nhân vật trong cảnh (khách, chủ tiệm) | **144×192** | [72,174] | Đúng tỉ lệ người đứng trong cảnh 1280×720. Ô 96×128 là quá nhỏ: Trà Sữa phải phóng ×1,5 nên bị thô. |
| Cận cảnh: thân trên chủ tiệm ở quầy, món ăn/ly lớn | Vẽ **lưới 1×** (chi tiết thật), ví dụ 256×256 / 320×384 | đáy giữa | Vùng này hiển thị to, lưới 2× sẽ vỡ ô. |
| Chân dung hội thoại | 384×320, lưới 1× | [192,308] | Mỗi vai đủ biểu cảm: waiting, happy, sheepish, annoyed, surprised. |
| Máy, đồ trên quầy | Theo vật, lưới 2× | Điểm chạm mặt bàn | **Kèm toạ độ đặt trên cảnh** (§1.4). |
| Icon UI | 48×48 | [24,42] | Có sẵn sound-on/off, pause, help, coin, star, follower. |
| Thẻ Nhật Ký (chia sẻ) | 1080×1350 | — | Chừa vùng chữ đầu thẻ và vùng chữ dưới. |

### 1.2b Cảnh và nhân vật cùng một thước (bài học Tiệm Bánh Mì)

- Cỡ ô nhân vật **không cố định giữa các game**. Nó tuỳ cảnh vẽ gần hay xa.
  - Trà Sữa vẽ xa nên người cao khoảng 168 px.
  - Bánh Mì vẽ cận: cửa khoảng 330 px, quầy khoảng 150 px, nên người phải khoảng 260 px.
- **Chốt thước khi duyệt concept cảnh, trước khi vẽ nhân vật.** Lấy cửa (2,1 m) hoặc mặt quầy (khoảng 1 m) để quy ra số px của người 1,65 m đứng ở hàng chờ.
- Ghi số đó vào `manifest.sceneScale["<file cảnh>"].humanHeight`. Asset-spec bật `"checkSceneScale": true` với danh sách `"scenes"`. Script kiểm báo lỗi nếu chiều cao nhân vật lệch quá 10%.
- Không phóng to nhân vật cũ cho khớp. Phải vẽ lại ở ô mới, cùng độ mịn lưới 2×.
- **Đồ vật cũng cùng thước** (bài học Quán Cơm Tấm): nồi cơm, ly trà, hũ, máy móc vẽ theo cỡ thật so với người (ví dụ nồi cơm cao khoảng 1/5 người, khoảng 55 px khi người 260 px), không vẽ to kín ô 192. Cơm Tấm đợt 1 vẽ to gấp đôi nên code phải thu ×0,5. Người vẽ soi bằng ảnh ghép đồ đặt cạnh người mẫu trên cảnh.

### 1.3 Nhất quán nhân vật

- Mỗi vai (VIP, reviewer, shipper, hàng xóm, dân văn phòng, học sinh, khách quen…) là **cùng một người** trên mọi sheet: đi, chờ, phản ứng, gọi món, chân dung, biểu cảm.
- Trà Sữa từng bị VIP và reviewer đổi người giữa các sheet. Lần sau Codex tự kiểm trước khi giao.
- Mọi frame trong cùng sheet đúng một tỉ lệ (Trà Sữa có `vip-order-1` vẽ nhỏ hơn).

### 1.4 Manifest

`docs/<game>/asset-manifest.json` ghi cho mỗi sheet: `filename`, `dimensions`, `frames{name:{rect,anchor}}`, `animations{name:{frames,fps,loop}}`.

- Thêm khoá **`placements`** cho đồ đặt trên cảnh, ví dụ `"topping-stove": {"at":[452,270],"surface":"back-counter"}`. Lý do: ở Trà Sữa, dev phải đoán toạ độ và đặt nồi lơ lửng ngoài mép bàn.
- Đường đi của khách cũng ghi luôn: `door`, `queueSpots`, `exitPath`.
- Đặt tên frame theo mẫu `{vai}-{hành-động}-{số}`. Dev viết code tự nhận frame mới theo tên (§3.4), nên sai tên là game không dùng.

### 1.5 Hợp đồng + kiểm tự động (chống vẽ lại nhiều lần)

1. **Dev viết `docs/<game>/asset-spec.json` trước khi Codex vẽ**, mẫu là `docs/tiem-tra-sua/asset-spec.json`. Nội dung gồm sheet, cỡ ô, lưới, anchor, tên frame (cú pháp `{a,b}-walk-{1..4}`), chiều cao nhân vật, clip, `placements`, `paths`.
2. **Codex chạy** `python -I tools/asset-check/check_assets.py docs/<game>/asset-spec.json --preview <tmp>` và chỉ giao khi ra **0 lỗi**.
   - Script bắt: sai lưới, alpha mờ, thiếu frame, sai ô hoặc anchor, chân lệch anchor, nhân vật cao lệch giữa các frame cùng vai, clip hỏng, thiếu toạ độ đặt.
   - Trên asset Trà Sữa cũ, script tự bắt được lỗi `vip-order-1` / `vip-impatient` vẽ nhỏ 16–20%.
3. Codex mở ảnh soi `nhan-vat-xep-hang-x2.png` để kiểm bằng mắt hai việc máy không đo được: tỉ lệ so với cảnh, và mỗi vai giữ cùng một người.
4. `AGENTS.md` ở gốc repo ghi các luật này. Codex tự đọc file đó mỗi phiên.

### 1.6 Danh sách asset tối thiểu cho một tiệm

Cảnh + foreground, tranh màn chào, nhân vật 6–8 vai (đi 4 khung, chờ, vui, sốt ruột, gọi món 2 khung, ngạc nhiên 2 khung), chủ tiệm (đứng, thao tác 4 khung, giao 4 khung), cận cảnh chủ tiệm, các lớp món ăn theo từng bước chế biến, máy móc kèm hoạt cảnh đang chạy, đồ trang trí, nguyên liệu (icon), icon UI, khung thẻ Nhật Ký, chân dung + biểu cảm mọi vai, cảnh phụ cho sự kiện (mưa, cúp điện…).

---

## 2. Quy tắc hiển thị pixel (Codex nên biết, dev bắt buộc)

Hệ số hiển thị = (px màn hình thiết bị) / (px file) = `k · devicePixelRatio`.

| Hệ số | Kết quả |
|---|---|
| Bội của 0,5 (0,5 / 1 / 1,5 / 2…) | Ô 2×2 phủ số nguyên px, **nét đều**. |
| Giữa 0,5 và 1, số lẻ | Pixel cứng còn nét nhưng ô to nhỏ không đều. |
| < 0,5 | Rơi điểm ⇒ dùng lọc mượt (`image-rendering:auto`). |
| Số lẻ như 0,95 / 1,425 / 0,42 cho hình lớn | **Nhòe**. Cấm. |

Các quy tắc đã cài trong `prototype/games/tiem-tra-sua/render/atlas.js` và `render/scene.js`; game mới chép lại:

- Camera cảnh: phóng lên bội 0,5 gần nhất nếu chỉ phải cắt mép ≤ 25% (`layout()` trong scene.js). Gốc toạ độ làm tròn theo px thiết bị.
- Sprite cỡ gốc đặt đúng lưới 2 px của cảnh (`placeAt` snap). Lệch 1 px sẽ "không đồng bộ nét với khung hình".
- `crisp(s)` làm tròn hệ số cho hình lớn: chân dung, cận cảnh, nền quầy pha.
- **Không** dùng `object-fit: cover` co nhỏ tranh. Tự tính cỡ phủ khung theo bội 0,5 (màn chào Trà Sữa).
- `charScale(f)`: chiều cao nhân vật mục tiêu 192 px cảnh. Ô cũ 128 thì ×1,5; ô mới 192 thì ×1, tự nét khi Codex giao bản lớn.
- Luôn test ở **1366×768, phóng 125% (dpr 1,25)**, cấu hình laptop phổ biến và là nơi lộ lỗi mờ. Kèm 1920×1080 dpr 1 và mobile 390×844 dpr 3.

---

## 3. Kiến trúc code (chép từ Trà Sữa)

JS module thuần, không build, không thư viện. Game ở `prototype/games/<id>/`.

```
data/    bảng số liệu + thoại (lines*.js, events.js, missions.js…) + asset-manifest.json (bản chép từ docs, test kiểm khớp)
core/    luật thuần, không DOM, chạy được bằng node
         apply.js  cửa duy nhất đổi state: chạy trên bản nháp, kiểm bất biến, lỗi thì không đổi gì
         shift.js, score.js, economy.js, progression.js, drama.js, reviews.js, state.js (tạo/đọc/kẹp/MIGRATIONS), rng.js (RNG có hạt lưu trong state), text.js (fill, freshLine)
render/  atlas.js (manifest → frame, paint theo anchor, crisp), scene.js (cảnh + camera), món ăn cận cảnh
ui/      các màn: HUD, phiếu, quầy, chuẩn bị ca, hội thoại, chốt ca, Sổ, Nhật Ký
save.js  adapter localStorage
test/    *.test.mjs (node --test) + e2e.mjs (Chrome headless qua CDP, cdp.mjs)
```

### 3.1 Cache trình duyệt

- Server trả file tĩnh `max-age=300`. **Mọi** import phải mang cùng một tag `?v=<mốc>` (ví dụ `?v=m35`), kể cả `<script src>` trong index.html.
- Đổi tag ở **mọi chỗ cùng lúc** mỗi lần deploy có đổi API giữa các module. Tag lệch nhau thì một module có thể bị nạp thành hai bản: lỗi ngầm hoặc mất trạng thái.

### 3.2 Bản lưu

- Khoá `wgp.<game>.v1`. State có trường `v`, kèm `MIGRATIONS` từng bước.
- Nâng phiên bản thì chép bản cũ một lần sang `…bak-vN`. Bản hỏng chép sang `….corrupt`, không xoá.
- Nút **Chơi lại từ đầu** (trong Cách chơi và Tạm dừng): hỏi xác nhận, rồi cất bản hiện tại sang `….backup` rồi mới xoá. Khi đang chơi lại, tắt ghi để `pagehide` không ghi đè.
- Kẹp mọi số khi đọc bản lưu (tiền, cấp, kho…). Test migration bằng bản lưu thật của phiên bản trước.

### 3.3 Thoại không lặp

- Mọi pool câu chọn bằng `freshLine(state, list, ctx)`: nhớ 40 câu gần nhất trong ca, ưu tiên câu chưa dùng.
- Chọn ngẫu nhiên thường (`pickLine`) chỉ dùng cho pool ≥ 30 câu.
- Câu có biến `{self} {call} {drink} {sugar} {ice}…` theo xưng hô từng nhóm khách. Viết hoa đầu bằng `{Call}`.

### 3.4 Code đón asset tương lai

Khi thiếu frame, dùng dự phòng. Khi manifest có frame đúng tên thì tự dùng, không cần sửa code. Liệt kê tên frame đang chờ trong DEV-NOTES "Cần Codex".

### 3.5 Hook cho test

`?seed=N` (RNG cố định), `?calm=1` (tắt sự kiện tự động), `?event=ID` (ép sự kiện), `window.__game` (state, forceEvent, sceneToClient).

---

## 4. Quy trình làm việc

1. **M0 (thiết kế + art):** GAME-DESIGN, ECONOMY, DRAMA, SCREENS, ART-DIRECTION.
   - Codex vẽ concept, rồi sheet theo §1.
   - Chủ dự án duyệt trước khi code.
2. **M1:** kiến trúc + cảnh. **M2:** một ca chơi trọn. **M3:** kinh tế, 20 cấp, nâng cấp, trang trí và **nội dung cho từng cơ chế**. **M4:** drama, review, Nhật Ký. **M5:** hoạt ảnh, mobile, cân bằng, polish.
3. **Song song:** chia vùng file rõ ràng giữa các agent (ví dụ agent A: data/ core/; agent B: render/ index.html), báo ranh giới qua tin nhắn.
   - Game mới làm trong git worktree riêng (`.claude/worktrees/<id>`, branch `claude/<id>`).
   - Merge master trước khi commit cuối.
4. **Kiểm trước khi push:**
   - Commit, rồi checkout vào cây sạch (git worktree riêng, ví dụ `../wt-check`) (detached).
   - Chạy unit, sim và e2e trên server riêng.
   - Xem ảnh chụp desktop 1366 (dpr 1,25) và mobile 390.
   - `git fetch` trước, vì Codex push song song.
5. **Push = production.** Chờ chủ dự án nói "push". Kiểm production phục vụ đúng tag mới (curl file có `?v=`).
6. **Quyền riêng tư:** không commit đường dẫn máy, tên tài khoản Windows, email. Chạy grep `C:\\Users|AppData|@gmail` trên diff trước khi commit.
7. Commit message tiếng Việt, kết thúc bằng dòng `Co-Authored-By` theo quy định phiên làm việc.

---

## 5. Khối lượng nội dung (mục tiêu tối thiểu)

Trà Sữa sau M4 có 45 sự kiện drama, 387 câu pha nhầm, 184 câu review theo sao. Đó là **mức sàn** cho game sau.

| Nhóm | Mục tiêu |
|---|---|
| Câu gọi món | 16+ câu chung + 4–5 câu mỗi nhóm khách (6–8 nhóm). |
| Sự kiện drama | 40+: ~60% trong ca (dừng đồng hồ), ~40% giữa hai ca. ≥ 1/3 nhiều bước, ≥ 1/3 có hẹn quay lại ngày sau, vài lựa chọn hên xui. |
| Kiểu lỗi | 8+ kiểu đặc thù món của tiệm, mỗi kiểu 6–10 câu khách nói + 6–10 câu review, có biến thể theo nhóm khách. |
| Review theo sao | 8–12 câu mỗi mức sao (1–5) mỗi nhóm khách, giọng mạng xã hội, có hashtag, không emoji. |
| Cơ chế M3 (đơn nhiều phần, bàn đôi/ba, nhiệm vụ, nhà cung cấp 2, quảng bá, gói ký gửi, trang trí) | **Mỗi cơ chế** có: sự kiện drama riêng, câu khách, review riêng theo kết quả (đúng hết, sai một phần, tráo, trễ…), khoảnh khắc Nhật Ký. |
| Lỗi lên mạng | 5+ sự kiện "reviewer quay clip lỗi". Người chơi chọn biến thành trend hoặc xin lỗi. |
| Nhật Ký | Câu chốt ca kiểu caption meme theo dữ kiện ca, thẻ ảnh lưu / chia sẻ được. |

Giọng văn:
- Hài đời thường Việt Nam, châm chọc tình huống, tử tế với nhân vật, không đá xoáy nhóm yếu thế.
- Không thương hiệu hay người thật.
- Mỗi lựa chọn trong sự kiện hiện **chi phí trước, hậu quả ngay sau** (tiền, sao, người theo dõi, độ hot, khách ca sau) và lưu một khoảnh khắc.

Gợi ý theo game:
- **Tiệm Bánh Mì:**
  - Lỗi: quên pate, nướng cháy, ớt quá tay, nhầm "không hành", bánh nguội, gói sai túi, thối nhầm tiền lẻ.
  - Drama: giờ cao điểm học sinh, shipper gom 20 ổ, khách Tây hỏi "phở có không", bánh mì trend topping lạ, xe đẩy bên kia đường giảm giá.
- **Quán Cơm Tấm:**
  - Lỗi: sườn khét, thiếu mỡ hành, chả trứng vỡ, nhầm "thêm cơm", nước mắm quá ngọt, quên canh.
  - Drama: dân công trường ăn khuya, khách quen ghi nợ, mất gas giữa trưa, food reviewer, đặt 30 hộp cho công ty, mưa ngập hẻm.

---

## 6. Cân bằng

- Dùng **bộ mô phỏng** như Nông Trại (`prototype/games/nong-trai/tools/sim/`): 3 kiểu người chơi (chăm / thỉnh thoảng / ngày 2 lần), mục tiêu thời gian lên cấp, xu theo ngày, báo cáo `report.md`, test hồi quy cân bằng.
- Mục tiêu tham khảo: cấp 4 ≈ 10 phút, cấp 7 ≈ 40 phút, cấp 10 ≈ 2 giờ, cấp 20 ≈ 10–12 giờ chơi.
- Luôn có chỗ tiêu tiền cuối game (bậc nâng cấp danh tiếng, đồ đắt). Nông Trại M4 từng dư 920k xu ở ngày 7.
- Không bao giờ để người chơi kẹt: gói ký gửi hoặc vốn cứu trợ khi tiền + hàng không đủ làm một món.
- Nhiệm vụ hướng dẫn phải tính cả việc người chơi đã làm trước. Nông Trại từng kẹt ở bước "mở ô đất" vì vậy.

---

## 7. Lỗi đã gặp: đừng lặp lại

| Lỗi | Nguyên nhân | Cách đúng |
|---|---|---|
| Nhân vật bé so với cảnh (Bánh Mì: 155 px trong cảnh cần 260 px) | Hợp đồng chép cỡ ô của game trước, script chỉ so nhân vật với nhau | `sceneScale.humanHeight` + `checkSceneScale` (§1.2b). |
| Nhân vật mờ, không đồng bộ nét với cảnh | Ô 96×128 nhỏ hơn tỉ lệ cảnh, phải phóng ×1,5; sprite đặt lệch lưới 2 px | Vẽ ô 144×192 (§1.2); snap lưới (§2). |
| Chủ tiệm ở quầy pha mờ | Sheet lưới 2× bị phóng ~3 lần, hệ số lẻ 1,425 | Vẽ cận cảnh lưới 1×; hệ số qua `crisp`. |
| Màn chào mờ | `object-fit: cover` co tranh 1280×720 còn 0,6 | Tự tính cỡ phủ khung theo bội 0,5. |
| Thu nhỏ mượt làm mờ thêm | Lọc mượt khi hệ số < 1 | Chỉ lọc mượt khi < 0,5. |
| Đồ đặt lơ lửng ngoài mép bàn | Không có toạ độ đặt từ người vẽ | `placements` trong manifest (§1.4). |
| Thoại lặp: 5 khách mà 2 câu trùng | Pool 4–5 câu + chọn ngẫu nhiên | Pool lớn + `freshLine` (§3.3). |
| Không chơi lại được | Thiếu nút | Nút Chơi lại có xác nhận + backup (§3.2). |
| Trình duyệt trộn module cũ/mới | Chỉ game.js có tag `?v=` | Một tag cho mọi import (§3.1). |
| Icon to ra 25%, e2e bấm trượt nút | Làm tròn cỡ cho mọi icon ở dpr 1 | Chỉ `crisp` cho hình ≥ 96 px. |
| Patch hỏng vì CRLF | File dùng CRLF | Chuẩn hoá `\n` khi sửa bằng script, rồi trả CRLF. |
| Push bị từ chối | Codex push song song | `git fetch` / `pull --rebase` trước khi push. |

---

## 8. Checklist khởi động game mới

- [ ] Tạo `docs/<id>/`: GAME-DESIGN, ECONOMY, DRAMA (≥ 40 sự kiện phác thảo), SCREENS, ART-DIRECTION, ASSET-HANDOFF, asset-manifest.json.
- [ ] Viết `docs/<id>/asset-spec.json` (chép mẫu Trà Sữa, đổi tên vai, món, máy, placements).
- [ ] Nhắn Codex: "đọc AGENTS.md và docs/<id>/asset-spec.json, vẽ theo hợp đồng, chạy check_assets đến 0 lỗi rồi giao". Kèm thumbnail đã duyệt (`prototype/homepage/assets/thumbs/<id>.webp`) làm mẫu.
- [ ] Dev tự chạy lại check_assets khi nhận asset, rồi xem ảnh soi và cảnh ghép trong game ở 1366@1,25.
- [ ] Tạo worktree `.claude/worktrees/<id>`, branch `claude/<id>`. Chép khung `render/atlas.js`, `render/scene.js` (camera + snap + charScale), `core/text.js` (freshLine), `save.js` (backup + chơi lại), `test/cdp.mjs`.
- [ ] M1–M5 theo §4. Mỗi milestone: unit + e2e + ảnh 1366@1,25 và 390, rồi báo chủ dự án, chờ lệnh push.
- [ ] Thẻ homepage `prototype/homepage/games.js`: thêm `url`, `mode`, `players`, `badge: "Mới"` khi lên bản chơi.
