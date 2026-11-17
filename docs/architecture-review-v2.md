# Webgame Portal — Independent Architecture Review V2

Codex · 17/11/2026 · **Đề xuất, chưa được chủ dự án phê duyệt**.

Đã đọc kỹ `game-catalog-v2.md`, toàn bộ `tech-architecture-v2.md` và đọc lại `architecture-review.md`. Review này thay đổi khuyến nghị phạm vi theo mục tiêu mới: Technical MVP là mốc kiểm chứng nội bộ, **Public Launch vẫn hướng đến 18 game thật**, không thu lại thành ba game. Không code, không sửa tài liệu người khác, không commit.

**Kết luận:** đồng ý có điều kiện với hướng A sửa đổi và roadmap 18 game; chưa đồng ý coi 120–177 người-ngày là ngân sách hoàn chỉnh hoặc lịch phát hành. Rủi ro lớn nhất là đường găng nội dung/quyền sử dụng và chất lượng gameplay bị đặt ngoài ước tính, trong khi reuse engine được tính khá lạc quan. Chưa có bằng chứng năng suất thực tế của team để chốt ngày launch.

## 1. Review độc lập danh mục 18 game

Điểm sản phẩm của Gehihi là giả thuyết ưu tiên, chưa phải số liệu traffic, SEO hay chuyển đổi. Bảng dưới giữ đủ 18 game, nêu phần công sức có thể bị đánh giá thấp và mức tối thiểu cần nghiệm thu.

