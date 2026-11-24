# Thám Tử Hẻm: đợt 3 cho Codex

Làm tiếp trên nhánh `claude/tth-wave3`. Nhánh này tạo từ `codex/tham-tu-hem-assets`, `asset-spec.json` đã cập nhật sẵn. Kiểm như cũ:

```
python -I tools/asset-check/check_assets.py docs/tham-tu-hem/asset-spec.json --preview <tmp>
```

Phải ra "0 lỗi — ĐẠT", ghi vào ASSET-HANDOFF.md.

## A. Điểm soi thêm và chân dung phụ (ưu tiên 1)

Người viết vụ đã thêm điểm soi ngoài danh sách gốc. Liệt kê theo vụ ở mục C.
- Nếu đồ vật **đã có sẵn trong cảnh**: chỉ ghi `manifest.hotspots`.
- Nếu **chưa có**: vẽ thêm vào cảnh, giữ lưới 2× và giữ nguyên mọi đồ vật cũ cùng toạ độ cũ.
- Điểm soi nằm chồng lên đồ vật chính (như `thu-nhat` sau góc poster, `nut-gain` trên bàn mixer, `khe-day-cap`, `canh-tu-tho`, `hop-qua-lac`): ghi vùng nhỏ đúng chi tiết đó, nên vẽ chi tiết rõ hơn một chút.
- Chân dung phụ (Tũn; Khang, Ngọc, chú Sáu cầm đồ): thêm vào sheet chân dung của vụ, ô 256, 4 biểu cảm như các vai khác.

## B. Icon vật chứng (ưu tiên 2)

93 icon, mỗi vụ một sheet `assets/clues-<vụ>.webp`, ô 96×96 lưới 2×, tên frame = id vật chứng.
- Vẽ đúng phần **Mô tả**.
- Chữ trên đồ vật (giấy, màn hình điện thoại) chỉ cần gợi hình. Đừng cố viết chữ đọc được ở 48 px, trừ con số lớn như "2:45".

## D. Âm thanh (ưu tiên 3)

Thả vào `prototype/games/tham-tu-hem/assets/audio/`. Định dạng mp3 như Quán Cơm Tấm. Ghi danh sách, độ dài và nguồn vào `docs/tham-tu-hem/AUDIO.md`.
- Tiếng hiệu ứng: ngắn, rõ, mức âm đều nhau (khoảng −16 LUFS).
- Nhạc: vòng lặp liền mạch, 60–120 s, không lời. Màu nhạc trinh thám hài: jazz noir pha nhạc cụ Việt (đàn bầu, đàn nguyệt, mõ) và synth 16-bit.

| Tên file | Dùng khi |
|---|---|
| `type-blip.mp3` (+ `type-blip-2/3`) | Chữ thoại chạy, rất ngắn, nhỏ |
| `click.mp3` | Bấm nút / chọn |
| `page-flip.mp3` | Mở sổ tay, đổi tab |
| `clue-found.mp3` | Nhặt vật chứng (ting sáng + giấy) |
| `keyword.mp3` | Nhặt từ khoá (pop nhỏ) |
| `inspect.mp3` | Soi điểm không có gì (hừm / kính lúp) |
| `objection.mp3` | Vạch mâu thuẫn đúng: tem đóng mạnh + sting |
| `wrong.mp3` | Đưa sai vật chứng (buzz hài) |
| `lose-cred.mp3` | Mất 1 uy tín (kính nứt) |
| `deduce-ok.mp3` / `deduce-bad.mp3` | Chốt suy luận đúng hết / còn chỗ sai |
| `confront.mp3` | Bắt đầu vạch mặt (trống dồn) |
| `confess.mp3` | Thủ phạm nhận tội (sting kịch tính) |
| `case-solved.mp3` | Tem "ĐÃ PHÁ" + fanfare ngắn |
| `rank-up.mp3` | Lên hạng thám tử |
| `zalo-ping.mp3` | Thông báo nhóm Zalo / bài đăng mới |
| `like-pop.mp3` | Like / bình luận hiện lên |
| `door-bell.mp3` | Khách vào văn phòng |
| `teo-hint.mp3` | Tèo gợi ý (tiếng "ê sếp" bằng nhạc cụ, không giọng người) |
| `map-select.mp3` | Chọn vụ trên bản đồ |
| `amb-rain-alley.mp3` | Nền: hẻm đêm mưa nhẹ (loop) |
| `amb-office.mp3` | Nền: văn phòng, quạt trần, đồng hồ tích tắc (loop) |
| `music-map.mp3` | Nhạc bản đồ hẻm (loop) |
| `music-investigate.mp3` | Nhạc điều tra, nhẹ, tò mò (loop) |
| `music-interrogate.mp3` | Nhạc thẩm vấn, căng hơn (loop) |
| `music-finale.mp3` | Nhạc vạch mặt, cao trào (loop) |
| `music-solved.mp3` | Kết vụ, ấm áp, hài (loop ngắn) |

