// API tài khoản + Bảng xếp hạng Thử thách hôm nay (giai đoạn 1). Không gói ngoài: dùng fetch có sẵn của Node.
//   GET  /api/config                 → { supabase, board, supabaseUrl?, supabaseAnonKey? }  (chỉ giá trị công khai)
//   POST /api/daily/:game/:day       body { name, proof } + danh tính → kiểm bằng chứng, ghi điểm (lần đầu thắng), trả bảng
//   GET  /api/daily/:game/:day?limit → { top: [{ rank, name, score, short, you? }], total, me? }
//   GET  /api/daily/me?day=N         → { day, ranks: { <game>: { rank, total, short } } }  (thẻ trang chủ, 1 request cho cả 3 game)
//
// Chế độ (resolveMode):
//   "supabase" — đủ SUPABASE_URL + SUPABASE_ANON_KEY + SUPABASE_SERVICE_ROLE_KEY.
//   "memory"   — chưa cấu hình Supabase và KHÔNG chạy trên Railway (máy dev, test). Danh tính qua header x-dev-user.
//   "off"      — trên Railway mà chưa cấu hình đủ (hoặc DAILY_BOARD=off): ẩn bảng, không nhận điểm.
//   DAILY_BOARD=memory ép chế độ RAM (chỉ để thử; dữ liệu mất khi khởi động lại).
import { verifyDaily, D } from "./verify.mjs";
import { cleanName, DEFAULT_NAME } from "./names.mjs";
import { memoryStore, supabaseStore } from "./stores.mjs";
import { devAuth, supabaseAuth } from "./auth.mjs";

export const BODY_MAX = 16 * 1024;
const GAME_RE = /^\/api\/daily\/([a-z0-9-]{1,32})\/(\d{1,6})$/;

export function resolveMode(env = process.env) {
  const t = (k) => (typeof env[k] === "string" ? env[k].trim() : "");
  const url = t("SUPABASE_URL"), anon = t("SUPABASE_ANON_KEY"), service = t("SUPABASE_SERVICE_ROLE_KEY");
  if (url && anon && service && /^https?:\/\/[^\s/]+/.test(url)) return "supabase";
  const forced = t("DAILY_BOARD");
  if (forced === "off") return "off";
  if (forced === "memory") return "memory";
  if (url || anon || service) return "off"; // cấu hình dở dang ⇒ tắt, không giả vờ có bảng
  const prod = t("RAILWAY_ENVIRONMENT") || t("RAILWAY_ENVIRONMENT_NAME") || t("RAILWAY_PROJECT_ID") || t("NODE_ENV") === "production";
  return prod ? "off" : "memory";
}

function rateLimiter(limit, windowMs, now) {
  const hits = new Map();
  return (key) => {
    const t = now();
    let h = hits.get(key);
    if (!h || t - h.start >= windowMs) {
      if (hits.size > 20000) for (const [k, v] of hits) if (t - v.start >= windowMs) hits.delete(k);
      h = { start: t, n: 0 }; hits.set(key, h);
    }
    h.n++;
    return h.n <= limit;
  };
}

/**
 * opts: { env, now, fetch, store, auth, mode, trustProxy, minSudokuSec, postPerMin, getPerMin, cacheMs, log }
 * Trả về { mode, config(), handle(req, res) → Promise<boolean> }.
 */
