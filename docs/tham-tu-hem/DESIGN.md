# Thám Tử Hẻm: thiết kế (hợp đồng chung)

Game solo của Lụm Kèo: phá những vụ án "dở khóc dở cười" trong một con hẻm Sài Gòn bằng cách soi hiện trường, thẩm vấn, vạch mâu thuẫn trong lời khai, ghép suy luận rồi vạch mặt thủ phạm. Không máu me, không bạo lực. Mọi vụ đều là chuyện xóm có drama, hài và dễ viral.

- id: `tham-tu-hem` · thư mục code: `prototype/games/tham-tu-hem/` · tài liệu: `docs/tham-tu-hem/`
- Giao diện **đúng phong cách dự án**: HUD pixel V5 (`docs/art-bible-v5.md`, `docs/visual-identity-uikit.md`, `docs/ux-ui-spec.md`). Khung pixel-cut, bóng cứng, không bo tròn, font Be Vietnam Pro. Vàng chỉ dùng cho nút chính. Tham chiếu sống: `prototype/games/quan-com-tam/`, `prototype/games/co-caro/index.html`.
- Kiến trúc theo `docs/tap-lam-chu/PLAYBOOK.md` §3: data/ + core/ thuần (`apply(state, action)`) + ui/ + save.js (MIGRATIONS + backup) + test/ (node --test và e2e CDP).

## 1. Vòng chơi một vụ (10–20 phút)

1. **Nhận hồ sơ** (văn phòng thám tử): khách tới kể chuyện. Có thể kèm bài đăng nhóm Zalo "Hẻm 47 Hóng Biến" đang viral, có bình luận hóng hớt.
2. **Hiện trường**: mỗi địa điểm là một cảnh pixel có **điểm soi**. Bấm vào thì có lời thoại (nhiều điểm chỉ để gây cười), có thể nhặt **vật chứng** hoặc **từ khoá**. Có điểm soi chỉ hiện khi đã có điều kiện, ví dụ đã nghe một lời khai.
3. **Thẩm vấn**: mỗi nghi phạm có các **chủ đề hỏi**. Hỏi xong thì có thể ghi được **lời khai** vào sổ.
4. **Vạch mâu thuẫn**: chọn một lời khai rồi **đưa vật chứng**.
   - Đúng: nghi phạm "bể", có lời thoại mới và mở thêm manh mối.
   - Sai: mất 1 **Uy Tín** (5 kính lúp), kèm câu đáp hài của nghi phạm. Hết uy tín không thua: Tèo can, hồi về 1, sao cuối vụ bị trừ.
5. **Bảng suy luận**: các câu điền chỗ trống, ví dụ "Thủ phạm là {a}, ra tay lúc {b}, bằng cách {c}". Chọn **từ khoá** đã thu thập theo đúng loại. Bấm "Chốt" thì game chỉ báo **số chỗ sai**, không nói chỗ nào.
6. **Vạch mặt** (cao trào): thủ phạm chối 3–4 lần. Mỗi lần chối, người chơi đưa đúng vật chứng thì thủ phạm nhận tội.
7. **Kết vụ**: nhận 1–3 ★ (theo uy tín mất, số lần chốt sai, gợi ý đã dùng). Tiếp theo là đoạn kết hài, **tường bình luận viral** của xóm, danh tiếng tăng và lên hạng thám tử.

Ngoài vòng chính:
- **Gợi ý Tèo**: trợ lý đoán bậy nhưng có ích, mỗi lần dùng trừ điểm sao.
- **Câu hỏi phụ**: thêm danh tiếng.
- **Sổ tay**: vật chứng, lời khai, từ khoá, hồ sơ nhân vật.
- **Bản đồ hẻm** để chọn vụ. Vụ mở lần lượt; phá xong vụ nào thì vụ đó chơi lại được.

Hạng thám tử theo danh tiếng: Thám tử tập sự → Thám tử hẻm → Thám tử phường → Thám tử quận → Huyền thoại Hẻm 47.

## 2. Dàn nhân vật cố định (data/cast.js)

| id | Ai | Ghi chú vẽ |
|---|---|---|
| `me` | Thám tử (người chơi tự đặt tên, mặc định "Thám Tử Lụm") | Khoảng 30 tuổi, áo khoác kaki nâu, mũ bê-rê, kính lúp cài túi, mặt tỉnh queo |
| `teo` | Tèo, trợ lý, 19 tuổi | Áo thun vàng, dép tổ ong, tóc dựng. Nhanh nhảu, đoán bậy, nghiện điện thoại |
| `batu` | Bà Tư Hóng, admin nhóm Zalo "Hẻm 47 Hóng Biến" | Khoảng 60 tuổi, áo bà ba hoa, quạt nan, kính lão, luôn cầm điện thoại |
| `chuba` | Chú Ba dân phòng | Khoảng 50 tuổi, áo dân phòng xanh, còi, đèn pin. Hay đến trễ |

