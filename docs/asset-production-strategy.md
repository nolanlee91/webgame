# Asset Production Strategy — Webgame Portal

**Trạng thái:** Nghiên cứu/đề xuất. **Chưa sản xuất asset hàng loạt, chưa mua dịch vụ trả phí, chưa bắt đầu code game, chưa phê duyệt provider chính.**
Ngày: 2026-11-17 · Tổng hợp bởi Mama từ báo cáo của Gehihi, Codex, Dev (có kiểm chứng độc lập nơi làm được).

Tài liệu nguồn chi tiết của Dev: [`docs/asset-production-strategy-dev.md`](asset-production-strategy-dev.md) (339 dòng — quy trình quản lý asset, chống điểm nghẽn, ước tính asset).

Ký hiệu dùng trong tài liệu này:
- ✅ **Đã xác minh (Mama tự kiểm tra được bằng công cụ của mình)** — ví dụ: đọc trực tiếp file, mã nguồn, tài liệu.
- 🟡 **Tự báo cáo, Mama chưa xác minh độc lập được** — do nằm trong hệ thống nội bộ của bot đó (billing Google, usage dashboard...), Mama không có quyền truy cập để kiểm tra lại.
- ⚠️ **Chưa xác minh (cả bot thực hiện và Mama đều chưa có nguồn xác thực)**.

---

## 1. Gehihi — `generate_image`: model, hạn mức, cách kiểm tra quota

| Mục | Nội dung | Mức xác minh |
|---|---|---|
| Dịch vụ/model nền | Google Antigravity ACP (Google DeepMind agentic runtime), gọi Google Cloud Code PA API (`cloudcode-pa.googleapis.com`), mô hình sinh ảnh nội bộ Google (Imagen/Gemini multimodal) | 🟡 Gehihi tự báo cáo đã đọc mã nguồn driver hệ thống của mình (`antigravity-usage-limits.js`, `image-daily-cap.js`) — Mama không có quyền truy cập runtime của Gehihi để tự đọc lại các file này |
| Xác thực | OAuth tài khoản Google cá nhân (`oauth-personal`, `acp_token.json`) | 🟡 như trên |
| Hạn mức & chu kỳ reset | Quota chia theo tuần ("Gemini weekly"), hiện đã dùng **19.7%** (còn 80.3%), reset **2026-11-24T05:04:12Z**. Ngoài ra có **trần cứng cục bộ 50 ảnh/ngày** (đếm trong `image-generation-day.json`, reset 00:00 giờ máy) | 🟡 số liệu từ tool `usage_limits` nội bộ của Gehihi — Mama không gọi lại được tool đó cho tài khoản của Gehihi |
| Số ảnh tuyệt đối cho gói Free | **Không công bố** — Google quản lý theo % dung lượng chia sẻ (chung cho cả chat text và tạo ảnh), không phải số đếm cố định | ⚠️ Gehihi tự nhận "chưa xác minh được" — tức **không thể cam kết tạo hàng trăm ảnh liên tục mà chắc chắn không nghẽn quota tuần** |
| Cách kiểm tra quota còn lại | Gọi tool `usage_limits` trước/sau mỗi batch; khi chạm trần, API trả lỗi HTTP 429 | 🟡 cơ chế do Gehihi tự báo cáo, hợp lý về mặt kỹ thuật nhưng chưa có lần Mama tự quan sát lỗi 429 thật |

**Kết luận phần này:** Có cơ chế đo quota thật (không phải đoán), nhưng số liệu quota là do Gehihi tự đọc trên hệ thống của nó — Mama không kiểm chứng lại được bằng công cụ của mình. Không có gì cho thấy gói Free sẽ đủ cho hàng trăm ảnh liên tục; **khuyến nghị đo thực tế** (xem mục 7) trước khi cam kết Gehihi làm provider chính.

## 2. Codex — `image_gen__imagegen`: chi phí

| Mục | Nội dung | Mức xác minh |
|---|---|---|
| Công cụ | Built-in tool `image_gen` qua skill `imagegen` của Codex | ✅ Mama đọc trực tiếp `C:\Users\thang\.codex\skills\.system\imagegen\SKILL.md` — file tồn tại, tool có thật |
| Không cần `OPENAI_API_KEY` ở chế độ built-in | Đúng — SKILL.md ghi rõ "Does not require `OPENAI_API_KEY`" cho built-in mode (chỉ chế độ CLI fallback mới cần key) | ✅ Mama đọc được dòng này trực tiếp trong SKILL.md |
| Built-in mode miễn phí hay tính phí theo subscription/lượt gọi | **Không có câu nào trong SKILL.md xác nhận free hay paid** cho built-in mode — tài liệu chỉ nói về save-path, quy tắc dùng, không nói về billing | ⚠️ Chưa xác minh — cả Codex và Mama đọc cùng tài liệu, không tìm thấy nguồn xác thực chi phí |
| Hành động của Codex | **Không gọi thử tool**, đúng theo yêu cầu "không chắc chi phí thì dừng" | ✅ Mama xác minh: `assets/test/codex-test-icon.png` không tồn tại trên đĩa |

