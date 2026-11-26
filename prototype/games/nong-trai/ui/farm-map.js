// Bản đồ nông trại (Milestone 3): vẽ công trình / bản vẽ / giàn giáo / trang trí theo core/levels-map.js mapLayout().
// Chỉ hiển thị — mọi thay đổi trạng thái đi qua apply() ở game.js (onTap / onSlot gọi ra ngoài).
// Toạ độ chuẩn hoá theo bản đồ 960 × 600 (data/buildings.js); bản đồ rộng EAST_W lần khi tới cấp 17 / mở Khu đất phía Đông.
import { frame, sheet as sheetOf } from "./sprites.js?v=m14";

let MW = 960, MH = 640; // = data/buildings.js MAP_W / MAP_H (đọc lại từ L khi dựng)
export const GARDEN = { house: [269, 184], market: [205, 190], fence: [229, 77] }; // kích thước gốc ảnh assets/garden (neo đáy-giữa)
/**
 * Milestone 6 — sprite chờ Codex: { sheet, id, fallback, tier?, prefix? }. Manifest có frame ⇒ dùng; nhà theo bậc thiếu frame bậc này
 * ⇒ frame bậc thấp gần nhất đã vẽ; không có gì ⇒ `fallback` (ảnh M5, hàng rào đá = hàng rào gỗ lọc màu đá).
 */
export function resolveSprite(sp) {
  if (!sp?.fallback || frame(sp.sheet, sp.id)) return sp;
  if (sp.prefix && sp.tier) for (let k = sp.tier - 1; k >= 1; k--) if (frame(sp.sheet, sp.prefix + k)) return { sheet: sp.sheet, id: sp.prefix + k };
  return sp.fallback;
}
const BLUEPRINT_ID = "lo-ban-ve";
export const STATUS_TEXT = { locked: "Khoá", available: "Có thể xây", building: "Đang xây", done: "Hoàn thành", upgradeable: "Nâng cấp được" };
const SPECIAL_ID = { xuong: "workshopLot", "sap-cho": "market", "bang-don-hang": "boardBtn" };
const NORMAL_TAG = { xuong: "Xưởng chế biến", "sap-cho": "Khu chợ", "bang-don-hang": "Bảng đơn", "nha-kho": "Nhà kho", "nha-kinh": "Nhà kính",
  "chuong-ga": "Chuồng gà", "chuong-bo": "Chuồng bò", "bien-lang": "Làng" };
const STATIC = new Set(["xe-giao-hang"]); // cảnh vật, không chạm (biển Làng chạm được từ M4 ⇒ cảnh Làng; Nhà chạm được từ M5 ⇒ thẻ nâng Nhà)
/**
 * Gà / bò đi lại trước chuồng trên bản đồ (§3 "gà chạy trong sân", "bò gặm cỏ") — khung lấy từ assets/v3/manifest.json
 * (animals: walkLeft / eat), chạy bằng CSS (steps) ⇒ không tốn vòng vẽ JS. pos = % background-position của khung trong atlas 768 × 304.
 * mode "walk": đi trái rồi quay đầu đi phải; "eat": mổ thóc / gặm cỏ tại chỗ. at: chân con vật (px bản đồ, so với neo chuồng).
 */
const CRITTERS = {
  ga: { housing: "chuong-ga", size: 34, max: 3, frame: 96, list: [
    { mode: "walk", frames: ["ga-di-trai-1", "ga-di-trai-2"], at: [46, 40], delay: 0 },
    { mode: "eat", frames: ["ga-an-1", "ga-an-2"], at: [-14, 42], delay: -0.2 },
    { mode: "walk", frames: ["ga-di-trai-1", "ga-di-trai-2"], at: [8, 50], delay: -3.4 },
  ] },
  "bo-sua": { housing: "chuong-bo", size: 54, max: 2, frame: 128, list: [
    { mode: "eat", frames: ["bo-an-1", "bo-an-2"], at: [-14, 44], delay: 0 },
    { mode: "walk", frames: ["bo-di-trai-1", "bo-di-trai-2"], at: [62, 46], delay: -5 },
  ] },
};
/** Huy hiệu trên công trình (id cũ của M2 giữ nguyên). Milestone 4: trứng / sữa chờ thu trên chuồng, "!" trên biển Làng. */
const BADGE_ID = { xuong: "wsBadge", "bang-don-hang": "boardBadge", "chuong-ga": "coopBadge", "chuong-bo": "barnBadge", "bien-lang": "villageBadge" };

