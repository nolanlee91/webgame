// Luật một vụ án (thuần, không DOM). apply(c, s, action) là cửa DUY NHẤT đổi trạng thái vụ:
// chạy trên bản nháp, kiểm bất biến, lỗi (hành động không hợp lệ hoặc vỡ bất biến) thì trả nguyên state cũ + error.
// Kết quả: { s, show, ev, error }
//   show: hàng đợi hiển thị theo thứ tự — {t:"line",who,text,mood} | {t:"clue",id} | {t:"stmt",id} | {t:"loc",id} | {t:"person",id}
//         Giao diện phát lần lượt; mỗi mục HIỆN RA thì gửi {type:"read", text} để nhặt [[từ khoá]] (DESIGN §4: nhặt khi đọc tới).
//   ev:   sự kiện cho âm thanh / hiệu ứng — word, clue, stmt, break, wrong, rescue, boardWrong, boardSolved, stepRight, stepWrong, done, hint, bonus…
import { evalNeeds, wordsIn } from "./validate.js?v=t3";
import { norm, pickFrom } from "./text.js?v=t3";

export const RUN_VERSION = 1;
export const MAX_CRED = 5;
export const PHASES = ["intro", "play", "finale", "done"];
const SETS = ["visited", "locs", "people", "clues", "words", "stmts", "broke", "talk", "seen", "flags", "hints"];

/** Câu dự phòng (vụ thiếu dữ liệu thì vẫn chơi được). {p} = người đang bị hỏi. */
export const GENERIC = {
  present: [
    ["{p}", "Cái này đưa tui coi chi vậy?", "neutral"],
    ["{p}", "Ờ… đẹp đó. Rồi sao nữa?", "neutral"],
    ["{p}", "Tui không biết gì về món này hết trơn.", "nervous"],
  ],
  wrong: [
    [["{p}", "Cái đó thì liên quan gì tới lời tui nói?", "angry"]],
    [["{p}", "Thám tử soi kỹ lại giùm cái.", "smug"]],
    [["{p}", "Hả? Tui nghe không hiểu luôn á.", "neutral"]],
  ],
  rescue: [
    [["teo", "Khoan khoan! Sếp tui hơi mệt, cho xin năm phút uống ly trà đá nha!", "nervous"], ["narr", "Tèo kéo thám tử ra góc, quạt phành phạch. Uy tín hồi lại một chút."]],
    [["teo", "Mọi người bình tĩnh! Sếp đang… thử phản ứng thôi, chiêu tâm lý đó!", "smug"], ["narr", "Không ai tin, nhưng không khí dịu xuống. Uy tín hồi lại một chút."]],
  ],
  finaleHint: "Sếp đọc kỹ câu chối, rồi đưa đúng món nói ngược lại nó. Món nào sếp nhặt mà chưa xài tới?",
  hintNone: "Em hết ý rồi sếp… Sếp thử soi lại các chỗ chưa xem với hỏi các chủ đề mới coi.",
};

// ---------- tạo / tiện ích đọc ----------
export function createRun(c, seed = 1) {
  const s = {
    v: RUN_VERSION, id: c.id, phase: "intro", loc: null,
    visited: [], locs: [], people: [], clues: [], words: [], stmts: [], broke: [], talk: [], seen: [], flags: [], hints: [],
    cred: MAX_CRED, credLost: 0, rescues: 0, wrongBoard: 0, wrongPresent: 0, finaleWrong: 0,
    board: {}, solved: false, fin: { step: 0 }, bonus: {}, result: null,
    rng: seed >>> 0 || 1, pick: {},
  };
  for (const [lid, L] of Object.entries(c.locations)) if (L.start) s.locs.push(lid);
  for (const [pid, p] of Object.entries(c.people)) if (p.start !== false) s.people.push(pid);
  for (const d of c.deduction) { s.board[d.id] = {}; for (const b of Object.keys(d.blanks || {})) s.board[d.id][b] = null; }
  s.loc = s.locs[0] ?? Object.keys(c.locations)[0];
  syncUnlocks(c, s);
  return s;
}