| # | Game | Nhận định và điều kiện khả thi |
|---|---|---|
| 1 | Caro | Phòng, reconnect đã được tính vào 10–14 ngày là hợp lý hơn V1. Phải chốt biến thể luật và tách bot luyện tập khỏi bot tiếp quản ghế; bot không tự động làm trận trở nên công bằng |
| 2 | Rắn | Bản đơn khả thi; Snake Battle là chế độ khác đáng kể về mô phỏng và điều khiển. Catalog 20/20 dựa một phần vào multiplayer nên không được dùng nguyên kỳ vọng viral cho bản đơn |
| 3 | Nối Thú | Đường đi tối đa hai lần rẽ/ba đoạn, kể cả đi ngoài biên, khác phát hiện cụm của E1. Cần bảo đảm sinh bàn giải được, hint và shuffle không tạo vòng lặp bế tắc; bỏ tên và hình Pokémon trước khi thiết kế thumbnail |
| 4 | Đào Vàng | Game đơn và 2P cùng bàn phím không đồng nghĩa trải nghiệm 2P trên mobile. Cần định nghĩa hai vùng chạm hoặc ghi rõ 2P desktop; cân chỉnh góc móc, tốc độ, vật cản và độ khó là phần gameplay riêng |
| 5 | Nối Từ | Rủi ro cao nhất về dữ liệu: vài nghìn mục không bảo đảm nối tiếp phong phú. Phải chốt từ ghép/hai tiếng, tên riêng, đồng âm, dấu và luật hết từ; bot không được xem lựa chọn bí mật hoặc ưu tiên từ ngoài tập đã công bố |
| 6 | Bắn Bóng | Repo tutorial hỗ trợ tham khảo, không chứng minh đã có chiến dịch/màn chơi/khó dần. Lưới lục giác, phản xạ và cụm rơi cần test riêng; thiết kế khủng long/trứng dễ bị làm quá gần Dynomite nếu chỉ đổi tên |
| 7 | Cờ Tướng | 8–12 ngày có thể là phần tích hợp hẹp, chưa đủ tự tin cho luật hòa/chiếu dai và bot mượt. Cần tập ván kiểm thử đã duyệt, deadline worker, luật phiên bản cụ thể; không tự viết thêm engine AI mạnh trong phạm vi này |
| 8 | Đố Vui | 500 câu đúng và phù hợp trẻ em là sản phẩm nội dung có biên tập, không phải 500 dòng JSON. Single-player bắt buộc gửi câu hỏi/đáp án theo thiết kế riêng; chế độ online không phát đáp án trước khi kết thúc vòng |
| 9 | 2048 | Khả thi sớm, nhưng bản chuyển thể vào E1 phải so với giữ adapter trực tiếp. Skin động vật và mốc 4096 là lựa chọn phụ, không phải lý do viết lại engine trong 2–3 ngày |
| 10 | Cá Ngựa | Ludo và Cá Ngựa có nhiều biến thể; chốt luật ra quân, đá/chặn, về chuồng, xúc xắc và mất lượt. Phòng bốn người + reconnect + bot tiếp quản phức tạp hơn bảng lưới chung |
| 11 | Đặt Bom | Bot né chuỗi nổ, tìm đường theo thời gian và bản đồ không làm người chơi kẹt không đơn giản như AI rẽ ngẫu nhiên. Bản vs bot vẫn phải vui; không lấy nhãn “sắp online” để thay nội dung chơi được |
| 12 | Bắn Cung | Có thể giữ launch dạng single/local 2P; cần cân chỉnh vật lý và touch. “Bow Master” không tự nhiên an toàn hơn “Bowmen”; còn có sản phẩm Bowmasters của Miniclip [N6]. Mức bạo lực/hình nhân vật cần hợp thương hiệu trẻ em |
| 13 | Xếp Gạch | Khó về quyền biểu đạt/giao diện hơn code. Đổi tên chưa đủ giải quyết trade dress Tetris [N1]. Phải duyệt thiết kế độc lập trước khi triển khai; không mặc định luật phổ biến cho phép chép toàn bộ hình thức |
| 14 | Tìm Điểm | Chạm vào vùng khác biệt cần zoom hoặc hitbox thích ứng mobile, ngăn bấm loạn; mỗi cặp ảnh cần kiểm tra khác biệt ngoài ý muốn. Số màn và chất lượng hình mới quyết định chơi lại, code 3–5 ngày không đại diện game hoàn chỉnh |
| 15 | Đua Xe | Nhóm (c) ở đây chỉ là thư viện vật lý, **không phải game sẵn có**. Xe, suspension, camera, track, chống mắc kẹt, nâng cấp và cảm giác lái vẫn phải xây; 7–10 ngày khá lạc quan nếu giữ mô tả catalog đầy đủ |
| 16 | Nông Trại | Chỉ chung loader ảnh với E4; economy, idle, thời gian offline và migration save là phần riêng. Cần giới hạn elapsed khi đổi giờ máy; điểm/tiến trình local không dùng làm quà có giá trị hay BXH tin cậy |
| 17 | Ghép Kẹo | Tutorial MIT không mặc định có kẹo đặc biệt, campaign, bàn cân bằng. Chốt chế độ endless hoặc số màn; kiểm tra cascade kết thúc, bàn không có nước, không nhận input trong animation và tránh sao chép Candy Crush |
| 18 | Sudoku | Sinh có nghiệm không đủ: cần nghiệm duy nhất và độ khó theo cách giải của người chơi. Thư viện chỉ là công cụ; không quảng bá cấp “Chuyên gia” nếu chưa kiểm chứng bộ đề và phân loại |

## 2. Review roadmap, phụ thuộc và ước tính

GĐ0 → GĐ1 → mở rộng lưới → multiplayer → arcade → realtime sau launch là hướng triển khai có cơ sở. Cổng Caro ở GĐ1 đáp ứng nhu cầu chứng minh room trước khi nhân lên. Tuy nhiên cần điều chỉnh kế hoạch trước phê duyệt:

