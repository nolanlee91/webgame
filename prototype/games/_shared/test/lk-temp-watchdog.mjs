// "Lính gác" tách rời do lk-temp.mjs bật cho mỗi Chrome test: node lk-temp-watchdog.mjs <pid test> <pid chrome> <hồ sơ>
// Khi tiến trình test chết (kể cả bị giết cứng, không kịp chạy handler) ⇒ tắt cả cây Chrome rồi xoá hồ sơ.
// Khi Chrome đã tắt và hồ sơ đã bị xoá (đường thoát bình thường) ⇒ tự thoát.
import { rmSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const [parent, chrome] = process.argv.slice(2, 4).map(Number);
const prof = process.argv[4] || "";
const alive = (pid) => { if (!pid) return false; try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } };
const LIMIT = Date.now() + 24 * 3600e3; // không bao giờ treo quá một ngày

const timer = setInterval(() => {
  const profGone = !prof || !existsSync(prof);
  if (!alive(chrome) && profGone) { clearInterval(timer); return; }
  if (alive(parent) && Date.now() < LIMIT) return;
  clearInterval(timer);
  if (alive(chrome)) {
    if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(chrome), "/T", "/F"], { stdio: "ignore", windowsHide: true, timeout: 10000 });
    else try { process.kill(chrome, "SIGKILL"); } catch {}
  }
  if (prof && /lk-e2e-/.test(prof)) { try { rmSync(prof, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }); } catch {} }
}, 1000);
