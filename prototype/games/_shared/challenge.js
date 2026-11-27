// "Thách cùng màn" — module dùng chung cho game chơi một mình (Đợt 10: Đào Vàng, 2048, Rắn Săn Mồi). API: docs/audits/fixes/D10-viral.md.
//   import * as CH from "../_shared/challenge.js?v=ch1";
// Link: https://<domain>/games/<thư mục>/?thach=<seed>.<điểm>[.<tên>]  — seed uint32, điểm số nguyên ≤ 99.999.999, tên ≤ 16 ký tự
// (đã qua bộ lọc tên: tên tự sinh dùng thẳng, tên tự đặt hỏi /api/name/check; không sạch / mất mạng ⇒ bỏ tên).
// Game nào cần thêm biến thể (chế độ, cỡ bàn) thì gói vào vài bit thấp của seed: seedWithVariant / variantOf.
import { SITE_URL } from "./site.js";
import { GAMES_META } from "./games-meta.js";
import { ev } from "./stats.js?v=st1";
import { shareLink } from "./share.js?v=s3";
import * as acc from "./account.js?v=d6g";

export const PARAM = "thach";
export const SEED_MAX = 0xffffffff;
export const SCORE_MAX = 99_999_999;
export const NAME_MAX = 16;
export const BAD_LINK_TEXT = "Link thách không hợp lệ";
const FALLBACK_NAME = "bạn bè";

export const fmt = (n) => Math.max(0, Math.floor(Number(n) || 0)).toLocaleString("vi-VN");
const cut = (s, n = NAME_MAX) => [...String(s ?? "")].slice(0, n).join("").trim();
const gameName = (game) => (GAMES_META[game] && GAMES_META[game].name) || "Lụm Kèo";

// ───────────────────────── phần thuần (test Node) ─────────────────────────

/**
 * Đọc ?thach= trong chuỗi query. Không có ⇒ null. Hỏng ⇒ { ok:false }. Đúng ⇒ { ok:true, seed, score, name }.
 * name ở đây mới chỉ qua kiểm ký tự (checkName); hiển thị phải dùng safeName() (bộ lọc từ tục ở máy chủ).
 */
export function parseChallenge(search = "") {
  let p;
  try { p = new URLSearchParams(search); } catch { return null; }
  if (!p.has(PARAM)) return null;
  const m = /^(\d{1,10})\.(\d{1,9})(?:\.([\s\S]*))?$/.exec(String(p.get(PARAM) || "").trim());
  if (!m) return { ok: false };
  const seed = Number(m[1]), score = Number(m[2]);
  if (!Number.isSafeInteger(seed) || seed > SEED_MAX || !Number.isSafeInteger(score) || score > SCORE_MAX) return { ok: false };
  let name = "";
  if (m[3]) { const c = acc.checkName(cut(m[3], 40)); if (c.ok) name = cut(c.name); }
  return { ok: true, seed, score, name };
}

/** Giá trị của ?thach= (tên đã encodeURIComponent). */
export function formatChallenge({ seed, score, name = "" }) {
  const n = cut(name);
  return `${Number(seed) >>> 0}.${Math.min(SCORE_MAX, Math.max(0, Math.floor(Number(score) || 0)))}${n ? "." + encodeURIComponent(n) : ""}`;
}

/** Link thách đầy đủ trên domain thật (SITE_URL trong _shared/site.js). */
export function challengeUrl(game, c, base = SITE_URL) {
  const folder = (GAMES_META[game] && GAMES_META[game].folder) || game;
  return `${String(base).replace(/\/+$/, "")}/games/${folder}/?${PARAM}=${formatChallenge(c)}`;
}

/** Câu chữ kèm link. back = gửi lại sau ván thách: { them, theirName, won }. */
export function challengeText({ game, score, back = null }) {
  const g = gameName(game);
  if (back && back.won) return `Mình vừa vượt ${back.theirName || "bạn"} với ${fmt(score)} điểm ở màn ${g} này trên Lụm Kèo. Tới lượt bạn gỡ đó! ⚔`;
  if (back) return `Mình được ${fmt(score)} điểm, chưa qua mặt được ${back.theirName || "bạn"}. Thêm ván nữa cùng màn ${g} này nha! ⚔`;
  return `Mình được ${fmt(score)} điểm ở màn này của ${g} trên Lụm Kèo, bạn vượt nổi không? ⚔`;
}

/** Kết quả so điểm: "win" | "lose" | "tie". */
export const verdict = (me, them) => (me > them ? "win" : me < them ? "lose" : "tie");

