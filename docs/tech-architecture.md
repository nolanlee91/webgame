# Webgame Portal — Đề xuất Kiến trúc Kỹ thuật & Kế hoạch MVP

> Tác giả: Dev (Technical Lead / Developer) · Ngày: 2026-11-17 · Trạng thái: **ĐỀ XUẤT — chờ chủ dự án duyệt**
> Tài liệu này chỉ là đề xuất. Chưa có code, chưa cài đặt, chưa dùng dịch vụ trả phí.
> Các con số chi phí, giấy phép và quy định pháp lý được viết theo hiểu biết hiện có, **chưa kiểm chứng lại trên web** — xem mục 7.

---

## 0. Tóm tắt nhanh

| Hạng mục | Đề xuất |
|---|---|
| Phương án chọn | **Phương án A — Next.js (SSG/ISR) + Game Server Node.js riêng dùng Colyseus + PostgreSQL + Redis**, chạy trên 1 VPS gần Việt Nam (Singapore) + CDN miễn phí |
| Lý do chính | SEO tốt (trang tĩnh), tách biệt web và realtime, mã nguồn mở toàn bộ (không khoá nhà cung cấp), chi phí giai đoạn đầu khoảng **~150–400 nghìn VNĐ/tháng**, một ngôn ngữ (TypeScript) cho cả client/server/game |
| Kiến trúc game | Mỗi game là **1 package độc lập** khai báo `manifest` + `client module` (+ `server logic` nếu multiplayer). Core (lobby, phòng, mời bạn, matchmaking, tài khoản, quảng cáo) không biết gì về luật từng game |
| MVP (thứ tự) | 1. Cờ Caro (multi) · 2. 2048 (single) · 3. Rắn Săn Mồi (single) · 4. Cờ Tướng (multi) · 5. Vẽ & Đoán (multi, party) · 6. Tiến Lên Miền Nam (multi, *để cuối / có thể dời sang v1.1*) |

---

## 1. Yêu cầu kỹ thuật rút ra từ mục tiêu sản phẩm

- **Chơi ngay**: không bắt buộc đăng nhập → tài khoản khách (guest) tự sinh, có thể nâng cấp lên tài khoản thật sau.
- **Tạo phòng / mời bạn / phòng công khai**: hệ thống phòng chung cho mọi game multiplayer, link mời dạng `/p/ABC123`, danh sách phòng công khai cập nhật realtime.
- **Đấu xếp hạng (giai đoạn sau)**: cần lưu kết quả trận ngay từ MVP để sau tính Elo/Glicko không phải làm lại.
- **SEO**: mỗi game có trang landing riêng tiếng Việt, render sẵn HTML (SSG), có schema.org `VideoGame`, sitemap.
- **Responsive / mobile-first**: phần lớn người dùng VN dùng điện thoại, mạng 4G không ổn định → bundle nhỏ, game tải lười (lazy-load), hỗ trợ kết nối lại (reconnect).
- **Quảng cáo SpeakUp Kids**: khung quảng cáo là component của core (không nằm trong code game), có tracking click/UTM để đo traffic chuyển sang SpeakUp Kids.
- **Mở rộng hàng chục game**: thêm game = thêm package, không sửa core.

---

## 2. Các phương án kiến trúc

### Phương án A — Next.js + Node.js Game Server (Colyseus) trên VPS ⭐ ĐỀ XUẤT

