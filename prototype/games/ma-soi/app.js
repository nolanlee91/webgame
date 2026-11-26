// Ma Sói — client. Chỉ hiển thị góc nhìn server gửi cho ghế mình; client không bao giờ biết vai người khác
// trừ khi server cho phép (người chết, hết ván, Sói thấy Sói). Không ghi state ra console.
import { isChatOff, initChatOff } from "../_shared/chat-off.js?v=co1";
import { sharedName, sessionId, initKick, kickButtonHTML, KICKED_TEXT, BANNED_TEXT, KICK_ERR } from "../_shared/online-kit.js?v=d6g"; // tên dùng chung + "Mời ra"
import { pxConfirm } from "../_shared/px-confirm.js?v=pc1";
// Hộp hỏi lại kiểu pixel (thay confirm() của trình duyệt). Esc / bấm ra ngoài = Thôi.
const askLeaveGame = () => pxConfirm({ title: "Rời ván đang chơi?", text: "Ghế của bạn sẽ ở lại như người mất kết nối.", ok: "Rời ván", cancel: "Thôi", danger: true });
const askDisband = () => pxConfirm({ title: "Hủy phòng?", text: "Mọi người trong phòng sẽ bị đưa ra ngoài.", ok: "Hủy phòng", cancel: "Thôi", danger: true });
const $ = (id) => document.getElementById(id);
const SESS = "ma-soi:sess";

