// Lọc nội dung người chơi gửi lên (tên + chat) — dùng chung cho MỌI máy chủ phòng online (CommonJS, require)
// và cho tài khoản / bảng xếp hạng (ES module, nạp qua createRequire). Danh sách từ: ./account/bad-words.json.
// Nguyên tắc: chặn nhầm câu tiếng Việt bình thường của trẻ con ("các bạn", "lớn lên", "dù mà", "đụng") tệ hơn lọt vài từ,
// nên so NGUYÊN TỪ có dấu; dạng không dấu chỉ so khi người gõ thật sự không dấu; chuỗi con chỉ dùng cho chuỗi không thể
// ghép ngẫu nhiên từ các từ tiếng Việt. Cách thêm từ: games-server/MODERATION.md.
"use strict";

const fs = require("fs");
const path = require("path");

const DEFAULT_NAME = "Người chơi";
const NAME_MAX = 16;

const WORDS = JSON.parse(fs.readFileSync(path.join(__dirname, "account", "bad-words.json"), "utf8"));

/** Bỏ dấu tiếng Việt (đ → d), chữ thường. */
function fold(s) {
  return String(s).normalize("NFD").replace(/\p{M}/gu, "").replace(/[đĐ]/g, "d").toLowerCase();
}

const LEET = { 0: "o", 1: "i", 3: "e", 4: "a", 5: "s", 7: "t" };
/** Đổi số kiểu leet (l0z, sh1t) — chỉ khi từ có chữ cái, để "10", "2024" vẫn là số. */
const unleet = (s) => (/\p{L}/u.test(s) ? s.replace(/[013457]/g, (d) => LEET[d]) : s);
/** Gộp chữ lặp: "fuuuck" → "fuck", "lồnnn" → "lồn". */
const squeeze = (s) => s.replace(/(.)\1+/gu, "$1");

function buildSets(src) {
  const exact = new Set(), plain = new Set(), glued = new Set(), leet = new Set();
  for (const w of src.exact || []) {
    const e = w.normalize("NFC").toLowerCase().trim();
    exact.add(e);
    if (e.includes(" ")) glued.add(e.replace(/ /g, ""));
    leet.add(fold(e).replace(/ /g, ""));
  }
  for (const w of src.plain || []) {
    const p = unleet(fold(w).trim());
    plain.add(p);
    if (p.includes(" ")) glued.add(p.replace(/ /g, ""));
    leet.add(p.replace(/ /g, ""));
  }
  // except: cụm BÌNH THƯỜNG chứa một cụm tục ("quả óc chó") — đoạn tục nằm gọn trong cụm này thì bỏ qua
  const except = new Set();
  for (const w of src.except || []) { except.add(w.normalize("NFC").toLowerCase().trim()); except.add(fold(w).trim()); }
  return { exact, plain, glued, leet, except, contains: (src.contains || []).map((w) => fold(w).replace(/[^a-z0-9]/g, "")) };
}
const BASE = buildSets(WORDS);
const NAME_EXTRA = buildSets(WORDS.nameOnly || {});

// ký tự điều khiển / vô hình / đảo chiều chữ (\p{C} gồm cả Cf: U+200B–200F, 202A–202E, 2066–2069, FEFF…) + ngắt dòng/đoạn Unicode.
// Giữ riêng ZWJ (U+200D) khi nó nối hai emoji (👨‍👩‍👧) — ZWJ lạc chỗ (chen giữa chữ để lách bộ lọc) bị bỏ.
const ZWJ_STRAY = /(?<!\p{Extended_Pictographic}️?)‍|‍(?!\p{Extended_Pictographic})/gu;
const INVISIBLE = /(?!‍)[\p{C}\p{Zl}\p{Zp}]/gu;
const SEG = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter("vi", { granularity: "grapheme" }) : null;

/** Cắt theo KÝ TỰ THẬT (cụm grapheme: emoji, chữ có dấu) — không bao giờ cắt đôi emoji (PTY-13). */
function cutChars(s, max) {
  if (SEG) {
    let out = "", n = 0;
    for (const { segment } of SEG.segment(s)) { if (n++ >= max) break; out += segment; }
    return out;
  }
  return [...s].slice(0, max).join("");
}

/**
 * Làm sạch một dòng chữ: chuẩn NFC, ký tự điều khiển/vô hình/bidi → khoảng trắng (hoặc bỏ hẳn với stripInvisible),
 * gộp khoảng trắng, cắt `max` ký tự thật. Không phải chuỗi (trừ số) ⇒ "".
 */
