// OnlineSession — Nối Từ 1v1 qua máy chủ (games-server/noi-tu/host.js). Trọng tài chạy trên server;
// trang này chỉ gửi ý định (intent) qua MatchClient, y hệt bản chơi với máy — chỉ khác transport.
// Tầng phòng (tạo / vào bằng mã / quay lại) do file này lo; mọi thông điệp còn lại chuyển cho MatchClient.
import { MatchClient } from './client.js';
import { realScheduler } from './scheduler.js';
import { pinOf } from '../core/rules.js';

const FATAL = new Set(['name', 'name-taken', 'full', 'no-room', 'no-seat', 'busy', 'loading', 'already', 'banned']);

/**
 * opts: { dict, url, action: {t:'create',name}|{t:'enter',code,name}|{t:'resume',code,token},
 *         sid?: mã phiên trình duyệt (gửi kèm create / enter / resume — máy chủ chặn người bị chủ phòng "Mời ra"),
 *         onRoom(room), onStart(session), onError(code), onEnd(reason: 'replaced'|'kicked'), onReset(room), onChat(msg), onChatLog(items), onChatErr(code) }
 * onReset(room): chủ phòng vừa mời người kia ra ⇒ ván cũ bỏ, phòng về chờ người mới (MatchClient cũ đã dừng, KHÔNG gửi 'leave').
 * room = { code, token, seat, names:[a,b], started }
 */
export function openOnline(opts) {
  const sch = realScheduler();
  let ws = null, closed = false, everOpen = false, room = null, client = null, h = null, tries = 0, retryT = null, ownDispose = null;

  const transport = {
    attach(handlers) { h = handlers; },
    send(m) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(m)); },
    close() {},
  };

  function connect() {
    ws = new WebSocket(opts.url);
    ws.onopen = () => {
      everOpen = true; tries = 0;
      const first = room ? { t: 'resume', code: room.code, token: room.token } : opts.action;
      ws.send(JSON.stringify(opts.sid ? { ...first, sid: opts.sid } : first));
    };
    ws.onmessage = (e) => {
      let m; try { m = JSON.parse(e.data); } catch { return; }
      switch (m.t) {
        case 'room':
          room = { code: m.code, token: m.token, seat: m.seat, names: m.names, started: m.started };
          opts.onRoom?.(room);
          if (m.started) start(true);
          return;
        case 'lobby':
          if (!room) return;
          room.names = m.names; room.started = m.started;
          if (!m.started && client) { // chủ phòng đã mời người kia ra: dừng MatchClient cũ (không rời phòng), chờ người mới
            const own = ownDispose; client = null; h = null; ownDispose = null; own?.();
            opts.onReset?.(room);
            return;
          }
          opts.onRoom?.(room);
          if (m.started) start(false);
          return;
        case 'chat': opts.onChat?.(m); return;        // {seat, name, text, ts} — tên/ghế do máy chủ gắn
        case 'chatlog': opts.onChatLog?.(m.items || []); return;
        case 'err':
          if (m.code?.startsWith('chat-')) { opts.onChatErr?.(m.code); return; }
          if (FATAL.has(m.code) && (!client || m.code === 'no-room' || m.code === 'no-seat')) { finish(); opts.onError?.(m.code); }
          return;
        case 'replaced': finish(); opts.onEnd?.('replaced'); return;
        case 'kicked': if (m.by === 'host') { finish(); opts.onEnd?.('kicked'); return; } h?.onMessage(m); return; // chủ phòng mời ra
        case 'left': return;
        default: h?.onMessage(m);  // welcome / snapshot / event / result / pong / presence / kicked …
      }
    };
    ws.onclose = () => {
      h?.onClose();
      if (closed) return;
      if (!everOpen) { finish(); opts.onError?.('offline'); return; }
      // rớt mạng: thử lại với nhịp giãn dần, gửi 'resume' bằng token của ghế
      retryT = setTimeout(connect, Math.min(8000, 500 * 2 ** tries++));
    };
  }

  function start(reconnected) {
    if (client) { if (reconnected) h?.onOpen(); return; }
    client = new MatchClient({ transport, token: room.token, pin: pinOf(opts.dict), scheduler: sch, retryMs: 1500 });
    const own = ownDispose = client.dispose.bind(client);
    client.dispose = () => { leave(); own(); };
    client.room = room;
    opts.onStart?.(client);
    h.onOpen();               // gửi 'join' cho trọng tài (token + ghim từ điển/luật)
  }

  function finish() { closed = true; clearTimeout(retryT); try { ws?.close(); } catch { /* bỏ qua */ } }
  function leave() { if (closed) return; transport.send({ t: 'leave' }); finish(); }

  connect();
  return {
    leave: () => { if (client) client.dispose(); else leave(); }, get room() { return room; },
    send(m) { if (!ws || ws.readyState !== 1) return false; ws.send(JSON.stringify(m)); return true; }, // lệnh phòng (vd. "kick")
    chat(text) { if (!ws || ws.readyState !== 1) return false; ws.send(JSON.stringify({ t: 'chat', text })); return true; },
  };
}
