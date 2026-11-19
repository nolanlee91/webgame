# Nông Trại 2.0 — Thiết kế Milestone 0 (chờ chủ dự án duyệt)

> Trạng thái: **bản thiết kế, chưa triển khai**. Code hiện tại chưa bị đổi. Sau khi duyệt thiết kế + Art Direction (prototype 3 khu) mới làm Milestone 1.
> Người đọc: chủ dự án (duyệt) và Codex (tạo asset). Mọi con số kinh tế là **bản đầu để cân bằng**, sẽ chỉnh sau khi chơi thử.

---

## 0. Audit game hiện tại (18/11/2026)

Kiến trúc: JS thuần ES module, không build, không backend riêng cho Nông Trại (server.js chỉ phục vụ file tĩnh). Lưu bằng `localStorage` (`wgp.nongtrai.v2`). Không có tài khoản người dùng trên site.

| Hạng mục | Tình trạng | Ghi chú |
|---|---|---|
| Trồng / tưới / thu hoạch | **Có, chạy tốt** | `logic.js` thuần, thời gian tuyệt đối (`plantAt/readyAt`) ⇒ cây lớn cả khi tắt trang. Tưới: còn lại ×0,7, mỗi cây 1 lần. |
| 5 loại cây, cấp mở khoá | **Có** | Cà rốt 30 s · Cà chua 1 ph · Dâu 1 ph 30 · Ngô 3 ph · Bí ngô 5 ph. Atlas 5 giai đoạn (`assets/garden/crops.webp`). |
| Kho + bán | **Có, đơn giản** | Kho không giới hạn, bán 1 loại hoặc bán hết, giá cố định. |
| Mở đất | **Có** | Lưới 5×5, mở sẵn 3×3, ô kề mới mua được, giá ×1,35 mỗi ô. |
| XP / cấp | **Có** | `xpNeed = 10·lv^1,5`; cấp chỉ mở cây (tối đa cấp 4 là hết nội dung). |
| Nâng cấp trang trí | **Có, mỏng** | 2 mốc (bồn hoa, vườn hoa), chỉ đổi cảnh. |
| Đơn hàng | **Đã code, chưa commit (Codex)** | 2 ô đơn, 7 công thức nông sản thô, thưởng = giá trị +20 % xu + XP, kiểm `revision` chống giao trùng. Tốt — giữ làm nền cho Bảng đơn. |
| Offline / lưu | **Có** | Kẹp số khi đọc, chống `readyAt` vô lý, `navigator.locks` chống 2 tab ghi đè. |
| Nghệ thuật | **Có bộ V5 đẹp cho màn 1** | Nhà, sạp, cây, ao, hoa, hàng rào, đất khô/ướt, đường đá (`assets/garden/`). Chưa có: công trình khác, nội thất, NPC, vật nuôi, icon thành phẩm. |
| Xưởng, chợ riêng, chăn nuôi, nhà kho có sức chứa, làng / NPC / nhiệm vụ, xây dựng có trạng thái | **Chưa có** | Xây mới. |
| Test | Có `test/logic.test.mjs` (logic thuần). Chưa có e2e trình duyệt cho Nông Trại. |

**Vấn đề chính của bản hiện tại:** sau ~15 phút người chơi đã mở hết cây và không còn quyết định nào ngoài "trồng cây đắt nhất". Không có chuỗi sản xuất, không có lý do giữ hàng, cấp không mở gì sau cấp 4.

**Giữ lại:** toàn bộ `logic.js` (trồng/tưới/thu/mở đất/lưu), atlas cây, cảnh màn 1, hệ đơn hàng của Codex (mở rộng thành Bảng đơn), pattern `mutate()+persist()` và khoá `navigator.locks`.

---

## 1. Thế giới — 8 khu vực

Một trang duy nhất (`/games/nong-trai/`), **Nông trại chính là bản đồ trung tâm**. Mỗi công trình đã xây hiện **trực tiếp trên bản đồ**; chạm công trình ⇒ chuyển cảnh sang khu đó (trượt ngang + tiếng cửa). Có thanh điều hướng dự phòng (8 biểu tượng nhỏ, khu chưa mở hiện ổ khoá + cấp cần). Không có nhân vật đi lại ở bản đầu.

| # | Khu | Cách vào | Bố cục riêng (không dùng chung 1 kiểu thẻ) |
|---|---|---|---|
| 1 | **Nông trại chính** | Màn mặc định | Bản đồ 3/4 từ trên xuống: ruộng ở giữa, công trình quanh rìa theo "lô đất xây dựng" cố định. Bản đồ thay đổi theo cấp (xem §3). |
| 2 | **Xưởng chế biến** | Chạm nhà xưởng | Nội thất gỗ: các **máy** đứng dọc tường, mỗi máy có khay hàng chờ (ô vuông dưới máy) + đồng hồ; bảng công thức trượt lên khi chạm máy. |
| 3 | **Khu chợ** | Chạm sạp chợ / cổng làng | Phố chợ: Cô Hai đứng sau quầy (bong bóng thoại), 2 kệ: "Bán" (kéo hàng từ giỏ) và "Mua" (hạt giống, vật tư, trang trí). Bảng giá hôm nay có mũi tên ↑↓. |
| 4 | **Bảng đơn hàng** | Chạm bảng gỗ cạnh cổng | Tấm bảng gỗ ghim 3–6 phiếu đơn giấy (mỗi phiếu có chân dung NPC đặt). Giao xong: xe giao hàng của Anh Út chạy vào nhận. |
| 5 | **Khu chăn nuôi** | Chạm chuồng gà / chuồng bò | Sân cỏ có hàng rào, gà/bò đi lững thững tại chỗ (2–4 khung). Chạm con vật: cho ăn / thu sản phẩm (bong bóng trứng/sữa nổi trên đầu). |
| 6 | **Nhà kho** | Chạm nhà kho | Kệ gỗ nhiều tầng theo nhóm (Nông sản · Chăn nuôi · Thành phẩm · Vật liệu · Đặc biệt). Thanh sức chứa trên cửa. Chạm vật phẩm: nguồn gốc + dùng để làm gì + nút "Bán nhanh". |
| 7 | **Làng & nhiệm vụ** | Chạm biển "Làng" ở đường đất | Con đường làng ngang màn hình với 4 nhà NPC; chạm NPC mở thoại ngắn + nhiệm vụ của họ. Sổ nhiệm vụ nhỏ góc phải ở mọi màn. |
| 8 | **Xây dựng & nâng cấp** | Nút "Xây" (cái búa) trên HUD | Chế độ bản đồ: các lô trống hiện khung bản vẽ xanh, chạm lô ⇒ danh sách công trình có thể xây ở lô đó; công trình đã xây hiện mũi tên nâng cấp. |

