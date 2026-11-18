// Cờ Vua — luật chơi thuần (không DOM, không canvas). Dùng chung cho client (chơi chung máy / với máy)
// và máy chủ online (games-server/co-vua/room.js nạp file này để kiểm tra từng nước đi).
//
// Bàn: mảng 64 ô, chỉ số = r*8 + c; r = 0 là hàng 8 (phía Đen, trên cùng), c = 0 là cột a.
// Quân: chữ HOA = Trắng, chữ thường = Đen — K Vua, Q Hậu, R Xe, B Tượng, N Mã, P Tốt. Ô trống = "".
// Nước đi: { from, to, promo } — promo ∈ "qrbn" (chỉ khi Tốt lên hàng cuối, bắt buộc có).
// Luật đủ: nhập thành 2 phía, bắt tốt qua đường, phong cấp, chiếu / chiếu bí, hòa do hết nước (stalemate),
// không đủ quân chiếu bí, luật 50 nước, lặp lại thế cờ 3 lần (tự xử hòa), xin thua, hòa thỏa thuận.
//
// Trận gồm nhiều ván; s.white = người (0/1) cầm Trắng ván này — ván sau đổi màu. Tỉ số theo người: score[0], score[1].

export const PROMOS = ["q", "r", "b", "n"];
export const FILES = "abcdefgh";
const KN = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KG = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const START = "rnbqkbnr" + "pppppppp" + "........".repeat(4) + "PPPPPPPP" + "RNBQKBNR";

export const colorOf = (p) => (!p ? "" : p === p.toUpperCase() ? "w" : "b");
export const typeOf = (p) => (p ? p.toLowerCase() : "");
export const other = (c) => (c === "w" ? "b" : "w");
export const sqName = (i) => FILES[i & 7] + (8 - (i >> 3));
const inB = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
export const isSq = (i) => Number.isInteger(i) && i >= 0 && i < 64;

/** Trận mới. mode: "pvp" (2 người chung máy / online) | "ai". aiLevel: "easy" | "normal". */
export function newMatch(opts = {}) {
  const mode = opts.mode === "ai" ? "ai" : "pvp";
  const aiLevel = opts.aiLevel === "normal" ? "normal" : "easy";
  const m = { mode, aiLevel, score: [0, 0], draws: 0, round: 0, white: 1 };
  return newRound(m);
}

/** Ván mới trong cùng trận (giữ tỉ số), đổi màu so với ván trước. Ván 1: người 0 cầm Trắng. */
export function newRound(m) {
  const s = { mode: m.mode, aiLevel: m.aiLevel, score: m.score.slice(), draws: m.draws, round: m.round + 1, white: m.round ? 1 - m.white : 0,
    board: START.split("").map((ch) => (ch === "." ? "" : ch)), turn: "w", castle: "KQkq", ep: -1, half: 0, full: 1,
    moves: [], keys: [], result: null };
  s.keys = [posKey(s)];
  return s;
}
export const nextRound = (s) => newRound(s);

/** Người (0/1) đang cầm màu c trong ván này; và ngược lại. */
export const seatOf = (s, c) => (c === "w" ? s.white : 1 - s.white);
export const colorOfSeat = (s, seat) => (seat === s.white ? "w" : "b");
/** Ở chế độ chơi với máy: người 0 là người chơi, người 1 là máy. */
export const aiColor = (s) => colorOfSeat(s, 1);
export const isAiTurn = (s) => s.mode === "ai" && !s.result && s.turn === aiColor(s);

export function kingSq(b, c) { const k = c === "w" ? "K" : "k"; return b.indexOf(k); }

/** Ô `sq` có bị bên `by` tấn công không. */
export function attacked(b, sq, by) {
  const r = sq >> 3, c = sq & 7, up = by === "w";
  const P = up ? "P" : "p", N = up ? "N" : "n", K = up ? "K" : "k", Bq = up ? "BQ" : "bq", Rq = up ? "RQ" : "rq";
  const pr = up ? r + 1 : r - 1; // Tốt trắng tấn công lên trên ⇒ nằm ở hàng dưới ô bị đánh
  for (const dc of [-1, 1]) if (inB(pr, c + dc) && b[pr * 8 + c + dc] === P) return true;
  for (const [dr, dc] of KN) if (inB(r + dr, c + dc) && b[(r + dr) * 8 + c + dc] === N) return true;
  for (const [dr, dc] of KG) if (inB(r + dr, c + dc) && b[(r + dr) * 8 + c + dc] === K) return true;
  for (const [dirs, set] of [[DIAG, Bq], [ORTH, Rq]]) {
    for (const [dr, dc] of dirs) {
      let rr = r + dr, cc = c + dc;
      while (inB(rr, cc)) {
        const p = b[rr * 8 + cc];
        if (p) { if (set.includes(p)) return true; break; }
        rr += dr; cc += dc;
      }
    }
  }
  return false;
}

