// Sổ quản lý (SCREENS.md): tab Review · Nhật ký · Sự kiện · Nhiệm vụ · Khách quen · Huy hiệu.
// Review: chạm một review ⇒ khung trả lời với hàng nút tính cách (đổi ngay, thành mặc định) trên các lựa chọn; hậu quả ghi trên nút; câu trả lời
// lưu nguyên văn dưới review kèm kết quả + câu đáp lại. Vẽ lại giữ vị trí cuộn (bài học Trà Sữa).
import { replyOptions, optionHint, personaOf, OUTCOME_LABEL } from "../core/reviews.js?v=b11";
import { personaSwitch } from "./persona.js?v=b11";
import { EVENT } from "../data/events.js?v=b11";
import { REGULARS } from "../data/customers.js?v=b11";
import { RECIPE } from "../data/economy.js?v=b11";
import { RANKS, HOUSE_PATE } from "../data/equipment.js?v=b11";
import { PERSONAS } from "../data/lines-reply.js?v=b11";
import { BADGES, BADGE } from "../core/challenge.js?v=b11";

const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);
export const TABS = [["reviews", "Review"], ["journal", "Nhật ký"], ["events", "Sự kiện"], ["missions", "Nhiệm vụ"], ["regulars", "Khách quen"], ["badges", "Huy hiệu"]];

export function buildNotebook(el, state, { dispatch, tab = "reviews", setTab, openCard, close, sel = null, setSel }) {
  const scroll = el.scrollTop;
  el.textContent = "";
  const head = h("div", "row nb-head");
  head.appendChild(h("h2", "", "Sổ quản lý"));
  const meta = h("span", "muted small", `${state.followers || 0} người theo dõi · đánh giá ${state.rating ?? "—"} · độ hot ${Math.round((state.buzz || 0) * 10) / 10}`);
  head.appendChild(meta);
  el.appendChild(head);
  const tabs = h("div", "tabs");
  for (const [id, name] of TABS) {
    const t = h("button", "tab" + (tab === id ? " on" : ""), name); t.type = "button"; t.dataset.tab = id;
    t.addEventListener("click", () => setTab(id));
    tabs.appendChild(t);
  }
  el.appendChild(tabs);
  const body = h("div", "stack nb-body"); el.appendChild(body);
  if (tab === "reviews") reviewsTab(body, state, { dispatch, sel, setSel });
  else if (tab === "journal") journalTab(body, state, openCard);
  else if (tab === "events") eventsTab(body, state);
  else if (tab === "missions") missionsTab(body, state);
  else if (tab === "regulars") regularsTab(body, state);
  else badgesTab(body, state);
  const foot = h("div", "row"); foot.style.marginTop = "12px";
  const b = h("button", "btn primary", "Đóng sổ"); b.type = "button"; b.dataset.act = "closeBook"; b.addEventListener("click", close);
  foot.appendChild(b); el.appendChild(foot);
  el.scrollTop = scroll;
}

