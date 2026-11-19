# Tiệm Trà Sữa · Ghi chú phát triển

Game ở `prototype/games/tiem-tra-sua/`. JS module thuần, không build, không thư viện. Lưu ở `localStorage["wgp.tiemtrasua.v1"]`, tắt tiếng theo khoá chung `wgp.muted`, nhúng `../_shared/feedback.js`.

## Trạng thái milestone

| Mốc | Trạng thái | Nội dung đã có |
|---|---|---|
| M1 · Audit, kiến trúc, cảnh tiệm | Xong | Audit 24 file asset (bảng dưới). Tách data / core / render / ui / save. Cảnh tiệm dựng từ `shop-scene` + lớp che quầy + máy + nhân viên + khách theo anchor của manifest. Bố cục desktop và mobile. |
| M2 · Pha chế, khách, một ca thật | Xong | Pha 7 bước, ly đổi lớp sprite ở từng bước, có hiệu ứng rót / đá / topping / đóng nắp và nhân viên thân trên diễn theo bước. Khách đi vào từ cửa, nói món, có thanh kiên nhẫn, sốt ruột rồi bỏ về. Ghim phiếu bằng chạm khách hoặc phiếu. Chấm 60/25/15 ra 1–5 sao, review hài, tiền, XP, danh tiếng (±8 mỗi ca). Sai món nền mở hội thoại khiếu nại với 3 cách xử lý. Hoàn tác và đổ bỏ tính hao hụt. Bảng chốt ca có lời lỗ đúng ECONOMY. Lưu tự động, tải lại giữa ca giữ nguyên ly, phiếu và khách. |
| M3 · Economy, 20 cấp, kho, nâng cấp, trang trí | Xong | 8 công thức, 20 cấp, nhập hàng theo gói, sức chứa 60/90, bếp topping 3/6 phần, 13 món mua được. **Đơn nhiều ly** (2 ly từ cấp 3 hoặc ngày 3, 3 ly từ cấp 10 vào giờ cao điểm, kiên nhẫn +60% mỗi ly thêm): pha từng ly rồi "Ghép ly vào đơn", đủ ly mới giao chung một lượt, ly tự ghép vào ô hợp nhất, chấm sao theo điểm trung bình. **Bàn pha đôi / ba chỗ** (cấp 9 / 17): mỗi chỗ pha giữ ly và phiếu riêng, đổi chỗ không mất ly dở, ly ở chỗ khác cùng bước và cùng yêu cầu được rót cùng lúc (2 ly = 7 lần bấm). **Nhiệm vụ ngày** (cấp 2): 3 mục mỗi ca từ 12 mẫu, đếm khi giao / chốt ca / xử lý sự kiện, thưởng XP + tiền đúng một lần. **Nhà cung cấp thứ hai** (cấp 12, vựa sỉ: gói gấp đôi, rẻ 10%, chỉ giao trước ca). **Quảng bá** (cấp 14: tờ rơi, check-in, livestream; một lần mỗi ngày, thêm khách + người theo dõi). **Gói ký gửi** khi không đủ tiền + hàng để pha một ly cơ bản (một lần mỗi ngày, trừ dần bằng giá vốn khi bán) nên không bao giờ kẹt. **Kéo-thả trang trí** (chuột hoặc chạm; chặn chỗ khách đứng, lối từ cửa vào, đồ treo phải lên tường; nút đặt lại). Đồ mới từ `shop-fixtures.webp`: ghế chờ (+8% kiên nhẫn), bình phong mây (+1 hấp dẫn), kệ kho làm icon Kho; `shop-tiles.webp` (terrazzo) lát vùng đặt được khi xếp chỗ. Trần hấp dẫn 4 từ cấp 19. |
| M4 · Drama, review, Nhật Ký Làm Chủ | Xong | **Drama Engine** `core/drama.js` + `data/events.js`: 45 sự kiện (đủ C02–X05 của DRAMA.md, C01 là hội thoại khiếu nại; thêm khách Gen Z, "ít ngọt mà ngọt", khách quen ghi sổ, nhóm chat 15 ly phút chót, shipper, tiệm Hẻm Bên chép menu, mẹ gọi giữa ca, trend nguyên liệu, livestream, KOL xin ly miễn phí, mưa bão, cúp điện, bảng hiệu sai chính tả lên mạng, 5 sự kiện "lỗi lên mạng"). 29 trong ca (đồng hồ dừng), 16 giữa hai ca; 14 sự kiện nhiều bước, 18 có hẹn quay lại ngày sau (cờ + `chain`), 8 lựa chọn hên xui. Điều kiện khai báo, ưu tiên sự cố do người chơi gây ra, nghỉ 2+ ngày, mỗi ba sự kiện có một tình huống vui. Mỗi lựa chọn hiện chi phí trước, hậu quả ngay sau (tiền, danh tiếng, người theo dõi, độ hot, kho, khách ca này / ca sau, món được gọi nhiều) và lưu một khoảnh khắc cho Nhật Ký. **Hài kịch pha nhầm** `data/lines-mistakes.js`: 8 loại lỗi (sai món, sai đường, sai đá, topping, quên nắp, chậm, giao nhầm khách, đổi chỗ hai ly trong đơn nhóm), mỗi loại 6+ câu chung và 3–4 câu riêng từng nhóm khách cho cả câu nói lẫn review (387 câu), review theo sao 184 câu (11–12 câu mỗi mức mỗi nhóm khách, giọng mạng xã hội có hashtag), chọn bằng `freshLine` nên không lặp trong ca. Quên nắp giao được (tối đa 3 sao), giao nhầm khách tối đa 2 sao. **Review**: sổ review 40 mục qua các ngày, điểm đánh giá 20 review gần nhất, người theo dõi, độ hot; cộng/trừ khách ca sau; trả lời một lần mỗi review (xin lỗi tạo lời hứa, ca sau ≥ 4 sao thì +2 danh tiếng). **Sổ quản lý** (Review, Nhật ký, Sự kiện, Nhiệm vụ). **Nhật Ký Làm Chủ**: câu chốt ca kiểu meme theo dữ kiện ca, thẻ 1080×1350 vẽ canvas trên `journal-card.png`, ẩn tên tiệm, đổi khoảnh khắc, lưu PNG, chia sẻ qua thiết bị nếu hỗ trợ. Ly: "không đá" rót thêm trà (mực nước cao hơn), 0% đường không nhích mực nước, nhãn chữ "0% đường / Không đá / Không topping" cạnh ly. Mobile 390: khung cảnh luôn thấy từ nhân viên tới cửa. |
| M3 nội dung · Đơn nhóm, bàn pha, nhiệm vụ, vựa sỉ, quảng bá, ký gửi, trang trí | Xong | `data/lines-m3.js` (~400 câu) + `data/events-m3.js` (27 sự kiện, tổng 72). **Đơn nhiều ly**: câu gọi món theo nhóm khách (bạn học, văn phòng, gia đình…); kết quả `multiOutcome` (core/shift.js) chọn bảng review + câu nói: đúng hết, ba ly năm sao, một ly lệch, đổi chỗ, ly tới trễ (≥ 18 giây giữa ly đầu và ly cuối, `cup.at`), ra cùng lúc (bàn pha nhiều chỗ, ≤ 2,5 giây); mỗi kết quả 24 review (≥ 9 mỗi nhóm khách) + 16 câu nói; sự kiện F01–F05 (đơn gia đình 3 ly, ly tới trễ, ba ly năm sao ⇒ đặt mỗi thứ Hai, một ly lệch). **Bàn pha đôi / ba**: câu nhân viên khi rót đồng loạt, P01–P04 (rót nhầm đồng loạt, hai ly giống nhau hai người, mơ thấy ly, ba ly ba người). **Nhiệm vụ**: câu vui khi xong / hụt theo từng loại, khoảnh khắc "xong cả ba" và "hụt" vào Nhật Ký, câu chốt ca riêng. **Vựa sỉ**: U01–U06 (trà rẻ mà cũ, Anh Út kể chuyện, giao trễ, Dì Ba giảm giá, quà cảm ơn, hoà giải). **Quảng bá**: Q01–Q09, mỗi loại ba kết cục (lên mạng / phản tác dụng / khách ăn ké) + review riêng cho khách ngày quảng bá. **Ký gửi**: câu Dì Ba khi nhận gói, B01 Dì Ba ghé, khoảnh khắc + B02 ngày trả đủ, B03 mẹ hỏi thăm khi lỗ. **Trang trí**: review nhắc ghế chờ, góc bình phong, chậu hoa, đèn mây, bàn tre, biển đèn (chỉ đồ đang có; ghế chờ thêm câu khi chờ lâu). Mọi bảng qua `freshLine`. Cờ của game: `si-mua`, `promo-<loại>`, `ky-gui`, `ky-gui-xong` (ENGINE_FLAG). |
| Trả lời review theo tính cách chủ tiệm | Xong | **Sửa lỗi "trả lời bằng meme không hiện gì"**: sau khi bấm, Sổ vẽ lại từ đầu nên khung cuộn nhảy về review đầu tiên (review vừa trả lời trôi khỏi màn), còn câu trả lời chỉ hiện 2,6 giây trong thông báo và sổ chỉ lưu loại (`reply: "meme"`) nên dưới review chỉ còn nhãn. Giờ câu trả lời lưu nguyên văn dưới review (`r.reply.text`) kèm kết quả, hậu quả, câu đáp lại; vẽ lại giữ chỗ cuộn và đưa review vừa trả lời vào tầm nhìn. **Tính cách chủ tiệm** (`data/lines-reply.js` PERSONAS): Hiền lành / Cục súc / Lầy lội / Sale-man. Chọn ở màn chào; bản lưu cũ được hỏi một lần trước Chuẩn bị ca; đổi bất cứ lúc nào bằng hàng nút ngay trên các lựa chọn trả lời, tính cách vừa đổi thành mặc định. **Lựa chọn**: mỗi tính cách 3–4 lựa chọn theo chủ đề review (`topicOf`: khen / khen trang trí / đơn nhiều ly / lỗi pha / chậm / tạm / trên mạng), 6–14 câu mỗi lựa chọn mỗi chủ đề (biến {name} {drink} {mistake} {stars} {shop}), qua `freshLine`. Hậu quả hiện trên nút trước (chi phí, hên xui) và dưới review sau: người theo dõi, độ hot, danh tiếng, review cư dân mạng làm đánh giá lên / xuống (hiện "4,4 → 4,2"), khách ca sau, món được gọi, khách quay lại (`s.returning`, tới sớm ca sau, câu gọi món theo tính cách, tip 3k), lời hứa (giữ cơ chế cũ), hẹn sự kiện. Cục súc đánh cược (viral / phốt), Hiền lành an toàn, Lầy lội lên xuống độ hot, Sale-man ra khách nhưng có người thấy phiền. **Câu đáp lại**: người viết review (80%), cư dân mạng (viral / phốt / phiền luôn có), cư dân mạng để ý chủ tiệm đổi tính so với lần trả lời trước (`FLIP_LINES`). **Sự kiện R01–R10** (`data/events-reply.js`, tổng 82): ảnh chụp câu trả lời lan nhóm chat, khách quay video đáp lại trend, cựu nhân viên bình luận, phốt trên nhóm review (2 bước, hên xui), khách được mời quay lại kéo theo bạn, Hẻm Bên chép câu chốt đơn, mẹ đọc câu cục súc, trang meme xin dùng, cư dân mạng nghi "bị hack nick", nhân viên hỏi "hôm nay chị là phiên bản nào"; cờ `rep-*` (ENGINE_FLAG) + hẹn trong `s.drama.queue` (`from: "reply"`, mở sớm thì bỏ hẹn). **Drama theo tính cách**: `sayBy` / `meBy` trong sự kiện, câu kèm theo ở bảng hậu quả (`PERSONA_ASIDE`). **Nhật Ký**: câu trả lời là khoảnh khắc; câu lên mạng / dính phốt lên đầu thẻ và thành câu chốt ca (trả lời giữa hai ca thì sửa bảng chốt ca vừa xong + dòng nhật ký); ngày đổi tính ≥ 3 lần có câu riêng; ca bình thường đôi khi dùng câu theo tính cách. ~590 câu mới. |
| Hết hàng giữa ca (sửa nhanh trước M5) | Xong | Commit riêng `f27d1c0` (+ sửa kẹt kho đầy `bec5588`, merge âm thanh master `cb62a69`). **Đầu ngày**: bảng Chuẩn bị ca dự báo khách + phần hàng cần (`core/stockout.js demandEstimate`, cùng công thức số khách với `genGuests`), hộp "Coi chừng hết hàng giữa ca!" liệt kê mọi món có thể thiếu (ly, trà, sữa, đường, đá, topping, trái cây), nút **Nhập đủ cho hôm nay** (gói Dì Ba, ly trước tiên, chừa phí ca, tôn trọng sức chứa), bấm Mở quán khi còn thiếu thì hỏi lại (Nhập đủ trước / Vẫn mở quán). **Giữa ca**: món trên menu còn ≤ 2 phần ⇒ toast câu nhân viên (8 câu mỗi nhóm hàng) + ô Kho trên HUD đỏ "n món sắp hết" (hiện cả trên 390), bấm ô Kho mở bảng **Nhập gấp** (+15%). **Hết hẳn** (ở bước pha, khi ghim khách cần món đó, khi nấu trân châu mà không đủ 3 phần sống): hội thoại kiểu Drama (`sh.dialog` kind `stockout`, đồng hồ dừng, chi phí ghi trên nút): Chạy đi mua gấp (+30%, quầy bỏ trống 12 giây, đồng hồ vẫn chạy, kiên nhẫn tụt nhanh hơn 60%, nhân viên rời cảnh, về có hàng), Nhờ Anh Tèo (+15% + 5k tip, tới sau 20 giây, 25% mua nhầm món khác), Mượn chị Lụa Hẻm Bên (4 phần miễn phí, một lần mỗi ngày, mai H01 đòi nợ), Đổi món (chỉ khi menu có món không cần thứ đã hết; khách chịu / không theo nhóm, có câu + review), Đóng cửa sớm (khách về hết kèm review, danh tiếng −3, câu chốt ca "Tiệm đóng cửa sớm vì… quên mua ly"). Không đủ tiền cho lựa chọn trả tiền ⇒ **ký gửi Dì Ba** lên đầu. Luôn có lựa chọn miễn phí (Đóng cửa sớm) nên không bao giờ kẹt. Nội dung `data/lines-stockout.js` (~230 câu: nhắc / hết theo 7 nhóm hàng, câu chủ tiệm mỗi lựa chọn, khách chờ lúc chủ chạy đi, review khách chứng kiến chạy đi mua, đổi món chịu / không, đóng cửa sớm, Anh Tèo đúng / nhầm, chị Lụa, câu Nhật Ký) + sự kiện H01 (Hẻm Bên đòi nợ), H02 (mẹ nghe tiệm đóng cửa sớm), H03 (reviewer đăng "tiệm hết ly"), tổng 85 sự kiện. Trường ca thêm (tuỳ chọn, không nâng bản lưu): `away`, `deliveries`, `borrowDay`, `closedEarly`, `stockouts`, `lowWarned`; `s.debtHB`. Tag `?v=m37`. |
| M5 · Cân bằng, hội chợ, thử thách, polish | Xong | **Bộ mô phỏng cân bằng** `tools/sim/` (README ở đó): 3 hồ sơ (cẩn thận / trung bình / ẩu: tỉ lệ sai từng bước, tốc độ bấm, cách nhập hàng, cách mua đồ) chơi từng ca qua `core/apply.js`, báo cáo mốc cấp theo phút chơi, tiền theo ngày, kẹt, `report.md`; `fit.mjs` dò đường cong XP; `sim.test.mjs` hồi quy. Trước M5: cẩn thận cấp 20 sau 138 phút, người trung bình kẹt vòng ký gửi / đóng cửa sớm từ ngày 10 (kho 60 đầy hàng không dùng). Sau: cấp 4 ≈ 7–9 ph, 7 ≈ 33–39 ph, 10 ≈ 113–120 ph, 20 ≈ 624–635 ph (10,4–10,6 giờ), 0 kẹt; tới cấp 20 đã mua 7/8 bậc hạng tiệm, còn 3.500–8.900k để dành bậc cuối. Đổi số: đường cong XP (cấp 20 = 18.260, bản lưu cũ quy đổi giữ cấp), kho 80 / 130, phí ca 12k + 2k mỗi cấp, gói ký gửi bù phần thiếu + để dưới gầm quầy. **Hội chợ khu phố** (cấp 18, `core/fair.js`): thuê gian 150k, ca dài 4 phút, +6 khách, giá +15%, đơn nhóm kết hợp mọi nhóm khách; FA1–FA3, review great / ok / bad, câu Nhật Ký. **Lịch ca thử thách + 14 huy hiệu** (cấp 20, `core/challenge.js`): 5 thử thách xoay vòng theo ngày (mods: thêm khách, kiên nhẫn, cấm hoàn tác, chỉ khách khó tính, một chỗ pha; mục tiêu xét lúc chốt ca), thưởng + huy hiệu, CH1–CH2, review win / lose, bức tường huy hiệu ở Sổ ⇒ Nhiệm vụ. **Máy rót trà hai vòi** (cấp 11, 380k, cần bàn pha đôi): rót trà nền cho chỗ pha khác đúng loại trà của ly đó, câu nhân viên, review good / meh, DS1–DS2. **Hạng tiệm** 8 bậc (300k → 6.000k) làm chỗ tiêu tiền cuối game. **Chơi lại ngày hôm nay** (bảng Tạm dừng + Chốt ca, có xác nhận): ảnh đầu ngày `wgp.tiemtrasua.v1.day`, bản hiện tại cất sang `….before-replay`. **Kéo trang trí sát mép phải** được kẹp trong khung camera đang thấy (`scene.visibleRect`). **Asset chờ Codex tự nhận**: chân dung NPC Drama `drama-portraits-hd.webp` (HD_SHEETS `drama`, khớp tên NPC: Mẹ, Dì Ba, Anh Út, Anh Tèo, Bé Bông, chị Lụa, cô tổ kiểm tra; chưa có thì mượn vai cũ), thời tiết `weather-fx.webp` (OPTIONAL_SHEETS `weather`, clip rain / lightning, power-cut-glow, ô 640×360 vẽ ×2; V15 mưa, O04 cúp điện; chưa có thì lớp CSS). **Tải nhanh**: LAZY_SHEETS (biểu cảm HD, chân dung NPC, thời tiết, thẻ Nhật Ký, ảnh phố) tải nền khi trình duyệt rảnh. Giảm chuyển động: mưa CSS đứng yên, clip thời tiết khung đầu. Bản lưu v4. Tag `?v=m37`. |