export const inCheck = (s, c = s.turn) => attacked(s.board, kingSq(s.board, c), other(c));

// Nước giả hợp lệ (chưa kiểm tra Vua có bị chiếu sau khi đi không).
function pseudo(s, only = -1) {
  const b = s.board, me = s.turn, out = [];
  const add = (from, to, promoRank) => {
    if (promoRank) for (const pr of PROMOS) out.push({ from, to, promo: pr });
    else out.push({ from, to });
  };
  for (let i = only < 0 ? 0 : only; i < (only < 0 ? 64 : only + 1); i++) {
    const p = b[i]; if (!p || colorOf(p) !== me) continue;
    const r = i >> 3, c = i & 7, t = typeOf(p);
    if (t === "p") {
      const d = me === "w" ? -1 : 1, start = me === "w" ? 6 : 1, last = me === "w" ? 0 : 7;
      const r1 = r + d;
      if (inB(r1, c) && !b[r1 * 8 + c]) {
        add(i, r1 * 8 + c, r1 === last);
        if (r === start && !b[(r + 2 * d) * 8 + c]) add(i, (r + 2 * d) * 8 + c, false);
      }
      for (const dc of [-1, 1]) {
        if (!inB(r1, c + dc)) continue;
        const to = r1 * 8 + c + dc, q = b[to];
        if ((q && colorOf(q) !== me) || to === s.ep) add(i, to, r1 === last);
      }
    } else if (t === "n" || t === "k") {
      for (const [dr, dc] of t === "n" ? KN : KG) {
        if (!inB(r + dr, c + dc)) continue;
        const to = (r + dr) * 8 + c + dc, q = b[to];
        if (!q || colorOf(q) !== me) add(i, to, false);
      }
      if (t === "k") { // nhập thành: Vua và Xe chưa đi, ô giữa trống, Vua không đang bị chiếu / không đi qua / không đến ô bị đánh
        const row = me === "w" ? 7 : 0, opp = other(me);
        if (i === row * 8 + 4) {
          const R = me === "w" ? "R" : "r";
          const kSide = me === "w" ? "K" : "k", qSide = me === "w" ? "Q" : "q";
          if (s.castle.includes(kSide) && b[row * 8 + 7] === R && !b[row * 8 + 5] && !b[row * 8 + 6] &&
              !attacked(b, i, opp) && !attacked(b, i + 1, opp) && !attacked(b, i + 2, opp)) add(i, i + 2, false);
          if (s.castle.includes(qSide) && b[row * 8] === R && !b[row * 8 + 1] && !b[row * 8 + 2] && !b[row * 8 + 3] &&
              !attacked(b, i, opp) && !attacked(b, i - 1, opp) && !attacked(b, i - 2, opp)) add(i, i - 2, false);
        }
      }
    } else {
      const dirs = t === "b" ? DIAG : t === "r" ? ORTH : DIAG.concat(ORTH);
      for (const [dr, dc] of dirs) {
        let rr = r + dr, cc = c + dc;
        while (inB(rr, cc)) {
          const to = rr * 8 + cc, q = b[to];
          if (q) { if (colorOf(q) !== me) add(i, to, false); break; }
          add(i, to, false);
          rr += dr; cc += dc;
        }
      }
    }
  }
  return out;
}

