// E2E trình duyệt thật (2 hồ sơ = 2 người): chủ phòng "Mời ra" (Đợt 3 — D3-online) + tên dùng chung giữa các game.
//   node prototype/games/_shared/test/kick-e2e.mjs [co-caro ma-soi co-ca-ngua]
//   BASE=http://127.0.0.1:89xx node …   — dùng server đang chạy thay vì tự dựng server.js trong tiến trình
//   SHOTS=<thư mục>                     — lưu ảnh hộp xác nhận + màn người bị mời ra
// Mỗi game: A tạo phòng, B vào bằng link mời ⇒ A thấy nút "Mời ra" cạnh tên B (B thì không thấy nút nào) ⇒ bấm ⇒ hộp xác nhận
// pixel (không phải confirm()) ⇒ "Thôi" thì không có gì xảy ra ⇒ bấm lại, "Mời ra" ⇒ B về màn đầu với lời báo
// "Chủ phòng đã mời bạn ra", ghế đã lưu của B bị xoá; B mở lại link mời và vào lại ⇒ bị từ chối (10 phút); A còn 1 người.
// Cuối cùng: tên dùng chung — đặt tên ở Cờ Caro ⇒ Ma Sói / Nối Từ điền sẵn; tên cũ riêng của game (Cờ Vua) được chuyển sang
// tài khoản một lần ⇒ Đặt Bom điền sẵn tên đó.
import { launchChrome, startServer, sleep } from "./cdp.mjs";
import { join } from "node:path";

const KICKED = "Chủ phòng đã mời bạn ra";
const GAMES = {
  "co-caro": {
    async create(t) { await t.ev(`document.getElementById("nameIn").value = "An"`); await t.click("#createBtn"); await t.click("#createRoomBtn"); },
    code: `window.__game && window.__game.room && window.__game.room.code`,
    count: `(window.__game.room ? window.__game.room.players.length : 0)`,
    async join(t) { await t.ev(`document.getElementById("nameIn").value = "Binh"`); await t.click("#joinBtn"); },
    invite: (code) => `?room=${code}`,
    seatKey: "wgp.caro.seat",
  },
  "co-ca-ngua": {
    async create(t) { await t.ev(`document.getElementById("cnName").value = "An"`); await t.click('[data-e="create"]'); },
    code: `window.__game && window.__game.room && window.__game.room.code`,
    count: `(window.__game && window.__game.room ? window.__game.room.players.length : 0)`,
    async join(t) { await t.ev(`document.getElementById("cnName").value = "Binh"`); await t.click('[data-e="join"]'); },
    invite: (code) => `?room=${code}`,
    seatKey: "wgp.co-ca-ngua.seat",
  },
  "ma-soi": {
    async create(t) { await t.ev(`document.getElementById("nameInp").value = "An"`); await t.click("#createBtn"); },
    code: `!document.getElementById("game").hidden && new URLSearchParams(location.search).get("p")`,
    count: `document.querySelectorAll("#plist li.prow:not(.prow--empty)").length`,
    async join(t) { await t.ev(`document.getElementById("nameInp").value = "Binh"`); await t.click("#joinBtn"); },
    invite: (code) => `?p=${code}`,
    seatKey: "ma-soi:sess",
  },
};

async function run(game, chrome, base) {
  const G = GAMES[game], url = `${base}/games/${game}/`;
  const A = await chrome.newTab("A", 1366, 900, false, await chrome.newContext());
  const ctxB = await chrome.newContext();
  const B = await chrome.newTab("B", 1366, 900, false, ctxB);
  await A.go(url); await G.create(A);
  await A.waitFor(G.code);
  const code = await A.ev(G.code);
  await B.go(url + G.invite(code)); await G.join(B);
  await A.waitFor(`${G.count} === 2`);
  await B.waitFor(`${G.count} === 2`);
  await sleep(300);
  if (await B.ev(`!!document.querySelector("[data-pxkick]")`)) throw new Error(`${game}: khách cũng thấy nút Mời ra`);
  await A.waitFor(`!!document.querySelector("[data-pxkick]")`);
  if (await A.ev(`document.querySelectorAll("[data-pxkick]").length`) !== 1) throw new Error(`${game}: chủ phòng phải thấy đúng 1 nút (cạnh B, không cạnh mình)`);
  await A.ev(`window.confirm = () => { window.__nativeConfirm = true; return true; }`);

  // (1) Thôi ⇒ không có gì xảy ra
  if (!(await A.click("[data-pxkick]"))) throw new Error(`${game}: nút Mời ra bị che`);
  await A.waitFor(`!!document.querySelector("dialog.pxc[open]")`);
  if (process.env.SHOTS) await A.shot(join(process.env.SHOTS, `kick-confirm-${game}.png`));
  await A.click('[data-pxc="cancel"]');
  await A.waitFor(`!document.querySelector("dialog.pxc")`);
  await sleep(500);
  if (await A.ev(G.count) !== 2) throw new Error(`${game}: bấm Thôi mà vẫn mời ra`);

  // (2) Mời ra ⇒ B về màn đầu với lời báo nhẹ nhàng, ghế lưu bị xoá
  await A.click("[data-pxkick]");
  await A.waitFor(`!!document.querySelector("dialog.pxc[open]")`);
  await A.click('[data-pxc="ok"]');
  await B.waitFor(`document.body.innerText.includes(${JSON.stringify(KICKED)})`);
  await A.waitFor(`${G.count} === 1`);
  if (await A.ev(`!!window.__nativeConfirm`)) throw new Error(`${game}: dùng confirm() của trình duyệt`);
  const kept = await B.ev(`Object.keys(localStorage).filter((k) => k.startsWith(${JSON.stringify(G.seatKey)})).length + (sessionStorage.getItem(${JSON.stringify(G.seatKey)}) ? 1 : 0)`);
  if (kept) throw new Error(`${game}: ghế đã lưu của người bị mời ra chưa bị xoá`);
  if (process.env.SHOTS) await B.shot(join(process.env.SHOTS, `kick-kicked-${game}.png`));

  // (3) B mở lại link mời, vào lại ⇒ bị chặn 10 phút (theo phiên trình duyệt)
  await B.go(url + G.invite(code)); await G.join(B);
  await B.waitFor(`document.body.innerText.includes("10 phút")`);
  await sleep(300);
  if (await A.ev(G.count) !== 1) throw new Error(`${game}: người bị mời ra vào lại được`);
  const errs = [...A.errors, ...B.errors];
  if (errs.length) throw new Error(`${game}: lỗi JS: ${errs.slice(0, 3).join(" | ")}`);
  await A.closeTab(); await B.closeTab();
  return { game, code, kicked: true, rejoinBlocked: true, cancelKeeps: true };
}