HUD chung (mọi khu): tên nông trại · xu · cấp + thanh XP · nút kho · sổ nhiệm vụ (1 nhiệm vụ đang theo dõi) · chuông thông báo (máy xong, vật nuôi có trứng, đơn mới). Điện thoại: HUD 1 hàng trên, điều hướng thành thanh đáy 5 nút + "Thêm".

---

## 2. Kinh tế liên kết

### 2.1 Nguyên tắc
- **Giá trị cộng dồn theo thời gian:** mỗi bước chế biến tăng giá trị **1,25–1,45×** so với bán thô nhưng tốn thời gian máy ⇒ luôn có lựa chọn "bán ngay hay chế biến".
- **Đơn hàng trả cao hơn chợ 15–35 %** (đơn thường thấp, đơn kết hợp/đặc biệt cao) nhưng đòi đúng món ⇒ lý do **giữ hàng**.
- **Không vòng lặp vô hạn:** chợ chỉ **bán ra** hạt giống, thức ăn gia súc dự phòng, vật tư, trang trí. Giá mua vào của mọi món ≥ 1,6× giá bán lại; không có món nào mua ở chợ rồi bán lại có lời. (Có test kiểm tự động.)
- **Biến động giá nhẹ:** giá bán nông sản/thành phẩm dao động **±15 %** theo chu kỳ 3 giờ, tính tất định từ thời gian (không random giấu). Bảng giá hiển thị ↑↓ và "đổi giá sau 1:24:10". Đơn hàng không bị ảnh hưởng.
- **Lưới an toàn:** nếu xu < giá hạt rẻ nhất, không cây nào đang trồng và kho không có gì bán được ⇒ Chị Ba tặng 3 hạt cà rốt (tối đa 1 lần/10 phút). Kho đầy **không chặn thu hoạch** — hàng vượt vào "giỏ tràn" (tối đa 10 món) và có nút bán nhanh.

### 2.2 Cây trồng (giữ 5 cây cũ, thêm 2)
| Cây | Cấp | Hạt | Thời gian | Bán | XP | Dùng cho |
|---|---|---|---|---|---|---|
| Cà rốt | 1 | 2 | 30 s | 6 | 2 | Nước ép, đơn |
| Cà chua | 1 | 5 | 1 ph | 12 | 4 | Sốt cà chua |
| Dâu tây | 2 | 8 | 1 ph 30 | 18 | 6 | Mứt dâu |
| Ngô | 3 | 12 | 3 ph | 29 | 10 | Bắp rang, **thức ăn gia súc** |
| Bí ngô | 4 | 20 | 5 ph | 47 | 16 | Bánh bí ngô |
| Lúa | 6 | 10 | 4 ph | 26 | 12 | Bột gạo |
| Mía | 10 (nhà kính) | 24 | 8 ph | 58 | 20 | Đường |

### 2.3 Máy & công thức (Xưởng)
| Máy | Mở | Công thức | Nguyên liệu | Thời gian | Bán | XP |
|---|---|---|---|---|---|---|
| Bếp sên | Cấp 4 | Mứt dâu | 3 dâu | 2 ph | 74 | 8 |
| | | Sốt cà chua | 3 cà chua | 1 ph 30 | 48 | 6 |
| | | Nước ép cà rốt | 4 cà rốt | 1 ph | 32 | 4 |
| Cối xay | Cấp 5 | Thức ăn gia súc ×3 | 2 ngô | 1 ph | (19/bao) | 4 |
| | | Bột gạo | 2 lúa | 2 ph | 70 | 7 |
| Lò bánh | Cấp 8 | Bắp rang | 2 ngô | 1 ph 30 | 78 | 7 |
| | | Bánh trứng | 2 trứng + 1 bột gạo | 4 ph | 160 | 14 |
| | | Bánh bí ngô | 1 bí + 1 bột gạo + 1 trứng | 5 ph | 190 | 16 |
| Máy bơ sữa | Cấp 12 | Bơ | 2 sữa | 3 ph | 150 | 12 |
| | | Phô mai | 3 sữa | 6 ph | 240 | 20 |
| Nồi đường (nhà kính) | Cấp 13 | Đường | 2 mía | 3 ph | 150 | 12 |
| Lò bánh cấp 2 | Cấp 16 | Bánh flan | 2 trứng + 1 sữa + 1 đường | 6 ph | 330 | 26 |