function cleanLine(raw, max, { stripInvisible = false, stripAngles = false } = {}) {
  if (typeof raw === "number") raw = String(raw);
  if (typeof raw !== "string") return "";
  let s = raw.slice(0, 4000).normalize("NFC").replace(ZWJ_STRAY, "").replace(INVISIBLE, stripInvisible ? "" : " ");
  if (stripAngles) s = s.replace(/[<>]/g, "");
  s = s.replace(/\s+/g, " ").trim();
  return cutChars(s, max).trim();
}

// ---------- tìm từ tục ----------

// Chữ giả dạng Latin (Cyrillic, Armenian, Hy Lạp, chữ hoa nhỏ) — tiếng Việt không dùng các chữ này nên đổi thẳng.
const CONFUSE = Object.fromEntries([
  // Cyrillic
  ["а", "a"], ["в", "b"], ["е", "e"], ["ё", "e"], ["з", "3"], ["и", "u"], ["к", "k"], ["м", "m"], ["н", "h"], ["о", "o"],
  ["р", "p"], ["с", "c"], ["т", "t"], ["у", "y"], ["х", "x"], ["ь", "b"], ["і", "i"], ["ї", "i"], ["ј", "j"], ["ѕ", "s"],
  ["һ", "h"], ["ԁ", "d"], ["ӏ", "l"], ["ԛ", "q"], ["ԝ", "w"], ["џ", "u"], ["ц", "u"], ["п", "n"], ["г", "r"], ["ү", "y"],
  // Armenian
  ["ս", "u"], ["օ", "o"], ["հ", "h"], ["ո", "n"], ["ց", "g"], ["ք", "p"], ["զ", "q"], ["ա", "w"], ["ի", "h"], ["լ", "l"],
  ["ւ", "l"], ["և", "u"], ["ռ", "n"], ["ժ", "d"],
  // Hy Lạp
  ["α", "a"], ["β", "b"], ["ε", "e"], ["η", "n"], ["ι", "i"], ["κ", "k"], ["ν", "v"], ["ο", "o"], ["ρ", "p"], ["τ", "t"],
  ["υ", "u"], ["χ", "x"], ["ω", "w"], ["ς", "c"], ["μ", "u"],
  // chữ hoa nhỏ / IPA
  ["ᴀ", "a"], ["ʙ", "b"], ["ᴄ", "c"], ["ᴅ", "d"], ["ᴇ", "e"], ["ꜰ", "f"], ["ɢ", "g"], ["ʜ", "h"], ["ɪ", "i"], ["ᴊ", "j"],
  ["ᴋ", "k"], ["ʟ", "l"], ["ᴍ", "m"], ["ɴ", "n"], ["ᴏ", "o"], ["ᴘ", "p"], ["ǫ", "q"], ["ʀ", "r"], ["ꜱ", "s"], ["ᴛ", "t"],
  ["ᴜ", "u"], ["ᴠ", "v"], ["ᴡ", "w"], ["ʏ", "y"], ["ᴢ", "z"], ["ı", "i"], ["ɑ", "a"], ["ɡ", "g"], ["ʋ", "u"],
]);

/**
 * Chuẩn hoá để SO (không phải để hiện): từng ký tự qua NFKC (chữ full-width "ｆ", chữ toán học "𝐟", chữ khoanh "ⓕ" → f),
 * chữ thường, đổi chữ giả dạng (Cyrillic "с", Armenian "ս"…) → Latin; @ $ ! kẹp giữa chữ → a s i ("đ!t", "$hit").
 * Trả { low, os, oe }: os[i]/oe[i] = đầu/cuối (trong chuỗi gốc) của ký tự gốc sinh ra low[i] — để che đúng chỗ trong câu gốc.
 */
function prep(s) {
  let low = "";
  const os = [], oe = [];
  let i = 0;
  for (const ch of s) {
    let out = "";
    for (const c of ch.normalize("NFKC").toLowerCase()) out += CONFUSE[c] ?? c;
    for (let k = 0; k < out.length; k++) { os.push(i); oe.push(i + ch.length); }
    low += out;
    i += ch.length;
  }
  low = low.replace(/@(?=\p{L})|(?<=\p{L})@/gu, "a").replace(/\$(?=\p{L})|(?<=\p{L})\$/gu, "s").replace(/(?<=\p{L})!(?=\p{L})/gu, "i");
  return { low, os, oe };
}

