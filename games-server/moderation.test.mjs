// Bộ lọc tên + chat dùng chung (games-server/moderation.js). `node --test games-server/moderation.test.mjs`
// Bảng NÊN CHẶN / KHÔNG ĐƯỢC CHẶN: chặn nhầm tiếng Việt bình thường của trẻ con tệ hơn lọt vài từ — thêm từ mới phải thêm dòng vào đây.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import * as names from "./account/names.mjs";

const require = createRequire(import.meta.url);
const M = require("./moderation.js");
const { listPublicRooms } = require("./public-rooms.js");

export const SHOULD_BLOCK = [
  // có dấu
  "địt mẹ mày", "đụ má", "đụ m…", "Cặc Bự", "con đĩ", "đéo biết", "vãi lồn", "bú cặc", "chịch", "nứng quá", "đù má", "đcm", "đm", "đkm",
  // không dấu (chỉ dạng chửi nguyên từ / cụm)
  "dit me may", "du ma", "du me", "bu cac", "vai lon", "ditme",
  // viết tắt
  "vcl", "vui vl", "dm thang kia", "clm", "vkl", "dkm", "clgt", "dmm", "cc", "dmcs", "WTF",
  // lách bằng dấu chấm / khoảng trắng / chữ lặp / leet / ký hiệu
  "c.ặ.c", "c ặ c", "cặ.c", "đ ụ", "d.m", "Đ.M", "đ.c.m", "l o z", "f.u.c.k", "đ!t", "fuuuuck", "cặcccc", "lồnnn", "sh1t", "b1tch", "l0z", "$hit", "f*ck", "sh*t",
  // tiếng Anh
  "fuck you", "FUCK", "Fuck", "motherfucker", "bitch", "shit",
];

export const SHOULD_NOT_BLOCK = [
  "con mèo con chó", "Lớn lên con muốn làm bác sĩ", "các bạn ơi đi chợ không", "lồng đèn đẹp quá", "cực kỳ vui", "dù mà thua cũng vui",
  "đụng chạm", "Lâm", "Cúc", "Đi Dạo", "Bưởi Năm Roi", "con lợn mẹ", "quả óc chó", "chích ngừa", "bù lon", "đĩa nhạc", "dụ dỗ", "đủ mệt",
  "cục cứt", "đau đít", "bít chặt cửa", "Dũng", "Đức", "Long", "Lộc", "Cường", "Đừng", "đúng rồi", "ngu quá", "mẹ ơi", "đi đâu đó", "cún con",
  "dì Ba", "Sơn Tùng", "TP.HCM", "CLB bóng đá", "1.5 điểm", "tôi 10 tuổi", "em 8 tuổi", "lớp 5a", "chúc mừng năm mới", "ok luôn", "hihi", "lol",
  "A B C", "đi học", "học bài", "vai lớn", "thấy chưa", "cho mình chơi với",
  // gõ không dấu — câu bình thường
  "cac ban oi", "lon nuoc ngot", "cai lon nhat", "an cac mon ngon", "buoi sang", "deo kinh", "di cho", "con lon me", "con cho tao muon", "Du Mai", "Con Chồn",
];

test("bảng NÊN CHẶN: mọi dòng đều bị phát hiện (chat lẫn tên)", () => {
  for (const s of SHOULD_BLOCK) {
    assert.equal(M.isProfane(s), true, `chat: ${s}`);
    assert.equal(M.isProfane(s, { name: true }), true, `tên: ${s}`);
    assert.notEqual(M.maskChat(s), s, `che: ${s}`);
  }
});

