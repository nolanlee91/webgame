// Dựng bằng chứng hợp lệ cho test (giống thứ trình duyệt gửi lên sau khi chơi thật).
import http from "node:http";
import { randomUUID, createHash } from "node:crypto";
import { sudokuPuzzle, quizRound, MOVE_LETTER, D } from "../verify.mjs";
import { isJwtKey } from "../stores.mjs";
import * as T2048 from "../../../prototype/games/2048/logic.js";

export const DAY = 3;
export const NOW = D.dayStart(DAY) + 5 * 3600 * 1000; // 5h sáng giờ VN ngày 3

export function sudokuProof(day = DAY, { time = 300, mistakes = 0, hints = 0 } = {}) {
  const { puzzle, solution } = sudokuPuzzle(day);
  const hinted = new Array(81).fill(0);
  for (let i = 0, n = 0; i < 81 && n < hints; i++) if (!puzzle[i]) { hinted[i] = 1; n++; }
  return { cells: solution.join(""), hinted: hinted.join(""), time, mistakes, hints };
}

/** Chuỗi nước 2048 hợp lệ (đi tham lam theo thứ tự hướng), dài tối đa n. */
export function moves2048(day = DAY, n = 150, order = ["left", "down", "right", "up"]) {
  const s = T2048.newGame({ size: 4, seed: D.seedFor("2048", day) });
  let log = "";
  for (let i = 0; log.length < n && s.status === "playing" && i < 2000; i++) {
    for (const d of order) {
      const r = T2048.move(s, d);
      if (r) { log += MOVE_LETTER[d]; if (r.reachedGoal) T2048.keepGoing(s); break; }
    }
    if (s.moves >= 150) break;
  }
  return log;
}

/** Trả lời Đố Vui: đúng theo mảng ok (true/false/"t" = hết giờ), ms mỗi câu. */
export function quizProof(day = DAY, oks = [true, true, true, true, true], ms = 4000) {
  const s = quizRound(day);
  return { answers: s.qs.map((q, i) => (oks[i] === "t" ? { pick: -1, ms: 15000 } : { pick: oks[i] ? q.correct : (q.correct + 1) % 4, ms: Array.isArray(ms) ? ms[i] : ms })) };
}

/** Bật http server cho handler (req,res) ⇒ { base, close } */
export async function serve(handler) {
  const srv = http.createServer(handler);
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  return { base: `http://127.0.0.1:${srv.address().port}`, close: () => new Promise((r) => { srv.closeAllConnections?.(); srv.close(r); }) };
}

export function apiServer(api) {
  return serve((req, res) => {
    api.handle(req, res).then((done) => { if (!done) { res.writeHead(404); res.end(); } }, (e) => { res.writeHead(500); res.end(String(e)); });
  });
}

/**
 * Máy chủ Supabase giả: lưu bảng trong RAM, hiểu đủ cú pháp PostgREST mà supabaseStore dùng, và phần GoTrue mà supabase-js gọi:
 * signInAnonymously, /user, /settings, đăng nhập Google kiểu PKCE (linkIdentity + signInWithOAuth + /token?grant_type=pkce), /logout.
 * "Google" giả: /fake-google/consent chọn ngay tài khoản opts.googleEmail (sub = opts.googleSub) rồi quay về redirect_to.
 * Đổi lúc chạy qua fake.opts: { google (bật nhà cung cấp), settingsStatus, googleSub, googleEmail, googleName }.
 */
