// Ai Là Nội Gián — client. Chỉ hiển thị góc nhìn server gửi cho ghế mình; client không bao giờ biết vai người khác
// trừ khi server cho phép (người bị loại, hết ván, Nội Gián thấy Nội Gián). Không ghi state ra console.
import { isChatOff, initChatOff } from "../_shared/chat-off.js?v=co1";
import { sharedName, sessionId, initKick, kickButtonHTML, KICKED_TEXT, BANNED_TEXT, KICK_ERR } from "../_shared/online-kit.js?v=ok1"; // tên dùng chung + "Mời ra"
const $ = (id) => document.getElementById(id);
const SESS = "ai-la-noi-gian:sess";
const LAST = "ai-la-noi-gian:last"; const GAME = "ai-la-noi-gian";
const NAME = "ai-la-noi-gian:name";

const ROLE = {
  signal: { short: "Tín Hiệu", name: "Chuyên Viên Tín Hiệu", img: "role-chuyen-vien-tin-hieu.webp", desc: "Một lần mỗi ván, xác thực lượt quét đã hoàn tất gần nhất của Hacker để biết kết quả có bị nhiễu hay không.", team: "Phe Đặc Vụ" },
  courier: { short: "Liên Lạc", name: "Liên Lạc Viên", img: "role-lien-lac-vien.webp", desc: "Một lần mỗi ván, gửi tin riêng ban ngày cho một người còn sống. Người nhận thấy tên bạn.", team: "Phe Đặc Vụ" },
  technician: { short: "Kỹ Thuật Viên", name: "Kỹ Thuật Viên", img: "role-ky-thuat-vien.webp", desc: "Một lần mỗi ván, chuẩn bị khôi phục hệ thống để cứu mục tiêu bị phá hoại đêm đó. Chỉ mất lượt khi cứu được người.", team: "Phe Đặc Vụ" },
  jammer: { short: "Đánh Lạc Hướng", name: "Kẻ Đánh Lạc Hướng", img: "role-danh-lac-huong.webp", desc: "Cùng đồng bọn phá hoại. Một lần mỗi ván, bật nhiễu để đảo kết quả quét của Hacker đêm đó. Chỉ mất lượt khi có lượt quét.", team: "Phe Nội Gián" },
  mole: { short: "Nội Gián", name: "Nội Gián", img: "role-noi-gian.webp", desc: "Mỗi lần mất điện, cùng đồng bọn chọn một đặc vụ để phá hoại. Khi đèn sáng, giả làm người trong sạch.", team: "Phe Nội Gián" },
  hacker: { short: "Hacker", name: "Hacker Mật", img: "role-hacker-mat.webp", desc: "Mỗi đêm quét một người để biết họ là Nội Gián hay Đặc Vụ.", team: "Phe Đặc Vụ" },
  security: { short: "Kỹ Sư", name: "Kỹ Sư An Ninh", img: "role-ky-su-an-ninh.webp", desc: "Mỗi đêm dựng tường lửa che một người. Không che cùng một người hai đêm liền.", team: "Phe Đặc Vụ" },
  agent: { short: "Đặc Vụ", name: "Đặc Vụ Hiện Trường", img: "role-dac-vu-hien-truong.webp", desc: "Không có hành động ban đêm. Ban ngày soi lời khai và bỏ phiếu bắt Nội Gián.", team: "Phe Đặc Vụ" },
};
const PHASE = {
  lobby: ["Phòng chờ", "Chờ đủ người"], reveal: ["Phát thẻ mật vụ", "Xem vai bí mật của bạn"],
  night: ["Mất điện", "Chế độ cách ly"], dawn: ["Báo cáo ca trực", "Đêm qua có gì?"],
  day: ["Họp khẩn", "Bàn bạc tìm Nội Gián"], vote: ["Bỏ phiếu bắt giữ", "Chọn người bị còng"],
  verdict: ["Phán quyết", "Kết quả bỏ phiếu"], end: ["Hết ván", ""],
};
const ERR = {
  banned: BANNED_TEXT,
  started: "Ván đã bắt đầu, không vào được nữa.", full: "Phòng đã đủ 8 người.", name: "Hãy nhập mật danh (tối đa 16 ký tự).",
  "name-taken": "Mật danh này đã có người dùng trong phòng.", phase: "Chưa tới lúc làm việc này.", "not-host": "Chỉ chủ phòng mới làm được.",
  "need-players": "Cần ít nhất 6 người để bắt đầu.", dead: "Bạn đã bị loại, chỉ được xem.", target: "Không chọn được người này.",
  done: "Đêm nay bạn đã quét rồi.", spent: "Bạn đã dùng hết lượt kỹ năng.", "no-scan": "Chưa có lượt quét nào để xác thực.", "same-shield": "Không được che cùng một người hai đêm liền.", "no-action": "Bạn không thể dùng kỹ năng này lúc này.",
  night: "Đang mất điện — phòng họp phải im lặng.", empty: "Tin nhắn trống.", bad: "Yêu cầu không hợp lệ.", gone: "Phòng đã đóng.",
  slow: "Bạn thao tác nhanh quá, chờ một chút.", "chat-slow": "Bạn nhắn nhanh quá — chờ một giây rồi gửi tiếp.", already: "Bạn đã ở trong phòng.", busy: "Máy chủ đang bận, thử lại sau.",
  "no-room": "Không tìm thấy phòng với mã này.", "no-seat": "Phiên cũ đã hết hạn.", server: "Máy chủ gặp lỗi, thử lại.",
};
// atlas hud-icons.png 3×2 ô 32px
const HUD = { radar: [0, 0], cuffs: [50, 0], shield: [100, 0], eye: [0, 100], usb: [50, 100], badge: [100, 100] };
// màu ghế (avatar 0–7) — đọc rõ trên nền ngày lẫn đêm
const SEAT_COLOR = ["#f5d77f", "#7ec8e3", "#f29e6d", "#9fd88a", "#d6a2f0", "#f28fae", "#6fe0c6", "#e8c39e"];

