// Đố Vui Nhanh — giao diện (DOM), đồng hồ, phím/chạm, âm thanh, hiệu ứng hạt pixel, lưu kỷ lục. Luật + chấm điểm nằm trong logic.js.
import { CATS, MODES, ROUND_LEN, QUESTIONS, newRound, current, answer, fifty, next, rank, rng } from "./logic.js?v=daily1";
import * as UI from "../_shared/daily-ui.js?v=d10";

const D = UI.D;
const DAILY_ID = "do-vui-nhanh";

const SAVE_KEY = "wgp.dovuinhanh.v1";
const REVEAL_MS = 1900, RECENT_MAX = 50;
const LETTERS = "ABCD";

function makeSfx(dir, names, sdk) {
  const AC = window.AudioContext || window.webkitAudioContext;
  const buf = {}, log = [];
  let ac = null;
  if (AC) {
    try { ac = new AC(); } catch { ac = null; }
    if (ac) for (const n of names) {
      fetch(new URL(dir + n + ".ogg", import.meta.url)).then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
        .then((b) => ac.decodeAudioData(b)).then((d) => { buf[n] = d; })
        .catch(() => console.warn("Không tải được âm thanh " + n + ".ogg"));
    }
  }
  const muted = () => !!(sdk.sound && sdk.sound.muted);
  return {
    play(n, vol = 1, rate = 1) {
      if (muted() || !ac || !buf[n]) return false;
      if (ac.state === "suspended") ac.resume().catch(() => {});
      const s = ac.createBufferSource(), gn = ac.createGain();
      s.buffer = buf[n]; s.playbackRate.value = rate; gn.gain.value = vol; s.connect(gn).connect(ac.destination); s.start();
      log.push({ n, t: Math.round(performance.now()) }); if (log.length > 300) log.shift();
      return true;
    },
    log,
    close() { if (ac) ac.close().catch(() => {}); },
  };
}

function loadSave() {
  const d = { best: { normal: 0, fast: 0 }, cat: "all", mode: "normal", recent: [] };
  try {
    const v = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (v && typeof v === "object") {
      for (const k of ["normal", "fast"]) d.best[k] = Math.max(0, (v.best && v.best[k]) | 0);
      if (v.cat === "all" || CATS.some((c) => c.id === v.cat)) d.cat = v.cat;
      if (MODES[v.mode]) d.mode = v.mode;
      if (Array.isArray(v.recent)) d.recent = v.recent.filter(Number.isInteger).slice(-RECENT_MAX);
    }
  } catch {}
  return d;
}
const fmtNum = (n) => n.toLocaleString("vi-VN");
const catOf = (id) => CATS.find((c) => c.id === id);

