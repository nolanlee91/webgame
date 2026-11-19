# Bộ mô phỏng cân bằng Nông Trại 2.0

Mô phỏng offline một người chơi dùng **luật thật** (`core/*`, `data/*`) với thời gian giả lập (không chờ giờ thật), rồi viết báo cáo cân bằng so với mục tiêu DESIGN-2.0 §3.

## Chạy

```sh
cd prototype/games/nong-trai
node tools/sim/sim.mjs                              # 3 hồ sơ × 7 ngày + dò đường cong XP ⇒ report.md + report.json (~30 s)
node tools/sim/sim.mjs --profile cham --days 7      # một hồ sơ (cham | thinh-thoang | ngay-2-lan | all)
node tools/sim/sim.mjs --no-fit --no-write          # chỉ in tóm tắt, nhanh (~4 s)
node --test tools/sim/sim.test.mjs                  # test bất biến của chính bộ mô phỏng
```
Tuỳ chọn: `--seed N` (mặc định 12345), `--out <thư mục>`, `--no-fit` (bỏ dò đường cong XP), `--no-write`.

Kết quả: `tools/sim/report.md` (đọc được) và `tools/sim/report.json` (đủ dữ liệu: mốc cấp, mẫu đường cong, nguồn thu, khựng, bảng chuỗi, gợi ý, repro lỗi).

## Các file

| File | Vai trò |
|---|---|
| `harness.mjs` | Trạng thái nông trại + hành động gọi thẳng hàm luật thuần (plots, orders, economy, quests, production, animals, village, build, market). Gom sự kiện, đếm nhiệm vụ M1 + M4, sổ thu/chi theo nguồn, kiểm bất biến sau mỗi hành động. Thay cho `apply()` (không import `core/apply.js` / `core/state.js` vì đang được sửa song song). |
| `policy.mjs` | Chính sách "tham nhưng hợp lý" cho mỗi lần nhìn màn hình. |
| `profiles.mjs` | 3 hồ sơ người chơi. |
| `analysis.mjs` | Mục tiêu §3, nguồn thu, vòng lặp lời, bảng lợi nhuận chuỗi A/B/C, dò đường cong XP, gợi ý chỉnh số. |
| `bugs.mjs` | Repro tối thiểu cho lỗi luật phát hiện được (tự chạy lại mỗi lần ⇒ báo "CÒN" / "đã sửa"). |
| `report.mjs` | Kết xuất report.md. |

## Hồ sơ

| id | Lịch chơi | Nhìn màn hình |
|---|---|---|
| `cham` | phiên 30 ph, nghỉ 30 ph, 8:00–22:00 (14 phiên ≈ 7 h/ngày) | mỗi 60 s |
| `thinh-thoang` | 3 phiên × 10 ph (8:00, 13:00, 20:00) | mỗi 30 s |
| `ngay-2-lan` | 2 phiên × 5 ph (8:00, 20:00) | mỗi 30 s |

Mọi hồ sơ giới hạn **30 chạm / phút** (gieo 1 ô, tưới 1 ô, "Thu hết", giao 1 đơn, bán 1 món, xây … đều = 1 chạm).

## Chính sách mỗi lần nhìn

1. Đồng bộ (công trình xây xong, lấp đơn, giỏ tràn về kho, lưới an toàn, bảng nhiệm vụ làng).
2. "Thu hết" ruộng, nhận mọi máy, thu trứng/sữa (kho đầy ⇒ bán dư rồi thử lại).
3. Nhận thưởng nhiệm vụ (hướng dẫn M1, tiến trình / chuỗi / bảng lặp lại M4).
4. Giao mọi đơn đủ hàng; đơn không giao được sau 30 phút **chơi** ⇒ bỏ (trừ đơn đặc biệt).
5. Chạy máy: ưu tiên món đơn / chuỗi đang cần, thức ăn khi thiếu cho vật nuôi, bột gạo cho lò bánh, còn lại công thức có giá trị cộng thêm / phút-máy cao nhất. Nguyên liệu thô mà đơn đang cần không đem chế biến.
6. Cho mọi con đói ăn.
7. Bán dư (giữ hàng cho đơn + nguyên liệu cho máy + thức ăn 3 chu kỳ): bán khi giá ≥ 97 % giá gốc (nông sản ≥ 90 %), hoặc kho ≥ 70 %, hoặc gần hết xu.
8. Xây / mua theo danh sách ưu tiên: Nhà kho (+ nâng mốc 90) → 3 ô đất → Xưởng → Cối xay → Chuồng gà + gà → Lò bánh → thêm ô (tới 8) → Chuồng bò + bò → Nhà kính → Máy bơ sữa → Nồi đường → nâng kho khi ≥ 75 % → Lò bánh cấp 2 (cấp 16) → Xưởng cấp 2 → Đất phía Đông → ô đất còn lại → nâng máy hay đầy hàng chờ → nâng chuồng / nhà kính. Mục lớn chưa đủ tiền ⇒ "để dành" (chỉ cho mục rẻ ≤ 15 % giá mục đó). Thiếu vật liệu ⇒ mua ở chợ nếu đủ xu. Giữ lại ~6 xu/ô cho hạt.
9. Gieo: trước hết cây cho đơn / nguyên liệu máy (≤ 60 % ô trống), còn lại cây có `(bán − hạt + 2·XP) / thời gian tới lúc THU THẬT` cao nhất — thời gian tới lúc thu tính theo lần nhìn kế tiếp, hoặc tới **phiên sau** nếu cây chín sau khi rời máy ⇒ tự động "gieo cây dài trước khi rời".
10. Tưới mọi cây chưa tưới (nếu còn chạm).

