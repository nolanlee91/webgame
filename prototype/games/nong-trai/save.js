// Adapter lưu (localStorage + khoá navigator.locks chống 2 tab ghi đè). Luật đọc / kẹp / di chuyển nằm ở core/state.js.
// Save v3 ở KEY. Chưa có v3 mà có bản v2 ⇒ di chuyển tự động; bản v2 gốc được chép sang BACKUP và không bao giờ bị xoá.
import { createState, loadV3, migrateV2, dump } from "./core/state.js?v=m1";

export const KEY = "wgp.nongtrai.v3";
export const V2_KEY = "wgp.nongtrai.v2";
export const BACKUP_KEY = "wgp.nongtrai.v2.backup";

export function browserStorage() {
  try { return window.localStorage; } catch { return null; }
}

export function farmSave(storage) {
  const get = (k) => { try { return storage?.getItem(k) ?? null; } catch { return null; } };
  const set = (k, v) => { if (!storage) return false; try { storage.setItem(k, v); return true; } catch { return false; } };
  /** { state, fresh: chưa có bản lưu nào, migrated: vừa di chuyển từ v2 (chưa ghi v3) } */
  function read(now) {
    const raw = get(KEY);
    const v3 = raw ? loadV3(raw, now) : null;
    if (v3) return { state: v3, fresh: false, migrated: false };
    const old = get(V2_KEY);
    const v2 = old ? migrateV2(old, now) : null;
    if (v2) return { state: v2, fresh: false, migrated: true, raw2: old };
    return { state: createState(now), fresh: !raw && !old, migrated: false };
  }
  function write(state, now) {
    if (get(KEY) === null) backupV2(get(V2_KEY)); // ghi v3 lần đầu ở bất kỳ đường nào ⇒ luôn sao lưu v2 trước
    return set(KEY, dump(state, now));
  }
  function backupV2(raw2) {
    if (raw2 && get(BACKUP_KEY) === null) set(BACKUP_KEY, raw2);
  }
  return {
    read,
    write,
    /** Lần mở đầu: ghi v3 (và sao lưu v2 nếu vừa di chuyển). */
    initialize(now) {
      const current = read(now);
      if (current.migrated) backupV2(current.raw2);
      if (current.fresh || current.migrated) write(current.state, now);
      return current;
    },
    /** Rời trang: cập nhật lastSeen — chỉ khi đã có bản v3 (việc di chuyển v2 để initialize() làm, kèm thông báo). */
    touch(now) {
      if (get(KEY) === null) return;
      const current = read(now);
      if (!current.fresh && !current.migrated) write(current.state, now);
    },
    backupV2,
    exclusive(action) {
      if (storage && typeof navigator !== "undefined" && navigator.locks?.request) {
        return navigator.locks.request(KEY, action);
      }
      action();
    },
  };
}