| Thành phần | Lựa chọn |
|---|---|
| Frontend | Next.js (App Router, React, TypeScript). Trang chủ / danh mục / landing game dùng **SSG + ISR**; trang chơi là client component tải game lười |
| Backend API | Route Handlers của Next.js hoặc 1 service Fastify nhỏ (auth khách, hồ sơ, lịch sử trận, bảng xếp hạng) |
| Realtime multiplayer | **Colyseus** (MIT, Node.js): WebSocket, quản lý Room, đồng bộ state tự động (delta), reconnect có sẵn. Server-authoritative (server kiểm tra nước đi hợp lệ → chống gian lận) |
| Matchmaking | Có sẵn trong Colyseus (`joinOrCreate`, filter theo game/mode/rating). Phòng công khai = query `matchMaker.query()`; mời bạn = `joinById` với mã phòng |
| Database | **PostgreSQL** (người dùng, kết quả trận, rating) + **Redis** (presence, danh sách phòng, scale nhiều process Colyseus sau này) |
| ORM | Prisma hoặc Drizzle |
| Hosting | 1 VPS khu vực **Singapore** (độ trễ tới VN ~30–50ms) chạy Docker Compose: Next.js, Colyseus, Postgres, Redis, Caddy (HTTPS tự động). **Cloudflare (gói miễn phí)** làm CDN/DNS cho file tĩnh và asset game |
| Chi phí ước tính | Giai đoạn MVP: VPS 2 vCPU/4GB ~6–15 USD/tháng (~150–400k VNĐ) + domain ~300k VNĐ/năm. Cloudflare free. Khi tăng tải: tách Postgres sang managed DB hoặc VPS thứ 2 (~+10–25 USD/tháng) |

**Ưu điểm**
- SEO mạnh: HTML tĩnh, Core Web Vitals tốt, dễ làm sitemap/meta tiếng Việt.
- Tách web (stateless, cache được) và game server (stateful) → mỗi phần scale riêng.
- 100% mã nguồn mở, tự host → không khoá nhà cung cấp, không bị tính phí theo request.
- Một ngôn ngữ TypeScript cho cả frontend, backend và logic game → dùng chung type/validation giữa client và server.
- Colyseus đã giải quyết sẵn phần khó: room lifecycle, state sync, reconnect, matchmaking cơ bản.

**Nhược điểm**
- Phải tự vận hành VPS (cập nhật bảo mật, backup DB, giám sát) → cần kỷ luật DevOps.
- 1 VPS = điểm lỗi đơn (single point of failure) ở giai đoạn đầu.
- Scale ngang Colyseus cần thêm Redis presence + load balancer có sticky session (khi > vài nghìn CCU).

---

### Phương án B — Serverless Edge: Cloudflare Pages + Workers + Durable Objects

| Thành phần | Lựa chọn |
|---|---|
| Frontend | Astro hoặc Next.js (adapter Cloudflare) trên **Cloudflare Pages** |
| Backend API | Cloudflare Workers (Hono framework) |
| Realtime multiplayer | **Durable Objects + WebSocket Hibernation**: mỗi phòng = 1 Durable Object (có thể dùng PartyKit/PartyServer làm lớp tiện ích) |
| Matchmaking | Tự viết: 1 Durable Object "Lobby" giữ danh sách phòng, ghép người |
| Database | Cloudflare D1 (SQLite) + KV; hoặc Postgres bên ngoài (Neon/Supabase free tier) |
| Hosting | Hoàn toàn trên Cloudflare, có PoP tại Việt Nam/gần Việt Nam |
| Chi phí ước tính | Gói Workers Paid ~5 USD/tháng là mức tối thiểu để dùng Durable Objects ổn định, cộng phí theo request/thời gian khi lớn. Rất rẻ khi ít người, khó dự đoán khi đông |

**Ưu điểm**
- Không phải quản lý server, tự scale, gần người dùng (edge).
- Mỗi phòng tách biệt tự nhiên (1 Durable Object/phòng).
- Chi phí khởi điểm rất thấp.

**Nhược điểm**
- **Khoá vào Cloudflare** (Durable Objects là API riêng, khó chuyển đi).
- Không có framework game room hoàn chỉnh như Colyseus → tự viết state sync, reconnect, matchmaking → nhiều việc hơn cho MVP.
- Môi trường Workers bị giới hạn (không phải Node.js đầy đủ, giới hạn CPU/memory) → một số thư viện game/AI cờ không chạy được.
- Chi phí khi tăng trưởng tính theo usage, khó dự báo; D1 còn hạn chế cho truy vấn phức tạp (bảng xếp hạng).
- Debug realtime phân tán khó hơn.

