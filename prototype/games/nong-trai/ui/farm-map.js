// Bản đồ nông trại (Milestone 3): vẽ công trình / bản vẽ / giàn giáo / trang trí theo core/levels-map.js mapLayout().
// Chỉ hiển thị — mọi thay đổi trạng thái đi qua apply() ở game.js (onTap / onSlot gọi ra ngoài).
// Toạ độ chuẩn hoá theo bản đồ 960 × 600 (data/buildings.js); bản đồ rộng EAST_W lần khi tới cấp 17 / mở Khu đất phía Đông.
import { frame, sheet as sheetOf } from "./sprites.js?v=m3b";

const MW = 960, MH = 600;
const GARDEN = { house: [269, 184], market: [205, 190] }; // kích thước gốc ảnh assets/garden (neo đáy-giữa)
export const STATUS_TEXT = { locked: "Khoá", available: "Có thể xây", building: "Đang xây", done: "Hoàn thành", upgradeable: "Nâng cấp được" };
const SPECIAL_ID = { xuong: "workshopLot", "sap-cho": "market", "bang-don-hang": "boardBtn" };
const NORMAL_TAG = { xuong: "Xưởng chế biến", "sap-cho": "Khu chợ", "bang-don-hang": "Bảng đơn", "nha-kho": "Nhà kho", "nha-kinh": "Nhà kính" };
const STATIC = new Set(["nha", "bien-lang", "xe-giao-hang"]); // cảnh vật, không chạm

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
      (def.id === "xuong" ? '<span class="badge" id="wsBadge" hidden></span>' : def.id === "bang-don-hang" ? '<span class="badge" id="boardBadge" hidden></span>' : "");
    if (!STATIC.has(def.id)) b.addEventListener("click", () => onTap(def.id, b));
    layer.append(b);
    els[def.id] = { b, pic: b.querySelector(".pic"), tag: b.querySelector(".market-tag"), bar: b.querySelector(".lot-bar"), arrow: b.querySelector(".up-arrow"), key: "" };
  }
  slotLayer.addEventListener("click", (e) => { const d = e.target.closest(".dslot"); if (d) onSlot(d.dataset.slot, d); });

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
    decorKey = slotKey = "";
  }
  /** Đặt hộp vẽ: atlas ⇒ theo khung + điểm neo manifest; ảnh garden ⇒ neo đáy-giữa. */
  function place(el, def, sprite) {
    const x = def.x * MW, y = def.y * MH, w = def.w * MW;
    if (sprite?.sheet === "garden") {
      const [nw, nh] = GARDEN[sprite.id] || [1, 1];
      Object.assign(el.style, { left: X(x - w / 2), top: Y(y - (w * nh) / nw), width: X(w), height: Y((w * nh) / nw) });
      return;
    }
    const f = sprite && frame(sprite.sheet, sprite.id);
    const fw = f?.width || 256, fh = f?.height || 256, [ax, ay] = f?.anchor || [fw / 2, fh * 0.88];
    const h = (w * fh) / fw;
    Object.assign(el.style, { left: X(x - (w * ax) / fw), top: Y(y - (h * ay) / fh), width: X(w), height: Y(h) });
  }
  const picHtml = (sprite, cls = "spr") => !sprite ? "" : sprite.sheet === "garden"
    ? `<img class="${cls}" src="assets/garden/${sprite.id}.webp" alt="">`
    : `<span class="${cls}" style="${spriteCss(sprite.sheet, sprite.id) || ""}"></span>`;

  /** Công trình kế tiếp sẽ mở (bản vẽ mờ + "cấp N" hiện cả ngoài chế độ Xây để người chơi biết sắp có gì). */
  function teaserOf(layout, level) {
    let best = null;
    for (const it of layout.items) {
      if (it.view !== "locked" || !L.inMilestone(it.id) || it.kind === "machine" || it.area === "east") continue;
      if (it.unlockLevel > level && (!best || it.unlockLevel < best.unlockLevel)) best = it;
    }
    return best?.id || null;
  }

  /**
   * Vẽ lại bản đồ. ctx = { s, t, buildMode, canAfford(id) }. Trả layout (mapLayout) để game.js dùng (thẻ xây, highlight).
   */
  function render({ s, t, buildMode, canAfford, busyMill }) {
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
      const sprite = view === "locked" || view === "blueprint" ? { sheet: "buildings", id: "lo-ban-ve" } : view === "scaffold" ? { sheet: "buildings", id: "gian-giao" } : it.sprite;
      const key = [bw, view, sprite?.sheet, sprite?.id, it.rotor?.id, !!it.upgrading].join("|");
      if (e.key !== key) {
        e.key = key;
        e.pic.innerHTML = picHtml(sprite) + (it.rotor && view === "built" ? picHtml(it.rotor, "rotor") : "") +
          (it.upgrading ? picHtml({ sheet: "buildings", id: "gian-giao" }, "mini-scaffold") : "");
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
      else tag = NORMAL_TAG[it.id] || "";
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
    invalidate() { for (const k of Object.keys(els)) els[k].key = ""; decorKey = slotKey = ""; },
    get bw() { return bw; },
    /** Cuộn khung bản đồ để điểm x (toạ độ bản đồ gốc, 0..bw) vào giữa. */
    scrollToX(xNorm, smooth = false) {
      const w = map.getBoundingClientRect().width;
      const left = Math.max(0, (xNorm / bw) * w - farm.clientWidth / 2);
      farm.scrollTo({ left, behavior: smooth ? "smooth" : "auto" });
    },
  };
}