const ATOM = { clue: "clues", word: "words", stmt: "stmts", broke: "broke", talk: "talk", seen: "seen", flag: "flags", loc: "locs" };
export const needsOk = (s, needs) => evalNeeds(needs, (a) => { const i = a.indexOf(":"); const k = ATOM[a.slice(0, i)]; return !!k && s[k].includes(a.slice(i + 1)); });

/** Địa điểm có `needs` thì tự mở khi đạt (bộ kiểm cũng hiểu như vậy). Trả danh sách vừa mở. */
function syncUnlocks(c, s) {
  const opened = [];
  for (let again = true; again;) {
    again = false;
    for (const [lid, L] of Object.entries(c.locations)) if (!s.locs.includes(lid) && L.needs && needsOk(s, L.needs)) { s.locs.push(lid); opened.push(lid); again = true; }
  }
  return opened;
}
export const locList = (c, s) => Object.keys(c.locations).filter((l) => s.locs.includes(l));
export function hotspotsAt(c, s, lid = s.loc) {
  const L = c.locations[lid];
  return (L?.hotspots || []).filter((h) => needsOk(s, h.needs)).map((h) => ({ ...h, seen: s.seen.includes(`${lid}.${h.id}`) }));
}
export const peopleList = (c, s) => Object.keys(c.people).filter((p) => s.people.includes(p));
export const talkable = (c, s) => peopleList(c, s).filter((p) => (c.talks[p] || []).length);
export function topicsOf(c, s, pid) {
  return (c.talks[pid] || []).filter((t) => needsOk(s, t.needs)).map((t) => ({ ...t, asked: s.talk.includes(`${pid}.${t.id}`) }));
}
export const stmtList = (c, s, pid = null) => s.stmts.filter((id) => c.stmts[id] && (!pid || c.stmts[id].by === pid));
export const boardFilled = (c, s) => c.deduction.every((d) => Object.keys(d.blanks || {}).every((b) => s.board[d.id]?.[b]));
export const wordsOfKind = (c, s, kind) => s.words.filter((w) => c.words[w]?.kind === kind);
/** Còn chủ đề mới / điểm soi chưa xem? (cho chấm đỏ trên giao diện) */
export const newTopics = (c, s, pid) => topicsOf(c, s, pid).filter((t) => !t.asked).length;
export const unseenAt = (c, s, lid) => hotspotsAt(c, s, lid).filter((h) => !h.seen).length;

/** Gợi ý Tèo: gợi ý đầu tiên có điều kiện đạt và chưa "xong" (trường tuỳ chọn `done`), ưu tiên câu chưa nói. */
const atoms = (n, out = []) => { if (n == null) return out; if (typeof n === "string") out.push(n); else if (Array.isArray(n)) n.forEach((x) => atoms(x, out)); else (n.any || n.all || []).forEach((x) => atoms(x, out)); return out; };
/** Gợi ý coi như xong (suy ra): mọi lời khai "stmt:x" trong điều kiện đều là lời khai bể được và đã bể. */
export function hintAutoDone(c, s, h) {
  const ids = atoms(h.needs).filter((a) => a.startsWith("stmt:")).map((a) => a.slice(5));
  return ids.length > 0 && ids.every((id) => c.stmts[id]?.break && s.broke.includes(id));
}
export function hintCandidates(c, s) {
  return c.hints.map((h, i) => ({ ...h, i })).filter((h) => needsOk(s, h.needs) && !(h.done && needsOk(s, h.done)) && !hintAutoDone(c, s, h));
}
export function nextHint(c, s) {
  if (s.phase === "finale") { const st = c.finale.steps[s.fin.step]; return { i: `f${s.fin.step}`, text: st?.hint || GENERIC.finaleHint }; }
  const cand = hintCandidates(c, s);
  return cand.find((h) => !s.hints.includes(h.i)) || cand[0] || { i: null, text: GENERIC.hintNone };
}

