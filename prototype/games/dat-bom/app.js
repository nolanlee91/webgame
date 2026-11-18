// Đặt Bom — client. Máy chủ (games-server/dat-bom) giữ bom, lửa, gạch, vật phẩm, sống/chết, điểm.
// Client tự đi nhân vật của mình bằng đúng hàm move() của logic.js (mượt, không chờ mạng) rồi gửi vị trí lên;
// máy chủ kiểm tra lại, sai thì gửi "fix" để kéo về. Người khác được nội suy giữa các khung 20 lần/giây.
// Đồ hoạ trong bản đồ: sprite Pixel V5 của Codex ở assets/ (ô 64 px).
import * as L from "./logic.js";

const $ = (id) => document.getElementById(id);
const SESS = "dat-bom:sess", NAME = "dat-bom:name";
const T = 64; // điểm ảnh mỗi ô trên canvas = đúng kích thước sprite; CSS co giãn canvas theo màn hình
const COLORS = ["#e74c3c", "#4a90e2", "#f5d77f", "#5cb85c"]; // theo 4 bộ đồ: đỏ, xanh dương, vàng, xanh lá
const CNAME = ["Đỏ", "Xanh dương", "Vàng", "Xanh lá"];
const ITEM_NAME = { b: "Thêm bom", f: "Lửa dài hơn", s: "Chạy nhanh hơn" };
const ERR = {
  started: "Ván đã bắt đầu, chờ ván sau nhé.", full: "Phòng đã đủ 4 người.", name: "Hãy nhập tên (tối đa 16 ký tự).",
  phase: "Chưa tới lúc làm việc này.", "not-host": "Chỉ chủ phòng mới làm được.", "need-2": "Cần ít nhất 2 người để bắt đầu.",
  "no-room": "Không tìm thấy phòng này (có thể đã đóng).", "no-seat": "Phiên chơi cũ đã hết.", busy: "Máy chủ đang bận, thử lại sau ít phút.",
  "chat-slow": "Nhắn chậm lại một chút nhé.", long: "Tin nhắn dài quá (tối đa 200 ký tự).", bad: "Yêu cầu không hợp lệ.",
  loading: "Máy chủ đang khởi động, thử lại sau giây lát.", server: "Máy chủ gặp lỗi, thử lại nhé.", already: "Bạn đang ở trong một phòng.",
};