## Kiến trúc

```
data/        bảng số liệu thuần: ingredients (kho + lựa chọn từng bước), recipes, customers, levels, shift (nhịp, vị trí), lines (thoại)
             asset-manifest.json = bản chép của docs/tiem-tra-sua/asset-manifest.json (test kiểm khớp)
core/        luật thuần, không DOM, test bằng node
  apply.js       cửa duy nhất đổi trạng thái: apply(state, action) chạy trên bản nháp, kiểm bất biến, lỗi thì không đổi gì
  shift.js       vòng ca: mở quán, tick (khách đến, kiên nhẫn, bỏ về), ghim, pha, hoàn tác, đổ bỏ, giao, khiếu nại, chốt ca
  score.js       chấm ly (60 công thức + 25 thời gian + 15 kỳ vọng) → sao; sai món nền tối đa 2 sao
  cupview.js     ly → danh sách lớp cup-layers theo thứ tự vẽ (test "đổi hình mỗi bước")
  economy.js     giá vốn tính từ nguyên liệu (khớp bảng 11/10/12/14/11/13/17/13), kho, nhập hàng, lợi nhuận vận hành
  progression.js XP, cấp, mở khóa
  state.js       tạo mới, đọc + kẹp bản lưu, MIGRATIONS cho các phiên bản sau
  rng.js, text.js  RNG có hạt lưu trong state, điền biến vào thoại
render/      atlas.js (manifest → frame/clip, paint theo anchor), scene.js (cảnh 1280×720 + camera), cup.js (ly lớn ở Quầy pha)
ui/          brew.js (phiếu, ly, dải bước, nút nguyên liệu), screens.js (HUD, dải phiếu, chào mừng, chuẩn bị ca, khiếu nại, chốt ca, tạm dừng), sfx.js
game.js      nạp manifest + ảnh, đọc lưu, vòng lặp rAF, xử lý sự kiện → hiệu ứng / âm thanh / thông báo, lưu tự động, phím tắt, móc __game
save.js      adapter localStorage; bản hỏng được chép sang *.corrupt trước khi mở tiệm mới
```

