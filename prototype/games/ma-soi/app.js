// Ma Sói — client. Chỉ hiển thị góc nhìn server gửi cho ghế mình; client không bao giờ biết vai người khác
// trừ khi server cho phép (người chết, hết ván, Sói thấy Sói). Không ghi state ra console.
const $ = (id) => document.getElementById(id);
const SESS = "ma-soi:sess";

const ROLE = {
  wolf: { name: "Ma Sói", img: "role-ma-soi.webp", desc: "Mỗi đêm cùng bầy chọn một người để cắn. Ban ngày giả làm dân lành.", team: "Phe Sói" },
  seer: { name: "Tiên Tri", img: "role-tien-tri.webp", desc: "Mỗi đêm soi một người để biết họ thuộc phe Sói hay phe Làng.", team: "Phe Làng" },
  guard: { name: "Bảo Vệ", img: "role-bao-ve.webp", desc: "Mỗi đêm che chắn một người khỏi Sói. Không bảo vệ cùng một người hai đêm liền.", team: "Phe Làng" },
  villager: { name: "Dân Làng", img: "role-dan-lang.webp", desc: "Không có phép, chỉ có lý lẽ. Ban ngày bàn bạc và bỏ phiếu tìm ra Sói.", team: "Phe Làng" },
};
const PHASE = {
  lobby: ["Phòng chờ", "Chờ đủ người"], reveal: ["Phát thẻ vai", "Xem vai bí mật của bạn"],
  night: ["Đêm", "Cả làng đi ngủ"], dawn: ["Bình minh", "Chuyện gì đã xảy ra đêm qua?"],
  day: ["Ban ngày", "Bàn bạc tìm Sói"], vote: ["Bỏ phiếu", "Chọn người bị treo cổ"],
  verdict: ["Phán quyết", "Kết quả bỏ phiếu"], end: ["Hết ván", ""],
};
const ERR = {
  started: "Ván đã bắt đầu, không vào được nữa.", full: "Phòng đã đủ 8 người.", name: "Hãy nhập tên (tối đa 16 ký tự).",
  "name-taken": "Tên này đã có người dùng trong phòng.", phase: "Chưa tới lúc làm việc này.", "not-host": "Chỉ chủ phòng mới làm được.",
  "need-players": "Cần ít nhất 6 người để bắt đầu.", dead: "Bạn đã bị loại, chỉ được xem.", target: "Không chọn được người này.",
  done: "Đêm nay bạn đã soi rồi.", "same-guard": "Không được bảo vệ cùng một người hai đêm liền.", "no-action": "Vai của bạn không có hành động ban đêm.",
  night: "Ban đêm cả làng phải im lặng.", empty: "Tin nhắn trống.", bad: "Yêu cầu không hợp lệ.", gone: "Phòng đã đóng.",
  slow: "Bạn thao tác nhanh quá, chờ một chút.", "chat-slow": "Bạn nhắn nhanh quá — chờ một giây rồi gửi tiếp.", already: "Bạn đã ở trong phòng.", busy: "Máy chủ đang bận, thử lại sau.",
  "no-room": "Không tìm thấy phòng với mã này.", "no-seat": "Phiên cũ đã hết hạn.", server: "Máy chủ gặp lỗi, thử lại.",
};
const STATE_ICON = { eliminated: 0, sleeping: 1, discuss: 2, vote: 3, suspicion: 4, revealed: 5, victory: 6, ready: 7 };
const HUD = { sun: [0, 0], moon: [50, 0], shield: [100, 0], orb: [0, 100], claw: [50, 100], noose: [100, 100] };

let ws = null, v = null, offset = 0, sess = load(), retry = 0, pending = null, tab = "village", lastPhase = null, lastRoundSeen = -1, endHidden = false, revealShown = -1;

function load() { try { return JSON.parse(sessionStorage.getItem(SESS)) || null; } catch { return null; } }
// Khách (guest): danh tính trong phòng = token 128 bit do server cấp, giữ ở tab (sessionStorage) + bản dự phòng trên máy
// (localStorage) để lỡ đóng tab vẫn "Quay lại phòng" được. Không tài khoản, không mật khẩu.
const LAST = "ma-soi:last";
function save(s) {
  sess = s;
  if (s) { sessionStorage.setItem(SESS, JSON.stringify(s)); localStorage.setItem(LAST, JSON.stringify(s)); }
  else { sessionStorage.removeItem(SESS); localStorage.removeItem(LAST); }
}
const now = () => Date.now() + offset;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nameOf = (s) => v?.players[s]?.name ?? "?";
const me = () => v?.players[v.seat];

