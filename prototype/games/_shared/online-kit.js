// Đồ dùng chung cho 10 game online của Lụm Kèo (Đợt 3 — D3-online):
//   • Tên dùng chung: ô nhập tên mỗi game điền sẵn tên của tài khoản (_shared/account.js, "wgp.account.v1") — gõ một lần,
//     game nào cũng có; sửa tên trong game ⇒ account.setName() ⇒ mọi game + bảng xếp hạng cùng đổi.
//     Người cũ đã có tên lưu riêng ở game (vd "wgp.caro.name"): lần đầu mở game sau bản này, nếu tài khoản CHƯA có tên do
//     người dùng tự đặt thì chuyển tên đó sang tài khoản (một lần cho mỗi game, đánh dấu ở "wgp.names.migrated").
//     Khoá cũ KHÔNG bị xoá (game vẫn ghi tiếp, để quay về bản cũ vẫn thấy tên).
//   • Mã phiên `sid` (localStorage "wgp.sid", 32 hex ngẫu nhiên) gửi kèm create / join / resume: máy chủ dùng để chặn người
//     bị chủ phòng "Mời ra" vào lại phòng đó 10 phút (games-server/kick.js) — theo phiên trình duyệt, không theo IP.
//   • Câu báo khi bị mời ra / bị chặn.
// Chịu được cả account.js bản cũ (getName() có thể rỗng, setName() trả chuỗi) lẫn bản mới (tên khách tự sinh, setName() trả
// { ok, name, error }, onNameChange(cb)).
import * as acc from "./account.js?v=board2";

export const KICKED_TEXT = "Chủ phòng đã mời bạn ra khỏi phòng.";
export const BANNED_TEXT = "Chủ phòng đã mời bạn ra khỏi phòng này — 10 phút nữa mới vào lại được. Bạn vẫn tạo hoặc vào phòng khác được nhé.";
export const KICK_ERR = { target: "Người này không còn trong phòng.", phase: "Chỉ mời ra được khi chưa chơi hoặc ván đã xong." };

const SID_KEY = "wgp.sid", MIG_KEY = "wgp.names.migrated", ACC_KEY = acc.STORE_KEY || "wgp.account.v1";
const ls = () => { try { return globalThis.localStorage || null; } catch { return null; } };
const hex = (n) => { const a = new Uint8Array(n); (globalThis.crypto || {}).getRandomValues?.(a); if (!a.some(Boolean)) for (let i = 0; i < n; i++) a[i] = Math.random() * 256; return [...a].map((b) => b.toString(16).padStart(2, "0")).join(""); };
let memSid = "";

/** Mã phiên trình duyệt (chung mọi tab, mọi game). Không lưu được (chế độ riêng tư chặn) ⇒ mã trong bộ nhớ của trang. */
export function sessionId() {
  const s = ls();
  try {
    let v = s?.getItem(SID_KEY) || "";
    if (!/^[0-9a-f]{32}$/.test(v)) { v = hex(16); s?.setItem(SID_KEY, v); }
    if (s?.getItem(SID_KEY) === v) return v;
  } catch { /* bỏ qua */ }
  return memSid || (memSid = hex(16));
}

const tidy = (n) => String(n ?? "").replace(/\s+/g, " ").trim();
function accName() { try { return tidy(acc.getName?.()); } catch { return ""; } }
/** Tên tài khoản do người dùng tự đặt (không phải tên khách tự sinh)? Bản mới có thể cho biết trực tiếp. */
function userSetName() {
  try {
    if (typeof acc.hasCustomName === "function") return !!acc.hasCustomName();
    if (typeof acc.isAutoName === "function") return !acc.isAutoName();
    return !!(acc.wasAsked?.() && accName()); // bản cũ: setName()/renameMe() bật "asked"
  } catch { return false; }
}
/** Ghi tên vào tài khoản; trả về tên đã lưu (đã làm sạch) hoặc "" nếu bị từ chối. */
function saveAccName(name) {
  try {
    const r = acc.setName?.(name);
    if (typeof r === "string") return tidy(r);
    if (r && typeof r === "object") return r.ok === false ? "" : tidy(r.name ?? name);
    return accName();
  } catch { return ""; }
}
function migrated(game) {
  try { return !!JSON.parse(ls()?.getItem(MIG_KEY) || "{}")[game]; } catch { return false; }
}
function markMigrated(game) {
  try { const o = JSON.parse(ls()?.getItem(MIG_KEY) || "{}") || {}; o[game] = 1; ls()?.setItem(MIG_KEY, JSON.stringify(o)); } catch { /* bỏ qua */ }
}

/**
 * Gắn ô nhập tên của game vào tên dùng chung.
 *   game:   id game (vd "co-caro") — để chỉ chuyển tên cũ một lần
 *   input:  <input> tên (có thể null nếu game tự vẽ)
 *   legacy: () => tên cũ game tự lưu ("" nếu không có)
 *   onChange(name): tên đổi từ nơi khác (game khác / tab khác / ô hồ sơ) — mặc định điền lại ô nhập nếu đang không gõ
 * Trả về { get(), commit(name) }: commit() gọi khi người chơi bấm Tạo / Vào phòng — lưu vào tài khoản nếu khác.
 */