- **Mở luồng nội dung và quyền sử dụng ngay ở GĐ0**, không đợi GĐ3: danh sách từ, câu hỏi, ảnh Tìm Điểm, concept/thumbnail mới và chọn phiên bản thư viện. Nối Từ cần dữ liệu để thiết kế bot/luật; không thể coi đây là phụ thuộc ngoài đường găng.
- Content Service phải có định dạng nhập, validation, phiên bản nội dung, quyền sửa và rollback trước Nối Từ/Đố Vui. Save Service cần có trước Sudoku/Ghép Kẹo nếu lưu ván, không đợi Nông Trại. E4 và biên tập màn phải có mốc riêng; hiện nằm lẫn trong 3–5 ngày của Tìm Điểm.
- Chuyển Đào Vàng lên sau Rắn/E2 hoặc chạy trước một số game điểm thấp: 19/20, không phụ thuộc GĐ3 và tạo khác biệt hoài niệm ngoài game lưới. Giữ Nối Thú ưu tiên sớm như Dev. Đố Vui không nhất thiết phải chờ Nối Từ hoàn chỉnh: dùng round timer/content interface chung, tránh từ điển chặn cả hai sản phẩm có affinity SpeakUp Kids cao.
- RoundController + ghế/bot + chuyển quyền khi reconnect đang gói trong 3–4 ngày, nhiều trách nhiệm độc lập. Tách acceptance cho round kín đáp án, bốn ghế và bot takeover; thiếu một phần thì không coi mọi room đã xong.
- GĐ5 chỉ có nội suy chưa đủ cho cảm giác phản hồi của Rắn/Đặt Bom: cần prototype đo input latency, server reconciliation nếu chọn prediction, ngăn tunneling/collision sai, test reconnect/state snapshot. Thời gian 19–30 ngày là giả thuyết cần spike kỹ thuật, không cam kết.
- CI “chỉ test game thay đổi” phải chạy theo dependency graph: sửa RoomShell/E1/SDK cần test mọi consumer, thay content schema phải kiểm tra corpus tương ứng. Không chỉ lọc theo folder game.

**Sai lệch số học cần sửa khi Mama tổng hợp:** GĐ2 có các dòng 2–3 + 3–4 + 3–5 + 4–6 + 5–7 + 5–7 = **22–32**, đúng. GĐ3 cộng từng dòng thành **27–41**, đúng. GĐ4 cộng 5–7 + 5–7 + 3–5 + 7–10 + 6–9 + 6–8 = **32–46**, đúng. GĐ1 cộng 2–3 + 10–14 + 3–5 + 4–6 = **19–28**, đúng. Tổng GĐ0–4 và launch là **120–177**, đúng. Không phát hiện lỗi cộng trong bản file đã đọc; không dùng nhận định sơ bộ trước kiểm tra làm kết luận.

Con số này **chỉ code + test**, chưa gồm mỹ thuật/âm thanh, từ điển/câu hỏi/màn và pháp lý như Dev đã ghi. Chưa có phân bổ công sức riêng cho refactor E2/E3, admin/import, vận hành, migration, beta feedback và sửa liên game; cần xác nhận chúng đã nằm ở dòng nào để không bỏ sót hoặc đếm hai lần. Thêm dự phòng lập kế hoạch 25–35% cho phần code/test sau khi chốt scope cho ra khoảng **150–239 người-ngày**; đây là dải quản trị do reviewer đề xuất, chưa là estimate đã đo, vẫn chưa gồm công việc phi lập trình.

Một lập trình viên tương đương toàn thời gian, 5 ngày/tuần: dải gốc khoảng 24–35,4 tuần lập trình; không quy đổi bot Dev/Gehihi/Codex thành ba lập trình viên song song. Cần đo công thực tế sau GĐ1, số vòng review/sửa và throughput nội dung rồi mới lập lịch. Mỗi giai đoạn cần gate playable/mobile/content/license, beta nhỏ trước launch; 8–12 ngày cuối không thay thế kiểm thử liên tục.

## 3. Kiến trúc A sửa đổi so với các lỗ hổng V1

| Vấn đề V1 | V2 xử lý tới đâu | Điều kiện còn thiếu |
|---|---|---|
| Một GameRoom phải gánh mọi kiểu game | **Đúng hướng ở thiết kế:** RoomShell + Turn/Round/Tick, room type riêng và tách tick process sau launch | Interface/controller ownership, thứ tự callback, dispose, lỗi module và arbitration timer/move chưa đặc tả; room type riêng không tự cô lập CPU |
| Serialization từ reducer sang state | **Chưa giải quyết:** chưa có schema/adapter/snapshot contract trong V2 | Một ví dụ state reducer → wire → reconnect cho Caro và một round quiz, actionId/revision, schemaVersion, migration/reject client cũ; khóa Colyseus đúng phiên bản và test thật |
| Dữ liệu riêng | Có nêu đáp án server-only nhưng chưa có cơ chế wire cụ thể | Tách public/internal/private state; không đưa đáp án, seed dự đoán câu hỏi hoặc bot-private data vào bundle/broadcast; test bằng client không có quyền, late join và reconnect. Tài liệu 0.16 ở review cũ không xác nhận API 0.18 mà Dev đề xuất |
| Bảo mật guest | Có guest ở GĐ0, chưa bổ sung threat model | Các yêu cầu auth/Origin/quota/seat token ở review V1 vẫn là acceptance chưa được đóng, không xem việc đổi tên lớp là đã giải quyết |
| Lưu kết quả và crash | V2 nhận idempotent matchId, crash hủy trận | Retry bền vững, DB lỗi, race kết thúc, drain deploy và version pin cần thiết kế/kiểm thử; không suy từ “ghi bất đồng bộ” rằng không mất kết quả |
| Code/bundle và client score | Có tách registry, budget và điểm local không đáng tin | Kiểm tra import graph, thông báo score local, phân loại trusted/untrusted trong dữ liệu để sau này không trộn ranking |

