// Test luật Làng / NPC / nhiệm vụ M4 (core/village.js). Chạy: node --test prototype/games/nong-trai/test/village.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import * as V from "../core/village.js?v=m14";
import * as A from "../core/animals.js?v=m14";
import {
  VILLAGERS, VILLAGER, PROGRESSION, REPEATABLE, REPEATABLE_BY_ID, BOARD_SIZE, VILLAGE_LEVEL, CHAIN_LEVEL, TRUCK, TALK_COOLDOWN_MS,
} from "../data/village.js?v=m14";
import { TUTORIAL } from "../data/quests.js?v=m14";
import { NPC } from "../data/npcs.js?v=m14";
import { ITEM } from "../data/catalog.js?v=m14";
import { RECIPE } from "../data/recipes.js?v=m14";
import { FEED } from "../data/animals.js?v=m14";

const T0 = 1_700_000_000_000, MIN = 60_000, HOUR = 3600_000;

function memInv(init = {}, cap = Infinity) {
  const bag = Object.fromEntries(Object.entries(init).filter(([, q]) => q > 0));
  const total = () => Object.values(bag).reduce((a, b) => a + b, 0);
  return {
    bag,
    count: (id) => bag[id] || 0,
    has: (id, n) => (bag[id] || 0) >= n,
    take(id, n) { if (!Number.isInteger(n) || n <= 0 || (bag[id] || 0) < n) return false; bag[id] -= n; if (!bag[id]) delete bag[id]; return true; },
    add(id, n) { if (!Number.isInteger(n) || n <= 0 || total() + n > cap) return { ok: false, overflow: 0 }; bag[id] = (bag[id] || 0) + n; return { ok: true, overflow: 0 }; },
  };
}
function memWallet(coins = 0) {
  return { get value() { return coins; }, coins: () => coins, spend(n) { if (!(n >= 0) || coins < n) return false; coins -= n; return true; }, earn(n) { coins += n; } };
}
const ctx = (level, extra = {}) => ({ level, seed: 7, buildings: {}, ...extra });
const io = (inv = memInv(), wallet = memWallet(), decor) => ({ inv, wallet, ...(decor ? { decor } : {}) });

/** Gọi như apply(): sync → track. */
function emit(vs, c, ...events) { const out = [...V.syncVillage(vs, c)]; out.push(...V.track(vs, events, c)); return out; }

test("dữ liệu: NPC khớp data/npcs.js + manifest, phần thưởng / món tồn tại, chuỗi 3 bước", async () => {
  const { readFile } = await import("node:fs/promises");
  const m = JSON.parse(await readFile(new URL("../assets/v3/manifest.json", import.meta.url), "utf8"));
  const ids = (sheet) => new Set(m.sheets[sheet].frames.map((f) => f.id));
  const village = ids("village");
  assert.deepEqual(VILLAGERS.map((v) => v.id).sort(), Object.keys(NPC).sort());
  for (const v of VILLAGERS) {
    assert.equal(v.name, NPC[v.id].name);
    assert.ok(village.has(v.house), v.house);
    const sheet = ids(v.sheet);
    for (const f of [...v.idle, v.wave, v.portrait]) assert.ok(sheet.has(f), f);
    assert.ok(v.lines.length >= 4);
    assert.equal(v.chain.steps.length, 3);
  }
  assert.ok(ids("buildings").has(TRUCK.sprite.frame));
  const all = [...PROGRESSION, ...REPEATABLE, ...VILLAGERS.flatMap((v) => v.chain.steps)];
  assert.equal(new Set(all.map((q) => q.id)).size, all.length, "id trùng");
  for (const q of all) {
    for (const id of Object.keys({ ...(q.reward.items || {}), ...(q.reward.decor || {}), ...(q.give || {}) })) assert.ok(ITEM[id], `${q.id}: ${id}`);
    for (const id of Object.keys(q.reward.decor || {})) assert.equal(ITEM[id].bag, "decor");
    for (const c of [q, ...(q.steps || [])]) for (const [k, val] of Object.entries(c.match || {})) {
      if (k === "item") assert.ok(ITEM[val], `${q.id}: ${val}`);
      if (k === "npc") assert.ok(NPC[val]);
    }
    assert.ok(q.count >= 1 && Number.isInteger(q.count));
    if (q.steps) assert.equal(q.count, q.steps.length);
  }
  assert.deepEqual(REPEATABLE.slice(0, 3).map((q) => q.title), ["Giao 3 đơn", "Thu 20 nông sản", "Chế biến 5 món"]);
  assert.ok(REPEATABLE.some((q) => q.title === "Hoàn thành 1 chuỗi Ngô→Trứng→Bánh"));
  assert.ok(REPEATABLE.filter((q) => q.minLevel <= VILLAGE_LEVEL).length >= BOARD_SIZE, "đủ mẫu cho bảng lúc làng mở");
  // chuỗi Bác Tư theo đề bài: 3 bánh trứng → bánh bí ngô → đơn kết hợp có bánh
  const tu = VILLAGER["bac-tu"].chain.steps;
  assert.deepEqual(tu[0].give, { "banh-trung": 3 });
  assert.equal(tu[1].match.item, "banh-bi-ngo");
  assert.equal(tu[2].match.orderType, "ket-hop");
});

