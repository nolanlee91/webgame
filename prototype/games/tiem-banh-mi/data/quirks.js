// Biến thể phiếu kiểu Việt (GAME-DESIGN §3.3). apply(item) sửa yêu cầu của một ổ. label = chữ trên phiếu, mark = kiểu icon (gạch / mũi tên).
// conflicts: không đi chung trên cùng một ổ. unlock = cấp mở. Thêm biến thể mới = thêm một dòng ở đây (core không cần sửa).
export const QUIRKS = {
  "khong-hanh": { label: "không hành", mark: "no", unlock: 1, apply: (it) => { it.veg["hanh-la"] = false; } },
  "khong-rau": { label: "không rau", mark: "no", unlock: 1, conflicts: ["khong-hanh"], apply: (it) => { it.veg["hanh-la"] = false; it.veg["rau-mui"] = false; } },
  "khong-do-chua": { label: "không đồ chua", mark: "no", unlock: 1, apply: (it) => { it.veg["do-chua"] = false; } },
  "it-ot": { label: "ít ớt", mark: "down", unlock: 1, conflicts: ["khong-ot", "nhieu-ot"], apply: (it) => { it.ot = 1; } },
  "khong-ot": { label: "không ớt", mark: "no", unlock: 1, conflicts: ["it-ot", "nhieu-ot"], apply: (it) => { it.ot = 0; } },
  "nhieu-ot": { label: "nhiều ớt", mark: "up", unlock: 1, conflicts: ["it-ot", "khong-ot"], apply: (it) => { it.ot = 3; } },
  "nhieu-pate": { label: "nhiều pate", mark: "up", unlock: 1, needs: (it) => (it.spreads.pate || 0) > 0, apply: (it) => { it.spreads.pate = 3; } },
  "gion-gion": { label: "giòn giòn nha", mark: "crisp", unlock: 1, apply: (it) => { it.crispy = true; } },
  "cat-doi": { label: "cắt đôi", mark: "cut", unlock: 1, apply: (it) => { it.wrap = "cat-doi"; } },
  "them-trung": { label: "thêm trứng (+5k)", mark: "up", unlock: 2, needs: (it) => !it.fills.includes("trung"), apply: (it) => { it.fills = [...it.fills, "trung"]; it.price += 5; } },
};
export const QUIRK_IDS = Object.keys(QUIRKS);
