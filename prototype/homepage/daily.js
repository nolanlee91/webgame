// Trang chủ — khu "Thử thách hôm nay": 3 thẻ (Sudoku, 2048, Đố Vui) với trạng thái Chơi ngay / Đã xong ✓, chuỗi ngày, đếm ngược.
// Dữ liệu đọc từ localStorage "wgp.daily.v1" qua lõi chung games/_shared/daily.js (game ghi khi chơi xong).
// Đã xong hôm nay ⇒ hỏi máy chủ hạng của mình ở cả 3 game trong MỘT request (sau khi trang rảnh, lỗi thì lặng lẽ bỏ qua)
// và hiện "Hạng #N/M" trên thẻ. Chưa xong game nào thì không tải gì thêm.
import * as D from "../games/_shared/daily.js?v=daily1";

const CARDS = [
  { id: "sudoku", thumb: "assets/thumbs/sudoku.webp", meta: "Một đề Vừa · cả nước chung đề" },
  { id: "2048", thumb: "assets/thumbs/2048.webp", meta: "150 nước · cùng chuỗi ô" },
  { id: "do-vui-nhanh", thumb: "assets/thumbs/do-vui.webp", meta: "5 câu · 15 giây mỗi câu" },
];

const root = document.getElementById("daily");
const row = document.getElementById("dailyCards");
const noEl = document.getElementById("dailyNo");
const countEl = document.getElementById("dailyCount");
let day = 0;
let ranks = { day: 0, map: {}, asked: 0 }; // hạng đã lấy từ máy chủ (theo ngày)

function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]); }

function render() {
  if (!root || !row) return;
  day = D.dayNumber();
  if (noEl) noEl.textContent = "#" + day;
  const cd = D.fmtCountdown(D.msUntilNext());
  row.innerHTML = CARDS.map((c) => {
    const g = D.GAMES[c.id], st = D.stats(c.id, day);
    const done = st.doneToday;
    const go = done ? `Đã xong ✓ · ${esc(D.short(c.id, st.result))}` : "▶ Chơi ngay";
    const streak = st.streak > 0 ? `🔥 Chuỗi ${st.streak} ngày` : "Chưa có chuỗi";
    const label = `${g.name}, thử thách #${day}: ${done ? "đã xong, " + D.short(c.id, st.result) : "chưa chơi"}. ${streak}.`
      + (done && ranks.day === day && ranks.map[c.id] ? ` Hạng ${ranks.map[c.id].rank} trên ${ranks.map[c.id].total} người.` : "");
    return `<a class="dcard${done ? " is-done" : ""}" data-game="${c.id}" href="../games/${g.path}/?daily=1" aria-label="${esc(label)}">
      <span class="dcard__art"><img src="${c.thumb}" alt="" loading="lazy" width="384" height="288" /></span>
      <span class="dcard__body">
        <span class="dcard__name">${esc(g.name)}</span>
        <span class="dcard__meta">${esc(c.meta)}</span>
        <span class="dcard__go">${go}</span>
        <span class="dcard__foot"><span class="dcard__streak${st.streak > 0 ? " is-on" : ""}">${streak}</span>${done ? rankHtml(c.id) : ""}${done ? `<span class="dcard__cd">Đề mới <b data-cd>${cd}</b></span>` : ""}</span>
      </span>
    </a>`;
  }).join("");
  tick();
  loadRanks();
}

function rankHtml(id) {
  const r = ranks.day === day && ranks.map[id];
  return r ? `<span class="dcard__rank" data-rank="${r.rank | 0}">🏆 Hạng #${r.rank | 0}/${r.total | 0}</span>` : "";
}
/** Lấy hạng cho các game đã xong hôm nay (tối đa 1 lần / 20 giây; lỗi mạng / máy chủ tắt bảng ⇒ im lặng). */
function loadRanks() {
  const doneIds = CARDS.map((c) => c.id).filter((id) => D.isDone(id, day));
  if (!doneIds.length) return;
  if (ranks.day === day && doneIds.every((id) => ranks.map[id])) return;
  const t = Date.now();
  if (ranks.day === day && t - ranks.asked < 20000) return;
  ranks = { day, map: ranks.day === day ? ranks.map : {}, asked: t };
  const want = day;
  const go = async () => {
    try {
      const A = await import("../games/_shared/account.js?v=board1");
      if ((await A.mode()) === "off") return;
      const r = await A.getMyRanks(want);
      if (want !== day || !r || !r.ranks) return;
      ranks.map = r.ranks;
      for (const [id, v] of Object.entries(r.ranks)) {
        const card = row.querySelector(`.dcard[data-game="${id}"]`);
        if (!card || !card.classList.contains("is-done") || card.querySelector(".dcard__rank")) continue;
        const cd = card.querySelector(".dcard__cd");
        cd.insertAdjacentHTML("beforebegin", rankHtml(id));
        card.setAttribute("aria-label", card.getAttribute("aria-label") + ` Hạng ${v.rank} trên ${v.total} người.`);
      }
    } catch { /* bảng xếp hạng không bắt buộc */ }
  };
  (window.requestIdleCallback || ((f) => setTimeout(f, 300)))(go, { timeout: 2500 });
}

function tick() {
  if (D.dayNumber() !== day) return render(); // qua 0h VN ⇒ đề mới, vẽ lại
  const cd = D.fmtCountdown(D.msUntilNext());
  if (countEl) countEl.textContent = cd;
  for (const el of row.querySelectorAll("[data-cd]")) el.textContent = cd;
}

render();
setInterval(tick, 1000);
// Quay lại từ game (bfcache / tab khác) hoặc tab khác ghi kết quả ⇒ cập nhật trạng thái
window.addEventListener("pageshow", render);
window.addEventListener("storage", (e) => { if (!e.key || e.key === D.STORE_KEY) render(); });
document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });
window.__daily = { render };
