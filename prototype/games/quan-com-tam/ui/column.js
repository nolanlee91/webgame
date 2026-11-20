// Cột Dĩa (SCREENS.md): thanh phiếu (màu viền = màu bàn) + ô bày (phiếu ghim, dĩa xếp lớp từ plate-layers, dải lớp, Hoàn tác / Giao)
// + phiếu tính tiền khi cô chủ đang đứng tính tiền ở bàn + danh sách việc theo bàn + bảng Bếp (mobile: dock Bàn / Bếp).
// Dĩa vẽ bằng cùng đường atlas với cảnh: plate-layers (lưới 2×) hoặc plate-layers-hd khi Codex giao đợt 2 (cùng tên frame), hệ số qua crisp.
import { el, button, fmtK, tableColor, tableName } from "./common.js?v=c1";
import { paint, dpr } from "../render/atlas.js?v=c1";
import { DISHES, EXTRAS } from "../data/economy.js?v=c1";
import { QUIRKS } from "../data/customers.js?v=c1";
import { layerStrip, LAYER_NAME, targetOf, plateFrames, slotOf, ticketOf, nextStep, bestPiece } from "../core/plate.js?v=c1";
import { tableJob, groupById, patienceLeft } from "../core/tables.js?v=c1";
import { billTotal, canAutoBill } from "../core/bill.js?v=c1";
import { ownerFree } from "../core/walker.js?v=c1";
import { isCooked } from "../core/grill.js?v=c1";
import { JOB_LABEL } from "../render/scene.js?v=c1";

const SAUCE = { chan: "chan", chen: "chén riêng", bich: "bịch" };