Lời thoại có `who` = `me`, `teo`, `batu`, `chuba`, `narr` (lời dẫn) hoặc id người trong vụ.

## 3. Sáu vụ án và hợp đồng nhân vật + cảnh

Mỗi vụ ghi sẵn nghi phạm, thủ phạm, cảnh và **đồ vật chính trong cảnh**. Codex vẽ đúng các đồ vật này và ghi toạ độ vào `manifest.hotspots`. Người viết vụ dùng đúng id đồ vật làm điểm soi.

Người viết vụ được thêm nhân vật phụ không phải nghi phạm (chỉ thoại, chân dung tạm). Được thêm điểm soi chỉ để gây cười, kèm `rect` tự ước lượng. Phải giữ nguyên thủ phạm và các id đã có ở đây.

### Vụ 1: "Nồi Thịt Kho Bốc Hơi" (`noi-thit-kho`, độ khó 1, vụ hướng dẫn)
Sát Tết, nồi thịt kho trứng của **cô Hai** biến mất khỏi bếp chung xóm trọ trong đêm.
- Nghi phạm:
  - `tuan`: sinh viên năm 3, gầy, áo thun in chữ, nợ tiền trọ. Nghi phạm "hiển nhiên": áo dính nước màu, thật ra là mì gói sa tế.
  - `linh`: streamer ăn uống, tóc nhuộm hồng, vòng đèn ring light.
  - `ongsau`: chủ trọ, ông 65 tuổi, áo may ô, cầm xâu chìa khoá.
  - Thêm `cohai`, nạn nhân: khoảng 50 tuổi, tạp dề, tay cầm vá.
- Thủ phạm: **linh**. Tối qua cô livestream "thịt kho mẹ nấu" để câu view bằng chính nồi của cô Hai, nhận ra qua quai nồi buộc dây thun đỏ. Ăn xong cô rửa nồi và phơi trên sân thượng.
- Cảnh và đồ vật:
  - `kitchen`, bếp chung: `bep-ga`, `tu-chen`, `thung-rac`, `cua-so`, `lich-treo`, `bon-rua`.
  - `hallway`, hành lang phòng trọ: `cua-phong-tuan`, `cua-phong-linh`, `dep-truoc-cua`, `bang-tin`, `dong-ho`.
  - `rooftop`, sân thượng: `day-phoi`, `noi-up`, `chau-cay`, `ring-light`, `bon-nuoc`.

### Vụ 2: "Chiến Kê Mất Tích" (`chien-ke`, độ khó 1)
Gà chọi "Chiến Thần" của **ông Bảy** biến mất ba ngày trước giải gà xóm.
- Nghi phạm:
  - `ongbay`: chủ gà, khoảng 70 tuổi, râu bạc, áo bà ba nâu. Là khách tới nhờ, không phải nghi phạm.
  - `ongtam`: hàng xóm, đối thủ gà chọi, mặt hầm hố, nón tai bèo.
  - `bin`: cháu nội ông Bảy, lớp 12, kính cận, đeo tai nghe, đang ôn thi.
  - `comuoi`: bán cơm gà đầu hẻm, tạp dề đỏ, dao chặt gà. Nghi phạm gây cười.
  - `hai`: shipper, áo khoác xanh lá, mũ bảo hiểm.
- Thủ phạm: **bin**. Con gà gáy 4 giờ sáng giữa mùa ôn thi, nên Bin lén đem gửi sang chuồng trên sân thượng nhà bạn. Bin không bán, không làm thịt.
- Cảnh và đồ vật:
  - `yard`, sân nhà ông Bảy: `chuong-ga`, `bao-lua`, `cong-sat`, `xe-dap`, `ban-tho-to`.
  - `alley`, đầu hẻm: `xe-com-ga`, `cot-dien`, `camera-tiem-vang`, `thung-xop`, `xe-may-shipper`.
  - `binroom`, phòng Bin: `ban-hoc`, `dong-ho-bao-thuc`, `balo`, `cua-so-phong`, `poster`.

