// Hộp xác nhận pixel trong trang (thay cho confirm() của trình duyệt) — dùng chung mọi game Lụm Kèo.
//   import { pxConfirm } from "../_shared/px-confirm.js?v=pc1";
//   if (await pxConfirm({ title: "Mời Bình ra?", text: "…", ok: "Mời ra", cancel: "Thôi", danger: true })) …
// Trả về Promise<boolean>: true = bấm nút đồng ý; false = Thôi / Esc / bấm ra ngoài / mở hộp khác.
// Kiểu V5: khung góc khuyết (4 box-shadow), bóng cứng lệch, không bo tròn, nút ≥ 44 px lún khi ấn. Dùng <dialog> (lớp trên cùng,
// nổi trên mọi lớp phủ của game, Esc tự đóng); trình duyệt cũ không có showModal() thì hiện bằng lớp phủ cố định.
// Tự chèn CSS một lần; không phụ thuộc font / màu của game (dùng font của trang).

let cssDone = false, current = null;

function css() {
  if (cssDone) return; cssDone = true;
  const s = document.createElement("style");
  s.dataset.pxConfirm = "";
  s.textContent = `
.pxc{position:fixed;inset:0;margin:auto;padding:0;border:0;background:transparent;color:#f3ecdc;max-width:min(92vw,360px);width:100%;
  overflow:visible;font:inherit;z-index:2147483000}
.pxc:not([open]){display:none}
.pxc::backdrop{background:rgba(5,10,18,.62)}
.pxc.pxc--fb{display:block;top:50%;transform:translateY(-50%)}
.pxc-veil{position:fixed;inset:0;background:rgba(5,10,18,.62);z-index:2147482999}
.pxc__box{margin:6px;padding:16px 16px 14px;background:linear-gradient(#24344a 0 3px,#17222f 3px);
  box-shadow:inset 0 2px 0 rgba(255,255,255,.08),inset 0 -2px 0 rgba(0,0,0,.35),0 -3px 0 0 #3d5571,0 3px 0 0 #3d5571,-3px 0 0 0 #3d5571,3px 0 0 0 #3d5571,4px 6px 0 0 #050a12,6px 4px 0 0 #050a12}
.pxc__t{margin:0 0 6px;font-size:18px;line-height:1.25;font-weight:800;color:#ffe2a4;overflow-wrap:anywhere}
.pxc__p{margin:0 0 14px;font-size:15px;line-height:1.45;color:#d8d0bf;overflow-wrap:anywhere}
.pxc__row{display:flex;gap:12px;justify-content:flex-end;flex-wrap:wrap}
.pxc__b{min-height:44px;min-width:96px;padding:0 16px;border:0;font:inherit;font-size:15px;font-weight:800;cursor:pointer;color:#0f1826;
  background:linear-gradient(#e9eef5 0 3px,#c3ccd8 3px);margin:3px;
  box-shadow:inset 0 2px 0 rgba(255,255,255,.25),inset 0 -2px 0 rgba(0,0,0,.25),0 -3px 0 0 #0a111c,0 3px 0 0 #0a111c,-3px 0 0 0 #0a111c,3px 0 0 0 #0a111c,3px 4px 0 0 #050a12;
  touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:transform .08s ease}
.pxc__b:active{transform:translate(3px,3px);box-shadow:inset 0 2px 0 rgba(255,255,255,.25),inset 0 -2px 0 rgba(0,0,0,.25),0 -3px 0 0 #0a111c,0 3px 0 0 #0a111c,-3px 0 0 0 #0a111c,3px 0 0 0 #0a111c}
.pxc__b:focus-visible{outline:3px solid #ffe2a4;outline-offset:3px}
.pxc__b--ok{background:linear-gradient(#ffe2a4 0 3px,#f2b94a 3px)}
.pxc__b--danger{color:#fff6ef;background:linear-gradient(#ff9c86 0 3px,#d9483b 3px)}
@media (prefers-reduced-motion:reduce){.pxc__b{transition:none}}`;
  document.head.appendChild(s);
}

/**
 * opts: { title, text?, ok = "Đồng ý", cancel = "Thôi", danger = false }
 * Mặc định focus vào nút "Thôi" khi danger (bấm Enter nhầm không gây hậu quả).
 */
export function pxConfirm(opts = {}) {
  if (current) current(false); // đang mở hộp khác ⇒ đóng hộp cũ (coi như Thôi)
  css();
  const { title = "Bạn chắc chứ?", text = "", ok = "Đồng ý", cancel = "Thôi", danger = false } = opts;
  const prevFocus = document.activeElement;
  const dlg = document.createElement("dialog");
  dlg.className = "pxc";
  dlg.setAttribute("role", "alertdialog");
  dlg.setAttribute("aria-modal", "true");
  const box = document.createElement("div"); box.className = "pxc__box";
  const h = document.createElement("h2"); h.className = "pxc__t"; h.id = "pxc-t-" + Date.now().toString(36); h.textContent = title;
  dlg.setAttribute("aria-labelledby", h.id);
  box.append(h);
  if (text) { const p = document.createElement("p"); p.className = "pxc__p"; p.id = h.id + "-d"; p.textContent = text; dlg.setAttribute("aria-describedby", p.id); box.append(p); }
  const row = document.createElement("div"); row.className = "pxc__row";
  const bNo = document.createElement("button"); bNo.type = "button"; bNo.className = "pxc__b"; bNo.textContent = cancel; bNo.dataset.pxc = "cancel";
  const bOk = document.createElement("button"); bOk.type = "button"; bOk.className = "pxc__b " + (danger ? "pxc__b--danger" : "pxc__b--ok"); bOk.textContent = ok; bOk.dataset.pxc = "ok";
  row.append(bNo, bOk); box.append(row); dlg.append(box);
  document.body.append(dlg);
  let veil = null;
  const modal = typeof dlg.showModal === "function";
  if (modal) { try { dlg.showModal(); } catch { dlg.setAttribute("open", ""); } }
  else { veil = document.createElement("div"); veil.className = "pxc-veil"; document.body.append(veil); dlg.classList.add("pxc--fb"); dlg.setAttribute("open", ""); }
  (danger ? bNo : bOk).focus({ preventScroll: true });

  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => {
      if (done) return; done = true; current = null;
      document.removeEventListener("keydown", onKey, true);
      try { if (dlg.open && modal) dlg.close(); } catch {}
      dlg.remove(); veil?.remove();
      try { prevFocus?.focus?.({ preventScroll: true }); } catch {}
      resolve(v);
    };
    current = finish;
    const onKey = (e) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); finish(false); } };
    document.addEventListener("keydown", onKey, true);
    dlg.addEventListener("cancel", (e) => { e.preventDefault(); finish(false); });
    bNo.addEventListener("click", () => finish(false));
    bOk.addEventListener("click", () => finish(true));
    dlg.addEventListener("click", (e) => { if (e.target === dlg) finish(false); }); // bấm vùng tối bên ngoài khung
    veil?.addEventListener("click", () => finish(false));
  });
}

/** Đóng hộp đang mở (nếu có), coi như bấm Thôi — vd. khi phòng bị hủy / người kia đã rời trong lúc đang hỏi. */
export function pxConfirmClose() { if (current) current(false); }
