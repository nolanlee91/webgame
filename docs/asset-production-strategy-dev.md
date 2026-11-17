# Asset Production Strategy — phần kỹ thuật (Dev)

**Dự án:** Webgame Portal
**Tác giả:** Dev (Technical Lead)
**Ngày:** 17/11/2026
**Trạng thái:** Đề xuất, **chưa được chủ dự án phê duyệt**. Không có code, không cài đặt, không dùng dịch vụ trả phí.
**Đầu vào:** `docs/game-catalog-v2.md` (Gehihi), `docs/tech-architecture-v2.md`, `docs/plan-v2.md`, `docs/architecture-review-v2.md`, file thử `assets/test/gehihi-test-icon.png`.

> Ký hiệu: ✅ = đã kiểm chứng (ghi cách kiểm) · ⚠️ = **giả định / chưa kiểm chứng**.

---

## 0. Kết luận nhanh

| Câu hỏi | Trả lời |
|---|---|
| Làm sao để không phụ thuộc một provider? | Phong cách nằm trong **tài liệu + ảnh tham chiếu + prompt có biến + bước hậu kỳ chuẩn hoá bằng code**, không nằm trong một công cụ. Mọi asset được gọi qua **khoá (asset key) trong manifest**; code game không biết ảnh do ai tạo. Đổi provider theo **từng bộ asset trọn vẹn** (ví dụ cả 36 ô Nối Thú), không đổi giữa chừng một bộ. |
| Hết quota thì code có bị chặn không? | **Không**, nếu áp dụng mục 2: mọi asset có **placeholder sinh bằng code đúng kích thước/anchor/hitbox** ngay từ đầu; game được coi là "xong code" khi chạy với placeholder; ảnh thật được thay vào sau mà không sửa code. Ảnh thật chỉ là cổng kiểm tra trước **Public Launch**, không phải trước khi code. |
| Cần bao nhiêu ảnh AI cho 18 game? | **Khoảng 170–280 ảnh hoàn chỉnh được duyệt** (168–250 ảnh trong game + 3–31 ảnh dùng chung cho portal) ⚠️. Nếu mỗi ảnh được duyệt cần 2–4 lần tạo ⚠️ thì tổng là **~350–1.100 lần gọi tạo ảnh**. Đây là con số cần so với quota thực tế. |
| Phần nào nặng nhất? | Giai đoạn 4 (Đào Vàng, Bắn Cung, Tìm Điểm, Đua Xe, Nông Trại, Đặt Bom): **102–146 ảnh, tức ~60% tổng**. Ba game nặng nhất là Nối Thú (~38–40), Nông Trại (~29–38) và Tìm Điểm (~21–31). |
| Có thể giảm tải AI bao nhiêu? | Toàn bộ bàn cờ, quân cờ, ô số, gạch, bóng màu, xúc xắc, UI kit, icon, hiệu ứng nổ/hạt và địa hình đua xe đều làm bằng code hoặc lấy từ nguồn mở. Có **6 game cần ≤ 2 ảnh AI** mỗi game (Caro, Nối Từ, Cờ Tướng, Xếp Gạch, Sudoku, 2048 bản số), Cá Ngựa cần 2–3. |

---

## 1. Quy trình quản lý asset độc lập với provider

### 1.1 Nguyên tắc
1. **Nguồn sự thật là tài liệu và manifest, không phải công cụ.** Bất kỳ ai (Gehihi, Codex, người vẽ, hay nguồn CC0) đều có thể sản xuất asset, miễn là đầu ra đúng quy chuẩn ở 1.6.
2. **Mỗi bộ asset được làm bởi một provider và một phiên bản model.** Không trộn provider trong cùng một bộ, vì mắt người thấy ngay sự lệch nét/ánh sáng (ví dụ 36 ô Nối Thú, 24 giai đoạn cây Nông Trại).
3. **Không có chữ trong ảnh AI.** Chữ tiếng Việt có dấu được render bằng code và font (AI thường vẽ sai dấu). Điều này cũng giúp đổi nội dung không cần tạo lại ảnh.
4. **Hậu kỳ chuẩn hoá bằng code** (tách nền, cắt viền thừa, đổi kích thước, viền ngoài, nén). Bước này làm ảnh từ các provider khác nhau trông đồng nhất hơn, và hoàn toàn không tốn quota.
5. **Không tạo nhân vật thương hiệu.** Không prompt kiểu "giống Pikachu/Tetris/Candy Crush". Linh vật SpeakUp Kids phải dùng **file chính thức do SpeakUp cung cấp**, không dùng AI mô phỏng (đồng bộ với cảnh báo trong `architecture-review-v2.md`).