### Vụ 3: "Ly Trà Sữa Văn Phòng" (`tra-sua-van-phong`, độ khó 2)
Ly trà sữa full topping ghi tên **chị Vy** (trưởng phòng) trong tủ lạnh công ty "Cà Khịa Media" bị uống mất, và kẻ trộm còn để lại ly rỗng. Cameo Tiệm Trà Sữa.
- Nghi phạm:
  - `vy`: trưởng phòng, khoảng 32 tuổi, vest kem, sang chảnh. Là nạn nhân.
  - `khoa`: thực tập sinh, áo sơ mi rộng, thẻ nhân viên, sợ sệt.
  - `phong`: dân IT, áo hoodie, tai nghe, hay cắn dẹt ống hút.
  - `hang`: kế toán, đang "ăn kiêng", hộp salad.
  - `dat`: sếp, áo polo, bụng bia, cầm cốc "Best Boss".
- Thủ phạm: **phong**. Bằng chứng then chốt: ống hút bị cắn dẹt theo thói quen, và log camera bị tắt đúng 15 phút bằng tài khoản IT. Hằng ăn kiêng là manh mối gây nhiễu.
- Cảnh và đồ vật:
  - `pantry`, phòng pantry: `tu-lanh`, `may-pha-ca-phe`, `thung-rac-pantry`, `bang-phan-cong`, `lo-vi-song`.
  - `openoffice`, khu làm việc: `ban-khoa`, `ban-phong`, `ban-hang`, `may-in`, `cay-canh`.
  - `serverroom`, phòng server: `tu-server`, `man-hinh-camera`, `ghe-xoay`, `day-cap`.

### Vụ 4: "Đêm Chung Kết Mất Wifi" (`mat-wifi`, độ khó 2)
Đêm chung kết bóng đá, cáp mạng của cả hẻm bị cắt ngang. Cả xóm không xem được, chỉ có quán cà phê **cô Út** còn sóng và đông nghẹt.
- Nghi phạm:
  - `ongnam`: ông khó tính ghét ồn, áo ngủ sọc, cầm điếu cày.
  - `loc`: kỹ thuật nhà mạng, áo đồng phục cam, cuộn dây.
  - `cout`: chủ quán cà phê, tóc búi, tạp dề nâu.
  - `ti`: game thủ 16 tuổi, tai nghe gaming, mắt thâm.
- Thủ phạm: **cout**. Cô cắt cáp bằng kéo cắt chỉ để kéo khách vào quán. Bằng chứng: chiều hôm đó cô đã thuê thêm 30 ghế nhựa, vết cắt phẳng, và sổ bán hàng kỷ lục. Ông Năm là nghi phạm gây nhiễu vì từng doạ "cắt dây cho yên".
- Cảnh và đồ vật:
  - `cablepole`, cột điện rối dây: `cuon-cap`, `vet-cat`, `thang-nhom`, `hop-quang`, `banh-xe`.
  - `cafe`, quán cà phê cô Út: `tivi-lon`, `chong-ghe-nhua`, `quay-thu-ngan`, `ro-kim-chi`, `bang-menu`.
  - `namhouse`, hiên nhà ông Năm: `ghe-bo`, `loa-keo`, `bang-cam-on-ao`, `chau-kieng`.

### Vụ 5: "Livestream Đám Cưới Toang" (`dam-cuoi-toang`, độ khó 3)
Đám cưới hẻm tan nát ngay trên sóng livestream. Micro rè, bánh kem đổ, loa phát nhầm nhạc đám ma. Influencer **Bé Mít Review** đang phát trực tiếp và clip "toang" lên xu hướng.
- Nghi phạm:
  - `bemit`: influencer, gậy selfie, váy lấp lánh.
  - `mc`: MC đám cưới, vest bóng, giọng sang sảng.
  - `exdau`: người yêu cũ của cô dâu, áo sơ mi trắng, tới "chúc phúc".
  - `quayphim`: thợ quay phim, máy quay vác vai, áo gile nhiều túi.
  - `mechong`: mẹ chồng, áo dài đỏ, khó tính.
  - Thêm nhân vật phụ `codau` và `chure`.
- Thủ phạm: **bemit**. Cô tự dàn dựng toàn bộ sự cố để clip viral. Bằng chứng: kịch bản quay trong điện thoại, đoạn thu âm nhạc đám ma từ máy cô, và tiền chuyển khoản cho thằng nhóc bưng bánh. Người yêu cũ là manh mối gây nhiễu chính.
- Cảnh và đồ vật:
  - `tent`, rạp cưới: `san-khau`, `ban-banh-kem`, `micro`, `cong-hoa`, `ban-tiec`.
  - `soundbooth`, góc âm thanh: `ban-mixer`, `loa-thung`, `laptop-nhac`, `cuon-day-loa`.
  - `backstage`, hậu trường: `guong-trang-diem`, `tui-xach`, `thung-qua`, `moc-treo-do`.

