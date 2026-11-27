# Lan truyền và thi đấu: phân tích tổng thể

Trạng thái: **phân tích để chủ dự án chọn hướng, chưa chốt, chưa code.** Ngày viết: 27/11/2026.
Bối cảnh: nhận xét của GPT về Thử thách hôm nay (3 game Sudoku, 2048, Đố Vui) và đề xuất "kèo chữ" hằng ngày. Tài liệu này nhìn rộng hơn: cả 25 game hiện có.

## 1. Cổng đang có gì

| Mảng | Hiện trạng |
|---|---|
| Game | **25 game**: 10 game online có phòng, 4 game tiệm "Tập Làm Chủ", 11 game chơi một mình |
| Rủ bạn | Phòng có mã và link. Từ Đợt 8 phòng mặc định công khai, có tuỳ chọn "Phòng kín". Sảnh chờ trực tiếp trên trang chủ |
| Khoe | `share.js` làm thẻ 1080×1080 rồi chia sẻ qua Facebook, Messenger, Zalo (chép link). **17/25 game** có nút "Khoe kết quả" |
| Thử thách | 3 game, cùng đề cho mọi người mỗi ngày, có chuỗi ngày. Bảng xếp hạng toàn quốc qua Supabase, máy chủ kiểm lại bằng chứng |
| Danh tính | Khách ẩn danh (Supabase anonymous). Đăng nhập Google đã code xong nhưng **chưa bật** |
| Đo đếm | **Không có.** Link chia sẻ gắn `?ref=share` nhưng không ai ghi lại |

## 2. Hai câu hỏi cần trả lời cho từng game

**Lan truyền** (có tạo lý do gửi link cho người khác không):
- **Rủ chơi cùng:** game cần người thứ hai, nên mỗi ván là một lần gửi link. Đây là vòng lan mạnh nhất, vì người nhận phải mở link mới chơi được.
- **Thách cùng đề:** "Mình được 1.240 điểm ở màn này, bạn thử xem". Người nhận chơi **đúng màn đó**. Không cần hai người online cùng lúc.
- **Khoe:** thẻ kết quả đẹp, nhưng người xem chỉ "thả tim", ít khi bấm vào chơi.

**Thi đấu** (xếp hạng có công bằng không):
- **Đối kháng trực tiếp** (cờ): máy chủ là trọng tài, công bằng. Chỉ sợ một người dùng hai tài khoản để cày.
- **Cùng đề, máy chủ chấm lại** (thử thách hiện tại): công bằng nếu đề không giải được bằng máy và đáp án không lan được.
- **Điểm cao do máy người chơi tự tính** (Rắn, Xếp Gạch…): **sửa được điểm**. Chỉ hợp bảng bạn bè, không hợp bảng toàn quốc.

## 3. Chấm từng game

Thang 1–5. **Rủ** = rủ chơi cùng; **Thách** = hợp thách cùng đề; **Đấu** = xếp hạng công bằng được; **Ngày** = hợp thói quen hằng ngày (ngắn, có đề mới); **Việt** = bản sắc Việt.

