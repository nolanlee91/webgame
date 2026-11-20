// Khách (GAME-DESIGN §3.7) + phiếu kiểu Việt (§3.6). 13 vai sprite = 11 vai khách + chủ quán (owner) + phụ bàn (helper).
// self / call = xưng hô của khách với cô chủ (dùng trong câu thoại {self} {call} {Call}). patience = giây kiên nhẫn.
// shifts = trọng số xuất hiện theo ca; khuya = hệ số thêm cho nhịp khuya của ca tối. size = cỡ nhóm.
// mates = vai đi chung nhóm (worker2 / student2 là người khác cùng nhóm, để nhóm không là bản sao).

export const ROLES = ["owner", "helper", "office", "worker", "worker2", "student", "student2", "shipper", "regular", "reviewer", "driver", "nurse", "tourist"];

export const ARCHETYPES = {
  office: { sprite: "office", label: "Dân văn phòng", self: "em", call: "chị", patience: 40, size: [1, 2], shifts: { trua: 6, toi: 0.6 }, khuya: 0.2, unlock: 1,
    eat: 0.8, transfer: 0.7, sauce: "chen", mates: ["office"], names: ["Chị Thảo", "Chị Ngân", "Chị Trâm", "Chị Uyên", "Chị Hà"],
    quirks: { riengNuocMam: 0.5, khongMoHanh: 0.12, khongDoChua: 0.08, khongBi: 0.3 } },
  worker: { sprite: "worker", label: "Thợ công trình", self: "chú", call: "cô", patience: 55, size: [2, 4], shifts: { trua: 1, toi: 2.2 }, khuya: 2.4, unlock: 1,
    eat: 1, transfer: 0.05, sauce: "chan", mates: ["worker2", "worker2", "worker"], names: ["Chú Tư", "Chú Hai", "Chú Bảy", "Chú Mười"],
    quirks: { themCom: 0.4, themMoHanh: 0.2, chayCanh: 0.12 }, request: { com: 0.3, khan: 0.3 } },
  worker2: { sprite: "worker2", label: "Thợ trẻ", self: "em", call: "chị", patience: 55, size: [1, 3], shifts: { trua: 0.6, toi: 1.4 }, khuya: 2, unlock: 1,
    eat: 0.9, transfer: 0.15, sauce: "chan", mates: ["worker", "worker2"], names: ["Thợ Lực", "Anh Bin", "Anh Tâm", "Anh Sơn"],
    quirks: { themCom: 0.55, themMoHanh: 0.25 }, request: { com: 0.35, khan: 0.15 } },
  student: { sprite: "student", label: "Sinh viên", self: "em", call: "chị", patience: 50, size: [1, 2], shifts: { trua: 0.3, toi: 2.6 }, khuya: 0.7, unlock: 1,
    eat: 1, transfer: 0.35, sauce: "chan", mates: ["student2"], names: ["Tèo", "Khoa", "Tí", "Phúc"],
    quirks: { themCom: 0.25, khongDoChua: 0.1, khongBi: 0.2 }, request: { com: 0.15 } },
  student2: { sprite: "student2", label: "Sinh viên", self: "em", call: "chị", patience: 50, size: [1, 2], shifts: { trua: 0.3, toi: 2 }, khuya: 0.6, unlock: 1,
    eat: 1.1, transfer: 0.4, sauce: "chan", mates: ["student"], names: ["Mít", "Na", "Vy", "Thư"],
    quirks: { riengNuocMam: 0.2, khongMoHanh: 0.1, longDao: 0.4 } },
  shipper: { sprite: "shipper", label: "Shipper", self: "em", call: "chị", patience: 35, size: [1, 1], shifts: { trua: 2, toi: 1 }, khuya: 0.8, unlock: 4, takeaway: true,
    eat: 0, transfer: 1, sauce: "bich", mates: [], names: ["Chị giao hàng", "Anh giao hàng"], quirks: { themCom: 0.15, khongBi: 0.15 } },
  regular: { sprite: "regular", label: "Khách quen", self: "cô", call: "con", patience: 75, size: [1, 1], shifts: { trua: 0.3, toi: 0.9 }, khuya: 2.2, unlock: 1,
    eat: 1.4, transfer: 0, sauce: "chan", mates: [], names: ["Cô Út", "Bà Năm", "Chú Ba Râu"],
    quirks: { khongMoHanh: 0.15, chayCanh: 0.2, themMoHanh: 0.15 } },
  reviewer: { sprite: "reviewer", label: "Reviewer", self: "mình", call: "chị", patience: 55, size: [1, 2], shifts: { trua: 0.4, toi: 0.6 }, khuya: 1, unlock: 1, minRep: 55,
    eat: 1.2, transfer: 0.8, sauce: "chen", mates: ["reviewer"], names: ["Tí Mập Ăn Khuya", "Bé Su Review"], quirks: { chayCanh: 0.3, longDao: 0.3 } },
  driver: { sprite: "driver", label: "Tài xế đêm", self: "anh", call: "em", patience: 45, size: [1, 1], shifts: { trua: 0.2, toi: 0.8 }, khuya: 2.4, unlock: 1, thirsty: true,
    eat: 0.7, transfer: 0.2, sauce: "chan", mates: [], names: ["Tài xế Lộc", "Anh Quý", "Anh Tài"], quirks: { chayCanh: 0.5, themCom: 0.2 }, request: { khan: 0.25 } },
  nurse: { sprite: "nurse", label: "Điều dưỡng ca đêm", self: "em", call: "chị", patience: 45, size: [1, 2], shifts: { trua: 0.3, toi: 1.1 }, khuya: 1.2, unlock: 1,
    eat: 0.8, transfer: 0.6, sauce: "chen", mates: ["nurse"], names: ["Điều dưỡng Hạnh", "Chị Hằng", "Chị Loan"], quirks: { longDao: 0.6, khongMoHanh: 0.25, riengNuocMam: 0.3 } },
  tourist: { sprite: "tourist", label: "Khách du lịch", self: "tôi", call: "chị", patience: 60, size: [1, 2], shifts: { trua: 0.3, toi: 0.7 }, khuya: 0.6, unlock: 8,
    eat: 1.2, transfer: 0.5, sauce: "chen", mates: ["tourist"], names: ["Lucas", "Emma"], quirks: { riengNuocMam: 0.4, chayCanh: 0.2 } },
};
export const ARCH_IDS = Object.keys(ARCHETYPES);

/**
 * Phiếu kiểu Việt. need = lớp phải có trong món (khongBi chỉ ra với món có bì…); level = cấp mở; extra = dòng tính tiền thêm.
 * Hai biến thể xung đột (thêm / không mỡ hành) không ra cùng phiếu.
 */
export const QUIRKS = {
  themCom: { text: "thêm cơm", short: "+cơm", level: 1, extra: "com" },
  themMoHanh: { text: "thêm mỡ hành", short: "+mỡ hành", level: 1, not: ["khongMoHanh"], noVegan: true },
  khongMoHanh: { text: "không mỡ hành", short: "không mỡ hành", level: 1, not: ["themMoHanh"], noVegan: true },
  riengNuocMam: { text: "nước mắm để riêng", short: "mắm riêng", level: 1 },
  chayCanh: { text: "sườn cháy cạnh", short: "cháy cạnh", level: 1, need: "meat" },
  khongDoChua: { text: "không đồ chua", short: "không đồ chua", level: 1 },
  longDao: { text: "trứng lòng đào", short: "lòng đào", level: 2, need: "trung" },
  khongBi: { text: "không bì", short: "không bì", level: 3, need: "bi" },
};
export const QUIRK_IDS = Object.keys(QUIRKS);
