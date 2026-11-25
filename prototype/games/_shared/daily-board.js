// "Bảng xếp hạng hôm nay" trong bảng kết quả Thử thách (daily-ui.js nạp lười file này sau khi hiện kết quả).
// Tự gửi kết quả lên máy chủ bằng tên chung của người chơi (account.js getName(): tên tự sinh "Heo Cute 15" hoặc tên đã đặt —
// không hỏi tên nữa), rồi hiện top 10 + hạng của mình + "M người đã chơi". Nút "Đổi tên" kiểm 2–16 ký tự ngay ở máy (HOME-15).
// Cùng điểm rút gọn ("4/5") mà khác hạng ⇒ hiện thêm tiêu chí phụ ("4/5 · 3,8 giây") — HOME-16.
// Mọi lỗi chỉ hiện một dòng nhỏ — không bao giờ chặn nút Khoe kết quả hay kết quả cục bộ.
import * as A from "./account.js?v=name1";

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const fmtN = (n) => Number(n || 0).toLocaleString("vi-VN");
const fmtSec = (ms) => (Math.round(Math.max(0, ms) / 100) / 10).toString().replace(".", ",") + " giây";
const mmss = (sec) => { sec = Math.max(0, Math.round(sec)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`; };

/** Tiêu chí phụ suy ra từ score máy chủ (games-server/account/verify.mjs): Đố Vui = đúng×100000 − ms; Sudoku = −(giây + phạt); 2048 = điểm. */
export function tieDetail(game, e) {
  const sc = Number(e && e.score);
  if (!Number.isFinite(sc)) return "";
  if (game === "do-vui-nhanh") { const ok = parseInt(e.short, 10) || 0; return fmtSec(ok * 100000 - sc); }
  if (game === "2048") return `${fmtN(sc)} điểm`;
  if (game === "sudoku") {
    const m = /^(\d+):(\d\d)/.exec(e.short || ""), t = m ? +m[1] * 60 + +m[2] : 0, pen = -sc - t;
    return pen > 0 ? `phạt +${mmss(pen)}` : "";
  }
  return "";
}
/** Chữ điểm của từng dòng: thêm tiêu chí phụ khi có dòng khác cùng điểm rút gọn nhưng khác score (HOME-16). */
export function scoreLabels(game, rows) {
  return rows.map((e) => {
    const tie = rows.some((o) => o !== e && o.short === e.short && o.score !== e.score);
    const d = tie ? tieDetail(game, e) : "";
    return (e.short || "") + (d ? " · " + d : "");
  });
}

/**
 * box: phần tử rỗng trong thẻ kết quả. result: kết quả đã ghi (có .proof nếu chơi bằng bản game có bảng xếp hạng).
 * Trả về Promise trạng thái cuối: "off" | "board" | "error".
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
    const all = data.me && !top.some((e) => e.you) ? [...top, data.me] : top;
    const labels = scoreLabels(game, all);
    const row = (e, you, i) => {
      const li = el("li", "dly-lb__row" + (you ? " is-you" : ""));
      li.append(el("span", "dly-lb__rank", "#" + e.rank), el("span", "dly-lb__name", e.name), el("span", "dly-lb__score", labels[i]));
      if (you) li.setAttribute("aria-current", "true");
      return li;
    };
    top.forEach((e, i) => ol.append(row(e, !!e.you, i)));
    if (all.length > top.length) {
      const gap = el("li", "dly-lb__gap", "⋯"); gap.setAttribute("aria-hidden", "true");
      ol.append(gap, row(data.me, true, all.length - 1));
    }
    box.append(ol);
    if (data.me) {
      const you = el("p", "dly-lb__you"); you.id = "dlyLbMe";
      you.append("Bạn hạng ", el("b", null, `#${data.me.rank}`), ` / ${fmtN(data.total)}`);
      const rn = el("button", "dly-btn dly-lb__rename", "Đổi tên"); rn.type = "button"; rn.id = "dlyLbRename";
      rn.addEventListener("click", () => rename(data.me.name));
      you.append(" ", rn);
      box.append(you);
    }
    const more = el("a", "dly-lb__more", "Xem bảng xếp hạng đầy đủ →");
    more.href = `../../homepage/bang-xep-hang.html?game=${encodeURIComponent(game)}`; more.id = "dlyLbMore";
    box.append(more);
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
      const r = await A.submitDaily(game, day, { name: A.getName(), proof: result.proof });
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

  function rename(current) {
    set("rename");
    box.replaceChildren(head());
    const f = el("form", "dly-name"); f.id = "dlyNameForm"; f.noValidate = true;
    const lab = el("label", "dly-name__lab", "Tên mới (dùng chung mọi game)"); lab.htmlFor = "dlyName";
    const rowEl = el("div", "dly-name__row");
    const inp = el("input", "dly-name__inp"); inp.id = "dlyName"; inp.type = "text"; inp.autocomplete = "nickname";
    inp.value = current || A.getName(); inp.setAttribute("enterkeyhint", "done"); inp.setAttribute("aria-describedby", "dlyNameErr");
    inp.addEventListener("keydown", (e) => e.stopPropagation()); // gõ tên không được thành phím tắt của game (M = tắt tiếng, W/A/S/D…)
    const ok = el("button", "dly-btn dly-name__ok", "Lưu"); ok.type = "submit"; ok.id = "dlyNameOk";
    const skip = el("button", "dly-btn dly-name__skip", "Huỷ"); skip.type = "button"; skip.id = "dlyNameSkip";
    rowEl.append(inp, ok, skip);
    const err = el("p", "dly-name__err"); err.id = "dlyNameErr"; err.setAttribute("role", "alert");
    f.append(lab, rowEl, err, el("small", "dly-name__hint", "2–16 ký tự. Bảng hôm nay đổi theo ngay."));
    box.append(f);
    inp.addEventListener("input", () => { err.textContent = ""; });
    f.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const c = A.checkName(inp.value);
      if (!c.ok) { err.textContent = c.error; inp.focus(); return; }
      ok.disabled = true;
      const r = await A.saveName(c.name, { syncBoard: false });
      ok.disabled = false;
      if (!r.ok) { err.textContent = r.error; inp.focus(); return; }
      loading("Đang đổi tên…");
      try { await A.renameMe(r.name); return view(); }
      catch (e) { set("error", { error: e.code }); msg("Chưa đổi được tên trên bảng, thử lại sau.", () => rename(r.name)); }
    });
    skip.addEventListener("click", () => view());
    inp.focus(); inp.select();
  }

  const canSend = !!(result && result.proof) && !A.isSent(game, day);
  if (canSend) return send();
  return view(result && !result.proof && !A.isSent(game, day) ? "Ván này chơi trước khi có bảng xếp hạng nên chưa có hạng." : "");
}
