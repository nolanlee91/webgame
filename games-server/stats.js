// Đếm lượt dùng phía máy chủ (Đợt 10 — đo đếm trước khi chọn hướng lan truyền). KHÔNG dùng công cụ bên ngoài (có trẻ em chơi).
//
//   POST /api/ev   body {"e":"<sự kiện>","g":"<id game hoặc rỗng>"}  → 204 (luôn rỗng; sự kiện lạ / game lạ ⇒ bỏ qua, vẫn 204)
//   GET  /admin/stats[?days=14|30]   bảng số đếm cho chủ dự án (HTTP Basic, mật khẩu ADMIN_PASSWORD). Không có biến ⇒ 404.
//
// Chỉ lưu số đếm GỘP THEO NGÀY: (ngày giờ VN dạng YYYYMMDD, sự kiện, game) → n. Không lưu IP, user id, user agent, tên.
// IP chỉ dùng để giới hạn tần suất (mặc định 60 sự kiện/phút/IP), giữ trong RAM, tự quên sau một phút.
//
// Chế độ (resolveStatsMode):
//   "supabase" — có SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY: gom trong RAM, mỗi ~60 s (và khi tắt máy) gọi RPC stats_add
//                (cộng dồn, SQL ở db/supabase/002_stats.sql). Gửi lỗi ⇒ giữ lại, lần sau gửi tiếp.
//   "memory"   — không có Supabase (máy dev, test, hoặc Railway chưa cấu hình): số nằm trong RAM, mất khi khởi động lại.
//   "off"      — STATS=off: nhận request nhưng không đếm gì.
"use strict";
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { clientIp } = require("./client-ip");

const EVENTS = Object.freeze([
  "share_click",      // bấm "Khoe kết quả"
  "challenge_click",  // bấm "Thách bạn" / "Thách lại"
  "share_open",       // mở trang có ?ref=share (hoặc ?ref=daily — link khoe Thử thách hôm nay)
  "challenge_open",   // mở link thách hợp lệ (?thach=…)
  "challenge_done",   // người nhận chơi xong ván thách
  "room_create",      // máy chủ: tạo phòng online thành công
  "room_join_link",   // máy chủ: vào phòng bằng link / mã
  "room_join_lobby",  // máy chủ: vào phòng từ sảnh chờ công khai trên trang chủ
  "daily_submit",     // xong một Thử thách hôm nay (ghi kết quả lần đầu trong ngày)
  "donate_open",      // D12: mở hộp "Ủng hộ Lụm Kèo" ở chân trang chủ / trang Thử thách (không gắn game, g = "")
]);
const EVENT_SET = new Set(EVENTS);
const EVENT_LABEL = {
  share_click: "Bấm Khoe", challenge_click: "Bấm Thách bạn", share_open: "Mở link khoe", challenge_open: "Mở link thách",
  challenge_done: "Chơi xong ván thách", room_create: "Tạo phòng", room_join_link: "Vào phòng bằng link/mã",
  room_join_lobby: "Vào phòng từ sảnh", daily_submit: "Xong Thử thách ngày", donate_open: "Mở hộp Ủng hộ",
};
const BODY_MAX = 512;
const VN_OFFSET = 7 * 3600 * 1000;
const DAY_MS = 86400 * 1000;
const KEEP_DAYS = 62; // RAM giữ tối đa ~2 tháng (trang admin xem tối đa 30 ngày)

/** Ngày giờ Việt Nam dạng số YYYYMMDD (vd 20261127). */
function vnDay(ms) {
  const d = new Date(ms + VN_OFFSET);
  return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}
/** Danh sách id game hợp lệ = khoá của prototype/games/_shared/games-meta.js (sinh từ homepage/games.js). */
function loadGameIds(file = path.join(__dirname, "..", "prototype", "games", "_shared", "games-meta.js")) {
  try {
    const t = fs.readFileSync(file, "utf8");
    return new Set(Object.keys(JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1))));
  } catch { return new Set(); }
}