/** Che bằng dấu *: "f*ck", "f**k", "sh*t", "b*tch". */
const STARRED = [/\bf[u*]*\*[u*c]*k/g, /\bsh[i*]*\*[i*]*t\b/g, /\bb[i*]*\*[i*]*tch/g];

/** Có cả chữ lẫn số leet ("l0n", "c4c", "bu0i") ⇒ người gõ cố ý: so dạng bỏ dấu với CẢ danh sách (kể cả từ không dấu
 *  thường bị bỏ qua như "lon", "cac"). Chỉ từ ≥ 3 ký tự để "B1", "5a", "4A" vẫn là nhãn bình thường. */
const leetOf = (w, f) => ([...w].length >= 3 && /[013457]/.test(w) && /\p{L}/u.test(w) ? f : null);

function tokenize(low) {
  const toks = [];
  for (const m of low.matchAll(/[\p{L}\p{M}\p{N}]+/gu)) {
    const w = m[0], d = w.replace(/đ/g, "d"), f = unleet(fold(w));
    toks.push({ s: m.index, e: m.index + w.length, w, plain: /^[a-z0-9]+$/.test(d) ? unleet(d) : null, f, leet: leetOf(w, f) });
  }
  return toks;
}

/** Từ gộp ảo cho kiểu lách "c.ặ.c", "đ ụ m á", "f.u.c.k", "cặ-c", "l.0.n": chuỗi chữ/số đơn cách nhau ≤ 3 ký hiệu/khoảng
 *  trắng (xét MỌI đoạn con dài ≥ 2), hoặc các mẩu chỉ nối bằng dấu câu (không khoảng trắng). */
