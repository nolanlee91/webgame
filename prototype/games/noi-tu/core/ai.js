// Bot — thuần, rng truyền vào ⇒ lặp lại được; server dùng lại y nguyên khi bot thay ghế.
import { firstSyl, lastSyl } from './normalize.js';
import { validate } from './rules.js';

export function pickWord(state, dict, level, rng) {
  const r = state.round;
  if (!r || r.over) return null;
  const seat = r.turn;
  const prev = r.chain[r.chain.length - 1];
  const used = new Set(r.used);
  const replyCounts = new Map();
  const countAvailable = (syl) => {
    if (!replyCounts.has(syl)) replyCounts.set(syl, dict.countNext(syl, used));
    return replyCounts.get(syl);
  };
  if (!prev) {
    // dict.all() chỉ chứa khóa hai âm tiết hợp lệ. Lượt mở đầu chưa có tiếng cần nối.
    const candidates = [], common = [];
    for (const word of dict.all()) {
      if (used.has(word)) continue;
      const tail = lastSyl(word);
      const self = Number(tail === firstSyl(word));
      if (state.config.noDeadEnd && countAvailable(tail) <= self) continue;
      candidates.push(word);
      if (dict.isCommon(word) && dict.startsWith(tail).length - self >= 2) common.push(word);
    }
    if (!candidates.length) return null;
    return rng.pick(common.length ? common : candidates);
  }
  const pool = dict.startsWith(lastSyl(prev.word));
  const cands = pool.filter((k) => !used.has(k) && validate(state, seat, k, dict).ok);
  if (!cands.length) return null;
  if (level !== 'hard') {
    const common = cands.filter((k) => dict.isCommon(k));
    return rng.pick(common.length ? common : cands);
  }
  // Khó: ít đường nối nhất cho đối thủ; bằng nhau thì chọn từ mà đường đáp của đối thủ hay dẫn vào ngõ cụt (nhìn trước 1 bước)
  let best = null, bestScore = Infinity;
  for (const k of cands) {
    const playedFirst = firstSyl(k);
    const replyFirst = lastSyl(k);
    let replies = 0;
    let safeReplies = 0;
    for (const w of dict.startsWith(replyFirst)) {
      if (w === k || used.has(w)) continue;
      replies++;
      const tail = lastSyl(w);
      // Bộ đếm dùng chung trừ thêm nước đang xét và nước đáp nếu chúng nằm trong nhánh này.
      const remaining = countAvailable(tail) - Number(tail === playedFirst) - Number(tail === replyFirst);
      if (remaining > 0) safeReplies++;
    }
    const score = replies * 1000 + safeReplies + rng();
    if (score < bestScore) { bestScore = score; best = k; }
  }
  return best;
}
