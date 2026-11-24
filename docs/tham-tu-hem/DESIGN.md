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