async function sharedNames(chrome, base) {
  const ctx = await chrome.newContext();
  const T = await chrome.newTab("N", 1366, 900, false, ctx);
  // (a) tên gõ ở Cờ Caro (bấm Tạo phòng ⇒ lưu vào tài khoản) ⇒ Ma Sói, Nối Từ, Cờ Cá Ngựa điền sẵn
  await T.go(`${base}/games/co-caro/`);
  await T.ev(`document.getElementById("nameIn").value = "Mèo Mập 42"`);
  await T.click("#createBtn");
  await sleep(300);
  const got = {};
  await T.go(`${base}/games/ma-soi/`); got["ma-soi"] = await T.ev(`document.getElementById("nameInp").value`);
  await T.go(`${base}/games/noi-tu/`); await T.waitFor(`!!document.getElementById("oName")`); got["noi-tu"] = await T.ev(`document.getElementById("oName").value`);
  await T.go(`${base}/games/co-ca-ngua/`); await T.waitFor(`!!document.getElementById("cnName")`); got["co-ca-ngua"] = await T.ev(`document.getElementById("cnName").value`);
  for (const [g, v] of Object.entries(got)) if (v !== "Mèo Mập 42") throw new Error(`tên dùng chung: ${g} điền "${v}"`);
  // (b) đổi tên ở Ma Sói ⇒ Cờ Caro đổi theo
  await T.go(`${base}/games/ma-soi/`);
  await T.ev(`document.getElementById("nameInp").value = "Heo Cute 15"`);
  await T.click("#createBtn"); await T.waitFor(`!document.getElementById("game").hidden`);
  await T.go(`${base}/games/co-caro/`);
  const caro = await T.ev(`document.getElementById("nameIn").value`);
  if (caro !== "Heo Cute 15") throw new Error(`đổi tên ở Ma Sói ⇒ Caro vẫn "${caro}"`);
  await T.closeTab();

  // (c) người cũ: tên riêng của Cờ Vua, tài khoản chưa có tên ⇒ chuyển sang tài khoản ⇒ Đặt Bom điền sẵn; khoá cũ còn nguyên
  const T2 = await chrome.newTab("M", 1366, 900, false, await chrome.newContext());
  await T2.go(`${base}/games/co-vua/`);
  await T2.ev(`localStorage.setItem("wgp.covua.name", "Tí Cũ"); localStorage.removeItem("wgp.names.migrated"); localStorage.removeItem("wgp.account.v1")`);
  await T2.go(`${base}/games/co-vua/`);
  const vua = await T2.ev(`document.getElementById("nameIn").value`);
  await T2.go(`${base}/games/dat-bom/`);
  const bom = await T2.ev(`document.getElementById("nameInp").value`);
  const old = await T2.ev(`localStorage.getItem("wgp.covua.name")`);
  if (vua !== "Tí Cũ" || bom !== "Tí Cũ" || old !== "Tí Cũ") throw new Error(`chuyển tên cũ: vua="${vua}" bom="${bom}" khoá cũ="${old}"`);
  const errs = [...T2.errors];
  if (errs.length) throw new Error(`lỗi JS: ${errs.slice(0, 3).join(" | ")}`);
  await T2.closeTab();
  return { sharedName: got, renameFollows: caro, migrated: bom };
}

const games = process.argv.slice(2).length ? process.argv.slice(2) : ["co-caro", "ma-soi", "co-ca-ngua"];
let srv = null, base = process.env.BASE;
if (!base) { srv = await startServer(); base = srv.base; }
const chrome = await launchChrome();
let fail = 0;
try {
  for (const g of games) {
    try { console.log("ĐẠT", JSON.stringify(await run(g, chrome, base))); }
    catch (e) { fail++; console.log("TRƯỢT", g, e.message); }
  }
  try { console.log("ĐẠT", JSON.stringify(await sharedNames(chrome, base))); }
  catch (e) { fail++; console.log("TRƯỢT tên dùng chung", e.message); }
} finally { chrome.close(); if (srv) srv.server.close(); }
console.log(fail ? `${fail} mục trượt` : "Tất cả đạt");
process.exit(fail ? 1 : 0);
