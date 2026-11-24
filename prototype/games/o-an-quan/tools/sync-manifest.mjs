// Đồng bộ manifest asset của Codex vào thư mục game (máy chủ chỉ phục vụ prototype/, không đọc được docs/).
// Chạy từ gốc repo sau mỗi lần Codex giao asset:  node prototype/games/o-an-quan/tools/sync-manifest.mjs
// Chép docs/o-an-quan/asset-manifest.json → prototype/games/o-an-quan/data/asset-manifest.json (nguyên văn).
// Chưa có manifest của Codex thì giữ bản tạm của dev (toạ độ khớp bàn vẽ bằng code trong art.js). Test assets.test.mjs kiểm hai bản khớp nhau.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
const src = new URL("../../../../docs/o-an-quan/asset-manifest.json", import.meta.url);
const dst = new URL("../data/asset-manifest.json", import.meta.url);
if (!existsSync(src)) { console.log("Chưa có docs/o-an-quan/asset-manifest.json — giữ bản tạm của dev."); process.exit(0); }
const text = readFileSync(src, "utf8");
JSON.parse(text); // hỏng JSON thì dừng ở đây, không ghi đè
writeFileSync(dst, text);
console.log("Đã chép manifest Codex vào data/asset-manifest.json. Nhớ đổi tag ?v= trong index.html / game.js.");
