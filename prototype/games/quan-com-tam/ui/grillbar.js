// Thanh Bếp (SCREENS.md): luôn thấy trong ca ở mọi màn trừ hội thoại. 6 chip vỉ (vòng hai nửa: trái = mặt dưới, phải = mặt trên),
// nút Than + thanh than, nút Quạt (giữ), thanh Khói, viên Cơm (+ Nấu), viên Dĩa sạch (+ Rửa), Mỡ hành. Lật được trong lúc ô bày đang mở.
// Dựng DOM một lần, mỗi khung chỉ đổi chữ / lớp.
import { el, button } from "./common.js?v=c3";
import { icon } from "../render/atlas.js?v=c3";
import { zoneOf, sideState, itemResult, isCooked, itemFrame } from "../core/grill.js?v=c3";
import { ownerFree } from "../core/walker.js?v=c3";
import { GRILL } from "../data/economy.js?v=c3";
import { eggState } from "../core/rice.js?v=c3"; // A: chảo trứng + xửng hấp chả trên Thanh Bếp

const SIDE_COL = { raw: "var(--m-raw)", half: "var(--m-half)", done: "var(--m-done)", charred: "var(--m-char)", burnt: "var(--m-burnt)" };
const SIDE_TXT = { raw: "sống", half: "tái", done: "chín", charred: "cháy cạnh", burnt: "cháy" };
const ZONE = { hot: ["N", "Nóng"], mid: ["V", "Vừa"], warm: ["Ấ", "Giữ ấm"], veg: ["C", "Vỉ chay"] }; // S: vỉ chay riêng
const MEAT_NAME = { suon: "Sườn", "suon-non": "Sườn non", ga: "Gà", "lap-xuong": "Lạp xưởng", "dau-hu": "Đậu hũ" };

