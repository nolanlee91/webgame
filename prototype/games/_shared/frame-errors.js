// D9: ghi lỗi của vòng requestAnimationFrame mà không làm ngập console.
// frame() ở các game tiệm bọc step() trong try/catch để một lỗi không làm đơ game (TLC22-01). Lỗi lặp lại mỗi khung (~60 lần/giây)
// trước đây in ra 60 dòng/giây. Ở đây:
// - mỗi lỗi khác nhau (theo tên + thông điệp) in đầy đủ MỘT lần (kèm stack);
// - lỗi lặp lại chỉ được đếm; cứ ~5 s in một dòng "lặp lại N lần", hoặc in ngay khi lỗi đổi sang lỗi khác;
// - game vẫn chạy (hàm không bao giờ ném).
// Dùng: const frameErr = frameErrorLog("Cơm Tấm");
//       function frame(now) { requestAnimationFrame(frame); try { step(now); frameErr.ok(); } catch (err) { frameErr.error(err); } }

const keyOf = (err) => {
  try { return err && typeof err === "object" ? `${err.name || "Error"}: ${err.message ?? ""}` : String(err); }
  catch { return "Lỗi không đọc được"; }
};

/**
 * @param {string} label tên hiện ở đầu dòng tóm tắt
 * @param {{ log?: (...a: any[]) => void, now?: () => number, every?: number, maxKeys?: number }} [opt]
 */
export function frameErrorLog(label = "frame", { log = (...a) => console.error(...a), now = () => performance.now(), every = 5000, maxKeys = 50 } = {}) {
  const seen = new Set();
  let cur = null, pending = 0, since = 0, total = 0;
  const flush = (t) => {
    if (cur !== null && pending > 0) {
      const secs = Math.max(1, Math.round((t - since) / 1000));
      try { log(`[${label}] lỗi lặp lại ${pending} lần trong ${secs} s: ${cur}`); } catch {}
    }
    pending = 0; since = t;
  };
  return {
    /** Gọi trong catch của frame(). */
    error(err) {
      total++;
      const t = now(), key = keyOf(err);
      if (key !== cur) {
        flush(t); cur = key; since = t;
        if (!seen.has(key)) {
          if (seen.size >= maxKeys) seen.clear();
          seen.add(key);
          try { log(`[${label}] lỗi trong vòng vẽ (game vẫn chạy; lỗi lặp lại sẽ chỉ được đếm):`, err); } catch {}
          return;
        }
        pending = 1;
        return;
      }
      pending++;
      if (t - since >= every) flush(t);
    },
    /** Gọi sau mỗi khung chạy êm: lỗi đã thôi lặp thì vẫn in nốt số đếm sau ~5 s. Rẻ (chỉ so số) khi không có lỗi chờ. */
    ok() {
      if (pending > 0 && now() - since >= every) flush(now());
    },
    get total() { return total; },
  };
}
