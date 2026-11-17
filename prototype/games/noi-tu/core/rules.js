// Luật Nối Từ — thuần: không DOM, không Date.now, không fetch. Trọng tài (local hoặc server) gọi các hàm này.
import { normalizeWord, syllables, firstSyl, lastSyl, NORM_VERSION } from './normalize.js';

export const RULES_VERSION = 1;
export const DEFAULT_CONFIG = Object.freeze({ turnMs: 15000, noDeadEnd: false });

/** Ghim của ván: chỉ chơi/đối chiếu khi khớp cả 3. */
export const pinOf = (dict) => ({ dictHash: dict.contentHash, normVersion: NORM_VERSION, rulesVersion: RULES_VERSION });
export const samePin = (a, b) => !!a && !!b && a.dictHash === b.dictHash && a.normVersion === b.normVersion && a.rulesVersion === b.rulesVersion;

/**
 * Kiểm tra một từ, chưa đổi state. "Không còn đường nối tiếp" tính SAU KHI đã trừ chính từ vừa đánh
 * và mọi từ đã dùng.
 */
export function validate(state, seat, rawWord, dict) {
  const r = state?.round;
  if (!r || r.over) return { ok: false, reason: 'not-playing' };
  if (r.turn !== seat) return { ok: false, reason: 'not-your-turn' };
  const key = normalizeWord(rawWord);
  if (syllables(key).length !== 2) return { ok: false, reason: 'need-two-syllables', key };
  const prev = r.chain[r.chain.length - 1];
  if (prev && firstSyl(key) !== lastSyl(prev.word)) return { ok: false, reason: 'wrong-link', key, need: lastSyl(prev.word) };
  if (!dict.has(key)) return { ok: false, reason: 'not-in-dict', key };
  if (r.used.includes(key)) return { ok: false, reason: 'already-used', key };
  const after = new Set(r.used); after.add(key);
  const options = dict.countNext(lastSyl(key), after);
  if (options === 0 && state.config.noDeadEnd) return { ok: false, reason: 'dead-end', key };
  return { ok: true, key, deadEnd: options === 0, options };
}

const clone = (x) => JSON.parse(JSON.stringify(x));

/**
 * state = fold(events). Mọi thay đổi state đều là sự kiện trong log (kể cả đổi người↔bot, cấu hình, rematch),
 * nên snapshot + các sự kiện sau nó dựng lại được toàn bộ ván. `rejected` KHÔNG phải sự kiện: nó là kết quả lệnh,
 * chỉ trả cho người gửi và không tốn số seq ⇒ đối thủ không bao giờ thấy hụt số.
 */
export function reduce(state, ev) {
  if (ev.type === 'matchCreated') {
    if (state) throw new Error('matchCreated twice');
    if (ev.seq !== 1) throw new Error('bad seq');
    return {
      seq: 1, matchId: ev.matchId, pin: ev.pin, config: { ...DEFAULT_CONFIG, ...ev.config },
      seats: clone(ev.seats), score: [0, 0], roundNo: 0, round: null, lastRound: null, rematch: [false, false],
    };
  }
  if (!state) throw new Error('no match');
  if (ev.seq !== state.seq + 1) throw new Error(`seq ${ev.seq} after ${state.seq}`);
  const s = clone(state);
  s.seq = ev.seq;
  const r = s.round;
  switch (ev.type) {
    case 'roundStarted':
      if (r && !r.over) throw new Error('round in progress');
      s.roundNo += 1;
      s.round = { id: ev.roundId, no: s.roundNo, first: ev.first, turn: ev.first, chain: [], used: [],
        startedAt: ev.at, deadlineAt: ev.deadlineAt, over: false, winner: null, reason: null };
      s.rematch = [false, false];
      break;
    case 'played':
      if (!r || r.id !== ev.roundId || r.over || r.turn !== ev.seat) throw new Error('bad played');
      r.chain.push({ seat: ev.seat, word: ev.word, at: ev.at });
      r.used.push(ev.word);
      r.turn = 1 - ev.seat;
      r.deadlineAt = ev.deadlineAt;
      break;
    case 'roundEnded':
      if (!r || r.id !== ev.roundId || r.over) throw new Error('bad roundEnded');
      r.over = true; r.winner = ev.winner; r.reason = ev.reason; r.endedAt = ev.at; r.deadlineAt = null;
      s.score[ev.winner] += 1;
      s.lastRound = { id: r.id, winner: ev.winner };
      break;
    case 'clockReset': // chỉ offline: mở lại tab giữa ván thì lượt hiện tại được tính giờ lại
      if (!r || r.id !== ev.roundId || r.over) throw new Error('bad clockReset');
      r.deadlineAt = ev.deadlineAt;
      break;
    case 'seatChanged':
      s.seats[ev.seat] = { kind: ev.kind, id: ev.id, name: ev.name };
      break;
    case 'rematchRequested':
      s.rematch[ev.seat] = true;
      break;
    case 'configChanged':
      if (r && !r.over) throw new Error('config change mid-round');
      s.config = { ...s.config, ...ev.config };
      break;
    default:
      throw new Error('unknown event ' + ev.type);
  }
  return s;
}

export const replay = (events) => events.reduce(reduce, null);
export const nextFirst = (state) => (state.lastRound ? 1 - state.lastRound.winner : 0); // người thua đi trước
