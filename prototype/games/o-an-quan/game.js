const $ = (id) => document.getElementById(id);
const key = "wgp.o-an-quan.session";
let saved;
try { saved = JSON.parse(sessionStorage.getItem(key)); } catch {}
const invite = (new URLSearchParams(location.search).get("room") || "").toUpperCase();
if (invite && saved?.code !== invite) saved = null;
$("code").value = invite;
$("name").value = saved?.name || "";
const teams = ["A", "B"];
const layout = [0, 11, 10, 9, 8, 7, 6, 1, 2, 3, 4, 5];
const explanations = {
  "no-room": "Phòng không còn hoạt động hoặc mã chưa đúng.",
  "no-seat": "Chỗ ngồi cũ đã hết hạn.",
  full: "Phòng đã đủ người hoặc ván đã bắt đầu.",
  waiting: "Hãy đợi mọi người kết nối.",
  turn: "Lượt đã thay đổi. Chọn lại ô để đi.",
  move: "Ô hoặc hướng rải không hợp lệ.",
  busy: "Máy chủ đang bận. Thử lại sau.",
  slow: "Bạn thao tác hơi nhanh. Thử lại sau.",
};
let state, socket, selected = null, pending = false;
let retry = 0, reconnectTimer;
const pits = new Map();

function note(message = "") { $("notice").textContent = message; }

function setSession(value) {
  saved = value;
  try {
    if (saved) sessionStorage.setItem(key, JSON.stringify(saved));
    else sessionStorage.removeItem(key);
  } catch {}
}

function send(message) {
  if (socket?.readyState !== WebSocket.OPEN) {
    note("Đang kết nối lại. Bạn thử lại sau giây lát.");
    return false;
  }
  socket.send(JSON.stringify(message));
  return true;
}

function readyToMove() {
  return state?.phase === "playing" && state.turn === state.you &&
    state.players.every((p) => p.connected) && socket?.readyState === WebSocket.OPEN && !pending;
}

for (const cell of layout) {
  const button = document.createElement("button");
  button.className = "pit";
  const stones = document.createElement("span");
  stones.className = "stones";
  stones.setAttribute("aria-hidden", "true");
  const count = document.createElement("span");
  count.setAttribute("aria-hidden", "true");
  button.append(stones, count);
  button.addEventListener("click", () => {
    if (!readyToMove()) return;
    selected = selected === cell ? null : cell;
    render();
  });
  if (cell % 6 === 0) {
    button.classList.add("quan");
    button.style.gridColumn = cell === 0 ? "1" : "7";
    button.style.gridRow = "1 / 3";
  }
  pits.set(cell, { button, stones, count });
  $("board").append(button);
}

function statusText() {
  if (socket?.readyState !== WebSocket.OPEN) return "Đang kết nối lại…";
  if (state.phase === "lobby") return `Đang chờ người chơi · ${state.players.length}/${state.max}`;
  if (state.phase === "over") {
    if (state.winner === null) return "Hòa!";
    return `Đội ${teams[state.winner]} thắng!${state.forfeit ? " Đội còn lại đã rời phòng." : ""}`;
  }
  if (state.players.some((p) => !p.connected)) return "Tạm dừng · Đang chờ người chơi kết nối lại.";
  if (readyToMove()) return selected === null ? "Lượt của bạn · Chọn một ô dân." : "Chọn hướng rải quân.";
  if (pending) return "Đang rải quân…";
  return `Đến lượt ${state.players[state.turn].name} · Đội ${teams[state.turn % 2]}`;
}