Bốn engine là **thư viện dùng chung**, không tự trở thành điểm lỗi đơn vận hành như một server duy nhất. Chúng tạo phạm vi ảnh hưởng rộng khi có lỗi hoặc thay đổi; một process game server mới là nơi một reducer chặn event loop có thể làm chậm nhiều room. Tách engine nhỏ theo capability, version, contract tests và smoke test tất cả consumer. Không tải cả E1+E2+E3+E4 cho mọi game.

E1 đang gộp lưới vuông/lục giác, gravity, undo, RNG, bàn cờ và animation; E4 gộp tìm điểm với idle economy. Chỉ trích xuất phần đã thật sự dùng ở hai game, dùng composition thay kế thừa lớn; không ép luật game thành engine đa năng. Nội suy của TickController không có ích cho reducer bàn cờ; bot worker cần queue có giới hạn, timeout/hủy và không chia sẻ state mutable với room.

V2 có mâu thuẫn thống kê: phần đầu nói 11/18 không tốn server và **9 game online**, nhưng bảng chế độ thực tế launch có **13 game local** (9 đơn + 2 local 2P + Rắn/Đặt Bom local) và **5 online** (Caro, Cờ Tướng, Nối Từ, Cá Ngựa, Đố Vui). Sau GĐ5 thêm ba chế độ online thành **8 game online**, không phải 9; local/online có thể chồng lấp nên không cộng hai nhóm như phân hoạch. “Không tốn server” cũng chỉ nói gameplay: HTML origin, analytics, content download và tùy chọn API vẫn có tải. Số game không đủ chứng minh một VPS chịu được traffic hay bot.

## 4. License, thương hiệu, bảo mật và hiệu năng: kiểm chứng độc lập

### Thương hiệu: nghiêm trọng nhưng không thể kết luận đồng loạt chỉ từ sáu tên

Đã tra nguồn gốc công khai ngày 17/11/2026; đây là sàng lọc phát hành, **không phải kết luận pháp lý về quyền tại Việt Nam**. Cần phân biệt tên trong catalog, tên chỉ được Dev nhắc để so sánh, quyền với tài sản hình/âm thanh, và phạm vi đăng ký từng lãnh thổ.

| Nhóm tên | Kết quả độc lập và quyết định review |
|---|---|
| Pikachu/Pokémon | Catalog trực tiếp dùng Pikachu. Pokémon công bố bảo vệ nội dung và tài sản thương hiệu [N2]. **Chặn phát hành tên/ảnh đó khi chưa có quyền**; Nối Thú với bộ hình riêng là hướng tiếp tục. Tự vẽ lại cùng nhân vật không biến nó thành nhân vật độc lập |
| Tetris | Catalog trực tiếp dùng tên; nguồn chính thức nhận quyền với cả trade dress [N1]. Rủi ro cao, không chỉ đổi chữ/logo. Thiết kế bàn, mảnh, màu, âm thanh và tổng thể cần đánh giá độc lập trước chốt scope |
| Dynomite Pop | EA có sản phẩm Dynomite! trong catalog [N3], đủ chứng minh liên hệ sản phẩm thật; chưa tra được hồ sơ nhãn hiệu cụ thể tại VN. Tên phụ + chủ đề khủng long/trứng làm tăng nguy cơ nhầm lẫn; đổi tên và concept độc lập, không gọi mọi bubble shooter là vi phạm |
| Hill Climb Racer | Không hoàn toàn trùng “Hill Climb Racing”, nhưng rất gần tên và gameplay; policy Fingersoft kiểm soát sử dụng IP/marks [N4]. Đổi tên chưa chứng minh an toàn nếu xe/nhân vật/track/UI vẫn sao chép |
| Bomb Arena/Bomberman | Catalog là Bomb Arena, **không có tên Bomberman**. Konami xác nhận franchise Bomberman [N5], nhưng điều đó không chứng minh Bomb Arena là nhãn hiệu Konami hay tự động vi phạm. Dùng cảnh báo về nhân vật/trang phục/maze/âm thanh tổng thể; phải tra riêng tên Bomb Arena, không gán chủ sở hữu khi chưa có chứng cứ |
| Bow Master/Bowmen | Catalog dùng Bow Master và mô tả tham khảo Bowmen. Chưa xác minh Bowmen là nhãn hiệu đã đăng ký; không lặp lại khẳng định của Dev như sự thật. Nguồn Miniclip xác nhận **Bowmasters** là game thật [N6], là tên gần cần bổ sung sàng lọc. Tránh art/bạo lực/branding của cả hai sản phẩm |

