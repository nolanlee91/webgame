# Bộ mô phỏng cân bằng Tiệm Trà Sữa

Người chơi giả chơi từng ca bằng **luật thật**: mọi thao tác đi qua `core/apply.js` (bản nháp, kiểm bất biến), không chờ giờ thật. Mô phỏng theo mẫu `prototype/games/nong-trai/tools/sim/`.

## Chạy

```sh
cd prototype/games/tiem-tra-sua
node tools/sim/sim.mjs                          # 3 hồ sơ tới cấp 20 ⇒ report.md + report.json (~2–3 phút)
node tools/sim/sim.mjs --profile average --no-write
node tools/sim/fit.mjs 4                        # dò đường cong XP (in bảng đề xuất cho data/levels.js)
node --test tools/sim/sim.test.mjs              # hồi quy cân bằng (~2 phút)
```

Tuỳ chọn: `--seed N` (mặc định 12345), `--days N`, `--profile careful|average|sloppy|all`, `--no-write`.

## Thời gian chơi

Phút chơi thật = thời gian ca đã trôi (đồng hồ ca chạy theo thao tác: mỗi lần bấm tốn `tap` ms, đọc phiếu `read` ms) + hội thoại (đồng hồ dừng, `dialog` ms) + bảng Chuẩn bị ca (`prep`) + Chốt ca (`summary`) + màn chào. Một ngày ≈ 5–6 phút.

## Hồ sơ (`profiles.mjs`)

| id | Sai mỗi bước | Quên nắp | Ghim | Nhập hàng | Mua đồ | Hết hàng giữa ca |
|---|---|---|---|---|---|---|
| careful | 1–3% | 0,5% | khách sắp bỏ về trước | dự báo ×1,3 + "Nhập đủ cho hôm nay" | để dành theo thứ tự máy có ích | chạy đi mua / Anh Tèo |
| average | 3–8% | 2% | khách sắp bỏ về trước | dự báo ×1,1 + "Nhập đủ" | để dành | Anh Tèo / chạy đi mua / mượn |
| sloppy | 7–18% | 6% | theo thứ tự tới | dự báo ×0,8, ít để ý ô Kho đỏ | trang trí theo hứng | mượn / đổi món / ký gửi / đóng cửa sớm |

Mọi hồ sơ: nhập gấp khi ô Kho đỏ (người ẩu chỉ 15% số lần), nấu trân châu khi thiếu, giải quyết sự kiện bằng lựa chọn ngẫu nhiên làm được, trả lời review đôi khi, quảng bá từ cấp 14, hội chợ từ cấp 18 (trừ người ẩu), ca thử thách cấp 20 (người cẩn thận), hạng tiệm khi đã có hết máy.

## Mục tiêu (PLAYBOOK §6)

Cấp 4 ≈ 10 phút, 7 ≈ 40 phút, 10 ≈ 2 giờ, 20 ≈ 10–12 giờ. Tiền phải còn ý nghĩa cuối game (hạng tiệm 19.900k), người ẩu không bao giờ kẹt (gói ký gửi, mượn tiệm bên).

## Hạn chế

- Chính sách tất định, không phải người thật; xu hướng đáng tin hơn con số tuyệt đối. Ba hồ sơ khác nhau chủ yếu ở tỉ lệ sai và nhập hàng.
- Mốc cấp tính lúc chốt ca (độ phân giải một ngày ≈ 5 phút).
- `fit.mjs` và `harness.mjs` nạp module có tag `?v=m38` (cùng bản với luật) để sửa tạm bảng cấp trong bộ nhớ — đổi tag cùng game.

## Trước / sau Milestone 5 (seed 12345, phút chơi)

| Hồ sơ | Cấp 4 | Cấp 7 | Cấp 10 | Cấp 20 | Ghi chú |
|---|---|---|---|---|---|
| careful trước | 10,5 | 25,9 | 42,1 | 137,8 | Mua hết đồ ở ngày 19, dư 657k |
| average trước | 17,7 | 45,5 | 509,5 | — | **Kẹt** từ ngày 10: kho 60 đầy hàng không dùng, 0 đồng, ký gửi không có chỗ cho đường ⇒ ngày nào cũng đóng cửa sớm (254 lần ký gửi) |
| sloppy trước | 14,4 | 31,1 | 49,3 | 132,7 | 32 lần đóng cửa sớm |
| careful sau | 9,0 | 38,6 | 118,2 | 624,1 | 0 kẹt, hạng tiệm 7/8, còn 8.884k |
| average sau | 8,9 | 37,7 | 120,2 | 627,3 | 0 kẹt, hạng tiệm 7/8, còn 8.472k |
| sloppy sau | 7,1 | 32,6 | 113,5 | 634,5 | 0 kẹt, 9 lần hết hàng giữa ca, còn 3.457k |
