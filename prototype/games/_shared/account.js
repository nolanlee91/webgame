// Tài khoản người chơi — ES module cho trình duyệt (chạy được cả trong Node để test). LƯỜI: không tải gì cho tới khi trang gọi tới.
//
// ================= API TÊN NGƯỜI CHƠI (ỔN ĐỊNH — mọi game + trang chủ dùng chung, ĐỪNG đổi chữ ký) =================
//   getName()            → string   Tên hiển thị hiện tại. KHÔNG BAO GIỜ rỗng: lần đầu chưa có tên ⇒ lấy tên cũ trong game
//                                   (ma-soi:name / dat-bom:name / ai-la-noi-gian:name) nếu hợp lệ, không thì SINH tên ngẫu nhiên
//                                   ("Heo Cute 15", "Gấu Cáu Kỉnh 07", "Trùm Hẻm 31") và lưu lại.
//   setName(name)        → { ok, name, error }   Đổi tên (đồng bộ, chỉ lưu trên máy). Kiểm 2–16 ký tự, chỉ chữ / số / dấu cách / . _ - '.
//                                   ok=false ⇒ error là câu tiếng Việt hiện thẳng cho người chơi, name = tên cũ (giữ nguyên).
//                                   Từ tục KHÔNG kiểm ở đây (danh sách nằm ở máy chủ): máy chủ phòng online / bảng xếp hạng vẫn lọc
//                                   (games-server/moderation.js). Muốn hỏi máy chủ trước khi lưu ⇒ saveName().
//   isGenerated()        → boolean  Tên hiện tại là tên tự sinh (người chơi chưa tự đặt).
//   onNameChange(cb)     → () => void (huỷ đăng ký)  Gọi cb(name) khi tên đổi: ở trang này (setName / saveName / rerollName /
//                                   tên sinh lần đầu / máy chủ trả tên đã làm sạch) VÀ khi tab khác đổi (sự kiện "storage").
//   saveName(name, {syncBoard=true}?) → Promise<{ ok, name, error }>  Như setName nhưng hỏi bộ lọc máy chủ trước (POST /api/name/check), rồi đổi
//                                   tên trên bảng xếp hạng hôm nay nếu đã có danh tính. Mất mạng ⇒ vẫn lưu (máy chủ lọc lúc dùng tên).
//   rerollName()         → string   Đặt một tên tự sinh mới (nút "Tên ngẫu nhiên").
//   randomName(rand?)    → string   Một tên tự sinh mới (không lưu). rand: hàm () => [0,1) để test.
//   checkName(raw)       → { ok, name, error }   Chỉ kiểm, không lưu.
//   avatarSvg(name, px?) → string   Avatar pixel 8×8 (SVG) sinh từ tên — cùng tên ⇒ cùng avatar.
//   NAME_MIN = 2, NAME_MAX = 16, DEFAULT_NAME = "Người chơi" (tên máy chủ dùng khi tên bị lọc).
// Lưu ở localStorage "wgp.account.v1" { v:1, name, gen, asked, devId, sent } — bản lưu cũ (chưa có gen) vẫn đọc được, tên cũ giữ nguyên.
// Địa chỉ import hiện tại: "../_shared/account.js?v=name1" (sửa file này ⇒ tăng ?v= ở MỌI chỗ import).
// =================================================================================================================================
//
// Bảng xếp hạng (giai đoạn 1):
//   • Máy chủ có Supabase (/api/config → supabase:true): tải supabase-js v2 (ESM, bản cố định) từ jsDelivr, đăng nhập ẨN DANH
//     lần đầu cần (signInAnonymously), giữ phiên trong localStorage của supabase-js. Máy chủ chỉ tin access token này.
//   • Máy dev (board:"memory"): id ngẫu nhiên lưu cục bộ, gửi qua header x-dev-user (máy chủ thật không nhận header này).
//   • board:false: bảng xếp hạng tắt ⇒ mọi hàm trả null / lỗi "off", trang tự ẩn phần bảng.
// Sau này "Liên kết Google/Facebook": linkIdentity(provider) bên dưới (chưa có giao diện).

export const STORE_KEY = "wgp.account.v1";
export const SUPABASE_ESM = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.9/+esm";
export const DEFAULT_NAME = "Người chơi";
export const NAME_MIN = 2, NAME_MAX = 16;

