// Cờ Tỷ Phú — Lụm Kèo Đại Phú: logic thuần (không DOM) để test bằng node và tái dùng khi lên online.
// Cùng khuôn với Cờ Cá Ngựa (co-ca-ngua/logic.js): RNG có seed (mulberry32), state machine theo pha,
// sự kiện đẩy vào g.events để UI phát hoạt ảnh. Bàn 40 ô, 0 = Xuất Phát (góc dưới phải), đi theo chiều kim đồng hồ.

export const TOKENS = [
  { id: "xich-lo-red", name: "Xích Lô", color: "#e0483d", seat: "Đỏ" },
  { id: "non-la-blue", name: "Nón Lá", color: "#3d7be0", seat: "Xanh dương" },
  { id: "ca-phe-phin-yellow", name: "Cà Phê Phin", color: "#f4c042", seat: "Vàng" },
  { id: "trau-vang-green", name: "Trâu Vàng", color: "#3fae4a", seat: "Xanh lá" },
];

// 8 nhóm màu × 4 ô = 32 ô đất. Mỗi cạnh 2 nhóm (trước/sau ô Kèo giữa cạnh). Đủ 4 ô một nhóm: thuê x2.
export const REGIONS = {
  tay: { name: "Miền Tây", color: "#4fa3e8" },
  sg: { name: "Sài Gòn", color: "#2e55b8" },
  tn: { name: "Tây Nguyên", color: "#f0c040" },
  ntb: { name: "Nam Trung Bộ", color: "#c98a1e" },
  trung: { name: "Miền Trung", color: "#3fc0a8" },
  btb: { name: "Bắc Trung Bộ", color: "#147a6a" },
  hn: { name: "Hà Nội", color: "#e8705a" },
  bac: { name: "Núi Rừng Phía Bắc", color: "#a8321e" },
};
const LANDS = [
  ["tay", [["Chợ Nổi Cái Răng", "Cái Răng"], ["Bến Ninh Kiều", "Ninh Kiều"], ["Cồn Phụng", "Cồn Phụng"], ["Rừng Tràm Trà Sư", "Trà Sư"]]],
  ["sg", [["Cơm Tấm Đêm", "Cơm Tấm"], ["Phố Bùi Viện", "Bùi Viện"], ["Phố Đi Bộ Nguyễn Huệ", "Nguyễn Huệ"], ["Chợ Bến Thành", "Bến Thành"]]],
  ["tn", [["Phố Núi Pleiku", "Pleiku"], ["Thác Dray Nur", "Dray Nur"], ["Bản Đôn", "Bản Đôn"], ["Hồ Xuân Hương", "Xuân Hương"]]],
  ["ntb", [["Ghềnh Đá Đĩa", "Đá Đĩa"], ["Tháp Bà Ponagar", "Ponagar"], ["Đồi Cát Mũi Né", "Mũi Né"], ["Vịnh Nha Trang", "Nha Trang"]]],
  ["trung", [["Cố Đô Huế", "Cố Đô Huế"], ["Chùa Thiên Mụ", "Thiên Mụ"], ["Phố Cổ Hội An", "Hội An"], ["Cầu Vàng Đà Nẵng", "Cầu Vàng"]]],
  ["btb", [["Động Phong Nha", "Phong Nha"], ["Biển Cửa Lò", "Cửa Lò"], ["Tam Cốc", "Tam Cốc"], ["Tràng An Ninh Bình", "Tràng An"]]],
  ["hn", [["Quán Trà Đá Vỉa Hè", "Trà Đá"], ["Ga Hàng Cỏ", "Hàng Cỏ"], ["Phố Cổ Hàng Đào", "Hàng Đào"], ["Hồ Gươm", "Hồ Gươm"]]],
  ["bac", [["Mù Cang Chải", "Mù Cang"], ["Thị Trấn Sa Pa", "Sa Pa"], ["Đỉnh Fansipan", "Fansipan"], ["Vịnh Hạ Long", "Hạ Long"]]],
];
const CORNERS = [{ type: "start", name: "Xuất Phát" }, { type: "jail", name: "Nhà Tù" }, { type: "bus", name: "Bến Xe Du Lịch" }, { type: "go-to-jail", name: "Vào Tù Ngay" }];
const SIDE_EVENT = ["keo-thoi", "keo-thom", "keo-thom", "keo-thoi"]; // khớp manifest: ô 5, 15, 25, 35
const mkLand = (gi, i) => { const [region, list] = LANDS[gi], [name, short] = list[i];
  return { type: "property", name, short, region, price: Math.round((60 + gi * 46 + i * 12) / 10) * 10 }; };

