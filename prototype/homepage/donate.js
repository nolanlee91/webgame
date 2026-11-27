// D12 (quyết định chủ dự án): "☕ Ủng hộ Lụm Kèo" ở chân trang (index.html, bang-xep-hang.html).
// Bấm ⇒ hộp nhỏ: mã QR VietQR + số tài khoản (nút chép) + lời cảm ơn. Không tự mở, không nhắc, không khoá gì.
// Ảnh QR chỉ tải khi mở hộp lần đầu (không tính vào dung lượng / LCP trang chủ). Esc, nút × hoặc chạm nền mờ ⇒ đóng;
// focus giữ trong hộp khi mở (showModal + vòng Tab), đóng ⇒ về lại nút. Mở hộp ⇒ đếm "donate_open" (chỉ tên sự kiện, không gì khác).
// Tiếng bấm: các nút là <button> ⇒ feedback.js kêu đúng một tiếng, file này không tự phát tiếng.
// Gửi thẳng {e:"donate_open", g:""} tới /api/ev (máy chủ lọc theo danh sách EVENTS của games-server/stats.js). Không dùng ev() của
// games/_shared/stats.js: thêm tên vào danh sách bên đó buộc đổi tag ?v= ở ~40 file game đang import nó.
function ev(e) {
  try {
    const body = JSON.stringify({ e, g: "" });
    if (navigator.sendBeacon && navigator.sendBeacon("/api/ev", body)) return;
    fetch("/api/ev", { method: "POST", body, keepalive: true, credentials: "same-origin", headers: { "Content-Type": "text/plain" } }).catch(() => {});
  } catch { /* bỏ qua */ }
}

const btn = document.getElementById("donateBtn");
const dlg = document.getElementById("donateDlg");
if (btn && dlg && typeof dlg.showModal === "function") {
  const img = dlg.querySelector(".donate__qr img");
  const toast = dlg.querySelector(".donate__toast");
  const acc = dlg.querySelector("[data-acc]");
  let toastT = 0;

  btn.addEventListener("click", () => {
    if (img && img.dataset.src) { img.src = img.dataset.src; img.removeAttribute("data-src"); }
    if (dlg.open) return;
    dlg.showModal();
    dlg.querySelector(".donate__x").focus();
    ev("donate_open");
  });
  const close = () => { if (dlg.open) dlg.close(); };
  dlg.querySelector(".donate__x").addEventListener("click", close);
  // chạm nền mờ: hộp không có đệm (khung .donate__box phủ trọn <dialog>) ⇒ target là chính <dialog> chỉ khi chạm ngoài khung
  dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });
  dlg.addEventListener("close", () => { clearTimeout(toastT); toast.hidden = true; btn.focus({ preventScroll: true }); });
  // vòng Tab trong hộp (showModal đã làm phần còn lại của trang trơ; đây giữ focus không rơi ra thanh địa chỉ)
  dlg.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const f = [...dlg.querySelectorAll("button, a[href]")].filter((x) => !x.disabled && x.getClientRects().length);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  const showToast = (t) => { toast.textContent = t; toast.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { toast.hidden = true; }, 1800); };
  const fallbackCopy = (text) => {
    const ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;";
    dlg.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand("copy"); } catch { ok = false; }
    ta.remove();
    return ok;
  };
  dlg.querySelector(".donate__copy").addEventListener("click", async () => {
    const text = acc.dataset.acc;
    let ok = false;
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); ok = true; } } catch { ok = false; }
    if (!ok) ok = fallbackCopy(text);
    showToast(ok ? "Đã chép" : "Chưa chép được — bạn giữ vào số để chép nhé");
  });
}