### 1.2 Cấu trúc thư mục đề xuất
```
assets/
  style/
    style-guide.md            # Gehihi sở hữu
    palette.json              # token màu (khớp token UI)
    references/               # ảnh tham chiếu đã duyệt + refs.md ghi nguồn
  prompts/
    _base.yaml                # khối phong cách chung
    <game>.yaml               # prompt từng bộ asset của game
  manifest/
    <game>.json               # một file manifest cho mỗi game (tránh 2 bot sửa cùng file)
    portal.json               # thumbnail, banner, avatar, huy hiệu
  source/<game>/              # ảnh master đã DUYỆT (commit vào git)
  placeholders/               # sinh tự động bằng script, không sửa tay
  third-party/                # asset CC0/CC-BY + LICENSE + attributions.md
  _raw/                       # bản nháp chưa duyệt — .gitignore, KHÔNG commit
```
Bản xuất cho web (WebP, atlas) **được sinh lúc build** vào thư mục của từng game (`games/<game>/assets/…`), không sửa tay và không commit.

**Lý do không commit `_raw/`:** một ảnh thử thật nặng **1,2 MB** ✅ (đã đo `gehihi-test-icon.png`: 1024×1024, PNG RGB). 170–280 ảnh duyệt cộng 2–4 bản nháp mỗi ảnh có thể lên **~0,5–1,5 GB** ⚠️, sẽ làm phình repo git. Git LFS là một lựa chọn nhưng gói miễn phí có giới hạn dung lượng (chưa tra, ⚠️), nên tạm thời chỉ commit master đã duyệt.

### 1.3 Style guide (Gehihi sở hữu, Dev góp phần kỹ thuật)
Một tài liệu chung cho 18 game, gồm:

| Mục | Nội dung | Ai |
|---|---|---|
| Hướng nghệ thuật | Một phong cách chính, ví dụ "2D cartoon, bóng đổ mềm, viền đậm vừa". Catalog muốn thumbnail "3D sống động", nên cần chốt một mức mà AI lặp lại được ổn định | Gehihi |
| Bảng màu | Kế thừa token của catalog: nền `#0B0E17`/`#131826`, nhấn `#FF2E93`, `#7928CA`, `#FFB800`. Thêm 6–8 màu trò chơi (đỏ/xanh/vàng/lục/tím/cam) dùng chung cho bóng, kẹo, quân Cá Ngựa | Gehihi |
| Ánh sáng / góc nhìn | Nguồn sáng trên-trái; góc nhìn theo nhóm: **từ trên xuống** (Rắn, Đặt Bom, Nông Trại), **ngang** (Đào Vàng, Bắn Cung, Đua Xe, Bắn Bóng), **phẳng chính diện** (ô Nối Thú, kẹo, vật phẩm) | Gehihi |
| Nét viền, tỉ lệ nhân vật | Độ dày viền tính theo % kích thước sprite; tỉ lệ đầu/thân của nhân vật | Gehihi |
| Cấm | Chữ trong ảnh, logo/nhân vật thương hiệu, phong cách mô phỏng một game cụ thể, nội dung không phù hợp trẻ em | Gehihi + Dev |
| Quy chuẩn kỹ thuật | Kích thước, định dạng, anchor, nền trong suốt (mục 1.6) | **Dev** |
| Mẫu đối chiếu | 1 trang "đúng/sai" với 4–6 ảnh mẫu đã duyệt | Gehihi |

### 1.4 Ảnh tham chiếu (reference images)
- Lưu ở `assets/style/references/`. Mỗi ảnh có một dòng trong `refs.md`: tên file, **nguồn** (tự tạo bằng provider nào, hay tự vẽ), quyền sử dụng, dùng cho bộ asset nào.
- **Chỉ dùng ảnh tham chiếu do chính team tạo hoặc có quyền rõ ràng.** Không dùng ảnh chụp game khác hay ảnh tải trên mạng làm tham chiếu phong cách: vừa rủi ro bản quyền, vừa dễ "học" luôn phong cách thương hiệu.
- Khi đã có 4–6 ảnh "chuẩn" đầu tiên được duyệt (đề xuất: 1 nhân vật, 1 vật phẩm, 1 nền, 1 thumbnail), các ảnh này trở thành **bộ tham chiếu gốc**, dùng làm đầu vào ảnh (image reference) cho mọi provider có hỗ trợ.

### 1.5 Prompt library
Lưu ở `assets/prompts/` dạng YAML, có phiên bản. Mỗi prompt gồm **khối phong cách chung** cộng **khối riêng** có biến, để khi đổi provider chỉ cần đổi "lớp chuyển đổi" chứ không viết lại:

```yaml
# assets/prompts/noi-thu.yaml
id: noi-thu.tile
version: 3
base: _base.style.v2          # tham chiếu khối phong cách chung
refs: [style/references/item-ref-01.png]
template: >
  {base}. Single cute {animal} face, front view, centered,
  flat solid background #00FF00, no text, no border.
variables:
  animal: [cat, dog, rabbit, panda, ...]   # 36 giá trị
negative: text, letters, watermark, logo, trademark character
output: { master_px: 512, background: chroma-green }
provider_notes:              # ghi chú theo từng provider, không bắt buộc
  gehihi-google: "thêm 'sticker style' cho nét ổn định hơn"
  codex: ""
```