test("bảng KHÔNG ĐƯỢC CHẶN: câu tiếng Việt bình thường đi qua nguyên vẹn", () => {
  for (const s of SHOULD_NOT_BLOCK) {
    assert.equal(M.isProfane(s), false, s);
    assert.equal(M.maskChat(s), s, s);
  }
  for (const s of ["Lâm", "Cúc", "Đi Dạo", "Lớn Lên", "Các Bạn", "Du Mai", "Con Chồn", "Bưởi Năm Roi", "Dũng", "Đụng", "Chó Con"]) {
    assert.equal(M.cleanPlayerName(s, "X"), s, `tên: ${s}`);
  }
});

test("maskChat: chỉ che đúng từ tục bằng ***, giữ phần còn lại; link → [link]", () => {
  assert.equal(M.maskChat("mày ngu vcl luôn"), "*** *** luôn");
  assert.equal(M.maskChat("tao ngu vcl luôn"), "tao ngu *** luôn");
  assert.equal(M.maskChat("xin chao fuck you"), "xin chao *** you");
  assert.equal(M.maskChat("địt mẹ mày luôn"), "*** mày luôn");
  assert.equal(M.maskChat("c.ặ.c to"), "*** to");
  assert.equal(M.maskChat("vào zalo.me/123 nhé"), "vào [link] nhé");
  assert.equal(M.maskChat("https://x.com/abc?d=1 ok"), "[link] ok");
  assert.equal(M.maskChat("www.abc.vn"), "[link]");
  assert.equal(M.maskChat("web abc.com.vn nha"), "web [link] nha");
  assert.equal(M.maskChat("1.5 điểm, 3.14"), "1.5 điểm, 3.14");
  assert.equal(M.maskChat(""), "");
  assert.equal(M.maskChat(null), "");
});

test("cleanPlayerName: gọn khoảng trắng, bỏ ký tự điều khiển/bidi/< >, cắt 16 ký tự thật (không vỡ emoji), tục/link ⇒ tên thay thế", () => {
  assert.equal(M.cleanPlayerName("  Đức    Anh  "), "Đức Anh");
  assert.equal(M.cleanPlayerName("  <b>An</b>‮  "), "bAn/b");
  assert.equal(M.cleanPlayerName("Mai\u0000​Linh\n"), "MaiLinh");
  assert.equal(M.cleanPlayerName("", "Người 2"), "Người 2");
  assert.equal(M.cleanPlayerName({ toString: () => "x" }, "F"), "F");
  assert.equal(M.cleanPlayerName(null), M.DEFAULT_NAME);
  assert.equal(M.cleanPlayerName("x".repeat(40)), "x".repeat(16));
  const fam = "👨‍👩‍👧";
  assert.equal(M.cleanPlayerName(fam.repeat(20)), fam.repeat(16)); // cụm emoji ZWJ còn nguyên, không cắt đôi (PTY-13)
  assert.equal(M.cleanPlayerName("ab" + "😀".repeat(20)), "ab" + "😀".repeat(14));
  assert.equal(M.cleanPlayerName("🇻🇳".repeat(20)), "🇻🇳".repeat(16)); // cờ (2 ký tự vùng) không bị tách
  for (const bad of ["👑 đụ m…", "👑 Cặc Bự", "địt mẹ mày", "Fuck You", "Con Chó Ngu", "Óc Chó", "c‍ặc", "zalo.me/abc", "Nguyễn Văn Tèo đcm"]) {
    assert.equal(M.cleanPlayerName(bad, "Người 1"), "Người 1", bad);
  }
});

test("names.mjs (bảng xếp hạng) dùng cùng bộ lọc", () => {
  for (const s of SHOULD_BLOCK) assert.equal(names.isProfane(s), true, s);
  assert.equal(names.cleanName("Cặc Bự"), names.DEFAULT_NAME);
  assert.equal(names.cleanName("Lớn Lên"), "Lớn Lên");
  assert.equal(names.fold("Đức"), "duc");
});

