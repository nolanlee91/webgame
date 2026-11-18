// Hồi quy: máy chủ nạp prototype/games/<game>/logic.js (ES module) bằng import(). Railway có thể chạy Node không tự
// đoán kiểu module ⇒ thư mục game PHẢI có package.json "type":"module", nếu không phòng kẹt mãi ở "loading".
// Chạy với --no-experimental-detect-module để giả lập Node đó. `npm run test:esm`
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const games = new URL("../prototype/games/", import.meta.url);
for (const g of readdirSync(games).filter((g) => existsSync(new URL(`${g}/logic.js`, games)))) {
  test(`${g}/logic.js nạp được khi Node không tự đoán ES module`, () => {
    const href = pathToFileURL(fileURLToPath(new URL(`${g}/logic.js`, games))).href;
    const out = execFileSync(process.execPath, ["--no-experimental-detect-module", "--input-type=module", "-e",
      `import(${JSON.stringify(href)}).then(m => console.log(Object.keys(m).length), e => { console.log("ERR " + e.message); process.exit(1); })`],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    assert.ok(Number(out) > 0, out);
  });
}
