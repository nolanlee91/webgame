# Webgame Portal — Independent Architecture Review

Tác giả: Codex · Ngày: 17/11/2026 · Trạng thái: đề xuất cho Mama/chủ dự án xét duyệt.

Đã đọc toàn bộ `docs/tech-architecture.md` của Dev và `docs/ux-ui-spec.md` của Gehihi. Đây là review thiết kế, chưa có code để xác nhận cách triển khai. Không đánh giá pháp lý; không sửa tài liệu của tác giả khác, không triển khai hay commit.

**Kết luận:** đồng ý có điều kiện với phương án A cho MVP. Rủi ro lớn nhất là coi một `GameRoom` chung và reducer thuần đã giải quyết xong serialization, dữ liệu riêng, reconnect và các loại game khác nhau. MVP nên chốt **2048 + Caro + Rắn**, chưa gồm Cờ Tướng, Vẽ & Đoán và Tiến Lên. Không thể xác nhận tiến độ một đợt khi chưa có thời lượng, năng lực triển khai và tiêu chí nghiệm thu.

## 1. Phản biện lựa chọn A; nhận xét B và C

A hợp lý vì tách trang SEO khỏi realtime, dùng TypeScript xuyên suốt và không phải tự xây toàn bộ cơ chế room. Tuy nhiên, SSG/ISR không tự làm mọi HTML được CDN cache: cần cấu hình cache rõ ràng, tách trang công khai khỏi API/session/phòng và kiểm tra không cache dữ liệu cá nhân. Chọn một backend API cho MVP (đề xuất Next.js Route Handlers), chưa thêm Fastify khi chưa có nhu cầu đo được.

Một VPS là lựa chọn thử nghiệm hợp lý nếu chấp nhận ngắt trận khi máy/process lỗi; không phải kiến trúc có tính sẵn sàng cao. Giới hạn RAM/CPU cho từng container để build web, Postgres hoặc analytics không làm nghẽn game server. Chi phí, độ trễ Singapore và số phòng/CCU trong tài liệu là giả định, không phải cam kết đã đo.

B có thể giảm vận hành nhưng đổi lại phải xây thêm room protocol, phục hồi và công cụ debug; không chọn chỉ vì kỳ vọng edge luôn gần người chơi. C đáng cân nhắc khi social/ranking thành trọng tâm, nhưng hiện thêm runtime và tính năng ngoài nhu cầu. Không có lý do đủ mạnh để đổi khỏi A ở bước này; giá và giới hạn dịch vụ B/C chưa được kiểm chứng trong review.

**Điều kiện trước khi chốt nền móng:** khóa phiên bản framework; làm thử một phòng Caro hai client với reconnect; xác định state adapter, xác thực guest và điều kiện lưu kết quả; có kế hoạch backup/khôi phục và đo tải.

## 2. Khả năng mở rộng và Game SDK

Manifest + `GameClientModule` + logic thuần là hướng tốt để thêm hàng chục game trong các nhóm đã hỗ trợ. Nhưng “không sửa core” chỉ đúng trong phạm vi capability có sẵn; game có spectator riêng, thông tin ẩn hoặc mô phỏng liên tục có thể cần mở rộng SDK. Không hứa tái sử dụng 100% phòng cho Cờ Tướng trước khi thử đồng hồ, hòa, xin thua và mất kết nối.

Các khoảng trống cần giải quyết:

- `GameLogic` trả state TypeScript tùy ý trong khi transport cần mô hình serialization cụ thể. Cần adapter/schema theo game, hợp đồng snapshot và phiên bản protocol; chứng minh reducer cập nhật được state đồng bộ mà không phát toàn bộ snapshot mỗi nước.
- `viewFor?` chỉ là interface, chưa đảm bảo lọc dữ liệu trên đường truyền. Tách state nội bộ server, state công khai và payload riêng. Không đưa bí mật vào broadcast rồi giấu bằng UI. Tài liệu Colyseus 0.16 mô tả state mặc định hiển thị cho mọi client; cơ chế lọc phụ thuộc phiên bản [S2].
- Tách manifest metadata thuần khỏi loader client và registry server. Không để import registry kéo React/Phaser vào server hoặc luật/bí mật server vào bundle web. `unknown` cần schema validation runtime; manifest phải được kiểm tra build-time và chỉ registry tin cậy được nạp.
- SDK cần capabilities (turn-based, drawing, spectator, private-state), lifecycle khi mount lỗi/destroy, hủy listener/timer/socket, định nghĩa pause multiplayer và version tương thích. Không cần thiết kế plugin engine tổng quát ngay từ đầu.

