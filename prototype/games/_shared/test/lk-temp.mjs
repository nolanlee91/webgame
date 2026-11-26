// Thư mục tạm cho test trình duyệt: MỘT tiền tố chung, tự dọn khi thoát, quét đồ sót lúc khởi động.
// Lý do: mỗi lần chạy e2e mở Chrome với một hồ sơ (--user-data-dir) riêng trong %TEMP%; chạy bị giết giữa chừng
// (hết giờ, Ctrl+C) thì hồ sơ ở lại, cộng dồn hàng chục GB.
//
//   const prof = tempProfile("home-d3");          // %TEMP%/lk-e2e-home-d3-XXXXXX, xoá khi tiến trình thoát
//   const proc = spawn(CHROME, [..., "--user-data-dir=" + prof, ...]);
//   guardChrome(proc, prof);                       // thoát (kể cả Ctrl+C, lỗi, bị giết cứng) ⇒ tắt Chrome + xoá hồ sơ
//   const OUT = process.argv[2] || shotDir("home-d3");   // ảnh chụp mặc định: %TEMP%/lk-e2e-shots-home-d3
//
// Dọn tay mọi thứ: node tools/clean-test-temp.mjs
import { mkdtempSync, mkdirSync, readdirSync, statSync, renameSync, rmSync, existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

export const PREFIX = "lk-e2e-";
export const SHOTS_PREFIX = "lk-e2e-shots-";
const HOUR = 3600e3;
const WATCHDOG = join(dirname(fileURLToPath(import.meta.url)), "lk-temp-watchdog.mjs");

/** Tiền tố cũ (trước Đợt 8) còn sót trong %TEMP%. marker: chỉ xoá nếu bên trong đúng là hồ sơ Chrome (tên quá chung). */
export const LEGACY = [
  { re: /^lk-share-/ }, { re: /^masoi-e2e-/ }, { re: /^noigian-e2e-/ }, { re: /^datbom/ }, { re: /^noitu-(e2e|online)-/ },
  { re: /^scoped_dir/ }, { re: /^prof-/, marker: true }, { re: /^e2e\d*$/, marker: true },
];

const isProfile = (dir) => {
  try {
    if (existsSync(join(dir, "Local State"))) return true;
    return readdirSync(dir).some((n) => /^prof/.test(n) && existsSync(join(dir, n, "Local State")));
  } catch { return false; }
};

/** Xoá một thư mục nếu không bị khoá: đổi tên trước (Windows không cho đổi tên khi Chrome còn mở tệp bên trong). */
export function removeIfUnlocked(dir) {
  const tomb = dir + ".del-" + process.pid;
  try { renameSync(dir, tomb); } catch { return false; }
  try { rmSync(tomb, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); } catch {}
  return !existsSync(tomb);
}

/** Liệt kê đồ tạm của test trong %TEMP%. olderThan: ms (0 = mọi tuổi). shots: tính cả thư mục ảnh chụp. */
export function findLeftovers({ olderThan = HOUR, shots = false, root = tmpdir() } = {}) {
  const out = []; const now = Date.now();
  let names = []; try { names = readdirSync(root); } catch { return out; }
  for (const n of names) {
    const p = join(root, n);
    let kind = null;
    if (n.startsWith(SHOTS_PREFIX)) kind = shots ? "shots" : null;
    else if (n.startsWith(PREFIX)) kind = "profile";
    else if (/\.del-\d+$/.test(n) && LEGACY.some((l) => l.re.test(n))) kind = "tomb";
    else { const l = LEGACY.find((x) => x.re.test(n)); if (l && (!l.marker || isProfile(p))) kind = "legacy"; }
    if (!kind) continue;
    let st; try { st = statSync(p); } catch { continue; }
    if (!st.isDirectory()) continue;
    if (olderThan && now - st.mtimeMs < olderThan) continue;
    out.push({ path: p, kind });
  }
  return out;
}

let swept = false;
/** Quét một lần mỗi tiến trình: xoá hồ sơ cũ hơn 1 giờ và không bị khoá (của lần chạy bị giết trước đó). */
export function sweepOld(opts = {}) {
  if (swept && !opts.force) return []; swept = true;
  const gone = [];
  for (const { path } of findLeftovers(opts)) if (removeIfUnlocked(path)) gone.push(path);
  return gone;
}

const owned = new Set();   // hồ sơ của tiến trình này
const kids = new Set();    // Chrome do tiến trình này bật

function killTree(proc) {
  if (!proc || proc.exitCode !== null || proc.signalCode) return;
  try {
    if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(proc.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true, timeout: 5000 });
    else proc.kill("SIGKILL");
  } catch {}
}

function cleanupSync() {
  for (const p of kids) killTree(p);
  kids.clear();
  for (const dir of owned) { try { rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 150 }); } catch {} }
  owned.clear();
}

let hooked = false;
function hook() {
  if (hooked) return; hooked = true;
  process.on("exit", cleanupSync);
  // Ctrl+C / đóng cửa sổ / bị gửi tín hiệu: dọn rồi thoát với mã tương ứng (thiếu handler thì Node thoát mà không chạy "exit").
  for (const [sig, code] of [["SIGINT", 130], ["SIGTERM", 143], ["SIGHUP", 129], ["SIGBREAK", 149]]) {
    try { process.on(sig, () => { cleanupSync(); process.exit(code); }); } catch {}
  }
  // Lỗi không bắt / promise bị từ chối: Node vẫn phát "exit" nên cleanupSync chạy; không cần đè hành vi in lỗi mặc định.
}

/** Tạo hồ sơ Chrome tạm %TEMP%/lk-e2e-<name>-XXXXXX, xoá khi tiến trình thoát. */
export function tempProfile(name = "run") {
  sweepOld();
  hook();
  const dir = mkdtempSync(join(tmpdir(), PREFIX + String(name).replace(/[^\w.-]+/g, "_") + "-"));
  owned.add(dir);
  return dir;
}

/** Gắn Chrome vào vòng dọn: thoát bình thường/lỗi/tín hiệu ⇒ tắt cả cây tiến trình + xoá hồ sơ;
 *  tiến trình test bị giết cứng (taskkill /F, hết giờ) ⇒ "lính gác" tách rời làm việc đó. */
export function guardChrome(proc, prof) {
  hook();
  kids.add(proc);
  proc.once?.("exit", () => kids.delete(proc));
  if (prof) owned.add(prof);
  try {
    spawn(process.execPath, [WATCHDOG, String(process.pid), String(proc.pid), prof || ""],
      { detached: true, stdio: "ignore", windowsHide: true }).unref();
  } catch {}
  return proc;
}

/** Thư mục ảnh chụp mặc định %TEMP%/lk-e2e-shots-<name> (dùng lại giữa các lần chạy; dọn bằng tools/clean-test-temp.mjs). */
export function shotDir(name) {
  const dir = join(tmpdir(), SHOTS_PREFIX + String(name).replace(/[^\w.-]+/g, "_"));
  mkdirSync(dir, { recursive: true });
  return dir;
}