Quy tắc:
- **Nền đơn sắc (chroma) hoặc trong suốt.** Ảnh thử hiện tại là **RGB, không có kênh alpha** ✅, nên không dùng thẳng làm sprite được. Phải tạo trên nền đơn sắc rồi tách nền bằng code, hoặc dùng provider có hỗ trợ nền trong suốt.
- Mỗi lần tạo ghi lại: prompt id + version, provider, model/phiên bản (nếu biết), seed (nếu có), ngày. Ghi vào manifest (1.6), để **tái tạo được hoặc chuyển sang provider khác** khi cần.
- Prompt đã cho ra ảnh được duyệt thì **không sửa đè**: tăng `version`.

### 1.6 Asset manifest
Mỗi game một file `assets/manifest/<game>.json`. Code game chỉ gọi **`key`**, không bao giờ gọi đường dẫn file:

```json
{
  "game": "dao-vang",
  "assets": [{
    "key": "dao-vang.item.gold-large",
    "category": "item",                    // background | character | item | ui | animation
    "status": "approved",                  // placeholder | requested | draft | review | approved | final | deprecated
    "source": "ai",                        // ai | code | third-party | hand-drawn
    "provider": "gehihi-google-free",
    "model": "chưa rõ",
    "promptId": "dao-vang.item@2",
    "seed": null,
    "refs": ["style/references/item-ref-01.png"],
    "version": 2,
    "files": { "master": "source/dao-vang/item/gold-large_v2.png" },
    "spec": { "displayPx": [64, 64], "exportScale": [1, 2], "anchor": [0.5, 0.5],
              "hitbox": { "type": "circle", "r": 0.42 }, "frames": 1 },
    "license": "own-generated",            // own-generated | CC0 | CC-BY-3.0 | ...
    "attribution": null,
    "createdAt": "2026-11-20", "approvedBy": "Gehihi",
    "history": [{ "version": 1, "file": "source/dao-vang/item/gold-large_v1.png", "reason": "viền quá mảnh" }]
  }]
}
```

Điểm quan trọng:
- **`spec` (kích thước hiển thị, anchor, hitbox, số frame) do Dev định nghĩa trước khi có ảnh.** Gameplay dựa vào `spec`, không dựa vào pixel của ảnh. Nhờ vậy thay ảnh không làm đổi va chạm hay bố cục.
- Một script kiểm tra (viết sau khi được duyệt code) sẽ chạy trong CI: file có tồn tại không, kích thước có khớp không, có alpha không, đã có license chưa, còn asset nào ở trạng thái `placeholder` trong build launch không.
- Manifest **chính là bảng theo dõi tiến độ asset**: đếm theo `status` là biết còn bao nhiêu ảnh phải làm.

### 1.7 Versioning
- File bất biến: `tên_vN.png`. Sửa ảnh thì tạo `v(N+1)`, cập nhật `version` và `files.master`, thêm một dòng vào `history`. Bản cũ giữ lại đến khi bản phát hành dùng bản mới ổn định.
- Hai loại thay đổi:
  - **Đổi hình, giữ `spec`** (màu, nét, chi tiết): chỉ người làm asset và người duyệt; **không cần Dev**.
  - **Đổi `spec`** (kích thước, anchor, hitbox, số frame): bắt buộc báo Dev, vì có thể ảnh hưởng gameplay. Phải qua review code.
- Tên file web khi build gắn hash nội dung (đã nêu ở tech-architecture-v2), nên CDN không bị kẹt cache ảnh cũ.

### 1.8 Quy chuẩn kích thước và định dạng
Kích thước master là ⚠️ đề xuất; sẽ điều chỉnh sau khi thử trên máy Android tầm trung.

| Loại asset | Master (nguồn) | Xuất cho web | Ngân sách gợi ý ⚠️ | Ghi chú |
|---|---|---|---|---|
| Thumbnail game (ô 1×1) | 1024×1024 PNG | WebP 512 và 256 | ≤ 60 KB (512) | Không có chữ trong ảnh; tên game là chữ HTML |
| Thumbnail ngang (ô 2×1, hero) | 1600×800 PNG | WebP 1200×600, 800×400 | ≤ 120 KB | Có thể crop từ cùng một key art |
| Nền game ngang | 1920×1080 | WebP 1600 và 960 | ≤ 200 KB mỗi ảnh | Game dọc trên mobile: master 1080×1920 |
| Nền parallax | 2048×512 mỗi lớp, nối liền hai đầu | WebP | ≤ 120 KB mỗi lớp | Đua Xe, Bắn Cung |
| Sprite / vật phẩm | 512×512 PNG-32, alpha | Đóng gói vào atlas, 2× kích thước hiển thị | Theo atlas | Anchor mặc định: tâm, nhân vật: giữa-đáy |
| Ô lưới (Nối Thú, kẹo) | 512×512 | 2× kích thước ô (thường 96–128px) | Theo atlas | Cùng khung, cùng lề trong |
| Frame animation | Cùng canvas cho mọi frame | Atlas | Theo atlas | 8–12 fps; anchor cố định giữa các frame |
| Icon UI | **SVG** | SVG inline / sprite SVG | — | Ưu tiên thư viện icon (1.10), không dùng AI |
| Avatar khách | 256×256 | WebP 128 | ≤ 10 KB | Hoặc sinh bằng code (mục 3) |

