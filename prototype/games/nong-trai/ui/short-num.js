// TLC12-04: số gọn cho HUD (như Trà Sữa) ⇒ xu lớn không đẩy HUD xuống 2 hàng. Số đủ để ở title / aria-label.
// 9.999 · 148k · 1,2tr · 999tr · 1,5 tỷ (cắt xuống, không làm tròn lên: 999.999.999 ⇒ "999tr", không thành "1 tỷ").
const short1 = (v) => (v >= 10 ? String(Math.floor(v)) : (Math.floor(v * 10) / 10).toLocaleString("vi-VN", { maximumFractionDigits: 1 }));
export function shortNum(n) {
  const sign = n < 0 ? "−" : "", a = Math.abs(Math.floor(n));
  if (a < 10_000) return sign + a.toLocaleString("vi-VN");
  if (a < 1e6) return sign + short1(a / 1e3) + "k";
  if (a < 1e9) return sign + short1(a / 1e6) + "tr";
  return sign + short1(a / 1e9) + " tỷ";
}