/** Điểm phạt ⇒ sao: phạt = uy tín mất + chốt sai + gợi ý (mỗi gợi ý MỚI) + 2·lần Tèo can. ≤2 ⇒ 3★, ≤5 ⇒ 2★, còn lại 1★. Tèo can thì tối đa 2★. */
export function scoreOf(s) {
  const penalty = s.credLost + s.wrongBoard + s.hints.length + 2 * s.rescues;
  let stars = penalty <= 2 ? 3 : penalty <= 5 ? 2 : 1;
  if (s.rescues > 0) stars = Math.min(stars, 2);
  return { stars, penalty, credLost: s.credLost, wrongBoard: s.wrongBoard, hints: s.hints.length, rescues: s.rescues };
}

// ---------- bất biến ----------
export function invariants(c, s) {
  const bad = [];
  if (!PHASES.includes(s.phase)) bad.push("phase lạ " + s.phase);
  if (!(Number.isInteger(s.cred) && s.cred >= 1 && s.cred <= MAX_CRED)) bad.push("uy tín ngoài 1–5: " + s.cred);
  for (const k of SETS) if (!Array.isArray(s[k]) || new Set(s[k]).size !== s[k].length) bad.push(k + " phải là mảng không trùng");
  const has = { locs: (x) => c.locations[x], people: (x) => c.people[x], clues: (x) => c.clues[x], words: (x) => c.words[x], stmts: (x) => c.stmts[x], broke: (x) => c.stmts[x]?.break && s.stmts.includes(x), visited: (x) => s.locs.includes(x) };
  for (const [k, f] of Object.entries(has)) for (const x of s[k] || []) if (!f(x)) bad.push(`${k}: "${x}" không hợp lệ`);
  if (s.loc != null && !c.locations[s.loc]) bad.push("loc lạ " + s.loc);
  if (s.phase !== "intro" && !s.locs.includes(s.loc)) bad.push("đang ở địa điểm chưa mở " + s.loc);
  if (!(s.fin.step >= 0 && s.fin.step <= c.finale.steps.length)) bad.push("bước vạch mặt lạ");
  if ((s.phase === "finale" || s.phase === "done") && !s.solved) bad.push("vào vạch mặt khi chưa chốt bảng");
  if (s.phase === "done" && (s.fin.step !== c.finale.steps.length || !s.result)) bad.push("kết vụ khi chưa xong vạch mặt");
  for (const d of c.deduction) for (const [b, spec] of Object.entries(d.blanks || {})) {
    const w = s.board[d.id]?.[b];
    if (w != null && (!s.words.includes(w) || c.words[w]?.kind !== spec.kind)) bad.push(`ô ${d.id}.${b} chứa từ khoá không hợp lệ`);
  }
  for (const k of ["credLost", "rescues", "wrongBoard", "wrongPresent", "finaleWrong"]) if (!(Number.isInteger(s[k]) && s[k] >= 0)) bad.push(k + " phải là số nguyên ≥ 0");
  return bad;
}

// ---------- apply ----------
class Refuse extends Error {}
const refuse = (m) => { throw new Refuse(m); };
const clone = (s) => JSON.parse(JSON.stringify(s));