## C. Danh sách theo vụ

### Vụ 1: Nồi Thịt Kho Bốc Hơi (`assets/clues-noi-thit-kho.webp`)

| id | Tên | Mô tả (vẽ cái này) |
|---|---|---|
| `vet-nuoc-mau` | Vòng nước màu trên bếp | Vòng nước màu khô tròn cỡ đáy nồi. Không giọt nào rớt ra ngoài: người lấy nồi nhấc nhẹ tay, không vội vàng. |
| `vo-mi-sa-te` | Vỏ gói mì sa tế | Vỏ mì 'Tôm Chua Cay Sa Tế Cấp Độ 7' trong thùng rác bếp chung, dính dầu sa tế đỏ cam, lấm tấm hột ớt. |
| `noi-mi-tuan` | Nồi mì của Tuấn | Nồi nhôm mini 'TUẤN – CẤM XÀI' ngâm trong bồn rửa nghẹt, đáy còn cặn sa tế. Ai đó đã xuống bếp nấu mì tối qua và làm nghẹt luôn bồn rửa. |
| `ao-tuan` | Áo thun của Tuấn | Áo 'Deadline là bạn' có vệt đỏ cam lấm tấm hột ớt, thơm mùi tỏi phi. Nước màu thịt kho thì nâu cánh gián và không có hột ớt. |
| `lich-live` | Poster lịch live | Poster trên bảng tin: 'Tối 27 Tết, 23h30: ĂN ĐÊM MÓN MẸ NẤU 🥺 Mục tiêu 10K mắt xem!' của kênh Linh Hồng Ăn Đêm. Đặt mục tiêu câu view Tết. |
| `clip-live` | Bản phát lại livestream | Live 'THỊT KHO MẸ NẤU 🥺' của Linh, bắt đầu 23h30. Phông nền là bồn nước và dây phơi trên sân thượng. Nồi trên bàn có quai buộc dây thun đỏ. Lúc 23h52 tài khoản 'Sáu Chìa Khoá' tặng 10 bông hồng. |
| `noi-sach` | Nồi úp trên sân thượng | Nồi nhôm sạch bong úp phơi trên sân thượng: nắp móp một góc, quai trái buộc dây thun đỏ. Chính là nồi của cô Hai. |
| `cay-nhua` | Chậu cây nhựa | Mấy chậu kiểng trên sân thượng là cây nhựa 35k, đất khô nứt. Không ai cần (và không ai) tưới. |
| `vet-nuoc-bon` | Vũng nước dưới bồn nước | Dưới vòi bồn nước sân thượng: vũng nước ánh nâu, cọng hành lá, bọt rửa chén. Có người đã rửa một cái nồi thịt kho ở đây. |
| `dep-long-hong` | Dép lông hồng ướt | Dép lông hồng trước phòng Linh ướt nhẹp, dính bọt xà phòng và vệt nâu lợt. Dấu dép nối từ cầu thang sân thượng về phòng 4. |
| `hinh-noi` | Hình nồi thịt kho cô Hai khoe | Hình cô Hai đăng Zalo lúc 9h tối: nồi nhôm đầy thịt kho trứng, nắp móp một góc, quai trái lỏng nên buộc sợi dây thun đỏ. |
| `hoa-don-chao` | Phiếu tính tiền quán cháo | Phiếu quán cháo Dì Chín lúc 5h12 sáng: 'Cháo lòng x2, khách mang nồi'. Cái nồi ông Sáu xách là nồi đựng cháo. |

**Điểm soi thêm (ghi manifest.hotspots):**
- `kitchen.webp` · `meo-mun`: Con mèo mướp (rect gợi ý [200,430,90,70])
- `hallway.webp` · `cau-thang`: Cầu thang lên sân thượng (rect gợi ý [790,80,160,400])
- `rooftop.webp` · `ang-ten`: Ăng-ten cũ (rect gợi ý [600,20,80,120])

### Vụ 2: Chiến Kê Mất Tích (`assets/clues-chien-ke.webp`)

