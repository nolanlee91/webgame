// Cờ Cá Ngựa — màn vào phòng + kết nối online (WebSocket /ws/co-ca-ngua).
// Máy chủ (games-server/co-ca-ngua/) giữ ván, gieo xúc xắc và xác thực lượt; file này chỉ:
//   • cho tạo phòng / nhập mã phòng / chọn "chơi chung 1 máy",
//   • chuyển ý định của người chơi lên máy chủ và đẩy trạng thái máy chủ về cho game.js (inst.netState),
//   • tự nối lại khi rớt mạng (giữ ghế bằng token trong sessionStorage — mỗi tab là một người chơi).
import { mount } from "./game.js";

const NAME_KEY = "wgp.co-ca-ngua.name";
const SEAT_KEY = "wgp.co-ca-ngua.seat";
const CODE_RE = /^[A-HJKMNP-Z2-9]{5}$/;
const ERR = {
  "no-room": "Không tìm thấy phòng — kiểm tra lại mã phòng.",
  full: "Phòng đã đủ 4 người.",
  started: "Phòng này đã bắt đầu chơi, không vào thêm được.",
  "no-seat": "Chỗ ngồi cũ của bạn không còn trong phòng.",
  "not-host": "Chỉ chủ phòng làm được việc này.",
  "need-2": "Cần ít nhất 2 người mới bắt đầu được.",
  "not-turn": "Chưa tới lượt bạn.",
  illegal: "Nước đi không hợp lệ.",
  slow: "Thao tác nhanh quá, chậm lại chút nhé.",
  busy: "Máy chủ đang bận (hoặc bạn mở quá nhiều phòng). Thử lại sau.",
  loading: "Máy chủ đang khởi động, thử lại sau giây lát.",
  server: "Máy chủ gặp lỗi, thử lại.",
  bad: "Yêu cầu không hợp lệ.",
};
const OFFLINE = "Chưa kết nối được máy chủ chơi online (máy chủ chưa bật hoặc mạng có vấn đề). Bạn vẫn có thể chơi chung 1 máy.";

function addCss() {
  if (!document.querySelector("link[data-cn-hud]")) {
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = new URL("hud.css", import.meta.url).href; l.dataset.cnHud = ""; document.head.appendChild(l);
  }
  if (!document.querySelector("link[data-cn-online]")) {
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = new URL("online.css", import.meta.url).href; l.dataset.cnOnline = ""; document.head.appendChild(l);
  }
}
const icon = (n) => `<img class="px-ic" src="${new URL("assets/icon-" + n + ".png", import.meta.url).href}" alt="" draggable="false">`;
const load = (k, store) => { try { return JSON.parse(store.getItem(k)); } catch { return null; } };

