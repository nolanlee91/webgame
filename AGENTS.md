# AGENTS.md: hướng dẫn cho agent làm việc trong repo Lụm Kèo

Repo cổng webgame Lụm Kèo: `server.js` phục vụ `prototype/`, các game ở `prototype/games/<id>/`. JS module thuần, không build.
**Push lên `master` là lên bản thật** (Railway tự deploy). Chỉ push khi chủ dự án yêu cầu.

## Khi làm asset (ảnh, sprite, manifest)

Đọc trước khi vẽ:
1. `docs/tap-lam-chu/PLAYBOOK.md` §1 (chuẩn asset) và §2 (quy tắc hiển thị pixel).
2. `docs/<game>/asset-spec.json`: hợp đồng của game, gồm sheet nào, cỡ ô, anchor, tên frame bắt buộc, chiều cao nhân vật, toạ độ đặt đồ.
3. `docs/<game>/DEV-NOTES.md`, mục "Cần Codex": danh sách dev đang chờ.

Luật cứng (vi phạm thì dev phải trả lại):
- Lưới 2× (1 điểm vẽ = ô 2×2 px) cho cảnh, nhân vật và đồ vật. Cận cảnh (`*-hd.webp`) vẽ lưới 1×. Không phóng to mượt bản cũ.
- Alpha cứng, WebP lossless.
- Nhân vật trong cảnh: cỡ ô và chiều cao **theo asset-spec của từng game**, vì cảnh gần hay xa thì người to hay nhỏ (Trà Sữa ô 144×192, Bánh Mì ô 216×288). Mọi frame của một vai cao bằng nhau (±8%).
- **Cảnh và người cùng một thước:** đo cửa (2,1 m) hoặc quầy (khoảng 1 m) trong cảnh, quy ra số px của người 1,65 m, ghi vào `manifest.sceneScale["<cảnh>"].humanHeight`. Script kiểm so chiều cao nhân vật với con số này (PLAYBOOK §1.2b).
- Mỗi vai là **cùng một người** trên mọi sheet.
- Tên frame đúng mẫu trong asset-spec (code tự nhận theo tên).
- Đồ đặt trên cảnh: ghi `placements.<id>.at` trong manifest (điểm chạm mặt bàn). Đường đi khách ghi `placements.door`, `queueSpots`, `exitPath`.

**Bắt buộc trước khi giao**, chạy và dán kết quả vào `docs/<game>/ASSET-HANDOFF.md`:

```
python -I tools/asset-check/check_assets.py docs/<game>/asset-spec.json --preview <thư mục tạm>
```

- Phải ra **"0 lỗi — ĐẠT"**. Cảnh báo ghi rõ lý do.
- Mở ảnh `nhan-vat-xep-hang-x2.png` để tự soi tỉ lệ so với cảnh và xem mỗi vai có giữ cùng một người không. Máy không kiểm được điều này.
- Cập nhật `docs/<game>/asset-manifest.json` và ghi commit hash vào ASSET-HANDOFF.md.

## Chung

- Không commit đường dẫn máy (`C:\Users\…`, `AppData`), tên tài khoản Windows, email.
- Không ghi đè thay đổi chưa commit của agent khác. Không xoá bản lưu người chơi.
- Hỏi chủ dự án trước khi dùng quota tạo ảnh AI ngoài phạm vi đã duyệt.