| id | Tên | Mô tả (vẽ cái này) |
|---|---|---|
| `hinh-chien-than` | Hình Chiến Thần | Gà chọi lông đỏ tía, đuôi xanh đen, chân vàng. Đeo vòng chân nhựa xanh số 07. Mổ người lạ, hiền với người nhà. |
| `chuong-trong` | Chuồng gà trống | Chốt chuồng kéo ra gọn, không lông rơi, không vết giãy giụa. Người bắt là người Chiến Thần quen, nó không thèm kêu. |
| `vet-lua` | Vệt lúa rơi | Bao lúa ngâm gừng vơi một vốc. Hột lúa rơi thành vệt từ bao tới chỗ dựng xe đạp: có người dụ gà bằng lúa. |
| `ban-le-dau` | Bản lề mới tra dầu | Cổng sắt kêu két ba năm nay, đêm qua có người tra dầu tra xích vào bản lề cho êm. Chốt mở từ bên trong nhà. |
| `bun-xe-dap` | Xe đạp dính bùn đỏ | Xe đạp của Bin: hai bánh dính bùn đất đỏ còn ướt, lông đỏ tía kẹt nan bánh, trong giỏ có chai dầu tra xích mới. Hẻm 47 tráng bê tông, chỉ hẻm 52 đang đào cống mới có đất đỏ. |
| `camera-dem` | Camera tiệm vàng đêm qua | 23h04 người đội nón tai bèo chĩa điện thoại vô chuồng gà. 2h50 shipper áo xanh lá dừng ở cổng, 2h53 phóng đi. 3h07 người mặc áo mưa tiện lợi dắt xe đạp ra, balo phồng động đậy, lòi ống quần hình khủng long. 4h30 xe tải giao thùng xốp cho xe cơm gà. |
| `thung-xop-ga` | Thùng xốp gà công nghiệp | Nhãn: 'Gà công nghiệp làm sẵn – 20 con – chợ đầu mối – giao 4h30'. Lông trắng, không phải lông đỏ tía của Chiến Thần. |
| `thong-bao-cong` | Thông báo đào cống | Phường thi công cống thoát nước hẻm 52 từ 20 đến 25/11, đường đất đỏ. Hẻm 47 đã tráng bê tông. |
| `dep-lac` | Chiếc dép lạc | Một chiếc dép tổ ong chân trái, rớt giữa đường gần cổng nhà ông Bảy. Ai đó chạy vội tới mức không quay lại lượm. |
| `don-hang-dem` | Đơn hàng 2h50 | Đơn trên app của Hải: khách 'Bin 2k9 ôn thi', giao 2h50 tới nhà ông Bảy. Gồm 2 ly mì cay, 2 lon nước tăng lực, 1 áo mưa tiện lợi. Ghi chú: 'Để ở cổng, đừng bấm chuông, nhà có ông ngủ + gà'. |
| `dong-ho-bao-thuc` | Đồng hồ báo thức | Đồng hồ trong phòng Bin hẹn 2h45 đêm qua, tên báo thức 'CHIẾN DỊCH G 🐔'. Nhạc chuông: tiếng gà gáy. |
| `nhat-ky-mat-ngu` | Giấy note mất ngủ | '4h00: GÀ GÁY. 4h05: tỉnh. 4h10: quên công thức đạo hàm. Lặp lại 87 ngày.' Bin bị tiếng gáy 4 giờ sáng hành suốt mùa ôn thi. |
| `balo-long-ga` | Balo khoét lỗ | Balo đi học của Bin bị khoét ba lỗ thở, bên trong có hột lúa ngâm gừng và lông đỏ tía, đuôi xanh đen. |
| `do-ngu-khung-long` | Đồ ngủ khủng long | Bộ đồ ngủ khủng long xanh lá của Bin, ống quần còn ẩm, dính bùn đất đỏ. Trùng với ống quần lòi dưới áo mưa trong camera lúc 3h07. |
| `thu-gui-nhat` | Thư gửi Nhật | Bản nháp thư của Bin: gửi Chiến Thần lên sân thượng nhà Nhật mấy bữa, dặn cho ăn lúa, thứ Bảy rước về kịp giải. 'Đừng cho ông Tám biết.' |
| `ghi-am-ga-gay` | File ghi âm của ông Tám | File 'ChienThan_gay_23h04.m4a' trong điện thoại ông Tám: Chiến Thần gáy rõ mồn một lúc 23h04. Lúc đó gà còn trong chuồng. |

**Điểm soi thêm (ghi manifest.hotspots):**
- `yard.webp` · `ga-mai`: Gà mái Hoa Hậu (rect gợi ý [230,450,80,60])
- `alley.webp` · `dep-lac`: Chiếc dép lạc (rect gợi ý [500,470,60,40])
- `binroom.webp` · `giuong`: Giường (rect gợi ý [640,300,300,220])
- `binroom.webp` · `thu-nhat`: Sau tấm poster (rect gợi ý [440,120,80,70])

### Vụ 3: Ly Trà Sữa Văn Phòng (`assets/clues-tra-sua-van-phong.webp`)