### Vụ 6: "Chiếc Nhẫn Trong Đám Hỏi" (`nhan-dam-hoi`, độ khó 3, vụ cuối)
Nhẫn gia truyền biến mất ngay trong lễ đám hỏi ở căn nhà lớn đầu hẻm. Vụ có hai lớp: chiếc nhẫn tìm thấy trong bánh kem là **nhẫn giả**. Cameo nhân vật các vụ trước.
- Nghi phạm:
  - `ongnoi`: ông nội chú rể, chủ nhà, khoảng 80 tuổi, gậy trúc.
  - `diba`: dì Ba bên đàng gái, nhiều vàng đeo tay, nói nhiều.
  - `anhhung`: anh họ chú rể, chơi tiền ảo thua lỗ, áo hàng hiệu giả.
  - `chiloan`: bếp trưởng thuê ngoài, nón đầu bếp, làm bánh kem.
  - `beti`: bé Ti 7 tuổi, con nít nghịch ngợm, cầm súng nước. Gây cười, không có tội.
- Thủ phạm: **anhhung**. Anh đã cầm nhẫn thật từ tuần trước để gỡ lỗ tiền ảo, rồi thuê làm nhẫn giả và nhét vào bánh kem để tạo màn "tìm thấy". Dì Ba bị nghi vì từng hỏi giá nhẫn.
- Cảnh và đồ vật:
  - `livingroom`, phòng khách: `ban-tho`, `khay-trau-cau`, `hop-nhan`, `bo-sofa`, `dong-ho-qua-lac`.
  - `kitchen2`, bếp nhà lớn: `banh-kem`, `lo-nuong`, `tu-lanh-lon`, `thot-go`, `hop-dung-cu`.
  - `pawnshop`, tiệm cầm đồ đầu chợ: `quay-cam-do`, `so-cam-do`, `tu-kinh`, `camera-tiem`.

## 3b. Mùa 2: "Chợ Hẻm 47" (vụ 7–12)

Mở sau khi phá xong Vụ 6. Bản đồ mùa 2 là `assets/scenes/hem-map-2.webp`, vẽ khu chợ và đường lớn đầu hẻm, có 6 chấm vụ ghi trong `manifest.hotspots`. Màn bản đồ có 2 tab: "Mùa 1 · Hẻm 47" và "Mùa 2 · Chợ Hẻm".

Luật như mùa 1, với hai điểm riêng:
- Người viết vụ được dùng lại nhân vật mùa 1 làm nghi phạm hoặc nhân vật phụ. Ghi `sheet: "<id vụ cũ>"` trong `people.<pid>` để lấy chân dung có sẵn.
- Mỗi vụ phải có ít nhất 1 cơ chế suy luận **mới**, chưa dùng ở mùa 1, nêu trong từng vụ dưới đây. Cơ chế được dựng bằng các trường có sẵn: điểm soi, `needs`, lời khai, bảng suy luận, `finale.steps`.

### Vụ 7: "Tờ Vé Số Bốc Hơi" (`ve-so`, độ khó 2)
Ông Chín tin chắc mình trúng độc đắc 2 tỉ, nhưng tờ vé số biến mất trong buổi sáng chạy việc vặt khắp chợ.
- Cơ chế mới: **dựng lại lộ trình** buổi sáng. Có 5–6 điểm ghé, mỗi điểm một mốc giờ; vé mất giữa hai điểm nào. Bảng suy luận có câu xếp mốc giờ.
- Nghi phạm:
  - `ongchin`: người mất vé (client). Khoảng 65 tuổi, áo sơ mi cũ, kính lão, nón kết.
  - `bachin`: bà Chín, vợ ông. Hay càm ràm, đeo túi vải đi chợ. Nghi phạm chính, vì ghét ông mê số.
  - `mai`: cô bán vé số dạo, nón lá, xấp vé kẹp trên bảng.
  - `luc`: anh xe ôm công nghệ, áo khoác xanh, nón bảo hiểm.
  - `chutu`: chú Tư sửa xe, tay dính dầu, cờ lê.
- Thủ phạm: **luc**. Vé rớt trên yên xe ôm. Lực dò số thấy trúng, liền giữ lại và nói dối là không thấy gì.
  - Cú lật: Lực chưa dám lãnh vì góc vé bị rách mất số seri. Thật ra góc rách đó nằm trong túi áo ông Chín từ đầu.