Thời gian ca (`shift.t`) chỉ tăng qua action `tick`. Ca dừng khi có hội thoại, bảng phủ, tạm dừng hoặc rời tab. Vì vậy tải lại không làm khách "già" đi và test tua thời gian được. Vị trí khách, frame đi và mood đều suy ra từ `shift.t` nên phần render là hàm thuần của trạng thái. Giao, giải quyết khiếu nại và từng bước pha chỉ hợp lệ một lần: giao cần khách còn ở pha `wait`, giải quyết cần `dialog`, bước pha phải đúng bước kế tiếp. Bấm lặp hoặc tải lại vì thế không cộng tiền hai lần.

Thiết bị và trang trí ở `data/equipment.js` (giá, cấp, sprite, vị trí trong cảnh, hiệu ứng) và `core/equipment.js` (`buy`, `owns`, `appeal`, `kitchenSlots`, `capacityFor`). Bếp topping nằm ở `shift.kitchen` (`cook` và `tick`).

Milestone 3–4:

```
core/drama.js     Drama Engine: điều kiện khai báo (meets), chọn sự kiện, mở hội thoại trong ca (sh.dialog kind "event") hoặc giữa hai ca
                  (s.drama.pending), áp hậu quả, hẹn quay lại (s.drama.queue), cờ (s.drama.flags, hết hạn sau 3 ngày), lịch sử
core/reviews.js   sổ review (s.feed), điểm đánh giá, người theo dõi, độ hot, khách thêm ca sau, trả lời review, lời hứa
core/missions.js  nhiệm vụ ngày (data/missions.js)
core/business.js  gói ký gửi, quảng bá
core/decor.js     kéo-thả trang trí: vùng hợp lệ, chặn chỗ đứng / lối vào
core/journal.js   câu chốt ca meme, nội dung thẻ Nhật Ký
data/events.js    45 sự kiện (cấu trúc ghi ở đầu file) + data/events-m3.js 27 sự kiện M3 (F, P, U, Q, B)
data/lines-m3.js  câu cho đơn nhiều ly theo kết quả, bàn pha, nhiệm vụ, ký gửi, trang trí, quảng bá
data/lines-reply.js  tính cách chủ tiệm, lựa chọn trả lời + câu theo chủ đề, câu đáp lại, review cư dân mạng, khách quay lại, câu drama / Nhật Ký theo tính cách
data/events-reply.js  R01–R10 sinh ra từ câu trả lời review và chuyện đổi tính
ui/persona.js     thẻ chọn tính cách (màn chào, hỏi một lần) + hàng nút đổi tính cách trên bảng trả lời
data/lines-mistakes.js  câu nói / review theo loại lỗi, review theo sao, theo nhóm khách
ui/panels.js      hội thoại sự kiện + bảng hậu quả, Sổ quản lý, Nhật Ký, thanh xếp chỗ
ui/journal.js     vẽ thẻ 1080×1350, tải PNG, chia sẻ
```

