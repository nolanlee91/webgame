# Bộ lọc tên và chat (an toàn cho trẻ em)

Mọi tên người chơi và tin nhắn gửi lên máy chủ đều đi qua **một** bộ lọc dùng chung: `games-server/moderation.js`
(CommonJS, các máy chủ phòng nạp bằng `require`; `account/names.mjs` của bảng xếp hạng nạp bằng `createRequire`).
Danh sách từ nằm ở `games-server/account/bad-words.json`.

## Lọc ở đâu

| Chỗ | Tên | Chat |
|---|---|---|
| Cờ Caro, Cờ Vua, Cờ Tướng, Ô Ăn Quan, Cá Ngựa, Cờ Tỷ Phú, Đặt Bom | `room.js` → `cleanName` → `cleanPlayerName` | `chat.js` → `maskChat` |
| Ma Sói | `room.js join` | `_chat` (kênh chung + kênh Sói) |
| Ai Là Nội Gián | `room.js join` | `_chat` (kênh chung + kênh Nội Gián) và `_dispatch` ("Gửi riêng" 1-1) |
| Nối Từ | `host.js cleanName` (tạo / vào phòng) | `host.js cleanChat` |
| Sảnh chờ trang chủ `/api/lobby` | lọc **lại** ở `public-rooms.js` và `noi-tu/host.js publicList` (phòng thủ 2 lớp) | — |
| Bảng xếp hạng | `account/names.mjs cleanName` | — |

## Hàm

- `cleanPlayerName(raw, fallback)`: chuẩn NFC, bỏ ký tự điều khiển / vô hình / đảo chiều chữ và `< >`, gộp khoảng trắng,
  cắt 16 **ký tự thật** (cụm grapheme, không cắt đôi emoji). Rỗng, dính từ tục hoặc chứa link thì trả `fallback`
  ("Người 2", "Người chơi 1"…). Tên gốc không bao giờ được lưu hay phát đi.
- `maskChat(text)`: link (`http…`, `www.…`, `abc.com`, `zalo.me/…`) thành `[link]`; từ tục thành `***`, phần còn lại giữ nguyên.
- `isProfane(text, { name })`: có từ tục không. `name: true` dùng thêm danh sách khắt khe dành riêng cho tên.

## Cách so (để không chặn nhầm tiếng Việt bình thường)

Chặn nhầm câu bình thường của trẻ con ("các bạn", "lớn lên", "dù mà", "đụng", "lồng đèn") **tệ hơn** lọt vài từ. Vì vậy:

1. **`exact`**: so **nguyên từ** hoặc cụm 2–3 từ, **giữ dấu**. "lồn" bị chặn, còn "lớn" và "lồng" thì không.
2. **`plain`**: chỉ so khi người chơi **gõ không dấu** (chỉ chữ a–z và số; "đ" tính như "d"). "du ma" bị chặn, còn "dù mà"
   thì không. Đừng thêm từ không dấu trùng với một từ thường như "cac" (các), "lon" (lớn/lon), "deo" (đeo), "buoi" (buổi), "cut".
   Chỉ thêm **cụm** chửi rõ nghĩa ("bu cac", "vai lon") và chỉ khi cụm đó không phải một câu bình thường gõ không dấu.
   Ví dụ "an cac" (ăn các món) hay "lon me" (con lợn mẹ) đều không được thêm.
3. **`contains`**: chuỗi con của câu đã bỏ dấu và bỏ khoảng trắng. **Chỉ** dùng cho chuỗi không thể ghép ngẫu nhiên từ các từ
   tiếng Việt, ví dụ có chữ f/w/z hoặc cụm phụ âm tiếng Việt không có ("fuck", "shit", "vcl"). Đừng thêm "bitch" (sẽ khớp
   "bít chặt"), "duma" (khớp "Du Mai") hay "concho" (khớp "Con Chồn").
4. **`nameOnly`**: chỉ áp cho tên, vì tên hiện công khai và ngắn. Ví dụ "con chó", "óc chó" (trong chat có thể là
   "quả óc chó"), "cứt" (trẻ con hay nói "cục cứt").

Bộ lọc tự xử lý các kiểu lách:

- chữ lặp: "fuuuck", "lồnnn"
- chữ đơn cách nhau bằng dấu chấm hoặc khoảng trắng: "c.ặ.c", "đ ụ", "f.u.c.k"
- mẩu chữ nối bằng dấu câu: "cặ.c"
- số kiểu leet: 0→o, 1→i, 3→e, 4→a, 5→s, 7→t ("l0z", "sh1t")
- `@ $ !` kẹp giữa chữ ("đ!t", "$hit")
- dấu `*`: "f*ck", "sh*t"
- ZWJ chen giữa chữ

## Thêm từ

1. Sửa `games-server/account/bad-words.json` và chọn đúng nhóm theo các quy tắc ở trên.
2. Thêm từ đó vào bảng `SHOULD_BLOCK` trong `games-server/moderation.test.mjs`. Nếu từ dễ trùng câu bình thường, thêm cả câu
   bình thường đó vào `SHOULD_NOT_BLOCK`.
3. Chạy `node --test games-server/moderation.test.mjs games-server/moderation-rooms.test.mjs` và `npm run test:account`.

Bộ lọc chạy ở máy chủ, nên client không tắt được. Chưa có các tính năng sau (thuộc phía giao diện): nút "Tắt tiếng người này",
"Tắt chat", báo cáo người chơi, và chat chỉ dùng câu chọn sẵn cho phòng công khai.
