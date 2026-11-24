// Thử thách hôm nay — lõi chung (ES module, không DOM ở phần lõi, chạy được bằng Node).
// Mỗi ngày (theo giờ Việt Nam, UTC+7) mọi người chơi cùng một đề. Không cần server, không cần tài khoản:
// đề sinh từ hạt (game, số ngày); kết quả + chuỗi ngày lưu trong localStorage "wgp.daily.v1".
//
// NGÀY RA MẮT: Thử thách #1 = 24/11/2026 (giờ VN, là "hôm nay" lúc viết tính năng này). Trước ngày đó dayNumber() vẫn trả 1.
// Đổi ngày ra mắt sẽ làm đổi số thứ tự + đề của mọi ngày ⇒ đừng đổi sau khi đã lên bản thật.

export const LAUNCH = { y: 2026, m: 11, d: 24 };
export const VN_OFFSET = 7 * 3600 * 1000;
export const DAY_MS = 86400 * 1000;
export const STORE_KEY = "wgp.daily.v1";
export const SITE = "https://lumkeo.com";
const KEEP_DAYS = 60; // giữ kết quả chi tiết 60 ngày gần nhất

/** Các game có thử thách. path = thư mục trong prototype/games/. */
export const GAMES = {
  sudoku: { id: "sudoku", name: "Sudoku", path: "sudoku" },
  "2048": { id: "2048", name: "2048", path: "2048", moveLimit: 150 },
  "do-vui-nhanh": { id: "do-vui-nhanh", name: "Đố Vui", path: "do-vui-nhanh", questions: 5 },
};
export const GAME_IDS = Object.keys(GAMES);

// ---------- Ngày theo giờ Việt Nam ----------
const LAUNCH_UTC = Date.UTC(LAUNCH.y, LAUNCH.m - 1, LAUNCH.d); // 0h ngày ra mắt "theo lịch VN" tính như UTC
/** Số thứ tự ngày (1 = ngày ra mắt) theo giờ VN. */
export function dayNumber(now = Date.now()) {
  const n = Math.floor((now + VN_OFFSET - LAUNCH_UTC) / DAY_MS) + 1;
  return Math.max(1, n);
}
/** Thời điểm (ms UTC) 0h giờ VN bắt đầu ngày n. */
export function dayStart(n) { return LAUNCH_UTC + (n - 1) * DAY_MS - VN_OFFSET; }
/** "dd/mm/yyyy" của ngày n theo lịch VN. */
export function dateLabel(n) {
  const t = new Date(LAUNCH_UTC + (n - 1) * DAY_MS);
  return `${String(t.getUTCDate()).padStart(2, "0")}/${String(t.getUTCMonth() + 1).padStart(2, "0")}/${t.getUTCFullYear()}`;
}
/** Số ms tới 0h giờ VN kế tiếp (lúc có đề mới). */
export function msUntilNext(now = Date.now()) {
  const vn = now + VN_OFFSET;
  return DAY_MS - (((vn % DAY_MS) + DAY_MS) % DAY_MS);
}
/** "hh:mm:ss" */
export function fmtCountdown(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const p = (x) => String(x).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}
export function fmtTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  const m = Math.floor(sec / 60), s = sec % 60;
  return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

