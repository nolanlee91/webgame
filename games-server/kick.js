// "Mời ra" — chủ phòng mời một người khác ra khỏi phòng (dùng chung cho mọi host.js của game online).
// Máy chủ kiểm: đúng chủ phòng (không tin client), không mời chính mình, không mời bot (đã có "kick-bot"),
// chỉ khi KHÔNG có ván đang chạy (phòng chờ / hết ván) — mời ra giữa ván sẽ đổi kết quả ván (người đang thắng bị loại).
// Người bị mời ra không vào lại phòng đó được trong 10 phút. Chặn theo PHIÊN, không theo IP (không chặn nhầm cả nhà
// dùng chung mạng): token ghế (resume) + mã phiên `sid` do trình duyệt tự sinh (localStorage "wgp.sid", gửi kèm
// create / join / resume). Client cũ không gửi sid ⇒ chỉ chặn được token (vẫn đủ để không "resume" lại ghế cũ).
"use strict";

const KICK_BAN_MS = 10 * 60 * 1000;
const KICK_PHASES = new Set(["lobby", "over", "end"]);
const SID_RE = /^[0-9a-f]{32}$/;

/** Mã phiên hợp lệ (32 hex) hoặc "" — không bao giờ lưu chuỗi tuỳ ý client gửi. */
const cleanSid = (s) => (typeof s === "string" && SID_RE.test(s) ? s : "");

/** Nhớ sid của ghế (token) để khi bị mời ra thì chặn cả phiên, không chỉ token. */
function rememberSid(entry, token, sid) {
  if (!token || !sid) return;
  (entry.sids || (entry.sids = new Map())).set(token, sid);
}

/** Có bị chặn vào phòng này không (một trong các khoá còn hạn). Dọn luôn các khoá đã hết hạn. */
function isBanned(entry, now, { token = "", sid = "" } = {}) {
  const b = entry.bans; if (!b || !b.size) return false;
  for (const [k, until] of b) if (until <= now) b.delete(k);
  return (!!token && b.has("t:" + token)) || (!!sid && b.has("s:" + sid));
}

function addBan(entry, now, ms, { token = "", sid = "" }) {
  const b = entry.bans || (entry.bans = new Map());
  if (token) b.set("t:" + token, now + ms);
  if (sid) b.set("s:" + sid, now + ms);
  if (b.size > 200) for (const k of [...b.keys()].slice(0, b.size - 200)) b.delete(k); // phòng thủ: không phình vô hạn
}

/**
 * Mời người ở ghế `target` ra (khuôn host.js chung: entry = { room, conns:Set<conn{token,entry}> }, room.players[i].token).
 * name (tuỳ chọn): tên client thấy ở ghế đó lúc bấm — khác tên hiện tại ⇒ "target" (chống mời nhầm khi ghế dồn).
 * Trả về { err } hoặc { ok, victims } — victims là các kết nối của người bị mời ra (đã gỡ khỏi phòng; host.js báo
 * {t:"kicked", by:"host"} cho họ, giữ kết nối mở để họ tạo / vào phòng khác).
 */
function kickFromRoom(entry, seat, target, now, { banMs = KICK_BAN_MS, phases = KICK_PHASES, name } = {}) {
  const room = entry.room, host = room.hostSeat ?? room.host;
  if (seat !== host) return { err: "not-host" };
  if (!Number.isInteger(target) || target === seat) return { err: "target" };
  const p = room.players[target];
  if (!p || p.bot || p.left || typeof p.token !== "string" || !p.token) return { err: "target" };
  // client gửi kèm tên người định mời ra: ghế đã đổi người (ai đó vừa rời, số ghế dồn lên) ⇒ từ chối, không mời nhầm
  if (typeof name === "string" && name !== p.name) return { err: "target" };
  if (!phases.has(room.phase)) return { err: "phase" };
  const token = p.token, sid = entry.sids?.get(token) || "";
  addBan(entry, now, banMs, { token, sid });
  const victims = [...entry.conns].filter((c) => c.token === token);
  for (const c of victims) { entry.conns.delete(c); c.token = null; c.entry = null; c.last = null; }
  room.leave(target);
  // Ma Sói / Nội Gián lúc hết ván: leave() chỉ đánh dấu mất kết nối (ghế còn tới "Chơi ván mới") ⇒ gỡ token để
  // không ai "resume" vào ghế đó nữa; "Chơi ván mới" tự bỏ người không còn kết nối.
  const still = room.players.find((q) => q.token === token);
  if (still) { still.token = null; still.connected = false; (room._changed || room.changed)?.call(room); }
  entry.sids?.delete(token);
  return { ok: true, victims };
}

module.exports = { KICK_BAN_MS, KICK_PHASES, cleanSid, rememberSid, isBanned, addBan, kickFromRoom };
