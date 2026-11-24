// Bộ kiểm dữ liệu vụ án (thuần, không DOM). Dùng ở test, tools/check-case.mjs và (tuỳ chọn) lúc nạp vụ.
// Kiểm 3 thứ: tham chiếu đúng, đi được tới cuối (mô phỏng người chơi vét hết), đủ lượng nội dung (DESIGN.md §4).

export const CAST = ["me", "teo", "batu", "chuba", "narr"];
export const KINDS = ["ai", "luc", "o", "vat", "cach", "vi", "khac"];
export const MOODS = ["neutral", "nervous", "angry", "shock", "happy", "smug"];

export const MIN = {
  0: { suspects: 2, locations: 1, hotspots: 2, clues: 2, breaks: 1, deductions: 1, blanks: 1, steps: 1, wrong: 1, comments: 1, hints: 1, topics: 1 }, // chỉ cho fixture test
  1: { suspects: 3, locations: 3, hotspots: 5, clues: 8, breaks: 2, deductions: 2, blanks: 4, steps: 3, wrong: 3, comments: 12, hints: 5, topics: 3 },
  2: { suspects: 4, locations: 3, hotspots: 5, clues: 10, breaks: 3, deductions: 3, blanks: 6, steps: 3, wrong: 3, comments: 12, hints: 6, topics: 3 },
  3: { suspects: 5, locations: 3, hotspots: 5, clues: 12, breaks: 4, deductions: 4, blanks: 8, steps: 4, wrong: 3, comments: 15, hints: 7, topics: 3 },
};

const WORD_RE = /\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;
export const wordsIn = (text) => [...String(text ?? "").matchAll(WORD_RE)].map((m) => m[1]);
export const lineOf = (l) => (Array.isArray(l) ? { who: l[0], text: l[1], mood: l[2] } : l || {});

/** Duyệt một điều kiện `needs` với hàm kiểm từng nguyên tử. */
export function evalNeeds(needs, atom) {
  if (needs == null) return true;
  if (typeof needs === "string") return atom(needs);
  if (Array.isArray(needs)) return needs.every((n) => evalNeeds(n, atom));
  if (needs.any) return needs.any.some((n) => evalNeeds(n, atom));
  if (needs.all) return needs.all.every((n) => evalNeeds(n, atom));
  return false;
}
const atomsOf = (needs, out = []) => {
  if (needs == null) return out;
  if (typeof needs === "string") out.push(needs);
  else if (Array.isArray(needs)) needs.forEach((n) => atomsOf(n, out));
  else (needs.any || needs.all || []).forEach((n) => atomsOf(n, out));
  return out;
};

