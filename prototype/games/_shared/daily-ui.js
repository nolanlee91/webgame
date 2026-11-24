// Thử thách hôm nay — phần giao diện dùng chung trong game: nhãn "Thử thách #N" và bảng kết quả.
// Bảng kết quả tự mang CSS riêng (tiền tố .dly-), lấy màu từ biến của game (--panel, --gold…) nếu có,
// theo Pixel UI V5 của HUD trong game: viền 3px, vát, bóng cứng, không bo tròn.
import * as D from "./daily.js?v=daily1";

const CSS = `
.dly-chip{display:inline-flex;align-items:center;gap:6px;margin-left:12px;padding:3px 9px;vertical-align:middle;font:800 12px/1.2 "Be Vietnam Pro",system-ui,sans-serif;
  letter-spacing:.06em;text-transform:uppercase;text-shadow:none;color:#2c1b05;background:var(--gold,#ffc94a);box-shadow:0 0 0 3px var(--gold-d,#5a3a08)}
.dly-ov{position:fixed;inset:0;z-index:50;display:grid;place-items:center;padding:12px;background:rgba(10,8,7,.8);overflow:auto}
.dly-ov[hidden],.dly-reopen[hidden]{display:none!important}
.dly-card{width:min(440px,100%);margin:3px 7px 7px 3px;padding:20px 20px 22px;text-align:center;color:var(--ink,#f4ead2);background:var(--panel,#1d1a16);
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
@media (max-width:420px){.dly-card{padding:16px 14px 18px}.dly-card h2{font-size:22px}.dly-grid{font-size:21px}.dly-stats b{font-size:19px}}
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
export function panel({ game, day, result, title = "Xong rồi!", normalUrl = "./", homeUrl = "../../homepage/" }) {
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
  return { el: ov, show, hide, destroy() { clearInterval(t); ov.remove(); reopen.remove(); } };
}

export { D };
