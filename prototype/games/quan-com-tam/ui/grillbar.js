// Thanh Bếp (SCREENS.md): luôn thấy trong ca ở mọi màn trừ hội thoại. 6 chip vỉ (vòng hai nửa: trái = mặt dưới, phải = mặt trên),
// nút Than + thanh than, nút Quạt (giữ), thanh Khói, viên Cơm (+ Nấu), viên Dĩa sạch (+ Rửa), Mỡ hành. Lật được trong lúc ô bày đang mở.
// Dựng DOM một lần, mỗi khung chỉ đổi chữ / lớp.
import { el, button } from "./common.js?v=c1";
import { icon } from "../render/atlas.js?v=c1";
import { zoneOf, sideState, itemResult, isCooked, itemFrame } from "../core/grill.js?v=c1";
import { ownerFree } from "../core/walker.js?v=c1";
import { GRILL } from "../data/economy.js?v=c1";

const SIDE_COL = { raw: "var(--m-raw)", half: "var(--m-half)", done: "var(--m-done)", charred: "var(--m-char)", burnt: "var(--m-burnt)" };
const SIDE_TXT = { raw: "sống", half: "tái", done: "chín", charred: "cháy cạnh", burnt: "cháy" };
const ZONE = { hot: ["N", "Nóng"], mid: ["V", "Vừa"], warm: ["Ấ", "Giữ ấm"] };
const MEAT_NAME = { suon: "Sườn", "suon-non": "Sườn non", ga: "Gà", "lap-xuong": "Lạp xưởng", "dau-hu": "Đậu hũ" };