Bản lưu v4 (Milestone 5). `MIGRATIONS[3]`: XP quy đổi từ bảng cũ (`OLD_XP`) sang đường cong mới giữ đúng cấp và phần trăm tiến độ (`remapXp`), thêm `badges`, `tier`, `fair`, `challenge`. `save.js` chép nguyên văn bản v3 sang `wgp.tiemtrasua.v1.bak-v3` (một lần). Ca có thêm `fair`, `challenge`, `noUndo`; ly có `dual`. Test ở `test/m5.test.mjs`.

Trước đó, bản lưu v3 (trường `v` = 3). `MIGRATIONS[2]`: trả lời review cũ (chuỗi loại) ⇒ object có câu cũ (`outcome: "legacy"`), thêm `owner` (`persona: null` ⇒ hỏi một lần ở Chuẩn bị ca, `lastPersona`, `switches` = lịch sử đổi tính), `returning`, `usedDay` (chống lặp câu giữa hai ca, xoá khi mở ca). `save.js` chép nguyên văn bản v2 sang `wgp.tiemtrasua.v1.bak-v2` (một lần). Test ở `test/reply.test.mjs`.

Trước đó, bản lưu v2 (trường `v` = 2). `MIGRATIONS[1]` chuyển ca dở dang (một ly ⇒ chỗ pha 0, khách một ly ⇒ đơn 1 ly). Trước khi nâng, `save.js` chép nguyên văn bản cũ sang `wgp.tiemtrasua.v1.bak-v1` (một lần). Test ở `test/m4.test.mjs`.

