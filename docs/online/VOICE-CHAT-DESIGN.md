# Voice chat trong phòng online: bản thiết kế (chưa làm)

Trạng thái: **bản thiết kế để chủ dự án duyệt, chưa code.** Ngày viết: 26/11/2026.

## 1. Tóm tắt

- Cho người chơi **cùng một Phòng kín** nói chuyện bằng micro trong lúc chơi.
- Giai đoạn 1 chỉ làm thử ở **Cờ Tỷ Phú và Cờ Cá Ngựa**, phòng 2–5 người.
- Âm thanh đi **thẳng giữa các trình duyệt (WebRTC P2P)**. Máy chủ Railway chỉ chuyển vài tin nhắn bắt tay qua kết nối WebSocket sẵn có, gần như không tốn băng thông.
- Mạng nào không nối thẳng được (hay gặp trên 4G) thì đi vòng qua **TURN của Cloudflare**: miễn phí 1.000 GB/tháng, quá thì 0,05 USD/GB.
  - Ước tính giai đoạn 1 nằm trong hạn mức miễn phí.
  - Vẫn đặt trần chi phí cứng: chạm trần thì voice chỉ còn chạy P2P, không tốn thêm.
- **An toàn trẻ em là ràng buộc số 1:**
  - không bật voice ở phòng công khai;
  - tắt sẵn, mặc định "giữ để nói";
  - tắt tiếng từng người được;
  - không ghi âm.

## 2. Phạm vi giai đoạn 1

| Có | Không (để sau) |
|---|---|
| Phòng kín (vào bằng mã), 2–5 người | Phòng công khai |
| Cờ Tỷ Phú, Cờ Cá Ngựa | Ma Sói, Nội Gián (6–8 người, cần tắt micro theo pha) |
| Bật/tắt micro, "giữ để nói", tắt tiếng từng người, âm lượng | Ghi âm, lọc giọng, chuyển giọng nói thành chữ |
| Vòng sáng quanh tên người đang nói | Video |
| Tự ngắt khi rời phòng hoặc hết ván rồi giải tán | Voice giữa người lạ ở sảnh chờ |

## 3. Kiến trúc

```
Trình duyệt A ──(âm thanh WebRTC, mã hoá DTLS-SRTP)── Trình duyệt B      ← đường chính, P2P
      │                                                      │
      └──── WebSocket sẵn có của game (tin bắt tay) ──── Máy chủ Railway
      │                                                      │
      └────────── TURN Cloudflare (chỉ khi P2P hỏng) ────────┘
```

### 3.1 Tin bắt tay (signaling) qua WebSocket của game

Dùng luôn kết nối `ws.js` của từng game, thêm các loại tin:

| Tin | Hướng | Nội dung |
|---|---|---|
| `{t:"voice", on:true/false}` | khách → máy chủ | Bật/tắt tham gia voice |
| `{t:"voiceRoster", ids:[…]}` | máy chủ → phòng | Danh sách người đang bật voice |
| `{t:"rtc", to, kind:"offer"/"answer"/"ice", data}` | khách → máy chủ → 1 khách | Máy chủ chỉ chuyển tiếp, không đọc |
| `{t:"voiceState", id, speaking, muted}` | khách → phòng | Hiển thị ai đang nói |

Luật phía máy chủ:
- chỉ chuyển `rtc` giữa hai người **cùng phòng**, khi phòng là **Phòng kín** và cả hai đã bật voice;
- giới hạn cỡ tin (8 KB) và tần suất (30 tin/giây mỗi người);
- người rời phòng hoặc mất kết nối (heartbeat 15 s) thì máy chủ báo cả phòng để đóng kết nối với người đó.

Phần dùng chung đặt ở `games-server/voice.js`, giống cách `rematch.js` đang dùng chung cho các game cờ.

### 3.2 Nối P2P kiểu lưới (mesh)

- Mỗi người nối thẳng tới từng người còn lại. Phòng 5 người thì mỗi máy giữ 4 kết nối, gửi 4 luồng và nhận 4 luồng.
- Mã hoá tiếng Opus khoảng 32 kbps (đủ cho giọng nói), có chế độ tạm ngừng gửi khi im lặng (DTX). Mỗi máy tốn khoảng 130 kbps lên và 130 kbps xuống, ổn với 4G.
- **Trần 5 người.** Trên 5 thì điện thoại nóng máy và mạng lên yếu, phải chuyển sang máy chủ trung chuyển (SFU, xem mục 8).

### 3.3 STUN / TURN