| Game | Rủ | Thách | Đấu | Ngày | Việt | Vai trò đề xuất |
|---|---|---|---|---|---|---|
| Cờ Cá Ngựa | 5 | 1 | 2 (may rủi) | 2 | 4 | Rủ nhóm chủ lực |
| Cờ Tỷ Phú | 5 | 1 | 2 | 1 | 4 | Rủ nhóm (ván dài) |
| Ô Ăn Quan | 4 | 3 | 4 | 3 | 5 | Đối kháng bản sắc. Có thể thêm "thế cờ ngày" |
| Cờ Caro | 4 | 2 | 4 | 2 | 3 | Thang thắng tuần |
| Cờ Tướng | 4 | 4 (giải thế cờ) | 5 | 3 | 4 | Thang tuần + thế cờ hằng ngày |
| Cờ Vua | 3 | 4 | 5 | 3 | 1 | Thang tuần |
| Nối Từ | 4 | 4 | 4 | 4 | 5 | **Nền cho kèo chữ** |
| Đặt Bom | 4 | 1 | 3 | 1 | 2 | Rủ chơi cùng |
| Ma Sói, Nội Gián | 5 (khi đủ 6–8 người) | 1 | 1 | 1 | 3 | Game hội nhóm, chờ đông người |
| Đố Vui | 2 | 3 | 2 (lộ đáp án) | 4 | 4 | Thói quen. Không nên xếp hạng |
| Sudoku | 1 | 3 | 2 (máy giải) | 3 | 1 | Giữ đề ngày, bỏ bảng |
| 2048 | 1 | 4 | 3 | 3 | 1 | Thách cùng đề |
| Đào Vàng | 2 | 5 | 2 (điểm do máy người chơi tính) | 4 | 2 | **Thách cùng màn** |
| Rắn, Xếp Gạch, Bắn Bóng, Ghép Kẹo, Nối Thú, Đua Xe | 1 | 4 | 2 | 3 | 1–2 | Thách cùng màn, bảng bạn bè |
| Thám Tử Hẻm | 2 | 2 | 2 | 2 (theo vụ) | 5 | Khoe "phá án". Vụ mới là sự kiện |
| 4 game tiệm | 2 | 2 | 1 | 3 | 5 | Khoe tiệm + huy hiệu, **không bảng** |

Ba điều rút ra:
1. **Vòng "rủ chơi cùng" đã có và mạnh**, nhưng chỉ chạy khi người chơi đã có bạn sẵn sàng chơi. Phần lớn người chơi game đối kháng đang đấu với máy, và những ván đó **không tạo lần gửi link nào**.
2. **Vòng "thách cùng màn" hợp với 11 game chơi một mình nhưng cổng chưa có.** Cổng ít người thì đây là vòng hợp nhất, vì người nhận chơi lúc nào cũng được, không cần ai online.
3. **Thi đấu toàn quốc chỉ đáng tin ở hai chỗ:** đối kháng trực tiếp (cần đăng nhập để chống cày) và đề ngày có máy chủ chấm lại. Mọi bảng còn lại nên là **bảng bạn bè hoặc bảng nhóm**.

## 4. Ba hướng tổng thể

### Hướng A: "Cổng rủ bạn" (ưu tiên chơi cùng)
- Ván đấu máy xong hiện nút **"Thách bạn ván này"**: tạo Phòng kín và chia sẻ link ngay.
- Thang thắng tuần cho cờ (cần Google login).
- Thử thách hằng ngày giữ ở mức tối thiểu.
- **Mạnh:** dựa vào thứ cổng làm tốt nhất. **Yếu:** cần bạn bè online cùng lúc, cổng ít người thì phòng chờ lâu.

### Hướng B: "Kèo chữ hằng ngày" (theo GPT)
- Một kèo chữ tiếng Việt mỗi ngày, thẻ khoe không lộ đáp án, bảng nhóm theo link.
- **Mạnh:** bản sắc riêng, thói quen kiểu Wordle. **Yếu:** đặt hết vào **một trò chưa biết có vui không**. Làm từ điển và đề hay cho trẻ em không dễ (từ ghép lạ làm trẻ bí).

### Hướng C: Ba tầng, dùng lại game sẵn có (khuyên)
1. **Thách cùng màn cho mọi game chơi một mình.**
   - Hết ván thì "Khoe" có thêm **link chứa mã màn và điểm**. Người nhận mở ra chơi đúng màn đó, hết ván thấy "Bạn 980 – Minh 1.240".
   - Không cần đông người, không cần tài khoản. Có gian lận cũng chỉ trong nhóm bạn.
   - Phần lớn game đã sinh màn theo hạt giống (Thử thách hằng ngày đã làm như vậy cho 2048, Sudoku).