test("nhiệm vụ tiến trình: đếm từ sự kiện, lọc theo món, chỉ khi đang mở, nhận 1 lần, tuần tự", () => {
  const vs = V.createVillage(), inv = memInv(), w = memWallet();
  const harvest = { type: "harvested", crop: "ngo" };
  // cấp 6: chưa mở nhiệm vụ cấp 7
  emit(vs, ctx(6, { buildings: { "chuong-ga": 1 } }), harvest);
  assert.equal(vs.prog.progress, 0);
  assert.equal(V.questLog(vs, ctx(6)).progression, null);
  assert.equal(V.questLog(vs, ctx(6)).progressionNext.minLevel, 7);
  assert.equal(V.claimProgression(vs, "xay-chuong-ga", io(inv, w), ctx(6)).err, "locked");
  // xây chuồng gà (điều kiện trạng thái)
  let c = ctx(7);
  emit(vs, c);
  assert.equal(V.claimProgression(vs, "xay-chuong-ga", io(inv, w), c).err, "quest-incomplete");
  c = ctx(7, { buildings: { "chuong-ga": 1 } });
  const done = emit(vs, c);
  assert.ok(done.some((e) => e.type === "villageQuestDone" && e.id === "xay-chuong-ga"));
  assert.equal(V.claimProgression(vs, "mua-ga-dau", io(inv, w), c).err, "quest-claimed"); // không nhảy cóc
  const r = V.claimProgression(vs, "xay-chuong-ga", io(inv, w), c);
  assert.ok(r.ok);
  assert.equal(r.xp, 10);
  assert.equal(w.value, 40);
  assert.equal(V.claimProgression(vs, "xay-chuong-ga", io(inv, w), c).err, "quest-claimed"); // không nhận 2 lần
  assert.equal(w.value, 40);
  // mua gà: chỉ gà mới tính
  emit(vs, c, { type: "animalBought", kind: "bo-sua" });
  assert.equal(vs.prog.progress, 0);
  emit(vs, c, { type: "animalBought", kind: "ga" });
  assert.ok(V.claimProgression(vs, "mua-ga-dau", io(inv, w), c).ok);
  assert.equal(inv.count(FEED), 2);
  // thu trứng: sữa không tính
  emit(vs, c, { type: "animalCollected", item: "sua", qty: 1 }, { type: "jobCollected", item: "trung-ga", qty: 1 });
  assert.equal(vs.prog.progress, 0);
  emit(vs, c, { type: "animalCollected", kind: "ga", item: "trung-ga", qty: 1 });
  assert.ok(V.claimProgression(vs, "thu-trung-dau", io(inv, w), c).ok);
  // giao đơn có trứng/sữa: đơn không có ⇒ không tính
  emit(vs, c, { type: "delivered", npc: "co-hai", orderType: "thuong", items: { "ca-rot": 2 } });
  assert.equal(vs.prog.progress, 0);
  emit(vs, c, { type: "delivered", npc: "co-hai", orderType: "thuong" }); // thiếu items ⇒ không tính
  assert.equal(vs.prog.progress, 0);
  emit(vs, c, { type: "delivered", npc: "co-hai", orderType: "thuong", items: { sua: 1, "ca-rot": 1 } });
  assert.ok(V.claimProgression(vs, "giao-don-trung-sua", io(inv, w), c).ok);
  // bánh trứng cần cấp 8 ⇒ sự kiện ở cấp 7 không tính
  emit(vs, c, { type: "jobCollected", machine: "lo-banh", recipe: "banh-trung", item: "banh-trung", qty: 1 });
  assert.equal(vs.prog.progress, 0);
  c = ctx(8, { buildings: { "chuong-ga": 1 } });
  emit(vs, c, { type: "jobCollected", machine: "lo-banh", recipe: "banh-trung", item: "banh-trung", qty: 1 });
  assert.ok(V.claimProgression(vs, "lam-banh-trung", io(inv, w), c).ok);
  // chuồng bò: hasBuilding() của M3 được ưu tiên
  c = ctx(9, { hasBuilding: (id) => id === "chuong-bo" });
  emit(vs, c);
  assert.ok(V.claimProgression(vs, "xay-chuong-bo", io(inv, w), c).ok);
  assert.equal(vs.prog.i, PROGRESSION.length);
  assert.equal(V.questLog(vs, c).progression, null);
  assert.equal(w.value, PROGRESSION.reduce((n, q) => n + q.reward.coins, 0));
});