test("public-rooms: sảnh chờ trang chủ không bao giờ lộ tên chủ phòng chưa lọc (phòng thủ 2 lớp)", () => {
  const room = (code, name) => ({ code, phase: "lobby", host: 0, players: [{ name, connected: true }] });
  const rooms = new Map([["AAAAA", { room: room("AAAAA", "Cặc Bự"), public: true }], ["BBBBB", { room: room("BBBBB", "Lâm 🐱"), public: true }]]);
  assert.deepEqual(listPublicRooms(rooms, 2).map((r) => r.host), ["Người chơi", "Lâm 🐱"]);
});

// ---------- Đợt 7 (PARTY2-01 + TTH2-01): biến thể lách bộ lọc, câu chửi người, số điện thoại / rủ sang Zalo ----------

export const D7_BLOCK = [
  // leet: số thay chữ ⇒ so với CẢ danh sách (kể cả "lon", "cac" vốn bỏ qua khi gõ không dấu)
  "l0n", "L0N", "c4c", "thằng l0n", "bu0i", "l.0.n", "đ1t", "d1t m3", "c4k",
  // biến thể dấu / phụ âm
  "kặc", "lìn", "Kặc Bự", "cặk",
  // tách / chấm giữa chữ
  "đ ụ m á", "đ.ụ m.á", "đ-ụ-m-á", "đụmá", "đ ụ m ẹ", "d u m a", "đ ị t m ẹ", "v.c.l",
  // full-width, chữ toán học, chữ giả dạng (Cyrillic / Armenian / chữ hoa nhỏ)
  "ｆｕｃｋ", "ＦＵＣＫ", "𝐟𝐮𝐜𝐤", "fսck", "fuсk", "ѕhit", "ꜰᴜᴄᴋ", "ⓕⓤⓒⓚ", "ｌｏｚ",
  // tiếng Anh
  "phuck", "phuck you", "kys", "penis", "vagina", "kill yourself", "dildo", "cock",
  // câu chửi nhắm vào người
  "mày ngu", "Mày Ngu", "thằng ngu", "con ngu kia", "đồ ngu", "óc chó", "mày là con chó", "đồ con chó", "thằng chó",
  "đồ mất dạy", "khốn nạn", "câm mồm", "mày chết đi", "thang ngu", "oc cho", "ngu như bò",
];

/** Lời rủ liên lạc riêng: chat không còn số / từ liên lạc, tên bị thay. */
export const D7_CONTACT = [
  "vao zalo 0912345678 nha", "0912345678", "0912 345 678", "0912.345.678", "09-12-34-56-78", "+84 912 345 678",
  "sđt mình 0987654321", "zalo: 0912345", "ib fb mình nha 0901234", "add zalo be.na_09", "fb: lam.cute.123", "tele @abc_xyz",
  "ig @be_mai", "inbox mình abc@gmail.com", "ｚａｌｏ ０９１２３４５６７８", "kb zalo mình nha, 093 123 4567",
];

export const D7_PASS = [
  // từ bình thường trùng mặt chữ không dấu / leet
  "con lợn", "con lon", "lon bia", "các bạn", "cac ban", "lớn quá", "lớp 4A", "lớp 5a", "phòng B1", "bàn số 10", "tôi 10 tuổi",
  "Phúc Khang", "Phúc Kiên", "chơi với Phúc", "cục kẹo", "lính chì", "con chó này dễ thương", "con mèo con chó", "quả óc chó",
  "hạt óc chó ngon lắm", "sữa óc chó", "đồ ngủ", "mày ngủ chưa", "may ngu chua", "tao ngu quá", "ngu quá trời", "con chó nhà tao",
  "lấy cái thang cho mình", "mặt dày ghê", "đi đâu đó", "dù mà thua cũng vui",
  // tên khách / tên phòng
  "Nai Khó Ở 43", "Đại Ca Lầy 12", "Heo Cute 07", "Mèo Láo 99", "Gấu Cáu Kỉnh 5", "Trùm Hẻm 01", "Vịt Mập 88",
  // số / điểm / thời gian bình thường (ít hơn 7 chữ số)
  "1.5 điểm", "tỉ số 10 - 8", "12:30 nha", "năm 2024", "điểm 120000", "lượt 3", "phòng ABCDE", "10.000.000 đồng", "1,500,000 điểm", "con chó chết rồi",
  // nhắc tới mạng xã hội nhưng không kèm số / nick
  "ib mình nha", "chơi zalo không", "mẹ dùng facebook", "tele nhanh lên", "@Lâm ơi đi nè",
  // game Nối Từ / cờ
  "con cá", "cá ngựa", "xe pháo mã", "nối từ: lon ton", "chiếu tướng", "ăn quan", "đập bom",
];

