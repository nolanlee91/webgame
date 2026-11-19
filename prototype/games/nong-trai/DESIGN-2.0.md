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
- Sức chứa: 60 → 90 → 130 → 180 → 250 (nâng bằng xu, từ cấp 2 nâng cần thêm vật liệu). Nông sản + thành phẩm + sản phẩm động vật tính chung; vật liệu không tính.
- Vật liệu (ván gỗ, đinh, sơn) đến từ đơn đặc biệt, nhiệm vụ và thu hoạch (2 % rơi ngẫu nhiên có seed) — dùng cho nâng kho cấp 3+, công trình cấp 2.

---

## 3. Tiến trình 20 cấp

XP mỗi cấp: giữ công thức hiện có `10·lv^1,5` (cấp 1→2: 10 XP … cấp 19→20: 828 XP; tổng ~6 300 XP). Ước lượng: cấp 4 trong ~10 phút, cấp 7 ~40 phút, cấp 10 ~2 giờ, cấp 20 ~10–12 giờ chơi rải nhiều ngày.

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
| 5 | Animation, âm thanh, cân bằng, điện thoại, hiệu năng, test hồi quy | Đủ 12 tiêu chí nghiệm thu |

Mỗi milestone chỉ đẩy lên bản thật khi chủ dự án đồng ý.
