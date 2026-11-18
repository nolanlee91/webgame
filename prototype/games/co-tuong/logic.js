// Cờ Tướng — luật chơi thuần (không DOM, không canvas). Dùng chung cho trình duyệt và máy chủ online
// (games-server/co-tuong/room.js nạp NGUYÊN file này để kiểm tra từng nước — không chép lại luật).
//
// Bàn 9 cột × 10 hàng, ô k = r*9 + c; hàng 0 ở phía quân Đen (trên), hàng 9 phía quân Đỏ (dưới). Đỏ đi trước.
// Quân: chữ HOA = Đỏ (bên 1), chữ thường = Đen (bên 2); "." = trống.
//   K Tướng · A Sĩ · B Tượng · N Mã · R Xe · C Pháo · P Tốt
// Kết thúc ván:
//   • Chiếu bí, hoặc hết nước đi hợp lệ (bị vây) → bên phải đi THUA (luật Cờ Tướng: bí nước cũng là thua).
//   • Thế cờ lặp lại lần thứ 3: nếu trong vòng lặp chỉ một bên chiếu liên tục ("chiếu mãi") → bên đó thua; còn lại → hòa.
//   • 120 nước (60 lượt mỗi bên) không ăn quân → hòa. Cả hai bên không còn quân tấn công (Xe, Mã, Pháo, Tốt) → hòa.
//   • Xin thua, hoặc hai bên đồng ý hòa.
// Không cho hai Tướng đối mặt trên cùng cột mà không có quân nào chắn ("lộ mặt tướng").

export const W = 9, H = 10;
export const START = "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR";
export const RED = 1, BLACK = 2;
export const other = (p) => (p === RED ? BLACK : RED);
export const sideOf = (pc) => (pc === "." || !pc ? 0 : pc === pc.toUpperCase() ? RED : BLACK);
export const typeOf = (pc) => pc.toUpperCase();
export const NAMES = { K: "Tướng", A: "Sĩ", B: "Tượng", N: "Mã", R: "Xe", C: "Pháo", P: "Tốt" };
export const QUIET_LIMIT = 120;

const rc = (k) => [Math.floor(k / W), k % W];
const ok = (r, c) => r >= 0 && r < H && c >= 0 && c < W;
const inPalace = (side, r, c) => c >= 3 && c <= 5 && (side === RED ? r >= 7 : r <= 2);
const ownHalf = (side, r) => (side === RED ? r >= 5 : r <= 4);

export function parse(fen = START) {
  const b = [];
  for (const row of fen.split("/")) for (const ch of row) {
    if (/\d/.test(ch)) for (let i = 0; i < +ch; i++) b.push(".");
    else b.push(ch);
  }
  if (b.length !== W * H) throw new Error("FEN sai");
  return b;
}
export function toFen(b) {
  let out = "";
  for (let r = 0; r < H; r++) {
    let e = 0;
    for (let c = 0; c < W; c++) {
      const p = b[r * W + c];
      if (p === ".") e++; else { if (e) out += e; e = 0; out += p; }
    }
    if (e) out += e;
    if (r < H - 1) out += "/";
  }
  return out;
}

const ORTHO = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const KNIGHT = [[-2, -1, -1, 0], [-2, 1, -1, 0], [2, -1, 1, 0], [2, 1, 1, 0], [-1, -2, 0, -1], [1, -2, 0, -1], [-1, 2, 0, 1], [1, 2, 0, 1]]; // dr, dc, chân mã (lr, lc)

