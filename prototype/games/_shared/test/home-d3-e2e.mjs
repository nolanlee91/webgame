// e2e Đợt 3 trang chủ (docs/audits/fixes/D3-home.md): tên khách tự sinh (P-A), ô hồ sơ (P-B), trang Bảng xếp hạng (P-C),
// thanh điều hướng + h1 (P-D), nhãn "★ Thử thách" (P-E), màn đầu điện thoại ≥ 6 game (HOME-02), mã phòng dán kèm chữ (HOME-04),
// ô tìm 16 px (HOME-05), tìm theo thể loại / số người (HOME-09), thẻ Tài trợ (HOME-11), bằng điểm hiện tiêu chí phụ (HOME-16).
// Chạy: node prototype/games/_shared/test/home-d3-e2e.mjs [thư-mục-ảnh]   (tự bật server.js trong tiến trình, cổng ngẫu nhiên, bảng chế độ RAM)
import { mkdirSync } from "node:fs";
import path from "node:path";
import { startServer, launchChrome, sleep } from "./cdp.mjs";
import { quizProof } from "../../../../games-server/account/test/helpers.mjs";
import { D } from "../../../../games-server/account/verify.mjs";

const OUT = path.resolve(process.argv[2] || "home-d3-shots");
mkdirSync(OUT, { recursive: true });
for (const k of ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "RAILWAY_ENVIRONMENT", "RAILWAY_PROJECT_ID", "NODE_ENV", "DAILY_BOARD"]) delete process.env[k];
const { server, base } = await startServer();
const chrome = await launchChrome();
let fails = 0;
const check = (n, c, d = "") => { if (!c) fails++; console.log((c ? "PASS " : "FAIL ") + n + (d !== "" ? " — " + d : "")); };
const shot = async (t, name) => { const f = path.join(OUT, name); await t.shot(f); console.log("  ảnh: " + f); };
const noHScroll = (t) => t.ev(`document.documentElement.scrollWidth <= innerWidth + 1 && document.body.scrollWidth <= innerWidth + 1`);
const GEN = /^[\p{L} ]+ \d\d$/u;
const tabs = [];
async function open(name, w, h, mobile, ctx, url = "/homepage/") {
  const t = await chrome.newTab(name, w, h, mobile, ctx);
  tabs.push(t);
  await t.go(base + url);
  await sleep(500);
  return t;
}
async function reload(t, url = "/homepage/") {
  try { await t.ev("window.__old = 1"); } catch {}
  await t.cmd("Page.navigate", { url: base + url });
  await t.waitFor(`!window.__old && document.readyState === "complete"`);
  await sleep(500);
}
const acc = (t) => t.ev(`JSON.parse(localStorage.getItem("wgp.account.v1") || "null")`);