// ---------- Kho tên tự sinh: "<Con vật / Danh xưng> <Tính từ> <2 số>" ----------
// Trộn kiểu cute và kiểu "cục súc" hài (người lớn cũng chơi). Không tục, không xúc phạm, không vùng miền / giới tính / ngoại hình
// của NGƯỜI ("Mập", "Ú Nu" chỉ tả con vật). Mọi tổ hợp đã duyệt qua bộ lọc máy chủ: games-server/name-gen.test.mjs.
// Thêm từ: thêm vào danh sách rồi chạy `node --test games-server/name-gen.test.mjs`.
export const NAME_HEADS = [
  "Heo", "Mèo", "Gấu", "Vịt", "Cáo", "Thỏ", "Gà", "Cún", "Khỉ", "Sóc", "Rùa", "Cú", "Hổ", "Voi", "Nai", "Ếch", "Cua", "Tôm",
  "Chuột", "Ong", "Hà Mã", "Gấu Trúc", "Cánh Cụt", "Kỳ Lân", "Cá Mập", "Sư Tử", "Mèo Mun", "Bạch Tuộc",
  "Trùm", "Đại Ca", "Cao Thủ", "Hiệp Sĩ", "Ninja", "Thánh", "Sư Phụ", "Đại Hiệp", "Thủ Lĩnh", "Pháp Sư",
];
export const NAME_TAILS = [
  // cute
  "Cute", "Mập", "Xinh", "Ngoan", "Lém Lỉnh", "Tí Hon", "Đáng Yêu", "Vui Vẻ", "Hớn Hở", "Lon Ton", "Lắc Lư", "Mũm Mĩm",
  "Bông", "Siêu Tốc", "Dễ Thương", "Ham Ăn", "Ngủ Gật", "Tò Mò", "Nhanh Nhảu", "Ú Nu",
  // cục súc hài
  "Cáu Kỉnh", "Láo", "Lầy", "Cục Súc", "Khó Ở", "Hổ Báo", "Lì Lợm", "Gắt", "Liều", "Lười", "Ngầu", "Bá Đạo", "Quậy", "Hấp Tấp",
  "Cà Khịa", "Bất Ổn", "Báo Thủ", "Nóng Tính", "Hẻm", "Xóm", "Phố", "Mặn Mòi",
];
const PAIR_MAX = NAME_MAX - 3; // chừa chỗ cho " NN"
let pairsCache = null;
/** Mọi cặp [đầu, đuôi] dùng được (đủ ngắn để thêm " NN" vẫn ≤ 16 ký tự). */
export function allNamePairs() {
  if (!pairsCache) {
    pairsCache = [];
    for (const h of NAME_HEADS) for (const t of NAME_TAILS) if ([...(h + " " + t)].length <= PAIR_MAX) pairsCache.push([h, t]);
  }
  return pairsCache;
}
function rnd01() {
  const c = globalThis.crypto;
  if (c && c.getRandomValues) { const a = new Uint32Array(1); c.getRandomValues(a); return a[0] / 4294967296; }
  return Math.random();
}
export function randomName(rand = rnd01) {
  const P = allNamePairs();
  const [h, t] = P[Math.floor(rand() * P.length) % P.length];
  return `${h} ${t} ${String(Math.floor(rand() * 100) % 100).padStart(2, "0")}`;
}