| id | Tên | Mô tả (vẽ cái này) |
|---|---|---|
| `ly-rong` | Ly rỗng của chị Vy | Ly size L, nắp màng có lỗ chọc to vừa ống hút to bản, nhưng KHÔNG có ống hút. Còn hai hạt trân châu và vệt kem cheese. Ghi "CỦA VY – ĐỤNG VÀO LÀ KPI = 0". |
| `hoa-don-vy` | Hoá đơn của chị Vy | Tiệm Trà Sữa, giao 12:05. Ô Long Full Topping size L, 30% đường, ít đá: trân châu đen, trân châu trắng, thạch phô mai, pudding trứng, kem cheese "Mây Trôi Lững Lờ", thạch "Drama Queen". Kèm 1 ống hút to bản hồng. 68.000đ. |
| `lich-truc` | Lịch trực pantry | Thứ Sáu: Khoa dọn tủ lạnh. Cột đã làm có tick "✔ 12h50". |
| `hop-com-dat` | Hộp cơm mốc của sếp Đạt | Hộp cơm sườn ghi "ĐẠT – 02/11", mốc ba màu, vừa bị dọn khỏi tủ lạnh hôm nay. Một hộp cơm mốc đúng nghĩa đen. |
| `log-camera` | Nhật ký camera pantry | Camera pantry TẮT lúc 13:02, BẬT lại 13:17. Cả hai lần đều "thao tác thủ công", tài khoản it_admin, tại SERVER-CONSOLE trong phòng server. |
| `giay-pass` | Giấy dán mật khẩu | Dán trên tủ server: "it_admin / CaKhia@123 – ĐỪNG AI ĐỌC". Ai vô được phòng server cũng tắt được camera. |
| `log-the-tu` | Log thẻ từ phòng server | Bảo vệ toà nhà gửi: hôm nay cửa phòng server chỉ ghi nhận "12:41 – thẻ ĐẠT – VÀO" và "13:42 – thẻ ĐẠT – RA". Không còn ai quẹt thẻ từ trong buổi trưa. |
| `bit-mat-ngu` | Bịt mắt ngủ BOSS | Bịt mắt ngủ kim tuyến chữ BOSS và nút tai cam, nằm trên hai ghế xoay ghép thành giường sau tủ server. |
| `ly-hang` | Ly trà sữa của Hằng | Ly Tiệm Trà Sữa rỗng giấu sau màn hình Hằng. Hồng trà kem muối. Ống hút còn cắm nguyên, tròn vo, dính son môi hồng. |
| `hoa-don-hang` | Hoá đơn của Hằng | Tiệm Trà Sữa, giao 13:09: Hồng trà kem muối, 100% đường, size L. Ghi chú: "GIAO TẬN SẢNH TẦNG TRỆT, ĐỪNG GỌI TÊN, ĐỪNG LÊN LẦU". Người nhận ký: Hằng. |
| `video-khoa` | Video TikTok của Khoa | Tập 14 "1 ngày làm thực tập sinh", quay lúc 13:06. Góc sau khung hình: bàn của Phong trống trơn, ghế xoay còn quay lừ đừ, đôi sneaker nằm dưới gầm. |
| `coc-ong-hut` | Bảo tàng ống hút của Phong | Ống cắm bút trên bàn Phong toàn ống hút, cái nào cũng cắn dẹt kiểu răng cưa, mép răng đều như in. |
| `ong-hut-det` | Ống hút trong khe dây cáp | Ống hút to bản hồng logo Tiệm Trà Sữa, kẹt trong dây cáp phòng server. Đầu ống cắn dẹt răng cưa, trong lòng dính kem cheese. |
| `don-coc` | Đơn hàng cốc Best Boss | Tờ in kẹt máy in: sếp Đạt tự đặt mua cốc "BEST BOSS", dặn shop gói giấy hoa kèm thiệp "Từ cả team, yêu sếp". |
| `tin-nhan-hua` | Tin nhắn hứa của chị Vy | Ba tin nhắn chị Vy gửi Phong sau ba đêm Phong thức sửa server: "Xong vụ này chị bao full topping nha 😘" (7/10), "Tuần sau chị bao, hứa luôn" (21/10), "Chị nhớ mà, mai nha" (8/11). Không ly nào tới. Đó là lời hứa bao trà sữa bị quên. |

**Điểm soi thêm (ghi manifest.hotspots):**
- `pantry.webp` · `ke-ly`: Kệ cốc (rect gợi ý [570,250,170,60])
- `openoffice.webp` · `thung-rac-hang`: Thùng rác dưới bàn Hằng (rect gợi ý [620,450,70,70])
- `openoffice.webp` · `cua-phong-sep`: Cửa phòng sếp (rect gợi ý [700,40,120,190])
- `serverroom.webp` · `khe-day-cap`: Khe dây cáp (soi đèn pin) (rect gợi ý [420,450,140,60])
- `serverroom.webp` · `may-lanh`: Máy lạnh (rect gợi ý [700,40,200,70])

