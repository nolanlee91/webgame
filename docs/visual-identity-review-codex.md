# Visual Identity Discovery — Review độc lập của Codex

Ngày: 17/11/2026. **Chưa chọn hướng, chưa phê duyệt kiến trúc/phong cách/provider, chưa code hay sản xuất asset.**

## Cơ sở kiểm chứng

Đã mở xem trực tiếp bằng công cụ xem ảnh cả năm file:

- `assets/concepts/direction-1-flat-pop.png`
- `assets/concepts/direction-2-cozy-craft.png`
- `assets/concepts/direction-3-pixel-arcade.png`
- `docs/visual-identity-evidence/font-vietnamese-test.png`
- `docs/visual-identity-evidence/narrow-width-sim.png`

Đã đọc `docs/visual-identity-uikit.md` (bao gồm contracts, tokens, asset specs và giới hạn thử nghiệm) cùng `docs/asset-production-strategy.md`. UI Kit hiện là **đặc tả Markdown**, không phải bộ component chạy được. Ảnh hẹp là ảnh thu nhỏ desktop, không phải responsive layout; ảnh font là raster render, không phải kiểm thử trình duyệt. Không suy rằng đã có prototype hay benchmark từ những bằng chứng này.

Ký hiệu: **[Xem]** quan sát ảnh thật; **[Tính]** tự tính số liệu từ token; **[Đánh giá]** nhận định/đề xuất chưa thực nghiệm. Các số đo màu/k-means/pixel-count do Dev cung cấp không được xem là số mình đã đo lại.

**Kết luận:** cả ba hướng có ngôn ngữ nhận diện xuyên portal → lobby → Caro → Đào Vàng ở mức concept. Hướng 1 có ít khoảng trống sản xuất nhất; Hướng 2 cần thử UI tương tác và giảm trang trí; Hướng 3 cần chốt có thực sự yêu cầu pixel art theo lưới hay chỉ retro-neon. Đây là đánh giá để chọn hướng, không tự chọn thay chủ dự án.

## 1. Tính nhất quán giữa website và game

| Hướng | Quan sát trực tiếp | Đánh giá về tính nhất quán và điểm dễ vỡ |
|---|---|---|
| 1 — Flat Pop | **[Xem]** Viền đen dày, khung bo, header xanh, nền kem, vàng/hồng/xanh lặp qua bốn màn. Avatar lobby và nhân vật thợ mỏ đều cartoon tròn. Caro dùng X/O; Đào Vàng có thanh HUD và nút màu rõ | **[Đánh giá]** Đồng bộ tốt cả container và nội dung. Cảnh Đào Vàng nhiều gradient/chi tiết hơn icon portal; vẫn cùng viền nhưng nếu 18 game tự tăng độ bóng/độ chi tiết sẽ tách thành nhiều phong cách. Hậu kỳ viền đen chỉ đồng bộ đường bao, không sửa phối cảnh, ánh sáng, nét mặt hay tỷ lệ nhân vật |
| 2 — Cozy Craft | **[Xem]** Giấy kraft, băng dính, mép rách, chữ tay và palette đất xuyên cả bốn màn; thợ mỏ có cùng mũ đỏ/quần yếm với nhân vật lobby. Caro dùng nút áo và bàn gỗ. Đào Vàng có giấy Level/Gold/Goal nhưng không có nút thả móc | **[Đánh giá]** Mạnh nhất về chất liệu kể chuyện; chưa chứng minh hierarchy tương tác. Portal có nút PLAY nhưng lobby gần như bảng minh họa, thiếu ready/start; Đào Vàng giống tranh cảnh hơn game điều khiển được. Rủi ro vỡ ở HUD realtime khi băng dính/giấy chiếm chỗ. Nút áo có thể là skin Caro nếu vẫn rõ hai phe và luật, không tự coi thay X/O là lỗi luật; cần dấu/hoa văn khác nhau thay chỉ màu |
| 3 — Pixel Arcade | **[Xem]** Khung neon cyan/magenta, nền tím, chữ bitmap-like và avatar pixel-like xuyên suốt. Đào Vàng giữ cùng khung nhưng scene có nhiều hạt sáng/chi tiết; Caro dùng X/O rõ và sidebar nước đi | **[Đánh giá]** Đồng bộ retro-neon tốt ở khoảng nhìn tổng thể, chưa đồng bộ lưới pixel thật. Các nét, glow và góc sprite không cùng độ sắc. Avatar lớn lobby và thumbnail nhỏ sẽ dễ có hai cỡ pixel không tương thích. Neon dày/lấp lánh cũng dễ lấn bàn cờ vốn cần tập trung; cần quy định mật độ hiệu ứng theo vùng chơi, không chỉ theo theme |