export function createGrillbar(root, atlas, act, { onFan, onBig = null, isBig = () => false }) {
  root.textContent = "";
  let base = 0; // A: 0 = bếp 1, 6 = bếp 2 (cấp 14)
  const chipsBox = el("div", "gchips", root);
  const chips = [];
  for (const z of ["hot", "mid", "warm"]) {
    const zb = el("div", "zone", chipsBox);
    el("small", "", zb, ZONE[z][1]);
    const row = el("div", "row", zb);
    for (let i = 0; i < GRILL.slots; i++) if (zoneOf(i) === z) {
      const b = button(row, "gchip " + z, null, () => act({ type: "grillTap", slot: i + base }), { "data-slot": i, "data-hint": "grill" }); // A: base = 6 khi xem bếp 2
      const ring = el("i", "ring", b);
      const ico = el("i", "ico", b);
      const lbl = el("span", "lbl", b);
      chips[i] = { b, ring, ico, lbl, sig: "" };
    }
  }
  const ctl = el("div", "gctl", root);
  let coalGrill = 1, pages = 6; // S: bếp đang xem có than riêng (bếp 2) / số trang chip (bếp 1, bếp 2, vỉ chay)
  const coal = button(ctl, "gbtn2", null, () => act({ type: "addCoal", grill: coalGrill }), { "data-act": "addCoal", title: "Thêm một rổ than (C)" });
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
  // A: chảo trứng (cấp 2), xửng hấp chả (cấp 4), quạt máy (cấp 12) — chỉ hiện khi đã mua
  const egg = button(ctl, "gbtn2", null, () => act({ type: "egg" }), { "data-act": "egg", "data-desk": "", title: "Chiên trứng (E): lòng đào 6–9 giây, lòng vừa 9–13" });
  const eggTxt = el("span", "", egg); const eggM = el("span", "meter", egg); const eggBar = el("i", "", eggM); const eggSub = el("small", "", egg);
  const steam = button(ctl, "gbtn2", null, () => act({ type: "steam" }), { "data-act": "steam", "data-desk": "", title: "Hấp khay chả (H): 30 giây, 8 miếng" });
  const steamTxt = el("span", "", steam); const steamSub = el("small", "", steam);
  const blow = button(ctl, "gbtn2", null, () => act({ type: "blower", on: !blowOn }), { "data-act": "blower", "data-desk": "", title: "Quạt máy: bếp lên một nấc, than ×1,5, khói ít hơn quạt tay" });
  let blowOn = false;
  // S: nút đổi trang chip xoay bếp 1 → bếp 2 → vỉ chay
  const g2 = button(ctl, "gbtn2", null, () => { base = (base + 6) % pages; for (const c of chips) c.sig = ""; }, { "data-act": "grill2", title: "Đổi chip giữa bếp 1 và bếp 2 (phím Shift+1..6 cho bếp 2)" });
  const g2Txt = el("span", "", g2); const g2Sub = el("small", "", g2);
  el("span", "", blow, "Quạt máy");
  // V: mở / đóng bếp lớn HD (desktop; mobile dùng dock Bếp)
  const big = onBig ? button(ctl, "gbtn2", null, () => onBig(), { "data-act": "bigGrill", "data-desk": "", title: "Bếp lớn: bếp than cận cảnh, chạm miếng để lật / gắp" }) : null;
  if (big) el("span", "", big, "Bếp lớn");

  function render(s, hint) {
    const sh = s.shift;
    root.hidden = !sh;
    if (!sh) return;
    const g = sh.grill, free = ownerFree(s);
    if (g.slots.length <= 6) base = 0;
    pages = Math.ceil(g.slots.length / 6) * 6; if (base >= pages) base = 0; // S
    coalGrill = g.coal2 !== undefined && base === 6 && (g.vegFrom === undefined || g.vegFrom > 6) ? 2 : 1;
    for (let i = 0; i < chips.length; i++) {
      const c = chips[i], it = g.slots[i + base], z = zoneOf(i + base, g); // S: vỉ chay
      c.b.hidden = i + base >= g.slots.length; // S: trang vỉ chay chỉ có 2 chỗ
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
    const lvl = Math.round(coalGrill === 2 ? g.coal2 : g.coal); // S: bếp 2 than riêng
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
    // A: chảo + xửng + quạt máy
    egg.hidden = !sh.pan;
    if (sh.pan) {
      const es = eggState(sh.pan, sh.t), sec = es ? (sh.t - sh.pan.egg.t0) / 1000 : 0;
      eggTxt.textContent = es ? `Trứng ${{ raw: "sống", runny: "lòng đào", set: "lòng vừa", hard: "chín kỹ", burnt: "cháy" }[es]}` : "Chảo trống";
      eggSub.textContent = es ? `${Math.floor(sec)}s · gắp ở dải bày${sh.pan.egg2 ? " · +1 trứng" : (sh.pan.cap || 1) >= 2 ? " · chiên thêm 1" : ""}` : `Chiên (${s.stock.trung || 0} quả)`;
      eggBar.style.width = Math.min(100, (sec / 18) * 100) + "%";
      eggBar.style.setProperty("--c", es === "runny" ? "#f2c14a" : es === "set" ? "#e0a040" : es === "burnt" ? "#5a3a2a" : es === "hard" ? "#b87a3a" : "#f4f0e0");
      egg.classList.toggle("on", es === "runny" || es === "set");
      egg.classList.toggle("warn", es === "hard" || es === "burnt");
      egg.classList.toggle("hint", hint?.key === "egg");
      egg.disabled = !free || (!!es && ((sh.pan.cap || 1) < 2 || !!sh.pan.egg2)); // chảo đôi: chiên thêm 1
    }
    steam.hidden = !sh.steamer;
    if (sh.steamer) {
      steamTxt.textContent = `Chả chín ${sh.steamer.done}`;
      steamSub.textContent = sh.steamer.cooking ? `hấp ${Math.ceil((sh.steamer.cooking.until - sh.t) / 1000)}s` : `Hấp (${s.stock.cha || 0} sống)`;
      steam.classList.toggle("warn", sh.steamer.done <= 1 && !sh.steamer.cooking);
      steam.disabled = !free || !!sh.steamer.cooking || (s.stock.cha || 0) <= 0;
    }
    g2.hidden = g.slots.length <= 6;
    if (g.slots.length > 6) {
      const other = base ? g.slots.slice(0, 6) : g.slots.slice(6);
      const ready = other.filter((it) => it && (isCooked(it) || it.sides[0] >= 100)).length;
      g2Txt.textContent = g.vegFrom !== undefined && base >= g.vegFrom ? "Đang xem vỉ chay" : base ? "Đang xem bếp 2" : "Đang xem bếp 1"; // S
      g2Sub.textContent = `${base ? "Bếp 1" : "Bếp 2"}: ${other.filter(Boolean).length} miếng${ready ? `, ${ready} cần tay` : ""}`;
      g2.classList.toggle("warn", ready > 0);
    }
    if (big) big.classList.toggle("on", !!isBig()); // V:
    blow.hidden = !s.owned?.["electric-blower"];
    blowOn = !!g.blower;
    blow.classList.toggle("on", blowOn);
  }
  return { render, get base() { return base; } }; // V: base = bếp đang xem (bếp lớn đi theo)
}