let ws = null, retry = 0, pending = null, v = null, f = null, offset = 0;
let sess = null; try { sess = JSON.parse(sessionStorage.getItem(SESS)); } catch {}
function save(s) { sess = s; try { if (s) sessionStorage.setItem(SESS, JSON.stringify(s)); else sessionStorage.removeItem(SESS); } catch {} }
const now = () => Date.now() + offset;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// ---------------- âm thanh: tổng hợp bằng WebAudio (không cần file), dùng chung khoá tắt tiếng "wgp.muted" ----------------
const MUTE_KEY = "wgp.muted";
const sfx = (() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  let ac = null, noise = null;
  const muted = () => { try { return localStorage.getItem(MUTE_KEY) === "1"; } catch { return false; } };
  const unlock = () => { if (!ac && AC) ac = new AC(); if (ac?.state === "suspended") ac.resume().catch(() => {}); };
  for (const e of ["pointerdown", "keydown"]) window.addEventListener(e, unlock, { capture: true, passive: true });
  const S = {
    bomb: [[330, 0.04, "square"], [220, 0.05, "square"]],
    pick: [[523, 0.06, "square"], [784, 0.06, "square"], [1046, 0.1, "square"]],
    die: [[392, 0.12, "sawtooth"], [262, 0.14, "sawtooth"], [131, 0.3, "sawtooth"]],
    win: [[523, 0.1, "square"], [659, 0.1, "square"], [784, 0.1, "square"], [1046, 0.3, "square"]],
    lose: [[392, 0.16, "triangle"], [330, 0.16, "triangle"], [262, 0.4, "triangle"]],
    msg: [[1320, 0.04, "triangle"], [1760, 0.05, "triangle"]],
    join: [[440, 0.06, "triangle"], [660, 0.09, "triangle"]], leave: [[523, 0.07, "triangle"], [330, 0.11, "triangle"]],
    tick: [[880, 0.06, "square"]], go: [[1320, 0.18, "square"]],
  };
  function boom(vol) { // tiếng nổ = nhiễu trắng qua lọc thấp, tắt dần
    if (!noise) { noise = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = ac.createBufferSource(), flt = ac.createBiquadFilter(), g = ac.createGain(), t = ac.currentTime;
    s.buffer = noise; flt.type = "lowpass"; flt.frequency.setValueAtTime(1400, t); flt.frequency.exponentialRampToValueAtTime(120, t + 0.45);
    g.gain.setValueAtTime(0.35 * vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.48);
    s.connect(flt).connect(g).connect(ac.destination); s.start(t); s.stop(t + 0.5);
  }
  return {
    muted, log: [],
    play(n, vol = 1) {
      this.log.push(n); if (this.log.length > 200) this.log.shift();
      if (muted() || !ac) return false;
      if (n === "boom") { boom(vol); return true; }
      if (!S[n]) return false;
      let t = ac.currentTime;
      for (const [fq, d, type] of S[n]) {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = type; o.frequency.value = fq;
        g.gain.setValueAtTime(0.07 * vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.02);
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
$("sndBtn").onclick = () => { try { localStorage.setItem(MUTE_KEY, sfx.muted() ? "0" : "1"); } catch {} showSnd(); };
showSnd();

// ---------------- kết nối ----------------
function connect() {
  const url = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws/dat-bom`;
  try { ws = new WebSocket(url); } catch { return offline(); }
  let opened = false;
  ws.onopen = () => {
    opened = true; retry = 0; $("net").hidden = true;
    if (sess) send({ t: "resume", code: sess.code, token: sess.token });
    else if (pending) { send(pending); pending = null; }
    else send({ t: "list" });
  };
  ws.onmessage = (e) => { let m; try { m = JSON.parse(e.data); } catch { return; } onMsg(m); };
  ws.onclose = (e) => {
    ws = null;
    if (e.code === 4000) return; // tab khác đã thay
    if (!opened && !sess && !retry) offline();
    if (sess) $("net").hidden = false;
    setTimeout(connect, Math.min(8000, 500 * 2 ** retry++));
  };
}
function offline() { homeMsg("Chưa kết nối được máy chủ Đặt Bom. Khi chạy thử trên máy: node games-server/dat-bom/dev.js"); $("pubList").innerHTML = '<li class="soft">Không tải được danh sách phòng.</li>'; }
function send(o) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(o));
  else if (o.t === "create" || o.t === "join") { pending = o; if (!ws) connect(); }
}

function onMsg(m) {
  switch (m.t) {
    case "joined": save({ code: m.code, token: m.token }); history.replaceState(null, "", `?p=${m.code}`); break;
    case "state": { offset = m.now - Date.now(); const prev = v; v = m.v; render(prev); break; }
    case "f": offset = m.now - Date.now(); onFrame(m); break;
    case "fix": if (me && m.alive !== false) { me = { x: m.x, y: m.y }; sent = { ...me }; } break;
    case "list": renderPub(m.rooms); break;
    case "err":
      if (m.code === "no-seat" || (m.code === "no-room" && !v)) { save(null); showHome(); if (m.code === "no-room") homeMsg(ERR["no-room"]); send({ t: "list" }); break; }
      if (m.code === "no-bomb" || m.code === "slow") break;
      toast(ERR[m.code] || "Có lỗi xảy ra."); break;
    case "kicked": case "left": save(null); v = null; f = null; showHome(); homeMsg(m.t === "kicked" ? "Bạn đã rời phòng." : ""); send({ t: "list" }); break;
    case "replaced": save(null); v = null; f = null; showHome(); homeMsg("Phòng này đang mở ở tab khác."); break;
  }
}

// ---------------- màn đầu ----------------
function homeMsg(t) { $("homeMsg").textContent = t; }
function showHome() { $("home").hidden = false; $("game").hidden = true; $("barCode").hidden = true; history.replaceState(null, "", location.pathname); }
function needName() {
  const n = $("nameInp").value.trim(); if (!n) { homeMsg(ERR.name); $("nameInp").focus(); return null; }
  try { localStorage.setItem(NAME, n); } catch {}
  return n;
}
try { $("nameInp").value = localStorage.getItem(NAME) || ""; } catch {}
$("createBtn").onclick = () => { const name = needName(); if (name) { homeMsg("Đang tạo phòng…"); send({ t: "create", name, public: !$("privateRoom").checked }); } };
function joinCode(code) {
  const name = needName(); if (!name) return;
  code = String(code || "").toUpperCase().trim();
  if (!/^[A-Z2-9]{5}$/.test(code)) { homeMsg("Mã phòng gồm 5 ký tự."); $("codeInp").focus(); return; }
  homeMsg("Đang vào phòng…"); send({ t: "join", code, name });
}
$("joinForm").onsubmit = (e) => { e.preventDefault(); joinCode($("codeInp").value); };
$("pubRef").onclick = () => send({ t: "list" });
function renderPub(rooms) {
  $("pubList").innerHTML = rooms.length
    ? rooms.map((r) => `<li class="room"><b>${esc(r.code)}</b><span>${esc(r.host)}</span><span class="soft">${r.n}/${r.max}</span><button class="btn btn--teal" type="button" data-code="${esc(r.code)}">Vào</button></li>`).join("")
    : '<li class="soft">Chưa có phòng công khai nào — tạo phòng rồi bật "công khai" để người khác vào.</li>';
}
$("pubList").onclick = (e) => { const b = e.target.closest("[data-code]"); if (b) joinCode(b.dataset.code); };
setInterval(() => { if (!$("home").hidden && ws && ws.readyState === 1 && !sess) send({ t: "list" }); }, 5000);

// ---------------- trong phòng ----------------
let me = null, meGid = 0, sent = { x: 0, y: 0 }, sentAt = 0, face = "d";
const disp = [];          // vị trí đang vẽ của từng người (nội suy về vị trí máy chủ)
const deadAt = [];        // lúc thấy người đó bị loại (hiệu ứng mờ dần)
let countSaid = -1, lastPhase = null, warnSec = -1;

const you = () => (v ? v.you : -1);
const myP = () => (f && v ? f.p[v.you] : null);
const isHost = () => v && v.you === v.host;

// Tiếng vào/rời phòng: so danh sách người chơi lần trước với lần này (không kêu cho chính mình).
function presenceSfx(prev, v) {
  if (!prev || prev.code !== v.code) return;
  let join = false, gone = (prev.players || []).length > (v.players || []).length;
  (v.players || []).forEach((p, i) => {
    if (i === v.you || !p) return;
    const o = prev.players[i];
    if (!o || o.name !== p.name || (!o.connected && p.connected && !p.left)) join = true;
    else if ((o.connected && !p.connected) || (!o.left && p.left)) gone = true;
  });
  if (join) sfx.play("join", 0.8); else if (gone) sfx.play("leave", 0.8);
}
function render(prev) {
  presenceSfx(prev, v);
  $("home").hidden = true; $("game").hidden = false;
  $("barCode").hidden = false; $("barCodeTxt").textContent = v.code;
  if (lastPhase !== v.phase) {
    if (v.phase === "over" && v.result) sfx.play(v.result.winner === v.you ? "win" : v.result.winner < 0 ? "go" : "lose"); // hoà ⇒ tiếng trung tính
    if (v.phase === "lobby" && lastPhase === "over") sfx.play("join", 0.6); // về phòng chờ
    if (v.phase !== "play") f = v.phase === "over" ? f : null;
    lastPhase = v.phase;
  }
  // người chơi
  const pl = v.players;
  $("pplCount").textContent = `${pl.filter((p) => !p.left).length}/4`;
  $("pplList").innerHTML = pl.map((p, i) => {
    const fp = f && f.p[i], dead = v.phase !== "lobby" && fp && !fp[3];
    const tags = [];
    if (i === v.host) tags.push("Chủ phòng");
    if (p.left) tags.push("đã rời"); else if (!p.connected) tags.push("mất mạng");
    if (p.wins) tags.push(`<b>${p.wins}</b> thắng`);
    return `<li class="${p.connected ? "" : "off"} ${dead ? "dead" : ""}"><span class="sw" style="background:${COLORS[i]}" title="${CNAME[i]}"></span>` +
      `<span class="ppl__nm">${esc(p.name)}${i === v.you ? " (bạn)" : ""}</span><span class="tag">${tags.join(" · ")}</span></li>`;
  }).join("");
  // chat
  const log = $("chatLog");
  const key = v.chat.map((c) => c.id).join(",");
  if (log.dataset.key !== key) {
    const newMsg = prev && v.chat.length && (!prev.chat.length || v.chat.at(-1).id !== prev.chat.at(-1)?.id) && !v.chat.at(-1).mine;
    log.dataset.key = key;
    log.innerHTML = v.chat.length ? v.chat.map((c) => `<li class="msg ${c.mine ? "mine" : ""}"><b>${esc(c.name)}:</b> ${esc(c.text)}</li>`).join("")
      : '<li class="sys">Chưa có tin nhắn nào. Chào cả phòng đi!</li>';
    log.scrollTop = log.scrollHeight;
    if (newMsg) sfx.play("msg", 0.6);
  }
  // phòng chờ
  $("ovLobby").hidden = v.phase !== "lobby";
  if (v.phase === "lobby") {
    $("lobCode").textContent = v.code;
    $("pubToggle").checked = v.public; $("pubToggle").disabled = !isHost();
    const n = pl.length;
    $("startBtn").hidden = !isHost();
    $("startBtn").setAttribute("aria-disabled", String(n < 2));
    $("lobNote").textContent = isHost() ? (n < 2 ? "Chờ thêm ít nhất 1 người nữa…" : `${n} người đã sẵn sàng — bấm Bắt đầu!`) : `Chờ chủ phòng bắt đầu (${n}/4 người).`;
  }
  // kết thúc
  $("ovEnd").hidden = v.phase !== "over" || !v.result;
  if (v.phase === "over" && v.result) renderEnd();
}

function renderEnd() {
  const r = v.result, pl = v.players;
  $("endKick").textContent = r.reason === "time" ? "Hết giờ — tính điểm" : "Người sống sót cuối cùng";
  $("endTitle").textContent = r.draw ? "Hoà!" : r.winner === v.you ? "Bạn thắng!" : `${pl[r.winner]?.name || "?"} thắng!`;
  const order = r.stats.map((s, i) => i).sort((a, b) => (b === r.winner) - (a === r.winner) || r.stats[b].score - r.stats[a].score);
  $("endList").innerHTML = order.map((i) => {
    const s = r.stats[i];
    return `<li class="${i === r.winner ? "win" : ""} ${s.alive ? "" : "dead"}"><span class="sw" style="background:${COLORS[i]}"></span>` +
      `<span class="end__nm">${esc(pl[i]?.name || "?")}${i === v.you ? " (bạn)" : ""}</span><span class="soft">${s.kills} hạ · ${s.bricks} gạch</span><b>${s.score}</b></li>`;
  }).join("");
  const seated = pl.filter((p) => !p.left).length;
  $("againBtn").setAttribute("aria-disabled", String(seated < 2));
  $("toLobbyBtn").hidden = !isHost();
  $("endNote").textContent = seated < 2 ? "Chỉ còn mình bạn — về phòng chờ để mời thêm người." : "Ai bấm “Ván mới” cũng được. Chủ phòng có thể về phòng chờ để mời thêm người.";
}

function onFrame(m) {
  const fresh = !f || m.gid !== meGid;
  f = m;
  if (!v) return;
  const p = m.p[v.you];
  if (fresh) {
    meGid = m.gid; me = p ? { x: p[0], y: p[1] } : null; sent = me ? { ...me } : sent; countSaid = -1;
    disp.length = 0; deadAt.length = 0;
  }
  for (let i = 0; i < m.p.length; i++) {
    const q = m.p[i];
    if (!disp[i]) disp[i] = { x: q[0], y: q[1] };
    if (!q[3] && !deadAt[i]) deadAt[i] = performance.now();
  }
  if (p && !p[3]) me = null;
  for (const e of m.ev) {
    if (e.k === "boom") { sfx.play("boom", 0.8); shake = 6; boomAt.set(L.idx(e.x, e.y), performance.now()); }
    else if (e.k === "bomb") sfx.play("bomb", 0.6);
    else if (e.k === "pick" && e.i === v.you) { sfx.play("pick"); banner(ITEM_NAME[e.kind] + "!"); }
    else if (e.k === "die") {
      if (e.i === v.you) { sfx.play("die"); banner(e.by === v.you ? "Bạn tự nổ trúng mình!" : e.by >= 0 ? `${v.players[e.by]?.name || "?"} đã hạ bạn` : "Bạn bị loại"); }
      else (sfx.play("die", 0.35), banner(`${v.players[e.i]?.name || "?"} bị loại${e.by >= 0 && e.by !== e.i ? ` bởi ${e.by === v.you ? "bạn" : v.players[e.by]?.name || "?"}` : ""}`));
    }
  }
}

// ---------------- điều khiển ----------------
const held = [];      // hướng đang giữ (phím nhấn sau cùng được ưu tiên)
let touchDir = null;
const KEYMAP = { ArrowLeft: "l", ArrowRight: "r", ArrowUp: "u", ArrowDown: "d", a: "l", d: "r", w: "u", s: "d", A: "l", D: "r", W: "u", S: "d" };
const typing = () => { const a = document.activeElement; return a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA"); };
const inGame = () => !$("game").hidden && v && v.phase === "play";
window.addEventListener("keydown", (e) => {
  if (typing() || !inGame()) return;
  const d = KEYMAP[e.key];
  if (d) { e.preventDefault(); if (!held.includes(d)) held.push(d); return; }
  if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (!e.repeat) dropBomb(); }
});
window.addEventListener("keyup", (e) => { const d = KEYMAP[e.key]; if (d) { const k = held.indexOf(d); if (k >= 0) held.splice(k, 1); } });
window.addEventListener("blur", () => { held.length = 0; touchDir = null; });
const curDir = () => touchDir || held[held.length - 1] || null;

function dropBomb() {
  if (!inGame() || !me) return;
  send({ t: "bomb", x: me.x, y: me.y, d: face });
  sent = { ...me }; sentAt = performance.now();
}

// D-pad: kéo ngón tay trong vùng D-pad để đổi hướng (không cần nhấc tay)
const dpad = document.querySelector(".dpad");
function padAt(e) {
  const r = dpad.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  if (Math.hypot(dx, dy) < 10) return touchDir;
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "r" : "l") : (dy > 0 ? "d" : "u");
}
function showPad() { for (const b of dpad.querySelectorAll("button")) b.classList.toggle("is-on", b.dataset.dir === touchDir); }
dpad.addEventListener("pointerdown", (e) => { e.preventDefault(); dpad.setPointerCapture?.(e.pointerId); touchDir = padAt(e); showPad(); });
dpad.addEventListener("pointermove", (e) => { if (touchDir) { touchDir = padAt(e); showPad(); } });
for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) dpad.addEventListener(ev, () => { touchDir = null; showPad(); });
dpad.addEventListener("contextmenu", (e) => e.preventDefault());
const bombBtn = $("bombBtn");
bombBtn.addEventListener("pointerdown", (e) => { e.preventDefault(); bombBtn.classList.add("is-on"); dropBomb(); });
for (const ev of ["pointerup", "pointercancel", "pointerleave"]) bombBtn.addEventListener(ev, () => bombBtn.classList.remove("is-on"));
const touchy = () => document.body.classList.add("is-touch");
if (matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0) touchy();
window.addEventListener("touchstart", touchy, { once: true, passive: true });

$("startBtn").onclick = () => { if (v && v.players.length >= 2) send({ t: "start" }); else toast(ERR["need-2"]); };
$("pubToggle").onchange = (e) => send({ t: "public", on: e.target.checked });
$("againBtn").onclick = () => send({ t: "again" });
$("toLobbyBtn").onclick = () => send({ t: "lobby" });
$("leaveBtn").onclick = () => send({ t: "leave" });
$("copyBtn").onclick = async () => {
  const link = `${location.origin}${location.pathname}?p=${v.code}`;
  try { await navigator.clipboard.writeText(link); banner("Đã chép đường mời"); } catch { banner(link); }
};
$("chatForm").onsubmit = (e) => {
  e.preventDefault();
  const t = $("chatInp").value.trim(); if (!t) return;
  send({ t: "chat", text: t }); $("chatInp").value = "";
  if (inGame()) $("chatInp").blur(); // gửi xong trả phím về cho game
};

let bannerT = 0;
function banner(t) { const b = $("banner"); b.textContent = t; b.classList.add("on"); clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.remove("on"), 1800); }
function toast(t) { if ($("game").hidden) return homeMsg(t); banner(t); }

// ---------------- vòng lặp: đi + vẽ ----------------
const cv = $("cv"), ctx = cv.getContext("2d");
cv.width = L.W * T; cv.height = L.H * T;
ctx.imageSmoothingEnabled = false; // sprite vẽ đúng 1:1, giữ nét pixel
let lastT = performance.now(), shake = 0;

function bombsNow() { return f ? f.b.map((b) => ({ x: b[0], y: b[1], pass: b[5] })) : []; }

function step(t) {
  const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;
  const p = myP();
  if (inGame() && f && !f.over && me && p && p[3] && now() >= f.s) {
    const d = curDir();
    if (d) { face = d; me = L.move(me, d, p[6] * dt, L.blocker(f.g, bombsNow(), v.you)); }
    if (t - sentAt >= 50 && (me.x !== sent.x || me.y !== sent.y)) {
      send({ t: "mv", x: me.x, y: me.y, d: face }); sent = { ...me }; sentAt = t;
    }
  }
  if (f) for (let i = 0; i < f.p.length; i++) {
    const q = f.p[i], o = disp[i] || (disp[i] = { x: q[0], y: q[1] });
    if (i === you() && me) { o.x = me.x; o.y = me.y; continue; }
    const k = Math.min(1, dt * 16);
    if (Math.abs(q[0] - o.x) + Math.abs(q[1] - o.y) > 2) { o.x = q[0]; o.y = q[1]; }
    else { o.x += (q[0] - o.x) * k; o.y += (q[1] - o.y) * k; }
  }
  draw(t);
  hud();
  requestAnimationFrame(step);
}

function hud() {
  const ov = $("ovCount");
  if (!f || !v || v.phase === "lobby") { ov.hidden = true; $("hudTime").textContent = "3:00"; $("hudMe").innerHTML = ""; $("hudScore").innerHTML = ""; return; }
  const n = now(), left = Math.max(0, Math.ceil((f.e - n) / 1000));
  const tt = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  if (!f.over && $("hudTime").textContent !== tt) $("hudTime").textContent = tt; // hết ván thì đồng hồ đứng yên
  $("hudTime").classList.toggle("is-low", left <= 20);
  if (!f.over && v.phase === "play" && left !== warnSec && (left === 20 || (left <= 5 && left > 0))) { warnSec = left; sfx.play("tick", left === 20 ? 1 : 0.6); } // sắp hết giờ
  const toGo = f.s - n;
  if (v.phase === "play" && toGo > -600) {
    const c = toGo > 0 ? Math.ceil(toGo / 1000) : 0;
    ov.hidden = false; $("countTxt").textContent = c > 0 ? String(c) : "Chạy!";
    if (c !== countSaid) { countSaid = c; sfx.play(c > 0 ? "tick" : "go"); }
  } else ov.hidden = true;
  const p = myP();
  if (p) {
    const h = `<span title="Số bom đặt cùng lúc">Bom <b>${p[4]}</b></span><span title="Độ dài lửa">Lửa <b>${p[5]}</b></span><span title="Tốc độ (ô/giây)">Tốc <b>${p[6]}</b></span>`;
    if ($("hudMe").dataset.h !== h) { $("hudMe").dataset.h = h; $("hudMe").innerHTML = h; }
    const s = `${p[3] ? "" : "Đã bị loại · "}Điểm <b>${p[7]}</b>`;
    if ($("hudScore").dataset.h !== s) { $("hudScore").dataset.h = s; $("hudScore").innerHTML = s; }
  }
}

// ---- vẽ bằng sprite Pixel V5 (assets/, bố cục xem assets/HANDOFF.md) ----
const IMG = {};
let imgReady = false;
{
  const files = { tiles: "map-tiles.webp", bomb: "bomb-sprite.png", boom: "explosion-sprite.png", items: "powerups-sprite.png",
    p0: "player-red.png", p1: "player-blue.png", p2: "player-yellow.png", p3: "player-green.png" };
  let n = 0; const all = Object.keys(files).length;
  for (const [k, file] of Object.entries(files)) {
    const im = new Image();
    im.onload = () => { if (++n === all) imgReady = true; };
    im.onerror = () => { if (!IMG.failed) { IMG.failed = true; banner("Không tải được hình ảnh game, thử tải lại trang."); } };
    im.src = "assets/" + file; IMG[k] = im;
  }
}
const spr = (im, sx, sy, s, dx, dy, d = s) => ctx.drawImage(im, sx, sy, s, s, dx, dy, d, d);
function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
function drawCell(x, y, c) {
  const X = x * T, Y = y * T;
  if (!imgReady) { rect(X, Y, T, T, c === "#" ? "#5d6470" : c === "+" ? "#a65a2e" : "#46853f"); return; }
  if (c === "#") return spr(IMG.tiles, 64, 0, 64, X, Y);
  spr(IMG.tiles, 0, 0, 64, X, Y);
  if (c === "+") spr(IMG.tiles, (x * 7 + y * 3) % 2 ? 64 : 0, 64, 64, X, Y); // 2 kiểu gạch, cùng luật
}
const ITEM_SX = { s: 0, b: 32, f: 64 };
function drawItem(x, y, k, t) {
  const X = x * T, Y = y * T, bob = Math.floor(t / 250) % 2 ? -3 : 0;
  ctx.fillStyle = "rgba(255,240,180,.28)"; ctx.beginPath(); ctx.arc(X + 32, Y + 34, 22, 0, Math.PI * 2); ctx.fill();
  if (imgReady) spr(IMG.items, ITEM_SX[k], 0, 32, X + 12, Y + 12 + bob, 40);
}
const BOMB_FR = [[0, 0], [64, 0], [0, 64], [64, 64]]; // idle, cam, đỏ, trắng
function drawBomb(b, t) {
  const X = b[0] * T, Y = b[1] * T, left = b[3] - now();
  const fr = BOMB_FR[Math.floor(t / (left < 800 ? 80 : 180)) % 4];
  if (imgReady) spr(IMG.bomb, fr[0], fr[1], 64, X, Y); else rect(X + 16, Y + 16, 32, 32, "#111");
  if (b[2] === you()) rect(X + 26, Y + 58, 12, 4, COLORS[b[2]]); // vạch màu: bom của bạn
}
// Lửa: máy chủ chỉ gửi các ô đang cháy. Pha (bùng/đỉnh/tàn) tính từ lúc thấy ô, hình (tâm/ngang/dọc/đầu nhánh) từ ô kề.
const flameSeen = new Map(), boomAt = new Map();
function drawFlames(list, t) {
  const on = new Set(list.map((q) => L.idx(q[0], q[1])));
  for (const k of flameSeen.keys()) if (!on.has(k)) flameSeen.delete(k);
  for (const [k, at] of boomAt) if (t - at > 1000) boomAt.delete(k);
  const has = (x, y) => L.inside(x, y) && on.has(L.idx(x, y));
  for (const [x, y] of list) {
    const k = L.idx(x, y);
    if (!flameSeen.has(k)) flameSeen.set(k, t);
    const X = x * T, Y = y * T;
    if (!imgReady) { rect(X, Y, T, T, "#f39c12"); continue; }
    const row = Math.min(2, Math.floor((t - flameSeen.get(k)) / (L.RULES.flame / 3))) * 64;
    const l = has(x - 1, y), r = has(x + 1, y), u = has(x, y - 1), d = has(x, y + 1);
    let col = 0, rot = 0;
    if (boomAt.has(k) || ((l || r) && (u || d)) || !(l || r || u || d)) col = 0;
    else if (l && r) col = 64;
    else if (u && d) col = 128;
    else { col = 192; rot = l ? 0 : r ? Math.PI : u ? Math.PI / 2 : -Math.PI / 2; } // đầu nhánh quay ra ngoài
    if (!rot) { spr(IMG.boom, col, row, 64, X, Y); continue; }
    ctx.save(); ctx.translate(X + 32, Y + 32); ctx.rotate(rot); spr(IMG.boom, col, row, 64, -32, -32); ctx.restore();
  }
}
const DIR_ROW = { d: 0, l: 64, r: 128, u: 192 }, WALK = [0, 64, 128, 64];
// Nhân vật chỉ chiếm ~27×51 px trong ô 64 px ⇒ trên màn nhỏ (ô hiển thị < 44 px CSS) phóng 1,5 lần, giữ điểm chân [32,60]
// (chỉ là hình vẽ, va chạm do máy chủ tính theo ô nên không đổi luật). Máy tính giữ nguyên cỡ gốc.
const playerScale = () => (cv.clientWidth / L.W < 44 ? 1.5 : 1);
function drawPlayer(i, x, y, dir, alpha, t, moving) {
  const X = Math.round(x * T), Y = Math.round(y * T), k = playerScale();
  const d = Math.round(64 * k), SX = X + 32 - Math.round(32 * k), SY = Y + 60 - Math.round(60 * k); // góc trên-trái sprite đã phóng
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(0,0,0,.32)"; ctx.beginPath(); ctx.ellipse(X + 32, Y + 59, 18 * k, 6 * k, 0, 0, Math.PI * 2); ctx.fill();
  if (imgReady) spr(IMG["p" + i], moving ? WALK[Math.floor(t / 110) % 4] : 64, DIR_ROW[dir] ?? 0, 64, SX, SY, d); // chân ở [32,60]
  else rect(X + 16, Y + 8, 32, 48, COLORS[i]);
  if (i === you()) { // mũi tên vàng đánh dấu "bạn", nằm trên đầu nhân vật
    const b = Math.floor(t / 300) % 2 * 2, A = SY + Math.round(9 * k) - 9, w = k;
    ctx.fillStyle = "#1b1d24"; ctx.beginPath(); ctx.moveTo(X + 32 - 10 * w, A - 10 + b); ctx.lineTo(X + 32 + 10 * w, A - 10 + b); ctx.lineTo(X + 32, A + 2 + b); ctx.fill();
    ctx.fillStyle = "#f5d77f"; ctx.beginPath(); ctx.moveTo(X + 32 - 7 * w, A - 8 + b); ctx.lineTo(X + 32 + 7 * w, A - 8 + b); ctx.lineTo(X + 32, A - 1 + b); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
const prevPos = [];
const EMPTY = L.makeGrid(() => 0.9).join(""); // nền khi chưa có ván: chỉ tường + cột
function draw(t) {
  ctx.save();
  if (shake > 0) { ctx.translate(Math.round((Math.random() - 0.5) * shake * 2), Math.round((Math.random() - 0.5) * shake * 2)); shake = Math.max(0, shake - 0.6); }
  const grid = f ? f.g : EMPTY;
  for (let y = 0; y < L.H; y++) for (let x = 0; x < L.W; x++) {
    drawCell(x, y, grid[L.idx(x, y)]);
  }
  if (f) {
    for (const it of f.it) drawItem(it[0], it[1], it[2], t);
    for (const b of f.b) drawBomb(b, t);
    drawFlames(f.fl, t);
    const order = f.p.map((q, i) => i).sort((a, b) => (disp[a]?.y ?? 0) - (disp[b]?.y ?? 0));
    for (const i of order) {
      const q = f.p[i], o = disp[i]; if (!o) continue;
      let alpha = 1;
      if (!q[3]) { const since = performance.now() - (deadAt[i] || 0); if (since > 900) continue; alpha = Math.floor(since / 90) % 2 ? 0.25 : 0.9; }
      if (v?.players[i]?.left && q[3]) alpha = 0.4;
      const pp = prevPos[i], moving = pp && (Math.abs(pp.x - o.x) + Math.abs(pp.y - o.y)) > 0.001;
      prevPos[i] = { x: o.x, y: o.y };
      drawPlayer(i, o.x, o.y, i === you() && me ? face : q[2], alpha, t, moving);
    }
  }
  ctx.restore();
}
requestAnimationFrame(step);

// ---------------- khởi động ----------------
const qp = new URLSearchParams(location.search).get("p");
if (qp && !(sess && sess.code === qp.toUpperCase())) { save(null); $("codeInp").value = qp.toUpperCase().slice(0, 5); homeMsg(`Bạn được mời vào phòng ${qp.toUpperCase().slice(0, 5)} — nhập tên rồi bấm "Vào phòng".`); }
connect();