**Kết luận phần này:** Codex hành xử đúng — không đoán, không tự thử. Chi phí thật của `image_gen__imagegen` built-in **vẫn chưa biết**. Việc "không cần API key" ≠ "miễn phí" (đúng như Codex tự lưu ý) — có thể vẫn tính vào gói subscription theo cách nào khác không công khai trong tài liệu này.

## 3. Bảng so sánh Gehihi vs Codex (tổng hợp của Mama)

| Tiêu chí | Gehihi — `generate_image` | Codex — `image_gen__imagegen` |
|---|---|---|
| Đã tạo được ảnh PNG thật, Mama tự kiểm tra trên đĩa | ✅ Có — `assets/test/gehihi-test-icon.png`, PNG thật 1024×1024, RGB (không alpha), ~1.2MB | ❌ Chưa — file không tồn tại, Codex chủ động không thử |
| Dịch vụ/model nền | Google Imagen/Gemini multimodal qua tài khoản Google cá nhân (Free) | OpenAI image_gen (built-in, qua Codex) |
| Hạn mức xác định được | 🟡 Có số liệu cụ thể (19.7% dùng/tuần, trần cứng 50/ngày) nhưng tự báo cáo, Mama chưa xác minh lại được | ⚠️ Chưa có số liệu nào — chưa gọi thử nên chưa biết giới hạn thật |
| Chi phí xác nhận rõ ràng | 🟡 Gehihi báo "miễn phí" — hợp lý (tài khoản Google Free), nhưng Mama không truy cập được billing để xác nhận tuyệt đối | ⚠️ Hoàn toàn chưa xác nhận — SKILL.md không nói rõ |
| Hỗ trợ ảnh tham chiếu để giữ đồng bộ style | ✅ Có — tham số `ImagePaths`, tối đa 3 ảnh tham chiếu/lượt gọi | ⚠️ Chưa kiểm tra (ngoài phạm vi assignment) |
| Chất lượng ảnh test | Phong cách 3D glossy, không có nền trong suốt sẵn (cần tách nền sau nếu làm sprite) | N/A — chưa có mẫu để đánh giá |
| Tính nhất quán xuyên 18 game | Có quy trình đề xuất (style reference + checklist, xem mục 4) nhưng chưa thực thi | Chưa có đề xuất (chưa tới bước này) |
| Phương án dự phòng nếu provider này nghẽn/không dùng được | → Codex (nếu xác minh được chi phí) → ảnh CC0 miễn phí (Kenney) → vẽ bằng code → lùi ngày ra mắt game đó (đề xuất của Dev) | Là chính phương án dự phòng của Gehihi, nhưng bản thân nó cũng chưa được xác minh để làm provider chính thức |

**Nhận định của Mama:** Hiện tại chỉ Gehihi có **bằng chứng thực thi** (ảnh thật đã tạo ra, quota đo được dù chưa xác minh chéo). Codex có công cụ tương đương về lý thuyết nhưng đang ở trạng thái "chưa biết chi phí" — không phải "không làm được". Hai trạng thái này khác nhau và không nên gộp chung.

## 4. Quy trình giữ đồng bộ đồ họa xuyên suốt 18 game (đề xuất của Gehihi)

1. **Bộ ảnh neo (Anchor Set) — 3 ảnh mẫu chuẩn**, lưu tại `assets/style-guide/`:
   - Anchor 1 (Game icon): đã có mẫu thử `gehihi-test-icon.png` (3D glossy, neon violet/cyan/gold).
   - Anchor 2 (Nhân vật linh vật cho SpeakUp Kids / Webgame Portal) — **chưa tạo**.
   - Anchor 3 (Khung UI / viền thẻ game) — **chưa tạo**.
   - Mama + chủ dự án duyệt 3 ảnh anchor này làm chuẩn thẩm mỹ duy nhất trước khi sản xuất đại trà.
2. **Dùng ảnh tham chiếu cho mọi lượt tạo tiếp theo**: gắn đường dẫn ảnh anchor vào tham số `ImagePaths` (đã ✅ xác minh tool hỗ trợ) kèm prompt chuẩn hóa mẫu:
   `"[Tên asset] in the exact 3D playful glossy arcade art style, neon lighting, and color harmony as reference image [Path], clean dark/transparent background, 512x512"`.