- Cảnh và đồ vật:
  - `market`, sạp chợ: `sap-ca`, `can-dia`, `ro-rau`, `xe-day-hang`, `bang-gia`.
  - `garage`, tiệm sửa xe chú Tư: `xe-dang-sua`, `thung-do-nghe`, `binh-hoi`, `ghe-cho`, `lich-hen`.
  - `lottery`, đại lý vé số: `quay-ve-so`, `bang-ket-qua`, `may-do-so`, `camera-dai-ly`, `thung-ve-cu`.

### Vụ 8: "Đêm Karaoke Cúp Điện" (`karaoke`, độ khó 2)
Chung kết "Giọng Ca Vàng Hẻm 47", giải nhất là cái tủ lạnh. Cầu dao bị cúp đúng phần thi của người hát hay nhất, rồi lại lộ chuyện quán quân năm ngoái hát nhép.
- Cơ chế mới: **bảng điện và âm thanh**. Đối chiếu nhật ký cầu dao, danh sách bài và đồng hồ để biết ai đứng gần tủ điện lúc 21:14.
- Nghi phạm:
  - `cothu`: cô Thu, quán quân năm ngoái. Áo kim sa, tóc uốn.
  - `anhtung`: anh Tùng, chủ dàn karaoke kiêm MC. Áo hoa, dây chuyền.
  - `beo`: thằng Béo, thí sinh hát hay nhất, sinh viên, áo thun ban nhạc.
  - `cosau`: cô Sáu, trưởng ban giám khảo tự phong, quạt xếp.
  - `ongnam`: dùng lại từ Vụ 4 (`sheet: "mat-wifi"`). Ông ghét ồn nên bị nghi.
- Thủ phạm: **cothu**. Micro của cô hỏng, sắp lộ chuyện hát nhép, nên cô cúp cầu dao để cuộc thi phải hoãn.
- Cảnh và đồ vật:
  - `stage`, sân khấu giữa hẻm: `man-hinh-loi`, `micro-cay`, `dan-loa`, `bang-ten-thi-sinh`, `tu-lanh-giai-thuong`.
  - `fusebox`, góc tủ điện: `tu-dien`, `cau-dao`, `so-dien`, `den-pin-rot`, `day-dien-noi`.
  - `backalley`, hậu trường sau rạp: `ban-trang-diem`, `thung-bia`, `ao-kim-sa-du-phong`, `xe-ba-gac`.

### Vụ 9: "Hoàng Thượng Mất Tích" (`meo-mat-tich`, độ khó 2)
Mèo Anh lông ngắn "Bơ", ngôi sao TikTok 300 nghìn follow của chị Na shop online, biến mất. Ngay sau đó chị nhận tin nhắn đòi chuộc 5 triệu.
- Cơ chế mới: **phân tích tin nhắn**. So lỗi chính tả, emoji và giờ gửi của tin đòi chuộc với tin nhắn của từng nghi phạm.
- Nghi phạm:
  - `china`: chị Na, chủ mèo (client). Váy hoa, điện thoại 3 camera.
  - `tom`: thằng Tôm, 12 tuổi, cháu hàng xóm. Mê mèo, áo siêu nhân.
  - `bacsy`: anh Khôi, bác sĩ thú y, áo blouse xanh.
  - `cohong`: cô Hồng shop đối thủ, cũng nuôi mèo làm mẫu. Kính râm.
  - `anhship`: anh Đen shipper, thùng hàng sau xe.
- Thủ phạm: **tom**. Tôm giấu Bơ ở nhà để "cho Bơ nghỉ diễn" vì thấy chị Na bắt mèo quay 10 clip một ngày, rồi viết tin chuộc cho giống thật.
  - Cú lật: Bơ trốn sang nhà Tôm từ trước, vì mê mèo cái của nhà Tôm.
  - Không ai bị thương. Kết vụ: chị Na giảm lịch quay.
- Cảnh và đồ vật:
  - `shop`, shop online kiêm phòng quay: `den-quay`, `ke-hang`, `nha-cay-meo`, `chen-an`, `thung-carton`.
  - `vetclinic`, phòng khám thú y: `ban-kham`, `so-kham-benh`, `long-nhot`, `tu-thuoc`.
  - `rooftop2`, sân thượng nhà Tôm: `chuong-meo-tu-che`, `day-phoi-do`, `bon-cat`, `hop-pate-rong`, `ong-nuoc`.