### Vụ 4: Đêm Chung Kết Mất Wifi (`assets/clues-mat-wifi.webp`)

| id | Tên | Mô tả (vẽ cái này) |
|---|---|---|
| `vet-cat` | Vết cắt trên bó cáp | Bó cáp chỗ dây võng thấp (khoảng 2 m) bị cắt đứt. Vết cắt một nhát phẳng, mép gọn. Kẹt ở mép vỏ cáp một sợi chỉ đỏ may vải. |
| `nhan-hop-quang` | Nhãn hộp quang | Hộp quang Hẻm 47 phục vụ 52 thuê bao. Ghi chú: "Quán Út – KHÔNG thuộc hộp này. Cáp riêng từ đường lớn." Cắt bó cáp này thì cả hẻm mất sóng, trừ quán cô Út. |
| `dau-dep` | Dấu dép trên bánh xe | Trên vành bánh xe ba gác dưới chỗ dây võng: dấu dép hoa bông mai cỡ nhỏ, bùn còn ướt (sau cơn mưa 6 giờ). Có người đứng lên bánh xe ba gác để với tới dây. |
| `kim-loc` | Kìm cắt cáp của Lộc | Kìm cắt cáp chuyên dụng lưỡi mỏ quạ trong thắt lưng đồ nghề của Lộc, móc trên cuộn cáp mới. |
| `phieu-thue-ghe` | Phiếu thuê 30 ghế nhựa | Hai Lúa cho thuê bàn ghế: 30 ghế nhựa, ký lúc 15:00, giao 16:00, trả sáng mai. Người thuê: Út. Thuê trước lúc mất mạng hơn bốn tiếng. |
| `so-ban-hang` | Sổ bán hàng quán Út | Tối nay 214 ly (tối qua 38). Đầu ca: "17:40 – Lộc nhà mạng – 3 bạc xỉu – ghi sổ" kèm trái tim bị gạch. "19:38 – Ông N. – trà đá – bàn góc khuất – đội nón lá". |
| `keo-cat-chi` | Kéo cắt chỉ của cô Út | Kéo cắt chỉ nhỏ mũi nhọn trong rổ kim chỉ sau quầy. Khoen quấn chỉ đỏ, mép lưỡi dính vụn nhựa đen giống vỏ cáp. |
| `bang-ron` | Băng rôn may tay | "QUÁN ÚT – CHIẾU BÓNG ĐÁ – WIFI MẠNH NHẤT HẺM", may bằng chỉ đỏ, mũi chỉ mới, đầu chỉ chưa tỉa. Vừa may chiều nay. |
| `bang-cam-on` | Bảng "Cấm ồn ào" | Bảng trước nhà ông Năm: "CẤM ỒN ÀO. Đứa nào mở loa kẹo kéo nữa, tui CẮT DÂY cho yên!" |
| `keo-tia` | Kéo tỉa kiểng của ông Năm | Kéo tỉa kiểng lưỡi cong to bản, dính nhựa cây, mẻ một chỗ. Cắt gì cũng để lại vết xéo, dập hai bên. |
| `khan-co-dong` | Khăn cổ động dưới gối | Khăn đỏ sao vàng và lịch thi đấu ghi tỉ số từng trận, giấu dưới gối ghế bố nhà ông Năm. "Chung kết – 19g30 – nhất định thắng!!!" |
| `lich-su-tran` | Lịch sử trận rank của Tí | "THUA – Mất kết nối – 19:12:40 – trừ 25 điểm." Mốc giờ chính xác lúc cáp bị cắt. |
| `sac-rgb` | Cục sạc RGB của Tí | Cục sạc dự phòng đèn bảy màu cắm ở góc quán cô Út: "CỦA TÍ GAMING – ĐỪNG RÚT – RÚT LÀ THUA RANK". |
| `clip-ti` | Clip ghi màn hình của Tí | Tí quay lại trận rank gỡ điểm ở quán cô Út. Phút 20:05 cả quán hét vì bàn thắng; góc khung hình, ông Năm đội nón lá kéo sụp, quàng khăn đỏ, đứng bật dậy hét "VÀOOOO!". |
| `tin-nhan-loc` | Tin nhắn cô Út gửi Lộc | 14:10, cô Út: "Lộc ơi, cáp mạng mà đứt thì nhà mạng mấy tiếng mới sửa xong vậy? Hỏi chơi thôi 😅". Lộc: "Ban đêm thì phải sáng mai mới có đội hàn nha cô 😊". |

