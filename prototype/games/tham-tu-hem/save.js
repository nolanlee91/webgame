// Adapter lưu (localStorage). Luật đọc / kẹp / MIGRATIONS ở core/progress.js (hồ sơ) và core/engine.js sanitizeRun (tiến độ từng vụ).
// - Bản lưu hỏng không bị xoá: chép nguyên văn sang KEY + ".corrupt" (một lần) rồi mới tạo hồ sơ mới.
// - Bản lưu phiên bản cũ: chép nguyên văn sang KEY + ".bak-v<cũ>" (một lần) trước khi nâng.
// - "Xoá tiến độ": cất bản hiện tại sang KEY + ".backup" rồi mới xoá. "Chơi lại vụ": chỉ bỏ tiến độ đang dở của vụ đó (vụ đã phá giữ ★).
import { createProfile, loadProfile, dumpProfile, saveVersion, PROFILE_VERSION } from "./core/progress.js?v=t9";

export const KEY = "wgp.tham-tu-hem.v1";
export const CORRUPT_KEY = KEY + ".corrupt";
export const BACKUP_KEY = KEY + ".backup";
export const backupKey = (v) => `${KEY}.bak-v${v}`;

export function browserStorage() { try { return window.localStorage; } catch { return null; } }

export function makeSave(storage) {
  const get = (k) => { try { return storage?.getItem(k) ?? null; } catch { return null; } };
  const set = (k, v) => { if (!storage) return false; try { storage.setItem(k, v); return true; } catch { return false; } };
  let locked = false; // sau khi xoá tiến độ: không ghi nữa cho tới khi tải lại (pagehide không ghi đè)
  return {
    /** { profile, fresh, corrupt, migrated } */
    read() {
      const raw = get(KEY);
      if (raw === null) return { profile: createProfile(), fresh: true, corrupt: false, migrated: null };
      const v = saveVersion(raw);
      if (v !== null && v < PROFILE_VERSION && get(backupKey(v)) === null) set(backupKey(v), raw);
      const p = loadProfile(raw);
      if (p) return { profile: p, fresh: false, corrupt: false, migrated: v !== null && v < PROFILE_VERSION ? v : null };
      if (get(CORRUPT_KEY) === null) set(CORRUPT_KEY, raw);
      return { profile: createProfile(), fresh: true, corrupt: true, migrated: null };
    },
    write(p) { return locked ? false : set(KEY, dumpProfile(p)); },
    /** Cất bản hiện tại sang BACKUP_KEY rồi xoá KEY. */
    wipe() {
      const raw = get(KEY);
      if (raw !== null && !set(BACKUP_KEY, raw)) return false;
      try { storage?.removeItem(KEY); locked = true; return true; } catch { return false; }
    },
    unlock() { locked = false; },
    get locked() { return locked; },
  };
}
