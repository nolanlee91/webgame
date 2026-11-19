import { dump, load } from "./logic.js?v=garden2";

const KEY = "wgp.nongtrai.v2";

export function browserStorage() {
  try { return window.localStorage; } catch { return null; }
}

export function farmSave(storage) {
  function read(now) {
    let raw;
    try { raw = storage?.getItem(KEY); } catch {}
    return { state: load(raw, now), fresh: !raw };
  }
  function write(state, now) {
    if (!storage) return false;
    try {
      storage.setItem(KEY, dump(state, now));
      return true;
    } catch {
      return false;
    }
  }
  return {
    read,
    write,
    initialize(now) {
      const current = read(now);
      if (current.fresh) write(current.state, now);
    },
    touch(now) {
      const current = read(now);
      if (!current.fresh) write(current.state, now);
    },
    exclusive(action) {
      if (storage && typeof navigator !== "undefined" && navigator.locks?.request) {
        return navigator.locks.request(KEY, action);
      }
      action();
    },
  };
}
