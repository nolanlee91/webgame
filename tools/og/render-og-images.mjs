#!/usr/bin/env node
// Vẽ ảnh xem trước link 1200×630 (JPG — Facebook/Zalo nhận chắc chắn, webp thì không chắc) cho trang chủ và từng game,
// bằng chính hàm makeBanner() của prototype/games/_shared/share.js chạy trong Chrome/Edge headless.
// Ra: prototype/homepage/assets/og/<id>.jpg. Sau đó chạy `node tools/og/gen-og.mjs` để thẻ og:image trỏ vào ảnh mới.
//   node tools/og/render-og-images.mjs              # mọi game trong games-meta.js + trang chủ
//   node tools/og/render-og-images.mjs o-an-quan    # chỉ vài id
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { REPO, startServer, launchChrome, blobFromPage } from "../../prototype/games/_shared/test/cdp.mjs";

const { GAMES_META } = await import(pathToFileURL(join(REPO, "prototype/games/_shared/games-meta.js")).href);
const want = process.argv.slice(2);
const ids = (want.length ? want : ["home", ...Object.keys(GAMES_META)]);
const OUT = join(REPO, "prototype/homepage/assets/og");
mkdirSync(OUT, { recursive: true });

const { server, base } = await startServer();
const chrome = await launchChrome();
try {
  const tab = await chrome.newTab("og", 1300, 800);
  await tab.go(`${base}/homepage/`);
  for (const id of ids) {
    const o = id === "home"
      ? { game: "co-ca-ngua", title: "Rủ bạn vào chơi", subtitle: "Hơn 20 game miễn phí ngay trên trình duyệt", type: "image/jpeg", quality: 0.9 }
      : { game: id, type: "image/jpeg", quality: 0.9 };
    const r = await blobFromPage(tab, `import("/games/_shared/share.js").then((m) => m.makeBanner(${JSON.stringify(o)}))`);
    if (r.w !== 1200 || r.h !== 630 || r.type !== "image/jpeg") throw new Error(`${id}: ảnh sai ${r.w}×${r.h} ${r.type}`);
    writeFileSync(join(OUT, `${id}.jpg`), r.buf);
    console.log(`${id}.jpg  ${(r.size / 1024).toFixed(0)} KB`);
  }
  if (tab.errors.length) console.warn("Lỗi trong trang:", tab.errors);
} finally {
  chrome.close();
  server.close();
}
process.exit(0);
