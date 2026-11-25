// Ô hồ sơ góc phải thanh trên (P-B) — dùng chung trang chủ + bang-xep-hang.html.
// Nút: avatar pixel sinh từ tên (account.js avatarSvg) + tên + ✎. Chạm/Enter mở popover (role=dialog, không chặn trang):
//   sửa tên (kiểm 2–16 ký tự ngay ở máy, hỏi bộ lọc máy chủ khi lưu), "Tên ngẫu nhiên khác", chuỗi ngày Thử thách, hạng hôm nay,
//   link Bảng xếp hạng. Esc / bấm ra ngoài / Tab ra khỏi popover ⇒ đóng, trả focus về nút.
// Tên đổi ở tab khác (game online, bảng xếp hạng) ⇒ cập nhật ngay (onNameChange nghe cả sự kiện storage).
// Không gọi API nào khi chỉ xem trang; hạng hôm nay chỉ hỏi máy chủ khi mở popover VÀ đã xong ít nhất 1 thử thách.
import * as A from "../games/_shared/account.js?v=name1";
import * as D from "../games/_shared/daily.js?v=daily1";

const ORDER = ["sudoku", "2048", "do-vui-nhanh"]; // thứ tự hiện (D.GAME_IDS để "2048" lên đầu vì khoá dạng số)
const $ = (id) => document.getElementById(id);
const btn = $("meBtn"), pop = $("mePop"), nameEl = $("meName"), avEl = $("meAv");
const boardHref = btn?.dataset.board || "bang-xep-hang.html";
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function paint(name) {
  if (nameEl.textContent !== name) nameEl.textContent = name;
  avEl.innerHTML = A.avatarSvg(name, 28);
  btn.title = name + " — bấm để sửa tên";
  if (!pop.hidden) {
    const big = pop.querySelector(".me__bigav"); if (big) big.innerHTML = A.avatarSvg(name, 48);
    const inp = $("meInput"); if (inp && document.activeElement !== inp) inp.value = name;
  }
}

function streakInfo() {
  const day = D.dayNumber();
  let best = 0, max = 0, done = 0;
  for (const id of ORDER) {
    const st = D.stats(id, day);
    best = Math.max(best, st.streak); max = Math.max(max, st.maxStreak);
    if (st.doneToday) done++;
  }
  return { day, best, max, done };
}

