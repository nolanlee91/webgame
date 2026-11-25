// Cờ Tỷ Phú — kết nối online (WebSocket /ws/co-ty-phu) + khung trò chuyện trong phòng.
// Máy chủ (games-server/co-ty-phu/) giữ ván, gieo xúc xắc và kiểm tra lượt; file này chỉ:
//   • gửi ý định của người chơi lên máy chủ, nhận trạng thái về (onState),
//   • tự nối lại khi rớt mạng (giữ ghế bằng token trong sessionStorage — mỗi tab là một người chơi),
//   • vẽ khung chat (tên người gửi do máy chủ gắn theo ghế; nội dung chèn bằng text node, không dùng innerHTML).
// Cùng khuôn với prototype/games/co-ca-ngua/online.js, bản độc lập cho game này.

export const NAME_KEY = "wgp.co-ty-phu.name";
const SEAT_KEY = "wgp.co-ty-phu.seat";
export const CODE_RE = /^[A-HJKMNP-Z2-9]{5}$/;
export const ERR = {
  "no-room": "Không tìm thấy phòng — kiểm tra lại mã phòng.",
  full: "Phòng đã đủ 4 người.",
  started: "Phòng này đang chơi, không vào thêm được.",
  "no-seat": "Chỗ ngồi cũ của bạn không còn trong phòng.",
  "not-host": "Chỉ chủ phòng làm được việc này.",
  "need-2": "Cần ít nhất 2 người mới bắt đầu được.",
  "not-turn": "Chưa tới lượt bạn.",
  taken: "Linh vật này đã có người chọn.",
  illegal: "Không làm được lúc này.",
  slow: "Thao tác nhanh quá, chậm lại chút nhé.",
  busy: "Máy chủ đang bận (hoặc bạn mở quá nhiều phòng). Thử lại sau.",
  loading: "Máy chủ đang khởi động, thử lại sau giây lát.",
  server: "Máy chủ gặp lỗi, thử lại.",
  bad: "Yêu cầu không hợp lệ.",
  long: "Tin nhắn dài quá (tối đa 200 ký tự).",
  "chat-slow": "Bạn nhắn nhanh quá — đợi một chút rồi gửi tiếp.",
};
const OFFLINE = "Chưa kết nối được máy chủ chơi online (mạng có vấn đề hoặc máy chủ đang khởi động lại). Bạn vẫn có thể chơi với máy.";
const load = (k) => { try { return JSON.parse(sessionStorage.getItem(k)); } catch { return null; } };

// ---------- Thông báo nổi ----------
let toastEl = null, toastTimer = 0;
export function toast(text, ms = 2600) {
  if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
  toastEl.textContent = text; toastEl.hidden = false;
  clearTimeout(toastTimer); if (ms) toastTimer = setTimeout(() => (toastEl.hidden = true), ms);
}
export const hideToast = () => { if (toastEl) toastEl.hidden = true; clearTimeout(toastTimer); };

/** h: { onJoined(code), onState(view), onExit(message, code), onClosed() } — onExit: rời phòng / mất phòng, hiện lại màn vào phòng;
 *  onClosed: chủ phòng vừa hủy phòng — trả về câu thông báo (gọi trước onExit, lúc còn trạng thái phòng). */
