// m7 — "công dụng" công trình (data/building-info.js): mọi công trình / máy có đủ use / gain / next ở mọi level,
// số trong gain lấy đúng từ data (đổi data ⇒ chữ đổi theo), nâng cấp có dòng "trước → sau".
import test from "node:test";
import assert from "node:assert/strict";
import { about, statsOf, machineSlots, BUILDING_INFO, MACHINE_INFO } from "../data/building-info.js?v=m11";
import { BUILDINGS, BUILDING, FAME_TITLES } from "../data/buildings.js?v=m11";
import { WAREHOUSE, OVERFLOW_MAX } from "../data/warehouse.js?v=m11";
import { ANIMAL } from "../data/animals.js?v=m11";
import { MACHINES, MACHINE } from "../data/machines.js?v=m11";

const fmt = (n) => n.toLocaleString("vi-VN");
const nonEmpty = (t) => typeof t === "string" && t.trim().length > 3;

test("mọi công trình trên bản đồ có công dụng đủ trường ở mọi level (xây + nâng)", () => {
  for (const b of BUILDINGS) {
    assert.ok(BUILDING_INFO[b.id] || (b.kind === "machine" && MACHINE_INFO[b.machine]), `${b.id}: thiếu mục công dụng`);
    for (let lv = 1; lv <= b.levels.length; lv++) {
      for (const from of [0, lv - 1]) {
        const a = about(b.id, lv, from);
        assert.ok(a, `${b.id} cấp ${lv}`);
        assert.ok(nonEmpty(a.use) && nonEmpty(a.next) && nonEmpty(a.title), `${b.id} cấp ${lv}: use/next/title`);
        assert.ok(Array.isArray(a.gain) && a.gain.length >= 1 && a.gain.every(nonEmpty), `${b.id} cấp ${lv} từ ${from}: gain rỗng`);
        assert.ok(a.gain.length <= 4, `${b.id}: gain quá dài cho trẻ đọc (${a.gain.length} dòng)`);
        assert.ok(!/undefined|NaN|null/.test([a.use, a.next, a.title, ...a.gain].join(" ")), `${b.id} cấp ${lv}: chữ lỗi ${a.gain}`);
      }
    }
  }
});

test("mọi máy trong Xưởng có công dụng đủ trường ở mọi level", () => {
  for (const m of MACHINES) {
    for (let lv = 1; lv <= m.upgrades.length + 1; lv++) {
      const a = about(m.id, lv, lv - 1, "machine");
      assert.ok(nonEmpty(a.use) && nonEmpty(a.next) && a.gain.length >= 1 && a.gain.every(nonEmpty), `${m.id} cấp ${lv}`);
      assert.ok(!/undefined|NaN/.test(a.gain.join(" ")), `${m.id}: ${a.gain}`);
    }
  }
});

test("gain Nhà kho khớp sức chứa trong data/warehouse.js; nâng cấp hiện trước → sau", () => {
  const b = about("nha-kho", 1, 0);
  assert.ok(b.gain.some((g) => g.includes(String(WAREHOUSE[0].cap))), b.gain.join(" | "));
  assert.ok(b.gain.some((g) => g.includes(String(WAREHOUSE[1].cap))), "xây xong: báo mốc nâng đầu");
  assert.ok(b.gain.some((g) => g.includes(String(OVERFLOW_MAX))), "nhắc giỏ tràn tối đa");
  for (let lv = 2; lv <= BUILDING["nha-kho"].levels.length; lv++) {
    const a = about("nha-kho", lv);
    assert.equal(a.change[0], `Kho: ${fmt(WAREHOUSE[lv - 2].cap)} → ${fmt(WAREHOUSE[lv - 1].cap)} chỗ`);
    assert.equal(a.title, `Nhà kho lên cấp ${lv}!`);
    assert.equal(statsOf("nha-kho", lv)[0].value, WAREHOUSE[lv - 1].cap);
  }
  // nâng nhảy 2 mốc (thẻ dồn) ⇒ trước = mốc đã xem
  assert.equal(about("nha-kho", 4, 2).change[0], `Kho: ${fmt(WAREHOUSE[1].cap)} → ${fmt(WAREHOUSE[3].cap)} chỗ`);
});