/** Nước đi "giả hợp lệ" (đúng cách đi của quân, chưa xét tự để Tướng bị chiếu) của quân ở ô k. */
export function pseudoFrom(b, k) {
  const pc = b[k], side = sideOf(pc); if (!side) return [];
  const [r, c] = rc(k), out = [];
  const add = (rr, cc) => { if (!ok(rr, cc)) return; const t = b[rr * W + cc]; if (sideOf(t) !== side) out.push(rr * W + cc); };
  switch (typeOf(pc)) {
    case "K": for (const [dr, dc] of ORTHO) if (inPalace(side, r + dr, c + dc)) add(r + dr, c + dc); break;
    case "A": for (const [dr, dc] of DIAG) if (inPalace(side, r + dr, c + dc)) add(r + dr, c + dc); break;
    case "B": for (const [dr, dc] of DIAG) {
      const rr = r + 2 * dr, cc = c + 2 * dc;
      if (ok(rr, cc) && ownHalf(side, rr) && b[(r + dr) * W + c + dc] === ".") add(rr, cc); // không qua sông, không bị cản mắt tượng
    } break;
    case "N": for (const [dr, dc, lr, lc] of KNIGHT) if (ok(r + dr, c + dc) && b[(r + lr) * W + c + lc] === ".") add(r + dr, c + dc); break; // cản chân mã
    case "R": for (const [dr, dc] of ORTHO) for (let rr = r + dr, cc = c + dc; ok(rr, cc); rr += dr, cc += dc) {
      const t = b[rr * W + cc]; if (t === ".") { out.push(rr * W + cc); continue; }
      if (sideOf(t) !== side) out.push(rr * W + cc); break;
    } break;
    case "C": for (const [dr, dc] of ORTHO) {
      let rr = r + dr, cc = c + dc;
      for (; ok(rr, cc) && b[rr * W + cc] === "."; rr += dr, cc += dc) out.push(rr * W + cc);
      for (rr += dr, cc += dc; ok(rr, cc); rr += dr, cc += dc) { // nhảy qua đúng 1 ngòi rồi mới ăn
        const t = b[rr * W + cc]; if (t === ".") continue;
        if (sideOf(t) !== side) out.push(rr * W + cc); break;
      }
    } break;
    case "P": {
      const f = side === RED ? -1 : 1;
      add(r + f, c);
      if (!ownHalf(side, r)) { add(r, c - 1); add(r, c + 1); } // qua sông mới được đi ngang; Tốt không đi lùi
    } break;
  }
  return out;
}

export const findKing = (b, side) => b.indexOf(side === RED ? "K" : "k");

/** Ô k có bị bên `by` tấn công không (gồm cả luật hai Tướng đối mặt). */
export function attacked(b, k, by) {
  const [r, c] = rc(k), up = (p) => (by === RED ? p.toUpperCase() : p.toLowerCase());
  const R = up("r"), C = up("c"), N = up("n"), P = up("p"), K = up("k");
  for (const [dr, dc] of ORTHO) {
    let rr = r + dr, cc = c + dc, screens = 0;
    for (; ok(rr, cc); rr += dr, cc += dc) {
      const t = b[rr * W + cc]; if (t === ".") continue;
      if (screens === 0) { if (t === R || (t === K && dc === 0)) return true; screens = 1; }
      else { if (t === C) return true; break; }
    }
  }
  for (const [dr, dc, lr, lc] of KNIGHT) { // mã ở (r-dr, c-dc) đi (dr,dc) tới k; chân mã tính từ chỗ con mã
    const nr = r - dr, nc = c - dc;
    if (ok(nr, nc) && b[nr * W + nc] === N && b[(nr + lr) * W + nc + lc] === ".") return true;
  }
  const back = by === RED ? 1 : -1; // tốt đỏ tấn công lên trên (hàng nhỏ hơn)
  if (ok(r + back, c) && b[(r + back) * W + c] === P) return true;
  for (const dc of [-1, 1]) if (ok(r, c + dc) && b[r * W + c + dc] === P && !ownHalf(by, r)) return true;
  return false;
}

export const inCheck = (b, side) => { const k = findKing(b, side); return k < 0 || attacked(b, k, other(side)); };

function applyRaw(b, f, t) { const n = b.slice(); n[t] = n[f]; n[f] = "."; return n; }

/** Các ô quân ở k đi tới được, đã loại nước làm Tướng mình bị chiếu / lộ mặt tướng. */
export function legalFrom(b, k) {
  const side = sideOf(b[k]); if (!side) return [];
  return pseudoFrom(b, k).filter((t) => !inCheck(applyRaw(b, k, t), side));
}
export function legalMoves(b, side) {
  const out = [];
  for (let k = 0; k < W * H; k++) if (sideOf(b[k]) === side) for (const t of legalFrom(b, k)) out.push([k, t]);
  return out;
}
const hasLegal = (b, side) => { for (let k = 0; k < W * H; k++) if (sideOf(b[k]) === side && legalFrom(b, k).length) return true; return false; };
const attackers = (b, side) => b.some((p) => sideOf(p) === side && "RNCP".includes(typeOf(p)));

// ---------------- Trạng thái ván (object JSON thuần) ----------------
export function newMatch(opts = {}) {
  const mode = opts.mode === "ai" ? "ai" : "pvp";
  const aiLevel = opts.aiLevel === "normal" ? "normal" : "easy";
  const m = { mode, aiLevel, aiSide: BLACK, score: { 1: 0, 2: 0, draw: 0 }, round: 0 };
  return newRound(m);
}
export function newRound(m) {
  const board = parse(START);
  return { mode: m.mode, aiLevel: m.aiLevel, aiSide: m.aiSide, score: m.score, round: m.round + 1,
    board, turn: RED, moves: [], keys: [key(board, RED)], quiet: 0, check: false, winner: 0, reason: "" };
}
export const nextRound = (s) => newRound(s);
export const key = (b, turn) => b.join("") + turn;

