# Danh mục skill & công cụ

_Audit Lụm Kèo · 24–25/11/2026 · 7 agent kiểm song song trên trình duyệt thật (Chrome headless giả lập). Ảnh chụp nằm ngoài git; bằng chứng chi tiết ở `raw/`._

## Đã cài cho audit này (cấp project, `.claude/skills/`, chưa commit)

| Skill | Nguồn | Dùng để | Ghi chú |
|---|---|---|---|
| frontend-design | Anthropic — github.com/anthropics/skills (MIT/LICENSE.txt) | Nhận ra giao diện "AI theo khuôn" | Chỉ file hướng dẫn |
| impeccable | Paul Bakaus — github.com/pbakaus/impeccable (Apache-2.0) | Quy trình critique / audit | **Chỉ chép SKILL.md + reference/**, KHÔNG cài chương trình nhị phân tự tải và KHÔNG bật hook sửa file; dùng nhánh "Launcher unavailable" |
| emil-design-eng | Emil Kowalski — github.com/emilkowalski/skills (MIT) | Độ lún, hiệu ứng, cảm giác bấm | |
| break-ui | như trên | Dữ liệu xấu nhất (tên dài, emoji, số khổng lồ) | Có CATALOG.md |
| mobile-native | như trên | Lỗi web trên điện thoại (100vh, phóng to ô nhập, safe-area…) | |
| animation-performance | như trên | Hiệu ứng trong ngân sách khung hình | |
| review-animations | như trên | Chấm hiệu ứng theo chuẩn | Có STANDARDS.md |
| tap-lam-chu-game | Có sẵn trong repo | Quy trình game Tập Làm Chủ | |

## Không cài

- **ui-ux-pro-max** (nextlevelbuilder): chủ yếu là kho bảng màu / kiểu giao diện có sẵn, dễ kéo khỏi bản sắc pixel V5.
- **taste-skill**: không tìm được nguồn chính thức.
- Các skill animation khác trong danh sách (improve-animations, find-animation-opportunities, performance-optimization): có trong repo Emil Kowalski nhưng trùng chức năng với 3 skill đã cài; có thể thêm sau nếu cần.

## Công cụ kiểm thử

| Công cụ | Trạng thái | Ghi chú |
|---|---|---|
| Chrome DevTools MCP | Chạy được | Dùng cho Lighthouse (a11y / best practices / SEO) + performance trace; bản MCP không có mục Performance của Lighthouse |
| Bộ CDP riêng của dự án (`prototype/games/_shared/test/cdp.mjs`) | Chạy được | 7 agent dùng song song, mỗi agent Chrome + server riêng |
| Playwright | Chưa cài | Cần nếu muốn kiểm WebKit (Safari) / Firefox — đề xuất cài ở đợt sau, chỉ trên máy dev |
| Thiết bị thật iOS / Android | Không có | Giới hạn lớn nhất của audit |

Không đọc hay sửa cấu hình global, Codex, Antigravity hay project khác.
