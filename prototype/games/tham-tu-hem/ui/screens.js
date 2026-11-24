// Các màn nền: mở game (đặt tên), bản đồ Hẻm 47, văn phòng nhận hồ sơ (+ bài đăng nhóm), hiện trường, vạch mặt, kết vụ.
import { h, icon, toast } from "./dom.js?v=t2";
import { crispScale, hasFile, sceneFile, placeholderScene, hotspotRect, portraitEl, mapPin, dpr, SCENE_W, SCENE_H } from "./art.js?v=t2";
import { renderText } from "./dialog.js?v=t2";
import { locList, hotspotsAt, peopleList, topicsOf, unseenAt, newTopics, boardFilled, stmtList } from "../core/engine.js?v=t2";
import { rankOf, displayName, cleanName, DEFAULT_NAME, caseRep } from "../core/progress.js?v=t2";
import { pickEvidence, clueCard } from "./panels.js?v=t2";
import { play as sfx } from "./sfx.js?v=t2";

const after = [];
/** Việc chạy sau khi màn đã gắn vào DOM (đo kích thước, tự phát thoại…). */
export function afterRender(app) { const list = after.splice(0); for (const f of list) f(app); }
const narrow = () => innerWidth < 900;
const stars = (n, max = 3) => h("span.stars", { "aria-label": `${n} trên ${max} sao` }, Array.from({ length: max }, (_, i) => icon(i < n ? "star" : "starOff", 16)));

/** Ảnh nền phủ khung (cover) mà vẫn nét: hệ số bội 0,5 px thiết bị, căn giữa, cắt mép. */
function coverImg(file, fallbackUrl, W, H, fw = SCENE_W, fh = SCENE_H) {
  const d = dpr(), m = Math.ceil(Math.max(W / fw, H / fh) * d * 2), k = m / 2 / d;
  const w = fw * k, hh = fh * k;
  return h("img.cover-img", { src: hasFile(file) ? file : fallbackUrl, alt: "", draggable: "false", style: { width: w + "px", height: hh + "px", left: (W - w) / 2 + "px", top: (H - hh) / 2 + "px" } });
}

// ---------- màn mở ----------
export function title(app) {
  const p = app.G.profile, W = innerWidth, H = innerHeight - 52;
  const hasRun = Object.keys(p.solved).length || Object.keys(p.runs).length || p.created;
  const r = rankOf(p.rep);
  const input = h("input.inp#detName", { type: "text", maxlength: "24", placeholder: DEFAULT_NAME, value: p.name, autocomplete: "off", "aria-label": "Tên thám tử" });
  const go = () => { app.setName(cleanName(input.value)); app.show("map"); };
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); go(); } });
  return h("section.title-screen",
    h("div.title-bg", coverImg("assets/title-art.webp", placeholderScene("title", [], "title"), W, H)),
    h("div.title-shade"),
    h("div.title-col",
      h("div.title-logo", h("small", "Hẻm 47 · Sài Gòn"), h("b", "Thám Tử"), h("b.l2", "Hẻm"), h("span.title-tag", "Phá những vụ án dở khóc dở cười trong xóm")),
      h("div.card.title-card",
        h("label.lb", { for: "detName" }, "Tên thám tử"),
        input,
        hasRun ? h("p.rank-line", icon("lens", 16), ` ${r.name} · ${p.rep} danh tiếng · ${Object.keys(p.solved).length} vụ đã phá`) : h("p.rank-line", "Mở văn phòng thám tử đầu tiên của Hẻm 47."),
        h("button.btn.btn--primary.btn--big#startBtn", { type: "button", onclick: go }, hasRun ? "Vào văn phòng" : "Mở văn phòng"),
        h("details.how",
          h("summary", "Cách chơi"),
          h("ul",
            h("li", h("b", "Soi hiện trường:"), " bấm đồ vật để tìm vật chứng và từ khoá."),
            h("li", h("b", "Thẩm vấn:"), " hỏi từng người, lời khai được ghi vào Sổ tay."),
            h("li", h("b", "Vạch mâu thuẫn:"), " chọn lời khai rồi đưa vật chứng nói ngược. Sai thì mất uy tín (kính lúp)."),
            h("li", h("b", "Bảng suy luận:"), " điền từ khoá vào chỗ trống rồi chốt. Đúng hết thì vạch mặt thủ phạm."),
            h("li", h("b", "Phím tắt:"), " Space/Enter qua thoại, N sổ tay, B bảng, M tắt tiếng, Esc đóng.")),
          hasRun ? h("button.btn.btn--danger.btn--sm#wipeBtn", { type: "button", onclick: () => app.wipeAll() }, "Xoá tiến độ") : null))));
}