### Vụ 10: "Phong Bì Tất Niên" (`tat-nien`, độ khó 3)
Tiệc tất niên công ty Cà Khịa Media ở nhà hàng. Quỹ bốc thăm 50 triệu trong két biến mất 30 phút trước giờ bốc thăm.
- Cơ chế mới: **sơ đồ chỗ ngồi**. Xếp lại ai ngồi đâu, ai rời bàn lúc nào, theo ảnh check-in và hoá đơn gọi món.
- Nghi phạm (dùng lại Vụ 3, `sheet: "tra-sua-van-phong"`): `vy`, `khoa`, `phong`, `hang`, `dat`. Thêm người mới:
  - `quanly`: anh Lâm, quản lý nhà hàng. Vest đen, bộ đàm.
- Thủ phạm: **hang**. Chị giấu phong bì để vạch trần chuyện năm nào sếp Đạt cũng gài giải đặc biệt cho cháu mình.
  - Cú lật: sếp gian lận bốc thăm. "Kẻ trộm" là người muốn công bằng, nhưng làm sai cách.
- Cảnh và đồ vật:
  - `banquet`, sảnh tiệc: `san-khau-tiec`, `thung-boc-tham`, `ban-sep`, `ban-team`, `cay-mai`.
  - `office2`, phòng quản lý nhà hàng: `ket-sat`, `man-hinh-camera-2`, `so-dat-ban`, `moc-chia-khoa`.
  - `kitchen3`, bếp nhà hàng: `noi-lau`, `xe-day-mon`, `thung-rac-bep`, `tu-dong`, `bang-order`.

### Vụ 11: "Con Ma Nhà Số 13" (`ma-nha-13`, độ khó 3)
Đêm nào căn nhà bỏ hoang cuối hẻm cũng có tiếng khóc và đèn chập chờn. Giá nhà cả hẻm rớt, đã có 3 nhà rao bán.
- Cơ chế mới: **thí nghiệm tại chỗ**. Bật/tắt thiết bị, mở cửa sổ để tái hiện "hiện tượng ma", bằng các điểm soi có `needs` theo thứ tự.
- Nghi phạm:
  - `quan`: anh Quân, môi giới nhà đất. Sơ mi trắng, cặp da, cười nhiều.
  - `bado`: bà Diệu, thầy cúng, áo dài nâu, chuỗi hạt.
  - `nhomyt`: Đạt "Săn Ma TV", YouTuber, đèn đội đầu, gậy selfie.
  - `onghai`: ông Hai, chủ cũ căn nhà, đang sống ở quê, nón lá.
  - `beti`: dùng lại từ Vụ 6 (`sheet: "nhan-dam-hoi"`). Bé Ti nghịch, lén vào chơi.
- Thủ phạm: **quan**. Anh dựng ma bằng loa bluetooth giấu trong tường và bóng đèn hẹn giờ, để mua rẻ cả dãy nhà.
  - Cú lật: Đạt "Săn Ma TV" biết chuyện từ đầu, được trả tiền để quay clip.
- Cảnh và đồ vật:
  - `hauntedhouse`, phòng khách nhà hoang: `ban-tho-cu`, `guong-vo`, `den-chap-chon`, `ghe-dua`, `tuong-am`.
  - `attic`, gác xép: `loa-giau`, `o-cam-hen-gio`, `ruong-go`, `cua-so-gac`, `day-dien-moi`.
  - `realestate`, văn phòng nhà đất đầu chợ: `ban-moi-gioi`, `ban-do-quy-hoach`, `tu-ho-so`, `bang-rao-ban`.

### Vụ 12: "Thám Tử Giả Mạo" (`tham-tu-gia`, độ khó 3, cuối mùa 2)
Trên TikTok nổi lên "Thám Tử Pro" phá án siêu tốc nhưng toàn bắt nhầm. Đúng lúc đó văn phòng Thám Tử Hẻm bị đột nhập, hồ sơ vụ cũ biến mất, và nhóm "Hẻm 47 Hóng Biến" tràn ngập bài bôi nhọ.
- Cơ chế mới: **thám tử đối đầu**. Ở vài bước vạch mặt, Thám Tử Pro đưa ra kết luận sai và người chơi phản bác bằng vật chứng. Dùng `finale.steps` cho lượt phản bác.
- Nghi phạm:
  - `pro`: Hiếu "Thám Tử Pro". Áo măng tô, kính râm, ring light.
  - `ly`: chị Ly, phóng viên trang "Hóng 24h", micro cầm tay.
  - `bao`: anh Bảo, thợ khoá đầu hẻm, chùm chìa khoá.
  - `bacuc`: bà Cúc, chủ nhà cho thuê văn phòng. Đang muốn đòi tăng giá thuê.
  - Tèo (cast `teo`) vô tình làm lộ chìa khoá.
