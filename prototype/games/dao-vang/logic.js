// Đào Vàng — logic thuần (không DOM, không canvas). Chạy được trong trình duyệt lẫn Node để test.
// Mọi số đo theo hệ toạ độ logic W×H; thời gian tính bằng giây.
// Trạng thái là object thường, có thể sao chép (structuredClone) — sau này đưa lên server/replay được.

export const W = 960;
export const H = 600;

export const CFG = {
  levelTime: 60,            // giây mỗi màn
  pivotY: 96,               // độ cao trục tời
  ropeMin: 34,              // độ dài dây khi đang lắc
  maxAngle: (72 * Math.PI) / 180,
  swingSpeed: 1.9,          // rad/s của pha lắc (chu kỳ ~3.3 s)
  shootSpeed: 430,          // px/s khi thả móc
  emptyPull: 640,           // px/s thu móc rỗng
  pullPower: 560,           // tốc độ thu = pullPower / trọng lượng
  minPull: 70,
  tipR: 10,                 // bán kính đầu móc khi xét va chạm
  groundY: 150,             // mặt đất — vật thể nằm dưới mức này
};

// Loại vật thể: r = bán kính va chạm, value = điểm, weight = trọng lượng (càng nặng thu càng chậm).
export const KINDS = {
  goldS:   { r: 14, value: 50,  weight: 1.4, name: "Vàng nhỏ" },
  goldM:   { r: 24, value: 150, weight: 2.6, name: "Vàng vừa" },
  goldL:   { r: 40, value: 500, weight: 5.5, name: "Vàng lớn" },
  diamond: { r: 10, value: 600, weight: 1.0, name: "Kim cương" },
  rockS:   { r: 18, value: 20,  weight: 3.2, name: "Đá nhỏ" },
  rockL:   { r: 30, value: 60,  weight: 6.0, name: "Đá lớn" },
  bag:     { r: 16, value: 0,   weight: 1.5, name: "Túi bí ẩn" },  // điểm ngẫu nhiên khi kéo lên
  tnt:     { r: 18, value: 0,   weight: 1.0, name: "Thùng thuốc nổ", blast: 95 },
};
export const BAG_VALUES = [30, 80, 150, 250, 400, 700];
const VALUABLE = new Set(["goldS", "goldM", "goldL", "diamond", "bag"]);

// Mục tiêu điểm cộng dồn: màn 1 = 650, mỗi màn sau cần thêm 550 + 100·n.
export function targetFor(level) {
  let t = 0;
  for (let n = 1; n <= level; n++) t += 550 + 100 * n;
  return t;
}