test("bảng lặp lại: 3 ô khi làng mở, không trùng, đếm amount, làm mới khi nhận, nhận 1 lần", () => {
  const vs = V.createVillage(), w = memWallet(), inv = memInv();
  assert.deepEqual(V.syncVillage(vs, ctx(5)), []);
  assert.equal(vs.board.slots.length, 0);
  const c = ctx(6);
  const ev = V.syncVillage(vs, c);
  assert.equal(ev.length, BOARD_SIZE);
  assert.equal(vs.board.slots.length, BOARD_SIZE);
  assert.equal(new Set(vs.board.slots.map((s) => s.tpl)).size, BOARD_SIZE);
  for (const s of vs.board.slots) assert.ok(REPEATABLE_BY_ID[s.tpl].minLevel <= 6);
  // ép bảng biết trước để test đếm
  vs.board.slots = [{ uid: 1, tpl: "giao-3-don", progress: 0 }, { uid: 2, tpl: "ban-15-mon", progress: 0 }, { uid: 3, tpl: "thu-20-nong-san", progress: 0 }];
  vs.board.nextUid = 4;
  emit(vs, c, { type: "sold", count: 10, items: { "ca-rot": 10 } }, { type: "delivered", npc: "bac-tu", orderType: "thuong", items: {} });
  assert.deepEqual(vs.board.slots.map((s) => s.progress), [1, 10, 0]);
  assert.equal(V.claimBoard(vs, 2, io(inv, w), c).err, "quest-incomplete");
  const out = emit(vs, c, { type: "sold", count: 9 });
  assert.equal(vs.board.slots[1].progress, 15); // kẹp ở count
  assert.ok(out.some((e) => e.type === "villageQuestDone" && e.uid === 2));
  emit(vs, c, { type: "sold", count: 9 });
  assert.equal(out.filter((e) => e.type === "villageQuestDone").length, 1);
  const r = V.claimBoard(vs, 2, io(inv, w), c);
  assert.ok(r.ok);
  assert.equal(w.value, 35);
  assert.equal(r.xp, 8);
  assert.equal(vs.board.slots.length, BOARD_SIZE);
  assert.ok(!vs.board.slots.some((s) => s.uid === 2));
  const fresh = vs.board.slots.find((s) => s.uid === 4);
  assert.ok(fresh && fresh.progress === 0 && !["giao-3-don", "thu-20-nong-san"].includes(fresh.tpl));
  assert.ok(r.events.some((e) => e.type === "boardRefilled"));
  assert.equal(V.claimBoard(vs, 2, io(inv, w), c).err, "quest-claimed");
  assert.equal(w.value, 35);
  // tất định: cùng seed ⇒ cùng bảng
  const a = V.createVillage(), b = V.createVillage();
  V.syncVillage(a, ctx(9)); V.syncVillage(b, ctx(9));
  assert.deepEqual(a.board, b.board);
});

test("bảng lặp lại: chuỗi Ngô→Trứng→Bánh phải đúng thứ tự", () => {
  const vs = V.createVillage(), c = ctx(8);
  vs.board.slots = [{ uid: 1, tpl: "chuoi-ngo-trung-banh", progress: 0 }];
  vs.board.nextUid = 2;
  const corn = { type: "harvested", crop: "ngo" }, feed = { type: "jobCollected", item: FEED, qty: 3 };
  const egg = { type: "animalCollected", item: "trung-ga", qty: 1 }, cake = { type: "jobCollected", item: "banh-trung", qty: 1 };
  V.track(vs, [cake, egg, feed], c); // sai thứ tự ⇒ không tính
  assert.equal(vs.board.slots[0].progress, 0);
  V.track(vs, [corn, egg], c);
  assert.equal(vs.board.slots[0].progress, 1);
  V.track(vs, [feed, { type: "harvested", crop: "ca-rot" }, egg], c);
  assert.equal(vs.board.slots[0].progress, 3);
  const out = V.track(vs, [cake], c);
  assert.equal(vs.board.slots[0].progress, 4);
  assert.equal(out[0].id, "chuoi-ngo-trung-banh");
  const w = memWallet(), inv = memInv();
  assert.ok(V.claimBoard(vs, 1, io(inv, w), c).ok);
  assert.equal(inv.count("van-go"), 1);
});

