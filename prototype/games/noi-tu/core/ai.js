// Bot — thuần, rng truyền vào ⇒ lặp lại được; server dùng lại y nguyên khi bot thay ghế.
import { lastSyl } from './normalize.js';
import { validate } from './rules.js';

export function pickWord(state, dict, level, rng) {
  const r = state.round;
  if (!r || r.over) return null;
  const seat = r.turn;
  const prev = r.chain[r.chain.length - 1];
  const pool = prev ? dict.startsWith(lastSyl(prev.word)) : dict.all();
  const used = new Set(r.used);
  const cands = pool.filter((k) => !used.has(k) && validate(state, seat, k, dict).ok);
  if (!cands.length) return null;
  if (!prev) {
    // từ mở đầu: chọn từ thông dụng còn nhiều đường nối để ván không kết thúc ngay
    const open = cands.filter((k) => dict.isCommon(k) && dict.countNext(lastSyl(k), new Set([k])) >= 2);
    return rng.pick(open.length ? open : cands);
  }
  if (level !== 'hard') {
    const common = cands.filter((k) => dict.isCommon(k));
    return rng.pick(common.length ? common : cands);
  }
  // Khó: ít đường nối nhất cho đối thủ; bằng nhau thì chọn từ mà đường đáp của đối thủ hay dẫn vào ngõ cụt (nhìn trước 1 bước)
  let best = null, bestScore = Infinity;
  for (const k of cands) {
    const after = new Set(used); after.add(k);
    const opp = dict.startsWith(lastSyl(k)).filter((w) => !after.has(w));
    let safeReplies = 0;
    for (const w of opp) { const a2 = new Set(after); a2.add(w); if (dict.countNext(lastSyl(w), a2) > 0) safeReplies++; }
    const score = opp.length * 1000 + safeReplies + rng();
    if (score < bestScore) { bestScore = score; best = k; }
  }
  return best;
}
