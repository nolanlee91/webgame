// Phục vụ file tĩnh cho server.js (không gói ngoài): nén gzip / brotli theo Accept-Encoding (chỉ chữ: html/css/js/json/svg/txt/xml),
// giữ bản nén trong RAM (có giới hạn, khoá theo đường dẫn + mtime + cỡ + kiểu nén) để không nén lại mỗi request,
// ETag mạnh + Last-Modified ⇒ trả 304 cho If-None-Match / If-Modified-Since, Range (206) cho file nhị phân (âm thanh/ảnh),
// Cache-Control: HTML "no-cache"; URL có ?v= ⇒ một năm + immutable; còn lại 5 phút.
"use strict";
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const COMPRESSIBLE = new Set([".html", ".css", ".js", ".mjs", ".json", ".svg", ".txt", ".xml", ".md"]);
const MIN_COMPRESS = 256; // byte — nhỏ hơn thì nén không lợi
const MAX_COMPRESS = 16 * 1024 * 1024; // file chữ lớn hơn thì gửi thẳng
const CACHE_LIMIT = 64 * 1024 * 1024; // tổng byte bản nén giữ trong RAM
const IMMUTABLE = "public, max-age=31536000, immutable";

// Tài liệu nội bộ nằm lẫn trong prototype/ (bàn giao asset, prompt tạo ảnh, ảnh xem thử, README…) — không phục vụ công khai (PARTY2-07).
// asset-manifest.json: chỉ phục vụ những bản game thật sự fetch (đã grep code game; server-static.test.mjs dò lại mỗi lần chạy
// test, thêm game mới fetch manifest thì thêm đường dẫn vào đây).
const SERVED_MANIFESTS = new Set([
  "games/co-ty-phu/assets/asset-manifest.json",
  "games/o-an-quan/data/asset-manifest.json",
  "games/quan-com-tam/data/asset-manifest.json",
  "games/tham-tu-hem/data/asset-manifest.json",
  "games/tiem-banh-mi/data/asset-manifest.json",
  "games/tiem-tra-sua/data/asset-manifest.json",
]);
/** rel: đường dẫn trong prototype/ (dấu "/"). true ⇒ file nội bộ, trả 404. */
function isInternal(rel) {
  rel = String(rel).replace(/\\/g, "/").replace(/^\/+/, "");
  const name = rel.slice(rel.lastIndexOf("/") + 1);
  if (/\.md$/i.test(name)) return true;                          // README.md, HANDOFF.md, DESIGN-2.0.md, report.md…
  if (/^HANDOFF/.test(name)) return true;                          // HANDOFF* (chữ hoa — "handoff.mp3" là tiếng trong game)
  if (/^generation-prompts.*\.json$/i.test(name)) return true;    // prompt tạo ảnh AI
  if (/-preview.*\.png$/i.test(name)) return true;                 // ảnh xem thử khi duyệt asset
  if (name.toLowerCase() === "asset-manifest.json") return !SERVED_MANIFESTS.has(rel);
  return false;
}

/** Chọn kiểu nén theo Accept-Encoding (có q=). Ưu tiên br rồi gzip; q=0 nghĩa là cấm. */
function pickEncoding(header) {
  if (!header) return null;
  const q = {};
  for (const part of String(header).split(",")) {
    const [name, ...params] = part.trim().toLowerCase().split(";");
    if (!name) continue;
    let v = 1;
    for (const p of params) { const m = /^\s*q=([0-9.]+)\s*$/.exec(p); if (m) v = Number(m[1]); }
    q[name] = Number.isFinite(v) ? v : 0;
  }
  const star = q["*"];
  const ok = (n) => (n in q ? q[n] > 0 : star > 0);
  if (ok("br")) return "br";
  if (ok("gzip")) return "gzip";
  return null;
}