---

### Phương án C — Game Backend chuyên dụng: Nakama + Frontend tĩnh

| Thành phần | Lựa chọn |
|---|---|
| Frontend | Astro/Next.js xuất tĩnh, host trên Cloudflare Pages |
| Backend + realtime | **Nakama** (Heroic Labs, Apache-2.0, viết bằng Go; logic tùy biến bằng TypeScript/Lua/Go): có sẵn tài khoản, bạn bè, chat, matchmaker, leaderboard, tournament |
| Database | PostgreSQL hoặc CockroachDB (Nakama yêu cầu) |
| Hosting | VPS Docker (Nakama + Postgres) |
| Chi phí ước tính | Tương tự A (~10–20 USD/tháng), Nakama cần RAM nhiều hơn một chút |

**Ưu điểm**
- Rất nhiều tính năng "xã hội" có sẵn: bạn bè, mời, leaderboard, xếp hạng, giải đấu → phù hợp lộ trình đấu xếp hạng.
- Matchmaker mạnh (theo rating, khu vực).

**Nhược điểm**
- Hệ thống lớn, nặng, đường cong học tập cao; logic TypeScript chạy trong runtime riêng (goja), không phải Node.js đầy đủ.
- Nhiều tính năng vượt nhu cầu MVP → phức tạp không cần thiết.
- Tùy biến sâu (ví dụ guest flow, giao diện phòng công khai theo kiểu riêng) đôi khi phải "lách" quanh thiết kế của Nakama.

---

### So sánh & Quyết định

| Tiêu chí | A: Next.js + Colyseus | B: Cloudflare Edge | C: Nakama |
|---|---|---|---|
| SEO | ★★★ | ★★★ | ★★★ |
| Tốc độ ra MVP | ★★★ | ★★ | ★★ |
| Tính năng multiplayer có sẵn | ★★ (room, sync, matchmaking) | ★ (tự viết) | ★★★ (cả social, leaderboard) |
| Chi phí giai đoạn đầu | Thấp, cố định | Rất thấp, biến động | Thấp, cố định |
| Khoá nhà cung cấp | Không | Cao | Không |
| Độ phức tạp vận hành | Trung bình | Thấp | Trung bình–cao |
| Mở rộng tới hàng chục game | Tốt | Tốt | Tốt |

**Chọn Phương án A** vì: cân bằng tốt nhất giữa tốc độ làm MVP, SEO, chi phí cố định thấp và không khoá nhà cung cấp; Colyseus cho sẵn phần realtime khó nhất mà vẫn đủ nhẹ; toàn bộ là TypeScript. Bảng xếp hạng / bạn bè (thứ Nakama mạnh) có thể tự làm trên Postgres ở giai đoạn sau với khối lượng vừa phải. Nếu sau này vận hành VPS trở thành gánh nặng, phần web (Next.js) có thể chuyển sang Cloudflare/Vercel mà không đụng game server.

---

## 3. Kiến trúc Modular (phương án A)

### 3.1. Sơ đồ tổng thể