Trường thêm (tuỳ chọn, bản lưu v2 cũ đọc được, không nâng phiên bản): ly đã ghép có `at` (ms ca lúc ghép), `lastServe.outcome` (kết quả đơn nhiều ly). Test ở `test/m3content.test.mjs`.

Ca có `stations` (chỗ pha) thay cho `cup` / `active` cũ. Dùng `curCup(sh)`, `activeCid(sh)`, `orderAt(state, station)` ở core/shift.js. Khách có `items` (từng ly) và `filled` (ly đã ghép). `c.order` / `c.recipe` là ly đầu, `c.price` là tổng đơn.

Móc kiểm thử thêm: `__game.forceEvent(id)`, `__game.sceneToClient(x, y)`, `?calm=1` (không tự mở sự kiện trong ca), `?event=ID` (xem thử một sự kiện).

## Audit asset (24 file, 243 frame, 27 clip)

| File | Dùng ở đâu | Ghi chú / thiếu |
|---|---|---|
| shop-scene.webp | Nền cảnh tiệm. Phông sau Quầy pha và hội thoại (crop). | |
| shop-counter-foreground.webp | Lớp che thân dưới nhân viên sau quầy | |
| street-background.webp | Ảnh đầu bảng chào mừng | Chưa dùng cho cửa sổ hoặc cảnh ngoài phố |
| equipment.webp | Máy trà, máy đóng nắp, bếp topping, hũ trân châu, hũ đá trong cảnh. Icon Bếp topping. | fridge, stool, table, plant, lantern chưa dùng |
| characters.webp | Nhân viên đứng trong cảnh (barista) | Dáng đứng của khách chưa dùng vì customer-reactions đủ hơn |
| portraits.webp | Chân dung bảng chào mừng và hội thoại khiếu nại | Thiếu office-worker |
| portrait-expressions.webp | Nhân viên ngạc nhiên và khách regular trong hội thoại | Chỉ có 2 vai |
| cup-layers.webp | Ly lớn ở Quầy pha và ly nhỏ trên mặt quầy (mọi lớp) | Xem "Cần Codex" về đường, trái cây, pudding, matcha nhạt |
| cup-states-and-ingredients.webp | Icon nguyên liệu (hồng trà, sữa, đường, đá, trân châu), ảnh món trong menu | |
| cup-fx.webp | Clip rót (trà, sữa, siro), topping rơi, hơi nước | |
| lid-and-ice-fx.webp | Clip đá rơi, hạ nắp | |
| decor-and-pantry.webp | Icon matcha, vải, chanh dây, pudding, thạch, đào | Đồ trang trí để M3 |
| pantry-supply.webp | Icon ô long, trà lài, kem sữa, sốt đường đen, chồng ly, chồng nắp, hộp sữa, trân châu sống | |
| customer-reactions.webp | Dáng chờ / vui / sốt ruột của 6 vai trong cảnh, mặt trên phiếu | |
| customer-actions.webp | Dáng gọi món khi vừa tới, ngạc nhiên khi khiếu nại | |
| character-motion-sample.webp | Chu kỳ đi của khách regular | Hàng thao tác nhân viên chưa dùng vì barista-actions đủ hơn |
| customer-walk-cycles.webp | Chu kỳ đi của vip, reviewer, courier, neighbor | Thiếu office-worker |
| barista-actions.webp | Nhân viên thân trên ở Quầy pha diễn rót / topping / giao | |
| barista-fx.webp | Lấp lánh ở ly và xu bay ở khách khi giao | |
| ui-icons.webp | Icon HUD (tiền, đồng hồ, sao, cấp, kho), sao review, sổ | customer, ticket chưa dùng |
| journal-card.png | Thẻ Nhật Ký Làm Chủ (canvas 1080×1350, chữ ở khung đầu và vùng kem dưới) | |
| upgrades.webp | 13 món mua trong bảng Chuẩn bị ca (icon) và đặt vào cảnh khi đã mua; bàn pha đôi / ba chỗ trên mặt quầy | dual-spout-brewer chưa có luật |
| shop-fixtures.webp | Ghế chờ, bình phong (đồ mua được), kệ kho (icon Kho) | counter-*, serving-counter, kitchen-workbench, cold-cabinet chưa dùng |
| shop-tiles.webp | Ô terrazzo lát vùng đặt được khi xếp chỗ trang trí | Các ô khác chưa dùng |

