# Bàn giao ảnh cảnh duyệt · Quán Cơm Tấm

Asset commit `46ade9d` trên `codex/com-tam-scenes`. Bước duyệt cảnh theo DEV-NOTES, trước khi vẽ nhân vật và đồ rời.

- Hai nền `street-scene` và `quan-scene`, kèm hai lớp che quầy `street-foreground` và `quan-foreground`. Cả bốn file 1280×720, lưới 2×, WebP lossless. Vùng ngoài quầy trên foreground trong suốt.
- Quầy bên trái và sàn bên phải dành cho bàn ghế động. Dùng chung điểm đứng chủ quán [330,532] và điểm đặt bếp [229,404]. Điểm vào qua cửa sau ở cảnh quán là [1146,452]. Ảnh sơ đồ có vị trí bàn dự kiến để duyệt.
- `sceneScale` ghi 257 px cho người 1,65 m ở cả hai cảnh. Cảnh vỉa hè đo từ quầy cao 148 px, tương ứng khoảng 0,95 m. Cảnh quán đo từ khung mở cao 328 px, tương ứng cửa 2,1 m.
- Đã mở ảnh từng cảnh và kiểm chồng foreground lên nền. Pixel phủ trùng màu và tọa độ với nền.

Checker trên phạm vi bốn file cảnh bằng bản sao hợp đồng tạm trả `0 lỗi, 0 cảnh báo — ĐẠT, giao được.` Hợp đồng chính giữ nguyên. Lệnh toàn bộ:

```text
python -I tools/asset-check/check_assets.py docs/quan-com-tam/asset-spec.json --preview <tmp>

99 lỗi, 11 cảnh báo — CHƯA ĐẠT, sửa rồi chạy lại.
```

Phần chưa có gồm 18 sheet bắt buộc còn lại, 70 tọa độ đặt vật, 11 khóa đường đi và bàn, cùng 11 sheet tùy chọn Đợt 2. Checker sẽ có ảnh soi nhân vật khi có sprite.