```
                 ┌───────────────────────────── Cloudflare (CDN, DNS, free) ───────────────┐
 Người chơi ──►  │  HTML tĩnh (SSG/ISR), JS bundle, asset game (ảnh, âm thanh)              │
 (mobile/PC)     └───────────────┬──────────────────────────────────┬──────────────────────┘
                                 │ HTTPS                            │ WSS
                     ┌───────────▼───────────┐          ┌───────────▼────────────┐
                     │  apps/web (Next.js)   │          │ apps/game-server        │
                     │  - trang chủ/danh mục │          │ (Colyseus, Node.js)     │
                     │  - landing game (SEO) │          │ - LobbyRoom (phòng cộng │
                     │  - trang chơi         │          │   khai, presence)       │
                     │  - API: auth khách,   │          │ - GameRoom<T> chung     │
                     │    hồ sơ, lịch sử,    │          │   nạp logic từ package  │
                     │    ads tracking       │          │   game tương ứng        │
                     └───────────┬───────────┘          └───────────┬────────────┘
                                 │                                  │
                          ┌──────▼──────────────────────────────────▼──────┐
                          │  PostgreSQL (users, matches, ratings, ads)     │
                          │  Redis (presence, room list, rate limit)       │
                          └────────────────────────────────────────────────┘
```

### 3.2. Cấu trúc monorepo đề xuất (pnpm workspaces + Turborepo)

```
webgame-portal/
├─ apps/
│  ├─ web/                 # Next.js: trang, SEO, UI core, API nhẹ
│  └─ game-server/         # Colyseus: LobbyRoom + GameRoom chung
├─ packages/
│  ├─ game-sdk/            # Interface chung cho mọi game (types + helper)
│  ├─ ui/                  # Design system dùng chung (theo spec của Gehihi)
│  ├─ ads/                 # Component khung quảng cáo + tracking (SpeakUp Kids)
│  ├─ db/                  # Schema Prisma/Drizzle, migration
│  └─ config/              # eslint, tsconfig, tailwind preset
└─ games/
   ├─ caro/                # mỗi game 1 package độc lập
   │  ├─ manifest.ts
   │  ├─ client/           # render (Canvas/DOM/Phaser), lazy-loaded
   │  ├─ logic/            # luật thuần (pure functions) — dùng chung client & server
   │  └─ assets/
   ├─ 2048/
   ├─ snake/
   └─ ...
```

### 3.3. Hợp đồng chung (Game SDK)

**Manifest** — core đọc để tự sinh trang danh mục, landing SEO, cấu hình phòng:

```ts
interface GameManifest {
  id: string;                 // "caro"
  slug: string;               // "co-caro" -> /game/co-caro
  title: string;              // "Cờ Caro"
  description: string;        // mô tả SEO tiếng Việt
  categories: string[];       // ["co", "tri-tue", "2-nguoi"]
  modes: ("single" | "multi")[];
  players: { min: number; max: number };
  orientation: "any" | "portrait" | "landscape";
  thumbnail: string;
  license: { name: string; source?: string };   // bắt buộc khai báo license
  loadClient: () => Promise<GameClientModule>;  // lazy import
}
```

**Client module** — cách trang chơi nhúng mọi game giống nhau:

```ts
interface GameClientModule {
  mount(el: HTMLElement, ctx: GameContext): GameInstance;
}
interface GameContext {
  mode: "single" | "multi";
  locale: "vi";
  player: { id: string; name: string };
  room?: RoomConnection;            // chỉ có khi multi — do core cung cấp
  sdk: {                            // core cung cấp, game chỉ gọi
    reportScore(score: number): void;
    gameOver(result: unknown): void;
    requestAdBreak(): Promise<void>; // core quyết định có hiện quảng cáo không
    sound: { muted: boolean };
  };
}
interface GameInstance { pause(): void; resume(): void; destroy(): void; }
```

**Server logic (game turn-based)** — dạng reducer thuần, không phụ thuộc Colyseus:

```ts
interface GameLogic<State, Move> {
  setup(players: PlayerInfo[], options?: unknown): State;
  validateMove(state: State, playerId: string, move: Move): boolean;
  applyMove(state: State, playerId: string, move: Move): State;
  currentPlayer?(state: State): string;
  isGameOver(state: State): null | { winners: string[]; draw?: boolean };
  viewFor?(state: State, playerId: string): unknown; // ẩn bài của người khác (Tiến Lên)
}
```

