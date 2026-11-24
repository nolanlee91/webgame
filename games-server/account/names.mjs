// Tên hiển thị trên bảng xếp hạng: làm sạch + lọc từ tục (danh sách nhỏ trong bad-words.json).
import { readFileSync } from "node:fs";

export const DEFAULT_NAME = "Người chơi";
export const NAME_MIN = 2, NAME_MAX = 16;

const WORDS = JSON.parse(readFileSync(new URL("./bad-words.json", import.meta.url), "utf8"));
const EXACT = new Set(WORDS.exact.map((w) => w.normalize("NFC").toLowerCase()));
const ASCII = new Set(WORDS.ascii);
const CONTAINS = WORDS.contains;

/** Bỏ dấu tiếng Việt (đ → d), chữ thường. */
export function fold(s) {
  return s.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d").replace(/Đ/g, "d").toLowerCase();
}

/** Tên có chứa từ tục không. */
export function isProfane(name) {
  const low = name.normalize("NFC").toLowerCase();
  const words = low.split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    if (EXACT.has(words[i]) || (i + 1 < words.length && EXACT.has(words[i] + " " + words[i + 1]))) return true;
  }
  const folded = fold(low);
  for (const w of folded.split(/[^a-z0-9]+/).filter(Boolean)) if (ASCII.has(w)) return true;
  const compact = folded.replace(/[^a-z0-9]+/g, "").replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e");
  return CONTAINS.some((w) => compact.includes(w));
}

/**
 * Làm sạch tên người chơi gửi lên: bỏ ký tự điều khiển / vô hình, chỉ giữ chữ (mọi thứ tiếng), số, khoảng trắng và . _ - ',
 * gộp khoảng trắng, cắt 16 ký tự. Ngắn hơn 2 ký tự hoặc dính từ tục ⇒ "Người chơi".
 */
export function cleanName(raw) {
  let s = typeof raw === "string" ? raw.slice(0, 200) : "";
  s = s.normalize("NFC").replace(/[\t\n\r\v\f\x85]/g, " ").replace(/\p{C}/gu, "")
    .replace(/[^\p{L}\p{M}\p{N} ._\-']/gu, "").replace(/\s+/g, " ").trim();
  const cps = [...s];
  if (cps.length > NAME_MAX) s = cps.slice(0, NAME_MAX).join("").trim();
  if ([...s].length < NAME_MIN || !/[\p{L}\p{N}]/u.test(s) || isProfane(s)) return DEFAULT_NAME;
  return s;
}