Chung: sRGB; tên file chữ thường, không dấu, nối bằng gạch ngang (`gold-large_v2.png`); **ngân sách asset tải lần đầu mỗi game ≤ 1,5 MB** ⚠️, khớp với ngân sách bundle theo game ở tech-architecture-v2.

### 1.9 Sprite sheet / texture atlas
**Dùng khi:**
- Một màn chơi nạp **> ~10 ảnh nhỏ** cùng lúc (vật phẩm Đào Vàng, 36 ô Nối Thú, kẹo, power-up Đặt Bom).
- Có **animation theo frame** (thợ mỏ, nhân vật Đặt Bom, khủng long Bắn Bóng).
- Có **tile set** (gạch/tường Đặt Bom, đất Nông Trại).

**Không dùng cho:** nền lớn, thumbnail, ảnh màn Tìm Điểm (mỗi cặp ảnh là một file riêng, nạp theo màn).

**Cách đóng gói:**
- Một atlas cho mỗi game hoặc mỗi màn, cộng một atlas UI chung của portal.
- Kích thước tối đa **2048×2048** để an toàn trên mobile ⚠️; padding 2px và extrude 1px để tránh lem viền khi scale.
- Định dạng JSON tương thích Phaser (JSON hash), tên frame chính là `key` trong manifest.
- **Sinh tự động lúc build** từ master đã duyệt. Không ai sửa atlas bằng tay, nên đổi một ảnh chỉ cần build lại.
- Công cụ dự kiến: `free-tex-packer-core` (MIT ✅) và `sharp` để resize/convert (Apache-2.0 ✅). Kiểm bằng GitHub API/npm registry hôm nay. Chưa cài đặt.

### 1.10 Nguồn tái sử dụng hợp pháp (giảm tải cho AI)

| Nguồn | License | Trạng thái kiểm chứng | Ghi chú |
|---|---|---|---|
| **Kenney.nl** (sprite 2D, UI, âm thanh) | CC0 | ✅ Trang `kenney.nl/support` hôm nay ghi: "all game assets on the asset pages are public domain licensed (CC0)… even in commercial projects" | Thay cho "chưa kiểm chứng" trong tech-architecture-v2 (lần đó trang trả lỗi 403). Vẫn phải đọc file License trong từng gói tải về. **Phong cách Kenney khác phong cách AI**, nên chỉ dùng cho nguyên một game hoặc cho placeholder, không trộn |
| **game-icons.net** (repo `game-icons/icons`) | Phần lớn **CC BY 3.0**, một số tác giả CC0 | ✅ Đã đọc `license.txt` trong repo | **Bắt buộc ghi công tác giả** → cần trang "Ghi công" trên portal |
| **Lucide** (icon UI) | ISC | ✅ npm registry | Icon cho UI portal và nút trong game |
| **Be Vietnam Pro** (font) | OFL-1.1 | ✅ GitHub API + file OFL.txt | Font thiết kế cho tiếng Việt |
| **Nunito** (font) | OFL-1.1 | ✅ GitHub API (`googlefonts/nunito`) | Độ đầy đủ dấu tiếng Việt chưa kiểm ⚠️ |
| Font chữ Hán cho quân Cờ Tướng | — | ⚠️ chưa kiểm chứng, cần tra lại trước khi dùng | Hoặc vẽ quân bằng SVG |
| OpenGameArt.org | Khác nhau từng asset | ⚠️ chưa kiểm chứng, phải tra từng asset | Tránh GPL/CC-BY-SA cho asset trộn vào bundle |
| Emoji (Twemoji, Noto Emoji…) | — | ⚠️ chưa kiểm chứng, cần tra lại trước khi dùng | Không dùng emoji hệ thống làm sprite (mỗi máy hiển thị khác) |

Mọi asset bên thứ ba: lưu ở `assets/third-party/<nguồn>/` kèm file license gốc, khai báo `source: third-party` và `license` trong manifest. Một trang "Ghi công" sinh tự động từ manifest.

### 1.11 Đổi provider giữa chừng