**[Xem]** Cả ba concept dùng tiếng Anh và mã phòng bốn chữ số (7734/3456/7349), lệch spec sáu ký tự; Hướng 3 có nhiều nhãn méo chữ. Các ảnh chưa có ví dụ SpeakUp Kids AdSlot thật, popup kết quả/mời bạn đầy đủ hoặc 18 thumbnail cùng bộ. Vì vậy chưa thể xác nhận đồng bộ toàn hệ thống. Nội dung giả/nhãn sai phải thay bằng text thật trong layout; không dùng composite làm texture UI sản xuất.

**[Đánh giá]** Cần một bộ quy tắc xuyên cả ba lớp: token UI (màu/chữ/spacing), art direction (viền, chất liệu, ánh sáng, phối cảnh, tỷ lệ) và gameplay (ký hiệu, khả năng đọc vật thể, va chạm). Cùng token không tự bảo đảm hai lớp sau. Chọn một hướng rồi dùng màn portal, lobby sáu ký tự, popup kết quả, Caro và HUD Đào Vàng làm bộ đối chiếu; không cần sản xuất 18 bộ để biết phong cách có thống nhất hay không.

## 2. Khả năng triển khai thực tế và mobile

### Component chung + theme

**[Đánh giá]** Đồng ý chia sẻ contracts và semantic token; không đồng ý hiểu “thay primitive” là đủ chuyển giữa ba hướng. Cozy cần wrapper/mask/decoration, Pixel cần frame/sprite slicing và quy tắc scale, Flat dùng border/shadow CSS. Giữ hành vi/props chung, cho phép renderer/skin riêng theo capability; không viết ba bộ logic modal/room form. Không cần hoàn thiện cả ba theme trước khi chọn một.

DOM HUD/popup chồng canvas là khả thi nhưng cần một container tọa độ thống nhất: letterbox, fullscreen toàn container (không chỉ canvas), resize, safe-area, z-index và pointer-events. Không để lớp HUD bắt input vuốt của game. Canvas token cần chuyển sang số/màu/font rõ ràng; CSS variable tự nó không áp vào Phaser. Font phải tải xong trước khi đo/căn canvas; text tiếng Việt có dấu cần line-height và khoảng trên dưới đủ.

Các contract cần chỉnh trước triển khai, áp dụng cho cả ba hướng:

- `Button sm 36` phải có hit area đạt yêu cầu 44 mà không chồng nút cạnh bên. Bàn Caro 15×15 trên 360 px không thể mỗi ô 44 px; ghi ngoại lệ cùng giải pháp chọn ô/preview hoặc zoom/pan phù hợp. Không gắn nhãn “mọi touch target ≥44” nếu không thể thực hiện cho bàn game.
- Không giấu đồng hồ/lượt/mục tiêu cần quyết định chơi vào menu chỉ vì HUD có hơn ba mục. Chốt ưu tiên theo game, có thể chia hai hàng. Đào Vàng cần thấy ít nhất tiến độ mục tiêu và thời gian khi luật yêu cầu.
- `BoardCell` chung không đồng nghĩa cùng semantics: Caro theo ô, Cờ Tướng theo giao điểm, Sudoku có input số, Nối Thú theo cặp. Chia sẻ geometry/skin được, không ép một interaction model.
- `AdSlot empty ẩn` có thể mâu thuẫn “kích thước cố định tránh CLS”: quyết định trạng thái trước paint hoặc giữ slot đã reserve, không sập layout giữa ván.
- Pin input phải cho chữ+số (không dùng numeric-only keyboard); room code không phải OTP. Bot/disconnected phải là hai trạng thái riêng, không hiển thị mọi disconnect như đã takeover. Undo/Reset trong concept chỉ là minh họa, không tự cấp quyền reset multiplayer.