// ---------- bản đồ ----------
const DEFAULT_PINS = { "noi-thit-kho": [150, 120], "chien-ke": [420, 110], "tra-sua-van-phong": [740, 120], "mat-wifi": [170, 380], "dam-cuoi-toang": [480, 390], "nhan-dam-hoi": [790, 380], mini: [470, 250] };
export function map(app) {
  const G = app.G, p = G.profile, r = rankOf(p.rep);
  const cards = h("div.case-list");
  const pins = [];
  G.cat.forEach((e) => {
    const solved = p.solved[e.id], run = p.runs[e.id];
    const state = !e.c ? (e.status === "broken" ? "fix" : "soon") : !e.open ? "lock" : solved ? "done" : run && run.phase !== "intro" ? "wip" : "new";
    const label = { soon: "Sắp ra mắt", fix: "Đang sửa", lock: "Khoá", done: "Đã phá", wip: "Đang điều tra", new: "Mới" }[state];
    const can = state !== "soon" && state !== "lock" && state !== "fix";
    cards.append(h("button.case-card.st-" + state, { type: "button", data: { case: e.id }, disabled: !can, onclick: () => { sfx("map-select"); app.openCase(e.id); }, "aria-label": `Hồ sơ số ${e.no}: ${e.title}. ${label}` },
      h("span.case-tab", `Hồ sơ số ${e.no}`),
      h("b.case-title", e.title),
      e.tagline && can ? h("span.case-tagline", e.tagline) : null,
      h("span.case-meta",
        h("span.diff", { title: "Độ khó" }, "Độ khó ", Array.from({ length: 3 }, (_, i) => h("i" + (i < e.difficulty ? ".on" : "")))),
        state === "done" ? stars(solved.stars) : h("span.badge.b-" + state, state === "lock" ? icon("lock", 16) : null, label)),
      state === "done" ? h("span.mini-stamp", "ĐÃ PHÁ") : null));
    const at = mapPin(e.id); const pt = at ? [at[0] + at[2] / 2, at[1] + at[3] / 2] : DEFAULT_PINS[e.id] || [480, 270];
    pins.push({ e, pt, state, can });
  });
  // bản đồ (desktop: lớn bên trái; mobile: dải trên cùng)
  const W = narrow() ? innerWidth - 32 : innerWidth - 420, H = narrow() ? 220 : innerHeight - 52 - 120;
  const { k, crisp } = crispScale(SCENE_W, SCENE_H, W, H);
  const mapBox = h("div.map-box" + (crisp ? "" : ".smooth"), { style: { width: SCENE_W * k + "px", height: SCENE_H * k + "px" } },
    h("img.map-img", { src: hasFile("assets/scenes/hem-map.webp") ? "assets/scenes/hem-map.webp" : placeholderScene("hem-map", [], "map"), alt: "Bản đồ Hẻm 47", draggable: "false" }),
    pins.map(({ e, pt, state, can }) => h("button.map-pin.st-" + state, { type: "button", tabindex: "-1", disabled: !can, title: e.title, style: { left: pt[0] * k + "px", top: pt[1] * k + "px" }, onclick: () => app.openCase(e.id) }, icon(state === "lock" || state === "soon" ? "lock" : "pin", 16), h("span", e.no))));
  return h("section.map-screen",
    h("div.map-head",
      h("div.det-card", h("div.det-ava", portraitEl("me", "smug", "", 56, displayName(p))),
        h("div.det-info", h("small", r.name), h("b", displayName(p)),
          h("div.rep-bar", { title: r.next ? `Còn ${r.toNext} danh tiếng để lên ${r.next.name}` : "Hạng cao nhất" }, h("i", { style: { width: Math.round(r.pct * 100) + "%" } })),
          h("span.rep-txt", `${p.rep} danh tiếng` + (r.next ? ` · còn ${r.toNext} lên ${r.next.name}` : "")))),
      h("button.btn.btn--sm#renameBtn", { type: "button", onclick: () => app.show("title") }, "Đổi tên")),
    h("div.map-body", h("div.map-wrap", h("h2.sec", "Bản đồ Hẻm 47"), mapBox), h("div.case-col", h("h2.sec", "Hồ sơ vụ án"), cards)));
}