try {
  // ---------- P-A: tên khách tự sinh ----------
  const c1 = await chrome.newContext();
  const T = await open("moi", 1366, 768, false, c1);
  const a1 = await acc(T);
  const chipName = await T.ev(`document.getElementById("meName").textContent`);
  check("P-A khách mới: có tên tự sinh ngay, lưu wgp.account.v1 (gen:true), ô hồ sơ hiện đúng tên", a1 && GEN.test(a1.name) && a1.gen === true && chipName === a1.name, JSON.stringify(a1) + " | " + chipName);
  await reload(T);
  check("P-A tải lại: giữ nguyên tên (không sinh tên mới)", (await acc(T)).name === a1.name);
  // bản lưu cũ: đã có tên ⇒ giữ; chưa có tên + tên cũ trong Ma Sói ⇒ dùng tên đó
  await T.ev(`localStorage.setItem("wgp.account.v1", JSON.stringify({ v: 1, name: "Bé Na", asked: true, devId: "", sent: { "sudoku:1": 1 } }))`);
  await reload(T);
  const a2 = await acc(T);
  check("P-A bản lưu cũ có tên ⇒ giữ 'Bé Na', giữ dữ liệu 'đã gửi'", a2.name === "Bé Na" && a2.sent["sudoku:1"] === 1 && (await T.ev(`document.getElementById("meName").textContent`)) === "Bé Na", JSON.stringify(a2));
  await T.ev(`localStorage.setItem("wgp.account.v1", JSON.stringify({ v: 1, name: "", asked: true, devId: "", sent: {} })); localStorage.setItem("ma-soi:name", "Sói Con")`);
  await reload(T);
  check("P-A bản lưu cũ bỏ qua tên + có tên Ma Sói ⇒ lấy 'Sói Con' (gen:false)", (await acc(T)).name === "Sói Con" && (await acc(T)).gen === false);
  await T.ev(`localStorage.removeItem("ma-soi:name"); localStorage.removeItem("wgp.account.v1")`);
  await reload(T);

  // ---------- P-B: ô hồ sơ ----------
  const B = JSON.parse(await T.ev(`JSON.stringify((() => { const b = document.getElementById("meBtn").getBoundingClientRect(), tb = document.querySelector(".topbar").getBoundingClientRect();
    return { w: b.width, h: b.height, right: innerWidth - b.right, top: b.top, tbBottom: tb.bottom, av: !!document.querySelector("#meAv svg"), exp: document.getElementById("meBtn").getAttribute("aria-expanded") }; })())`));
  check("P-B ô hồ sơ góc phải thanh trên: ≥ 44 px, có avatar pixel, aria-expanded=false", B.h >= 44 && B.av && B.exp === "false" && B.top < B.tbBottom && B.right < 120, JSON.stringify(B));
  // mở bằng bàn phím: Tab tới nút rồi Enter
  await T.ev(`document.getElementById("meBtn").focus()`);
  await T.cmd("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: String.fromCharCode(13) });
  await T.cmd("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  await sleep(250);
  const P = JSON.parse(await T.ev(`JSON.stringify({ open: !document.getElementById("mePop").hidden, exp: document.getElementById("meBtn").getAttribute("aria-expanded"),
    focus: document.activeElement.id, val: document.getElementById("meInput")?.value, board: document.querySelector(".me__board")?.getAttribute("href"),
    stats: document.querySelector(".me__stats")?.textContent.replace(/\\s+/g, " ").trim() })`));
  check("P-B Enter mở popover: focus vào ô tên, có link Bảng xếp hạng + chuỗi ngày", P.open && P.exp === "true" && P.focus === "meInput" && P.val === (await acc(T)).name && P.board === "bang-xep-hang.html" && /Chuỗi ngày/.test(P.stats), JSON.stringify(P));
  await shot(T, "ho-so-1366.png");
  const typeName = async (t, v) => {
    await t.ev(`(() => { const i = document.getElementById("meInput"); i.focus(); i.select(); })()`);
    await t.cmd("Input.insertText", { text: v });
    await t.ev(`document.getElementById("meSave").click()`);
    await sleep(500);
    return t.ev(`document.getElementById("meErr").textContent`);
  };
  check("HOME-15 tên 1 ký tự ⇒ báo 'Tên cần ít nhất 2 ký tự.'", (await typeName(T, "a")) === "Tên cần ít nhất 2 ký tự.");
  check("HOME-15 tên 17 ký tự ⇒ báo tối đa 16", /tối đa 16/.test(await typeName(T, "x".repeat(17))));
  check("tên có từ tục ⇒ máy chủ (/api/name/check) từ chối, tên cũ giữ nguyên", (await typeName(T, "đụ má")) === "Tên này không dùng được, bạn chọn tên khác nhé." && (await acc(T)).name !== "đụ má");
  // tab thứ hai cùng hồ sơ: đổi tên ở tab 1 ⇒ tab 2 cập nhật qua sự kiện storage
  const T2 = await open("tab2", 1366, 768, false, c1);
  const okMsg = await typeName(T, "  Bé   Bông  ");
  const a3 = await acc(T);
  check("P-B lưu tên hợp lệ ⇒ gộp khoảng trắng, gen:false, ô hồ sơ đổi ngay", a3.name === "Bé Bông" && a3.gen === false && okMsg.includes("Đã lưu") && (await T.ev(`document.getElementById("meName").textContent`)) === "Bé Bông", JSON.stringify(a3) + " " + okMsg);
  await sleep(300);
  check("P-A onNameChange: tab khác (cùng máy) đổi tên theo sự kiện storage", (await T2.ev(`document.getElementById("meName").textContent`)) === "Bé Bông");
  await T.ev(`document.getElementById("meDice").click()`); await sleep(200);
  const a4 = await acc(T);
  check("P-B 'Tên ngẫu nhiên khác' ⇒ tên tự sinh mới (gen:true)", GEN.test(a4.name) && a4.gen === true && (await T.ev(`document.getElementById("meName").textContent`)) === a4.name, a4.name);
  await T.cmd("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await T.cmd("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await sleep(150);
  check("P-B Esc đóng popover, focus về nút hồ sơ", await T.ev(`document.getElementById("mePop").hidden && document.activeElement.id === "meBtn" && document.getElementById("meBtn").getAttribute("aria-expanded") === "false"`));

  // ---------- P-D: điều hướng + h1 ----------
  const N = JSON.parse(await T.ev(`JSON.stringify({ h1: document.querySelectorAll("h1").length, h1t: document.querySelector("h1")?.textContent,
    links: [...document.querySelectorAll(".mainnav a")].map(a => a.innerText.trim() + ">" + a.getAttribute("href")),
    row: (() => { const r = [...document.querySelectorAll(".mainnav a")].map(a => Math.round(a.getBoundingClientRect().top)); return r.every(x => x === r[0]); })(),
    logoTop: Math.round(document.querySelector(".logo").getBoundingClientRect().top), navTop: Math.round(document.querySelector(".mainnav a").getBoundingClientRect().top) })`));
  check("P-D desktop: 4 mục Chơi · Phòng online · Thử thách · Bảng xếp hạng trên CÙNG hàng logo; có 1 h1",
    N.h1 === 1 && N.links.join() === "Chơi>#games,Phòng online>#lobby,Thử thách>bang-xep-hang.html#thu-thach,Bảng xếp hạng>bang-xep-hang.html" && N.row && Math.abs(N.logoTop - N.navTop) < 30, JSON.stringify(N));
  // D5: chưa có link https:// thật ⇒ thẻ ẩn; điền link ⇒ thẻ tự hiện (vẽ lại kệ) — xem home-d5-e2e.mjs
  check("HOME-11/D5 thẻ 'Tài trợ' ẩn khi SPONSOR.url trống", await T.ev(`!document.querySelector("#grid .tile--sponsor") && !window.SPONSOR.url`));
  await T.ev(`(() => { window.SPONSOR.url = "https://example.com/speakup"; document.querySelector('#chips .tab[data-cat="all"]').click(); })()`); await sleep(150);
  check("HOME-11 thẻ 'Tài trợ' SpeakUp Kids cuối kệ, cùng cỡ thẻ game", await T.ev(`(() => { const s = document.querySelector("#grid .tile--sponsor"); if (!s) return false;
    const tiles = s.parentElement.querySelectorAll(".tile"); const a = s.querySelector(".tile__art").getBoundingClientRect(), b = tiles[0].querySelector(".tile__art").getBoundingClientRect();
    return tiles[tiles.length - 1] === s && s.closest(".shelf") === [...document.querySelectorAll("#grid .shelf")].pop() && /Tài trợ/.test(s.textContent) && /SpeakUp Kids/.test(s.textContent)
      && Math.abs(a.width - b.width) < 1 && Math.abs(a.height - b.height) < 1; })()`));

  // ---------- HOME-09: tìm theo thể loại / số người, bỏ lọc tab, trạng thái rỗng ----------
  const search = async (t, q) => { await t.ev(`(() => { const i = document.getElementById("q"); i.value = ${JSON.stringify(q)}; i.dispatchEvent(new Event("input")); })()`); await sleep(120);
    return t.ev(`JSON.stringify({ ids: [...document.querySelectorAll("#grid .tile")].map(x => x.dataset.id), empty: !document.getElementById("empty").hidden, sug: [...document.querySelectorAll("#emptyTiles .tile")].map(x => x.dataset.id), msg: document.getElementById("emptyMsg").textContent })`).then(JSON.parse); };
  let S = await search(T, "doi khang");
  check("HOME-09 'doi khang' ⇒ ra các game đối kháng (có Cờ Caro, Ma Sói)", S.ids.length >= 8 && S.ids.includes("co-caro") && S.ids.includes("ma-soi"), S.ids.join());
  S = await search(T, "2 nguoi");
  check("HOME-09 '2 nguoi' ⇒ có Cờ Caro (2 người) và Cờ Cá Ngựa (2–4 người), không có game 1 người", S.ids.includes("co-caro") && S.ids.includes("co-ca-ngua") && !S.ids.includes("2048"), S.ids.join());
  await search(T, "");
  await T.ev(`document.querySelector('.tab[data-cat="giai-do"]').click()`); await sleep(100);
  S = await search(T, "co caro");
  check("HOME-09 đang ở tab Giải đố vẫn tìm ra Cờ Caro (bỏ lọc tab khi có từ khoá)", S.ids.includes("co-caro") && (await T.ev(`!document.querySelector('.tab[aria-pressed="true"]')`)), S.ids.join());
  S = await search(T, "zzqq khong co");
  check("HOME-09 không có kết quả ⇒ nói rõ từ khoá + gợi ý 4 game", S.empty && S.sug.length === 4 && S.msg.includes("zzqq khong co"), JSON.stringify(S));
  await T.ev(`document.getElementById("empty").scrollIntoView({ block: "center" })`); await sleep(400);
  await shot(T, "tim-rong-1366.png");
  await search(T, "");

  // ---------- HOME-04: dán mã phòng ----------
  const paste = (v) => T.ev(`(() => { const i = document.getElementById("roomInlineCode"); i.value = ${JSON.stringify(v)}; i.dispatchEvent(new Event("input")); return i.value; })()`);
  const P4 = [await paste(" WEBYS"), await paste("Mã: WEBYS"), await paste("vào phòng WEBYS nhé"), await paste("phong ab3cd nha"), await paste("abc78x"), await paste("ab")];
  check("HOME-04 dán mã kèm khoảng trắng / chữ ⇒ ra đúng mã 5 ký tự, không maxlength", P4.join() === "WEBYS,WEBYS,WEBYS,AB3CD,ABC78,AB" && !(await T.ev(`document.getElementById("roomInlineCode").hasAttribute("maxlength")`)), P4.join());
  await paste("");

  // ---------- Điện thoại 390×844 ----------
  const c2 = await chrome.newContext();
  const M = await open("390", 390, 844, true, c2);
  await sleep(800);
  const F = JSON.parse(await M.ev(`JSON.stringify((() => { const full = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth; };
    const cards = [...document.querySelectorAll("a.slide, a.tile")].filter((e) => !e.closest("[aria-hidden=true]") && full(e));
    return { n: cards.length, ids: cards.map(e => e.dataset.id), font: getComputedStyle(document.getElementById("q")).fontSize,
      nav: [...document.querySelectorAll(".mainnav a")].map(a => Math.round(a.getBoundingClientRect().height)),
      me: Math.round(document.getElementById("meBtn").getBoundingClientRect().height),
      lobbyBottom: Math.round(document.getElementById("lobby").querySelector(".lobby__bar").getBoundingClientRect().bottom),
      pinRow: (() => { const r = [document.getElementById("roomInlineCode"), document.querySelector("#roomInline button"), document.getElementById("createRoom")].map(e => Math.round(e.getBoundingClientRect().top)); return Math.max(...r) - Math.min(...r); })() }; })())`));
  check("HOME-02 màn đầu 390×844: thấy trọn ≥ 6 thẻ game", F.n >= 6, F.n + ": " + F.ids.join());
  check("HOME-02 sảnh điện thoại: mã phòng + Vào + Tạo phòng cùng MỘT hàng, nằm trong màn đầu", F.pinRow <= 8 && F.lobbyBottom <= 844, JSON.stringify({ pinRow: F.pinRow, lobbyBottom: F.lobbyBottom }));
  check("HOME-05 ô tìm 16 px trên điện thoại", F.font === "16px", F.font);
  check("P-D/P-B điện thoại: chip điều hướng + ô hồ sơ cao ≥ 44 px", F.nav.length === 4 && F.nav.every((h) => h >= 44) && F.me >= 44, JSON.stringify(F.nav) + " me " + F.me);
  check("390: không tràn ngang", await noHScroll(M));
  await shot(M, "man-dau-390x844.png");
  await M.click("#meBtn", { touch: true }); await sleep(300);
  const PM = JSON.parse(await M.ev(`JSON.stringify((() => { const r = document.getElementById("mePop").getBoundingClientRect(); return { l: r.left, r: innerWidth - r.right, open: !document.getElementById("mePop").hidden, focus: document.activeElement.id }; })())`));
  check("P-B popover trên 390: nằm gọn trong màn, cảm ứng không bật bàn phím (focus nút Đóng)", PM.open && PM.l >= 0 && PM.r >= 0 && PM.focus === "meClose", JSON.stringify(PM));
  await shot(M, "ho-so-390.png");
  await M.click("#meClose", { touch: true }); await sleep(150);
  check("P-B nút Đóng (×) đóng popover", await M.ev(`document.getElementById("mePop").hidden`));
  // nhãn ★ Thử thách bấm được (link riêng, không lồng trong thẻ)
  const chal = JSON.parse(await M.ev(`JSON.stringify([...document.querySelectorAll(".tile__chal")].map(a => ({ id: a.dataset.daily, inTile: !!a.closest("a.tile"), h: a.getAttribute("href") })))`));
  check("P-E 3 nhãn ★ Thử thách là link riêng (không lồng trong thẻ) tới ?daily=1", chal.length === 3 && chal.every((c) => !c.inTile && c.h.endsWith("/?daily=1")), JSON.stringify(chal));

  // ---------- Bề rộng 320 → 1920: không tràn ngang (trang chủ + bảng xếp hạng) ----------
  const widths = [[320, 568, true], [360, 800, true], [412, 915, true], [768, 1024, true], [844, 390, true], [1024, 768, false], [1366, 768, false], [1920, 1080, false]];
  const bad = [];
  for (const [w, h, m] of widths) {
    await M.cmd("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: m });
    for (const u of ["/homepage/", "/homepage/bang-xep-hang.html"]) {
      await reload(M, u);
      if (!(await noHScroll(M))) bad.push(`${w}×${h} ${u}`);
      const meOk = await M.ev(`(() => { const r = document.getElementById("meBtn").getBoundingClientRect(); return r.right <= innerWidth && r.left >= 0 && r.height >= 44; })()`);
      if (!meOk) bad.push(`${w}×${h} ${u} ô hồ sơ`);
    }
    if (w === 844) await shot(M, "man-dau-844x390.png");
  }
  check("không tràn ngang 320–1920 (trang chủ + bảng xếp hạng), ô hồ sơ luôn trong màn", !bad.length, bad.join(" | "));

  // ---------- P-C: trang Bảng xếp hạng ----------
  const c3 = await chrome.newContext();
  const L = await open("lb", 1366, 768, false, c3, "/homepage/bang-xep-hang.html");
  await L.ev(`localStorage.setItem("wgp.account.v1", JSON.stringify({ v: 1, name: "Mèo Mập 42", gen: true, asked: false, devId: "dlbtestme0001", sent: {} }))`);
  const day = D.dayNumber();
  const post = (u, body) => fetch(`${base}/api/daily/do-vui-nhanh/${day}`, { method: "POST", headers: { "content-type": "application/json", "x-dev-user": u }, body: JSON.stringify(body) }).then((r) => r.status);
  const st = [await post("dlbtestother1", { name: "Heo Cute 15", proof: quizProof(day, [true, true, true, true, false], 3000) }),
    await post("dlbtestme0001", { name: "Mèo Mập 42", proof: quizProof(day, [true, true, true, true, false], 4000) }),
    await post("dlbtestother2", { name: "Trùm Hẻm 31", proof: quizProof(day, [true, true, true, true, true], 5000) })];
  check("seed 3 kết quả Đố Vui qua API", st.every((x) => x === 200), st.join());
  await reload(L, "/homepage/bang-xep-hang.html?game=do-vui-nhanh");
  await L.waitFor(`document.getElementById("lbPanel").dataset.state === "board"`);
  const R = JSON.parse(await L.ev(`JSON.stringify({ rows: [...document.querySelectorAll("#lbList .lb__row")].map(r => r.querySelector(".lb__rank").textContent + " " + r.querySelector(".lb__name").firstChild.textContent.trim() + " " + r.querySelector(".lb__score").textContent + (r.classList.contains("is-you") ? " *" : "")),
    sel: document.querySelector('.lb__tab[aria-selected="true"]').dataset.game, cur: document.querySelector('.mainnav a[aria-current="page"]')?.getAttribute("href") })`));
  check("P-C tab Đố Vui từ ?game=, 3 dòng đúng thứ tự, dòng của mình tô (*), bằng điểm hiện '4/5 · 15 giây' (HOME-16)",
    R.sel === "do-vui-nhanh" && R.rows.join(" | ") === "#1 Trùm Hẻm 31 5/5 | #2 Heo Cute 15 4/5 · 15 giây | #3 Mèo Mập 42 4/5 · 20 giây *" && R.cur === "#bang", JSON.stringify(R));
  await L.ev(`document.getElementById("bang").scrollIntoView({ block: "start" })`); await sleep(200);
  await shot(L, "bang-xep-hang-1366.png");
  // bàn phím: ← → đổi tab, URL cập nhật
  await L.ev(`document.querySelector('.lb__tab[aria-selected="true"]').focus()`);
  await L.cmd("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
  await L.cmd("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
  await sleep(400);
  const K = JSON.parse(await L.ev(`JSON.stringify({ sel: document.querySelector('.lb__tab[aria-selected="true"]').dataset.game, focus: document.activeElement.dataset.game, url: location.search })`));
  check("P-C phím → từ Đố Vui vòng về Sudoku, focus theo tab, URL ?game=sudoku", K.sel === "sudoku" && K.focus === "sudoku" && K.url === "?game=sudoku", JSON.stringify(K));
  await L.ev(`document.querySelector('.lb__day[data-day="1"]').click()`); await sleep(400);
  check("P-C Hôm qua: nút bật + URL ?day=hom-qua, bảng tải (trống hoặc có)", await L.ev(`document.querySelector('.lb__day[data-day="1"]').getAttribute("aria-pressed") === "true" && location.search.includes("day=hom-qua") && ["board"].includes(document.getElementById("lbPanel").dataset.state)`));
  const L3 = await open("lb390", 390, 844, true, c3, "/homepage/bang-xep-hang.html?game=do-vui-nhanh");
  await L3.waitFor(`document.getElementById("lbPanel").dataset.state === "board"`);
  check("P-C 390: không tràn ngang, tab ≥ 44 px", (await noHScroll(L3)) && (await L3.ev(`[...document.querySelectorAll(".lb__tab, .lb__day")].every(b => b.getBoundingClientRect().height >= 44)`)));
  await L3.ev(`document.getElementById("bang").scrollIntoView({ block: "start" })`); await sleep(200);
  await shot(L3, "bang-xep-hang-390.png");

  const errs = tabs.flatMap((t) => t.errors.map((e) => t.name + ": " + e)).filter((e) => !/\/api\/lobby|ws\//.test(e));
  check("không có lỗi JS / console error", !errs.length, errs.join(" || "));
} catch (e) {
  console.log("FAIL ngoại lệ — " + (e && e.stack || e)); fails++;
}
console.log(fails ? `\n${fails} mục FAIL` : "\nTẤT CẢ ĐẠT");
try { chrome.close(); } catch {}
server.close();
setTimeout(() => process.exit(fails ? 1 : 0), 800);
