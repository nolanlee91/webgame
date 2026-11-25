// Nối Từ — giao diện. Chỉ biết interface MatchSession (session/client.js): state / event / status, submit, resign,
// rematch, remainingMs. KHÔNG import core/rules hay core/ai và KHÔNG tự tính giờ: thắng thua, hết giờ, bot đều do
// trọng tài quyết. Hai chế độ chỉ khác nơi trọng tài chạy:
//   · Chơi với máy: createLocalSession — trọng tài chạy ngay trong trang (openSession()).
//   · Online (phòng 2 người): openOnline — trọng tài chạy trên máy chủ (games-server/noi-tu), trang chỉ gửi ý định (openRoom()).
import { createDict } from "./core/dict.js";
import { createLocalSession } from "./session/local.js";
import { openOnline } from "./session/online.js";
import { sharedName, sessionId, initKick, kickButtonHTML, KICKED_TEXT, BANNED_TEXT, KICK_ERR } from "../_shared/online-kit.js?v=ok2"; // tên dùng chung + "Mời ra"
import { guessWord } from "./core/input.js";
import { isChatOff, initChatOff } from "../_shared/chat-off.js?v=co1";   // trợ giúp nhập liệu (Telex/VNI thô, không dấu) — không phải luật

const STORE_KEY = "noi-tu:local";
const PREFS_KEY = "noi-tu:prefs";
const MISSING_KEY = "noi-tu:missing";      // từ người chơi gõ mà từ điển chưa có ⇒ người duyệt bổ sung sau (không tự thêm)
const ROOM_KEY = "noi-tu:room";            // phòng online đang chơi {code, token} — để tải lại trang vẫn vào lại đúng ghế
const ME = 0;                               // chơi với máy: người chơi luôn ngồi ghế 0 (màu Đỏ), máy ghế 1 (màu Xanh dương)
const CHAT_KEEP = 50;
const CHAT_ERR = { "chat-slow": "Bạn nhắn nhanh quá — chờ một giây rồi gửi tiếp.", "chat-empty": "Tin nhắn trống." };
const ONLINE_ERR = {
  offline: "Không kết nối được máy chủ online (chế độ online có thể chưa bật trên máy chủ này).",
  "no-room": "Không thấy phòng — kiểm tra lại mã (phòng bỏ trống 5 phút sẽ tự đóng).",
  "no-seat": "Phòng này không còn ghế của bạn nữa.",
  full: "Phòng đã đủ 2 người.",
  "name-taken": "Tên này trùng với chủ phòng — đổi tên khác nhé.",
  name: "Nhập tên của bạn trước đã.",
  busy: "Máy chủ đang bận (hoặc bạn mở quá nhiều phòng). Thử lại sau chút nữa.",
  loading: "Máy chủ đang khởi động — thử lại sau vài giây.",
  banned: BANNED_TEXT,
};

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
  "seat-taken-by-bot": () => "Máy đang giữ ghế của bạn — ván sau bạn sẽ được chơi lại.",
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
    ovMenu: $("ovMenu"), resume: $("resumeBtn"), start: $("startBtn"), mNote: $("mNote"), vEntry: $("vEntry"), vSolo: $("vSolo"), solo: $("soloBtn"), soloBack: $("soloBack"),
    ovEnd: $("ovEnd"), eAv: $("eAv"), eTitle: $("eTitle"), eSub: $("eSub"), eResult: $("eResult"), eNext: $("eNext"), next: $("nextBtn"), view: $("viewBtn"),
    menuBtn: $("menuBtn"), muteBtn: $("muteBtn"), muteIc: $("muteIc"),
    oName: $("oName"), oCode: $("oCode"), enter: $("enterBtn"), create: $("createBtn"),
    mLobby: $("mLobby"), lCode: $("lCode"), lWait: $("lWait"), copy: $("copyBtn"), cancel: $("cancelBtn"), mRoom: $("mRoom"), mCard: $("mCard"), back: $("backBtn"), leave: $("leaveBtn"),
    wrap: root.querySelector(".wrap"), chat: $("chat"), chatLog: $("chatLog"), chatForm: $("chatForm"), chatInp: $("chatInp"), chatNote: $("chatNote"),
    chatWho: $("chatWho"), chatBtn: $("chatBtn"), chatBadge: $("chatBadge"), chatClose: $("chatClose") };
  const sfx = makeSfx("assets/sfx/", ["buoc-nhay", "trung-da", "thang", "thua", "qua-man", "het-gio", "do-xuc-xac", "tin-nhan"], sdk);
  const prefs = { level: "easy", name: "", ...loadJSON(PREFS_KEY, {}) };   // level: chọn cho trận mới · matchLevel: của trận đang lưu
  const invite = (new URLSearchParams(location.search).get("p") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
  const ss = { get: (k) => { try { return JSON.parse(sessionStorage.getItem(k)); } catch { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* bỏ qua */ } }, remove: (k) => { try { sessionStorage.removeItem(k); } catch { /* bỏ qua */ } } };

  let dict = null, session = null, state = null, offs = [];
  let mode = "bot";           // chế độ của ván đang mở: "bot" | "online"
  let online = null;          // kết nối phòng online (openOnline) — còn sống cả lúc ở phòng chờ
  let chatItems = [], unread = 0;   // tin nhắn của phòng hiện tại (chỉ trong bộ nhớ, mất khi rời phòng)
  let fxWord = null;          // seq của sự kiện "played" mới (để chỉ thẻ đó có hiệu ứng rơi; snapshot thì không)
  let busy = false;           // đang chờ kết quả submit
  let armTimer = null, raf = 0, destroyed = false, lastSec = null, endShownFor = null, viewing = false;
  const t = { submits: 0, results: [] }; // dấu vết cho test

  // ---------- phiên chơi ----------
  const ready = fetch(new URL("data/words.json", import.meta.url))
    .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then((j) => {
      dict = createDict(j); if (j.contentHash && j.contentHash !== dict.contentHash) console.warn("words.json: contentHash lệch nội dung");
      const saved = ss.get(ROOM_KEY);
      if (saved?.code && saved?.token) openRoom({ t: "resume", code: saved.code, token: saved.token }); // tải lại trang giữa ván online
      else showMenu();
    })
    .catch((e) => { el.mNote.innerHTML = `<span class="err">Không tải được từ điển (${e.message}). Tải lại trang thử nhé.</span>`; el.start.disabled = true; el.solo.disabled = true; });

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
    mode = "bot";
    attach(createLocalSession({ dict, mode: "bot", botLevel: level, names: ["Bạn", "Máy"], storage: store, storageKey: STORE_KEY }));
    sfx.play("qua-man", 0.5); // vào trận với máy
  }

  function attach(sess) {
    session = sess;
    state = null; endShownFor = null; viewing = false; fxWord = null; el.chain.textContent = ""; el.chain.dataset.round = "";
    offs = [session.on("state", onState), session.on("event", onEvent), session.on("status", onStatus)];
    hide(el.ovMenu); setInert(false); el.wrap.classList.remove("is-entry");   // vào ván ⇒ hiện lại HUD + khay nhập
    loop();
  }

  // ---------- online: phòng 2 người qua mã ----------
  function openRoom(action) {
    closeSession(); leaveRoom();
    mode = "online";
    const url = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws/noi-tu`;
    el.mNote.textContent = action.t === "resume" ? "Đang vào lại phòng…" : "Đang kết nối máy chủ…";
    setBusyMenu(true);
    const o = online = openOnline({
      dict, url, action, sid: sessionId(),
      onRoom(room) {
        if (o !== online) return;
        ss.set(ROOM_KEY, { code: room.code, token: room.token });
        setBusyMenu(false);
        setChat(true); renderChatWho();
        if (!room.started) showLobby(room);
      },
      onStart(sess) { if (o !== online) return; history.replaceState(null, "", location.pathname); attach(sess); sfx.play("qua-man", 0.5); }, // bạn kia vào ⇒ ván bắt đầu
      onError(code) {
        if (o !== online) return;
        online = null; ss.remove(ROOM_KEY); setBusyMenu(false); setChat(false);
        closeSession(); mode = "online"; showMenu(ONLINE_ERR[code] || `Lỗi online (${code}).`, true);
      },
      onChatLog(items) { if (o !== online) return; chatItems = items.slice(-CHAT_KEEP); renderChat(); },
      onChat(m) {
        if (o !== online) return;
        chatItems.push(m); if (chatItems.length > CHAT_KEEP) chatItems.shift();
        renderChat();
        if (m.seat !== online.room?.seat && !isChatOff()) {
          sfx.play("tin-nhan", 0.6);
          if (!chatVisible()) { unread++; showUnread(); }
        }
      },
      onChatErr(code) { if (o !== online) return; flashChatNote(CHAT_ERR[code] || "Không gửi được tin nhắn."); },
      onEnd(reason) {
        if (o !== online) return;
        online = null; setChat(false); closeSession(); mode = "online";
        if (reason === "kicked") ss.remove(ROOM_KEY);
        showMenu(reason === "replaced" ? "Bạn đã mở ván này ở tab/máy khác — tab này dừng lại." : reason === "kicked" ? KICKED_TEXT : "Đã rời phòng.", true);
      },
      onReset(room) { // mình (chủ phòng) vừa mời người kia ra ⇒ bỏ ván cũ, về màn chờ người mới (vẫn giữ phòng + mã)
        if (o !== online) return;
        session = null; closeSession(); state = null; hide(el.ovEnd);
        showLobby(room);
      },
    });
  }

  /** Rời phòng hẳn (báo máy chủ). Đang giữa ván ⇒ sau 30 giây máy sẽ thay ghế cho bạn kia chơi tiếp. */
  function leaveRoom() {
    if (!online) return;
    const o = online; online = null; ss.remove(ROOM_KEY); setChat(false);
    if (session && mode === "online") closeSession(); else o.leave();
  }

  function showLobby(room) {
    setView("lobby"); show(el.ovMenu); setInert(true); hide(el.ovEnd);
    el.lCode.textContent = room.code;
    el.lWait.textContent = `Bạn là ${room.names[room.seat]} — đang chờ bạn kia vào phòng… (giữ trang này mở)`;
    el.mNote.textContent = "";
  }

  // ---------- trò chuyện (online) — tin đi qua máy chủ; tên/ghế người gửi do máy chủ gắn ----------
  function chatVisible() { return !el.chat.hidden && getComputedStyle(el.chat).display !== "none"; }
  function setChat(on) {
    el.chat.hidden = !on; el.wrap.classList.toggle("has-chat", on);
    if (!on) { chatItems = []; unread = 0; el.chatLog.textContent = ""; el.wrap.classList.remove("chat-open"); el.chatBtn.setAttribute("aria-expanded", "false"); }
    showUnread(); renderChat();
  }
  function openChat(open) {
    el.wrap.classList.toggle("chat-open", open); el.chatBtn.setAttribute("aria-expanded", String(open));
    if (open) { unread = 0; showUnread(); el.chatLog.scrollTop = el.chatLog.scrollHeight; el.chatInp.focus({ preventScroll: true }); }
    else el.chatBtn.focus({ preventScroll: true });
  }
  function showUnread() { el.chatBadge.hidden = !unread; el.chatBadge.textContent = unread > 9 ? "9+" : String(unread); }
  function renderChatWho() {
    const r = online?.room; if (!r) return;
    const other = r.names[1 - r.seat];
    el.chatWho.textContent = other ? `với ${other}` : "chờ bạn kia vào…";
  }
  function renderChat() {
    const off = isChatOff(), send = el.chatForm.querySelector('[type="submit"]');
    el.chatInp.disabled = off; if (send) send.disabled = off;
    if (!el.chatInp.dataset.ph) el.chatInp.dataset.ph = el.chatInp.placeholder;
    el.chatInp.placeholder = off ? "Chat đang tắt" : el.chatInp.dataset.ph;
    if (off && unread) { unread = 0; showUnread(); }
    if (el.chat.hidden) return;
    const mine = online?.room?.seat;
    el.chatLog.replaceChildren(...(chatItems.length ? chatItems.map((m) => {
      const li = document.createElement("li"); li.className = `s${m.seat}${m.seat === mine ? " me" : ""}`;
      const b = document.createElement("b"); b.textContent = m.seat === mine ? "Bạn" : m.name;
      li.append(b, document.createTextNode(m.text)); return li;    // textContent ⇒ không chèn được HTML
    }) : [Object.assign(document.createElement("li"), { className: "sys", textContent: "Chưa có tin nhắn. Chào bạn kia một câu nhé!" })]));
    el.chatLog.scrollTop = el.chatLog.scrollHeight;
  }
  let noteT = null;
  function flashChatNote(s) { el.chatNote.textContent = s; clearTimeout(noteT); noteT = setTimeout(() => { el.chatNote.textContent = ""; }, 3000); }

  function setBusyMenu(on) { for (const b of [el.create, el.enter]) b.setAttribute("aria-disabled", on ? "true" : "false"); }
  // tên dùng chung toàn site (_shared/online-kit.js): sửa ở đây ⇒ mọi game + bảng xếp hạng cùng đổi; prefs.name vẫn ghi (bản cũ)
  function myName() { const n = names.commit(el.oName.value); prefs.name = n; savePrefs(); return n; }

  function closeSession() {
    for (const off of offs) off();
    offs = [];
    if (session) session.dispose();   // dừng trọng tài + mọi hẹn giờ (online: báo máy chủ rời phòng)
    session = null; busy = false;
    cancelAnimationFrame(raf);
  }

  // ---------- sự kiện từ trọng tài ----------
  function onEvent(ev) {
    const ME = me();
    if (ev.type === "played") {
      fxWord = ev.seq;
      sfx.play(ev.seat === ME ? "buoc-nhay" : "do-xuc-xac", ev.seat === ME ? 0.7 : 0.35);
    } else if (ev.type === "roundEnded") {
      sfx.play(ev.winner === ME ? "thang" : (ev.reason === "timeout" ? "het-gio" : "thua"), 0.8);
      sdk.gameOver?.({ winner: ev.winner === ME ? "player" : (mode === "online" ? "opponent" : "bot"), reason: ev.reason, mode });
    } else if (ev.type === "roundStarted" && ev.seq > 2) {
      sfx.play("qua-man", 0.5);
    }
  }

  let lastNetStatus = "";
  function onStatus(s) {
    if (s === "closed" && session?.rejectReason) {
      if (mode === "online") { const why = session.rejectReason; leaveRoom(); showMenu(why === "pin-mismatch" ? "Từ điển của trang khác bản máy chủ — tải lại trang (Ctrl+F5) rồi vào lại phòng." : `Không vào được ván (${why}).`, true); }
      else showMenu(`Không vào được ván (${session.rejectReason}). Bấm “Trận mới”.`);
      return;
    }
    if (mode !== "online" || !state) return;
    if (s === "reconnecting") setMsg("Mất kết nối — đang nối lại…", "bad");
    else if (s === "opponent-left") (sfx.play("trung-da", 0.35), setMsg(`${opp()} vừa mất kết nối — chờ tối đa 30 giây, sau đó máy sẽ đánh thay.`, "bad"));
    else if (s === "live") { if (lastNetStatus === "opponent-left" || lastNetStatus === "reconnecting") sfx.play("buoc-nhay", 0.5); setMsg(""); render(); }
    lastNetStatus = s;
  }

  const me = () => session?.mySeat ?? ME;
  const opp = () => state?.seats[1 - me()]?.name ?? (mode === "online" ? "Bạn kia" : "Máy");

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
    const me = session.mySeat ?? ME, bot = 1 - me, O = s.seats[bot].name;
    el.n[me].textContent = mode === "online" ? `${s.seats[me].name} (bạn)` : s.seats[me].name;
    if (mode === "online") el.n[bot].textContent = O;
    else { const lv = document.createElement("span"); lv.className = "lv"; lv.textContent = ` · ${(prefs.matchLevel || prefs.level) === "hard" ? "Khó" : "Dễ"}`; el.n[bot].replaceChildren(O, lv); } // điện thoại hẹp: ẩn mức (CSS .lv)
    for (const i of [0, 1]) { el.s[i].textContent = s.score[i]; el.av[i].textContent = initial(s.seats[i].name); }
    sdk.reportScore?.(s.score[me]);
    if (!r) return;
    el.round.textContent = `Ván ${r.no}`;
    el.first.textContent = r.first === me ? "Bạn đi trước" : `${O} đi trước`;
    const myTurn = !r.over && r.turn === me;
    for (const i of [0, 1]) {
      el.pl[i].classList.toggle("on", !r.over && r.turn === i);
      el.pl[i].classList.toggle("win", r.over && r.winner === i);
    }
    el.status.textContent = r.over ? (r.winner === me ? "Bạn thắng ván" : `${O} thắng ván`) : myTurn ? "Lượt bạn" : `${O} đang nghĩ…`;
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
      el.overTxt.textContent = endLine(r, me).title + " " + endLine(r, me).sub + rematchLine(me);
      el.eNext.textContent = nextLine(r, me);
      if (endShownFor !== r.id && !viewing) showEnd(r, me);
      el.inp.blur();
    } else {
      hide(el.ovEnd); endShownFor = null; viewing = false;
      if (myTurn && el.ovMenu.hidden && document.activeElement !== el.inp && matchMedia("(hover: hover)").matches) el.inp.focus({ preventScroll: true });
      const waitTxt = `${O} đang tìm từ nối…`;
      if (!myTurn && !busy && !el.msg.classList.contains("bad")) setMsg(waitTxt);
      if (myTurn && el.msgTxt.textContent === waitTxt) setMsg(last ? `Tới lượt bạn — nối tiếp “${syl(last.word)[1]}”.` : "Tới lượt bạn — gõ từ mở đầu.");
    }
  }

  function tile(w, i, chain, me) {
    const [a, b] = syl(w.word);
    const d = document.createElement("span");
    d.className = `w w--${w.seat}`;   // màu theo ghế — khớp huy hiệu trên HUD và khung chat
    d.dataset.seat = w.seat;
    d.innerHTML = `<span class="sy${i > 0 ? " lk" : ""}"></span><span class="sy${i < chain.length - 1 ? " lk" : ""}"></span>`;
    d.children[0].textContent = a; d.children[1].textContent = b;
    d.setAttribute("aria-label", `${w.seat === me ? "Bạn" : opp()}: ${w.word}`);
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
      if (r.turn === me) e.innerHTML = "Bạn mở màn! Gõ <b>một từ ghép 2 tiếng</b> bất kỳ, vd: <b>học tập</b>.";
      else e.textContent = `${opp()} mở màn — chờ một chút…`;
      box.append(e);
    }
    if (!r.over && r.turn !== me) {
      if (r.chain.length) box.append(Object.assign(document.createElement("span"), { className: "arrow ghost-arrow" }));
      const g = document.createElement("span"); g.className = "w ghost";
      g.innerHTML = '<span class="sy dots"><i></i><i></i><i></i></span>'; g.setAttribute("aria-label", `${opp()} đang nghĩ`);
      box.append(g);
    }
    box.scrollTop = box.scrollHeight;
  }

  function endLine(r, me) {
    const won = r.winner === me, last = r.chain[r.chain.length - 1];
    const O = opp(), title = won ? "Bạn thắng!" : `${O} thắng!`;
    let sub = "";
    if (r.reason === "no-move") sub = `“${last.word}” là từ cụt — không còn từ nào bắt đầu bằng “${syl(last.word)[1]}”.`;
    else if (r.reason === "timeout") sub = won ? `${O} hết giờ.` : "Bạn hết 15 giây mà chưa nối được.";
    else if (r.reason === "resign") sub = won ? (mode === "online" ? `${O} chịu thua.` : "Máy bí từ, chịu thua.") : "Bạn đã chịu thua.";
    return { title, sub };
  }

  // chơi lại online cần CẢ HAI bấm — báo đang chờ ai
  function rematchLine(me) {
    const rm = state?.rematch; if (mode !== "online" || !rm) return "";
    return rm[me] && !rm[1 - me] ? ` Đang chờ ${opp()} bấm chơi tiếp…` : !rm[me] && rm[1 - me] ? ` ${opp()} muốn chơi tiếp!` : "";
  }
  function nextLine(r, me) {
    const won = r.winner === me;
    return `Ván sau: ${won ? opp() : "bạn"} đi trước (người thua đi trước).${rematchLine(me)}`;
  }

  function showEnd(r, me) {
    endShownFor = r.id;
    const { title, sub } = endLine(r, me), won = r.winner === me;
    el.eTitle.textContent = title; el.eSub.textContent = sub + (r.chain.length ? ` Chuỗi dài ${r.chain.length} từ.` : "");
    el.eAv.className = `av av--${r.winner}`; el.eAv.textContent = initial(state.seats[r.winner]?.name);
    el.eResult.innerHTML = '<div class="r0"><small></small><b></b></div><div class="r1"><small></small><b></b></div>';
    const [c0, c1] = el.eResult.children;
    c0.children[0].textContent = "Bạn"; c0.children[1].textContent = String(state.score[me]);
    c1.children[0].textContent = opp(); c1.children[1].textContent = String(state.score[1 - me]);
    el.eNext.textContent = nextLine(r, me);
    // chủ phòng (ghế 0) online: "Mời ra" người kia khi ván đã xong (máy chủ kiểm lại quyền + ván xong)
    el.ovEnd.querySelector(".pxk")?.remove();
    if (mode === "online" && me === 0 && state.seats[1]?.kind === "human") el.next.parentElement.insertAdjacentHTML("beforeend", kickButtonHTML(1, opp()));
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
    el.cLbl.textContent = r.turn === me ? "Lượt bạn" : (mode === "online" ? "Lượt bạn kia" : "Lượt máy");
    el.cFill.style.width = `calc(${Math.max(0, Math.min(1, rem / total)) * 100}% - 4px)`;
    if (sec !== lastSec) {
      el.cNum.textContent = String(sec); el.clock.dataset.ms = String(Math.round(rem)); lastSec = sec;
      if (r.turn === me && sec > 0 && sec <= 5) sfx.play("do-xuc-xac", 0.25); // 5 giây cuối lượt của bạn
    }
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
    if (r.turn !== (session.mySeat ?? ME)) { setMsg(`Chưa tới lượt bạn — chờ ${opp()} nối xong.`, "bad"); return; }
    const word = wordFrom(el.inp.value);
    if (!word) { setMsg("Gõ một từ trước đã.", "bad"); sfx.play("trung-da", 0.4); shake(); return; }
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

  function rematch() { hide(el.ovEnd); viewing = false; session?.rematch().then(() => state && render()); }

  // ---------- menu / tạm dừng ----------
  // Các bước của thẻ menu: "entry" (màn đầu chuẩn của cổng) · "solo" (bước 2 của Chơi với máy: độ khó + Bắt đầu)
  // · "lobby" (phòng chờ online) · "room" (menu giữa ván online). Màn đầu/solo: ẩn HUD + khay để thẻ chiếm trọn khung.
  function setView(v) {
    el.vEntry.hidden = v !== "entry"; el.vSolo.hidden = v !== "solo"; el.mLobby.hidden = v !== "lobby"; el.mRoom.hidden = v !== "room";
    el.mCard.dataset.view = v;
    el.wrap.classList.toggle("is-entry", v === "entry" || v === "solo");
  }

  function showMenu(note = "", keepMode = false) {
    if (session && mode === "online") {  // online: KHÔNG dừng ván (đối thủ vẫn chơi) — chỉ mở menu phòng
      setView("room"); el.mNote.textContent = note; show(el.ovMenu); setInert(true);
      setTimeout(() => el.back.focus({ preventScroll: true }), 30);
      return;
    }
    // đang chơi với máy (hoặc đang đứng ở bước đó) ⇒ mở thẳng bước "Chơi với máy" (có Chơi tiếp)
    const paused = session ? mode === "bot" : (!online && !el.ovMenu.hidden && el.mCard.dataset.view === "solo");
    if (!keepMode && !online) mode = "bot";
    const live = session && state?.round && !state.round.over;
    if (session) closeSession();       // tạm dừng THẬT: trọng tài dừng, log đã lưu; chơi tiếp ⇒ tính giờ lại lượt đang dở
    hide(el.ovEnd); show(el.ovMenu); setInert(true);
    el.clock.className = "clock idle";
    if (paused) showSolo(live ? "Đã tạm dừng — đồng hồ đứng yên. " : "");
    else showEntry(note);
  }

  function showEntry(note = "") {
    setView("entry");
    const sv = savedMatch();
    el.mNote.textContent = note || (invite ? `Bạn được mời vào phòng ${invite} — nhập tên rồi bấm “Vào phòng”.`
      : sv ? `Có trận với máy đang lưu (ván ${sv.roundNo}) — vào “Chơi với máy” để chơi tiếp.` : "");
    setTimeout(() => (invite ? (el.oName.value ? el.enter : el.oName) : el.oName.value ? el.create : el.oName).focus({ preventScroll: true }), 30);
  }

  function showSolo(prefix = "") {
    setView("solo");
    const sv = savedMatch();
    el.resume.hidden = !sv;
    el.start.classList.toggle("btn--primary", !sv);
    el.start.textContent = sv ? "Trận mới" : "▶ Bắt đầu";
    el.mNote.textContent = prefix + (sv ? `Trận đang lưu: ván ${sv.roundNo}, tỉ số Bạn ${sv.score[0]} – ${sv.score[1]} Máy${sv.over ? "" : " (ván đang dở — chơi tiếp được tính lại 15 giây)"}.` : "");
    syncSeg();
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
  // chữ cái đầu của tên cho huy hiệu người chơi ("Bạn" → B, "Máy" → M, "Lan" → L)
  function initial(name) { const c = [...String(name || "").trim()][0]; return c ? c.toLocaleUpperCase("vi") : "?"; }
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
  // Ô tên điền sẵn tên dùng chung (tài khoản); người cũ có tên riêng của game (prefs.name) được chuyển sang một lần.
  const names = sharedName({ game: "noi-tu", input: el.oName, legacy: () => prefs.name || "" });
  el.oCode.value = invite;
  initKick({ send: (o) => !!online?.send(o) });
  el.solo.addEventListener("click", () => { if (!el.solo.disabled) showSolo(); });
  el.soloBack.addEventListener("click", () => { showEntry(); setTimeout(() => el.solo.focus({ preventScroll: true }), 40); });
  const needName = () => { const n = myName(); if (!n) { el.mNote.textContent = ONLINE_ERR.name; el.oName.focus(); } return n; };
  el.create.addEventListener("click", () => { if (el.create.getAttribute("aria-disabled") === "true") return; const n = needName(); if (n) openRoom({ t: "create", name: n, public: !$("privateRoom").checked }); });
  const doEnter = () => {
    if (el.enter.getAttribute("aria-disabled") === "true") return;
    const code = el.oCode.value.trim().toUpperCase();
    if (code.length < 5) { el.mNote.textContent = "Mã phòng gồm 5 ký tự."; el.oCode.focus(); return; }
    const n = needName(); if (n) openRoom({ t: "enter", code, name: n });
  };
  el.enter.addEventListener("click", doEnter);
  el.oCode.addEventListener("keydown", (e) => { if (e.key === "Enter") doEnter(); });
  el.oName.addEventListener("keydown", (e) => { if (e.key === "Enter") (el.oCode.value.trim() ? doEnter() : el.create.click()); });
  el.copy.addEventListener("click", async () => {
    const link = `${location.origin}${location.pathname}?p=${el.lCode.textContent}`;
    try { await navigator.clipboard.writeText(link); el.copy.textContent = "Đã sao chép ✓"; } catch { el.copy.textContent = link; }
    setTimeout(() => { el.copy.textContent = "Sao chép link mời"; }, 2500);
  });
  el.cancel.addEventListener("click", () => { leaveRoom(); showMenu("Đã hủy phòng.", true); });
  el.back.addEventListener("click", () => { hide(el.ovMenu); setInert(false); });
  el.leave.addEventListener("click", () => { leaveRoom(); showMenu("Đã rời phòng.", true); });
  // "← Trang chủ" khi đang ở trong phòng online (phòng chờ hoặc đang đấu): báo máy chủ rời phòng rồi mới chuyển trang —
  // chủ phòng ở phòng chờ rời ⇒ phòng bị xoá; giữa ván ⇒ hỏi lại trước. Ngoài phòng thì link chạy bình thường.
  let exiting = false;
  function onHomeClick(e) {
    if (!online || e.defaultPrevented || e.button > 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (exiting) return;
    if (session && mode === "online" && state?.round && !state.round.over && !confirm("Rời ván đang chơi?")) return;
    const href = e.currentTarget.href;
    exiting = true; leaveRoom();
    setTimeout(() => { location.href = href; }, 150); // để lệnh "leave" kịp đi trước khi trang đóng kết nối
  }
  const homeLinks = [...document.querySelectorAll('a[href*="homepage"]')];
  homeLinks.forEach((a) => a.addEventListener("click", onHomeClick));
  el.muteBtn.addEventListener("click", toggleMute);
  initChatOff(() => renderChat()); // "Tắt chat" chung toàn trang
  el.chatBtn.addEventListener("click", () => openChat(!el.wrap.classList.contains("chat-open")));
  el.chatClose.addEventListener("click", () => openChat(false));
  el.chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = el.chatInp.value.trim(); if (!text || !online || isChatOff()) return;
    if (online.chat(text)) el.chatInp.value = ""; else flashChatNote("Mất kết nối — đang nối lại, gửi lại sau nhé.");
  });
  el.resume.addEventListener("click", () => openSession(false));
  el.start.addEventListener("click", () => openSession(true));
  for (const b of root.querySelectorAll('.seg[data-k="level"] button')) b.addEventListener("click", () => { prefs.level = b.dataset.v; savePrefs(); syncSeg(); });
  const onKey = (e) => {
    if (e.key === "Escape" && el.wrap.classList.contains("chat-open")) { e.preventDefault(); openChat(false); return; }
    if (e.key === "Escape") {
      e.preventDefault();
      if (el.ovMenu.hidden) showMenu();
      else if (session) { hide(el.ovMenu); setInert(false); }
      else if (!el.vSolo.hidden) el.soloBack.click();   // bước "Chơi với máy" ⇒ Esc = Quay lại
    }
  };
  window.addEventListener("keydown", onKey);
  // chuyển tab / tắt màn hình điện thoại giữa ván ⇒ tự tạm dừng (không bị xử thua vì hết giờ khi không nhìn)
  // (online thì KHÔNG: đối thủ vẫn đang chơi, ván không dừng được)
  const onVis = () => { if (document.hidden && mode === "bot" && session && state?.round && !state.round.over) showMenu(); };
  document.addEventListener("visibilitychange", onVis);
  // bàn phím ảo mở / xoay máy làm khung chuỗi thấp lại ⇒ luôn giữ từ mới nhất trong tầm nhìn
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => { el.chain.scrollTop = el.chain.scrollHeight; }) : null;
  ro?.observe(el.chain);
  showMute();

  return {
    ready,
    get session() { return session; },
    get mode() { return mode; },
    get state() { return state; },
    get dict() { return dict; },
    t, sfx, prefs,
    destroy() { destroyed = true; closeSession(); if (online) { online.leave(); online = null; } sfx.close(); window.removeEventListener("keydown", onKey); ro?.disconnect(); document.removeEventListener("visibilitychange", onVis); homeLinks.forEach((a) => a.removeEventListener("click", onHomeClick)); },
  };
}
