// Nhịp ca bán hàng. Thời gian tính bằng ms "thời gian ca" (dừng khi tạm dừng / hội thoại / rời tab), không phải giờ thật.
export const SHIFT_FEE = 12;          // phí ca (k), ghi một lần lúc mở cửa
export const START_MONEY = 160;       // vốn đầu (k)
export const START_REP = 35;          // danh tiếng 0–100
export const REP_CAP_PER_SHIFT = 8;   // giới hạn ±8 mỗi ca
export const REP_BY_STARS = { 1: -3, 2: -1, 3: 0, 4: 1, 5: 2 };
export const STAR_CUTS = [0, 40, 55, 70, 85]; // điểm thô 0–100 → 1..5 sao
export const QUEUE_MAX = 4;
export const WALK_MS = 2400;          // đi từ cửa tới chỗ đứng (và ngược lại)
export const ORDER_ANIM_MS = 700;     // dáng gọi món sau khi tới chỗ
export const REACT_MS = 2600;         // đứng phản ứng (vui / bực) trước khi về
export const IMPATIENT_AT = 0.35;     // còn ≤ 35% kiên nhẫn ⇒ dáng sốt ruột
export const REMAKE_PATIENCE_MS = 20000; // khách chịu chờ thêm khi tiệm làm lại ly
export const SPAWN_RETRY_MS = 3000;   // hàng chờ đầy ⇒ lượt khách lùi lại

/** Ngày học (ngày 1): đơn một ly có phiếu hướng dẫn, kiên nhẫn dài hơn, đúng 5 khách cố định. */
export const TUTORIAL_DAY = {
  duration: 150000, patienceMult: 1.5, hints: true,
  guests: [
    { at: 800,   arch: "hoc-sinh",   name: "Tí",      recipe: "tra-sua-truyen-thong", sugar: 50, ice: "it" },
    { at: 14000, arch: "van-phong",  name: "Anh Tùng", recipe: "tra-dao",             sugar: 50, ice: "vua" },
    { at: 30000, arch: "khach-quen", name: "Cô Tư",   recipe: "tra-sua-truyen-thong", sugar: 30, ice: "it" },
    { at: 46000, arch: "di-ngang",   name: "Anh Lộc", recipe: "tra-dao",              sugar: 70, ice: "nhieu" },
    { at: 62000, arch: "hoc-sinh",   name: "Bin",     recipe: "tra-sua-truyen-thong", sugar: 50, ice: "vua" },
  ],
};

/** Ngày thường: 6–10 khách, hai đợt cao điểm ở 00:50 và 02:20 (GAME-DESIGN). */
export const NORMAL_DAY = {
  duration: 180000, patienceMult: 1, hints: false,
  minGuests: 6, maxGuests: 10, rushes: [50000, 140000], rushWindow: 14000, firstAt: 1500, lastAt: 165000,
};

/** Vị trí trên cảnh 1280×720 (toạ độ điểm neo chân). Chỗ đứng chờ cạnh quầy, cửa ở bên phải. */
export const SPOTS = [[790, 505], [890, 540], [990, 575], [890, 625]];
export const DOOR = [1190, 470];
export const BARISTA = [520, 398];

/** Đơn nhiều ly (GAME-DESIGN: ngày 3 có đơn hai ly, sau đó tối đa ba ly giờ cao điểm). Kiên nhẫn cộng thêm mỗi ly thêm. */
export const MULTI_CUP = { twoFrom: { level: 3, day: 3 }, threeFromLevel: 10, two: 0.22, three: 0.14, patiencePerExtra: 0.6, maxCups: 3 };
/** Drama trong ca: tối đa bao nhiêu sự kiện chọn mỗi ca, cửa sổ thời gian (ms ca), khoảng cách tối thiểu giữa hai sự kiện. */
export const DRAMA = { perShiftEarly: 1, perShift: 2, manyFromDay: 4, firstAt: [22000, 55000], gap: [40000, 70000], closeBefore: 12000, betweenDaysChance: 0.75, flagDays: 3 };
