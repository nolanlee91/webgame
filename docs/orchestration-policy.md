# Orchestration Policy V1 — Webgame Portal

Chính sách điều phối agent cho toàn bộ dự án, do chủ dự án thiết lập ngày 2026-11-17. Áp dụng mặc định cho mọi nhiệm vụ từ đây, thay cho việc huy động nhiều agent theo thói quen trước đó.

## 1. Nguyên tắc cốt lõi

**ONE TASK, ONE PRIMARY OWNER.** Mặc định chỉ giao một agent chịu trách nhiệm chính cho mỗi nhiệm vụ.

Chỉ bổ sung agent khác khi có lý do rõ ràng:
- Cần chuyên môn agent chính không đáp ứng được.
- Cần review độc lập vì rủi ro kỹ thuật đáng kể.
- Có việc độc lập chạy song song để rút ngắn thời gian.
- Có phụ thuộc giữa thiết kế, asset, code hoặc kiểm thử.

Không huy động nhiều agent chỉ để lấy thêm ý kiến.

## 2. Vai trò cố định

- **Mama — Orchestrator:** tiếp nhận yêu cầu, xác định phạm vi/độ phức tạp/rủi ro, chọn agent và số lượng tối thiểu phù hợp, quản lý phụ thuộc/tiến độ/kết quả, không tự mở rộng phạm vi.
- **Dev (Claude Opus) — Engineering Owner:** kiến trúc, code, sửa bug, UI implementation, gameplay, multiplayer, database, API, testing. Tự xử lý việc kỹ thuật đơn giản; chỉ yêu cầu Codex review khi rủi ro đáng kể hoặc thay đổi lớn.
- **Codex — Visual Generation & Independent Reviewer:** nguồn tạo ảnh AI chính của dự án; review code/kiến trúc/bảo mật/logic khi cần độc lập. Không mặc định review mọi việc Dev làm; không tự tạo ảnh ngoài số lượt được duyệt; khi review phải độc lập, không tự sửa code trừ khi được giao riêng.
- **Gehihi — Art Direction & UX:** định hướng thẩm mỹ/phong cách/UX, viết asset spec và prompt khi thực sự cần, kiểm tra tính đồng bộ hình ảnh sau khi chốt Art Direction. Không tự tạo ảnh AI nếu không được yêu cầu.

## 3. Quy tắc chọn số lượng agent

**Level 1 — Single agent (mặc định).** Tạo một ảnh concept, sửa bug đơn giản, viết một component UI, chỉnh CSS, viết tài liệu ngắn, thay đổi nhỏ dễ kiểm chứng. Quy trình: Mama → 1 agent → Mama kiểm tra → báo cáo. Không giao thêm reviewer.

**Level 2 — Two agents.** Thay đổi kiến trúc đáng kể, chức năng multiplayer phức tạp, logic game nguy cơ lỗi cao, UI lớn cần kiểm tra UX, chuyên môn bổ sung thật sự cần thiết. Quy trình: agent chính thực hiện → agent thứ hai review đúng phạm vi cần thiết → Mama tổng hợp. Không tự động chuyển thành review toàn hệ thống.

**Level 3 — Multi-agent.** Chỉ khi: triển khai một game hoàn chỉnh nhiều phần độc lập, tích hợp gameplay+multiplayer+asset+UI, milestone lớn nhiều chuyên môn, việc đủ lớn để chạy song song thực sự tiết kiệm thời gian. Mama chia nhiệm vụ rõ ràng, có owner/đầu ra/điều kiện hoàn thành. Không để nhiều agent cùng làm một việc hoặc ghi đè file của nhau.

## 4. Quy tắc review

Không review chỉ vì agent vừa hoàn thành nhiệm vụ. Review độc lập **bắt buộc** với: authentication/authorization/phân quyền; thanh toán hoặc dữ liệu nhạy cảm; thay đổi database có nguy cơ mất dữ liệu; multiplayer server có rủi ro gian lận/lỗi đồng bộ; thay đổi kiến trúc lớn trước khi triển khai.

Với việc khác, Mama tự đánh giá rủi ro trước khi quyết định có cần reviewer. Ưu tiên automated tests, lint, typecheck, kiểm tra trực tiếp kết quả trước khi gọi thêm agent. Không để Codex tự review sản phẩm của chính Codex khi cần đánh giá độc lập.

## 5. Quy tắc tiết kiệm quota

- Không giao 3 agent cùng phân tích một vấn đề đơn giản.
- Không tạo tài liệu dài khi chỉ cần kết luận ngắn.
- Không lặp lại review đã hoàn thành nếu không có thay đổi đáng kể.
- Không tạo ảnh thử hàng loạt khi chưa được chủ dự án duyệt.
- Không gọi agent chỉ để xác nhận lại một kết luận đã rõ.
- Không dùng dịch vụ trả phí nếu chưa được chủ dự án đồng ý.
- Nếu agent hết quota: báo cáo và chuyển sang việc độc lập khác có thể làm, không tự phát sinh chi phí.

## 6. Quyền quyết định của chủ dự án

Phải xin chủ dự án duyệt trước khi:
- Chọn hoặc thay đổi Art Direction chính thức.
- Sử dụng lượt tạo ảnh AI.
- Thay đổi phạm vi sản phẩm hoặc danh sách game.
- Phát sinh chi phí.
- Deploy production.
- Thực hiện thao tác có nguy cơ mất dữ liệu.
- Thay đổi kiến trúc nền tảng đã được phê duyệt.

Nhiệm vụ kỹ thuật thông thường trong phạm vi đã duyệt: Mama tự quyết định và thực hiện, không hỏi lại mỗi lần. Mama chỉ hỏi chủ dự án khi cần quyết định sản phẩm, phát sinh chi phí, hoặc vượt quyền hạn đã giao.

## 7. Báo cáo

Với nhiệm vụ thông thường, Mama chỉ báo cáo ngắn: đã làm gì, agent nào thực hiện, kết quả và bằng chứng kiểm tra, có vấn đề/quyết định nào cần chủ dự án xử lý không. Không gửi nhật ký dài hoặc nhiều báo cáo trùng lặp.
