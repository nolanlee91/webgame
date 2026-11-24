// "Bảng xếp hạng hôm nay" trong bảng kết quả Thử thách (daily-ui.js nạp lười file này sau khi hiện kết quả).
// Tự gửi kết quả lên máy chủ (hỏi tên hiển thị MỘT lần, bỏ qua được ⇒ "Người chơi"), rồi hiện top 10 + hạng của mình
// + "M người đã chơi". Mọi lỗi chỉ hiện một dòng nhỏ — không bao giờ chặn nút Khoe kết quả hay kết quả cục bộ.
import * as A from "./account.js?v=board1";

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const fmtN = (n) => Number(n || 0).toLocaleString("vi-VN");

/**
 * box: phần tử rỗng trong thẻ kết quả. result: kết quả đã ghi (có .proof nếu chơi bằng bản game có bảng xếp hạng).
 * Trả về Promise trạng thái cuối: "off" | "board" | "error" | "ask".
 */
export async function mountBoard(box, { game, day, result }) {
  const state = { phase: "loading", data: null, note: "" };
  box._board = state;
  const set = (phase, extra = {}) => { Object.assign(state, { phase }, extra); box.dataset.state = phase; };

  const m = await A.mode();
  if (m === "off") { set("off"); box.hidden = true; return "off"; }
  box.hidden = false;

  const head = () => {
    const h = el("div", "dly-lb__head");
    h.append(el("b", "dly-lb__title", "Bảng xếp hạng hôm nay"));
    const n = el("span", "dly-lb__count"); n.id = "dlyLbCount"; h.append(n);
    return h;
  };
  const msg = (text, retry) => {
    box.replaceChildren(head());
    const p = el("p", "dly-lb__msg", text); box.append(p);
    if (retry) {
      const b = el("button", "dly-btn dly-lb__retry", "Thử lại"); b.type = "button"; b.id = "dlyLbRetry";
      b.addEventListener("click", retry); p.append(" ", b);
    }
  };
  const loading = (text) => { set("loading"); msg(text); box.querySelector(".dly-lb__msg").classList.add("is-wait"); };

  function render(data, note = "") {
    set("board", { data, note });
    box.replaceChildren(head());
    box.querySelector("#dlyLbCount").textContent = `${fmtN(data.total)} người đã chơi`;
    if (note) box.append(el("p", "dly-lb__note", note));
    const top = data.top || [];
    if (!top.length) { box.append(el("p", "dly-lb__msg", "Chưa có ai trên bảng hôm nay.")); return "board"; }
    const ol = el("ol", "dly-lb__list"); ol.id = "dlyLbList";
    const row = (e, you) => {
      const li = el("li", "dly-lb__row" + (you ? " is-you" : ""));
      li.append(el("span", "dly-lb__rank", "#" + e.rank), el("span", "dly-lb__name", e.name), el("span", "dly-lb__score", e.short || ""));
      if (you) li.setAttribute("aria-current", "true");
      return li;
    };
    for (const e of top) ol.append(row(e, !!e.you));
    if (data.me && !top.some((e) => e.you)) {
      const gap = el("li", "dly-lb__gap", "⋯"); gap.setAttribute("aria-hidden", "true");
      ol.append(gap, row(data.me, true));
    }
    box.append(ol);
    if (data.me) {
      const you = el("p", "dly-lb__you"); you.id = "dlyLbMe";
      you.append("Bạn hạng ", el("b", null, `#${data.me.rank}`), ` / ${fmtN(data.total)}`);
      box.append(you);
    }
    return "board";
  }

  async function view(note = "") {
    loading("Đang tải bảng xếp hạng…");
    try { return render(await A.getBoard(game, day, { create: false }), note); }
    catch (e) { set("error", { error: e.code }); msg("Chưa kết nối được bảng xếp hạng.", () => view(note)); return "error"; }
  }

  async function send() {
    loading("Đang gửi kết quả lên bảng…");
    try {
      const r = await A.submitDaily(game, day, { name: A.getName() || A.DEFAULT_NAME, proof: result.proof });
      return render(r, r.accepted === false ? "Bảng giữ kết quả bạn gửi lần đầu." : "");
    } catch (e) {
      if (e.code === "invalid" || e.code === "proof") { A.markSent(game, day); return view("Kết quả này không được ghi lên bảng."); }
      if (e.code === "day") { A.markSent(game, day); return view("Đã qua ngày, bảng hôm đó đã chốt."); }
      if (e.code === "off") { set("off"); box.hidden = true; return "off"; }
      set("error", { error: e.code });
      msg("Chưa kết nối được bảng xếp hạng.", () => send());
      return "error";
    }
  }

  function ask() {
    set("ask");
    box.replaceChildren(head());
    const f = el("form", "dly-name"); f.id = "dlyNameForm"; f.noValidate = true;
    const lab = el("label", "dly-name__lab", "Tên của bạn trên bảng xếp hạng"); lab.htmlFor = "dlyName";
    const rowEl = el("div", "dly-name__row");
    const inp = el("input", "dly-name__inp"); inp.id = "dlyName"; inp.type = "text"; inp.maxLength = 16; inp.autocomplete = "nickname";
    inp.placeholder = A.DEFAULT_NAME; inp.value = A.getName(); inp.setAttribute("enterkeyhint", "done");
    inp.addEventListener("keydown", (e) => e.stopPropagation()); // gõ tên không được thành phím tắt của game (M = tắt tiếng, W/A/S/D…)
    const ok = el("button", "dly-btn dly-name__ok", "Lưu"); ok.type = "submit"; ok.id = "dlyNameOk";
    const skip = el("button", "dly-btn dly-name__skip", "Bỏ qua"); skip.type = "button"; skip.id = "dlyNameSkip";
    rowEl.append(inp, ok, skip);
    f.append(lab, rowEl, el("small", "dly-name__hint", "2–16 ký tự. Chỉ hỏi một lần."));
    box.append(f);
    return new Promise((resolve) => {
      f.addEventListener("submit", (ev) => { ev.preventDefault(); A.setName(inp.value); resolve(send()); });
      skip.addEventListener("click", () => { A.setName(""); resolve(send()); });
    });
  }

  const canSend = !!(result && result.proof) && !A.isSent(game, day);
  if (canSend) return A.wasAsked() ? send() : ask();
  return view(result && !result.proof && !A.isSent(game, day) ? "Ván này chơi trước khi có bảng xếp hạng nên chưa có hạng." : "");
}
