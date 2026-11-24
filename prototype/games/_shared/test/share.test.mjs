// Test Node cho phần dựng nội dung của share.js (không cần canvas): chuẩn hoá opts, link, câu chia sẻ, bố cục ảnh, nhóm cộng đồng.
// Chạy: node --test prototype/games/_shared/test/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { normalizeOpts, shareUrl, shareText, layoutCard, wrapText, splitLine, communityLinks, facebookShareUrl, messengerShareUrl, gameMeta, CARD_SIZE } from "../share.js";
import { SITE_URL } from "../site.js";
import { GAMES_META } from "../games-meta.js";

// đo giả: mỗi ký tự rộng 0,55 × cỡ chữ (lấy cỡ từ chuỗi font)
const measure = (t, f) => t.length * 0.55 * Number(/(\d+)px/.exec(f)[1]);

test("games-meta có đủ game chính, thư mục khớp", () => {
  for (const id of ["o-an-quan", "tiem-tra-sua", "nong-trai", "ran-san-moi", "tham-tu-hem"]) assert.ok(GAMES_META[id], id);
  assert.equal(GAMES_META["do-vui"].folder, "do-vui-nhanh");
  assert.equal(GAMES_META["nong-trai"].thumb, "cozy-nong-trai.webp");
});

test("shareUrl: domain gốc + thư mục game + ?ref=share&g=<id>", () => {
  assert.equal(shareUrl("o-an-quan"), `${SITE_URL}/games/o-an-quan/?ref=share&g=o-an-quan`);
  assert.equal(shareUrl("do-vui"), `${SITE_URL}/games/do-vui-nhanh/?ref=share&g=do-vui`);
  assert.equal(shareUrl("o-an-quan", "http://x.test/"), "http://x.test/games/o-an-quan/?ref=share&g=o-an-quan");
  assert.match(shareUrl(""), /\/homepage\/\?ref=share&g=home$/);
});

test("shareText có tiêu đề + tên game + Lụm Kèo", () => {
  const t = shareText({ game: "tiem-tra-sua", title: "Lãi 1.250.000đ" });
  assert.match(t, /Lãi 1\.250\.000đ/); assert.match(t, /Tiệm Trà Sữa/); assert.match(t, /Lụm Kèo/);
  assert.match(shareText({ game: "co-caro" }), /Chơi Cờ Caro/);
});

