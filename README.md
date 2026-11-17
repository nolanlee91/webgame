# Webgame Portal

Cổng webgame miễn phí bằng tiếng Việt cho thị trường Việt Nam, kết hợp single-player và multiplayer.

## Mục tiêu sản phẩm
- Chơi ngay, tạo phòng, mời bạn bè, tham gia phòng công khai; đấu xếp hạng (giai đoạn sau).
- Có vị trí quảng cáo SpeakUp Kids để chuyển traffic sang sản phẩm học tiếng Anh cho trẻ em.
- Kiến trúc mở rộng được nhiều game, responsive, tối ưu SEO và hiệu năng.

## Team
| Vai trò | Bot | Model |
|---|---|---|
| Product Manager / Chief | Mama | Sonnet 5 |
| UX/UI Designer | Gehihi | Gemini |
| Technical Lead / Developer | Dev | Opus 5.5 |
| Independent Code Reviewer | Codex | GPT-6.1-Sol |

## Quy tắc làm việc
- Dùng chung project folder, không sửa cùng file đồng thời.
- Mọi thay đổi source phải được Git theo dõi (commit rõ ràng).
- Không tự deploy production hoặc dùng dịch vụ trả phí.
- Không bắt đầu lập trình sản phẩm khi kiến trúc và MVP chưa được chủ dự án phê duyệt.

## Trạng thái
Đang ở giai đoạn phân tích yêu cầu / đề xuất kiến trúc. Chưa có code sản phẩm.

## Chạy thử / đưa lên Railway
Repo có server tĩnh không cần gói ngoài: `server.js` phục vụ thư mục `prototype/`, mở `/` sẽ chuyển sang trang chủ `/homepage/`;
game nằm ở `/games/<id>/` nên các link "Chơi ngay" và "← Trang chủ" giữ nguyên.
- Chạy máy mình: `npm start` (mặc định http://localhost:8080, đổi bằng biến `PORT`).
- Railway: tạo service từ repo GitHub này. Railway tự nhận `package.json` (Node ≥ 18) và chạy `node server.js` theo `railway.json`,
  kiểm tra sống ở `/healthz`, cổng lấy từ biến `PORT` Railway cấp. Bấm "Generate Domain" để có link test.
