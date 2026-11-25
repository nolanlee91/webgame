---
name: tap-lam-chu-game
description: Làm (hoặc tiếp tục) một game quản lý cửa hàng "Tập Làm Chủ" của Lụm Kèo — Tiệm Bánh Mì, Quán Cơm Tấm hoặc tiệm mới — theo chuẩn rút ra từ Tiệm Trà Sữa và Nông Trại. Dùng khi bắt đầu game tiệm mới, viết hợp đồng asset cho Codex, kiểm asset Codex giao, hoặc làm từng milestone M0–M5.
---

# Game Tập Làm Chủ

Đối số: id game (`tiem-banh-mi`, `quan-com-tam`…).

1. Đọc `docs/tap-lam-chu/PLAYBOOK.md` toàn bộ. Đó là nguồn chuẩn. File này chỉ là thứ tự làm.
2. Đọc `AGENTS.md` (luật chung cho Claude và Codex).
3. Xem mẫu đã chạy: `prototype/games/tiem-tra-sua/` (code) và `docs/tiem-tra-sua/` (thiết kế, asset-spec, DEV-NOTES).

## Thứ tự

- **M0:** viết `docs/<id>/` gồm GAME-DESIGN, ECONOMY, DRAMA (≥ 40 sự kiện), SCREENS, ART-DIRECTION và **asset-spec.json** (chép mẫu Trà Sữa).
  - Đưa chủ dự án duyệt.
  - Đưa Codex câu nhắn ở PLAYBOOK §8.
- **Nhận asset:** chạy `python -I tools/asset-check/check_assets.py docs/<id>/asset-spec.json --preview <scratchpad>`, rồi xem ảnh soi. Còn lỗi thì trả Codex danh sách lỗi đúng như script in ra, không tự vá asset.
- **Code:**
  - Làm trong worktree `.claude/worktrees/<id>`, branch `claude/<id>`. Thêm `.claude/worktrees/` vào `.git/info/exclude`.
  - Chép khung từ Trà Sữa: `render/atlas.js` (crisp, snap), `render/scene.js` (camera bội 0,5, charScale), `core/text.js` (freshLine), `save.js` (backup + chơi lại), `test/cdp.mjs`, `test/e2e.mjs`.
  - Khung UI theo **pixel V5 như Nông Trại** (PLAYBOOK §2.1): không bo tròn, viền 4 box-shadow góc khuyết, bóng cứng lệch, nút lún khi ấn. Chép khối biến `--px-border` / `--px-bevel` / `--px-drop` từ `index.html` của Trà Sữa. HUD điện thoại tối đa 1 hàng, có nhãn ngắn.
- **M1–M5** theo PLAYBOOK §4. Nội dung tối thiểu theo PLAYBOOK §5: mỗi cơ chế mới phải đi kèm kịch bản và review riêng.
- **Mỗi milestone:**
  - Chạy unit, e2e và mô phỏng cân bằng (nếu có).
  - Chụp ảnh 1366×768 dpr 1,25 và 390×844, rồi xem ảnh.
  - Kiểm lại trong cây sạch (git worktree riêng, ví dụ `../wt-check`).
  - Báo chủ dự án, **chờ lệnh push**.
- **Trước khi commit:**
  - Grep diff tìm `C:\\Users|AppData|@gmail`.
  - Bump một tag `?v=` cho mọi import.
