// Trang Bảng xếp hạng (P-C): 3 thẻ "Thử thách hôm nay" + bảng 3 tab (Sudoku / 2048 / Đố Vui) × Hôm nay / Hôm qua.
// Dữ liệu: GET /api/daily/:game/:day?limit=50 (account.js getBoard, KHÔNG tạo danh tính mới khi chỉ xem), kết quả máy từ daily.js.
// Dòng của mình tô sáng (máy chủ đánh dấu you/me theo danh tính). Cùng điểm rút gọn ⇒ hiện tiêu chí phụ "4/5 · 3,8 giây" (HOME-16).
// URL giữ lựa chọn: ?game=2048&day=hom-qua (link "Xem bảng xếp hạng đầy đủ" trong bảng kết quả game mở đúng tab).
import * as A from "../games/_shared/account.js?v=d6g";
import * as D from "../games/_shared/daily.js?v=daily1";
import { scoreLabels } from "../games/_shared/daily-board.js?v=d6g";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const fmtN = (n) => Number(n || 0).toLocaleString("vi-VN");

const CARDS = [
  { id: "sudoku", thumb: "assets/thumbs/sudoku.webp", meta: "Một đề Vừa · cả nước chung đề" },
  { id: "2048", thumb: "assets/thumbs/2048.webp", meta: "150 nước · cùng chuỗi ô" },
  { id: "do-vui-nhanh", thumb: "assets/thumbs/do-vui.webp", meta: "5 câu · 15 giây mỗi câu" },
];
const RULES = {
  sudoku: "Sudoku: ít thời gian hơn đứng trên — mỗi lỗi cộng 30 giây, mỗi gợi ý cộng 60 giây.",
  "2048": "2048: điểm ván cao hơn đứng trên (150 nước, mọi người cùng chuỗi ô).",
  "do-vui-nhanh": "Đố Vui: đúng nhiều câu hơn đứng trên; bằng câu thì ai trả lời nhanh hơn đứng trên.",
};
const half = (src) => src.replace("assets/thumbs/", "assets/thumbs/half/");
const SIZES = "(max-width: 720px) 56px, (max-width: 1023px) 64px, (max-width: 1180px) 84px, 104px";

const q = new URLSearchParams(location.search);
const state = {
  game: D.GAMES[q.get("game")] ? q.get("game") : "sudoku",
  back: q.get("day") === "hom-qua" ? 1 : 0,
  today: D.dayNumber(),
  ranks: {},
  seq: 0,
};
const cache = new Map(); // "game|day" → { at, data }