- Thủ phạm: **pro**. Hiếu lấy được bản sao chìa khoá rồi lấy hồ sơ cũ để "phá lại" các vụ trên mạng. Chìa do thợ khoá Bảo in theo chiếc Tèo đưa nhờ in dự phòng, Bảo không biết mình bị lợi dụng.
  - Cú lật: Hiếu nghe lén được lúc Tèo nhờ in chìa.
  - Kết mùa: Tèo nhận lỗi, cả hẻm bênh văn phòng. Hiếu xin học việc.
- Cảnh và đồ vật:
  - `office-night`, văn phòng thám tử ban đêm bị lục tung: `tu-ho-so-mo`, `cua-kinh`, `ban-lam-viec`, `may-tinh`, `meo-van-phong`.
  - `locksmith`, sạp thợ khoá: `may-cat-khoa`, `bang-chia-phoi`, `so-in-khoa`, `ghe-nhua-sap`.
  - `studio`, phòng livestream của Thám Tử Pro: `ring-light-pro`, `bang-ghim-gia`, `dien-thoai-livestream`, `tu-quan-ao`, `ho-so-danh-cap`.

## 4. Định dạng dữ liệu vụ án (data/cases/<id>.js)

Mỗi vụ là một ES module `export default {…}`. Bộ kiểm `node prototype/games/tham-tu-hem/tools/check-case.mjs <file>` phải ra **ĐẠT**. Bộ kiểm xem lỗi tham chiếu, tính đi được tới cuối bằng mô phỏng và lượng nội dung tối thiểu. Mẫu nhỏ: `prototype/games/tham-tu-hem/test/fixtures/mini-case.js`.

**Lời thoại** (`line`): `["who", "câu", "mood?"]` hoặc `{ who, text, mood }`. Giá trị mood: `neutral | nervous | angry | shock | happy | smug`.
**Từ khoá trong chữ**: `[[wordId]]` hiện `words[wordId].text`, còn `[[wordId|chữ khác]]` hiện chữ khác. Người chơi **nhặt từ khoá khi đọc tới**, và chỉ nhặt được ở vật chứng, lời khai, điểm soi và thoại.
**Điều kiện** (`needs`): chuỗi `"clue:x" | "word:x" | "stmt:x"` (đã có lời khai), `"broke:x"` (đã bể lời khai), `"talk:pid.topicId" | "seen:locId.hotspotId" | "flag:x" | "loc:x"`. Dạng mảng nghĩa là tất cả; `{ any:[…] }` nghĩa là một trong số đó.
**Hiệu ứng** (`gives`): `{ clues:[], words:[], stmts:[], flags:[], locs:[], people:[] }`.

```js
export default {
  id: "noi-thit-kho", no: 1, title: "Nồi Thịt Kho Bốc Hơi", tagline: "…", difficulty: 1,
  client: "cohai",                       // người tới nhờ
  intro: [ line… ],                      // văn phòng: khách kể
  social: { group: "Hẻm 47 Hóng Biến", posts: [ { by, text, likes, comments: [ { by, text } ] } ] },
  people: { tuan: { name, role, bio, suspect: true, start: true }, … },   // start:false + gives.people để mở sau
  locations: { kitchen: { name, scene: "kitchen", start: true, intro: [line…],
      hotspots: [ { id: "bep-ga", label: "Bếp ga", rect?: [x,y,w,h], needs?, lines: [line…], gives?, again?: [line…] } ] } },
  clues: { "day-thun-do": { name, desc: "chữ có [[tu-khoa]]", detail?: [line…] } },
  words: { linh: { text: "Linh", kind: "ai" } },   // kind: ai | luc | o | vat | cach | vi | khac
  talks: { tuan: [ { id: "toi-qua", topic: "Tối qua em ở đâu?", needs?, lines: [line…], gives? } ] },
  stmts: { "tuan-ngu-som": { by: "tuan", text: "Em ngủ từ [[9h-toi|9 giờ]]…",
      break?: { clue: "anh-story", lines: [line…], gives } } },
  present: { tuan: { "day-thun-do": [line…] } },  // đưa vật chứng ngoài mâu thuẫn: câu đáp riêng (hài)
  wrong: { tuan: [ [line…], [line…], [line…] ] },  // ≥ 3 phản ứng khi đưa sai
  deduction: [ { id, text: "Thủ phạm là {a}, ra tay lúc {b}.", blanks: { a: { answer: "linh", kind: "ai" }, b: { answer: "11h-dem", kind: "luc" } }, explain: [line…] } ],
  finale: { culprit: "linh", intro: [line…], steps: [ { claim: [line…], answer: "clueId", right: [line…], wrong: [line…] } ],
            confess: [line…], epilogue: [line…], comments: [ { by, text, likes } ] },
  hints: [ { needs?, text } ],           // Tèo; game chọn gợi ý đầu tiên mà điều kiện còn hợp
  bonus: [ { id, q, choices: [..], answer: 0, explain } ],
};
```

