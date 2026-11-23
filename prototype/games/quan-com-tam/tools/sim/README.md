# Bộ mô phỏng cân bằng Quán Cơm Tấm

Người chơi giả chơi từng ca bằng **luật thật**: mọi thao tác đi qua `core/apply.js` (bản nháp, kiểm bất biến), không chờ giờ thật. Chép khung Tiệm Bánh Mì (`prototype/games/tiem-banh-mi/tools/sim/`). Toạ độ cảnh lấy từ manifest thật (`data/asset-manifest.json`), như `game.js` lúc mở.

## Chạy

```sh
cd prototype/games/quan-com-tam
node tools/sim/sim.mjs                                   # 3 hồ sơ tới cấp 20 ⇒ report.md + report.json (chạy lần lượt, ~10–15 phút)
# chạy song song rồi gộp báo cáo (nhanh hơn):
node tools/sim/sim.mjs --profile careful --out c.json &
node tools/sim/sim.mjs --profile average --out a.json &
node tools/sim/sim.mjs --profile sloppy  --out s.json &
node tools/sim/report.mjs c.json a.json s.json           # ⇒ report.md (+ before.md nếu có: bảng trước cân bằng M5)
node tools/sim/fit.mjs 3                                 # dò đường cong XP (in bảng đề xuất cho data/economy.js LEVELS)
node --test test/sim.test.mjs                            # hồi quy rút gọn (chạy cùng bộ test, ~1–2 phút)
node --test tools/sim/sim.test.mjs                       # hồi quy đầy đủ tới cấp 20 (~3–4 phút)
```

Tuỳ chọn: `--seed N` (mặc định 12345), `--days N`, `--profile careful|average|sloppy|all`, `--out file.json`, `--no-write`. Bọc lệnh dài bằng `timeout 900`.

## Thời gian chơi

Phút chơi thật = thời gian ca đã trôi (đồng hồ ca chạy trong lúc bấm: mỗi lần bấm `tap` ms, đọc phiếu, cô chủ đi bộ trong cảnh) + hội thoại (đồng hồ dừng, `dialog` ms) + Chuẩn bị (`prep` đầu ngày, `between` giữa hai ca) + Chốt ca (`summary`) + màn chào.

## Hồ sơ (`profiles.mjs`)

| id | Bấm | Lật trễ | Sai mỗi dĩa (lớp / dặn / tính tiền) | Rời bếp | Chỗ nướng | Mua đồ |
|---|---|---|---|---|---|---|
| careful | 0,65 s | 0,3–1,6 s | 2 / 3 / 2% | chỉ khi bếp an toàn cho cả chuyến (+1,5 s), tối đa 1 việc chờ, không mời thêm khi đã có 3 bàn chưa lên món | vùng vừa, giữ 2 miếng chín sẵn | để dành theo thứ tự đồ có ích, thuê quán sớm |
| average | 0,8 s | 0,8–3,2 s | 5 / 8 / 6% | như trên (+0,5 s) | vùng vừa | như trên |
| sloppy | 0,65 s | 1–4 s | 12 / 20 / 14% | bất kể, xếp tới 3 việc | vùng nóng, nướng dư | trang trí theo hứng |

Mọi hồ sơ: mời ngồi ngay khi có bàn, châm trà + lấy phiếu trước khi bày, bưng hai dĩa một chuyến, bày ×N cho bàn cùng món (có ô bày đôi), hấp chả sẵn, bắc trứng lúc ghim phiếu, tắt món thiếu nguyên liệu (người ẩu ít khi), hết hàng chọn lựa chọn rẻ nhất (mượn / bỏ qua / ký gửi), giải sự kiện bằng lựa chọn ngẫu nhiên bấm được, trả lời review đôi khi, mở cả ca trưa từ cấp 5, quảng bá từ cấp 11, nhận đơn đặt, thuê Bông / Dì Năm khi dư tiền, hội chợ từ cấp 18 (trừ người ẩu), thử thách cấp 20, hạng quán + nước mắm nhà pha khi đồ đã gần đủ.

## Mục tiêu (PLAYBOOK §6, ECONOMY §12)

Cấp 4 ≈ 10 phút, 7 (lên quán) ≈ 40 phút, 10 ≈ 2 giờ, 20 ≈ 10–12 giờ. Tiền còn ý nghĩa tới cuối (hạng quán 30.800k + nước mắm nhà pha 4.500k). Không hồ sơ nào kẹt, người ẩu không phá sản.

## Hạn chế

- Chính sách tất định, không phải người thật; xu hướng đáng tin hơn con số tuyệt đối. Bot dùng một ô bày (ô thứ hai chỉ cho bày ×N), không kéo thả trang trí.
- Mốc cấp tính lúc chốt ngày (độ phân giải một ngày ≈ 5–9 phút).
- `fit.mjs` và `harness.mjs` nạp module có tag `?v=c2` (cùng bản với luật) để sửa tạm bảng cấp trong bộ nhớ — đổi tag cùng game.

Kết quả trước / sau Milestone 5: `report.md` (cuối file) và `docs/quan-com-tam/ECONOMY.md` mục "Cân bằng M5".