export function createNet(h, { wsUrl } = {}) {
  const url = wsUrl || (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws/co-ty-phu";
  let ws = null, seat = load(SEAT_KEY), inRoom = false, retry = 0, retryTimer = 0, pingTimer = 0, pending = null;
  let exiting = null; // đang rời phòng để sang trang khác (bấm "← Trang chủ"): chờ máy chủ trả lời rồi mới đi
  const setRoomParam = (code) => { const u = new URL(location.href); if (code) u.searchParams.set("room", code); else u.searchParams.delete("room"); history.replaceState(null, "", u.href); };
  const saveSeat = (s) => { seat = s; if (s) sessionStorage.setItem(SEAT_KEY, JSON.stringify(s)); else sessionStorage.removeItem(SEAT_KEY); };

  function stop() {
    clearTimeout(retryTimer); clearInterval(pingTimer); retryTimer = pingTimer = 0;
    if (ws) { const w = ws; ws = null; w.onclose = w.onmessage = w.onerror = null; try { w.close(1000); } catch {} }
  }
  function send(o) { if (ws && ws.readyState === 1) { ws.send(JSON.stringify(o)); return true; } toast("Đang nối lại máy chủ…"); return false; }
  function exit(msg = "", code = "") { stop(); inRoom = false; hideToast(); h.onExit(msg, code); }

  function connect() {
    stop();
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
      if (inRoom && seat) { // đang ở trong phòng → nối lại, giữ ghế
        const ms = Math.min(8000, 500 * 2 ** retry++);
        toast("Mất kết nối — đang nối lại…", 0);
        retryTimer = setTimeout(() => { pending = null; connect(); }, ms);
        return;
      }
      exit(opened ? "Mất kết nối với máy chủ, thử lại nhé." : OFFLINE, (pending && pending.code) || (seat && seat.code) || "");
    };
  }

  function onMsg(m) {
    if (m.t === "joined") {
      retry = 0; pending = null; inRoom = true;
      saveSeat({ code: m.code, token: m.token }); setRoomParam(m.code); hideToast();
      h.onJoined(m.code); return;
    }
    if (m.t === "state") { m.v.skew = m.now - Date.now(); h.onState(m.v); return; }
    if (m.t === "pong") return;
    if (exiting && (m.t === "left" || m.t === "closed")) return exiting();
    if (m.t === "left") { saveSeat(null); setRoomParam(""); return exit(); }
    if (m.t === "closed") { const msg = (h.onClosed && h.onClosed()) || "Chủ phòng đã hủy phòng."; saveSeat(null); setRoomParam(""); return exit(msg); }
    if (m.t === "replaced") { saveSeat(null); return exit("Bạn đã mở phòng này ở một tab khác — tab này đã thoát."); }
    if (m.t === "kicked") { saveSeat(null); setRoomParam(""); return exit("Bạn không còn trong phòng (quá lâu không quay lại phòng chờ)."); }
    if (m.t === "err") {
      const text = ERR[m.code] || "Có lỗi xảy ra (" + m.code + ").";
      if (!inRoom) {
        const code = (pending && pending.code) || (seat && seat.code) || "";
        if (m.code === "no-seat" || m.code === "no-room") saveSeat(null);
        return exit(text, m.code === "no-room" ? code : CODE_RE.test(code) ? code : "");
      }
      if (m.code === "no-seat" || m.code === "no-room") { saveSeat(null); setRoomParam(""); return exit(m.code === "no-room" ? "Phòng không còn trên máy chủ (máy chủ vừa khởi động lại hoặc phòng hết hạn). Bạn có thể tạo phòng mới." : ERR["no-seat"]); }
      if (m.code !== "phase") toast(text);
    }
  }

  return {
    get seat() { return seat; }, get ws() { return ws; },
    create(name, isPublic) { pending = { t: "create", name, public: isPublic }; connect(); },
    join(code, name) { pending = { t: "join", code, name }; connect(); },
    resume() { pending = null; connect(); },
    send,
    leave() { if (ws && ws.readyState === 1) ws.send('{"t":"leave"}'); else { saveSeat(null); setRoomParam(""); exit(); } },
    disband() { send({ t: "disband" }); },
    // rời phòng hẳn rồi sang trang href (disband: chủ phòng chỉ còn một mình ⇒ hủy luôn); chờ "left"/"closed" tối đa 400 ms
    exitTo(href, disband = false) {
      clearTimeout(retryTimer); retryTimer = 0;
      const live = ws && ws.readyState === 1;
      saveSeat(null); inRoom = false;
      const go = () => { if (!exiting) return; exiting = null; clearTimeout(t); location.href = href; };
      exiting = go;
      const t = setTimeout(go, live ? 400 : 0);
      if (live) ws.send(JSON.stringify({ t: disband ? "disband" : "leave" }));
    },
    forget() { saveSeat(null); setRoomParam(""); },
    drop() { if (ws) ws.close(); }, // test: giả lập rớt mạng
  };
}

