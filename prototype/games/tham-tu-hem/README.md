# Thám Tử Hẻm

Game suy luận phá án (solo) của Lụm Kèo: soi hiện trường, thẩm vấn, vạch mâu thuẫn lời khai, ghép bảng suy luận rồi vạch mặt thủ phạm trong Hẻm 47.

- Mở: `node server.js` ở gốc repo rồi vào `/games/tham-tu-hem/`.
- Thiết kế + định dạng vụ: `docs/tham-tu-hem/DESIGN.md`. Kiến trúc, cách thêm vụ, danh sách chờ Codex: `docs/tham-tu-hem/DEV-NOTES.md`.
- Test: `npm test` (core, bản lưu, bộ kiểm vụ, bot giải mọi vụ ra 3★). E2E: `test/e2e.mjs` (vụ mẫu qua giao diện, desktop + điện thoại), `test/e2e-bot.mjs` (mọi vụ thật qua giao diện).
- Kiểm một vụ: `node tools/check-case.mjs data/cases/<id>.js`.
- Tag cache: `?v=t2` ở mọi import. Đổi tag ở mọi chỗ cùng lúc.
- Dev: `?case=__mini` (vụ mẫu, chỉ localhost hoặc `?dev=1`), `?fast=1` (hiện chữ ngay), `window.__game`.