// ---------------- âm thanh ----------------
// Dùng chung khoá "wgp.muted" với trang chủ (#soundBtn) và các game khác. Trình duyệt chỉ cho phát sau lần chạm/bấm đầu tiên.
// Mọi tiếng đều suy ra từ góc nhìn CỦA CHÍNH ghế này (viewFor) ⇒ không lộ thêm gì về vai người khác.
const MUTE_KEY = "wgp.muted";
const sfx = (() => {
  const names = ["hu-dem", "chieng-sang", "lat-the", "trong-phieu", "tin-nhan", "thang", "thua", "buoc-nhay", "trung-da", "het-gio"];
  const AC = window.AudioContext || window.webkitAudioContext;
  let ac = null; const buf = {};
  const muted = () => { try { return localStorage.getItem(MUTE_KEY) === "1"; } catch { return false; } };
  function init() {
    if (ac || !AC) return;
    ac = new AC();
    for (const n of names) fetch(`assets/sfx/${n}.ogg`).then((r) => r.arrayBuffer()).then((b) => ac.decodeAudioData(b)).then((d) => { buf[n] = d; }).catch(() => {});
  }
  const unlock = () => { init(); if (ac?.state === "suspended") ac.resume().catch(() => {}); };
  for (const e of ["pointerdown", "keydown"]) window.addEventListener(e, unlock, { capture: true, passive: true });
  return {
    muted,
    log: [],
    play(n, vol = 1, delay = 0) {
      this.log.push(n); if (this.log.length > 200) this.log.shift();
      if (muted() || !ac || !buf[n]) return false;
      const src = ac.createBufferSource(), g = ac.createGain();
      src.buffer = buf[n]; g.gain.value = vol; src.connect(g).connect(ac.destination); src.start(ac.currentTime + delay / 1000);
      return true;
    },
  };
})();
window.__sfx = sfx; // cho test E2E đọc nhật ký tiếng
function showSnd() {
  const m = sfx.muted(), b = $("sndBtn");
  b.setAttribute("aria-pressed", String(m)); b.setAttribute("aria-label", m ? "Bật âm thanh" : "Tắt âm thanh"); b.title = m ? "Bật âm thanh" : "Tắt âm thanh";
  b.classList.toggle("is-off", m);
}
/** So góc nhìn cũ ↔ mới của CHÍNH MÌNH để phát tiếng cho các mốc: vào phòng, lật vai, đêm/ngày, bỏ phiếu, có người chết, tin nhắn, hết ván. */
function soundFor(a, b) {
  if (!a || !b || a.code !== b.code) return; // lần đầu nhận trạng thái (mới vào / tải lại) ⇒ im lặng
  const last = b.events[b.events.length - 1];
  if (a.phase !== b.phase) {
    if (b.phase === "lobby") sfx.play("buoc-nhay");
    else if (b.phase === "reveal") sfx.play("lat-the", 1, 350);
    else if (b.phase === "night") sfx.play("hu-dem", 0.8);
    else if (b.phase === "dawn") { sfx.play("chieng-sang", 0.8); if (last?.kind === "bite") sfx.play("trung-da", 1, 1200); }
    else if (b.phase === "vote") sfx.play("trong-phieu");
    else if (b.phase === "verdict" && last?.kind === "hang") sfx.play("trung-da");
    else if (b.phase === "end") { const my = b.players[b.seat]; sfx.play(my?.role && (my.role === "wolf") === (b.winner === "wolf") ? "thang" : "thua"); }
  } else if (b.phase === "lobby" && b.players.length > a.players.length) sfx.play("buoc-nhay", 0.7);
  const fresh = (x, y) => { const t = x?.length ? x[x.length - 1].ts : -1; return (y || []).some((c) => c.ts > t && c.seat !== b.seat); };
  if (fresh(a.chat, b.chat) || fresh(a.wolfChat, b.wolfChat)) sfx.play("tin-nhan", 0.7);
}