**Điểm soi thêm (ghi manifest.hotspots):**
- `cablepole.webp` · `meo-tren-day`: Con mèo trên dây (rect gợi ý [100,30,120,70])
- `cafe.webp` · `goc-o-dien`: Góc ổ điện (rect gợi ý [40,120,100,100])
- `cafe.webp` · `ban-goc-khuat`: Bàn góc khuất (rect gợi ý [200,380,130,120])
- `namhouse.webp` · `cua-so`: Cửa sổ (rect gợi ý [620,60,120,140])

### Vụ 5: Livestream Đám Cưới Toang (`assets/clues-dam-cuoi-toang.webp`)

| id | Tên | Mô tả (vẽ cái này) |
|---|---|---|
| `clip-live-mit` | Bản phát lại buổi live | Live của Bé Mít: 19h28 ‘đi dặm phấn hai phút’ rồi tắt hình, 19h30 hình lên lại đúng lúc micro hú. 19h43 lia ngang hậu trường thấy anh Lâm ôm hai hộp xốp, máy quay đặt dưới đất. |
| `nhat-ky-mixer` | Nhật ký bàn mixer | 18h soundcheck. 19h28 gọi cảnh ‘MC BẢO – Giọng Trầm Ấm 3’. 19h29 nút gain kênh 1 vặn lên tối đa. 19h30 micro hú. |
| `kim-tuyen-hong` | Kim tuyến trên nút gain | Mấy hạt kim tuyến lục giác hồng ánh bạc kẹt trong khía nút gain kênh 1. Không phải kim sa tròn màu vàng. |
| `kim-tuyen-vay` | Mẫu kim tuyến váy của Mít | Một hạt kim tuyến gỡ từ váy dự phòng ‘Mít – bộ 2 (lên hình lúc khóc)’: lục giác, hồng ánh bạc. |
| `kim-tuyen-trung-khop` | Hai mẫu kim tuyến khớp nhau | Kim tuyến trên nút gain và kim tuyến váy của Bé Mít cùng hình, cùng cỡ, cùng màu, cùng lớp keo. Người vặn nút gain lúc 19h29 mặc đồ của Mít. |
| `phim-19h29` | Đoạn phim 19h29 của anh Lâm | Lúc 19h29 MC Bảo đã đứng trên sân khấu, tay cầm micro, đang pha trò. Góc phải khung hình, sau tấm màn góc âm thanh, có một vệt lấp lánh hồng cúi lom khom. |
| `file-ghi-am` | Lịch sử Bluetooth của loa thùng | 19h41 loa nối Bluetooth với máy tên ‘Ba Lấp Lánh’. 19h42 phát ‘Ghi âm 0047.m4a’, là tiếng kèn đám ma. 19h44 ngắt. |
| `giay-note-me` | Giấy note của bà Hạnh | Dán trên laptop nhạc: ‘Bài 5: Đắp Mộ Cuộc Tình… Bỏ hết nhạc tưng tưng. Má Hạnh duyệt, 19h10’. Laptop tạm dừng từ 19h41. |
| `bai-chuc-phuc` | Bài chúc phúc của anh Tín | Tờ bài chúc phúc ký tên Tín, kẹp dưới cuộn dây loa trong góc âm thanh: ‘…Anh xin tặng em bài hát do anh tự sáng tác’. |
| `usb-that-tinh` | USB nhạc thất tình | USB của anh Tín: 47 bài ballad buồn, có bài tự thu trong phòng tắm. Không có tiếng kèn đám ma nào. |
| `tin-nhan-thue-mit` | Tin nhắn Zalo bà Hạnh – Bé Mít | Bà Hạnh chuyển 2 triệu thuê Mít live ‘cho bà con dưới quê coi’. Mít trả lời: ‘Cô yên tâm, con sẽ làm đám cưới này NỔI TIẾNG cả nước luôn 😉 Có gì bất ngờ cô đừng giật mình nha’. |
| `hop-tai-nghe` | Hộp tai nghe ‘Ba Lấp Lánh’ | Trong túi xách của Bé Mít: hộp tai nghe không dây khắc tên chủ máy ‘Ba Lấp Lánh’, dán sticker Bé Mít Review. |
| `vach-x` | Dấu băng keo chữ X | Vạch X băng keo dạ quang xanh trên sàn ngay trước bàn bánh, đúng chỗ thằng nhỏ té. Không phải băng keo của dịch vụ tiệc. |
| `chuyen-khoan-tun` | Thông báo chuyển khoản trên điện thoại Tũn | 18h47: ‘+500.000đ từ NGUYEN THI MIT. Nội dung: cat-xe vai bung banh, nho te dung vach X, dung de banh trung nguoi’. |
| `zoom-truoc` | Góc máy zoom trước | Anh Lâm phân tích clip: máy của Mít zoom vô bàn bánh lúc 19h44 phút 54 giây, sáu giây trước khi thằng nhỏ bước ra. Lúc 19h41 máy đã quay sẵn về phía loa thùng. Người quay biết trước chuyện gì sắp xảy ra. |
| `kich-ban-quay` | Kịch bản quay trên điện thoại phụ | Ghi chú ‘KỊCH BẢN ĐÁM CƯỚI VIRAL’ trên điện thoại thứ hai tên ‘Ba Lấp Lánh’: 19h29 vặn mic, 19h41 nối BT phát Ghi âm 0047, 19h45 Tũn té vạch X, 19h46 khóc. Mục tiêu: ‘3 triệu view, lên xu hướng’. |