test("chuỗi NPC: khoá trước cấp 14, bước đúng thứ tự, trao tay trừ hàng lúc nhận, thưởng trang trí hiếm", () => {
  const vs = V.createVillage(), w = memWallet(), decorBag = {};
  const decor = { add(id, n) { decorBag[id] = (decorBag[id] || 0) + n; } };
  const inv = memInv({ "banh-trung": 2 });
  const job = (item) => ({ type: "jobCollected", machine: "lo-banh", recipe: item, item, qty: 1 });
  // cấp 13: chưa mở, sự kiện không được tính
  emit(vs, ctx(13), job("banh-bi-ngo"));
  assert.equal(V.claimChainStep(vs, "bac-tu", 0, io(inv, w, decor), ctx(13)).err, "locked");
  assert.ok(V.questLog(vs, ctx(13)).chains.every((x) => x.locked));
  const c = ctx(CHAIN_LEVEL);
  // bước 1 (trao tay 3 bánh trứng): thiếu ⇒ không nhận, không trừ
  assert.equal(V.questLog(vs, c, inv).chains.find((x) => x.npc === "bac-tu").quest.claimable, false);
  assert.equal(V.claimChainStep(vs, "bac-tu", 0, io(inv, w, decor), c).err, "give-stock");
  assert.equal(inv.count("banh-trung"), 2);
  // bánh bí ngô làm trước khi tới bước 2 ⇒ không tính
  emit(vs, c, job("banh-bi-ngo"));
  assert.equal(vs.chains["bac-tu"].progress, 0);
  assert.equal(V.claimChainStep(vs, "bac-tu", 1, io(inv, w, decor), c).err, "quest-claimed"); // không nhảy bước
  inv.add("banh-trung", 1);
  assert.equal(V.questLog(vs, c, inv).chains.find((x) => x.npc === "bac-tu").quest.claimable, true);
  const r1 = V.claimChainStep(vs, "bac-tu", 0, io(inv, w, decor), c);
  assert.ok(r1.ok);
  assert.equal(inv.count("banh-trung"), 0);
  assert.equal(w.value, 150);
  assert.equal(V.claimChainStep(vs, "bac-tu", 0, io(inv, w, decor), c).err, "quest-claimed");
  assert.equal(vs.friends["bac-tu"].points, 5);
  // bước 2
  emit(vs, c, job("banh-trung"));
  assert.equal(V.claimChainStep(vs, "bac-tu", 1, io(inv, w, decor), c).err, "quest-incomplete");
  emit(vs, c, job("banh-bi-ngo"));
  assert.ok(V.claimChainStep(vs, "bac-tu", 1, io(inv, w, decor), c).ok);
  assert.equal(inv.count("van-go"), 2);
  // bước 3: đơn kết hợp có bánh (đơn thường có bánh / đơn kết hợp không bánh ⇒ không tính)
  emit(vs, c, { type: "delivered", npc: "bac-tu", orderType: "thuong", items: { "banh-trung": 1 } });
  emit(vs, c, { type: "delivered", npc: "bac-tu", orderType: "ket-hop", items: { "mut-dau": 1, "ca-rot": 2, ngo: 1 } });
  assert.equal(vs.chains["bac-tu"].progress, 0);
  emit(vs, c, { type: "delivered", npc: "bac-tu", orderType: "ket-hop", items: { "bap-rang": 1, "ca-rot": 2, ngo: 1 } });
  const r3 = V.claimChainStep(vs, "bac-tu", 2, io(inv, w, decor), c);
  assert.ok(r3.ok);
  assert.deepEqual(decorBag, { "den-long": 1 });
  assert.ok(r3.events.some((e) => e.type === "chainComplete" && e.npc === "bac-tu"));
  assert.equal(V.claimChainStep(vs, "bac-tu", 3, io(inv, w, decor), c).err, "quest-claimed");
  assert.equal(V.questLog(vs, c).chains.find((x) => x.npc === "bac-tu").done, true);
  // không có túi trang trí ⇒ trang trí đi qua inv.add
  const vs2 = V.createVillage();
  vs2.chains["anh-ut"] = { step: 2, progress: 0 };
  const inv2 = memInv({ sua: 4, "banh-trung": 2 });
  assert.ok(V.claimChainStep(vs2, "anh-ut", 2, io(inv2, memWallet()), c).ok);
  assert.deepEqual(inv2.bag, { "cong-tre": 1 });
  // chuỗi khác chạy song song, độc lập; NPC lạ / bước không nguyên
  assert.equal(V.claimChainStep(vs, "ong-x", 0, io(inv, w), c).err, "bad");
  assert.equal(V.claimChainStep(vs, "chi-ba", "0", io(inv, w), c).err, "bad");
  emit(vs, c, ...Array.from({ length: 15 }, () => ({ type: "harvested", crop: "lua" })));
  assert.equal(vs.chains["chi-ba"].progress, 15);
});