const ROLE = {
  mayor: { name: "Trưởng Làng", img: "role-truong-lang.webp", desc: "Một lần mỗi ván, phiếu của bạn phân xử nếu bạn bầu cho một trong hai người hòa dẫn đầu. Cả làng được báo rằng Trưởng Làng đã phân xử.", team: "Phe Làng" },
  gatekeeper: { name: "Người Gác Cổng", img: "role-nguoi-gac-cong.webp", desc: "Một lần mỗi ván, canh cửa để biết bạn có được soi, được bảo vệ hoặc là mục tiêu cắn cuối cùng của bầy Sói trong đêm đó.", team: "Phe Làng" },
  hunter: { name: "Thợ Săn", img: "role-tho-san.webp", desc: "Khi bị loại, chọn một người còn sống để kéo theo trước khi hết giờ.", team: "Phe Làng" },
  witch: { name: "Phù Thủy", img: "role-phu-thuy.webp", desc: "Một lần mỗi ván, chuẩn bị thuốc để cứu người bị Sói cắn đêm đó. Thuốc chỉ mất khi cứu được người.", team: "Phe Làng" },
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
  banned: BANNED_TEXT,
  started: "Ván đã bắt đầu, không vào được nữa.", full: "Phòng đã đủ 8 người.", name: "Hãy nhập tên (tối đa 16 ký tự).",
  "name-taken": "Tên này đã có người dùng trong phòng.", phase: "Chưa tới lúc làm việc này.", "not-host": "Chỉ chủ phòng mới làm được.",
  "need-players": "Cần ít nhất 6 người để bắt đầu.", dead: "Bạn đã bị loại, chỉ được xem.", target: "Không chọn được người này.",
  done: "Đêm nay bạn đã soi rồi.", spent: "Bạn đã dùng hết lượt kỹ năng.", "same-guard": "Không được bảo vệ cùng một người hai đêm liền.", "no-action": "Bạn không thể dùng kỹ năng này lúc này.",
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
const LAST = "ma-soi:last"; const GAME = "ma-soi";
function save(s) {
  sess = s;
  if (s) { sessionStorage.setItem(SESS, JSON.stringify(s)); localStorage.setItem(LAST, JSON.stringify(s)); }
  else { sessionStorage.removeItem(SESS); localStorage.removeItem(LAST);  document.getElementById("resumeRow")?.remove(); }
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
const newHunt = (a, b) => a && a.code === b.code && b.events.length > a.events.length && b.events.at(-1)?.kind === "hunt";
const huntText = (e) => `Thợ Săn đã kéo theo ${nameOf(e.seat)} (${ROLE[e.role].name}).`;
function soundFor(a, b) {
  if (!a || !b || a.code !== b.code) return; // lần đầu nhận trạng thái (mới vào / tải lại) ⇒ im lặng
  const last = b.events[b.events.length - 1];
  const hunted = newHunt(a, b);
  if (hunted) sfx.play("trung-da");
  if (a.phase !== b.phase) {
    if (b.phase === "lobby") sfx.play("buoc-nhay");
    else if (b.phase === "reveal") sfx.play("lat-the", 1, 350);
    else if (b.phase === "night") sfx.play("hu-dem", 0.8);
    else if (b.phase === "dawn") { sfx.play("chieng-sang", 0.8); if (last?.kind === "bite") sfx.play("trung-da", 1, 1200); }
    else if (b.phase === "day") sfx.play("buoc-nhay", 0.4); // hết bình minh ⇒ bàn bạc
    else if (b.phase === "vote") sfx.play("trong-phieu");
    else if (b.phase === "verdict" && last?.kind === "hang") sfx.play("trung-da");
    else if (b.phase === "end") { const my = b.players[b.seat]; sfx.play(my?.role && (my.role === "wolf") === (b.winner === "wolf") ? "thang" : "thua", 1, hunted ? 900 : 0); }
  } else {
    let join = false, gone = false;
    if (b.players.length < a.players.length) gone = true;
    else if (b.players.length > a.players.length) join = true;
    else b.players.forEach((p, i) => { if (i === b.seat) return; const o = a.players[i]; if (o && o.connected && !p.connected) gone = true; else if (o && !o.connected && p.connected) join = true; });
    if (join) sfx.play("buoc-nhay", 0.7); else if (gone) sfx.play("trung-da", 0.35);
  }
  const fresh = (x, y) => { const t = x?.length ? x[x.length - 1].ts : -1; return (y || []).some((c) => c.ts > t && c.seat !== b.seat); };
  if (!isChatOff() && (fresh(a.chat, b.chat) || fresh(a.wolfChat, b.wolfChat))) sfx.play("tin-nhan", 0.7);
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
function offline() { homeMsg("Chưa kết nối được máy chủ. Kiểm tra mạng rồi tải lại trang nhé."); }
function send(o) {
  if (o.t === "create" || o.t === "join" || o.t === "resume") o = { ...o, sid: sessionId() }; // sid: máy chủ chặn người bị "Mời ra" vào lại 10 phút
  if (["act", "vote", "hunt", "brew", "watch"].includes(o.t)) sfx.play("buoc-nhay", 0.8);
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(o));
  else if (o.t === "create" || o.t === "join") { pending = o; if (!ws) connect(); }
}

function onMsg(m) {
  switch (m.t) {
    case "joined":
      save({ code: m.code, token: m.token }); history.replaceState(null, "", `?p=${m.code}`);
      if (vsBots) for (let k = 1; k < 6; k++) send({ t: "add-bot" }); // "Chơi với máy": phòng kín + 5 bot ⇒ đủ 6 người
      break;
    case "state": {
      offset = m.now - Date.now();
      const prev = v;
      v = m.v;
      if (vsBots && v.phase === "lobby" && v.host === v.seat && v.players.length >= v.min) { vsBots = false; send({ t: "start" }); }
      render(); checkRenamed(v.players[v.seat]);
      if (newHunt(prev, v)) banner(huntText(v.events.at(-1)));
      soundFor(prev, v);
      break;
    }
    case "err":
      if (m.code === "banned") { save(null); v = null; showHome(); homeMsg(BANNED_TEXT); leaveDone(); break; } // bị mời ra: 10 phút chưa vào lại được
      if (m.code === "target" && m.req === "kick") { toast(KICK_ERR.target); break; }
      if (m.code === "no-seat" || (m.code === "no-room" && !v)) { save(null); showHome(); if (m.code === "no-room") homeMsg(ERR["no-room"]); break; }
      toast(ERR[m.code] || "Có lỗi xảy ra."); sfx.play("trung-da", 0.35); break;
    case "kicked": case "left": save(null); v = null; showHome(); homeMsg(m.t === "kicked" ? (m.by === "host" ? KICKED_TEXT : "Bạn đã rời phòng.") : ""); leaveDone(); break;
    case "closed": { // chủ phòng hủy phòng ⇒ server gửi cho mọi người (cả chủ phòng), xoá phòng, giữ kết nối
      const wasHost = v && v.host === v.seat;
      save(null); v = null; vsBots = false; showHome(); history.replaceState(null, "", location.pathname);
      homeMsg(wasHost ? "Đã hủy phòng." : "Chủ phòng đã hủy phòng."); sfx.play("trung-da", 0.35); leaveDone();
      break;
    }
    case "replaced": save(null); v = null; showHome(); homeMsg("Phòng này đang mở ở tab khác."); break;
  }
}

// ---------------- rời phòng khi bấm link về trang chủ ----------------
// Đang ở trong phòng mà bấm "← Lụm Kèo" (hay link nào về trang chủ) ⇒ báo server rời/hủy phòng trước rồi mới đi,
// để phòng không treo lại và người khác thấy mình rời ngay. Chờ "left"/"closed" tối đa 400 ms.
let leaveWait = null;
function leaveDone() { const f = leaveWait; leaveWait = null; f?.(); }
function leaveRoom() {
  return new Promise((res) => {
    if (!v || !ws || ws.readyState !== 1) { save(null); return res(); }
    const solo = v.host === v.seat && !othersHuman() && (v.phase === "lobby" || v.phase === "end");
    leaveWait = res; setTimeout(leaveDone, 400);
    send(solo ? { t: "disband" } : { t: "leave" });
  });
}
let homeLeaving = false;
document.addEventListener("click", async (e) => {
  const a = e.target.closest?.("a[href]");
  if (!a || !v || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === "_blank") return;
  let url; try { url = new URL(a.href, location.href); } catch { return; }
  if (!/\/homepage\/(index\.html)?$/.test(url.pathname)) return;
  e.preventDefault();
  if (homeLeaving) return; // đang rời rồi: bấm lại không gửi lệnh thêm lần nữa
  if (v.phase !== "lobby" && v.phase !== "end" && !(await askLeaveGame())) return;
  if (homeLeaving) return;
  homeLeaving = true;
  await leaveRoom();
  location.href = url.href;
});

// ---------------- màn đầu ----------------
function homeMsg(t) { $("homeMsg").textContent = t; }
function showHome() { $("home").hidden = false; $("game").hidden = true; $("barCode").hidden = true; $("ovEnd").hidden = true; $("ovReveal").hidden = true; setTheme("day"); }
// PARTY2-06 (D8): ô tên có bộ đếm n/16 như game cờ; dài quá thì nhắc (trước bị cắt im lặng ở 16). Máy chủ thay tên (tên chưa
// dùng được) ⇒ báo cho người chơi hiểu vì sao tên đổi.
const NAME_MAX = 16, nameLen = (s) => [...String(s || "").replace(/\s+/g, " ").trim()].length, AUTO_NAME = /^Người( chơi)? \d+$/;
let sentName = "";
function nameCount() {
  const n = nameLen($("nameInp").value), over = n > NAME_MAX;
  $("nameCount").textContent = n + "/" + NAME_MAX + (over ? " · dài quá" : ""); $("nameCount").classList.toggle("over", over);
}
function nameTooLong() {
  const n = nameLen($("nameInp").value); if (n <= NAME_MAX) return false;
  homeMsg(`Tên tối đa ${NAME_MAX} ký tự — bớt ${n - NAME_MAX} ký tự nhé.`); $("nameInp").focus(); return true;
}
function checkRenamed(mine) {
  if (!sentName || !mine) return;
  if (AUTO_NAME.test(mine.name) && !AUTO_NAME.test(sentName)) toast(`Tên "${sentName}" chưa dùng được nên tạm gọi bạn là ${mine.name}. Lần sau đổi tên khác nhé.`);
  sentName = "";
}
function needName() { if (nameTooLong()) return null; const n = myName.commit($("nameInp").value); sentName = n; if (!n) { homeMsg(ERR.name); $("nameInp").focus(); return null; } try { localStorage.setItem("ma-soi:name", n); } catch {} return n; }
// Ô tên điền sẵn tên dùng chung (tài khoản); người cũ có tên riêng của game ("ma-soi:name") được chuyển sang một lần.
const myName = sharedName({ game: "ma-soi", input: $("nameInp"), legacy: () => { try { return localStorage.getItem("ma-soi:name") || ""; } catch { return ""; } } });
$("nameInp").addEventListener("input", () => { nameCount(); if (/^Tên tối đa/.test($("homeMsg")?.textContent || "") && nameLen($("nameInp").value) <= NAME_MAX) homeMsg(""); });
nameCount();
initKick({ send: (o) => { send(o); return true; } }); // chủ phòng "Mời ra" người khác ở phòng chờ — hộp xác nhận pixel
const qp = new URLSearchParams(location.search).get("p"); if (qp) $("codeInp").value = qp.toUpperCase();
let vsBots = false; // bấm "Chơi với máy" ⇒ tự tạo phòng kín, thêm bot, bắt đầu luôn (dùng bot của máy chủ)
$("botBtn").onclick = () => { const n = needName(); if (n) { vsBots = true; homeMsg("Đang dọn bàn với máy…"); send({ t: "create", name: n, public: false }); } };
$("createBtn").onclick = () => { const n = needName(); if (n) { homeMsg("Đang tạo phòng…"); send({ t: "create", name: n, public: !$("privateRoom").checked }); } };
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
  else if (ph === "verdict" && last) txt = last.kind === "hang" ? `${last.byMayor ? "Trưởng Làng đã phân xử. " : ""}${nameOf(last.seat)} bị treo cổ (${ROLE[last.role].name})` : "Không ai bị treo cổ";
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
  if (v.hunt) return p.alive;
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
  if (v.hunt) return v.hunt.target === p.seat;
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
      <span class="seat__name">${esc(p.name)}${host}${p.bot ? " ·BOT" : ""}</span>${roleTxt}</button>`;
  }
  box.innerHTML = html;
}
$("seats").addEventListener("click", (e) => {
  const b = e.target.closest(".seat[data-seat]"); if (!b || !v) return;
  const p = v.players[+b.dataset.seat]; if (!p || !canPick(p)) return;
  if (v.hunt) send({ t: "hunt", target: v.hunt.target === p.seat ? null : p.seat });
  else if (v.phase === "night") send({ t: "act", target: v.night.mine === p.seat && v.night.can !== "inspect" ? null : p.seat });
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
const DISBAND_BTN = `<button class="btn btn--red" data-a="disband">Hủy phòng</button>`;
/** Còn người thật nào khác trong phòng không (bot không tính). */
const othersHuman = () => !!v && v.players.some((p, i) => i !== v.seat && !p.bot);
function renderAct() {
  const ph = v.phase, my = me(), row = $("actRow");
  let txt = "", btns = "";
  if (ph === "lobby") {
    const n = v.players.length;
    if (v.host === v.seat) { txt = n >= v.min ? "Đủ người rồi! Bấm Bắt đầu khi cả làng sẵn sàng." : `Mời thêm ${v.min - n} người nữa bằng mã phòng hoặc link.`; btns = `<button class="btn btn--gold" data-a="start" ${n >= v.min ? "" : 'aria-disabled="true"'}>Bắt đầu</button>`; }
    else txt = `Chờ chủ phòng ${esc(nameOf(v.host))} bắt đầu (cần ${v.min} người).`;
    btns += `<button class="btn" data-a="copy" aria-label="Sao chép link mời">Chép link mời</button>${v.host === v.seat ? DISBAND_BTN : ""}<button class="btn" data-a="leave">Rời phòng</button>`;
  } else if (ph === "reveal") txt = "Ghi nhớ vai của bạn và đừng để ai thấy.";
  else if (v.hunt) txt = v.hunt.target == null ? "Thợ Săn: chọn một người còn sống để kéo theo trước khi hết giờ." : `Bạn chọn <b>${esc(nameOf(v.hunt.target))}</b>. Bấm lại để bỏ chọn.`;
  else if (!my?.alive && ph !== "end") txt = "Bạn đã bị loại. Theo dõi tiếp nhé.";
  else if (ph === "night") {
    const n = v.night || {};
    if (n.can === "bite") txt = `${actIcon(0)}${n.mine != null ? `Bạn chọn cắn <b>${esc(nameOf(n.mine))}</b>. Bấm lại để bỏ chọn.` : "Bấm vào một người để cắn. Cả bầy thống nhất trong Kênh Sói."}`;
    else if (n.can === "inspect") txt = `${actIcon(1)}${n.mine != null ? `Đã soi <b>${esc(nameOf(n.mine))}</b>.` : "Bấm vào một người để soi phe của họ."}`;
    else if (n.can === "protect") txt = `${actIcon(2)}${n.mine != null ? `Đang bảo vệ <b>${esc(nameOf(n.mine))}</b>.` : "Bấm vào một người (có thể là bạn) để bảo vệ đêm nay."}${n.banned != null ? `<br><span class="soft">Không được chọn lại ${esc(nameOf(n.banned))}.</span>` : ""}`;
    else if (n.can === "brew") {
      txt = n.ready ? "Thuốc cứu người sẽ dùng nếu Sói cắn trúng mục tiêu đêm nay." : "Bạn đã dùng thuốc cứu người.";
      if (n.ready) btns = `<button class="btn" data-a="brew" aria-pressed="${n.armed}">${n.armed ? "Bỏ chuẩn bị thuốc" : "Chuẩn bị thuốc"}</button>`;
    } else if (n.can === "watch") {
      txt = n.ready ? "Canh cửa đêm nay để biết có hành động nào tác động tới bạn." : "Bạn đã dùng lượt canh cửa.";
      if (n.ready) btns = `<button class="btn" data-a="watch" aria-pressed="${n.armed}">${n.armed ? "Hủy canh cửa" : "Canh cửa"}</button>`;
    } else txt = "Bạn đang ngủ say… Chờ trời sáng.";
  } else if (ph === "dawn") txt = "Mặt trời lên. Xem chuyện đêm qua.";
  else if (ph === "day") txt = "Bàn bạc trong kênh Làng, ai đáng ngờ nhất?";
  else if (ph === "vote") {
    const mine = v.votes?.[v.seat];
    txt = mine === undefined ? "Bấm vào người bạn muốn treo cổ, hoặc bỏ qua." : mine === -1 ? "Bạn đã chọn bỏ qua. Có thể đổi ý." : `Bạn bỏ phiếu cho <b>${esc(nameOf(mine))}</b>. Có thể đổi ý.`;
    btns = `<button class="btn" data-a="skip">Bỏ qua lượt này</button>`;
  } else if (ph === "verdict") txt = "Đang kiểm phiếu…";
  else if (ph === "end") { txt = v.winner === "wolf" ? "Bầy Sói đã thắng." : "Dân làng đã thắng."; btns = `<button class="btn" data-a="result">Xem kết quả</button>`; }
  if (ph === "vote" && my?.alive && v.mayorReady) txt += " Nếu đúng hai người hòa dẫn đầu, lá phiếu của bạn có thể phân xử.";
  if (v.gateReport) txt += `<br><span class="soft">Đêm ${v.gateReport.round}: ${v.gateReport.targeted ? "Có hành động tác động tới bạn." : "Không có hành động nào tác động tới bạn."}</span>`;
  if (ph === "end" && v.host === v.seat) btns += DISBAND_BTN;
  if (ph !== "lobby") btns += `<button class="btn" data-a="leave">Rời phòng</button>`; // lobby đã có nút rời ở trên
  $("actTxt").innerHTML = txt; row.innerHTML = btns;

  const log = $("seerLog");
  if (v.seer?.length) { log.hidden = false; log.innerHTML = v.seer.map((r) => `<li>Đêm ${r.round}: ${esc(nameOf(r.target))} là <span class="${r.team === "wolf" ? "w" : "v"}">${r.team === "wolf" ? "phe Sói" : "phe Làng"}</span></li>`).join(""); }
  else log.hidden = true;
}
$("actRow").addEventListener("click", async (e) => {
  const a = e.target.closest("[data-a]")?.dataset.a; if (!a || !v) return; // v=null: đã về màn đầu, nút cũ còn sót
  if (a === "start") send({ t: "start" });
  else if (a === "brew" || a === "watch") send({ t: a, enabled: !v.night?.armed });
  else if (a === "skip") send({ t: "vote", target: null });
  else if (a === "leave") {
    if (v.phase !== "lobby" && v.phase !== "end" && !(await askLeaveGame())) return;
    if (!v) return; // phòng đã đóng trong lúc đang hỏi
    send({ t: "leave" });
  }
  else if (a === "disband") {
    if (othersHuman() && !(await askDisband())) return;
    if (!v) return;
    send({ t: "disband" });
  }
  else if (a === "result") { endHidden = false; renderEnd(); }
  else if (a === "copy") {
    const link = `${location.origin}${location.pathname}?p=${v.code}`;
    try { await navigator.clipboard.writeText(link); toast("Đã chép link mời."); } catch { toast(`Mã phòng: ${v.code}`); }
  }
});

// ---------------- phòng chờ: danh sách người + bộ vai ----------------
const ROLE_ORDER = ["wolf", "seer", "guard", "villager", "hunter", "witch", "mayor", "gatekeeper"];
const roleCount = (n) => ({ wolf: 2, seer: 1, guard: 1, villager: 2, ...Object.fromEntries(ROLE_ORDER.slice(4).map((role) => [role, n >= 7 ? "?" : 0])) });
const thumb = (k) => `assets/thumbs/${ROLE[k].img.replace(".webp", "-sm.webp")}`;
let lastLobbyKey = "";
$("addBot").onclick = () => send({ t: "add-bot" });
$("plist").addEventListener("click", (e) => { const b = e.target.closest("[data-kick]"); if (b) send({ t: "kick-bot", target: +b.dataset.kick }); });
function renderLobby() {
  const box = $("lobby"), on = v.phase === "lobby";
  box.hidden = !on; if (!on) { lastLobbyKey = ""; return; }
  const n = v.players.length, off = v.players.filter((p) => !p.connected).length, iHost = v.host === v.seat;
  const key = JSON.stringify([v.seat, v.host, v.players.map((p) => [p.name, p.avatar, p.connected, p.bot])]);
  if (key === lastLobbyKey) return; lastLobbyKey = key;

  $("pplCount").textContent = `${n}/${v.max}`;
  let rows = v.players.map((p) => {
    const av = `${(p.avatar % 4) * (100 / 3)}% ${Math.floor(p.avatar / 4) * 100}%`;
    const chips = [];
    if (v.host === p.seat) chips.push(`<span class="chip chip--host">★ Chủ phòng</span>`);
    if (p.bot) chips.push(`<span class="chip chip--bot">Bot</span>`);
    else chips.push(p.connected ? `<span class="chip chip--ok">Sẵn sàng</span>` : `<span class="chip chip--off">Mất kết nối</span>`);
    if (p.bot && iHost) chips.push(`<button type="button" class="chip chip--x" data-kick="${p.seat}" aria-label="Bớt ${esc(p.name)}">✕</button>`);
    else if (iHost && p.seat !== v.seat) chips.push(kickButtonHTML(p.seat, p.name)); // chủ phòng "Mời ra" người thật
    return `<li class="prow${p.connected ? "" : " prow--off"}${p.seat === v.seat ? " prow--me" : ""}">
      <span class="prow__av" style="background-position:${av}"></span>
      <span class="prow__name">${esc(p.name)}${p.seat === v.seat ? ` <i>(bạn)</i>` : ""}</span>
      <span class="prow__chips">${chips.join("")}</span></li>`;
  }).join("");
  const empty = v.max - n;
  if (empty > 0) rows += `<li class="prow prow--empty"><span class="prow__av"></span><span class="prow__name">Còn ${empty} ghế trống</span></li>`;
  $("plist").innerHTML = rows;
  $("botRow").hidden = !iHost; $("addBot").disabled = n >= v.max;

  const size = Math.min(v.max, Math.max(n, v.min)), cnt = roleCount(size);
  const total = size, match = total === n;
  $("rcards").innerHTML = ROLE_ORDER.filter((k) => cnt[k]).map((k) => `<figure class="rcard rcard--${k}">
      <span class="rcard__img"><img src="${thumb(k)}" alt="" width="192" height="256" loading="lazy" /><b class="rcard__n">${cnt[k] === "?" ? "?" : `×${cnt[k]}`}</b></span>
      <figcaption><b>${ROLE[k].name}</b><span>${ROLE[k].team}</span></figcaption></figure>`).join("");
  const sum = $("roleSum");
  sum.textContent = `${total} vai / ${n} người`;
  sum.className = `rsum ${match ? "rsum--ok" : "rsum--bad"}`;
  const warn = $("roleWarn");
  if (!match) { warn.className = "rwarn rwarn--bad"; warn.textContent = `Có ${total} vai cho ${n} người: số vai phải bằng số người. Mời thêm ${total - n} người nữa mới bắt đầu được.${iHost ? " Hoặc bấm “Thêm bot”." : ""}`; }
  else if (off) { warn.className = "rwarn rwarn--warn"; warn.textContent = `Khớp ${total} vai cho ${n} người — nhưng ${off} người đang mất kết nối, quá 20 giây không vào lại sẽ tự rời phòng.`; }
  else { warn.className = "rwarn rwarn--ok"; warn.textContent = `Khớp: ${total} vai cho ${n} người. ${n >= 7 ? `Chọn ngẫu nhiên ${n - 6} trong 4 vai đặc biệt. Bộ vai chính thức hiện khi bắt đầu.` : "Từ 7 người sẽ có thêm vai đặc biệt."}`; }
}

// ---------------- trò chuyện ----------------
// mỗi ghế một màu tên cố định (đọc rõ trên nền tối cả ngày lẫn đêm) + giờ gửi ở góc dưới
const SEAT_COLOR = ["#f5d77f", "#7ec8e3", "#f29e6d", "#9fd88a", "#d6a2f0", "#f28fae", "#6fe0c6", "#e8c39e"];
const hhmm = (ts) => { const d = new Date(ts); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
const msgLi = (c, color) => `<li class="msg"><span><b style="color:${color || SEAT_COLOR[c.seat % 8]}">${esc(nameOf(c.seat))}</b>: ${esc(c.text)}</span>${c.ts ? `<time>${hhmm(c.ts)}</time>` : ""}</li>`;
let lastLogKey = "";
function renderChat() {
  // "Tắt chat" (chung toàn trang): giấu lời người chơi gõ, vẫn giữ sự kiện của ván và câu nói nhanh có sẵn
  const off = isChatOff(), said = (c) => !off || v.quick.includes(c.text);
  const wolf = me()?.role === "wolf" && !!v.wolfChat;
  $("tabWolf").hidden = !wolf; if (!wolf && tab === "wolf") tab = "village";
  if (wolf && v.phase === "night" && lastRoundSeen !== v.round) { tab = "wolf"; lastRoundSeen = v.round; }
  $("tabVillage").setAttribute("aria-selected", tab === "village"); $("tabWolf").setAttribute("aria-selected", tab === "wolf");
  // kênh Làng: lời nói + sự kiện (chết/treo) xếp theo thời gian vòng
  let items;
  if (tab === "wolf") items = (v.wolfChat || []).filter(said).map((c) => msgLi(c, "var(--red)"));
  else {
    items = v.events.map((e) => `<li class="sys">${e.kind === "bite" ? `Đêm ${e.round}: <b>${esc(nameOf(e.seat))}</b> bị Sói cắn — là ${ROLE[e.role].name}.` : e.kind === "hunt" ? esc(huntText(e)) : e.kind === "peace" ? `Đêm ${e.round}: bình yên.` : e.kind === "hang" ? `Ngày ${e.round}: ${e.byMayor ? "Trưởng Làng đã phân xử. " : ""}<b>${esc(nameOf(e.seat))}</b> bị treo cổ — là ${ROLE[e.role].name}.` : `Ngày ${e.round}: không ai bị treo cổ.`}</li>`);
    items = items.concat(v.chat.filter(said).map((c) => msgLi(c)));
  }
  const key = tab + off + items.join("");
  if (key !== lastLogKey) { lastLogKey = key; const log = $("chatLog"); log.innerHTML = items.join("") || `<li class="sys">Chưa có ai nói gì.</li>`; log.scrollTop = log.scrollHeight; }
  const my = me(), ph = v.phase;
  const canTalk = my?.alive && (tab === "wolf" ? ph === "night" : ph !== "night" && ph !== "reveal");
  document.querySelector(".chat").classList.toggle("chat--off", !canTalk);
  // người đã bị loại / đêm im lặng: khoá thật ô nhập (không chỉ làm mờ) để bàn phím cũng không gửi được
  $("chatInp").disabled = !canTalk || off; $("chatBtn").disabled = !canTalk || off;
  $("chatInp").placeholder = !my?.alive ? "Người đã bị loại không được nói" : off ? "Chat đang tắt" : tab === "wolf" ? "Thì thầm với bầy Sói…" : canTalk ? "Nói gì đó với cả làng…" : "Ban đêm cả làng im lặng";
  const q = $("quick");
  if (!q.childElementCount) q.innerHTML = v.quick.map((s, i) => `<button type="button" data-q="${i}">${esc(s)}</button>`).join("");
  q.querySelectorAll("button").forEach((b) => { b.disabled = !canTalk; });
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
initChatOff(() => { if (v) renderChat(); });
$("quick").addEventListener("click", (e) => { const b = e.target.closest("[data-q]"); if (b) send({ t: "quick", id: +b.dataset.q }); });
$("chatForm").addEventListener("submit", (e) => {
  e.preventDefault(); const t = $("chatInp").value.trim(); if (!t || $("chatInp").disabled) return;
  send({ t: "chat", text: t }); $("chatInp").value = "";
});

// ---------------- lớp phủ ----------------
function showReveal(role, manual) {
  if (!manual) revealShown = v.round;
  const r = ROLE[role]; $("flipFront").src = `assets/${r.img}`; $("flipFront").alt = r.name;
  const wolves = role === "wolf" ? v.players.filter((p) => p.role === "wolf" && p.seat !== v.seat).map((p) => p.name) : [];
  $("revealCap").innerHTML = `Bạn là <b>${r.name}</b> — ${r.desc}${wolves.length ? `<br>Đồng bọn: <b style="color:var(--red)">${wolves.map(esc).join(", ")}</b>` : ""}${manual ? "<br><span class='soft'>Chạm để đóng</span>" : ""}`;
  const lineup = Object.entries(v.lineup || {}).filter(([, count]) => count).map(([key, count]) => `${ROLE[key].name} ×${count}`);
  if (lineup.length) $("revealCap").innerHTML += `<br><span class="soft">Bộ vai: ${lineup.join(" · ")}</span>`;
  const ov = $("ovReveal"); ov.hidden = false; $("flip").classList.remove("on");
  setTimeout(() => $("flip").classList.add("on"), 350);
  ov.onclick = manual ? () => (ov.hidden = true) : null;
}
function renderEnd() {
  const w = v.winner, my = me();
  const won = my?.role && (my.role === "wolf") === (w === "wolf");
  $("endTitle").textContent = w === "wolf" ? "Bầy Sói chiếm làng!" : "Dân làng đã diệt hết Sói!";
  $("endTitle").className = `end__title ${w}`;
  const last = v.events.at(-1);
  $("endSub").textContent = `${won ? "Bạn thắng ván này." : "Bạn thua ván này."} Sau ${v.round} đêm.${last?.kind === "hunt" ? " " + huntText(last) : ""}`;
  $("endCards").innerHTML = v.players.map((p) => {
    const r = ROLE[p.role] || ROLE.villager, win = (p.role === "wolf") === (w === "wolf");
    return `<figure class="${p.alive ? "" : "dead"} ${win ? "win" : ""}"><img src="assets/${r.img}" alt=""><figcaption>${esc(p.name)}<br>${r.name}${p.alive ? "" : " · đã chết"}</figcaption></figure>`;
  }).join("");
  // PARTY2-03 (D8): chủ phòng vắng ⇒ ai cũng mở ván mới được (máy chủ cũng chuyển chủ phòng ngay khi hết ván nếu chủ phòng
  // không trả lời). Chủ phòng còn đó ⇒ người khác thấy lời giải thích thay vì màn trống.
  const hostHere = !!v.players[v.host]?.connected, canAgain = v.host === v.seat || !hostHere;
  $("againBtn").hidden = !canAgain;
  $("endWait").hidden = canAgain;
  if (!canAgain) $("endWait").textContent = `Chờ chủ phòng ★ ${nameOf(v.host)} mở ván mới… Nếu chủ phòng rời đi, nút "Chơi ván mới" sẽ hiện cho bạn.`;
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
    const row = document.createElement("div"); row.className = "home__row"; row.id = "resumeRow"; row.append(b);   // phòng đang chơi dở ⇒ lựa chọn nổi bật nhất, đặt trên cùng
    document.querySelector(".home__opt").before(row);
    // Chỉ hiện khi phòng còn trên máy chủ (phòng hết hạn / máy chủ khởi động lại ⇒ quên ghế cũ, không hiện nút "chết").
    row.hidden = true;
    fetch(`/api/lobby/rooms/${encodeURIComponent(last.code)}`, { cache: "no-store" })
      .then((r) => ((r.ok || r.status === 404) && /json/.test(r.headers.get("content-type") || "") ? r.json() : null)) // máy chủ cũ không có API ⇒ null
      .then((d) => { if (!d || d.games?.includes(GAME)) row.hidden = false; else { try { localStorage.removeItem(LAST); } catch {} row.remove(); } })
      .catch(() => { row.hidden = false; }); // không hỏi được ⇒ cứ cho thử
  } $("createBtn").addEventListener("pointerenter", () => { if (!ws) connect(); }, { once: true }); }
