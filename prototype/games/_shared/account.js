// Tài khoản người chơi (giai đoạn 1) — ES module cho trình duyệt, LƯỜI: không tải gì cho tới khi trang gọi tới.
//   • Máy chủ có Supabase (/api/config → supabase:true): tải supabase-js v2 (ESM, bản cố định) từ jsDelivr, đăng nhập ẨN DANH
//     lần đầu cần (signInAnonymously), giữ phiên trong localStorage của supabase-js. Máy chủ chỉ tin access token này.
//   • Máy dev (board:"memory"): id ngẫu nhiên lưu cục bộ, gửi qua header x-dev-user (máy chủ thật không nhận header này).
//   • board:false: bảng xếp hạng tắt ⇒ mọi hàm trả null / lỗi "off", trang tự ẩn phần bảng.
// Tên hiển thị + trạng thái "đã gửi" lưu ở localStorage "wgp.account.v1" (không đụng bản lưu game).
// Sau này "Liên kết Google/Facebook": linkIdentity(provider) bên dưới (chưa có giao diện).

export const STORE_KEY = "wgp.account.v1";
export const SUPABASE_ESM = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.9/+esm";
export const DEFAULT_NAME = "Người chơi";

// ---------- Lưu cục bộ ----------
function ls() { try { return globalThis.localStorage || null; } catch { return null; } }
function load() {
  try { const v = JSON.parse(ls()?.getItem(STORE_KEY) || "null"); if (v && v.v === 1) return { sent: {}, ...v }; } catch { /* hỏng ⇒ làm lại */ }
  return { v: 1, name: "", asked: false, devId: "", sent: {} };
}
function save(st) { try { ls()?.setItem(STORE_KEY, JSON.stringify(st)); return true; } catch { return false; } }

export function getName() { return load().name || ""; }
/** Đã hỏi tên lần nào chưa (chỉ hỏi một lần; bỏ qua cũng tính là đã hỏi). */
export function wasAsked() { return !!load().asked; }
export function setName(name) {
  const st = load();
  st.name = String(name || "").replace(/\s+/g, " ").trim().slice(0, 16);
  st.asked = true;
  save(st);
  return st.name;
}
export function isSent(game, day) { return !!load().sent[`${game}:${day}`]; }
export function markSent(game, day) {
  const st = load();
  st.sent[`${game}:${day}`] = 1;
  const keys = Object.keys(st.sent);
  if (keys.length > 60) for (const k of keys.slice(0, keys.length - 60)) delete st.sent[k];
  save(st);
}

// ---------- Cấu hình máy chủ ----------
let cfgP = null;
/** { supabase, board, supabaseUrl?, supabaseAnonKey? } — board false khi máy chủ tắt bảng hoặc không gọi được. */
export function getConfig() {
  if (!cfgP) {
    cfgP = fetch("/api/config", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { supabase: false, board: false, error: r.status }))
      .catch(() => ({ supabase: false, board: false, error: "network" }));
    cfgP.then((c) => { if (c.error) cfgP = null; }); // lỗi mạng ⇒ lần sau thử lại
  }
  return cfgP;
}
/** "supabase" | "memory" | "off" */
export async function mode() {
  const c = await getConfig();
  return c.board === "supabase" && c.supabase ? "supabase" : c.board === "memory" ? "memory" : "off";
}
export function isOnline() { return !globalThis.navigator || navigator.onLine !== false; }