// ---------- RNG có hạt ----------
/** Băm chuỗi → số nguyên 32 bit (FNV-1a + trộn cuối kiểu murmur). */
export function hashSeed(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h | 0;
}
/** Hạt của đề (game, ngày). Kết quả là int32 (dùng thẳng cho seed của các game). */
export function seedFor(game, day) { return hashSeed(`lumkeo-daily:${game}:${day}`); }
/** mulberry32: trả về hàm () => số [0, 1). */
export function rng(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Chọn k phần tử (chỉ số 0..poolSize-1) cho ngày `day`, không lặp phần tử đã ra trong `windowDays` ngày trước nếu đủ.
 * Cửa sổ thực tế = min(windowDays, floor(poolSize / k) - 1) để luôn còn ≥ k phần tử chưa dùng.
 * Mô phỏng tuần tự từ ngày 1 (rẻ: vài chục nghìn phép tính mỗi năm) ⇒ thuần, ai tính cũng ra cùng kết quả.
 */
const pickCache = new Map();
export function pickNoRepeat(game, day, poolSize, k, windowDays = 30) {
  k = Math.min(k, poolSize);
  const win = Math.max(0, Math.min(windowDays, Math.floor(poolSize / k) - 1));
  const key = `${game}|${poolSize}|${k}|${win}`;
  let c = pickCache.get(key);
  if (!c) { c = { days: [] }; pickCache.set(key, c); }
  for (let d = c.days.length + 1; d <= day; d++) {
    const recent = new Set();
    for (let b = Math.max(1, d - win); b < d; b++) for (const x of c.days[b - 1]) recent.add(x);
    const r = rng(seedFor(game + "#pick", d));
    const fresh = [], old = [];
    for (let i = 0; i < poolSize; i++) (recent.has(i) ? old : fresh).push(i);
    for (const a of [fresh, old]) for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    c.days.push([...fresh, ...old].slice(0, k));
  }
  return c.days[Math.max(1, day) - 1].slice();
}

// ---------- Lưu trữ ----------
function defaultStorage() { try { return globalThis.localStorage || null; } catch { return null; } }
function blank() { return { v: 1, games: {} }; }
function blankGame() { return { days: {}, last: 0, streak: 0, maxStreak: 0, played: 0, perfect: 0, progress: null }; }

export function loadStore(storage = defaultStorage()) {
  try {
    const raw = storage && storage.getItem(STORE_KEY);
    const v = raw ? JSON.parse(raw) : null;
    if (v && v.v === 1 && v.games && typeof v.games === "object") return v;
  } catch { /* hỏng → làm lại */ }
  return blank();
}
export function saveStore(st, storage = defaultStorage()) {
  try { if (storage) storage.setItem(STORE_KEY, JSON.stringify(st)); return true; } catch { return false; }
}
function gameRec(st, game) {
  const g = st.games[game];
  if (g && typeof g === "object" && g.days && typeof g.days === "object") return g;
  return (st.games[game] = blankGame());
}

/** Kết quả đã lưu của (game, ngày) hoặc null. */
export function getResult(game, day = dayNumber(), storage) {
  const g = loadStore(storage).games[game];
  return (g && g.days && g.days[day]) || null;
}
export const isDone = (game, day = dayNumber(), storage) => !!getResult(game, day, storage);

/** Chuỗi ngày hiện tại (đã đứt nếu bỏ qua cả hôm qua lẫn hôm nay ⇒ 0). */
export function currentStreak(g, day) {
  if (!g || !g.last) return 0;
  return g.last >= day - 1 ? g.streak : 0;
}

/** Thống kê để hiện ra: { streak, maxStreak, played, perfect, doneToday, result } */
export function stats(game, day = dayNumber(), storage) {
  const g = loadStore(storage).games[game] || blankGame();
  return {
    streak: currentStreak(g, day), maxStreak: g.maxStreak | 0, played: g.played | 0, perfect: g.perfect | 0,
    doneToday: !!(g.days && g.days[day]), result: (g.days && g.days[day]) || null,
  };
}

/**
 * Ghi kết quả ngày `day`. Mỗi ngày chỉ ghi 1 lần (lần sau bỏ qua, trả về kết quả cũ).
 * result: dữ liệu riêng của game (time, mistakes, …). Thêm { day, at, perfect }.
 */
export function record(game, day, result, { storage, now = Date.now() } = {}) {
  const st = loadStore(storage);
  const g = gameRec(st, game);
  if (g.days[day]) return { ...stats(game, day, storage), already: true };
  const perfect = isPerfect(game, result);
  g.days[day] = { ...result, day, at: now, perfect };
  if (g.last === day - 1) g.streak = (g.streak | 0) + 1;
  else if (g.last !== day) g.streak = 1;
  if (day > g.last) g.last = day;
  g.maxStreak = Math.max(g.maxStreak | 0, g.streak);
  g.played = (g.played | 0) + 1;
  if (perfect) g.perfect = (g.perfect | 0) + 1;
  if (g.progress && g.progress.day === day) g.progress = null;
  for (const k of Object.keys(g.days)) if (+k < day - KEEP_DAYS) delete g.days[k];
  saveStore(st, storage);
  return { ...stats(game, day, storage), already: false };
}

/** Ván daily đang chơi dở (để tải lại trang không mất / không chơi lại được). */
export function loadProgress(game, day, storage) {
  const g = loadStore(storage).games[game];
  return g && g.progress && g.progress.day === day ? g.progress.data : null;
}
export function saveProgress(game, day, data, storage) {
  const st = loadStore(storage);
  const g = gameRec(st, game);
  if (g.days[day]) return false; // đã xong thì thôi
  g.progress = { day, data };
  return saveStore(st, storage);
}

// ---------- Ô kết quả (emoji) ----------
function isPerfect(game, r) {
  if (!r) return false;
  if (game === "sudoku") return (r.mistakes | 0) === 0 && (r.hints | 0) === 0;
  if (game === "2048") return (r.maxTile | 0) >= 2048;
  if (game === "do-vui-nhanh") return Array.isArray(r.marks) && r.marks.length > 0 && r.marks.every(Boolean);
  return false;
}
export const MILESTONES_2048 = [128, 256, 512, 1024, 2048];
const TILE_EMOJI = { 128: "🟦", 256: "🟩", 512: "🟪", 1024: "🟧", 2048: "🟨" };

/** Dòng emoji không lộ đáp án. */
export function grid(game, r) {
  if (!r) return "";
  if (game === "sudoku") {
    // mỗi ô = 2 phút: 3 ô đầu xanh (≤ 6'), 3 ô tiếp vàng (≤ 12'), còn lại đỏ; tối đa 10 ô
    const n = Math.max(1, Math.min(10, Math.ceil((r.time || 0) / 120)));
    let bar = "";
    for (let i = 0; i < n; i++) bar += i < 3 ? "🟩" : i < 6 ? "🟨" : "🟥";
    if ((r.time || 0) > 1200) bar += "➕";
    return `⏱️${bar} ${fmtTime(r.time)}${(r.mistakes | 0) === 0 ? " ⭐" : ""}`;
  }
  if (game === "2048") {
    return MILESTONES_2048.map((m) => ((r.maxTile | 0) >= m ? TILE_EMOJI[m] : "⬜")).join("");
  }
  if (game === "do-vui-nhanh") {
    return (r.marks || []).map((ok) => (ok ? "🟩" : "🟥")).join("");
  }
  return "";
}
/** Dòng phụ dưới ô emoji (số liệu, không lộ đáp án). */
export function detail(game, r) {
  if (!r) return "";
  const fmtN = (n) => Math.round(n || 0).toLocaleString("vi-VN");
  if (game === "sudoku") return `Lỗi ${r.mistakes | 0} · Gợi ý ${r.hints | 0}`;
  if (game === "2048") return `Ô lớn nhất ${r.maxTile | 0} · ${fmtN(r.score)} điểm`;
  if (game === "do-vui-nhanh") return `Đúng ${(r.marks || []).filter(Boolean).length}/${(r.marks || []).length} · ⏱️ ${secs(r.ms)}`;
  return "";
}
/** Tóm tắt rất ngắn cho thẻ trang chủ: "4:12 ⭐" / "Ô 512" / "4/5". */
export function short(game, r) {
  if (!r) return "";
  if (game === "sudoku") return fmtTime(r.time) + ((r.mistakes | 0) === 0 ? " ⭐" : "");
  if (game === "2048") return `Ô ${r.maxTile | 0}`;
  if (game === "do-vui-nhanh") return `${(r.marks || []).filter(Boolean).length}/${(r.marks || []).length}`;
  return "";
}
function secs(ms) { return (Math.round((ms || 0) / 100) / 10).toString().replace(".", ",") + " giây"; }

export function shareUrl(game) {
  const p = (GAMES[game] && GAMES[game].path) || game;
  return `${SITE}/games/${p}/?daily=1&ref=daily`;
}

/** Chuỗi chia sẻ kiểu Wordle. result phải có .day (record() tự thêm); streak lấy từ opts hoặc kho. */
export function shareText(game, result, { streak, storage } = {}) {
  const day = (result && result.day) || dayNumber();
  const name = (GAMES[game] && GAMES[game].name) || game;
  if (streak == null) streak = stats(game, day, storage).streak;
  const lines = [`Lụm Kèo · Thử thách #${day} · ${name}`, grid(game, result)];
  const d = detail(game, result);
  if (d && game !== "sudoku") lines.push(d);
  else if (game === "sudoku" && ((result.mistakes | 0) || (result.hints | 0))) lines.push(d);
  if (streak > 0) lines.push(`🔥 Chuỗi ${streak} ngày`);
  lines.push(shareUrl(game));
  return lines.join("\n");
}

// ---------- Chia sẻ (trình duyệt) ----------
/**
 * Điện thoại (chạm): navigator.share({ text }). Máy tính hoặc không có share: chép vào clipboard.
 * Trả về "shared" | "copied" | "cancelled" | "failed". Tự hiện thông báo nhỏ nếu có document.
 */
export async function share(text, { forceCopy = false } = {}) {
  const nav = globalThis.navigator;
  const coarse = !!(globalThis.matchMedia && globalThis.matchMedia("(pointer: coarse)").matches);
  if (!forceCopy && nav && typeof nav.share === "function" && coarse) {
    try { await nav.share({ text }); return "shared"; }
    catch (e) { if (e && e.name === "AbortError") return "cancelled"; /* lỗi khác → chép */ }
  }
  const ok = await copyText(text);
  toast(ok ? "Đã chép, dán vào Zalo / Facebook nhé" : "Không chép được, hãy chụp màn hình nhé");
  return ok ? "copied" : "failed";
}
export async function copyText(text) {
  const nav = globalThis.navigator;
  try { if (nav && nav.clipboard && nav.clipboard.writeText) { await nav.clipboard.writeText(text); return true; } } catch { /* thử cách cũ */ }
  try {
    const d = globalThis.document; if (!d) return false;
    const ta = d.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
    d.body.appendChild(ta); ta.select();
    const ok = d.execCommand("copy"); ta.remove();
    return !!ok;
  } catch { return false; }
}
/** Thông báo nhỏ kiểu pixel ở cạnh dưới màn hình. */
export function toast(msg, ms = 2600) {
  const d = globalThis.document; if (!d || !d.body) return null;
  let el = d.getElementById("dailyToast");
  if (!el) {
    el = d.createElement("div"); el.id = "dailyToast"; el.setAttribute("role", "status");
    el.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9999;max-width:calc(100% - 32px);padding:10px 16px;"
      + "font:800 14px/1.35 'Be Vietnam Pro',system-ui,sans-serif;color:#effff9;background:#1f5a52;text-align:center;"
      + "box-shadow:0 -3px 0 0 #0a111c,0 3px 0 0 #0a111c,-3px 0 0 0 #0a111c,3px 0 0 0 #0a111c,4px 6px 0 0 rgba(0,0,0,.55);pointer-events:none";
    d.body.appendChild(el);
  }
  el.textContent = msg; el.hidden = false;
  clearTimeout(el._t); el._t = setTimeout(() => { el.hidden = true; }, ms);
  return el;
}

/** Trang hiện tại có đang ở chế độ thử thách (?daily=1) không. */
export function isDailyURL(search = (globalThis.location && globalThis.location.search) || "") {
  try { const v = new URLSearchParams(search).get("daily"); return v === "1" || v === "true"; } catch { return false; }
}
