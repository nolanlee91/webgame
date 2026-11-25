// Cờ Vua — kết nối online (WebSocket /ws/co-vua). Máy chủ (games-server/co-vua/) giữ ván và xác thực từng nước;
// file này chỉ mở kết nối, gửi ý định ("tạo phòng", "vào phòng", "đi quân từ ô a sang ô b"), nhận trạng thái và tự nối lại khi rớt mạng
// (giữ ghế bằng token trong sessionStorage — mỗi tab là một người chơi; F5 vẫn đúng ghế).
// Đóng hẳn tab rồi mở lại link mời ?room=MÃ: token còn lưu trong localStorage "<SEAT_KEY>.<MÃ>" = { code, token, savedAt }
// (hết hạn sau 30 phút không ở trong phòng; xoá khi rời / phòng bị hủy / mất ghế) ⇒ gửi "resume" thay cho "join",
// máy chủ trả lại đúng ghế kể cả khi ván đang chơi. Tab cũ của cùng người (nếu còn mở) nhận "replaced" và thoát.
import { sessionId, KICKED_TEXT, BANNED_TEXT } from "../_shared/online-kit.js?v=ok1"; // mã phiên (chặn người bị "Mời ra") + câu báo

const SEAT_KEY = "wgp.covua.seat";
export const CODE_RE = /^[A-HJKMNP-Z2-9]{5}$/;

const KEEP_MS = 30 * 60 * 1000;
const keepKey = (code) => SEAT_KEY + "." + code;
const parse = (t) => { try { return JSON.parse(t); } catch { return null; } };
/** Ghế còn hạn đã lưu cho phòng `code` (localStorage, sống qua việc đóng tab); tiện dọn luôn các ghế hết hạn. */
function kept(code) {
  try {
    const now = Date.now();
    for (let k = localStorage.length - 1; k >= 0; k--) {
      const key = localStorage.key(k);
      if (!key || !key.startsWith(SEAT_KEY + ".")) continue;
      const s = parse(localStorage.getItem(key));
      if (!s || !(now - s.savedAt < KEEP_MS)) localStorage.removeItem(key);
    }
    const s = parse(localStorage.getItem(keepKey(code)));
    return s && s.code === code && typeof s.token === "string" ? { code, token: s.token } : null;
  } catch { return null; }
}
const load = () => {
  let s = null, c = "";
  try { s = parse(sessionStorage.getItem(SEAT_KEY)); } catch {}
  try { c = String(new URLSearchParams(location.search).get("room") || "").toUpperCase(); } catch {}
  return (CODE_RE.test(c) && (!s || s.code !== c) && kept(c)) || s; // mở link mời phòng khác ghế của tab này ⇒ dùng ghế đã lưu cho phòng đó
};

/**
 * on: { joined(code), state(v, skew), left(), closed(), gone(text), error(code, inRoom, req), offline(text), reconnecting() }
 * closed(): chủ phòng đã hủy phòng (máy chủ gửi "closed" cho mọi người trong phòng, kể cả chủ phòng).
 */