export async function fakeSupabase({ serviceKey, anonKey, users = {}, failRest = false, google = false }) {
  const USERS = { ...users };              // access token → user id
  const PROFILE = {};                      // user id → { is_anonymous, email, identities }
  const GOOGLE = {};                       // google sub → user id (identity đã gắn)
  const PENDING = {}, CODES = {};
  const opts = { google, settingsStatus: 200, googleSub: "g-sub-1", googleEmail: "nguyenvana@gmail.com", googleName: "Nguyễn Văn A" };
  const ANON = anonKey;
  const log = [];
  const tables = { daily_scores: [], profiles: [] };
  let clock = 0;
  const userJson = (id) => {
    const pr = PROFILE[id] || { is_anonymous: true, identities: [] };
    return { id, aud: "authenticated", role: "authenticated", is_anonymous: pr.is_anonymous, email: pr.email || "",
      app_metadata: pr.is_anonymous ? {} : { provider: "google", providers: ["google"] },
      user_metadata: pr.is_anonymous ? {} : { full_name: opts.googleName, email: pr.email },
      identities: pr.identities, created_at: new Date().toISOString() };
  };
  const session = (id) => {
    const token = "eyJfake." + randomUUID().replace(/-/g, "") + ".sig";
    USERS[token] = id;
    const t = Math.floor(Date.now() / 1000);
    return { access_token: token, token_type: "bearer", expires_in: 3600, expires_at: t + 3600, refresh_token: "r-" + randomUUID(), user: userJson(id) };
  };
  const linkGoogle = (id, sub = opts.googleSub, email = opts.googleEmail) => {
    GOOGLE[sub] = id;
    PROFILE[id] = { is_anonymous: false, email, identities: [{ id: sub, provider: "google", identity_data: { email, full_name: opts.googleName, sub } }] };
  };
  let base = "";
  const srv = await serve(async (req, res) => {
    const chunks = []; for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString();
    let body; try { body = raw ? JSON.parse(raw) : undefined; } catch { body = raw; }
    const u = new URL(req.url, "http://x");
    log.push({ method: req.method, path: u.pathname, query: u.search, headers: { ...req.headers }, body });
    const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "GET, POST, PATCH, OPTIONS", "access-control-expose-headers": "content-range" };
    const out = (status, data, headers = {}) => { res.writeHead(status, { "content-type": "application/json", ...cors, ...headers }); res.end(data === undefined ? "" : JSON.stringify(data)); };
    if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
    if (u.pathname === "/auth/v1/signup" && req.method === "POST") { // signInAnonymously() của supabase-js
      if (req.headers.apikey !== ANON) return out(401, { msg: "bad apikey" });
      const id = randomUUID(), token = "eyJfake." + randomUUID().replace(/-/g, "") + ".sig";
      USERS[token] = id;
      const t = Math.floor(Date.now() / 1000);
      return out(200, { access_token: token, token_type: "bearer", expires_in: 3600, expires_at: t + 3600, refresh_token: "r-" + id,
        user: { id, aud: "authenticated", role: "authenticated", is_anonymous: true, app_metadata: {}, user_metadata: {}, identities: [], created_at: new Date().toISOString() } });
    }
    const bearer = /^Bearer (.+)$/.exec(req.headers.authorization || "")?.[1];
    if (u.pathname === "/auth/v1/user") {
      if (req.headers.apikey !== ANON) return out(401, { msg: "bad apikey" });
      return USERS[bearer] ? out(200, userJson(USERS[bearer])) : out(401, { msg: "invalid JWT" });
    }
    if (u.pathname === "/auth/v1/settings") {
      if (req.headers.apikey !== ANON) return out(401, { msg: "bad apikey" });
      if (opts.settingsStatus !== 200) return out(opts.settingsStatus, { msg: "down" });
      return out(200, { external: { anonymous_users: true, email: true, google: !!opts.google, facebook: false }, disable_signup: false, mailer_autoconfirm: false });
    }
    const startOAuth = (flow, uid) => {
      const state = randomUUID();
      PENDING[state] = { flow, uid, redirectTo: u.searchParams.get("redirect_to") || "", challenge: u.searchParams.get("code_challenge") || "", method: u.searchParams.get("code_challenge_method") || "" };
      return base + "/fake-google/consent?state=" + state;
    };
    if (u.pathname === "/auth/v1/user/identities/authorize" && req.method === "GET") { // linkIdentity()
      if (req.headers.apikey !== ANON) return out(401, { msg: "bad apikey" });
      if (!USERS[bearer]) return out(401, { msg: "invalid JWT" });
      if (!opts.google) return out(400, { code: "validation_failed", msg: "Unsupported provider" });
      return out(200, { url: startOAuth("link", USERS[bearer]) });
    }
    if (u.pathname === "/auth/v1/authorize" && req.method === "GET") { // signInWithOAuth(): trình duyệt tự đi tới
      res.writeHead(302, { location: startOAuth("signin", null) }); return res.end();
    }
    if (u.pathname === "/fake-google/consent") {
      const st = u.searchParams.get("state"), pd = PENDING[st]; delete PENDING[st];
      if (!pd) return out(400, { msg: "state" });
      const back = new URL(pd.redirectTo);
      const owner = GOOGLE[opts.googleSub];
      let uid = pd.uid;
      if (pd.flow === "link") {
        if (owner && owner !== uid) {
          back.searchParams.set("error", "server_error"); back.searchParams.set("error_code", "identity_already_exists");
          back.searchParams.set("error_description", "Identity is already linked to another user");
          res.writeHead(302, { location: back.href }); return res.end();
        }
        linkGoogle(uid);
      } else {
        uid = owner || randomUUID();
        if (!owner) linkGoogle(uid);
      }
      const code = randomUUID();
      CODES[code] = { uid, challenge: pd.challenge, method: pd.method };
      back.searchParams.set("code", code);
      res.writeHead(302, { location: back.href }); return res.end();
    }
    if (u.pathname === "/auth/v1/token" && u.searchParams.get("grant_type") === "pkce" && req.method === "POST") {
      if (req.headers.apikey !== ANON) return out(401, { msg: "bad apikey" });
      const key = body && body.auth_code, c = CODES[key]; delete CODES[key];
      if (!c) return out(404, { code: "flow_state_not_found", msg: "invalid flow state" });
      const v = String(body.code_verifier || "");
      const ok = c.method === "s256" ? createHash("sha256").update(v).digest("base64url") === c.challenge : v === c.challenge;
      if (!ok) return out(403, { code: "bad_code_verifier", msg: "code challenge does not match" });
      return out(200, session(c.uid));
    }
    if (u.pathname === "/auth/v1/logout" && req.method === "POST") {
      if (bearer) delete USERS[bearer];
      res.writeHead(204, cors); return res.end();
    }
    const m = /^\/rest\/v1\/(\w+)$/.exec(u.pathname);
    if (!m) return out(404, {});
    if (req.headers.apikey !== serviceKey) return out(401, { message: "Invalid API key" });
    if (isJwtKey(serviceKey) ? req.headers.authorization !== `Bearer ${serviceKey}` : req.headers.authorization !== undefined) return out(401, { message: "bad authorization" });
    if (failRest) return out(500, { message: "boom" });
    const t = tables[m[1]];
    const prefer = req.headers.prefer || "";
    if (req.method === "POST") {
      const keys = (u.searchParams.get("on_conflict") || "").split(",");
      const inserted = [];
      for (const row of body) {
        const i = t.findIndex((r) => keys.every((k) => r[k] === row[k]));
        if (i >= 0) { if (prefer.includes("merge-duplicates")) Object.assign(t[i], row); continue; }
        const r = { ...row, created_at: new Date(Date.UTC(2026, 10, 24) + ++clock * 1000).toISOString() };
        t.push(r); inserted.push(r);
      }
      return prefer.includes("return=representation") ? out(201, inserted) : out(201);
    }
    const match = (r) => { for (const [k, v] of u.searchParams) { if (["select", "order", "limit", "on_conflict"].includes(k)) continue;
      const op = v.slice(0, v.indexOf(".")), val = v.slice(v.indexOf(".") + 1);
      if (!(op === "eq" ? String(r[k]) === val : op === "gt" ? Number(r[k]) > Number(val) : false)) return false; } return true; };
    if (req.method === "PATCH") {
      const hit = t.filter(match); for (const r of hit) Object.assign(r, body);
      return prefer.includes("return=representation") ? out(200, hit) : out(204);
    }
    let rows = t.slice();
    for (const [k, v] of u.searchParams) {
      if (["select", "order", "limit", "on_conflict"].includes(k)) continue;
      const [op, val] = [v.slice(0, v.indexOf(".")), v.slice(v.indexOf(".") + 1)];
      rows = rows.filter((r) => (op === "eq" ? String(r[k]) === val : op === "gt" ? Number(r[k]) > Number(val) : false));
    }
    const total = rows.length;
    if (u.searchParams.get("order") === "score.desc,created_at.asc") rows.sort((a, b) => b.score - a.score || a.created_at.localeCompare(b.created_at));
    const limit = Number(u.searchParams.get("limit") || 1e9);
    rows = rows.slice(0, limit);
    const cols = (u.searchParams.get("select") || "*").split(",");
    rows = rows.map((r) => (cols[0] === "*" ? r : Object.fromEntries(cols.map((c) => [c, r[c]]))));
    const h = prefer.includes("count=exact") ? { "content-range": rows.length ? `0-${rows.length - 1}/${total}` : `*/${total}` } : {};
    return out(200, rows, h);
  });
  base = srv.base;
  return { ...srv, log, tables, users: USERS, opts, googleLinks: GOOGLE, linkGoogle };
}