Mỗi máy: **hàng chờ 2 ô** lúc xây, nâng cấp máy +1 ô (tối đa 4). Sản xuất tuần tự (ô 1 xong mới chạy ô 2), tiếp tục khi offline. Nguyên liệu **bị trừ lúc bấm "Bắt đầu"** (không phải lúc chọn), thành phẩm vào kho khi người chơi chạm "Nhận" — mỗi ô có `id` riêng, nhận xong xoá ô ⇒ không nhận 2 lần.

### 2.4 Chăn nuôi
| Vật nuôi | Mở | Giá mua | Ăn | Chu kỳ | Sản phẩm | Bán |
|---|---|---|---|---|---|---|
| Gà (tối đa 6) | Cấp 7, chuồng gà | 60 | 1 thức ăn | 4 ph | 1 trứng | 26 |
| Bò (tối đa 4) | Cấp 9, chuồng bò | 180 | 2 thức ăn | 8 ph | 1 sữa | 58 |
Cho ăn ⇒ bắt đầu chu kỳ; chín ⇒ trứng/sữa hiện trên đầu, chạm để thu. Không sinh sản, không di truyền, không AI đi lại (chỉ animation tại chỗ).

### 2.5 Ba chuỗi mẫu (đều đi được từ cấp 8)
- **A:** Dâu → Mứt dâu → giao đơn Bác Tư (+30 %) → xu nâng Bếp sên lên 3 ô.
- **B:** Ngô → Cối xay ra thức ăn → Gà → Trứng (+ Lúa → Bột gạo) → Bánh trứng → bán chợ khi giá ↑ hoặc giao đơn kết hợp.
- **C:** Cà chua → bán ngay lấy xu → mở thêm ô → trồng nhiều hơn → đơn lớn "6 cà chua + 2 sốt".

Quyết định thường gặp: bán thô hay chế biến · ô đất hay nâng máy · giữ trứng cho đơn hay bán · nâng kho hay thêm gà · cây nhanh (nhiều XP/phút khi đang chơi) hay cây chậm (trồng trước khi rời máy).

### 2.6 Đơn hàng (mở rộng hệ của Codex)
- **Đơn thường** (từ cấp 1): 1–2 loại nông sản/thành phẩm dễ, thưởng giá trị ×1,15–1,2 + XP. 3 ô lúc đầu, +1 ô ở cấp 3, 6, 11 (tối đa 6).
- **Đơn kết hợp** (từ cấp 5): 3–4 món, có ít nhất 1 thành phẩm, ×1,3 + XP ×1,5.
- **Đơn đặc biệt** (từ cấp 11, tối đa 1 lúc): có hạn 2 giờ (đồng hồ hiển thị; hết hạn chỉ mất đơn, không phạt), thưởng xu ×1,35 + **vật liệu** (ván gỗ / đinh / sơn) hoặc đồ trang trí hiếm.
- Mỗi đơn: NPC đặt, món + số lượng (hiện có/cần), thưởng, trạng thái (đủ hàng / thiếu), nút "Giao". **Không trừ hàng trước khi bấm Giao**; giao dùng `id`+`revision` như code hiện tại. Có nút "Bỏ đơn" (đơn mới sau 2 phút) để không bị kẹt đơn khó.
- Sinh đơn: chỉ dùng món người chơi **đã mở khoá**, số lượng theo sản lượng thực tế (không đòi 20 bánh khi mới có 1 máy).

### 2.7 Nhà kho & vật liệu
- Sức chứa: 60 → 90 → 130 → 180 → 250 (nâng bằng xu, từ cấp 2 nâng cần thêm vật liệu). Milestone 5 thêm mốc 320 (cấp 19). Nông sản + thành phẩm + sản phẩm động vật tính chung; vật liệu không tính.
- Vật liệu (ván gỗ, đinh, sơn) đến từ đơn đặc biệt, nhiệm vụ và thu hoạch (2 % rơi ngẫu nhiên có seed) — dùng cho nâng kho cấp 3+, công trình cấp 2.

---

## 3. Tiến trình 20 cấp

XP mỗi cấp: ~~`10·lv^1,5`~~ → bảng `data/levels.js XP_TO_NEXT` ≈ 45·cấp² (Milestone 5, cân bằng bằng `tools/sim`; tổng ~104 000 XP). Ước lượng: cấp 4 trong ~10 phút, cấp 7 ~40 phút, cấp 10 ~2 giờ, cấp 20 ~10–12 giờ chơi rải nhiều ngày.

