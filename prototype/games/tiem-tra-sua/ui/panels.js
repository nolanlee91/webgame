// Bảng phủ Milestone 3–4: hội thoại sự kiện Drama (chân dung + lựa chọn + hậu quả), Sổ quản lý (review, nhật ký, sự kiện, nhiệm vụ),
// Nhật Ký Làm Chủ (thẻ ảnh, lưu / chia sẻ), thanh xếp chỗ trang trí. Dùng chung khung open/close của ui/screens.js.
import { icon } from "../render/atlas.js?v=m34";
import { EVENT } from "../data/events.js?v=m34";
import { RECIPE } from "../data/recipes.js?v=m34";
import { REPLIES } from "../data/lines.js?v=m34";
import { currentEvent, textOf, affordable, fxSummary } from "../core/drama.js?v=m34";
import { customer } from "../core/shift.js?v=m34";
import { canReply } from "../core/reviews.js?v=m34";
import { EQUIPMENT } from "../data/equipment.js?v=m34";
import { drawJournal, download, share } from "./journal.js?v=m34";

const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const GROUP_LABEL = { khach: "Khách", mang: "Trên mạng", "van-hanh": "Vận hành", "dac-biet": "Đặc biệt", doi: "Đời thường" };

/** Chân dung: ưu tiên biểu cảm (portrait-expressions `${role}-${mood}`), rồi chân dung thường, rồi dáng đứng (Cần Codex #2, #3). */
export function portrait(atlas, role, mood = "waiting", px = 150) {
  const m = mood === "surprised" ? "annoyed" : mood;
  if (atlas.has("faces", `${role}-${m}`)) return icon(atlas, ["faces", `${role}-${m}`], px, "ico portrait");
  if (atlas.has("portraits", role)) return icon(atlas, ["portraits", role], px, "ico portrait");
  return icon(atlas, ["reactions", `${role}-${mood === "happy" ? "happy" : "impatient"}`], px, "ico portrait body");
}