export function createGrillbar(root, atlas, act, { onFan }) {
  root.textContent = "";
  const chipsBox = el("div", "gchips", root);
  const chips = [];
  for (const z of ["hot", "mid", "warm"]) {
    const zb = el("div", "zone", chipsBox);
    el("small", "", zb, ZONE[z][1]);
    const row = el("div", "row", zb);
    for (let i = 0; i < GRILL.slots; i++) if (zoneOf(i) === z) {
      const b = button(row, "gchip " + z, null, () => act({ type: "grillTap", slot: i }), { "data-slot": i, "data-hint": "grill" });
      const ring = el("i", "ring", b);
      const ico = el("i", "ico", b);
      const lbl = el("span", "lbl", b);
      chips[i] = { b, ring, ico, lbl, sig: "" };
    }
  }
  const ctl = el("div", "gctl", root);
  const coal = button(ctl, "gbtn2", null, () => act({ type: "addCoal" }), { "data-act": "addCoal", title: "Thêm một rổ than (C)" });
  const coalTxt = el("span", "", coal, "+Than"); const coalM = el("span", "meter", coal); const coalBar = el("i", "", coalM);
  const fan = button(ctl, "gbtn2", null, null, { "data-act": "fan", title: "Giữ để quạt (F): lửa mạnh hơn, tốn than, sinh khói" });
  el("span", "", fan, "Quạt"); const smokeM = el("span", "meter", fan); const smokeBar = el("i", "", smokeM); smokeBar.style.setProperty("--c", "#b8b0a8");
  const fanOn = (e) => { e.preventDefault(); fan.setPointerCapture?.(e.pointerId); onFan(true); };
  const fanOff = () => onFan(false);
  fan.addEventListener("pointerdown", fanOn);
  for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) fan.addEventListener(ev, fanOff);
  fan.addEventListener("contextmenu", (e) => e.preventDefault());
  const rice = button(ctl, "gbtn2", null, () => act({ type: "cookRice" }), { "data-act": "cookRice", "data-hint": "rice", title: "Nấu mẻ cơm (R)" });
  const riceTxt = el("span", "", rice); const riceSub = el("small", "", rice);
  const plates = button(ctl, "gbtn2", null, () => act({ type: "wash" }), { "data-act": "wash", "data-hint": "wash", title: "Rửa chén (W)" });
  const platesTxt = el("span", "", plates); const platesSub = el("small", "", plates);
  const mo = button(ctl, "gbtn2", null, () => act({ type: "moHanh" }), { "data-act": "moHanh", "data-desk": "", title: "Làm hũ mỡ hành (8 giây)" });
  const moTxt = el("span", "", mo); const moSub = el("small", "", mo);

  function render(s, hint) {
    const sh = s.shift;
    root.hidden = !sh;
    if (!sh) return;
    const g = sh.grill, free = ownerFree(s);
    for (let i = 0; i < chips.length; i++) {
      const c = chips[i], it = g.slots[i], z = zoneOf(i);
      let sig, cls = "gchip " + z, label;
      if (!it) {
        sig = "empty"; label = `${ZONE[z][0]} · bỏ sườn`;
        c.ring.style.setProperty("--c1", "#4a4060"); c.ring.style.setProperty("--c2", "#4a4060");
      } else {
        const a = sideState(it.sides[0]), b = sideState(it.sides[1]), r = itemResult(it);
        sig = `${itemFrame(it)}|${a}|${b}`;
        c.ring.style.setProperty("--c1", SIDE_COL[a]); c.ring.style.setProperty("--c2", SIDE_COL[b]);
        label = r === "burnt" ? "Cháy · bỏ" : isCooked(it) ? `${r === "charred" ? "Cháy cạnh" : "Chín"} · gắp` : it.sides[0] >= 100 ? "Lật!" : `${ZONE[z][0]} · ${SIDE_TXT[a]}`;
        if (isCooked(it) || (it.sides[0] >= 100 && it.sides[1] < 100)) cls += " ready";
        if (it.sides[0] >= 112 && r !== "burnt" && z !== "warm") cls += " danger";
        if (r === "burnt") cls += " burnt";
      }
      if (!free) cls += " locked";
      if (hint && (hint.key === "flip" || hint.key === "pick" || hint.key === "burnt" || hint.key === "grill") && hint.slot === i) cls += " hint";
      if (c.b.className !== cls) c.b.className = cls;
      if (c.sig !== sig) {
        c.sig = sig;
        c.ico.replaceWith(c.ico = it ? icon(atlas, ["grillItems", itemFrame(it)], 40, "ico") : el("i", "ico"));
        c.b.insertBefore(c.ico, c.lbl);
      }
      if (c.lbl.textContent !== label) c.lbl.textContent = label;
      c.b.setAttribute("aria-label", `Chỗ ${i + 1}, vùng ${ZONE[z][1]}: ${it ? `${MEAT_NAME[it.item]}, mặt dưới ${SIDE_TXT[sideState(it.sides[0])]}, mặt trên ${SIDE_TXT[sideState(it.sides[1])]}` : "trống"}`);
    }
    const lvl = Math.round(g.coal);
    coalBar.style.width = lvl + "%";
    coalBar.style.setProperty("--c", lvl >= 60 ? "#ffb14a" : lvl >= 30 ? "#f2622a" : lvl >= 10 ? "#c2361e" : "#5a5450");
    coalTxt.textContent = `+Than (${s.stock.than || 0})`;
    coal.classList.toggle("warn", lvl < 25);
    coal.classList.toggle("hint", hint?.key === "coal");
    coal.disabled = !free;
    fan.classList.toggle("on", g.fan);
    fan.disabled = !free && !g.fan;
    smokeBar.style.width = Math.round(g.smoke) + "%";
    smokeBar.style.setProperty("--c", g.smoke >= 70 ? "#e0604f" : "#b8b0a8");
    const r = sh.rice;
    riceTxt.textContent = `Cơm ${r.n}/${r.size}`;
    riceSub.textContent = r.cooking ? `nấu ${Math.ceil((r.cooking.until - sh.t) / 1000)}s` : `Nấu (gạo ${s.stock["gao-tam"] || 0})`;
    rice.classList.toggle("warn", r.n <= 3 && !r.cooking);
    rice.classList.toggle("hint", hint?.key === "rice");
    rice.disabled = !free || !!r.cooking;
    platesTxt.textContent = `Dĩa sạch ${sh.cleanPlates}`;
    platesSub.textContent = sh.dirty ? `Rửa ${sh.dirty} dĩa dơ` : "thau trống";
    plates.classList.toggle("warn", sh.cleanPlates <= 2);
    plates.classList.toggle("hint", hint?.key === "wash");
    plates.disabled = sh.dirty <= 0;
    moTxt.textContent = `Mỡ hành ${s.moHanh.n}`;
    moSub.textContent = `Làm hũ (${s.stock["mo-hanh-bo"] || 0} bộ)`;
    mo.classList.toggle("warn", s.moHanh.n <= 2);
  }
  return { render };
}