function createStatic({ types, root = null }) {
  const cache = new Map(); // key → Buffer (thứ tự chèn = LRU)
  const pending = new Map(); // key → Promise<Buffer> (nhiều request cùng lúc chỉ nén một lần)
  let cacheBytes = 0;

  function remember(key, buf) {
    if (buf.length > CACHE_LIMIT / 4) return;
    cache.set(key, buf); cacheBytes += buf.length;
    for (const [k, b] of cache) { if (cacheBytes <= CACHE_LIMIT) break; cache.delete(k); cacheBytes -= b.length; }
  }
  function compressed(file, st, enc) {
    const key = `${file}|${st.mtimeMs}|${st.size}|${enc}`;
    const hit = cache.get(key);
    if (hit) { cache.delete(key); cache.set(key, hit); return Promise.resolve(hit); }
    if (pending.has(key)) return pending.get(key);
    const p = fs.promises.readFile(file).then((raw) => new Promise((ok, bad) => {
      const done = (err, out) => (err ? bad(err) : ok(out));
      if (enc === "br") {
        zlib.brotliCompress(raw, { params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: raw.length > 512 * 1024 ? 9 : 11,
          [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
          [zlib.constants.BROTLI_PARAM_SIZE_HINT]: raw.length } }, done);
      } else zlib.gzip(raw, { level: 9 }, done);
    })).then((out) => { remember(key, out); return out; }).finally(() => pending.delete(key));
    pending.set(key, p);
    return p;
  }

  function cacheControl(type, req) {
    if (type.startsWith("text/html")) return "no-cache";
    const q = req.url.indexOf("?");
    if (q !== -1 && new URLSearchParams(req.url.slice(q + 1)).has("v")) return IMMUTABLE;
    return "public, max-age=300";
  }

  function notModified(req, base, st) {
    const inm = req.headers["if-none-match"];
    if (inm) {
      if (inm.trim() === "*") return true;
      return inm.split(",").some((t) => {
        const tag = t.trim().replace(/^W\//, "").replace(/^"|"$/g, "");
        return tag === base || tag === base + "-br" || tag === base + "-gz";
      });
    }
    const ims = req.headers["if-modified-since"];
    if (ims) { const t = Date.parse(ims); if (!Number.isNaN(t)) return Math.floor(st.mtimeMs / 1000) * 1000 <= t; }
    return false;
  }

  /** Range đơn "bytes=a-b" ⇒ {start,end}; không hợp lệ ⇒ "bad"; không có / If-Range lệch ⇒ null (gửi đủ). */
  function parseRange(req, size, etag, lastMod) {
    const h = req.headers.range;
    if (!h) return null;
    const ifRange = req.headers["if-range"];
    if (ifRange && ifRange !== etag && ifRange !== lastMod) return null;
    const m = /^bytes=(\d*)-(\d*)$/.exec(h.trim());
    if (!m || (m[1] === "" && m[2] === "")) return null; // nhiều đoạn / dạng lạ ⇒ gửi đủ
    let start, end;
    if (m[1] === "") { const n = Number(m[2]); if (!n) return "bad"; start = Math.max(0, size - n); end = size - 1; }
    else { start = Number(m[1]); end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1); }
    if (start >= size || start > end) return "bad";
    return { start, end };
  }

  function stream(file, res, opts) {
    fs.createReadStream(file, opts).on("error", () => res.destroy()).pipe(res);
  }

  function serve(file, req, res, st) {
    if (root && isInternal(path.relative(root, file))) { // tài liệu nội bộ ⇒ như không có file
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
      return res.end(req.method === "HEAD" ? undefined : "Not Found");
    }
    const ext = path.extname(file).toLowerCase();
    const type = types[ext] || "application/octet-stream";
    const base = `${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}`;
    const lastMod = st.mtime.toUTCString();
    const canZip = COMPRESSIBLE.has(ext) && st.size >= MIN_COMPRESS && st.size <= MAX_COMPRESS;
    const head = { "Content-Type": type, "Cache-Control": cacheControl(type, req), "Last-Modified": lastMod };
    if (COMPRESSIBLE.has(ext)) head.Vary = "Accept-Encoding";
    const enc = canZip ? pickEncoding(req.headers["accept-encoding"]) : null;
    const etag = `"${base}${enc === "br" ? "-br" : enc === "gzip" ? "-gz" : ""}"`;
    head.ETag = etag;

    if (notModified(req, base, st)) { res.writeHead(304, head); return res.end(); }

    if (enc) {
      compressed(file, st, enc).then((buf) => {
        res.writeHead(200, { ...head, "Content-Encoding": enc, "Content-Length": buf.length });
        res.end(req.method === "HEAD" ? undefined : buf);
      }, () => { // nén lỗi ⇒ gửi bản gốc
        if (res.headersSent) return res.destroy();
        res.writeHead(200, { ...head, ETag: `"${base}"`, "Content-Length": st.size });
        if (req.method === "HEAD") return res.end();
        stream(file, res);
      });
      return;
    }

    if (!COMPRESSIBLE.has(ext)) {
      head["Accept-Ranges"] = "bytes";
      const r = parseRange(req, st.size, etag, lastMod);
      if (r === "bad") { res.writeHead(416, { ...head, "Content-Range": `bytes */${st.size}`, "Content-Length": 0 }); return res.end(); }
      if (r) {
        res.writeHead(206, { ...head, "Content-Range": `bytes ${r.start}-${r.end}/${st.size}`, "Content-Length": r.end - r.start + 1 });
        if (req.method === "HEAD") return res.end();
        return stream(file, res, { start: r.start, end: r.end });
      }
    }
    res.writeHead(200, { ...head, "Content-Length": st.size });
    if (req.method === "HEAD") return res.end();
    stream(file, res);
  }

  return { serve, stats: () => ({ entries: cache.size, bytes: cacheBytes }) };
}

module.exports = { createStatic, pickEncoding, isInternal, SERVED_MANIFESTS };
