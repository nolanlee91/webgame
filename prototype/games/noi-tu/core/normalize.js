// Chuẩn hóa tiếng Việt cho Nối Từ — thuần, không DOM, không đồng hồ.
// Quyết định (NORM_VERSION 1): khóa so khớp đặt dấu thanh theo "kiểu cũ" (mặc định của Unikey/bàn phím
// điện thoại): hòa, khỏe, thúy, mía, quý, hoàng. Người gõ "hoà/khoẻ/thuý" vẫn ra cùng khóa vì ta tách dấu thanh
// khỏi chữ rồi đặt lại theo một luật cố định. Từ hiển thị trong chuỗi luôn là dạng chuẩn này.
export const NORM_VERSION = 1;

const TONES = { '̀': 1, '́': 2, '̃': 3, '̉': 4, '̣': 5 }; // huyền sắc ngã hỏi nặng
const TONE_CHARS = ['', '̀', '́', '̃', '̉', '̣'];
const VOWELS = new Set([...'aăâeêioôơuưy']);
const MARKED = new Set([...'ăâêôơư']);

function splitTone(syl) {
  let tone = 0, base = '';
  for (const ch of syl.normalize('NFD')) {
    if (TONES[ch]) tone = TONES[ch]; else base += ch;
  }
  return { tone, base: base.normalize('NFC') };
}

function toneIndex(base) {
  const chars = [...base];
  let i = 0;
  // phụ âm đầu; "qu" và "gi" (khi sau đó còn nguyên âm) thuộc phụ âm đầu
  if (chars[0] === 'q' && chars[1] === 'u') i = 2;
  else if (chars[0] === 'g' && chars[1] === 'i' && VOWELS.has(chars[2])) i = 2;
  else while (i < chars.length && !VOWELS.has(chars[i])) i++;
  const start = i;
  while (i < chars.length && VOWELS.has(chars[i])) i++;
  const end = i; // [start, end) là cụm nguyên âm
  if (end === start) return -1;
  const hasFinal = end < chars.length;
  // 1) nguyên âm có mũ/móc nhận dấu (ươ → ơ: lấy cái cuối cùng)
  for (let k = end - 1; k >= start; k--) if (MARKED.has(chars[k])) return k;
  const n = end - start;
  if (n === 1) return start;
  if (hasFinal) return end - 1;           // hoàng, thuyền (đã có ê), toán
  if (n === 2) return start;              // kiểu cũ: hòa, khỏe, thúy, mía, múa, tài
  return start + 1;                       // oai, oay, uya, uyu, oeo → nguyên âm giữa
}

export function normalizeSyllable(raw) {
  const { tone, base } = splitTone(raw.toLowerCase());
  if (!tone) return base;
  const k = toneIndex(base);
  if (k < 0) return base;
  const chars = [...base];
  chars[k] = (chars[k] + TONE_CHARS[tone]).normalize('NFC');
  return chars.join('').normalize('NFC');
}

/** "  Hoà   BÌNH " → "hòa bình" */
export function normalizeWord(raw) {
  return String(raw ?? '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(normalizeSyllable)
    .join(' ');
}

export const syllables = (key) => (key ? key.split(' ') : []);
export const firstSyl = (key) => syllables(key)[0] ?? '';
export const lastSyl = (key) => { const s = syllables(key); return s[s.length - 1] ?? ''; };