import { isChatOff, initChatOff } from "../_shared/chat-off.js?v=co1";

// ---------- Trò chuyện trong phòng ----------
// Máy rộng: khung nằm ở cột phải giữa 2 thẻ người chơi. Màn hẹp: nút "Chat" trên thanh đầu trang mở bảng trượt từ dưới lên.
export function createChat({ box, button, send, colorOf, onNew }) {
  let last = -1, seen = 0, view = null;
  const log = box.querySelector(".log"), input = box.querySelector("input"), badge = button.querySelector(".n");
  // đang thấy khung chat: máy rộng = khung nằm sẵn cạnh bàn; màn hẹp = khung ẩn (display:none) cho tới khi mở bảng trượt
  const visible = () => !box.hidden && getComputedStyle(box).display !== "none";
  input.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Escape") open(false); });
  input.addEventListener("keyup", (e) => e.stopPropagation());
  box.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim(); if (!text || isChatOff()) return;
    if (send({ t: "chat", text })) input.value = "";
  });
  box.querySelector(".close").onclick = () => open(false);
  button.onclick = () => open(!document.body.classList.contains("chat-open"));
  function open(on) {
    document.body.classList.toggle("chat-open", on);
    if (on) { hideToast(); if (view) render(view); log.scrollTop = log.scrollHeight; input.focus({ preventScroll: true }); }
    else button.focus({ preventScroll: true });
  }
  function render(v) {
    view = v;
    const off = isChatOff(), sendBtn = box.querySelector('[type="submit"]');
    input.disabled = off; sendBtn.disabled = off; input.placeholder = off ? "Chat đang tắt" : "Nhắn cho cả phòng…";
    const list = v.chat || [], top = list.length ? list[list.length - 1].id : 0;
    if (top !== last) {
      const atEnd = log.scrollHeight - log.scrollTop - log.clientHeight < 40, isNew = last >= 0 && top > last;
      last = top;
      log.replaceChildren(...(list.length ? list.map((c) => {
        const li = document.createElement("li"), b = document.createElement("b");
        if (c.mine) li.className = "mine";
        const col = colorOf(c.name); if (col) li.style.setProperty("--who", col);
        b.textContent = c.mine ? "Bạn" : c.name; li.append(b, document.createTextNode(c.text));
        return li;
      }) : [Object.assign(document.createElement("li"), { className: "empty", textContent: "Chưa có tin nhắn. Chào cả phòng một câu nhé!" })]));
      if (atEnd || list.at(-1)?.mine) log.scrollTop = log.scrollHeight;
      const lt = list.at(-1);
      if (isNew && lt && !lt.mine && !off && onNew) onNew(); // tin mới từ người khác: kêu cả khi đang mở khung chat
      if (isNew && lt && !lt.mine && !off && !visible()) toast(lt.name + ": " + lt.text, 3500);
    }
    if (visible() || off) seen = top;
    const unread = list.filter((c) => c.id > seen && !c.mine).length;
    badge.hidden = !unread; badge.textContent = unread > 9 ? "9+" : String(unread);
  }
  addEventListener("resize", () => view && render(view));
  initChatOff((off) => { if (off) hideToast(); if (view) render(view); }); // "Tắt chat" chung toàn trang
  return {
    render, open,
    show(on) { box.hidden = !on; button.hidden = !on; document.body.classList.toggle("online", on); if (!on) { document.body.classList.remove("chat-open"); last = -1; seen = 0; view = null; } },
  };
}
