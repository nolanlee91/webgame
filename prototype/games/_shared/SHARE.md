# Khoe kết quả — `_shared/share.js`

Module dùng chung để người chơi **khoe kết quả**: vẽ ảnh 1080×1080 theo phong cách pixel V5 (khung góc khuyết, bóng cứng, nền navy hoặc gỗ tối, chữ Be Vietnam Pro) rồi mở bảng chia sẻ. ES module thuần, không thư viện ngoài, không gửi dữ liệu đi đâu.

## API

```js
import { shareResult, makeCard } from "../_shared/share.js?v=s1";

shareResult({
  game: "o-an-quan",                 // id trong homepage/games.js (lấy tên game, thumbnail, link)
  title: "Thắng máy 38–12",          // tiêu đề lớn (≤ 40 ký tự, dài quá tự thu cỡ / xuống dòng)
  lines: ["Quân ăn được: 38", "Máy ăn được: 12", "Số lượt: 21"], // 0–4 dòng; "Nhãn: giá trị" vẽ kiểu bảng điểm
  tagline: "Máy xin thua, hẹn ván sau phục thù!",                  // câu cà khịa (≤ 2 dòng)
  accent: "#f7c96d",                 // màu tiêu đề + dải nhấn (mặc định vàng); vd teal "#75d1bf"
  theme: "navy",                     // "navy" (mặc định) | "wood" (gỗ tối — hợp cờ tướng, ô ăn quan)
  thumb: undefined,                  // mặc định thumbnail của game; đường dẫn khác (tính từ prototype/ hoặc URL tuyệt đối) hoặc false để bỏ
  thumbFocus: 0.5,                   // khi phải cắt bớt chiều cao thumbnail: 0 = giữ phần trên, 1 = giữ phần dưới
});
// → Promise<"native" | "panel" | "cancelled" | "error">
```

| Hàm | Trả về | Ghi chú |
|---|---|---|
| `shareResult(opts)` | `Promise<string>` | Tạo ảnh rồi chia sẻ. Điện thoại có bảng chia sẻ hệ thống ⇒ `navigator.share({ files, text, url })`. Còn lại ⇒ bảng nhỏ pixel V5. `opts.native: false` ép dùng bảng. |
| `makeCard(opts)` | `Promise<Blob>` | Chỉ vẽ ảnh PNG 1080×1080. |
| `makeBanner(opts)` | `Promise<Blob>` | Ảnh 1200×630 cho thẻ xem trước link (dùng bởi `tools/og/render-og-images.mjs`). |
| `shareUrl(game)` | `string` | `https://<domain>/games/<thư mục>/?ref=share&g=<id>` — tham số để sau này đo, hiện không gửi đi đâu. |
| `normalizeOpts`, `layoutCard`, `shareText`, `communityLinks`… | | Hàm thuần, có test Node. |

**Bảng dự phòng** (máy tính, hoặc điện thoại không chia sẻ được tệp): xem trước ảnh + nút **Chia sẻ…** (nếu trình duyệt hỗ trợ), **Tải ảnh**, **Chép link**, **Facebook** (sharer, không cần app id), **Messenger** (chỉ hiện trên điện thoại — mở app bằng `fb-messenger://`, máy tính cần app id nên ẩn), **Zalo** (Zalo không có link chia sẻ nào không cần SDK/OA ⇒ chép link + hướng dẫn "mở Zalo, dán vào cuộc trò chuyện"). Esc / bấm nền / nút × để đóng; phím trong bảng không lọt xuống game.

Domain khai **một chỗ**: `_shared/site.js` (`SITE_URL`). Tên game + thumbnail lấy từ `_shared/games-meta.js` (sinh tự động từ `homepage/games.js` bởi `tools/og/gen-og.mjs` — thêm game thì chạy lại script).

## Gắn vào một game

1. Ở màn kết thúc (thắng/thua, tổng kết ca, kỷ lục mới…), thêm một nút **dùng đúng class nút sẵn có của game**, chữ "Khoe kết quả". Đặt cạnh các nút "Chơi lại"/"Tiếp tục", không che gì.
2. Import và gọi với **số thật của ván**:

```js
import { shareResult } from "../_shared/share.js?v=s1";

shareBtn.addEventListener("click", () => {
  shareResult({
    game: "ran-san-moi",
    title: isRecord ? `Kỷ lục ${score} điểm` : `${score} điểm`,
    lines: [`Dài: ${len} khúc`, `Mồi đã ăn: ${eaten}`],
    tagline: score >= 100 ? "Nokia 1280 cũng phải nể." : "Rắn còn non, mai luyện tiếp!",
  });
});
```

3. Game nạp bằng `<script type="module">` có tag `?v=` ⇒ nhớ đổi tag ở chỗ import file vừa sửa (trình duyệt cache 5 phút).
4. Câu cà khịa: vui, không xúc phạm, đổi theo kết quả (thắng đậm / thắng sát / thua / kỷ lục).

## Thám Tử Hẻm (coordinator gắn sau, khi mùa 2 đã gộp)

- Màn kết thúc vụ án (chỗ hiện số sao / đánh giá phá án) — thêm nút "Khoe kết quả" cùng kiểu nút của màn đó:

```js
import { shareResult } from "../_shared/share.js?v=s1";
shareResult({
  game: "tham-tu-hem",
  title: `Phá án ${stars}★`,                       // vd "Phá án 3★"
  lines: [`Vụ: ${caseTitle}`, `Vật chứng: ${found}/${total}`, `Đoán sai: ${wrong} lần`],
  tagline: stars === 3 ? "Conan gọi bằng sư phụ." : stars === 2 ? "Suýt soát thôi, thám tử tập sự!" : "Thủ phạm còn đang cười đó nha.",
  theme: "wood",
});
```
- Đổi `?v=` của `game.js` trong `tham-tu-hem/index.html`.
- Thẻ OG: chạy `node tools/og/gen-og.mjs --only tham-tu-hem` (ảnh `homepage/assets/og/tham-tu-hem.jpg` đã có). Script thay thẻ `<meta name="description">` cũ bằng khối og (mô tả lấy từ `DESC["tham-tu-hem"]` trong script).
- Tương tự cho Sudoku, 2048, Đố Vui sau khi nhánh "Thử thách hôm nay" gộp: `node tools/og/gen-og.mjs --only sudoku,2048,do-vui`.

## Nút cộng đồng

Điền link vào `prototype/homepage/community.js`:

```js
window.COMMUNITY = { facebookGroup: "https://www.facebook.com/groups/…", facebookPage: "", zalo: "https://zalo.me/g/…", tiktok: "" };
```

- Ô trống ⇒ nút đó ẩn; tất cả trống ⇒ footer trang chủ và bảng chia sẻ không hiện gì.
- Chỉ nhận link `http(s)://`.
- Footer trang chủ hiện các nút có link. Trong bảng chia sẻ, sau khi người chơi bấm một nút chia sẻ (hoặc chia sẻ hệ thống xong) sẽ hiện dòng **"Vào nhóm Lụm Kèo: …"**.
- Sửa xong đổi `community.js?v=` trong `homepage/index.html`. Game tự nạp `community.js` khi mở bảng chia sẻ.

## Thẻ xem trước link (Open Graph)

```
node tools/og/render-og-images.mjs   # vẽ homepage/assets/og/<id>.jpg 1200×630 (cần Chrome/Edge)
node tools/og/gen-og.mjs             # ghi khối <!-- og:start --> … <!-- og:end --> vào <head> mọi trang + sinh games-meta.js
node tools/og/gen-og.mjs --check     # kiểm, exit 1 nếu lệch
```
Đổi domain: sửa `_shared/site.js` rồi chạy lại cả hai. Thêm game: thêm vào `games.js`, viết mô tả trong `DESC` của `gen-og.mjs`, chạy lại.
Kiểm thẻ sau khi lên bản thật: Facebook Sharing Debugger (developers.facebook.com/tools/debug) → "Scrape Again".

## Test

```
node --test prototype/games/_shared/test/*.test.mjs   # dựng nội dung (Node, không canvas)
node prototype/games/_shared/test/share-e2e.mjs [thư mục ảnh]   # Chrome thật: tạo Blob, bảng chia sẻ, gắn trong game, 1366×768 + 390×844
```
