// Chọn tính cách cô chủ (data/lines-reply.js PERSONAS): thẻ lớn ở màn chào / hỏi một lần ở Chuẩn bị (bản lưu cũ),
// hàng nút gọn trên bảng trả lời review (đổi ngay, lựa chọn trả lời đổi theo). Chép ui/persona.js của Tiệm Bánh Mì.
import { PERSONAS, PERSONA_IDS } from "../data/lines-reply.js?v=c8";
import { el } from "./common.js?v=c8";

/** Thẻ chọn tính cách. onPick(id) khi bấm; selected = id đang chọn. */
export function personaCards(parent, selected, onPick) {
  const box = el("div", "persona-cards", parent);
  box.setAttribute("role", "radiogroup");
  box.setAttribute("aria-label", "Tính cách cô chủ");
  for (const id of PERSONA_IDS) {
    const P = PERSONAS[id];
    const b = el("button", "pcard" + (id === selected ? " on" : ""), box);
    b.type = "button"; b.dataset.persona = id;
    b.setAttribute("role", "radio"); b.setAttribute("aria-checked", id === selected ? "true" : "false");
    el("b", "", b, P.name);
    el("small", "", b, P.desc);
    b.addEventListener("click", () => {
      for (const x of box.children) { const on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-checked", on ? "true" : "false"); }
      onPick(id);
    });
  }
  return box;
}

/** Hàng nút gọn để đổi tính cách ngay trên bảng trả lời. */
export function personaSwitch(parent, current, onPick) {
  const row = el("div", "persona-switch", parent);
  row.setAttribute("role", "group");
  row.setAttribute("aria-label", "Đổi tính cách khi trả lời");
  el("span", "ps-l", row, "Trả lời kiểu:");
  for (const id of PERSONA_IDS) {
    const b = el("button", "btn small ps" + (id === current ? " on" : ""), row, PERSONAS[id].short);
    b.type = "button"; b.dataset.persona = id; b.title = PERSONAS[id].desc;
    b.setAttribute("aria-pressed", id === current ? "true" : "false");
    b.addEventListener("click", () => { if (id !== current) onPick(id); });
  }
  return row;
}
export { PERSONAS };