3. **Sản xuất theo lô nhỏ (batch 3–5 ảnh)**, sau mỗi lô gọi `usage_limits` kiểm tra % quota đã dùng — không sinh hàng loạt tự động.
4. **Checklist kiểm tra nhất quán (4 tiêu chí)**: bảng màu neon cố định, chất liệu glossy 3D, góc nhìn thống nhất (isometric/15°), vùng an toàn 80% tâm ảnh. Gehihi tự chấm → Mama duyệt đạt/chưa đạt → lưu vào `assets/`.

*(Trạng thái: đề xuất, chưa thực thi. 2/3 ảnh anchor chưa tồn tại.)*

## 5. Quy trình quản lý asset độc lập công cụ tạo ảnh (đề xuất của Dev)

Chi tiết đầy đủ ở [`docs/asset-production-strategy-dev.md`](asset-production-strategy-dev.md). Tóm tắt:

- Phong cách không gắn với một công cụ cụ thể: nằm trong style guide (Gehihi giữ) + 4–6 ảnh tham chiếu đã duyệt + prompt library + một bước xử lý hậu kỳ bằng code (tách nền, cắt viền, resize, nén, đóng sprite sheet) để ảnh từ nhiều provider trông đồng đều.
- **Asset manifest**: mỗi game một file liệt kê từng ảnh — mã riêng, trạng thái, provider đã tạo, prompt + phiên bản, license, lịch sử sửa. Code game chỉ gọi ảnh qua mã này, không biết ảnh do ai tạo → **đổi provider không cần sửa code**.
- Kích thước, điểm neo, vùng va chạm quy định trước cho từng loại asset, để thay ảnh không ảnh hưởng gameplay.
- Sửa ảnh → lưu bản mới (versioning), không ghi đè bản cũ.
- Đổi provider theo **trọn một bộ** (ví dụ cả 36 ô Nối Thú), không đổi giữa bộ đang làm dở; bộ đã duyệt vẫn dùng tiếp được.
- **Không để chữ trong ảnh AI** — chữ tiếng Việt có dấu hiển thị bằng code/font, tránh lỗi font tiếng Việt từ AI.
- Sprite sheet chỉ dùng khi >10 ảnh nhỏ/màn, có animation theo frame, hoặc có bộ ô lát.

## 6. Quy trình chống điểm nghẽn khi hết quota (đề xuất của Dev)

- Liệt kê trước toàn bộ ảnh cần có + kích thước — danh sách này cũng là đơn đặt hàng gửi Gehihi.
- Trong lúc chờ asset thật: dùng ảnh tạm sinh bằng code (đúng kích thước/vùng va chạm) hoặc ảnh CC0 miễn phí (Kenney — 🟡 Dev xác nhận license CC0 dùng thương mại được, nhưng chưa tự kiểm tra lại trang Kenney lần gần nhất do trang lỗi).
- **Tách 2 mốc rõ ràng**: "Xong code" (game chạy được với ảnh tạm) ≠ "Xong asset" (điều kiện để mở game cho công chúng) — asset chậm không chặn code.
- **Thứ tự dự phòng provider**: Gehihi → Codex (nếu xác minh được chi phí) → ảnh CC0 (Kenney) → vẽ bằng code → nếu vẫn thiếu, chỉ lùi ngày mở của **đúng game đó**, không lùi toàn dự án.
- **Đo quota bằng thực nghiệm**: cho Gehihi tạo thử 20–30 ảnh thật của một bộ, ghi log mỗi lần tạo — để có số liệu thật thay vì ước tính 80.3% còn lại có đủ dùng hay không.

## 7. Ước tính nhu cầu asset cho 18 game (đề xuất của Dev — có ghi rõ phần giả định)

| Nhóm | Ảnh cần AI tạo | Có thể làm bằng code / tái dùng hợp pháp |
|---|---|---|
| Nền (background) | 32–59 ảnh (riêng game Tìm Điểm Khác Biệt: 20–30) | Lưới, gradient, họa tiết lặp bằng CSS/code |
| Nhân vật | 6–10 ảnh | Đổi màu bằng code (4 nhân vật Đặt Bom, 4 ngựa cờ), avatar sinh bằng code |
| Vật phẩm | 96–140 ảnh (Nối Thú 36, Nông Trại 27–34) | Quân cờ, ô số, gạch, bóng màu, xúc xắc — code/vector |
| UI | 18 thumbnail game + 3–31 ảnh chung cho portal | Toàn bộ nút, khung, icon, font |
| Animation | 16–23 frame | Phần lớn làm bằng hiệu ứng chuyển động trong code, không cần AI |