### So sánh ba hướng

| Hướng | Kết luận riêng về mobile | Điều cần xác nhận tiếp |
|---|---|---|
| 1 | **[Đánh giá] Dễ nhất**, đồng ý Dev. Vector/CSS và hình đơn giản reflow được; thumbnail/Đào Vàng trong ảnh hẹp vẫn nhận ra tốt. Nhưng menu và hàng SCORE/LEVEL/TIME/GOAL đã quá nhỏ; không thể dùng ảnh thu nhỏ làm UI thật | Hai cột card với nhãn tiếng Việt dài, nút thao tác lớn, board không bị viền/bóng ăn diện tích; giữ góc cạnh/viền theo scale UI khác với art scale |
| 2 | **[Đánh giá] Trung bình nếu trang trí là lớp không tương tác**, khó nếu buộc giữ nguyên collage. Ảnh hẹp cho thấy tiêu đề dễ nhận, body/nhãn card nhỏ và tốn diện tích. Có thể làm một cột hoặc hai cột thẳng; “chỉ vừa ba card” không phải giới hạn layout thực | Dùng font thường cho text nhỏ; bỏ rotation khỏi form/body, giới hạn tape và mép giấy. Nếu bỏ mọi vật liệu trên mobile sẽ mất nhận diện, nên giữ nền giấy nhẹ + một loại viền/sticker chủ đạo |
| 3 | **[Đánh giá] Khó nhất nếu yêu cầu pixel-perfect thật**, đồng ý có điều kiện. Nếu chỉ dùng retro-neon với font đọc tốt, bỏ lưới nghiêm ngặt thì có thể dễ hơn Cozy; khi ấy cần đổi mô tả sản xuất cho trung thực | Chốt native grid theo asset, nearest-neighbor và kích thước canvas backing buffer/device pixels, kiểm subpixel positioning khi scroll/zoom; chọn crop/letterbox hợp gameplay. Không bắt toàn bộ layout DOM/font thường tuân một lưới art duy nhất |

**[Xem]** Ảnh font thực sự cho thấy Baloo dễ đọc hơn Patrick Hand ở cỡ nhỏ; Tiny5 10 px quá chật; Press Start 2P xuất hiện ký tự thay thế/mất dấu. Điều này đủ để bác dùng nguyên mẫu font đó cho toàn bộ tiếng Việt, **không** chứng minh browser fallback, mọi glyph/nickname hay mọi DPR đã được test. Không có ảnh thử Itim/Mali; chưa xác nhận chúng.

**[Đánh giá]** Một số lập luận pixel của Dev cần làm rõ: 22 CSS px **chia hết cho 2**; rủi ro thật là chia theo đơn vị art đã chọn, border và DPR, không phải riêng con số 22. Pixel art không có quy luật bắt buộc dưới 32 màu; nhiều màu/anti-alias không đủ chứng minh mọi asset đều sai. Quan sát concept hỗ trợ nhận định đây là pixel-like composite, nhưng mình **chưa chạy lại phép đếm 1.517 màu/69% run-length** và không dùng chúng làm xác nhận độc lập. Blur/glow nền ngoài sprite cũng không khiến sprite pixel tự động không hợp lệ.

**[Tính]** Tự tính relative luminance từ các hex token, không lấy pixel ảnh: trắng trên `#3999EC` = **3,03:1**; `#634C3A` trên kraft `#C5A076` = **3,30:1**; trắng trên `#2782AD` = **4,30:1**, khác 4,02 trong UI Kit; ink `#1B1A17` trên `#F7F1D9` = **15,36:1**. Ba cặp đầu không đạt mốc chữ thường 4,5 mà Dev dùng, dù có thể đủ cho chữ lớn tùy cỡ/weight. Cần kiểm từng state và nền thực; texture, alpha và glow khiến tỷ lệ từ màu đặc không đại diện mọi pixel. Mình nhìn thấy nền Hướng 1 ngả kem/vàng, nhưng **chưa đo lại để xác nhận chính xác hex** Dev nêu.

