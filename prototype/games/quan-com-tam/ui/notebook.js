// Sổ quản lý (SCREENS.md): tab Review · Nhật ký · Sự kiện · Nhiệm vụ · Huy hiệu. Chép ui/notebook.js của Tiệm Bánh Mì.
// Agent C giữ khung Sổ + tab Review + Nhật ký; tab khác cắm vào bằng registerTab(id, label, render):
//   import { registerTab } from "./ui/notebook.js?v=c2";
//   registerTab("events", "Sự kiện", (body, state, ctx) => { ... });   // ctx = { act, rerender, close, el, button, starText }
// id trùng tab có sẵn (events / missions / badges) thì thay chỗ trống "sắp có"; id mới thì thêm vào cuối hàng tab.
// Review: chạm một review ⇒ khung trả lời với hàng nút tính cách (đổi ngay, thành mặc định) trên các lựa chọn; hậu quả ghi trên nút;
// câu trả lời lưu nguyên văn dưới review kèm kết quả + câu đáp lại. Vẽ lại giữ vị trí cuộn.
// Kèm: hỏi tính cách một lần (bản lưu cũ), thẻ chọn ở màn chào, thẻ Nhật Ký (lưu PNG, chia sẻ, ẩn tên quán, đổi khoảnh khắc).
import { el, button, starText } from "./common.js?v=c2";
import { personaCards, personaSwitch, PERSONAS } from "./persona.js?v=c2";
import { drawJournal, download, share } from "./journal.js?v=c2";
import { replyOptions, optionHint, personaOf, OUTCOME_LABEL, topicOf } from "../core/reviews.js?v=c2";
import { DISHES } from "../data/economy.js?v=c2";

const BASE_TABS = [["reviews", "Review"], ["journal", "Nhật ký"], ["events", "Sự kiện"], ["missions", "Nhiệm vụ"], ["badges", "Huy hiệu"]];
const REGISTRY = new Map();
/** Cắm một tab vào Sổ quản lý. render(body, state, ctx) vẽ nội dung tab vào body (phần tử DOM rỗng). */
export function registerTab(id, label, render) {
  if (typeof id !== "string" || !id || typeof render !== "function") throw new Error("registerTab(id, label, render)");
  REGISTRY.set(id, { label: String(label || id), render });
}
/** Danh sách tab theo thứ tự hiện: [id, nhãn]. */
export function bookTabs() {
  const out = BASE_TABS.map(([id, name]) => [id, REGISTRY.get(id)?.label || name]);
  for (const [id, t] of REGISTRY) if (!out.some(([x]) => x === id)) out.push([id, t.label]);
  return out;
}