function render() {
  $("entry").hidden = Boolean(state);
  $("room").hidden = !state;
  if (!state) return;
  $("room-caption").textContent = `${state.max === 4 ? "2v2" : "1v1"} · Mã phòng ${state.code} · Bạn ở đội ${teams[state.you % 2]}`;
  $("status").textContent = statusText();
  for (let team = 0; team < 2; team++) {
    $("score" + team).textContent = state.game.scores[team];
    const members = state.players.flatMap((p, i) => {
      if (i % 2 !== team) return [];
      const li = document.createElement("li");
      const tag = i === state.you ? " · Bạn" : "";
      const presence = p.left ? " · Đã rời" : p.connected ? "" : " · Mất kết nối";
      li.textContent = `${teams[team]}${1 + Math.floor(i / 2)} · ${p.name}${tag}${presence}`;
      return [li];
    });
    $("team" + team).replaceChildren(...members);
  }
  for (const [cell, { button, stones, count }] of pits) {
    const n = state.game.pits[cell];
    const hasQuan = cell % 6 === 0 && state.game.quan[cell / 6];
    const side = cell % 6 === 0 ? -1 : cell < 6 ? 0 : 1;
    if (side !== -1) {
      button.style.gridRow = side === 0 ? "2" : "1";
      button.style.gridColumn = side === 0 ? cell + 1 : 13 - cell;
    }
    button.disabled = !readyToMove() || side !== state.you % 2 || n === 0;
    button.classList.toggle("selected", selected === cell);
    button.classList.toggle("trail", state.last?.trail.includes(cell) ?? false);
    button.setAttribute("aria-pressed", String(selected === cell));
    const label = side < 0 ? "Ô quan" : `Ô dân đội ${teams[side]}`;
    button.setAttribute("aria-label", `${label}, ${n} dân${hasQuan ? ", 1 quan" : ""}`);
    count.textContent = hasQuan ? `◆ ${n}` : n;
    count.classList.toggle("crown", hasQuan);
    stones.replaceChildren(...Array.from({ length: Math.min(n, 7) }, () => {
      const stone = document.createElement("i");
      stone.className = "stone";
      return stone;
    }));
  }
  $("directions").hidden = selected === null || !readyToMove();
  $("start").hidden = state.phase === "playing" || state.you !== state.host || state.players.some((p) => p.left);
  $("start").disabled = socket?.readyState !== WebSocket.OPEN ||
    state.players.length !== state.max || state.players.some((p) => !p.connected);
  $("start").textContent = state.phase === "over" ? "Chơi lại" : "Bắt đầu";
  const last = state.last;
  $("last").textContent = last ? `${state.players[last.by].name} ${last.captured ? "ăn được " + last.captured + " điểm" : "đã rải quân"}.` : "";
}

function connect() {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  socket = new WebSocket(protocol + "//" + location.host + "/ws/o-an-quan");
  socket.addEventListener("open", () => {
    retry = 0;
    if (saved) send({ t: "resume", code: saved.code, token: saved.token });
    else note();
    render();
  });
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.t === "joined") {
      setSession({ code: message.code, token: message.token, name: $("name").value });
      note();
    } else if (message.t === "state") {
      if (state?.revision !== message.v.revision) selected = null;
      state = message.v;
      pending = false;
      render();
    } else if (["left", "closed", "replaced", "kicked"].includes(message.t)) {
      setSession(null);
      state = null;
      selected = null;
      pending = false;
      if (message.t !== "left") note("Phiên phòng này đã kết thúc.");
      render();
    } else if (message.t === "err") {
      if (["no-room", "no-seat"].includes(message.code) && saved) {
        setSession(null);
        state = null;
      }
      pending = false;
      note(explanations[message.code] || "Không thực hiện được thao tác. Bạn thử lại nhé.");
      render();
    }
  });
  socket.addEventListener("close", () => {
    pending = false;
    render();
    clearTimeout(reconnectTimer);
    if (retry < 9) reconnectTimer = setTimeout(connect, Math.min(8000, 500 * 2 ** retry++));
    else note("Không kết nối được máy chủ. Tải lại trang để thử lại.");
  });
}

$("create").addEventListener("submit", (event) => {
  event.preventDefault();
  send({ t: "create", name: $("name").value, size: Number($("mode").value), public: !$("private").checked });
});
$("join").addEventListener("submit", (event) => {
  event.preventDefault();
  send({ t: "join", name: $("name").value, code: $("code").value });
});
$("start").addEventListener("click", () => send({ t: "start" }));
$("leave").addEventListener("click", () => {
  if (state.phase === "playing" && !confirm("Rời phòng lúc này sẽ xử thua đội bạn. Bạn muốn rời phòng?")) return;
  send({ t: "leave" });
});
$("copy").addEventListener("click", async () => {
  const url = new URL(location.pathname, location.origin);
  url.searchParams.set("room", state.code);
  try {
    await navigator.clipboard.writeText(url.href);
    note("Đã chép link mời.");
  } catch {
    note(`Mã phòng để gửi bạn bè: ${state.code}`);
  }
});
$("directions").addEventListener("click", (event) => {
  const dir = Number(event.target.dataset.dir);
  if (!dir || !readyToMove() || selected === null) return;
  pending = send({ t: "move", cell: selected, dir: state.you % 2 ? -dir : dir, revision: state.revision });
  render();
});
connect();