function finish(n, winner, reason) {
  n.winner = winner; n.reason = reason;
  n.score = { ...n.score }; if (winner === 3) n.score.draw++; else n.score[winner]++;
  return n;
}

export function canMove(s, f, t) {
  return !s.winner && Number.isInteger(f) && Number.isInteger(t) && f >= 0 && f < 90 && t >= 0 && t < 90
    && sideOf(s.board[f]) === s.turn && legalFrom(s.board, f).includes(t);
}

/** Đi quân f → t cho bên đang tới lượt. Trả trạng thái mới (không sửa trạng thái cũ) hoặc null nếu nước sai luật. */
export function play(s, f, t) {
  if (!canMove(s, f, t)) return null;
  const me = s.turn, op = other(me), cap = s.board[t];
  const board = applyRaw(s.board, f, t);
  const check = inCheck(board, op);
  const n = { ...s, board, turn: op, check, moves: [...s.moves, [f, t, cap, check ? 1 : 0]], quiet: cap === "." ? s.quiet + 1 : 0 };
  const k = key(board, op);
  n.keys = cap === "." ? [...s.keys, k] : [k]; // ăn quân thì thế cũ không lặp lại được nữa
  if (!hasLegal(board, op)) return finish(n, me, check ? "checkmate" : "stalemate");
  const reps = n.keys.filter((x) => x === k).length;
  if (reps >= 3) {
    // vòng lặp = từ lần xuất hiện đầu tiên của thế này tới giờ; xem bên nào chiếu ở MỌI nước của mình trong vòng
    const first = n.keys.indexOf(k), from = n.moves.length - (n.keys.length - 1 - first);
    const allCheck = (side) => { // nước thứ i của ván do Đỏ đi nếu i chẵn (Đỏ luôn đi trước)
      const mv = n.moves.slice(from).filter((m, j) => ((from + j) % 2 === 0 ? RED : BLACK) === side);
      return mv.length > 0 && mv.every((m) => m[3]);
    };
    const rc1 = allCheck(RED), rc2 = allCheck(BLACK);
    if (rc1 && !rc2) return finish(n, BLACK, "perpetual");
    if (rc2 && !rc1) return finish(n, RED, "perpetual");
    return finish(n, 3, "repetition");
  }
  if (n.quiet >= QUIET_LIMIT) return finish(n, 3, "quiet");
  if (!attackers(board, RED) && !attackers(board, BLACK)) return finish(n, 3, "material");
  return n;
}
export function resign(s, side) {
  if (s.winner || (side !== RED && side !== BLACK)) return null;
  return finish({ ...s }, other(side), "resign");
}
export function agreeDraw(s) {
  if (s.winner) return null;
  return finish({ ...s }, 3, "agreed");
}

/** Dựng lại ván từ danh sách nước [[f,t],…] (kiểm tra luật từng nước). Trả null nếu có nước sai. */
export function replay(base, moves) {
  let s = newRound({ ...base, round: base.round - 1 });
  for (const m of moves) {
    const n = play({ ...s, score: base.score }, m[0], m[1]);
    if (!n) return null;
    s = { ...n, score: base.score };
  }
  return s;
}

/** Đi lại `count` nước cuối (chỉ khi ván chưa kết thúc). */
export function undo(s, count = 1) {
  if (s.winner || !s.moves.length) return null;
  count = Math.min(count, s.moves.length);
  return replay(s, s.moves.slice(0, s.moves.length - count));
}

export const isAiTurn = (s) => s.mode === "ai" && !s.winner && s.turn === s.aiSide;

export const REASON = {
  checkmate: "chiếu bí", stalemate: "hết nước đi", perpetual: "chiếu mãi (lặp thế 3 lần)", repetition: "lặp lại thế cờ 3 lần",
  quiet: "60 lượt mỗi bên không ăn quân", material: "hai bên đều hết quân tấn công", resign: "xin thua", agreed: "hai bên đồng ý hòa", timeout: "hết giờ",
};

/** Tên nước đi kiểu dễ đọc: "Pháo 8→5" (cột tính từ phải sang trái của mỗi bên, 1–9). */
export function moveName(b, f, t) {
  const pc = b[f], side = sideOf(pc), [r1, c1] = rc(f), [r2, c2] = rc(t);
  const col = (c) => (side === RED ? 9 - c : c + 1);
  const fwd = side === RED ? r1 - r2 : r2 - r1;
  const ty = typeOf(pc), slide = "RCPK".includes(ty);
  const act = fwd === 0 ? "-" : fwd > 0 ? "↑" : "↓";
  const dst = fwd === 0 || !slide ? col(c2) : Math.abs(fwd);
  return NAMES[ty] + " " + col(c1) + act + dst;
}
