// Các màn nền: mở game (đặt tên), bản đồ Hẻm 47, văn phòng nhận hồ sơ (+ bài đăng nhóm), hiện trường, vạch mặt, kết vụ.
import { h, icon, toast } from "./dom.js?v=t10";
import { crispScale, hasFile, sceneFile, placeholderScene, hotspotRect, portraitEl, mapPin, dpr, SCENE_W, SCENE_H } from "./art.js?v=t10";
import { renderText } from "./dialog.js?v=d12";
import { locList, hotspotsAt, peopleList, topicsOf, unseenAt, newTopics, boardFilled, stmtList } from "../core/engine.js?v=t10";
import { rankOf, displayName, cleanName, DEFAULT_NAME, caseRep, SEASONS, seasonOf } from "../core/progress.js?v=t10";
import { pickEvidence, clueCard } from "./panels.js?v=d12";
import { play as sfx } from "./sfx.js?v=t10";
import { shareResult } from "../../_shared/share.js?v=s3";

const after = [];
/** Việc chạy sau khi màn đã gắn vào DOM (đo kích thước, tự phát thoại…). */
export function afterRender(app) { const list = after.splice(0); for (const f of list) f(app); }
const narrow = () => innerWidth < 900;
/** Điện thoại xoay ngang (docs/mobile-landscape.md §1) — khớp media query trong index.html. */
const landShort = () => matchMedia("(orientation: landscape) and (max-height: 500px)").matches;
/** Chiều cao thanh trên thật (52 desktop, 48 điện thoại dọc, 44 xoay ngang). */
const barH = () => document.getElementById("bar")?.offsetHeight || 52;
const stars = (n, max = 3) => h("span.stars", { "aria-label": `${n} trên ${max} sao` }, Array.from({ length: max }, (_, i) => icon(i < n ? "star" : "starOff", 16)));

/** Ảnh nền phủ khung (cover) mà vẫn nét: hệ số bội 0,5 px thiết bị, căn giữa, cắt mép. */
// fx: điểm cần giữ trong khung theo chiều ngang (0 = mép trái ảnh, 1 = mép phải), mặc định giữa.
function coverImg(file, fallbackUrl, W, H, fw = SCENE_W, fh = SCENE_H, fx = 0.5) {
  const d = dpr(), m = Math.ceil(Math.max(W / fw, H / fh) * d * 2), k = m / 2 / d;
  const w = fw * k, hh = fh * k, left = Math.min(0, Math.max(W - w, W / 2 - fx * w));
  // ảnh thật chưa về: nền vẽ thay (canvas) nằm dưới <img> ⇒ không có khung đen trong lúc tải
  return h("img.cover-img", { src: hasFile(file) ? file : fallbackUrl, alt: "", draggable: "false", style: { width: w + "px", height: hh + "px", left: left + "px", top: (H - hh) / 2 + "px",
    ...(hasFile(file) && fallbackUrl ? { backgroundImage: `url("${fallbackUrl}")`, backgroundSize: "100% 100%" } : {}) } });
}
/** Máy tính: ảnh nền 960×540 chỉ vẽ gần cỡ gốc (≤ 1,5 px thiết bị mỗi px ảnh, bội 0,5) trong khung poster — không kéo tràn
 *  màn hình nữa (kéo 2–3× làm vỡ hạt). Khi Codex giao bản HD 1920×1080 (file *-hd.webp) thì dùng bản HD và được tràn màn hình. */
const HD = { "assets/title-art.webp": "assets/title-art-hd.webp", "assets/scenes/hem-map-2.webp": "assets/scenes/hem-map-2-hd.webp" };
function posterImg(file, fallbackUrl, W, H, x0 = 0, fx = 0.5) {
  const hd = HD[file];
  if (hd && hasFile(hd)) return hdCover(hd, W, H, fx);
  const d = dpr(), aw = W - x0 - 48, ah = H - 48;
  const m = Math.max(1, Math.min(3, Math.floor(Math.min(aw / SCENE_W, ah / SCENE_H) * d * 2))), k = m / 2 / d;
  const w = SCENE_W * k, hh = SCENE_H * k;
  return h("img.cover-img.poster-img", { src: hasFile(file) ? file : fallbackUrl, alt: "", draggable: "false",
    style: { width: w + "px", height: hh + "px", left: Math.round(x0 + (W - x0 - w) / 2) + "px", top: Math.round((H - hh) / 2) + "px" } });
}
/** Bản HD là tranh chi tiết (không phải lưới 2×): phủ vừa khít màn hình theo tỉ lệ thật, lọc mượt — không làm tròn lên bậc
 *  0,5 (1920 px mà làm tròn lên thành 1,5× là cắt mất nửa tranh và lại vỡ hạt). */
