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
  assert.equal(M.maskChat("mày ngu vcl luôn"), "mày ngu *** luôn");
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