// ---------- văn phòng nhận hồ sơ ----------
export function office(app) {
  const { c, ui } = app.G, W = innerWidth, H = innerHeight - 52;
  const client = c.client && c.people[c.client] ? c.client : null;
  const posts = c.social?.posts || [];
  const accept = () => { ui.phone = false; ui.introHeard = false; app.G.screen = "scene"; app.act({ type: "intro" }); };
  const el = h("section.office-screen",
    h("div.office-bg", coverImg("assets/scenes/office.webp", placeholderScene("office-" + c.id, [[120, 300, 300, 120], [620, 120, 220, 160], [700, 330, 160, 150]]), W, H)),
    h("div.office-ui",
      h("div.folder",
        h("span.folder-tab", `Hồ sơ số ${c.no}`),
        h("h2", c.title),
        c.tagline ? h("p.tagline", c.tagline) : null,
        client ? h("div.client", portraitEl(client, "neutral", c.id, 72, app.name(client)), h("div", h("small", "Người nhờ"), h("b", app.name(client)), h("span", c.people[client].role || ""))) : null,
        h("div.actions",
          h("button.btn#replayIntro", { type: "button", onclick: () => app.dialog.play(c.intro) }, "Nghe kể lại"),
          posts.length ? h("button.btn#openPhone", { type: "button", onclick: () => { ui.phone = true; app.refresh(); } }, icon("phone", 16), "Bài đăng nhóm") : null,
          h("button.btn.btn--primary#acceptCase", { type: "button", onclick: accept }, "Nhận vụ")))),
    ui.phone && posts.length ? phone(app, posts, () => { ui.phone = false; app.refresh(); }, accept) : null);
  if (!ui.introHeard) {
    ui.introHeard = true;
    after.push(async () => {
      await app.dialog.play(c.intro);
      if (posts.length && app.G.screen === "office") {
        await app.dialog.play([["teo", "Sếp ơi, nhóm “" + (c.social.group || "Hẻm 47 Hóng Biến") + "” đang nổ bài về vụ này nè!", "smug"]]);
        sfx("zalo-ping"); ui.phone = true; app.refresh();
      }
    });
  }
  return el;
}
function phone(app, posts, onClose, onAccept) {
  const { c, ui } = app.G;
  ui.liked ??= {}; ui.myComments ??= {};
  const who = (by) => (c.people[by] || ["me", "teo", "batu", "chuba"].includes(by) ? app.name(by) : by);
  for (const p of posts) app.read(p.text);
  const list = h("div.phone-feed");
  posts.forEach((p, i) => {
    const liked = !!ui.liked[i];
    const comments = [...(p.comments || []), ...(ui.myComments[i] || [])];
    const inp = h("input.inp.inp--sm", { type: "text", maxlength: "80", placeholder: "Viết bình luận…", "aria-label": "Viết bình luận" });
    const send = () => { const t = inp.value.trim(); if (!t) return; (ui.myComments[i] ??= []).push({ by: "me", text: t }); sfx("like-pop"); app.refresh(); };
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); send(); } });
    list.append(h("article.post",
      h("header", c.people[p.by] || ["teo", "batu", "chuba"].includes(p.by) ? portraitEl(p.by, "neutral", c.id, 36, who(p.by), "ava") : h("span.ava-ph", who(p.by).charAt(0)), h("div", h("b", who(p.by)), h("small", (p.by === "batu" ? "Quản trị viên · " : "") + (p.time || "vừa xong")))),
      h("p.post-text", renderText(p.text, c.words)),
      h("div.post-acts",
        h("button.like" + (liked ? ".on" : ""), { type: "button", data: { like: String(i) }, "aria-pressed": liked ? "true" : "false", onclick: () => { ui.liked[i] = !liked; if (!liked) sfx("like-pop"); app.refresh(); } }, icon("heart", 16), ` ${(p.likes || 0) + (liked ? 1 : 0)}`),
        h("span.cmt-n", icon("chat", 16), ` ${comments.length} bình luận`)),
      h("ul.comments", comments.map((m) => h("li", h("b", who(m.by)), " ", renderText(m.text, c.words)))),
      h("form.cmt-form", { "data-nochatsfx": "", onsubmit: (e) => { e.preventDefault(); send(); } }, inp, h("button.btn.btn--sm", { type: "submit" }, "Gửi"))));
  });
  return h("div.phone-wrap", { role: "dialog", "aria-label": "Bài đăng nhóm " + (c.social?.group || "") },
    h("div.phone",
      h("div.phone-top", h("span", "9:41"), h("b", c.social?.group || "Hẻm 47 Hóng Biến"), h("span", "4G")),
      list,
      h("div.phone-foot", h("button.btn.btn--sm#closePhone", { type: "button", onclick: onClose }, "Đóng"), h("button.btn.btn--primary.btn--sm#acceptPhone", { type: "button", onclick: onAccept }, "Nhận vụ"))));
}