// PERF-03: tranh hiện ≤ 960 px thiết bị (điện thoại dpr ≤ 2, băng tựa 390 px…) thì bản 960 px (`base`) đã đủ nét như bản HD
// (cả hai đều bị thu nhỏ, lọc mượt) ⇒ không tải bản 1920 px (1,1 MB). Lớn hơn mới dùng bản HD.
const LO = Object.fromEntries(Object.entries(HD).map(([lo, hi]) => [hi, lo]));
function hdCover(file, W, H, fx = 0.5) {
  const k = Math.max(W / (SCENE_W * 2), H / (SCENE_H * 2)), w = Math.ceil(SCENE_W * 2 * k), hh = Math.ceil(SCENE_H * 2 * k);
  const left = Math.round(Math.min(0, Math.max(W - w, W / 2 - fx * w)));
  // TTH2-03: băng tựa điện thoại dọc (≤ 480 px CSS) cũng dùng bản 960 dù dpr 3 (1,1 MB ⇒ ~0,1 MB; tranh vẽ mịn, thu/phóng nhẹ không vỡ hạt)
  const lo = LO[file], src = lo && hasFile(lo) && (w * dpr() <= SCENE_W || w <= 480) ? lo : file;
  return h("img.cover-img.hd-img", { src, alt: "", draggable: "false", style: { width: w + "px", height: hh + "px", left: left + "px", top: Math.round((H - hh) / 2) + "px" } });
}
/** Điện thoại dọc: ảnh mở đầu thành băng ngang trên cùng (đủ chiều cao ảnh, sáng rõ, không phủ tối), chữ nằm dưới. */
const TITLE_FOCUS = 0.66; // Thám tử + Tèo nằm lệch phải ảnh title-art
function titleBanner(file, fallbackUrl, W) {
  const hd = HD[file];
  if (hd && hasFile(hd)) { const BH = Math.round(W * SCENE_H / SCENE_W); return h("div.title-bg.title-banner", { style: { height: BH + "px" } }, hdCover(hd, W, BH, TITLE_FOCUS)); }
  const d = dpr(), k = Math.ceil((W / SCENE_W) * d * 2) / 2 / d, BH = Math.round(SCENE_H * k);
  return h("div.title-bg.title-banner", { style: { height: BH + "px" } }, coverImg(file, fallbackUrl, W, BH, SCENE_W, SCENE_H, TITLE_FOCUS));
}

/** Xoay ngang: tranh phủ kín khung (bản HD nếu có, không thì bản lưới 2× phóng bội 0,5 cho nét). */
function landCover(file, fallbackUrl, W, H, fx) {
  const hd = HD[file];
  return hd && hasFile(hd) ? hdCover(hd, W, H, fx) : coverImg(file, fallbackUrl, W, H, SCENE_W, SCENE_H, fx);
}

