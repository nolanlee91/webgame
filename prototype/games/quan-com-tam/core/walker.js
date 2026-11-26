// Cô chủ đi bộ thật trong cảnh (chủ dự án đã duyệt): bưng, châm trà, lấy phiếu, tính tiền, dọn bàn, rửa chén đều tốn thời gian đi + làm.
// Trong lúc đi, bếp vẫn chạy (đồng hồ ca chung) — đây là căng thẳng chính: bưng dĩa ra bàn xa thì miếng sườn vùng nóng có thể cháy.
// Hàng đợi việc tối đa 4. Hết việc thì tự đi về chỗ đứng sau bếp. Việc ở bếp / ô bày chỉ làm được khi cô chủ đứng ở bếp (ownerFree).
// Thuần: toạ độ từ core/placements.js (manifest hoặc dự phòng), thời gian = quãng đường / tốc độ (SERVICE.ownerSpeed px/giây).
import { SERVICE } from "../data/economy.js?v=c9";
import { scenePoints, ownerRoute, pathLen, alongDist, dist } from "./placements.js?v=c9";

export const freshOwner = (P) => ({ pos: [...P.owner], path: null, walked: 0, task: null, queue: [], away: null });
export const pointsOf = (s) => scenePoints(s.stage);
/** Cô chủ đang đứng ở bếp, không đi đâu, không có việc chờ. */
export function ownerFree(s) {
  const o = s.shift?.owner;
  if (!o || o.away) return false;
  if (o.task && o.task.kind !== "home") return false;
  if (o.queue.length) return false;
  return dist(o.pos, pointsOf(s).owner) < 6;
}
/** Lý do cô chủ không ở bếp (cho thông báo). */
export function ownerBusyWhy(s) {
  const o = s.shift.owner;
  if (o.away) return { why: "away", kind: o.away.kind };
  const t = o.task && o.task.kind !== "home" ? o.task : o.queue[0];
  if (t) return { why: "task", kind: t.kind, tid: t.tid };
  return { why: "walking" };
}

/** Thêm việc vào hàng đợi. Việc trùng (cùng loại + cùng bàn / dĩa) bị bỏ qua. */
export function enqueue(s, task, ev = []) {
  const o = s.shift.owner;
  const same = (x) => x && x.kind === task.kind && (x.tid ?? null) === (task.tid ?? null) && (x.pid ?? null) === (task.pid ?? null);
  if (same(o.task) || o.queue.some(same)) return { err: "queued" };
  if (o.queue.length + (o.task && o.task.kind !== "home" ? 1 : 0) >= SERVICE.queueMax) return { err: "queue-full" };
  o.queue.push({ ...task, phase: "queued" });
  if (o.task?.kind === "home") o.task = null; // đang đi về thì quay sang việc mới ngay
  ev.push({ type: "taskQueued", kind: task.kind, tid: task.tid ?? null });
  return { ok: true };
}

function startWalk(o, P, target, pickup = false) {
  // việc cần lấy đồ ở quầy (bưng dĩa, bưng chén cơm): đang ở ngoài thì ghé quầy trước
  o.path = pickup && dist(o.pos, P.owner) > 6 ? [...ownerRoute(P, o.pos, P.owner), ...ownerRoute(P, P.owner, target).slice(1)] : ownerRoute(P, o.pos, target);
  o.walked = 0;
}
/**
 * Một nhịp di chuyển + làm việc. H = bảng việc { [kind]: { target(s,task) → [x,y] | null, ms(s,task) → ms làm tại chỗ,
 * start?(s,task,ev) → {err} (kiểm trước khi đi), done(s,task,ev), hold?: true (việc giữ cô chủ tại chỗ tới khi có thao tác khác, ví dụ tính tiền) } }.
 */
export function stepOwner(s, dt, ev, H) {
  const sh = s.shift, o = sh.owner, P = pointsOf(s);
  if (o.away) {
    if (sh.t >= o.away.until) { o.away = null; o.pos = [...P.owner]; o.path = null; ev.push({ type: "ownerBack" }); }
    else return;
  }
  let budget = dt;
  for (let guard = 0; guard < 6 && budget > 0; guard++) {
    if (!o.task || o.task.kind === "home") {
      if (o.queue.length) {
        const task = o.queue.shift();
        const h = H[task.kind];
        const chk = h?.start ? h.start(s, task, ev) : { ok: true };
        if (!h || chk?.err) { h?.drop?.(s, task, ev); ev.push({ type: "taskDropped", kind: task.kind, tid: task.tid ?? null, why: chk?.err || "bad" }); continue; }
        const target = h.target(s, task);
        if (!target) { h.drop?.(s, task, ev); ev.push({ type: "taskDropped", kind: task.kind, tid: task.tid ?? null, why: "no-target" }); continue; }
        o.task = { ...task, phase: "walk", target };
        startWalk(o, P, target, !!task.pickup);
        ev.push({ type: "taskStart", kind: task.kind, tid: task.tid ?? null });
      } else if (dist(o.pos, P.owner) >= 6) {
        if (!o.task) { o.task = { kind: "home", phase: "walk", target: [...P.owner] }; startWalk(o, P, P.owner); }
      } else { o.task = null; o.path = null; o.pos = [...P.owner]; return; }
    }
    const tk = o.task;
    if (tk.phase === "walk") {
      const len = pathLen(o.path);
      const need = ((len - o.walked) / SERVICE.ownerSpeed) * 1000;
      if (need > budget) { o.walked += (budget / 1000) * SERVICE.ownerSpeed; o.pos = alongDist(o.path, o.walked); return; }
      budget -= Math.max(0, need);
      o.pos = [...tk.target]; o.path = null;
      if (tk.kind === "home") { o.task = null; continue; }
      tk.phase = "work"; tk.left = Math.max(0, H[tk.kind].ms(s, tk));
      ev.push({ type: "taskWork", kind: tk.kind, tid: tk.tid ?? null });
    }
    if (tk.phase === "work") {
      if (tk.left > budget) { tk.left -= budget; return; }
      budget -= tk.left; tk.left = 0;
      const h = H[tk.kind];
      h.done(s, tk, ev);
      if (h.hold && o.task === tk) { tk.phase = "hold"; return; }
      if (o.task === tk) o.task = null;
    }
    if (tk.phase === "hold") return;
  }
}
/** Thời gian đi (ms) từ chỗ hiện tại tới một điểm — cho bot / gợi ý. */
export function walkMs(s, target) { const o = s.shift.owner; return (pathLen(ownerRoute(pointsOf(s), o.pos, target)) / SERVICE.ownerSpeed) * 1000; }
/** Cô chủ rời quán (chạy ra chợ…): bếp vẫn chạy, hàng đợi giữ nguyên. */
export function sendAway(s, kind, ms, extra = {}) {
  const o = s.shift.owner;
  o.away = { kind, until: s.shift.t + ms, ...extra };
  if (o.task && o.task.kind !== "home") { const { phase, target, left, ...rest } = o.task; o.queue.unshift({ ...rest, phase: "queued" }); }
  o.task = null; o.path = null;
  if (s.shift.billing) s.shift.billing = null;
}