// RNG có seed (mulberry32) — cùng seed thì cùng màn chơi, để test và tái hiện lỗi.
export function rand(g) {
  g.rng = (g.rng + 0x6d2b79f5) >>> 0;
  let t = g.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const between = (g, a, b) => a + rand(g) * (b - a);

function placeObjects(g, plan, level = 2, existing = []) {
  const out = [];
  let id = 1;
  for (const [kind, count] of plan) {
    const k = KINDS[kind];
    for (let c = 0; c < count; c++) {
      // Vật to/quý nằm sâu hơn; thử nhiều vị trí, bỏ qua nếu không còn chỗ.
      // Màn 1: vàng vừa nằm sâu, vàng nhỏ và đá rải mọi độ sâu (đá che bớt đường, phải canh góc).
      const deep = level === 1 ? kind === "goldM" : kind === "goldL" || kind === "diamond" || kind === "rockL";
      for (let tries = 0; tries < 200; tries++) {
        const x = between(g, 30 + k.r, W - 30 - k.r);
        const y = between(g, deep ? 330 : CFG.groundY + 50 + k.r, H - 14 - k.r);
        if (out.concat(existing).every((o) => Math.hypot(o.x - x, o.y - y) > o.r + k.r + 8)) {
          out.push({ id: id++, kind, x, y, r: k.r });
          break;
        }
      }
    }
  }
  return out;
}

// Màn 1 riêng: không có vàng lớn/kim cương/túi/TNT; 4 vàng vừa nằm sâu, 12 vàng nhỏ xen 9 viên đá.
// Mô phỏng 300 màn, người chơi bình thường (nghĩ 0,35–0,85 s mỗi lượt, bấm lệch ±70 ms) cần ~40 s
// (đa số 33–45 s) mới đủ 650 điểm, thay vì ~16 s như trước.
// Từ màn 2 giữ nguyên công thức cũ.
const LEVEL1_PLAN = [["goldM", 4], ["goldS", 12], ["rockL", 4], ["rockS", 5]];

export function generateLevel(g, level) {
  const plan = level === 1 ? LEVEL1_PLAN : [
    ["goldL", Math.min(1 + Math.floor(level / 2), 3)],
    ["diamond", Math.min(Math.max(level - 1, 0), 3)],
    ["goldM", 3],
    ["goldS", 4],
    ["rockL", 2 + Math.min(level, 3)],
    ["rockS", 3],
    ["bag", 2],
    ["tnt", level >= 2 ? Math.min(level - 1, 2) : 0],
  ];
  let objects = placeObjects(g, plan, level);
  // Bảo đảm màn chơi luôn đủ điểm để qua (màn 1: ≥1.3 lần mục tiêu; các màn sau: ≥1.6 lần số điểm cần thêm).
  const need = (targetFor(level) - targetFor(level - 1)) * (level === 1 ? 1.3 : 1.6);
  const sum = () => objects.reduce((s, o) => s + (o.kind === "bag" ? 150 : KINDS[o.kind].value), 0);
  let guard = 0;
  while (sum() < need && guard++ < 10) {
    const extra = placeObjects(g, [["goldM", 1]], level, objects);
    if (extra.length) objects.push({ ...extra[0], id: objects.length + 100 + guard });
  }
  return objects;
}

function makeHook(x, phase) {
  return { x, y: CFG.pivotY, phase, angle: CFG.maxAngle * Math.sin(phase), state: "swing", len: CFG.ropeMin, pull: 0, carry: null, earned: 0 };
}

// players: 1 = một người (giao diện chỉ dùng chế độ này); 2 = hai móc chung điểm, chung đồng hồ — luật còn giữ, có test, nhưng không mở trên giao diện.
export function createGame({ players = 1, seed = Date.now() >>> 0, level = 1, score = 0 } = {}) {
  const g = { players, seed, rng: seed >>> 0, level, score, levelStartScore: score, target: targetFor(level), time: CFG.levelTime, status: "playing", objects: [], hooks: [], events: [], tick: 0 };
  g.objects = generateLevel(g, level);
  g.hooks = players === 2 ? [makeHook(W * 0.3, 0), makeHook(W * 0.7, Math.PI)] : [makeHook(W / 2, 0)];
  return g;
}

export function nextLevel(g) {
  if (g.status !== "cleared") return g;
  const n = createGame({ players: g.players, seed: (g.seed + g.level * 7919) >>> 0, level: g.level + 1, score: g.score });
  n.hooks.forEach((h, i) => (h.earned = g.hooks[i] ? g.hooks[i].earned : 0));
  return n;
}

export function restart(g) {
  return createGame({ players: g.players, seed: (g.seed * 31 + 17) >>> 0 });
}

export function tipOf(h) {
  return { x: h.x + Math.sin(h.angle) * h.len, y: h.y + Math.cos(h.angle) * h.len };
}

// Thả móc của người chơi i. Trả về true nếu móc thật sự được thả.
export function fire(g, i = 0) {
  const h = g.hooks[i];
  if (g.status !== "playing" || !h || h.state !== "swing") return false;
  h.state = "out";
  g.events.push({ type: "fire", player: i });
  return true;
}

function startReturn(h, obj) {
  h.state = "back";
  h.carry = obj;
  h.pull = obj ? Math.max(CFG.minPull, CFG.pullPower / KINDS[obj.kind].weight) : CFG.emptyPull;
}

function updateHook(g, h, i, dt) {
  if (h.state === "swing") {
    h.phase += CFG.swingSpeed * dt;
    h.angle = CFG.maxAngle * Math.sin(h.phase);
    return;
  }
  if (h.state === "out") {
    h.len += CFG.shootSpeed * dt;
    const t = tipOf(h);
    if (t.x < 0 || t.x > W || t.y > H) return startReturn(h, null);
    for (const o of g.objects) {
      if (o.taken || Math.hypot(o.x - t.x, o.y - t.y) > o.r + CFG.tipR) continue;
      if (o.kind === "tnt") {
        const blast = KINDS.tnt.blast;
        const hit = g.objects.filter((p) => !p.taken && Math.hypot(p.x - o.x, p.y - o.y) <= blast + p.r);
        g.objects = g.objects.filter((p) => !hit.includes(p));
        g.events.push({ type: "boom", player: i, x: o.x, y: o.y, destroyed: hit.length });
        return startReturn(h, null);
      }
      o.taken = true;
      g.events.push({ type: "grab", player: i, kind: o.kind });
      return startReturn(h, o);
    }
    return;
  }
  // back — kéo về, vật thể đi theo đầu móc
  h.len -= h.pull * dt;
  if (h.carry) {
    const t = tipOf(h);
    h.carry.x = t.x + Math.sin(h.angle) * h.carry.r * 0.8;
    h.carry.y = t.y + Math.cos(h.angle) * h.carry.r * 0.8;
  }
  if (h.len <= CFG.ropeMin) {
    h.len = CFG.ropeMin;
    if (h.carry) {
      const o = h.carry;
      const value = o.kind === "bag" ? BAG_VALUES[Math.floor(rand(g) * BAG_VALUES.length)] : KINDS[o.kind].value;
      g.score += value;
      h.earned += value;
      g.objects = g.objects.filter((p) => p !== o);
      g.events.push({ type: "collect", player: i, kind: o.kind, value, x: h.x, y: h.y });
      h.carry = null;
    }
    h.state = "swing";
  }
}

function endLevel(g, reason) {
  g.status = g.score >= g.target ? "cleared" : "failed";
  g.events.push({ type: "levelEnd", status: g.status, reason, score: g.score, target: g.target, level: g.level });
}

// Tiến trạng thái thêm dt giây. Gọi với bước cố định (1/60) để kết quả ổn định.
export function step(g, dt) {
  if (g.status !== "playing") return g;
  g.tick++;
  g.hooks.forEach((h, i) => updateHook(g, h, i, dt));
  g.time = Math.max(0, g.time - dt);
  const busy = g.hooks.some((h) => h.state !== "swing");
  if (g.time <= 0) endLevel(g, "time");
  else if (!busy && !g.objects.some((o) => VALUABLE.has(o.kind))) endLevel(g, "empty");
  return g;
}

// Lấy và xoá hàng đợi sự kiện (phần vẽ dùng để hiện điểm bay lên, rung khi nổ...).
export function drainEvents(g) {
  const e = g.events;
  g.events = [];
  return e;
}