Scale phòng tăng theo process, nhưng mỗi room vẫn thuộc một process [S1]. Redis presence không tự phân tán state trận, khôi phục trận khi crash hay giải quyết CPU-bound reducer. Điểm nghẽn là event loop, serialize/GC, fan-out lobby, băng thông drawing, kết nối DB và tạo guest/phòng hàng loạt. Chỉ dùng lobby subscription khi màn hình cần; lọc, phân trang, gộp cập nhật; API query phòng chỉ ở server và chỉ trả metadata cho phép công khai.

Không lấy “vài nghìn CCU” làm mốc cố định để thêm process. Đo event-loop lag, RAM/room, CPU, p95/p99 join và move ack, bytes/player/s, reconnect thành công, DB latency. Khi scale cần presence và room driver chia sẻ, định tuyến tới đúng process sở hữu room theo phiên bản đã chọn; mô tả “sticky session” hiện quá ngắn [S1]. Redis có thể hoãn ở prototype một process nếu chưa cần rate limit dùng chung, nhưng cần giữ khả năng thay adapter.

## 3. Bảo mật: authoritative server, guest và iframe

`validateMove/applyMove` là nền tảng chống nước đi bất hợp lệ, chưa đủ bảo mật. Server phải lấy playerId từ session đã xác thực, kiểm tra ghế/quyền/lượt/trạng thái trận, schema và kích thước payload, giới hạn tần suất; client chỉ gửi ý định. Không nhận state, điểm, kết quả hay thời gian còn lại do client quyết định. Kiểm tra và áp dụng move phải tuần tự, không để thao tác async tạo race.

Guest-first đúng UX nhưng xóa storage là có thể tạo danh tính mới. Cần session guest do server cấp, hết hạn/thu hồi được; cookie bảo mật và kiểm tra Origin cho WebSocket/API theo mô hình auth chọn. Không coi CORS là cơ chế xác thực. Reconnect token phải gắn ghế, không thay bằng nickname hoặc mã phòng; không ghi token vào log/URL. Một tài khoản có nhiều tab cần quy tắc sở hữu ghế và chuyển kết nối rõ ràng.

Chống abuse nhiều lớp: quota tạo guest/phòng/kết nối theo session và IP, giới hạn toàn hệ thống, TTL phòng trống, backoff join sai, dọn phòng rác; IP chỉ là một tín hiệu vì nhiều người dùng chung mạng. Mã 6 ký tự là cơ chế tiện dụng, không phải mật khẩu mạnh. Phòng riêng không xuất hiện ở lobby; giới hạn dò mã, kiểm tra quyền khi join, hỗ trợ thu hồi link nếu cần. Nickname cần giới hạn độ dài, escape khi render và cơ chế mute/report; MVP dùng câu chat soạn sẵn.

Iframe sandbox giúp cô lập nhưng không phải bảo đảm toàn diện. Dùng origin riêng không có cookie portal, cấp tối thiểu quyền; tránh đồng thời `allow-scripts` và `allow-same-origin` cho nội dung cùng origin vì có thể làm mất hiệu lực sandbox [S3]. Không cấp navigation/popup/download/camera tùy tiện; giới hạn nguồn bằng CSP. Với `postMessage`, kiểm tra source window, origin khi có origin xác định, schema, loại lệnh và session nonce. Origin opaque `null` cần ràng buộc source/nonce hoặc MessageChannel đã bắt tay, không tin mọi message có origin `null`. Không chuyển token portal vào iframe, không dùng score iframe cho ranking tin cậy. Sandbox không ngăn mọi request ra mạng hoặc tiêu thụ tài nguyên; MVP nên chỉ chạy game tự kiểm soát, hoãn game bên thứ ba.

## 4. Đồng bộ realtime: game cờ và Vẽ & Đoán

Colyseus phù hợp làm transport/lifecycle chung, nhưng không nên ép mọi game qua cùng pipeline reducer/patch. Đề xuất composition: RoomShell quản lý auth/ghế/lifecycle; TurnBasedController quản lý move/deadline; DrawingController riêng quản lý stroke stream. Chưa xây controller thứ hai trong MVP.

Cờ cần actionId, matchId và expected revision để chống gửi trùng sau reconnect; server trả revision và deadline, client chỉ hiển thị đồng hồ. Chốt chính sách khi move và timeout cùng tới, mất mạng có dừng đồng hồ không, hết grace xử thua hay hủy. Reconnect đồng bộ snapshot mới rồi mới nhận input; không mặc định replay command cũ.

Vẽ & Đoán cần render cục bộ ngay, gom điểm thành batch, strokeId/sequence/roundId, giới hạn tần suất, số điểm và kích thước. Kiểm tra tọa độ, chỉ người đang vẽ được gửi; late join/reconnect nhận snapshot có giới hạn cộng phần nét vẽ tiếp theo. Không giữ vô hạn mọi điểm trong schema delta. WebSocket có thứ tự nhưng dữ liệu quá nhiều vẫn xếp hàng, tạo trễ; cần backpressure và bỏ bớt điểm trung gian, giữ thao tác kết thúc/xóa nét đáng tin cậy. Từ đáp án chỉ ở server/người vẽ, không broadcast cho người đoán.