// Áp nước lên bàn (không kiểm tra, không tính kết quả) → trạng thái mới tối thiểu.
export function applyRaw(s, mv) {
  const b = s.board.slice(), p = b[mv.from], t = typeOf(p), me = s.turn;
  const cap = b[mv.to] || (t === "p" && mv.to === s.ep ? (me === "w" ? "p" : "P") : "");
  b[mv.to] = mv.promo ? (me === "w" ? mv.promo.toUpperCase() : mv.promo) : p;
  b[mv.from] = "";
  if (t === "p" && mv.to === s.ep) b[mv.to + (me === "w" ? 8 : -8)] = ""; // bắt tốt qua đường
  if (t === "k" && Math.abs(mv.to - mv.from) === 2) { // nhập thành: dời Xe
    const row = mv.from & ~7, kSide = mv.to > mv.from;
    b[row + (kSide ? 5 : 3)] = b[row + (kSide ? 7 : 0)];
    b[row + (kSide ? 7 : 0)] = "";
  }
  let castle = s.castle;
  const drop = (ch) => { castle = castle.replace(ch, ""); };
  if (p === "K") { drop("K"); drop("Q"); }
  if (p === "k") { drop("k"); drop("q"); }
  for (const sq of [mv.from, mv.to]) { if (sq === 63) drop("K"); if (sq === 56) drop("Q"); if (sq === 7) drop("k"); if (sq === 0) drop("q"); }
  const ep = t === "p" && Math.abs(mv.to - mv.from) === 16 ? (mv.from + mv.to) / 2 : -1;
  return { ...s, board: b, turn: other(me), castle, ep, half: t === "p" || cap ? 0 : s.half + 1, full: s.full + (me === "b" ? 1 : 0), cap };
}

/** Danh sách nước đi hợp lệ của bên đang đi (hoặc chỉ của quân ở ô `from`). */
export function legalMoves(s, from = -1) {
  if (s.result) return [];
  const me = s.turn;
  return pseudo(s, from).filter((mv) => { const n = applyRaw(s, mv); return !attacked(n.board, kingSq(n.board, me), other(me)); });
}

/** Khóa thế cờ để đếm lặp 3 lần: bàn + lượt + quyền nhập thành + ô qua đường (chỉ khi thật sự bắt được). */
export function posKey(s) {
  let ep = "-";
  if (s.ep >= 0) {
    const P = s.turn === "w" ? "P" : "p", r = s.ep >> 3, c = s.ep & 7, pr = s.turn === "w" ? r + 1 : r - 1;
    for (const fc of [c - 1, c + 1]) {
      if (fc < 0 || fc > 7 || s.board[pr * 8 + fc] !== P) continue;
      const n = applyRaw(s, { from: pr * 8 + fc, to: s.ep });
      if (!attacked(n.board, kingSq(n.board, s.turn), other(s.turn))) { ep = String(s.ep); break; }
    }
  }
  return s.board.map((p) => p || ".").join("") + s.turn + (s.castle || "-") + ep;
}

/** Không đủ quân để chiếu bí: K-K, K+Tượng-K, K+Mã-K, K+Tượng-K+Tượng (tượng cùng màu ô). */
export function insufficient(b) {
  const rest = [];
  for (let i = 0; i < 64; i++) { const p = b[i]; if (p && typeOf(p) !== "k") rest.push([typeOf(p), i]); }
  if (!rest.length) return true;
  if (rest.some(([t]) => t === "p" || t === "r" || t === "q")) return false;
  if (rest.length === 1) return true;
  if (rest.every(([t]) => t === "b")) { const sc = (i) => ((i >> 3) + (i & 7)) & 1; return rest.every(([, i]) => sc(i) === sc(rest[0][1])); }
  return false;
}

// Ký hiệu nước đi kiểu quốc tế (SAN), quân viết bằng chữ tiếng Anh như chuẩn: Nf3, exd5, O-O, e8=Q+, Qh5#.
function san(s, mv, legal, n, mate) {
  const p = s.board[mv.from], t = typeOf(p);
  let out;
  if (t === "k" && Math.abs(mv.to - mv.from) === 2) out = mv.to > mv.from ? "O-O" : "O-O-O";
  else {
    const capture = !!s.board[mv.to] || (t === "p" && mv.to === s.ep);
    if (t === "p") out = (capture ? FILES[mv.from & 7] + "x" : "") + sqName(mv.to) + (mv.promo ? "=" + mv.promo.toUpperCase() : "");
    else {
      const same = legal.filter((o) => o.to === mv.to && o.from !== mv.from && s.board[o.from] === p);
      let dis = "";
      if (same.length) {
        const sameFile = same.some((o) => (o.from & 7) === (mv.from & 7)), sameRank = same.some((o) => o.from >> 3 === mv.from >> 3);
        dis = !sameFile ? FILES[mv.from & 7] : !sameRank ? String(8 - (mv.from >> 3)) : sqName(mv.from);
      }
      out = t.toUpperCase() + dis + (capture ? "x" : "") + sqName(mv.to);
    }
  }
  return out + (mate ? "#" : attacked(n.board, kingSq(n.board, n.turn), other(n.turn)) ? "+" : "");
}