export function startOnline(stage, baseCtx, { wsUrl } = {}) {
  addCss();
  const url = wsUrl || (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws/co-ca-ngua";
  let ws = null, inst = null, seat = load(SEAT_KEY, sessionStorage), joinedOnce = false, retry = 0, retryTimer = 0, pingTimer = 0, pending = null;
  let toastEl = null, toastTimer = 0;

  function toast(text, ms = 2600) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "cn-toast"; toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
    toastEl.textContent = text; toastEl.hidden = false;
    clearTimeout(toastTimer); if (ms) toastTimer = setTimeout(() => (toastEl.hidden = true), ms);
  }
  const hideToast = () => { if (toastEl) toastEl.hidden = true; clearTimeout(toastTimer); };
  const setRoomParam = (code) => { const u = new URL(location.href); if (code) u.searchParams.set("room", code); else u.searchParams.delete("room"); history.replaceState(null, "", u.href); };
  const saveSeat = (s) => { seat = s; if (s) sessionStorage.setItem(SEAT_KEY, JSON.stringify(s)); else sessionStorage.removeItem(SEAT_KEY); };

  // ---------- Màn vào phòng ----------
  function showEntry(err = "", code = "") {
    stopNet();
    if (inst) { inst.destroy(); inst = null; }
    hideToast();
    const name = localStorage.getItem(NAME_KEY) || "";
    const invite = CODE_RE.test(code);
    stage.innerHTML = `
      <div class="cn-table cn-entry-wrap">
        <section class="px-panel cn-entry" aria-label="Vào phòng Cờ Cá Ngựa">
          <div class="ttl"><h2 class="px-h">Cờ Cá Ngựa · Rủ bạn vào chơi</h2></div>
          <div class="body">
            <label class="lb" for="cnName">Tên của bạn</label>
            <input class="px-input" id="cnName" maxlength="16" autocomplete="nickname" placeholder="Ví dụ: Tí Ngựa" value="">
            ${invite ? "" : `<button class="px-btn primary big" data-e="create" type="button">Tạo phòng online</button>
            <div class="or"><span>hoặc vào phòng của bạn bè</span></div>`}
            <div class="join">
              <input class="px-input code" id="cnCode" maxlength="5" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="MÃ PHÒNG" aria-label="Mã phòng" value="">
              <button class="px-btn ${invite ? "primary" : ""}" data-e="join" type="button">Vào phòng</button>
            </div>
            <div class="err" role="alert"></div>
            <div class="or"><span>hoặc</span></div>
            <button class="px-btn" data-e="local" type="button">Chơi chung 1 máy</button>
            ${invite ? `<button class="px-link as-btn" data-e="fresh" type="button">Tạo phòng mới thay vì vào phòng ${code}</button>` : ""}
            <p class="hint">${icon("san-sang")} Mỗi người chơi trên máy (hoặc tab) của mình. Phòng 2–4 người, chủ phòng bấm Bắt đầu.</p>
          </div>
        </section>
      </div>`;
    const $ = (s) => stage.querySelector(s);
    const nameIn = $("#cnName"), codeIn = $("#cnCode"), errEl = $(".err");
    nameIn.value = name; codeIn.value = code;
    errEl.textContent = err;
    const busyUi = (on) => stage.querySelectorAll(".cn-entry .px-btn").forEach((b) => (b.disabled = on));
    codeIn.addEventListener("input", () => { codeIn.value = codeIn.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); });
    const go = (kind) => {
      const nm = nameIn.value.trim();
      if (kind === "local") return startLocal();
      if (kind === "fresh") { setRoomParam(""); return showEntry(); }
      if (!nm) { errEl.textContent = "Nhập tên của bạn trước nhé."; nameIn.focus(); return; }
      localStorage.setItem(NAME_KEY, nm);
      if (kind === "join") {
        const c = codeIn.value.trim().toUpperCase();
        if (!CODE_RE.test(c)) { errEl.textContent = "Mã phòng gồm 5 ký tự (chữ và số), ví dụ K7M2Q."; codeIn.focus(); return; }
        pending = { t: "join", code: c, name: nm };
      } else pending = { t: "create", name: nm };
      errEl.textContent = "Đang kết nối…"; busyUi(true);
      connect();
    };
    stage.querySelector(".cn-entry").addEventListener("click", (e) => { const b = e.target.closest("[data-e]"); if (b && !b.disabled) go(b.dataset.e); });
    const enter = (e) => { if (e.key === "Enter") go(invite || e.target === codeIn ? "join" : "create"); };
    nameIn.addEventListener("keydown", enter); codeIn.addEventListener("keydown", enter);
    (name ? (invite ? $('[data-e="join"]') : $('[data-e="create"]')) : nameIn).focus();
  }

  function startLocal() {
    stopNet(); saveSeat(null); setRoomParam("");
    stage.innerHTML = "";
    inst = mount(stage, { ...baseCtx, lobby: true });
    window.__game = inst;
  }

  // ---------- Kết nối ----------
  function stopNet() {
    clearTimeout(retryTimer); clearInterval(pingTimer); retryTimer = pingTimer = 0;
    if (ws) { const w = ws; ws = null; w.onclose = w.onmessage = w.onerror = null; try { w.close(1000); } catch {} }
  }
  function send(o) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); else toast("Đang nối lại máy chủ…"); }

  function connect() {
    stopNet();
    let opened = false;
    const w = ws = new WebSocket(url);
    w.onopen = () => {
      opened = true;
      w.send(JSON.stringify(pending || { t: "resume", code: seat.code, token: seat.token }));
      pingTimer = setInterval(() => w.readyState === 1 && w.send('{"t":"ping"}'), 20000);
    };
    w.onmessage = (e) => { let m; try { m = JSON.parse(e.data); } catch { return; } onMsg(m); };
    w.onclose = () => {
      if (ws !== w) return;
      ws = null; clearInterval(pingTimer);
      if (inst && seat) { // đang ở trong phòng → nối lại, giữ ghế
        const ms = Math.min(8000, 500 * 2 ** retry++);
        toast("Mất kết nối — đang nối lại…", 0);
        retryTimer = setTimeout(() => { pending = null; connect(); }, ms);
        return;
      }
      if (!inst) showEntry(opened ? "Mất kết nối với máy chủ, thử lại nhé." : OFFLINE, (pending && pending.code) || (seat && seat.code) || "");
    };
  }

  function onMsg(m) {
    if (m.t === "joined") {
      retry = 0; joinedOnce = true; pending = null;
      saveSeat({ code: m.code, token: m.token });
      setRoomParam(m.code); hideToast();
      if (!inst) { stage.innerHTML = ""; inst = mount(stage, { ...baseCtx, lobby: true, online: { send, leave } }); window.__game = inst; }
      return;
    }
    if (m.t === "state") { if (inst) { m.v.skew = m.now - Date.now(); inst.netState(m.v); } return; }
    if (m.t === "pong") return;
    if (m.t === "left") { saveSeat(null); setRoomParam(""); showEntry(); return; }
    if (m.t === "replaced") { saveSeat(null); showEntry("Bạn đã mở phòng này ở một tab khác — tab này đã thoát."); return; }
    if (m.t === "kicked") { saveSeat(null); setRoomParam(""); showEntry("Bạn không còn trong phòng (đã quá lâu không quay lại phòng chờ)."); return; }
    if (m.t === "err") {
      const text = ERR[m.code] || "Có lỗi xảy ra (" + m.code + ").";
      if (!inst) { // đang vào phòng / nối lại thất bại
        const code = pending && pending.code || seat && seat.code || "";
        if (m.code === "no-seat" || m.code === "no-room") saveSeat(null);
        showEntry(text, m.code === "no-room" ? code : (CODE_RE.test(code) ? code : ""));
        return;
      }
      if (m.code === "no-seat" || m.code === "no-room") { saveSeat(null); setRoomParam(""); showEntry(ERR["no-seat"]); return; }
      if (m.code !== "phase") toast(text);
    }
  }

  function leave() {
    if (ws && ws.readyState === 1) ws.send('{"t":"leave"}');
    else { saveSeat(null); setRoomParam(""); showEntry(); }
  }

  window.__net = {
    get ws() { return ws; }, get seat() { return seat; }, get joined() { return joinedOnce; },
    send, leave, drop() { if (ws) ws.close(); }, // drop: test giả lập rớt mạng
  };

  // ---------- Khởi động ----------
  const q = new URLSearchParams(location.search), code = String(q.get("room") || "").toUpperCase();
  if (seat && seat.code && (!code || code === seat.code)) { pending = null; stage.innerHTML = `<div class="cn-table cn-entry-wrap"><p class="cn-wait">Đang vào lại phòng ${seat.code}…</p></div>`; connect(); }
  else showEntry("", CODE_RE.test(code) ? code : "");

  return window.__net;
}
