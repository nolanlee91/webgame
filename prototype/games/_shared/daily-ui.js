// Thử thách hôm nay — phần giao diện dùng chung trong game: nhãn "Thử thách #N" và bảng kết quả.
// Bảng kết quả tự mang CSS riêng (tiền tố .dly-), lấy màu từ biến của game (--panel, --gold…) nếu có,
// theo Pixel UI V5 của HUD trong game: viền 3px, vát, bóng cứng, không bo tròn.
// Dưới các nút là "Bảng xếp hạng hôm nay" (daily-board.js, nạp lười; máy chủ tắt bảng thì ẩn hẳn).
import * as D from "./daily.js?v=daily1";

const CSS = `
.dly-chip{display:inline-flex;align-items:center;gap:6px;margin-left:12px;padding:3px 9px;vertical-align:middle;font:800 12px/1.2 "Be Vietnam Pro",system-ui,sans-serif;
  letter-spacing:.06em;text-transform:uppercase;text-shadow:none;color:#2c1b05;background:var(--gold,#ffc94a);box-shadow:0 0 0 3px var(--gold-d,#5a3a08)}
.dly-ov{position:fixed;inset:0;z-index:50;display:flex;align-items:flex-start;justify-content:center;padding:12px;background:rgba(10,8,7,.8);overflow:auto;overscroll-behavior:contain}
.dly-ov[hidden],.dly-reopen[hidden]{display:none!important}
.dly-card{box-sizing:border-box;width:min(440px,calc(100% - 10px));margin:auto 7px auto 3px;padding:20px 20px 22px;text-align:center;color:var(--ink,#f4ead2);background:var(--panel,#1d1a16);
  font:500 15px/1.5 "Be Vietnam Pro",system-ui,sans-serif;
  box-shadow:inset 0 2px 0 rgba(255,255,255,.13),inset 0 -2px 0 rgba(0,0,0,.35),0 -3px 0 0 #0a0807,0 3px 0 0 #0a0807,-3px 0 0 0 #0a0807,3px 0 0 0 #0a0807,4px 7px 0 0 rgba(0,0,0,.6),7px 4px 0 0 rgba(0,0,0,.6)}
.dly-kick{font:800 12px/1 "Be Vietnam Pro",system-ui;letter-spacing:.1em;text-transform:uppercase;color:var(--soft,#b9ad93)}
.dly-card h2{margin:8px 0 4px;font:800 26px/1.15 "Be Vietnam Pro",system-ui;letter-spacing:.04em;text-transform:uppercase;color:var(--gold,#ffc94a);text-shadow:3px 3px 0 #000}
.dly-grid{margin:12px auto 4px;padding:10px 12px;font-size:24px;line-height:1.3;letter-spacing:2px;background:var(--panel2,#262019);box-shadow:0 0 0 3px #0a0807;word-break:break-word}
.dly-det{color:var(--soft,#b9ad93);font-size:14px}
.dly-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0 4px}
.dly-stats div{display:grid;gap:2px;padding:8px 4px;background:var(--panel2,#262019);box-shadow:0 0 0 3px #0a0807;margin:3px}
.dly-stats b{font:800 22px/1 "Be Vietnam Pro",system-ui;font-variant-numeric:tabular-nums}
.dly-stats small{font:800 10px/1.2 "Be Vietnam Pro",system-ui;letter-spacing:.06em;text-transform:uppercase;color:var(--soft,#b9ad93)}
.dly-next{margin-top:12px;font-size:14px;color:var(--soft,#b9ad93)}
.dly-next b{font:800 18px "Be Vietnam Pro",system-ui;color:var(--ink,#f4ead2);font-variant-numeric:tabular-nums}
.dly-acts{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;margin-top:16px}
.dly-btn{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:10px 16px;
  font:800 14px/1 "Be Vietnam Pro",system-ui;letter-spacing:.05em;text-transform:uppercase;color:var(--ink,#f4ead2);background:var(--panel2,#262019);text-decoration:none;
  box-shadow:inset 0 2px 0 rgba(255,255,255,.13),inset 0 -2px 0 rgba(0,0,0,.35),0 -3px 0 0 #6d6150,0 3px 0 0 #6d6150,-3px 0 0 0 #6d6150,3px 0 0 0 #6d6150,4px 6px 0 0 rgba(0,0,0,.6)}
.dly-btn:hover{background:#30281f}
.dly-btn:active{transform:translate(4px,4px)}
.dly-btn:focus-visible{outline:2px dashed var(--gold,#ffc94a);outline-offset:5px}
.dly-btn--share{flex:1 1 100%;min-height:52px;font-size:17px;color:#2c1b05;background:linear-gradient(var(--gold-l,#ffe9a8) 0 3px,var(--gold,#ffc94a) 3px);
  box-shadow:inset 0 -2px 0 rgba(0,0,0,.25),0 -3px 0 0 #5a3a08,0 3px 0 0 #5a3a08,-3px 0 0 0 #5a3a08,3px 0 0 0 #5a3a08,4px 6px 0 0 rgba(0,0,0,.6)}
.dly-btn--share:hover{background:linear-gradient(#fff3c9 0 3px,#ffd466 3px)}
.dly-btn--ghost{flex:1 1 140px}
.dly-reopen{position:fixed;right:16px;bottom:16px;z-index:40}
.dly-lb{margin-top:18px;padding:12px 12px 10px;text-align:left;background:var(--panel2,#262019);box-shadow:0 0 0 3px #0a0807;margin-left:3px;margin-right:3px}
.dly-lb[hidden]{display:none!important}
.dly-lb__head{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:2px 10px;margin-bottom:8px}
.dly-lb__title{font:800 14px/1.2 "Be Vietnam Pro",system-ui;letter-spacing:.06em;text-transform:uppercase;color:var(--gold,#ffc94a)}
.dly-lb__count{font:700 12px/1.2 "Be Vietnam Pro",system-ui;color:var(--soft,#b9ad93);font-variant-numeric:tabular-nums}
.dly-lb__list{list-style:none;margin:0;padding:0;display:grid;gap:3px}
.dly-lb__row{display:grid;grid-template-columns:40px minmax(0,1fr) auto;align-items:center;gap:8px;min-height:28px;padding:3px 8px;font:600 14px/1.25 "Be Vietnam Pro",system-ui;background:rgba(0,0,0,.18)}
.dly-lb__row:nth-child(-n+3) .dly-lb__rank{color:var(--gold,#ffc94a)}
.dly-lb__row.is-you{color:#c6f7ea;background:#1b3c42;box-shadow:inset 3px 0 0 #75d1bf}
.dly-lb__rank{font-weight:800;font-variant-numeric:tabular-nums;color:var(--soft,#b9ad93)}
.dly-lb__name{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.dly-lb__score{font-weight:800;font-variant-numeric:tabular-nums;white-space:nowrap}
.dly-lb__gap{text-align:center;line-height:1;color:var(--soft,#b9ad93)}
.dly-lb__you{margin:8px 0 0;font-size:13px;color:var(--soft,#b9ad93)}.dly-lb__you b{color:#c6f7ea;font-size:15px}
.dly-lb__msg,.dly-lb__note{margin:4px 0;font-size:13px;line-height:1.4;color:var(--soft,#b9ad93)}
.dly-lb__note{color:#ffcf8a}
.dly-lb__msg.is-wait::after{content:"";display:inline-block;width:6px;height:6px;margin-left:6px;background:currentColor;animation:dlyBlink 1s steps(2) infinite}
@keyframes dlyBlink{50%{opacity:0}}
.dly-lb__retry{min-height:34px;padding:6px 12px;font-size:12px;margin:4px 0 0 4px}
.dly-name{display:grid;gap:6px}
.dly-name__lab{font:700 13px/1.3 "Be Vietnam Pro",system-ui;color:var(--ink,#f4ead2)}
.dly-name__row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.dly-name__inp{flex:1 1 140px;min-width:0;box-sizing:border-box;height:40px;margin:3px;padding:6px 10px;border:0;border-radius:0;font:700 16px/1 "Be Vietnam Pro",system-ui;
  color:var(--ink,#f4ead2);background:#0f0d0b;box-shadow:0 0 0 3px #6d6150;outline:none}
.dly-name__inp:focus-visible{box-shadow:0 0 0 3px var(--gold,#ffc94a)}
.dly-name__ok,.dly-name__skip{min-height:40px;padding:8px 12px;font-size:13px}
.dly-name__ok{color:#2c1b05;background:var(--gold,#ffc94a)}
.dly-name__ok:hover{background:#ffd466}
.dly-name__hint{font-size:12px;color:var(--soft,#b9ad93)}
@media (prefers-reduced-motion:reduce){.dly-lb__msg.is-wait::after{animation:none}}
@media (max-width:420px){.dly-card{padding:16px 14px 18px}.dly-card h2{font-size:22px}.dly-grid{font-size:21px}.dly-stats b{font-size:19px}
  .dly-lb{padding:10px 8px 8px}.dly-lb__row{grid-template-columns:34px minmax(0,1fr) auto;gap:6px;padding:3px 6px;font-size:13px}}
`;