export function createAccountApi(opts = {}) {
  const env = opts.env || process.env;
  const now = opts.now || (() => Date.now());
  const fetchFn = opts.fetch || globalThis.fetch;
  const log = opts.log || ((m) => console.warn("[daily-board] " + m));
  const mode = opts.mode || resolveMode(env);
  const t = (k) => (typeof env[k] === "string" ? env[k].trim() : "");
  const supaUrl = t("SUPABASE_URL").replace(/\/+$/, ""), anonKey = t("SUPABASE_ANON_KEY");
  const minSudokuSec = opts.minSudokuSec ?? (env.DAILY_SUDOKU_MIN_SEC !== undefined && mode === "memory" ? Number(env.DAILY_SUDOKU_MIN_SEC) : undefined);
  const trustProxy = opts.trustProxy ?? !!(t("RAILWAY_ENVIRONMENT") || t("RAILWAY_PROJECT_ID") || t("TRUST_PROXY") === "1");
  const cacheMs = opts.cacheMs ?? 15_000;

  let store = opts.store || null, auth = opts.auth || null;
  if (mode === "supabase") {
    store ||= supabaseStore({ url: supaUrl, serviceKey: t("SUPABASE_SERVICE_ROLE_KEY"), fetch: fetchFn });
    auth ||= supabaseAuth({ url: supaUrl, anonKey, fetch: fetchFn, now });
  } else if (mode === "memory") {
    store ||= memoryStore({ now });
    auth ||= devAuth();
  }

  const postOk = rateLimiter(opts.postPerMin ?? 20, 60_000, now);
  const getOk = rateLimiter(opts.getPerMin ?? 240, 60_000, now);
  const topCache = new Map(); // "game|day|limit" → { exp, data }

  const config = () => mode === "supabase"
    ? { supabase: true, board: "supabase", supabaseUrl: supaUrl, supabaseAnonKey: anonKey }
    : { supabase: false, board: mode === "memory" ? "memory" : false };

  const ipOf = (req) => (trustProxy && String(req.headers["x-forwarded-for"] || "").split(",").map((x) => x.trim()).filter(Boolean).pop()) || req.socket?.remoteAddress || "?";

  function send(res, status, body, extra = {}) {
    const s = JSON.stringify(body);
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Content-Length": Buffer.byteLength(s), ...extra });
    res.end(s);
    return true;
  }

  function readBody(req) {
    return new Promise((resolve, reject) => {
      const len = Number(req.headers["content-length"] || 0);
      if (len > BODY_MAX) { const e = new Error("too big"); e.status = 413; return reject(e); }
      const chunks = []; let size = 0, done = false;
      req.on("data", (c) => {
        if (done) return;
        size += c.length;
        if (size > BODY_MAX) { done = true; const e = new Error("too big"); e.status = 413; reject(e); req.resume(); return; }
        chunks.push(c);
      });
      req.on("end", () => { if (done) return; done = true; try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "null")); } catch { const e = new Error("json"); e.status = 400; reject(e); } });
      req.on("error", (e) => { if (!done) { done = true; reject(e); } });
    });
  }

  async function topOf(game, day, limit) {
    const k = `${game}|${day}|${limit}`;
    const hit = topCache.get(k);
    if (hit && hit.exp > now()) return hit.data;
    const data = await store.top(game, day, limit);
    if (topCache.size > 500) topCache.clear();
    topCache.set(k, { exp: now() + cacheMs, data });
    return data;
  }
  const invalidate = (game, day) => { for (const k of topCache.keys()) if (k.startsWith(`${game}|${day}|`)) topCache.delete(k); };

  async function board(game, day, limit, userId) {
    const { rows, total } = await topOf(game, day, limit);
    let rank = 0, prev = null;
    const top = rows.map((r, i) => {
      if (i === 0 || r.score !== prev) rank = i + 1;
      prev = r.score;
      const e = { rank, name: r.name, score: r.score, short: D.short(game, r.result) };
      if (userId && r.userId === userId) e.you = true;
      return e;
    });
    const out = { game, day, top, total };
    if (userId) {
      const inTop = top.find((e) => e.you);
      if (inTop) out.me = { rank: inTop.rank, name: inTop.name, score: inTop.score, short: inTop.short };
      else {
        const mine = await store.mine(game, day, userId);
        if (mine) out.me = { rank: (await store.countAbove(game, day, mine.score)) + 1, name: mine.name, score: mine.score, short: D.short(game, mine.result) };
      }
      if (out.me && out.total < out.me.rank) out.total = out.me.rank; // bộ đếm cache 15 s có thể trễ
    }
    return out;
  }

  async function userOf(req) {
    try { return await auth.userOf(req); } catch (e) { if (e.code === "upstream") throw e; return null; }
  }

  async function handle(req, res) {
    let u;
    try { u = new URL(req.url, "http://x"); } catch { return send(res, 400, { error: "url" }); }
    const p = u.pathname;
    if (p === "/api/config") {
      if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, { error: "method" }, { Allow: "GET" });
      return send(res, 200, config());
    }
    if (!p.startsWith("/api/daily/")) return false;
    if (mode === "off") return send(res, 503, { error: "off" });
    const ip = ipOf(req);
    try {
      if (p === "/api/daily/me") {
        if (req.method !== "GET") return send(res, 405, { error: "method" }, { Allow: "GET" });
        if (!getOk(ip)) return send(res, 429, { error: "rate" }, { "Retry-After": "60" });
        const day = Number(u.searchParams.get("day"));
        if (!Number.isInteger(day) || day < 1 || day > D.dayNumber(now()) + 1) return send(res, 400, { error: "day" });
        const userId = await userOf(req);
        const ranks = {};
        if (userId) {
          for (const r of await store.mineAll(day, userId)) {
            if (!D.GAMES[r.game]) continue;
            const rank = (await store.countAbove(r.game, day, r.score)) + 1;
            const { total } = await topOf(r.game, day, 10);
            ranks[r.game] = { rank, total: Math.max(total, rank), short: D.short(r.game, r.result) };
          }
        }
        return send(res, 200, { day, ranks });
      }
      const m = GAME_RE.exec(p);
      if (!m || !D.GAMES[m[1]]) return send(res, 404, { error: "game" });
      const game = m[1], day = Number(m[2]);
      if (day < 1 || day > D.dayNumber(now()) + 1) return send(res, 400, { error: "day" });

      if (req.method === "GET" || req.method === "HEAD") {
        if (!getOk(ip)) return send(res, 429, { error: "rate" }, { "Retry-After": "60" });
        const limit = Math.max(1, Math.min(50, Number(u.searchParams.get("limit")) || 10));
        const userId = await userOf(req);
        return send(res, 200, await board(game, day, limit, userId));
      }
      if (req.method !== "POST") return send(res, 405, { error: "method" }, { Allow: "GET, POST" });
      if (!postOk(ip)) return send(res, 429, { error: "rate" }, { "Retry-After": "60" });
      let body;
      try { body = await readBody(req); } catch (e) { return send(res, e.status === 413 ? 413 : 400, { error: e.status === 413 ? "too_big" : "body" }); }
      const userId = await userOf(req);
      if (!userId) return send(res, 401, { error: "auth" });
      if (!body || typeof body !== "object") return send(res, 400, { error: "body" });
      const v = verifyDaily(game, day, body.proof, { now: now(), ...(Number.isFinite(minSudokuSec) ? { minSudokuSec } : {}) });
      if (!v.ok) return send(res, v.error === "day" ? 409 : 400, { error: v.error, detail: v.detail || "" });
      const name = cleanName(body.name ?? DEFAULT_NAME);
      const { inserted } = await store.submit({ game, day, userId, name, score: v.score, result: v.result });
      try { await store.setProfile(userId, name); } catch (e) { log("không lưu được profile: " + e.message); }
      if (inserted) invalidate(game, day);
      return send(res, 200, { ok: true, accepted: inserted, name, ...(await board(game, day, 10, userId)) });
    } catch (e) {
      if (e && e.code === "upstream") { log(e.message); return send(res, 502, { error: "upstream" }); }
      log("lỗi: " + (e && e.message));
      return send(res, 500, { error: "server" });
    }
  }

  return { mode, config, handle, store };
}
