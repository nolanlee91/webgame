// Trang chủ — "Thử thách hôm nay" đã thu nhỏ (P-E, chủ dự án chốt 25/11/2026): không còn hàng thẻ lớn.
//   • Nhãn "★ Thử thách" / "✓ Thử thách #N" trên thẻ Sudoku / 2048 / Đố Vui: app.js dựng cùng lưới game.
//   • Một dòng nhắc cho người ĐANG CÓ chuỗi ngày (#streakLine): script nội tuyến trong index.html vẽ ngay lúc tải (không nhảy bố cục);
//     file này vẽ lại khi quay về từ game (bfcache), tab khác ghi kết quả, hoặc qua 0h giờ VN (đề mới).
//   • Bảng xếp hạng + 3 thẻ thử thách đầy đủ: trang bang-xep-hang.html.
// Dữ liệu: localStorage "wgp.daily.v1" qua lõi chung games/_shared/daily.js.
import * as D from "../games/_shared/daily.js?v=daily1";

const ORDER = ["sudoku", "2048", "do-vui-nhanh"]; // thứ tự hiện (D.GAME_IDS để "2048" lên đầu vì khoá dạng số)
const line = document.getElementById("streakLine");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
let day = D.dayNumber();

export function render() {
  if (!line) return;
  day = D.dayNumber();
  let best = 0;
  const left = [];
  for (const id of ORDER) {
    const st = D.stats(id, day);
    best = Math.max(best, st.streak);
    if (!st.doneToday) left.push(id);
  }
  if (!best) { line.hidden = true; line.textContent = ""; return; }
  const sep = ' <span class="streak__sep">·</span> ';
  const html = `<span class="streak__fire">🔥 Chuỗi ${best} ngày</span>` + (left.length
    ? sep + "Hôm nay còn: " + left.map((id) => `<a href="../games/${D.GAMES[id].path}/?daily=1">${esc(D.GAMES[id].name)} #${day}</a>`).join(" · ")
    : sep + 'Xong cả 3 thử thách hôm nay ✓ <a href="bang-xep-hang.html">Xem hạng</a>');
  if (line.innerHTML !== html) line.innerHTML = html;
  line.hidden = false;
}

render();
setInterval(() => { if (D.dayNumber() !== day) render(); }, 30000); // qua 0h VN ⇒ đề mới
window.addEventListener("pageshow", render);
window.addEventListener("storage", (e) => { if (!e.key || e.key === D.STORE_KEY) render(); });
document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });
window.__daily = { render };