test("thưởng nguyên tử: kho từ chối món thưởng ⇒ không trừ hàng trao tay, không cộng xu, không qua bước", () => {
  const vs = V.createVillage(), w = memWallet(5), c = ctx(14);
  vs.chains["chi-ba"] = { step: 1, progress: 3 }; // bước 2 thưởng 2 hộp đinh
  const inv = memInv({ lua: 3 }, 3); // đầy
  assert.equal(V.claimChainStep(vs, "chi-ba", 1, io(inv, w), c).err, "full");
  assert.equal(w.value, 5);
  assert.deepEqual(vs.chains["chi-ba"], { step: 1, progress: 3 });
  // bước 3 trao tay + kho từ chối trang trí ⇒ hoàn lại hàng đã trừ
  vs.chains["chi-ba"] = { step: 2, progress: 0 };
  const inv3 = { ...memInv({ "bot-gao": 2, lua: 6 }), canAdd: (id) => id !== "bu-nhin" };
  assert.equal(V.claimChainStep(vs, "chi-ba", 2, io(inv3, w), c).err, "full");
  assert.deepEqual(inv3.bag, { "bot-gao": 2, lua: 6 });
  assert.equal(w.value, 5);
});

test("trò chuyện + thân thiết: thoại xoay vòng, cộng điểm có hồi chiêu, đơn của NPC cộng điểm", () => {
  const vs = V.createVillage();
  assert.equal(V.talk(vs, "co-hai", T0, ctx(5)).err, "locked");
  assert.equal(V.talk(vs, "nope", T0, ctx(9)).err, "bad");
  const c = ctx(9);
  const a = V.talk(vs, "co-hai", T0, c), b = V.talk(vs, "co-hai", T0 + MIN, c);
  assert.ok(a.ok && b.ok);
  assert.notEqual(a.line, b.line);
  assert.ok(VILLAGER["co-hai"].lines.includes(a.line));
  assert.equal(a.points, 1);
  assert.equal(b.points, 0);
  assert.equal(a.chain, null); // chưa cấp 14
  assert.equal(V.talk(vs, "co-hai", T0 + TALK_COOLDOWN_MS, c).points, 1);
  assert.equal(vs.friends["co-hai"].points, 2);
  assert.equal(a.events[0].type, "npcTalked");
  for (let i = 0; i < 4; i++) V.track(vs, [{ type: "delivered", npc: "co-hai", orderType: "thuong", items: { "ca-rot": 1 } }], c);
  assert.equal(vs.friends["co-hai"].points, 10);
  assert.equal(V.friendLevel(10).name, "Quen biết");
  const t = V.talk(vs, "bac-tu", T0, ctx(14));
  assert.equal(t.chain.title, "Mẻ bánh hội làng");
  assert.ok(t.chain.intro);
});

test("adapter M1: nhiệm vụ đơn giản đổi được, nhiệm vụ có lọc trả null", () => {
  const plain = V.asM1Quest(REPEATABLE_BY_ID["giao-3-don"]);
  assert.deepEqual(Object.keys(plain).sort(), Object.keys(TUTORIAL[0]).sort());
  assert.equal(plain.event, "delivered");
  assert.equal(V.asM1Quest(REPEATABLE_BY_ID["thu-4-trung"]), null);
  assert.equal(V.asM1Quest(REPEATABLE_BY_ID["chuoi-ngo-trung-banh"]), null);
  assert.equal(V.asM1Quest(PROGRESSION[0]), null); // building
  // nhiệm vụ M1 chạy được qua matches() (định dạng tương thích một chiều)
  for (const q of TUTORIAL.filter((x) => x.event)) assert.ok(V.matches(q, { type: q.event }));
});