function virtualTokens(low, toks) {
  const out = [];
  const single = (t) => [...t.w].length === 1;
  const glued = (a, b) => /^[.\-_*'`~^,|+:/\\]{1,2}$/.test(low.slice(a.e, b.s));
  const near = (a, b) => b.s - a.e <= 3;
  const make = (run) => {
    const w = run.map((t) => t.w).join(""), f = unleet(fold(w));
    return { s: run[0].s, e: run[run.length - 1].e, w, f, leet: leetOf(w, f),
      plain: run.every((t) => t.plain !== null) ? run.map((t) => t.plain).join("") : null };
  };
  for (const [ok, sub] of [[(a, b) => single(a) && single(b) && near(a, b), true], [glued, false]]) {
    let i = 0;
    while (i < toks.length) {
      let j = i;
      while (j + 1 < toks.length && ok(toks[j], toks[j + 1])) j++;
      if (j > i) {
        if (!sub) out.push(make(toks.slice(i, j + 1)));
        else for (let a = i; a < j; a++) for (let b = a + 1; b <= j && b - a < 12; b++) {
          const run = toks.slice(a, b + 1);
          if (run.some((t) => /\p{L}/u.test(t.w))) out.push(make(run));
        }
      }
      i = j + 1;
    }
  }
  return out;
}

function hitWord(t, sets) {
  const w2 = squeeze(t.w), p2 = t.plain !== null ? squeeze(t.plain) : null;
  for (const S of sets) {
    if (S.exact.has(t.w) || S.exact.has(w2) || S.glued.has(t.w) || S.glued.has(w2)) return true;
    if (t.plain !== null && (S.plain.has(t.plain) || S.plain.has(p2) || S.glued.has(t.plain) || S.glued.has(p2))) return true;
    if (t.leet !== null && (S.leet.has(t.leet) || S.leet.has(squeeze(t.leet)))) return true;
  }
  return false;
}

const phraseOf = (run) => [run.map((t) => t.w).join(" "), run.every((t) => t.plain !== null) ? run.map((t) => t.plain).join(" ") : null];

/** Trả danh sách [đầu, cuối) các đoạn tục trong `low` (đã prep). */
function findSpans(low, sets) {
  const spans = [];
  for (const re of STARRED) for (const m of low.matchAll(re)) spans.push([m.index, m.index + m[0].length]);
  const toks = tokenize(low);
  for (const t of toks.concat(virtualTokens(low, toks))) if (hitWord(t, sets)) spans.push([t.s, t.e]);
  // cụm 2–4 từ ("đù má", "du ma", "mày ngu", "mày là con chó")
  for (let i = 0; i < toks.length; i++) {
    for (let n = 2; n <= 4 && i + n <= toks.length; n++) {
      const [w, plain] = phraseOf(toks.slice(i, i + n));
      if (sets.some((S) => S.exact.has(w) || (plain !== null && S.plain.has(plain)))) spans.push([toks[i].s, toks[i + n - 1].e]);
    }
  }
  // chuỗi con (đã bỏ dấu, dính liền): che cửa sổ từ NHỎ NHẤT chứa nó
  const contains = sets.flatMap((S) => S.contains);
  if (contains.length) {
    const hit = (i, j) => { let c = ""; for (let k = i; k <= j; k++) c += toks[k].f; return contains.some((w) => c.includes(w)); };
    for (let i = 0; i < toks.length; i++) {
      for (let j = i; j < toks.length && j < i + 6; j++) {
        if (!hit(i, j)) continue;
        if ((j > i && hit(i, j - 1)) || (j > i && hit(i + 1, j))) break;
        spans.push([toks[i].s, toks[j].e]); break;
      }
    }
  }
  if (!spans.length) return spans;
  // cụm bình thường chứa cụm tục ("quả óc chó", "hạt óc chó"): đoạn tục nằm gọn trong cụm đó thì bỏ
  const allow = [];
  for (let i = 0; i < toks.length; i++) {
    for (let n = 2; n <= 4 && i + n <= toks.length; n++) {
      const run = toks.slice(i, i + n);
      const w = run.map((t) => t.w).join(" "), f = run.map((t) => fold(t.w)).join(" ");
      if (sets.some((S) => S.except.has(w) || S.except.has(f))) allow.push([run[0].s, run[n - 1].e]);
    }
  }
  return allow.length ? spans.filter(([a, b]) => !allow.some(([x, y]) => x <= a && b <= y)) : spans;
}

const setsFor = (name) => (name ? [BASE, NAME_EXTRA] : [BASE]);

/** Có từ tục / câu chửi không. `{ name: true }` dùng danh sách khắt khe hơn cho tên hiển thị. */
function isProfane(text, { name = false } = {}) {
  if (typeof text !== "string" || !text) return false;
  return findSpans(prep(text.normalize("NFC")).low, setsFor(name)).length > 0;
}

// ---------- link, số điện thoại, rủ sang kênh liên lạc riêng ----------

// đường link: http(s)://…, www.…, hoặc tên-miền.đuôi-phổ-biến (zalo.me/…, discord.gg/…, abc.com)
const LINK = /(?:https?:\/\/|www\.)\S+|(?<![\p{L}\p{N}@.-])[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)*\.(?:com|net|org|vn|io|gg|me|xyz|info|co|tk|ly|link|app|site|online|top|club|tv|biz|us|ru|cn|to|cc)(?![\p{L}\p{N}])(?:\/\S*)?/giu;
// thư điện tử: abc.12@gmail.com
const EMAIL = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+/gu;
const test1 = (re, s) => { re.lastIndex = 0; const r = re.test(s); re.lastIndex = 0; return r; };

/** Có link / thư điện tử không (cả dạng chữ full-width "ｚａｌｏ.ｍｅ"). */
function hasLink(text) {
  if (typeof text !== "string" || !text) return false;
  const low = prep(text.normalize("NFC")).low;
  return test1(LINK, text) || test1(EMAIL, text) || test1(LINK, low) || test1(EMAIL, low);
}

// dãy chữ số (số điện thoại), kể cả khi xen dấu cách / chấm / gạch / phẩy: "0912 345 678", "0912.345.678", "+84 912-345-678"
const DIGITS = /\+?\p{Nd}(?:[ .\-_,/]{0,2}\p{Nd})+/gu;
const PHONE_MIN = 7;
// số tiền viết theo nghìn ("10.000.000", "1,500,000") — không phải số điện thoại (số điện thoại bắt đầu bằng 0 hoặc +)
const MONEY = /^[1-9]\d{0,2}([.,])\d{3}(?:\1\d{3})*$/;
// từ rủ sang kênh liên lạc riêng (so dạng đã bỏ dấu, nguyên từ: "sđt" → "sdt", "đt" → "dt")
const CONTACT = new Set(["zalo", "zl", "fb", "facebook", "fbook", "sdt", "dt", "inbox", "ib", "tele", "telegram", "ig", "insta",
  "instagram", "discord", "tiktok", "messenger", "wechat", "viber", "skype", "gmail", "email"]);
const countDigits = (s) => (s.match(/\p{Nd}/gu) || []).length;

/**
 * Các đoạn cần che vì chia sẻ cách liên lạc. Dãy ≥ 7 chữ số luôn che. Từ zalo/fb/sđt/ib/tele/ig… chỉ che khi câu có kèm
 * số (≥ 3 chữ số), @tên, link, hoặc ngay sau nó là một nick có số / chấm / gạch dưới ("zalo: be.na_09") — "ib mình nha",
 * "chơi zalo không" không bị che.
 */
function contactSpans(low) {
  const spans = [];
  for (const m of low.matchAll(DIGITS)) {
    if (countDigits(m[0]) < PHONE_MIN || MONEY.test(m[0])) continue;
    spans.push([m.index, m.index + m[0].length]);
  }
  const toks = tokenize(low);
  const hits = toks.filter((t) => CONTACT.has(fold(t.w)));
  if (!hits.length) return spans;
  const extra = [];
  for (const m of low.matchAll(/@[\p{L}\p{N}_.]{2,}/gu)) extra.push([m.index, m.index + m[0].length]);
  for (const t of hits) {
    // nick ngay sau: bỏ qua ":" "=" "-" ">" và khoảng trắng, lấy một cụm không khoảng trắng có số / chấm / gạch dưới
    const m = /^[\s:=\-–>]*(\S{3,})/u.exec(low.slice(t.e));
    if (m && /[\p{Nd}_.]/u.test(m[1]) && /[\p{L}\p{Nd}]/u.test(m[1])) {
      const s = t.e + m[0].length - m[1].length;
      extra.push([s, s + m[1].length]);
    }
  }
  for (const t of toks) if (countDigits(t.w) >= 3) extra.push([t.s, t.e]);
  if (!extra.length && !spans.length && countDigits(low) < 3 && !low.includes("[link]")) return spans;
  for (const t of hits) spans.push([t.s, t.e]);
  return spans.concat(extra);
}

/** Có số điện thoại / lời rủ sang kênh liên lạc riêng không (dùng cho tên). */
function hasContact(text) {
  if (typeof text !== "string" || !text) return false;
  return contactSpans(prep(text.normalize("NFC")).low).length > 0;
}

/**
 * Che chat: link / thư điện tử → "[link]"; số điện thoại, lời rủ qua Zalo/FB/…, từ tục và câu chửi → "***"
 * (giữ phần còn lại của câu). Đầu vào nên đã qua cleanLine.
 */
function maskChat(text) {
  if (typeof text !== "string" || !text) return "";
  LINK.lastIndex = 0; EMAIL.lastIndex = 0;
  let s = text.normalize("NFC").replace(EMAIL, "[link]").replace(LINK, "[link]");
  const { low, os, oe } = prep(s);
  const spans = findSpans(low, [BASE]).concat(contactSpans(low));
  for (const re of [EMAIL, LINK]) for (const m of low.matchAll(re)) spans.push([m.index, m.index + m[0].length]);
  if (!spans.length) return s;
  // vị trí trong chuỗi so sánh → vị trí trong câu gốc
  const orig = spans.filter(([a, b]) => b > a).map(([a, b]) => [os[a], oe[b - 1]]).sort((x, y) => x[0] - y[0]);
  const merged = [];
  for (const sp of orig) { const last = merged[merged.length - 1]; if (last && sp[0] <= last[1]) last[1] = Math.max(last[1], sp[1]); else merged.push([...sp]); }
  for (let k = merged.length - 1; k >= 0; k--) s = s.slice(0, merged[k][0]) + "***" + s.slice(merged[k][1]);
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Tên người chơi trong phòng: NFC, bỏ ký tự điều khiển/vô hình/bidi và dấu < >, gộp khoảng trắng, cắt NAME_MAX ký tự thật.
 * Rỗng, dính từ tục / câu chửi, chứa link, số điện thoại hay nick liên lạc ⇒ trả `fallback` (không bao giờ lưu/phát tên gốc).
 */
function cleanPlayerName(raw, fallback = DEFAULT_NAME, max = NAME_MAX) {
  const s = cleanLine(raw, max, { stripInvisible: true, stripAngles: true });
  if (!s) return fallback;
  if (isProfane(s, { name: true }) || hasLink(s) || hasContact(s)) return fallback;
  // tên dài bị cắt có thể làm lộ nửa từ tục / nửa số điện thoại ở đuôi ⇒ soi cả bản chưa cắt
  const full = cleanLine(raw, 64, { stripInvisible: true, stripAngles: true });
  if (full !== s && (isProfane(full, { name: true }) || hasLink(full) || hasContact(full))) return fallback;
  return s;
}

module.exports = { DEFAULT_NAME, NAME_MAX, fold, cleanLine, cutChars, isProfane, hasLink, hasContact, maskChat, cleanPlayerName };