**Dev có bỏ sót không?** Dev đã nhắc Candy Crush ở phần 2.3 nên không coi đây là phát hiện mới, nhưng câu “sáu tên” không bao quát hết quyền phát hành. **Gold Miner** đang là tên phụ thực tế của Đào Vàng mà danh sách đổi tên cuối tài liệu không nhắc: cần tra quyền tên và tránh sao chép ông thợ mỏ/âm thanh/màn/thumbnail từ bản gốc; review chưa xác minh đăng ký nên không tuyên bố từ này bị độc quyền. Các tên “Snake Battle”, “Bow Master”, “Ludo Fun”, “Mini Garden”, “2048 Siêu Cấp” và tên portal cũng chưa được clearance: tên phổ thông không đồng nghĩa đã an toàn cho logo, domain và sản phẩm. Không cần bỏ các cơ chế game; cần danh mục tên phát hành riêng và hồ sơ nguồn tài sản.

### Từ điển: xác nhận một phần, bác suy rộng “mọi nguồn đều GPL”

Repo duyet ghi GNU GPL và nguồn Ho Ngoc Duc [N7]; repo undertheseanlp/dictionary ghi **mã nguồn** GPL-3.0 [N8]. Xác nhận hai repo có tuyên bố GPL, nhưng **không đủ để kết luận tất cả từ điển tiếng Việt đều GPL hoặc mọi file dữ liệu trong repo có cùng quyền rõ ràng**. Cần truy nguồn dữ liệu cụ thể, người có quyền cấp phép, phiên bản và cách dùng. GPL cũng không cấm sử dụng thương mại; GNU phân biệt chạy riêng và phân phối [N9]. Không tự suy rằng server-only an toàn tuyệt đối cho dữ liệu, hoặc iframe tự giải quyết nghĩa vụ GPL.

Tự xây 3.000–10.000 từ khả thi như **một luồng biên tập riêng**, không nằm trọn trong 6–9 người-ngày code Nối Từ và không tự nhiên miễn rủi ro nếu chép/đổi thứ tự danh sách GPL. “Đối chiếu nội bộ” không phải chứng minh nguồn độc lập. Cần nhật ký nguồn, tiêu chí tuyển từ, duyệt người thật, xử lý tranh chấp và version. Từ AI sinh chỉ là ứng viên, không phải nguồn xác thực.

Ví dụ dự toán minh bạch: nếu tổng thời gian kiểm tra hai lượt bình quân 1–2 phút/mục, 3.000–10.000 mục cần khoảng **50–333 giờ = 6,3–41,7 ngày 8 giờ**, chưa gồm tìm mục, khử trùng, thiết kế luật và playtest. Đây là mô hình giả định, không phải năng suất đã đo. Thử 200 mục trước để đo thời gian; đo tỷ lệ từ bị từ chối sai, độ phủ và phân bố bậc vào/ra của đồ thị tiếng cuối → tiếng đầu, số trận hết đường quá sớm. Một tập “từ hợp lệ” không tự tạo game cân bằng. Có thể launch bằng tập từ hạn chế đã duyệt và công bố luật rõ, nhưng không quảng bá đó là toàn bộ từ điển chuẩn; không cần bỏ Nối Từ khỏi roadmap.