## 3. Hiệu năng web/mobile

| Hướng | Rủi ro chính — đánh giá, chưa benchmark | Cách giới hạn mà giữ nhận diện |
|---|---|---|
| 1 | Dự kiến nhẹ nhất. Nhưng “bóng cứng không tốn GPU” là khẳng định quá mạnh: vẫn có paint/compositing, nhất là nhiều card animate shadow. Thumbnail lớn, preview và scene vẫn có thể chiếm phần lớn tải | Border/shadow tĩnh; animate transform thay đổi shadow ít nhất; lazy-load thumbnail/preview, DOM HUD chỉ update khi cần; không render 18 canvas ở trang chủ |
| 2 | Texture chi tiết tăng dung lượng nén, bộ nhớ decode và fill; mask mép rách, shadow blur nhiều lớp, filter nét tay và rotated cards có thể tăng paint khi cuộn | Vài tile texture dùng chung, không wallpaper full-resolution cho từng panel; mask/9-slice nhỏ được kiểm seam; bóng tĩnh, không SVG turbulence động; không animate cả vân nền |
| 3 | Pixel PNG gốc nhỏ có lợi, nhưng glow blur lớn, particles, scanlines động toàn màn và render target nhiều lớp có thể tốn hơn cả Cozy. `image-rendering: pixelated` không tự tăng FPS. Letterbox có thể giảm vùng vẽ nhưng giảm không gian sử dụng | Glow chủ yếu ở panel ngoài, sprite có palette/outline rõ; scanline tĩnh hoặc bỏ ở game; cap particles và backing resolution theo ngân sách; không làm bộ lọc CRT toàn canvas mỗi frame |

**[Đánh giá]** Xếp hạng dự kiến: Flat thấp; Cozy vừa; Pixel từ thấp (pixel tĩnh không blur) đến cao nhất (neon/CRT động như cảm giác concept). Không thể kết luận Pixel luôn nặng nhất từ PNG hoặc Cozy luôn chậm vì texture. Ảnh PNG composite không biểu diễn số layer DOM, shader hay update frequency thực.

**[Tính]** Một nền 1920×1080 decode RGBA tốn khoảng **7,9 MiB** trước mipmap/texture overhead, dù WebP nén chỉ 200 KB. Vì vậy budget KB mạng trong UI Kit cần đi cùng tổng decoded memory/atlas per scene; không nạp nền của 18 game cùng lúc. Thu nhỏ sprite 512² vào ô 24 px mà vẫn giữ texture gốc lãng phí ở cả ba hướng.

**[Đánh giá]** Khi được duyệt prototype, đo cold/warm load, scroll portal, input latency, frame time, memory sau chuyển game lặp lại và khi modal/fullscreen mở; cùng thiết bị, nội dung và kích thước để so công bằng. Thử giảm chuyển động và chế độ hiệu ứng thấp; reduced-motion là nhu cầu tiếp cận, không thay cơ chế quản lý hiệu năng. Nhấp nháy “≤2 lần/giây” không tự là chứng nhận an toàn cho mọi pattern/diện tích/độ sáng; ưu tiên focus/ready tĩnh, không glow chớp diện rộng. Chưa chạy thử thiết bị trong review này.

## 4. Nguy cơ phát sinh quá nhiều asset

Baseline **170–280 ảnh AI / 350–1.100 lượt** của strategy là giả định, không phải quota hoặc khối lượng đã nghiệm thu. Cần tách số master riêng, số sprite frame, số biến thể xuất tự động và số lần tạo lại. Thêm trạng thái button hoặc resize không đồng nghĩa phải gọi AI thêm.