| Cấp | Mở khoá chính | Thay đổi trên bản đồ |
|---|---|---|
| 1 | Trồng, tưới, thu, bán, **Bảng đơn** (3 ô), nhiệm vụ hướng dẫn | Nhà nhỏ, 9 ô đất, bảng gỗ ở cổng, sạp nhỏ |
| 2 | Dâu tây, mở ô đất | — |
| 3 | Ngô, **Nhà kho** (xây 60 xu), đơn ô thứ 4, **Khu chợ** đầy đủ | Nhà kho xuất hiện bên trái |
| 4 | Bí ngô, **Xưởng + Bếp sên** (150 xu, xây 1 ph) | Nhà xưởng mái ngói, khói bếp |
| 5 | **Cối xay**, đơn kết hợp | Cối xay gió nhỏ quay cánh |
| 6 | Lúa, **Làng** mở (4 NPC), đơn ô thứ 5 | Biển "Làng" ở cuối đường đất |
| 7 | **Chuồng gà** (300 xu, 2 ph) | Chuồng gà + gà chạy trong sân |
| 8 | **Lò bánh** (400 xu) | Ống khói lò bánh |
| 9 | **Chuồng bò** (600 xu, 3 ph) | Chuồng bò, bò gặm cỏ |
| 10 | **Nhà kính** (900 xu + 10 ván gỗ, 5 ph): 6 ô, cây mía, cây trong nhà kính không cần tưới | Nhà kính kính xanh |
| 11 | **Đơn đặc biệt**, xe giao hàng, đơn ô thứ 6 | Xe tải nhỏ đậu ở cổng |
| 12 | **Máy bơ sữa** | Máy đặt trong xưởng |
| 13 | **Nồi đường**, nâng xưởng cấp 2 (+1 ô hàng chờ mọi máy) | Mái xưởng đổi màu, bảng hiệu |
| 14 | Nhiệm vụ chuỗi của NPC (câu chuyện ngắn 3 bước) | Nhà NPC có cờ |
| 15 | Kho cấp 4, hàng rào đá | Kho to hơn |
| 16 | **Lò bánh cấp 2** (bánh flan) | — |
| 17 | **Khu đất phía Đông** (+9 ô, 1 lô xây) | Bản đồ mở rộng sang phải |
| 18 | Đơn đặc biệt hai lúc, sự kiện "Phiên chợ" (giá thành phẩm +25 % trong 30 ph, 1 lần/ngày) | Cờ hội trên chợ |
| 19 | Trang trí hiếm (cổng tre, đèn lồng, giếng đá, bù nhìn) | — |
| 20 | Mục tiêu dài hạn: **"Nông trại danh tiếng"** — sổ sưu tập 30 món (làm mỗi món 1 lần), danh hiệu trang trại, bảng điểm danh tiếng = tổng xu kiếm được | Biển tên nông trại mạ vàng |

Công trình có trạng thái: **Khoá** (chưa đủ cấp — bản đồ hiện khung bản vẽ mờ + số cấp) · **Có thể xây** (khung bản vẽ xanh nhấp nháy nhẹ) · **Đang xây** (giàn giáo + đồng hồ, có thể chạy offline) · **Hoàn thành** · **Nâng cấp được** (mũi tên vàng). Công trình nhỏ (kho, sạp) xây tức thì; lớn 1–5 phút.

---

## 4. Lý do quay lại

- **5 phút đầu** (Chị Ba hướng dẫn, mỗi bước 1 mũi tên): gieo cà rốt → tưới → thu → giao đơn đầu (Bác Tư) → bán ở chợ → lên cấp 2.
- **15 phút:** mở 2 ô đất, xây Nhà kho (thấy bản đồ đổi), cấp 4 mở Xưởng, làm hũ mứt đầu tiên.
- **30–60 phút:** cối xay, đơn kết hợp, chọn giữa nâng Bếp sên hay xây chuồng gà, làng mở.
- **Những ngày sau:** cây dài ngày + máy chạy offline, đơn đặc biệt, nhà kính, trang trí, sổ sưu tập.
- Màn chào khi quay lại: "Trong lúc bạn vắng: 6 ô đã chín · Bếp sên xong 2 hũ mứt · 3 quả trứng". **Không** phạt vắng mặt, **không** điểm danh bắt buộc, không thông báo đẩy.
- Việc ngắn trong lúc chờ: tưới cây, giao đơn nhỏ, bán khi giá ↑, trò chuyện NPC (nhiệm vụ nhỏ), sắp xếp trang trí.

---

## 5. Nhiệm vụ & NPC (nhân vật gốc, không lấy từ game khác)
| NPC | Vai trò | Chỗ đứng |
|---|---|---|
| **Chị Ba Lúa** — quản lý nông trại, nhanh nhảu | Hướng dẫn, nhiệm vụ tiến trình | Nông trại chính (góc ruộng) |
| **Cô Hai Hạt Giống** — bán hạt, hay kể chuyện thời tiết | Chủ chợ, đơn thường | Khu chợ |
| **Bác Tư Lò Bánh** — khó tính nhưng thưởng hậu | Đơn kết hợp, nhiệm vụ lò bánh | Làng (tiệm bánh) |
| **Anh Út Xe Tải** — giao hàng, vui tính | Đơn đặc biệt, hoạt cảnh giao hàng | Cổng nông trại |

Nhiệm vụ (mỗi cái dạy 1 cơ chế, thưởng xu/XP/vật liệu):
- **Hướng dẫn (8):** gieo hạt đầu · tưới cây · thu hoạch · bán ở chợ · giao đơn đầu · mở 1 ô đất · xây nhà kho · nâng thanh XP lên cấp 3.
- **Tiến trình (~20):** xây xưởng · làm hũ mứt · làm thức ăn · mua gà · thu trứng đầu · làm bánh trứng · xây nhà kính · giao đơn kết hợp · nâng kho …
- **Lặp lại (bảng 3 nhiệm vụ, làm mới khi xong):** "Giao 3 đơn", "Thu 20 nông sản", "Chế biến 5 món", "Hoàn thành 1 chuỗi Ngô→Trứng→Bánh". Thưởng vừa phải, không thay thế đơn hàng.

---

## 6. Kiến trúc code (giữ JS thuần, không thêm thư viện / backend)

