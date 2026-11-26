// Cờ Cá Ngựa — màn vào phòng + kết nối online (WebSocket /ws/co-ca-ngua).
// Máy chủ (games-server/co-ca-ngua/) giữ ván, gieo xúc xắc và xác thực lượt; file này chỉ:
//   • cho tạo phòng / nhập mã phòng / chọn "Chơi với máy" (đấu với 1–3 máy, không cần mạng),
//   • chuyển ý định của người chơi lên máy chủ và đẩy trạng thái máy chủ về cho game.js (inst.netState),
//   • tự nối lại khi rớt mạng (giữ ghế bằng token trong sessionStorage — mỗi tab là một người chơi),
//   • đóng hẳn tab rồi mở lại link mời: token còn trong localStorage "<SEAT_KEY>.<MÃ>" (hết hạn 30 phút) ⇒ "resume" đúng ghế cũ.
import { mount } from "./game.js?v=d6b";
import { pxConfirm } from "../_shared/px-confirm.js?v=pc1"; // hộp xác nhận pixel (thay confirm() của trình duyệt)
import { isChatOff, initChatOff } from "../_shared/chat-off.js?v=co1";
import { sharedName, sessionId, initKick, KICKED_TEXT, BANNED_TEXT, KICK_ERR } from "../_shared/online-kit.js?v=ok2"; // tên dùng chung + "Mời ra"

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
  banned: BANNED_TEXT,
  target: KICK_ERR.target,
  long: "Tin nhắn dài quá (tối đa 200 ký tự).",
  "chat-slow": "Bạn nhắn nhanh quá — đợi một chút rồi gửi tiếp.",
};
const SEAT_HEX = ["#e0483d", "#3a7bd5", "#f2b632", "#3fae4a"]; // đỏ, xanh dương, vàng, xanh lá — trùng màu ghế trên bàn (hud.js)
const NAME_MAX = 16; // máy chủ (games-server/moderation.js) và account.js cùng giới hạn 16 ký tự
const nameLen = (v) => [...String(v || "").replace(/\s+/g, " ").trim()].length;
const OFFLINE = "Chưa kết nối được máy chủ chơi online (máy chủ chưa bật hoặc mạng có vấn đề). Bạn vẫn có thể chơi với máy.";

function addCss() {
  if (!document.querySelector("link[data-cn-hud]")) {
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = new URL("hud.css?v=d6b", import.meta.url).href; l.dataset.cnHud = ""; document.head.appendChild(l);
  }
  if (!document.querySelector("link[data-cn-online]")) {
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = new URL("online.css?v=d4b", import.meta.url).href; l.dataset.cnOnline = ""; document.head.appendChild(l);
  }
}
const icon = (n) => `<img class="px-ic" src="${new URL("assets/icon-" + n + ".png", import.meta.url).href}" alt="" draggable="false">`;
const load = (k, store) => { try { return JSON.parse(store.getItem(k)); } catch { return null; } };
// Ghế lưu qua việc đóng tab: localStorage "<SEAT_KEY>.<MÃ>" = { code, token, savedAt } — hết hạn sau 30 phút không ở trong phòng
const KEEP_MS = 30 * 60 * 1000;
const keepKey = (code) => SEAT_KEY + "." + code;
function kept(code) {
  try {
    for (let k = localStorage.length - 1; k >= 0; k--) { // dọn ghế hết hạn
      const key = localStorage.key(k);
      if (key && key.startsWith(SEAT_KEY + ".")) { const s = load(key, localStorage); if (!s || !(Date.now() - s.savedAt < KEEP_MS)) localStorage.removeItem(key); }
    }
    const s = load(keepKey(code), localStorage);
    return s && s.code === code && typeof s.token === "string" ? { code, token: s.token } : null;
  } catch { return null; }
}
function loadSeat() { // ghế của tab này (F5); mở link mời phòng khác ⇒ ghế đã lưu cho phòng đó (nếu còn hạn)
  let s = null; try { s = load(SEAT_KEY, sessionStorage); } catch {}
  const c = String(new URLSearchParams(location.search).get("room") || "").toUpperCase();
  return (CODE_RE.test(c) && (!s || s.code !== c) && kept(c)) || s;
}