| Hướng | Nguy cơ tăng số ảnh và công hậu kỳ | Quy tắc kiểm soát đề xuất |
|---|---|---|
| 1 | **Thấp nhất tương đối.** UI gần như không cần ảnh sinh riêng; asset tăng chủ yếu nếu mỗi game muốn mascot, backdrop, empty-state khác nhau hoặc avatar nhiều biến thể. Scene chi tiết như Đào Vàng có thể kéo chuẩn từ icon phẳng sang minh họa cầu kỳ | Một icon system, token/stroke guide; bộ avatar/chung và trạng thái dùng lại. Nút/card/board bằng primitive. Tách thumbnail art khỏi tên/chữ hiển thị; không yêu cầu AI tạo lại ảnh chỉ vì nhãn Việt thay |
| 2 | **Cao nhất về nguy cơ tăng master trang trí** nếu mỗi game có giấy, tape, khung, nền, vật liệu và nhân vật riêng. UI Kit riêng đã đề xuất 15–20 khung/decor, 4–6 texture, ~40 icon nét tay; chưa rõ có nằm trong 3–31 ảnh UI chung của baseline hay không. Độ lệch vân/ánh sáng tăng reject/rework | Một material pack dùng chung, số loại giấy/tape hữu hạn, decoration tách khỏi nội dung. Texture overlay và sticker viền tái dùng; không tạo full panel mới cho từng text/state. Giới hạn góc nhìn và nguồn sáng cho vật phẩm, không kỳ vọng phủ texture sẽ sửa mọi hình sai style |
| 3 | **Cao nhất về sửa tay/frame animation và nguy cơ lượt tạo lại**, chưa chắc cao nhất về số ảnh độc lập. Idle/walk/hit/death, bốn hướng di chuyển, vật phẩm và tile transitions nhân frame nhanh; downsample ảnh AI không tạo ra pixel art chất lượng tự động | Chốt lưới/palette/outline trước, sprite sheet có danh sách state thật; palette swap được duyệt, một bộ tile nối được; không cần AI cho mọi pixel icon hoặc khung 9-slice. Giữ animation tối thiểu phù hợp gameplay và pixel artist cleanup riêng nếu chọn lưới thật |

**[Đánh giá]** Bảng style không nên tự mở rộng từ một hướng được chọn sang ba bộ skin sản xuất: điều đó nhân UI asset/test state mà chưa đem lại giá trị đã duyệt. Cũng không cần “mỗi hướng một ảnh lỗi riêng” trong bộ production cuối; đây chỉ là discovery. Đổi provider theo bộ vẫn cần style QA: tên file/manifest không bảo đảm nét vẽ đồng bộ.

Game Tìm Điểm là rủi ro chung cả ba hướng: tạo hai ảnh độc lập có thể sinh hàng loạt khác biệt không chủ ý; nên master scene được duyệt rồi sửa đúng vùng, lưu diff mask/hitbox tương ứng. Hướng Cozy texture/nét màu nước làm khó phân biệt sai khác thật; Pixel dễ thấy lệch một vài ô ngoài chủ ý; Flat dễ kiểm hơn nhưng vẫn cần QA từng cặp. Nông Trại cần icon cây theo giai đoạn, không chỉ một ảnh mỗi loại; cần kiểm baseline có bao đủ stage/harvest/wilt không trước khi tin tổng 170–280.

**[Đánh giá]** Trước sản xuất hàng loạt, cần bill of materials của hướng được chọn: asset ID, dùng ở đâu, master/derived, animation states, kích thước gốc, reuse group, tiêu chí duyệt và owner hậu kỳ. Hiệu chỉnh estimate sau một bộ mẫu nhỏ **được chủ dự án cho phép**, không tự gọi AI trong review này. Chưa xác minh billing/quota/provider và không dùng review thị giác này để coi provider đã được duyệt.

### Phạm vi hoàn tất

Đã xem trực tiếp năm ảnh và đọc các tài liệu nêu trên, tự tính bốn cặp tương phản và ví dụ bộ nhớ ảnh. Chỉ tạo file review này; không chỉnh concept/UI Kit, không code, không gọi tạo ảnh, không commit. Chưa kiểm tra browser font/DPR, accessibility thực tế, benchmark hay số asset cuối cùng. Các đề xuất là ý kiến kỹ thuật độc lập, không phải quyết định chọn phong cách.