// ---------- Supabase (chỉ tải khi cần) ----------
let sbP = null;
async function supabase() {
  if (!sbP) {
    sbP = (async () => {
      const c = await getConfig();
      const { createClient } = await import(/* @vite-ignore */ SUPABASE_ESM);
      return createClient(c.supabaseUrl, c.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
    })();
    sbP.catch(() => { sbP = null; });
  }
  return sbP;
}

function devId() {
  const st = load();
  if (!st.devId) {
    const a = new Uint8Array(12); (globalThis.crypto || {}).getRandomValues?.(a);
    st.devId = "d" + [...a].map((b) => b.toString(16).padStart(2, "0")).join("") + Date.now().toString(36);
    save(st);
  }
  return st.devId;
}

/**
 * Access token hiện tại. create=false: chỉ dùng phiên đã có (trang chủ không tạo người dùng mới).
 * Chế độ dev trả null (dùng authHeaders()).
 */
export async function getToken({ create = true } = {}) {
  if ((await mode()) !== "supabase") return null;
  const sb = await supabase();
  let { data } = await sb.auth.getSession();
  if (!data?.session && create) {
    const r = await sb.auth.signInAnonymously();
    if (r.error) throw r.error;
    data = { session: r.data.session };
  }
  return data?.session?.access_token || null;
}

/** id người chơi: uuid của Supabase, hoặc id dev. null nếu chưa có (create=false). */
export async function getUserId({ create = true } = {}) {
  const m = await mode();
  if (m === "memory") return create || load().devId ? devId() : null;
  if (m !== "supabase") return null;
  if (!(await getToken({ create }))) return null;
  const { data } = await (await supabase()).auth.getSession();
  return data?.session?.user?.id || null;
}

/** Header danh tính cho API của mình. {} nếu chưa có danh tính (và create=false). */
export async function authHeaders({ create = true } = {}) {
  const m = await mode();
  if (m === "memory") { if (!create && !load().devId) return {}; return { "x-dev-user": devId() }; }
  if (m === "supabase") { const t = await getToken({ create }); return t ? { Authorization: `Bearer ${t}` } : {}; }
  return {};
}

// ---------- API bảng xếp hạng ----------
async function api(path, { method = "GET", body, create = true, timeoutMs = 8000 } = {}) {
  if ((await mode()) === "off") { const e = new Error("off"); e.code = "off"; throw e; }
  const headers = { Accept: "application/json", ...(await authHeaders({ create })) };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  let res;
  try {
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    const tm = ctl && setTimeout(() => ctl.abort(), timeoutMs);
    res = await fetch(path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, signal: ctl?.signal, cache: "no-store" });
    clearTimeout(tm);
  } catch { const e = new Error("network"); e.code = "network"; throw e; }
  let data = null; try { data = await res.json(); } catch { /* không phải JSON */ }
  if (!res.ok) { const e = new Error((data && data.error) || "http " + res.status); e.code = (data && data.error) || "http"; e.status = res.status; e.data = data; throw e; }
  return data;
}

/** Gửi kết quả daily (proof do game ghi kèm kết quả). Trả về { accepted, name, top, total, me }. */
export async function submitDaily(game, day, { name, proof }) {
  const r = await api(`/api/daily/${encodeURIComponent(game)}/${day | 0}`, { method: "POST", body: { name: name || DEFAULT_NAME, proof } });
  markSent(game, day);
  if (r && r.name) { const st = load(); st.name = r.name; save(st); }
  return r;
}
/** Bảng của (game, day): { top, total, me? } */
export function getBoard(game, day, { limit = 10, create = false } = {}) {
  return api(`/api/daily/${encodeURIComponent(game)}/${day | 0}?limit=${limit | 0}`, { create });
}
/** Hạng của mình ở cả 3 game trong ngày (một request, không tạo danh tính mới): { ranks: { game: { rank, total, short } } } */
export async function getMyRanks(day) {
  const h = await authHeaders({ create: false });
  if (!Object.keys(h).length) return { day, ranks: {} };
  return api(`/api/daily/me?day=${day | 0}`, { create: false });
}

// ---------- Để dành: liên kết Google / Facebook (chưa có giao diện) ----------
/**
 * Gắn tài khoản ẩn danh hiện tại với Google/Facebook để giữ điểm khi đổi máy (Supabase linkIdentity, cần bật
 * "Manual linking" + nhà cung cấp trong Supabase). provider: "google" | "facebook".
 */
export async function linkIdentity(provider, { redirectTo = location.href } = {}) {
  if ((await mode()) !== "supabase") throw new Error("Chưa bật tài khoản Supabase");
  const sb = await supabase();
  await getToken({ create: true });
  const { data, error } = await sb.auth.linkIdentity({ provider, options: { redirectTo } });
  if (error) throw error;
  return data;
}
