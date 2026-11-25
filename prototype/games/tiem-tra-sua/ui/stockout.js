// Hết hàng giữa ca: hội thoại kiểu Drama (chân dung khách + nhân viên, lựa chọn có chi phí hiện trước, bảng hậu quả)
// và bảng "Nhập gấp" mở từ ô Kho trên HUD (giao gấp +15% khi hàng sắp hết, trước khi hết hẳn).
import { icon } from "../render/atlas.js?v=m38";
import { STOCK } from "../data/ingredients.js?v=m38";
import { customer } from "../core/shift.js?v=m38";
import { stockoutOptions, menuStock, STOCKOUT } from "../core/stockout.js?v=m38";
import { packPrice, packSize, capacity, stockUsed } from "../core/economy.js?v=m38";
import { ingIcon } from "./brew.js?v=m41";
import { portrait } from "./panels.js?v=m38";

const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

export function createStockout(atlas, dispatch, ov, hooks) {
  function dialog(state) {
    const sh = state.shift, d = sh?.dialog;
    if (!d || d.kind !== "stockout") return;
    const c = d.cid !== null ? customer(state, d.cid) : null;
    const it = STOCK[d.id];
    ov.open("stockout", (card) => {
      card.classList.add("drama", "stockout");
      card.dataset.item = d.id;
      const stage = h("div", "drama-stage");
      const left = h("figure", "speaker cust");
      left.appendChild(c ? portrait(atlas, c.sprite, "annoyed") : ingIcon(atlas, it.icon, 96));
      left.appendChild(h("figcaption", "", c ? c.name : it.name));
      const right = h("figure", "speaker me"); right.appendChild(icon(atlas, ["faces", "barista-surprised"], 150, "ico portrait")); right.appendChild(h("figcaption", "", "Nhân viên"));
      stage.appendChild(left); stage.appendChild(right);
      stage.appendChild(h("span", "ev-tag", "Hết hàng · Ca đang tạm dừng"));
      card.appendChild(stage);
      const say = h("div", "say");
      const t = h("h2", "", `Hết ${it.name.toLocaleLowerCase("vi")}!`); say.appendChild(t);
      say.appendChild(h("p", "line me", "“" + d.line + "”"));
      if (c) say.appendChild(h("p", "muted small", `${c.name} đang chờ. Chọn cách xử lý (chi phí ghi trên nút):`));
      card.appendChild(say);
      const ch = h("div", "choices");
      stockoutOptions(state).forEach((o, i) => {
        const b = h("button", "btn choice" + (i === 0 && o.ok ? " primary" : ""), ""); b.type = "button"; b.dataset.choice = o.id;
        b.appendChild(h("b", "", o.label)); b.appendChild(h("small", "", o.hint));
        b.appendChild(h("span", "cost" + (o.risk ? " risk" : ""), o.cost));
        b.disabled = !o.ok;
        if (!o.ok) b.title = o.id === "borrow" ? "Hôm nay đã mượn rồi" : o.id === "consign" ? "Hôm nay đã nhận ký gửi" : "Chưa đủ tiền";
        if (o.ok && !ch.querySelector("[data-autofocus]")) b.dataset.autofocus = "";
        b.addEventListener("click", () => {
          const r = dispatch({ type: "stockout", choice: o.id });
          const done = r?.events?.find((e) => e.type === "stockoutResolved");
          if (done) result(hooks.state(), done, c);
        });
        ch.appendChild(b);
      });
      card.appendChild(ch);
    });
  }

  function result(state, done, c) {
    ov.open("stockout-result", (card) => {
      card.classList.add("drama", "event-result");
      const stage = h("div", "drama-stage small");
      const me = h("figure", "speaker me"); me.appendChild(icon(atlas, ["faces", done.choice === "close" ? "barista-concerned" : "barista-happy"], 120, "ico portrait")); me.appendChild(h("figcaption", "", "Bạn"));
      const role = done.choice === "borrow" ? "vip" : done.choice === "shipper" ? "courier" : done.choice === "consign" ? "neighbor" : c?.sprite || "neighbor";
      const name = done.choice === "borrow" ? "Chị Lụa Hẻm Bên" : done.choice === "shipper" ? "Anh Tèo shipper" : done.choice === "consign" ? "Dì Ba" : c?.name || "";
      const cu = h("figure", "speaker cust"); cu.appendChild(portrait(atlas, role, done.choice === "close" ? "annoyed" : "happy", 120, ["borrow", "shipper", "consign"].includes(done.choice) ? name : null)); cu.appendChild(h("figcaption", "", name));
      stage.appendChild(cu); stage.appendChild(me);
      card.appendChild(stage);
      const say = h("div", "say");
      say.appendChild(h("p", "line me quote", "“" + done.say + "”"));
      if (done.extra) say.appendChild(h("p", "line", "“" + done.extra + "”"));
      const fx = h("ul", "fx-list");
      for (const f of done.fx) fx.appendChild(h("li", /^−|Danh tiếng −|bỏ|trống|sốt ruột|Nợ|Hên xui/i.test(f) ? "neg" : "", f));
      say.appendChild(fx);
      say.appendChild(h("p", "muted small", "Đã lưu vào Nhật Ký Làm Chủ."));
      card.appendChild(say);
      const foot = h("div", "choices");
      const go = h("button", "btn primary big", done.choice === "run" ? "Chạy!" : "Tiếp tục"); go.type = "button"; go.id = "stockoutNext"; go.dataset.autofocus = "";
      go.addEventListener("click", () => { ov.close(); hooks.resume?.(); });
      foot.appendChild(go);
      card.appendChild(foot);
    });
  }

  /** Nhập gấp giữa ca (Dì Ba giao gấp +15%): mở từ ô Kho trên HUD. */
  function quick(state) {
    const rel = [...menuStock(state)];
    ov.open("quickstock", (card) => {
      card.classList.add("quickstock");
      card.appendChild(h("h2", "", "Nhập gấp giữa ca"));
      card.appendChild(h("p", "muted small", "Dì Ba giao gấp, giá +15%. Hàng đỏ là sắp hết. Ca đang tạm dừng."));
      const list = h("div", "stock");
      const s = hooks.state();
      rel.sort((a, b) => (s.stock[a] || 0) - (s.stock[b] || 0));
      for (const id of rel) {
        const itm = STOCK[id];
        const row = h("div", "srow" + ((s.stock[id] || 0) <= STOCKOUT.LOW_AT ? " low" : ""));
        row.appendChild(ingIcon(atlas, itm.icon, 34));
        const tx = h("div"); tx.appendChild(h("b", "", itm.name)); tx.appendChild(h("small", "", `còn ${s.stock[id] || 0} phần`)); row.appendChild(tx);
        const p = packPrice(id, true), n = packSize(id);
        const b = h("button", "btn small", `+${n} · ${p}k`); b.type = "button"; b.dataset.restock = id;
        b.disabled = s.money < p || capacity(s) - stockUsed(s) < n;
        b.addEventListener("click", () => { dispatch({ type: "restock", id }); quick(hooks.state()); });
        row.appendChild(b);
        list.appendChild(row);
      }
      card.appendChild(list);
      const ok = h("button", "btn primary", "Quay lại quầy"); ok.type = "button"; ok.id = "quickClose"; ok.dataset.autofocus = "";
      ok.addEventListener("click", () => { ov.close(); hooks.resume?.(); });
      card.appendChild(ok);
    });
  }
  return { dialog, quick };
}