function paintPop() {
  const name = A.getName(), s = streakInfo();
  pop.innerHTML = `
    <div class="me__head">
      <span class="me__bigav">${A.avatarSvg(name, 48)}</span>
      <div class="me__who"><p class="me__title" id="mePopTitle">Hồ sơ của bạn</p>
        <p class="me__hint">${A.isGenerated() ? "Tên tự đặt sẵn cho bạn — đổi thoải mái." : "Tên này dùng chung mọi game + bảng xếp hạng."}</p></div>
      <button class="me__x" id="meClose" type="button" aria-label="Đóng hồ sơ"><svg class="px-svg" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3h2v1h1v1h1v1h2V5h1V4h1V3h2v2h-1v1h-1v1h-1v2h1v1h1v1h1v2h-2v-1h-1v-1h-1v-1H7v1H6v1H5v1H3v-2h1v-1h1V9h1V7H5V6H4V5H3z"/></svg></button>
    </div>
    <form class="me__form" id="meForm" novalidate>
      <label class="me__lab" for="meInput">Tên hiển thị</label>
      <div class="me__row">
        <input class="me__input" id="meInput" type="text" autocomplete="nickname" spellcheck="false" enterkeyhint="done" aria-describedby="meErr meRule" value="${esc(name)}" />
        <button class="btn btn--teal me__save" id="meSave" type="submit">Lưu</button>
      </div>
      <p class="me__err" id="meErr" role="alert"></p>
      <p class="me__rule" id="meRule">2–16 ký tự: chữ, số, dấu cách. Tên lịch sự nhé — tên bậy sẽ bị đổi.</p>
      <button class="me__dice" id="meDice" type="button"><svg class="px-svg" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2h12v1H2zM1 3h1v10H1zM14 3h1v10h-1zM2 13h12v1H2zM4 4h2v2H4zM10 4h2v2h-2zM7 7h2v2H7zM4 10h2v2H4zM10 10h2v2h-2z"/></svg>Tên ngẫu nhiên khác</button>
    </form>
    <dl class="me__stats">
      <div><dt>Chuỗi ngày</dt><dd>${s.best ? `🔥 ${s.best} ngày` : "Chưa có"}</dd></div>
      <div><dt>Hôm nay</dt><dd>${s.done}/3 đề</dd></div>
      <div><dt>Dài nhất</dt><dd>${s.max} ngày</dd></div>
    </dl>
    <p class="me__ranks" id="meRanks" hidden></p>
    <div class="me__links">
      <a class="btn btn--gold me__board" href="${boardHref}"><svg class="px-svg" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 1h10v6H3zM1 2h2v1H1zM13 2h2v1h-2zM1 3h1v2H1zM14 3h1v2h-1zM2 5h1v1H2zM13 5h1v1h-1zM4 7h8v1H4zM6 8h4v2H6zM7 10h2v2H7zM5 12h6v1H5zM4 13h8v2H4z"/></svg>Bảng xếp hạng</a>
      ${s.done < 3 ? `<a class="btn me__chal" href="${boardHref}#thu-thach">★ Thử thách #${s.day}</a>` : ""}
    </div>`;
  const form = $("meForm"), inp = $("meInput"), err = $("meErr");
  inp.addEventListener("input", () => { err.textContent = ""; inp.removeAttribute("aria-invalid"); });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const c = A.checkName(inp.value);
    if (!c.ok) { err.textContent = c.error; inp.setAttribute("aria-invalid", "true"); inp.focus(); return; }
    const save = $("meSave"); save.disabled = true; save.textContent = "…";
    const r = await A.saveName(c.name);
    save.disabled = false; save.textContent = "Lưu";
    if (!r.ok) { err.textContent = r.error; inp.setAttribute("aria-invalid", "true"); inp.focus(); return; }
    inp.value = r.name;
    flash("Đã lưu ✓");
  });
  $("meDice").addEventListener("click", () => { A.rerollName(); $("meInput").value = A.getName(); flash("Tên mới ✓"); });
  $("meClose").addEventListener("click", () => close(true));
  loadRanks(s);
}

function flash(text) {
  const err = $("meErr"); if (!err) return;
  err.classList.add("is-ok"); err.textContent = text;
  setTimeout(() => { if (err.textContent === text) { err.textContent = ""; err.classList.remove("is-ok"); } }, 1800);
}

async function loadRanks(s) {
  if (!s.done) return;
  try {
    if ((await A.mode()) === "off") return;
    const r = await A.getMyRanks(s.day);
    const box = $("meRanks");
    if (!box || pop.hidden || !r || !r.ranks) return;
    const parts = ORDER.filter((id) => r.ranks[id]).map((id) => `${D.GAMES[id].name} #${r.ranks[id].rank | 0}/${r.ranks[id].total | 0}`);
    if (!parts.length) return;
    box.textContent = "🏆 Hạng hôm nay: " + parts.join(" · ");
    box.hidden = false;
  } catch { /* bảng xếp hạng không bắt buộc */ }
}

function open() {
  if (!pop.hidden) return;
  paintPop();
  pop.hidden = false;
  btn.setAttribute("aria-expanded", "true");
  // Có chuột/bàn phím ⇒ đặt sẵn con trỏ vào ô tên; màn cảm ứng ⇒ focus nút Đóng (không bật bàn phím ảo che nửa màn)
  if (matchMedia("(hover: hover)").matches) { const inp = $("meInput"); inp.focus({ preventScroll: true }); inp.select(); }
  else $("meClose").focus({ preventScroll: true });
}
function close(focusBtn) {
  if (pop.hidden) return;
  pop.hidden = true;
  btn.setAttribute("aria-expanded", "false");
  if (focusBtn) btn.focus({ preventScroll: true });
}

btn.addEventListener("click", () => (pop.hidden ? open() : close(true)));
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !pop.hidden) { e.preventDefault(); close(true); } });
document.addEventListener("pointerdown", (e) => { if (!pop.hidden && !e.target.closest("#me")) close(false); }, true);
pop.addEventListener("focusout", (e) => { if (e.relatedTarget && !e.relatedTarget.closest("#me")) close(false); });

paint(A.getName());
A.onNameChange(paint);
window.__profile = { open, close, paint };