// ---------- hiện trường ----------
export function scene(app) {
  const { c, s, ui } = app.G;
  const L = c.locations[s.loc];
  const file = sceneFile(c.id, L.scene || s.loc);
  const all = L.hotspots || [];
  const vis = hotspotsAt(c, s);
  const rects = new Map(all.map((hs, i) => [hs.id, hotspotRect(file, hs, i, all.length)]));
  const real = hasFile(file);
  // cỡ cảnh: desktop vừa khung; điện thoại cao ~48% màn, cho kéo ngang
  const availW = narrow() ? innerWidth * 1.8 : innerWidth - 340 - 40, availH = narrow() ? Math.min(innerHeight * 0.48, 420) : innerHeight - 52 - 120;
  const { k, crisp } = crispScale(SCENE_W, SCENE_H, availW, availH);
  const W = SCENE_W * k, H = SCENE_H * k;
  const bg = real ? file : placeholderScene(c.id + "/" + s.loc, vis.map((hs) => rects.get(hs.id).r)); // chỉ vẽ đồ của điểm đang hiện (không lộ điểm ẩn)
  const stage = h("div.scene" + (crisp ? "" : ".smooth") + (ui.soi || !real ? ".soi" : ""), { style: { width: W + "px", height: H + "px" } },
    h("img.scene-img", { src: bg, alt: L.name, draggable: "false" }),
    // thứ tự lớp: điểm đã soi nằm dưới, điểm chưa soi nằm trên; cùng nhóm thì điểm nhỏ (chi tiết trong đồ vật lớn) nằm trên.
    // ⇒ đồ vật lớn bị chi tiết che gần kín vẫn bấm được sau khi đã soi các chi tiết.
    [...vis].sort((a, b) => (a.seen === b.seen ? area(rects.get(b.id).r) - area(rects.get(a.id).r) : a.seen ? -1 : 1)).map((hs) => {
      const [x, y, w, hh] = rects.get(hs.id).r;
      const inner = vis.some((o) => o.id !== hs.id && area(rects.get(o.id).r) > area([x, y, w, hh]) && overlap(rects.get(o.id).r, [x, y, w, hh]) > 0.4 * w * hh);
      const cx = (x + w / 2) * k, side = cx < 80 ? ".lbl-l" : cx > W - 80 ? ".lbl-r" : "";
      return h("button.hs" + (hs.seen ? ".seen" : "") + (inner ? ".lbl-top" : "") + side, { type: "button", data: { hs: hs.id }, title: hs.label, "aria-label": hs.label + (hs.seen ? " (đã soi)" : ""),
        style: { left: x * k + "px", top: y * k + "px", width: w * k + "px", height: hh * k + "px" }, onclick: () => app.act({ type: "examine", id: hs.id }) },
        h("span.hs-label", hs.seen ? icon("check", 16) : null, hs.label));
    }));
  const wrap = h("div.scene-wrap", { onscroll: (e) => { ui.sceneScroll = e.currentTarget.scrollLeft; } }, stage);
  after.push(() => { wrap.scrollLeft = ui.sceneScroll || 0; });
  const locs = locList(c, s);
  const locbar = h("nav.locbar", { "aria-label": "Địa điểm" }, locs.map((lid) => {
    const n = unseenAt(c, s, lid);
    return h("button.loc" + (lid === s.loc ? ".on" : ""), { type: "button", data: { loc: lid }, "aria-current": lid === s.loc ? "true" : null, onclick: () => { if (lid !== s.loc) { ui.sceneScroll = 0; app.act({ type: "go", loc: lid }); } } },
      h("span", c.locations[lid].name), n ? h("i.cnt", { title: `${n} chỗ chưa soi` }, n) : null);
  }));
  const found = s.clues.length, total = Object.keys(c.clues).length;
  const tools = h("div.scene-tools",
    h("button.btn.btn--sm#soiBtn" + (ui.soi ? ".is-on" : ""), { type: "button", "aria-pressed": ui.soi ? "true" : "false", title: "Hiện viền mọi điểm chưa soi", onclick: () => { ui.soi = !ui.soi; app.refresh(); } }, icon("eye", 16), ui.soi ? "Đang soi" : "Chế độ soi"),
    h("span.tip", narrow() ? "Chạm đồ vật để soi · kéo ngang để xem hết" : "Bấm vào đồ vật để soi"),
    h("span.prog", icon("book", 16), ` Vật chứng ${found}/${total}`));
  // người trong vụ
  // mọi người đã mở đều hỏi / đưa vật chứng được (cả người nhờ phá án), nghi phạm xếp trước
  const all2 = peopleList(c, s);
  const people = [...all2.filter((pid) => c.people[pid].suspect), ...all2.filter((pid) => !c.people[pid].suspect)];
  const side = h("aside.side",
    h("h2.sec", "Người trong vụ"),
    h("div.people", people.map((pid) => {
      const p = c.people[pid], n = newTopics(c, s, pid);
      return h("button.person", { type: "button", data: { person: pid }, onclick: () => app.openOverlay("talk", pid) },
        portraitEl(pid, ui.mood[pid] || "neutral", c.id, 56, p.name),
        h("span.pinfo", h("b", p.name), h("small", p.role || (p.suspect ? "Nghi phạm" : ""))),
        n ? h("i.cnt", { title: `${n} chủ đề mới` }, n) : null);
    })),
    h("div.side-cta",
      s.solved ? h("button.btn.btn--primary.btn--big#accuseBtn", { type: "button", onclick: () => accuse(app) }, "Vạch mặt thủ phạm")
        : h("button.btn#boardBtn2", { type: "button", onclick: () => app.openOverlay("board") }, icon("board", 16), `Bảng suy luận (${filledCount(c, s)})`)));
  return h("section.scene-screen", h("div.scene-main", locbar, wrap, tools), side);
}
const area = (r) => r[2] * r[3];
const overlap = (a, b) => Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]));
const filledCount = (c, s) => { let f = 0, t = 0; for (const d of c.deduction) for (const b of Object.keys(d.blanks)) { t++; if (s.board[d.id][b]) f++; } return `${f}/${t}`; };
export async function accuse(app) {
  app.closeAll();
  await app.stamp("VẠCH MẶT!", "red", app.name(app.G.c.finale.culprit), 800);
  app.G.screen = "finale";
  await app.act({ type: "accuse" });
}