export function apply(c, s0, a) {
  const s = clone(s0), show = [], ev = [];
  const say = (lines, p = null) => {
    for (const raw of lines || []) { const l = norm(raw); if (p && l.who === "{p}") l.who = p; show.push({ t: "line", ...l }); }
  };
  const add = (k, x) => { if (s[k].includes(x)) return false; s[k].push(x); return true; };
  const give = (g) => {
    if (!g) return;
    for (const x of g.clues || []) if (c.clues[x] && add("clues", x)) { show.push({ t: "clue", id: x }); ev.push({ type: "clue", id: x }); say(c.clues[x].detail); }
    for (const x of g.words || []) if (c.words[x] && add("words", x)) ev.push({ type: "word", id: x });
    for (const x of g.stmts || []) if (c.stmts[x] && add("stmts", x)) { show.push({ t: "stmt", id: x }); ev.push({ type: "stmt", id: x }); }
    for (const x of g.flags || []) add("flags", x);
    for (const x of g.locs || []) if (c.locations[x] && add("locs", x)) { show.push({ t: "loc", id: x }); ev.push({ type: "loc", id: x }); }
    for (const x of g.people || []) if (c.people[x] && add("people", x)) { show.push({ t: "person", id: x }); ev.push({ type: "person", id: x }); }
  };
  const loseCred = () => {
    s.credLost++; s.cred--;
    ev.push({ type: "cred", cred: s.cred });
    if (s.cred <= 0) {
      s.rescues++; s.cred = 1;
      say(pickFrom(s, "rescue", c.teoRescue?.length ? c.teoRescue : GENERIC.rescue));
      ev.push({ type: "rescue" });
    }
  };
  const phase = (...ok) => { if (!ok.includes(s.phase)) refuse(`không làm được lúc này (${s.phase})`); };
  const goTo = (lid) => {
    s.loc = lid;
    if (add("visited", lid)) say(c.locations[lid].intro);
  };
  try {
    switch (a?.type) {
      case "read": {
        const texts = a.texts || [a.text];
        for (const t of texts) for (const w of wordsIn(t)) if (c.words[w] && add("words", w)) ev.push({ type: "word", id: w });
        break;
      }
      case "intro": {
        phase("intro");
        s.phase = "play";
        goTo(s.locs.includes(s.loc) ? s.loc : s.locs[0]);
        break;
      }
      case "go": {
        phase("play");
        if (!s.locs.includes(a.loc)) refuse("địa điểm chưa mở");
        goTo(a.loc);
        break;
      }
      case "examine": {
        phase("play");
        const h = (c.locations[s.loc]?.hotspots || []).find((x) => x.id === a.id);
        if (!h || !needsOk(s, h.needs)) refuse("không có điểm soi này");
        const key = `${s.loc}.${h.id}`;
        if (add("seen", key)) { say(h.lines); give(h.gives); ev.push({ type: "seen", id: key }); }
        else say(h.again?.length ? h.again : h.lines);
        break;
      }
      case "ask": {
        phase("play");
        if (!s.people.includes(a.pid)) refuse("người này chưa xuất hiện");
        const t = (c.talks[a.pid] || []).find((x) => x.id === a.topic);
        if (!t || !needsOk(s, t.needs)) refuse("chưa hỏi được chủ đề này");
        if (add("talk", `${a.pid}.${t.id}`)) { say(t.lines); give(t.gives); ev.push({ type: "talk", id: `${a.pid}.${t.id}` }); }
        else say(t.lines);
        break;
      }
      case "contradict": {
        phase("play");
        const st = c.stmts[a.stmt];
        if (!st || !s.stmts.includes(a.stmt)) refuse("chưa có lời khai này");
        if (s.broke.includes(a.stmt)) refuse("lời khai này đã bể");
        if (!s.clues.includes(a.clue)) refuse("chưa có vật chứng này");
        if (st.break && (st.break.clue === a.clue || (st.break.also || []).includes(a.clue))) {
          add("broke", a.stmt);
          ev.push({ type: "break", stmt: a.stmt, by: st.by });
          say(st.break.lines); give(st.break.gives);
        } else {
          s.wrongPresent++;
          ev.push({ type: "wrong", stmt: a.stmt, by: st.by });
          say(pickFrom(s, "wrong:" + st.by, c.wrong?.[st.by]?.length ? c.wrong[st.by] : GENERIC.wrong), st.by);
          loseCred();
        }
        break;
      }
      case "present": {
        phase("play");
        if (!s.people.includes(a.pid)) refuse("người này chưa xuất hiện");
        if (!s.clues.includes(a.clue)) refuse("chưa có vật chứng này");
        const own = c.present?.[a.pid]?.[a.clue];
        if (own) say(own); else say([pickFrom(s, "present:" + a.pid, GENERIC.present)], a.pid);
        ev.push({ type: "present", pid: a.pid, clue: a.clue, special: !!own });
        break;
      }
      case "fill": {
        phase("play");
        if (s.solved) refuse("bảng đã chốt");
        const d = c.deduction.find((x) => x.id === a.ded), spec = d?.blanks?.[a.blank];
        if (!spec) refuse("không có chỗ trống này");
        if (a.word != null && (!s.words.includes(a.word) || c.words[a.word].kind !== spec.kind)) refuse("từ khoá không hợp chỗ này");
        // một từ khoá chỉ nằm một chỗ trong cùng câu
        if (a.word != null) for (const b of Object.keys(d.blanks)) if (b !== a.blank && s.board[d.id][b] === a.word) s.board[d.id][b] = null;
        s.board[d.id][a.blank] = a.word ?? null;
        ev.push({ type: "fill" });
        break;
      }
      case "commit": {
        phase("play");
        if (s.solved) refuse("bảng đã chốt");
        if (!boardFilled(c, s)) refuse("còn chỗ trống chưa điền");
        let wrong = 0;
        for (const d of c.deduction) for (const [b, spec] of Object.entries(d.blanks)) if (s.board[d.id][b] !== spec.answer) wrong++;
        if (wrong) { s.wrongBoard++; ev.push({ type: "boardWrong", n: wrong }); }
        else { s.solved = true; ev.push({ type: "boardSolved" }); for (const d of c.deduction) say(d.explain); }
        break;
      }
      case "accuse": {
        phase("play");
        if (!s.solved) refuse("chưa chốt bảng suy luận");
        s.phase = "finale"; s.fin.step = 0;
        say(c.finale.intro); say(c.finale.steps[0]?.claim);
        ev.push({ type: "finale" });
        break;
      }
      case "rebut": {
        phase("finale");
        if (!s.clues.includes(a.clue)) refuse("chưa có vật chứng này");
        const st = c.finale.steps[s.fin.step];
        if (a.clue === st.answer) {
          say(st.right); s.fin.step++;
          ev.push({ type: "stepRight", step: s.fin.step });
          if (s.fin.step >= c.finale.steps.length) {
            s.phase = "done"; s.result = scoreOf(s);
            say(c.finale.confess); say(c.finale.epilogue);
            ev.push({ type: "done", stars: s.result.stars });
          } else say(c.finale.steps[s.fin.step].claim);
        } else {
          s.finaleWrong++;
          say(st.wrong?.length ? st.wrong : pickFrom(s, "wrong:" + c.finale.culprit, c.wrong?.[c.finale.culprit] || GENERIC.wrong), c.finale.culprit);
          ev.push({ type: "stepWrong" });
          loseCred();
          say(st.claim); // nhắc lại câu chối
        }
        break;
      }
      case "hint": {
        phase("play", "finale");
        const h = nextHint(c, s);
        if (h.i != null) add("hints", h.i);
        say([["teo", h.text, "smug"]]);
        ev.push({ type: "hint", i: h.i });
        break;
      }
      case "bonus": {
        phase("done");
        const q = (c.bonus || []).find((x) => x.id === a.id);
        if (!q) refuse("không có câu hỏi phụ này");
        if (s.bonus[a.id] != null) refuse("đã trả lời");
        if (!(Number.isInteger(a.choice) && a.choice >= 0 && a.choice < q.choices.length)) refuse("lựa chọn lạ");
        s.bonus[a.id] = a.choice;
        const ok = a.choice === q.answer;
        ev.push({ type: "bonus", id: a.id, ok });
        if (q.explain) say([["me", q.explain, ok ? "happy" : "neutral"]]);
        break;
      }
      default: refuse("hành động lạ: " + a?.type);
    }
    for (const lid of syncUnlocks(c, s)) { show.push({ t: "loc", id: lid }); ev.push({ type: "loc", id: lid }); }
    const bad = invariants(c, s);
    if (bad.length) throw new Error("vỡ bất biến: " + bad.join("; "));
    return { s, show, ev, error: null };
  } catch (e) {
    return { s: s0, show: [], ev: [{ type: "error", msg: e.message }], error: e.message };
  }
}