```
prototype/games/nong-trai/
  data/        crops.js recipes.js machines.js animals.js buildings.js levels.js quests.js npcs.js orders.js prices.js  ← cấu hình thuần
  core/        state.js (tạo/di chuyển save v2→v3) inventory.js plots.js production.js animals.js orders.js
               quests.js build.js progression.js market.js offline.js   ← luật thuần, nhận `now`, không DOM
  save.js      adapter lưu (localStorage + khoá navigator.locks, đã có) — tách khỏi luật
  ui/          hud.js scene-farm.js scene-workshop.js scene-market.js scene-orders.js scene-animals.js
               scene-warehouse.js scene-village.js scene-build.js sprites.js sfx.js tutorial.js
  game.js      khởi động + điều hướng cảnh
  test/        test luật cho từng module + e2e trình duyệt (CDP như các game khác)
```
- Mọi thay đổi trạng thái qua 1 hàm `apply(state, action, now)` trả `{ok|err, events}` ⇒ dễ test, chống âm xu / dùng món không có / nhận 2 lần ở **một chỗ**.
- Save v3: di chuyển tự động từ v2 (giữ xu, cấp, XP, ô đất, cây đang trồng, kho, đơn). **Không xoá dữ liệu cũ** — giữ bản v2 dưới khoá `wgp.nongtrai.v2.backup` cho tới bản sau.
- Giới hạn bảo mật: lưu ở trình duyệt nên người chơi tự sửa được; chấp nhận được vì không có bảng xếp hạng chung / phần thưởng thật. Nếu sau này có bảng xếp hạng, chuyển các giao dịch quan trọng lên server (adapter đã tách sẵn).
- Hiển thị: DOM + `<canvas>` cho sprite (như hiện tại), mỗi cảnh một module, chỉ cảnh đang mở mới chạy vòng vẽ. Nhịp tick 1 s cho đồng hồ.

---

## 7. Art Direction & prototype duyệt

- Pixel art chi tiết, 3/4 từ trên xuống, ánh sáng ấm từ trên-trái, viền tối 1 pixel, bảng màu tươi miền quê Việt (mái ngói đỏ, tre, lúa, đèn lồng) — **giữ nguyên chất lượng màn 1 hiện tại làm chuẩn**.
- Mật độ pixel: ô đất 64×64 px trên màn; 1 "pixel nghệ thuật" = 2 px màn hình; sprite nhân vật ~48–64 px cao.
- Không emoji làm sprite, không ô màu CSS làm môi trường, không 1 ảnh tĩnh lớn + nút vô hình: **mỗi công trình / máy / NPC / vật nuôi là sprite riêng** đặt bằng code.
- **Prototype để duyệt (bước này):** Nông trại chính (có công trình ở các trạng thái), Xưởng chế biến (nội thất + 3 máy + hàng chờ), Khu chợ (quầy + Cô Hai + kệ). Codex tạo asset theo `ASSET-BRIEF` trong tin nhắn bàn giao; Claude ghép thành 3 cảnh tương tác được (chưa có luật đầy đủ) để chủ dự án duyệt.

---

## 8. Lộ trình
| Milestone | Nội dung | Điều kiện xong |
|---|---|---|
| **0** (đang ở đây) | Audit, thiết kế này, asset prototype 3 khu, 3 cảnh ghép | **Chủ dự án duyệt thiết kế + Art Direction** |
| 1 | Tách module `data/ core/`, save v3 + di chuyển, Bảng đơn 3 loại, Nhà kho có sức chứa, nhiệm vụ hướng dẫn | Test luật + e2e: trồng→thu→bán→giao đơn, refresh giữ nguyên |
| 2 | Xưởng (Bếp sên, Cối xay), hàng chờ, Khu chợ + giá biến động, chuỗi A & C | e2e: trồng→chế biến→giao đơn; offline máy chạy đúng |
| 3 | Chế độ xây dựng, trạng thái công trình, bản đồ đổi theo cấp, 20 cấp | e2e: xây→xuất hiện bản đồ, nâng kho→sức chứa đổi |
| 4 | Chăn nuôi (gà, bò), Lò bánh, Làng + NPC + nhiệm vụ, chuỗi B | e2e: ngô→thức ăn→gà→trứng→bánh |
| 5 | Animation, âm thanh, cân bằng, điện thoại, hiệu năng, test hồi quy | Đủ 12 tiêu chí nghiệm thu (§9) |
| 6 | Sổ sưu tập 30 món, đơn đặc biệt hai lúc, Phiên chợ, hàng rào đá, ảnh nhà theo bậc (chờ Codex), 6 công thức mới, save v7 | §10: test luật + sim + e2e, hợp đồng asset `docs/nong-trai/asset-spec.json` chạy 0 lỗi |

Mỗi milestone chỉ đẩy lên bản thật khi chủ dự án đồng ý.

---

## 9. Milestone 5 — 12 tiêu chí nghiệm thu (bản đề xuất của Dev, chờ chủ dự án duyệt)

> Lộ trình §8 ghi "Đủ 12 tiêu chí nghiệm thu" nhưng bản thiết kế chưa liệt kê. Dev đề xuất 12 tiêu chí dưới đây, mỗi tiêu chí có cách kiểm tự động. Chủ dự án có thể sửa danh sách khi duyệt.