| Tình huống | Asset cũ còn dùng được? | Phải tạo lại gì? |
|---|---|---|
| Bộ asset đã duyệt **trọn vẹn** (ví dụ 36 ô Nối Thú) | **Có**, file thuộc về dự án, miễn điều khoản của provider cho phép dùng thương mại ⚠️ (chưa tra điều khoản Google/OpenAI cho tài khoản đang dùng, **cần tra lại trước khi dùng**) | Không |
| Bộ asset **đang làm dở** (ví dụ 20/36 ô) | Có, nhưng rủi ro lệch phong cách | **Nên làm lại cả bộ** bằng provider mới, hoặc dùng ảnh đã duyệt làm tham chiếu và chấp nhận review kỹ. Quyết định theo từng bộ |
| Cần **thêm** ảnh vào bộ đã xong (ví dụ thêm 1 cây cho Nông Trại) | Có | Tạo ảnh mới bằng provider mới, dùng các ảnh cũ của bộ làm tham chiếu, rồi chạy cùng bước hậu kỳ; người duyệt so cạnh nhau |
| **Sửa** một ảnh cũ | Có | Nếu provider cũ không còn, thì sửa bằng tay hoặc làm lại cả bộ, tuỳ mức lệch |
| Thumbnail portal | Có | Thumbnail đặt cạnh nhau trên trang chủ nên lệch phong cách rất dễ thấy. **Nên làm cả 18 thumbnail bằng một provider** trong một đợt |

**Không bao giờ phải sửa code khi đổi provider**, vì code chỉ gọi `key` và dùng `spec`.

---

## 2. Quy trình chống nghẽn khi hết quota

### 2.1 Nguyên tắc: code không bao giờ chờ ảnh
1. **Manifest đi trước ảnh.** Khi bắt đầu một game, Dev viết manifest với đủ `key` + `spec` (kích thước, anchor, hitbox, số frame) ở trạng thái `placeholder`. Đây cũng chính là **đơn đặt hàng asset** gửi cho Gehihi.
2. **Placeholder sinh bằng code**, không tốn quota: hình khối màu theo nhóm (vật phẩm vàng, kẻ địch đỏ…), có ghi `key` và kích thước, đúng `displayPx`/anchor/hitbox, đúng số frame (frame đánh số). Script sinh placeholder viết khi được duyệt code; trước đó chỉ là thiết kế.
3. Placeholder có thể nâng cấp bằng **asset CC0 của Kenney** cho những game cần "trông giống game" để test cảm giác chơi. Vẫn ghi `status: placeholder`.
4. **Hai định nghĩa "xong" tách riêng:**
   - **Xong code:** chạy đủ luật chơi, test, đạt hiệu năng **với placeholder**. Không phụ thuộc ảnh.
   - **Xong asset:** mọi `key` của game ở trạng thái `final`. Đây là điều kiện để game được **bật công khai**, không phải điều kiện để merge code.
5. **Thay ảnh thật = đổi file + cập nhật manifest.** Không sửa code. CI kiểm tra kích thước và alpha; Gehihi (hoặc người duyệt) xem ảnh chụp màn hình trước/sau.

### 2.2 Luồng làm việc
```
Dev: viết manifest (key + spec) ──► placeholder tự sinh ──► code game ──► "Xong code"
          │                                                               │
          └─► Đơn asset gửi Gehihi                                         │
                 │                                                         ▼
     Provider chính ─(hết quota)─► Provider dự phòng ─► CC0/code ─► Thay ảnh, CI kiểm tra
                                                                    ──► "Xong asset" ──► bật công khai
```

### 2.3 Thứ tự dự phòng khi provider chính dừng
1. **Provider chính** (hiện là Gehihi, tài khoản Google miễn phí).
2. **Provider phụ** (Codex, nếu có khả năng tạo ảnh trong gói đang trả ⚠️, chưa kiểm chứng). Chỉ nhận **bộ asset mới trọn vẹn**, không nhận phần còn lại của một bộ đang dở (theo 1.11).
3. **Nguồn mở CC0** (Kenney) cho cả một game, chấp nhận phong cách khác.
4. **Vẽ bằng code** (SVG/canvas) cho những gì hình học được (mục 3).
5. Nếu tất cả đều không đủ: **lùi ngày bật công khai của đúng game đó**, không chặn các game khác. Bật/tắt từng game qua cấu hình là năng lực đã có trong kiến trúc (kill switch theo game, từ review V2).