### Nhóm (c), bảo mật và ngân sách hiệu năng

- Hai repo rembound đúng là repo **tutorial** công bố MIT [N10, N11], không phải gói game production đã chứng minh mobile, âm thanh, pause, accessibility, CSP hay Save Service. Pin commit, kiểm từng file/asset/dependency, giữ notice; làm spike wrapper so với port sang E1 trước khi chốt ngày. Không cộng lợi ích “game có sẵn” và “dùng chung E1” hai lần khi thực tế phải viết lại.
- Chọn một thư viện vật lý sau prototype; không nạp cả planck và matter, không thêm Pixi/Excalibur song song với Phaser nếu chưa có lý do đo được. Repo sudoku/xiangqi cần test thuật toán và phạm vi luật, license root chưa chứng minh correctness. Review này không xác nhận lại toàn bộ 17 repo hay các số phiên bản npm Dev đưa ra.
- Game bên ngoài có thể kèm URL tracking, eval, script CDN, service worker hoặc handler toàn trang. Ưu tiên vendor self-host theo commit; không chạy script bên ngoài thay đổi âm thầm. Manifest phải ghi source/version/license/asset provenance và quyền network. Adapter iframe vẫn áp dụng yêu cầu source/origin/nonce từ V1; không chuyển guest token vào game không tin cậy.
- Lưu game import phải kiểm kích thước/schema/range; không tin IndexedDB như nguồn an toàn. Content JSON/Markdown, câu hỏi và nickname phải render an toàn. Giới hạn tài nguyên khi sinh Sudoku/AI/match cascade; worker và deadline không chỉ cho bot Cờ Tướng.
- Pin quiz contentVersion theo trận, freeze câu hỏi và đáp án đến cuối vòng; không cache đáp án online trong bundle/content CDN. Chống lặp submit, dùng thời gian nhận server; không chấm theo timestamp client. Nếu handicap latency là mục tiêu sản phẩm, phải có policy riêng thay vì mặc định người mạng chậm thua.
- Preview video/GIF cho 18 card, thumbnail 3D, font và shared Phaser có thể làm vỡ budget trang chủ. Không tự phát tất cả preview; poster nhẹ, chỉ tải khi cần, reduced-motion và giới hạn decode/GPU. Test chuyển game nhiều lần để tìm rò listener/texture/audio, không chỉ FPS một game sau fresh load.
- Băng thông 2–6 KB/s/player là giả định **payload tới một người nhận**. Nếu đã gồm mọi thực thể của room thì không nhân số người room lần nữa khi tính tổng CCU; phải ghi ranh giới và overhead WSS. CDN cache miss, storage, content import và bot vẫn phải đo; không suy chi phí gần như bất biến từ số game đơn.

## 5. Public Launch 18 game: đồng ý phạm vi, chưa chốt lịch

**Giữ 18 game là phương án ưu tiên**, với các thay đổi chế độ phải được chủ dự án duyệt rõ: Rắn/Đặt Bom local trước; Bắn Cung/Đào Vàng 2P cùng máy; single/local phải được hiển thị đúng filter, không tạo ảo giác có phòng online. Catalog score hiện chưa lượng hóa mất viral khi hoãn hai game action online. Portal vẫn có năm game online để giữ vòng mời bạn; nên đo invite → join → hoàn tất ván theo từng game và CTR SpeakUp Kids riêng, không dùng traffic hay tổng điểm chủ quan thay bằng chứng.

Nguồn lực hiện biết gồm Dev triển khai, Gehihi UX và Codex review, Mama điều phối; **chưa có cam kết công suất mỹ thuật/biên tập/QA độc lập**. Vì vậy 120–177 người-ngày có thể dùng làm baseline code để đo lại, chưa thực tế như lịch giao toàn bộ sản phẩm. Không đặt launch khi đếm đủ tile: mỗi game phải có vòng chơi hoàn chỉnh, mobile controls, retry/save theo mode, đủ nội dung chơi lại, landing/thumbnail thật, license và QA gate. Chưa có code hay mẫu nội dung để xác nhận 18 game đạt mức đó.