export function createBook({ open, close, act, state, hooks, focusFirst = () => {} }) {
  let tab = "reviews", sel = null, introPick = null;

  // ---------- Sổ quản lý ----------
  function book(s, t = tab) {
    tab = bookTabs().some(([id]) => id === t) ? t : "reviews";
    const prev = document.querySelector("#sheet[data-ov='book']");
    const keep = prev ? { sheet: prev.scrollTop, list: prev.querySelector(".nb-list")?.scrollTop || 0 } : null;
    const p = open("book", "book");
    const head = el("div", "rowx nb-head", p);
    el("h2", "", head, "Sổ quản lý");
    el("span", "muted small", head, `${s.followers || 0} người theo dõi · đánh giá ${s.rating ? s.rating.toFixed(1).replace(".", ",") : "—"} · độ hot ${String(Math.round((s.hype || 0) * 10) / 10).replace(".", ",")} · danh tiếng ${Math.round(s.rep)}`);
    const tabs = el("div", "tabs", p);
    for (const [id, name] of bookTabs()) button(tabs, "tab" + (tab === id ? " on" : ""), name, () => book(state(), id), { "data-tab": id });
    const body = el("div", "nb-body", p);
    const ctx = { act, rerender: () => book(state(), tab), close: done, el, button, starText };
    const R = REGISTRY.get(tab);
    if (R) R.render(body, s, ctx);
    else if (tab === "reviews") reviewsTab(body, s);
    else if (tab === "journal") journalTab(body, s);
    else placeholderTab(body, s, tab);
    const fo = el("div", "footer", p);
    button(fo, "btn primary", "Đóng sổ", done, { "data-act": "bookClose" });
    if (keep) { p.scrollTop = keep.sheet; const l = p.querySelector(".nb-list"); if (l) l.scrollTop = keep.list; }
  }
  function done() {
    close();
    if (state().shift) hooks.resume(); else hooks.afterIntro();
  }

  function reviewsTab(body, s) {
    const feed = s.feed || [];
    if (!feed.length) { el("p", "muted", body, "Chưa có review. Mở quán bán dĩa đầu tiên đi!"); return; }
    const persona = personaOf(s) || "hien";
    const grid = el("div", "nb-grid", body);
    const list = el("div", "nb-list", grid);
    const r = feed.find((x) => x.id === sel) || feed.find((x) => !x.reply) || feed[0];
    for (const x of feed) {
      const d = button(list, "review revbtn" + (r.id === x.id ? " on" : "") + (x.reply ? " done" : "") + (x.src === "mang" ? " net" : ""), null, () => { sel = x.id; book(state(), "reviews"); }, { "data-review": x.id });
      el("span", "stars", d, starText(x.stars) + " ");
      el("b", "", d, x.name + (x.src === "mang" ? " (trên mạng)" : "") + ": ");
      el("span", "", d, x.line);
      el("small", "muted", d, ` · ngày ${x.day}${x.reply ? " · đã trả lời" : ""}`);
      if (x.reply) el("div", "say small", d, `Cô chủ: ${x.reply.text}`);
    }
    const pane = el("div", "nb-pane card", grid);
    pane.dataset.review = r.id;
    el("p", "rev-big", pane, `${starText(r.stars)}  ${r.name}${r.dish && DISHES[r.dish] ? ` · ${DISHES[r.dish].name}` : ""}`).classList.add("stars-line");
    el("p", "rev-text", pane, r.line);
    if (r.reply) {
      const box = el("div", "reply-done", pane);
      el("p", "say", box, `Cô chủ (${PERSONAS[r.reply.persona]?.short || "quán"}): ${r.reply.text}`);
      el("p", "small outcome", box, `${OUTCOME_LABEL[r.reply.outcome] || ""} · ${r.reply.fx.join(" · ")}`);
      for (const c of r.reply.comeback || []) el("p", "small comeback" + (c.flip ? " flip" : ""), box, `${c.who}: ${c.line}`);
    } else {
      const serious = topicOf(r) === "serious";
      if (serious) el("p", "muted serious-note", pane, "Lỗi nghiêm trọng: chỉ có lựa chọn xin lỗi nghiêm túc, không đùa, không khuyến mãi.");
      personaSwitch(pane, persona, (pid) => { const x = act({ type: "persona", persona: pid }); if (!x.err) book(state(), "reviews"); });
      const ch = el("div", "choices", pane);
      ch.dataset.persona = persona;
      for (const o of replyOptions(s, r, persona)) {
        const b = button(ch, "choice" + (o.out.roll ? " risk" : " free"), null, () => {
          const x = act({ type: "reply", id: r.id, kind: o.id });
          if (x.err) hooks.toast?.(x.err === "money" ? "Không đủ tiền cho lựa chọn này." : "Không trả lời được.", "warn");
          sel = r.id; book(state(), "reviews");
        }, { "data-reply": o.id, disabled: o.cost && s.money < o.cost ? "" : null });
        const l = el("div", "", b); el("b", "", l, o.label); el("small", "", l, optionHint(r, o));
        el("span", "cost", b, o.cost ? `−${o.cost}k` : o.out.roll ? `Hên xui ${Math.round(o.out.roll.p * 100)}%` : "An toàn");
      }
    }
  }

  function journalTab(body, s) {
    const list = s.journal || [];
    if (!list.length) { el("p", "muted", body, "Nhật Ký ghi lại mỗi ngày sau khi chốt ca cuối ngày."); return; }
    for (const [i, j] of list.entries()) {
      const d = el("div", "review jday", body);
      el("b", "", d, `Ngày ${j.day}: `);
      el("span", "", d, j.headline);
      const m = (j.moments || [])[0];
      if (m) el("div", "small muted", d, `“${m.line}”${m.who ? " — " + m.who : ""}`);
      el("div", "small", d, `${j.plates} dĩa · ${j.profit < 0 ? "lỗ" : "lời"} ${Math.abs(j.profit)}k · ${j.stars ? String(j.stars).replace(".", ",") : "—"} sao${j.followers ? ` · +${j.followers} người theo dõi` : ""}`);
      button(d, "btn small", "Xem thẻ Nhật Ký", () => journalCard(state(), "book", i), { "data-act": i === 0 ? "journalCard" : "journalCard" + i });
    }
  }

  function placeholderTab(body, s, id) {
    if (id === "badges") {
      el("p", "muted", body, "Huy hiệu sẽ hiện ở đây.");
      el("p", "", body, `Cấp ${s.level} · ${s.xp} XP · đã bán ${s.stats?.plates || 0} dĩa · ${s.stats?.shifts || 0} ca.`);
      const regs = Object.entries(s.regulars || {});
      el("h3", "", body, "Khách quen");
      if (!regs.length) el("p", "muted", body, "Phục vụ khách quen hai lần từ 4 sao, họ sẽ gọi như hôm qua.");
      for (const [name, r] of regs) el("p", "", body, `${name}: ${r.visits} lần ghé${r.fav ? ` · như hôm qua: ${DISHES[r.fav.dish]?.name || r.fav.dish}` : ""}`);
      return;
    }
    el("p", "muted", body, id === "events" ? "Chưa có tình huống nào. Mở quán vài ngày là có chuyện." : "Nhiệm vụ ngày sẽ hiện ở đây.");
  }

  // ---------- tính cách ----------
  /** Thẻ chọn tính cách ở màn chào. Gọi commitIntro() khi bấm mở quán. */
  function introPicker(parent, s) {
    introPick = personaOf(s) || "hien";
    el("label", "", parent, "Bạn là cô chủ kiểu nào? (đổi được ngay khi trả lời review)").style.fontWeight = 800;
    personaCards(parent, introPick, (id) => { introPick = id; });
  }
  const commitIntro = () => { if (introPick) act({ type: "persona", persona: introPick }); };
  /** Bản lưu cũ chưa có tính cách: hỏi một lần rồi chạy after(). */
  function personaAsk(s, after) {
    let pick = personaOf(s) || "hien";
    const p = open("persona", "narrow");
    el("h2", "", p, "Cô chủ trả lời review kiểu nào?");
    el("p", "muted", p, "Quán giờ đọc và trả lời được review. Chọn một tính cách (đổi được ngay trên từng review).");
    personaCards(p, pick, (id) => { pick = id; });
    const fo = el("div", "footer", p);
    button(fo, "btn primary", "Chọn tính cách này", () => { act({ type: "persona", persona: pick }); close(); after(); }, { "data-act": "personaGo" });
    focusFirst();
  }

  // ---------- thẻ Nhật Ký ----------
  /** Nút mở thẻ Nhật Ký (bảng chốt ngày). */
  function journalButton(parent, s, day) {
    const j = (s.journal || [])[0];
    if (!j || j.day !== day) return null;
    return button(parent, "btn", "Nhật Ký Làm Chủ", () => journalCard(state(), "summary", 0), { "data-act": "journalCard" });
  }
  function journalCard(s, back = "book", idx = 0) {
    const j = (s.journal || [])[idx];
    if (!j) return;
    let hide = false, moment = 0;
    const p = open("journal", "journal");
    el("h2", "", p, `Nhật Ký Làm Chủ · ngày ${j.day}`);
    const cv = el("canvas", "journal-canvas", p); cv.width = 1080; cv.height = 1350; cv.id = "journalCanvas";
    cv.setAttribute("role", "img"); cv.setAttribute("aria-label", j.headline);
    const redraw = async () => {
      cv.dataset.ready = "";
      const card = await drawJournal(cv, j, { shopName: s.shopName, hideName: hide, moment, scene: hooks.sceneImage?.() });
      cv.dataset.ready = "1"; cv.dataset.quote = card.quote; cv.dataset.shop = card.shop; cv.dataset.headline = card.headline;
    };
    redraw();
    const name = `nhat-ky-com-tam-ngay-${j.day}.png`;
    const row = el("div", "footer", p);
    button(row, "btn primary", "Lưu PNG", async () => { await download(cv, name); }, { "data-act": "savePng" });
    button(row, "btn", "Chia sẻ", async () => { if (!(await share(cv, name, j.headline))) { await download(cv, name); hooks.toast?.("Máy không chia sẻ được, đã tải PNG.", ""); } }, { "data-act": "sharePng" });
    const hb = button(row, "btn", "Ẩn tên quán", () => { hide = !hide; hb.textContent = hide ? "Hiện tên quán" : "Ẩn tên quán"; hb.setAttribute("aria-pressed", hide ? "true" : "false"); redraw(); }, { "data-act": "hideName", "aria-pressed": "false" });
    button(row, "btn", "Đổi khoảnh khắc", () => { moment++; redraw(); }, { "data-act": "nextMoment" });
    button(row, "btn", "Đóng", () => { if (back === "summary") hooks.summary(state()); else book(state(), "journal"); }, { "data-act": "closeJournal" });
    focusFirst();
  }

  return { book, introPicker, commitIntro, personaAsk, journalButton, journalCard, registerTab };
}
