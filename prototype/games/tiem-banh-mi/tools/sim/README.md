# Bộ mô phỏng cân bằng Tiệm Bánh Mì

Người chơi giả chơi từng ca bằng **luật thật**: mọi thao tác đi qua `core/apply.js` (bản nháp, kiểm bất biến), không chờ giờ thật. Chép khung `prototype/games/tiem-tra-sua/tools/sim/`.

## Chạy

```sh
cd prototype/games/tiem-banh-mi
node tools/sim/sim.mjs                          # 3 hồ sơ tới cấp 20 ⇒ report.md + report.json (~4–6 phút)
node tools/sim/sim.mjs --profile average --no-write
node tools/sim/fit.mjs 3                        # dò đường cong XP (in bảng đề xuất cho data/economy.js LEVELS)
node --test tools/sim/sim.test.mjs              # hồi quy cân bằng (~2–3 phút)
```

Tuỳ chọn: `--seed N` (mặc định 12345), `--days N`, `--profile careful|average|sloppy|all`, `--no-write`.

## Thời gian chơi

Phút chơi thật = thời gian ca đã trôi (đồng hồ ca chạy trong lúc bấm: mỗi lần bấm `tap` ms, đọc phiếu `read` ms, đếm tiền thối 1,2 giây) + hội thoại (đồng hồ dừng, `dialog` ms) + Chuẩn bị ca (`prep` + canh mẻ đầu ngày đúng số giây canh) + Chốt ca (`summary`) + màn chào.

## Hồ sơ (`profiles.mjs`)

| id | Bấm / đọc phiếu | Sai mỗi bước | Rút lò trễ | Ghim | Nhập hàng | Mua đồ | Hết hàng giữa ca |
|---|---|---|---|---|---|---|---|
| careful | 0,6 s / 1,1 s | 1–2% | 0,5–2,5 s | sắp hết kiên nhẫn trước, bỏ khách chắc chắn không kịp | "Nhập đủ" + thêm phôi / pate | để dành theo thứ tự đồ có ích, thuê tiệm sớm | chờ lò / ký gửi / chạy chợ |
| average | 0,72 s / 1,4 s | 2–6% | 1–5 s | như trên | "Nhập đủ" | để dành | chờ lò / ký gửi / Anh Lâm |
| sloppy | 0,6 s / 0,8 s | 5–16% | 2–9 s (hay xém, đôi khi cháy) | theo thứ tự tới | đôi khi chỉ nhập phôi + pate | trang trí theo hứng | ký gửi / mượn / đổi món / đóng cửa sớm |

Mọi hồ sơ: nhập gấp khi món khách đang chờ còn ≤ 2 phần (người ẩu ít để ý), chiên trứng / nướng thịt theo phiếu (người ẩu không nấu sẵn), nướng khay que khi có phiếu que, giải quyết sự kiện bằng lựa chọn ngẫu nhiên làm được, trả lời review đôi khi, quảng bá từ cấp 11, nhận đơn đặt trước ở tiệm, hội chợ từ cấp 18 (trừ người ẩu), ca thử thách cấp 20 (người cẩn thận), hạng tiệm + pate nhà làm khi đã có gần hết đồ.

## Mục tiêu (PLAYBOOK §6, ECONOMY §11)

Cấp 4 ≈ 10 phút, 7 ≈ 40 phút, 10 ≈ 2 giờ, 20 ≈ 10–12 giờ. Tiền phải còn ý nghĩa tới cuối (hạng tiệm 19.900k + pate nhà làm 2.900k), không hồ sơ nào kẹt.

## Hạn chế

- Chính sách tất định, không phải người thật; xu hướng đáng tin hơn con số tuyệt đối. Người chơi giả chỉ dùng một thớt (thớt đôi / ba không làm nhanh hơn trong sim).
- Mốc cấp tính lúc chốt ca (độ phân giải một ngày ≈ 6–8 phút).
- `fit.mjs` và `harness.mjs` nạp module có tag `?v=b6` (cùng bản với luật) để sửa tạm bảng cấp trong bộ nhớ — đổi tag cùng game.

Kết quả trước / sau Milestone 5: `report.md` (cuối file) và `docs/tiem-banh-mi/ECONOMY.md` mục "Cân bằng M5".