### 2.4 Lập kế hoạch theo quota (vì Google Free không có bảng hạn mức)
- **Không đoán quota.** Đo thực tế bằng **một đợt thử có giới hạn** (đề xuất 20–30 ảnh của một bộ thật, ví dụ vật phẩm Đào Vàng), ghi nhật ký mỗi lần tạo: thời điểm, số ảnh, có bị từ chối/giới hạn không, thời gian chờ hồi lại. Sau 2–3 ngày có số liệu thật về số ảnh/ngày.
- Nhật ký này nằm trong manifest (`history`) hoặc một file `assets/manifest/_generation-log.csv` do Gehihi ghi.
- **Ưu tiên tạo theo đường găng**, không theo thứ tự đẹp: bộ nào game sắp vào giai đoạn code thì làm trước (bảng 3.3). Tìm Điểm, Nông Trại và Nối Thú nên bắt đầu sớm nhất vì nhiều ảnh nhất.
- **Gom theo bộ, xong từng bộ** (bám nguyên tắc 1 provider/1 bộ). Không làm rải rác mỗi game vài ảnh.
- **Giảm số lần thử:** duyệt "ảnh chuẩn" của bộ trước (1–2 ảnh), rồi mới tạo hàng loạt bằng tham chiếu đó. Giả định giảm lần thử từ ~4 xuống ~2 mỗi ảnh ⚠️.
- Phần **không tốn quota** (tách nền, resize, đổi màu, viền, nén, đóng atlas, tạo biến thể màu) luôn làm bằng code. Ví dụ: 4 nhân vật Đặt Bom = **1 lần tạo + 3 lần đổi màu bằng code**.

### 2.5 Ai làm gì
| Việc | Người phụ trách |
|---|---|
| Style guide, prompt, tạo ảnh, duyệt phong cách | Gehihi |
| Manifest (`key`, `spec`), placeholder, script kiểm tra, atlas, tích hợp | Dev |
| Review pipeline, script, kiểm tra license/attribution | Codex |
| Ưu tiên, quyết định khi phải đổi provider hoặc lùi game | Mama → chủ dự án |

---

## 3. Ước tính nhu cầu asset cho 18 game

### 3.1 Cách đếm và giả định
- Đơn vị: **ảnh hoàn chỉnh được duyệt** (một file master). Không tính số lần tạo thử. Một frame animation là một ảnh.
- Con số dựa trên **luật chơi và mô tả trong `game-catalog-v2.md`**, cộng các giả định phạm vi sau (đều ⚠️, đổi giả định thì đổi số):
  - Nối Thú: **36 loại ô** (bàn kiểu cổ điển 144 ô = 36 loại × 4).
  - Tìm Điểm: **20–30 màn** lúc launch; mỗi màn **1 ảnh AI gốc**, bản "khác biệt" được làm bằng **chỉnh sửa có kiểm soát** (xem ghi chú 3.4), không tạo ảnh AI thứ hai.
  - Nông Trại: **6–8 loại cây × 4 giai đoạn lớn**.
  - Đặt Bom: **1 nhân vật × 4 hướng × 3 frame đi** + frame chết; 4 màu bằng code.
  - 2048: bản **số** làm bằng code; bản **động vật** là tuỳ chọn (0–12 ảnh).
  - Mỗi game có **1 thumbnail key art**; các cỡ khác crop/resize bằng code.
- Mức thấp = chỉ phần bắt buộc; mức cao = có thêm phần tuỳ chọn (nền riêng, skin, minh hoạ).

### 3.2 Bảng theo game (số ảnh AI cần tạo, thấp–cao) ⚠️

| # | Game | Nền | Nhân vật | Vật phẩm | UI (thumbnail) | Animation | **Tổng AI** | Làm bằng code / tái sử dụng |
|---|---|---|---|---|---|---|---|---|
| 1 | Caro | 0–1 | 0 | 0 | 1 | 0 | **1–2** | Bàn cờ, X/O, vạch thắng: code |
| 2 | Rắn | 0–1 | 0–2 (skin đầu) | 3–6 (mồi) | 1 | 0 | **4–10** | Thân rắn, lưới nền: code |
| 3 | Nối Thú | 1–3 | 0 | **36** (ô thú) | 1 | 0 | **38–40** | Đường nối, hiệu ứng ăn cặp: code |
| 4 | Đào Vàng | 2–3 | 1 (thợ mỏ) | 8–12 (vàng 3 cỡ, kim cương, đá 2, bom, túi bí ẩn, sinh vật biển) | 1 | 3–5 (kéo dây) | **15–22** | Dây, móc xoay, nổ: code |
| 5 | Nối Từ | 0–1 | 0 | 0 | 1 | 0 | **1–2** | Toàn bộ là UI + chữ: code |
| 6 | Bắn Bóng | 1–3 | 1 (khủng long) | 1–3 (trứng) | 1 | 2–3 | **6–11** | 6 màu bóng (gradient), quỹ đạo, nổ: code |
| 7 | Cờ Tướng | 0–1 | 0 | 0 | 1 | 0 | **1–2** | Bàn cờ và 14 quân: SVG + font (font Hán ⚠️) |
| 8 | Đố Vui | 1 | 0 | 0–6 (minh hoạ chủ đề) | 1 | 0 | **2–8** | Icon chủ đề: thư viện icon. Ảnh trong câu hỏi thuộc nội dung, tính riêng |
| 9 | 2048 | 0 | 0 | 0–12 (bản động vật) | 1 | 0 | **1–13** | Ô số, màu, trượt: code |
| 10 | Cá Ngựa | 0–1 | 1 (ngựa) | 0 | 1 | 0 | **2–3** | Bàn chữ thập, xúc xắc, 4 màu ngựa: code |
| 11 | Đặt Bom | 0 | 1 | 8–13 (gạch/tường/sàn, power-up, bom) | 1 | 11–15 | **21–30** | 4 màu nhân vật, lửa nổ (hạt): code |
| 12 | Bắn Cung | 2–3 | 1–2 (cung thủ, thân và tay tách rời) | 0–1 (mũi tên) | 1 | 0 | **4–7** | Xoay tay/cung, quỹ đạo, gió: code |
| 13 | Xếp Gạch | 0–1 | 0 | 0 | 1 | 0 | **1–2** | Khối, lưới: code (thiết kế riêng, tránh trade dress Tetris) |
| 14 | Tìm Điểm | **20–30** (cảnh) | 0 | 0 | 1 | 0 | **21–31** | Vùng chạm, vòng đánh dấu: code |
| 15 | Đua Xe | 3–6 (parallax) | 1 (tài xế) | 7–10 (thân xe, bánh, xu, xăng, vân địa hình) | 1 | 0 | **12–18** | Địa hình đồi: code (polygon + vân lặp) |
| 16 | Nông Trại | 1–2 | 0–1 | 27–34 (cây × giai đoạn, ô đất 3 trạng thái) | 1 | 0 | **29–38** | Icon công cụ/shop: thư viện icon; tưới/thu hoạch: tween |
| 17 | Ghép Kẹo | 1–2 | 0 | 6–7 (kẹo) | 1 | 0 | **8–10** | Kẹo đặc biệt = lớp phủ code; nổ combo: hạt |
| 18 | Sudoku | 0 | 0 | 0 | 1 | 0 | **1** | Toàn bộ: code |
| | **Cộng 18 game** | **32–59** | **6–10** | **96–140** | **18** | **16–23** | **168–250** | |