Không dùng emoji hoặc hộp CSS cho vật thể trong thế giới. Lựa chọn "Không thêm / Không topping / 0% đường / Không đá" dùng icon bước làm mờ.

## Cần Codex

Cùng chuẩn Phase 2: WebP lossless, alpha cứng, lưới 2×. Ghi rect, anchor và clip vào manifest (`docs/` và bản chép `prototype/games/tiem-tra-sua/data/asset-manifest.json`). **Code đã tự dùng các tên dưới đây ngay khi chúng có trong manifest**, không cần sửa code. Chưa có thì giữ cách tạm.

| # | Sheet | Frame / clip code tự dùng | Ô · anchor | Đang tạm dùng |
|---|---|---|---|---|
| 1 | `customer-walk-cycles.webp` (thêm hàng) | `office-worker-walk-1..4` | 96×128 · [48,116] | Dáng chờ kèm nhún |
| 2 | `portraits.webp` (thêm ô) | `office-worker` | 192×160 · [96,154] | Sprite toàn thân trong hội thoại |
| 3 | `portrait-expressions.webp` (thêm hàng) | `{vip,reviewer,courier,neighbor,office-worker}-{waiting,happy,sheepish,annoyed}` (hội thoại khiếu nại và Drama chọn theo mood của bước) | 192×160 · [96,154] | Chân dung mặc định |
| 4 | `cup-layers.webp` (thêm) | `syrup-swirl` (đường > 0%), `brown-sugar-streak` (sốt đường đen) | 160×192 · [80,174] | Mực nước nhích lên 25% |
| 5 | `cup-layers.webp` (thêm) | `fruit-peach`, `fruit-lychee`, `fruit-passion` | 160×192 · [80,174] | Trà trái cây giống nhau |
| 6 | `cup-layers.webp` (thêm) | `pudding-bottom`, `matcha-50`, `matcha-milk-75`, `cream-top` | 160×192 · [80,174] | jelly-bottom, matcha-75, không có lớp kem |
| 7 | `barista-scene.webp` (mới, bí danh `bscene`) | `idle-1..2`, `pour-1..4` (đang pha), `serve-1..4` (vừa giao) | 96×128 · [48,116] | Dáng đứng characters + nhún 1 px |
| 8 | Đồng bộ vai | `vip`, `reviewer` giữa characters / reactions / actions / walk | | VIP, reviewer đổi trang phục giữa các sheet |
| 9 | `customer-actions.webp` | `vip-order-1` | 96×128 | Frame vẽ nhỏ hơn |
| 10 | `equipment.webp` | `topping-stove-cooking-1..4` + clip `topping-stove-cooking` (8 fps loop) | 192×192 · [96,168] | Hơi nước cup-fx |
| 11 | `ui-icons.webp` (thêm) | `sound-on`, `sound-off`, `pause`, `help` (thanh trên; Sổ dùng `journal` có sẵn) | 48×48 · [24,42] | Chữ |
| 12 | `drama-portraits-hd.webp` (asset-spec, **code đã nối**) | `{me,di-ba,anh-ut,anh-teo,be-bong,chi-lua,co-to}-{neutral,happy,annoyed,surprised}` | 384×320 · [192,308] lưới 1× | Mượn vai neighbor / courier / vip / reviewer |
| 13 | `weather-fx.webp` (asset-spec, **code đã nối**) | `rain-1..4` (clip `rain`), `lightning-1..2` (clip `lightning`), `power-cut-glow` | 640×360 · [0,0], vẽ ×2 | Lớp CSS: vệt mưa chéo + lớp tối |