function injectCss() {
  if (document.getElementById("dlyCss")) return;
  const st = document.createElement("style"); st.id = "dlyCss"; st.textContent = CSS;
  document.head.appendChild(st);
}

/** Gắn nhãn "Thử thách #N" cạnh tên game trên thanh trên. */
export function badge(day, where = document.querySelector(".bar h1")) {
  injectCss();
  if (!where) return null;
  let c = document.getElementById("dlyChip");
  if (!c) { c = document.createElement("span"); c.id = "dlyChip"; c.className = "dly-chip"; where.appendChild(c); }
  c.textContent = `★ Thử thách #${day}`;
  c.title = "Thử thách hôm nay " + D.dateLabel(day) + ": mọi người chơi cùng một đề";
  return c;
}

/**
 * Bảng kết quả đã khoá. game: id trong D.GAMES; day; result (đã ghi). normalUrl: link chế độ chơi thường.
 * title: dòng tiêu đề (vd. "Giải xong!"). Trả về { el, show(), hide(), destroy() }.
 */
export function panel({ game, day, result, title = "Xong rồi!", normalUrl = "./", homeUrl = "../../homepage/", board = true }) {
  injectCss();
  const old = document.getElementById("dlyOv"); if (old) old.remove();
  const oldR = document.getElementById("dlyReopen"); if (oldR) oldR.remove();
  const st = D.stats(game, day);
  const ov = document.createElement("div");
  ov.className = "dly-ov"; ov.id = "dlyOv";
  ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-labelledby", "dlyTitle");
  ov.innerHTML = `<div class="dly-card">
      <div class="dly-kick">Thử thách #${day} · ${D.dateLabel(day)}</div>
      <h2 id="dlyTitle"></h2>
      <div class="dly-grid" id="dlyGrid" aria-label="Ô kết quả"></div>
      <div class="dly-det" id="dlyDet"></div>
      <div class="dly-stats">
        <div><b id="dlyStreak">${st.streak}</b><small>🔥 Chuỗi ngày</small></div>
        <div><b>${st.maxStreak}</b><small>Chuỗi dài nhất</small></div>
        <div><b>${st.played}</b><small>Đã chơi</small></div>
      </div>
      <div class="dly-next">Đề mới sau <b id="dlyCount">--:--:--</b></div>
      <div class="dly-acts">
        <button class="dly-btn dly-btn--share" id="dlyShare" type="button">Khoe kết quả</button>
        <a class="dly-btn dly-btn--ghost" id="dlyNormal" href="${normalUrl}">Chơi thường</a>
        <button class="dly-btn dly-btn--ghost" id="dlyView" type="button">Xem bàn</button>
      </div>
      <section class="dly-lb" id="dlyLb" aria-live="polite" aria-label="Bảng xếp hạng hôm nay" hidden></section>
    </div>`;
  ov.querySelector("#dlyTitle").textContent = title;
  ov.querySelector("#dlyGrid").textContent = D.grid(game, result);
  ov.querySelector("#dlyDet").textContent = D.detail(game, result);
  document.body.appendChild(ov);
  const reopen = document.createElement("button");
  reopen.className = "dly-btn dly-reopen"; reopen.id = "dlyReopen"; reopen.type = "button"; reopen.hidden = true;
  reopen.textContent = `★ Kết quả #${day}`;
  document.body.appendChild(reopen);

  const shareBtn = ov.querySelector("#dlyShare");
  shareBtn.addEventListener("click", async () => {
    const text = D.shareText(game, result, { streak: D.stats(game, day).streak });
    window.__dailyShareText = text; // để test đọc lại
    const how = await D.share(text);
    if (how === "copied") { shareBtn.textContent = "Đã chép ✓"; setTimeout(() => { shareBtn.textContent = "Khoe kết quả"; }, 2200); }
  });
  const show = () => { ov.hidden = false; reopen.hidden = true; shareBtn.focus({ preventScroll: true }); };
  const hide = () => { ov.hidden = true; reopen.hidden = false; };
  ov.querySelector("#dlyView").addEventListener("click", hide);
  reopen.addEventListener("click", show);
  const cnt = ov.querySelector("#dlyCount");
  const tick = () => {
    const ms = D.msUntilNext();
    if (D.dayNumber() !== day) { cnt.parentElement.innerHTML = `Đã có đề mới! <a class="dly-btn" href="?daily=1" style="min-height:36px;margin-left:8px">Chơi #${D.dayNumber()}</a>`; clearInterval(t); return; }
    cnt.textContent = D.fmtCountdown(ms);
  };
  tick();
  const t = setInterval(tick, 1000);
  show();
  // Bảng xếp hạng: nạp lười, lỗi gì cũng chỉ ẩn phần này (kết quả + nút Khoe vẫn dùng được).
  const lb = ov.querySelector("#dlyLb");
  if (board) {
    import("./daily-board.js?v=board1")
      .then((m) => m.mountBoard(lb, { game, day, result }))
      .then((st) => { window.__dailyBoardState = st; })
      .catch(() => { lb.hidden = true; window.__dailyBoardState = "failed"; });
  }
  return { el: ov, show, hide, destroy() { clearInterval(t); ov.remove(); reopen.remove(); } };
}

export { D };
