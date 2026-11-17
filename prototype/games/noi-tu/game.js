// Nối Từ — giao diện. Chỉ biết interface MatchSession (session/client.js): state / event / status, submit, resign,
// rematch, remainingMs. KHÔNG import core/rules hay core/ai và KHÔNG tự tính giờ: thắng thua, hết giờ, bot đều do
// trọng tài quyết. Sau này mở online chỉ cần đổi createLocalSession → OnlineSession, phần dưới giữ nguyên.
//
// Gốc lắp ráp (composition root) duy nhất được biết đến từ điển + LocalSession là hàm openSession() bên dưới.
import { createDict } from "./core/dict.js";
import { createLocalSession } from "./session/local.js";
import { guessWord } from "./core/input.js";   // trợ giúp nhập liệu (Telex/VNI thô, không dấu) — không phải luật

const STORE_KEY = "noi-tu:local";
const PREFS_KEY = "noi-tu:prefs";
const MISSING_KEY = "noi-tu:missing";      // từ người chơi gõ mà từ điển chưa có ⇒ người duyệt bổ sung sau (không tự thêm)
const ME = 0;                               // offline: người chơi luôn ngồi ghế 0 (Đỏ), máy ghế 1 (Xanh dương)

const REASON = {
  "need-two-syllables": () => "Cần đúng một từ ghép 2 tiếng (vd: học tập).",
  "wrong-link": (r) => `Phải bắt đầu bằng “${r.need}”.`,
  "not-in-dict": (r) => `“${r.key}” chưa có trong từ điển bản thử — thử từ khác nhé.`,
  "already-used": (r) => `“${r.key}” đã dùng trong ván này rồi.`,
  "dead-end": (r) => `“${r.key}” là từ cụt — ván này không cho phép.`,
  "not-your-turn": () => "Chưa tới lượt bạn.",
  "late": () => "Hết giờ mất rồi!",
  "stale": () => "Chuỗi từ vừa đổi — xem lại rồi gõ tiếp.",
  "not-playing": () => "Ván đã kết thúc.",
};

const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* đầy bộ nhớ / chế độ riêng tư: bỏ qua */ } },
  remove: (k) => { try { localStorage.removeItem(k); } catch { /* bỏ qua */ } },
};
const loadJSON = (k, d) => { try { return JSON.parse(store.get(k)) ?? d; } catch { return d; } };

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
  return {
    play(n, vol = 1) {
      log.push({ n, t: Math.round(performance.now()) }); if (log.length > 500) log.shift();
      if (sdk.sound?.muted || !ac || !buf[n]) return false;
      if (ac.state === "suspended") ac.resume().catch(() => {});
      const s = ac.createBufferSource(), gn = ac.createGain();
      s.buffer = buf[n]; gn.gain.value = vol; s.connect(gn).connect(ac.destination); s.start();
      return true;
    },
    log,
    close() { if (ac) ac.close().catch(() => {}); },
  };
}

const syl = (w) => w.split(" ");             // từ trong state đã chuẩn hóa: đúng 2 tiếng cách nhau 1 dấu cách