**Portal dùng chung** (ngoài 18 game) ⚠️: banner hero **3–5**, huy hiệu/top tuần **0–10** (có thể dùng icon), avatar khách **0–16** (có thể sinh bằng code dạng hình học). Cộng **3–31**. Logo nên do người thiết kế chốt, không tính vào AI. Ảnh SpeakUp Kids do SpeakUp cung cấp, không tính.

**Tổng: ~170–280 ảnh AI được duyệt.** Với giả định 2–4 lần tạo mỗi ảnh: **~350–1.100 lần tạo** ⚠️.

### 3.3 Theo giai đoạn roadmap (để xếp lịch tạo ảnh)

| Giai đoạn code (tech-architecture-v2) | Game | Ảnh AI ⚠️ | Thời điểm nên có ảnh |
|---|---|---|---|
| GĐ1 | 2048, Caro, Rắn | 6–25 | Có thể chạy hoàn toàn bằng placeholder; ảnh thật trước launch |
| GĐ2 | Xếp Gạch, Sudoku, Nối Thú, Ghép Kẹo, Bắn Bóng | 54–64 | **Nối Thú (36 ô) nên bắt đầu ngay khi style guide được duyệt** |
| GĐ3 | Nối Từ, Đố Vui, Cờ Tướng, Cá Ngựa | 6–15 | Nhẹ; phần nặng là nội dung câu hỏi/từ điển, không phải ảnh |
| GĐ4 | Đào Vàng, Bắn Cung, Tìm Điểm, Đua Xe, Nông Trại, Đặt Bom | **102–146** | **Bắt đầu song song từ GĐ1–2**, đặc biệt Tìm Điểm và Nông Trại |
| Portal | Thumbnail đã tính trong game; hero, huy hiệu, avatar | 3–31 | 18 thumbnail làm **một đợt, một provider** trước launch |

Nếu chọn phương án launch 15 game (bỏ Đua Xe, Nông Trại, Đặt Bom): giảm **62–86 ảnh**, còn **~106–164 ảnh game** ⚠️.

### 3.4 Theo 5 nhóm: phần cần AI và phần không cần