| # | Tiêu chí | Cách kiểm | Trạng thái |
|---|---|---|---|
| 1 | Nhịp lên cấp đúng §3 (hồ sơ "chăm"): cấp 4 ≈ 10 ph, cấp 7 ≈ 40 ph, cấp 10 ≈ 2 h, cấp 20 trong 10–12 h chơi | `tools/sim` + test `sim.test.mjs` (khoảng 7–14 / 30–55 / 90–160 / 600–720 ph) | Đạt: 9 ph / 38 ph / 1,9 h / 11,3 h |
| 2 | Xu cuối game vẫn có giá trị: xu ngày 7 của người chơi chăm < tổng chỗ tiêu còn lại, < 400 000 | `sim.test.mjs` | Đạt: 249 000 xu (bản M4: 920 000), còn 632 000 xu chỗ tiêu |
| 3 | Không vòng lặp lời (mua ở chợ → bán lời), thu nhập/giờ không siêu tuyến tính | `MARKET.assertEconomy()`, report §6 | Đạt |
| 4 | Không mất dữ liệu người chơi: save v6 giữ nguyên dạng; save v2–v5 di chuyển kèm bản sao `*.backup`; XP cũ dư so với đường XP mới được dồn lên cấp | test `state`, `m3`, `m5` | Đạt (không đổi dạng save ⇒ vẫn v6) |
| 5 | Bản đồ: không công trình / nhãn nào bị cắt mép (đặc biệt chuồng gà, chuồng bò, Nhà kính ở mép dưới), không đè ruộng | test `m5` (hộp vẽ theo manifest), e2e desktop + 390 px | Đạt (bản đồ 960 × 640) |
| 6 | Điện thoại 390 × 844: không tràn ngang, mọi nút ≥ 44 px, thanh điều hướng không cắt chữ | e2e (`mobile 390 …`, `M5 mobile …`) | Đạt (10 nút / 2 hàng × 5, cao 52 px) |
| 7 | Animation dùng đúng khung manifest: cây 5 giai đoạn, máy idle/running, NPC idle/vẫy, gà/bò (cảnh Chăn nuôi + đi lại trên bản đồ), cối xay gió, fx (xu bay, lấp lánh, nước tưới, khói xây, giao đơn, âm vật nuôi) | e2e (canvas có pixel, `.critter` dùng animals.webp), xem ảnh chụp | Đạt; tôn trọng `prefers-reduced-motion` |
| 8 | Âm thanh cho thao tác chính (gieo, tưới, thu, bán, giao đơn, xây / nâng, lên cấp, nhận thưởng, lỗi) và tôn trọng khoá tắt tiếng chung `wgp.muted` (kể cả đổi ở tab khác) | e2e (`sfx.log`, `wgp.muted đổi ở tab khác …`) | Đạt |
| 9 | Hiệu năng: không vẽ lại canvas khi không có gì đổi (Làng, Chợ, Xưởng vẽ theo khoá khung), đồng bộ mỗi giây chỉ chép trạng thái 1 lần, gà/bò bản đồ chạy bằng CSS | test `m5` (needsSync), đọc code | Đạt |
| 10 | Một tag module `?v=m5` cho mọi import (trình duyệt không lẫn bản cũ) | test `m5` | Đạt |
| 11 | Bất biến luật giữ nguyên: xu ≥ 0, món nguyên ≥ 0, không nhận 2 lần — qua fuzz + mô phỏng 7 ngày × 3 hồ sơ | test `fuzz`, `sim.test.mjs` (0 vi phạm) | Đạt |
| 12 | Hồi quy: toàn bộ test luật + e2e trình duyệt (bản chơi + trang thử M4) qua, 0 lỗi console | `node --test test/*.test.mjs`, `test/e2e.mjs`, `test/e2e-m4.mjs` | Đạt |

**Thay đổi cân bằng M5** (chi tiết: `tools/sim/report.md`):
- Đường XP: bảng `data/levels.js XP_TO_NEXT` ≈ 45·cấp² (cấp 4–6 ×0,7, từ cấp 14 ×0,92), tổng tới cấp 20 ≈ 104 000 XP (bản M4 60·cấp²: 148 200).
- Chỗ tiêu xu cuối game: **Nhà = "Nông trại danh tiếng"** — 10 bậc nâng từ cấp 10 (3 000 → 595 000 xu, ×1,8 mỗi bậc, bậc cao cần vật liệu), mỗi bậc một danh hiệu và mọi đơn hàng +2 % xu (tối đa +20 %); Nhà kho mốc 320 chỗ (cấp 19, 24 000 xu + vật liệu).
- Để milestone 6: đơn đặc biệt hai lúc, Phiên chợ, hàng rào đá (chưa có sprite), sổ sưu tập 30 món. → **Đã làm ở Milestone 6 (§10).**

---

## 10. Milestone 6 — hoàn thiện Nông Trại

Mọi tính năng còn treo của §3 đã có trong bản này (`data/levels.js CURRENT_MILESTONE = 6`). Tag module `?v=m6`. Save **v7** (`wgp.nongtrai.v7`): thêm `collection`, `fair`, `orders.special2`; save v2–v6 di chuyển tự động, bản gốc v6 chép sang `wgp.nongtrai.v6.backup` (không xoá khoá gốc). Cân bằng: `tools/sim/report.md` §11.