### Trường tuỳ chọn (thêm khi dựng engine; không đổi nghĩa trường cũ, bộ kiểm có kiểm)

- **Phủ định trong `needs`**: tiền tố `!`, ví dụ `"!broke:tuan-ngu-som"`, `"!clue:x"`. Đúng khi nguyên tử KHÔNG đạt. Bộ kiểm mô phỏng coi nguyên tử phủ định là đạt.
- `stmts.<id>.break.also: [clueId…]`: vật chứng thay thế cũng bể được lời khai này (ngoài `break.clue`).
- `hints[].done`: điều kiện (`needs`) để gợi ý coi như đã xong, Tèo không nói nữa. Engine còn tự bỏ qua: gợi ý đã nói (nếu còn gợi ý khác hợp), và gợi ý có điều kiện `stmt:x` mà mọi lời khai đó đều đã bể.
- `finale.steps[].hint`: câu gợi ý của Tèo riêng cho bước vạch mặt đó (không có thì dùng câu chung).
- `teoRescue: [[line…], …]`: các bộ thoại Tèo can khi hết uy tín (không có thì dùng bộ chung).
- Bộ kiểm **cảnh báo** (không phải lỗi) khi có từ khoá trong `words` không bao giờ nhặt được.

Cách engine đọc dữ liệu: gợi ý = gợi ý đầu tiên trong mảng có `needs` đạt (xếp gợi ý giai đoạn cuối lên đầu, gợi ý không `needs` ở cuối). Mọi người trong `people` đã mở đều thẩm vấn và đưa vật chứng được (nghi phạm xếp trước). Địa điểm có `needs` tự mở khi đạt; `gives.locs` mở ngay.

Toạ độ `rect` tính trên ảnh cảnh 960×540. Nếu manifest có `hotspots[scene][id]` thì dùng toạ độ manifest.

### Lượng nội dung tối thiểu (bộ kiểm báo lỗi nếu thiếu)

| | độ khó 1 | 2 | 3 |
|---|---|---|---|
| Nghi phạm | 3 | 4 | 5 |
| Địa điểm | 3 | 3 | 3 |
| Điểm soi mỗi địa điểm (gồm điểm gây cười) | 5 | 5 | 5 |
| Vật chứng | 8 | 10 | 12 |
| Lời khai bể được | 2 | 3 | 4 |
| Câu suy luận / chỗ trống | 2 / 4 | 3 / 6 | 4 / 8 |
| Bước vạch mặt | 3 | 3 | 4 |
| Phản ứng đưa sai mỗi nghi phạm | 3 | 3 | 3 |
| Bình luận viral cuối vụ | 12 | 12 | 15 |
| Gợi ý Tèo | 5 | 6 | 7 |
| Chủ đề hỏi mỗi nghi phạm | 3 | 3 | 3 |

Giọng văn: tiếng Việt đời thường miền Nam, hài và có meme nhưng không tục, không công kích vùng miền, giới tính hay ngoại hình. Mỗi vụ phải có ít nhất 2 manh mối gây nhiễu hợp lý và 1 cú lật. Phá án phải **công bằng**: mọi đáp án đều suy ra được từ thứ người chơi đã thấy.

## 5. Asset (Codex): xem `docs/tham-tu-hem/asset-spec.json`

- Cảnh hiện trường 960×540 (lưới 2×), đồ vật chính đúng danh sách §3, ghi `hotspots` vào manifest.
- Chân dung bán thân HD 1× trong ô 256×256, 4 biểu cảm: `neutral, nervous, angry, shock`. Riêng `me`, `teo`, `batu`, `chuba` có thêm `happy, smug`.
- Đợt sau (khi vụ viết xong): icon vật chứng ô 96×96 (lưới 2×), lấy danh sách từ `data/cases/*.js`.

Khi chưa có ảnh, game vẽ thay bằng code (khung cảnh tối, ô điểm soi có nhãn, chân dung chữ cái đầu) để luôn chơi được.