// ---------- màn mở ----------
export function title(app) {
  const p = app.G.profile, W = innerWidth, H = innerHeight - barH();
  const hasRun = Object.keys(p.solved).length || Object.keys(p.runs).length || p.created;
  const r = rankOf(p.rep);
  const input = h("input.inp#detName", { type: "text", maxlength: "24", placeholder: DEFAULT_NAME, value: p.name, autocomplete: "off", "aria-label": "Tên thám tử" });
  const go = () => { app.setName(cleanName(input.value)); app.show("map"); };
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); go(); } });
  // D5: xoay ngang (màn thấp) không dùng băng ảnh trên cùng (568×320: băng cao trọn màn, thẻ tên bị đẩy xuống dưới) ⇒ ảnh phủ nền, chữ + thẻ tên cột trái
  const land = landShort(), banner = W < 720 && !land;
  return h("section.title-screen" + (banner ? ".title-screen--banner" : ""),
    banner ? titleBanner("assets/title-art.webp", placeholderScene("title", [], "title"), W)
      : land ? h("div.title-bg", landCover("assets/title-art.webp", placeholderScene("title", [], "title"), W, H, TITLE_FOCUS))
      : h("div.title-bg.title-poster", posterImg("assets/title-art.webp", placeholderScene("title", [], "title"), W, H, Math.min(520, W * 0.42), 0.6)),
    !land && (banner || !hasFile(HD["assets/title-art.webp"])) ? null : h("div.title-shade"),
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

// ---------- bản đồ (2 mùa: tab "Mùa 1 · Hẻm 47" / "Mùa 2 · Chợ Hẻm") ----------
const DEFAULT_PINS = {
  "noi-thit-kho": [150, 120], "chien-ke": [420, 110], "tra-sua-van-phong": [740, 120], "mat-wifi": [170, 380], "dam-cuoi-toang": [480, 390], "nhan-dam-hoi": [790, 380], mini: [470, 250],
  // mùa 2 trên bản đồ chợ vẽ thay (khớp drawMarket): sạp, sân khấu, nhà hoang số 13
  "ve-so": [150, 160], "karaoke": [484, 330], "meo-mat-tich": [810, 160], "tat-nien": [150, 330], "ma-nha-13": [866, 470], "tham-tu-gia": [484, 160],
};
export function map(app) {
  const G = app.G, p = G.profile, r = rankOf(p.rep);
  const season = app.season(), S0 = SEASONS.find((x) => x.no === season) || SEASONS[0];
  const cards = h("div.case-list");
  const pins = [];
  G.cat.filter((e) => seasonOf(e) === season).forEach((e) => {
    const solved = p.solved[e.id], run = p.runs[e.id];
    // "lazy": có file vụ nhưng chưa nạp (nạp khi bấm mở) ⇒ thẻ như vụ đã nạp
    const state = !e.c && e.status !== "lazy" ? (e.status === "broken" ? "fix" : e.status === "pending" || e.status === "loading" ? "lock" : "soon") : !e.open ? "lock" : solved ? "done" : run && run.phase !== "intro" ? "wip" : "new";
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
    const at = mapPin(e.id, S0.map); const pt = at ? [at[0] + at[2] / 2, at[1] + at[3] / 2] : DEFAULT_PINS[e.id] || [480, 270];
    pins.push({ e, pt, state, can });
  });
  // tab mùa (mùa khoá: tooltip + bấm thì báo cách mở)
  const tabs = h("div.season-tabs", { role: "tablist", "aria-label": "Chọn mùa" }, SEASONS.map((x) => {
    const open = app.seasonOpen(x.no), on = x.no === season;
    return h("button.season-tab" + (on ? ".on" : "") + (open ? "" : ".locked"), { type: "button", role: "tab", data: { season: String(x.no) }, "aria-selected": on ? "true" : "false", "aria-disabled": open ? null : "true",
      title: open ? x.tab : x.lockMsg, onclick: () => app.pickSeason(x.no) },
      open ? null : icon("lock", 16), h("span", x.tab));
  }));
  // bản đồ (desktop: lớn bên trái; mobile: dải trên cùng)
  // D5 xoay ngang: bản đồ cột trái dưới thẻ thám tử + tab mùa (cao còn lại), danh sách hồ sơ cột phải cuộn riêng
  const land = landShort();
  const W = land ? innerWidth * 0.5 - 24 : narrow() ? innerWidth - 32 : innerWidth - 420, H = land ? innerHeight - barH() - 132 : narrow() ? 220 : innerHeight - 52 - 170;
  const { k, crisp } = crispScale(SCENE_W, SCENE_H, W, H);
  const mapBox = h("div.map-box" + (crisp ? "" : ".smooth"), { style: { width: SCENE_W * k + "px", height: SCENE_H * k + "px" } },
    h("img.map-img", { src: hasFile(S0.map) ? S0.map : placeholderScene(season === 1 ? "hem-map" : "hem-map-" + season, [], season === 1 ? "map" : "map2"), alt: S0.title, draggable: "false" }),
    pins.map(({ e, pt, state, can }) => h("button.map-pin.st-" + state, { type: "button", tabindex: "-1", disabled: !can, title: e.title, style: { left: pt[0] * k + "px", top: pt[1] * k + "px" }, onclick: () => app.openCase(e.id) }, icon(state === "lock" || state === "soon" ? "lock" : "pin", 16), h("span", e.no))));
  return h("section.map-screen.season-" + season,
    h("div.map-head",
      h("div.det-card", h("div.det-ava", portraitEl("me", "smug", "", land ? 44 : 56, displayName(p))),
        h("div.det-info", h("small", r.name), h("b", displayName(p)),
          h("div.rep-bar", { title: r.next ? `Còn ${r.toNext} danh tiếng để lên ${r.next.name}` : "Hạng cao nhất" }, h("i", { style: { width: Math.round(r.pct * 100) + "%" } })),
          h("span.rep-txt", `${p.rep} danh tiếng` + (r.next ? ` · còn ${r.toNext} lên ${r.next.name}` : "")))),
      h("button.btn.btn--sm#renameBtn", { type: "button", onclick: () => app.show("title") }, "Đổi tên")),
    tabs,
    h("div.map-body", h("div.map-wrap", h("h2.sec", S0.title), mapBox), h("div.case-col", h("h2.sec", "Hồ sơ vụ án"), cards)));
}

// ---------- màn chuyển mùa 2 (lần đầu mở Chợ Hẻm): Tèo + bà Tư báo tin, bà Tư đăng bài nhóm ----------
export const SEASON2_INTRO = [
  ["teo", "Sếp ơi sếp! Hết vụ đám hỏi chưa kịp thở thì ngoài “Chợ Hẻm” lại có biến rồi!", "shock"],
  ["batu", "Thiệt đó cưng. Chợ đầu hẻm mấy bữa nay ồn ào dữ lắm: mất vé số, cúp điện, mèo mất tích… đủ thứ hết trơn.", "smug"],
  ["batu", "Để bà đăng bài lên nhóm, bà con biết văn phòng mình nhận vụ ngoài chợ luôn.", "happy"],
  ["me", "Được. Hẻm 47 xong rồi thì ra chợ. Tèo, lấy áo mưa với cây đèn pin.", "smug"],
];
export const SEASON2_POST = {
  by: "batu", group: "Hẻm 47 Hóng Biến", likes: 347,
  text: "📢 THÔNG BÁO: Văn phòng Thám Tử Hẻm phá xong 6 vụ trong hẻm rồi nha bà con! Giờ mở rộng ra CHỢ HẺM đầu đường. Ai mất đồ, bị oan, nghi có ma… nhắn văn phòng liền. Bà Tư bảo kê uy tín!",
  comments: [
    { by: "Ông Chín", text: "Có nhận tìm vé số hông bà Tư? Gấp lắm!!!" },
    { by: "Anh Tùng Karaoke", text: "Tối nay chung kết Giọng Ca Vàng, mời thám tử ghé coi nha 🎤" },
    { by: "Chị Na Shop", text: "Ai thấy bé Bơ nhà em không ạ 😭" },
  ],
};
export function seasonIntro(app, onDone) {
  const P0 = SEASON2_POST, W = innerWidth, H = innerHeight - 52;
  return h("section.season-intro",
    h("div.title-bg.title-poster", posterImg("assets/scenes/hem-map-2.webp", placeholderScene("hem-map-2", [], "map2"), W, H)),
    h("div.title-shade"),
    h("div.season-title", h("small", "Mùa 2"), h("b", "Chợ Hẻm 47"), h("span", "Hẻm 47 xong rồi, giờ ra chợ")),
    h("div.phone-wrap.season-phone", { role: "dialog", "aria-label": "Bài đăng nhóm " + P0.group },
      h("div.phone",
        h("div.phone-top", h("span", "9:41"), h("b", P0.group), h("span", "4G")),
        h("div.phone-feed",
          h("div.season-banner", h("small", "Mùa 2"), h("b", "Chợ Hẻm 47"), h("span", "6 vụ mới đang chờ")),
          h("article.post",
            h("header", portraitEl("batu", "happy", "", 36, "Bà Tư Hóng", "ava"), h("div", h("b", "Bà Tư Hóng"), h("small", "Quản trị viên · vừa xong"))),
            h("p.post-text", P0.text),
            h("div.post-acts", h("span", icon("heart", 16), ` ${P0.likes}`), h("span.cmt-n", icon("chat", 16), ` ${P0.comments.length} bình luận`)),
            h("ul.comments", P0.comments.map((m) => h("li", h("b", m.by), " ", m.text))))),
        h("div.phone-foot", h("span"), h("button.btn.btn--primary.btn--sm#season2Go", { type: "button", onclick: onDone }, "Ra Chợ Hẻm")))));
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
  // TTH-03: điện thoại xoay ngang (màn thấp) ⇒ 2 cột: cảnh chiếm trọn chiều cao bên trái (kéo ngang nếu hẹp), địa điểm + người bên phải
  const land = landShort(), barH = document.getElementById("bar")?.offsetHeight || 44;
  const availW = land || narrow() ? innerWidth * 1.8 : innerWidth - 340 - 40;
  const availH = land ? innerHeight - barH - 6 : narrow() ? Math.min(innerHeight * 0.48, 420) : innerHeight - 52 - 120;
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
  const big = landShort() ? Math.max(96, Math.min(160, innerHeight - barH() - 150)) : narrow() ? 150 : Math.min(320, innerHeight - 260);
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
/** Khoe kết quả phá án (ảnh 1080×1080 + bảng chia sẻ chung _shared/share.js). */
function shareCase(c, s, res, rank) {
  const total = Object.keys(c.clues || {}).length, found = (s.clues || []).length;
  return shareResult({
    game: "tham-tu-hem",
    title: `Phá án ${res.stars}★`,
    lines: [`Vụ ${c.no}: ${c.title}`, `Vật chứng: ${found}/${total}`, `Chốt sai: ${res.wrongBoard} lần · Gợi ý: ${res.hints}`, `Hạng: ${rank.name}`],
    tagline: res.stars >= 3 ? "Conan gọi bằng sư phụ." : res.stars === 2 ? "Suýt soát thôi, thám tử tập sự!" : "Thủ phạm còn đang cười đó nha.",
    theme: "wood",
  });
}
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
  const left = (c.bonus || []).filter((q) => s.bonus[q.id] == null).length;
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
          // TTH2-07 (D11): xoay ngang thấp, câu hỏi phụ nằm dưới hàng nút dính đáy ⇒ nút "Còn N câu hỏi phụ ↓" cuộn tới câu chưa trả lời (chỉ hiện ở màn ngang thấp, CSS)
          left ? h("button.btn.btn--sm#bonusJump", { type: "button", onclick: () => { const q = [...document.querySelectorAll(".bonus")].find((e) => !e.querySelector(".choice:disabled")); q?.scrollIntoView({ block: "nearest", behavior: "smooth" }); } },
            `${left} câu hỏi phụ ↓`) : null,
          h("button.btn.btn--primary.btn--big#backMap", { type: "button", onclick: () => app.leaveCase("map") }, "Về bản đồ"),
          h("button.btn#replayCase", { type: "button", onclick: () => app.replayCase() }, "Chơi lại vụ"),
          h("button.btn#shareBtn", { type: "button", onclick: () => shareCase(c, s, res, r1) }, icon("heart", 16), " Khoe", h("span.kq", " kết quả")))),
      h("div.phone.wall-phone", h("div.phone-top", h("span", "9:41"), h("b", c.social?.group || "Hẻm 47 Hóng Biến"), h("span", "4G")),
        h("div.viral", icon("heart", 16), " Bài phá án đang viral!"), wall)));
}
