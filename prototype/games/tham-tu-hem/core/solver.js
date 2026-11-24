// Bot giải tự động: đi hết một vụ CHỈ qua apply(), đọc mọi chữ hiện ra như người chơi (nhặt từ khoá khi đọc tới),
// lời giải suy ra từ dữ liệu vụ (break.clue, deduction.answer, finale.steps.answer, bonus.answer). Không gợi ý, không đưa sai ⇒ phải ra 3★.
// Dùng ở test (mọi vụ trong data/cases) và e2e (biết bước kế tiếp nên bấm gì).
import { createRun, apply, textOf, hotspotsAt, topicsOf, locList, talkable } from "./engine.js?v=t4";

/** Bước kế tiếp nên làm (null = hết việc điều tra, sang bảng / vạch mặt). */
export function nextAction(c, s) {
  if (s.phase === "intro") return { type: "intro" };
  if (s.phase === "play") {
    // 1) bể lời khai nào bể được
    for (const id of s.stmts) { const st = c.stmts[id]; if (st.break && !s.broke.includes(id) && s.clues.includes(st.break.clue)) return { type: "contradict", stmt: id, clue: st.break.clue }; }
    // 2) điểm soi chưa xem ở chỗ đang đứng, rồi ở chỗ khác
    const here = hotspotsAt(c, s).find((h) => !h.seen);
    if (here) return { type: "examine", id: here.id };
    for (const lid of locList(c, s)) if (lid !== s.loc && hotspotsAt(c, s, lid).some((h) => !h.seen)) return { type: "go", loc: lid };
    for (const lid of locList(c, s)) if (!s.visited.includes(lid)) return { type: "go", loc: lid };
    // 3) chủ đề chưa hỏi
    for (const pid of talkable(c, s)) { const t = topicsOf(c, s, pid).find((x) => !x.asked); if (t) return { type: "ask", pid, topic: t.id }; }
    // 4) bảng suy luận
    if (!s.solved) {
      for (const d of c.deduction) for (const [b, spec] of Object.entries(d.blanks)) if (s.board[d.id][b] !== spec.answer && s.words.includes(spec.answer)) return { type: "fill", ded: d.id, blank: b, word: spec.answer };
      const ready = c.deduction.every((d) => Object.entries(d.blanks).every(([b, spec]) => s.board[d.id][b] === spec.answer));
      return ready ? { type: "commit" } : null;
    }
    return { type: "accuse" };
  }
  if (s.phase === "finale") return { type: "rebut", clue: c.finale.steps[s.fin.step].answer };
  if (s.phase === "done") { const q = (c.bonus || []).find((x) => s.bonus[x.id] == null); return q ? { type: "bonus", id: q.id, choice: q.answer } : null; }
  return null;
}

/** Chạy hết vụ. Trả { s, steps, log, stuck } — stuck = lý do kẹt (null nếu xong). */
export function solve(c, { seed = 7, maxSteps = 5000, onStep } = {}) {
  let s = createRun(c, seed);
  const log = [];
  const read = (r) => { const texts = r.show.map((it) => textOf(c, it)).filter(Boolean); if (texts.length) s = apply(c, s, { type: "read", texts }).s; };
  read({ show: (c.intro || []).map((l) => ({ t: "line", text: Array.isArray(l) ? l[1] : l.text })) });
  for (const p of c.social?.posts || []) read({ show: [{ t: "line", text: p.text }] });
  let steps = 0;
  for (; steps < maxSteps; steps++) {
    const a = nextAction(c, s);
    if (!a) break;
    const r = apply(c, s, a);
    if (r.error) return { s, steps, log, stuck: `${JSON.stringify(a)} ⇒ ${r.error}` };
    s = r.s; log.push(a); onStep?.(a, r);
    read(r);
  }
  const stuck = s.phase === "done" ? null : `dừng ở phase ${s.phase}` + (s.phase === "play" && !s.solved ? `: thiếu từ khoá ${c.deduction.flatMap((d) => Object.values(d.blanks)).map((b) => b.answer).filter((w) => !s.words.includes(w)).join(", ")}` : "");
  return { s, steps, log, stuck };
}