let ws = null, v = null, offset = 0, sess = load(), retry = 0, pending = null, tab = "public", lastPhase = null, lastRoundSeen = -1, endHidden = false, revealShown = -1;

function load() { try { return JSON.parse(sessionStorage.getItem(SESS)) || null; } catch { return null; } }
function save(s) {
  sess = s;
  try {
    if (s) { sessionStorage.setItem(SESS, JSON.stringify(s)); localStorage.setItem(LAST, JSON.stringify(s)); }
    else { sessionStorage.removeItem(SESS); localStorage.removeItem(LAST);  document.getElementById("resumeRow")?.remove(); }
  } catch { /* chế độ riêng tư */ }
}
const now = () => Date.now() + offset;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nameOf = (s) => v?.players[s]?.name ?? "?";
const me = () => v?.players[v.seat];
const isMole = (p) => p?.role === "mole" || p?.role === "jammer";
const won = (p) => p?.role && isMole(p) === (v.winner === "mole");
const initial = (n) => { const m = String(n).replace(/^Bot\s+/i, "").trim(); return esc((m[0] || "?").toUpperCase()); };
const avatar = (p, cls = "av") => `<span class="${cls}" style="--c:${SEAT_COLOR[p.avatar % 8]}"><b>${initial(p.name)}</b>${p.bot ? "<i>BOT</i>" : ""}</span>`;

