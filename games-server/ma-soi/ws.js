// WebSocket tối giản (RFC 6455) cho Node, KHÔNG cần gói ngoài. Chỉ những gì Ma Sói cần:
// khung text (có/không phân mảnh), ping/pong, close; giới hạn cỡ khung; client BẮT BUỘC che (mask) dữ liệu.
"use strict";
const crypto = require("crypto");
const { EventEmitter } = require("events");

const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

class Socket extends EventEmitter {
  constructor(sock, maxBytes) {
    super();
    this.sock = sock; this.maxBytes = maxBytes; this.buf = Buffer.alloc(0); this.frag = null; this.open = true;
    sock.setNoDelay(true);
    sock.on("data", (d) => this._data(d));
    sock.on("close", () => this._closed());
    sock.on("error", () => this._closed());
  }
  send(text) {
    if (!this.open) return;
    const data = Buffer.from(text, "utf8");
    const n = data.length;
    const head = n < 126 ? Buffer.from([0x81, n]) : n < 65536 ? Buffer.from([0x81, 126, n >> 8, n & 255]) : (() => {
      const h = Buffer.alloc(10); h[0] = 0x81; h[1] = 127; h.writeBigUInt64BE(BigInt(n), 2); return h; })();
    this.sock.write(Buffer.concat([head, data]));
  }
  close(code = 1000) {
    if (!this.open) return;
    const b = Buffer.alloc(2); b.writeUInt16BE(code);
    try { this.sock.write(Buffer.concat([Buffer.from([0x88, 2]), b])); } catch {}
    this.sock.end(); this._closed();
  }
  _closed() { if (!this.open) return; this.open = false; this.sock.destroy(); this.emit("close"); }
  _data(d) {
    this.buf = Buffer.concat([this.buf, d]);
    if (this.buf.length > this.maxBytes + 14) return this.close(1009);
    for (;;) {
      const b = this.buf;
      if (b.length < 2) return;
      const fin = b[0] & 0x80, op = b[0] & 0x0f, masked = b[1] & 0x80;
      let len = b[1] & 0x7f, off = 2;
      if (!masked) return this.close(1002); // client phải che dữ liệu
      if (len === 126) { if (b.length < 4) return; len = b.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (b.length < 10) return; const big = b.readBigUInt64BE(2); if (big > BigInt(this.maxBytes)) return this.close(1009); len = Number(big); off = 10; }
      if (len > this.maxBytes) return this.close(1009);
      if (b.length < off + 4 + len) return;
      const mask = b.subarray(off, off + 4), payload = Buffer.from(b.subarray(off + 4, off + 4 + len));
      for (let i = 0; i < len; i++) payload[i] ^= mask[i & 3];
      this.buf = b.subarray(off + 4 + len);
      if (op === 0x8) return this.close(1000);
      if (op === 0x9) { this.sock.write(Buffer.concat([Buffer.from([0x8a, payload.length]), payload.subarray(0, 125)])); continue; }
      if (op === 0xa) continue;
      if (op === 0x2) return this.close(1003); // chỉ nhận text
      if (op === 0x1) { if (this.frag) return this.close(1002); this.frag = [payload]; }
      else if (op === 0x0) { if (!this.frag) return this.close(1002); this.frag.push(payload); }
      else return this.close(1002);
      const total = this.frag.reduce((s, p) => s + p.length, 0);
      if (total > this.maxBytes) return this.close(1009);
      if (fin) { const msg = Buffer.concat(this.frag).toString("utf8"); this.frag = null; this.emit("message", msg); }
    }
  }
}

/** Gắn WebSocket vào http.Server tại đường dẫn `path`. onConnection(socket, req). */
function attachWs(server, path, onConnection, { maxBytes = 4096, allowOrigin = null } = {}) {
  server.on("upgrade", (req, sock) => {
    let url; try { url = new URL(req.url, "http://x"); } catch { return sock.destroy(); }
    if (url.pathname !== path) return; // để handler khác (nếu có) xử lý
    const key = req.headers["sec-websocket-key"];
    if (!key || req.headers.upgrade?.toLowerCase() !== "websocket") return sock.end("HTTP/1.1 400 Bad Request\r\n\r\n");
    // chống trang web lạ mở kết nối thay người chơi (CSWSH): chỉ nhận Origin cùng host khi có header Origin
    const origin = req.headers.origin;
    if (origin && !(allowOrigin ? allowOrigin(origin, req) : sameHost(origin, req))) return sock.end("HTTP/1.1 403 Forbidden\r\n\r\n");
    const accept = crypto.createHash("sha1").update(key + GUID).digest("base64");
    sock.write("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: " + accept + "\r\n\r\n");
    onConnection(new Socket(sock, maxBytes), req);
  });
}
function sameHost(origin, req) { try { return new URL(origin).host === req.headers.host; } catch { return false; } }

module.exports = { attachWs };