// 40 ô (11 ô/cạnh tính cả góc). Loại ô khớp asset-manifest.json (board.tiles).
export const TILES = [];
for (let side = 0; side < 4; side++) {
  TILES.push(CORNERS[side]);
  for (let i = 0; i < 4; i++) TILES.push(mkLand(side * 2, i));
  TILES.push({ type: SIDE_EVENT[side], name: SIDE_EVENT[side] === "keo-thom" ? "Kèo Thơm" : "Kèo Thối" });
  for (let i = 0; i < 4; i++) TILES.push(mkLand(side * 2 + 1, i));
}
export const N = TILES.length;
// Vị trí ô đặc biệt suy ra từ dữ liệu, để đổi sang bàn 40 ô chỉ cần thay TILES + manifest.
export const JAIL = TILES.findIndex((t) => t.type === "jail"), GO_TO_JAIL = TILES.findIndex((t) => t.type === "go-to-jail"), BUS = TILES.findIndex((t) => t.type === "bus");

export const RULES = { startCash: 1200, passStart: 200, maxRounds: 25, jailFine: 50, maxJailTries: 2, maxLevel: 3 };
export const LEVEL_NAMES = ["Đất trống", "Căn Nhà Gỗ", "Nhà Phố Mái Ngói", "Biệt Thự Lụm Kèo"];

// Tiền thuê theo cấp (0 = đất trống), nhân 2 khi độc quyền cả vùng.
const RENT_MULT = [0.2, 1, 2.8, 5.5];
export const upgradeCost = (price) => Math.round(price * 0.5 / 10) * 10;
export const baseRent = (price, level) => Math.round(price * RENT_MULT[level] / 5) * 5;

// Thẻ: k = loại hiệu ứng. Kèo Thơm toàn thưởng, Kèo Thối toàn phạt.
export const THOM = [
  { text: "Trúng vé số kiến thiết!", k: "cash", v: 150 },
  { text: "Được nhãn hàng tài trợ livestream.", k: "cash", v: 100 },
  { text: "Thu tiền bản quyền bài hát chế.", k: "cash", v: 60 },
  { text: "Đi thẳng về Xuất Phát, lụm 200K.", k: "goto", v: 0 },
  { text: "Sinh nhật! Mỗi người mừng bạn 30K.", k: "collect", v: 30 },
  { text: "Bắt xe ôm ra Bến Xe Du Lịch.", k: "goto", v: "bus" },
  { text: "Hoàn thuế cuối năm.", k: "cash", v: 80 },
  { text: "Tiến thêm 3 bước.", k: "step", v: 3 },
];
export const THOI = [
  { text: "Thủng lốp xe giữa đường.", k: "cash", v: -50 },
  { text: "Đóng thuế kinh doanh.", k: "cash", v: -100 },
  { text: "Khao cả hội trà sữa: mỗi người 25K.", k: "pay", v: 25 },
  { text: "Bị bắt vì đậu xe sai chỗ. Vào tù!", k: "jail", v: 0 },
  { text: "Sửa nhà: 25K mỗi cấp công trình.", k: "repair", v: 25 },
  { text: "Lùi lại 3 bước.", k: "step", v: -3 },
  { text: "Đổ xăng đầy bình.", k: "cash", v: -40 },
  { text: "Phạt vượt đèn đỏ.", k: "cash", v: -60 },
];