### 10.1 Sổ sưu tập (cấp 1 trở đi, nút **Sổ** trên HUD)
- **30 món**: 7 nông sản · 2 chăn nuôi (trứng, sữa) · 18 thành phẩm (12 cũ + 6 công thức mới bên dưới) · 3 vật liệu (ván gỗ, hộp đinh, thùng sơn).
- Món tự ghi khi lần đầu **vào kho do người chơi làm ra / nhận được**: thu hoạch, nhận từ máy, thu trứng sữa, thưởng đơn / nhiệm vụ, vật liệu rơi khi thu hoạch. **Mua ở chợ không tính.** Sổ đếm tổng số đã làm (hiện "×n" trên ô). Cách đếm: `apply()` so số lượng trước / sau mỗi action (`core/collection.js track`) — một chỗ, không phải sửa từng module.
- Mốc thưởng (nhận bằng nút "Nhận" trong Sổ, theo thứ tự, không có XP để không đổi nhịp lên cấp):
  | Mốc | Danh hiệu | Thưởng |
  |---|---|---|
  | 10 món | Nhà sưu tầm tập sự | 800 xu · 2 ván gỗ · 2 hộp đinh |
  | 20 món | Nhà sưu tầm chăm chỉ | 4 000 xu · 3 thùng sơn · 1 ghế tre |
  | 30 món | Nhà sưu tầm danh tiếng | 15 000 xu · 2 thùng sơn · 1 đèn lồng · 1 giếng đá |
- Save cũ: món đang có trong kho được ghi sẵn vào sổ (người chơi lâu năm không phải làm lại từ đầu).
- Mô phỏng: "chăm" đủ 10 / 20 / 30 món sau ~0,3 / 2,3 / 8,5 giờ chơi; "thỉnh thoảng" 21 món sau 7 ngày.

### 10.2 Sáu công thức mới (để đủ 30 món)
| Công thức | Máy | Cấp | Nguyên liệu | Thời gian | Bán | XP |
|---|---|---|---|---|---|---|
| Bánh ngô | Lò bánh | 9 | 3 ngô + 1 trứng | 3 ph | 155 | 11 |
| Sinh tố dâu | Máy bơ sữa | 12 | 3 dâu + 1 sữa | 3 ph | 165 | 12 |
| Bắp rang bơ | Lò bánh | 13 | 2 ngô + 1 bơ | 5 ph | 315 | 22 |
| Chè bí ngô | Nồi đường | 14 | 1 bí ngô + 1 đường | 5 ph | 255 | 18 |
| Sữa chua | Máy bơ sữa | 15 | 2 sữa + 1 đường | 6 ph | 380 | 27 |
| Bánh gạo | Lò bánh | 17 | 2 bột gạo + 1 đường | 6 ph | 375 | 26 |
Giá ra ≈ 1,29–1,31 × giá vào (§2.1), giá trị cộng thêm 12–14,5 xu / phút-máy (ngang bơ, bánh flan). Icon: `items-2.webp` (Cần Codex); chưa có ⇒ icon gần nghĩa + bộ lọc màu.

### 10.3 Đơn đặc biệt hai lúc (cấp 18)
Ô thứ hai `special2` cùng luật ô thứ nhất: Anh Út, hạn 2 giờ, thưởng ×1,35 + vật liệu, giao / hết hạn ⇒ đơn mới sau 15 phút, bỏ đơn không phạt. Bảng đơn hiện "Đơn đặc biệt thứ hai mở ở cấp 18" từ cấp 11.

### 10.4 Phiên chợ (cấp 18) — §3 chỉ ghi "giá thành phẩm +25 % trong 30 ph, 1 lần/ngày"; phần còn thiếu chốt như sau
- **Giờ**: mỗi ngày (giờ Việt Nam) đúng một phiên 30 phút, bắt đầu ở một mốc 30 phút trong 9:00–21:30, **tất định theo ngày** (hash ngày, không random giấu, mọi thiết bị thấy cùng giờ). Khu chợ báo trước "Phiên chợ kế tiếp: hôm nay lúc 15:30" + hàng săn, nên người chơi lên kế hoạch được; không phạt nếu lỡ.
- **Giá**: trong phiên, mọi thành phẩm bán **giá chốt gốc × 1,25** (không dao động). **Hàng săn**: mỗi ngày Cô Hai săn 3 món (1 nông sản + 2 món chăn nuôi / thành phẩm, trừ thức ăn gia súc) trả **gốc × 1,5 cho 10 món đầu mỗi loại**, quá 10 về giá phiên / giá chợ. Đơn hàng không đổi.
- **Trạng thái lưu**: chỉ `s.fair = { day, sold }` (số hàng săn đã bán trong phiên hôm nay). Một nguồn giá cho Nhà kho, giỏ tràn, Khu chợ, bộ mô phỏng: `core/fair.js quote()`.
- **Chống lời vô hạn**: `MARKET.assertEconomy` tính cả giá phiên chợ ⇒ thức ăn gia súc ở chợ 56 → **72 xu** (4 bao = 288 > bơ 185 × 1,5; 6 bao = 432 > phô mai 280 × 1,5).
- Bản đồ: sạp chợ treo cờ hội (frame `phien-cho.webp`, chưa có ⇒ 2 đèn lồng) + nhãn "Phiên chợ!", nút Chợ có huy hiệu "Hội". Cô Hai có 10 câu riêng cho phiên chợ.

### 10.5 Hàng rào đá (cấp 15)
Hàng rào gỗ mép dưới bản đồ thành công trình "Hàng rào" (có sẵn, cấp 1 = gỗ). Nâng lên **hàng rào đá**: 6 000 xu + 4 hộp đinh + 2 thùng sơn, xong ngay, chỉ trang trí. Sprite đá: `hang-rao.webp` frame `hang-rao-da` (Cần Codex); chưa có ⇒ hàng rào gỗ lọc màu đá xám.