/** Làm sạch + kiểm tên người chơi gõ (cùng luật ký tự với máy chủ: games-server/account/names.mjs). Không lưu. */
export function checkName(raw) {
  const s0 = String(raw ?? "").normalize("NFC").replace(/[\t\n\r\v\f\x85]/g, " ").replace(/\p{C}/gu, "").replace(/\s+/g, " ").trim();
  const s = s0.replace(/[^\p{L}\p{M}\p{N} ._\-']/gu, "").replace(/\s+/g, " ").trim();
  const n = [...s].length;
  if (!s0) return { ok: false, name: "", error: "Bạn chưa nhập tên." };
  if (s !== s0) return { ok: false, name: s, error: "Tên chỉ dùng chữ, số, dấu cách và . _ - '" };
  if (n < NAME_MIN) return { ok: false, name: s, error: `Tên cần ít nhất ${NAME_MIN} ký tự.` };
  if (n > NAME_MAX) return { ok: false, name: s, error: `Tên tối đa ${NAME_MAX} ký tự (đang có ${n}).` };
  if (!/[\p{L}\p{N}]/u.test(s)) return { ok: false, name: s, error: "Tên cần có chữ hoặc số." };
  return { ok: true, name: s, error: "" };
}

// ---------- Lưu cục bộ ----------
function ls() { try { return globalThis.localStorage || null; } catch { return null; } }
let memo = null; // máy không ghi được localStorage (chế độ riêng tư chặn, Node) ⇒ giữ trong bộ nhớ trang
function load() {
  try { const v = JSON.parse(ls()?.getItem(STORE_KEY) || "null"); if (v && v.v === 1) return { sent: {}, ...v }; } catch { /* hỏng ⇒ làm lại */ }
  return memo ? { ...memo, sent: { ...memo.sent } } : { v: 1, name: "", gen: false, asked: false, devId: "", sent: {} };
}
function save(st) { memo = st; try { ls()?.setItem(STORE_KEY, JSON.stringify(st)); return true; } catch { return false; } }

// Tên cũ trong từng game (trước khi có tên chung) — lần đầu ưu tiên tên này để người chơi không thấy tên lạ.
const LEGACY_KEYS = ["ma-soi:name", "dat-bom:name", "ai-la-noi-gian:name"];
function legacyName() {
  for (const k of LEGACY_KEYS) {
    let v = ""; try { v = ls()?.getItem(k) || ""; } catch { /* bỏ qua */ }
    const c = checkName(v);
    if (c.ok) return c.name;
  }
  return "";
}

// ---------- Theo dõi đổi tên ----------
const subs = new Set();
let lastName = null, storageHooked = false;
function emit(name) {
  if (name === lastName) return;
  lastName = name;
  for (const cb of [...subs]) { try { cb(name); } catch (e) { setTimeout(() => { throw e; }); } }
}
export function onNameChange(cb) {
  if (typeof cb !== "function") return () => {};
  subs.add(cb);
  if (lastName === null) lastName = getName();
  if (!storageHooked && typeof globalThis.addEventListener === "function") {
    storageHooked = true;
    globalThis.addEventListener("storage", (e) => { if (e.key === STORE_KEY || e.key === null) emit(getName()); });
  }
  return () => { subs.delete(cb); };
}

export function getName() {
  const st = load();
  if (st.name) return st.name;
  const old = legacyName();
  st.name = old || randomName();
  st.gen = !old;
  save(st);
  if (lastName !== null) emit(st.name);
  return st.name;
}
export function isGenerated() { getName(); return !!load().gen; }
/** Đã hỏi tên lần nào chưa (bản cũ hỏi tên ở bảng kết quả Thử thách; giờ tên tự sinh nên không hỏi nữa). */
export function wasAsked() { return !!load().asked; }
export function setName(name) {
  const c = checkName(name);
  if (!c.ok) return { ok: false, name: getName(), error: c.error };
  const st = load();
  st.name = c.name; st.gen = false; st.asked = true;
  save(st);
  emit(c.name);
  return { ok: true, name: c.name, error: "" };
}
/** Đặt một tên tự sinh mới, khác tên đang dùng. */
export function rerollName(rand) {
  const st = load();
  let n = st.name;
  for (let i = 0; i < 5 && n === st.name; i++) n = randomName(rand);
  st.name = n; st.gen = true;
  save(st);
  emit(n);
  return n;
}
function adoptServerName(name) {
  // Máy chủ trả tên đã làm sạch. "Người chơi" = tên bị lọc ⇒ giữ tên trên máy (đừng biến người chơi thành "Người chơi").
  if (!name || name === DEFAULT_NAME) return;
  const st = load();
  if (st.name === name) return;
  st.name = name; save(st); emit(name);
}

export async function saveName(name, { syncBoard = true } = {}) {
  const c = checkName(name);
  if (!c.ok) return { ok: false, name: getName(), error: c.error };
  let clean = c.name;
  try {
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    const tm = ctl && setTimeout(() => ctl.abort(), 6000);
    const r = await fetch("/api/name/check", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ name: clean }), signal: ctl?.signal, cache: "no-store" });
    clearTimeout(tm);
    if (r.ok) {
      const d = await r.json();
      if (d && d.ok === false) return { ok: false, name: getName(), error: "Tên này không dùng được, bạn chọn tên khác nhé." };
      if (d && typeof d.name === "string" && d.name) clean = d.name;
    }
  } catch { /* mất mạng ⇒ vẫn lưu trên máy; máy chủ lọc lúc dùng tên */ }
  const res = setName(clean);
  if (!res.ok || !syncBoard) return res;
  // Đã có danh tính trên bảng xếp hạng ⇒ đổi luôn tên trên bảng hôm nay (không tạo danh tính mới chỉ để đổi tên).
  (async () => {
    try {
      if ((await mode()) === "off") return;
      if (!Object.keys(await authHeaders({ create: false })).length) return;
      await renameMe(res.name);
    } catch { /* không bắt buộc */ }
  })();
  return res;
}