test("gain chuồng / Nhà kính / đất phía Đông / Xưởng / Nhà khớp effect trong data/buildings.js", () => {
  const eff = (id, lv) => BUILDING[id].levels[lv - 1].effect;
  for (const [id, key, kind] of [["chuong-ga", "chickenCap", "ga"], ["chuong-bo", "cowCap", "bo-sua"]]) {
    const a = about(id, 1, 0);
    assert.ok(a.gain[0].includes(`${eff(id, 1)[key]} `), a.gain[0]);
    assert.ok(a.gain[0].includes(`${ANIMAL[kind].buy} xu`), a.gain[0]);
    for (let lv = 2; lv <= BUILDING[id].levels.length; lv++) assert.ok(about(id, lv).change[0].endsWith(`${eff(id, lv - 1)[key]} → ${eff(id, lv)[key]} con`), about(id, lv).change[0]);
  }
  assert.ok(about("nha-kinh", 1, 0).gain[0].startsWith(`${eff("nha-kinh", 1).greenhousePlots} ô`));
  assert.equal(about("nha-kinh", 2).change[0], `Ô Nhà kính: ${eff("nha-kinh", 1).greenhousePlots} → ${eff("nha-kinh", 2).greenhousePlots} ô`);
  assert.ok(about("dat-phia-dong", 1, 0).gain[0].includes(`+${eff("dat-phia-dong", 1).eastPlots} ô`));
  assert.ok(about("xuong", 2).change[0].endsWith(`${eff("xuong", 1).extraQueueSlots} → ${eff("xuong", 2).extraQueueSlots} ô`));
  assert.ok(about("xuong", 1, 0).gain[0].includes(MACHINES.find((m) => m.withWorkshop).name));
  for (let lv = 2; lv <= BUILDING.nha.levels.length; lv++) {
    const a = about("nha", lv);
    assert.equal(a.title, `Nhà lên bậc ★${lv - 1}!`);
    assert.ok(a.change.some((g) => g.includes(FAME_TITLES[lv - 2]) && g.includes(FAME_TITLES[lv - 1])), a.change.join(" | "));
    assert.ok(a.change.some((g) => g.includes(`+${Math.round(eff("nha", lv).orderBonus * 100)} % xu`)), a.change.join(" | "));
  }
});

test("gain máy: số món chờ khớp data/machines.js (2 → 3 → 4)", () => {
  for (const m of MACHINES) {
    assert.ok(about(m.id, 1, 0, "machine").gain[0].includes(String(machineSlots(m.id, 1))));
    m.upgrades.forEach((u, k) => assert.ok(about(m.id, k + 2, k + 1, "machine").change[0].endsWith(`${machineSlots(m.id, k + 1)} → ${u.slots} món`)));
  }
  assert.equal(about("coi-xay-gio", 1, 0).use, about("coi-xay", 1, 0, "machine").use, "Cối xay gió trên bản đồ = máy Cối xay");
  assert.equal(about("noi-duong", 1, 0, "machine").gain.at(-1), `Đặt trong ${BUILDING[MACHINE["noi-duong"].requires].name}.`);
});

test("không gõ cứng số: đổi data ⇒ chữ đổi theo (sức chứa kho, số gà)", () => {
  const cap = WAREHOUSE[1].cap, chick = BUILDING["chuong-ga"].levels[0].effect.chickenCap;
  try {
    WAREHOUSE[1].cap = 97;
    assert.equal(about("nha-kho", 2).change[0], `Kho: ${WAREHOUSE[0].cap} → 97 chỗ`);
  } finally { WAREHOUSE[1].cap = cap; }
  // BUILDING đóng băng ⇒ kiểm gián tiếp: con số trong gain đúng bằng effect hiện tại
  assert.ok(about("chuong-ga", 1, 0).gain[0].includes(`Nuôi được ${chick} gà`));
});
