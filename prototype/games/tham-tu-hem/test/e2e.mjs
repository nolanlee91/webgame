// E2E Thám Tử Hẻm trên Chrome headless qua CDP (test/cdp.mjs) — bấm chuột / chạm thật vào giao diện.
// Chạy (ở gốc repo):  PORT=8871 node server.js   rồi   PORT=8871 node prototype/games/tham-tu-hem/test/e2e.mjs <thư mục ảnh>
// Kịch bản (desktop 1366×768 dpr 1,25 rồi điện thoại 390×844 dpr 3), vụ mẫu nạp qua ?case=__mini (chỉ bật ở localhost / ?dev=1):
// màn mở (đặt tên) → bản đồ → văn phòng (thoại, Space qua thoại) → bài đăng nhóm (like, bình luận) → nhận vụ → hiện trường (chế độ soi, soi điểm)
// → thẩm vấn (hỏi chủ đề, đưa vật chứng) → sổ tay (N) vạch mâu thuẫn sai (mất uy tín) → điểm soi mở theo lời khai → vạch mâu thuẫn đúng (bể)
// → gợi ý Tèo (xác nhận) → bảng suy luận (B): chạm chọn sai ⇒ chốt báo số chỗ sai, kéo-thả (desktop) / chạm (mobile) đúng ⇒ khớp
// → vạch mặt (đưa sai rồi đúng) → kết vụ (★, câu hỏi phụ) → về bản đồ (đã phá) → tải lại giữ hồ sơ.
// Desktop thêm: tải lại giữa vụ rồi "Tiếp tục" giữ tiến độ; "Chơi lại vụ" có xác nhận; "Xoá tiến độ" có xác nhận + .backup.
// Mỗi màn: chụp ảnh, kiểm nút chính không bị che (elementFromPoint 5 điểm), không tràn ngang. Yêu cầu 0 lỗi console (trừ 404 file vụ chưa viết).
import { launch, sleep } from "./cdp.mjs";

