// IP thật của người chơi, dùng chung cho giới hạn kết nối / phòng theo IP ở mọi game online.
//
// Đường đi: người chơi → (Cloudflare, nếu bật proxy) → proxy Railway → server.js.
// - trustProxy tắt (chạy máy): IP socket.
// - trustProxy bật: lấy phần tử CUỐI của X-Forwarded-For (proxy Railway ghi, client không giả được).
//   Nếu IP đó thuộc dải chính thức của Cloudflare ⇒ yêu cầu thật sự đi qua Cloudflare ⇒ tin CF-Connecting-IP
//   (Cloudflare tự ghi đè header này, client không giả được). Không có bước này thì sau Cloudflare
//   mọi người chơi chung một PoP sẽ chung một IP ⇒ giới hạn theo IP chặn nhầm cả loạt.
// Dải IP: https://www.cloudflare.com/ips/ (cập nhật nếu Cloudflare đổi — hiếm).
"use strict";

const CF_V4 = ["173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22", "141.101.64.0/18", "108.162.192.0/18",
  "190.93.240.0/20", "188.114.96.0/20", "197.234.240.0/22", "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13", "104.24.0.0/14",
  "172.64.0.0/13", "131.0.72.0/22"];
const CF_V6 = ["2400:cb00::/32", "2606:4700::/32", "2803:f800::/32", "2405:b500::/32", "2405:8100::/32", "2a06:98c0::/29", "2c0f:f248::/32"];

function v4(ip) {
  const p = ip.split(".");
  if (p.length !== 4 || p.some((x) => !/^\d{1,3}$/.test(x) || +x > 255)) return null;
  return BigInt(((+p[0] << 24) >>> 0) + (+p[1] << 16) + (+p[2] << 8) + +p[3]);
}
function v6(ip) {
  if (!ip.includes(":") || ip.includes(".")) return null;
  const [head, tail = ""] = ip.split("::");
  if (ip.split("::").length > 2) return null;
  const h = head ? head.split(":") : [], t = tail ? tail.split(":") : [];
  const fill = ip.includes("::") ? 8 - h.length - t.length : 0;
  if (fill < 0 || (!ip.includes("::") && h.length !== 8)) return null;
  const parts = [...h, ...Array(fill).fill("0"), ...t];
  if (parts.length !== 8 || parts.some((x) => !/^[0-9a-f]{1,4}$/i.test(x))) return null;
  return parts.reduce((acc, x) => (acc << 16n) + BigInt(parseInt(x, 16)), 0n);
}
function compile(list, parse, bits) {
  return list.map((c) => {
    const [base, len] = c.split("/");
    const shift = BigInt(bits - +len);
    return { net: parse(base) >> shift, shift };
  });
}
const NETS_V4 = compile(CF_V4, v4, 32), NETS_V6 = compile(CF_V6, v6, 128);

function isCloudflare(ip) {
  if (!ip) return false;
  const s = String(ip).trim().replace(/^::ffff:/i, "");
  const a = v4(s);
  if (a !== null) return NETS_V4.some((n) => a >> n.shift === n.net);
  const b = v6(s.toLowerCase());
  if (b !== null) return NETS_V6.some((n) => b >> n.shift === n.net);
  return false;
}

function clientIp(req, trustProxy) {
  const sock = (req.socket && req.socket.remoteAddress) || "?";
  if (!trustProxy) return sock;
  const hop = String(req.headers["x-forwarded-for"] || "").split(",").map((x) => x.trim()).filter(Boolean).pop();
  if (!hop) return sock;
  if (isCloudflare(hop)) {
    const cf = String(req.headers["cf-connecting-ip"] || "").trim();
    if (cf) return cf;
  }
  return hop;
}

module.exports = { clientIp, isCloudflare };