## Kiểm thử

- `cd prototype/games/tiem-tra-sua && node --test "test/*.test.mjs"`: 179 test (M5 thêm `stockout` 14 test: dự báo, nhập đủ, nhắc sắp hết, mọi cách xử lý hết hàng, 0 đồng không kẹt, kho đầy, lưu giữa lúc chạy đi mua, H01–H03; `m5` 11 test: chơi lại ngày hôm nay, v3→v4 quy đổi XP, phí ca, hội chợ, 5 thử thách, huy hiệu, hạng tiệm, máy hai vòi, sự kiện M5, asset Codex chờ giao tự nhận). Bộ mô phỏng: `node --test tools/sim/sim.test.mjs` (~2 phút, hồi quy mốc cấp + không kẹt). Trước đó 146 test (thêm `reply`: chọn / đổi tính cách và lịch sử đổi, lựa chọn theo tính cách + chủ đề, mọi lựa chọn đăng câu + hậu quả + lưu qua tải lại, câu đáp lại và câu "đổi tính", đánh cược cục súc, lời hứa, khách quay lại, mã giảm trừ tiền, R01–R10 mở được và hẹn đúng hạn, drama theo tính cách, không lặp câu trong ca, Nhật Ký, nâng v2→v3; thêm `m3content`: bảng câu M3, chọn câu theo kết quả đơn nhiều ly, sự kiện vựa sỉ / quảng bá / ký gửi / nhiệm vụ, bản lưu) (economy, đơn và chấm điểm, tiến trình, lưu/tải + nâng v1→v2, nhịp ca, bếp và thiết bị, asset, M3: đơn nhiều ly / chỗ pha / nhiệm vụ / nhà cung cấp / quảng bá / ký gửi / kéo-thả, M4: review / Nhật Ký / ly 0% đường, Drama: cấu trúc 45 sự kiện, mọi sự kiện mở được, mọi lựa chọn ở mọi bước giải quyết được, mô phỏng 14 ngày; hài kịch pha nhầm: đủ câu, không emoji, không lặp trong ca, quên nắp / giao nhầm / đổi chỗ).
- E2E: ở gốc worktree chạy `PORT=8811 node server.js`, rồi `PORT=8811 node prototype/games/tiem-tra-sua/test/e2e.mjs <thư mục ảnh>`. Bấm chuột, kéo-thả và chạm thật qua CDP, chụp desktop 1366×768 và mobile 390×844, kiểm 0 lỗi console. Thêm: Nhật Ký (canvas, PNG), sự kiện giữa hai ca, kéo-thả trang trí, sự kiện trong ca trên 390 px, đơn hai ly (review từ bảng đơn nhiều ly), Sổ quản lý, sự kiện vựa sỉ U01 qua `?event=U01`. Thêm: chọn Lầy lội ở màn chào; trả lời review bằng meme (câu hiện dưới review, review vẫn trong tầm nhìn); đổi sang Cục súc ngay trên bảng trả lời ⇒ lựa chọn đổi, trả lời và kiểm câu; mobile 390 đổi sang Hiền lành rồi trả lời. M5 thêm (143 kiểm): hộp "Coi chừng hết hàng" + Nhập đủ cho hôm nay, ngày 2 hết ly ⇒ hỏi lại khi mở quán ⇒ hội thoại hết hàng ⇒ chạy đi mua (nhân viên rời cảnh) ⇒ giao đơn, đóng cửa sớm ⇒ câu Nhật Ký, cảnh báo ở 390; hội chợ cấp 18 (thuê gian, ca 4 phút, đơn nhóm kết hợp), mưa V15 (lớp CSS), kéo chậu hoa sát mép phải ⇒ kẹp trong khung, chơi lại ngày 9 từ bảng Tạm dừng (hỏi xác nhận, Thôi / Chơi lại, bản trước cất dự phòng), bức tường huy hiệu, cấp 20 lịch thử thách + hạng tiệm, 390 không tràn. `pressSel` cuộn phần tử bị chân bảng che vào giữa. `b.nav()` (test/cdp.mjs) chờ `window.__game` + `#app.ready` sau mỗi lần mở trang, hết giờ thì tải lại một lần rồi báo lỗi (trước đây có lần "__game is not defined" ngay sau tải lại).
- Móc kiểm thử: `window.__game` có `state`, `act(action)`, `advance(ms)`, `paused`, `forceEvent(id)`, `sceneToClient(x, y)`. `?seed=N` cố định RNG, `?calm=1` tắt sự kiện tự mở trong ca.