// ---------------- âm thanh: tổng hợp bằng WebAudio (không cần file), dùng chung khoá tắt tiếng "wgp.muted" ----------------
// Mọi tiếng đều suy ra từ góc nhìn CỦA CHÍNH ghế này ⇒ không lộ thêm gì về vai người khác.
const MUTE_KEY = "wgp.muted";
const sfx = (() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  let ac = null;
  const muted = () => { try { return localStorage.getItem(MUTE_KEY) === "1"; } catch { return false; } };
  const unlock = () => { if (!ac && AC) ac = new AC(); if (ac?.state === "suspended") ac.resume().catch(() => {}); };
  for (const e of ["pointerdown", "keydown"]) window.addEventListener(e, unlock, { capture: true, passive: true });
  // mỗi tiếng = chuỗi nốt [tần số Hz, thời lượng s, kiểu sóng]
  const S = {
    blip: [[880, 0.05, "square"]], tap: [[520, 0.04, "square"], [780, 0.04, "square"]],
    msg: [[1320, 0.04, "triangle"], [1760, 0.05, "triangle"]],
    alarm: [[660, 0.18, "sawtooth"], [440, 0.18, "sawtooth"], [660, 0.18, "sawtooth"], [440, 0.22, "sawtooth"]],
    power: [[523, 0.08, "square"], [659, 0.08, "square"], [784, 0.12, "square"]],
    card: [[392, 0.06, "triangle"], [587, 0.06, "triangle"], [784, 0.14, "triangle"]],
    gavel: [[180, 0.08, "square"], [0, 0.06], [180, 0.1, "square"]],
    hit: [[220, 0.12, "sawtooth"], [147, 0.3, "sawtooth"]],
    win: [[523, 0.1, "square"], [659, 0.1, "square"], [784, 0.1, "square"], [1046, 0.3, "square"]],
    lose: [[392, 0.16, "triangle"], [330, 0.16, "triangle"], [262, 0.4, "triangle"]],
    tick: [[1000, 0.03, "square"]],
    leave: [[660, 0.06, "triangle"], [440, 0.1, "triangle"]], err: [[200, 0.07, "square"], [150, 0.1, "square"]],
  };
  return {
    muted, log: [],
    play(n, vol = 1, delay = 0) {
      this.log.push(n); if (this.log.length > 200) this.log.shift();
      if (muted() || !ac || !S[n]) return false;
      let t = ac.currentTime + delay / 1000;
      for (const [f, d, type] of S[n]) {
        if (f) {
          const o = ac.createOscillator(), g = ac.createGain();
          o.type = type; o.frequency.value = f;
          g.gain.setValueAtTime(0.08 * vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
          o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.02);
        }
        t += d;
      }
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
function soundFor(a, b) {
  if (!a || !b || a.code !== b.code) return;
  const last = b.events[b.events.length - 1];
  if (a.phase !== b.phase) {
    if (b.phase === "lobby") sfx.play("blip");
    else if (b.phase === "reveal") sfx.play("card", 1, 350);
    else if (b.phase === "night") sfx.play("alarm", 0.8);
    else if (b.phase === "dawn") { sfx.play("power", 0.8); if (last?.kind === "hit") sfx.play("hit", 1, 900); }
    else if (b.phase === "day") sfx.play("blip", 0.5);
    else if (b.phase === "vote") sfx.play("gavel");
    else if (b.phase === "verdict" && last?.kind === "jail") sfx.play("hit");
    else if (b.phase === "end") sfx.play(won(b.players[b.seat]) ? "win" : "lose");
  } else {
    let join = false, gone = false;
    if (b.players.length < a.players.length) gone = true;
    else if (b.players.length > a.players.length) join = true;
    else b.players.forEach((p, i) => { if (i === b.seat) return; const o = a.players[i]; if (o && o.connected && !p.connected) gone = true; else if (o && !o.connected && p.connected) join = true; });
    if (join) sfx.play("blip", 0.7); else if (gone) sfx.play("leave", 0.7);
  }
  const fresh = (x, y) => { const t = x?.length ? x[x.length - 1].ts : -1; return (y || []).some((c) => c.ts > t && c.seat !== b.seat); };
  if (!isChatOff() && (fresh(a.chat, b.chat) || fresh(a.moleChat, b.moleChat))) sfx.play("msg", 0.7);
  if (b.dispatch && !a.dispatch && b.dispatch.from !== b.seat) sfx.play("msg", 1, 120); // nhận tin riêng của Liên Lạc Viên (kêu 2 lần cho khác tin chat)
}

// ---------------- kết nối ----------------
function connect() {
  const url = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws/ai-la-noi-gian`;
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
function offline() { homeMsg("Máy chủ Ai Là Nội Gián chưa bật ở bản này. Khi chạy thử: node games-server/ai-la-noi-gian/dev.js"); }
function send(o) {
  if (o.t === "create" || o.t === "join" || o.t === "resume") o = { ...o, sid: sessionId() }; // sid: máy chủ chặn người bị "Mời ra" vào lại 10 phút
  if (["act", "vote", "repair", "jam", "verify", "dispatch"].includes(o.t)) sfx.play("tap", 0.8);
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
      offset = m.now - Date.now(); const prev = v; v = m.v;
      if (vsBots && v.phase === "lobby" && v.host === v.seat && v.players.length >= v.min) { vsBots = false; send({ t: "start" }); }
      render(); soundFor(prev, v); break;
    }
    case "err":
      if (m.code === "banned") { save(null); v = null; showHome(); homeMsg(BANNED_TEXT); leaveDone(); break; } // bị mời ra: 10 phút chưa vào lại được
      if (m.code === "target" && m.req === "kick") { toast(KICK_ERR.target); break; }
      if (m.code === "no-seat" || (m.code === "no-room" && !v)) { save(null); showHome(); if (m.code === "no-room") homeMsg(ERR["no-room"]); break; }
      toast(ERR[m.code] || "Có lỗi xảy ra."); sfx.play("err", 0.7); break;
    case "kicked": case "left": save(null); v = null; showHome(); homeMsg(m.t === "kicked" ? (m.by === "host" ? KICKED_TEXT : "Bạn đã rời phòng.") : ""); leaveDone(); break;
    case "closed": { // chủ phòng hủy phòng ⇒ server gửi cho mọi người (cả chủ phòng), xoá phòng, giữ kết nối
      const wasHost = v && v.host === v.seat;
      save(null); v = null; vsBots = false; showHome(); history.replaceState(null, "", location.pathname);
      homeMsg(wasHost ? "Đã hủy phòng." : "Chủ phòng đã hủy phòng."); sfx.play("leave", 0.7); leaveDone();
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
document.addEventListener("click", async (e) => {
  const a = e.target.closest?.("a[href]");
  if (!a || !v || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === "_blank") return;
  let url; try { url = new URL(a.href, location.href); } catch { return; }
  if (!/\/homepage\/(index\.html)?$/.test(url.pathname)) return;
  e.preventDefault();
  if (v.phase !== "lobby" && v.phase !== "end" && !confirm("Rời ván đang chơi?")) return;
  await leaveRoom();
  location.href = url.href;
});

// ---------------- màn đầu ----------------
function homeMsg(t) { $("homeMsg").textContent = t; }
function showHome() { $("home").hidden = false; $("game").hidden = true; $("barCode").hidden = true; $("ovEnd").hidden = true; $("ovReveal").hidden = true; lastPhase = null; setTheme("day"); }
function needName() {
  const n = myName.commit($("nameInp").value); if (!n) { homeMsg(ERR.name); $("nameInp").focus(); return null; } // sửa tên ở đây ⇒ mọi game cùng đổi
  try { localStorage.setItem(NAME, n); } catch {} return n;
}
// Ô tên điền sẵn tên dùng chung (tài khoản); người cũ có tên riêng của game (NAME) được chuyển sang một lần.
const myName = sharedName({ game: "ai-la-noi-gian", input: $("nameInp"), legacy: () => { try { return localStorage.getItem(NAME) || ""; } catch { return ""; } } });
initKick({ send: (o) => { send(o); return true; } }); // chủ phòng "Mời ra" người khác ở phòng chờ — hộp xác nhận pixel
const qp = new URLSearchParams(location.search).get("p"); if (qp) $("codeInp").value = qp.toUpperCase().slice(0, 5);
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
    const st = $("stage"); st.classList.remove("shift", "to-night", "to-day"); void st.offsetWidth; st.classList.add("shift", night ? "to-night" : "to-day");
  }
  document.body.classList.toggle("is-night", night); document.body.classList.toggle("is-day", !night);
}
function hud(el, k) { const [x, y] = HUD[k]; el.style.backgroundPosition = `${x}% ${y}%`; }

function render() {
  if (!v) return;
  $("home").hidden = true; $("game").hidden = false; $("barCode").hidden = false; $("barCodeTxt").textContent = v.code;
  const ph = v.phase, my = me();
  if (ph !== "day" || !v.players[dispatchTo]?.alive || v.dispatch) dispatchTo = null;
  if (ph === "lobby") $("dispatchInput").value = "";
  setTheme(ph === "night" || ph === "reveal" ? "night" : "day");
  const changed = ph !== lastPhase; lastPhase = ph;
  if (changed) onPhase(ph);
  document.body.classList.toggle("is-lobby", ph === "lobby");
  renderDial(); renderSeats(); renderMe(); renderAct(); renderChat(); renderLobby();
  if (ph === "end" && !endHidden) renderEnd(); else if (ph !== "end") { $("ovEnd").hidden = true; endHidden = false; }
  if (ph === "reveal" && revealShown !== v.round && my?.role) showReveal(my.role);
  if (ph !== "reveal" && revealShown !== -2) $("ovReveal").hidden = true;
}

function evText(e) {
  if (e.kind === "hit") return `Đêm ${e.round}: <b>${esc(nameOf(e.seat))}</b> bị Nội Gián phá hoại, rời nhiệm vụ — là ${ROLE[e.role].name}.`;
  if (e.kind === "safe") return `Đêm ${e.round}: hệ thống an toàn, không ai bị hại.`;
  if (e.kind === "jail") return `Họp ${e.round}: <b>${esc(nameOf(e.seat))}</b> bị bắt giữ — là ${ROLE[e.role].name}.`;
  return `Họp ${e.round}: không đủ phiếu, không ai bị bắt.`;
}
function onPhase(ph) {
  const last = v.events[v.events.length - 1];
  let txt = null;
  if (ph === "night") txt = `Mất điện lần ${v.round} — chế độ cách ly`;
  else if (ph === "dawn" && last) txt = last.kind === "hit" ? `${nameOf(last.seat)} bị phá hoại đêm qua (${ROLE[last.role].name})` : "Đêm qua an toàn, không ai bị hại";
  else if (ph === "day") txt = "Đèn sáng — họp khẩn!";
  else if (ph === "vote") txt = "Bỏ phiếu bắt giữ";
  else if (ph === "verdict" && last) txt = last.kind === "jail" ? `${nameOf(last.seat)} bị bắt giữ (${ROLE[last.role].name})` : "Không ai bị bắt giữ";
  if (txt) banner(txt);
}
let bannerT;
function banner(t) { const b = $("banner"); b.textContent = t; b.hidden = false; b.style.animation = "none"; void b.offsetWidth; b.style.animation = ""; clearTimeout(bannerT); bannerT = setTimeout(() => (b.hidden = true), 2600); }

function renderDial() {
  const ph = v.phase, [t, sub] = PHASE[ph];
  const alive = v.players.filter((p) => p.alive).length;
  $("phaseTxt").textContent = ph === "night" || ph === "day" ? `${t} · ${v.round}` : ph === "end" ? (v.winner === "mole" ? "Nội Gián thắng" : "Đặc Vụ thắng") : t;
  $("phaseSub").textContent = ph === "lobby" ? `${v.players.length}/${v.max} người · cần ${v.min}` : ph === "end" ? "Mọi hồ sơ đã mở" : `${sub} · còn ${alive} người`;
  hud($("dialIcon"), ph === "night" || ph === "reveal" ? "radar" : ph === "vote" || ph === "verdict" ? "cuffs" : ph === "dawn" ? "eye" : "badge");
  $("dial").classList.toggle("dial--spin", ph === "night");
}
let total = 0, lastEnds = 0, warned = "";
function tick() {
  if (v && v.endsAt) {
    if (v.endsAt !== lastEnds) { lastEnds = v.endsAt; total = 0; }
    const left = Math.max(0, v.endsAt - now());
    if (!total || left > total) total = left;
    $("secTxt").textContent = Math.ceil(left / 1000);
    const wk = `${v.phase}:${v.round}:${v.endsAt}`;
    if ((v.phase === "day" || v.phase === "vote") && left > 0 && left <= 5000 && warned !== wk) { warned = wk; sfx.play("tick", 0.7); }
    $("secBar").style.width = `${total ? (left / total) * 100 : 0}%`;
  } else if (v) { $("secTxt").textContent = ""; $("secBar").style.width = "0"; total = 0; }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

let dispatchTo = null;
const canDispatch = () => v?.phase === "day" && me()?.alive && me()?.role === "courier" && !v.dispatch;
function canPick(p) {
  const my = me(); if (!my?.alive || !p.alive) return false;
  if (v.phase === "night" && v.night?.can) {
    if (v.night.can === "sabotage") return !isMole(p);
    if (v.night.can === "scan") return p.seat !== v.seat && v.night.mine === null;
    if (v.night.can === "shield") return p.seat !== v.night.banned;
  }
  if (canDispatch()) return p.seat !== v.seat && !p.bot;
  if (v.phase === "vote") return p.seat !== v.seat;
  return false;
}
function selected(p) {
  if (canDispatch()) return dispatchTo === p.seat;
  if (v.phase === "night" && v.night) return v.night.mine === p.seat;
  if (v.phase === "vote" || v.phase === "verdict") return v.votes?.[v.seat] === p.seat;
  return false;
}

function renderSeats() {
  const box = $("seats");
  const tally = {};
  if (v.votes) for (const t of Object.values(v.votes)) if (t >= 0) tally[t] = (tally[t] || 0) + 1;
  const pack = v.night?.pack ? Object.values(v.night.pack).reduce((a, t) => ((a[t] = (a[t] || 0) + 1), a), {}) : {};
  const scanned = {}; for (const r of v.scan || []) scanned[r.target] = r.team;
  let html = "";
  for (let i = 0; i < 8; i++) {
    const p = v.players[i];
    if (!p) { html += `<div class="seat seat--empty${v.phase === "lobby" ? "" : " seat--hide"}" aria-hidden="true"><span class="av av--empty"></span><span class="seat__name">${v.phase === "lobby" ? "trống" : ""}</span></div>`; continue; }
    const cls = ["seat"]; const can = canPick(p);
    if (p.seat === v.seat) cls.push("seat--me"); if (!p.alive) cls.push("seat--dead"); if (!p.connected) cls.push("seat--off");
    if (can) cls.push("seat--can"); if (selected(p)) cls.push("seat--sel");
    if (v.phase === "end") cls.push(won(p) ? "seat--win" : "seat--lose");
    let tag = "";
    if (!p.alive) tag = "cuffs";
    else if (v.phase === "night" && v.night?.can === "shield" && v.night.mine === p.seat) tag = "shield";
    else if (scanned[p.seat] && v.phase !== "end") tag = scanned[p.seat] === "mole" ? "usb" : "eye";
    else if (isMole(p) && isMole(me()) && p.seat !== v.seat) tag = "usb";
    const tagHtml = tag ? `<i class="seat__tag" style="background-position:${HUD[tag][0]}% ${HUD[tag][1]}%"></i>` : "";
    const roleTxt = p.role && (p.seat !== v.seat || v.phase === "end") ? `<span class="seat__role${isMole(p) ? " is-mole" : ""}">${ROLE[p.role].short}</span>` : "";
    const scanTxt = !roleTxt && scanned[p.seat] ? `<span class="seat__role${scanned[p.seat] === "mole" ? " is-mole" : " is-ok"}">${scanned[p.seat] === "mole" ? "Nội Gián" : "Trong sạch"}</span>` : "";
    const votes = tally[p.seat] ? `<span class="seat__votes">${tally[p.seat]} phiếu</span>` : pack[p.seat] ? `<span class="seat__votes seat__votes--mole">${pack[p.seat]} Nội Gián</span>` : "";
    const host = v.host === p.seat && v.phase === "lobby" ? " ★" : "";
    const label = `${p.name}${p.seat === v.seat ? " (bạn)" : ""}${p.bot ? ", bot" : ""}${p.alive ? "" : ", đã bị loại"}`;
    html += `<button class="${cls.join(" ")}" data-seat="${p.seat}" ${can ? "" : 'tabindex="-1"'} aria-label="${esc(label)}">
      <span class="seat__box">${avatar(p)}${tagHtml}${votes}</span>
      <span class="seat__name">${esc(p.name)}${host}</span>${roleTxt}${scanTxt}</button>`;
  }
  box.innerHTML = html;
}
$("seats").addEventListener("click", (e) => {
  const b = e.target.closest(".seat[data-seat]"); if (!b || !v) return;
  const p = v.players[+b.dataset.seat]; if (!p || !canPick(p)) return;
  if (v.phase === "night") send({ t: "act", target: v.night.mine === p.seat && v.night.can !== "scan" ? null : p.seat });
  else if (v.phase === "vote") send({ t: "vote", target: p.seat });
  else if (canDispatch()) {
    dispatchTo = dispatchTo === p.seat ? null : p.seat;
    renderSeats(); renderAct();
    if (dispatchTo !== null) $("dispatchInput").focus();
  }
});

function renderMe() {
  const my = me(), r = my?.role && ROLE[my.role];
  $("meImg").hidden = !r; $("meBack").hidden = !!r;
  if (r) { const src = `assets/${r.img}`; if (!$("meImg").src.endsWith(src)) $("meImg").src = src; $("meImg").alt = r.name; }
  $("meRole").textContent = r ? r.name : "Chưa phát thẻ";
  $("meKicker").textContent = r ? `Vai của bạn · ${r.team}` : "Vai của bạn";
  $("meDesc").textContent = r ? (my.alive ? r.desc : "Bạn đã bị loại — vẫn được xem đến hết ván, nhưng không nói và không bỏ phiếu.") : `Chờ đủ ${v.min} người, chủ phòng bấm Bắt đầu.`;
  $("mePanel").classList.toggle("me--mole", isMole(my));
}
$("meCard").onclick = () => { const r = me()?.role; if (r) { revealShown = -2; showReveal(r, true); } };

const ico = (k) => `<span class="icon" style="background-position:${HUD[k][0]}% ${HUD[k][1]}%"></span>`;
const DISBAND_BTN = `<button class="btn btn--red" data-a="disband">Hủy phòng</button>`;
/** Còn người thật nào khác trong phòng không (bot không tính). */
const othersHuman = () => !!v && v.players.some((p, i) => i !== v.seat && !p.bot);
function renderAct() {
  const ph = v.phase, my = me(), row = $("actRow");
  let txt = "", btns = "";
  if (ph === "lobby") {
    const n = v.players.length;
    if (v.host === v.seat) { txt = n >= v.min ? "Đủ người rồi! Bấm Bắt đầu khi cả đội sẵn sàng." : `Mời thêm ${v.min - n} người bằng mã phòng hoặc thêm bot.`; btns = `<button class="btn btn--gold" data-a="start" ${n >= v.min ? "" : 'aria-disabled="true"'}>Bắt đầu</button>`; }
    else txt = `Chờ chủ phòng ${esc(nameOf(v.host))} bắt đầu (cần ${v.min} người).`;
    btns += `<button class="btn" data-a="copy" aria-label="Sao chép link mời">Chép link mời</button>${v.host === v.seat ? DISBAND_BTN : ""}<button class="btn" data-a="leave">Rời phòng</button>`;
  } else if (ph === "reveal") txt = "Ghi nhớ vai của bạn và đừng để ai thấy.";
  else if (!my?.alive && ph !== "end") txt = "Bạn đã bị loại. Theo dõi tiếp nhé.";
  else if (ph === "night") {
    const n = v.night || {};
    if (n.can === "sabotage") txt = `${ico("usb")}${n.mine != null ? `Bạn chọn phá hoại <b>${esc(nameOf(n.mine))}</b>. Bấm lại để bỏ chọn.` : "Bấm vào một đặc vụ để phá hoại. Thống nhất với đồng bọn trong Kênh mã hóa."}`;
    else if (n.can === "scan") txt = `${ico("radar")}${n.mine != null ? `Đã quét <b>${esc(nameOf(n.mine))}</b> ${v.players.length > v.min ? " — xem kết quả khi đèn sáng." : " — xem kết quả bên dưới."}` : "Bấm vào một người để quét dữ liệu của họ."}`;
    else if (n.can === "shield") txt = `${ico("shield")}${n.mine != null ? `Tường lửa đang che <b>${esc(nameOf(n.mine))}</b>.` : "Bấm vào một người (có thể là bạn) để dựng tường lửa đêm nay."}${n.banned != null ? `<br><span class="soft">Không được che lại ${esc(nameOf(n.banned))}.</span>` : ""}`;
    else if (n.can === "repair") {
      txt = n.ready ? "Khôi phục hệ thống sẽ chặn một vụ phá hoại thành công đêm nay." : "Bạn đã dùng lượt khôi phục.";
      if (n.ready) btns = `<button class="btn" data-a="repair" aria-pressed="${n.armed}">${n.armed ? "Hủy khôi phục" : "Chuẩn bị khôi phục"}</button>`;
    } else txt = `${ico("radar")}Mất điện, bạn đứng gác trong bóng tối… Chờ đèn sáng.`;
    if (n.jam?.ready) btns = `<button class="btn" data-a="jam" aria-pressed="${n.jam.armed}">${n.jam.armed ? "Tắt nhiễu" : "Bật nhiễu quét"}</button>`;
    else if (n.jam) txt += " Bạn đã dùng lượt gây nhiễu.";
  } else if (ph === "dawn") txt = "Đèn đã sáng lại. Đọc báo cáo ca trực.";
  else if (ph === "day") txt = "Họp khẩn trong Phòng họp — ai đáng ngờ nhất?";
  else if (ph === "vote") {
    const mine = v.votes?.[v.seat];
    txt = `${ico("cuffs")}${mine === undefined ? "Bấm vào người bạn muốn bắt giữ, hoặc bỏ qua." : mine === -1 ? "Bạn đã chọn bỏ qua. Có thể đổi ý." : `Bạn bỏ phiếu bắt <b>${esc(nameOf(mine))}</b>. Có thể đổi ý.`}`;
    btns = `<button class="btn" data-a="skip">Bỏ qua lượt này</button>`;
  } else if (ph === "verdict") txt = "Đang kiểm phiếu…";
  else if (ph === "end") { txt = v.winner === "mole" ? "Nội Gián đã chiếm trụ sở." : "Đặc Vụ đã bắt hết Nội Gián."; btns = `<button class="btn" data-a="result">Xem kết quả</button>`; }
  if (canDispatch()) txt = dispatchTo === null ? "Liên Lạc Viên: chọn người nhận tin riêng trên bàn chơi." : `Người nhận tin riêng: <b>${esc(nameOf(dispatchTo))}</b>.`;
  if (my?.alive && v.signal?.ready && (ph === "day" || ph === "dawn")) btns = '<button class="btn" data-a="verify">Xác thực lượt quét</button>';
  if (v.signal?.report) txt += `<br><span class="soft">Quét đêm ${v.signal.report.round}: ${v.signal.report.jammed ? "kết quả đã bị nhiễu" : "kết quả xác thực"}.</span>`;
  if (ph === "end" && v.host === v.seat) btns += DISBAND_BTN;
  if (ph !== "lobby") btns += `<button class="btn" data-a="leave">Rời phòng</button>`; // lobby đã có nút rời ở trên
  $("actTxt").innerHTML = txt; row.innerHTML = btns;
  $("dispatchForm").hidden = !canDispatch();
  $("dispatchSend").disabled = dispatchTo === null;
  const note = $("dispatchNote");
  note.hidden = !v.dispatch;
  if (v.dispatch) {
    const { from, to, text } = v.dispatch;
    note.textContent = from === v.seat ? `Tin riêng đã gửi cho ${nameOf(to)}: ${text}` : `Tin riêng từ ${nameOf(from)}: ${text}`;
  } else note.textContent = "";

  const log = $("scanLog");
  if (v.scan?.length) { log.hidden = false; log.innerHTML = `<li class="soft">Nhật ký quét</li>` + v.scan.map((r) => `<li>Đêm ${r.round}: ${esc(nameOf(r.target))} là <span class="${r.team === "mole" ? "w" : "ok"}">${r.team === "mole" ? "Nội Gián" : "Đặc Vụ"}</span></li>`).join(""); }
  else log.hidden = true;
}
$("actRow").addEventListener("click", async (e) => {
  const a = e.target.closest("[data-a]")?.dataset.a; if (!a || !v) return; // v=null: đã về màn đầu, nút cũ còn sót
  if (a === "start") send({ t: "start" });
  else if (a === "repair") send({ t: a, enabled: !v.night?.armed });
  else if (a === "jam") send({ t: a, enabled: !v.night?.jam?.armed });
  else if (a === "verify") send({ t: a });
  else if (a === "skip") send({ t: "vote", target: null });
  else if (a === "leave") {
    if (v.phase !== "lobby" && v.phase !== "end" && !confirm("Rời ván đang chơi? Ghế của bạn sẽ ở lại như người mất kết nối.")) return;
    send({ t: "leave" });
  }
  else if (a === "disband") {
    if (othersHuman() && !confirm("Hủy phòng? Mọi người trong phòng sẽ bị đưa ra ngoài.")) return;
    send({ t: "disband" });
  }
  else if (a === "result") { endHidden = false; renderEnd(); }
  else if (a === "copy") {
    const link = `${location.origin}${location.pathname}?p=${v.code}`;
    try { await navigator.clipboard.writeText(link); toast("Đã chép link mời."); } catch { toast(`Mã phòng: ${v.code}`); }
  }
});

$("dispatchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const text = $("dispatchInput").value.trim();
  if (!canDispatch() || dispatchTo === null || !text) return;
  send({ t: "dispatch", target: dispatchTo, text });
});

// ---------------- phòng chờ: danh sách người + bộ vai ----------------
const ROLE_ORDER = ["mole", "hacker", "security", "agent", "technician", "jammer", "signal", "courier"];
const roleCount = (n) => ({ mole: n >= 7 ? "1–2" : 2, hacker: 1, security: 1, agent: n >= 7 ? "2–3" : 2, technician: n >= 7 ? "?" : 0, jammer: n >= 7 ? "?" : 0, signal: n === 8 ? "?" : 0, courier: n >= 7 ? "?" : 0 });
const thumb = (k) => `assets/thumbs/${ROLE[k].img}`;
let lastLobbyKey = "";
function renderLobby() {
  const box = $("lobby"), on = v.phase === "lobby";
  box.hidden = !on; if (!on) { lastLobbyKey = ""; return; }
  const n = v.players.length, off = v.players.filter((p) => !p.connected).length, iHost = v.host === v.seat;
  const key = JSON.stringify([v.seat, v.host, v.players.map((p) => [p.name, p.avatar, p.connected, p.bot])]);
  if (key === lastLobbyKey) return; lastLobbyKey = key;

  $("pplCount").textContent = `${n}/${v.max}`;
  let rows = v.players.map((p) => {
    const chips = [];
    if (v.host === p.seat) chips.push(`<span class="chip chip--host">★ Chủ phòng</span>`);
    if (p.bot) chips.push(`<span class="chip chip--bot">Bot</span>`);
    else chips.push(p.connected ? `<span class="chip chip--ok">Sẵn sàng</span>` : `<span class="chip chip--off">Mất kết nối</span>`);
    if (p.bot && iHost) chips.push(`<button type="button" class="chip chip--x" data-kick="${p.seat}" aria-label="Bớt ${esc(p.name)}">✕</button>`);
    else if (iHost && p.seat !== v.seat) chips.push(kickButtonHTML(p.seat, p.name)); // chủ phòng "Mời ra" người thật
    return `<li class="prow${p.connected ? "" : " prow--off"}${p.seat === v.seat ? " prow--me" : ""}">
      ${avatar(p, "av av--sm")}
      <span class="prow__name">${esc(p.name)}${p.seat === v.seat ? ` <i>(bạn)</i>` : ""}</span>
      <span class="prow__chips">${chips.join("")}</span></li>`;
  }).join("");
  const empty = v.max - n;
  if (empty > 0) rows += `<li class="prow prow--empty"><span class="av av--sm av--empty"></span><span class="prow__name">Còn ${empty} ghế trống</span></li>`;
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
  if (!match) { warn.className = "rwarn rwarn--bad"; warn.textContent = `Có ${total} vai cho ${n} người: thiếu ${total - n} người.${iHost ? " Mời bạn bè hoặc bấm “Thêm bot”." : ""}`; }
  else if (off) { warn.className = "rwarn rwarn--warn"; warn.textContent = `Khớp ${total} vai cho ${n} người — nhưng ${off} người đang mất kết nối, quá 20 giây không vào lại sẽ tự rời phòng.`; }
  else { warn.className = "rwarn rwarn--ok"; warn.textContent = `Khớp: ${total} vai cho ${n} người. ${n >= 7 ? `Chọn ngẫu nhiên ${n - 6} vai đặc biệt. Chuyên Viên Tín Hiệu đi cùng Kẻ Đánh Lạc Hướng. Phe Nội Gián luôn có hai người.` : "Từ 7 người sẽ có thêm vai đặc biệt."}`; }
}
$("addBot").onclick = () => send({ t: "add-bot" });
$("plist").addEventListener("click", (e) => { const b = e.target.closest("[data-kick]"); if (b) send({ t: "kick-bot", target: +b.dataset.kick }); });

// ---------------- trò chuyện ----------------
const hhmm = (ts) => { const d = new Date(ts); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
const msgLi = (c, color) => `<li class="msg"><span><b style="color:${color || SEAT_COLOR[(v.players[c.seat]?.avatar ?? c.seat) % 8]}">${esc(nameOf(c.seat))}</b>: ${esc(c.text)}</span>${c.ts ? `<time>${hhmm(c.ts)}</time>` : ""}</li>`;
let lastLogKey = "";
function renderChat() {
  // "Tắt chat" (chung toàn trang): giấu lời người chơi gõ, vẫn giữ sự kiện của ván và câu nói nhanh có sẵn
  const off = isChatOff(), said = (c) => !off || v.quick.includes(c.text);
  const mole = isMole(me()) && !!v.moleChat;
  $("tabMole").hidden = !mole; if (!mole && tab === "mole") tab = "public";
  if (mole && v.phase === "night" && lastRoundSeen !== v.round) { tab = "mole"; lastRoundSeen = v.round; }
  if (v.phase !== "night" && tab === "mole" && v.phase !== "end") tab = "public";
  $("tabPublic").setAttribute("aria-selected", tab === "public"); $("tabMole").setAttribute("aria-selected", tab === "mole");
  let items;
  if (tab === "mole") items = (v.moleChat || []).filter(said).map((c) => msgLi(c, "var(--red)"));
  else items = v.events.map((e) => `<li class="sys">${evText(e)}</li>`).concat(v.chat.filter(said).map((c) => msgLi(c)));
  const key = tab + off + items.join("");
  if (key !== lastLogKey) { lastLogKey = key; const log = $("chatLog"); log.innerHTML = items.join("") || `<li class="sys">${tab === "mole" ? "Kênh mã hóa — chỉ Nội Gián đọc được." : "Chưa có ai nói gì."}</li>`; log.scrollTop = log.scrollHeight; }
  const my = me(), ph = v.phase;
  const canTalk = my?.alive && (tab === "mole" ? ph === "night" : ph !== "night" && ph !== "reveal");
  document.querySelector(".chat").classList.toggle("chat--off", !canTalk);
  // người đã bị loại / đêm im lặng: khoá thật ô nhập (không chỉ làm mờ) để bàn phím cũng không gửi được
  $("chatInp").disabled = !canTalk || off; $("chatBtn").disabled = !canTalk || off;
  $("chatInp").placeholder = !my?.alive ? "Người đã bị loại không được nói" : off ? "Chat đang tắt" : tab === "mole" ? "Nhắn mã hóa với đồng bọn…" : canTalk ? "Nói gì đó với cả đội…" : "Mất điện — phòng họp im lặng";
  const q = $("quick");
  if (!q.childElementCount) q.innerHTML = v.quick.map((s, i) => `<button type="button" data-q="${i}">${esc(s)}</button>`).join("");
  q.querySelectorAll("button").forEach((b) => { b.disabled = !canTalk; });
  q.hidden = tab === "mole";
}
$("tabPublic").onclick = () => { tab = "public"; render(); };
$("tabMole").onclick = () => { tab = "mole"; render(); };
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
  const mates = isMole(me()) ? v.players.filter((p) => isMole(p) && p.seat !== v.seat).map((p) => p.name) : [];
  $("revealCap").innerHTML = `Bạn là <b>${r.name}</b> — ${r.desc}${mates.length ? `<br>Đồng bọn: <b style="color:var(--red)">${mates.map(esc).join(", ")}</b>` : ""}${manual ? "<br><span class='soft'>Chạm để đóng</span>" : ""}`;
  const lineup = Object.entries(v.lineup || {}).filter(([, count]) => count).map(([key, count]) => `${ROLE[key].name} ×${count}`);
  if (lineup.length) $("revealCap").innerHTML += `<br><span class="soft">Bộ vai: ${lineup.join(" · ")}</span>`;
  const ov = $("ovReveal"); ov.hidden = false; $("flip").classList.remove("on");
  setTimeout(() => $("flip").classList.add("on"), 350);
  ov.onclick = manual ? () => { ov.hidden = true; revealShown = v?.round ?? -1; } : null;
}
function renderEnd() {
  const w = v.winner, my = me();
  $("endTitle").textContent = w === "mole" ? "Nội Gián đã chiếm trụ sở!" : "Đã bắt gọn cả hai Nội Gián!";
  $("endTitle").className = `end__title ${w}`;
  $("endSub").textContent = `${won(my) ? "Bạn thắng ván này." : "Bạn thua ván này."} Sau ${v.round} lần mất điện.`;
  $("endCards").innerHTML = v.players.map((p) => {
    const r = ROLE[p.role] || ROLE.agent;
    return `<figure class="${p.alive ? "" : "dead"} ${won(p) ? "win" : ""}"><img src="assets/thumbs/${r.img}" alt=""><figcaption>${esc(p.name)}<br>${r.name}${p.alive ? "" : " · bị loại"}</figcaption></figure>`;
  }).join("");
  $("againBtn").hidden = v.host !== v.seat;
  $("ovEnd").hidden = false;
}
$("againBtn").onclick = () => send({ t: "again" });
$("endClose").onclick = () => { endHidden = true; $("ovEnd").hidden = true; };

$("sndBtn").onclick = () => {
  try { localStorage.setItem(MUTE_KEY, sfx.muted() ? "0" : "1"); } catch { /* bỏ qua */ }
  showSnd(); if (!sfx.muted()) sfx.play("blip");
};
window.addEventListener("storage", (e) => { if (e.key === MUTE_KEY) showSnd(); });
showSnd();

function toast(t) { if ($("game").hidden) return homeMsg(t); banner(t); }

// ---------------- khởi động ----------------
if (sess) connect();
else {
  let last = null; try { last = JSON.parse(localStorage.getItem(LAST)); } catch {}
  if (last?.code && last?.token) {
    const b = document.createElement("button"); b.className = "btn btn--teal home__create"; b.textContent = `Quay lại phòng ${last.code}`;
    b.onclick = () => { sess = last; try { sessionStorage.setItem(SESS, JSON.stringify(last)); } catch {} homeMsg("Đang quay lại phòng…"); ws ? send({ t: "resume", ...last }) : connect(); };
    const row = document.createElement("div"); row.className = "home__row"; row.id = "resumeRow"; row.append(b);
    document.querySelector(".home__opt").before(row);
    // Chỉ hiện khi phòng còn trên máy chủ (phòng hết hạn / máy chủ khởi động lại ⇒ quên ghế cũ, không hiện nút "chết").
    row.hidden = true;
    fetch(`/api/lobby/rooms/${encodeURIComponent(last.code)}`, { cache: "no-store" })
      .then((r) => ((r.ok || r.status === 404) && /json/.test(r.headers.get("content-type") || "") ? r.json() : null)) // máy chủ cũ không có API ⇒ null
      .then((d) => { if (!d || d.games?.includes(GAME)) row.hidden = false; else { try { localStorage.removeItem(LAST); } catch {} row.remove(); } })
      .catch(() => { row.hidden = false; }); // không hỏi được ⇒ cứ cho thử
  }
  $("createBtn").addEventListener("pointerenter", () => { if (!ws) connect(); }, { once: true });
}
