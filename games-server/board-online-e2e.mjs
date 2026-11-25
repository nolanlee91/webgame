// E2E trình duyệt thật (2 hồ sơ = 2 người) cho Cờ Caro, Cờ Vua, Cờ Tướng, Ô Ăn Quan — Đợt 4 (D4-boards):
//   • BRD-09 "Ván tiếp" hai phía: B bấm ⇒ thẻ kết quả của A KHÔNG đóng, A thấy "Đối thủ muốn chơi tiếp · ván mới sau N giây";
//     A bấm "Chơi tiếp ngay" ⇒ cả hai vào ván mới. Caro: A không bấm ⇒ hết 10 giây cả hai tự vào ván mới.
//   • BRD-10 mất kết nối: B đóng tab ⇒ thẻ người chơi của A hiện "mất kết nối" + toast; (Caro, Ô Ăn Quan) tới lượt B ⇒
//     máy chủ đi thay sau 15 giây ⇒ toast "… máy đánh/đi thay"; B mở lại link ⇒ vào lại đúng ghế, A thấy "đã quay lại".
//   • BRD-08: A chơi trên điện thoại 360 px: tên dài của B đọc được (không "N…"), thẻ của A có nhãn "Bạn"; ô tên có bộ đếm,
//     quá 16 ký tự thì báo, không vào phòng.
//   • BRD-11: Xin thua (Vua, Tướng) / Rời ván hỏi bằng hộp pixel (dialog.pxc), không gọi confirm() của trình duyệt.
//   • Nút ≥ 44 px trên điện thoại (dọc 360×740 và ngang 740×360) ở màn đầu, phòng chờ, trong ván, thẻ kết quả.
// Chạy:  node games-server/board-online-e2e.mjs [co-caro co-vua co-tuong o-an-quan]
//        BASE=http://127.0.0.1:89xx node …   — dùng server đang chạy (cổng riêng) thay vì dựng server.js trong tiến trình
import { launchChrome, startServer, sleep } from "../prototype/games/_shared/test/cdp.mjs";

const LONG_B = "Nguyễn Ngọc Ánh"; // 15 ký tự — vừa giới hạn 16, dài hơn chỗ một dòng trên thẻ 360 px
const GAMES = {
  "co-caro": { create: ["#createBtn", "#createRoomBtn"], mover: "auto", finish: "caro", expire: true, away: true },
  "co-vua": { create: ["#createBtn"], finish: "resign" },
  "co-tuong": { create: ["#createBtn"], finish: "resign" },
  "o-an-quan": { create: ["#createBtn", "#createRoomBtn"], finish: "oaq", away: true },
};

const visibleSmall = `(() => { const out = [];
  for (const el of document.querySelectorAll("button, .btn, .bar a, summary, [role=button]")) {
    if (el.closest("dialog") || el.closest("[hidden]")) continue;
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (!r.width || !r.height || cs.visibility === "hidden" || cs.display === "none") continue;
    if (r.bottom < 0 || r.top > innerHeight + 2000) continue;
    if (r.height < 43.5) out.push((el.id || el.className || el.tagName) + ":" + Math.round(r.height));
  } return out; })()`;

async function check44(t, label, errs) {
  const bad = await t.ev(visibleSmall);
  if (bad.length) errs.push(`${label}: nút thấp hơn 44 px: ${bad.slice(0, 6).join(", ")}`);
}