Độ trễ 30–50ms không đủ đại diện mạng mobile hay đường truyền in-app. Phải thử RTT cao, jitter, mất gói, background/resume và reconnect đồng loạt. Chưa có số đo để xác nhận trải nghiệm nét vẽ hoặc mục tiêu tạo phòng <0,5s/ghép nhanh <3s của UX.

## 5. Chống gian lận theo từng nhóm game

| Nhóm | Chặn ở server | Giới hạn còn lại / quyết định MVP |
|---|---|---|
| Caro/Cờ Tướng | Kiểm tra quân/ô/lượt, revision, luật kết thúc, deadline, ghế, xin thua; tính kết quả từ state server | Không chặn được người dùng engine ngoài hay thông đồng chỉ bằng authoritative server. Chưa mở ranked; không khóa tài khoản chỉ vì nước đi nhanh/tốt |
| Vẽ & Đoán | Giấu đáp án, RNG phía server, khóa quyền vẽ, chấm điểm theo thời điểm nhận, giới hạn đoán và payload; chuẩn hóa tiếng Việt theo luật đã chốt | Gửi đáp án ngoài hệ thống và hình vẽ độc hại vẫn xảy ra; lọc từ không xử lý hình ảnh. Cần báo cáo/moderation trước khi mở công khai |
| Tiến Lên | Shuffle server bằng RNG phù hợp, chỉ gửi bài của đúng người, validate sở hữu/lượt/chặt/bỏ lượt, spectator không thấy bài kín | Nhiều tài khoản thông đồng; cần test packet-level chống rò bài. Dời khỏi MVP |
| 2048/Rắn | Lưu điểm local cho mục tiêu giải trí; tách nguồn điểm khỏi kết quả multiplayer | `reportScore()` từ client có thể bị sửa. Không có BXH cạnh tranh tin cậy nếu chỉ nhận điểm; replay có seed/luật server xác minh là công việc riêng cho sau |

Log phục vụ đối soát cần action/revision, rulesVersion, nguyên nhân kết thúc và thời gian server; giới hạn retention, không ghi token/bí mật. Dữ liệu trận casual không mặc nhiên đủ công bằng để hồi tố rating: cần policy ranked, phiên bản luật và chất lượng định danh riêng.

## 6. Phạm vi MVP và đề xuất cắt cụ thể

Sáu game là nhiều lớp phức tạp khác nhau, không phải sáu lần lặp một template. Dev đã đề nghị dời Tiến Lên và có bản tối thiểu bốn game; review đề nghị thu còn ba game để ưu tiên trải nghiệm mời bạn và phục hồi mạng.

| Mốc | Phạm vi và tiêu chí qua mốc |
|---|---|
| 1: 2048 + portal | Trang chủ/danh mục/landing, lazy-load, điều khiển mobile, restart/mute, điểm local; một SpeakUp Kids card có nhãn quảng cáo và link rõ ràng. Chưa PWA, animated preview hay auth mạng xã hội |
| 2: Caro end-to-end | Chốt biến thể 15×15, đúng 5 hay từ 5, chặn hai đầu có tính không; hai guest tạo/vào phòng, copy link/mã, ready/start, public list đơn giản, kết quả server, reconnect/timeout và chống spam. Chưa AI, spectator, free-text chat, quick-match riêng, ranking/badge |
| 3: Rắn + ổn định | Kiểm chứng SDK thứ hai, touch/viewport, hiệu năng; thêm end-game banner nếu không cản chơi lại. Chỉ nghiệm thu sau test thiết bị và tải |

Dời Cờ Tướng sang đợt tiếp theo: luật chiếu, nước tự đặt tướng vào chiếu, đối mặt, bí, hòa/lặp lại và đồng hồ cần test sâu; “tự viết nhanh” chưa được chứng minh. Dời Vẽ & Đoán đến khi có drawing protocol và phương án moderation. Tiến Lên tiếp tục để sau, chỉ xét kỹ thuật ở review này.

Giữ điểm khác biệt hybrid qua 2 single + 1 multi, private invite và public room; không cần đủ sáu game để kiểm chứng sản phẩm. UX profile/history tùy chọn đang lệch với yêu cầu lưu mọi kết quả của Dev: server vẫn lưu bản ghi tối thiểu để kiểm tra, guest không bắt buộc có màn hình lịch sử hay tài khoản nâng cấp trong MVP.

Chỉ giữ một theme, catalog phân trang đơn giản, không infinite scroll; ba vị trí ads là lộ trình, chưa cần bật sticky sponsor trên mobile. CTA không giả dạng game nếu dẫn sang website khác. Không làm video chờ tải hoặc thưởng thêm lượt chơi: tăng scope và chưa có bằng chứng cải thiện chuyển đổi.

