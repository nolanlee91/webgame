// Server tĩnh tối thiểu cho Railway (không cần gói ngoài).
// Phục vụ thư mục prototype/ — trang chủ ở /homepage/, game ở /games/<id>/ (giữ nguyên link tương đối "../games/...").
// "/" chuyển sang /homepage/. Railway cấp cổng qua biến môi trường PORT.
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "prototype");
const PORT = Number(process.env.PORT) || 8080;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
  ".ico": "image/x-icon", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav", ".mp4": "video/mp4",
  ".woff2": "font/woff2", ".woff": "font/woff", ".txt": "text/plain; charset=utf-8", ".md": "text/plain; charset=utf-8",
};

function send(res, code, body, headers = {}) {
  res.writeHead(code, { "Content-Type": "text/plain; charset=utf-8", ...headers });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Method Not Allowed", { Allow: "GET, HEAD" });
  let urlPath;
  try { urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname); } catch { return send(res, 400, "Bad Request"); }
  if (urlPath === "/") return send(res, 302, "", { Location: "/homepage/" });
  if (urlPath === "/healthz") return send(res, 200, "ok");

  const file = path.normalize(path.join(ROOT, urlPath));
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return send(res, 403, "Forbidden"); // chặn ../ ra ngoài prototype/

  fs.stat(file, (err, st) => {
    if (err) return send(res, 404, "Not Found");
    if (st.isDirectory()) {
      // Thư mục phải có "/" cuối để link tương đối (styles.css, ../games/...) đúng.
      if (!urlPath.endsWith("/")) {
        const q = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
        return send(res, 301, "", { Location: encodeURI(urlPath) + "/" + q });
      }
      return serveFile(path.join(file, "index.html"), req, res);
    }
    serveFile(file, req, res, st);
  });
});

function serveFile(file, req, res, st) {
  const go = (s) => {
    const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
    const cache = type.startsWith("text/html") ? "no-cache" : "public, max-age=300";
    res.writeHead(200, { "Content-Type": type, "Content-Length": s.size, "Cache-Control": cache });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file).on("error", () => res.destroy()).pipe(res);
  };
  if (st) return go(st);
  fs.stat(file, (err, s) => (err || !s.isFile() ? send(res, 404, "Not Found") : go(s)));
}

// Máy chủ game online (WebSocket). Mặc định BẬT — không cần đặt biến môi trường nào trên Railway.
// Muốn tắt riêng một game: đặt MASOI_ONLINE=0 hoặc NOITU_ONLINE=0.
const on = (v, def) => (v === "0" ? false : v === "1" ? true : def);
if (on(process.env.MASOI_ONLINE, true)) {
  const speed = Number(process.env.MASOI_SPEED) || 1; // 0.2 = nhanh gấp 5 để thử
  const { DEFAULT_TIMINGS } = require("./games-server/ma-soi/room");
  const timings = Object.fromEntries(Object.entries(DEFAULT_TIMINGS).map(([k, v]) => [k, Math.round(v * speed)]));
  require("./games-server/ma-soi/host").createMaSoiHost(server, { timings });
  console.log(`Ma Sói online: đường /ws/ma-soi (thời gian mỗi pha x${speed})`);
}
// Nối Từ online 1v1 — tạm mặc định TẮT cho tới khi Codex review xong phần chống gian lận (bật thử: NOITU_ONLINE=1).
if (on(process.env.NOITU_ONLINE, false)) {
  require("./games-server/noi-tu/host").createNoiTuHost(server);
  console.log("Nối Từ online: đường /ws/noi-tu");
}

// Cờ Cá Ngựa online (phòng 2–4 người qua WebSocket, máy chủ gieo xúc xắc + xác thực lượt) — CHỈ bật khi COCANGUA_ONLINE=1.
if (process.env.COCANGUA_ONLINE === "1") {
  require("./games-server/co-ca-ngua/host").createCoCaNguaHost(server);
  console.log("Cờ Cá Ngựa online: đường /ws/co-ca-ngua");
}

if (require.main === module) server.listen(PORT, () => console.log(`Webgame Portal: http://localhost:${PORT}/ (phục vụ ${ROOT})`));
module.exports = server;