const OUT = process.argv[2] || ".", PORT = process.env.PORT || 8871;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const URL0 = `${ORIGIN}/games/tham-tu-hem/?case=__mini&fast=1`;
const b = await launch(OUT, Number(process.env.CDP_PORT) || 9571);
let fails = 0, mobile = false;
const check = (n, c, d = "") => { const s = (c ? "PASS " : "FAIL ") + n + (d !== "" ? " — " + d : ""); if (!c) fails++; console.log(s); };
const at = (sel) => b.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.closest('[hidden]')||e.disabled)return null;e.scrollIntoView({block:'nearest',inline:'nearest'});const r=e.getBoundingClientRect();return r.width?[r.x+r.width/2,r.y+r.height/2]:null})()`);
async function press(sel, wait = 40) {
  let p = null;
  for (let i = 0; i < wait && !(p = await at(sel)); i++) await sleep(80);
  if (!p) { await b.shot(`${OUT}/LOI-${sel.replace(/[^a-z0-9]+/gi, "_").slice(0, 40)}.png`).catch(() => {}); throw new Error("không thấy " + sel + " :: " + JSON.stringify(await b.ev("({sc:__game.screen,ov:__game.overlay,dlg:__game.dialogOpen})"))); }
  if (mobile) await b.tap(...p); else await b.click(...p);
  await sleep(90);
}
const S = (expr) => b.ev(`(()=>{const s=__game.state,p=__game.profile;return ${expr}})()`);
const visible = (sel) => b.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});return !!e&&!e.closest('[hidden]')&&e.getBoundingClientRect().width>0})()`);
const noOverflowX = () => b.ev("document.documentElement.scrollWidth<=document.documentElement.clientWidth&&document.body.scrollWidth<=innerWidth");
async function waitFor(expr, ms = 6000) { for (let t = 0; t < ms; t += 80) { if (await b.ev(expr).catch(() => false)) return true; await sleep(80); } return false; }
async function key(k, code = k) { for (const type of ["keyDown", "keyUp"]) await b.send("Input.dispatchKeyEvent", { type, key: k, code, windowsVirtualKeyCode: k === " " ? 32 : k === "Enter" ? 13 : k === "Escape" ? 27 : k.toUpperCase().charCodeAt(0), text: type === "keyDown" && k.length === 1 ? k : undefined }); await sleep(80); }
/** Qua hết thoại (bấm hộp thoại; useKey ⇒ dùng Space). Chờ thoại mở tối đa `ms`. */
async function talkThrough(ms = 3000, useKey = false) {
  if (!(await waitFor("__game.dialogOpen", ms))) return 0;
  let n = 0;
  for (; n < 80 && (await b.ev("__game.dialogOpen")); n++) { if (useKey) await key(" "); else await press(".dlg-box"); }
  return n;
}
async function notCovered(sels) {
  return b.ev(`(()=>{const bad=[];for(const sel of ${JSON.stringify(sels)}){for(const e of document.querySelectorAll(sel)){if(e.closest('[hidden]')||!e.getBoundingClientRect().width)continue;const r=e.getBoundingClientRect();
    if(r.bottom>innerHeight||r.top<0||r.right>innerWidth||r.left<0)continue;
    for(const[fx,fy]of [[.5,.5],[.2,.2],[.8,.2],[.2,.8],[.8,.8]]){const x=r.left+r.width*fx,y=r.top+r.height*fy;const h=document.elementFromPoint(x,y);if(!h||!(h===e||e.contains(h))){bad.push(sel+'@'+Math.round(x)+','+Math.round(y)+' ⇐ '+(h?h.className||h.tagName:'null'));break;}}}}return bad})()`);
}
async function screen(tag, name, sels) {
  await sleep(150);
  await b.shot(`${OUT}/${tag}-${name}.png`);
  const bad = await notCovered(sels);
  check(`${tag} ${name}: nút không bị che`, !bad.length, bad.join(" | "));
  check(`${tag} ${name}: không tràn ngang`, await noOverflowX());
}
async function fresh() {
  await b.send("Page.navigate", { url: "about:blank" }); await sleep(250);
  await b.send("Storage.clearDataForOrigin", { origin: ORIGIN, storageTypes: "local_storage" });
  await b.nav(URL0);
}
async function dragTo(fromSel, toSel) {
  const a = await at(fromSel), z = await at(toSel);
  await b.send("Input.dispatchMouseEvent", { type: "mousePressed", x: a[0], y: a[1], button: "left", clickCount: 1 });
  for (let i = 1; i <= 8; i++) { await b.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: a[0] + ((z[0] - a[0]) * i) / 8, y: a[1] + ((z[1] - a[1]) * i) / 8, button: "left", buttons: 1 }); await sleep(30); }
  await b.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: z[0], y: z[1], button: "left", clickCount: 1 });
  await sleep(150);
}