`apps/game-server` có **1 lớp `GameRoom` chung** nhận `GameLogic` theo `gameId`: lo phần ghế ngồi, sẵn sàng/bắt đầu, lượt, đồng hồ, reconnect, người xem, lưu kết quả trận. Game realtime (ví dụ Vẽ & Đoán) có thể thêm hook `onTick`/`onMessage` riêng nhưng vẫn qua cùng `GameRoom`.

### 3.4. Nguyên tắc tách biệt

1. **Core không import code game trực tiếp** — chỉ qua registry đọc `manifest`. Thêm game = thêm thư mục `games/<id>` + đăng ký 1 dòng trong registry.
2. **Phòng / matchmaking / mời bạn / phòng công khai là dịch vụ của core**, hoàn toàn không biết luật game.
3. **Logic luật là pure functions** dùng chung client (dự đoán, hiển thị nước đi hợp lệ) và server (kiểm tra thật) → test unit dễ, chống gian lận.
4. **Game bên thứ ba / open-source khó chỉnh sửa** được nhúng qua **iframe sandbox** + `postMessage` adapter cài đặt cùng `GameContext` → cô lập CSS/JS, cô lập license.
5. **Quảng cáo không nằm trong game**: game chỉ gọi `requestAdBreak()` ở điểm nghỉ tự nhiên; core quyết định tần suất và vị trí (theo spec UX của Gehihi).
6. **Lưu kết quả mọi trận ngay từ MVP** (bảng `matches`, `match_players`) → sau này bật đấu xếp hạng chỉ là thêm job tính rating.
7. **Asset game** đóng gói riêng, cache CDN dài hạn với hash trong tên file.

---

## 4. Đánh giá dùng game mã nguồn mở

### 4.1. Nguyên tắc về license

| License | Dùng được không | Ghi chú |
|---|---|---|
| **MIT, BSD, Apache-2.0, ISC, Zlib** | ✅ Ưu tiên | Giữ thông báo bản quyền/license; Apache-2.0 cần ghi chú thay đổi (NOTICE) |
| **CC0 / Public domain** (thường cho asset) | ✅ | Không ràng buộc |
| **CC-BY (asset)** | ✅ có điều kiện | Phải ghi công tác giả (trang "Giấy phép & Ghi công") |
| **GPL-2/3** | ⚠️ Cẩn trọng | JS gửi xuống trình duyệt được coi là phân phối → phải công khai mã nguồn phần kết hợp. Nếu dùng: **cô lập trong iframe làm tác phẩm riêng**, công khai source của game đó; không trộn vào core |
| **AGPL** | ❌ Tránh cho server | Chạy trên server cho người dùng truy cập cũng kích hoạt nghĩa vụ công khai mã |
| **CC-BY-NC / "free for non-commercial"** | ❌ Tránh | Portal có quảng cáo = thương mại |
| Không có license | ❌ | Mặc định là giữ mọi bản quyền |

Quy trình: mỗi game/asset phải có trường `license` trong manifest; thêm bước kiểm tra license tự động trong CI (ví dụ `license-checker`) cho dependency npm.

### 4.2. Hướng cụ thể (license cần kiểm tra lại tại thời điểm dùng)