Nếu chủ dự án bắt buộc giữ hạn thời gian sau khi đo GĐ1 và không bổ sung nguồn lực, **phương án dự phòng 15 game**, không tự áp dụng, là dời ba game sau:

| Game dời | Lý do cụ thể | Tác động kinh doanh theo catalog | Cách hạn chế tổn thất |
|---|---|---|---|
| Đua Xe | Vật lý nền không cung cấp game hoàn chỉnh; scope handling/track/upgrades và rủi ro tên rất cao so với 7–10 ngày | Mất thể loại lái xe, điểm 15/20, SEO 4/5, chia sẻ 3/5; catalog không chấm affinity SpeakUp cụ thể cho game này, không được tự gán thấp | Giữ Đào Vàng/Bắn Cung/Rắn để vẫn có casual kỹ năng; không coi chúng thay thế hoàn toàn tệp lái xe |
| Nông Trại | Economy/idle và nội dung ảnh riêng, ít reuse thực chất với Tìm Điểm; 6–9 ngày chưa bao nội dung | Mất idle/retention thư giãn, điểm 14/20, SEO 3/5, chia sẻ 3/5; affinity SpeakUp chưa được catalog chấm | Giữ các puzzle dài hạn và tiến trình save, ghi nhận khoảng trống thể loại chứ không hứa giữ nguyên retention |
| Đặt Bom vs bot | Bot né bom/cân bằng tốn 6–8 ngày; lợi thế multiplayer 17/20 không xuất hiện ở launch | Mất action nhóm tiềm năng, chơi lại 5/5, chia sẻ 4/5, SEO 4/5; khác với cách Dev gọi đây là một trong “ba ít điểm nhất”, nó **không** thuộc ba game điểm thấp nhất | Giữ Cá Ngựa/Đố Vui/Caro/Nối Từ cho room viral; đây không bù đầy đủ action realtime, cần truyền thông phạm vi thật |

Tiết kiệm trực tiếp theo dòng game là **19–27 ngày code/test**, không bảo đảm rút lịch đúng số đó do shared work/nội dung. Trừ khỏi tổng gốc cho khoảng **101–150 ngày**, chưa cộng dự phòng hay điều chỉnh dependency. Giữ Nối Thú, Nối Từ, Đố Vui, Bắn Bóng, Tìm Điểm vì affinity SpeakUp cao; giữ Đào Vàng 19/20 và Caro 20/20. Chưa đề nghị cắt thêm Xếp Gạch/Nối Từ: nếu clearance hoặc dữ liệu chưa đạt, phải trình quyết định riêng có tác động sản phẩm, không âm thầm thay game/đếm tile.

## 6. Rủi ro khác và yêu cầu trước lần xin phê duyệt tiếp theo

1. **Quyền nội dung ngoài code:** 500 câu có thể chứa đoạn văn/ảnh được sao chép, đáp án sai hoặc thông tin nhạy cảm; ảnh/nhạc/font/giọng AI và prompt mô phỏng nhân vật cần hồ sơ nguồn. “Tự vẽ/AI” không tự chứng minh quyền sử dụng hoặc originality. Có quy trình sửa/gỡ và đầu mối tiếp nhận khiếu nại; tên dự án/SpeakUp assets cũng cần quyền sử dụng phù hợp.
2. **Quảng cáo và quà:** lời hứa “nhận quà/bài học miễn phí” phải có điều kiện thực tế và đích đến rõ; quiz sponsor được gắn nhãn tài trợ, không giả quảng cáo thành game độc lập. Không tự cấp quyền chia sẻ nickname/room data sang SpeakUp. Các khẳng định “tỷ lệ chuyển đổi cực cao” trong catalog chưa có thử nghiệm, chưa dùng để duyệt ngân sách.
3. **Trẻ em, định danh và vận hành multiplayer:** V2 đã nhắc quy định từ V1; review không xác nhận phân loại pháp lý hay điều kiện đủ. Phải có người chịu trách nhiệm xác minh quy định hiện hành trước public online, không coi guest/no-email là miễn nghĩa vụ. Moderation nickname và Nối Từ vẫn cần dù không có free-text chat; có report/mute và quy trình xử lý thực tế, không chỉ bộ lọc.
4. **Bot takeover và đồng thuận:** không tự thay đối thủ bằng bot vô hình; thông báo trạng thái, chốt ai có quyền điều khiển khi người thật quay lại, cấm bot và người thật cùng gửi move, tách kết quả casual/bot khỏi thống kê đối đầu người thật. Tự động takeover không phải yêu cầu đã được người dùng phê duyệt chỉ vì UX nêu dưới mục giả định.
5. **Save không đồng bộ tài khoản:** localStorage/IndexedDB có thể bị xóa, đầy quota, bị giới hạn in-app hoặc không chuyển giữa Zalo/Chrome; Save Service phải có fallback và thông báo mất tiến trình đúng mức. Nếu thêm export/import thì validate file; nếu thêm cloud-save sau này phải có chiến lược merge và dữ liệu phiên bản.
6. **Single VPS và supply chain:** build/deploy không chạy tranh CPU với game; per-game quota và kill switch để tắt game lỗi mà không hạ cả portal. Lockfile, kiểm dependency/asset và bản vá phải có người sở hữu; backup restore, alert ngoài máy, rollback content/code được diễn tập. CI cache không được phát hành artifact sai khi shared dependency đổi.

