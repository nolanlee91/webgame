// Dựng bằng chứng hợp lệ cho test (giống thứ trình duyệt gửi lên sau khi chơi thật).
import http from "node:http";
import { randomUUID } from "node:crypto";
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

/** Máy chủ Supabase giả: lưu bảng trong RAM, hiểu đủ cú pháp PostgREST mà supabaseStore dùng. */
export async function fakeSupabase({ serviceKey, anonKey, users = {}, failRest = false }) {
  const USERS = { ...users };
  const ANON = anonKey;
  const log = [];
  const tables = { daily_scores: [], profiles: [] };
  let clock = 0;
  const srv = await serve(async (req, res) => {
    const chunks = []; for await (const c of req) chunks.push(c);
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : undefined;
    const u = new URL(req.url, "http://x");
    log.push({ method: req.method, path: u.pathname, query: u.search, headers: { ...req.headers }, body });
    const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-expose-headers": "content-range" };
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
    if (u.pathname === "/auth/v1/user") {
      if (req.headers.apikey !== ANON) return out(401, { msg: "bad apikey" });
      const tok = /^Bearer (.+)$/.exec(req.headers.authorization || "")?.[1];
      return USERS[tok] ? out(200, { id: USERS[tok], is_anonymous: true }) : out(401, { msg: "invalid JWT" });
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
  return { ...srv, log, tables, users: USERS };
}