## 7. Rủi ro kỹ thuật khác và điều kiện nghiệm thu

| Mức | Khoảng trống trong đề xuất | Hành động cần có |
|---|---|---|
| Cao | Reconnect khi mạng mất khác phục hồi khi process/VPS chết; Redis presence không phải durable match state | MVP công bố trận bị hủy khi crash, không tính thua tự động; hỗ trợ idempotent lưu kết quả. Nếu cần resume sau crash thì phải thêm snapshot/event persistence và recovery riêng |
| Cao | Room ID, mã mời 6 ký tự và vòng đời trận chưa tách biệt | Mapping server có uniqueness/TTL, kiểm tra seat atomically; quy tắc chủ phòng rời đi, reset ready sau đổi config, chơi lại sinh matchId mới; không tái dùng mã làm lộ trận cũ |
| Cao | Ghi kết quả có thể trùng/mất khi retry, DB lỗi hoặc room đóng | Unique matchId, transaction và retry có giới hạn; định nghĩa khi nào báo đã lưu. Không block event loop bằng DB; thất bại phải quan sát được, không tự nhận exactly-once |
| Cao | Deploy phiên bản mới khi còn phòng cũ; web CDN có thể giữ client cũ | Pin rules/protocol version theo trận, handshake tương thích, drain không nhận room mới, cho trận cũ hoàn tất hoặc hủy có thông báo; migration tương thích ngược |
| Cao | Backup cùng VPS và uptime monitor cùng máy không bảo vệ khi mất máy | Backup mã hóa ngoài máy, thử restore; healthcheck từ ngoài và cảnh báo tài nguyên/disk, xoay log; Postgres/Redis không mở public, tài khoản quyền tối thiểu |
| Vừa | Sticky banner + bottom nav + bàn game trên màn hình thấp; “tự ẩn URL” và fullscreen không phải luôn thực hiện được | Fallback viewport thường, safe-area, không khóa scroll toàn site; đo iOS Safari/Android và Zalo/Messenger. Không chặn chơi khi fullscreen bị từ chối |
| Vừa | SDK pause/destroy và audio/input ảnh hưởng room; chuyển sang SpeakUp Kids có thể làm mất lượt | Pause chỉ tác động local nếu luật không cho dừng; nhắc trạng thái trận khi rời, không tự mở quảng cáo giữa trận; dọn listener và giữ thông tin quay lại |
| Vừa | Analytics/ads click và URL mời có thể bị spam hoặc rò token | Allowlist đích CTA, không open redirect; loại token/mã phòng khỏi analytics/referrer khi thích hợp, gộp event click; tracking không nằm trên đường xử lý move |

**Bộ kiểm chứng trước phát hành (chưa thực hiện):** unit/property tests cho luật và invariants; test hai client gửi trùng/trái lượt/giả playerId; join đồng thời ghế cuối; reconnect và nhiều tab; kiểm tra dữ liệu thực trên wire; thử process chết/DB lỗi/restore backup; load test hỗn hợp lobby/room churn/move/reconnect ở mức 500 CCU giả định rồi tăng đến khi tìm được ngưỡng. Mốc tải chỉ được chấp nhận khi đo trên cấu hình triển khai và có headroom, không suy từ số room lý thuyết. Kiểm tra LCP/CLS/bundle theo mục tiêu Dev trên thiết bị thật, gồm mọi ads đang bật.

### Nguồn và giới hạn kiểm chứng

- Nguồn dự án: `docs/tech-architecture.md`, đặc biệt mục 2, 3, 5, 6, 7; `docs/ux-ui-spec.md`, mục 2, 3, 5. Nhận định và đề xuất phía trên là đánh giá của reviewer, không phải kết quả benchmark.
- [S1 — Colyseus 0.16: Scalability](https://0-16-x.docs.colyseus.io/deployment/scalability): một room thuộc một process, shared presence/driver và định tuyến process. Tham khảo có phiên bản; Dev phải đối chiếu phiên bản thật trước khi code.
- [S2 — Colyseus 0.16: StateView](https://0-16-x.docs.colyseus.io/state/view): lọc state theo client, cần cấu hình rõ ràng; không tự phát sinh từ interface `viewFor` của dự án.
- [S3 — MDN: iframe sandbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe#sandbox): giới hạn sandbox và cảnh báo kết hợp quyền scripts/same-origin.

Đối chiếu tài liệu công khai ngày 17/11/2026. Chưa kiểm chứng giá, license, pháp lý, benchmark, triển khai, code hoặc môi trường vận hành. Các lỗi thiết kế nêu trên là điều kiện cần làm rõ/kiểm thử, chưa phải lỗi implementation đã tái hiện.