async function play(tag, desktop) {
  await fresh();
  // màn mở
  check(`${tag}: màn mở có ô tên + nút vào`, (await visible("#detName")) && (await visible("#startBtn")));
  await screen(tag, "01-man-mo", ["#startBtn", "#detName"]);
  await press("#detName"); await b.send("Input.insertText", { text: "Thám Tử Mèo Mun" });
  await press("#startBtn");
  check(`${tag}: lưu tên thám tử`, (await S("p.name")) === "Thám Tử Mèo Mun");
  check(`${tag}: bản đồ có thẻ vụ mẫu mở + thẻ vụ thật`, (await visible('[data-case="mini"]:not(:disabled)')) && (await b.ev("document.querySelectorAll('.case-card').length")) === 7);
  const cat = await b.ev("__game.catalog()");
  check(`${tag}: vụ thiếu file ⇒ "Sắp ra mắt", vụ sau vụ chưa phá ⇒ khoá`, cat.filter((x) => x.status === "soon").every((x) => !x.open) && cat.filter((x) => x.id !== "mini" && x.id !== "noi-thit-kho").every((x) => !x.open));
  await screen(tag, "02-ban-do", ['[data-case="mini"]', "#renameBtn"]);
  // văn phòng
  await press('[data-case="mini"]');
  check(`${tag}: vào văn phòng, thoại tự phát`, (await waitFor("__game.screen==='office'&&__game.dialogOpen")));
  await sleep(200); await screen(tag, "03-van-phong-thoai", [".dlg-skip"]);
  check(`${tag}: chân dung đổi biểu cảm theo mood (shock)`, await b.ev("!!document.querySelector('.dlg-side.on .portrait[data-mood=\"shock\"]')"));
  check(`${tag}: nhặt từ khoá khi đọc tới`, (await S("s.words.includes('pate')")));
  await talkThrough(3000, true); // Space qua thoại
  check(`${tag}: bài đăng nhóm hiện sau lời kể`, await waitFor("!!document.querySelector('.phone-wrap')", 4000) || (await talkThrough(2000), await waitFor("!!document.querySelector('.phone-wrap')", 3000)));
  await press('[data-like="0"]');
  check(`${tag}: like bài đăng`, await b.ev("document.querySelector('[data-like=\"0\"]').getAttribute('aria-pressed')==='true'"));
  await press(".cmt-form .inp"); await b.send("Input.insertText", { text: "Để thám tử lo!" }); await press(".cmt-form .btn");
  check(`${tag}: bình luận hiện trong bài`, await b.ev("[...document.querySelectorAll('.comments li')].some(l=>l.textContent.includes('Để thám tử lo!'))"));
  await screen(tag, "04-bai-dang", ["#acceptPhone", "#closePhone", '[data-like="0"]']);
  await press("#acceptPhone");
  await talkThrough();
  check(`${tag}: nhận vụ ⇒ hiện trường`, (await b.ev("__game.screen")) === "scene" && (await S("s.phase")) === "play");
  check(`${tag}: điểm soi ẩn khi chưa có lời khai`, !(await visible('[data-hs="tui"]')) && (await visible('[data-hs="hu-pate"]')));
  await press("#soiBtn");
  check(`${tag}: chế độ soi bật viền`, await b.ev("!!document.querySelector('.scene.soi')"));
  await screen(tag, "05-hien-truong-soi", ['[data-hs="hu-pate"]', "#soiBtn", '[data-person="an"]', "#btnNotebook", "#btnHint", "#btnBoard", "#btnMute"]);
  check(`${tag}: cảnh phóng crisp (px thiết bị / px file là bội 0,5)`, await b.ev("(()=>{const e=document.querySelector('.scene');const k=e.getBoundingClientRect().width/960*devicePixelRatio*2;return Math.abs(k-Math.round(k))<0.01})()"));
  await press('[data-hs="hu-pate"]');
  await sleep(150); await screen(tag, "06-thoai-soi", [".dlg-skip"]);
  await talkThrough();
  check(`${tag}: soi ⇒ nhặt vật chứng, điểm mờ đi`, (await S("s.clues.includes('muong')")) && (await b.ev("document.querySelector('[data-hs=\"hu-pate\"]').classList.contains('seen')")));
  // thẩm vấn
  await press('[data-person="an"]');
  check(`${tag}: mở thẩm vấn`, (await b.ev("__game.overlay")) === "talk");
  await screen(tag, "07-tham-van", ['[data-topic="pate"]', "#presentBtn", ".panel-head .close"]);
  await press('[data-topic="pate"]'); await talkThrough();
  check(`${tag}: hỏi ⇒ ghi lời khai + từ khoá`, (await S("s.stmts.includes('an-khong-an')&&s.words.includes('an')")));
  if (desktop) {
    // tải lại giữa vụ ⇒ bản đồ ⇒ Tiếp tục
    await b.nav(URL0); await press("#startBtn"); await press('[data-case="mini"]');
    await press('[data-choice="go"]');
    check(`${tag}: tải lại giữa vụ + Tiếp tục giữ tiến độ`, (await b.ev("__game.screen")) === "scene" && (await S("s.clues.includes('muong')&&s.stmts.includes('an-khong-an')")));
  } else await key("Escape");
  // sổ tay: vạch mâu thuẫn sai
  await key("n");
  check(`${tag}: phím N mở sổ tay`, (await b.ev("__game.overlay")) === "notebook");
  await press('[data-tab="stmts"]'); await press('[data-stmt="an-khong-an"] .stmt-pick');
  await screen(tag, "08-so-tay-loi-khai", ["#contraBtn", '[data-tab="clues"]', '[data-tab="words"]']);
  await press("#contraBtn"); await sleep(150);
  await screen(tag, "09-chon-vat-chung", ['[data-pick="muong"]', "#pickCancel"]);
  await press('[data-pick="muong"]'); await press("#pickGo");
  await sleep(700); await b.shot(`${OUT}/${tag}-10-tem-trat.png`);
  await talkThrough(4000);
  check(`${tag}: vạch sai ⇒ mất 1 uy tín (4 kính lúp)`, (await S("s.cred")) === 4 && (await b.ev("document.querySelectorAll('.cred .lens.off').length")) === 1);
  for (const t of ["clues", "words", "people"]) { await press(`[data-tab="${t}"]`); if (t === "words") await screen(tag, "11-so-tay-tu-khoa", ['[data-tab="stmts"]']); }
  await key("Escape");
  check(`${tag}: Esc đóng sổ tay`, (await b.ev("__game.overlay")) === null);
  // điểm soi mở theo lời khai ⇒ vạch đúng
  await press('[data-hs="tui"]'); await talkThrough();
  check(`${tag}: điểm soi theo điều kiện mở + nhặt vật chứng`, (await S("s.clues.includes('muong-an')")));
  await press('[data-person="an"]'); await press('[data-contra="an-khong-an"]');
  await press('[data-pick="muong-an"]'); await press("#pickGo");
  await sleep(900); await b.shot(`${OUT}/${tag}-12-tem-be.png`);
  await talkThrough(4000);
  check(`${tag}: vạch đúng ⇒ bể lời khai, không mất uy tín`, (await S("s.broke.includes('an-khong-an')&&s.cred===4")));
  await key("Escape");
  // người khác: hỏi + đưa vật chứng
  await press('[data-person="binh"]'); await press('[data-topic="chay"]'); await talkThrough();
  await press("#presentBtn"); await press('[data-pick="muong"]'); await press("#pickGo"); await sleep(100);
  check(`${tag}: đưa vật chứng cho người ⇒ câu riêng`, await waitFor("__game.dialogOpen") && (await b.ev("document.querySelector('.dlg-text').textContent.length>0")));
  await talkThrough(); await key("Escape");
  // gợi ý Tèo
  await press("#btnHint"); await press("#cfYes"); await talkThrough();
  check(`${tag}: gợi ý Tèo (có xác nhận) ⇒ ghi 1 gợi ý`, (await S("s.hints.length")) === 1);
  // bảng suy luận
  await key("b");
  check(`${tag}: phím B mở bảng suy luận`, (await b.ev("__game.overlay")) === "board");
  await press('.slot[data-blank="a"]'); await press('.chip[data-word="binh"]');
  await press("#commitBtn"); await sleep(900);
  check(`${tag}: chốt sai ⇒ chỉ báo số chỗ sai`, (await S("s.wrongBoard")) === 1 && /Còn 1 chỗ sai/.test(await b.ev("document.querySelector('.panel-foot .status').textContent")));
  if (desktop) await dragTo('.chip[data-word="an"]', '.slot[data-blank="a"]');
  else { await press('.slot[data-blank="a"]'); await press('.chip[data-word="an"]'); }
  check(`${tag}: ${desktop ? "kéo-thả" : "chạm chọn"} từ khoá vào chỗ trống`, (await S("s.board.ai.a")) === "an");
  await screen(tag, "13-bang-suy-luan", ["#commitBtn", '.slot[data-blank="a"]', '.chip[data-word="an"]']);
  await press("#commitBtn"); await sleep(900); await talkThrough();
  check(`${tag}: chốt đúng ⇒ bảng khớp`, (await S("s.solved")));
  await screen(tag, "14-bang-khop", ["#accuseBtn2"]);
  // vạch mặt
  await press("#accuseBtn2"); await talkThrough(4000);
  check(`${tag}: vào màn vạch mặt`, (await b.ev("__game.screen")) === "finale" && (await S("s.phase")) === "finale");
  await screen(tag, "15-vach-mat", ["#rebutBtn", "#replayClaim"]);
  await press("#rebutBtn"); await press('[data-pick="muong"]'); await press("#pickGo"); await talkThrough(4000);
  check(`${tag}: đưa sai lúc vạch mặt ⇒ mất uy tín, vẫn ở bước 1`, (await S("s.cred")) === 3 && (await S("s.fin.step")) === 0);
  await press("#rebutBtn"); await press('[data-pick="muong-an"]'); await press("#pickGo"); await talkThrough(5000);
  check(`${tag}: vạch mặt xong ⇒ kết vụ`, await waitFor("__game.screen==='result'", 4000) && (await S("s.phase")) === "done");
  // kết vụ
  const stars = await S("s.result.stars");
  check(`${tag}: ★ theo phạt (uy tín 2 + chốt sai 1 + gợi ý 1 = 4 ⇒ 2★)`, stars === 2, String(stars));
  await sleep(600);
  await screen(tag, "16-ket-vu", ["#backMap", "#replayCase", '[data-bonus="b1"][data-choice="0"]']);
  await press('[data-bonus="b1"][data-choice="0"]'); await talkThrough();
  check(`${tag}: câu hỏi phụ đúng`, (await S("s.bonus.b1")) === 0);
  await press("#backMap");
  check(`${tag}: về bản đồ ⇒ vụ đã phá, có danh tiếng`, (await b.ev("__game.screen")) === "map" && (await S("p.solved.mini&&p.solved.mini.stars===2&&p.rep>0")) && (await visible('[data-case="mini"] .mini-stamp')));
  await b.nav(URL0);
  check(`${tag}: tải lại giữ hồ sơ (tên, vụ đã phá)`, (await S("p.name==='Thám Tử Mèo Mun'&&!!p.solved.mini&&!p.runs.mini")));
  if (desktop) {
    await press("#startBtn"); await press('[data-case="mini"]');
    check(`${tag}: vụ đã phá chơi lại được (mở hồ sơ mới)`, await waitFor("__game.screen==='office'") && (await S("s.phase")) === "intro");
    await talkThrough(3000, true); await sleep(300); await talkThrough(1500);
    await waitFor("!!document.querySelector('#acceptPhone')", 3000); await press("#acceptPhone"); await talkThrough();
    await press('[data-hs="hu-pate"]'); await talkThrough();
    await press("#toMap"); await press('[data-case="mini"]'); await press('[data-choice="redo"]');
    check(`${tag}: "Chơi lại vụ" xoá tiến độ dở của vụ, giữ ★ cũ`, await waitFor("__game.screen==='office'") && (await S("s.clues.length===0&&s.phase==='intro'&&p.solved.mini.stars===2")));
    await talkThrough(3000); await talkThrough(1500);
    await press("#toMap"); await press("#renameBtn");
    await b.ev("document.querySelector('details.how').open=true");
    await press("#wipeBtn"); await press("#cfNo");
    check(`${tag}: Xoá tiến độ có xác nhận (Thôi ⇒ giữ)`, !!(await S("p.solved.mini")));
    await press("#wipeBtn"); await press("#cfYes");
    await b.waitGame(); await sleep(400);
    check(`${tag}: Xoá tiến độ ⇒ hồ sơ mới + bản cũ cất .backup`, (await S("!p.solved.mini&&p.rep===0")) && (await b.ev("!!localStorage.getItem('wgp.tham-tu-hem.v1.backup')&&JSON.parse(localStorage.getItem('wgp.tham-tu-hem.v1.backup')).solved.mini.stars===2")));
  }
}

const IGNORE = /data\/cases\/[\w-]+\.js\?v=t3/; // vụ chưa viết: 404 là bình thường ("Sắp ra mắt")
try {
  await b.view(1366, 768, false, 1.25); mobile = false;
  await play("desk", true);
  await b.view(390, 844, true, 3); await b.touch(true); mobile = true;
  await play("mob", false);
} catch (e) { fails++; console.log("FAIL lỗi kịch bản — " + e.message); await b.shot(`${OUT}/LOI-cuoi.png`).catch(() => {}); }
const errs = b.errors.filter((e) => !IGNORE.test(e));
check("0 lỗi console", !errs.length, errs.slice(0, 5).join(" | "));
b.close();
console.log(fails ? `${fails} FAIL` : "E2E ĐẠT");
process.exit(fails ? 1 : 0);