**Chân dung thêm vào `portraits-dam-cuoi-toang.webp`:** `tun` (Thằng Tũn: Phụ bưng bê bên dịch vụ tiệc. 13 tuổi, con của chủ dịch vụ tiệc, phụ bưng bánh kiếm tiền tiêu vặt. Người té trong clip.)

**Điểm soi thêm (ghi manifest.hotspots):**
- `tent.webp` · `man-hinh-led`: Màn hình LED (rect gợi ý [330,30,300,100])
- `tent.webp` · `bong-bay-chu`: Bóng bay chữ (rect gợi ý [720,30,200,90])
- `soundbooth.webp` · `nut-gain`: Nút gain kênh 1 (rect gợi ý [330,250,40,40])
- `soundbooth.webp` · `cong-usb`: Cổng USB của laptop (rect gợi ý [250,300,40,30])
- `soundbooth.webp` · `ghe-dj`: Ghế xoay (rect gợi ý [440,360,110,150])
- `backstage.webp` · `den-guong`: Soi kim tuyến dưới đèn gương (rect gợi ý [100,110,60,60])
- `backstage.webp` · `hop-xop`: Hai hộp xốp (rect gợi ý [560,420,140,90])
- `backstage.webp` · `dien-thoai-phu`: Điện thoại đang sạc (rect gợi ý [270,330,70,50])

### Vụ 6: Chiếc Nhẫn Trong Đám Hỏi (`assets/clues-nhan-dam-hoi.webp`)