/** Gói biến thể (0..k-1) vào seed: seed % k === variant. Dùng cho chế độ / cỡ bàn (vd Rắn k=2, 2048 k=3). */
export function seedWithVariant(raw, variant, k) {
  let x = (Number(raw) >>> 0) - ((Number(raw) >>> 0) % k) + (variant % k);
  if (x > SEED_MAX) x -= k;
  return x >>> 0;
}
export const variantOf = (seed, k) => (Number(seed) >>> 0) % k;

// ───────────────────────── tên người chơi (bộ lọc) ─────────────────────────

/**
 * Tên an toàn để hiện / gắn vào link, hoặc "" (bỏ tên). Tên tự sinh ("Heo Cute 15") đã duyệt sẵn ⇒ dùng thẳng;
 * tên khác hỏi bộ lọc máy chủ POST /api/name/check (cùng bộ lọc với phòng online / bảng xếp hạng). Lỗi / quá giờ ⇒ "".
 */
export async function safeName(raw, { fetch: f = globalThis.fetch, timeoutMs = 1500 } = {}) {
  const c = acc.checkName(raw);
  if (!c.ok) return "";
  const n = cut(c.name);
  if (acc.looksGenerated(n)) return n;
  if (typeof f !== "function") return "";
  try {
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    const tm = ctl && setTimeout(() => ctl.abort(), timeoutMs);
    const r = await f("/api/name/check", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ name: n }), signal: ctl?.signal, cache: "no-store" });
    clearTimeout(tm);
    if (!r.ok) return "";
    const d = await r.json();
    if (!d || d.ok !== true || typeof d.name !== "string") return "";
    const clean = cut(d.name);
    return clean && clean !== acc.DEFAULT_NAME && acc.checkName(clean).ok ? clean : "";
  } catch { return ""; }
}

let myNameP = null;
/** Tên của chính mình (tài khoản / tên khách) đã lọc — hỏi một lần, nhớ lại. */
export function myName() {
  if (!myNameP) myNameP = (async () => { try { return await safeName(acc.getName()); } catch { return ""; } })();
  return myNameP;
}

// ───────────────────────── trình duyệt ─────────────────────────

const CSS = `
.lk-chal{margin:12px 3px 4px;padding:10px 12px;display:grid;gap:4px;text-align:center;font:600 15px/1.4 "Be Vietnam Pro",system-ui,sans-serif;
  color:var(--ink,#f4ead2);background:var(--panel2,#262019);box-shadow:0 0 0 3px var(--line,#0a0807)}
.lk-chal p{margin:0}
.lk-chal__from{font-size:15px}
.lk-chal__from b,.lk-chal__vs b{color:var(--gold,#ffc94a);font-weight:800;font-variant-numeric:tabular-nums}
.lk-chal__note{font-size:13px;color:var(--soft,#b9ad93)}
.lk-chal__vs{display:flex;flex-wrap:wrap;justify-content:center;gap:2px 10px;font-size:18px;font-weight:800}
.lk-chal__vs span{white-space:nowrap}
.lk-chal__vs .lk-chal__me b{color:#9be08a}
.lk-chal__verdict{font-size:14px;font-weight:700;color:var(--soft,#b9ad93)}
.lk-chal__verdict.is-win{color:#9be08a}.lk-chal__verdict.is-lose{color:#ff9c8c}
.lk-chal-toast{position:fixed;left:50%;bottom:max(18px,env(safe-area-inset-bottom,0px));z-index:2147483001;transform:translateX(-50%);max-width:calc(100% - 32px);
  padding:10px 14px;font:700 14px/1.35 "Be Vietnam Pro",system-ui,sans-serif;color:#f5f2e8;background:#3a1d18;text-align:center;
  box-shadow:0 -3px 0 0 #0a0807,0 3px 0 0 #0a0807,-3px 0 0 0 #0a0807,3px 0 0 0 #0a0807,4px 6px 0 0 rgba(0,0,0,.55)}
`;
function ensureCss() {
  if (typeof document === "undefined" || document.getElementById("lk-chal-css")) return;
  const st = document.createElement("style"); st.id = "lk-chal-css"; st.textContent = CSS; document.head.appendChild(st);
}
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