function reviewsTab(body, state, { dispatch, sel, setSel }) {
  const feed = state.feed || [];
  if (!feed.length) { body.appendChild(h("p", "muted", "Chưa có review. Bán ổ đầu tiên đi!")); return; }
  const persona = personaOf(state) || "hien";
  const grid = h("div", "nb-grid");
  const list = h("div", "nb-list");
  for (const r of feed.slice(0, 40)) {
    const d = h("button", "rev revbtn" + (sel === r.id ? " on" : "") + (r.reply ? " done" : ""));
    d.type = "button"; d.dataset.review = r.id;
    d.appendChild(h("span", "st", stars(r.stars) + " "));
    d.appendChild(h("b", "", r.name + (r.src === "mang" ? " (trên mạng)" : "") + ": "));
    d.appendChild(document.createTextNode(r.line));
    d.appendChild(h("small", "muted", ` · ngày ${r.day}${r.reply ? " · đã trả lời" : ""}`));
    if (!r.reply) d.appendChild(h("span", "rev-cta", "Trả lời"));
    d.addEventListener("click", () => setSel(r.id));
    list.appendChild(d);
  }
  grid.appendChild(list);
  const r = feed.find((x) => x.id === sel) || feed.find((x) => !x.reply) || feed[0];
  const pane = h("div", "nb-pane");
  pane.dataset.review = r.id;
  pane.appendChild(h("p", "rev big", `${stars(r.stars)}  ${r.name}: ${r.line}`));
  if (r.reply) {
    const box = h("div", "reply-done");
    box.appendChild(h("p", "say", `Chủ tiệm (${PERSONAS[r.reply.persona]?.short || "tiệm"}): ${r.reply.text}`));
    box.appendChild(h("p", "small", `${OUTCOME_LABEL[r.reply.outcome] || ""} · ${r.reply.fx.join(" · ")}`));
    for (const c of r.reply.comeback || []) box.appendChild(h("p", "small comeback", `${c.who}: ${c.line}`));
    pane.appendChild(box);
  } else {
    pane.appendChild(personaSwitch(persona, (p) => dispatch({ type: "persona", persona: p })));
    const ch = h("div", "choices");
    for (const o of replyOptions(state, r, persona)) {
      const b = h("button", "choice"); b.type = "button"; b.dataset.reply = o.id;
      b.appendChild(h("b", "", o.label)); b.appendChild(h("small", "", optionHint(r, o)));
      b.appendChild(h("span", "cost" + (o.out.roll ? " risk" : ""), o.cost ? `−${o.cost}k` : o.out.roll ? `Hên xui ${Math.round(o.out.roll.p * 100)}%` : ""));
      b.disabled = !!o.cost && state.money < o.cost;
      b.addEventListener("click", () => dispatch({ type: "reply", id: r.id, kind: o.id }));
      ch.appendChild(b);
    }
    pane.appendChild(ch);
  }
  grid.appendChild(pane);
  body.appendChild(grid);
}
function journalTab(body, state, openCard) {
  const list = state.journal || [];
  if (state.lastSummary) { const b = h("button", "btn primary", "Xem thẻ Nhật Ký ngày " + state.lastSummary.day); b.type = "button"; b.dataset.act = "journalCard"; b.addEventListener("click", () => openCard()); body.appendChild(b); }
  if (state.cartMemory) body.appendChild(h("p", "say", `Kỷ niệm xe đẩy: ${state.cartMemory.days} ngày, ${state.cartMemory.loaves} ổ. ${state.cartMemory.line}`));
  if (!list.length) { body.appendChild(h("p", "muted", "Nhật ký sẽ ghi lại mỗi ngày sau khi chốt ca.")); return; }
  for (const j of list) {
    const d = h("div", "rev" + (j.kind === "cart" ? " cart" : ""));
    d.appendChild(h("b", "", j.kind === "cart" ? "Kỷ niệm xe đẩy" : `Ngày ${j.day}: `));
    d.appendChild(document.createTextNode(" " + j.headline));
    if (j.moment) d.appendChild(h("div", "small muted", "“" + j.moment + "”"));
    if (j.kind !== "cart") d.appendChild(h("div", "small", `${j.loaves} ổ · lời ${j.profit}k · ${j.stars || "—"} sao`));
    body.appendChild(d);
  }
}
function eventsTab(body, state) {
  const hist = state.drama?.history || [];
  if (!hist.length) { body.appendChild(h("p", "muted", "Chưa có tình huống nào. Mở hàng vài ngày là có chuyện.")); return; }
  for (const e of hist) {
    const d = h("div", "rev");
    d.appendChild(h("b", "", `Ngày ${e.day} · ${e.who}: `));
    d.appendChild(document.createTextNode(e.label));
    d.appendChild(h("div", "small muted", "“" + e.line + "”" + (e.rolled ? (e.rolled === "win" ? " · hên" : " · xui") : "")));
    body.appendChild(d);
  }
  const waiting = (state.drama?.queue || []).filter((q) => EVENT[q.id]).length;
  if (waiting) body.appendChild(h("p", "muted small", `Còn ${waiting} chuyện hẹn quay lại…`));
}
function missionsTab(body, state) {
  const ms = state.shift?.missions?.length ? state.shift.missions : state.lastSummary?.missions || [];
  if (state.level < 2) { body.appendChild(h("p", "muted", "Nhiệm vụ ngày mở ở cấp 2.")); return; }
  if (!ms.length) { body.appendChild(h("p", "muted", "Nhiệm vụ hiện khi mở hàng.")); return; }
  body.appendChild(h("p", "muted small", state.shift ? "Nhiệm vụ hôm nay:" : "Nhiệm vụ ca vừa rồi:"));
  for (const m of ms) {
    const d = h("div", "rev" + (m.done ? " done" : ""));
    d.appendChild(h("b", "", (m.done ? "✓ " : "") + m.text));
    d.appendChild(h("div", "small", `${Math.min(m.prog, m.n)}/${m.n}${m.reward ? ` · thưởng ${m.reward.xp} XP${m.reward.money ? `, ${m.reward.money}k` : ""}` : ""}`));
    body.appendChild(d);
  }
}
function regularsTab(body, state) {
  const names = Object.keys(state.regulars || {});
  if (!names.length) { body.appendChild(h("p", "muted", "Khách quen hiện ở đây sau khi ghé tiệm.")); return; }
  for (const n of names) {
    const r = state.regulars[n], fav = REGULARS[n] || (r.fav ? { recipe: r.fav, quirks: [] } : null);
    const d = h("div", "rev");
    d.appendChild(h("b", "", n));
    const known = r.good >= 2;
    d.appendChild(h("div", "small", `Ghé ${r.visits} lần · ${known && fav ? `“như cũ”: ${RECIPE[fav.recipe]?.name || fav.recipe}${fav.quirks?.length ? " (" + fav.quirks.join(", ").replace(/-/g, " ") + ")" : ""}` : "chưa nhớ món"}`));
    body.appendChild(d);
  }
}
function badgesTab(body, state) {
  const rows = [
    ["Giai đoạn", state.shop ? (state.level >= 16 ? "Tiệm nổi tiếng" : "Tiệm") : "Xe đẩy"],
    ["Hạng tiệm", `${state.rank || 0}/${RANKS.length}`],
    ["Pate nhà làm", `${state.pate || 0}/${HOUSE_PATE.length}`],
    ["Ổ mang tên tiệm", state.house ? `${state.house.name} · ${state.house.price}k` : "chưa có"],
    ["Thử thách đã đạt", String(state.stats?.challenges || 0)],
    ["Hội chợ đã dự", String(state.fairCount || 0)],
    ["Hợp đồng đang chạy", (state.contracts || []).map((c) => `${c.name} (${c.left} đợt)`).join(", ") || "không có"],
    ["Ổ đã bán", String(state.stats?.loaves || 0)],
    ["Nhiệm vụ đã xong", String(state.stats?.missions || 0)],
  ];
  const t = h("table", "pl");
  for (const [a, b] of rows) { const tr = h("tr"); tr.appendChild(h("td", "", a)); tr.appendChild(h("td", "", b)); t.appendChild(tr); }
  body.appendChild(t);
  // bức tường huy hiệu (14): đã nhận hiện ngày nhận, chưa nhận hiện điều kiện
  const bw = h("div", "badge-wall"); bw.id = "badgeWall";
  bw.appendChild(h("h3", "", `Huy hiệu · ${Object.keys(state.badges || {}).filter((id) => BADGE[id]).length}/${BADGES.length}`));
  const grid = h("div", "bw-grid");
  for (const b of BADGES) { const got = state.badges?.[b.id]; const it = h("div", "bw-item" + (got ? " on" : "")); it.dataset.badge = b.id; it.appendChild(h("b", "", b.name)); it.appendChild(h("small", "", got ? `Nhận ngày ${got}` : b.desc)); grid.appendChild(it); }
  bw.appendChild(grid); body.appendChild(bw);
}