| id | Tên | Mô tả (vẽ cái này) |
|---|---|---|
| `anh-ba-co` | Di ảnh bà cố đeo nhẫn | Ảnh chụp năm 1960: nhẫn vàng chạm rồng, mặt ngọc bích, mấu chấu thứ ba bị mẻ một góc từ năm 1968. |
| `nuoc-bac-ha` | Nước súng Bé Ti | Nước văng trên khay trầu cau: xanh lá, thơm siro bạc hà, khô thì dính tay. Bé Ti bắn trúng khay nhẫn lúc 9h15. |
| `vun-ma-vang` | Vụn mạ trong hộp nhẫn | Vụn nhũ vàng bong ra như sơn, nằm sâu trong khe nệm hộp nhẫn. Vàng thật không bong. Chiếc nhẫn nằm trong hộp những ngày qua là đồ mạ. |
| `ao-guci` | Áo khoác ‘GUCCl’ ướt | Áo khoác ghi ‘GUCCl’ (chữ L thường) vắt trên sofa, ướt tay áo và vạt trước, phai màu xanh lam ra nệm. Áo của anh Hùng. |
| `vet-xanh-banh` | Vết xanh trên bánh kem | Lỗ chọc ở tầng hai bánh kem, trét kem lại vội. Quanh lỗ có vệt xanh lam, không mùi, kẹt một sợi vải. |
| `nhan-trong-banh` | Nhẫn tìm thấy trong bánh kem | Nhẫn vàng mặt ngọc lăn ra khi cắt bánh kem ngay chỗ vết xanh. Cầm lên thấy hơi nhẹ tay. |
| `nhan-gia` | Kết quả thẩm định: nhẫn giả | Dì Ba soi: vàng mạ, ngọc thuỷ tinh, chữ ‘PHUC 1925’ khắc máy. Bốn mấu chấu nguyên vẹn, không mẻ. Mặt trong có dấu dập ‘MK-247’. |
| `bien-lai-kem` | Biên lai mua kem tươi | ‘Tạp hoá Cô Năm – 2 hộp kem tươi – 9h22’. Tạp hoá ở cuối hẻm, người mua rời bếp khoảng 9h20. |
| `lo-nuong-lanh` | Lò nướng chưa từng bật | Lò nướng lạnh tanh, khay còn dán nilon bảo vệ. Sáng nay không có bánh nào được nướng trong bếp này. |
| `tem-sieu-thi` | Tem bánh siêu thị | Tem đã bóc trong hộp dụng cụ của chị Loan: ‘Bánh kem 3 tầng trắng – 450.000đ – 6h10 sáng nay’. |
| `bia-my-ky` | Vỏ hộp giao hàng Mỹ Ký 247 | Kê dưới thớt: ‘Shop Mỹ Ký 247 – nhẫn làm theo ảnh – 350.000đ – Người nhận: Anh Hùng – SĐT …729 – giao Thứ Năm’. |
| `clip-mit-dam-hoi` | Clip live của Bé Mít lúc 9h15 | Live ‘không kịch bản’ của Bé Mít: 9h15 đồng hồ đổ chuông, Bé Ti bắn súng nước. Người bị bắn ướt nhẹp đứng sát khay trầu cau là anh Hùng, áo GUCCl. Không phải ở cửa. 9h25: live lia qua cửa bếp vắng, thấy anh Hùng tay xanh lè đi vô bếp. |
| `soi-mau-xanh` | So ba vệt xanh | Vệt trên bánh khớp với màu áo GUCCl phai: xanh lam, không mùi, cùng sợi vải. Không khớp nước bạc hà của Bé Ti. Người chọc nhẫn vô bánh có tay dính màu áo của anh Hùng. |
| `giay-nhac-ong-noi` | Giấy nhắc trong tủ thờ | Chữ ông Cả: ‘Thứ Ba: đưa chìa khoá tủ thờ cho thằng Hùng lau bàn thờ. NHỚ LẤY LẠI’. |
| `vong-tay-diba` | Vòng tay dưới gầm sofa | Vòng ‘vàng’ to bản, nhẹ hều, mặt trong dập dấu ‘MK-247’, cùng dấu với nhẫn giả. Móc khoá bung. |
| `bien-nhan-cam-do` | Biên nhận cầm đồ 0473 | Giấu dưới đáy hộp quả lắc: biên nhận số 0473, Tiệm Cầm Đồ Phát Tài, món hàng ‘nhẫn vàng mặt ngọc’. Nửa có tên bị xé. |
| `so-cam-do` | Sổ cầm đồ số 0473 | Thứ Ba 14h05: nhẫn chạm rồng mặt ngọc, khắc tay Phúc 1925, mấu chấu thứ ba mẻ. Cầm 80 triệu. SĐT …729. Ký: H. |
| `nhan-that` | Nhẫn thật trong tủ kính | Nhẫn chạm rồng, mặt ngọc bích, mấu chấu thứ ba mẻ y hệt di ảnh bà cố, khắc tay ‘Phúc 1925’. Đang nằm ở tiệm cầm đồ. |
| `camera-tiem-cam-do` | Camera tiệm cầm đồ | Thứ Ba 14h05: người đeo kính đen, áo ‘GUCCl’ chữ L thường, ốp điện thoại dán sticker MoonDoge, đặt nhẫn lên quầy. |

**Chân dung thêm vào `portraits-nhan-dam-hoi.webp`:** `khang` (Khang: Chú rể. Cháu đích tôn nhà ông Cả. Hiền, lo lắng, thương ông nội.); `ngoc` (Ngọc: Cô dâu. Cháu dì Ba. Sợ hai họ mất lòng nhau vì cái nhẫn.); `chusau` (Chú Sáu Cầm Đồ: Chủ tiệm cầm đồ đầu chợ. Kính lão trễ mũi, bàn tính cạnh máy tính. Nhớ món đồ giỏi hơn nhớ mặt người.)

**Điểm soi thêm (ghi manifest.hotspots):**
- `livingroom.webp` · `mam-qua`: Bảy mâm quả (rect gợi ý [600,330,190,180])
- `livingroom.webp` · `canh-tu-tho`: Mặt trong cánh tủ thờ (rect gợi ý [400,200,160,60])
- `livingroom.webp` · `gam-sofa`: Gầm sofa (rect gợi ý [60,470,260,60])
- `livingroom.webp` · `hop-qua-lac`: Hộp quả lắc (rect gợi ý [820,260,80,160])
- `kitchen2.webp` · `cat-banh`: Cắt bánh chỗ vết xanh (rect gợi ý [470,250,60,60])
- `kitchen2.webp` · `soi-vet-kem`: Soi lại vết xanh (rect gợi ý [400,410,120,50])
- `kitchen2.webp` · `noi-thit-kho`: Nồi thịt kho của cô Hai (rect gợi ý [100,400,140,110])
- `pawnshop.webp` · `meo-than-tai`: Mèo thần tài (rect gợi ý [700,200,80,100])
- `pawnshop.webp` · `bang-lai-suat`: Bảng lãi suất (rect gợi ý [700,320,200,120])