- **STUN** (giúp hai máy tìm đường nối thẳng): Cloudflare, miễn phí, không giới hạn.
- **TURN** (trung chuyển khi không nối thẳng được): Cloudflare Realtime TURN.
  - Máy chủ cấp thông tin đăng nhập TURN **ngắn hạn (1 giờ)** qua `GET /api/turn`, có giới hạn tần suất theo IP bằng `client-ip.js`.
  - Khoá API Cloudflare chỉ nằm trong biến môi trường Railway, **không bao giờ gửi xuống trình duyệt hay commit**.
- **Không tự chạy TURN trên Railway:**
  - Railway chỉ mở công khai được TCP (TCP Proxy), không có UDP công khai. TURN chạy qua TCP vẫn được nhưng chậm.
  - Egress Railway (0,05 USD/GB) cũng không rẻ hơn Cloudflare, mà Cloudflare có 1.000 GB miễn phí.

## 4. Chi phí ước tính

Giả định như bản GPT tư vấn: 100 phòng/ngày, mỗi phòng 4 người, 2 giờ voice/ngày.

| Khoản | Cách tính | Mỗi tháng |
|---|---|---|
| Railway (tin bắt tay) | vài KB mỗi người mỗi phiên | ≈ 0 |
| Cloudflare STUN | miễn phí | 0 |
| Cloudflare TURN | giả định 25% người phải đi vòng qua TURN. Mỗi người đó nhận ~96 kbps (≈ 43 MB/giờ), và luồng họ gửi lên cũng được Cloudflare phát lại cho người khác ⇒ nhân khoảng 2 | **≈ 250–550 GB ⇒ 0 USD** (dưới 1.000 GB miễn phí) |
| Nếu tăng gấp 4 (400 phòng/ngày) | ≈ 1.000–2.200 GB | ≈ 0–60 USD |

So sánh: nếu cho toàn bộ âm thanh qua máy chủ Railway như phương án B của GPT thì khoảng 1.550 GB, tức khoảng 78 USD/tháng, chưa kể CPU.

**Trần chi phí:**
- Máy chủ đếm số phút voice có dùng TURN (ước theo thời lượng) và đặt trần tháng, ví dụ 900 GB.
- Chạm trần thì `/api/turn` ngừng cấp: voice chỉ còn P2P, ai không nối được sẽ thấy "Mạng của bạn chưa nối voice được".
- Cảnh báo khi đạt 70%.

Lưu ý: giá và hạn mức Cloudflare cần kiểm lại lúc triển khai. Cloudflare cũng đang chờ cài theo kế hoạch cũ, nên có thể làm chung một đợt.

## 5. An toàn và kiểm duyệt

Chat chữ có bộ lọc (`moderation.js`), còn tiếng nói thì **không lọc được và không có bằng chứng**. Vì vậy:

1. **Chỉ Phòng kín.** Phòng công khai không hiện nút micro. Phòng kín là phòng bạn bè chia mã cho nhau, giảm hẳn rủi ro người lạ.
2. **Tắt sẵn, phải tự bật.** Lần đầu bật sẽ có hộp hỏi ngắn: "Mọi người trong phòng sẽ nghe tiếng bạn. Đừng nói số điện thoại, địa chỉ. Gặp người nói bậy thì bấm tắt tiếng họ." Trình duyệt sẽ xin quyền micro sau khi bấm Đồng ý.
3. **Mặc định "Giữ để nói"** (giữ nút micro). Có thể chuyển sang "Mic mở" trong cài đặt.
4. **Tắt tiếng từng người** (chỉ phía mình nghe), nằm ngay trên tên người đó.
5. **Chủ phòng tắt micro người khác** cho cả phòng, và vẫn mời ra như hiện tại (không mời ra giữa ván, theo quyết định cũ).
6. **Báo cáo:** nút Báo cáo ghi lại phòng, thời điểm và tên người. **Không ghi âm**, chỉ dùng để phát hiện người bị báo nhiều lần.
7. **Có thể bắt đăng nhập Google mới được bật micro** (cần chủ dự án quyết, xem mục 9). Như vậy người bị báo nhiều lần có thể bị khoá voice theo tài khoản.
8. **Pháp lý:** cần người nắm luật kiểm quy định Việt Nam về trò chơi điện tử trên mạng và tương tác giữa người chơi (nhất là với người dưới 18 tuổi) trước khi mở voice cho phòng công khai. Giai đoạn 1 chỉ Phòng kín.

## 6. Giao diện

- **Nút micro** trên thanh phòng, ≥ 44×44 px, có 3 trạng thái: tắt, giữ để nói, đang mở. Ai chưa bật voice thì thấy "🎤 Bật nói chuyện".
- **Vòng sáng** quanh ô tên người đang nói, đo bằng `AnalyserNode` ở phía mình. Có thêm biểu tượng loa gạch chéo cho người bị tắt tiếng.
- **Bảng voice**: chạm vào tên để tắt tiếng hoặc chỉnh âm lượng người đó.
- **Hạ nhạc game:** khi có người nói, nhạc nền game giảm khoảng 50%, sau đó tăng lại.
- Màn xoay ngang và màn 320 px phải chừa chỗ cho nút micro mà không đè bàn cờ. Chụp kiểm như các đợt trước.

