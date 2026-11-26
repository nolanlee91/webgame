// Dọn đồ tạm do test trình duyệt để lại: hồ sơ Chrome (%TEMP%/lk-e2e-* và tiền tố cũ lk-share-*, masoi-e2e-*, noigian-e2e-*,
// datbom*, noitu-*, prof-*, e2e4/e2e5, scoped_dir*), thư mục ảnh %TEMP%/lk-e2e-shots-*, và thư mục *-shots chưa theo dõi trong repo.
//
//   node tools/clean-test-temp.mjs            xoá mọi thứ không bị khoá (thư mục Chrome đang mở thì bỏ qua)
//   node tools/clean-test-temp.mjs --dry      chỉ liệt kê
//   node tools/clean-test-temp.mjs --kill     tắt trước các Chrome headless còn treo đang dùng hồ sơ lk-e2e-* (chỉ Windows)
//   node tools/clean-test-temp.mjs --keep-shots   giữ lại ảnh chụp
import { readdirSync, statSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { findLeftovers, removeIfUnlocked } from "../prototype/games/_shared/test/lk-temp.mjs";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const dry = process.argv.includes("--dry"), kill = process.argv.includes("--kill"), keepShots = process.argv.includes("--keep-shots");

const sizeOf = (p) => {
  let n = 0;
  try { for (const e of readdirSync(p, { withFileTypes: true })) { const q = join(p, e.name); n += e.isDirectory() ? sizeOf(q) : (() => { try { return statSync(q).size; } catch { return 0; } })(); } } catch {}
  return n;
};
const mb = (b) => (b / 1048576).toFixed(1) + " MB";

if (kill && process.platform === "win32") {
  // Chỉ Chrome có --user-data-dir trỏ vào hồ sơ lk-e2e-* (không đụng Chrome người dùng).
  const ps = "Get-CimInstance Win32_Process -Filter \"Name='chrome.exe' OR Name='msedge.exe'\" | Where-Object { $_.CommandLine -match '--user-data-dir=[^ ]*lk-e2e-' -and $_.CommandLine -notmatch '--type=' } | ForEach-Object { $_.ProcessId }";
  const r = spawnSync("powershell", ["-NoProfile", "-Command", ps], { encoding: "utf8", windowsHide: true, timeout: 30000 });
  const pids = (r.stdout || "").split(/\s+/).filter(Boolean);
  for (const pid of pids) {
    console.log((dry ? "[dry] tắt" : "tắt") + " Chrome test PID " + pid);
    if (!dry) spawnSync("taskkill", ["/PID", pid, "/T", "/F"], { stdio: "ignore", windowsHide: true });
  }
  if (pids.length && !dry) await new Promise((r) => setTimeout(r, 1500));
}

const items = findLeftovers({ olderThan: 0, shots: !keepShots });
// Thư mục ảnh mặc định cũ (trước Đợt 8 các script ghi *-shots vào thư mục đang đứng) — chỉ xoá nếu git không theo dõi tệp nào trong đó.
for (const base of [REPO, join(REPO, "prototype/games/_shared/test"), join(REPO, "prototype/homepage")]) {
  let names = []; try { names = readdirSync(base); } catch {}
  for (const n of names) {
    const p = join(base, n);
    if (!/-shots$/.test(n) || keepShots) continue;
    try { if (!statSync(p).isDirectory()) continue; } catch { continue; }
    const tracked = spawnSync("git", ["ls-files", "--", p], { cwd: REPO, encoding: "utf8" }).stdout.trim();
    if (!tracked) items.push({ path: p, kind: "repo-shots" });
  }
}

let freed = 0, skipped = 0;
for (const { path, kind } of items) {
  const sz = sizeOf(path);
  if (dry) { console.log(`[dry] ${kind.padEnd(10)} ${mb(sz).padStart(10)}  ${path}`); freed += sz; continue; }
  const ok = kind === "repo-shots" ? (rmSync(path, { recursive: true, force: true, maxRetries: 3 }), !existsSync(path)) : removeIfUnlocked(path);
  if (ok) freed += sz; else { skipped++; console.log(`bỏ qua (đang bị khoá, có thể Chrome còn chạy — thử --kill): ${path}`); }
}
console.log(`${dry ? "Sẽ giải phóng" : "Đã giải phóng"} ${mb(freed)} từ ${items.length - skipped} thư mục` + (skipped ? `, bỏ qua ${skipped} thư mục bị khoá` : "") + ".");