export function mount(root, { sdk = { sound: { muted: false } } } = {}) {
  const $ = (id) => root.querySelector("#" + id);
  const el = { pl: [$("pl0"), $("pl1")], av: [$("av0"), $("av1")], n: [$("n0"), $("n1")], s: [$("s0"), $("s1")],
    round: $("hRound"), status: $("hStatus"), first: $("hFirst"), clock: $("clock"), cLbl: $("cLbl"), cFill: $("cFill"), cNum: $("cNum"),
    chain: $("chain"), dock: $("dock"), form: $("form"), need: $("need"), inp: $("inp"), send: $("sendBtn"), msg: $("msg"), msgTxt: $("msgTxt"),
    resign: $("resignBtn"), overRow: $("overRow"), overTxt: $("overTxt"), next2: $("nextBtn2"),
    ovMenu: $("ovMenu"), resume: $("resumeBtn"), start: $("startBtn"), mNote: $("mNote"),
    ovEnd: $("ovEnd"), eAv: $("eAv"), eTitle: $("eTitle"), eSub: $("eSub"), eResult: $("eResult"), eNext: $("eNext"), next: $("nextBtn"), view: $("viewBtn"),
    menuBtn: $("menuBtn"), muteBtn: $("muteBtn"), muteIc: $("muteIc") };
  const sfx = makeSfx("assets/sfx/", ["buoc-nhay", "trung-da", "thang", "thua", "qua-man", "het-gio", "do-xuc-xac"], sdk);
  const prefs = { level: "easy", ...loadJSON(PREFS_KEY, {}) };   // level: chọn cho trận mới · matchLevel: của trận đang lưu

  let dict = null, session = null, state = null, offs = [];
  let fxWord = null;          // seq của sự kiện "played" mới (để chỉ thẻ đó có hiệu ứng rơi; snapshot thì không)
  let busy = false;           // đang chờ kết quả submit
  let armTimer = null, raf = 0, destroyed = false, lastSec = null, endShownFor = null, viewing = false;
  const t = { submits: 0, results: [] }; // dấu vết cho test

  // ---------- phiên chơi ----------
  const ready = fetch(new URL("data/words.json", import.meta.url))
    .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then((j) => { dict = createDict(j); if (j.contentHash && j.contentHash !== dict.contentHash) console.warn("words.json: contentHash lệch nội dung"); showMenu(); })
    .catch((e) => { el.mNote.innerHTML = `<span class="err">Không tải được từ điển (${e.message}). Tải lại trang thử nhé.</span>`; el.start.disabled = true; });

  function savedMatch() {
    const s = loadJSON(STORE_KEY, null);
    if (!s || s.mode !== "bot" || !dict || s.log?.[0]?.pin?.dictHash !== dict.contentHash) return null;
    const ev = s.log; let roundNo = 0, score = [0, 0], over = true;
    for (const e of ev) { if (e.type === "roundStarted") { roundNo++; over = false; } if (e.type === "roundEnded") { score[e.winner]++; over = true; } }
    return { roundNo, score, over };
  }

  function openSession(fresh) {
    closeSession();
    if (fresh) { store.remove(STORE_KEY); prefs.matchLevel = prefs.level; savePrefs(); }
    const level = prefs.matchLevel || prefs.level;
    session = createLocalSession({ dict, mode: "bot", botLevel: level, names: ["Bạn", "Máy"], storage: store, storageKey: STORE_KEY });
    state = null; endShownFor = null; viewing = false; fxWord = null; el.chain.textContent = ""; el.chain.dataset.round = "";
    offs = [session.on("state", onState), session.on("event", onEvent), session.on("status", onStatus)];
    hide(el.ovMenu); setInert(false);
    loop();
  }

  function closeSession() {
    for (const off of offs) off();
    offs = [];
    if (session) session.dispose();   // dừng trọng tài + mọi hẹn giờ (đồng hồ lượt dừng thật)
    session = null; busy = false;
    cancelAnimationFrame(raf);
  }

  // ---------- sự kiện từ trọng tài ----------
  function onEvent(ev) {
    if (ev.type === "played") {
      fxWord = ev.seq;
      sfx.play(ev.seat === ME ? "buoc-nhay" : "do-xuc-xac", ev.seat === ME ? 0.7 : 0.35);
    } else if (ev.type === "roundEnded") {
      sfx.play(ev.winner === ME ? "thang" : (ev.reason === "timeout" ? "het-gio" : "thua"), 0.8);
      sdk.gameOver?.({ winner: ev.winner === ME ? "player" : "bot", reason: ev.reason });
    } else if (ev.type === "roundStarted" && ev.seq > 2) {
      sfx.play("qua-man", 0.5);
    }
  }

  function onStatus(s) {
    if (s === "closed" && session?.rejectReason) showMenu(`Không vào được ván (${session.rejectReason}). Bấm “Trận mới”.`);
  }

  function onState(s) {
    const prevRound = state?.round?.id;
    state = s;
    const r = s.round;
    if (r && r.id !== prevRound) { setMsg(""); el.inp.value = ""; disarm(); }
    render();
  }

  // ---------- vẽ ----------
  function render() {
    const s = state, r = s?.round;
    if (!s) return;
    const me = session.mySeat ?? ME, bot = 1 - me;
    el.n[me].textContent = s.seats[me].name; el.n[bot].textContent = `${s.seats[bot].name} · ${(prefs.matchLevel || prefs.level) === "hard" ? "Khó" : "Dễ"}`;
    for (const i of [0, 1]) el.s[i].textContent = s.score[i];
    sdk.reportScore?.(s.score[me]);
    if (!r) return;
    el.round.textContent = `Ván ${r.no}`;
    el.first.textContent = r.first === me ? "Bạn đi trước" : "Máy đi trước";
    const myTurn = !r.over && r.turn === me;
    for (const i of [0, 1]) {
      el.pl[i].classList.toggle("on", !r.over && r.turn === i);
      el.pl[i].classList.toggle("win", r.over && r.winner === i);
      const c = i === 0 ? "do" : "xanh-duong";
      el.av[i].src = `assets/avatar/ngua-${c}-${r.over ? (r.winner === i ? "mung-thang-1" : "bi-da-1") : "dung-yen-1"}.png`;
    }
    el.status.textContent = r.over ? (r.winner === me ? "Bạn thắng ván" : "Máy thắng ván") : myTurn ? "Lượt bạn" : "Máy đang nghĩ…";
    renderChain(r, me);
    // khay nhập
    const last = r.chain[r.chain.length - 1];
    el.dock.classList.toggle("on", myTurn);
    el.form.hidden = r.over; el.overRow.hidden = !r.over;
    el.resign.hidden = r.over;
    if (last) { el.need.textContent = syl(last.word)[1]; el.need.classList.remove("free"); el.inp.placeholder = "gõ tiếng tiếp theo…"; }
    else { el.need.textContent = "Từ mở đầu"; el.need.classList.add("free"); el.inp.placeholder = "gõ từ 2 tiếng bất kỳ…"; }
    setSendOff(!myTurn || busy);
    if (r.over) {
      el.overTxt.textContent = endLine(r, me).title + " " + endLine(r, me).sub;
      if (endShownFor !== r.id && !viewing) showEnd(r, me);
      el.inp.blur();
    } else {
      hide(el.ovEnd); endShownFor = null; viewing = false;
      if (myTurn && el.ovMenu.hidden && document.activeElement !== el.inp && matchMedia("(hover: hover)").matches) el.inp.focus({ preventScroll: true });
      if (!myTurn && !busy && !el.msg.classList.contains("bad")) setMsg("Máy đang tìm từ nối…");
      if (myTurn && el.msgTxt.textContent === "Máy đang tìm từ nối…") setMsg(last ? `Tới lượt bạn — nối tiếp “${syl(last.word)[1]}”.` : "Tới lượt bạn — gõ từ mở đầu.");
    }
  }

  function tile(w, i, chain, me) {
    const [a, b] = syl(w.word);
    const d = document.createElement("span");
    d.className = `w w--${w.seat === me ? 0 : 1}`;
    d.dataset.seat = w.seat;
    d.innerHTML = `<span class="sy${i > 0 ? " lk" : ""}"></span><span class="sy${i < chain.length - 1 ? " lk" : ""}"></span>`;
    d.children[0].textContent = a; d.children[1].textContent = b;
    d.setAttribute("aria-label", `${w.seat === me ? "Bạn" : "Máy"}: ${w.word}`);
    return d;
  }

  function renderChain(r, me) {
    const box = el.chain;
    if (box.dataset.round !== r.id) { box.textContent = ""; box.dataset.round = r.id; box.dataset.n = "0"; }
    box.querySelectorAll(".ghost, .ghost-arrow, .empty").forEach((x) => x.remove());
    let n = +box.dataset.n;
    if (n > r.chain.length) { box.textContent = ""; n = 0; }
    for (let i = n; i < r.chain.length; i++) {
      const prev = box.querySelector(".w.last");
      if (prev) { prev.classList.remove("last"); prev.lastElementChild.classList.add("lk"); }
      if (i > 0) box.append(Object.assign(document.createElement("span"), { className: "arrow" }));
      const d = tile(r.chain[i], i, r.chain, me);
      d.classList.add("last");
      if (fxWord != null && i === r.chain.length - 1) d.classList.add("new");
      box.append(d);
    }
    box.dataset.n = String(r.chain.length);
    fxWord = null;
    const last = box.querySelector(".w.last");
    box.querySelectorAll(".w.dead").forEach((x) => x.classList.remove("dead"));
    if (r.over && r.reason === "no-move" && last) last.classList.add("dead");
    if (!r.chain.length && !r.over) {
      const e = document.createElement("div"); e.className = "empty";
      e.innerHTML = r.turn === me ? "Bạn mở màn! Gõ <b>một từ ghép 2 tiếng</b> bất kỳ, vd: <b>học tập</b>." : "Máy mở màn — chờ một chút…";
      box.append(e);
    }
    if (!r.over && r.turn !== me) {
      if (r.chain.length) box.append(Object.assign(document.createElement("span"), { className: "arrow ghost-arrow" }));
      const g = document.createElement("span"); g.className = "w ghost";
      g.innerHTML = '<span class="sy dots"><i></i><i></i><i></i></span>'; g.setAttribute("aria-label", "Máy đang nghĩ");
      box.append(g);
    }
    box.scrollTop = box.scrollHeight;
  }

  function endLine(r, me) {
    const won = r.winner === me, last = r.chain[r.chain.length - 1];
    const title = won ? "Bạn thắng!" : "Máy thắng!";
    let sub = "";
    if (r.reason === "no-move") sub = `“${last.word}” là từ cụt — không còn từ nào bắt đầu bằng “${syl(last.word)[1]}”.`;
    else if (r.reason === "timeout") sub = won ? "Máy hết giờ." : "Bạn hết 15 giây mà chưa nối được.";
    else if (r.reason === "resign") sub = won ? "Máy bí từ, chịu thua." : "Bạn đã chịu thua.";
    return { title, sub };
  }

  function showEnd(r, me) {
    endShownFor = r.id;
    const { title, sub } = endLine(r, me), won = r.winner === me;
    el.eTitle.textContent = title; el.eSub.textContent = sub + (r.chain.length ? ` Chuỗi dài ${r.chain.length} từ.` : "");
    el.eAv.src = won ? "assets/avatar/ngua-do-mung-thang-1.png" : "assets/avatar/ngua-xanh-duong-mung-thang-1.png";
    el.eResult.innerHTML = `<div class="r0"><small>Bạn</small><b>${state.score[me]}</b></div><div class="r1"><small>Máy</small><b>${state.score[1 - me]}</b></div>`;
    el.eNext.textContent = `Ván sau: ${won ? "máy" : "bạn"} đi trước (người thua đi trước).`;
    show(el.ovEnd);
    setTimeout(() => { if (!el.ovEnd.hidden) el.next.focus({ preventScroll: true }); }, 50);
  }

  // ---------- đồng hồ: chỉ hiển thị session.remainingMs() (giờ trọng tài + bù lệch), không tự đếm ----------
  function loop() {
    cancelAnimationFrame(raf);
    const tick = () => {
      if (destroyed || !session) return;
      drawClock();
      raf = requestAnimationFrame(tick);
    };
    tick();
  }
  function drawClock() {
    const r = state?.round, rem = session?.remainingMs();
    const me = session?.mySeat ?? ME;
    if (!r || r.over || rem == null) {
      el.clock.className = "clock idle"; el.cNum.textContent = r?.over ? "—" : String(Math.round((state?.config.turnMs ?? 15000) / 1000));
      el.cLbl.textContent = r?.over ? "Hết ván" : "Thời gian"; lastSec = null; return;
    }
    const total = state.config.turnMs, sec = Math.ceil(rem / 1000);
    el.clock.className = "clock " + (r.turn === me ? "me" : "bot") + (rem <= 5000 && r.turn === me ? " low" : "");
    el.cLbl.textContent = r.turn === me ? "Lượt bạn" : "Lượt máy";
    el.cFill.style.width = `calc(${Math.max(0, Math.min(1, rem / total)) * 100}% - 4px)`;
    if (sec !== lastSec) { el.cNum.textContent = String(sec); el.clock.dataset.ms = String(Math.round(rem)); lastSec = sec; }
  }

  // ---------- người chơi ----------
  function wordFrom(raw) {
    // gõ tắt một tiếng + đọc được chữ gõ khi CHƯA bật bộ gõ tiếng Việt ("hocj taapj", "ho5c ta6p5", "hoc tap").
    // Chỉ đổi khi ra đúng một từ có trong từ điển; trọng tài vẫn kiểm đầy đủ như mọi từ khác.
    const last = state?.round?.chain.at(-1);
    lastGuess = guessWord(raw, dict, last ? syl(last.word)[1] : "");
    return lastGuess.word;
  }

  let lastGuess = null;
  async function submit() {
    const r = state?.round;
    if (!session || !r || r.over || busy) return;
    if (r.turn !== (session.mySeat ?? ME)) { setMsg("Chưa tới lượt bạn — chờ máy nối xong.", "bad"); return; }
    const word = wordFrom(el.inp.value);
    if (!word) { setMsg("Gõ một từ trước đã.", "bad"); shake(); return; }
    busy = true; setSendOff(true); t.submits++;
    const res = await session.submit(word);
    busy = false; t.results.push(res);
    if (!session) return;
    if (res.ok) { el.inp.value = ""; setMsg(""); }
    else if (res.reason !== "disposed" && res.reason !== "not-ready") {
      if (res.reason === "not-in-dict" && res.key) noteMissing(res.key);
      let m = (REASON[res.reason] || (() => "Không nhận từ này."))(res);
      if (res.reason === "not-in-dict" && /^[a-z0-9\s]+$/i.test(el.inp.value.trim()))
        m = lastGuess?.candidates?.length > 1 ? `Có nhiều từ: ${lastGuess.candidates.map((c) => `“${c}”`).join(", ")} — gõ có dấu giúp nhé.`
          : `${m} Gõ có dấu (bật bộ gõ tiếng Việt) để chắc chắn nhé.`;
      setMsg(m, "bad");
      sfx.play("trung-da", 0.4); shake();
    }
    render();
  }

  function noteMissing(key) {
    const list = loadJSON(MISSING_KEY, []);
    if (!list.includes(key)) { list.push(key); store.set(MISSING_KEY, JSON.stringify(list.slice(-200))); }
  }

  function resign() {
    const r = state?.round;
    if (!r || r.over) return;
    if (!armTimer) { // hai bước để khỏi bấm nhầm
      el.resign.classList.add("armed"); el.resign.textContent = "Chắc chưa? Bấm lần nữa";
      armTimer = setTimeout(disarm, 3000); return;
    }
    disarm(); session.resign();
  }
  function disarm() { clearTimeout(armTimer); armTimer = null; el.resign.classList.remove("armed"); el.resign.textContent = "Chịu thua"; }

  function rematch() { hide(el.ovEnd); viewing = false; session?.rematch(); }

  // ---------- menu / tạm dừng ----------
  function showMenu(note = "") {
    const live = session && state?.round && !state.round.over;
    if (session) closeSession();       // tạm dừng THẬT: trọng tài dừng, log đã lưu; chơi tiếp ⇒ tính giờ lại lượt đang dở
    const sv = savedMatch();
    el.resume.hidden = !sv;
    el.start.classList.toggle("btn--primary", !sv);
    el.start.textContent = sv ? "Trận mới" : "▶ Bắt đầu";
    el.mNote.textContent = note || (sv ? `Trận đang lưu: ván ${sv.roundNo}, tỉ số Bạn ${sv.score[0]} – ${sv.score[1]} Máy${sv.over ? "" : " (ván đang dở — chơi tiếp được tính lại 15 giây)"}.` : "");
    if (live) el.mNote.textContent = "Đã tạm dừng — đồng hồ đứng yên. " + el.mNote.textContent;
    syncSeg();
    hide(el.ovEnd); show(el.ovMenu); setInert(true);
    el.clock.className = "clock idle";
    setTimeout(() => (sv ? el.resume : el.start).focus({ preventScroll: true }), 30);
  }

  function syncSeg() {
    for (const b of root.querySelectorAll('.seg[data-k="level"] button')) b.setAttribute("aria-checked", String(b.dataset.v === prefs.level));
  }
  function savePrefs() { store.set(PREFS_KEY, JSON.stringify(prefs)); }

  // ---------- tiện ích ----------
  // không dùng thuộc tính disabled: nút submit bị disabled sẽ chặn Enter trong ô nhập (form implicit submission) và làm mobile mất bàn phím
  function setSendOff(off) { el.send.setAttribute("aria-disabled", off ? "true" : "false"); }
  function setMsg(text, kind = "") { el.msgTxt.textContent = text; el.msg.classList.toggle("bad", kind === "bad"); el.msg.classList.toggle("ok", kind === "ok"); }
  function shake() { const f = el.inp.parentElement; f.classList.remove("shake"); void f.offsetWidth; f.classList.add("shake"); }
  function show(x) { x.hidden = false; } function hide(x) { x.hidden = true; }
  function setInert(on) { el.dock.inert = on; el.chain.inert = on; }
  function showMute() {
    const m = !!sdk.sound.muted;
    el.muteBtn.setAttribute("aria-pressed", String(m)); el.muteBtn.setAttribute("aria-label", m ? "Bật âm thanh" : "Tắt âm thanh");
    el.muteIc.src = m ? "assets/ui/icon-am-thanh-tat.png" : "assets/ui/icon-am-thanh-bat.png";
  }
  function toggleMute() { sdk.sound.muted = !sdk.sound.muted; store.set("wgp.muted", sdk.sound.muted ? "1" : "0"); showMute(); }

  // ---------- gắn sự kiện ----------
  el.form.addEventListener("submit", (e) => { e.preventDefault(); submit(); });
  el.resign.addEventListener("click", resign);
  el.next.addEventListener("click", rematch);
  el.next2.addEventListener("click", rematch);
  el.view.addEventListener("click", () => { viewing = true; hide(el.ovEnd); el.next2.focus({ preventScroll: true }); });
  el.menuBtn.addEventListener("click", () => (el.ovMenu.hidden ? showMenu() : (session ? (hide(el.ovMenu), setInert(false)) : null)));
  el.muteBtn.addEventListener("click", toggleMute);
  el.resume.addEventListener("click", () => openSession(false));
  el.start.addEventListener("click", () => openSession(true));
  for (const b of root.querySelectorAll('.seg[data-k="level"] button')) b.addEventListener("click", () => { prefs.level = b.dataset.v; savePrefs(); syncSeg(); });
  const onKey = (e) => {
    if (e.key === "Escape") { e.preventDefault(); if (el.ovMenu.hidden) showMenu(); else if (session) { hide(el.ovMenu); setInert(false); } }
  };
  window.addEventListener("keydown", onKey);
  // chuyển tab / tắt màn hình điện thoại giữa ván ⇒ tự tạm dừng (không bị xử thua vì hết giờ khi không nhìn)
  const onVis = () => { if (document.hidden && session && state?.round && !state.round.over) showMenu(); };
  document.addEventListener("visibilitychange", onVis);
  // bàn phím ảo mở / xoay máy làm khung chuỗi thấp lại ⇒ luôn giữ từ mới nhất trong tầm nhìn
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => { el.chain.scrollTop = el.chain.scrollHeight; }) : null;
  ro?.observe(el.chain);
  showMute();

  return {
    ready,
    get session() { return session; },
    get state() { return state; },
    get dict() { return dict; },
    t, sfx, prefs,
    destroy() { destroyed = true; closeSession(); sfx.close(); window.removeEventListener("keydown", onKey); ro?.disconnect(); document.removeEventListener("visibilitychange", onVis); },
  };
}