| Nguồn | License (theo hiểu biết, cần xác minh) | Dùng cho |
|---|---|---|
| **Colyseus** | MIT | Game server realtime |
| **Phaser** (game engine 2D) | MIT | Engine render cho game hành động (Rắn, game arcade sau này) |
| **boardgame.io** | MIT | Tham khảo mô hình reducer turn-based (có thể dùng thay một phần GameRoom nếu thấy hợp) |
| **2048** (gabrielecirulli/2048) | MIT | Game 2048 — viết lại UI theo design system, giữ ghi công |
| **chess.js** | BSD-2 | Mẫu tham khảo nếu sau thêm Cờ Vua |
| **Thư viện luật Cờ Tướng** (nhiều repo xiangqi JS trên GitHub) | Không thống nhất — nhiều repo GPL | Khả năng cao **tự viết luật** (độ phức tạp vừa phải) để tránh GPL |
| **Engine AI cờ (Stockfish/Fairy-Stockfish WASM)** | GPL-3 | Chỉ dùng nếu chấp nhận nghĩa vụ GPL, chạy trong Web Worker/iframe tách biệt; MVP dùng AI đơn giản tự viết |
| **Hextris, các game HTML5 nhỏ trên GitHub** | Thường GPL-3 | Không nên đưa vào MVP |
| **Asset: Kenney.nl** | CC0 | Sprite, icon, âm thanh miễn phí, an toàn |
| **Asset: OpenGameArt.org** | Hỗn hợp (CC0/CC-BY/GPL) | Lọc chỉ CC0/CC-BY |
| **Bộ bài (card sprites)** | Nhiều bộ CC0 trên OpenGameArt/Kenney | Tiến Lên |

**Kết luận**: Game MVP đều có luật đơn giản → **tự viết logic là nhanh và sạch license nhất**; open-source dùng chủ yếu ở tầng **engine/framework (MIT)** và **asset (CC0)**. Chỉ "mượn" nguyên game với 2048 (MIT). Tránh GPL trong MVP.

---

## 5. Danh sách game MVP

| # | Game | Loại | Độ khó | Lý do chọn |
|---|---|---|---|---|
| 1 | **Cờ Caro** (Gomoku, bàn 15×15, 5 quân thẳng hàng) | Multiplayer 2 người (+ chơi với máy đơn giản) | **Thấp** | Rất phổ biến ở VN; luật đơn giản → **game đầu tiên để kiểm chứng toàn bộ hệ thống phòng**: tạo phòng, link mời, phòng công khai, lượt, đồng hồ, reconnect, lưu kết quả |
| 2 | **2048** | Single-player | **Thấp** | Có bản MIT; kiểm chứng luồng single-player: "chơi ngay", lưu điểm cao, khung quảng cáo, SEO landing |
| 3 | **Rắn Săn Mồi** | Single-player | **Thấp** | Game hành động trên Canvas, kiểm chứng điều khiển cảm ứng mobile (vuốt) và hiệu năng 60fps trên máy yếu |
| 4 | **Cờ Tướng** | Multiplayer 2 người | **Trung bình** | Đối tượng người chơi lớn ở VN, tạo tính gắn bó; luật phức tạp hơn (chiếu, bí, lộ mặt tướng) nhưng tái sử dụng 100% hệ thống phòng của Cờ Caro |
| 5 | **Vẽ & Đoán** (một người vẽ, người khác đoán từ tiếng Việt) | Multiplayer party 3–8 người | **Trung bình–Cao** | Game "rủ bạn bè" mạnh nhất → thúc đẩy mời bạn, lan truyền; kiểm chứng phòng nhiều người, realtime liên tục (nét vẽ), chat. Cần lọc từ ngữ phù hợp (có thể có trẻ em) |
| 6 | **Tiến Lên Miền Nam** | Multiplayer 4 người | **Cao** | Game bài quốc dân, kéo traffic tốt; nhưng cần ẩn bài từng người (`viewFor`), xử lý bỏ lượt/thoát giữa chừng. **Rủi ro pháp lý / hình ảnh** (gần với cờ bạc, trái hướng thương hiệu học tiếng Anh cho trẻ) → **đề xuất dời sang v1.1**, và tuyệt đối không có tiền ảo quy đổi |

**Thứ tự triển khai đề xuất**

1. Nền móng: monorepo, Game SDK, layout core, khung quảng cáo, tài khoản khách.
2. **2048** (song song với nền móng — luồng single-player đơn giản nhất, giúp chốt Game SDK client).
3. **Cờ Caro** → xây LobbyRoom + GameRoom chung, phòng công khai, mời bạn.
4. **Rắn Săn Mồi**.
5. **Cờ Tướng**.
6. **Vẽ & Đoán**.
7. (v1.1) Tiến Lên Miền Nam, bảng xếp hạng Elo.

