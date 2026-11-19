# Tiệm Trà Sữa · Bàn giao asset Phase 2

- [Thiết kế và nhiệm vụ](GAME-DESIGN.md) · [Art Bible](ART-DIRECTION.md) · [Màn hình](SCREENS.md) · [Manifest](asset-manifest.json)
- [Cảnh ghép desktop](concepts/phase-2-scene-preview.webp) · [Mẫu crop 390 px](concepts/phase-2-mobile-crop.webp) · [Các trạng thái ly ghép](concepts/phase-2-cup-preview.webp) · [Atlas duyệt](concepts/phase-2-atlas-preview.webp)

## Dùng atlas

Asset đặt trong thư mục `prototype/games/tiem-tra-sua/assets/`. Mỗi frame có rect [x, y, width, height] theo tọa độ ảnh nguồn và anchor [x, y] tính từ góc trên-trái của ô. Trang render chọn tọa độ muốn đặt neo, rồi trừ anchor đã nhân theo tỉ lệ hiển thị. Preview ghép sẵn chỉ minh họa bố cục. Dùng asset nguồn và anchor để đặt từng vật thể khi triển khai.

Ảnh raster được dựng theo concept đã duyệt và ảnh bìa trà sữa, tách nền magenta thành alpha cứng, xuất WebP lossless ở lưới 2 × 2. Dùng nền quán toàn cảnh, nền phố và vật thể rời theo vị trí đặt. Với bố cục mẫu, vẽ `shop-counter-foreground.webp` sau nhân vật đứng sau quầy để che phần thân dưới, sau đó vẽ vật phẩm nằm trên mặt quầy. Khi đổi bố cục, dùng fixture phù hợp làm vật che. Các tile cửa/cửa sổ là miếng trang trí, chưa có quy ước va chạm hoặc mép lặp kỹ thuật.

Bố cục thử ở 1280 × 720, khung mobile minh họa crop vùng khách và một ly tách riêng ở chiều rộng 390 px. Khi tích hợp mobile, dùng camera theo từng khu và UI theo đặc tả, giữ chữ, nút và trạng thái ngoài ảnh.

## Ly pha chế

Các lớp trong cup-layers.webp dùng chung ô 160 × 192, neo [80,174]. Dùng chính offset trong ô để ghép. Thứ tự hiện có: empty-cup, một lớp chất lỏng, pearls-bottom hoặc jelly-bottom, ice-top, dome-lid. Lớp ly glass hiện là đường viền đã key nền. Vẽ hiệu ứng rót trên ly rồi ẩn khi hoàn tất. Atlas cup-states-and-ingredients.webp có hình ly hoàn chỉnh và mẫu dùng cho phiếu gọi món. Hũ, quả và nguyên liệu bổ sung nằm trong equipment.webp và decor-and-pantry.webp.

- cup-fx.webp có rót, hạt rơi và hơi nước, mỗi clip sáu frame.
- lid-and-ice-fx.webp có đóng nắp và đá rơi, mỗi clip sáu frame.
- `customer-actions.webp` ghi clip gọi món và ngạc nhiên cho sáu vai. `character-motion-sample.webp` và `customer-walk-cycles.webp` ghi clip đi cho năm vai.
- Máy và nội thất cấp cao có trường dữ liệu riêng trong atlas nâng cấp. Ghép nhân vật toàn thân theo neo chân, dùng ảnh bán thân cho hội thoại.
- Khung hoạt ảnh ghi thứ tự, fps và loop trong manifest. Gameplay tự quyết định thời điểm xác nhận và trừ kho. Hình ảnh có thể bỏ qua khi người chơi bật giảm chuyển động.
- Cần căn điểm ráp ly vào tay của ảnh nhân vật khi ghép vào UI. Atlas góc quầy và sprite toàn thân ở hai góc nhìn khác nhau.

## Thẻ Nhật Ký Làm Chủ

`journal-card.png` là mẫu nền 1080 × 1350, có vùng đặt chữ trống. Dự kiến đặt “Lụm Kèo” và tên tiệm trong khung đầu, câu chuyện và thống kê trong vùng kem phía dưới, `lumkeo.com` ở chân khung. Khi triển khai, thử tên tiệm dài, câu thoại xuống dòng và xuất ở kích thước thật.

## Phạm vi bàn giao

Trạng thái `produced-phase-2` có file và metadata để thử tích hợp. `planReplacements` ghi các nhóm của kế hoạch Phase 1 đã tách thành nhiều file. Dùng các tên file thực tế trong manifest. Phase 2 hiện cung cấp cảnh ghép, atlas môi trường, thiết bị, nguyên liệu, ly theo lớp, nhân vật, biểu cảm, trang trí và hoạt ảnh mẫu. Cần playtest nhịp, thao tác, tầm đọc và vùng che quầy sau khi Claude đưa asset vào gameplay. So lại sắc độ trang phục khi chuyển giữa sprite đứng, đi và phản ứng của cùng một vai. Khách văn phòng chưa có chu kỳ đi riêng. Trạng thái vui và sốt ruột dùng pose tĩnh kết hợp hiệu ứng UI ở bản đầu.

Bộ asset được lưu trên worktree riêng. Chưa nối gameplay, homepage, backend hoặc deploy.

## Phase 3b · Atlas cận cảnh 1×

| Sheet HD | Ô · anchor | Nội dung |
|---|---|---|
| barista-actions-hd.webp | 256 × 256 · [128,244] | Thân trên barista, giữ nguyên ID và ba clip pour, topping, handoff. |
| cup-layers-hd.webp | 320 × 384 · [160,348] | Lớp ly ở cùng hệ tọa độ, gồm siro, đường đen, ba lớp trái cây, pudding, hai mức matcha mới và kem sữa. |
| portraits-hd.webp | 384 × 320 · [192,308] | Chân dung mặc định, gồm khách văn phòng. |
| portrait-expressions-hd.webp | 384 × 320 · [192,308] | Biểu cảm theo nhân vật, gồm các vai bổ sung từ gói M3–M5. |

Atlas HD dùng lưới 1×, alpha cứng và WebP lossless. Điểm neo và tọa độ từng ô là gấp đôi các giá trị trong bộ nguồn. FPS, thứ tự và loop của clip barista giữ nguyên. Hai manifest có cùng dữ liệu. Trường fallbackFilename trỏ tới sheet cũ tương ứng. Các ID bổ sung lấy từ gói M3–M5, commit 3044d3b. Nếu bản game chưa có gói đó, chỉ những ID đã tồn tại trong manifest cũ mới có ảnh dự phòng.

Khi nối vào Quầy pha hoặc hội thoại, dùng tỉ lệ vẽ HD bằng một nửa tỉ lệ của frame cũ để giữ nguyên kích thước và vị trí trong UI. Khi cần trả về 2×, dùng kích thước và neo từ manifest của chính sheet cũ. Asset này chưa đổi render.

[Đối chiếu chân dung và barista](concepts/phase-3b-hd-comparison.webp) · [Kiểm tra ghép lớp ly HD](concepts/phase-3b-hd-cups.webp)