async function run(game, chrome, base) {
  const G = GAMES[game], url = `${base}/games/${game}/`, errs = [], notes = [];
  const A = await chrome.newTab("A", 360, 740, true, await chrome.newContext());
  const ctxB = await chrome.newContext();
  let B = await chrome.newTab("B", 1280, 800, false, ctxB);
  await A.go(url); await B.go(url);
  await A.ev(`window.confirm = () => { window.__nativeConfirm = true; return true; }`);
  await check44(A, "A màn đầu (360×740)", errs);

  // BRD-08: bộ đếm ký tự + chặn tên quá 16
  await A.ev(`(() => { const i = document.getElementById("nameIn"); i.value = "Tên Này Dài Quá Mười Sáu Chữ"; i.dispatchEvent(new Event("input")); })()`);
  const cnt = await A.ev(`document.getElementById("nameCount").textContent + "|" + document.getElementById("nameCount").classList.contains("over")`);
  if (!/^28\/16.*\|true$/.test(cnt)) errs.push("bộ đếm tên: " + cnt);
  await A.click(G.create[0]);
  await A.waitFor(`/Tên tối đa 16 ký tự/.test(document.getElementById("mErr").textContent)`, 3000).catch(() => errs.push("tên quá 16: không báo lỗi"));
  if (await A.ev(`!!(window.__game && window.__game.room)`)) errs.push("tên quá 16 mà vẫn tạo phòng");
  await A.ev(`(() => { const i = document.getElementById("nameIn"); i.value = "An"; i.dispatchEvent(new Event("input")); })()`);
  for (const sel of G.create) { await A.click(sel); await sleep(150); }
  await A.waitFor(`!!(window.__game.room && window.__game.room.code)`);
  const code = await A.ev(`window.__game.room.code`);
  await B.go(url + "?room=" + code);
  await B.ev(`(() => { const i = document.getElementById("nameIn"); i.value = ${JSON.stringify(LONG_B)}; i.dispatchEvent(new Event("input")); })()`);
  await B.click("#joinBtn");
  await A.waitFor(`window.__game.room.players.length === 2`);
  await sleep(300);
  await check44(A, "A phòng chờ", errs);
  await A.click("#rStart");
  await A.waitFor(`window.__game.room.phase === "play"`); await B.waitFor(`window.__game.room && window.__game.room.phase === "play"`);
  await sleep(500);

  // BRD-08: tên B đọc được trên thẻ của A (360 px), thẻ A có nhãn "Bạn"
  const hud = await A.ev(`(() => {
    const names = [...document.querySelectorAll(".hud .pl .who b")], me = document.querySelector(".hud .pl .who small .me");
    const nb = names.find((b) => b.textContent.includes(${JSON.stringify(LONG_B.slice(0, 6))}));
    return { full: !!nb && nb.scrollHeight <= nb.clientHeight + 2 && nb.scrollWidth <= nb.clientWidth + 2, nb: nb ? nb.textContent : null,
      me: !!me && me.offsetHeight > 0 && getComputedStyle(me).display !== "none" && me.textContent === "Bạn" };
  })()`);
  if (!hud.full) errs.push("tên B bị cắt trên thẻ 360 px: " + JSON.stringify(hud) + (process.env.DEBUG ? await A.ev(`(() => { const b = [...document.querySelectorAll(".hud .pl .who b")][1]; const cs = getComputedStyle(b); return JSON.stringify([b.scrollHeight, b.clientHeight, b.scrollWidth, b.clientWidth, cs.display, cs.webkitLineClamp, cs.whiteSpace]); })()`) : ""));
  if (!hud.me) errs.push("thẻ của A không có nhãn \"Bạn\" ở 360 px");
  await check44(A, "A trong ván (360×740)", errs);
  await A.cmd("Emulation.setDeviceMetricsOverride", { width: 740, height: 360, deviceScaleFactor: 1, mobile: true }); await sleep(400);
  await check44(A, "A trong ván (ngang 740×360)", errs);
  await A.cmd("Emulation.setDeviceMetricsOverride", { width: 360, height: 740, deviceScaleFactor: 1, mobile: true }); await sleep(300);

  // BRD-11: Rời ván ⇒ hộp pixel; "Thôi" ⇒ vẫn trong ván
  await A.click("#menuBtn"); await sleep(200);
  await A.click("#menuBtnP");
  await A.waitFor(`!!document.querySelector("dialog.pxc[open]")`, 3000).catch(() => errs.push("Rời ván: không hiện hộp pixel"));
  await A.click('[data-pxc="cancel"]'); await sleep(300);
  if (await A.ev(`!window.__game.room || window.__game.room.phase !== "play"`)) errs.push("bấm Thôi mà vẫn rời ván");
  await A.ev(`document.getElementById("resumeBtn") && !document.getElementById("ovPause").hidden && document.getElementById("resumeBtn").click()`);

  // A đi một nước (để tới lượt B) — Caro: A cầm X đi trước
  const myTurn = {
    "co-caro": `window.__game.room.game.turn === window.__game.room.you + 1`,
    "co-vua": `(window.__game.state.turn === "w") === (window.__game.room.game.white === window.__game.room.you)`,
    "co-tuong": `window.__game.mySide === window.__game.state.turn`,
    "o-an-quan": `window.__game.canAct`,
  }[game];
  const playOne = {
    "co-caro": (k) => `window.__game.place(7, ${k})`,
    "o-an-quan": () => `(() => { const m = window.__game.legal()[0]; return window.__game.sow(m[0], m[1]); })()`,
  }[game];

  // BRD-10: B đóng tab ⇒ A thấy "mất kết nối" ngay
  if (G.away) {
    await A.waitFor(myTurn, 8000);
    await A.ev(playOne(0)); await sleep(300);
    if (game === "o-an-quan") await A.waitFor(`!window.__game.busy`, 15000).catch(() => {});
  }
  await B.closeTab();
  await A.waitFor(`!!document.querySelector(".hud .pl.away .who small .off")`, 6000).catch(async () => errs.push("không có nhãn \"mất kết nối\" trên thẻ đối thủ" + (process.env.DEBUG ? await A.ev(`document.querySelector(".hud").outerHTML.slice(0, 900) + JSON.stringify(window.__game.room.players)`) : "")));
  await A.waitFor(`/mất kết nối/.test(document.getElementById("toast").textContent) && !document.getElementById("toast").hidden`, 3000).catch(() => errs.push("không có toast đối thủ mất kết nối"));
  if (G.away) { // tới lượt B đang mất kết nối ⇒ 15 s sau máy chủ đi thay
    await A.waitFor(`/máy (đánh|đi) thay/.test(document.getElementById("toast").textContent) && !document.getElementById("toast").hidden`, 25000)
      .then(() => notes.push("toast máy đi thay"), () => errs.push("không có toast máy đi thay khi đối thủ mất kết nối"));
  }
  B = await chrome.newTab("B", 1280, 800, false, ctxB);
  await B.go(url + "?room=" + code);
  await B.waitFor(`window.__game.room && window.__game.room.phase === "play"`, 10000).catch(() => errs.push("B mở lại link không vào lại được ghế"));
  await A.waitFor(`/đã quay lại/.test(document.getElementById("toast").textContent)`, 5000).catch(() => errs.push("không có toast đối thủ đã quay lại"));
  await A.waitFor(`!document.querySelector(".hud .pl.away")`, 3000).catch(() => errs.push("nhãn mất kết nối không tắt khi B quay lại"));
  await B.ev(`window.confirm = () => { window.__nativeConfirm = true; return true; }`);

  // Kết thúc ván 1
  async function finish() {
    if (G.finish === "resign") {
      await B.click("#resignBtn");
      await B.waitFor(`!!document.querySelector("dialog.pxc[open]")`, 3000);
      await B.click('[data-pxc="ok"]');
    } else if (G.finish === "caro") {
      const k = [0, 0];
      for (let n = 0; n < 40; n++) {
        if (await A.ev(`window.__game.room.phase !== "play"`)) break;
        const aTurn = await A.ev(`window.__game.room.game.turn === window.__game.room.you + 1`);
        const t = aTurn ? A : B, row = aTurn ? 7 : 9, c = aTurn ? k[0]++ : k[1]++;
        // ô đã có quân (nước máy đi thay) ⇒ đi ô kế tiếp
        await t.ev(`(() => { const g = window.__game; let c = ${c}; while (c < 15 && g.state.board[${row} * g.state.size + c]) c++; return g.place(${row}, c); })()`);
        await sleep(250);
      }
    } else { // Ô Ăn Quan: ai tới lượt thì rải ô hợp lệ đầu tiên, bỏ qua hoạt cảnh
      for (let n = 0; n < 400; n++) {
        if (await A.ev(`window.__game.room.phase !== "play"`)) break;
        for (const t of [A, B]) await t.ev(`(() => { const g = window.__game; g.skip(); if (g.canAct) { const m = g.legal()[0]; if (m) g.sow(m[0], m[1]); } })()`);
        await sleep(120);
      }
    }
    await A.waitFor(`window.__game.room.phase === "over"`, 20000);
    await A.waitFor(`!document.getElementById("ovEnd").hidden`, 6000); await B.waitFor(`!document.getElementById("ovEnd").hidden`, 6000);
  }
  await finish();
  await check44(A, "A thẻ kết quả", errs);
  const gid1 = await A.ev(`window.__game.room.gid`);

  // BRD-09: B bấm Ván tiếp ⇒ thẻ của A vẫn mở + thấy lời mời + đếm ngược
  await B.click("#nextBtn");
  await A.waitFor(`/Đối thủ muốn chơi tiếp · ván mới sau \\d+ giây/.test(document.getElementById("eAgain").textContent)`, 3000).catch(() => errs.push("A không thấy \"Đối thủ muốn chơi tiếp\" + đếm ngược"));
  await B.waitFor(`/Đã sẵn sàng — chờ đối thủ/.test(document.getElementById("eAgain").textContent) && document.getElementById("nextBtn").disabled`, 3000).catch(() => errs.push("B không thấy \"Đã sẵn sàng — chờ đối thủ\""));
  await sleep(2000);
  if (await A.ev(`document.getElementById("ovEnd").hidden || window.__game.room.gid !== ${gid1}`)) errs.push("thẻ kết quả của A tự đóng / ván mới mở khi mới 1 người bấm");
  if (await A.ev(`document.getElementById("nextBtn").textContent`) !== "Chơi tiếp ngay ▶") errs.push("nút của A chưa đổi thành \"Chơi tiếp ngay\"");
  // A vẫn bấm Khoe kết quả được (không lỗi, thẻ còn đó)
  await A.click("#shareBtn"); await sleep(1500);
  await A.ev(`(() => { const x = [...document.querySelectorAll("button")].find((b) => /^(Đóng|×|✕)$/.test(b.textContent.trim()) && b.offsetParent); if (x) x.click(); })()`); await sleep(300);
  if (G.expire) {
    await A.waitFor(`window.__game.room.gid !== ${gid1} && window.__game.room.phase === "play"`, 14000).then(() => notes.push("hết 10 s tự mở ván"), () => errs.push("hết 10 s mà không tự mở ván mới"));
    await B.waitFor(`window.__game.room.gid !== ${gid1}`, 3000).catch(() => errs.push("B không vào ván mới"));
  } else {
    await A.click("#nextBtn");
    await A.waitFor(`window.__game.room.gid !== ${gid1} && window.__game.room.phase === "play"`, 3000).catch(() => errs.push("cả hai bấm mà không mở ván ngay"));
    await B.waitFor(`window.__game.room.gid !== ${gid1}`, 3000).catch(() => errs.push("B không vào ván mới"));
  }
  if (!(await A.ev(`document.getElementById("ovEnd").hidden`))) errs.push("ván mới mà thẻ kết quả của A chưa đóng");

  if (await A.ev(`!!window.__nativeConfirm`) || await B.ev(`!!window.__nativeConfirm`)) errs.push("có gọi confirm() của trình duyệt");
  const jsErr = [...A.errors, ...B.errors].filter((e) => !/WebSocket|ERR_CONNECTION|net::/.test(e));
  if (jsErr.length) errs.push("lỗi JS: " + jsErr.slice(0, 3).join(" | "));
  await A.closeTab(); await B.closeTab();
  if (errs.length) throw new Error(errs.join("\n   "));
  return { game, code, notes };
}

const games = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(GAMES);
let srv = null, base = process.env.BASE;
if (!base) { srv = await startServer(); base = srv.base; }
const chrome = await launchChrome();
let fail = 0;
try {
  for (const g of games) {
    const t0 = Date.now();
    try { console.log("ĐẠT", JSON.stringify(await run(g, chrome, base)), Math.round((Date.now() - t0) / 1000) + "s"); }
    catch (e) { fail++; console.log("TRƯỢT", g, "\n   " + e.message); }
  }
} finally { chrome.close(); if (srv) srv.server.close(); }
console.log(fail ? `${fail} game trượt` : "Tất cả đạt");
process.exit(fail ? 1 : 0);
