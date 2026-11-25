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
  const exact = new Set(), plain = new Set();
  for (const w of src.exact || []) exact.add(w.normalize("NFC").toLowerCase().trim());
  for (const w of src.plain || []) plain.add(unleet(fold(w).trim()));
  return { exact, plain, contains: (src.contains || []).map((w) => fold(w).replace(/[^a-z0-9]/g, "")) };
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

/** Chữ thường giữ nguyên độ dài (để vị trí khớp với câu gốc) + đổi @ $ ! kẹp giữa chữ thành a s i ("đ!t", "$hit"). */
function prep(s) {
  let low = "";
  for (const ch of s) { const l = ch.toLowerCase(); low += l.length === ch.length ? l : ch; }
  return low.replace(/@(?=\p{L})|(?<=\p{L})@/gu, "a").replace(/\$(?=\p{L})|(?<=\p{L})\$/gu, "s").replace(/(?<=\p{L})!(?=\p{L})/gu, "i");
}

/** Che bằng dấu *: "f*ck", "f**k", "sh*t", "b*tch". */
const STARRED = [/\bf[u*]*\*[u*c]*k/g, /\bsh[i*]*\*[i*]*t\b/g, /\bb[i*]*\*[i*]*tch/g];

function tokenize(low) {
  const toks = [];
  for (const m of low.matchAll(/[\p{L}\p{M}\p{N}]+/gu)) {
    const w = m[0], d = w.replace(/đ/g, "d");
    toks.push({ s: m.index, e: m.index + w.length, w, plain: /^[a-z0-9]+$/.test(d) ? unleet(d) : null, f: unleet(fold(w)) });
  }
  return toks;
}

/** Từ gộp ảo cho kiểu lách "c.ặ.c", "đ ụ", "f.u.c.k", "cặ-c": chuỗi chữ đơn cách nhau ≤3 ký hiệu/khoảng trắng,
 *  hoặc các mẩu chỉ nối bằng dấu câu (không khoảng trắng). */
function virtualTokens(low, toks) {
  const out = [];
  const single = (t) => [...t.w].length === 1 && /\p{L}/u.test(t.w);
  const glued = (a, b) => /^[.\-_*'`~^,|+:/\\]{1,2}$/.test(low.slice(a.e, b.s));
  const near = (a, b) => b.s - a.e <= 3;
  for (const [ok, need] of [[(a, b) => single(a) && single(b) && near(a, b), 2], [glued, 2]]) {
    let i = 0;
    while (i < toks.length) {
      let j = i;
      while (j + 1 < toks.length && ok(toks[j], toks[j + 1])) j++;
      if (j - i + 1 >= need) {
        const run = toks.slice(i, j + 1);
        out.push({ s: run[0].s, e: run[run.length - 1].e, w: run.map((t) => t.w).join(""),
          plain: run.every((t) => t.plain !== null) ? run.map((t) => t.plain).join("") : null, f: run.map((t) => t.f).join("") });
      }
      i = j + 1;
    }
  }
  return out;
}

function hitWord(t, sets) {
  for (const S of sets) {
    if (S.exact.has(t.w) || S.exact.has(squeeze(t.w))) return true;
    if (t.plain !== null && (S.plain.has(t.plain) || S.plain.has(squeeze(t.plain)))) return true;
  }
  return false;
}

/** Trả danh sách [đầu, cuối) các đoạn tục trong `low` (đã prep). */
function findSpans(low, sets) {
  const spans = [];
  for (const re of STARRED) for (const m of low.matchAll(re)) spans.push([m.index, m.index + m[0].length]);
  const toks = tokenize(low);
  for (const t of toks.concat(virtualTokens(low, toks))) if (hitWord(t, sets)) spans.push([t.s, t.e]);
  // cụm 2–3 từ ("đù má", "du ma", "con chó")
  for (let i = 0; i < toks.length; i++) {
    for (let n = 2; n <= 3 && i + n <= toks.length; n++) {
      const run = toks.slice(i, i + n);
      const w = run.map((t) => t.w).join(" ");
      const plain = run.every((t) => t.plain !== null) ? run.map((t) => t.plain).join(" ") : null;
      if (sets.some((S) => S.exact.has(w) || (plain !== null && S.plain.has(plain)))) spans.push([run[0].s, run[n - 1].e]);
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
  return spans;
}

const setsFor = (name) => (name ? [BASE, NAME_EXTRA] : [BASE]);

/** Có từ tục không. `{ name: true }` dùng danh sách khắt khe hơn cho tên hiển thị. */
function isProfane(text, { name = false } = {}) {
  if (typeof text !== "string" || !text) return false;
  return findSpans(prep(text.normalize("NFC")), setsFor(name)).length > 0;
}

// đường link: http(s)://…, www.…, hoặc tên-miền.đuôi-phổ-biến (zalo.me/…, discord.gg/…, abc.com)
const LINK = /(?:https?:\/\/|www\.)\S+|(?<![\p{L}\p{N}@.-])[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)*\.(?:com|net|org|vn|io|gg|me|xyz|info|co|tk|ly|link|app|site|online|top|club|tv|biz|us|ru|cn|to|cc)(?![\p{L}\p{N}])(?:\/\S*)?/giu;

function hasLink(text) { LINK.lastIndex = 0; const r = LINK.test(text); LINK.lastIndex = 0; return r; }

/**
 * Che chat: link → "[link]", từ tục → "***" (giữ phần còn lại của câu). Đầu vào nên đã qua cleanLine.
 */
function maskChat(text) {
  if (typeof text !== "string" || !text) return "";
  let s = text.normalize("NFC").replace(LINK, "[link]");
  const low = prep(s);
  const spans = findSpans(low, [BASE]).sort((a, b) => a[0] - b[0]);
  if (!spans.length) return s;
  const merged = [];
  for (const sp of spans) { const last = merged[merged.length - 1]; if (last && sp[0] <= last[1]) last[1] = Math.max(last[1], sp[1]); else merged.push([...sp]); }
  for (let k = merged.length - 1; k >= 0; k--) s = s.slice(0, merged[k][0]) + "***" + s.slice(merged[k][1]);
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Tên người chơi trong phòng: NFC, bỏ ký tự điều khiển/vô hình/bidi và dấu < >, gộp khoảng trắng, cắt NAME_MAX ký tự thật.
 * Rỗng, dính từ tục hoặc chứa link ⇒ trả `fallback` (không bao giờ lưu/phát tên gốc).
 */
function cleanPlayerName(raw, fallback = DEFAULT_NAME, max = NAME_MAX) {
  const s = cleanLine(raw, max, { stripInvisible: true, stripAngles: true });
  if (!s) return fallback;
  if (isProfane(s, { name: true }) || hasLink(s)) return fallback;
  // tên dài bị cắt có thể làm lộ nửa từ tục ở đuôi ⇒ soi cả bản chưa cắt
  const full = cleanLine(raw, 64, { stripInvisible: true, stripAngles: true });
  if (full !== s && isProfane(full, { name: true })) return fallback;
  return s;
}

module.exports = { DEFAULT_NAME, NAME_MAX, fold, cleanLine, cutChars, isProfane, hasLink, maskChat, cleanPlayerName };
