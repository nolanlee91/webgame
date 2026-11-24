// E2E module chia sẻ trên Chrome headless thật (server.js thật):
//  - makeCard tạo Blob PNG 1080×1080 cho vài game, lưu ảnh để soi; makeBanner ra 1200×630.
//  - Trang chủ: footer cộng đồng ẩn khi community.js rỗng, hiện đúng nút khi có link.
//  - Ô Ăn Quan (thắng máy) và Tiệm Trà Sữa (chốt ca) ở 1366×768 và 390×844 (điện thoại):
//    bấm "Khoe kết quả" (elementFromPoint không bị che) ⇒ ra ảnh + bảng chia sẻ đúng nút, bảng nằm trong màn hình,
//    điện thoại gọi navigator.share với tệp PNG + link ?ref=share, bị từ chối thì rơi về bảng (có Messenger),
//    Zalo chép link + hướng dẫn, dòng "Vào nhóm Lụm Kèo" chỉ hiện khi có link cộng đồng, Esc đóng bảng.
// Chạy: node prototype/games/_shared/test/share-e2e.mjs [thư mục ảnh]
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { startServer, launchChrome, blobFromPage, sleep } from "./cdp.mjs";

const OUT = process.argv[2] || join(tmpdir(), "lk-share-shots");
mkdirSync(OUT, { recursive: true });
let fails = 0, passes = 0;
const ok = (c, msg) => { console.log(`${c ? "PASS" : "FAIL"} ${msg}`); c ? passes++ : fails++; };

const { server, base } = await startServer();
const chrome = await launchChrome();
const IPHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
// community.js gán window.COMMUNITY = {...}; móc này ghép thêm link giả để thử nhánh "có link".
const FAKE_COMMUNITY = `(() => { let v; Object.defineProperty(window, "COMMUNITY", { configurable: true,
  get: () => v, set: (x) => { v = Object.assign({}, x, { facebookGroup: "https://www.facebook.com/groups/lumkeo-test", zalo: "https://zalo.me/g/test" }); } }); })();`;

async function tab(name, w, h, mobile, { community = false } = {}) {
  const t = await chrome.newTab(name, w, h, mobile);
  if (mobile) await t.cmd("Emulation.setUserAgentOverride", { userAgent: IPHONE_UA, platform: "iPhone" });
  if (community) await t.cmd("Page.addScriptToEvaluateOnNewDocument", { source: FAKE_COMMUNITY });
  return t;
}

