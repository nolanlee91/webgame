// Chọn tính cách chủ tiệm (data/lines-reply.js PERSONAS): thẻ lớn ở màn chào / hỏi một lần ở Chuẩn bị ca, hàng nút gọn trên bảng trả lời review.
import { PERSONAS, PERSONA_IDS } from "../data/lines-reply.js?v=b4";

const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

/** Thẻ chọn tính cách (màn chào, Chuẩn bị ca). onPick(id) khi bấm; selected = id đang chọn. */
export function personaCards(selected, onPick) {
  const box = h("div", "persona-cards");
  box.setAttribute("role", "radiogroup");
  box.setAttribute("aria-label", "Tính cách chủ tiệm");
  for (const id of PERSONA_IDS) {
    const P = PERSONAS[id];
    const b = h("button", "pcard" + (id === selected ? " on" : ""), "");
    b.type = "button"; b.dataset.persona = id;
    b.setAttribute("role", "radio"); b.setAttribute("aria-checked", id === selected ? "true" : "false");
    b.appendChild(h("b", "", P.name));
    b.appendChild(h("small", "", P.desc));
    b.addEventListener("click", () => {
      for (const x of box.children) { const on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-checked", on ? "true" : "false"); }
      onPick(id);
    });
    box.appendChild(b);
  }
  return box;
}

/** Hàng nút gọn để đổi tính cách ngay trên bảng trả lời. */
export function personaSwitch(current, onPick) {
  const row = h("div", "persona-switch");
  row.setAttribute("role", "group");
  row.setAttribute("aria-label", "Đổi tính cách khi trả lời");
  row.appendChild(h("span", "ps-l", "Trả lời kiểu:"));
  for (const id of PERSONA_IDS) {
    const b = h("button", "btn small ps" + (id === current ? " on" : ""), PERSONAS[id].short);
    b.type = "button"; b.dataset.persona = id; b.title = PERSONAS[id].desc;
    b.setAttribute("aria-pressed", id === current ? "true" : "false");
    b.addEventListener("click", () => { if (id !== current) onPick(id); });
    row.appendChild(b);
  }
  return row;
}
export { PERSONAS };