function finish(s, winner, reason) {
  const score = s.score.slice(); let draws = s.draws;
  if (winner) score[seatOf(s, winner)]++; else draws++;
  return { ...s, score, draws, result: { winner, reason } };
}

/** Đi một nước. Trả trạng thái mới hoặc null nếu nước không hợp lệ (máy chủ dùng hàm này để chặn gian lận). */
export function play(s, mv) {
  if (s.result || !mv || !isSq(mv.from) || !isSq(mv.to)) return null;
  const promo = mv.promo == null ? undefined : mv.promo;
  if (promo !== undefined && !PROMOS.includes(promo)) return null;
  const legal = legalMoves(s);
  const hit = legal.find((o) => o.from === mv.from && o.to === mv.to && o.promo === promo);
  if (!hit) return null;
  let n = applyRaw(s, hit);
  const replies = legalMoves({ ...n, result: null });
  const check = attacked(n.board, kingSq(n.board, n.turn), other(n.turn));
  const rec = { from: hit.from, to: hit.to, san: san(s, hit, legal, n, check && !replies.length) };
  if (hit.promo) rec.promo = hit.promo;
  if (n.cap) rec.cap = n.cap;
  const key = posKey(n);
  n = { ...n, moves: s.moves.concat([rec]), keys: s.keys.concat([key]) };
  delete n.cap;
  if (!replies.length) return check ? finish(n, s.turn, "mate") : finish(n, null, "stalemate");
  if (insufficient(n.board)) return finish(n, null, "material");
  if (n.half >= 100) return finish(n, null, "fifty");
  if (n.keys.filter((k) => k === key).length >= 3) return finish(n, null, "repeat");
  return n;
}

/** Bên `color` xin thua. */
export function resign(s, color) { return s.result ? null : finish(s, other(color), "resign"); }
/** Hòa do hai bên đồng ý. */
export function agreeDraw(s) { return s.result ? null : finish(s, null, "agreed"); }
/** Hết giờ / bỏ cuộc do rời trận: bên `color` thua. */
export function forfeit(s, color, reason = "forfeit") { return s.result ? null : finish(s, other(color), reason); }

/** Dựng lại ván từ danh sách nước đi (tải ván dở, hoàn tác, đồng bộ). base: trạng thái ĐẦU ván (giữ tỉ số/màu). */
export function replay(base, moves) {
  let s = { ...base, board: START.split("").map((ch) => (ch === "." ? "" : ch)), turn: "w", castle: "KQkq", ep: -1, half: 0, full: 1, moves: [], result: null };
  s.keys = [posKey(s)];
  for (const m of moves) {
    const n = play(s, { from: m.from, to: m.to, promo: m.promo });
    if (!n) return null;
    s = { ...n, score: base.score.slice(), draws: base.draws };
  }
  return s;
}

/** Hoàn tác `count` nước (chơi chung máy / với máy). Không hoàn tác ván đã xong. */
export function undo(s, count = 1) {
  if (s.result || !s.moves.length) return null;
  return replay(s, s.moves.slice(0, Math.max(0, s.moves.length - count)));
}

/** Đếm nút (perft) — chỉ dùng để kiểm thử bộ sinh nước. */
export function perft(s, depth) {
  if (!depth) return 1;
  let n = 0;
  for (const mv of legalMoves(s)) n += depth === 1 ? 1 : perft({ ...applyRaw(s, mv), result: null }, depth - 1);
  return n;
}

/** Nạp thế cờ từ FEN (chỉ dùng cho kiểm thử). */
export function fromFen(fen, base = newMatch()) {
  const [pos, turn, castle, ep, half, full] = fen.split(" ");
  const board = [];
  for (const ch of pos.replace(/\//g, "")) { if (/\d/.test(ch)) for (let k = 0; k < +ch; k++) board.push(""); else board.push(ch); }
  const epSq = ep && ep !== "-" ? (8 - +ep[1]) * 8 + FILES.indexOf(ep[0]) : -1;
  const s = { ...base, board, turn, castle: castle === "-" ? "" : castle, ep: epSq, half: +half || 0, full: +full || 1, moves: [], result: null };
  s.keys = [posKey(s)];
  return s;
}

/** Quân đã bị bắt của mỗi bên (để hiện cạnh tên người chơi). */
export function captured(s) {
  const out = { w: [], b: [] };
  for (const m of s.moves) if (m.cap) out[colorOf(m.cap) === "w" ? "b" : "w"].push(m.cap); // out.w = quân Trắng đã ăn được
  return out;
}
