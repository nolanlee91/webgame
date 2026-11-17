# Nối Từ — lõi + lớp phiên chơi (bước 1)

Chưa có giao diện. Kiến trúc: `docs/noi-tu-architecture.md`.

- `core/` — luật thuần (chuẩn hóa tiếng Việt, từ điển, validate/reduce, AI). Dùng chung trình duyệt + server.
- `session/referee.js` — trọng tài (nguồn sự thật), `session/client.js` — MatchSession cho UI,
  `session/local.js` — chơi offline (trọng tài cùng trang), `session/scheduler.js` — đồng hồ tiêm vào.
- `data/words-src.txt` → `npm run build:dict` → `data/words.json` (in hash + dung lượng gzip thật).
- `npm test` — 43 test: hợp đồng (trọng tài ở tiến trình riêng + cùng tiến trình), lõi, LocalSession.