// ---------- 3 thẻ thử thách ----------
function renderCards() {
  const day = state.today, row = $("dailyCards");
  $("dailyNo").textContent = "#" + day;
  row.innerHTML = CARDS.map((c) => {
    const g = D.GAMES[c.id], st = D.stats(c.id, day), done = st.doneToday, r = state.ranks[c.id];
    const go = done ? `Đã xong ✓ · ${esc(D.short(c.id, st.result))}` : "▶ Chơi ngay";
    const streak = st.streak > 0 ? `🔥 Chuỗi ${st.streak} ngày` : "Chưa có chuỗi";
    const label = `${g.name}, thử thách #${day}: ${done ? "đã xong, " + D.short(c.id, st.result) : "chưa chơi"}. ${streak}.` + (done && r ? ` Hạng ${r.rank} trên ${r.total} người.` : "");
    return `<a class="dcard${done ? " is-done" : ""}" data-game="${c.id}" href="../games/${g.path}/?daily=1" aria-label="${esc(label)}">
      <span class="dcard__art"><img src="${half(c.thumb)}" srcset="${half(c.thumb)} 360w, ${c.thumb} 720w" sizes="${SIZES}" alt="" width="384" height="288" /></span>
      <span class="dcard__body"><span class="dcard__name">${esc(g.name)}</span><span class="dcard__meta">${esc(c.meta)}</span>
        <span class="dcard__go">${go}</span>
        <span class="dcard__foot"><span class="dcard__streak${st.streak > 0 ? " is-on" : ""}">${streak}</span>${done && r ? `<span class="dcard__rank">🏆 Hạng #${r.rank | 0}/${r.total | 0}</span>` : ""}</span></span>
    </a>`;
  }).join("");
}
async function loadRanks() {
  if (!D.GAME_IDS.some((id) => D.isDone(id, state.today))) return;
  try {
    if ((await A.mode()) === "off") return;
    const r = await A.getMyRanks(state.today);
    if (r && r.ranks) { state.ranks = r.ranks; renderCards(); }
  } catch { /* không bắt buộc */ }
}

// ---------- Bảng ----------
const panel = $("lbPanel");
function setState(s) { panel.dataset.state = s; }
function msg(text, { wait = false, retry = false, cta = "" } = {}) {
  panel.innerHTML = `<p class="lb__msg${wait ? " is-wait" : ""}">${esc(text)}${retry ? ' <button class="btn btn--sm lb__retry" id="lbRetry" type="button">Thử lại</button>' : ""}</p>${cta}`;
  if (retry) $("lbRetry").addEventListener("click", () => load(true));
}
function playCta(game, day) {
  if (day !== state.today || D.isDone(game, day)) return "";
  const g = D.GAMES[game];
  return `<a class="btn btn--gold lb__cta" href="../games/${g.path}/?daily=1">▶ Chơi ${esc(g.name)} #${day} để có tên trên bảng</a>`;
}
function renderBoard(data, game, day) {
  setState("board");
  const top = data.top || [];
  const all = data.me && !top.some((e) => e.you) ? [...top, data.me] : top;
  const labels = scoreLabels(game, all);
  const row = (e, i, you) => `<li class="lb__row${you ? " is-you" : ""}${e.rank <= 3 ? " is-top" : ""}"${you ? ' aria-current="true"' : ""}>
      <span class="lb__rank">#${e.rank | 0}</span>
      <span class="lb__av" aria-hidden="true">${A.avatarSvg(e.name, 24)}</span>
      <span class="lb__name">${esc(e.name)}${you ? ' <span class="lb__you">Bạn</span>' : ""}</span>
      <span class="lb__score">${esc(labels[i])}</span></li>`;
  let html = `<p class="lb__count" id="lbTotal">${fmtN(data.total)} người đã chơi · ${esc(D.dateLabel(day))}</p>`;
  if (!top.length) html += `<p class="lb__msg">${day === state.today ? "Chưa có ai trên bảng hôm nay. Chơi trước để đứng #1!" : "Hôm đó chưa có ai trên bảng."}</p>`;
  else {
    html += `<ol class="lb__list" id="lbList">${top.map((e, i) => row(e, i, !!e.you)).join("")}`;
    if (all.length > top.length) html += `<li class="lb__gap" aria-hidden="true">⋯</li>` + row(data.me, all.length - 1, true);
    html += "</ol>";
  }
  if (data.me) html += `<p class="lb__me" id="lbMe">Bạn hạng <b>#${data.me.rank | 0}</b> / ${fmtN(data.total)} với tên <b>${esc(data.me.name)}</b>.</p>`;
  else html += playCta(game, day);
  panel.innerHTML = html;
}

async function load(force = false) {
  const game = state.game, day = state.today - state.back, my = ++state.seq;
  $("lbRule").textContent = RULES[game];
  panel.setAttribute("aria-labelledby", "tab-" + game);
  const key = game + "|" + day, hit = cache.get(key);
  if (hit && !force && Date.now() - hit.at < 15000) return renderBoard(hit.data, game, day);
  setState("loading");
  msg("Đang tải bảng xếp hạng…", { wait: true });
  try {
    if ((await A.mode()) === "off") {
      if (my !== state.seq) return;
      setState("off");
      return msg("Bảng xếp hạng đang tạm tắt. Bạn vẫn chơi Thử thách và khoe kết quả được nhé.", { cta: playCta(game, day) });
    }
    const data = await A.getBoard(game, day, { limit: 50, create: false });
    if (my !== state.seq) return;
    cache.set(key, { at: Date.now(), data });
    renderBoard(data, game, day);
  } catch {
    if (my !== state.seq) return;
    setState("error");
    msg("Chưa kết nối được bảng xếp hạng.", { retry: true });
  }
}

// ---------- Tab game (ARIA tabs: ← → Home End) + Hôm nay / Hôm qua ----------
const tabs = [...document.querySelectorAll(".lb__tab")];
const days = [...document.querySelectorAll(".lb__day")];
function syncUi() {
  for (const t of tabs) { const on = t.dataset.game === state.game; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; }
  for (const b of days) b.setAttribute("aria-pressed", String(+b.dataset.day === state.back));
  const yday = days.find((b) => b.dataset.day === "1");
  yday.disabled = state.today <= 1;
  yday.textContent = `Hôm qua #${Math.max(1, state.today - 1)}`;
  days[0].textContent = `Hôm nay #${state.today}`;
  const u = new URL(location.href);
  u.searchParams.set("game", state.game);
  if (state.back) u.searchParams.set("day", "hom-qua"); else u.searchParams.delete("day");
  history.replaceState(null, "", u.pathname + u.search + u.hash);
}
function pick(game, focus) {
  if (!D.GAMES[game]) return;
  state.game = game; syncUi(); load();
  if (focus) tabs.find((t) => t.dataset.game === game).focus();
}
tabs.forEach((t) => t.addEventListener("click", () => pick(t.dataset.game)));
document.querySelector(".lb__tabs").addEventListener("keydown", (e) => {
  const i = tabs.findIndex((t) => t.dataset.game === state.game);
  const j = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : null;
  if (j === null) return;
  e.preventDefault();
  pick(tabs[(j + tabs.length) % tabs.length].dataset.game, true);
});
days.forEach((b) => b.addEventListener("click", () => { if (b.disabled) return; state.back = +b.dataset.day; syncUi(); load(); }));

// ---------- Đếm ngược + qua ngày + quay lại từ game ----------
function tick() {
  if (D.dayNumber() !== state.today) { state.today = D.dayNumber(); cache.clear(); state.ranks = {}; renderCards(); syncUi(); load(); }
  $("lbCount").textContent = D.fmtCountdown(D.msUntilNext());
}
function refresh() { renderCards(); loadRanks(); load(); }

renderCards();
syncUi();
load();
loadRanks();
setInterval(tick, 1000);
addEventListener("pageshow", (e) => { if (e.persisted) { cache.clear(); refresh(); } });
addEventListener("storage", (e) => { if (!e.key || e.key === D.STORE_KEY) { renderCards(); loadRanks(); } });
A.onNameChange(() => { cache.clear(); setTimeout(() => load(true), 1200); }); // đổi tên ở ô hồ sơ ⇒ máy chủ đổi tên trên bảng hôm nay rồi tải lại
window.__lb = { state, load };
