// Bảng phủ: màn chào, Chuẩn bị (Nhập hàng · Ướp sườn · Mẻ đầu · Menu · Ca · Dự báo), chốt ca (lời lỗ), nghỉ giữa ca, tạm dừng, cách chơi,
// xác nhận chơi lại, khiếu nại, tính dư, hết hàng, Kho (nhập gấp trong ca), Sổ (review, khách quen). Ca tạm dừng khi có bảng phủ.
import { el, button, fmtK, starText, tableName } from "./common.js?v=c3";
import { STOCK, DISHES, GEAR, SHIFTS, GRILL, guestsFor } from "../data/economy.js?v=c3";
import { ARCHETYPES } from "../data/customers.js?v=c3";
import { packPrice, packSize, canBuy, capacity, stockUsed, forecast, consignAvailable, maxPlates } from "../core/stock.js?v=c3";
import { stockoutOptions, itemName } from "../core/rescue.js?v=c3";
import { MISTAKES } from "../core/score.js?v=c3";
import { xpToNext } from "../core/progress.js?v=c3";
import { groupById } from "../core/tables.js?v=c3";
import { createBook } from "./notebook.js?v=c3"; // C: Sổ quản lý, tính cách, thẻ Nhật Ký
import * as PU from "./progress-ui.js?v=c3"; // A: tab Chuẩn bị M3 (đồ nghề, trang trí, đơn đặt, hạng quán, ca, Chú Hòa), chốt ca, sổ nợ
import { potSize } from "../core/progression.js?v=c3"; // A: cỡ nồi theo giai đoạn
import "./book-tabs.js?v=c3"; // gộp: tab Sổ của A (Sổ nợ, Nhiệm vụ, Huy hiệu) + B (Sự kiện)
import * as M5 from "./m5-ui.js?v=c3"; // S: nút bật / tắt món (M5)

const BUY_ORDER = ["suon", "gao-tam", "than", "do-chua", "dua-leo", "nuoc-mam", "mo-hanh-bo", "tra", "khan-lanh", "hop", "bi", "trung", "cha", "tui"];

