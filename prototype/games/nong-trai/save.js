// Adapter lưu (localStorage + khoá navigator.locks chống 2 tab ghi đè). Luật đọc / kẹp / di chuyển nằm ở core/state.js.
// Save v6 (Milestone 4) ở KEY. Chưa có v6 ⇒ di chuyển tự động từ v5 (Milestone 3), rồi v4 (Milestone 2), v3 (Milestone 1), v2.
// Chính sách giữ dữ liệu cũ: bản gốc v5 / v4 / v3 / v2 được chép sang khoá *.backup trước lần ghi v6 đầu tiên và KHÔNG bao giờ bị xoá
// (khoá gốc cũng giữ nguyên — chỉ đọc).
import { createState, loadSave, migrateV2, dump } from "./core/state.js?v=m5";

export const KEY = "wgp.nongtrai.v6";
export const V5_KEY = "wgp.nongtrai.v5";
export const V5_BACKUP_KEY = "wgp.nongtrai.v5.backup";
export const V4_KEY = "wgp.nongtrai.v4";
export const V4_BACKUP_KEY = "wgp.nongtrai.v4.backup";
export const V3_KEY = "wgp.nongtrai.v3";
export const V3_BACKUP_KEY = "wgp.nongtrai.v3.backup";
export const V2_KEY = "wgp.nongtrai.v2";
export const BACKUP_KEY = "wgp.nongtrai.v2.backup";

export function browserStorage() {
  try { return window.localStorage; } catch { return null; }
}

export function farmSave(storage) {
  const get = (k) => { try { return storage?.getItem(k) ?? null; } catch { return null; } };
  const set = (k, v) => { if (!storage) return false; try { storage.setItem(k, v); return true; } catch { return false; } };
  /** { state, fresh: chưa có bản lưu nào, migrated: vừa di chuyển (chưa ghi v6), from: "v5" | "v4" | "v3" | "v2" } */
  function read(now) {
    const raw = get(KEY);
    const cur = raw ? loadSave(raw, now) : null;
    if (cur) return { state: cur, fresh: false, migrated: false };
    for (const [key, from] of [[V5_KEY, "v5"], [V4_KEY, "v4"], [V3_KEY, "v3"]]) {
      const old = get(key);
      const st = old ? loadSave(old, now) : null;
      if (st) return { state: st, fresh: false, migrated: true, from };
    }
    const old = get(V2_KEY);
    const v2 = old ? migrateV2(old, now) : null;
    if (v2) return { state: v2, fresh: false, migrated: true, from: "v2", raw2: old };
    return { state: createState(now), fresh: !raw && !old && !get(V3_KEY) && !get(V4_KEY) && !get(V5_KEY), migrated: false };
  }
  const backup = (key, bkey) => { const r = get(key); if (r && get(bkey) === null) set(bkey, r); };
  function backupAll() { backup(V5_KEY, V5_BACKUP_KEY); backup(V4_KEY, V4_BACKUP_KEY); backup(V3_KEY, V3_BACKUP_KEY); backup(V2_KEY, BACKUP_KEY); }
  /** Ghi v6 lần đầu ở bất kỳ đường nào ⇒ luôn sao lưu v5 + v4 + v3 + v2 trước. */
  function write(state, now) {
    if (get(KEY) === null) backupAll();
    return set(KEY, dump(state, now));
  }
  return {
    read,
    write,
    /** Lần mở đầu: ghi v6 (và sao lưu bản cũ nếu vừa di chuyển). */
    initialize(now) {
      const current = read(now);
      if (current.migrated) backupAll();
      if (current.fresh || current.migrated) write(current.state, now);
      return current;
    },
    /** Rời trang: cập nhật lastSeen — chỉ khi đã có bản v6 (việc di chuyển để initialize() làm, kèm thông báo). */
    touch(now) {
      if (get(KEY) === null) return;
      const current = read(now);
      if (!current.fresh && !current.migrated) write(current.state, now);
    },
    backupV2: (raw2) => { if (raw2 && get(BACKUP_KEY) === null) set(BACKUP_KEY, raw2); },
    backupV3: (raw3) => { if (raw3 && get(V3_BACKUP_KEY) === null) set(V3_BACKUP_KEY, raw3); },
    backupV5: (raw5) => { if (raw5 && get(V5_BACKUP_KEY) === null) set(V5_BACKUP_KEY, raw5); },
    backupV4: (raw4) => { if (raw4 && get(V4_BACKUP_KEY) === null) set(V4_BACKUP_KEY, raw4); },
    exclusive(action) {
      if (storage && typeof navigator !== "undefined" && navigator.locks?.request) {
        return navigator.locks.request(KEY, action);
      }
      action();
    },
  };
}