// RNG có seed (mulberry32) — giống co-ca-ngua/logic.js.
export function rand(g) {
  g.rng = (g.rng + 0x6d2b79f5) >>> 0;
  let t = g.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function shuffled(g, n) {
  const a = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rand(g) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

const BOT_NAMES = ["Bot Tèo", "Bot Tí", "Bot Mận"];

// players: 2..4. human: chỉ số token người chơi chọn (0..3), null = toàn bot (test).
export function createGame({ players = 4, human = 0, seed = Date.now() >>> 0, rules = {} } = {}) {
  if (players < 2 || players > 4) throw new Error("Số người 2–4");
  const R = { ...RULES, ...rules };
  const g = { rules: R, rng: seed >>> 0, seed, turn: 0, round: 1, phase: "roll", dice: null, pending: null,
    props: {}, events: [], winner: null, endReason: null, log: [], decks: { thom: [], thoi: [] } };
  const order = human == null ? [0, 1, 2, 3] : [human, ...[0, 1, 2, 3].filter((t) => t !== human)];
  let b = 0;
  g.players = order.slice(0, players).map((tok, i) => ({ id: i, token: tok, bot: human == null || i > 0,
    name: human != null && i === 0 ? "Bạn" : BOT_NAMES[b++] || "Bot", cash: R.startCash, pos: 0,
    jailed: false, jailTries: 0, bankrupt: false }));
  TILES.forEach((t, i) => { if (t.type === "property") g.props[i] = { owner: null, level: 0 }; });
  g.decks.thom = shuffled(g, THOM.length); g.decks.thoi = shuffled(g, THOI.length);
  return g;
}

export const current = (g) => g.players[g.turn];
export const alive = (g) => g.players.filter((p) => !p.bankrupt);
const emit = (g, e) => { g.events.push({ ...e, cash: g.players.map((p) => p.cash) }); };
export function drainEvents(g) { const e = g.events; g.events = []; return e; }

export function ownsRegion(g, pid, region) {
  return TILES.every((t, i) => t.region !== region || g.props[i].owner === pid);
}
export function rentOf(g, tile) {
  const pr = g.props[tile]; if (!pr || pr.owner == null) return 0;
  const t = TILES[tile];
  return baseRent(t.price, pr.level) * (ownsRegion(g, pr.owner, t.region) ? 2 : 1);
}
// Giá trị một ô = giá đất + chi phí đã nâng cấp.
export const propValue = (g, tile) => TILES[tile].price + g.props[tile].level * upgradeCost(TILES[tile].price);
export function netWorth(g, pid) {
  let v = g.players[pid].cash;
  for (const i in g.props) if (g.props[i].owner === pid) v += propValue(g, +i);
  return v;
}
export const ownedBy = (g, pid) => Object.keys(g.props).map(Number).filter((i) => g.props[i].owner === pid);

// ---------- Tiền & phá sản ----------
// Trả `amt` cho `to` (null = ngân hàng). Thiếu tiền: tự cầm cố (bán lại ngân hàng nửa giá trị, công trình trước, ô rẻ trước).
// Bán hết vẫn âm → phá sản, phần đất còn lại (nếu có) giao chủ nợ.
function pay(g, p, amt, to) {
  if (amt <= 0) return;
  p.cash -= amt;
  if (to != null) g.players[to].cash += amt;
  emit(g, { type: "pay", pid: p.id, to, amt });
  if (p.cash < 0) settleDebt(g, p, to);
}
function settleDebt(g, p, creditor) {
  const total = ownedBy(g, p.id).reduce((s, i) => s + Math.floor(propValue(g, i) / 2), 0);
  if (p.cash + total < 0) return bankrupt(g, p, creditor);
  // Bán công trình trước (từ ô rẻ), rồi bán đất.
  const mine = ownedBy(g, p.id).sort((a, b) => TILES[a].price - TILES[b].price);
  for (const i of mine) {
    while (p.cash < 0 && g.props[i].level > 0) {
      const back = Math.floor(upgradeCost(TILES[i].price) / 2);
      g.props[i].level--; p.cash += back;
      emit(g, { type: "sellHouse", pid: p.id, tile: i, amt: back });
    }
  }
  for (const i of mine) {
    if (p.cash >= 0) break;
    const back = Math.floor(TILES[i].price / 2);
    g.props[i].owner = null; p.cash += back;
    emit(g, { type: "sellLand", pid: p.id, tile: i, amt: back });
  }
}
function bankrupt(g, p, creditor) {
  p.bankrupt = true;
  for (const i of ownedBy(g, p.id)) {
    if (creditor != null && !g.players[creditor].bankrupt) g.props[i].owner = creditor;
    else g.props[i] = { owner: null, level: 0 };
  }
  // Tiền âm trả ngân hàng; số âm không chuyển cho chủ nợ (chủ nợ đã nhận khoản thanh toán).
  if (creditor != null && p.cash < 0) g.players[creditor].cash += p.cash; // chủ nợ chỉ nhận phần người kia thực có
  p.cash = 0;
  emit(g, { type: "bankrupt", pid: p.id, to: creditor });
  if (alive(g).length <= 1) finish(g, "lastStanding");
}

function finish(g, reason) {
  if (g.phase === "over") return;
  g.phase = "over"; g.pending = null; g.endReason = reason;
  const ranking = g.players.map((p) => ({ pid: p.id, worth: p.bankrupt ? -1 : netWorth(g, p.id) }))
    .sort((a, b) => b.worth - a.worth);
  g.ranking = ranking; g.winner = ranking[0].pid;
  emit(g, { type: "over", winner: g.winner, reason });
}

// ---------- Di chuyển ----------
function moveBy(g, p, steps) {
  const from = p.pos, path = [];
  for (let s = 1; s <= Math.abs(steps); s++) path.push((from + Math.sign(steps) * s + N) % N);
  p.pos = path[path.length - 1];
  emit(g, { type: "move", pid: p.id, from, path });
  if (steps > 0 && from + steps >= N) { p.cash += g.rules.passStart; emit(g, { type: "passStart", pid: p.id, amt: g.rules.passStart }); }
}
function jumpTo(g, p, tile, viaStart) {
  const from = p.pos; p.pos = tile;
  emit(g, { type: "jump", pid: p.id, from, to: tile });
  if (viaStart) { p.cash += g.rules.passStart; emit(g, { type: "passStart", pid: p.id, amt: g.rules.passStart }); }
}
function toJail(g, p) {
  jumpTo(g, p, JAIL, false); p.jailed = true; p.jailTries = 0;
  emit(g, { type: "jailed", pid: p.id });
}

// Xử lý ô vừa dừng. Trả về true nếu cần người chơi quyết định (mua / nâng cấp).
function land(g, p, depth = 0) {
  const t = TILES[p.pos];
  if (t.type === "property") {
    const pr = g.props[p.pos];
    if (pr.owner == null) {
      if (p.cash >= t.price) { g.pending = { type: "buy", tile: p.pos, cost: t.price }; return true; }
      emit(g, { type: "cantAfford", pid: p.id, tile: p.pos });
    } else if (pr.owner === p.id) {
      if (pr.level < g.rules.maxLevel) {
        const c = upgradeCost(t.price);
        if (p.cash >= c) { g.pending = { type: "upgrade", tile: p.pos, cost: c }; return true; }
        emit(g, { type: "cantAfford", pid: p.id, tile: p.pos });
      }
    } else if (!g.players[pr.owner].bankrupt) {
      const r = rentOf(g, p.pos);
      emit(g, { type: "rent", pid: p.id, to: pr.owner, tile: p.pos, amt: r });
      pay(g, p, r, pr.owner);
    }
  } else if (t.type === "go-to-jail") toJail(g, p);
  else if (t.type === "bus") {
    const bonus = 20 + Math.floor(rand(g) * 5) * 20;
    p.cash += bonus; emit(g, { type: "bonus", pid: p.id, amt: bonus });
  } else if (t.type === "keo-thom" || t.type === "keo-thoi") return drawCard(g, p, t.type === "keo-thom" ? "thom" : "thoi", depth);
  return false;
}

function drawCard(g, p, kind, depth) {
  const deck = g.decks[kind], list = kind === "thom" ? THOM : THOI;
  if (!deck.length) g.decks[kind] = shuffled(g, list.length);
  const idx = g.decks[kind].shift(), c = list[idx];
  emit(g, { type: "card", pid: p.id, kind, idx, text: c.text });
  const others = g.players.filter((o) => o !== p && !o.bankrupt);
  switch (c.k) {
    case "cash":
      if (c.v >= 0) { p.cash += c.v; emit(g, { type: "gain", pid: p.id, amt: c.v }); }
      else pay(g, p, -c.v, null);
      break;
    case "collect":
      for (const o of others) { if (!o.bankrupt && !p.bankrupt) pay(g, o, c.v, p.id); }
      break;
    case "pay":
      for (const o of others) { if (!p.bankrupt) pay(g, p, c.v, o.id); }
      break;
    case "repair": {
      const lv = ownedBy(g, p.id).reduce((s, i) => s + g.props[i].level, 0);
      if (lv) pay(g, p, lv * c.v, null); else emit(g, { type: "note", pid: p.id, text: "Chưa có nhà nào, khỏi sửa!" });
      break;
    }
    case "jail": toJail(g, p); break;
    case "goto": { const to = c.v === "bus" ? BUS : c.v; jumpTo(g, p, to, to <= p.pos || to === 0); if (to !== 0 && depth < 2) return land(g, p, depth + 1); break; }
    case "step": moveBy(g, p, c.v); if (depth < 2) return land(g, p, depth + 1); break;
  }
  return false;
}

// ---------- Lượt ----------
export function roll(g, forced) {
  if (g.phase !== "roll") return null;
  const p = current(g);
  const d = forced || [1 + Math.floor(rand(g) * 6), 1 + Math.floor(rand(g) * 6)];
  g.dice = d;
  const dbl = d[0] === d[1];
  emit(g, { type: "roll", pid: p.id, dice: d });
  if (p.jailed) {
    if (dbl) { p.jailed = false; emit(g, { type: "freed", pid: p.id, how: "double" }); }
    else {
      p.jailTries++;
      if (p.jailTries >= g.rules.maxJailTries) { p.jailed = false; emit(g, { type: "freed", pid: p.id, how: "served" }); }
      else emit(g, { type: "stayJail", pid: p.id, left: g.rules.maxJailTries - p.jailTries });
      endTurn(g); return d;
    }
  }
  moveBy(g, p, d[0] + d[1]);
  if (land(g, p)) g.phase = "decide"; else if (g.phase !== "over") endTurn(g);
  return d;
}

// Nộp phạt ra tù trước khi gieo.
export function payJail(g) {
  const p = current(g);
  if (g.phase !== "roll" || !p.jailed || p.cash < g.rules.jailFine) return false;
  p.cash -= g.rules.jailFine; p.jailed = false;
  emit(g, { type: "freed", pid: p.id, how: "paid", amt: g.rules.jailFine });
  return true;
}

export function decide(g, accept) {
  if (g.phase !== "decide" || !g.pending) return false;
  const p = current(g), { type, tile, cost } = g.pending;
  g.pending = null;
  if (accept && p.cash >= cost) {
    p.cash -= cost;
    if (type === "buy") g.props[tile].owner = p.id; else g.props[tile].level++;
    emit(g, { type, pid: p.id, tile, amt: cost, level: g.props[tile].level });
  } else emit(g, { type: "skip", pid: p.id, tile });
  endTurn(g);
  return true;
}

function endTurn(g) {
  if (g.phase === "over") return;
  g.phase = "roll"; g.pending = null;
  if (alive(g).length <= 1) return finish(g, "lastStanding");
  let i = g.turn;
  do {
    i = (i + 1) % g.players.length;
    if (i === 0) {
      g.round++;
      if (g.round > g.rules.maxRounds) { g.round = g.rules.maxRounds; g.turn = i; return finish(g, "rounds"); }
      emit(g, { type: "round", round: g.round });
    }
  } while (g.players[i].bankrupt);
  g.turn = i;
  emit(g, { type: "turn", pid: i });
}

// ---------- Bot ----------
// Bot giữ lại "quỹ an toàn" để không phá sản vì tiền thuê; giai đoạn cuối mua mạnh tay hơn.
export function botWants(g) {
  const p = current(g), pend = g.pending; if (!pend) return false;
  const reserve = g.round > 20 ? 60 : 150;
  return p.cash - pend.cost >= reserve;
}
export function botStep(g) {
  const p = current(g);
  if (g.phase === "roll") {
    if (p.jailed && p.cash > 400) payJail(g);
    return roll(g);
  }
  if (g.phase === "decide") return decide(g, botWants(g));
  return null;
}
export function autoplay(g, maxSteps = 5000) {
  let n = 0;
  while (g.phase !== "over" && n++ < maxSteps) botStep(g);
  return g;
}