export function createOverlays(overlay, sheet, atlas, act, hooks) {
  let current = null, prepTab = "buy";
  const open = (name, cls = "") => { current = name; overlay.hidden = false; sheet.className = "sheet " + cls; sheet.textContent = ""; document.body.classList.add("ov"); sheet.dataset.ov = name; return sheet; };
  const close = () => { current = null; overlay.hidden = true; sheet.textContent = ""; document.body.classList.remove("ov"); };
  const footer = (p) => el("div", "footer", p);
  const focusFirst = () => setTimeout(() => sheet.querySelector(".choice:not(:disabled), .btn.primary, input")?.focus({ preventScroll: true }), 30);
  const state = () => hooks.state();
  const C = createBook({ open, close, act, state, hooks: { ...hooks, summary: (s) => summary(s) }, focusFirst }); // C:

  // ---------- màn chào ----------
  function intro(s) {
    const p = open("intro", "intro");
    const art = el("div", "art", p);
    const f = atlas.sheet("title") ? null : atlas.frame("title", "scene");
    const img = el("img", "", art); img.alt = ""; img.src = atlas.sheet("title") ? atlas.base + "assets/title-art.webp" : f?.url || "";
    const fit = () => { const w = art.clientWidth, h = art.clientHeight || 360, d = devicePixelRatio || 1; const k = Math.ceil(Math.max(w / 1280, h / 720) * d * 2 - 1e-6) / 2 / d; img.style.width = 1280 * k + "px"; img.style.height = 720 * k + "px"; img.style.left = Math.round(((w - 1280 * k) / 2) * d) / d + "px"; img.style.top = Math.round(((h - 720 * k) / 2) * d) / d + "px"; };
    requestAnimationFrame(fit);
    const pane = el("div", "pane", p);
    el("h2", "", pane, "Quán Cơm Tấm");
    el("p", "muted", pane, "Sáu giờ tối, than đã đỏ. Bạn là cô chủ quán cơm tấm vỉa hè: lật sườn cho kịp, bày dĩa đủ lớp, đi bưng ra bàn, châm trà đá, tính tiền và dọn bàn cho khách mới.");
    el("label", "", pane, "Tên quán").style.fontWeight = 800;
    const inp = el("input", "name", pane); inp.id = "shopName"; inp.value = s.shopName; inp.maxLength = 32; inp.autocomplete = "off";
    C.introPicker(pane, s); // C: chọn tính cách cô chủ
    const f2 = footer(pane);
    button(f2, "btn primary", s.introSeen ? `Tiếp tục ngày ${s.day}` : "Nhóm bếp mở quán", () => {
      act({ type: "setName", name: inp.value || s.shopName });
      C.commitIntro(); // C:
      act({ type: "seeIntro" });
      close(); hooks.afterIntro();
    }, { id: "introGo" });
    focusFirst();
  }

  // ---------- Chuẩn bị ----------
  function prep(s, tab = prepTab) {
    prepTab = tab;
    const p = open("prep");
    const head = el("div", "rowx", p);
    el("h2", "", head, `Chuẩn bị ngày ${s.day}${s.between ? " · nghỉ giữa ca" : ""}`);
    el("span", "big", head, fmtK(s.money));
    const tabs = el("div", "tabs", p);
    const T = PU.tabs(s, [["buy", "Nhập hàng"], ["marinate", "Ướp sườn"], ["first", "Mẻ đầu"], ["menu", "Menu"], ["shift", "Ca"], ["gear", "Đồ nghề"]]); // A: thêm tab M3
    for (const [id, name] of T) button(tabs, "tab" + (id === tab ? " on" : ""), name, () => prep(state(), id), { "data-tab": id });
    const grid = el("div", "grid2", p);
    const main = el("div", "", grid);
    const side = el("div", "card", grid);
    const f = forecast(s);
    el("h3", "", side, "Dự báo hôm nay");
    el("p", "", side, `Khách ngồi: khoảng ${f.guests} người (${s.plan.map((k) => SHIFTS[k].name).join(" + ")}).`);
    el("p", "", side, `Cần chừng ${f.dishes} dĩa · ${f.tea} ly trà · ${f.coal} rổ than.`);
    el("p", "muted", side, `Kho ${stockUsed(s)}/${capacity(s)} phần · dĩa ${s.plates} cái · bao than dự phòng ${s.spareSack}.`);
    const warn = [];
    if ((s.stock["suon-uop"] || 0) < f.dishes) warn.push(`Sườn ướp mới ${s.stock["suon-uop"] || 0} miếng.`);
    if (s.kitchen.rice <= 0) warn.push("Nồi cơm chưa nấu.");
    if (s.moHanh.n <= 0) warn.push("Chưa có mỡ hành.");
    if (s.kitchen.coal <= 0) warn.push("Bếp chưa nhóm than.");
    if ((s.stock.than || 0) + s.spareSack * 10 < 4) warn.push("Coi chừng hết than.");
    if (s.uopOld > 0) warn.push(`${s.uopOld} miếng sườn ướp hôm qua: tươi tối đa 85.`);
    if (s.consign?.owed) warn.push(`Còn nợ ký gửi Cô Ba ${s.consign.owed}k (trả dần khi bán).`);
    for (const w of warn) el("p", "", side, "• " + w).style.color = "#9a3a2a";
    if (!warn.length) el("p", "", side, "Sẵn sàng mở quán!").style.color = "#2f5a50";
    PU.side(side, s, { act, rerender: (t) => prep(state(), t || tab) }); // A: sổ nợ, đơn hôm nay, lên quán
    if (consignAvailable(s)) button(side, "btn small", "Nhận gói ký gửi Cô Ba", () => { act({ type: "consign" }); prep(state(), tab); }, { "data-act": "consign" });

    if (PU.renders(tab)) PU.render(tab, main, s, { act, rerender: (t) => prep(state(), t || tab), toast: hooks.toast, atlas }); // A: tab M3
    else if (tab === "buy") {
      button(main, "btn primary", "Nhập + ướp đủ cho hôm nay", () => { act({ type: "restockToday" }); prep(state(), tab); }, { "data-act": "restockToday" });
      el("p", "muted", main, "Cô Ba sạp thịt chợ: sườn, gạo tấm, đồ chua, dưa leo, nước mắm, than, trà, hộp. Hàng tươi có hạn (dưa leo, bì, sườn sống 3 ngày).");
      for (const id of BUY_ORDER) {
        if (!canBuy(s, id)) continue;
        const r = el("div", "rowx", main);
        const l = el("div", "", r); el("div", "nm", l, STOCK[id].name); el("div", "sub", l, `Có ${s.stock[id] || 0} ${STOCK[id].unit}`);
        const rr = el("div", "r", r);
        button(rr, "btn small", `+${packSize(id)} · ${packPrice(id)}k`, () => { act({ type: "restock", id }); prep(state(), tab); }, { "data-buy": id, disabled: packPrice(id) > s.money ? "" : null });
      }
    } else if (tab === "marinate") {
      el("p", "", main, `Sườn sống: ${s.stock.suon || 0} miếng · sườn đã ướp: ${s.stock["suon-uop"] || 0} miếng.`);
      el("p", "muted", main, "Miếng chưa ướp không lên vỉ được. Ướp dư thì để qua mai (tươi tối đa 85). Giữa ca ướp gấp mất 10 giây đứng ở khay.");
      const r = el("div", "rowx", main);
      for (const n of [1, 5, 10]) button(r, "btn small", `Ướp ${n}`, () => { act({ type: "marinate", n }); prep(state(), tab); }, { "data-marinate": n, disabled: (s.stock.suon || 0) <= 0 ? "" : null });
      button(r, "btn small", "Ướp hết", () => { act({ type: "marinate", n: s.stock.suon || 0 }); prep(state(), tab); }, { "data-marinate": "all", disabled: (s.stock.suon || 0) <= 0 ? "" : null });
    } else if (tab === "first") {
      el("p", "muted", main, "Làm trước khi mở quán, không tính giờ.");
      const rows = [
        ["prepCook", `Nấu nồi cơm (nồi ${s.kitchen.rice}/${potSize(s)} · gạo ${s.stock["gao-tam"] || 0})`, s.kitchen.rice >= potSize(s) || (s.stock["gao-tam"] || 0) <= 0], // A: nồi lớn / nồi thứ hai
        ["prepMoHanh", `Làm hũ mỡ hành (hũ ${s.moHanh.n} phần · ${s.stock["mo-hanh-bo"] || 0} bộ)`, s.moHanh.n >= 10 || (s.stock["mo-hanh-bo"] || 0) <= 0],
        ["prepLight", `Nhóm bếp than (2 rổ, mức than ${GRILL.prepLight.level} · đang ${Math.round(s.kitchen.coal)}${s.owned?.["grill-2"] && s.stage === "quan" ? ` · bếp 2 than riêng ${Math.round(s.kitchen.coal2 || 0)}` : ""})`, (s.kitchen.coal >= GRILL.prepLight.level && !(s.owned?.["grill-2"] && s.stage === "quan" && (s.kitchen.coal2 || 0) < GRILL.prepLight.level)) || (s.stock.than || 0) < 2], // S: bếp 2 than riêng
      ];
      for (const [type, text, dis] of rows) { const r = el("div", "rowx", main); el("div", "nm", r, text); button(r, "btn small", dis ? "Xong" : "Làm", () => { act({ type }); prep(state(), tab); }, { "data-act": type, disabled: dis ? "" : null }); }
    } else if (tab === "menu") {
      el("p", "muted", main, "Món mới mở tự vào menu. Tắt món nào thì khách không gọi món đó.");
      for (const [id, d] of Object.entries(DISHES)) {
        if (d.rescue) continue;
        const r = el("div", "rowx", main);
        const l = el("div", "", r); el("div", "nm", l, `${d.name} · ${d.price}k`); el("div", "sub", l, d.level > s.level ? `Mở ở cấp ${d.level}` : (d.needs || []).some((k) => !s.owned[k]) ? `Cần ${d.needs.map((k) => GEAR[k]?.name).join(", ")}` : `Giá vốn ~${d.cost}k`);
        el("span", "", r, s.menu.includes(id) ? "Đang bán" : "—");
        M5.menuToggle(r, s, id, act, () => prep(state(), tab)); // S: bật / tắt món (M5)
      }
    } else if (tab === "shift") {
      el("p", "", main, "Ca tối 17:30–23:00: tối sớm sinh viên, cao điểm 18:30–20:00, khuya thợ công trình và tài xế.");
      el("p", "muted", main, s.level >= SHIFTS.trua.unlock ? "Ca trưa đã mở: dân văn phòng tới dồn, ăn nhanh, nhiều hộp mang về." : `Ca trưa (dân văn phòng) mở ở cấp ${SHIFTS.trua.unlock}.`);
      if (s.level >= SHIFTS.trua.unlock && s.shiftIdx === 0) {
        const both = s.plan.includes("trua");
        button(main, "btn small", both ? "Chỉ mở ca tối" : "Mở cả ca trưa + ca tối", () => { act({ type: "setPlan", kinds: both ? ["toi"] : ["trua", "toi"] }); prep(state(), tab); }, { "data-act": "plan" });
      }
    } else if (tab === "gear") {
      for (const [id, G] of Object.entries(GEAR)) {
        const r = el("div", "rowx", main);
        const l = el("div", "", r); el("div", "nm", l, `${G.name} · ${G.price}k`); el("div", "sub", l, G.level > s.level ? `Mở ở cấp ${G.level}` : G.text);
        const owned = !G.repeat && s.owned[id];
        const dis = owned || G.level > s.level || G.price > s.money || (id === "plates-4" && s.plates + 4 > maxPlates(s));
        button(r, "btn small", owned ? "Đã có" : "Mua", () => { act({ type: "buyGear", id }); prep(state(), tab); }, { "data-gear": id, disabled: dis ? "" : null });
      }
    }
    const fo = footer(p);
    if (!s.between) button(fo, "btn", "Cách chơi", () => help(() => prep(state(), prepTab)));
    button(fo, "btn primary", s.between ? `Mở ${SHIFTS[s.between].name.toLowerCase()}` : "Mở quán", () => {
      const r = act({ type: "startShift" });
      if (!r.err) close();
    }, { id: "openShop" });
    focusFirst();
  }

  // ---------- chốt ca ----------
  function summary(s) {
    const m = s.lastSummary;
    const p = open("summary");
    el("h2", "", p, `Chốt ${m.kindName.toLowerCase()} · ngày ${m.day}`);
    const top = el("div", "rowx", p);
    el("div", "big", top, `${m.profit >= 0 ? "Lời" : "Lỗ"} ${fmtK(Math.abs(m.profit))}`);
    el("div", "", top, `${m.plates} dĩa · ${m.avg ? m.avg.toString().replace(".", ",") + " sao" : "chưa có sao"} · +${m.xp} XP (cấp ${m.level})`);
    if (m.final && m.headline) el("p", "headline", p, m.headline); // C: câu chốt ngày (Nhật Ký)
    const grid = el("div", "grid2", p);
    const pl = el("div", "pl card", grid);
    const line = (a, b, neg = false, cls = "") => { el("span", cls, pl, a); el("span", (neg ? "neg " : "") + cls, pl, b); };
    line("Doanh thu", fmtK(m.revenue));
    line("Giá vốn món bán", "−" + fmtK(m.cogs), true);
    line(`Hao hụt (sườn cháy ${m.burnt}, cơm dư ${m.riceLeft}, lớp bỏ…)`, "−" + fmtK(m.waste), true);
    line(`Than (${m.coalBaskets} rổ + nhóm bếp)`, "−" + fmtK(m.coal), true);
    line("Trà đá", "−" + fmtK(m.tea), true);
    line("Phí ca (giữ chỗ + điện)", "−" + fmtK(m.fee), true);
    if (m.staff) line("Lương phụ việc", "−" + fmtK(m.staff), true); // A:
    line("Lợi nhuận vận hành", fmtK(m.profit), m.profit < 0, "tot");
    const r = el("div", "card", grid);
    el("p", "", r, `Khách bỏ về: ${m.lost}${m.passed ? ` · đi ngang không có chỗ chờ: ${m.passed}` : ""}${m.soldOut ? ` · báo hết món: ${m.soldOut}` : ""}`);
    el("p", "", r, `Lật đúng lúc: ${m.perfectFlips} lần · rửa ${m.washed} dĩa · khói cao nhất ${m.smokeMax}`);
    if (m.underBill) el("p", "", r, `Tính thiếu: ${m.underBill}k (khách không nói, quán mất tiền).`).style.color = "#9a3a2a";
    const ms = Object.entries(m.mistakes || {});
    if (ms.length) el("p", "", r, "Lỗi: " + ms.map(([k, n]) => `${MISTAKES[k]?.name || k} ×${n}`).join(", "));
    if (m.owed) el("p", "muted", r, `Nợ ký gửi Cô Ba còn ${m.owed}k.`);
    el("p", "muted", r, `Tiền trong két: ${fmtK(m.money)}`);
    PU.summary(r, m); // A: nhiệm vụ, ghi sổ, mâm cơm, cơm chiên ngày mai
    M5.summary(r, m); // S: hội chợ, thử thách, huy hiệu mới (M5)
    el("h3", "", p, "Review nổi bật");
    for (const rv of (m.reviews || []).slice(0, 3)) { const d = el("div", "review", p); el("span", "stars", d, starText(rv.stars) + " "); el("b", "", d, rv.name + ": "); el("span", "", d, rv.line); }
    if (!m.reviews?.length) el("p", "muted", p, "Chưa có review.");
    const fo = footer(p);
    if (m.final) {
      C.journalButton(fo, s, m.day); // C: thẻ Nhật Ký Làm Chủ
      if (s.feed.some((r) => !r.reply)) button(fo, "btn", "Trả lời review", () => book(state(), "reviews"), { "data-act": "openBook" }); // C:
      if (hooks.replayInfo()) button(fo, "btn", "Chơi lại ngày hôm nay", () => confirm("replay", () => summary(state())), { "data-act": "replay" });
      button(fo, "btn primary", "Ngày tiếp theo", () => { act({ type: "closeSummary" }); const r = act({ type: "nextDay" }); if (!r.err) { close(); hooks.afterSummary(); } }, { "data-act": "nextDay" });
    } else button(fo, "btn primary", "Nghỉ giữa ca", () => { act({ type: "closeSummary" }); close(); prep(state(), "buy"); }, { "data-act": "toBreak" });
    focusFirst();
  }

  // ---------- tạm dừng / cách chơi / xác nhận ----------
  function pause() {
    const p = open("pause", "narrow");
    el("h2", "", p, "Tạm dừng");
    el("p", "muted", p, "Đồng hồ ca và bếp đã dừng.");
    const fo = el("div", "", p);
    const big = (t, f, attrs) => { const b = button(fo, "btn", t, f, attrs); b.style.width = "100%"; b.style.margin = "4px 0"; return b; };
    big("Tiếp tục", () => { close(); hooks.resume(); }, { "data-act": "resume" }).classList.add("primary");
    big("Cách chơi", () => help(() => pause()));
    if (hooks.replayInfo()) big("Chơi lại ngày hôm nay", () => confirm("replay", () => pause()), { "data-act": "replay" });
    big("Chơi lại từ đầu", () => confirm("restart", () => pause()), { "data-act": "restart" });
    focusFirst();
  }
  function help(back) {
    const p = open("help");
    el("h2", "", p, "Cách chơi");
    const cards = el("div", "help-cards", p);
    const C = [
      ["Bếp than", "Vỉ 6 chỗ: 2 trái nóng (chín nhanh, dễ cháy), 2 giữa vừa, 2 phải giữ ấm (không cháy trước 60 giây, sườn khô dần). Than cháy dần: bấm Than để thêm rổ (bén sau 4 giây). Giữ Quạt cho lửa mạnh, nhưng tốn than và sinh khói."],
      ["Lật sườn", "Mỗi miếng có hai mặt. Chỉ mặt úp xuống than mới chín. Vòng trên chip: nửa trái = mặt dưới, nửa phải = mặt trên. Mặt dưới chín (chip sáng, chữ Lật!) thì chạm để lật. Chín hai mặt thì chạm để gắp vào dĩa hoặc dời sang vùng giữ ấm."],
      ["Bày dĩa", "Chạm phiếu để ghim lên ô bày. Lấy dĩa → xới cơm → mỡ hành → món nướng → đồ chua → dưa leo → nước mắm. Ô viền vàng là lớp phiếu cần. Đọc kỹ dặn dò: thêm cơm, không mỡ hành, nước mắm để riêng, cháy cạnh…"],
      ["Bàn", "Chạm khách đang chờ rồi chạm bàn trống để mời ngồi. Chạm bàn để cô chủ ra châm trà, lấy phiếu, tính tiền, dọn bàn. Cô chủ đi bộ thật: trong lúc đi, bếp vẫn chạy! Bàn dơ thì khách mới không ngồi được."],
      ["Tính tiền", "Khách ăn xong vẫy tay gọi tính tiền. Chạm từng dòng món bàn đã dùng để cộng, rồi Thu tiền. Cộng dư là khách phản đối; cộng thiếu là quán mất tiền. Ngày 1–3 có nút Tính đúng."],
      ["Dĩa và ca", "Dĩa dơ vào thau: bấm Dĩa sạch / Rửa chén (6 giây cho 6 dĩa). Hết dĩa thì tạm dùng hộp. Hết hàng giữa ca luôn có cách cứu miễn phí. Phím: 1–6 vỉ, C than, giữ F quạt, R nấu cơm, Space bước kế, Enter giao, Esc tạm dừng."],
    ];
    for (const [h, t] of C) { const c = el("div", "card", cards); el("h4", "", c, h); el("p", "", c, t); }
    const fo = footer(p);
    if (hooks.replayInfo()) button(fo, "btn", "Chơi lại ngày hôm nay", () => confirm("replay", () => help(back)), { "data-act": "replay" }); // A:
    button(fo, "btn", "Chơi lại từ đầu", () => confirm("restart", () => help(back)), { "data-act": "restart" });
    button(fo, "btn primary", "Đã hiểu", () => { close(); back ? back() : hooks.resume(); }, { "data-act": "helpClose" });
    focusFirst();
  }
  function confirm(kind, back) {
    const p = open("confirm-" + kind, "narrow");
    el("h2", "", p, kind === "restart" ? "Chơi lại từ đầu?" : "Chơi lại ngày hôm nay?");
    el("p", "", p, kind === "restart" ? "Quán mới ngày 1. Bản hiện tại được cất dự phòng (không mất)." : "Quay về đầu ngày đã lưu. Bản hiện tại được cất dự phòng.");
    const fo = footer(p);
    button(fo, "btn", "Thôi", () => back(), { "data-act": "confirmNo" });
    button(fo, "btn primary", "Chơi lại", () => { if (!(kind === "restart" ? hooks.restart() : hooks.replay())) hooks.toast("Không chơi lại được (bộ nhớ trình duyệt bị chặn).", "warn"); }, { "data-act": kind === "restart" ? "restartYes" : "replayYes" });
    focusFirst();
  }

  // ---------- hội thoại trong ca ----------
  const choiceBtn = (p, o, onPick) => {
    const b = button(p, "choice" + (o.free ? " free" : ""), null, onPick, { "data-choice": o.id, disabled: o.ok === false ? "" : null });
    const l = el("div", "", b); el("b", "", l, o.label); if (o.hint) el("small", "", l, o.hint);
    el("span", "cost", b, o.cost || "");
    return b;
  };
  function complaint(s) {
    const d = s.shift.dialog, g = groupById(s, d.gid);
    const m = g?.members.find((x) => x.tk === d.tk);
    const p = open("complaint", "narrow");
    el("h2", "", p, d.serious ? "Xin lỗi khách" : "Khách phàn nàn");
    el("p", "", p, `${m?.name || "Khách"} (${tableName(g?.table)}): “${d.line}”`);
    el("p", "muted", p, `Lỗi: ${MISTAKES[d.mistake]?.name}. ${d.serious ? "Lỗi nghiêm trọng, xin lỗi đàng hoàng." : "Chọn cách bù cho khách."}`);
    const opts = d.serious
      ? [{ id: "remake", label: "Làm lại dĩa mới, miễn phí", hint: "Ghim lại phiếu, nướng kỹ miếng khác", cost: "Miễn phí dĩa này" }, { id: "refund", label: "Hoàn tiền dĩa này + hứa cẩn thận", hint: "Khách vẫn ăn phần khác, review nhẹ hơn", cost: "Mất tiền dĩa" }]
      : [{ id: "remake", label: "Làm lại dĩa khác", hint: "Phiếu quay lại thanh phiếu, khách chờ thêm", cost: "Hao dĩa cũ" }, { id: "discount", label: "Giảm 30% dĩa này", hint: "Khách dễ chịu hơn (+1 sao trần)", cost: "−30%" }, { id: "free", label: "Mời khách dĩa này", hint: "Khách vui (+2 sao trần)", cost: "Miễn phí dĩa" }];
    for (const o of opts) choiceBtn(p, o, () => { const r = act({ type: "complaint", choice: o.id }); if (!r.err) { close(); hooks.resume(); } });
    focusFirst();
  }
  function overcharge(s) {
    const d = s.shift.dialog;
    const p = open("overcharge", "narrow");
    el("h2", "", p, "Khách phản đối: tính dư tiền");
    el("p", "", p, `“${d.line}”`);
    el("p", "muted", p, `Tính dư ${d.over}k.`);
    for (const o of [{ id: "refund", label: "Xin lỗi, trả lại tiền dư", cost: `−${d.over}k` }, { id: "refundTea", label: "Trả lại + mời ly trà tắc", hint: "Khách bớt giận (+1 sao trần)", cost: `−${d.over + 4}k` }])
      choiceBtn(p, o, () => { const r = act({ type: "overcharge", choice: o.id }); if (!r.err) { close(); hooks.resume(); } });
    focusFirst();
  }
  function stockout(s) {
    const d = s.shift.dialog;
    const p = open("stockout", "narrow");
    el("h2", "", p, `Hết ${itemName(d.id)}!`);
    el("p", "muted", p, "Chọn cách xoay xở. Luôn có cách miễn phí. Đồng hồ ca đang dừng.");
    for (const o of stockoutOptions(s)) choiceBtn(p, o, () => { const r = act({ type: "stockout", choice: o.id }); if (!r.err) { close(); hooks.resume(); } else hooks.toast(r.err === "cannot-afford" ? "Không đủ tiền cho lựa chọn này." : "Không chọn được.", "warn"); });
    focusFirst();
  }
  /** Kho trong ca: nhập gấp Cô Ba (+15%). */
  function stock(s) {
    const p = open("stock");
    el("h2", "", p, s.shift ? "Kho · nhập gấp (+15%)" : "Kho");
    el("p", "muted", p, `Kho ${stockUsed(s)}/${capacity(s)} phần · tiền ${fmtK(s.money)}.`);
    for (const id of BUY_ORDER) {
      if (!canBuy(s, id)) continue;
      const r = el("div", "rowx", p);
      const l = el("div", "", r); el("div", "nm", l, STOCK[id].name); el("div", "sub", l, `Có ${s.stock[id] || 0} ${STOCK[id].unit}${(s.stock[id] || 0) <= 2 ? " · sắp hết" : ""}`);
      const price = packPrice(id, !!s.shift);
      button(el("div", "r", r), "btn small", `+${packSize(id)} · ${price}k`, () => { const x = act({ type: "restock", id }); if (x.err) hooks.toast(x.err === "money" ? "Không đủ tiền." : x.err === "capacity" ? "Kho đầy." : "Không nhập được.", "warn"); stock(state()); }, { "data-buy": id, disabled: price > s.money ? "" : null });
    }
    if (s.shift && consignAvailable(s)) button(p, "btn", "Nhận gói ký gửi Cô Ba", () => { act({ type: "consign" }); stock(state()); }, { "data-act": "consign" });
    const fo = footer(p);
    button(fo, "btn primary", "Đóng", () => { close(); hooks.resume(); }, { "data-act": "stockClose" });
    focusFirst();
  }
  /** Sổ quản lý (ui/notebook.js, Agent C): Review · Nhật ký · Sự kiện · Nhiệm vụ · Huy hiệu. */
  function book(s, tab) { C.book(s, tab); }
  return { intro, prep, summary, pause, help, confirm, complaint, overcharge, stockout, stock, book, close, journalCard: C.journalCard, personaAsk: C.personaAsk, get current() { return current; } }; // C: journalCard, personaAsk
}
