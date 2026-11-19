// Adapter lưu (localStorage + khoá navigator.locks chống 2 tab ghi đè). Luật đọc / kẹp / di chuyển nằm ở core/state.js.
// Save v4 (Milestone 2) ở KEY. Chưa có v4 ⇒ di chuyển tự động từ v3 (Milestone 1), không có thì từ v2.
// Chính sách giữ dữ liệu cũ: bản gốc v3 / v2 được chép sang khoá *.backup trước lần ghi v4 đầu tiên và KHÔNG bao giờ bị xoá.
import { createState, loadSave, migrateV2, dump } from "./core/state.js?v=m2b";

export const KEY = "wgp.nongtrai.v4";
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
  /** { state, fresh: chưa có bản lưu nào, migrated: vừa di chuyển (chưa ghi v4), from: "v3" | "v2" } */
  function read(now) {
    const raw = get(KEY);
    const v4 = raw ? loadSave(raw, now) : null;
    if (v4) return { state: v4, fresh: false, migrated: false };
    const old3 = get(V3_KEY);
    const v3 = old3 ? loadSave(old3, now) : null;
    if (v3) return { state: v3, fresh: false, migrated: true, from: "v3" };
    const old = get(V2_KEY);
    const v2 = old ? migrateV2(old, now) : null;
    if (v2) return { state: v2, fresh: false, migrated: true, from: "v2", raw2: old };
    return { state: createState(now), fresh: !raw && !old && !old3, migrated: false };
  }
  /** Ghi v4 lần đầu ở bất kỳ đường nào ⇒ luôn sao lưu v3 + v2 trước. */
  function write(state, now) {
    if (get(KEY) === null) { backupV3(get(V3_KEY)); backupV2(get(V2_KEY)); }
    return set(KEY, dump(state, now));
  }
  function backupV2(raw2) {
    if (raw2 && get(BACKUP_KEY) === null) set(BACKUP_KEY, raw2);
  }
  function backupV3(raw3) {
    if (raw3 && get(V3_BACKUP_KEY) === null) set(V3_BACKUP_KEY, raw3);
  }
  return {
    read,
    write,
    /** Lần mở đầu: ghi v4 (và sao lưu bản cũ nếu vừa di chuyển). */
    initialize(now) {
      const current = read(now);
      if (current.migrated) { backupV2(current.raw2 ?? get(V2_KEY)); backupV3(get(V3_KEY)); }
      if (current.fresh || current.migrated) write(current.state, now);
      return current;
    },
    /** Rời trang: cập nhật lastSeen — chỉ khi đã có bản v4 (việc di chuyển để initialize() làm, kèm thông báo). */
    touch(now) {
      if (get(KEY) === null) return;
      const current = read(now);
      if (!current.fresh && !current.migrated) write(current.state, now);
    },
    backupV2,
    backupV3,
    exclusive(action) {
      if (storage && typeof navigator !== "undefined" && navigator.locks?.request) {
        return navigator.locks.request(KEY, action);
      }
      action();
    },
  };
}
