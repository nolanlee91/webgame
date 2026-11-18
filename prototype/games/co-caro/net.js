// Cờ Caro — kết nối online (WebSocket /ws/co-caro). Máy chủ (games-server/co-caro/) giữ ván và xác thực từng nước;
// file này chỉ mở kết nối, gửi ý định ("tạo phòng", "vào phòng", "đặt quân r,c"), nhận trạng thái và tự nối lại khi rớt mạng
// (giữ ghế bằng token trong sessionStorage — mỗi tab là một người chơi).
const SEAT_KEY = "wgp.caro.seat";
export const CODE_RE = /^[A-HJKMNP-Z2-9]{5}$/;

const load = () => { try { return JSON.parse(sessionStorage.getItem(SEAT_KEY)); } catch { return null; } };

/**
 * on: { joined(code), state(v, skew), left(), gone(text), error(code, inRoom), offline(text), reconnecting() }
 */
export function createNet(on, { url } = {}) {
  url = url || (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws/co-caro";
  let ws = null, seat = load(), inRoom = false, retry = 0, retryTimer = 0, pingTimer = 0, pending = null;

  const saveSeat = (s) => { seat = s; try { if (s) sessionStorage.setItem(SEAT_KEY, JSON.stringify(s)); else sessionStorage.removeItem(SEAT_KEY); } catch {} };

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
      w.send(JSON.stringify(pending || { t: "resume", code: seat.code, token: seat.token }));
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
    if (m.t === "joined") { retry = 0; inRoom = true; pending = null; saveSeat({ code: m.code, token: m.token }); on.joined(m.code); return; }
    if (m.t === "state") { if (inRoom) on.state(m.v, m.now - Date.now()); return; }
    if (m.t === "pong") return;
    if (m.t === "left") { end(); on.left(); return; }
    if (m.t === "replaced") { end(); on.gone("Bạn đã mở phòng này ở một tab khác — tab này đã thoát."); return; }
    if (m.t === "kicked") { end(); on.gone("Bạn không còn trong phòng (đã quá lâu không quay lại phòng chờ)."); return; }
    if (m.t === "err") {
      if (m.code === "no-seat" || (m.code === "no-room" && !pending)) { end(); on.gone("Chỗ ngồi cũ của bạn không còn trong phòng."); return; }
      if (!inRoom) { stop(); }
      on.error(m.code, inRoom);
    }
  }
  function end() { inRoom = false; saveSeat(null); stop(); }

  return {
    get seat() { return seat; }, get inRoom() { return inRoom; }, get ws() { return ws; },
    create(name, size, rule) { connect({ t: "create", name, size, rule }); },
    join(code, name) { connect({ t: "join", code, name }); },
    resume() { if (seat && seat.code) { connect(null); return true; } return false; },
    send(o) { if (ws && ws.readyState === 1) { ws.send(JSON.stringify(o)); return true; } return false; },
    leave() { if (ws && ws.readyState === 1 && inRoom) ws.send('{"t":"leave"}'); else { end(); on.left(); } },
    drop() { if (ws) ws.close(); }, // test: giả lập rớt mạng
    close() { inRoom = false; stop(); },
  };
}
