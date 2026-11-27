// Cảnh Xưởng chế biến (DESIGN-2.0 §1 khu 2): nội thất gỗ (tường + sàn từ workshop.webp), máy đứng dọc tường (machines.webp,
// khung idle / chạy theo manifest), dưới mỗi máy là khay hàng chờ (ui-kit hang-cho-*), bảng công thức (ui-kit the-cong-thuc)
// trượt lên khi chạm máy. Mọi thay đổi đi qua ctx.exec(action) ⇒ apply(). Chỉ hiển thị + điều khiển.
import { loadSprites, draw, machineFrame, playFx } from "./sprites.js?v=m16";

const MACHINE_ERR = {
  inputs: "Thiếu nguyên liệu", "queue-full": "Hàng chờ đầy", building: "Máy đang xây", locked: "Chưa đủ cấp",
  "machine-level": "Cần nâng máy", "not-built": "Chưa xây máy", "wrong-machine": "Sai máy", bad: "Không làm được",
};

export function createWorkshopScene(ctx) {
  const { L, esc, fmtNum, fmtClock, fmtLeft, iconHtml, until, setHtml } = ctx;
  const root = document.getElementById("workshopScene");
  const list = document.getElementById("wsMachines");
  const plate = document.getElementById("wsPlate");
  const ov = document.getElementById("ovRecipe"), card = document.getElementById("recipeBody");
  let open = null, raf = 0, lastDraw = 0;
  const blocks = {};

  for (const def of L.MACHINES_NOW) {
    const el = document.createElement("article");
    el.className = "mach"; el.dataset.m = def.id;
    el.innerHTML = `<button class="mach-btn" type="button" data-act="open" data-m="${def.id}" data-key="open-${def.id}">` +
      `<canvas width="192" height="192" aria-hidden="true"></canvas><span class="mach-tag"></span><span class="mach-badge" hidden></span></button>` +
      `<ul class="queue" aria-label="Hàng chờ ${esc(def.name)}"></ul><div class="mach-foot"></div>`;
    list.append(el);
    blocks[def.id] = { el, cv: el.querySelector("canvas"), tag: el.querySelector(".mach-tag"), badge: el.querySelector(".mach-badge"),
      btn: el.querySelector(".mach-btn"), queue: el.querySelector(".queue"), foot: el.querySelector(".mach-foot"), key: "" };
  }

  const ctxOf = () => L.ctxOf(ctx.s, ctx.now());
  const statusOf = () => L.machineStatus(ctx.s.production, ctx.now(), ctxOf());
  /** "locked" | "available" | "building" | "ready" cho từng máy. */
  function machineState(def, st) {
    if (!st) return ctx.s.level >= def.unlock ? "available" : "locked";
    return st.built ? "ready" : "building";
  }

  // ---------- vẽ máy (canvas, chỉ khi cảnh đang mở) ----------
  function paint(t) {
    const st = statusOf();
    for (const def of L.MACHINES_NOW) {
      const b = blocks[def.id], m = st[def.id], state = machineState(def, m);
      const running = state === "ready" && !!m.running;
      // Lò bánh level 2 (bánh flan) dùng lò hai cửa riêng ở machines-2.webp hàng 3
      const big = def.id === "lo-banh" && m && m.level >= 2;
      const sheetName = big ? "machines-2" : def.sheet || "machines", prefix = big ? "lo-banh-2" : def.sprite;
      const key = state + (big ? "2" : "") + (running ? Math.floor(t / 240) % 2 : "");
      if (key === b.key) continue;
      b.key = key;
      const g = b.cv.getContext("2d");
      g.clearRect(0, 0, 192, 192);
      if (state === "locked" || state === "available") {
        draw(g, "buildings", "lo-ban-ve", 96, 112, 0.7, state === "locked" ? 0.45 : 1);
        draw(g, sheetName, `${prefix}-idle`, 96, 168, 1, state === "locked" ? 0.12 : 0.28);
      } else {
        draw(g, sheetName, machineFrame(sheetName, prefix, running, t), 96, 168, 1, state === "building" ? 0.5 : 1);
      }
    }

  }
  function loop(t) {
    raf = 0;
    if (root.hidden || document.hidden) return;
    if (t - lastDraw > 120) { lastDraw = t; paint(t); }
    raf = requestAnimationFrame(loop);
  }

  // ---------- HTML ----------
  function slotHtml(def, job, now, k) {
    const r = L.RECIPE[job.recipe];
    if (now >= job.endAt) {
      return `<li><button class="slot slot--done" type="button" data-act="collect" data-m="${def.id}" data-uid="${job.uid}" data-key="c-${def.id}-${job.uid}" aria-label="Nhận ${esc(r.name)}">` +
        `${iconHtml(r.output)}<b>Nhận</b>${r.qty > 1 ? `<i class="slot-qty">×${r.qty}</i>` : ""}</button></li>`;
    }
    if (now >= job.startAt) {
      const p = Math.max(0, Math.min(1, (now - job.startAt) / (job.endAt - job.startAt)));
      return `<li><div class="slot slot--run" title="${esc(r.name)} — còn ${esc(fmtLeft(job.endAt - now))}">${iconHtml(r.output)}` +
        `<span class="slot-time">${until(job.endAt)}</span><span class="slot-bar"><i style="width:${Math.round(p * 100)}%"></i></span></div></li>`;
    }
    return `<li><div class="slot slot--wait" title="${esc(r.name)} — chờ tới lượt (ô ${k + 1})">${iconHtml(r.output)}<span class="slot-time">chờ</span></div></li>`;
  }

  function renderMachine(def, m, now) {
    const b = blocks[def.id], s = ctx.s, state = machineState(def, m);
    b.el.dataset.state = state;
    const name = `${def.name}${m ? ` · Lv ${m.level}` : ""}`;
    if (b.tag.textContent !== name) b.tag.textContent = name;
    b.btn.setAttribute("aria-label", state === "locked" ? `${def.name} — mở ở cấp ${def.unlock}` : state === "available" ? `${def.name} — có thể xây` : `${def.name} — chọn công thức`);
    const fin = m ? m.finished : 0;
    b.badge.hidden = !fin; b.badge.textContent = fin || "";
    let q = "", foot = "";
    if (state === "locked") {
      q = `<li class="q-note">${iconHtml("o-khoa", "it--sm")} Mở ở cấp ${def.unlock}</li>`;
    } else if (state === "available") {
      const ok = s.coins >= def.buildCost;
      q = `<li class="q-note">Bản vẽ ${esc(def.name)} · xây ${fmtClock(def.buildMs)}</li>`;
      const a = L.about(def.id, 1, 0, "machine"); // m7: "Dùng để / Bạn được" trước khi bấm Xây
      foot = (a ? `<small class="mach-use"><b>Dùng để:</b> ${esc(a.use.replace(/^Làm /, "làm "))} <b>Bạn được:</b> ${esc(a.gain[0])}</small>` : "") +
        `<button class="btn btn--teal btn--sm" type="button" data-act="build" data-m="${def.id}" data-key="b-${def.id}"${ok ? "" : " disabled"}>Xây · ${fmtNum(def.buildCost)} xu</button>` +
        (ok ? "" : `<small class="need">Cần ${fmtNum(def.buildCost)} xu</small>`);
    } else if (state === "building") {
      q = `<li class="q-note">Đang xây… còn ${until(s.production.machines[def.id].readyAt)}</li>`;
    } else {
      const raw = s.production.machines[def.id];
      q = raw.queue.map((j, k) => slotHtml(def, j, now, k)).join("");
      for (let k = raw.queue.length; k < m.slots; k++) {
        q += `<li><button class="slot slot--empty" type="button" data-act="open" data-m="${def.id}" data-key="e-${def.id}-${k}" aria-label="Ô trống — chọn công thức"><b>+</b></button></li>`;
      }
      const up = L.nextUpgrade(s.production, def.id);
      if (m.finished > 1) foot += `<button class="btn btn--primary btn--sm" type="button" data-act="collectAll" data-m="${def.id}" data-key="ca-${def.id}">Nhận hết (${m.finished})</button>`;
      if (up) {
        const ok = s.coins >= up.cost;
        foot += `<button class="btn btn--sm" type="button" data-act="upgrade" data-m="${def.id}" data-key="u-${def.id}"${ok ? "" : " disabled"} title="Nâng máy: món chờ làm cùng lúc ${m.slots} → ${m.slots - raw.slots + up.slots}">Nâng · ${fmtNum(up.cost)} xu (${m.slots} → ${m.slots - raw.slots + up.slots} ô)</button>`;
      } else foot += `<small class="mach-max">Máy tối đa ${m.slots} ô</small>`;
    }
    setHtml(b.queue, q);
    setHtml(b.foot, foot);
  }

  function renderPlate(now) {
    const s = ctx.s, w = L.workshopOf(s), up = L.nextWorkshopUpgrade(s);
    const wl = L.workshopLevel(s, now), extra = L.extraSlots(s, now);
    let html = `<b>Xưởng chế biến</b><small>Cấp ${wl}${extra ? ` · +${extra} ô mọi máy` : ""}</small>`;
    void w;
    if (up && s.level >= up.level) {
      const ok = s.coins >= up.cost;
      html += `<button class="btn btn--sm" type="button" id="wsUpgrade" data-act="upgradeWorkshop" data-key="ws-up"${ok ? "" : " disabled"}>Nâng Xưởng cấp ${up.toLevel} · ${fmtNum(up.cost)} xu (+1 ô mọi máy)</button>`;
    } else if (up) html += `<small>Cấp ${up.level}: nâng Xưởng cấp ${up.toLevel} (+1 ô hàng chờ mọi máy)</small>`;
    setHtml(plate, html);
    void now;
  }

  // ---------- bảng công thức ----------
  function recipeHtml(def) {
    const s = ctx.s, now = ctx.now(), c = ctxOf(), inv = L.bag(s);
    const m = s.production.machines[def.id], st = m ? statusOf()[def.id] : null;
    const head = `<div class="rc-head">${def.name ? `<b id="recipeTitle">${esc(def.name)}</b>` : ""}<small>${st ? `Hàng chờ ${m.queue.length}/${st.slots}` : ""}</small>` +
      `<button class="btn btn--sm rc-close" type="button" data-act="close" data-key="rc-close" aria-label="Đóng">✕</button></div>`;
    const rows = L.recipesOf(def.id).map((r) => {
      const code = L.canEnqueue(s.production, inv, def.id, r.id, now, c);
      const locked = s.level < r.level ? `Cấp ${r.level}` : m && m.level < r.machineLevel ? `Cần ${def.name} cấp ${r.machineLevel}` : "";
      const ins = Object.entries(r.inputs).map(([id, q]) => {
        const have = L.have(s, id), it = L.ITEM[id];
        return `<li class="${have >= q ? "ok" : "miss"}" title="${esc(it.name)}: ${esc(it.source)}">${iconHtml(id, "it--sm")}<span>${esc(it.name)}</span><b>${Math.min(have, q)}/${q}</b></li>`;
      }).join("");
      const value = L.ITEM[r.output].sell * r.qty;
      const reason = code ? (locked || MACHINE_ERR[code] || "Không làm được") : "";
      return `<li class="rc-row${locked ? " locked" : ""}">` +
        `<div class="rc-out">${iconHtml(r.output)}<div><b>${esc(r.name)}</b><small>${fmtClock(r.ms)} · ${iconHtml("dong-xu", "it--xs")}${fmtNum(value)} · ${iconHtml("sao-xp", "it--xs")}${r.xp} XP</small></div></div>` +
        `<ul class="rc-in">${ins}</ul>` +
        `<div class="rc-go"><button class="btn btn--teal btn--sm" type="button" data-act="start" data-m="${def.id}" data-r="${r.id}" data-key="go-${r.id}"${code ? " disabled" : ""}>Bắt đầu</button>` +
        (reason ? `<small class="need">${esc(reason)}</small>` : "") + `</div></li>`;
    }).join("");
    return head + `<ul class="rc-list">${rows}</ul><p class="rc-note">Nguyên liệu bị trừ khi bấm “Bắt đầu”. Máy chạy tuần tự, cả khi bạn tắt trang.</p>`;
  }
  function openRecipes(id) {
    const def = L.MACHINE[id];
    if (!def) return;
    const m = ctx.s.production.machines[id];
    if (!m) { ctx.toast(ctx.s.level < def.unlock ? `${def.name} mở ở cấp ${def.unlock}.` : `Xây ${def.name} trước đã (${fmtNum(def.buildCost)} xu).`); ctx.sfx("trung-da", 0.3); return; }
    open = id; ov.hidden = false; render();
    ctx.sfx("buoc-nhay", 0.3, 1.2);
    card.querySelector('[data-act="start"]:not([disabled])')?.focus({ preventScroll: true }) || card.querySelector(".rc-close")?.focus({ preventScroll: true });
  }
  function closeRecipes() { if (!open) return; const id = open; open = null; ov.hidden = true; blocks[id]?.btn.focus({ preventScroll: true }); }

  function render() {
    if (root.hidden) return;
    const now = ctx.now(), st = statusOf();
    renderPlate(now);
    for (const def of L.MACHINES_NOW) renderMachine(def, st[def.id], now);
    if (open) setHtml(card, recipeHtml(L.MACHINE[open]));
    if (!raf) raf = requestAnimationFrame(loop);
  }

  // ---------- điều khiển ----------
  function onClick(e) {
    const b = e.target.closest("[data-act]");
    if (!b || b.disabled) return;
    const m = b.dataset.m, act = b.dataset.act;
    if (act === "open") openRecipes(m);
    else if (act === "close") closeRecipes();
    else if (act === "start") ctx.exec({ type: "enqueue", machine: m, recipe: b.dataset.r }, { el: blocks[m].queue });
    else if (act === "collect") ctx.exec({ type: "collect", machine: m, uid: Number(b.dataset.uid) }, { el: b });
    else if (act === "collectAll") ctx.exec({ type: "collectAll", machine: m }, { el: blocks[m].queue });
    else if (act === "upgrade") ctx.exec({ type: "upgradeMachine", machine: m }, { el: blocks[m].btn });
    else if (act === "build") ctx.exec({ type: "buildMachine", machine: m }, { el: blocks[m].btn });
    else if (act === "upgradeWorkshop") ctx.exec({ type: "upgradeWorkshop" }, { el: plate });
  }
  root.addEventListener("click", onClick);
  card.addEventListener("click", onClick);
  ov.addEventListener("click", (e) => { if (e.target === ov) closeRecipes(); });

  /** Hiệu ứng tại phần tử (fx sprite + chữ nổi). */
  function fxAt(el, kinds, text, color) {
    const host = root, r = el?.getBoundingClientRect?.(), h = host.getBoundingClientRect();
    if (!r) return;
    const x = r.left - h.left + r.width / 2, y = r.top - h.top + r.height / 2;
    for (const k of kinds) playFx(host, k, x, y, 64);
    if (text) ctx.floatAt(host, x, y - 20, text, color);
  }

  loadSprites().then(() => { for (const b of Object.values(blocks)) b.key = ""; render(); });
  return {
    root, render,
    show() { root.hidden = false; for (const b of Object.values(blocks)) b.key = ""; render(); },
    hide() { root.hidden = true; closeRecipes(); },
    get recipeOpen() { return open; },
    closeRecipes, openRecipes, fxAt,
    machineEl: (id) => blocks[id]?.btn,
    onKey(e) { if (open && e.key === "Escape") { e.preventDefault(); closeRecipes(); return true; } return false; },
  };
}