### 10.6 Ảnh nhà theo bậc
Bậc Nhà ★1–★10 dùng frame `nha-bac-1` … `nha-bac-10` của `house-tiers.webp` khi Codex giao. Thiếu frame bậc đang có ⇒ dùng frame bậc thấp gần nhất đã vẽ (giao dần 3–4 frame một lượt vẫn được); không có frame nào ⇒ ảnh `garden/house` như M5. Nhãn "Nhà ★n" giữ nguyên.

### 10.7 Cân bằng (tools/sim, 7 ngày)
- Chăm: cấp 4 / 7 / 10 / 20 sau 9 ph / 39 ph / 1,8 h / 11,5 h chơi (M5: 9 / 38 / 1,9 h / 11,3 h); xu cuối tuần 258 000 (M5: 249 000), vẫn dưới chỗ tiêu còn lại.
- Hai gợi ý treo của M5 (giảm XP cây nhanh; vật nuôi lãi/giờ thấp hơn ô cà chua) đã chạy thử và **không áp dụng** — lý do và số liệu ở `tools/sim/report.md` §11.

---

## Cần Codex (Milestone 6)

Hợp đồng máy đọc được: `docs/nong-trai/asset-spec.json` (kiểm: `python -I tools/asset-check/check_assets.py docs/nong-trai/asset-spec.json --preview <tmp>`, phải ra 0 lỗi). Chuẩn chung: PLAYBOOK §1–§2 — **lưới 2×** (1 điểm vẽ = ô 2×2 px), alpha cứng, WebP lossless, cùng phong cách `assets/v3` (3/4 từ trên xuống, ánh sáng ấm trên-trái, viền tối 1 điểm vẽ, bảng màu quê Việt). Mỗi sheet mới thêm vào `assets/v3/manifest.json` → `sheets.<alias>` (alias = tên file không đuôi), `frames: [{ id, x, y, width, height, anchor }]` giống các sheet đang có. Code tự nhận frame theo tên, không cần sửa code.

| Sheet (file / alias) | Ô (px) | Anchor | Frame | Brief |
|---|---|---|---|---|
| `assets/v3/house-tiers.webp` / `house-tiers` | 288 × 224 | [144, 216] (đáy giữa, chân tường) | `nha-bac-1` … `nha-bac-10` (lưới 5 × 2) | Cùng một ngôi nhà của `assets/garden/house.webp` (mái ngói đỏ, hiên gỗ, tường vôi), lớn dần theo bậc danh tiếng, **giữ nguyên chân móng / bề ngang ~270 px** để đặt cùng chỗ trên bản đồ: ★1–3 sửa sang (chậu hoa, cửa sổ mới, hàng hiên dài), ★4–6 thêm chái / gác, mái ngói mới, đèn lồng, ★7–9 nhà hai tầng, cột gỗ chạm, sân gạch, ★10 "nông trại mạ vàng": biển tên viền vàng, đèn lồng đỏ, hoa giấy. Không vẽ đất / cỏ quanh nhà. Phần trên ô để trống cho mái cao. |
| `assets/v3/hang-rao.webp` / `hang-rao` | 256 × 128 | [128, 120] | `hang-rao-da` | Một đoạn hàng rào đá thấp nằm ngang (đá ong / đá xanh xếp, mũ gạch, 2–3 trụ), dài như `assets/garden/fence.webp` (~230 px), đọc rõ là "nâng cấp" của hàng rào gỗ. Chân hàng rào chạm y = 120; phần trên ô có thể có dây leo / hoa nhỏ trên mũ tường. |
| `assets/v3/items-2.webp` / `items-2` | 64 × 64 | [32, 32] | `banh-ngo`, `sinh-to-dau`, `bap-rang-bo`, `che-bi-ngo`, `sua-chua`, `banh-gao`, `so-suu-tap`, `co-phien-cho` (lưới 4 × 2, đúng thứ tự) | Cùng cỡ / nét icon `items.webp`: bánh ngô vàng nướng; ly sinh tố dâu hồng có ống hút; túi bắp rang bơ vàng óng; chén chè bí ngô nước cốt dừa; hũ sữa chua thuỷ tinh nắp giấy; bánh gạo tròn nướng; **so-suu-tap** = cuốn sổ bìa da có dấu ngôi sao; **co-phien-cho** = lá cờ hội đuôi nheo đỏ vàng. |
| `assets/v3/phien-cho.webp` / `phien-cho` | 192 × 192 | [96, 168] | `co-hoi-1`, `co-hoi-2` + animation `co-hoi` (frames [co-hoi-1, co-hoi-2], fps 3) | Dây cờ hội đuôi nheo nhiều màu + 2 đèn lồng căng trên nóc sạp chợ (đặt chồng lên `market-stall` trên bản đồ), 2 khung cờ bay. Nền trong suốt, không vẽ sạp. |

### Kết quả giao asset M6

Đã bổ sung đủ bốn sheet vào manifest ở commit `c40ba54`. Mười bậc nhà giữ bề ngang 270 px và cùng neo chân, hàng rào đá rộng 232 px, tám icon theo đúng thứ tự hợp đồng, clip cờ hội gồm hai khung và chạy 3 fps. Đã cập nhật SHA-256 và mở bảng ảnh soi cả bốn sheet. Checker của Nông Trại chỉ tự xuất ảnh soi khi đặc tả có sheet nhân vật, nên dùng bảng ảnh ghép riêng cho nhóm công trình, vật phẩm và cờ hội.

```text
python -I tools/asset-check/check_assets.py docs/nong-trai/asset-spec.json --preview <tmp>
0 lỗi, 0 cảnh báo — ĐẠT, giao được.
```