## 7. Phía trình duyệt

- Module dùng chung `prototype/games/_shared/voice.js`, gắn qua `online-kit.js`. Mỗi game chỉ cần gọi `voice.attach(ws, room)`.
- `getUserMedia({audio: {echoCancellation: true, noiseSuppression: true, autoGainControl: true}})`. Chỉ gọi sau khi người dùng bấm (Safari bắt buộc như vậy).
- **iOS Safari:**
  - thẻ `<audio playsinline autoplay>` cho từng người, mở khoá âm thanh ở lần chạm đầu;
  - xin quyền micro sẽ làm âm thanh game đổi sang chế độ gọi điện, cần thử trên máy thật xem nhạc game có bị nhỏ hoặc méo không.
- **Mất mạng / kết nối lại:** khi WebSocket nối lại (đang có resume), gửi lại `voice on` và làm lại bắt tay (ICE restart).
- **Chuyển tab / khoá màn hình:** giữ kết nối, tắt micro nếu đang ở chế độ giữ để nói.
- Tôn trọng khoá tắt tiếng chung `wgp.muted`: tắt tiếng game thì vẫn nghe voice, nhưng có nút riêng để tắt voice.

## 8. Giai đoạn 2 (nếu giai đoạn 1 có người dùng)

- **Ma Sói / Nội Gián (6–8 người):** dùng máy chủ trung chuyển Cloudflare Realtime SFU, chung hạn mức 1.000 GB miễn phí với TURN, thay cho P2P lưới.
- **Tắt micro theo luật chơi:** máy chủ quyết ai được nói. Ví dụ ban đêm chỉ Sói nói với nhau, người chết chỉ nghe.
- Mở cho phòng công khai chỉ sau khi đã kiểm pháp lý, có đăng nhập bắt buộc và có số liệu báo cáo vi phạm ở giai đoạn 1.

## 9. Việc cần chủ dự án quyết trước khi làm

1. Có bắt **đăng nhập Google** mới được bật micro không? (Khuyên: có. Google login phải bật trong Supabase trước.)
2. Mặc định **"Giữ để nói"** hay **"Mic mở"**? (Khuyên: giữ để nói.)
3. Cài **Cloudflare** chung đợt này (DNS và TURN) hay chỉ tạo tài khoản Realtime TURN riêng?
4. Trần chi phí TURN mỗi tháng (khuyên 900 GB, tức vẫn trong hạn mức miễn phí).
5. Ai kiểm phần pháp lý (mục 5.8)?

## 10. Kiểm thử

- **Unit (máy chủ):**
  - chỉ chuyển `rtc` trong cùng phòng và chỉ ở Phòng kín;
  - giới hạn cỡ và tần suất tin;
  - rời phòng thì cả phòng nhận `voiceRoster` mới;
  - `/api/turn` có giới hạn tần suất và ngừng cấp khi chạm trần.
- **E2E:** Chrome headless với `--use-fake-device-for-media-stream --use-fake-ui-for-media-stream`. Hai hoặc ba tab vào cùng Phòng kín, bật voice, kiểm `RTCPeerConnection` đạt trạng thái `connected` và có gói tin âm thanh đến (`getStats`).
- **Máy thật (bắt buộc trước khi push):**
  - iPhone Safari, Android Chrome;
  - Wi-Fi, 4G Viettel / Mobifone / Vinaphone (đo tỉ lệ phải đi vòng TURN);
  - 15 phút chơi liên tục để kiểm nóng máy, hao pin và tiếng vọng khi có nhạc game.

## 11. Công sức ước tính

| Phần | Ước tính |
|---|---|
| Máy chủ: `voice.js`, chuyển tin, `/api/turn`, trần chi phí, test | 1 đợt agent |
| Trình duyệt: `_shared/voice.js`, giao diện micro, gắn vào Tỷ Phú + Cá Ngựa, e2e | 1–2 đợt agent |
| Thử máy thật, chỉnh iOS | chủ dự án cùng dev, 1–2 buổi |

## Nguồn

- Cloudflare Realtime TURN, giá và hạn mức miễn phí: https://developers.cloudflare.com/realtime/turn/faq/ , https://developers.cloudflare.com/realtime/pricing/
- Metered (phương án dự phòng, đắt hơn: Growth 99 USD/150 GB, vượt 0,40 USD/GB): https://metered.ca/pricing
- Railway chỉ có TCP Proxy cho lưu lượng không phải HTTP: https://docs.railway.com/networking/tcp-proxy