// ---------------- kết nối ----------------
function connect() {
  const url = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws/ma-soi`;
  try { ws = new WebSocket(url); } catch { return offline(); }
  let opened = false;
  ws.onopen = () => {
    opened = true; retry = 0; $("net").hidden = true;
    if (sess) send({ t: "resume", code: sess.code, token: sess.token });
    else if (pending) { send(pending); pending = null; }
  };
  ws.onmessage = (e) => { let m; try { m = JSON.parse(e.data); } catch { return; } onMsg(m); };
  ws.onclose = (e) => {
    ws = null;
    if (e.code === 4000) return; // tab khác đã thay
    if (!opened && !sess) return offline();
    if (sess) { $("net").hidden = false; setTimeout(connect, Math.min(8000, 500 * 2 ** retry++)); }
  };
}
function offline() { homeMsg("Máy chủ Ma Sói chưa bật ở bản này. Khi chạy thử: npm run dev:ma-soi"); }
function send(o) {
  if (o.t === "act" || o.t === "vote") sfx.play("buoc-nhay", 0.8);
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(o));
  else if (o.t === "create" || o.t === "join") { pending = o; if (!ws) connect(); }
}

function onMsg(m) {
  switch (m.t) {
    case "joined": save({ code: m.code, token: m.token }); history.replaceState(null, "", `?p=${m.code}`); break;
    case "state": { offset = m.now - Date.now(); const prev = v; v = m.v; render(); soundFor(prev, v); break; }
    case "err":
      if (m.code === "no-seat" || (m.code === "no-room" && !v)) { save(null); showHome(); if (m.code === "no-room") homeMsg(ERR["no-room"]); break; }
      toast(ERR[m.code] || "Có lỗi xảy ra."); break;
    case "kicked": case "left": save(null); v = null; showHome(); homeMsg(m.t === "kicked" ? "Bạn đã rời phòng." : ""); break;
    case "replaced": save(null); v = null; showHome(); homeMsg("Phòng này đang mở ở tab khác."); break;
  }
}

// ---------------- màn đầu ----------------
function homeMsg(t) { $("homeMsg").textContent = t; }
function showHome() { $("home").hidden = false; $("game").hidden = true; $("barCode").hidden = true; $("ovEnd").hidden = true; $("ovReveal").hidden = true; setTheme("day"); }
function needName() { const n = $("nameInp").value.trim(); if (!n) { homeMsg(ERR.name); $("nameInp").focus(); return null; } localStorage.setItem("ma-soi:name", n); return n; }
$("nameInp").value = localStorage.getItem("ma-soi:name") || "";
const qp = new URLSearchParams(location.search).get("p"); if (qp) $("codeInp").value = qp.toUpperCase();
$("createBtn").onclick = () => { const n = needName(); if (n) { homeMsg("Đang tạo phòng…"); send({ t: "create", name: n }); } };
$("joinBtn").onclick = () => {
  const n = needName(); if (!n) return;
  const c = $("codeInp").value.trim().toUpperCase(); if (c.length !== 5) { homeMsg("Mã phòng gồm 5 ký tự."); return; }
  homeMsg("Đang vào phòng…"); send({ t: "join", code: c, name: n });
};
$("codeInp").addEventListener("keydown", (e) => { if (e.key === "Enter") $("joinBtn").click(); });

// ---------------- vẽ ----------------
function setTheme(t) {
  const night = t === "night";
  if (document.body.classList.contains("is-night") !== night) {
    const st = $("stage"); st.classList.remove("shift"); void st.offsetWidth; st.classList.add("shift");
  }
  document.body.classList.toggle("is-night", night); document.body.classList.toggle("is-day", !night);
}
function hud(el, k) { const [x, y] = HUD[k]; el.style.backgroundPosition = `${x}% ${y}%`; }

function render() {
  if (!v) return;
  $("home").hidden = true; $("game").hidden = false; $("barCode").hidden = false; $("barCodeTxt").textContent = v.code;
  const ph = v.phase, my = me();
  setTheme(ph === "night" || ph === "reveal" ? "night" : "day");
  const changed = ph !== lastPhase; lastPhase = ph;
  if (changed) onPhase(ph);
  document.body.classList.toggle("is-lobby", ph === "lobby");
  renderDial(); renderSeats(); renderMe(); renderAct(); renderChat(); renderLobby();
  if (ph === "end" && !endHidden) renderEnd(); else if (ph !== "end") { $("ovEnd").hidden = true; endHidden = false; }
  if (ph === "reveal" && revealShown !== v.round && my?.role) showReveal(my.role);
  if (ph !== "reveal") $("ovReveal").hidden = true;
}

function onPhase(ph) {
  const last = v.events[v.events.length - 1];
  let txt = null;
  if (ph === "night") txt = `Đêm thứ ${v.round} — cả làng đi ngủ`;
  else if (ph === "dawn" && last) txt = last.kind === "bite" ? `${nameOf(last.seat)} bị Sói cắn đêm qua (${ROLE[last.role].name})` : "Đêm qua bình yên, không ai chết";
  else if (ph === "day") txt = "Trời sáng — bàn bạc đi!";
  else if (ph === "vote") txt = "Bỏ phiếu treo cổ";
  else if (ph === "verdict" && last) txt = last.kind === "hang" ? `${nameOf(last.seat)} bị treo cổ (${ROLE[last.role].name})` : "Không ai bị treo cổ";
  if (txt) banner(txt);
}
let bannerT;
function banner(t) { const b = $("banner"); b.textContent = t; b.hidden = false; b.style.animation = "none"; void b.offsetWidth; b.style.animation = ""; clearTimeout(bannerT); bannerT = setTimeout(() => (b.hidden = true), 2600); }

function renderDial() {
  const ph = v.phase, [t, sub] = PHASE[ph];
  const alive = v.players.filter((p) => p.alive).length;
  $("phaseTxt").textContent = ph === "night" || ph === "day" ? `${t} ${v.round}` : ph === "end" ? (v.winner === "wolf" ? "Sói thắng" : "Làng thắng") : t;
  $("phaseSub").textContent = ph === "lobby" ? `${v.players.length}/${v.max} người · cần ${v.min}` : ph === "end" ? "Mọi vai đã lật" : `${sub} · còn ${alive} người`;
  hud($("dialIcon"), ph === "night" || ph === "reveal" ? "moon" : ph === "vote" || ph === "verdict" ? "noose" : "sun");
}
let total = 0;
function tick() {
  if (v && v.endsAt) {
    const left = Math.max(0, v.endsAt - now());
    if (!total || left > total) total = left;
    $("secTxt").textContent = Math.ceil(left / 1000);
    // còn 5 giây bàn bạc / bỏ phiếu ⇒ nhắc một tiếng (mỗi pha một lần)
    const wk = `${v.phase}:${v.round}:${v.endsAt}`;
    if ((v.phase === "day" || v.phase === "vote") && left > 0 && left <= 5000 && warned !== wk) { warned = wk; sfx.play("het-gio", 0.7); }
    $("secBar").style.width = `${total ? (left / total) * 100 : 0}%`;
  } else if (v) { $("secTxt").textContent = ""; $("secBar").style.width = "0"; total = 0; }
  requestAnimationFrame(tick);
}
let lastEnds = 0, warned = "";
setInterval(() => { if (v && v.endsAt !== lastEnds) { lastEnds = v.endsAt; total = 0; } }, 100);
requestAnimationFrame(tick);

function canPick(p) {
  const my = me(); if (!my?.alive || !p.alive) return false;
  if (v.phase === "night" && v.night?.can) {
    if (v.night.can === "bite") return p.role !== "wolf";
    if (v.night.can === "inspect") return p.seat !== v.seat && v.night.mine === null;
    if (v.night.can === "protect") return p.seat !== v.night.banned;
  }
  if (v.phase === "vote") return p.seat !== v.seat;
  return false;
}
function selected(p) {
  if (v.phase === "night" && v.night) return v.night.mine === p.seat;
  if (v.phase === "vote" || v.phase === "verdict") return v.votes?.[v.seat] === p.seat;
  return false;
}
function badge(p) {
  const ph = v.phase;
  if (!p.alive) return "eliminated";
  if (ph === "end") return (p.role === "wolf") === (v.winner === "wolf") ? "victory" : null;
  if (ph === "night") return p.seat === v.seat || (me()?.role === "wolf" && p.role === "wolf") ? null : "sleeping";
  if ((ph === "vote" || ph === "verdict") && v.votes && p.seat in v.votes) return "vote";
  if (ph === "lobby") return p.connected ? "ready" : null;
  if (ph === "day") return "discuss";
  return null;
}

function renderSeats() {
  const box = $("seats");
  const tally = {};
  if (v.votes) for (const t of Object.values(v.votes)) if (t >= 0) tally[t] = (tally[t] || 0) + 1;
  const pack = v.night?.pack ? Object.values(v.night.pack).reduce((a, t) => ((a[t] = (a[t] || 0) + 1), a), {}) : {};
  let html = "";
  for (let i = 0; i < 8; i++) {
    const p = v.players[i];
    if (!p) { html += `<div class="seat seat--empty${v.phase === "lobby" ? "" : " seat--hide"}" aria-hidden="true"><span class="seat__av"></span><span class="seat__name">${v.phase === "lobby" ? "trống" : ""}</span></div>`; continue; }
    const cls = ["seat"]; const can = canPick(p);
    if (p.seat === v.seat) cls.push("seat--me"); if (!p.alive) cls.push("seat--dead"); if (!p.connected) cls.push("seat--off");
    if (can) cls.push("seat--can"); if (selected(p)) cls.push("seat--sel");
    const av = `${(p.avatar % 4) * (100 / 3)}% ${Math.floor(p.avatar / 4) * 100}%`;
    const b = badge(p); const bi = b != null ? STATE_ICON[b] : null;
    const bpos = bi != null ? `${(bi % 4) * (100 / 3)}% ${Math.floor(bi / 4) * 100}%` : "";
    const roleTxt = p.role && (p.seat !== v.seat || v.phase === "end") ? `<span class="seat__role">${ROLE[p.role].name}</span>` : "";
    const votes = tally[p.seat] ? `<span class="seat__votes">${tally[p.seat]} phiếu</span>` : pack[p.seat] ? `<span class="seat__votes" style="background:var(--red);color:#fff">${pack[p.seat]} Sói</span>` : "";
    const host = v.host === p.seat && v.phase === "lobby" ? " ★" : "";
    const label = `${p.name}${p.seat === v.seat ? " (bạn)" : ""}${p.alive ? "" : ", đã bị loại"}`;
    html += `<button class="${cls.join(" ")}" data-seat="${p.seat}" ${can ? "" : 'tabindex="-1"'} aria-label="${esc(label)}">
      <span class="seat__av" style="background-position:${av}">${bi != null ? `<i class="seat__badge" style="background-position:${bpos}"></i>` : ""}${votes}</span>
      <span class="seat__name">${esc(p.name)}${host}</span>${roleTxt}</button>`;
  }
  box.innerHTML = html;
}
$("seats").addEventListener("click", (e) => {
  const b = e.target.closest(".seat[data-seat]"); if (!b || !v) return;
  const p = v.players[+b.dataset.seat]; if (!p || !canPick(p)) return;
  if (v.phase === "night") send({ t: "act", target: v.night.mine === p.seat && v.night.can !== "inspect" ? null : p.seat });
  else if (v.phase === "vote") send({ t: "vote", target: p.seat });
});

function renderMe() {
  const my = me(), r = my?.role && ROLE[my.role];
  $("meImg").src = `assets/${r ? r.img : "role-card-back.png"}`;
  $("meRole").textContent = r ? r.name : "Chưa phát thẻ";
  $("meKicker").textContent = r ? `Vai của bạn · ${r.team}` : "Vai của bạn";
  $("meDesc").textContent = r ? (my.alive ? r.desc : "Bạn đã bị loại — vẫn được xem đến hết ván, nhưng không nói và không bỏ phiếu.") : `Chờ đủ ${v.min} người, chủ phòng bấm Bắt đầu.`;
  $("mePanel").classList.toggle("me--wolf", my?.role === "wolf");
}
$("meCard").onclick = () => { const r = me()?.role; if (r) { revealShown = -2; showReveal(r, true); } };

function actIcon(i) { return `<span class="icon" style="background-position:${i * 50}% 0"></span>`; }
function renderAct() {
  const ph = v.phase, my = me(), row = $("actRow");
  let txt = "", btns = "";
  if (ph === "lobby") {
    const n = v.players.length;
    if (v.host === v.seat) { txt = n >= v.min ? "Đủ người rồi! Bấm Bắt đầu khi cả làng sẵn sàng." : `Mời thêm ${v.min - n} người nữa bằng mã phòng hoặc link.`; btns = `<button class="btn btn--gold" data-a="start" ${n >= v.min ? "" : 'aria-disabled="true"'}>Bắt đầu</button>`; }
    else txt = `Chờ chủ phòng ${esc(nameOf(v.host))} bắt đầu (cần ${v.min} người).`;
    btns += `<button class="btn" data-a="copy">Sao chép link mời</button><button class="btn" data-a="leave">Rời phòng</button>`;
  } else if (ph === "reveal") txt = "Ghi nhớ vai của bạn và đừng để ai thấy.";
  else if (!my?.alive && ph !== "end") txt = "Bạn đã bị loại. Theo dõi tiếp nhé.";
  else if (ph === "night") {
    const n = v.night || {};
    if (n.can === "bite") txt = `${actIcon(0)}${n.mine != null ? `Bạn chọn cắn <b>${esc(nameOf(n.mine))}</b>. Bấm lại để bỏ chọn.` : "Bấm vào một người để cắn. Cả bầy thống nhất trong Kênh Sói."}`;
    else if (n.can === "inspect") txt = `${actIcon(1)}${n.mine != null ? `Đã soi <b>${esc(nameOf(n.mine))}</b>.` : "Bấm vào một người để soi phe của họ."}`;
    else if (n.can === "protect") txt = `${actIcon(2)}${n.mine != null ? `Đang bảo vệ <b>${esc(nameOf(n.mine))}</b>.` : "Bấm vào một người (có thể là bạn) để bảo vệ đêm nay."}${n.banned != null ? `<br><span class="soft">Không được chọn lại ${esc(nameOf(n.banned))}.</span>` : ""}`;
    else txt = "Bạn đang ngủ say… Chờ trời sáng.";
  } else if (ph === "dawn") txt = "Mặt trời lên. Xem chuyện đêm qua.";
  else if (ph === "day") txt = "Bàn bạc trong kênh Làng, ai đáng ngờ nhất?";
  else if (ph === "vote") {
    const mine = v.votes?.[v.seat];
    txt = mine === undefined ? "Bấm vào người bạn muốn treo cổ, hoặc bỏ qua." : mine === -1 ? "Bạn đã chọn bỏ qua. Có thể đổi ý." : `Bạn bỏ phiếu cho <b>${esc(nameOf(mine))}</b>. Có thể đổi ý.`;
    btns = `<button class="btn" data-a="skip">Bỏ qua lượt này</button>`;
  } else if (ph === "verdict") txt = "Đang kiểm phiếu…";
  else if (ph === "end") { txt = v.winner === "wolf" ? "Bầy Sói đã thắng." : "Dân làng đã thắng."; btns = `<button class="btn" data-a="result">Xem kết quả</button>`; }
  $("actTxt").innerHTML = txt; row.innerHTML = btns;

  const log = $("seerLog");
  if (v.seer?.length) { log.hidden = false; log.innerHTML = v.seer.map((r) => `<li>Đêm ${r.round}: ${esc(nameOf(r.target))} là <span class="${r.team === "wolf" ? "w" : "v"}">${r.team === "wolf" ? "phe Sói" : "phe Làng"}</span></li>`).join(""); }
  else log.hidden = true;
}
$("actRow").addEventListener("click", async (e) => {
  const a = e.target.closest("[data-a]")?.dataset.a; if (!a) return;
  if (a === "start") send({ t: "start" });
  else if (a === "skip") send({ t: "vote", target: null });
  else if (a === "leave") send({ t: "leave" });
  else if (a === "result") { endHidden = false; renderEnd(); }
  else if (a === "copy") {
    const link = `${location.origin}${location.pathname}?p=${v.code}`;
    try { await navigator.clipboard.writeText(link); toast("Đã chép link mời."); } catch { toast(`Mã phòng: ${v.code}`); }
  }
});

// ---------------- phòng chờ: danh sách người + bộ vai ----------------
// Bộ vai giống hệt roleSet() của server: 2 Sói, 1 Tiên Tri, 1 Bảo Vệ, còn lại là Dân Làng. Chỉ là bản xem trước công khai,
// không chứa vai của ai — vai thật do server xáo và chia lúc bấm Bắt đầu.
const ROLE_ORDER = ["wolf", "seer", "guard", "villager"];
const roleCount = (n) => ({ wolf: 2, seer: 1, guard: 1, villager: Math.max(0, n - 4) });
const thumb = (k) => `assets/thumbs/${ROLE[k].img.replace(".webp", "-sm.webp")}`;
let lastLobbyKey = "";
function renderLobby() {
  const box = $("lobby"), on = v.phase === "lobby";
  box.hidden = !on; if (!on) { lastLobbyKey = ""; return; }
  const n = v.players.length, off = v.players.filter((p) => !p.connected).length;
  const key = JSON.stringify([v.seat, v.host, v.players.map((p) => [p.name, p.avatar, p.connected])]);
  if (key === lastLobbyKey) return; lastLobbyKey = key;

  $("pplCount").textContent = `${n}/${v.max}`;
  let rows = v.players.map((p) => {
    const av = `${(p.avatar % 4) * (100 / 3)}% ${Math.floor(p.avatar / 4) * 100}%`;
    const chips = [];
    if (v.host === p.seat) chips.push(`<span class="chip chip--host">★ Chủ phòng</span>`);
    chips.push(p.connected ? `<span class="chip chip--ok">Sẵn sàng</span>` : `<span class="chip chip--off">Mất kết nối</span>`);
    return `<li class="prow${p.connected ? "" : " prow--off"}${p.seat === v.seat ? " prow--me" : ""}">
      <span class="prow__av" style="background-position:${av}"></span>
      <span class="prow__name">${esc(p.name)}${p.seat === v.seat ? ` <i>(bạn)</i>` : ""}</span>
      <span class="prow__chips">${chips.join("")}</span></li>`;
  }).join("");
  const empty = v.max - n;
  if (empty > 0) rows += `<li class="prow prow--empty"><span class="prow__av"></span><span class="prow__name">Còn ${empty} ghế trống</span></li>`;
  $("plist").innerHTML = rows;

  // bộ vai: tính cho tối thiểu v.min người để luôn thấy đủ 4 loại vai; lệch số người ⇒ báo đỏ
  const size = Math.min(v.max, Math.max(n, v.min)), cnt = roleCount(size);
  const total = ROLE_ORDER.reduce((a, k) => a + cnt[k], 0), match = total === n;
  $("rcards").innerHTML = ROLE_ORDER.map((k) => `<figure class="rcard rcard--${k}">
      <span class="rcard__img"><img src="${thumb(k)}" alt="" width="192" height="256" loading="lazy" /><b class="rcard__n">×${cnt[k]}</b></span>
      <figcaption><b>${ROLE[k].name}</b><span>${ROLE[k].team}</span></figcaption></figure>`).join("");
  const sum = $("roleSum");
  sum.textContent = `${total} vai / ${n} người`;
  sum.className = `rsum ${match ? "rsum--ok" : "rsum--bad"}`;
  const warn = $("roleWarn");
  if (!match) { warn.className = "rwarn rwarn--bad"; warn.textContent = `Có ${total} vai cho ${n} người: số vai phải bằng số người. Mời thêm ${total - n} người nữa mới bắt đầu được.`; }
  else if (off) { warn.className = "rwarn rwarn--warn"; warn.textContent = `Khớp ${total} vai cho ${n} người — nhưng ${off} người đang mất kết nối, quá 20 giây không vào lại sẽ tự rời phòng.`; }
  else { warn.className = "rwarn rwarn--ok"; warn.textContent = `Khớp: ${total} vai cho ${n} người. ${n < v.max ? `Thêm người thì có thêm Dân Làng (tối đa ${v.max}).` : "Phòng đã đủ."}`; }
}

// ---------------- trò chuyện ----------------
// mỗi ghế một màu tên cố định (đọc rõ trên nền tối cả ngày lẫn đêm) + giờ gửi ở góc dưới
const SEAT_COLOR = ["#f5d77f", "#7ec8e3", "#f29e6d", "#9fd88a", "#d6a2f0", "#f28fae", "#6fe0c6", "#e8c39e"];
const hhmm = (ts) => { const d = new Date(ts); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
const msgLi = (c, color) => `<li class="msg"><span><b style="color:${color || SEAT_COLOR[c.seat % 8]}">${esc(nameOf(c.seat))}</b>: ${esc(c.text)}</span>${c.ts ? `<time>${hhmm(c.ts)}</time>` : ""}</li>`;
let lastLogKey = "";
function renderChat() {
  const wolf = me()?.role === "wolf" && !!v.wolfChat;
  $("tabWolf").hidden = !wolf; if (!wolf && tab === "wolf") tab = "village";
  if (wolf && v.phase === "night" && lastRoundSeen !== v.round) { tab = "wolf"; lastRoundSeen = v.round; }
  $("tabVillage").setAttribute("aria-selected", tab === "village"); $("tabWolf").setAttribute("aria-selected", tab === "wolf");
  // kênh Làng: lời nói + sự kiện (chết/treo) xếp theo thời gian vòng
  let items;
  if (tab === "wolf") items = (v.wolfChat || []).map((c) => msgLi(c, "var(--red)"));
  else {
    items = v.events.map((e) => `<li class="sys">${e.kind === "bite" ? `Đêm ${e.round}: <b>${esc(nameOf(e.seat))}</b> bị Sói cắn — là ${ROLE[e.role].name}.` : e.kind === "peace" ? `Đêm ${e.round}: bình yên.` : e.kind === "hang" ? `Ngày ${e.round}: <b>${esc(nameOf(e.seat))}</b> bị treo cổ — là ${ROLE[e.role].name}.` : `Ngày ${e.round}: không ai bị treo cổ.`}</li>`);
    items = items.concat(v.chat.map((c) => msgLi(c)));
  }
  const key = tab + items.join("");
  if (key !== lastLogKey) { lastLogKey = key; const log = $("chatLog"); log.innerHTML = items.join("") || `<li class="sys">Chưa có ai nói gì.</li>`; log.scrollTop = log.scrollHeight; }
  const my = me(), ph = v.phase;
  const canTalk = my?.alive && (tab === "wolf" ? ph === "night" : ph !== "night" && ph !== "reveal");
  document.querySelector(".chat").classList.toggle("chat--off", !canTalk);
  $("chatInp").placeholder = !my?.alive ? "Người đã bị loại không được nói" : tab === "wolf" ? "Thì thầm với bầy Sói…" : canTalk ? "Nói gì đó với cả làng…" : "Ban đêm cả làng im lặng";
  const q = $("quick");
  if (!q.childElementCount) q.innerHTML = v.quick.map((s, i) => `<button type="button" data-q="${i}">${esc(s)}</button>`).join("");
  q.hidden = tab === "wolf";
}
$("tabVillage").onclick = () => { tab = "village"; render(); };
$("tabWolf").onclick = () => { tab = "wolf"; render(); };
// điện thoại, phòng chờ: khung chat neo đáy màn hình, gập/mở để không che danh sách người và bộ vai
$("chatFold").onclick = () => {
  const open = document.querySelector(".chat").classList.toggle("chat--open");
  $("chatFold").setAttribute("aria-expanded", open); $("chatFold").textContent = open ? "Thu gọn ▼" : "Mở rộng ▲";
  const log = $("chatLog"); log.scrollTop = log.scrollHeight;
};
$("quick").addEventListener("click", (e) => { const b = e.target.closest("[data-q]"); if (b) send({ t: "quick", id: +b.dataset.q }); });
$("chatForm").addEventListener("submit", (e) => {
  e.preventDefault(); const t = $("chatInp").value.trim(); if (!t) return;
  send({ t: "chat", text: t }); $("chatInp").value = "";
});

// ---------------- lớp phủ ----------------
function showReveal(role, manual) {
  if (!manual) revealShown = v.round;
  const r = ROLE[role]; $("flipFront").src = `assets/${r.img}`; $("flipFront").alt = r.name;
  const wolves = role === "wolf" ? v.players.filter((p) => p.role === "wolf" && p.seat !== v.seat).map((p) => p.name) : [];
  $("revealCap").innerHTML = `Bạn là <b>${r.name}</b> — ${r.desc}${wolves.length ? `<br>Đồng bọn: <b style="color:var(--red)">${wolves.map(esc).join(", ")}</b>` : ""}${manual ? "<br><span class='soft'>Chạm để đóng</span>" : ""}`;
  const ov = $("ovReveal"); ov.hidden = false; $("flip").classList.remove("on");
  setTimeout(() => $("flip").classList.add("on"), 350);
  ov.onclick = manual ? () => (ov.hidden = true) : null;
}
function renderEnd() {
  const w = v.winner, my = me();
  const won = my?.role && (my.role === "wolf") === (w === "wolf");
  $("endTitle").textContent = w === "wolf" ? "Bầy Sói chiếm làng!" : "Dân làng đã diệt hết Sói!";
  $("endTitle").className = `end__title ${w}`;
  $("endSub").textContent = `${won ? "Bạn thắng ván này." : "Bạn thua ván này."} Sau ${v.round} đêm.`;
  $("endCards").innerHTML = v.players.map((p) => {
    const r = ROLE[p.role] || ROLE.villager, win = (p.role === "wolf") === (w === "wolf");
    return `<figure class="${p.alive ? "" : "dead"} ${win ? "win" : ""}"><img src="assets/${r.img}" alt=""><figcaption>${esc(p.name)}<br>${r.name}${p.alive ? "" : " · đã chết"}</figcaption></figure>`;
  }).join("");
  $("againBtn").hidden = v.host !== v.seat;
  $("ovEnd").hidden = false;
}
$("againBtn").onclick = () => send({ t: "again" });
$("endClose").onclick = () => { endHidden = true; $("ovEnd").hidden = true; };

$("sndBtn").onclick = () => {
  try { localStorage.setItem(MUTE_KEY, sfx.muted() ? "0" : "1"); } catch { /* bỏ qua */ }
  showSnd(); if (!sfx.muted()) sfx.play("buoc-nhay");
};
window.addEventListener("storage", (e) => { if (e.key === MUTE_KEY) showSnd(); }); // tắt/mở ở trang chủ (tab khác) ⇒ đồng bộ
showSnd();

let toastT;
function toast(t) { if ($("game").hidden) return homeMsg(t); banner(t); clearTimeout(toastT); }

// ---------------- khởi động ----------------
if (sess) connect();
else {
  let last = null; try { last = JSON.parse(localStorage.getItem(LAST)); } catch {}
  if (last?.code && last?.token) {
    const b = document.createElement("button"); b.className = "btn"; b.textContent = `Quay lại phòng ${last.code}`;
    b.onclick = () => { sess = last; sessionStorage.setItem(SESS, JSON.stringify(last)); homeMsg("Đang quay lại phòng…"); ws ? send({ t: "resume", ...last }) : connect(); };
    b.classList.add("btn--teal", "home__create");
    const row = document.createElement("div"); row.className = "home__row"; row.append(b);   // phòng đang chơi dở ⇒ lựa chọn nổi bật nhất, đặt trên cùng
    document.querySelector(".home__opt").before(row);
  } $("createBtn").addEventListener("pointerenter", () => { if (!ws) connect(); }, { once: true }); }