test("D7: bảng NÊN CHẶN (leet, tách chữ, full-width, chữ giả dạng, tiếng Anh, câu chửi người) — chat lẫn tên", () => {
  assert.ok(D7_BLOCK.length >= 40, "ít nhất 40 mẫu xấu");
  for (const s of D7_BLOCK) {
    assert.equal(M.isProfane(s), true, `chat: ${s}`);
    assert.equal(M.isProfane(s, { name: true }), true, `tên: ${s}`);
    const masked = M.maskChat(s);
    assert.notEqual(masked, s, `che: ${s}`);
    assert.equal(M.cleanPlayerName(s, "Người 1"), "Người 1", `tên phòng: ${s}`);
    assert.equal(names.cleanName(s), names.DEFAULT_NAME, `bảng xếp hạng: ${s}`);
  }
});

test("D7: che TRỌN cụm tách chữ (không còn nửa câu)", () => {
  assert.equal(M.maskChat("đ.ụ m.á tụi bây"), "*** tụi bây");
  assert.equal(M.maskChat("đ ụ m á"), "***");
  assert.equal(M.maskChat("chào ｆｕｃｋ nha"), "chào *** nha");
  assert.equal(M.maskChat("ê fսck"), "ê ***");
  assert.equal(M.maskChat("mày ngu quá"), "*** quá");
  assert.equal(M.maskChat("ăn quả óc chó, mày óc chó"), "ăn quả óc chó, mày ***");
});

test("D7: số điện thoại + lời rủ sang Zalo/FB/… bị che, tên bị thay", () => {
  assert.ok(D7_CONTACT.length >= 15);
  for (const s of D7_CONTACT) {
    const m = M.maskChat(s);
    assert.ok(!/\p{Nd}{2}/u.test(m.replace(/\s|[.\-]/g, "")), `còn số: ${s} → ${m}`);
    assert.ok(!/zalo|ｚａｌｏ|\bfb\b|\bib\b|tele|sđt|\big\b|@/i.test(m), `còn kênh liên lạc: ${s} → ${m}`);
    assert.equal(M.cleanPlayerName(s, "Người 1"), "Người 1", `tên: ${s}`);
  }
  assert.equal(M.maskChat("vao zalo 0912345678 nha"), "vao *** *** nha");
  assert.equal(M.maskChat("số mình 0912 345 678 nhé"), "số mình *** nhé");
});

test("D7: bảng KHÔNG ĐƯỢC CHẶN (từ trùng mặt chữ, tên khách, số điểm, nhắc mạng xã hội không kèm số)", () => {
  assert.ok(D7_PASS.length >= 40, "ít nhất 40 câu bình thường");
  for (const s of D7_PASS) {
    assert.equal(M.isProfane(s), false, `isProfane: ${s}`);
    assert.equal(M.maskChat(s), s, `maskChat: ${s}`);
  }
  for (const s of ["Nai Khó Ở 43", "Đại Ca Lầy 12", "Phúc Khang", "Lớp 4A", "Con Lon", "Heo Cute 07"]) {
    assert.equal(M.cleanPlayerName(s, "X"), s, `tên: ${s}`);
    assert.equal(names.cleanName(s), s, `bảng xếp hạng: ${s}`);
  }
});