export function validateCase(c) {
  const errors = [], warns = [];
  const err = (m) => errors.push(m), warn = (m) => warns.push(m);
  if (!c || typeof c !== "object") return { errors: ["không phải object vụ án"], warns, stats: {} };
  for (const k of ["id", "title", "intro", "people", "locations", "clues", "words", "talks", "stmts", "deduction", "finale", "hints"]) if (c[k] == null) err(`thiếu trường "${k}"`);
  if (errors.length) return { errors, warns, stats: {} };
  const diff = MIN[c.difficulty] ? c.difficulty : (err(`difficulty phải là 1, 2 hoặc 3`), 1);
  const people = c.people, clues = c.clues, words = c.words, stmts = c.stmts, locs = c.locations;
  const who = new Set([...CAST, ...Object.keys(people)]);
  const hotIds = new Set();
  for (const [lid, L] of Object.entries(locs)) for (const h of L.hotspots || []) {
    const key = `${lid}.${h.id}`;
    if (hotIds.has(key)) err(`điểm soi trùng id: ${key}`);
    hotIds.add(key);
  }
  const topicIds = new Set();
  for (const [pid, list] of Object.entries(c.talks)) {
    if (!people[pid]) err(`talks.${pid}: không có trong people`);
    for (const t of list || []) { if (topicIds.has(`${pid}.${t.id}`)) err(`chủ đề trùng: ${pid}.${t.id}`); topicIds.add(`${pid}.${t.id}`); }
  }
  const flagsGiven = new Set();
  const allGives = [];

  // ---- tham chiếu
  const checkText = (where, text) => { for (const w of wordsIn(text)) if (!words[w]) err(`${where}: từ khoá [[${w}]] không có trong words`); };
  const checkLines = (where, lines) => {
    if (lines == null) return;
    if (!Array.isArray(lines)) return err(`${where}: lời thoại phải là mảng`);
    lines.forEach((raw, i) => {
      const l = lineOf(raw);
      if (!who.has(l.who)) err(`${where}[${i}]: who="${l.who}" không phải cast/người trong vụ`);
      if (typeof l.text !== "string" || !l.text.trim()) err(`${where}[${i}]: thiếu câu thoại`);
      if (l.mood && !MOODS.includes(l.mood)) err(`${where}[${i}]: mood "${l.mood}" lạ`);
      checkText(`${where}[${i}]`, l.text);
    });
  };
  const checkGives = (where, g) => {
    if (!g) return;
    allGives.push(g);
    for (const x of g.clues || []) if (!clues[x]) err(`${where}.gives: vật chứng "${x}" không có`);
    for (const x of g.words || []) if (!words[x]) err(`${where}.gives: từ khoá "${x}" không có`);
    for (const x of g.stmts || []) if (!stmts[x]) err(`${where}.gives: lời khai "${x}" không có`);
    for (const x of g.locs || []) if (!locs[x]) err(`${where}.gives: địa điểm "${x}" không có`);
    for (const x of g.people || []) if (!people[x]) err(`${where}.gives: người "${x}" không có`);
    for (const x of g.flags || []) flagsGiven.add(x);
  };
  const neededFlags = [];
  const checkNeeds = (where, needs) => {
    for (const a of atomsOf(needs)) {
      const [kind, ...rest] = a.split(":"); const v = rest.join(":");
      const ok = { clue: () => clues[v], word: () => words[v], stmt: () => stmts[v], broke: () => stmts[v]?.break, talk: () => topicIds.has(v), seen: () => hotIds.has(v), loc: () => locs[v], flag: () => (neededFlags.push([where, v]), true) }[kind];
      if (!ok) err(`${where}.needs: điều kiện lạ "${a}"`);
      else if (!ok()) err(`${where}.needs: "${a}" trỏ tới thứ không tồn tại`);
    }
  };

  checkLines("intro", c.intro);
  if (c.client && !who.has(c.client)) err(`client "${c.client}" không có trong people`);
  for (const [pid, p] of Object.entries(people)) {
    if (!p.name) err(`people.${pid}: thiếu name`);
    checkText(`people.${pid}.bio`, p.bio);
  }
  for (const [lid, L] of Object.entries(locs)) {
    if (!L.name) err(`locations.${lid}: thiếu name`);
    checkNeeds(`locations.${lid}`, L.needs);
    checkLines(`locations.${lid}.intro`, L.intro);
    for (const h of L.hotspots || []) {
      const w = `locations.${lid}.${h.id}`;
      if (!h.label) err(`${w}: thiếu label`);
      if (h.rect && (h.rect.length !== 4 || h.rect.some((n) => typeof n !== "number") || h.rect[0] + h.rect[2] > 960 || h.rect[1] + h.rect[3] > 540)) err(`${w}: rect phải là [x,y,w,h] trong 960×540`);
      checkNeeds(w, h.needs); checkLines(`${w}.lines`, h.lines); checkLines(`${w}.again`, h.again); checkGives(w, h.gives);
    }
  }
  for (const [cid, k] of Object.entries(clues)) { if (!k.name) err(`clues.${cid}: thiếu name`); checkText(`clues.${cid}.desc`, k.desc); checkLines(`clues.${cid}.detail`, k.detail); }
  for (const [wid, w] of Object.entries(words)) { if (!w.text) err(`words.${wid}: thiếu text`); if (!KINDS.includes(w.kind)) err(`words.${wid}: kind "${w.kind}" phải thuộc ${KINDS.join("/")}`); }
  for (const [pid, list] of Object.entries(c.talks)) for (const t of list || []) {
    const w = `talks.${pid}.${t.id}`;
    if (!t.topic) err(`${w}: thiếu topic`);
    checkNeeds(w, t.needs); checkLines(`${w}.lines`, t.lines); checkGives(w, t.gives);
  }
  for (const [sid, s] of Object.entries(stmts)) {
    if (!people[s.by]) err(`stmts.${sid}: by "${s.by}" không có`);
    checkText(`stmts.${sid}`, s.text);
    if (s.break) {
      if (!clues[s.break.clue]) err(`stmts.${sid}.break: vật chứng "${s.break.clue}" không có`);
      checkLines(`stmts.${sid}.break.lines`, s.break.lines); checkGives(`stmts.${sid}.break`, s.break.gives);
    }
  }
  for (const [pid, m] of Object.entries(c.present || {})) for (const [cid, lines] of Object.entries(m)) {
    if (!people[pid]) err(`present.${pid}: người không có`);
    if (!clues[cid]) err(`present.${pid}.${cid}: vật chứng không có`);
    checkLines(`present.${pid}.${cid}`, lines);
  }
  for (const [pid, pool] of Object.entries(c.wrong || {})) (pool || []).forEach((lines, i) => checkLines(`wrong.${pid}[${i}]`, lines));
  let blankCount = 0;
  for (const d of c.deduction) {
    const ph = [...String(d.text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
    for (const b of ph) if (!d.blanks?.[b]) err(`deduction.${d.id}: chỗ trống {${b}} chưa khai trong blanks`);
    for (const [b, spec] of Object.entries(d.blanks || {})) {
      blankCount++;
      if (!ph.includes(b)) err(`deduction.${d.id}: blanks.${b} không có {${b}} trong câu`);
      if (!words[spec.answer]) err(`deduction.${d.id}.${b}: đáp án "${spec.answer}" không có trong words`);
      else if (words[spec.answer].kind !== spec.kind) err(`deduction.${d.id}.${b}: đáp án kind ${words[spec.answer].kind} ≠ ${spec.kind}`);
      const pool = Object.values(words).filter((w) => w.kind === spec.kind).length;
      if (pool < 3) warn(`deduction.${d.id}.${b}: chỉ có ${pool} từ khoá loại "${spec.kind}", nên ≥ 3 để có lựa chọn nhiễu`);
    }
    checkLines(`deduction.${d.id}.explain`, d.explain);
  }
  const F = c.finale;
  if (!people[F.culprit]) err(`finale.culprit "${F.culprit}" không có`);
  else if (!people[F.culprit].suspect) err(`finale.culprit phải là nghi phạm (suspect:true)`);
  checkLines("finale.intro", F.intro); checkLines("finale.confess", F.confess); checkLines("finale.epilogue", F.epilogue);
  (F.steps || []).forEach((s, i) => { if (!clues[s.answer]) err(`finale.steps[${i}]: vật chứng "${s.answer}" không có`); checkLines(`finale.steps[${i}].claim`, s.claim); checkLines(`finale.steps[${i}].right`, s.right); checkLines(`finale.steps[${i}].wrong`, s.wrong); });
  (F.comments || []).forEach((m, i) => { if (!m.by || !m.text) err(`finale.comments[${i}]: cần by + text`); });
  c.hints.forEach((h, i) => { checkNeeds(`hints[${i}]`, h.needs); checkNeeds(`hints[${i}].done`, h.done); if (!h.text) err(`hints[${i}]: thiếu text`); });
  // trường tuỳ chọn cho engine: finale.steps[].hint (gợi ý Tèo lúc vạch mặt), teoRescue (các bộ thoại Tèo can khi hết uy tín)
  (F.steps || []).forEach((s, i) => { if (s.hint != null && (typeof s.hint !== "string" || !s.hint.trim())) err(`finale.steps[${i}].hint: phải là chuỗi`); });
  if (c.teoRescue != null) { if (!Array.isArray(c.teoRescue)) err(`teoRescue: phải là mảng các bộ thoại`); else c.teoRescue.forEach((ls, i) => checkLines(`teoRescue[${i}]`, ls)); }
  for (const b of c.bonus || []) if (!Array.isArray(b.choices) || !(b.answer >= 0 && b.answer < b.choices.length)) err(`bonus.${b.id}: answer phải là chỉ số trong choices`);
  for (const [where, f] of neededFlags) if (!flagsGiven.has(f)) err(`${where}: cần flag "${f}" nhưng không chỗ nào gives flag này`);

  // ---- mô phỏng: vét hết mọi thứ mở được (điểm soi, chủ đề, đọc chữ, bể lời khai)
  const S = { clue: new Set(), word: new Set(), stmt: new Set(), broke: new Set(), talk: new Set(), seen: new Set(), flag: new Set(), loc: new Set(), people: new Set() };
  for (const [lid, L] of Object.entries(locs)) if (L.start) S.loc.add(lid);
  for (const [pid, p] of Object.entries(people)) if (p.start !== false) S.people.add(pid);
  if (!S.loc.size) err(`không địa điểm nào start:true`);
  const atom = (a) => { const i = a.indexOf(":"); return S[a.slice(0, i)]?.has(a.slice(i + 1)) ?? false; };
  const read = (text) => wordsIn(text).forEach((w) => S.word.add(w));
  const readLines = (ls) => (ls || []).forEach((l) => read(lineOf(l).text));
  const give = (g) => {
    if (!g) return;
    for (const x of g.clues || []) if (!S.clue.has(x)) { S.clue.add(x); read(clues[x]?.desc); readLines(clues[x]?.detail); }
    for (const x of g.words || []) S.word.add(x);
    for (const x of g.stmts || []) if (!S.stmt.has(x)) { S.stmt.add(x); read(stmts[x]?.text); }
    for (const x of g.flags || []) S.flag.add(x);
    for (const x of g.locs || []) S.loc.add(x);
    for (const x of g.people || []) S.people.add(x);
  };
  readLines(c.intro);
  for (let changed = true, guard = 0; changed && guard < 500; guard++) {
    changed = false;
    const before = JSON.stringify(Object.values(S).map((s) => s.size));
    for (const [lid, L] of Object.entries(locs)) {
      if (!S.loc.has(lid) && !(L.needs && evalNeeds(L.needs, atom))) continue;
      S.loc.add(lid); readLines(L.intro);
      for (const h of L.hotspots || []) {
        const key = `${lid}.${h.id}`;
        if (S.seen.has(key) || !evalNeeds(h.needs, atom)) continue;
        S.seen.add(key); readLines(h.lines); give(h.gives);
      }
    }
    for (const [pid, list] of Object.entries(c.talks)) {
      if (!S.people.has(pid)) continue;
      for (const t of list || []) {
        const key = `${pid}.${t.id}`;
        if (S.talk.has(key) || !evalNeeds(t.needs, atom)) continue;
        S.talk.add(key); readLines(t.lines); give(t.gives);
      }
    }
    for (const [sid, s] of Object.entries(stmts)) {
      if (!s.break || S.broke.has(sid) || !S.stmt.has(sid) || !S.clue.has(s.break.clue)) continue;
      S.broke.add(sid); readLines(s.break.lines); give(s.break.gives);
    }
    changed = before !== JSON.stringify(Object.values(S).map((s) => s.size));
  }
  for (const cid of Object.keys(clues)) if (!S.clue.has(cid)) err(`vật chứng "${cid}" không nhặt được (không chỗ nào gives, hoặc điều kiện không bao giờ đạt)`);
  for (const [sid, s] of Object.entries(stmts)) {
    if (!S.stmt.has(sid)) err(`lời khai "${sid}" không bao giờ được ghi (thiếu gives.stmts)`);
    else if (s.break && !S.broke.has(sid)) err(`lời khai "${sid}" không bể được (chưa có vật chứng "${s.break.clue}" vào lúc đó)`);
  }
  for (const [lid] of Object.entries(locs)) if (!S.loc.has(lid)) err(`địa điểm "${lid}" không bao giờ mở`);
  for (const pid of Object.keys(people)) if (people[pid].suspect && !S.people.has(pid)) err(`nghi phạm "${pid}" không bao giờ xuất hiện`);
  for (const d of c.deduction) for (const [b, spec] of Object.entries(d.blanks || {})) if (words[spec.answer] && !S.word.has(spec.answer)) err(`deduction.${d.id}.${b}: người chơi không bao giờ nhặt được từ khoá "${spec.answer}" (phải có [[${spec.answer}]] trong chữ đã đọc hoặc gives.words)`);
  for (const s of F.steps || []) if (clues[s.answer] && !S.clue.has(s.answer)) err(`finale: vật chứng "${s.answer}" không nhặt được`);
  if (!c.deduction.some((d) => Object.values(d.blanks || {}).some((b) => b.kind === "ai"))) err(`bảng suy luận phải có ít nhất 1 chỗ trống loại "ai" (thủ phạm)`);

  // ---- lượng nội dung
  const m = MIN[diff];
  const suspects = Object.entries(people).filter(([, p]) => p.suspect).map(([id]) => id);
  const stats = {
    suspects: suspects.length, locations: Object.keys(locs).length,
    hotspots: Math.min(...Object.values(locs).map((L) => (L.hotspots || []).length)),
    clues: Object.keys(clues).length, breaks: Object.values(stmts).filter((s) => s.break).length,
    deductions: c.deduction.length, blanks: blankCount, steps: (F.steps || []).length,
    wrong: Math.min(...suspects.map((p) => (c.wrong?.[p] || []).length)),
    comments: (F.comments || []).length, hints: c.hints.length,
    topics: Math.min(...suspects.map((p) => (c.talks[p] || []).length)),
  };
  const label = { suspects: "nghi phạm", locations: "địa điểm", hotspots: "điểm soi ở địa điểm ít nhất", clues: "vật chứng", breaks: "lời khai bể được", deductions: "câu suy luận", blanks: "chỗ trống suy luận", steps: "bước vạch mặt", wrong: "phản ứng đưa sai (nghi phạm ít nhất)", comments: "bình luận viral", hints: "gợi ý Tèo", topics: "chủ đề hỏi (nghi phạm ít nhất)" };
  for (const k of Object.keys(m)) if (!(stats[k] >= m[k])) err(`thiếu nội dung: ${label[k]} ${stats[k]} < ${m[k]} (độ khó ${diff})`);
  if (!c.social?.posts?.length) warn(`chưa có bài đăng nhóm Zalo mở vụ (social.posts)`);
  if (!c.bonus?.length) warn(`chưa có câu hỏi phụ (bonus)`);
  return { errors, warns, stats, reach: { clues: S.clue.size, words: S.word.size } };
}
