// Nơi lưu điểm Thử thách hôm nay. Hai bản, cùng một giao diện (đều trả Promise):
//   submit({ game, day, userId, name, score, result }) → { inserted }   (lần gửi ĐẦU TIÊN của (game, day, user) thắng)
//   setProfile(userId, name)
//   top(game, day, limit)       → { rows: [{ userId, name, score, result, at }], total }   (score giảm dần, cùng điểm ai trước đứng trên)
//   mine(game, day, userId)     → row | null
//   countAbove(game, day, score)→ số người điểm cao hơn hẳn (hạng = số này + 1)
//   mineAll(day, userId)        → [{ game, ...row }]
//
// memoryStore: trong RAM (máy dev + test; mất khi khởi động lại).
// supabaseStore: PostgREST của Supabase bằng service key (bỏ qua RLS) — key CHỈ nằm trên máy chủ, không log, không trả về client.

const byRank = (a, b) => b.score - a.score || a.at - b.at || (a.seq ?? 0) - (b.seq ?? 0);

export function memoryStore({ now = () => Date.now(), keepDays = 3 } = {}) {
  const boards = new Map(); // "game|day" → Map(userId → row)
  const profiles = new Map();
  let seq = 0;
  const board = (game, day) => {
    const k = `${game}|${day}`;
    let b = boards.get(k);
    if (!b) {
      b = new Map(); boards.set(k, b);
      // dọn ngày cũ cho RAM khỏi phình
      for (const key of boards.keys()) if (+key.split("|")[1] < day - keepDays) boards.delete(key);
    }
    return b;
  };
  const sorted = (game, day) => [...board(game, day).values()].sort(byRank);
  const pub = (r) => r && { userId: r.userId, name: r.name, score: r.score, result: r.result, at: r.at };
  return {
    kind: "memory",
    async submit({ game, day, userId, name, score, result }) {
      const b = board(game, day);
      if (b.has(userId)) return { inserted: false };
      b.set(userId, { userId, name, score: Number(score), result, at: now(), seq: ++seq });
      return { inserted: true };
    },
    async setProfile(userId, name) { profiles.set(userId, { name, at: now() }); },
    async getProfile(userId) { return profiles.get(userId) || null; },
    async top(game, day, limit) { const all = sorted(game, day); return { rows: all.slice(0, limit).map(pub), total: all.length }; },
    async mine(game, day, userId) { return pub(board(game, day).get(userId)) || null; },
    async countAbove(game, day, score) { let n = 0; for (const r of board(game, day).values()) if (r.score > score) n++; return n; },
    async mineAll(day, userId) {
      const out = [];
      for (const [k, b] of boards) { const [game, d] = k.split("|"); if (+d === day && b.has(userId)) out.push({ game, ...pub(b.get(userId)) }); }
      return out;
    },
  };
}

/** Key có phải JWT kiểu cũ (eyJ…) không — key mới sb_secret_/sb_publishable_ KHÔNG được gửi ở Authorization. */
export const isJwtKey = (k) => typeof k === "string" && k.startsWith("eyJ");

export class UpstreamError extends Error {
  constructor(status, what) { super(`supabase ${what}: HTTP ${status}`); this.status = status; this.code = "upstream"; }
}

export function supabaseStore({ url, serviceKey, fetch = globalThis.fetch, timeoutMs = 6000 }) {
  if (!url || !serviceKey) throw new Error("supabaseStore cần url + serviceKey");
  const base = url.replace(/\/+$/, "") + "/rest/v1";
  const headers = (extra = {}) => {
    const h = { apikey: serviceKey, Accept: "application/json", ...extra };
    if (isJwtKey(serviceKey)) h.Authorization = `Bearer ${serviceKey}`;
    return h;
  };
  async function call(what, path, { method = "GET", body, prefer } = {}) {
    const h = headers(body !== undefined ? { "Content-Type": "application/json" } : {});
    if (prefer) h.Prefer = prefer;
    let res;
    try {
      res = await fetch(base + path, { method, headers: h, body: body !== undefined ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(timeoutMs) });
    } catch { throw new UpstreamError(0, what); }
    if (!res.ok) { try { await res.text(); } catch {} throw new UpstreamError(res.status, what); }
    return res;
  }
  const json = async (res) => { const t = await res.text(); return t ? JSON.parse(t) : null; };
  const totalOf = (res) => { const m = /\/(\d+)\s*$/.exec(res.headers.get("content-range") || ""); return m ? Number(m[1]) : 0; };
  const enc = encodeURIComponent;
  const COLS = "user_id,name,score,result,created_at";
  const row = (r) => r && { userId: r.user_id, name: r.name, score: Number(r.score), result: r.result || {}, at: Date.parse(r.created_at) || 0 };
  const where = (game, day) => `game=eq.${enc(game)}&day=eq.${enc(day)}`;

  return {
    kind: "supabase",
    async submit({ game, day, userId, name, score, result }) {
      const res = await call("insert daily_scores", "/daily_scores?on_conflict=game,day,user_id", {
        method: "POST", prefer: "resolution=ignore-duplicates,return=representation",
        body: [{ game, day, user_id: userId, name, score, result }],
      });
      const rows = await json(res);
      return { inserted: Array.isArray(rows) && rows.length > 0 };
    },
    async setProfile(userId, name) {
      await call("upsert profiles", "/profiles?on_conflict=id", {
        method: "POST", prefer: "resolution=merge-duplicates,return=minimal",
        body: [{ id: userId, name, updated_at: new Date().toISOString() }],
      });
    },
    async getProfile(userId) {
      const rows = await json(await call("select profiles", `/profiles?select=name&id=eq.${enc(userId)}&limit=1`));
      return rows && rows[0] ? { name: rows[0].name } : null;
    },
    async top(game, day, limit) {
      const res = await call("select top", `/daily_scores?select=${COLS}&${where(game, day)}&order=score.desc,created_at.asc&limit=${limit | 0}`, { prefer: "count=exact" });
      return { rows: ((await json(res)) || []).map(row), total: totalOf(res) };
    },
    async mine(game, day, userId) {
      const rows = await json(await call("select mine", `/daily_scores?select=${COLS}&${where(game, day)}&user_id=eq.${enc(userId)}&limit=1`));
      return rows && rows[0] ? row(rows[0]) : null;
    },
    async countAbove(game, day, score) {
      const res = await call("count above", `/daily_scores?select=user_id&${where(game, day)}&score=gt.${enc(score)}&limit=1`, { prefer: "count=exact" });
      await res.text();
      return totalOf(res);
    },
    async mineAll(day, userId) {
      const rows = await json(await call("select mineAll", `/daily_scores?select=game,${COLS}&day=eq.${enc(day)}&user_id=eq.${enc(userId)}`));
      return (rows || []).map((r) => ({ game: r.game, ...row(r) }));
    },
  };
}