test("link Facebook / Messenger được mã hoá", () => {
  const u = shareUrl("co-caro");
  assert.equal(facebookShareUrl(u), "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(u));
  assert.ok(messengerShareUrl(u).startsWith("fb-messenger://share/?link=https%3A%2F%2F"));
});

test("normalizeOpts: tối đa 4 dòng, cắt chuỗi dài, mặc định hợp lý", () => {
  const m = normalizeOpts({ game: "o-an-quan", title: "x".repeat(80), lines: ["a: 1", "", "b: 2", "c", "d", "e"], accent: "javascript:alert(1)" });
  assert.equal(m.name, "Ô Ăn Quan");
  assert.equal(m.lines.length, 4);
  assert.ok(m.title.length <= 40 && m.title.endsWith("…"));
  assert.equal(m.accent, "#f7c96d");
  assert.equal(m.theme, "navy");
  assert.equal(m.thumb, "homepage/assets/thumbs/o-an-quan.webp");
  assert.equal(normalizeOpts({ game: "o-an-quan", thumb: false }).thumb, "");
  assert.equal(normalizeOpts({ game: "x", accent: "#75d1bf", theme: "wood" }).accent, "#75d1bf");
  assert.equal(normalizeOpts({ game: "x", theme: "wood" }).theme, "wood");
  assert.equal(gameMeta("khong-co").name, "khong-co");
});

test("splitLine / wrapText", () => {
  assert.deepEqual(splitLine("Doanh thu: 2.100.000đ"), ["Doanh thu", "2.100.000đ"]);
  assert.equal(splitLine("Không có dấu hai chấm"), null);
  assert.equal(splitLine("Giờ: "), null);
  const w = wrapText("một hai ba bốn năm sáu bảy tám chín mười", 100, (t) => t.length * 10, 2);
  assert.equal(w.length, 2); assert.ok(w[1].endsWith("…")); assert.ok(w.every((l) => l.length * 10 <= 100));
});

test("layoutCard: mọi phần nằm trong khung, không chồng nhau, thumb phóng nguyên bội", () => {
  const cases = [
    [{ game: "o-an-quan", title: "Thắng máy 38–12", lines: ["Quân ăn được: 38", "Máy: 12", "Số lượt: 21"], tagline: "Máy xin thua!" }, { w: 720, h: 540 }],
    [{ game: "tiem-tra-sua", title: "Ngày 5 lãi 1.250.000đ", lines: ["Khách: 42", "Doanh thu: 2.100.000đ", "Đánh giá: 4,8★", "Ly đẹp nhất: Trà sữa trân châu"], tagline: "Chủ tiệm tương lai là đây chứ đâu, ai cản nổi nữa trời ơi đất hỡi!" }, { w: 480, h: 360 }],
    [{ game: "ran-san-moi", title: "Một tiêu đề rất rất dài không thể nào vừa một dòng được đâu", lines: [] }, { w: 240, h: 180 }],
    [{ game: "co-caro", title: "Thắng", lines: ["a: 1"] }, null],
    [{ game: "dao-vang", title: "Màn 9", lines: ["Tiền: 9999"] }, { w: 1448, h: 1086 }],
  ];
  for (const [o, ts] of cases) {
    const m = normalizeOpts(o);
    const L = layoutCard(m, measure, ts);
    const inner = { top: L.frame.y, bottom: L.footer.sepY };
    if (ts) {
      assert.ok(L.thumb, `${o.game}: có thumb`);
      const s = L.thumb.scale;
      assert.ok(Number.isInteger(s) || Number.isInteger(1 / s), `${o.game}: tỉ lệ nguyên ${s}`);
      assert.ok(L.thumb.x >= L.frame.x && L.thumb.x + L.thumb.w <= L.frame.x + L.frame.w, `${o.game}: thumb trong khung ngang`);
      assert.ok(L.thumb.y >= inner.top && L.thumb.y + L.thumb.h <= L.title.y, `${o.game}: thumb trên tiêu đề`);
      assert.ok(L.thumb.sy >= 0 && L.thumb.sy + L.thumb.sh <= ts.h + 1e-6, `${o.game}: vùng cắt hợp lệ`);
    } else assert.equal(L.thumb, null);
    let y = L.title.y + L.title.lines.length * L.title.lineH;
    if (L.stats) { assert.ok(L.stats.y >= y, `${o.game}: bảng chỉ số dưới tiêu đề`); y = L.stats.y + L.stats.h; }
    if (L.tagline) { assert.ok(L.tagline.y >= y, `${o.game}: câu cà khịa dưới bảng`); y = L.tagline.y + L.tagline.h; }
    assert.ok(y <= inner.bottom, `${o.game}: nội dung (${y}) không đè chân trang (${inner.bottom})`);
    for (const ln of L.title.lines) assert.ok(measure(ln, `800 ${L.title.size}px x`) <= CARD_SIZE - 168 + 1, `${o.game}: tiêu đề vừa bề rộng`);
    if (L.stats) assert.equal(L.stats.rows.length, m.lines.length);
  }
  const L4 = layoutCard(normalizeOpts({ game: "x", title: "t", lines: ["A: 1", "B: 2", "C: 3", "D: 4"] }), measure, null);
  assert.equal(L4.stats.twoCol, true, "4 dòng ngắn ⇒ 2 cột");
  const L3 = layoutCard(normalizeOpts({ game: "x", title: "t", lines: ["A: 1", "B: 2", "C: 3"] }), measure, null);
  assert.equal(L3.stats.twoCol, false, "3 dòng ⇒ 1 cột");
  assert.equal(L4.footer.line2, "lumkeo.com");
});

test("communityLinks: chỉ lấy link http(s) không rỗng; rỗng hết ⇒ []", () => {
  assert.deepEqual(communityLinks({ facebookGroup: "", facebookPage: "", zalo: "", tiktok: "" }), []);
  assert.deepEqual(communityLinks(undefined), []);
  const l = communityLinks({ facebookGroup: " https://facebook.com/groups/x ", zalo: "javascript:alert(1)", tiktok: "https://tiktok.com/@lk" });
  assert.deepEqual(l.map((x) => x.key), ["facebookGroup", "tiktok"]);
  assert.equal(l[0].url, "https://facebook.com/groups/x");
});

test("community.js trên trang chủ mặc định rỗng (không hiện nút)", async () => {
  const { readFileSync } = await import("node:fs");
  const vm = await import("node:vm");
  const ctx = { window: {} };
  vm.runInNewContext(readFileSync(new URL("../../../homepage/community.js", import.meta.url), "utf8"), ctx);
  assert.deepEqual(Object.keys(ctx.window.COMMUNITY).sort(), ["contactEmail", "facebookGroup", "facebookPage", "tiktok", "zalo"]); // contactEmail: trang Quyền riêng tư
  assert.deepEqual(communityLinks(ctx.window.COMMUNITY), []);
});