test("chuỗi B đầu–cuối có nhiệm vụ: sự kiện thật từ core/animals + stub Xưởng ⇒ đủ chuỗi lặp lại + tiến trình", () => {
  const craft = (inv, id) => {
    const r = RECIPE[id];
    for (const [k, q] of Object.entries(r.inputs)) if (!inv.has(k, q)) return null;
    for (const [k, q] of Object.entries(r.inputs)) inv.take(k, q);
    inv.add(r.output, r.qty);
    return { type: "jobCollected", machine: r.machine, recipe: r.id, item: r.output, qty: r.qty };
  };
  const c = ctx(8, { buildings: { "chuong-ga": 1 } });
  const vs = V.createVillage(), inv = memInv({ lua: 2 }), w = memWallet(200), farm = A.createAnimals();
  V.syncVillage(vs, c);
  vs.board.slots[0] = { uid: 99, tpl: "chuoi-ngo-trung-banh", progress: 0 };
  vs.board.slots = vs.board.slots.filter((s, i) => i === 0 || s.tpl !== "chuoi-ngo-trung-banh");
  let now = T0;
  const step = (...events) => V.track(vs, events.filter(Boolean), c);
  inv.add("ngo", 2); step({ type: "harvested", crop: "ngo" }, { type: "harvested", crop: "ngo" });
  step(craft(inv, "thuc-an-gia-suc"));
  step(craft(inv, "bot-gao"));
  for (let i = 0; i < 2; i++) step(...A.buyAnimal(farm, w, "ga", now, c).events);
  step(...A.feedAll(farm, inv, now).events);
  now += 4 * MIN;
  step(...A.collectAll(farm, inv, now).events);
  const out = step(craft(inv, "banh-trung"));
  assert.ok(out.some((e) => e.id === "chuoi-ngo-trung-banh"));
  assert.equal(inv.count("banh-trung"), 1);
  // tiến trình: xây chuồng gà → mua gà → thu trứng đã qua? (chỉ quest đang mở mới đếm: lần lượt nhận)
  assert.equal(vs.prog.i, 0);
  assert.ok(V.claimProgression(vs, "xay-chuong-ga", io(inv, w), c).ok);
  assert.equal(V.claimProgression(vs, "mua-ga-dau", io(inv, w), c).err, "quest-incomplete"); // mua trước khi nhiệm vụ mở ⇒ không tính
  assert.ok(V.claimBoard(vs, 99, io(inv, w), c).ok);
});

test("sanitize: rác, NPC lạ, bước vượt, ô trùng, tiến độ vượt count", () => {
  for (const raw of [null, 3, "x", [], { friends: 1, chains: [], board: "a" }]) assert.deepEqual(V.sanitize(raw, T0), V.createVillage());
  const s = V.sanitize({
    friends: { "co-hai": { points: 1e9, talks: -3, lastTalkAt: T0 + 99 * HOUR }, "ong-x": { points: 5 }, __proto__: { points: 2 } },
    prog: { i: 99, progress: 7 },
    chains: { "bac-tu": { step: 1, progress: 99 }, "chi-ba": { step: 7 }, "anh-ut": { step: "2" } },
    board: { nextUid: 2, seq: -1, slots: [
      { uid: 5, tpl: "giao-3-don", progress: 50 }, { uid: 5, tpl: "thu-20-nong-san" }, { uid: 6, tpl: "giao-3-don" },
      { uid: 7, tpl: "nope" }, { uid: 8, tpl: "ban-15-mon", progress: 2.5 }, { uid: 9, tpl: "che-bien-5" }, { uid: 10, tpl: "thu-4-trung" },
    ] },
  }, T0);
  assert.deepEqual(s.friends["co-hai"], { points: 999, talks: 0, lastTalkAt: T0 });
  assert.equal(s.friends["ong-x"], undefined);
  assert.deepEqual(s.prog, { i: PROGRESSION.length, progress: 0 });
  assert.deepEqual(s.chains["bac-tu"], { step: 1, progress: 1 });
  assert.deepEqual(s.chains["chi-ba"], { step: 3, progress: 0 });
  assert.deepEqual(s.chains["anh-ut"], { step: 0, progress: 0 });
  assert.deepEqual(s.board.slots, [{ uid: 5, tpl: "giao-3-don", progress: 3 }, { uid: 8, tpl: "ban-15-mon", progress: 0 }, { uid: 9, tpl: "che-bien-5", progress: 0 }]);
  assert.equal(s.board.nextUid, 10);
  assert.equal(s.board.seq, 0);
  assert.deepEqual(V.sanitize(JSON.parse(JSON.stringify(s)), T0), s);
});

