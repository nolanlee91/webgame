// Đồng hồ + hẹn giờ được tiêm vào trọng tài/client ⇒ test điều khiển được thời gian, server dùng đồng hồ monotonic.

/** Đồng hồ thật: monotonic (performance.now) nhưng có gốc kiểu epoch để hai phía so được với nhau. */
export function realScheduler() {
  const perf = globalThis.performance;
  return {
    now: () => perf.timeOrigin + perf.now(),
    at(time, fn) { return setTimeout(fn, Math.max(0, time - (perf.timeOrigin + perf.now()))); },
    cancel: (h) => clearTimeout(h),
  };
}

/** Đồng hồ giả cho test: chỉ chạy khi gọi advance(). */
export function fakeScheduler(start = 0) {
  let t = start, id = 0;
  const timers = new Map();
  return {
    now: () => t,
    at(time, fn) { const h = ++id; timers.set(h, { time, fn }); return h; },
    cancel: (h) => timers.delete(h),
    advance(ms) {
      const end = t + ms;
      for (;;) {
        let next = null;
        for (const [h, x] of timers) if (x.time <= end && (!next || x.time < next[1].time || (x.time === next[1].time && h < next[0]))) next = [h, x];
        if (!next) break;
        timers.delete(next[0]);
        t = Math.max(t, next[1].time);
        next[1].fn();
      }
      t = end;
    },
    pending: () => timers.size,
  };
}