export function startOnline(stage, baseCtx, { wsUrl } = {}) {
  addCss();
  const url = wsUrl || (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws/co-ca-ngua";
  let ws = null, inst = null, seat = loadSeat(), joinedOnce = false, retry = 0, retryTimer = 0, pingTimer = 0, pending = null;
  let toastEl = null, toastTimer = 0, exiting = null; // exiting: đang rời phòng để sang trang khác (bấm "← Trang chủ")

  function toast(text, ms = 2600) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "cn-toast"; toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
    toastEl.textContent = text; toastEl.hidden = false;
    clearTimeout(toastTimer); if (ms) toastTimer = setTimeout(() => (toastEl.hidden = true), ms);
  }
  const hideToast = () => { if (toastEl) toastEl.hidden = true; clearTimeout(toastTimer); };
  const setRoomParam = (code) => { const u = new URL(location.href); if (code) u.searchParams.set("room", code); else u.searchParams.delete("room"); history.replaceState(null, "", u.href); };
  let touched = 0, joinAfter = null; // joinAfter: vào bằng mã mà còn ghế đã lưu ⇒ thử resume trước, ghế hết thì join như thường
  // keepLocal: bị tab khác của mình thay chỗ ⇒ chỉ xoá ghế của tab này, giữ bản localStorage cho tab mới
  const saveSeat = (s, keepLocal) => {
    const old = seat; seat = s; touched = Date.now();
    try { if (s) sessionStorage.setItem(SEAT_KEY, JSON.stringify(s)); else sessionStorage.removeItem(SEAT_KEY); } catch {}
    try {
      if (s) localStorage.setItem(keepKey(s.code), JSON.stringify({ code: s.code, token: s.token, savedAt: touched }));
      else if (old && old.code && !keepLocal && load(keepKey(old.code), localStorage)?.token === old.token) localStorage.removeItem(keepKey(old.code));
    } catch {}
  };

  // ---------- Màn vào phòng ----------
  function showEntry(err = "", code = "") {
    stopNet();
    if (inst) { inst.destroy(); inst = null; }
    chatOff();
    hideToast();
    // tên dùng chung toàn site (tài khoản); người cũ có tên riêng của game (NAME_KEY) được chuyển sang một lần
    const names = sharedName({ game: "co-ca-ngua", legacy: () => { try { return localStorage.getItem(NAME_KEY) || ""; } catch { return ""; } } });
    const name = names.get();
    const invite = CODE_RE.test(code);
    stage.innerHTML = `
      <div class="cn-table cn-entry-wrap">
        <section class="px-panel cn-entry" aria-label="Vào phòng Cờ Cá Ngựa">
          <div class="ttl"><h2 class="px-h">Cờ Cá Ngựa · Rủ bạn vào chơi</h2></div>
          <div class="body">
            <div class="lbrow"><label class="lb" for="cnName">Tên của bạn</label><span class="nm-count" id="cnNameCount" aria-live="polite"></span></div>
            <input class="px-input" id="cnName" maxlength="40" autocomplete="nickname" placeholder="Ví dụ: Tí Ngựa" value="" aria-describedby="cnNameCount">
            ${invite ? "" : `<button class="px-btn primary big" data-e="create" type="button">Tạo phòng online</button>
            <label><input id="privateRoom" type="checkbox" /> Phòng kín · vào bằng mã riêng</label>
            <div class="or"><span>hoặc vào phòng của bạn bè</span></div>`}
            <div class="join">
              <input class="px-input code" id="cnCode" maxlength="5" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="MÃ PHÒNG" aria-label="Mã phòng" value="">
              <button class="px-btn ${invite ? "primary" : ""}" data-e="join" type="button">Vào phòng</button>
            </div>
            <div class="err" role="alert"></div>
            <div class="or"><span>hoặc</span></div>
            <button class="px-btn" data-e="bot" type="button">Chơi với máy</button>
            ${invite ? `<button class="px-link as-btn" data-e="fresh" type="button">Tạo phòng mới thay vì vào phòng ${code}</button>` : ""}
            <p class="hint">${icon("san-sang")} Mỗi người chơi trên máy (hoặc tab) của mình. Phòng 2–4 người, chủ phòng bấm Bắt đầu.</p>
          </div>
        </section>
      </div>`;
    const $ = (s) => stage.querySelector(s);
    const nameIn = $("#cnName"), codeIn = $("#cnCode"), errEl = $(".err");
    nameIn.value = name; codeIn.value = code;
    errEl.textContent = err;
    // Bộ đếm ký tự tên (BRD-08): thấy trước khi quá dài thay vì bị cắt im lặng giữa chữ
    const countEl = $("#cnNameCount");
    const showCount = () => {
      const n = nameLen(nameIn.value), over = n > NAME_MAX;
      countEl.textContent = n + "/" + NAME_MAX + (over ? " · dài quá" : "");
      countEl.classList.toggle("over", over);
    };
    nameIn.addEventListener("input", showCount); showCount();
    const busyUi = (on) => stage.querySelectorAll(".cn-entry .px-btn").forEach((b) => (b.disabled = on));
    codeIn.addEventListener("input", () => { codeIn.value = codeIn.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); });
    const go = (kind) => {
      const len = nameLen(nameIn.value), tooLong = len > NAME_MAX;
      const nm = tooLong ? "" : names.commit(nameIn.value); // sửa tên ở đây ⇒ mọi game + bảng xếp hạng cùng đổi (tên quá dài: không lưu)
      if (kind === "bot") return startBots();
      if (kind === "fresh") { setRoomParam(""); return showEntry(); }
      if (tooLong) { errEl.textContent = "Tên tối đa " + NAME_MAX + " ký tự — bớt " + (len - NAME_MAX) + " ký tự nhé."; nameIn.focus(); return; }
      if (!nm) { errEl.textContent = "Nhập tên của bạn trước nhé."; nameIn.focus(); return; }
      try { localStorage.setItem(NAME_KEY, nm); } catch {}
      if (kind === "join") {
        const c = codeIn.value.trim().toUpperCase();
        if (!CODE_RE.test(c)) { errEl.textContent = "Mã phòng gồm 5 ký tự (chữ và số), ví dụ K7M2Q."; codeIn.focus(); return; }
        const k = kept(c);
        pending = k ? null : { t: "join", code: c, name: nm };
        joinAfter = k ? { t: "join", code: c, name: nm } : null;
        if (k) seat = k;
      } else pending = { t: "create", name: nm, public: !$("#privateRoom").checked };
      errEl.textContent = "Đang kết nối…"; busyUi(true);
      connect();
    };
    stage.querySelector(".cn-entry").addEventListener("click", (e) => { const b = e.target.closest("[data-e]"); if (b && !b.disabled) go(b.dataset.e); });
    const enter = (e) => { if (e.key === "Enter") go(invite || e.target === codeIn ? "join" : "create"); };
    nameIn.addEventListener("keydown", enter); codeIn.addEventListener("keydown", enter);
    (name ? (invite ? $('[data-e="join"]') : $('[data-e="create"]')) : nameIn).focus();
  }

  function startBots() {
    stopNet(); saveSeat(null); setRoomParam(""); chatOff();
    stage.innerHTML = "";
    inst = mount(stage, { ...baseCtx, lobby: true });
    window.__game = inst;
  }

  // ---------- Kết nối ----------
  function stopNet() {
    clearTimeout(retryTimer); clearInterval(pingTimer); retryTimer = pingTimer = 0;
    if (ws) { const w = ws; ws = null; w.onclose = w.onmessage = w.onerror = null; try { w.close(1000); } catch {} }
  }
  function send(o) { if (ws && ws.readyState === 1) { ws.send(JSON.stringify(o)); return true; } toast("Đang nối lại máy chủ…"); return false; }

  // ---------- Trò chuyện trong phòng (đi qua máy chủ; tên người gửi do máy chủ gắn theo ghế, client không tự khai) ----------
  // Máy rộng: cột bên phải bàn chơi. Màn hẹp hơn: nút "Chat" (có số tin chưa đọc) mở bảng nổi / trượt từ dưới lên.
  let chatEl = null, chatBtn = null, chatSeen = 0, chatLast = -1, lastView = null;
  const wide = () => matchMedia("(min-width: 1360px) and (min-aspect-ratio: 1/1)").matches;
  const chatVisible = () => !!chatEl && (wide() || document.body.classList.contains("cn-chat-open"));
  function chatOn() {
    if (chatEl) return;
    chatEl = document.createElement("aside");
    chatEl.className = "cn-table cn-chat"; chatEl.setAttribute("aria-label", "Trò chuyện trong phòng");
    chatEl.innerHTML = `
      <div class="px-panel cn-chat-box">
        <div class="hd"><h2 class="px-h">Trò chuyện</h2><button class="px-btn seg cn-chat-tg" type="button" data-chat-toggle aria-pressed="false">Tắt chat</button><button class="px-btn seg" data-c="close" type="button">Đóng</button></div>
        <ol class="log" aria-live="polite" data-chat-hide></ol>
        <p class="cn-chat-offnote" data-chat-offnote>Đã tắt chat ·<button class="cn-chat-reon" type="button" data-chat-on>Bật lại</button></p>
        <form class="f" autocomplete="off"><input class="px-input" maxlength="200" placeholder="Nhắn cho cả phòng…" enterkeyhint="send" aria-label="Nội dung tin nhắn"><button class="px-btn primary" type="submit">Gửi</button></form>
      </div>`;
    stage.after(chatEl);
    document.body.classList.add("cn-chat-on");
    const input = chatEl.querySelector("input");
    // phím gõ trong ô chat không được lọt xuống phím tắt của bàn cờ (Space = gieo, 1–4 = chọn ngựa…)
    input.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Escape") setChatOpen(false); });
    input.addEventListener("keyup", (e) => e.stopPropagation());
    chatEl.querySelector('[data-c="close"]').onclick = () => setChatOpen(false);
    chatEl.querySelector("form").addEventListener("submit", (e) => {
      e.preventDefault();
      const text = input.value.trim(); if (!text || isChatOff()) return;
      if (send({ t: "chat", text })) input.value = "";
    });
    addChatBtn();
  }
  function addChatBtn() {
    const tools = stage.querySelector(".cn-tools");
    if (!tools || (chatBtn && chatBtn.isConnected)) return;
    chatBtn = document.createElement("button");
    chatBtn.type = "button"; chatBtn.className = "px-btn cn-chat-btn"; chatBtn.setAttribute("aria-label", "Trò chuyện");
    chatBtn.innerHTML = 'Chat<span class="n" hidden></span>';
    chatBtn.onclick = () => setChatOpen(!document.body.classList.contains("cn-chat-open"));
    tools.prepend(chatBtn);
  }
  function chatOff() {
    if (chatEl) chatEl.remove();
    chatEl = null; chatBtn = null; chatSeen = 0; chatLast = -1; lastView = null;
    document.body.classList.remove("cn-chat-on", "cn-chat-open");
  }
  function setChatOpen(on) {
    if (!chatEl) return;
    document.body.classList.toggle("cn-chat-open", on);
    if (on) { hideToast(); if (lastView) renderChat(lastView); const log = chatEl.querySelector(".log"); log.scrollTop = log.scrollHeight; chatEl.querySelector("input").focus({ preventScroll: true }); }
    else if (chatBtn) chatBtn.focus({ preventScroll: true });
  }
  function renderChat(v) {
    chatOn(); addChatBtn(); lastView = v;
    const off = isChatOff(), input = chatEl.querySelector("input"), sendBtn = chatEl.querySelector('[type="submit"]');
    input.disabled = off; sendBtn.disabled = off; input.placeholder = off ? "Chat đang tắt" : "Nhắn cho cả phòng…";
    const log = chatEl.querySelector(".log"), list = v.chat || [], top = list.length ? list[list.length - 1].id : 0;
    if (top !== chatLast) {
      const atEnd = log.scrollHeight - log.scrollTop - log.clientHeight < 40, isNew = chatLast >= 0 && top > chatLast;
      chatLast = top;
      log.replaceChildren(...(list.length ? list.map((c) => {
        const li = document.createElement("li"), b = document.createElement("b");
        const k = v.players.findIndex((p) => p.name === c.name), seatIx = k < 0 ? -1 : v.players[k].seat >= 0 ? v.players[k].seat : k;
        if (c.mine) li.className = "mine";
        if (seatIx >= 0) li.style.setProperty("--who", SEAT_HEX[seatIx % 4]);
        b.textContent = c.mine ? "Bạn" : c.name; li.append(b, document.createTextNode(c.text));
        return li;
      }) : [Object.assign(document.createElement("li"), { className: "empty", textContent: "Chưa có tin nhắn. Chào cả phòng một câu nhé!" })]));
      if (atEnd || list.at(-1)?.mine) log.scrollTop = log.scrollHeight;
      const last = list.at(-1);
      if (isNew && last && !last.mine && !off && inst && inst.chatSfx) inst.chatSfx(); // tin mới từ người khác
      if (isNew && last && !last.mine && !off && !chatVisible()) toast(last.name + ": " + last.text, 3500);
    }
    if (chatVisible() || off) chatSeen = top;
    const unread = list.filter((c) => c.id > chatSeen && !c.mine).length, n = chatBtn && chatBtn.querySelector(".n");
    if (n) { n.hidden = !unread; n.textContent = unread > 9 ? "9+" : String(unread); }
  }
  addEventListener("resize", () => { if (lastView) renderChat(lastView); });
  initChatOff((off) => { if (off) hideToast(); if (lastView && chatEl) renderChat(lastView); }); // "Tắt chat" chung toàn trang

  function connect() {
    stopNet();
    let opened = false;
    const w = ws = new WebSocket(url);
    w.onopen = () => {
      opened = true;
      w.send(JSON.stringify({ ...(pending || { t: "resume", code: seat.code, token: seat.token }), sid: sessionId() })); // sid: chặn người bị "Mời ra"
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
      retry = 0; joinedOnce = true; pending = joinAfter = null;
      saveSeat({ code: m.code, token: m.token });
      setRoomParam(m.code); hideToast();
      if (!inst) { stage.innerHTML = ""; inst = mount(stage, { ...baseCtx, lobby: true, online: { send, leave, disband } }); window.__game = inst; }
      return;
    }
    if (m.t === "state") { if (inst) { if (seat && Date.now() - touched > 60000) saveSeat(seat); m.v.skew = m.now - Date.now(); inst.netState(m.v); renderChat(m.v); } return; } // còn trong phòng ⇒ gia hạn ghế đã lưu
    if (m.t === "pong") return;
    if (m.t === "left" || m.t === "closed") {
      if (exiting) return exiting(); // đang sang trang khác: không vẽ lại màn vào phòng
      const wasHost = !!(inst && inst.room && inst.room.you === inst.room.host);
      saveSeat(null); setRoomParam("");
      if (m.t === "left") return showEntry();
      leaveSfx(); showEntry(wasHost ? "Đã hủy phòng." : "Chủ phòng đã hủy phòng.");
      return;
    }
    if (m.t === "replaced") { saveSeat(null, true); showEntry("Bạn đã mở phòng này ở một tab khác — tab này đã thoát."); return; }
    if (m.t === "kicked") { saveSeat(null); setRoomParam(""); showEntry(m.by === "host" ? KICKED_TEXT : "Bạn không còn trong phòng (đã quá lâu không quay lại phòng chờ)."); return; }
    if (m.t === "err") {
      const text = ERR[m.code] || "Có lỗi xảy ra (" + m.code + ").";
      if (m.code === "banned") { saveSeat(null); setRoomParam(""); showEntry(BANNED_TEXT); return; } // bị mời ra: 10 phút chưa vào lại được
      if (!inst) { // đang vào phòng / nối lại thất bại
        if (joinAfter && (m.code === "no-seat" || m.code === "no-room")) { pending = joinAfter; joinAfter = null; saveSeat(null); connect(); return; }
        const code = pending && pending.code || seat && seat.code || "";
        if (m.code === "no-seat" || m.code === "no-room") saveSeat(null);
        showEntry(text, m.code === "no-room" ? code : (CODE_RE.test(code) ? code : ""));
        return;
      }
      if (m.code === "no-seat" || m.code === "no-room") { saveSeat(null); setRoomParam(""); showEntry(m.code === "no-room" ? "Phòng không còn trên máy chủ (có thể máy chủ vừa khởi động lại hoặc phòng đã hết hạn khi mọi người mất kết nối). Bạn có thể tạo phòng mới." : ERR["no-seat"]); return; }
      if (m.code !== "phase") toast(text);
    }
  }

  // Tiếng "rời phòng" (cùng tiếng ngựa bị đá về chuồng mà bàn cờ dùng khi có người rời) — phát bằng <audio> vì bàn cờ (Web Audio) bị gỡ ngay
  function leaveSfx() {
    if (baseCtx.sdk && baseCtx.sdk.sound && baseCtx.sdk.sound.muted) return;
    try { const a = new Audio(new URL("assets/sfx/da-quan.ogg", import.meta.url).href); a.volume = 0.5; a.play().catch(() => {}); } catch {}
  }
  const humansIn = (r) => (r && r.players ? r.players.filter((p) => !p.bot && !p.left).length : 0);
  // Chủ phòng hủy phòng (phòng chờ / ván đã xong): còn người khác thì hỏi lại trước; máy chủ báo "closed" cho cả phòng.
  async function disband() {
    const r = inst && inst.room;
    if (humansIn(r) > 1 && !(await pxConfirm({ title: "Hủy phòng?", text: "Mọi người trong phòng sẽ bị đưa ra ngoài.", ok: "Hủy phòng", cancel: "Thôi", danger: true }))) return;
    send({ t: "disband" });
  }
  // Bấm link sang trang khác (← Trang chủ…) khi đang ở trong phòng: rời phòng hẳn (chủ phòng chỉ còn một mình ⇒ hủy phòng)
  // rồi mới đi, để người khác thấy mình rời ngay; chờ máy chủ trả lời tối đa 400 ms.
  async function exitTo(href) {
    let r = inst && inst.room, phase = r && r.phase;
    if (phase === "play") {
      if (!(await pxConfirm({ title: "Rời ván đang chơi?", text: "Máy chủ sẽ đi thay phần của bạn.", ok: "Rời ván", cancel: "Thôi", danger: true }))) return;
      if (!inst || !seat) { location.href = href; return; } // trong lúc hỏi đã ra khỏi phòng (bị hủy / mất ghế)
      r = inst.room; phase = r && r.phase;
    }
    const go = () => { if (!exiting) return; exiting = null; clearTimeout(t); location.href = href; };
    const alone = r && r.you === r.host && humansIn(r) <= 1 && phase !== "play";
    clearTimeout(retryTimer); retryTimer = 0;
    const live = ws && ws.readyState === 1;
    saveSeat(null);
    exiting = go;
    const t = setTimeout(go, live ? 400 : 0);
    if (live) ws.send(JSON.stringify({ t: alone ? "disband" : "leave" }));
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a || !inst || !seat || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === "_blank") return;
    const u = new URL(a.href, location.href);
    if (u.origin === location.origin && u.pathname === location.pathname) return; // link trong trang
    e.preventDefault();
    exitTo(u.href);
  }, true);

  function leave() {
    if (ws && ws.readyState === 1) ws.send('{"t":"leave"}');
    else { saveSeat(null); setRoomParam(""); showEntry(); }
  }

  initKick({ send }); // chủ phòng bấm "Mời ra" (hud.js vẽ nút) ⇒ hộp xác nhận pixel ⇒ { t:"kick", target, name }

  window.__net = {
    get ws() { return ws; }, get seat() { return seat; }, get joined() { return joinedOnce; },
    send, leave, disband, drop() { if (ws) ws.close(); }, // drop: test giả lập rớt mạng
    openChat: setChatOpen,
  };

  // ---------- Khởi động ----------
  const q = new URLSearchParams(location.search), code = String(q.get("room") || "").toUpperCase();
  if (seat && seat.code && (!code || code === seat.code)) { pending = null; stage.innerHTML = `<div class="cn-table cn-entry-wrap"><p class="cn-wait">Đang vào lại phòng ${seat.code}…</p></div>`; connect(); }
  else showEntry("", CODE_RE.test(code) ? code : "");

  return window.__net;
}