/** CSS nền cho khung `id` của atlas `sheet` (assets/v3). null khi manifest chưa nạp. */
export function spriteCss(sheet, id) {
  const f = frame(sheet, id), sh = sheetOf(sheet);
  if (!f || !sh) return null;
  const cols = sh.columns || 1, rows = sh.rows || 1, fw = sh.frameWidth || f.width, fh = sh.frameHeight || f.height;
  const c = Math.round(f.x / fw), r = Math.round(f.y / fh);
  return `background-image:url(assets/v3/${sh.file});background-size:${cols * 100}% ${rows * 100}%;` +
    `background-position:${cols > 1 ? (c * 100) / (cols - 1) : 0}% ${rows > 1 ? (r * 100) / (rows - 1) : 0}%`;
}

export function createFarmMap({ L, farm, map, esc, fmtClock, onTap, onSlot }) {
  MW = L.MAP_W || MW; MH = L.MAP_H || MH;
  const layer = map.querySelector("#bldLayer"), decorLayer = map.querySelector("#decorLayer"), slotLayer = map.querySelector("#slotLayer");
  const field = map.querySelector("#field"), fieldEast = map.querySelector("#fieldEast"), eastWild = map.querySelector("#eastWild");
  const els = {};
  let bw = 0, decorKey = "", slotKey = "", last = null;

  // Mỗi công trình một nút cố định (id cũ của M2 giữ nguyên: #workshopLot, #market, #boardBtn).
  for (const def of L.BUILDINGS) {
    const b = document.createElement(STATIC.has(def.id) ? "div" : "button");
    if (b.tagName === "BUTTON") b.type = "button";
    b.className = "bld" + (STATIC.has(def.id) ? " static" : "");
    b.dataset.id = def.id;
    if (SPECIAL_ID[def.id]) b.id = SPECIAL_ID[def.id];
    b.hidden = true;
    b.innerHTML = `<span class="pic"></span><span class="up-arrow" hidden></span><span class="lot-bar"${def.id === "xuong" ? ' id="lotBar"' : ""} hidden><i></i></span>` +
      `<span class="market-tag"${def.id === "xuong" ? ' id="lotTag"' : ""}></span>` +
      (BADGE_ID[def.id] ? `<span class="badge" id="${BADGE_ID[def.id]}" hidden></span>` : "");
    if (!STATIC.has(def.id)) b.addEventListener("click", () => onTap(def.id, b));
    layer.append(b);
    els[def.id] = { b, pic: b.querySelector(".pic"), tag: b.querySelector(".market-tag"), bar: b.querySelector(".lot-bar"), arrow: b.querySelector(".up-arrow"), key: "" };
  }
  slotLayer.addEventListener("click", (e) => { const d = e.target.closest(".dslot"); if (d) onSlot(d.dataset.slot, d); });
  const critterLayer = document.createElement("div");
  critterLayer.className = "critter-layer"; critterLayer.setAttribute("aria-hidden", "true");
  layer.after(critterLayer);
  let critterKey = "";
  /** % background-position của khung `id` trong atlas animals (frame vuông `fw` px). */
  const framePos = (id, fw) => {
    const f = frame("animals", id), sh = sheetOf("animals");
    if (!f || !sh) return null;
    return `${+((f.x / (sh.width - fw)) * 100).toFixed(3)}% ${+((f.y / (sh.height - fw)) * 100).toFixed(3)}%`;
  };
  function renderCritters(s, layout) {
    const counts = {};
    for (const a of s.animals?.list || []) counts[a.kind] = (counts[a.kind] || 0) + 1;
    const out = [];
    for (const [kind, c] of Object.entries(CRITTERS)) {
      const home = layout.items.find((it) => it.id === c.housing);
      const n = Math.min(c.max, counts[kind] || 0);
      if (!home || home.view !== "built" || !n) continue;
      const sh = sheetOf("animals");
      if (!sh) continue;
      for (let k = 0; k < n; k++) {
        const cr = c.list[k], p1 = framePos(cr.frames[0], c.frame), p2 = framePos(cr.frames[1], c.frame);
        if (!p1 || !p2) continue;
        const fx = home.x * MW + cr.at[0], fy = home.y * MH + cr.at[1], sz = c.size;
        out.push(`<span class="critter critter--${cr.mode} critter--${kind}" style="left:${X(fx - sz / 2)};top:${Y(fy - sz * 0.88)};width:${X(sz)};height:${Y(sz)};` +
          `background-size:${+((sh.width / c.frame) * 100).toFixed(3)}% ${+((sh.height / c.frame) * 100).toFixed(3)}%;--f1:${p1};--f2:${p2};animation-delay:0s,${cr.delay}s"></span>`);
      }
    }
    const key = bw + out.join("");
    if (key === critterKey) return;
    critterKey = key;
    critterLayer.innerHTML = out.join("");
  }

  const pct = (v) => +v.toFixed(3) + "%";
  const X = (px) => pct((px / (MW * bw)) * 100), Y = (px) => pct((px / MH) * 100);
  function placeArt() {
    for (const a of map.querySelectorAll("[data-art]")) {
      const [x, y, w, h] = a.dataset.art.split(",").map(Number);
      if (a.tagName === "IMG") Object.assign(a.style, { left: X(x - w / 2), width: X(w), bottom: Y(MH - y) });
      else Object.assign(a.style, { left: X(x), top: Y(y), width: X(w), height: Y(h) });
    }
    const box = (el, F) => Object.assign(el.style, { left: X(F.x * MW), top: Y(F.y * MH), width: X(F.w * MW), height: Y(F.h * MH) });
    box(field, L.FIELD); box(fieldEast, L.EAST_FIELD);
    Object.assign(eastWild.style, { left: X(MW), width: X(MW * (bw - 1)) });
  }
  function setBw(next) {
    if (next === bw) return;
    bw = next;
    map.style.setProperty("--bw", String(bw));
    map.style.aspectRatio = `${MW * bw} / ${MH}`;
    placeArt();
    for (const k of Object.keys(els)) els[k].key = "";
    decorKey = slotKey = critterKey = "";
  }
  /** Đặt hộp vẽ: atlas ⇒ theo khung + điểm neo manifest; ảnh garden ⇒ neo đáy-giữa. */
  function place(el, def, sprite) {
    const x = def.x * MW, y = def.y * MH, w = def.w * MW;
    if (sprite?.sheet === "garden") {
      const [nw, nh] = GARDEN[sprite.id] || [1, 1];
      const h = Math.max((w * nh) / nw, def.hitH || 0); // hitH: vùng chạm tối thiểu (hàng rào thấp ⇒ ≥ 44 px trên điện thoại), ảnh giữ tỉ lệ, đáy chạm neo
      Object.assign(el.style, { left: X(x - w / 2), top: Y(y - h), width: X(w), height: Y(h) });
      return;
    }
    const f = sprite && frame(sprite.sheet, sprite.id);
    const fw = f?.width || 256, fh = f?.height || 256;
    // Bản vẽ (lo-ban-ve) neo giữa khung ⇒ đặt như công trình (neo đáy 226/256) để nằm đúng lô, không thò xuống dưới mép bản đồ (lỗi M4: chuồng gà / bò)
    const [ax, ay] = sprite?.id === BLUEPRINT_ID ? [fw / 2, (fh * 226) / 256] : f?.anchor || [fw / 2, fh * 0.88];
    const h = (w * fh) / fw;
    Object.assign(el.style, { left: X(x - (w * ax) / fw), top: Y(y - (h * ay) / fh), width: X(w), height: Y(h) });
  }
  /** Cờ hội Phiên chợ: phien-cho.webp (co-hoi-1/2, Codex) khi có, không thì 2 đèn lồng của decor.webp. */
  // Có cả co-hoi-2 ⇒ chồng khung 2 lên, CSS bật / tắt 3 fps (clip "co-hoi"), không cần vòng JS
  const fairFlagHtml = () => frame("phien-cho", "co-hoi-1")
    ? `<span class="fair-flag fair-flag--art" style="${spriteCss("phien-cho", "co-hoi-1")}"></span>` +
      (frame("phien-cho", "co-hoi-2") ? `<span class="fair-flag fair-flag--art fair-flag--b" style="${spriteCss("phien-cho", "co-hoi-2")}"></span>` : "")
    : `<span class="fair-flag"><i style="${spriteCss("decor", "den-long") || ""}"></i><i style="${spriteCss("decor", "den-long") || ""}"></i></span>`;
  const picHtml = (sprite, cls = "spr") => !sprite ? "" : sprite.sheet === "garden"
    ? `<img class="${cls}${sprite.filter ? " spr--" + sprite.filter : ""}" src="assets/garden/${sprite.id}.webp" alt="">`
    : `<span class="${cls}" style="${spriteCss(sprite.sheet, sprite.id) || ""}"></span>`;

  /** Công trình kế tiếp sẽ mở (bản vẽ mờ + "cấp N" hiện cả ngoài chế độ Xây để người chơi biết sắp có gì). */
  function teaserOf(layout, level) {
    let best = null;
    for (const it of layout.items) {
      if (it.view !== "locked" || !L.inMilestone(it.id) || it.kind === "machine" || it.kind === "auto" || it.area === "east") continue;
      if (it.unlockLevel > level && (!best || it.unlockLevel < best.unlockLevel)) best = it;
    }
    return best?.id || null;
  }

  /**
   * Vẽ lại bản đồ. ctx = { s, t, buildMode, canAfford(id) }. Trả layout (mapLayout) để game.js dùng (thẻ xây, highlight).
   */
  let fairOn = false;
  function render({ s, t, buildMode, canAfford, busyMill, fair }) {
    fairOn = !!fair;
    const layout = L.mapLayout({ build: s, level: s.level, now: t, production: s.production });
    setBw(layout.eastOpen || s.level >= L.BUILDING["dat-phia-dong"].levels[0].unlock ? L.EAST_W : 1);
    farm.classList.toggle("building", !!buildMode);
    eastWild.hidden = !(bw > 1 && !layout.eastOpen);
    fieldEast.hidden = !layout.eastOpen;
    const teaser = teaserOf(layout, s.level);
    const shown = new Set();
    for (const it of layout.items) {
      const e = els[it.id];
      if (!e) continue;
      const inMs = L.inMilestone(it.id);
      const view = inMs ? it.view : "locked", status = inMs ? it.status : "locked";
      let visible;
      if (it.area === "east" && bw === 1) visible = false; // phía Đông chỉ hiện khi bản đồ đã nới rộng (cấp 17)
      else if (!inMs) visible = buildMode && it.kind === "build";
      else if (view === "built" || view === "scaffold") visible = true;
      else if (view === "blueprint") visible = it.kind !== "machine" || buildMode;
      else visible = buildMode || it.id === teaser;
      e.b.hidden = !visible;
      if (!visible) continue;
      shown.add(it.id);
      const sprite = view === "locked" || view === "blueprint" ? { sheet: "buildings", id: "lo-ban-ve" } : view === "scaffold" ? { sheet: "buildings", id: "gian-giao" } : resolveSprite(it.sprite);
      const flag = it.id === "sap-cho" && !!fairOn; // Milestone 6: cờ hội trên chợ khi đang có Phiên chợ
      const key = [bw, view, sprite?.sheet, sprite?.id, sprite?.filter, it.rotor?.id, !!it.upgrading, flag].join("|");
      if (e.key !== key) {
        e.key = key;
        e.pic.innerHTML = picHtml(sprite) + (it.rotor && view === "built" ? picHtml(it.rotor, "rotor") : "") +
          (it.upgrading ? picHtml({ sheet: "buildings", id: "gian-giao" }, "mini-scaffold") : "") + (flag ? fairFlagHtml() : "");
        place(e.b, it, sprite);
      }
      if (it.rotor) e.pic.querySelector(".rotor")?.classList.toggle("fast", !!busyMill);
      e.b.dataset.view = view; e.b.dataset.status = status; e.b.dataset.level = String(it.level);
      e.b.dataset.state = status === "upgradeable" ? "done" : status; // tên trạng thái của M2 (#workshopLot)
      // nhãn
      let tag;
      const remain = it.upgrading ? it.upgrading.remainingMs : it.remainingMs;
      if (status === "building") tag = `${it.upgrading ? "Đang nâng" : "Đang xây"} ${fmtClock(remain)}`;
      else if (buildMode) {
        tag = status === "locked" ? (inMs ? `Khoá · Cấp ${it.unlockLevel}` : s.level >= it.unlockLevel ? "Khoá · sắp có" : `Khoá · Cấp ${it.unlockLevel}`) : STATUS_TEXT[status];
      } else if (status === "available") tag = "Có thể xây";
      else if (status === "locked") tag = `${it.name.replace(" chế biến", "")} · cấp ${it.unlockLevel}`;
      else tag = it.id === "nha" ? (it.level >= 2 ? `Nhà ★${it.level - 1}` : "") : it.id === "sap-cho" && fairOn ? "Phiên chợ!" : NORMAL_TAG[it.id] || "";
      if (e.tag.textContent !== tag) e.tag.textContent = tag;
      // thanh tiến độ (giàn giáo / đang nâng)
      const prog = it.upgrading ? it.upgrading.progress : it.progress;
      e.bar.hidden = status !== "building" || prog === null;
      if (!e.bar.hidden) e.bar.firstChild.style.width = Math.round((prog || 0) * 100) + "%";
      // mũi tên vàng: chế độ Xây ⇒ mọi công trình nâng được; ngoài chế độ Xây ⇒ chỉ khi đủ xu + vật liệu
      const up = inMs && status === "upgradeable", afford = up && canAfford(it.id);
      e.arrow.hidden = !(up && (buildMode || afford));
      e.b.classList.toggle("dim-arrow", up && !afford);
      const label = `${it.name} — ${STATUS_TEXT[status]}${status === "locked" ? (inMs ? ` (cấp ${it.unlockLevel})` : " (bản cập nhật sau)") : ""}${status === "building" ? `, còn ${fmtClock(remain)}` : ""}`;
      if (e.b.getAttribute("aria-label") !== label) { e.b.setAttribute("aria-label", label); e.b.title = label; }
    }
    for (const [id, e] of Object.entries(els)) if (!shown.has(id)) e.b.hidden = true;

    renderCritters(s, layout);
    // trang trí đã đặt
    const dk = bw + JSON.stringify(layout.decor);
    if (dk !== decorKey) {
      decorKey = dk;
      decorLayer.innerHTML = layout.decor.map((d) => {
        const w = d.w * MW, f = frame("decor", d.id), [ax, ay] = f?.anchor || [64, 112];
        return `<span class="decor-spr" data-slot="${d.slot}" style="left:${X(d.x * MW - (w * ax) / 128)};top:${Y(d.y * MH - (w * ay) / 128)};width:${X(w)};height:${Y(w)};${spriteCss("decor", d.id) || ""}"></span>`;
      }).join("");
    }
    // ô trang trí (chỉ chế độ Xây)
    const open = buildMode ? layout.decorSlots.filter((x) => x.open) : [];
    const sk = bw + JSON.stringify(open);
    if (sk !== slotKey) {
      slotKey = sk;
      slotLayer.innerHTML = open.map((x) => {
        const w = x.w * MW, placed = layout.decor.find((d) => d.slot === x.id);
        const label = placed ? `Ô trang trí đang có ${esc(L.DECOR_ITEM[placed.id].name)} — chạm để cất` : `Ô trang trí ${x.size === "l" ? "lớn" : "nhỏ"} — chạm để đặt`;
        return `<button type="button" class="dslot${x.free ? "" : " taken"}" data-slot="${x.id}" data-key="slot-${x.id}" aria-label="${label}" title="${label}" ` +
          `style="left:${X(x.x * MW - w / 2)};top:${Y(x.y * MH - (w * 112) / 128)};width:${X(w)};height:${Y(w)}"><span>+</span></button>`;
      }).join("");
    }
    last = layout;
    return layout;
  }

  return {
    render,
    el: (id) => els[id]?.b || null,
    slotEl: (id) => slotLayer.querySelector(`[data-slot="${id}"]`) || decorLayer.querySelector(`[data-slot="${id}"]`),
    get layout() { return last; },
    /** Sprite vừa nạp xong ⇒ vẽ lại mọi thứ. */
    invalidate() { for (const k of Object.keys(els)) els[k].key = ""; decorKey = slotKey = critterKey = ""; },
    get bw() { return bw; },
    /** Cuộn khung bản đồ để điểm x (toạ độ bản đồ gốc, 0..bw) vào giữa. */
    scrollToX(xNorm, smooth = false) {
      const w = map.getBoundingClientRect().width;
      const left = Math.max(0, (xNorm / bw) * w - farm.clientWidth / 2);
      farm.scrollTo({ left, behavior: smooth ? "smooth" : "auto" });
    },
  };
}