## Giả định (khác bản đang chạy trong trình duyệt)

- **Toàn bộ nội dung M2–M4 bật** (không lọc `CURRENT_MILESTONE`): Máy bơ sữa, Nồi đường, chuồng, nhà kính, đất Đông, làng. Công trình dùng `core/build.js` + `data/buildings.js` (M3) — Nhà kho phải xây (cấp 3, 60 xu) rồi mới nâng; nâng kho phát sự kiện `warehouseUpgraded` cho nhiệm vụ hướng dẫn M1. Xưởng xây qua `build.js` và tặng Bếp sên như `core/workshop.js`.
- **Nhà kính**: 6 (rồi 9) ô thêm vào `s.plots`, coi như luôn được tưới (§3 "không cần tưới"). Chính sách chỉ gieo Mía ở ô nhà kính (luật thì cho gieo ở mọi ô — xem lỗi). Đất Đông: +9 ô.
- **Không** tự thêm `items` vào sự kiện `delivered` và **không** cho trứng/sữa vào đơn — dùng đúng hành vi hiện tại của `core/orders.js` để thấy hệ quả thật (nhiệm vụ M4 bị kẹt).
- Giá chợ theo `core/market.js` (±15 %, chu kỳ 3 giờ, tất định theo thời gian mô phỏng bắt đầu 2/11/2026 0:00 UTC).
- Không trò chuyện NPC (chỉ ảnh hưởng thân thiết, không có tác dụng kinh tế), không mua / đặt trang trí, không mua thức ăn ở chợ.
- Đường cong XP thử nghiệm (`--fit`): harness cộng XP theo đơn vị gốc rồi tính lại cấp theo đường cong mới sau mỗi hành động — tương đương sửa `xpNeed` mà không đụng file.
- Gợi ý XP cây được kiểm bằng cách đổi tạm `CROP[id].xp` trong bộ nhớ trong lúc chạy rồi trả lại (không ghi file).

## Hạn chế

- Một chính sách tất định, không phải người thật: không chơi tối ưu tuyệt đối (không canh giá ↑ để bán thành phẩm, không lập kế hoạch nhiều bước), cũng không lãng phí như người mới. Kết quả là **mức tham chiếu**; xu hướng (nhanh/chậm bao nhiêu lần) đáng tin hơn con số tuyệt đối.
- Hồ sơ "chăm" nhìn mỗi phút và chạm 30 lần/phút — là người chơi rất chăm. Mốc §3 có lẽ nghĩ tới nhịp chậm hơn; báo cáo đưa cả 3 hồ sơ.
- Mốc cấp chỉ chính xác tới một lần nhìn (30–60 s); "chăm" có bậc 30 phút do lịch nghỉ.
- Khựng "không có gì để làm" hầu như bằng 0 vì ruộng luôn có việc với cây 30 s–1 ph; khựng tiến trình thể hiện qua bảng "chờ gom xu".
- Chỉ mô phỏng 1 seed mặc định; đổi `--seed` để xem độ dao động của đơn hàng / rơi vật liệu.
- Bản sao luật nằm trong file đang được người khác sửa: nếu chữ ký hàm trong `core/*` đổi, harness cần cập nhật (test `sim.test.mjs` sẽ báo).