## Vấn đề đã biết

- Trà trái cây: đường 0% và 50% cùng chạm trần mực nước 75% nên trông giống nhau (chờ asset #4); nhãn chữ cạnh ly ghi "0% đường".
- Desktop phóng cảnh tới 1:1 điểm ảnh (tối đa +20%) nên mép phải cảnh bị cắt; đồ trang trí kéo-thả được kẹp trong khung đang thấy (M5). Đồ đặt từ trước M5 ở sát mép vẫn giữ chỗ cũ (bấm "Đặt lại"). Mobile dùng khung theo vùng (nhân viên → cửa), có thể lọc mượt.
- Đổi chỗ hai ly trong đơn nhóm hiếm xảy ra vì ly tự ghép vào ô hợp nhất; lỗi này chủ yếu đến từ sự kiện O05 / V23.
- Một vài hậu quả sự kiện hẹn "later" tới sự kiện không phải chain chỉ mở nếu điều kiện vẫn đúng trong 3 ngày.
- Bộ mô phỏng là một chính sách tất định, không phải người thật: ba hồ sơ khác nhau chủ yếu ở tỉ lệ sai và cách nhập hàng nên mốc cấp khá gần nhau. Sau cấp 20 tiền tích luỹ lại (đã hết bậc hạng tiệm) — chỗ tiêu tiếp theo nên là nội dung mới (menu theo mùa, chi nhánh 2).
- Tag module trong `tools/sim/fit.mjs` và `harness.mjs` (nạp `?v=m37` để sửa tạm bảng cấp trong bộ nhớ) phải đổi cùng tag game.
- Mọi import (và `index.html`) dùng chung tag `?v=m37`; đổi nội dung mô-đun thì tăng tag ở tất cả.