export function mount(root, ctx = {}) {
  const sdk = ctx.sdk || { sound: { muted: false } };
  const $ = (id) => document.getElementById(id);
  const ui = {
    no: $("hNo"), score: $("hScore"), streak: $("hStreak"), best: $("hBest"), fifty: $("fiftyBtn"), pause: $("pauseBtn"), mute: $("muteBtn"), muteIc: $("muteIc"),
    timer: $("timer"), tFill: $("tFill"), tNum: $("tNum"), qCat: $("qCat"), qNo: $("qNo"), qText: $("qText"), answers: $("answers"),
    btns: [...document.querySelectorAll(".ans")], fbText: $("fbText"), fbNote: $("fbNote"), next: $("nextBtn"),
    ovMenu: $("ovMenu"), ovPause: $("ovPause"), ovEnd: $("ovEnd"), catPick: $("catPick"), modePick: $("modePick"), play: $("playBtn"), mBest: $("mBest"),
    eStars: $("eStars"), eTitle: $("eTitle"), eSub: $("eSub"), eResult: $("eResult"), eRecord: $("eRecord"), eList: $("eList"), eReview: $("eReview"),
    fx: $("fx"),
  };
  const sfx = makeSfx("assets/sfx/", ["trung-kim-cuong", "trung-da", "het-gio", "buoc-nhay", "qua-man", "thang", "thua", "do-xuc-xac"], sdk);
  let save = loadSave();
  let cat = save.cat, mode = save.mode;
  let s = null, paused = false, destroyed = false, raf = 0, games = 0;
  let seedBase = ctx.seed ?? (Date.now() & 0xffffff);
  let askAt = 0, usedBefore = 0, revealTimer = 0, lastTick = -1, newRecord = false;
  const fxr = rng(seedBase ^ 0x5bd1e995);
  // Thử thách hôm nay (?daily=1): 5 câu chọn theo ngày (không lặp câu trong cửa sổ nhiều ngày nhất bộ câu cho phép),
  // tốc độ Bình thường, chơi 1 lần rồi khoá. Tải lại giữa chừng: câu đang hỏi tính là hết giờ. Không đụng bản lưu thường.
  const daily = ctx.daily ? { day: D.dayNumber(), seed: 0, ids: [], panel: null } : null;
  if (daily) {
    daily.seed = D.seedFor(DAILY_ID, daily.day);
    daily.ids = D.pickNoRepeat(DAILY_ID, daily.day, QUESTIONS.length, D.GAMES[DAILY_ID].questions, 30);
  }
  const total = () => (s ? s.qs.length : daily ? daily.ids.length : ROUND_LEN);

  // ---------- Menu ----------
  ui.catPick.innerHTML = [{ id: "all", name: "Tất cả chủ đề", icon: "🎲" }, ...CATS]
    .map((c) => `<button class="opt" type="button" role="radio" data-cat="${c.id}"><span class="ic">${c.icon}</span><b>${c.name}</b></button>`).join("");
  function showMenuPicks() {
    for (const b of ui.catPick.children) { const on = b.dataset.cat === cat; b.classList.toggle("on", on); b.setAttribute("aria-checked", on); }
    for (const b of ui.modePick.children) { const on = b.dataset.mode === mode; b.classList.toggle("on", on); b.setAttribute("aria-checked", on); }
    const bn = save.best.normal, bf = save.best.fast;
    ui.mBest.textContent = bn || bf ? `Kỷ lục: Bình thường ${bn ? fmtNum(bn) : "—"} · Siêu tốc ${bf ? fmtNum(bf) : "—"}` : "";
  }
  ui.catPick.addEventListener("click", (e) => { const b = e.target.closest("[data-cat]"); if (!b) return; cat = b.dataset.cat; sfx.play("buoc-nhay", 0.5); showMenuPicks(); });
  ui.modePick.addEventListener("click", (e) => { const b = e.target.closest("[data-mode]"); if (!b) return; mode = b.dataset.mode; sfx.play("buoc-nhay", 0.5); showMenuPicks(); });

  function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch {} }
  function showOv(which) {
    for (const k of ["ovMenu", "ovPause", "ovEnd"]) ui[k].hidden = k !== which;
    document.body.classList.toggle("is-menu", which === "ovMenu");
  }

  // ---------- Ván chơi ----------
  function start() {
    clearTimeout(revealTimer);
    save.cat = cat; save.mode = mode; persist();
    s = newRound({ seed: (seedBase + games * 7919) >>> 0, cat, mode, recent: save.recent });
    games++; paused = false; newRecord = false;
    document.body.classList.remove("is-paused");
    showOv(null);
    sfx.play("qua-man", 0.6);
    ask();
  }
  function ask() {
    const q = current(s), c = catOf(q.cat);
    ui.qCat.textContent = c.icon + " " + c.name;
    ui.qNo.textContent = `CÂU ${s.i + 1}/${total()}`;
    ui.qText.textContent = q.q;
    ui.btns.forEach((b, k) => {
      b.className = "ans"; b.disabled = false; b.querySelector(".t").textContent = q.opts[k]; b.querySelector(".mark").textContent = "";
      b.setAttribute("aria-label", LETTERS[k] + ": " + q.opts[k]);
    });
    ui.answers.classList.remove("locked");
    ui.fbText.textContent = ""; ui.fbText.className = "fb-text"; ui.fbNote.textContent = ""; ui.next.hidden = true;
    askAt = performance.now(); usedBefore = 0; lastTick = -1;
    saveDaily(true);
    hud();
  }
  const used = () => (paused ? usedBefore : usedBefore + performance.now() - askAt);
  function pick(k, viaTimeout = false) {
    if (!s || paused || s.status !== "play" || s.phase !== "ask") return;
    const rec = answer(s, viaTimeout ? -1 : k, used());
    if (!rec) return;
    const q = current(s);
    ui.answers.classList.add("locked");
    ui.btns.forEach((b) => (b.disabled = true));
    const right = ui.btns[q.correct];
    right.classList.add("right"); right.querySelector(".mark").textContent = "✓";
    if (!rec.ok && !rec.timeout) { ui.btns[k].classList.add("wrong"); ui.btns[k].querySelector(".mark").textContent = "✗"; }
    if (rec.ok) {
      ui.fbText.textContent = `Đúng rồi! +${fmtNum(rec.pts)}` + (s.streak >= 2 ? `  🔥×${s.streak}` : "");
      ui.fbText.className = "fb-text ok";
      sfx.play("trung-kim-cuong", 0.8, 1 + Math.min(0.3, (s.streak - 1) * 0.05));
      burst(right, s.streak >= 3 ? 46 : 28);
    } else {
      ui.fbText.textContent = rec.timeout ? "⏰ Hết giờ!" : "Sai rồi!";
      ui.fbText.className = "fb-text no";
      sfx.play(rec.timeout ? "het-gio" : "trung-da", 0.8);
    }
    ui.fbNote.textContent = (rec.ok ? "" : "Đáp án: " + LETTERS[q.correct] + ". " + q.opts[q.correct] + ". ") + (q.note || "");
    ui.next.hidden = false;
    ui.next.textContent = s.i + 1 >= total() ? "Xem kết quả ▶" : "Câu tiếp ▶";
    saveDaily(false);
    hud();
    clearTimeout(revealTimer);
    revealTimer = setTimeout(goNext, REVEAL_MS + (q.note ? 1400 : 0) + (rec.ok ? 0 : 900));
  }
  function goNext() {
    clearTimeout(revealTimer);
    if (!s || paused || s.phase !== "reveal") return;
    next(s);
    if (s.status === "over") return finish();
    sfx.play("buoc-nhay", 0.4);
    ask();
  }
  function useFifty() {
    if (!s || paused) return;
    const hid = fifty(s, fxr);
    if (!hid) return;
    sfx.play("do-xuc-xac", 0.6);
    for (const k of hid) { ui.btns[k].classList.add("gone"); ui.btns[k].disabled = true; }
    hud();
  }

  function finish() {
    clearTimeout(revealTimer);
    if (daily) return finishDaily();
    const ids = s.qs.map((q) => q.id);
    save.recent = [...save.recent.filter((x) => !ids.includes(x)), ...ids].slice(-RECENT_MAX);
    const prev = save.best[s.mode] || 0;
    newRecord = s.score > prev && s.score > 0;
    if (newRecord) save.best[s.mode] = s.score;
    persist();
    const stars = s.correct >= 10 ? 3 : s.correct >= 8 ? 2 : s.correct >= 5 ? 1 : 0;
    ui.eStars.innerHTML = [0, 1, 2].map((k) => `<i class="${k < stars ? "on" : ""}">★</i>`).join("");
    ui.eTitle.textContent = rank(s.correct);
    ui.eSub.textContent = `${s.cat !== "all" ? catOf(s.cat).name : "Tất cả chủ đề"} · ${MODES[s.mode].name}`;
    const okMs = s.answers.filter((a) => a.ok).map((a) => a.ms);
    const avg = okMs.length ? (okMs.reduce((p, q) => p + q, 0) / okMs.length / 1000).toFixed(1).replace(".", ",") + " giây" : "—";
    ui.eResult.innerHTML = `<span>Trả lời đúng</span><b>${s.correct}/${total()}</b><span>Chuỗi dài nhất</span><b>${s.bestStreak}</b>`
      + `<span>Tốc độ TB (câu đúng)</span><b>${avg}</b><span class="total">Tổng điểm</span><b>${fmtNum(s.score)}</b>`;
    ui.eRecord.innerHTML = newRecord ? '<span class="record">★ Kỷ lục mới</span>' : prev ? `<div class="best">Kỷ lục ${MODES[s.mode].name}: ${fmtNum(prev)}</div>` : "";
    ui.eList.innerHTML = "";
    s.qs.forEach((q, i) => {
      const a = s.answers[i], li = document.createElement("li");
      const b = document.createElement("b"); b.textContent = `${i + 1}. ${q.q}`; li.append(b);
      const yours = document.createElement("span"); yours.className = a.ok ? "y" : "n";
      yours.textContent = a.timeout ? "Hết giờ" : (a.ok ? "✓ " : "✗ ") + q.opts[a.pick]; li.append(yours);
      if (!a.ok) li.append(" — Đúng: " + q.opts[q.correct]);
      if (q.note) li.append(" · " + q.note);
      ui.eList.append(li);
    });
    ui.eReview.open = false;
    showOv("ovEnd");
    sfx.play(s.correct >= 5 ? "thang" : "thua", 0.8);
    if (newRecord) setTimeout(() => sfx.play("trung-kim-cuong", 0.7, 1.2), 700); // kỷ lục mới
    if (stars >= 2) setTimeout(() => confetti(), 150);
    sdk.reportScore?.(s.score);
    sdk.gameOver?.({ score: s.score, correct: s.correct, mode: s.mode, cat: s.cat });
    hud();
  }

  function setPaused(on) {
    if (!s || s.status !== "play" || paused === on) return;
    if (on) { usedBefore = used(); paused = true; clearTimeout(revealTimer); }
    else { paused = false; askAt = performance.now(); if (s.phase === "reveal") revealTimer = setTimeout(goNext, 900); }
    document.body.classList.toggle("is-paused", paused);
    sfx.play("buoc-nhay", 0.4, on ? 0.8 : 1.2);
    showOv(paused ? "ovPause" : null);
  }
  // ---------- Thử thách hôm nay ----------
  function saveDaily(asking) {
    if (!daily || !s || s.status !== "play") return;
    D.saveProgress(DAILY_ID, daily.day, { i: s.i, asking, fiftyLeft: s.fiftyLeft, answers: s.answers.map((a) => ({ pick: a.pick, ms: Math.round(a.ms) })) });
  }
  function startDaily() {
    clearTimeout(revealTimer);
    UI.badge(daily.day);
    document.body.classList.add("is-daily");
    if (D.isDone(DAILY_ID, daily.day)) {
      s = null; showOv(null); hud();
      ui.qCat.textContent = "★ Thử thách #" + daily.day; ui.qText.textContent = "Bạn đã chơi thử thách hôm nay rồi. Hẹn mai nhé!";
      ui.btns.forEach((b) => { b.disabled = true; b.querySelector(".t").textContent = ""; });
      showDaily(); return;
    }
    s = newRound({ seed: daily.seed, ids: daily.ids, mode: "normal" });
    const prog = D.loadProgress(DAILY_ID, daily.day);
    if (prog && Array.isArray(prog.answers)) {
      for (const a of prog.answers) { if (s.status !== "play" || !answer(s, a.pick | 0, a.ms)) break; next(s); }
      if (prog.asking && prog.i === s.i && s.status === "play" && answer(s, -1, s.limit)) next(s); // tải lại giữa câu ⇒ hết giờ
      if (Number.isInteger(prog.fiftyLeft)) s.fiftyLeft = Math.min(1, Math.max(0, prog.fiftyLeft));
    }
    games++; paused = false; newRecord = false;
    document.body.classList.remove("is-paused");
    showOv(null);
    if (s.status === "over") return finish();
    sfx.play("qua-man", 0.6);
    ask();
  }
  function finishDaily() {
    const marks = s.answers.map((a) => a.ok);
    const ms = s.answers.reduce((p, a) => p + (a.ms || 0), 0);
    // proof: lựa chọn + thời gian từng câu ⇒ máy chủ chấm lại theo câu hỏi của ngày (Bảng xếp hạng hôm nay)
    const proof = { answers: s.answers.map((a) => ({ pick: a.pick, ms: Math.round(a.ms) })) };
    D.record(DAILY_ID, daily.day, { marks, ms: Math.round(ms), score: s.score, proof });
    sfx.play(s.correct >= Math.ceil(total() / 2) ? "thang" : "thua", 0.8);
    if (s.correct === total()) setTimeout(() => confetti(), 150);
    sdk.reportScore?.(s.score);
    sdk.gameOver?.({ score: s.score, correct: s.correct, mode: s.mode, cat: "all", daily: daily.day });
    hud();
    showDaily();
  }
  function showDaily() {
    const res = D.getResult(DAILY_ID, daily.day);
    const ok = res.marks.filter(Boolean).length;
    if (daily.panel) daily.panel.destroy();
    daily.panel = UI.panel({ game: DAILY_ID, day: daily.day, result: res, title: rank(ok, res.marks.length) });
  }

  function toMenu() {
    if (daily) { location.href = "./"; return; } if (s) sfx.play("buoc-nhay", 0.35, 0.8); clearTimeout(revealTimer); s = null; paused = false; document.body.classList.remove("is-paused"); showMenuPicks(); showOv("ovMenu"); hud(); }

  // ---------- HUD + đồng hồ ----------
  function hud() {
    const best = save.best[s ? s.mode : mode];
    ui.no.textContent = s ? `${Math.min(total(), s.i + 1)}/${total()}` : `0/${total()}`;
    ui.score.textContent = fmtNum(s ? s.score : 0);
    ui.streak.textContent = s && s.streak >= 2 ? "🔥" + s.streak : String(s ? s.streak : 0);
    ui.best.textContent = best ? fmtNum(best) : "—";
    ui.fifty.disabled = !s || s.fiftyLeft < 1 || s.phase !== "ask";
    ui.fifty.textContent = s && s.fiftyLeft < 1 ? "50:50 ✓" : "50:50";
    ui.pause.disabled = !s || s.status !== "play";
  }
  function tickTimer() {
    if (!s) { ui.tFill.style.width = "100%"; ui.tNum.textContent = String(MODES[mode].limit / 1000); ui.timer.classList.remove("hurry"); return; }
    let left;
    if (s.phase === "ask") {
      left = Math.max(0, s.limit - used());
      if (left <= 0 && !paused) { pick(-1, true); return; }
      const sec = Math.ceil(left / 1000);
      if (sec <= 3 && sec !== lastTick && !paused) { lastTick = sec; sfx.play("buoc-nhay", 0.35, 1.4); }
    } else { const a = s.answers[s.answers.length - 1]; left = a ? s.limit - a.ms : 0; }
    const steps = 40, w = Math.ceil((left / s.limit) * steps) / steps; // chạy theo bậc kiểu pixel
    ui.tFill.style.width = (w * 100).toFixed(1) + "%";
    ui.tNum.textContent = String(Math.ceil(left / 1000));
    ui.timer.classList.toggle("hurry", s.phase === "ask" && left <= 3000);
  }

  // ---------- Hạt pixel (vẽ bằng code, không ảnh) ----------
  const fctx = ui.fx.getContext("2d");
  let parts = [];
  function sizeFx() { const d = Math.min(2, window.devicePixelRatio || 1); ui.fx.width = innerWidth * d; ui.fx.height = innerHeight * d; fctx.setTransform(d, 0, 0, d, 0, 0); }
  sizeFx();
  const COLORS = ["#ffc94a", "#ffe9a8", "#7fd47f", "#3fae4a", "#8fb8f0", "#e0483d", "#f4ead2"];
  function burst(el, n) {
    const r = el.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      const a = fxr() * Math.PI * 2, v = 120 + fxr() * 260;
      parts.push({ x: r.left + 26 + fxr() * (r.width - 52), y: r.top + r.height / 2, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, life: 0.6 + fxr() * 0.5, t: 0, c: COLORS[i % 5], s: 4 + ((fxr() * 3) | 0) * 2 });
    }
  }
  function confetti() {
    for (let i = 0; i < 120; i++) parts.push({ x: fxr() * innerWidth, y: -20 - fxr() * 200, vx: (fxr() - 0.5) * 80, vy: 80 + fxr() * 160, life: 2.4 + fxr(), t: 0, c: COLORS[i % COLORS.length], s: 6 + ((fxr() * 2) | 0) * 2, flake: true });
  }
  let lastF = performance.now();
  function frame(now) {
    if (destroyed) return;
    const dt = Math.min(0.05, (now - lastF) / 1000); lastF = now;
    tickTimer();
    fctx.clearRect(0, 0, innerWidth, innerHeight);
    if (parts.length) {
      parts = parts.filter((p) => (p.t += dt) < p.life);
      for (const p of parts) {
        p.vy += (p.flake ? 30 : 520) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        fctx.globalAlpha = Math.min(1, (p.life - p.t) * 3);
        fctx.fillStyle = "#0a0807"; fctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, p.s + 2, p.s + 2);
        fctx.fillStyle = p.c; fctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
      }
      fctx.globalAlpha = 1;
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  // ---------- Điều khiển ----------
  ui.answers.addEventListener("click", (e) => { const b = e.target.closest(".ans"); if (b && !b.disabled) pick(+b.dataset.i); });
  ui.next.addEventListener("click", goNext);
  ui.fifty.addEventListener("click", useFifty);
  ui.play.addEventListener("click", start);
  $("againBtn").addEventListener("click", start);
  $("menuBtnE").addEventListener("click", toMenu);
  $("menuBtnP").addEventListener("click", toMenu);
  $("resumeBtn").addEventListener("click", () => setPaused(false));
  ui.pause.addEventListener("click", () => setPaused(true));
  function showMute() { const m = !!sdk.sound.muted; ui.muteIc.src = "assets/ui/" + (m ? "icon-am-thanh-tat.png" : "icon-am-thanh-bat.png"); ui.mute.setAttribute("aria-pressed", m); }
  function toggleMute() { sdk.sound.muted = !sdk.sound.muted; try { localStorage.setItem("wgp.muted", sdk.sound.muted ? "1" : "0"); } catch {} showMute(); }
  ui.mute.addEventListener("click", toggleMute);
  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === "m") return toggleMute();
    if (!ui.ovMenu.hidden) { if (k === "enter" && document.activeElement?.tagName !== "BUTTON") start(); return; }
    if (!ui.ovEnd.hidden) { if (k === "enter" && document.activeElement?.tagName !== "BUTTON" && document.activeElement?.tagName !== "SUMMARY") start(); return; }
    if (k === "p" || k === "escape") { e.preventDefault(); return setPaused(!paused); }
    if (paused || !s) return;
    const idx = "1234".indexOf(k) >= 0 ? "1234".indexOf(k) : "abcd".indexOf(k);
    if (idx >= 0 && s.phase === "ask") { e.preventDefault(); const b = ui.btns[idx]; if (!b.disabled) pick(idx); return; }
    if (k === "f") return useFifty();
    if ((k === "enter" || k === " ") && s.phase === "reveal") { e.preventDefault(); goNext(); }
  }
  document.addEventListener("keydown", onKey);
  const onVis = () => { if (document.hidden) setPaused(true); };
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("resize", sizeFx);

  showMute(); showMenuPicks(); hud();
  if (daily) startDaily();
  else {
    showOv("ovMenu");
    const dl = $("dailyLink");
    if (dl) { const n = D.dayNumber(); dl.textContent = D.isDone(DAILY_ID, n) ? `★ Thử thách #${n} · đã xong ✓` : `★ Thử thách hôm nay #${n} · 5 câu`; }
  }

  return {
    get state() { return s; }, get daily() { return daily ? { day: daily.day, ids: daily.ids.slice() } : null; }, get paused() { return paused; }, get save() { return save; }, sfx,
    get parts() { return parts.length; },
    start, pick, goNext, useFifty, setPaused, toMenu,
    /** test: tua đồng hồ câu hiện tại (ms đã dùng) */
    elapse(ms) { askAt -= ms; },
    destroy() {
      destroyed = true; cancelAnimationFrame(raf); clearTimeout(revealTimer);
      document.removeEventListener("keydown", onKey); document.removeEventListener("visibilitychange", onVis); window.removeEventListener("resize", sizeFx);
      sfx.close();
    },
  };
}
