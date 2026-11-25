// Test phục vụ file tĩnh của server.js thật (cổng ngẫu nhiên): gzip/br giải nén ra đúng file gốc, ETag/304, Last-Modified,
// Cache-Control (HTML no-cache, ?v= immutable, còn lại 5 phút), ảnh/âm thanh không nén + Range 206, HEAD, /healthz, /api/lobby.
// Chạy: node --test server-static.test.mjs
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import zlib from "node:zlib";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { pickEncoding } = require("./server-static.js");
let server, port;

before(async () => {
  server = require("./server.js");
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  port = server.address().port;
});
after(() => new Promise((r) => { server.closeAllConnections?.(); server.close(r); }));

function get(path, headers = {}, method = "GET") {
  return new Promise((ok, bad) => {
    const req = http.request({ host: "127.0.0.1", port, path, method, headers, agent: false }, (res) => {
      const chunks = []; res.on("data", (c) => chunks.push(c)); res.on("end", () => ok({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.on("error", bad); req.end();
  });
}
const file = (p) => readFileSync(join(ROOT, "prototype", p));

test("pickEncoding: ưu tiên br, tôn trọng q=0 và *", () => {
  assert.equal(pickEncoding("gzip, deflate, br"), "br");
  assert.equal(pickEncoding("gzip, br;q=0"), "gzip");
  assert.equal(pickEncoding("identity"), null);
  assert.equal(pickEncoding(""), null);
  assert.equal(pickEncoding("*"), "br");
  assert.equal(pickEncoding("*;q=0, gzip"), "gzip");
  assert.equal(pickEncoding("GZIP;q=0.5"), "gzip");
});

test("JS: br và gzip giải nén ra đúng file gốc, Content-Length khớp, Vary", async () => {
  const raw = file("homepage/app.js");
  const br = await get("/homepage/app.js", { "Accept-Encoding": "gzip, deflate, br" });
  assert.equal(br.status, 200);
  assert.equal(br.headers["content-encoding"], "br");
  assert.equal(Number(br.headers["content-length"]), br.body.length);
  assert.ok(br.body.length < raw.length);
  assert.deepEqual(zlib.brotliDecompressSync(br.body), raw);
  assert.match(br.headers.vary, /Accept-Encoding/);
  assert.match(br.headers["content-type"], /javascript/);

  const gz = await get("/homepage/app.js", { "Accept-Encoding": "gzip" });
  assert.equal(gz.headers["content-encoding"], "gzip");
  assert.equal(Number(gz.headers["content-length"]), gz.body.length);
  assert.deepEqual(zlib.gunzipSync(gz.body), raw);
  assert.notEqual(gz.headers.etag, br.headers.etag, "mỗi kiểu nén một ETag riêng");

  const plain = await get("/homepage/app.js");
  assert.equal(plain.headers["content-encoding"], undefined);
  assert.deepEqual(plain.body, raw);
  assert.equal(Number(plain.headers["content-length"]), raw.length);
});

test("Bản nén được giữ trong RAM: lần hai trả cùng byte", async () => {
  const a = await get("/homepage/styles.css", { "Accept-Encoding": "br" });
  const b = await get("/homepage/styles.css", { "Accept-Encoding": "br" });
  assert.deepEqual(a.body, b.body);
  assert.deepEqual(zlib.brotliDecompressSync(b.body), file("homepage/styles.css"));
});

test("HTML: no-cache, nén, ETag + Last-Modified, 304 khi khớp", async () => {
  const r = await get("/homepage/", { "Accept-Encoding": "br" });
  assert.equal(r.status, 200);
  assert.equal(r.headers["cache-control"], "no-cache");
  assert.equal(r.headers["content-encoding"], "br");
  assert.match(r.headers.etag, /^"[0-9a-f]+-[0-9a-f]+-br"$/);
  assert.ok(r.headers["last-modified"]);
  assert.deepEqual(zlib.brotliDecompressSync(r.body), file("homepage/index.html"));

  const nm = await get("/homepage/", { "Accept-Encoding": "br", "If-None-Match": r.headers.etag });
  assert.equal(nm.status, 304);
  assert.equal(nm.body.length, 0);
  assert.equal(nm.headers.etag, r.headers.etag);
  assert.equal(nm.headers["cache-control"], "no-cache");

  // ETag của bản gzip vẫn được nhận (cùng nội dung gốc) — vd proxy đổi Accept-Encoding
  const cross = await get("/homepage/", { "Accept-Encoding": "gzip", "If-None-Match": `W/${r.headers.etag}` });
  assert.equal(cross.status, 304);

  const ims = await get("/homepage/", { "If-Modified-Since": r.headers["last-modified"] });
  assert.equal(ims.status, 304);
  const old = await get("/homepage/", { "If-Modified-Since": "Thu, 01 Jan 2015 00:00:00 GMT" });
  assert.equal(old.status, 200);
  const miss = await get("/homepage/", { "If-None-Match": '"khac"' });
  assert.equal(miss.status, 200);
});

test("Cache-Control: ?v= ⇒ immutable một năm; không có ⇒ 5 phút; HTML có ?v= vẫn no-cache", async () => {
  assert.equal((await get("/homepage/styles.css?v=abc")).headers["cache-control"], "public, max-age=31536000, immutable");
  assert.equal((await get("/homepage/assets/thumbs/2048.webp?v=pixel2")).headers["cache-control"], "public, max-age=31536000, immutable");
  assert.equal((await get("/homepage/styles.css")).headers["cache-control"], "public, max-age=300");
  assert.equal((await get("/homepage/styles.css?x=1")).headers["cache-control"], "public, max-age=300");
  assert.equal((await get("/homepage/index.html?v=1")).headers["cache-control"], "no-cache");
});

test("Ảnh / âm thanh không nén, có Accept-Ranges, Range 206 và 416", async () => {
  const raw = file("homepage/assets/thumbs/2048.webp");
  const r = await get("/homepage/assets/thumbs/2048.webp", { "Accept-Encoding": "gzip, br" });
  assert.equal(r.status, 200);
  assert.equal(r.headers["content-encoding"], undefined);
  assert.equal(r.headers.vary, undefined);
  assert.equal(r.headers["accept-ranges"], "bytes");
  assert.equal(r.headers["content-type"], "image/webp");
  assert.deepEqual(r.body, raw);

  const part = await get("/homepage/assets/thumbs/2048.webp", { Range: "bytes=10-29" });
  assert.equal(part.status, 206);
  assert.equal(part.headers["content-range"], `bytes 10-29/${raw.length}`);
  assert.equal(Number(part.headers["content-length"]), 20);
  assert.deepEqual(part.body, raw.subarray(10, 30));

  const tail = await get("/homepage/assets/thumbs/2048.webp", { Range: "bytes=-5" });
  assert.equal(tail.status, 206);
  assert.deepEqual(tail.body, raw.subarray(raw.length - 5));

  const open = await get("/homepage/assets/thumbs/2048.webp", { Range: "bytes=0-" });
  assert.equal(open.status, 206);
  assert.deepEqual(open.body, raw);

  const bad = await get("/homepage/assets/thumbs/2048.webp", { Range: `bytes=${raw.length + 5}-` });
  assert.equal(bad.status, 416);
  assert.equal(bad.headers["content-range"], `bytes */${raw.length}`);

  const stale = await get("/homepage/assets/thumbs/2048.webp", { Range: "bytes=0-9", "If-Range": '"cu"' });
  assert.equal(stale.status, 200, "If-Range lệch ⇒ gửi đủ");

  const img304 = await get("/homepage/assets/thumbs/2048.webp", { "If-None-Match": r.headers.etag });
  assert.equal(img304.status, 304);
});

test("HEAD: đủ header, không thân, Content-Length = cỡ bản sẽ gửi", async () => {
  const g = await get("/homepage/app.js", { "Accept-Encoding": "br" });
  const h = await get("/homepage/app.js", { "Accept-Encoding": "br" }, "HEAD");
  assert.equal(h.status, 200);
  assert.equal(h.body.length, 0);
  assert.equal(h.headers["content-length"], g.headers["content-length"]);
  assert.equal(h.headers["content-encoding"], "br");
  assert.equal(h.headers.etag, g.headers.etag);
  const hi = await get("/homepage/assets/thumbs/2048.webp", {}, "HEAD");
  assert.equal(Number(hi.headers["content-length"]), file("homepage/assets/thumbs/2048.webp").length);
  assert.equal(hi.body.length, 0);
});

test("Đường đặc biệt giữ nguyên: /healthz, /api/lobby, chuyển hướng /, thư mục thiếu /, 404, chặn ../", async () => {
  const hz = await get("/healthz", { "Accept-Encoding": "br" });
  assert.equal(hz.status, 200); assert.equal(hz.body.toString(), "ok"); assert.equal(hz.headers["content-encoding"], undefined);
  const lobby = await get("/api/lobby", { "Accept-Encoding": "br" });
  assert.equal(lobby.status, 200); assert.equal(lobby.headers["cache-control"], "no-store");
  assert.ok(Array.isArray(JSON.parse(lobby.body).rooms));
  assert.equal((await get("/")).headers.location, "/homepage/");
  const dir = await get("/homepage?x=1");
  assert.equal(dir.status, 301); assert.equal(dir.headers.location, "/homepage/?x=1");
  assert.equal((await get("/homepage/khong-co.js")).status, 404);
  assert.notEqual((await get("/%2e%2e/server.js")).status, 200, "không lộ file ngoài prototype/");
  assert.equal((await get("/homepage/", {}, "POST")).status, 405);
});
