// Đọc chữ người chơi gõ khi CHƯA bật bộ gõ tiếng Việt: Telex thô ("hocj taapj"), VNI thô ("ho5c ta6p5"),
// hoặc không dấu ("hoc tap"). Thuần, không DOM. Chỉ là trợ giúp nhập liệu ở phía người chơi: kết quả vẫn được
// trọng tài kiểm đầy đủ như mọi từ khác, nên không đổi luật và không mở đường gian lận.
import { normalizeWord, normalizeSyllable } from './normalize.js';

const TONE_MARK = { s: '́', f: '̀', r: '̉', x: '̃', j: '̣' };
const VNI_TONE = { 1: '́', 2: '̀', 3: '̉', 4: '̃', 5: '̣' };

/** Bỏ hết dấu: "Học Tập" → "hoc tap" (đ → d). */
export function stripMarks(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
}

const hasVowel = (s) => /[aeiouy]/.test(s);

/** Một âm tiết Telex thô → âm tiết có dấu, hoặc null nếu không có gì để đổi. */
export function telexSyllable(raw) {
  let s = raw.toLowerCase();
  if (!/^[a-z]+$/.test(s)) return null;
  let tone = '';
  // phím thanh: s f r x j không bao giờ là phụ âm cuối tiếng Việt ⇒ gặp sau nguyên âm là dấu thanh; z = bỏ dấu
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if ('sfrxjz'.includes(c) && hasVowel(out)) { tone = c === 'z' ? '' : TONE_MARK[c]; continue; }
    out += c;
  }
  let b = out;
  b = b.replace(/^dd/, 'đ');
  b = b.replace(/uow|uwow|uwo/, 'ươ').replace(/aa/, 'â').replace(/ee/, 'ê').replace(/oo/, 'ô')
    .replace(/aw/, 'ă').replace(/ow/, 'ơ').replace(/uw/, 'ư').replace(/w/, 'ư');
  if (b === s) return null;
  return normalizeSyllable(b.normalize('NFC') + tone);
}

/** Một âm tiết VNI thô (số 1–9) → âm tiết có dấu, hoặc null. */
export function vniSyllable(raw) {
  const s = raw.toLowerCase();
  if (!/^[a-z1-9]+$/.test(s) || !/[1-9]/.test(s)) return null;
  let tone = '', b = '';
  for (const c of s) {
    if (VNI_TONE[c]) tone = VNI_TONE[c];
    else if (c === '6') b = b.replace(/([aeo])(?!.*[aeo])/, (m) => ({ a: 'â', e: 'ê', o: 'ô' })[m]);
    else if (c === '7') b = /uo/.test(b) ? b.replace('uo', 'ươ') : b.replace(/([ou])(?!.*[ou])/, (m) => ({ o: 'ơ', u: 'ư' })[m]);
    else if (c === '8') b = b.replace(/a(?!.*a)/, 'ă');
    else if (c === '9') b = b.replace(/^d/, 'đ');
    else b += c;
  }
  return normalizeSyllable(b.normalize('NFC') + tone);
}

const convertWord = (typed, fn) => {
  const parts = typed.split(' ');
  let changed = false;
  const out = parts.map((p) => { const r = fn(p); if (r && r !== p) { changed = true; return r; } return p; });
  return changed ? normalizeWord(out.join(' ')) : null;
};

/**
 * Đoán từ người chơi muốn gõ. need = tiếng phải nối (hoặc '' khi mở màn).
 * Trả { word, via } — via: 'exact' | 'telex' | 'vni' | 'plain'; hoặc { word: typed, via: 'none', candidates? }.
 * Chỉ đổi khi kết quả CÓ trong từ điển (và đúng tiếng nối nếu có) — không thì gửi nguyên chữ để báo lỗi đúng.
 */
export function guessWord(raw, dict, need = '') {
  const own = String(raw ?? '').normalize('NFC').trim().replace(/\s+/g, ' ');
  // gõ tắt: đã có tiếng nối ⇒ gõ một tiếng là đủ
  const typed = need && own && !own.includes(' ') ? `${need} ${own}` : own;
  const key = normalizeWord(typed);
  const fits = (k) => !!k && dict.has(k) && (!need || k.split(' ')[0] === need);
  if (fits(key)) return { word: key, via: 'exact' };
  const ascii = /^[a-z0-9\s]+$/i.test(own);
  if (!ascii) return { word: typed, via: 'none' };       // đã có dấu ⇒ người chơi gõ đúng bộ gõ, tôn trọng nguyên văn
  for (const [via, fn] of [['telex', telexSyllable], ['vni', vniSyllable]]) {
    const k = convertWord(typed, fn);
    if (fits(k)) return { word: k, via };
  }
  // không dấu: so khớp bỏ dấu, chỉ nhận khi đúng MỘT từ phù hợp
  const plain = stripMarks(typed).replace(/[^a-z\s]/g, ' ').trim().split(/\s+/).join(' ');
  const pool = need ? dict.startsWith(need) : dict.all();
  const cands = pool.filter((k) => stripMarks(k) === plain);
  if (cands.length === 1) return { word: cands[0], via: 'plain' };
  return { word: typed, via: 'none', candidates: cands.slice(0, 3) };
}
