// Adapter lưu (localStorage). Luật đọc / kẹp / di chuyển ở core/state.js.
// Bản lưu hỏng không bị xoá: chép nguyên văn sang KEY + ".corrupt" (một lần) rồi mới mở tiệm mới.
// Bản lưu phiên bản cũ: chép nguyên văn sang KEY + ".bak-v<cũ>" (một lần) trước khi nâng cấp, để không bao giờ mất dữ liệu người chơi.
import { createState, loadSave, dump, saveVersion, SAVE_VERSION } from "./core/state.js?v=b10";

export const KEY = "wgp.tiembanhmi.v1";
export const CORRUPT_KEY = KEY + ".corrupt";
export const backupKey = (v) => `${KEY}.bak-v${v}`;
/** "Chơi lại từ đầu": tiến trình cũ không bị xoá mà chép sang đây (ghi đè bản dự phòng trước đó). */
export const BACKUP_KEY = KEY + ".backup";
/** "Chơi lại ngày hôm nay" (M5): ảnh chụp trạng thái lúc mở bảng Chuẩn bị ca của ngày (mỗi ngày một ảnh, ghi đè ngày trước). */
export const DAY_KEY = KEY + ".day";
/** Trước khi quay về đầu ngày: bản hiện tại được cất ở đây (ghi đè lần chơi lại trước). */
export const REPLAY_BACKUP_KEY = KEY + ".before-replay";

const parse = (raw) => { if (typeof raw !== "string") return null; try { return JSON.parse(raw); } catch { return null; } };
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
    /** Chụp trạng thái đầu ngày (tiệm đóng cửa, chưa mở ca). Mỗi ngày chụp một lần; trả true nếu vừa chụp. */
    snapshotDay(state) {
      if (!state || state.shift || !state.introSeen) return false;
      const cur = parse(get(DAY_KEY));
      if (cur && cur.day === state.day && cur.seed === state.seed) return false;
      return set(DAY_KEY, dump(state));
    },
    /** Ảnh đầu ngày hiện có: { day } hoặc null. */
    replayInfo() {
      const d = parse(get(DAY_KEY));
      return d && Number.isInteger(d.day) ? { day: d.day, seed: d.seed } : null;
    },
    /** Quay về đầu ngày đã chụp: cất bản hiện tại sang REPLAY_BACKUP_KEY rồi ghi ảnh đầu ngày vào KEY. */
    replayDay() {
      const snap = get(DAY_KEY);
      if (snap === null || !loadSave(snap)) return false;
      const raw = get(KEY);
      if (raw !== null && !set(REPLAY_BACKUP_KEY, raw)) return false;
      return set(KEY, snap);
    },
    /** Cất bản hiện tại sang BACKUP_KEY rồi bỏ KEY ⇒ lần mở sau là tiệm mới. */
    reset() {
      const raw = get(KEY);
      if (raw !== null && !set(BACKUP_KEY, raw)) return false;
      try { storage?.removeItem(DAY_KEY); storage?.removeItem(KEY); return true; } catch { return false; }
    },
  };
}
