// Xác định người chơi của một request.
//   supabase: "Authorization: Bearer <access token>" → hỏi {SUPABASE_URL}/auth/v1/user (apikey = anon key). Token hợp lệ được nhớ 60 giây.
//   memory (chỉ máy dev / test): header "x-dev-user: <id ngẫu nhiên>" — KHÔNG bao giờ được nhận ở chế độ supabase.
import { createHash } from "node:crypto";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEV_ID = /^[A-Za-z0-9_-]{6,64}$/;

export function bearerOf(req) {
  const h = String(req.headers.authorization || "");
  const m = /^Bearer\s+([A-Za-z0-9._~+/=-]{10,4096})$/.exec(h.trim());
  return m ? m[1] : null;
}

export function devAuth() {
  return {
    kind: "dev",
    async userOf(req) {
      const id = String(req.headers["x-dev-user"] || "");
      return DEV_ID.test(id) ? "dev-" + id : null;
    },
  };
}

export function supabaseAuth({ url, anonKey, fetch = globalThis.fetch, now = () => Date.now(), ttlMs = 60_000, maxEntries = 5000, timeoutMs = 5000 }) {
  const endpoint = url.replace(/\/+$/, "") + "/auth/v1/user";
  const cache = new Map(); // sha256(token) → { id, exp }
  const pending = new Map();
  async function lookup(token) {
    const headers = { apikey: anonKey, Authorization: `Bearer ${token}`, Accept: "application/json" };
    let res;
    try { res = await fetch(endpoint, { headers, signal: AbortSignal.timeout(timeoutMs) }); } catch { const e = new Error("auth upstream"); e.code = "upstream"; throw e; }
    if (res.status === 401 || res.status === 403) { try { await res.text(); } catch {} return null; }
    if (!res.ok) { try { await res.text(); } catch {} const e = new Error("auth upstream " + res.status); e.code = "upstream"; throw e; }
    const u = await res.json().catch(() => null);
    return u && typeof u.id === "string" && UUID.test(u.id) ? u.id : null;
  }
  return {
    kind: "supabase",
    async userOf(req) {
      const token = bearerOf(req);
      if (!token) return null;
      const key = createHash("sha256").update(token).digest("base64url");
      const hit = cache.get(key);
      if (hit && hit.exp > now()) return hit.id;
      let p = pending.get(key);
      if (!p) { p = lookup(token).finally(() => pending.delete(key)); pending.set(key, p); }
      const id = await p;
      if (id) {
        if (cache.size >= maxEntries) { const t = now(); for (const [k, v] of cache) if (v.exp <= t) cache.delete(k); if (cache.size >= maxEntries) cache.clear(); }
        cache.set(key, { id, exp: now() + ttlMs });
      }
      return id;
    },
  };
}