test("xe giao hàng: arrive → load → leave → idle, chỉ từ cấp 11", () => {
  const D = T0, { arriveMs: Aa, loadMs: L, leaveMs: Lv } = TRUCK;
  assert.equal(V.truckVisit(D - 1, D).phase, "idle");
  assert.equal(V.truckVisit(D, null).phase, "idle");
  const a0 = V.truckVisit(D, D);
  assert.equal(a0.phase, "arrive");
  assert.equal(a0.pos, 0);
  assert.equal(a0.remaining, Aa + L + Lv);
  assert.equal(V.truckVisit(D + Aa / 2, D).phase, "arrive");
  const l = V.truckVisit(D + Aa, D);
  assert.equal(l.phase, "load");
  assert.equal(l.pos, 0.5);
  assert.equal(l.driver, TRUCK.driver.wave);
  assert.ok(TRUCK.fx.load.includes(l.fx));
  const v = V.truckVisit(D + Aa + L + Lv / 2, D);
  assert.equal(v.phase, "leave");
  assert.ok(v.pos > 0.5 && v.pos < 1);
  assert.equal(V.truckVisit(D + Aa + L + Lv, D).phase, "idle");
  assert.equal(V.truckVisit(D + 10, D, { level: 10 }).phase, "idle");
  assert.equal(V.truckVisit(D + 10, D, { level: 11 }).phase, "arrive");
  // vị trí không giảm theo thời gian
  let prev = -1;
  for (let t = 0; t <= Aa + L + Lv - 1; t += 50) { const p = V.truckVisit(D + t, D).pos; assert.ok(p >= prev); prev = p; }
});

test("fuzz: nghìn sự kiện / lệnh nhận ngẫu nhiên — xu ≥ 0, món nguyên ≥ 0, mỗi nhiệm vụ nhận ≤ 1 lần (trừ bảng), tiến độ ≤ count", () => {
  let seed = 99;
  const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const items = ["ca-rot", "ngo", "lua", "trung-ga", "sua", "banh-trung", "bot-gao", "banh-bi-ngo", "bap-rang", FEED];
  const npcs = [...VILLAGERS.map((v) => v.id), "ong-x"];
  const mk = () => pick([
    () => ({ type: "harvested", crop: pick(["ngo", "lua", "ca-rot"]) }),
    () => ({ type: "planted", crop: "ca-rot" }),
    () => ({ type: "sold", count: Math.floor(rnd() * 6) - 1 }),
    () => ({ type: "delivered", npc: pick(npcs), orderType: pick(["thuong", "ket-hop", "dac-biet"]), items: { [pick(items)]: 1 } }),
    () => ({ type: "jobCollected", item: pick(items), qty: pick([1, 3, 0, -2, 1.5]) }),
    () => ({ type: "animalCollected", item: pick(["trung-ga", "sua"]), qty: 1 }),
    () => ({ type: "animalBought", kind: pick(["ga", "bo-sua"]) }),
    () => ({ type: "villageQuestDone" }), () => null, () => ({ type: 5 }),
  ])();
  for (let run = 0; run < 4; run++) {
    const vs = V.createVillage(), w = memWallet(0), inv = memInv({}, 40);
    let level = 5, now = T0;
    const claimedOnce = new Set();
    let claims = 0;
    for (let k = 0; k < 1500; k++) {
      now += Math.floor(rnd() * 10 * MIN);
      if (rnd() < 0.02) level = Math.min(20, level + 1);
      const c = ctx(level, { buildings: rnd() < 0.5 ? { "chuong-ga": 1, "chuong-bo": 1 } : {} });
      V.syncVillage(vs, c);
      const op = rnd();
      const snap = JSON.stringify([vs, w.value, inv.bag]);
      let r = null;
      if (op < 0.55) V.track(vs, Array.from({ length: 1 + Math.floor(rnd() * 4) }, mk), c);
      else if (op < 0.6) inv.add(pick(items), 1 + Math.floor(rnd() * 3));
      else if (op < 0.7) r = V.claimProgression(vs, pick([...PROGRESSION.map((q) => q.id), "x"]), io(inv, w), c);
      else if (op < 0.82) r = V.claimChainStep(vs, pick(npcs), Math.floor(rnd() * 4), io(inv, w), c);
      else if (op < 0.94) r = V.claimBoard(vs, Math.floor(rnd() * (vs.board.nextUid + 1)), io(inv, w), c);
      else if (op < 0.97) r = V.talk(vs, pick(npcs), now, c);
      else Object.assign(vs, V.sanitize(JSON.parse(JSON.stringify(vs)), now));
      if (r?.err) assert.equal(JSON.stringify([vs, w.value, inv.bag]), snap, `err ${r.err} đổi trạng thái`);
      if (r?.ok && r.events?.[0]?.type === "villageQuestClaimed") claims++;
      if (r?.ok && r.events?.[0]?.type === "villageQuestClaimed" && r.events[0].scope !== "board") {
        const key = r.events[0].scope + ":" + r.id;
        assert.ok(!claimedOnce.has(key), `nhận 2 lần ${key}`);
        claimedOnce.add(key);
      }
      assert.ok(Number.isFinite(w.value) && w.value >= 0);
      for (const q of Object.values(inv.bag)) assert.ok(Number.isInteger(q) && q > 0);
      assert.ok(vs.board.slots.length <= BOARD_SIZE);
      assert.equal(new Set(vs.board.slots.map((s) => s.tpl)).size, vs.board.slots.length);
      for (const s of vs.board.slots) assert.ok(Number.isInteger(s.progress) && s.progress >= 0 && s.progress <= REPEATABLE_BY_ID[s.tpl].count);
      const pq = PROGRESSION[vs.prog.i];
      assert.ok(vs.prog.progress >= 0 && vs.prog.progress <= (pq ? pq.count : 0));
      for (const v of VILLAGERS) {
        const st = vs.chains[v.id], q = v.chain.steps[st.step];
        assert.ok(st.step >= 0 && st.step <= 3 && st.progress >= 0 && st.progress <= (q ? q.count : 0));
      }
    }
    assert.ok(claims > 5, `fuzz quá ít lần nhận (${claims})`);
  }
});