// ---------- Avatar pixel sinh từ tên ----------
function hash32(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const AV_COLORS = [
  ["#f7c96d", "#6b4a12"], ["#75d1bf", "#1d4d45"], ["#f29e8e", "#6b2a22"], ["#a9c6f5", "#25406b"],
  ["#c9a6f0", "#43296b"], ["#ffd9a0", "#7a4a16"], ["#9be08a", "#24521b"], ["#f5b5d2", "#6b2346"],
];
const AV_BG = ["#1b2a3d", "#20324a", "#1d2c41", "#24364d"];
/**
 * Avatar 8×8 ô (SVG, nét pixel): đầu bậc + tai (nhọn / tròn / dài) + mắt + miệng, màu theo tên.
 * Con vật nhận ra từ chữ đầu tên (Mèo, Cáo ⇒ tai nhọn; Thỏ ⇒ tai dài; Gấu, Heo, Chuột ⇒ tai tròn; Vịt, Gà, Ếch… ⇒ chỏm lông), còn lại theo hash.
 */
export function avatarSvg(name, px = 32) {
  const n = String(name || DEFAULT_NAME), h = hash32(n);
  const [fg, dk] = AV_COLORS[h % AV_COLORS.length], bg = AV_BG[(h >>> 3) % AV_BG.length];
  const first = n.split(" ")[0].toLowerCase();
  let ear = (h >>> 6) % 3; // 0 nhọn, 1 tròn, 2 dài, 3 chỏm lông (chim, ếch, cá…)
  if (/^(mèo|cáo|hổ|sư)$/.test(first)) ear = 0; else if (/^(gấu|heo|chuột|khỉ|sóc)$/.test(first)) ear = 1; else if (first === "thỏ") ear = 2;
  else if (/^(vịt|gà|cú|cánh|ong|ếch|cua|tôm|rùa|cá|bạch|kỳ)$/.test(first)) ear = 3;
  const eye = (h >>> 9) % 3; // 0 tròn xoe, 1 lim dim, 2 cau mày
  const r = (x, y, w, hh, c) => `<rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="${c}"/>`;
  let s = r(0, 0, 8, 8, bg);
  if (ear === 0) s += r(1, 1, 1, 2, fg) + r(6, 1, 1, 2, fg) + r(2, 2, 1, 1, fg) + r(5, 2, 1, 1, fg);
  else if (ear === 1) s += r(1, 1, 2, 2, fg) + r(5, 1, 2, 2, fg) + r(2, 2, 1, 1, dk) + r(5, 2, 1, 1, dk);
  else if (ear === 2) s += r(2, 0, 1, 3, fg) + r(5, 0, 1, 3, fg);
  else s += r(3, 1, 1, 2, dk) + r(4, 2, 1, 1, dk);
  s += r(2, 3, 4, 1, fg) + r(1, 4, 6, 3, fg) + r(2, 7, 4, 1, fg);
  if (eye === 0) s += r(2, 4, 1, 2, "#0a111c") + r(5, 4, 1, 2, "#0a111c");
  else if (eye === 1) s += r(2, 5, 1, 1, "#0a111c") + r(5, 5, 1, 1, "#0a111c") + r(1, 4, 2, 1, dk) + r(5, 4, 2, 1, dk);
  else s += r(2, 5, 1, 1, "#0a111c") + r(5, 5, 1, 1, "#0a111c") + r(2, 4, 1, 1, dk) + r(5, 4, 1, 1, dk);
  s += r(3, 6, 2, 1, dk);
  if ((h >>> 12) & 1) s += r(1, 6, 1, 1, "#e98a7a") + r(6, 6, 1, 1, "#e98a7a");
  return `<svg class="px-avatar" viewBox="0 0 8 8" width="${px}" height="${px}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${s}</svg>`;
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
  const r = await api(`/api/daily/${encodeURIComponent(game)}/${day | 0}`, { method: "POST", body: { name: name || getName(), proof } });
  markSent(game, day);
  if (r && r.name) adoptServerName(r.name);
  return r;
}
/** Đổi tên hiển thị (profile + tên trên bảng hôm nay). Trả về tên đã làm sạch. */
export async function renameMe(name) {
  const r = await api("/api/daily/name", { method: "POST", body: { name: String(name || "") } });
  adoptServerName(r.name);
  return r.name;
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