MVP tối thiểu nếu cần cắt: **Caro + 2048 + Rắn + Cờ Tướng** (2 single + 2 multi).

---

## 6. Chi phí, hiệu năng & SEO cho thị trường Việt Nam

### 6.1. Chi phí vận hành thấp
- 1 VPS Singapore (Docker Compose) cho MVP; Cloudflare free cho CDN, DNS, chống DDoS cơ bản, SSL.
- Trang tĩnh được CDN phục vụ → VPS chỉ gánh API và WebSocket.
- Colyseus nhẹ: 1 process Node phục vụ được hàng trăm–nghìn phòng turn-based (game cờ gửi rất ít dữ liệu).
- Backup Postgres hằng ngày ra object storage giá rẻ hoặc free tier (ví dụ Cloudflare R2 free tier) — **chưa đăng ký dịch vụ nào**.
- Giám sát miễn phí: Uptime Kuma tự host, log bằng Docker + logrotate; lỗi client qua Sentry free tier (tùy chọn, cần duyệt).
- Analytics: Umami/Plausible tự host hoặc GA4 (miễn phí) — đo traffic chuyển sang SpeakUp Kids qua UTM.

### 6.2. Hiệu năng (ưu tiên mạng 4G và điện thoại tầm trung)
- Mục tiêu: LCP < 2.5s trên 4G, JS ban đầu trang chủ < 150KB gzip, CLS < 0.1.
- Code game **tải lười** chỉ khi bấm chơi (`manifest.loadClient()`); trang chủ không tải engine game.
- Ảnh thumbnail WebP/AVIF qua `next/image` hoặc xuất sẵn; font tiếng Việt subset (Be Vietnam Pro / Inter có dấu), `font-display: swap`.
- Phaser chỉ tải cho game cần (game cờ dùng DOM/Canvas thuần, không cần engine).
- WebSocket: gửi delta (Colyseus làm sẵn), heartbeat + reconnect trong 30–60s khi mất mạng ngắn.
- PWA (service worker) cache asset game → chơi lại nhanh, single-player chơi được khi mạng chập chờn.
- Khung quảng cáo đặt kích thước cố định trước để không gây giật layout (CLS).

### 6.3. SEO
- **SSG/ISR** cho: trang chủ, trang danh mục (`/the-loai/co`, `/the-loai/2-nguoi`…), landing từng game (`/game/co-caro`) có mô tả, hướng dẫn luật, FAQ bằng tiếng Việt.
- URL tiếng Việt không dấu, gạch nối; `<html lang="vi">`, meta/OG image cho từng game (chia sẻ Facebook/Zalo đẹp).
- Schema.org `VideoGame`, `BreadcrumbList`, `FAQPage`; `sitemap.xml` tự sinh từ registry game; `robots.txt`.
- Trang phòng (`/p/<mã>`) đặt `noindex` (nội dung tạm thời).
- Từ khóa mục tiêu kiểu "chơi cờ caro online", "cờ tướng online với bạn bè", "game 2 người" — nội dung hướng dẫn chất lượng giúp xếp hạng tốt hơn trang chỉ có iframe.

### 6.4. Lưu ý quảng cáo SpeakUp Kids & đối tượng trẻ em
- Khung quảng cáo là "house ad" (quảng cáo nội bộ) → không cần mạng quảng cáo bên thứ ba, không cookie theo dõi bên thứ ba.
- Nếu có người dùng nhỏ tuổi: hạn chế thu thập dữ liệu cá nhân (tài khoản khách không cần email), chat có lọc từ ngữ / chỉ dùng câu soạn sẵn ở MVP.

---

## 7. Giả định kỹ thuật chưa kiểm chứng