- **Tổng ước tính ~170–280 ảnh AI**, tương đương **~350–1.100 lượt gọi tạo ảnh** (giả định 2–4 lượt/ảnh để chọn bản tốt).
- Giai đoạn vật phẩm chiếm ~60% nhu cầu (102–146 ảnh) → nên bắt đầu tạo ảnh sớm nhất cho Tìm Điểm, Nông Trại, Nối Thú.
- 6 game cần tối đa 2 ảnh AI: Caro, Nối Từ, Cờ Tướng, Xếp Gạch, Sudoku, 2048 bản số.
- Nếu thu hẹp về 15 game: giảm 62–86 ảnh AI cần tạo.
- **Toàn bộ bảng này là giả định** (⚠️ theo Dev tự đánh giá) — chưa có số liệu thực tế từ sản xuất thử.

## 8. Giấy phép asset đã kiểm tra (bổ sung từ Dev, ngoài phạm vi 7 câu hỏi gốc nhưng liên quan)

| Nguồn | License | Trạng thái xác minh |
|---|---|---|
| Kenney (free asset pack) | CC0 — dùng thương mại được | 🟡 Dev đọc trang hỗ trợ Kenney; lần kiểm gần nhất trang lỗi, chưa xác minh lại |
| game-icons.net | Phần lớn CC BY 3.0 — **cần trang ghi công tác giả** trên portal | 🟡 Dev tự kiểm, Mama chưa đọc lại nguồn |
| Lucide icons | ISC | ✅ license phổ biến, không tranh chấp |
| Be Vietnam Pro, Nunito (font) | OFL | ✅ license phổ biến |
| free-tex-packer-core | MIT | ✅ license phổ biến |
| sharp (xử lý ảnh) | Apache-2.0 | ✅ license phổ biến |

## 9. Tổng hợp những gì CHƯA xác minh (không được bỏ qua trước khi quyết định)

- ⚠️ Quota tuyệt đối của gói Google Free cho `generate_image` khi tạo hàng trăm ảnh liên tục — không có số công bố, chỉ có % dùng hiện tại.
- ⚠️ Chi phí thật của `image_gen__imagegen` built-in mode — tài liệu không nói rõ free hay tính vào subscription theo cách nào.
- ⚠️ Codex có thực sự tạo được ảnh thật không — chưa thử (vì chưa rõ chi phí).
- ⚠️ Quyền dùng thương mại của ảnh AI tạo ra từ tài khoản Free của từng provider (Google, OpenAI) — khác với quyền dùng miễn phí Kenney/game-icons.net, cần tra riêng trước khi chốt bất kỳ ảnh AI nào là bản cuối.
- ⚠️ Cách tạo 2 ảnh "khác nhau đúng vài chỗ" cho game Tìm Điểm Khác Biệt bằng AI — chưa có cách làm được xác nhận, cần thử nghiệm trên 1–2 màn trước.
- ⚠️ Toàn bộ bảng ước tính 170–280 ảnh ở mục 7 là giả định, chưa có số liệu sản xuất thật.
- 🟡 License Kenney/game-icons.net — đã đọc nhưng chưa xác minh lại gần nhất.

## 10. Quyết định cần chủ dự án duyệt

1. Có đồng ý cho Gehihi **thử sản xuất thật 20–30 ảnh** của một bộ (vd. Nối Thú) để đo quota thực tế trước khi giao sản xuất toàn bộ không?
2. Có muốn làm rõ chi phí `image_gen__imagegen` bằng cách khác (hỏi nhà cung cấp Codex, hoặc chấp nhận rủi ro gọi thử 1 lần có giới hạn) hay tạm gác Codex lại?
3. Chấp nhận Gehihi là provider chính (duy nhất đã có bằng chứng thật) với rủi ro quota chưa có trần tuyệt đối, hay muốn chờ xác minh thêm?
4. Duyệt 3 ảnh "anchor" (style reference) do Gehihi đề xuất trước khi sản xuất đại trà?
5. Duyệt thứ tự dự phòng: Gehihi → Codex (nếu rõ chi phí) → Kenney CC0 → code?
6. Có cần tư vấn pháp lý riêng cho quyền thương mại của ảnh AI tạo từ tài khoản Free (Google/OpenAI) không, trước khi dùng ảnh đó public?

---
*Nguồn: báo cáo Gehihi (assignment 58bbe9e2), Codex (assignment addac68e), Dev (assignment 189db89b + docs/asset-production-strategy-dev.md) — tổng hợp và kiểm chứng chéo bởi Mama, 2026-11-17.*