2. **Một "Kèo ngày" duy nhất,** chọn sau khi thử:
   - **2a.** Kèo chữ (dựng bản thử trước, cho trẻ chơi);
   - **2b.** Hoặc xoay vòng game có sẵn với cùng màn cho mọi người. Ví dụ thứ Hai Đào Vàng, thứ Ba thế cờ Tướng, thứ Tư 2048… Mỗi ngày giới thiệu một góc của cổng.

   Bảng xếp hạng của kèo ngày: **bảng nhóm theo link + "bạn hơn X% hôm nay"**, đặt lại hằng tuần.
3. **Rủ chơi cùng:**
   - thêm nút "Thách bạn ván này" sau mỗi ván đấu máy;
   - thang thắng tuần chỉ làm **sau khi bật Google login**.

**Game tiệm:** giữ khoe tiệm và huy hiệu theo mốc, không xếp hạng (đồng ý với GPT).

## 5. Việc phải làm trước mọi hướng: đo đếm

Không đo thì không biết hướng nào lan. Đề xuất **đếm ở máy chủ, không dùng công cụ bên ngoài** (vì có trẻ em, không gắn Google Analytics):
- đếm theo ngày, chỉ số tổng, không lưu IP, không lưu danh tính;
- các sự kiện:
  - bấm "Khoe" / "Thách bạn";
  - lượt mở link có `?ref=share` hoặc link thách;
  - phòng được tạo, phòng có người vào bằng link;
  - lượt nộp kết quả Thử thách mỗi game;
- trang `/admin` đơn giản (có mật khẩu trong biến môi trường Railway) để chủ dự án xem.

Công sức: khoảng nửa đợt agent. Nên làm ngay, để 2–3 tuần sau có số liệu trước khi chốt Kèo ngày.

## 6. Rủi ro và ràng buộc

- **Trẻ em:**
  - bảng nhóm hiện tên người chơi, nên dùng tên khách sinh sẵn hoặc tên đã qua bộ lọc (đã có);
  - link nhóm không hiện thông tin cá nhân nào khác;
  - không có chat trong bảng nhóm.
- **Ít người:** mọi bảng phải trông ổn với 2–5 cái tên. Đó là lý do ưu tiên bảng nhóm và phần trăm.
- **Gian lận:** chấp nhận được ở bảng bạn bè. Bảng toàn cổng chỉ dành cho đề máy chủ chấm lại được.
- **Công sức:** hướng C tầng 1 phải sửa 11 game chơi một mình, mỗi game một ít (nhận mã màn từ link, màn kết thúc so điểm). Làm theo lô 3–4 game mỗi đợt.

## 7. Lộ trình đề xuất (nếu chọn hướng C)

| Đợt | Việc | Cần quyết trước |
|---|---|---|
| 1 | Đo đếm + "Thách cùng màn" cho 3 game thử (Đào Vàng, 2048, Rắn) | Có đồng ý đếm phía máy chủ không |
| 2 | Bản thử kèo chữ + bản thử xoay vòng; chủ dự án cho trẻ chơi | Thể lệ kèo chữ |
| 3 | Kèo ngày chính thức + bảng nhóm theo link; bỏ bảng toàn quốc cũ | Chọn 2a hay 2b theo số liệu và phản hồi |
| 4 | "Thách bạn ván này" cho game đối kháng; thách cùng màn cho các game còn lại | — |
| Sau | Thang thắng tuần cho cờ | Bật Google login |

## 8. Câu hỏi cho chủ dự án

1. Chọn hướng A, B hay C (khuyên C)?
2. Có làm đo đếm phía máy chủ trước không (khuyên có)?
3. Kèo ngày: làm bản thử kèo chữ, xoay vòng game có sẵn, hay cả hai?
4. Có ai (trẻ em trong nhà, lớp học quen) để chơi thử bản thử không?
