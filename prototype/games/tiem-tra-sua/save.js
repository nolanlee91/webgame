// Adapter lưu (localStorage). Luật đọc / kẹp / di chuyển ở core/state.js.
// Bản lưu hỏng không bị xoá: chép nguyên văn sang KEY + ".corrupt" (một lần) rồi mới mở tiệm mới.
// Bản lưu phiên bản cũ: chép nguyên văn sang KEY + ".bak-v<cũ>" (một lần) trước khi nâng cấp, để không bao giờ mất dữ liệu người chơi.
import { createState, loadSave, dump, saveVersion, SAVE_VERSION } from "./core/state.js?v=m36snd";

export const KEY = "wgp.tiemtrasua.v1";
export const CORRUPT_KEY = KEY + ".corrupt";
export const backupKey = (v) => `${KEY}.bak-v${v}`;
/** "Chơi lại từ đầu": tiến trình cũ không bị xoá mà chép sang đây (ghi đè bản dự phòng trước đó). */
export const BACKUP_KEY = KEY + ".backup";

export function browserStorage() { try { return window.localStorage; } catch { return null; } }

export function shopSave(storage) {
  const get = (k) => { try { return storage?.getItem(k) ?? null; } catch { return null; } };
  const set = (k, v) => { if (!storage) return false; try { storage.setItem(k, v); return true; } catch { return false; } };
  return {
    /** { state, fresh, corrupt, migrated } */
    read(seed) {
      const raw = get(KEY);
      if (raw === null) return { state: createState(seed), fresh: true, corrupt: false, migrated: null };
      const v = saveVersion(raw);
      if (v !== null && v < SAVE_VERSION && get(backupKey(v)) === null) set(backupKey(v), raw);
      const s = loadSave(raw);
      if (s) return { state: s, fresh: false, corrupt: false, migrated: v !== null && v < SAVE_VERSION ? v : null };
      if (get(CORRUPT_KEY) === null) set(CORRUPT_KEY, raw);
      return { state: createState(seed), fresh: true, corrupt: true, migrated: null };
    },
    write: (state) => set(KEY, dump(state)),
    /** Cất bản hiện tại sang BACKUP_KEY rồi bỏ KEY ⇒ lần mở sau là tiệm mới. */
    reset() {
      const raw = get(KEY);
      if (raw !== null && !set(BACKUP_KEY, raw)) return false;
      try { storage?.removeItem(KEY); return true; } catch { return false; }
    },
  };
}