export function createColumn(railEl, workEl, atlas, act, hooks) {
  railEl.textContent = ""; workEl.textContent = "";
  // ---- ô bày ----
  const wPlate = el("div", "w-plate", workEl);
  const head = el("div", "tk-head", wPlate);
  const row = el("div", "plate-row", wPlate);
  const wrap = el("div", "plate-wrap", row);
  const view = el("div", "plate-view", wrap);
  const empty = el("div", "plate-empty", wrap, "Chạm một phiếu để ghim lên ô bày.");
  const strip = el("div", "strip", row);
  const acts = el("div", "acts", wPlate);
  const undoB = button(acts, "btn", "Hoàn tác", () => act({ type: "undo" }), { "data-act": "undo", title: "Hoàn tác (Backspace)" });
  const tossB = button(acts, "btn danger small", "Đổ dĩa", () => act({ type: "discard" }), { "data-act": "discard" });
  const serveB = button(acts, "btn primary", "Giao", () => act({ type: "serve" }), { "data-act": "serve", "data-hint": "serve", title: "Giao (Enter)" });
  const bill = el("div", "bill", wPlate); bill.hidden = true;
  // ---- việc theo bàn ----
  const wTables = el("div", "w-tables jobs", workEl);
  // ---- bếp (mobile) ----
  const wKitchen = el("div", "w-kitchen", workEl);
  const kp = el("div", "kpanel", wKitchen);
  const kb = {
    rice: button(kp, "btn", "Nấu cơm", () => act({ type: "cookRice" }), { "data-act": "k-cookRice" }),
    mo: button(kp, "btn", "Làm mỡ hành", () => act({ type: "moHanh" }), { "data-act": "k-moHanh" }),
    wash: button(kp, "btn", "Rửa chén", () => act({ type: "wash" }), { "data-act": "k-wash" }),
    coal: button(kp, "btn", "Thêm than", () => act({ type: "addCoal" }), { "data-act": "k-addCoal" }),
    mar: button(kp, "btn", "Ướp gấp sườn", () => act({ type: "marinateNow" }), { "data-act": "k-marinate" }),
    egg: button(kp, "btn", "Chiên trứng", () => act({ type: "egg" }), { "data-act": "k-egg" }),
  };
  const kInfo = el("p", "muted", wKitchen);

  let stripSig = "", railSig = "", jobsSig = "", billSig = "", plateSig = "", headSig = "";
  const layBtns = new Map();

  function drawPlate(p) {
    const frames = plateFrames(p);
    const w = Math.max(100, Math.min(wrap.clientWidth || 256, 256)) - 8;
    const d = dpr() * 2;
    const scale = Math.max(0.5, Math.floor(((w / 160) * d) + 1e-6) / d);
    const sig = frames.join(",") + "@" + scale;
    if (sig === plateSig) return;
    plateSig = sig;
    view.textContent = "";
    view.style.width = 160 * scale + "px"; view.style.height = 192 * scale + "px";
    for (const name of frames) {
      const f = atlas.frame("plate", name);
      if (!f) continue;
      const e = el("div", "spr", view);
      paint(e, f, scale);
      e.style.left = (80 - f.ax) * scale + "px"; e.style.top = (174 - f.ay) * scale + "px";
      e.dataset.layer = name;
    }
    view.dataset.layers = frames.join(",");
  }

  function renderRail(s, hint) {
    const sh = s.shift;
    const list = sh ? sh.tickets.filter((t) => t.status === "open" || t.status === "pinned" || t.status === "carrying") : [];
    const sel = sh ? slotOf(s).tk : null;
    const sig = list.map((t) => `${t.id}${t.status}${t.dish}`).join("|") + "#" + sel + "#" + (hint?.key === "pin" ? hint.tk : "");
    if (sig !== railSig) {
      railSig = sig;
      railEl.textContent = "";
      if (!list.length) el("div", "rail-empty", railEl, sh ? "Chưa có phiếu. Chạm bàn có khách để lấy phiếu gọi món." : "Phiếu gọi món hiện ở đây.");
      for (const t of list) {
        const b = button(railEl, "slip" + (t.id === sel ? " on" : "") + (t.status === "carrying" ? " carry" : "") + (hint?.key === "pin" && hint.tk === t.id ? " hint" : ""), null, () => act({ type: "pin", tk: t.id }), { "data-tk": t.id });
        b.style.setProperty("--tc", tableColor(t.tid));
        el("b", "", b, `${tableName(t.tid)} · ${t.name}`);
        el("span", "what", b, (DISHES[t.dish]?.name || "").replace("Cơm ", "C. "));
        const q = el("span", "q", b);
        if (t.nhuCu) el("span", "qchip", q, "như hôm qua");
        for (const x of t.quirks || []) el("span", "qchip", q, QUIRKS[x]?.short || x);
        el("span", "pb", b).appendChild(document.createElement("i"));
        b.setAttribute("aria-label", `Phiếu ${tableName(t.tid)}, ${t.name}: ${DISHES[t.dish]?.name}${t.quirks.length ? ", " + t.quirks.map((x) => QUIRKS[x]?.text).join(", ") : ""}${t.status === "carrying" ? " (đang bưng)" : ""}`);
        b.disabled = t.status === "carrying";
      }
    }
    // thanh kiên nhẫn trên phiếu
    for (const b of railEl.querySelectorAll(".slip")) {
      const t = sh?.tickets.find((x) => x.id === Number(b.dataset.tk));
      const g = t && groupById(s, t.gid);
      const i = b.querySelector(".pb i");
      if (i && g) { const p = patienceLeft(s, g); i.style.width = Math.round(p * 100) + "%"; i.style.background = p <= 0.35 ? "#e0604f" : p <= 0.6 ? "#e3a04a" : "#7fc08d"; }
    }
  }

  function renderBill(s) {
    const b = s.shift.billing, g = groupById(s, b.gid);
    const sig = JSON.stringify([b.gid, b.tapped, canAutoBill(s)]);
    if (sig === billSig) return;
    billSig = sig;
    bill.textContent = "";
    bill.style.setProperty("--tc", tableColor(b.tid));
    el("h3", "", bill, `${tableName(b.tid)} · Tính tiền`);
    const ate = b.lines.filter((l) => l.real).map((l) => l.label.split(" · ")[0]);
    const counts = {}; for (const a of ate) counts[a] = (counts[a] || 0) + 1;
    el("div", "ate", bill, "Bàn đã dùng: " + (Object.entries(counts).map(([k, n]) => `${n} ${k.toLocaleLowerCase("vi")}`).join(", ") || "—"));
    for (const l of b.lines) {
      const on = b.tapped.includes(l.key);
      const x = button(bill, "bline" + (on ? " on" : ""), null, () => act({ type: "tapLine", key: l.key }), { "data-line": l.key, "aria-pressed": on ? "true" : "false" });
      el("span", "", x, l.label); el("b", "", x, fmtK(l.price));
    }
    el("div", "total", bill, "Tổng: " + fmtK(billTotal(b)));
    const r = el("div", "acts", bill);
    if (canAutoBill(s)) button(r, "btn", "Tính đúng", () => act({ type: "autoBill" }), { "data-act": "autoBill", title: "Ngày 1–3: tự cộng đúng các món bàn đã dùng" });
    button(r, "btn primary", "Thu tiền", () => act({ type: "collect" }), { "data-act": "collect", disabled: b.tapped.length ? null : "" });
  }

  function renderJobs(s) {
    const sh = s.shift;
    const items = [];
    if (sh) {
      for (const g of sh.groups.filter((x) => x.phase === "wait")) items.push({ k: "g" + g.id, text: `Nhóm ${g.size} người chờ bàn`, sub: "Chạm để chọn rồi chạm bàn trống", gid: g.id, tc: "#9ff0dc", urgent: patienceLeft(s, g) < 0.4 });
      for (const t of sh.tables) {
        const job = tableJob(s, t.id);
        const g = t.gid !== null ? groupById(s, t.gid) : null;
        if (!job && !g) continue;
        items.push({ k: t.id + (job || ""), text: `${tableName(t.id)}${g ? ` · ${g.size} người` : ""}`, sub: job ? JOB_LABEL[job] : g?.paid ? "Đang về" : g && g.orderT ? "Đang chờ món / đang ăn" : "", tid: t.id, job, tc: tableColor(t.id), urgent: job === "bill" || (g && patienceLeft(s, g) < 0.4) });
      }
      if (sh.dirty > 0) items.push({ k: "wash", text: `Thau rửa: ${sh.dirty} dĩa dơ`, sub: `Dĩa sạch còn ${sh.cleanPlates}`, wash: true, tc: "#8ab8d8", urgent: sh.cleanPlates <= 2 });
    }
    const sig = items.map((i) => i.k + i.sub + (i.urgent ? 1 : 0)).join("|");
    if (sig === jobsSig) return;
    jobsSig = sig;
    wTables.textContent = "";
    el("h3", "", wTables, "Việc ở bàn");
    if (!items.length) el("p", "muted", wTables, "Chưa có việc ở bàn.");
    for (const i of items) {
      const b = button(wTables, "job" + (i.urgent ? " urgent" : ""), null, () => {
        if (i.gid) hooks.selectGroup(i.gid);
        else if (i.wash) act({ type: "wash" });
        else if (i.tid) act({ type: "tableTap", tid: i.tid, gid: hooks.selected() });
      }, { "data-job": i.k });
      b.style.setProperty("--tc", i.tc);
      el("b", "", b, i.text); el("span", "grow", b, i.sub);
      b.disabled = !!i.tid && !i.job && hooks.selected() === null;
    }
  }

  function render(s, hint) {
    const sh = s.shift;
    renderRail(s, hint);
    workEl.parentElement.hidden = false;
    if (!sh) { wPlate.hidden = true; wTables.hidden = true; wKitchen.hidden = true; return; }
    wPlate.hidden = false; wTables.hidden = false; wKitchen.hidden = false;
    // phiếu tính tiền thay ô bày khi đang đứng tính tiền
    const billing = !!sh.billing;
    bill.hidden = !billing; head.hidden = billing; row.hidden = billing; acts.hidden = billing;
    if (billing) { renderBill(s); } else billSig = "";
    const sl = slotOf(s), tkt = sl.tk !== null ? ticketOf(s, sl.tk) : null, p = sl.plate;
    const free = ownerFree(s);
    if (!billing) {
      const hsig = tkt ? `${tkt.id}${tkt.dish}${tkt.quirks.join()}` : "none";
      if (hsig !== headSig) {
        headSig = hsig;
        head.textContent = "";
        if (tkt) {
          head.style.setProperty("--tc", tableColor(tkt.tid));
          const r1 = el("div", "row", head);
          el("b", "", r1, `${tableName(tkt.tid)} · ${tkt.name}`);
          button(r1, "void", "Hết món", () => act({ type: "voidTicket", tk: tkt.id }), { "data-act": "voidTicket", title: "Báo khách hết món (khách không trả tiền dĩa này)" });
          el("div", "", head, `${DISHES[tkt.dish]?.name}${tkt.quirks.length ? " · " + tkt.quirks.map((x) => QUIRKS[x]?.text).join(", ") : ""}${tkt.nhuCu ? " · như hôm qua" : ""}`);
          const tg = targetOf(tkt);
          el("small", "muted", head, `Nước mắm: ${tg.sauce === "any" ? "chan hoặc chén" : SAUCE[tg.sauce] || "—"}${tg.com === 2 ? " · cơm 2 vá" : ""}`);
        } else { head.style.setProperty("--tc", "#555"); el("div", "", head, "Ô bày trống — chạm một phiếu ở trên."); }
      }
      empty.hidden = !!p;
      view.hidden = !p;
      if (p) drawPlate(p); else if (plateSig) { plateSig = ""; view.textContent = ""; }
      // dải lớp
      const ids = layerStrip(s);
      if (ids.join() !== stripSig) {
        stripSig = ids.join();
        strip.textContent = ""; layBtns.clear();
        const keys = "QWERTYUIOP";
        ids.forEach((id, i) => {
          const b = button(strip, "lay", null, () => act({ type: "layer", id }), { "data-layer": id, "data-hint": "layer", title: `${LAYER_NAME[id]} (${keys[i] || ""})` });
          el("span", "", b, LAYER_NAME[id]); el("small", "", b, "");
          layBtns.set(id, b);
        });
      }
      const tg = tkt ? targetOf(tkt) : null;
      const step = tkt ? nextStep(s) : null;
      for (const [id, b] of layBtns) {
        const sub = b.lastChild;
        let txt = "", done = false, need = false, off = false;
        if (tg) {
          switch (id) {
            case "dia": case "hop": done = p?.kind === id; need = !p && tg.kind === id; txt = id === "dia" ? `còn ${sh.cleanPlates}` : `còn ${s.stock.hop || 0}`; off = !!p && p.kind !== id; break;
            case "com": done = (p?.com || 0) >= tg.com && tg.com > 0; need = (p?.com || 0) < tg.com; txt = p?.com ? `${p.com} vá` : tg.com === 2 ? "cần 2 vá" : `nồi ${sh.rice.n}`; off = tg.com === 0; break;
            case "moHanh": done = (p?.moHanh || 0) >= tg.moHanh && tg.moHanh > 0; need = (p?.moHanh || 0) < tg.moHanh; txt = p?.moHanh ? `${p.moHanh} phần` : tg.moHanh === 0 ? "không" : `hũ ${s.moHanh.n}`; off = tg.moHanh === 0; break;
            case "meat": { done = !!p?.meat; need = !!tg.meat && !p?.meat; const n = sh.grill.slots.filter((it) => it && isCooked(it) && it.item === tg.meat).length; txt = p?.meat ? (p.meat.result === "charred" ? "cháy cạnh" : p.meat.result === "done" ? "chín" : p.meat.result) : n ? `${n} miếng chín` : "chờ vỉ"; off = !tg.meat; break; }
            case "sauce": done = p?.sauce && (tg.sauce === "any" ? true : p.sauce === tg.sauce); need = !done && !!tg.sauce; txt = p?.sauce ? SAUCE[p.sauce] : tg.sauce === "chen" ? "để riêng" : tg.sauce === "bich" ? "bịch" : ""; break;
            case "doChua": done = !!p?.doChua; need = tg.doChua && !p?.doChua; off = !tg.doChua; txt = off ? "không" : ""; break;
            case "duaLeo": done = !!p?.duaLeo; need = tg.duaLeo && !p?.duaLeo; off = !tg.duaLeo; break;
            default: done = !!p?.[id]; need = !!tg[id] && !p?.[id]; off = !tg[id];
          }
        }
        const cls = "lay" + (done ? " done" : need ? " need" : off ? " off" : "") + (hint?.key === "layer" && hint.step === id ? " hint" : hint?.key === "pick" && id === "meat" ? " hint" : "");
        if (b.className !== cls) b.className = cls;
        if (sub.textContent !== txt) sub.textContent = txt;
        b.disabled = !tkt || !free;
      }
      undoB.disabled = !p || !free;
      tossB.disabled = !p;
      serveB.disabled = !p;
      serveB.classList.toggle("hint", hint?.key === "serve");
      serveB.textContent = tkt?.takeaway ? "Đưa shipper" : "Giao";
    }
    renderJobs(s);
    // bảng bếp (mobile)
    kb.rice.textContent = sh.rice.cooking ? `Nồi đang nấu (${Math.ceil((sh.rice.cooking.until - sh.t) / 1000)}s)` : `Nấu cơm (nồi ${sh.rice.n}/${sh.rice.size})`;
    kb.rice.disabled = !free || !!sh.rice.cooking;
    kb.mo.textContent = `Làm mỡ hành (hũ ${s.moHanh.n})`;
    kb.wash.textContent = `Rửa chén (${sh.dirty} dơ)`; kb.wash.disabled = sh.dirty <= 0;
    kb.coal.textContent = `Thêm than (${s.stock.than || 0} rổ)`; kb.coal.disabled = !free;
    kb.mar.hidden = (s.stock.suon || 0) <= 0;
    kb.egg.hidden = !sh.pan;
    kInfo.textContent = `Sườn ướp ${s.stock["suon-uop"] || 0} · gạo tấm ${s.stock["gao-tam"] || 0} · đồ chua ${s.stock["do-chua"] || 0} · dưa leo ${s.stock["dua-leo"] || 0} · nước mắm ${s.stock["nuoc-mam"] || 0} · trà ${s.stock.tra || 0}`;
  }
  return { render };
}