// ---------- vạch mặt ----------
export function finale(app) {
  const { c, s, ui } = app.G, F = c.finale, cul = F.culprit;
  const st = F.steps[Math.min(s.fin.step, F.steps.length - 1)];
  const claim = [...(st?.claim || [])].map((l) => (Array.isArray(l) ? { who: l[0], text: l[1] } : l)).reverse().find((l) => l.who === cul) || (st?.claim?.[0] && (Array.isArray(st.claim[0]) ? { text: st.claim[0][1] } : st.claim[0]));
  const big = narrow() ? 150 : Math.min(320, innerHeight - 260);
  return h("section.finale-screen",
    h("div.finale-stage",
      h("div.finale-left", portraitEl(cul, ui.mood[cul] || "angry", c.id, big, app.name(cul), "big"), h("div.nameplate", app.name(cul), h("small", "Nghi phạm chính"))),
      h("div.finale-right",
        h("div.steps", { "aria-label": `Lời chối ${s.fin.step + 1} trên ${F.steps.length}` }, F.steps.map((_, i) => h("i" + (i < s.fin.step ? ".done" : i === s.fin.step ? ".cur" : "")))),
        h("small.lb", `Lời chối ${Math.min(s.fin.step + 1, F.steps.length)}/${F.steps.length}`),
        h("blockquote.claim", claim ? renderText(claim.text, c.words) : "…"),
        h("div.actions",
          h("button.btn.btn--primary.btn--big#rebutBtn", { type: "button", onclick: async () => {
            const clue = await pickEvidence(app, { title: "Đưa vật chứng phản bác", quote: claim?.text, by: cul, confirm: "Đưa ra" });
            if (!clue) return;
            await app.act({ type: "rebut", clue }, { before: async (r) => {
              const right = r.ev.some((e) => e.type === "stepRight");
              await app.stamp(right ? "BỂ!" : "TRẬT!", right ? "red" : "gray", right ? "" : "Mất 1 uy tín");
            } });
            if (app.G.s.phase === "done") app.show("result");
          } }, "Đưa vật chứng"),
          h("button.btn#replayClaim", { type: "button", onclick: () => app.dialog.play(st.claim) }, "Nghe lại")))));
}

