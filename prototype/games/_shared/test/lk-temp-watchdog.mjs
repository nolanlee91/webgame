// "Lính gác" tách rời do lk-temp.mjs bật cho mỗi Chrome test: node lk-temp-watchdog.mjs <pid test> <pid chrome> <hồ sơ>
// Khi tiến trình test chết (kể cả bị giết cứng, không kịp chạy handler) ⇒ tắt cả cây Chrome rồi xoá hồ sơ.
// Xoá thử lại tới 2 phút: tiến trình con của Chrome (GPU, crashpad…) có lúc còn giữ tệp vài giây sau khi cây bị tắt.
// Khi Chrome đã tắt và hồ sơ đã bị xoá (đường thoát bình thường) ⇒ tự thoát.
import { rmSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const [parent, chrome] = process.argv.slice(2, 4).map(Number);
const prof = process.argv[4] || "";
const alive = (pid) => { if (!pid) return false; try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } };
const LIMIT = Date.now() + 24 * 3600e3; // không bao giờ treo quá một ngày
const gone = () => !prof || !existsSync(prof);
let cleanupUntil = 0;

const timer = setInterval(() => {
  if (!cleanupUntil) {
    if (!alive(chrome) && gone()) { clearInterval(timer); return; }
    if (alive(parent) && Date.now() < LIMIT) return;
    cleanupUntil = Date.now() + 120e3;
    if (alive(chrome)) {
      if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(chrome), "/T", "/F"], { stdio: "ignore", windowsHide: true, timeout: 10000 });
      else try { process.kill(chrome, "SIGKILL"); } catch {}
    }
  }
  if (prof && /lk-e2e-/.test(prof)) { try { rmSync(prof, { recursive: true, force: true }); } catch {} }
  if (gone() || Date.now() > cleanupUntil) clearInterval(timer);
}, 1000);