export function createNet(on, { url } = {}) {
  url = url || (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws/co-vua";
  let ws = null, seat = load(), inRoom = false, retry = 0, retryTimer = 0, pingTimer = 0, pending = null, waiter = null;

  let touched = 0, joinAfter = null; // joinAfter: vào bằng mã mà còn ghế đã lưu ⇒ thử resume trước, ghế hết thì join như thường
  // keepLocal: bị tab khác của mình thay chỗ ⇒ chỉ xoá ghế của tab này, giữ bản localStorage cho tab mới
  const saveSeat = (s, keepLocal) => {
    const old = seat; seat = s; touched = Date.now();
    try { if (s) sessionStorage.setItem(SEAT_KEY, JSON.stringify(s)); else sessionStorage.removeItem(SEAT_KEY); } catch {}
    try {
      if (s) localStorage.setItem(keepKey(s.code), JSON.stringify({ code: s.code, token: s.token, savedAt: touched }));
      else if (old && old.code && !keepLocal && parse(localStorage.getItem(keepKey(old.code)))?.token === old.token) localStorage.removeItem(keepKey(old.code));
    } catch {}
  };

  function stop() {
    clearTimeout(retryTimer); clearInterval(pingTimer); retryTimer = pingTimer = 0;
    if (ws) { const w = ws; ws = null; w.onclose = w.onmessage = w.onerror = null; try { w.close(1000); } catch {} }
  }
  function connect(first) {
    stop();
    pending = first || null;
    let opened = false;
    const w = ws = new WebSocket(url);
    w.onopen = () => {
      opened = true;
      w.send(JSON.stringify({ ...(pending || { t: "resume", code: seat.code, token: seat.token }), sid: sessionId() }));
      pingTimer = setInterval(() => w.readyState === 1 && w.send('{"t":"ping"}'), 20000);
    };
    w.onmessage = (e) => { let m; try { m = JSON.parse(e.data); } catch { return; } onMsg(m); };
    w.onclose = () => {
      if (ws !== w) return;
      ws = null; clearInterval(pingTimer);
      if (inRoom && seat) { // đang ở trong phòng → nối lại, giữ ghế
        const ms = Math.min(8000, 500 * 2 ** retry++);
        on.reconnecting();
        retryTimer = setTimeout(() => connect(null), ms);
        return;
      }
      on.offline(opened ? "Mất kết nối với máy chủ, thử lại nhé." : "Chưa kết nối được máy chủ chơi online (máy chủ chưa bật hoặc mạng có vấn đề). Bạn vẫn có thể chơi với máy.");
    };
  }
  function onMsg(m) {
    if (m.t === "joined") { retry = 0; inRoom = true; pending = joinAfter = null; saveSeat({ code: m.code, token: m.token }); on.joined(m.code); return; }
    if (m.t === "state") { if (inRoom) { if (seat && Date.now() - touched > 60000) saveSeat(seat); on.state(m.v, m.now - Date.now()); } return; } // còn trong phòng ⇒ gia hạn ghế đã lưu
    if (m.t === "pong") return;
    if (m.t === "left") { end(); on.left(); return; }
    if (m.t === "closed") { end(); on.closed(); return; }
    if (m.t === "replaced") { end(true); on.gone("Bạn đã mở phòng này ở một tab khác — tab này đã thoát."); return; }
    if (m.t === "kicked") { end(); on.gone(m.by === "host" ? KICKED_TEXT : "Bạn không còn trong phòng (đã quá lâu không quay lại phòng chờ)."); return; }
    if (m.t === "err") {
      if (m.code === "banned") { end(); on.gone(BANNED_TEXT); return; } // bị chủ phòng mời ra: 10 phút chưa vào lại được (kể cả resume)
      if (joinAfter && !inRoom && (m.code === "no-seat" || m.code === "no-room")) { const j = joinAfter; joinAfter = null; saveSeat(null); connect(j); return; }
      if (m.code === "no-seat" || (m.code === "no-room" && !pending)) { end(); on.gone("Chỗ ngồi cũ của bạn không còn trong phòng."); return; }
      if (!inRoom) { stop(); }
      if (waiter && (m.req === "leave" || m.req === "disband")) settle();
      on.error(m.code, inRoom, m.req);
    }
  }
  function end(keepLocal) { inRoom = false; joinAfter = null; saveSeat(null, keepLocal); stop(); settle(); }
  function settle() { const w = waiter; waiter = null; if (w) w(); }
  // Rời phòng trước khi chuyển trang: gửi "leave" (hoặc "disband"), chờ "left"/"closed" tối đa ms rồi vẫn xoá ghế đã lưu.
  function exit(kind, ms = 400) {
    return new Promise((res) => {
      if (!(ws && ws.readyState === 1 && inRoom)) { end(); res(); return; }
      settle();
      const t = setTimeout(() => { waiter = null; end(); res(); }, ms);
      waiter = () => { clearTimeout(t); res(); };
      ws.send(JSON.stringify({ t: kind === "disband" ? "disband" : "leave" }));
    });
  }

  return {
    get seat() { return seat; }, get inRoom() { return inRoom; }, get ws() { return ws; },
    create(name, isPublic) { connect({ t: "create", name, public: isPublic }); },
    join(code, name) {
      const k = kept(code), j = { t: "join", code, name };
      if (k) { seat = k; joinAfter = j; connect(null); } else connect(j);
    },
    resume() { if (seat && seat.code) { connect(null); return true; } return false; },
    send(o) { if (ws && ws.readyState === 1) { ws.send(JSON.stringify(o)); return true; } return false; },
    disband() { if (ws && ws.readyState === 1 && inRoom) { ws.send('{"t":"disband"}'); return true; } return false; },
    exit,
    leave() { if (ws && ws.readyState === 1 && inRoom) ws.send('{"t":"leave"}'); else { end(); on.left(); } },
    drop() { if (ws) ws.close(); }, // test: giả lập rớt mạng
    close() { inRoom = false; stop(); },
  };
}