// ---------- kết vụ ----------
export function result(app) {
  const { c, s, profile } = app.G;
  const res = s.result, rep = caseRep(c, s), pre = app.previewSolve();
  const old = profile.solved[c.id];
  const r0 = rankOf(profile.rep), r1 = rankOf(pre.p.rep);
  const comments = c.finale.comments || [];
  const wall = h("div.wall", comments.map((m, i) => h("div.cmt", { style: { animationDelay: 0.35 + i * 0.12 + "s" } },
    h("span.ava-ph", String(m.by).charAt(0)), h("div", h("b", m.by), h("p", renderText(m.text, c.words))), h("span.likes", icon("heart", 16), " ", m.likes ?? 0))));
  const bonus = (c.bonus || []).map((q) => {
    const ans = s.bonus[q.id];
    return h("div.bonus", h("p.q", q.q), h("div.choices", q.choices.map((ch, i) => h("button.btn.btn--sm.choice" + (ans == null ? "" : i === q.answer ? ".right" : i === ans ? ".wrongc" : ""), { type: "button", data: { bonus: q.id, choice: String(i) }, disabled: ans != null,
      onclick: async () => { const r = await app.act({ type: "bonus", id: q.id, choice: i }); if (!r.error) toast(i === q.answer ? `Đúng! +20 danh tiếng` : "Trật mất rồi.", i === q.answer ? "good" : "bad"); } }, ch))));
  });
  after.push(() => { if (!app.G.ui.solvedSfx) { app.G.ui.solvedSfx = true; sfx("case-solved", 0.15); if (r1.index > r0.index) sfx("rank-up", 1.1); } });
  return h("section.result-screen",
    h("div.result-grid",
      h("div.folder.result-folder",
        h("span.folder-tab", `Hồ sơ số ${c.no}`),
        h("h2", c.title),
        h("div.big-stamp", "ĐÃ PHÁ"),
        h("div.result-stars", Array.from({ length: 3 }, (_, i) => h("span.rs" + (i < res.stars ? ".on" : ""), { style: { animationDelay: 0.5 + i * 0.25 + "s" } }, icon(i < res.stars ? "star" : "starOff", 32)))),
        h("dl.stats",
          h("div", h("dt", "Uy tín mất"), h("dd", res.credLost)), h("div", h("dt", "Chốt sai"), h("dd", res.wrongBoard)),
          h("div", h("dt", "Gợi ý Tèo"), h("dd", res.hints)), res.rescues ? h("div", h("dt", "Tèo can"), h("dd", res.rescues)) : null),
        h("div.rep-box",
          h("b", `+${pre.gained} danh tiếng`), old ? h("small", ` (kỷ lục cũ ${old.rep}, lần này ${rep.total})`) : h("small", ` (gốc ${rep.base}` + (rep.bonus ? ` + câu hỏi phụ ${rep.bonus}` : "") + ")"),
          h("div.rep-bar", h("i", { style: { width: Math.round(r1.pct * 100) + "%" } })),
          h("span.rep-txt", r1.index > r0.index ? `LÊN HẠNG: ${r1.name}!` : `${r1.name} · ${pre.p.rep} danh tiếng`)),
        bonus.length ? h("div.bonus-box", h("h3.sec", "Câu hỏi phụ (+20 mỗi câu)"), bonus) : null,
        h("div.actions",
          h("button.btn.btn--primary.btn--big#backMap", { type: "button", onclick: () => app.leaveCase("map") }, "Về bản đồ"),
          h("button.btn#replayCase", { type: "button", onclick: () => app.replayCase() }, "Chơi lại vụ"))),
      h("div.phone.wall-phone", h("div.phone-top", h("span", "9:41"), h("b", c.social?.group || "Hẻm 47 Hóng Biến"), h("span", "4G")),
        h("div.viral", icon("heart", 16), " Bài phá án đang viral!"), wall)));
}
