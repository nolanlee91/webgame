// Cờ Cá Ngựa — lớp UI/HUD bằng DOM (thẻ người chơi, khay xúc xắc, nút chức năng, phòng chờ, bảng xếp hạng).
// Chỉ hiển thị: nhận "view" từ game.js mỗi khung hình, gọi lại game.js qua các hàm on* khi người chơi bấm.
// Không biết gì về luật — luật nằm trong logic.js.
const ICON = (n) => new URL("assets/icon-" + n + ".png", import.meta.url).href;
const ic = (n, cls = "") => `<img class="px-ic ${cls}" src="${ICON(n)}" alt="" draggable="false">`;
const COLORS = ["red", "blue", "yellow", "green"]; // màu hiển thị theo ghế = màu nhánh trên board-v5 (game.js VIEW_COLORS)
const NAMES = ["Đỏ", "Xanh dương", "Vàng", "Xanh lá"];
const HEX = { red: ["#e0483d", "#7a1c17"], green: ["#3fae4a", "#17521c"], yellow: ["#f2b632", "#7a5410"], blue: ["#3a7bd5", "#163a73"] };
// Ghế 0 Đỏ trên-trái, 3 Xanh lá trên-phải, 1 Xanh dương dưới-trái, 2 Vàng dưới-phải (khớp lán chuồng trên board-v5).
const SEAT_ORDER = [0, 3, 2, 1];
const seatVars = (s) => `--seat:${HEX[COLORS[s]][0]};--seat-d:${HEX[COLORS[s]][1]}`;

let cssAdded = false;
function addCss() {
  if (cssAdded || document.querySelector("link[data-cn-hud]")) return;
  const l = document.createElement("link");
  l.rel = "stylesheet"; l.href = new URL("hud.css", import.meta.url).href; l.dataset.cnHud = "";
  document.head.appendChild(l); cssAdded = true;
}