export function createPanels(atlas, dispatch, ov, hooks) {
  // ---------- Drama ----------
  function event(state, { onDone } = {}) {
    const d = currentEvent(state);
    if (!d) { onDone?.(); return; }
    const ev = EVENT[d.id], node = ev.nodes[d.node];
    const c = d.cid !== null ? customer(state, d.cid) : null;
    const role = c ? c.sprite : d.npc?.role || "neighbor";
    const name = c ? c.name : d.npc?.name || "";
    ov.open("event", (card) => {
      card.classList.add("drama", "event");
      card.dataset.event = ev.id;
      const stage = h("div", "drama-stage");
      const left = h("figure", "speaker cust"); left.appendChild(portrait(atlas, role, node.mood || "waiting")); left.appendChild(h("figcaption", "", name));
      const right = h("figure", "speaker me"); right.appendChild(icon(atlas, ["faces", node.mood === "happy" ? "barista-happy" : "barista-concerned"], 150, "ico portrait")); right.appendChild(h("figcaption", "", "Bạn"));
      stage.appendChild(left); stage.appendChild(right);
      stage.appendChild(h("span", "ev-tag", `${GROUP_LABEL[ev.group] || ""}${state.shift ? " · Ca đang tạm dừng" : " · Sau giờ đóng cửa"}`));
      card.appendChild(stage);
      const say = h("div", "say");
      say.appendChild(h("p", "line", "“" + textOf(state, d, node.line) + "”"));
      if (node.me) say.appendChild(h("p", "line me", "“" + textOf(state, d, node.me) + "”"));
      card.appendChild(say);
      const ch = h("div", "choices");
      node.choices.forEach((o, i) => {
        const can = affordable(state, o);
        const b = h("button", "btn choice" + (i === 0 ? " primary" : ""), ""); b.type = "button"; b.dataset.choice = o.id;
        b.appendChild(h("b", "", textOf(state, d, o.label)));
        if (o.hint) b.appendChild(h("small", "", textOf(state, d, o.hint)));
        const cost = fxSummary(o.fx || {}, o.later).filter((x) => /^−/.test(x));
        if (cost.length) b.appendChild(h("span", "cost", "Tốn: " + cost.join(", ").replace(/−/g, "")));
        if (o.roll) b.appendChild(h("span", "cost risk", "Hên xui"));
        b.disabled = !can;
        if (!can) b.title = "Chưa đủ tiền hoặc nguyên liệu";
        if (i === 0 && can) b.dataset.autofocus = "";
        b.addEventListener("click", () => {
          const r = dispatch({ type: "choose", choice: o.id });
          const done = r?.events?.find((e) => e.type === "dramaResolved");
          if (!done) return;
          result(hooks.state(), ev, done, name, role, onDone);
        });
        ch.appendChild(b);
      });
      card.appendChild(ch);
    });
  }
  function result(state, ev, done, name, role, onDone) {
    ov.open("event-result", (card) => {
      card.classList.add("drama", "event-result");
      card.dataset.event = ev.id;
      const stage = h("div", "drama-stage small");
      const me = h("figure", "speaker me"); me.appendChild(icon(atlas, ["faces", done.rolled === "lose" ? "barista-surprised" : "barista-happy"], 120, "ico portrait")); me.appendChild(h("figcaption", "", "Bạn"));
      const cu = h("figure", "speaker cust"); cu.appendChild(portrait(atlas, role, done.rolled === "lose" ? "annoyed" : "happy", 120)); cu.appendChild(h("figcaption", "", name));
      stage.appendChild(cu); stage.appendChild(me);
      card.appendChild(stage);
      const say = h("div", "say");
      say.appendChild(h("p", "line me quote", "“" + done.say + "”"));
      const fx = h("ul", "fx-list");
      for (const f of done.fx) fx.appendChild(h("li", /^−|bớt|chậm|Tạm ngưng/i.test(f) ? "neg" : "", f));
      if (!done.fx.length && done.goto) fx.appendChild(h("li", "", "Chuyện còn tiếp…"));
      say.appendChild(fx);
      say.appendChild(h("p", "muted small", "Đã lưu vào Nhật Ký Làm Chủ."));
      card.appendChild(say);
      const foot = h("div", "choices");
      const go = h("button", "btn primary big", done.goto ? "Tiếp…" : "Tiếp tục"); go.type = "button"; go.id = "eventNext"; go.dataset.autofocus = "";
      go.addEventListener("click", () => { if (done.goto) event(hooks.state(), { onDone }); else { ov.close(); onDone?.(); } });
      foot.appendChild(go);
      card.appendChild(foot);
    });
  }

  // ---------- Sổ quản lý ----------
  function notebook(state, tab = "reviews", back = null) {
    ov.open("notebook", (card) => {
      card.classList.add("notebook");
      const hd = h("header", "sheet-head");
      hd.appendChild(icon(atlas, ["icons", "journal"], 36));
      const t = h("div"); t.appendChild(h("h2", "", "Sổ quản lý"));
      const r = state.rating;
      t.appendChild(h("p", "muted", `Đánh giá ${r ? r.toLocaleString("vi-VN") + " sao" : "chưa có"} · ${(state.followers || 0).toLocaleString("vi-VN")} người theo dõi · Danh tiếng ${state.rep}`));
      hd.appendChild(t); card.appendChild(hd);
      const tabs = h("div", "tabs"); tabs.setAttribute("role", "tablist");
      const TABS = [["reviews", "Review"], ["journal", "Nhật ký"], ["drama", "Sự kiện"], ["missions", "Nhiệm vụ"]];
      for (const [id, label] of TABS) {
        const b = h("button", "tab" + (id === tab ? " on" : ""), label); b.type = "button"; b.dataset.tab = id; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", id === tab ? "true" : "false");
        b.addEventListener("click", () => notebook(hooks.state(), id, back));
        tabs.appendChild(b);
      }
      card.appendChild(tabs);
      const body = h("div", "nb-body");
      if (tab === "reviews") {
        if (!state.feed?.length) body.appendChild(h("p", "muted", "Chưa có review nào. Mở quán và pha ly đầu tiên nhé."));
        for (const rv of state.feed || []) {
          const it = h("div", "rv" + (rv.reply ? " replied" : ""));
          it.dataset.review = rv.id;
          const stars = h("span", "stars"); stars.setAttribute("aria-label", `${rv.stars} sao`);
          for (let i = 0; i < 5; i++) stars.appendChild(icon(atlas, ["icons", "review-star"], 16, "ico" + (i < rv.stars ? "" : " off")));
          it.appendChild(stars);
          const tx = h("div");
          tx.appendChild(h("b", "", `${rv.name} · Ngày ${rv.day}${rv.src === "mang" ? " · trên mạng" : RECIPE[rv.recipe] ? " · " + RECIPE[rv.recipe].short : ""}`));
          tx.appendChild(h("p", "", rv.line));
          if (rv.reply) tx.appendChild(h("small", "reply", "Tiệm đã trả lời: " + REPLIES[rv.reply].label.toLocaleLowerCase("vi")));
          else {
            const acts = h("div", "rv-acts");
            for (const kind of Object.keys(REPLIES)) {
              if (!canReply(rv, kind)) continue;
              const b = h("button", "btn small", REPLIES[kind].label); b.type = "button"; b.dataset.reply = kind; b.title = REPLIES[kind].hint;
              b.addEventListener("click", () => { dispatch({ type: "reply", id: rv.id, kind }); notebook(hooks.state(), "reviews", back); });
              acts.appendChild(b);
            }
            if (acts.childNodes.length) tx.appendChild(acts);
          }
          it.appendChild(tx);
          body.appendChild(it);
        }
      } else if (tab === "journal") {
        if (!state.journal.length) body.appendChild(h("p", "muted", "Nhật ký trống. Chốt ca đầu tiên để có trang đầu."));
        for (const j of state.journal) {
          const it = h("div", "jrow");
          it.appendChild(h("b", "", `Ngày ${j.day} · ${j.cups} ly · ${j.profit >= 0 ? "+" : "−"}${Math.abs(j.profit)}k · ${j.avgStars || "—"} sao`));
          it.appendChild(h("p", "", j.headline));
          if (j.moment) it.appendChild(h("small", "", "“" + j.moment + "”"));
          body.appendChild(it);
        }
        if (state.lastSummary) {
          const b = h("button", "btn primary", "Xem thẻ Nhật Ký ca gần nhất"); b.type = "button"; b.id = "nbJournal";
          b.addEventListener("click", () => journal(hooks.state(), () => notebook(hooks.state(), "journal", back)));
          body.appendChild(b);
        }
      } else if (tab === "drama") {
        const hs = state.drama?.history || [];
        if (!hs.length) body.appendChild(h("p", "muted", "Chưa có drama nào. Cứ bình tĩnh, khách sẽ mang tới."));
        for (const x of hs) {
          const it = h("div", "jrow");
          it.appendChild(h("b", "", `Ngày ${x.day} · ${x.who || ""} · ${x.label}`));
          it.appendChild(h("p", "", "“" + x.line + "”"));
          body.appendChild(it);
        }
        const waits = (state.drama?.queue || []).length;
        if (waits) body.appendChild(h("p", "muted small", `${waits} chuyện đang chờ quay lại ở các ca sau…`));
      } else {
        const ms = state.shift?.missions || state.lastSummary?.missions || [];
        if (state.level < 2) body.appendChild(h("p", "muted", "Nhiệm vụ ngày mở ở cấp 2."));
        else if (!ms.length) body.appendChild(h("p", "muted", "Nhiệm vụ ngày hiện khi mở quán."));
        for (const m of ms) {
          const it = h("div", "jrow" + (m.done ? " done" : ""));
          it.appendChild(h("b", "", (m.done ? "Xong · " : "") + m.text));
          it.appendChild(h("small", "", `${m.prog !== undefined ? m.prog + "/" + m.n + " · " : ""}Thưởng +${m.reward.xp} XP${m.reward.money ? ` · +${m.reward.money}k` : ""}`));
          body.appendChild(it);
        }
        body.appendChild(h("p", "muted small", `Đã xong ${state.stats.missions || 0} nhiệm vụ từ ngày mở tiệm.`));
      }
      card.appendChild(body);
      const foot = h("footer", "sheet-foot");
      const go = h("button", "btn primary", "Đóng sổ"); go.type = "button"; go.id = "nbClose"; go.dataset.autofocus = "";
      go.addEventListener("click", () => { ov.close(); back ? back() : hooks.resume?.(); });
      foot.appendChild(go);
      card.appendChild(foot);
    });
  }

  // ---------- Nhật Ký Làm Chủ ----------
  function journal(state, back) {
    const S = state.lastSummary;
    if (!S) return;
    let hideName = false, moment = 0;
    ov.open("journal", (card) => {
      card.classList.add("journal");
      card.appendChild(h("h2", "", `Nhật Ký Làm Chủ · Ngày ${S.day}`));
      const wrap = h("div", "jcard");
      const cv = h("canvas"); cv.id = "journalCanvas"; cv.width = 1080; cv.height = 1350; cv.setAttribute("role", "img");
      wrap.appendChild(cv);
      card.appendChild(wrap);
      const tools = h("div", "jtools");
      const nameT = h("label", "chk"); const cb = h("input"); cb.type = "checkbox"; cb.id = "jHideName"; nameT.appendChild(cb); nameT.appendChild(h("span", "", "Ẩn tên tiệm"));
      const other = h("button", "btn small", "Đổi khoảnh khắc"); other.type = "button"; other.id = "jMoment";
      tools.appendChild(nameT); tools.appendChild(other);
      card.appendChild(tools);
      const foot = h("footer", "sheet-foot");
      const close = h("button", "btn", "Quay lại"); close.type = "button"; close.id = "jBack";
      const save = h("button", "btn primary", "Lưu ảnh PNG"); save.type = "button"; save.id = "jSave"; save.dataset.autofocus = "";
      const sh = h("button", "btn", "Chia sẻ"); sh.type = "button"; sh.id = "jShare";
      sh.hidden = !(navigator.canShare && typeof File === "function");
      foot.appendChild(close); foot.appendChild(sh); foot.appendChild(save);
      card.appendChild(foot);
      const name = `nhat-ky-lam-chu-ngay-${S.day}.png`;
      let n = 1;
      const draw = async () => { const c = await drawJournal(cv, S, { shopName: state.shopName, hideName, moment }); cv.setAttribute("aria-label", `${c.headline} — “${c.quote}”`); cv.dataset.drawn = String(n++); n = n; other.disabled = c.moments < 2; };
      draw();
      cb.addEventListener("change", () => { hideName = cb.checked; draw(); });
      other.addEventListener("click", () => { moment++; draw(); });
      save.addEventListener("click", async () => { await download(cv, name); hooks.toast?.("Đã lưu ảnh " + name, "good"); });
      sh.addEventListener("click", async () => { if (!(await share(cv, name, S.headline))) { await download(cv, name); hooks.toast?.("Thiết bị chưa hỗ trợ chia sẻ ảnh, đã tải PNG.", ""); } });
      close.addEventListener("click", () => { ov.close(); back?.(); });
    });
  }

  // ---------- xếp chỗ trang trí ----------
  function arrange(state, { onDone }) {
    ov.open("arrange", (card) => {
      card.classList.add("arrange-bar");
      card.appendChild(h("b", "", "Kéo đồ trang trí tới chỗ mới"));
      card.appendChild(h("small", "muted", "Giữ trống lối từ cửa vào và chỗ khách đứng chờ. Đèn, biển treo trên tường."));
      const list = h("div", "arr-list");
      for (const id of Object.keys(state.owned).filter((x) => EQUIPMENT[x]?.place)) {
        const b = h("button", "btn small", "Đặt lại " + EQUIPMENT[id].name); b.type = "button"; b.dataset.reset = id;
        b.disabled = !state.placement?.[id];
        b.addEventListener("click", () => { dispatch({ type: "resetPlace", id }); arrange(hooks.state(), { onDone }); });
        list.appendChild(b);
      }
      card.appendChild(list);
      const go = h("button", "btn primary", "Xong"); go.type = "button"; go.id = "arrangeDone"; go.dataset.autofocus = "";
      go.addEventListener("click", () => { ov.close(); onDone?.(); });
      card.appendChild(go);
    }, { modal: false, cls: "floating" });
  }

  return { event, notebook, journal, arrange };
}