try {
  // ── 1. Tạo ảnh ──
  {
    const t = await tab("card", 1366, 768, false);
    await t.go(`${base}/homepage/`);
    const samples = {
      "o-an-quan": { game: "o-an-quan", title: "Thắng máy 45–25", lines: ["Mức máy: Khó", "Quan ăn được: 1 – 1", "Số nước: 31"], tagline: "Máy xin thua, hẹn ván sau phục thù!", theme: "wood" },
      "tiem-tra-sua": { game: "tiem-tra-sua", title: "Ngày 5 lãi 1.250.000đ", lines: ["Doanh thu: 2.100.000đ", "Ly bán: 42", "Sao trung bình: 4,8★", "Cấp tiệm: 4"], tagline: "Chủ tiệm trà sữa tương lai là đây chứ đâu!", accent: "#75d1bf" },
      "ran-san-moi": { game: "ran-san-moi", title: "Kỷ lục mới 128 điểm", lines: ["Độ dài: 34 khúc", "Mồi đã ăn: 30"], tagline: "Nokia 1280 cũng phải nể." },
    };
    for (const [k, o] of Object.entries(samples)) {
      const r = await blobFromPage(t, `import("/games/_shared/share.js").then((m) => m.makeCard(${JSON.stringify(o)}))`);
      writeFileSync(join(OUT, `card-${k}.png`), r.buf);
      ok(r.type === "image/png" && r.w === 1080 && r.h === 1080 && r.size > 50000, `makeCard ${k}: Blob PNG ${r.w}×${r.h} ${(r.size / 1024) | 0} KB`);
    }
    const b = await blobFromPage(t, `import("/games/_shared/share.js").then((m) => m.makeBanner({ game: "co-caro", type: "image/jpeg", quality: 0.9 }))`);
    ok(b.type === "image/jpeg" && b.w === 1200 && b.h === 630, `makeBanner: ${b.type} ${b.w}×${b.h}`);
    ok(!t.errors.length, `không lỗi JS khi tạo ảnh ${t.errors.join(" | ")}`);
    t.close();
  }

  // ── 2. Trang chủ: footer cộng đồng + thẻ OG ──
  {
    const t = await tab("home", 1366, 768, false);
    await t.go(`${base}/homepage/`);
    ok(await t.ev(`document.getElementById("community").hidden && !document.querySelector("#community a")`), "trang chủ: community.js rỗng ⇒ không hiện nút cộng đồng");
    const og = await t.ev(`({ img: document.querySelector('meta[property="og:image"]')?.content, card: document.querySelector('meta[name="twitter:card"]')?.content,
      site: document.querySelector('meta[property="og:site_name"]')?.content, n: document.querySelectorAll('meta[name="description"]').length })`);
    ok(og.img?.endsWith("/homepage/assets/og/home.jpg") && og.card === "summary_large_image" && og.site === "Lụm Kèo" && og.n === 1, `trang chủ: thẻ OG đủ (${og.img})`);
    const img = await fetch(`${base}/homepage/assets/og/home.jpg`);
    ok(img.status === 200 && img.headers.get("content-type") === "image/jpeg", `server.js phục vụ ảnh OG đúng content-type (${img.headers.get("content-type")})`);
    const wp = await fetch(`${base}/homepage/assets/thumbs/o-an-quan.webp`);
    ok(wp.headers.get("content-type") === "image/webp", "server.js phục vụ thumbnail webp đúng content-type");
    t.close();
    const t2 = await tab("home-comm", 390, 844, true, { community: true });
    await t2.go(`${base}/homepage/`);
    const links = await t2.ev(`[...document.querySelectorAll("#community a")].map((a) => a.dataset.comm + "=" + a.href)`);
    ok(links.length === 2 && links[0].startsWith("facebookGroup=https://www.facebook.com/groups/") && links[1].startsWith("zalo="), `trang chủ: có link ⇒ hiện đúng 2 nút (${links.join(", ")})`);
    ok(await t2.ev(`document.documentElement.scrollWidth <= innerWidth`), "trang chủ 390: không tràn ngang khi có nút cộng đồng");
    await t2.ev(`document.getElementById("community").scrollIntoView({ block: "center" })`); await sleep(200);
    await t2.shot(join(OUT, "home-footer-community-390.png"));
    t2.close();
  }

  // ── 3. Trong game ──
  const reach = {
    // Ô Ăn Quan: ghi một ván dở với máy (còn 1 nước là thắng) vào bản lưu, tải lại, "Chơi tiếp", đi nước thắng.
    async "o-an-quan"(t) {
      await t.go(`${base}/games/o-an-quan/`);
      const fin = await t.ev(`(async () => {
        const L = await import(new URL("logic.js", location.href).href);
        let r = 7; const rnd = (n) => (r = (r * 1103515245 + 12345) & 0x7fffffff) % n;
        for (let g = 0; g < 500; g++) {
          let s = L.newMatch({ mode: "ai", aiLevel: "easy", rule: "thuong", first: 0 });
          while (!L.isOver(s)) {
            const ms = L.legalMoves(s);
            if (s.turn === 0 && s.moves.length) {
              const fin = ms.find(([p, d]) => { const n = L.play(s, p, d); return n && L.isOver(n) && n.winner === 0; });
              if (fin) { localStorage.setItem("wgp.o-an-quan.v1", JSON.stringify({ v: 1, opts: { aiLevel: "easy", rule: "thuong", size: 2 }, game: { quanNon: false, aiLevel: "easy", first: 0, round: 1, tally: [0, 0, 0], moves: s.moves } })); return fin; }
            }
            const m = ms[rnd(ms.length)]; s = L.play(s, m[0], m[1]);
          }
        }
        return null; })()`);
      if (!fin) throw new Error("không dựng được ván sắp thắng");
      await t.go(`${base}/games/o-an-quan/`);
      await t.waitFor(`typeof __game === "object"`);
      await t.ev(`document.getElementById("resumeGameBtn").click()`);
      await t.waitFor(`__game.canAct`);
      await t.ev(`__game.sow(${fin[0]}, ${JSON.stringify(fin[1])}); __game.skip()`);
      await t.waitFor(`!document.getElementById("ovEnd").hidden`);
      await sleep(400);
      return "#shareBtn";
    },
    // Tiệm Trà Sữa: chạy tua một ca tới bảng Chốt ca.
    async "tiem-tra-sua"(t) {
      await t.go(`${base}/games/tiem-tra-sua/?calm=1`);
      const ov = await t.ev(`(async()=>{const w=(ms)=>new Promise(r=>setTimeout(r,ms));for(let i=0;i<150&&!window.__game;i++)await w(100);const g=__game;if(g.overlay==='summary')return 'summary';if(!g.state.shift){g.act({type:'seeIntro'});g.act({type:'restockToday'});const r=g.act({type:'startShift'});if(r.err){if(g.state.lastSummary){g.showSummary();return g.overlay}return 'start:'+r.err}}for(let i=0;i<400&&g.state.shift;i++){const d=g.state.shift.dialog;if(d)g.act({type:'resolve',choice:(d.options||[])[0]?.id});g.advance(5000)}for(let i=0;i<50&&g.overlay!=='summary';i++)await w(100);return g.overlay})()`);
      if (ov !== "summary") throw new Error(`không tới được bảng chốt ca (${ov})`);
      await sleep(400);
      return "#shareBtn";
    },
  };

  for (const game of Object.keys(reach)) {
    for (const [w, h, mobile] of [[1366, 768, false], [390, 844, true]]) {
      const tag = `${game} ${w}×${h}`;
      const t = await tab(`${game}-${w}`, w, h, mobile, { community: mobile });
      try {
        const sel = await reach[game](t);
        // điện thoại: thay navigator.share bằng bản ghi lại tham số rồi từ chối (như khi mất "cú bấm") ⇒ phải rơi về bảng
        if (mobile) await t.ev(`window.__shareCalls = []; navigator.canShare = () => true;
          navigator.share = (d) => { __shareCalls.push({ n: d.files?.length, type: d.files?.[0]?.type, size: d.files?.[0]?.size, url: d.url, text: d.text }); return Promise.reject(new DOMException("không có cú bấm", "NotAllowedError")); };`);
        await t.shot(join(OUT, `${game}-${w}-ket-thuc.png`));
        const free = await t.click(sel, { touch: mobile });
        ok(free, `${tag}: nút "Khoe kết quả" (${sel}) nằm trong màn hình, không bị che`);
        await t.waitFor(`document.querySelector(".lk-share .lk-share__img")?.naturalWidth === 1080`, 15000);
        await sleep(250);
        await t.shot(join(OUT, `${game}-${w}-bang-chia-se.png`));
        const p = await t.ev(`(() => { const box = document.querySelector(".lk-share__box").getBoundingClientRect();
          const acts = [...document.querySelectorAll(".lk-share [data-act]")].map((b) => b.dataset.act);
          const covered = [...document.querySelectorAll(".lk-share [data-act]")].filter((b) => { const r = b.getBoundingClientRect(); b.scrollIntoView({ block: "nearest" });
            const q = b.getBoundingClientRect(); const el = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); return !(el === b || b.contains(el)); }).map((b) => b.dataset.act);
          return { acts, covered, inView: box.left >= 0 && box.right <= innerWidth && box.top >= 0, game: document.querySelector(".lk-share").dataset.game,
            alt: document.querySelector(".lk-share__img").alt, comm: document.querySelector(".lk-share__comm").hidden, hscroll: document.documentElement.scrollWidth > innerWidth }; })()`);
        ok(p.game === game, `${tag}: bảng chia sẻ của đúng game (${p.alt})`);
        const want = ["close", "download", "copy", "facebook", "zalo"];
        ok(want.every((a) => p.acts.includes(a)), `${tag}: đủ nút Tải ảnh · Chép link · Facebook · Zalo (${p.acts.join(",")})`);
        ok(mobile ? p.acts.includes("messenger") : !p.acts.includes("messenger"), `${tag}: Messenger ${mobile ? "có" : "ẩn"} trên ${mobile ? "điện thoại" : "máy tính"}`);
        ok(p.inView && !p.covered.length && !p.hscroll, `${tag}: bảng nằm trong màn hình, không nút nào bị che ${p.covered.join(",")}`);
        if (mobile) {
          const calls = await t.ev(`__shareCalls`);
          ok(calls.length === 1 && calls[0].n === 1 && calls[0].type === "image/png" && calls[0].size > 50000 && /\?ref=share&g=/.test(calls[0].url),
            `${tag}: điện thoại gọi navigator.share với 1 ảnh PNG + link ?ref=share (${calls[0]?.url})`);
        }
        ok(p.comm === true, `${tag}: chưa chia sẻ thì chưa hiện dòng "Vào nhóm"`);
        await t.click(".lk-share [data-act=zalo]", { touch: mobile });
        await sleep(300);
        const after = await t.ev(`({ msg: document.querySelector(".lk-share__msg").textContent, comm: !document.querySelector(".lk-share__comm").hidden,
          links: [...document.querySelectorAll(".lk-share__comm a")].map((a) => a.dataset.comm) })`);
        ok(/Zalo/.test(after.msg), `${tag}: bấm Zalo ⇒ chép link + hướng dẫn ("${after.msg}")`);
        ok(mobile ? after.comm && after.links.join() === "facebookGroup,zalo" : !after.comm,
          `${tag}: dòng "Vào nhóm Lụm Kèo" ${mobile ? "hiện (có link giả)" : "ẩn (community.js rỗng)"} sau khi chia sẻ`);
        await t.shot(join(OUT, `${game}-${w}-sau-zalo.png`));
        await t.cmd("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
        await t.cmd("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
        await sleep(200);
        ok(await t.ev(`!document.querySelector(".lk-share")`), `${tag}: Esc đóng bảng`);
        ok(!t.errors.length, `${tag}: không lỗi JS ${t.errors.join(" | ")}`);
      } catch (e) { ok(false, `${tag}: ${e.message}`); }
      t.close();
    }
  }
} finally {
  chrome.close();
  server.close();
}
console.log(`\n${passes}/${passes + fails} đạt — ảnh ở ${OUT}`);
process.exit(fails ? 1 : 0);