export function createHud(root, cb) {
  addCss();
  root.classList.add("cn-table");
  root.innerHTML = `
    <div class="cn-top">
      <div class="cn-status" aria-live="polite"></div>
      <div class="cn-tools">
        <button class="px-btn icon" data-act="mute" type="button" title="Âm thanh (M)" aria-label="Âm thanh"><img alt="" draggable="false"></button>
        <button class="px-btn icon play-only" data-act="pause" type="button" title="Tạm dừng (P)" aria-label="Tạm dừng">${ic("tam-dung").replace("px-ic", "")}</button>
        <button class="px-btn icon play-only" data-act="leave" type="button" title="Rời bàn — về phòng chờ" aria-label="Rời bàn, về phòng chờ">${ic("roi-phong").replace("px-ic", "")}</button>
      </div>
    </div>
    <div class="cn-arena">
      ${SEAT_ORDER.map((s) => `
      <div class="cn-seat" data-seat="${s}" style="${seatVars(s)}">
        <div class="cn-card"></div>
        <div class="cn-tray">
          <div class="pit" role="button" aria-label="Khay xúc xắc ${NAMES[s]}"><canvas width="256" height="250"></canvas><div class="badge" hidden></div></div>
          <div class="lbl"></div>
        </div>
      </div>`).join("")}
      <div class="cn-board"></div>
      <aside class="cn-lobby px-panel" aria-label="Phòng chờ">
        <div class="ttl"><h2 class="px-h">Phòng · <span class="code">Chơi chung máy</span></h2>
          <button class="px-btn icon" data-act="copy" type="button" title="Sao chép link phòng" aria-label="Sao chép link phòng">${ic("copy-link").replace("px-ic", "")}</button></div>
        <div class="sec sec-n"><div class="lb">Số người</div>
          <div class="segs">${[2, 3, 4].map((n) => `<button class="px-btn seg" data-n="${n}" type="button" aria-pressed="false">${n} người</button>`).join("")}</div></div>
        <div class="sec"><div class="lb">Chỗ ngồi</div><div class="rows">
          ${[0, 1, 2, 3].map((s) => `<div class="cn-row" data-seat="${s}" style="${seatVars(s)}"><canvas class="av" width="64" height="64"></canvas><span class="nm">${NAMES[s]}${s === 0 ? " " + ic("chu-phong") : ""}</span><span class="st"></span></div>`).join("")}
        </div></div>
        <div class="sec"><div class="lb">Luật xuất ngựa <span class="host-only-note"></span></div>
          <div class="segs"><button class="px-btn seg" data-rule="6" type="button">Gieo 6</button><button class="px-btn seg" data-rule="16" type="button">Gieo 1 hoặc 6</button></div></div>
        <div class="act">
          <button class="px-btn primary big" id="playBtn" data-act="play" type="button">Chơi</button>
          <div class="note">Chơi chung một máy, chuyền tay nhau theo lượt.</div>
          <button class="px-btn net-only" data-act="leave-room" type="button">${ic("roi-phong")} Rời phòng</button>
          <a class="px-link local-only" data-act="home" href="${cb.homeHref}">Rời phòng</a>
        </div>
      </aside>
    </div>
    <div class="cn-result" hidden>
      <div class="box px-panel" role="dialog" aria-label="Kết quả ván">
        <div class="head"><h2 class="px-h"></h2></div>
        <canvas class="podium" width="960" height="552"></canvas>
        <table><thead><tr><th></th><th style="text-align:left">Phường</th><th>Về đích</th><th>${ic("xuc-xac-6")} Gieo 6</th><th>Đá quân</th></tr></thead><tbody></tbody></table>
        <div class="btns">
          <button class="px-btn primary" data-act="again" type="button">Ván mới</button>
          <button class="px-btn" data-act="room" type="button">Về phòng</button>
          <a class="px-link" href="${cb.homeHref}">Trang chủ</a>
        </div>
      </div>
    </div>`;
  const $ = (sel) => root.querySelector(sel);
  const seatEl = (s) => root.querySelector(`.cn-seat[data-seat="${s}"]`);
  const status = $(".cn-status"), muteImg = $('[data-act="mute"] img');
  const result = $(".cn-result");

  // Bấm: chặn pointerdown lan xuống canvas; nút gọi lại game.
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act],[data-n],[data-rule]");
    if (!b || b.disabled) return;
    if (b.dataset.n) return cb.onPlayers(Number(b.dataset.n));
    if (b.dataset.rule) return cb.onRule(b.dataset.rule);
    const a = b.dataset.act;
    if (a === "mute") cb.onMute();
    if (a === "pause") cb.onPause();
    if (a === "leave" || a === "room" || a === "leave-room") {
      if (online && a === "leave" && !online.over && !confirm("Rời ván đang chơi? Máy chủ sẽ đi thay phần của bạn.")) return;
      cb.onLobby();
    }
    if (a === "play") cb.onPlay();
    if (a === "again") cb.onAgain();
    if (a === "copy") {
      const u = cb.shareUrl();
      (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => flash(b, "Đã chép link")).catch(() => flash(b, u));
    }
  });
  for (const s of [0, 1, 2, 3]) {
    seatEl(s).querySelector(".pit").addEventListener("pointerdown", (e) => { e.preventDefault(); cb.onTray(s); });
    seatEl(s).querySelector(".lbl").addEventListener("click", (e) => { if (e.target.closest("[data-roll]")) cb.onTray(s); });
  }
  function flash(el, text) { const t = el.title; el.title = text; status.textContent = text; setTimeout(() => (el.title = t), 1500); }

  let lastKey = "", lastActive = -2, avatarsDone = false, online = null;
  const esc = (t) => String(t).replace(/[&<>"']/g, (ch) => "&#" + ch.charCodeAt(0) + ";");
  const who = (v, s) => (v.online ? v.online.list.find((x) => x.seat === s) : null);   // người ngồi ghế s (online)
  const trayCanvas = (s) => seatEl(s).querySelector(".pit canvas");

  function card(s, v) {
    const c = v.cards[s];
    if (!c) return `<div class="e">CHỖ TRỐNG</div>`;
    const seg = Math.round(c.progress * 10);
    return `<div class="tab">${s === 1 || s === 2 ? "▲" : "▼"} LƯỢT</div>
      <div class="who"><canvas class="av" width="96" height="96"></canvas><div>${cardName(v, s)}</div></div>
      <div class="slots">${c.slots.map((k) => `<i class="slot ${k}"></i>`).join("")}<span class="cnt">${c.home}/4</span></div>
      <div class="px-bar" title="Quãng đường đã đi">${Array.from({ length: 10 }, (_, i) => `<i class="${i < seg ? "on" : ""}"></i>`).join("")}</div>`;
  }
  function cardName(v, s) {
    const p = who(v, s);
    if (!p) return `<div class="nm">${NAMES[s]}</div><div class="sub">Người chơi ${v.seats.indexOf(s) + 1}</div>`;
    const sub = p.away === "left" ? `<span class="off">Đã rời · máy đi thay</span>` : p.away ? `${ic("mat-ket-noi")} <span class="off">Mất kết nối</span>` : (p.me ? "Bạn · " : "") + "Phường " + NAMES[s];
    return `<div class="nm" title="${esc(p.name)}">${esc(p.name)}${p.host ? " " + ic("chu-phong") : ""}</div><div class="sub">${sub}</div>`;
  }
  function trayLabel(t, v) {
    const p = v && who(v, t.seat), nm = p ? esc(p.name) : "";
    const left = v && v.online && v.online.left != null && v.online.left <= 10 ? ` · ${v.online.left}s` : "";
    switch (t.state) {
      case "wait": return `<span class="tag">Chờ ${nm} gieo${left}</span>`;
      case "otherpick": return `<span class="tag">${nm} chọn ngựa${left}</span>`;
      case "ready": return `<button class="px-btn primary" data-roll type="button">Chạm để gieo${left}</button>`;
      case "again": return `<button class="px-btn primary" data-roll type="button">${ic("xuc-xac-6")} Gieo tiếp</button>`;
      case "rolling": return `<span class="tag">Đang gieo…</span>`;
      case "pick": return `<span class="tag gold">Chọn ngựa${left}</span>`;
      case "moving": return `<span class="tag">Ngựa đang đi</span>`;
      case "nomove": return `<span class="tag grey">✕ Không đi được</span>`;
      default: return "";
    }
  }

  function update(v) {
    const key = JSON.stringify([v.lobby, v.players, v.rule, v.seats, v.active, v.cards, v.tray, v.paused, v.muted, v.msg, !!v.over, v.online]);
    if (key === lastKey) return;
    lastKey = key;
    online = v.online ? { ...v.online, over: !!v.over } : null;
    root.classList.toggle("is-lobby", v.lobby);
    root.classList.toggle("is-online", !!v.online);
    lobbyOnline(v);
    status.textContent = v.msg;
    muteImg.src = ICON(v.muted ? "am-thanh-tat" : "am-thanh-bat");
    $('[data-act="mute"]').setAttribute("aria-pressed", String(v.muted));
    $('[data-act="mute"]').title = v.muted ? "Đang tắt tiếng — bấm để bật (M)" : "Đang bật tiếng — bấm để tắt (M)";
    $('[data-act="pause"]').classList.toggle("is-down", v.paused);
    // phòng chờ
    root.querySelectorAll("[data-n]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.n) === v.players)));
    root.querySelectorAll("[data-rule]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.rule === v.rule)));
    if (!v.online) root.querySelectorAll(".cn-row").forEach((r) => {
      const s = Number(r.dataset.seat), on = v.seats.includes(s);
      r.classList.toggle("off", !on);
      r.querySelector(".st").innerHTML = on ? `${ic("san-sang")} Sẵn sàng` : "Chỗ trống";
    });
    // thẻ + khay
    for (const s of [0, 1, 2, 3]) {
      const el = seatEl(s), cd = el.querySelector(".cn-card"), tr = el.querySelector(".cn-tray");
      const present = !!v.cards[s];
      cd.className = "cn-card" + (!present ? " empty" : s === v.active ? " active" : v.active >= 0 ? " dim" : "");
      cd.innerHTML = card(s, v);
      const t = v.tray && v.tray.seat === s ? v.tray : null;
      tr.hidden = !present;
      tr.className = "cn-tray" + (t ? " on" : "") + (t && (t.state === "ready" || t.state === "again") ? " can" : "") + (t && t.state === "again" ? " six" : "");
      tr.querySelector(".lbl").innerHTML = t ? trayLabel(t, v) : "";
      const badge = tr.querySelector(".badge");
      badge.hidden = !(t && t.face && t.state !== "rolling");
      if (t && t.face) badge.textContent = t.face;
    }
    if (v.active !== lastActive && v.active >= 0) {
      const tr = seatEl(v.active).querySelector(".cn-tray");
      tr.classList.remove("arrive"); void tr.offsetWidth; tr.classList.add("arrive");
      setTimeout(() => tr.classList.remove("arrive"), 400);
    }
    lastActive = v.active;
    avatarsDone = false;
    // bảng xếp hạng
    result.hidden = !v.over;
    if (v.over) {
      const w = v.over.order[0].seat;
      result.querySelector(".head").setAttribute("style", seatVars(w));
      const pw = who(v, w);
      result.querySelector(".head .px-h").textContent = pw ? (pw.me ? "Bạn thắng!" : pw.name + " thắng!") : "Phường " + NAMES[w] + " thắng!";
      result.querySelector('[data-act="room"]').textContent = v.online ? "Rời phòng" : "Về phòng";
      result.querySelector("tbody").innerHTML = v.over.order.map((r, i) => `<tr style="${seatVars(r.seat)}"><td class="rk">#${i + 1}</td><td class="n"><i></i>${who(v, r.seat) ? esc(who(v, r.seat).name) : NAMES[r.seat]}</td><td>${r.home}/4</td><td>${r.sixes}</td><td>${r.kicks}</td></tr>`).join("");
    }
  }

  // Phòng chờ online: mã phòng, tên người đã vào, chỉ chủ phòng đổi luật / bắt đầu.
  function lobbyOnline(v) {
    const o = v.online, code = $(".cn-lobby .code"), play = $("#playBtn"), note = $(".cn-lobby .note");
    if (!o) { code.textContent = "Chơi chung máy"; play.textContent = "Chơi"; play.disabled = false; note.textContent = "Chơi chung một máy, chuyền tay nhau theo lượt."; $(".host-only-note").textContent = ""; root.querySelectorAll("[data-rule]").forEach((b) => (b.disabled = false)); return; }
    code.textContent = o.code;
    $('[data-act="copy"]').title = "Sao chép link mời vào phòng " + o.code;
    root.querySelectorAll("[data-rule]").forEach((b) => (b.disabled = !o.host));
    $(".host-only-note").textContent = o.host ? "" : "(chủ phòng chọn)";
    play.textContent = o.host ? "Bắt đầu" : "Chờ chủ phòng";
    play.disabled = !o.host || o.count < 2;
    note.textContent = o.count < 2 ? "Gửi mã " + o.code + " (hoặc bấm nút chép link) cho bạn bè — cần ít nhất 2 người, tối đa 4." : o.host ? "Mọi người đã vào đủ thì bấm Bắt đầu." : "Mỗi người chơi trên máy của mình, theo lượt.";
    root.querySelectorAll(".cn-row").forEach((r) => {
      const s = Number(r.dataset.seat), p = v.lobby ? o.list.find((x) => x.seat === s) : who(v, s);
      r.classList.toggle("off", !p);
      r.querySelector(".nm").innerHTML = p ? esc(p.name) + (p.me ? " (Bạn)" : "") + (p.host ? " " + ic("chu-phong") : "") : NAMES[s];
      r.querySelector(".st").innerHTML = !p ? "Đang chờ…" : p.away ? `${ic("mat-ket-noi")} Mất kết nối` : `${ic("san-sang")} Sẵn sàng`;
      r.querySelector(".st").classList.toggle("bad", !!(p && p.away));
    });
  }

  return {
    update,
    boardEl: $(".cn-board"),
    trayCanvas,
    podiumCanvas: () => result.querySelector("canvas.podium"),
    // Ảnh đại diện (đầu ngựa) — vẽ lại khi thẻ đổi nội dung.
    paintAvatars(draw) {
      if (avatarsDone) return;
      avatarsDone = draw(root.querySelectorAll("canvas.av"));
    },
    trayRect(s) { return seatEl(s).querySelector(".pit").getBoundingClientRect(); },
    destroy() { root.innerHTML = ""; root.classList.remove("cn-table", "is-lobby"); },
  };
}
export { COLORS as HUD_COLORS };