/** Thông báo nhỏ đáy màn (vd "Link thách không hợp lệ"). */
export function toast(msg, ms = 3200) {
  if (typeof document === "undefined") return;
  ensureCss();
  document.querySelector(".lk-chal-toast")?.remove();
  const t = el("div", "lk-chal-toast", msg);
  t.setAttribute("role", "status"); t.setAttribute("aria-live", "polite");
  document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

/** Bỏ ?thach= khỏi thanh địa chỉ (link hỏng, hoặc rời chế độ thách) — tải lại trang sẽ là chơi thường. */
export function stripParam(loc = globalThis.location, hist = globalThis.history) {
  try {
    const u = new URL(loc.href);
    if (!u.searchParams.has(PARAM)) return;
    u.searchParams.delete(PARAM);
    hist.replaceState(hist.state, "", u.pathname + (u.search || "") + u.hash);
  } catch { /* bỏ qua */ }
}

/**
 * Đọc link thách khi mở trang. Không có ⇒ null. Hỏng ⇒ toast "Link thách không hợp lệ", bỏ tham số, trả null (game chơi thường).
 * Đúng ⇒ đếm "challenge_open" và trả object thách: { game, seed, score, name (đã lọc, có thể ""), ready: Promise<name>, done(myScore) }.
 */
export function readChallenge(game, { search = globalThis.location?.search || "" } = {}) {
  const c = parseChallenge(search);
  if (!c) return null;
  if (!c.ok) { toast(BAD_LINK_TEXT); stripParam(); return null; }
  ev("challenge_open", game);
  myName(); // hỏi trước tên của mình (để nút "Thách lại" không phải chờ)
  let doneOnce = false;
  const ch = { game, seed: c.seed, score: c.score, name: acc.looksGenerated(c.name) ? c.name : "", rawName: c.name };
  ch.ready = c.name ? safeName(c.name).then((n) => (ch.name = n)) : Promise.resolve("");
  /** Gọi khi người nhận chơi xong ván thách (đếm "challenge_done" một lần). */
  ch.done = () => { if (!doneOnce) { doneOnce = true; ev("challenge_done", game); } };
  return ch;
}

/** Khung "⚔ Thách đấu từ Minh: 1.240 điểm. Cùng màn, chơi thử xem!" — game đặt vào thẻ của mình, nút bắt đầu do game vẽ. */
export function introBox(ch) {
  ensureCss();
  const box = el("div", "lk-chal");
  box.setAttribute("role", "note");
  const p = el("p", "lk-chal__from");
  const who = el("b", "lk-chal__name", ch.name || FALLBACK_NAME), sc = el("b", null, fmt(ch.score));
  p.append("⚔ Thách đấu từ ", who, ": ", sc, " điểm.");
  box.append(p, el("p", "lk-chal__note", "Cùng màn, chơi thử xem!"));
  ch.ready?.then((n) => { who.textContent = n || FALLBACK_NAME; });
  return box;
}

/** Khung so điểm cuối ván: "Bạn 980 – Minh 1.240" + dòng thắng/thua. */
export function compareBox(ch, me) {
  ensureCss();
  const box = el("div", "lk-chal lk-chal--cmp");
  box.setAttribute("role", "status");
  const v = verdict(me, ch.score), them = ch.name || "Bạn kia";
  const vs = el("p", "lk-chal__vs");
  const a = el("span", "lk-chal__me"); a.append("Bạn ", el("b", null, fmt(me)));
  const b = el("span", "lk-chal__them"); b.append(them + " ", el("b", null, fmt(ch.score)));
  vs.append(a, "–", b);
  const line = v === "win" ? `Bạn thắng rồi! Gửi lại cho ${ch.name || "bạn ấy"} xem nào.`
    : v === "tie" ? "Hoà! Cùng màn mà bằng điểm luôn, thêm ván nữa không?"
    : `Thiếu ${fmt(ch.score - me)} điểm nữa thôi. Thách lại xem ai hơn!`;
  box.append(vs, el("p", "lk-chal__verdict is-" + v, line));
  box.dataset.verdict = v;
  return box;
}

/**
 * Bấm "Thách bạn" (cuối ván thường) hoặc "Thách lại" (cuối ván thách): đếm "challenge_click", tạo link cùng seed + điểm của mình
 * + tên mình (đã lọc), rồi chia sẻ (điện thoại: bảng chia sẻ hệ thống; máy tính: Chép link / Facebook / Messenger / Zalo).
 * against: object thách đang chơi (khi "Thách lại") để câu chữ nói đúng thắng / thua.
 */
export async function shareChallenge({ game, seed, score, against = null, accent }) {
  ev("challenge_click", game);
  // không chờ mạng lâu: bảng chia sẻ hệ thống cần "cú bấm" còn hiệu lực ⇒ tên chưa lọc xong trong 250 ms thì bỏ tên
  const name = await Promise.race([myName(), new Promise((r) => setTimeout(() => r(""), 250))]);
  const url = challengeUrl(game, { seed, score, name });
  const back = against ? { won: score > against.score, theirName: against.name } : null;
  return shareLink({ game, url, text: challengeText({ game, score, back }), title: against ? "Thách lại" : "Thách bạn", accent });
}