/** Chữ cần "đọc" khi một mục hàng đợi hiện ra (giao diện + bot dùng chung). */
export function textOf(c, item) {
  if (item.t === "line") return item.text;
  if (item.t === "clue") return c.clues[item.id]?.desc || "";
  if (item.t === "stmt") return c.stmts[item.id]?.text || "";
  return "";
}

/** Đọc bản lưu tiến độ một vụ: bỏ id không còn trong file vụ (người viết có thể sửa vụ), kẹp số. Hỏng ⇒ null. */
export function sanitizeRun(c, raw) {
  if (!raw || typeof raw !== "object" || raw.id !== c.id) return null;
  try {
    const s = createRun(c, raw.rng);
    for (const k of SETS) if (Array.isArray(raw[k])) s[k] = [...new Set(raw[k].filter((x) => typeof x === "string" || typeof x === "number"))];
    const keep = { locs: (x) => c.locations[x], people: (x) => c.people[x], clues: (x) => c.clues[x], words: (x) => c.words[x], stmts: (x) => c.stmts[x] };
    for (const [k, f] of Object.entries(keep)) s[k] = s[k].filter(f);
    s.broke = s.broke.filter((x) => c.stmts[x]?.break && s.stmts.includes(x));
    s.visited = s.visited.filter((x) => s.locs.includes(x));
    for (const lid of Object.keys(c.locations)) if (c.locations[lid].start && !s.locs.includes(lid)) s.locs.push(lid);
    const int = (v, lo, hi, d) => (Number.isInteger(v) ? Math.min(hi, Math.max(lo, v)) : d);
    s.cred = int(raw.cred, 1, MAX_CRED, MAX_CRED);
    for (const k of ["credLost", "rescues", "wrongBoard", "wrongPresent", "finaleWrong"]) s[k] = int(raw[k], 0, 9999, 0);
    s.phase = PHASES.includes(raw.phase) ? raw.phase : "intro";
    s.loc = c.locations[raw.loc] && s.locs.includes(raw.loc) ? raw.loc : s.locs[0];
    for (const d of c.deduction) for (const [b, spec] of Object.entries(d.blanks || {})) {
      const w = raw.board?.[d.id]?.[b];
      s.board[d.id][b] = w && s.words.includes(w) && c.words[w]?.kind === spec.kind ? w : null;
    }
    s.solved = !!raw.solved && boardFilled(c, s);
    s.fin.step = int(raw.fin?.step, 0, c.finale.steps.length, 0);
    if (raw.bonus && typeof raw.bonus === "object") for (const q of c.bonus || []) if (Number.isInteger(raw.bonus[q.id])) s.bonus[q.id] = raw.bonus[q.id];
    if (raw.pick && typeof raw.pick === "object") s.pick = { ...raw.pick };
    if (!s.solved && (s.phase === "finale" || s.phase === "done")) { s.phase = "play"; s.fin.step = 0; }
    if (s.phase === "done") { if (s.fin.step !== c.finale.steps.length) { s.phase = "finale"; } else s.result = scoreOf(s); }
    if (s.phase === "finale" && s.fin.step >= c.finale.steps.length) s.fin.step = 0;
    syncUnlocks(c, s);
    return invariants(c, s).length ? null : s;
  } catch { return null; }
}