test("tiến trình M4 chờ hướng dẫn M1 xong: tutorialDone(s) + ctx.tutorialDone; bảng / chuỗi không bị chặn; thoại có line", () => {
  assert.equal(V.tutorialDone({ quests: { tut: 0 } }), false);
  assert.equal(V.tutorialDone({ quests: { tut: TUTORIAL.length - 1 } }), false);
  assert.equal(V.tutorialDone({ quests: { tut: TUTORIAL.length } }), true);
  assert.equal(V.tutorialDone({ quests: { tut: TUTORIAL.length + 3 } }), true, "đã sang nhiệm vụ M2 vẫn là xong hướng dẫn");
  assert.equal(V.tutorialDone(null), false);
  const vs = V.createVillage();
  const locked = ctx(7, { buildings: { "chuong-ga": 1 }, tutorialDone: false });
  emit(vs, locked, { type: "tick" });
  assert.equal(vs.prog.progress, 0, "chuồng gà đã xây nhưng hướng dẫn chưa xong ⇒ chưa tính");
  const log = V.questLog(vs, locked);
  assert.equal(log.progression, null);
  assert.deepEqual([log.progressionNext.id, log.progressionNext.reason], ["xay-chuong-ga", "tutorial"]);
  assert.equal(V.claimProgression(vs, "xay-chuong-ga", io(), locked).err, "locked");
  assert.equal(log.board.length, BOARD_SIZE, "bảng lặp lại vẫn chạy");
  assert.equal(V.questLog(vs, ctx(5, { tutorialDone: true })).progressionNext.reason, "level");
  // hướng dẫn xong ⇒ trạng thái (chuồng đã xây) tính ngay
  const open = { ...locked, tutorialDone: true };
  const out = emit(vs, open, { type: "tick" });
  assert.ok(out.some((e) => e.type === "villageQuestDone" && e.id === "xay-chuong-ga"));
  assert.ok(V.claimProgression(vs, "xay-chuong-ga", io(), open).ok);
  // không truyền cờ (undefined) ⇒ không chặn (tương thích)
  assert.ok(V.questLog(V.createVillage(), ctx(7)).progression);
  // thoại: sự kiện npcTalked mang line (giao diện hiện câu thoại từ sự kiện)
  const t = V.talk(vs, "bac-tu", T0, ctx(7));
  assert.equal(t.events[0].type, "npcTalked");
  assert.equal(t.events[0].line, t.line);
  assert.ok(VILLAGER["bac-tu"].lines.includes(t.line));
});