function resolveStatsMode(env = process.env) {
  const t = (k) => (typeof env[k] === "string" ? env[k].trim() : "");
  if (t("STATS") === "off") return "off";
  if (t("STATS") === "memory") return "memory";
  if (/^https?:\/\/[^\s/]+/.test(t("SUPABASE_URL")) && t("SUPABASE_SERVICE_ROLE_KEY")) return "supabase";
  return "memory";
}

const sha = (s) => crypto.createHash("sha256").update(String(s), "utf8").digest();
/** So mật khẩu không lộ thời gian (băm trước ⇒ hai bên luôn cùng độ dài). */
function safeEqual(a, b) { return crypto.timingSafeEqual(sha(a), sha(b)); }

/** Giới hạn n lần / cửa sổ cho mỗi khoá (IP), chỉ trong RAM. */
function limiter(limit, windowMs, now) {
  const hits = new Map();
  const fn = (key) => {
    const t = now();
    let h = hits.get(key);
    if (!h || t - h.start >= windowMs) {
      if (hits.size > 20000) for (const [k, v] of hits) if (t - v.start >= windowMs) hits.delete(k);
      h = { start: t, n: 0 }; hits.set(key, h);
    }
    h.n++;
    return h.n <= limit;
  };
  fn.size = () => hits.size;
  return fn;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtDay = (d) => `${String(d % 100).padStart(2, "0")}/${String(Math.floor(d / 100) % 100).padStart(2, "0")}`;
const fmtN = (n) => (n ? Number(n).toLocaleString("vi-VN") : "·");

/**
 * opts: { env, now, fetch, games:Set, trustProxy, perMin, adminPerMin, flushMs, timer:false, log, mode }
 * Trả về { mode, EVENTS, count(e,g), handleEvent(req,res), handleAdmin(req,res), flush(), rows(days), snapshot(), stop() }.
 */
function createStats(opts = {}) {
  const env = opts.env || process.env;
  const now = opts.now || (() => Date.now());
  const fetchFn = opts.fetch || globalThis.fetch;
  const log = opts.log || ((m) => console.warn("[stats] " + m));
  const mode = opts.mode || resolveStatsMode(env);
  const t = (k) => (typeof env[k] === "string" ? env[k].trim() : "");
  const games = opts.games || loadGameIds();
  const trustProxy = opts.trustProxy ?? !!(t("RAILWAY_ENVIRONMENT") || t("RAILWAY_PROJECT_ID") || t("TRUST_PROXY") === "1");
  const evOk = limiter(opts.perMin ?? 60, 60_000, now);
  const adminOk = limiter(opts.adminPerMin ?? 20, 60_000, now);
  const supaUrl = t("SUPABASE_URL").replace(/\/+$/, ""), serviceKey = t("SUPABASE_SERVICE_ROLE_KEY");

  const pending = new Map(); // "day|event|game" → n (chưa gửi Supabase)
  const mem = new Map();     // chế độ memory: toàn bộ số đếm
  let lastPrune = 0, inflight = null, lastFlush = { at: 0, ok: true, rows: 0 };

  const keyOf = (day, e, g) => `${day}|${e}|${g}`;
  const splitKey = (k) => { const [d, e, g] = k.split("|"); return { day: Number(d), event: e, game: g }; };

  /** Đếm 1 lần. Sự kiện / game không hợp lệ ⇒ false (bỏ qua). */
  function count(e, g = "", n = 1) {
    if (mode === "off" || !EVENT_SET.has(e)) return false;
    g = typeof g === "string" ? g : "";
    if (g && !games.has(g)) return false;
    const day = vnDay(now());
    const store = mode === "supabase" ? pending : mem;
    const k = keyOf(day, e, g);
    store.set(k, (store.get(k) || 0) + n);
    if (mode === "memory" && now() - lastPrune > DAY_MS) {
      lastPrune = now();
      const cut = vnDay(now() - KEEP_DAYS * DAY_MS);
      for (const key of mem.keys()) if (Number(key.split("|")[0]) < cut) mem.delete(key);
    }
    if (pending.size > 5000) pending.clear(); // phòng thủ: Supabase hỏng lâu ⇒ không phình RAM vô hạn
    return true;
  }

  function supaHeaders(extra = {}) {
    const h = { apikey: serviceKey, Accept: "application/json", ...extra };
    if (serviceKey.startsWith("eyJ")) h.Authorization = `Bearer ${serviceKey}`; // key JWT kiểu cũ; key sb_secret_ chỉ đi ở apikey
    return h;
  }

  /** Gửi số đang gom lên Supabase (cộng dồn). Lỗi ⇒ trả số về hàng đợi. Không bao giờ ném lỗi. */
  function flush() {
    if (mode !== "supabase" || !pending.size) return inflight || Promise.resolve(lastFlush);
    if (inflight) return inflight.then(() => flush());
    const batch = [...pending].map(([k, n]) => ({ ...splitKey(k), n }));
    pending.clear();
    inflight = (async () => {
      try {
        const res = await fetchFn(supaUrl + "/rest/v1/rpc/stats_add", {
          method: "POST", headers: supaHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ p_rows: batch }), signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) { try { await res.text(); } catch {} throw new Error("HTTP " + res.status); }
        lastFlush = { at: now(), ok: true, rows: batch.length };
      } catch (e) {
        for (const r of batch) { const k = keyOf(r.day, r.event, r.game); pending.set(k, (pending.get(k) || 0) + r.n); }
        lastFlush = { at: now(), ok: false, rows: batch.length };
        log("không gửi được số đếm lên Supabase: " + (e && e.message));
      } finally { inflight = null; }
      return lastFlush;
    })();
    return inflight;
  }

  const timer = opts.timer === false || mode !== "supabase" ? null : setInterval(() => { flush(); }, opts.flushMs ?? 60_000);
  timer?.unref?.();

  /** Số đếm của `days` ngày gần nhất (tính cả hôm nay): [{ day, event, game, n }]. */
  async function rows(days = 14) {
    const from = vnDay(now() - (days - 1) * DAY_MS);
    const acc = new Map();
    const add = (day, e, g, n) => { if (day < from) return; const k = keyOf(day, e, g); acc.set(k, (acc.get(k) || 0) + Number(n || 0)); };
    for (const [k, n] of mem) { const r = splitKey(k); add(r.day, r.event, r.game, n); }
    for (const [k, n] of pending) { const r = splitKey(k); add(r.day, r.event, r.game, n); }
    let error = "";
    if (mode === "supabase") {
      try {
        for (let page = 0, offset = 0; page < 30; page++, offset += 1000) {
          const q = `/rest/v1/stats_daily?select=day,event,game,n&day=gte.${from}&order=day.desc,event.asc,game.asc&limit=1000&offset=${offset}`;
          const res = await fetchFn(supaUrl + q, { headers: supaHeaders(), signal: AbortSignal.timeout(8000) });
          if (!res.ok) { try { await res.text(); } catch {} throw new Error("HTTP " + res.status); }
          const list = await res.json();
          for (const r of Array.isArray(list) ? list : []) add(Number(r.day), String(r.event), String(r.game || ""), r.n);
          if (!Array.isArray(list) || list.length < 1000) break;
        }
      } catch (e) { error = "Không đọc được Supabase (" + (e && e.message) + "). Bảng dưới chỉ có số chưa gửi trong RAM."; }
    }
    const out = [...acc].map(([k, n]) => ({ ...splitKey(k), n }));
    out.error = error;
    return out;
  }

  function readBody(req) {
    return new Promise((resolve) => {
      if (Number(req.headers["content-length"] || 0) > BODY_MAX) { req.resume(); return resolve(null); }
      const chunks = []; let size = 0, done = false;
      req.on("data", (c) => { if (done) return; size += c.length; if (size > BODY_MAX) { done = true; req.resume(); return resolve(null); } chunks.push(c); });
      req.on("end", () => { if (done) return; done = true; try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); } catch { resolve(null); } });
      req.on("error", () => { if (!done) { done = true; resolve(null); } });
    });
  }
  const empty = (res, code, extra = {}) => { res.writeHead(code, { "Cache-Control": "no-store", "Content-Length": 0, ...extra }); res.end(); return true; };

  /** POST /api/ev. Luôn trả lời nhanh, không lộ lý do bỏ qua. */
  async function handleEvent(req, res) {
    if (req.method !== "POST") return empty(res, 405, { Allow: "POST" });
    const ip = clientIp(req, trustProxy);
    const body = await readBody(req);
    if (!evOk(ip)) return empty(res, 429, { "Retry-After": "60" });
    if (body && typeof body === "object" && !Array.isArray(body) && typeof body.e === "string") count(body.e, typeof body.g === "string" ? body.g : "");
    return empty(res, 204);
  }

  function adminPage(list, days) {
    const dayList = []; for (let i = 0; i < days; i++) dayList.push(vnDay(now() - i * DAY_MS));
    const byDayEv = new Map(), byGameEv = new Map(), totalEv = new Map();
    for (const r of list) {
      byDayEv.set(r.day + "|" + r.event, (byDayEv.get(r.day + "|" + r.event) || 0) + r.n);
      const g = r.game || "(chung)";
      if (!byGameEv.has(g)) byGameEv.set(g, new Map());
      byGameEv.get(g).set(r.event, (byGameEv.get(g).get(r.event) || 0) + r.n);
      totalEv.set(r.event, (totalEv.get(r.event) || 0) + r.n);
    }
    const head = EVENTS.map((e) => `<th scope="col" title="${esc(e)}">${esc(EVENT_LABEL[e])}<br><code>${esc(e)}</code></th>`).join("");
    const dayRows = dayList.map((d) => `<tr><th scope="row">${fmtDay(d)}</th>${EVENTS.map((e) => `<td>${fmtN(byDayEv.get(d + "|" + e))}</td>`).join("")}</tr>`).join("");
    const gameRows = [...byGameEv].sort((a, b) => [...b[1].values()].reduce((x, y) => x + y, 0) - [...a[1].values()].reduce((x, y) => x + y, 0))
      .map(([g, m]) => `<tr><th scope="row">${esc(g)}</th>${EVENTS.map((e) => `<td>${fmtN(m.get(e))}</td>`).join("")}</tr>`).join("");
    const totalRow = `<tr class="sum"><th scope="row">Tổng</th>${EVENTS.map((e) => `<td>${fmtN(totalEv.get(e))}</td>`).join("")}</tr>`;
    const ratio = (a, b) => (totalEv.get(b) ? Math.round((100 * (totalEv.get(a) || 0)) / totalEv.get(b)) + "%" : "—");
    const modeNote = mode === "supabase"
      ? `Supabase — gửi lần cuối: ${lastFlush.at ? new Date(lastFlush.at + VN_OFFSET).toISOString().slice(11, 19) + " (giờ VN) " + (lastFlush.ok ? "được" : "LỖI") : "chưa gửi"}; đang chờ gửi: ${pending.size} dòng`
      : mode === "memory" ? "RAM (chưa cấu hình Supabase) — số mất khi máy chủ khởi động lại" : "TẮT (STATS=off)";
    return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Số đếm — Lụm Kèo</title>
<style>
:root{color-scheme:light dark;--bg:#fff;--ink:#16202c;--soft:#5b6878;--line:#d6dde6;--head:#eef2f6}
@media (prefers-color-scheme:dark){:root{--bg:#0e1623;--ink:#f5f2e8;--soft:#9fb0c4;--line:#2a3a50;--head:#182638}}
body{margin:0;padding:16px;background:var(--bg);color:var(--ink);font:14px/1.45 system-ui,sans-serif}
h1{font-size:20px;margin:0 0 4px}h2{font-size:16px;margin:24px 0 8px}p{margin:4px 0;color:var(--soft)}
.wrap{overflow-x:auto;border:1px solid var(--line)}table{border-collapse:collapse;min-width:100%;font-variant-numeric:tabular-nums}
th,td{padding:6px 8px;border-bottom:1px solid var(--line);text-align:right;white-space:nowrap}thead th{background:var(--head);font-size:12px;vertical-align:bottom}
tbody th{text-align:left}code{font-size:11px;color:var(--soft)}tr.sum th,tr.sum td{font-weight:700;border-top:2px solid var(--line)}
a{color:inherit}.err{color:#c0392b;font-weight:700}nav a{display:inline-block;padding:8px 10px;margin-right:4px;border:1px solid var(--line);text-decoration:none}
nav a[aria-current]{font-weight:700;background:var(--head)}
</style></head><body>
<h1>Số đếm Lụm Kèo</h1>
<p>Chỉ là số gộp theo ngày (giờ Việt Nam). Không có IP, tên hay mã người chơi. Nguồn: ${esc(modeNote)}.</p>
${list.error ? `<p class="err">${esc(list.error)}</p>` : ""}
<nav aria-label="Khoảng thời gian"><a href="?days=14"${days === 14 ? ' aria-current="page"' : ""}>14 ngày</a><a href="?days=30"${days === 30 ? ' aria-current="page"' : ""}>30 ngày</a></nav>
<p>Tỉ lệ trong kỳ: mở link thách / bấm Thách bạn = <b>${ratio("challenge_open", "challenge_click")}</b> · chơi xong / mở link thách = <b>${ratio("challenge_done", "challenge_open")}</b> · mở link khoe / bấm Khoe = <b>${ratio("share_open", "share_click")}</b></p>
<h2>Theo ngày (mọi game)</h2>
<div class="wrap"><table><thead><tr><th scope="col">Ngày</th>${head}</tr></thead><tbody>${dayRows}</tbody></table></div>
<h2>Theo game (cộng ${days} ngày)</h2>
<div class="wrap"><table><thead><tr><th scope="col">Game</th>${head}</tr></thead><tbody>${gameRows || `<tr><td colspan="${EVENTS.length + 1}" style="text-align:left">Chưa có số nào.</td></tr>`}${totalRow}</tbody></table></div>
<p>"(chung)" = sự kiện không gắn game (vd mở trang chủ từ link khoe). "Vào phòng từ sảnh" chỉ đếm khi bấm "Vào" ở sảnh chờ trang chủ; vào bằng link / mã (kể cả gõ mã trên trang chủ) nằm ở cột "bằng link/mã".</p>
</body></html>`;
  }

  /** GET /admin/stats — HTTP Basic, mật khẩu ADMIN_PASSWORD (tên đăng nhập gì cũng được). */
  async function handleAdmin(req, res) {
    const password = typeof env.ADMIN_PASSWORD === "string" ? env.ADMIN_PASSWORD : "";
    const notFound = () => { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }); res.end("Not Found"); return true; };
    if (!password) return notFound();
    if (req.method !== "GET" && req.method !== "HEAD") return empty(res, 405, { Allow: "GET" });
    const ip = clientIp(req, trustProxy);
    const m = /^Basic\s+([A-Za-z0-9+/=]+)\s*$/i.exec(String(req.headers.authorization || ""));
    let given = null;
    if (m) { const s = Buffer.from(m[1], "base64").toString("utf8"); const i = s.indexOf(":"); given = i >= 0 ? s.slice(i + 1) : s; }
    const ok = given !== null && safeEqual(given, password);
    if (!ok) {
      if (!adminOk(ip)) return empty(res, 429, { "Retry-After": "60" });
      res.writeHead(401, { "WWW-Authenticate": 'Basic realm="Lum Keo admin", charset="UTF-8"', "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" });
      res.end("Cần mật khẩu.");
      return true;
    }
    let days = 14;
    try { days = Number(new URL(req.url, "http://x").searchParams.get("days")) === 30 ? 30 : 14; } catch {}
    const html = adminPage(await rows(days), days);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer", "X-Frame-Options": "DENY", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
      "Content-Length": Buffer.byteLength(html) });
    res.end(req.method === "HEAD" ? undefined : html);
    return true;
  }

  /** Ảnh chụp số đếm hiện có trong RAM (test / e2e): { "day|event|game": n }. */
  const snapshot = () => Object.fromEntries([...mem, ...pending]);
  const stop = () => { if (timer) clearInterval(timer); };

  return { mode, EVENTS, count, handleEvent, handleAdmin, flush, rows, snapshot, stop, get pendingSize() { return pending.size; }, get lastFlush() { return lastFlush; } };
}

module.exports = { createStats, resolveStatsMode, vnDay, loadGameIds, safeEqual, EVENTS };