| # | Giả định | Ảnh hưởng nếu sai | Cách kiểm chứng |
|---|---|---|---|
| 1 | Giai đoạn đầu **< 500 người chơi đồng thời (CCU)**, < 50.000 lượt truy cập/ngày | Nếu lớn hơn nhiều cần scale Colyseus nhiều process + Redis + load balancer sớm hơn | Chủ dự án cung cấp kế hoạch marketing / traffic từ SpeakUp Kids; load test bằng k6 trước khi ra mắt |
| 2 | Ngân sách hạ tầng **~10–25 USD/tháng** (≈ 250–650k VNĐ) cho MVP chấp nhận được | Nếu = 0 đồng thì phải dùng free tier (giới hạn, kém ổn định cho WebSocket) | Chủ dự án xác nhận ngân sách |
| 3 | Giá VPS/Cloudflare như nêu ở mục 2 | Chênh lệch chi phí | Kiểm tra giá thực tế trước khi đăng ký (cần duyệt trước khi mua) |
| 4 | Độ trễ Singapore → VN ~30–50ms đủ tốt cho game cờ/party | Game hành động realtime multiplayer (sau này) có thể cần server trong VN | Đo ping thực tế từ Viettel/VNPT/FPT |
| 5 | License các thư viện/game ở mục 4 đúng như ghi | Rủi ro pháp lý bản quyền | Kiểm tra file LICENSE từng repo tại thời điểm dùng |
| 6 | **Pháp lý trò chơi điện tử tại VN**: game multiplayer có tương tác qua server có thể thuộc nhóm phải xin giấy phép (theo quy định về trò chơi điện tử trên mạng, Nghị định 147/2024/NĐ-CP thay thế NĐ 72/2013 — *chưa xác minh chi tiết*) | Có thể cần giấy phép/phê duyệt nội dung trước khi mở multiplayer công khai; game bài có rủi ro cao hơn | **Cần tư vấn pháp lý** trước khi ra mắt công khai — đây là rủi ro lớn nhất ngoài kỹ thuật |
| 7 | Bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP), đặc biệt dữ liệu trẻ em | Phải có chính sách quyền riêng tư, đồng ý của phụ huynh nếu thu thập dữ liệu trẻ | Tư vấn pháp lý; MVP tối thiểu hoá dữ liệu (guest, không email) |
| 8 | Đối tượng chính dùng điện thoại Android tầm trung, trình duyệt Chrome | Ảnh hưởng mục tiêu hiệu năng, kiểm thử | Analytics sau khi ra mắt; test trên thiết bị thật |
| 9 | Đăng nhập: MVP chỉ cần tài khoản khách + (tùy chọn) đăng nhập Google; Zalo/Facebook để sau | Nếu bắt buộc Zalo login sẽ thêm thời gian | Chủ dự án xác nhận |
| 10 | Quảng cáo SpeakUp Kids là banner/link nội bộ (house ad), chưa dùng Google AdSense | Nếu dùng AdSense: thêm yêu cầu chính sách, cookie consent, ảnh hưởng hiệu năng | Chủ dự án xác nhận mô hình quảng cáo |
| 11 | Team phát triển chủ yếu là bot AI + review, có quyền dùng Docker trên máy để dev local | Ảnh hưởng quy trình dev/test | Xác nhận khi bắt đầu giai đoạn code |
| 12 | Có tên miền riêng (chưa mua) | SEO cần domain ổn định sớm | Chủ dự án chọn và mua domain |

---

## 8. Việc cần chủ dự án quyết định trước khi code

1. Duyệt Phương án A (hoặc chọn B/C).
2. Duyệt danh sách MVP và việc dời Tiến Lên sang v1.1.
3. Ngân sách hạ tầng hằng tháng và kế hoạch mua domain.
4. Kế hoạch tư vấn pháp lý về giấy phép trò chơi điện tử & dữ liệu trẻ em.
5. Mô hình quảng cáo SpeakUp Kids (house ad hay mạng quảng cáo).