export function sharedName({ game, input = null, legacy = () => "", onChange = null } = {}) {
  let old = "";
  try { old = tidy(legacy()); } catch { /* bỏ qua */ }
  if (game && !migrated(game)) {
    markMigrated(game);
    if (old && !userSetName()) saveAccName(old);
  }
  const current = () => accName() || old;
  const fill = (n) => {
    if (onChange) return onChange(n);
    if (input && document.activeElement !== input && n) input.value = n;
  };
  if (input) input.value = current() || input.value;
  let last = current();
  const refresh = () => { const n = accName(); if (n && n !== last) { last = n; fill(n); } };
  try { if (typeof acc.onNameChange === "function") acc.onNameChange(() => refresh()); } catch { /* bỏ qua */ }
  globalThis.addEventListener?.("storage", (e) => { if (!e.key || e.key === ACC_KEY) refresh(); }); // đổi tên ở tab khác
  globalThis.addEventListener?.("pageshow", refresh); // quay lại trang từ bfcache
  return {
    get: current,
    /** Lưu tên người chơi vừa nhập vào tài khoản (nếu khác). Trả về tên để gửi máy chủ (máy chủ lọc lại). */
    commit(name) {
      const n = tidy(name);
      if (!n) return "";
      if (n !== accName()) { const saved = saveAccName(n); last = saved || n; }
      return n;
    },
  };
}

// ---------- "Mời ra" (chủ phòng) ----------
// Game vẽ nút bằng kickButtonHTML(ghế, tên) cạnh tên người khác trong phòng chờ (chỉ khi mình là chủ phòng), rồi gọi
// initKick({ send }) một lần. Bấm nút ⇒ hộp xác nhận pixel ⇒ gửi { t:"kick", target, name } (máy chủ kiểm chủ phòng,
// kiểm tên còn đúng người ở ghế đó — ghế dồn trong lúc đang hỏi thì không mời nhầm).
let kickCss = false, kickSend = null;
const escAttr = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function ensureKickCss() {
  if (kickCss || typeof document === "undefined") return; kickCss = true;
  const s = document.createElement("style");
  s.dataset.pxKick = "";
  s.textContent = `.pxk{flex:none;min-height:44px;min-width:44px;margin:0 3px 0 6px;padding:0 10px;border:0;font:inherit;font-size:13px;font-weight:800;
  line-height:1;cursor:pointer;color:#8f2418;background:linear-gradient(#fffaf2 0 2px,#ffe9dc 2px);white-space:nowrap;
  box-shadow:0 -2px 0 0 #6b2117,0 2px 0 0 #6b2117,-2px 0 0 0 #6b2117,2px 0 0 0 #6b2117,2px 3px 0 0 rgba(5,10,18,.55);
  touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:transform .08s ease}
.pxk:active{transform:translate(2px,2px);box-shadow:0 -2px 0 0 #6b2117,0 2px 0 0 #6b2117,-2px 0 0 0 #6b2117,2px 0 0 0 #6b2117}
.pxk:focus-visible{outline:3px solid #ffd27a;outline-offset:2px}
.pxk:disabled{opacity:.5;cursor:default}
@media (prefers-reduced-motion:reduce){.pxk{transition:none}}`;
  document.head.appendChild(s);
}
/** HTML nút "Mời ra" cho ghế `seat` (tên `name`) — game tự quyết khi nào vẽ (mình là chủ phòng, ghế người khác, không phải bot). */
export function kickButtonHTML(seat, name) {
  ensureKickCss();
  return `<button type="button" class="pxk" data-pxkick="${seat | 0}" data-pxkick-name="${escAttr(name)}" aria-label="Mời ${escAttr(name)} ra khỏi phòng" title="Mời ra khỏi phòng">Mời ra</button>`;
}
/** Gắn xử lý bấm nút "Mời ra" cho cả trang. send(msg) → gửi lệnh tới máy chủ (trả false nếu mất kết nối). */
export function initKick({ send, confirm: ask } = {}) {
  ensureKickCss();
  if (kickSend) { kickSend = send; return; }
  kickSend = send;
  document.addEventListener("click", async (e) => {
    const b = e.target.closest?.("[data-pxkick]");
    if (!b || b.disabled) return;
    e.preventDefault(); e.stopPropagation();
    const target = Number(b.dataset.pxkick), name = b.dataset.pxkickName || "";
    const { pxConfirm } = await import("./px-confirm.js?v=pc1");
    const ok = await (ask || pxConfirm)({
      title: `Mời ${name || "người này"} ra khỏi phòng?`,
      text: "Người này sẽ thấy lời báo \"Chủ phòng đã mời bạn ra\" và không vào lại phòng này được trong 10 phút.",
      ok: "Mời ra", cancel: "Thôi", danger: true,
    });
    if (ok) kickSend?.({ t: "kick", target, name });
  }, true);
}
