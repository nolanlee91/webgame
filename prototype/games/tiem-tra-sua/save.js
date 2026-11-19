// Adapter lưu (localStorage). Luật đọc / kẹp / di chuyển ở core/state.js.
// Bản lưu hỏng không bị xoá: chép nguyên văn sang KEY + ".corrupt" (một lần) rồi mới mở tiệm mới.
import { createState, loadSave, dump } from "./core/state.js";

export const KEY = "wgp.tiemtrasua.v1";
export const CORRUPT_KEY = KEY + ".corrupt";

export function browserStorage() { try { return window.localStorage; } catch { return null; } }

export function shopSave(storage) {
  const get = (k) => { try { return storage?.getItem(k) ?? null; } catch { return null; } };
  const set = (k, v) => { if (!storage) return false; try { storage.setItem(k, v); return true; } catch { return false; } };
  return {
    /** { state, fresh, corrupt } */
    read(seed) {
      const raw = get(KEY);
      if (raw === null) return { state: createState(seed), fresh: true, corrupt: false };
      const s = loadSave(raw);
      if (s) return { state: s, fresh: false, corrupt: false };
      if (get(CORRUPT_KEY) === null) set(CORRUPT_KEY, raw);
      return { state: createState(seed), fresh: true, corrupt: true };
    },
    write: (state) => set(KEY, dump(state)),
  };
}
