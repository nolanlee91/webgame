// Tên hiển thị trên bảng xếp hạng: làm sạch + lọc từ tục bằng bộ lọc dùng chung games-server/moderation.js
// (cùng bộ lọc với tên/chat trong phòng online; danh sách từ ở bad-words.json, cách thêm từ: games-server/MODERATION.md).
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const moderation = require("../moderation.js");

export const DEFAULT_NAME = moderation.DEFAULT_NAME;
export const NAME_MIN = 2, NAME_MAX = 16;

/** Bỏ dấu tiếng Việt (đ → d), chữ thường. */
export const fold = moderation.fold;

/** Tên có chứa từ tục không (danh sách khắt khe dành cho tên). */
export function isProfane(name) {
  return moderation.isProfane(String(name ?? ""), { name: true });
}

/**
 * Làm sạch tên người chơi gửi lên: bỏ ký tự điều khiển / vô hình, chỉ giữ chữ (mọi thứ tiếng), số, khoảng trắng và . _ - ',
 * gộp khoảng trắng, cắt 16 ký tự. Ngắn hơn 2 ký tự hoặc dính từ tục ⇒ "Người chơi".
 */
export function cleanName(raw) {
  let s = typeof raw === "string" ? raw.slice(0, 200) : "";
  s = s.normalize("NFC").replace(/[\t\n\r\v\f\x85]/g, " ").replace(/\p{C}/gu, "")
    .replace(/[^\p{L}\p{M}\p{N} ._\-']/gu, "").replace(/\s+/g, " ").trim();
  const full = s;
  const cps = [...s];
  if (cps.length > NAME_MAX) s = cps.slice(0, NAME_MAX).join("").trim();
  if ([...s].length < NAME_MIN || !/[\p{L}\p{N}]/u.test(s) || isProfane(s) || isProfane(full) || moderation.hasLink(s)) return DEFAULT_NAME;
  return s;
}