**Đầu ra cần Mama tổng hợp trước xin duyệt:** bảng 18 tên/chế độ phát hành thống nhất; owner và lịch giao nội dung/mỹ thuật; định nghĩa chất lượng/màn chơi tối thiểu mỗi game; ma trận dependency và gate; spike serialization/private-state/room recovery đúng phiên bản; số đo năng suất GĐ1; tổng công bao gồm phần ngoài code và contingency. Chưa bắt đầu code hoặc mua dịch vụ trước phê duyệt.

### Nguồn đối chiếu và phạm vi xác minh

Nguồn dự án: ba file đầu tài liệu, đặc biệt catalog mục 2–4 và kiến trúc V2 mục 1–5. Tra công khai 17/11/2026:

- [N1 — Tetris: About](https://www.tetris.com/about): thông báo quyền thương hiệu/trade dress; không xác lập kết luận vi phạm cho thiết kế chưa có.
- [N2 — Pokémon: Terms of Use](https://www.pokemon.com/uk/legal/terms-of-use): quyền nội dung/IP.
- [N3 — EA: danh mục game](https://www.ea.com/games?page=16): sản phẩm Dynomite!; chưa xác minh đăng ký nhãn hiệu VN.
- [N4 — Fingersoft: Fan Content Policy](https://fingersoft.com/fan-content-policy/): quyền và hạn chế sử dụng IP/marks Hill Climb Racing; không mặc định portal là fan content được phép.
- [N5 — Konami: Bomberman](https://www.konami.com/crossmedia/us/en/products/bomberman/): franchise chính thức; không chứng minh quyền tên Bomb Arena.
- [N6 — Miniclip: Bowmasters](https://support.miniclip.com/hc/en-us/articles/7170562653969--Bowmasters): sản phẩm tên gần Bow Master, chưa phải tra cứu trademark toàn diện.
- [N7 — duyet/vietnamese-wordlist README](https://github.com/duyet/vietnamese-wordlist/blob/master/README.md): tuyên bố GPL và nguồn.
- [N8 — undertheseanlp/dictionary](https://github.com/undertheseanlp/dictionary): tuyên bố mã nguồn GPL-3.0.
- [N9 — GNU GPL FAQ](https://www.gnu.org/licenses/gpl-faq.html#UnreleasedMods): giải thích chạy riêng/phân phối, không thay phân tích dữ liệu và cách tích hợp cụ thể.
- [N10 — Bubble Shooter tutorial](https://github.com/rembound/Bubble-Shooter-HTML5), [N11 — Match-3 tutorial](https://github.com/rembound/Match-3-Game-HTML5): repo có nhãn MIT và mục tiêu tutorial, chưa kiểm tra toàn bộ file/asset.

Chưa chạy code, load test, kiểm thử thiết bị, audit dependency đã khóa hay tra cứu đầy đủ quyền tại VN. Các ước lượng bổ sung là giả định có công thức; mọi nhận định về lỗi thiết kế cần được đóng bằng đặc tả và kiểm thử khi triển khai.