| Nhóm | Cần AI thật sự | Làm bằng code / tái sử dụng |
|---|---|---|
| **Nền** (32–59) | Cảnh minh hoạ có chủ đề: biển sâu (Đào Vàng), đồi/trời parallax (Đua Xe, Bắn Cung), **cảnh Tìm Điểm** (nhóm lớn nhất) | Gradient, họa tiết lặp, lưới (Caro, Rắn, Sudoku, Xếp Gạch, 2048, Nối Từ), nền tối dùng token portal |
| **Nhân vật** (6–10) | Thợ mỏ, khủng long, cung thủ, nhân vật Đặt Bom, ngựa, tài xế | **Biến thể màu** bằng code (4 nhân vật Đặt Bom, 4 ngựa); avatar khách có thể sinh bằng code |
| **Vật phẩm** (96–140) | 36 ô Nối Thú, cây Nông Trại, vật phẩm Đào Vàng, kẹo, power-up, xe | Quân cờ, X/O, ô số, gạch, **bóng màu**, xúc xắc, mồi dạng hình học; có thể dùng **Kenney CC0** nếu chấp nhận phong cách khác |
| **UI** (18 + portal) | **Key art thumbnail** cho 18 game, banner hero | **Toàn bộ UI kit** (nút, khung, thanh điểm, đồng hồ, popup): CSS/SVG theo token của Gehihi; icon: Lucide (ISC) / game-icons (CC BY, phải ghi công); chữ: font OFL |
| **Animation** (16–23) | Chỉ những chuyển động **không làm được bằng tween**: thợ mỏ kéo dây, nhân vật Đặt Bom đi/chết, khủng long bắn | Phần lớn animation làm bằng code: tween vị trí/xoay/scale, hạt nổ, rung, nhấp nháy. Nhân vật tách thành phần (thân/tay) để xoay bằng code (Bắn Cung) |

Ghi chú quan trọng về AI:
- **AI không giỏi giữ đúng nhân vật qua nhiều frame.** Animation nên dùng ít frame (3–5) và ưu tiên rig/tween. Đặt Bom (11–15 frame) có rủi ro cao nhất. Phương án dự phòng: dùng gói nhân vật top-down CC0 (chưa tìm gói cụ thể ⚠️) hoặc vẽ pixel tay.
- **Tìm Điểm: AI không tạo được hai ảnh khác nhau đúng 5 chỗ.** Đề xuất: AI tạo **ảnh gốc**, bản thứ hai làm bằng chỉnh sửa có kiểm soát (che hoặc thêm vật thể, đổi màu một vùng), lưu vùng khác biệt dạng toạ độ trong JSON màn chơi. Review V2 đã cảnh báo cần kiểm tra **khác biệt ngoài ý muốn**; cách này kiểm soát được điều đó. Cách làm cụ thể (tay hay bán tự động) **cần thử trên 1–2 màn trước khi chốt** ⚠️.
- **Ảnh AI cần tách nền** (ảnh thử hiện không có alpha ✅). Bước này không tốn quota nhưng tốn công, nên đã tính vào hậu kỳ.

---

## 4. Những gì đã kiểm chứng và chưa

**Đã kiểm chứng hôm nay (17/11/2026):**
- `assets/test/gehihi-test-icon.png`: 1024×1024, PNG RGB **không alpha**, 1.247.608 byte (đo bằng `file` và đọc header PNG).
- Kenney: trang support xác nhận CC0 cho mọi asset trên trang asset, kể cả dùng thương mại.
- game-icons: CC BY 3.0 (một số CC0), cần ghi công. Đọc `license.txt` trong repo.
- License khai báo của Lucide (ISC), free-tex-packer-core (MIT), sharp (Apache-2.0), Be Vietnam Pro (OFL-1.1), Nunito (OFL-1.1). Tra qua npm registry / GitHub API.

**Chưa kiểm chứng ⚠️:**
1. **Quota thực tế của tài khoản Google Free mà Gehihi dùng** (số ảnh/ngày, thời gian hồi). Cần đợt thử ở 2.4.
2. Codex có tạo ảnh được trong gói hiện tại không, và quota bao nhiêu.
3. **Điều khoản sử dụng thương mại ảnh AI** của từng provider đối với tài khoản đang dùng (đặc biệt tài khoản miễn phí). **Cần tra lại trước khi dùng ảnh trong sản phẩm.**
4. Toàn bộ số lượng ở mục 3 (phụ thuộc giả định phạm vi 3.1) và tỉ lệ 2–4 lần tạo mỗi ảnh.
5. Kích thước master/ngân sách KB ở 1.8, giới hạn atlas 2048 trên Android tầm trung.
6. Dung lượng repo khi lưu master, và giới hạn gói miễn phí của Git LFS.
7. Font chữ Hán cho Cờ Tướng, độ phủ dấu tiếng Việt của Nunito, license emoji, gói nhân vật top-down CC0 cụ thể.
8. Cách làm bản "khác biệt" cho Tìm Điểm.

## 5. Đề xuất bước tiếp theo (chờ Mama/chủ dự án quyết)
1. Gehihi viết `assets/style/style-guide.md` và tạo **4–6 ảnh chuẩn**. Đây là đợt thử quota nhỏ, đồng thời là bộ tham chiếu gốc.
2. Đợt đo quota 20–30 ảnh của **một bộ thật** (đề xuất vật phẩm Đào Vàng hoặc 12 ô đầu của Nối Thú), có ghi nhật ký.
3. Dev viết manifest (`key` + `spec`) cho 3 game GĐ1 **ngay khi code được duyệt**. Trước đó chỉ chuẩn bị tài liệu.
4. Tra điều khoản thương mại của provider ảnh trước khi bất kỳ ảnh AI nào được đánh dấu `final`.
