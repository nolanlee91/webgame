// Khoe kết quả (lên cấp / danh hiệu Sổ sưu tập / danh hiệu Nhà): nội dung thẻ từ số thật của nông trại. Thuần, không DOM (test Node).
import * as L from "../logic.js?v=m13";

const fmtNum = (n) => n.toLocaleString("vi-VN");
const clip = (t) => (t.length > 40 ? t.slice(0, 39) + "…" : t);

/**
 * kind "level": lên cấp nông trại · "title": danh hiệu Sổ sưu tập (title = tên danh hiệu, mặc định danh hiệu hiện có)
 * · "fame": nâng Nhà ⇒ danh hiệu danh tiếng mới (houseLv = bậc Nhà 1-based vừa xong, như BUILDING.nha.levels[houseLv - 1]).
 */
export function farmShare(s, kind, title, houseLv) {
  const v = L.bookView(s), st = s.stats || {};
  const lines = [`Cấp nông trại: ${s.level}`, `Xu đã kiếm: ${fmtNum(st.earned || 0)} xu`, `Đơn đã giao: ${fmtNum(st.delivered || 0)}`, `Sổ sưu tập: ${v.unlocked}/${v.total} món`];
  if (kind === "level") {
    const tg = s.level >= 20 ? "Cả làng gọi là đại điền chủ rồi đó nha." : s.level >= 10 ? "Gà vịt bò heo đông đủ, sắp thành trang trại kiểu mẫu." : s.level >= 5 ? "Ruộng xanh mướt, hàng xóm bắt đầu hỏi xin giống." : "Mới mấy luống rau mà đã lên cấp, nông dân có khiếu!";
    return { game: "nong-trai", title: `Lên cấp ${s.level}!`, lines: lines.slice(1), tagline: tg, accent: "#9fd86f" };
  }
  if (kind === "fame") {
    const levels = L.BUILDING.nha.levels, lv = Math.min(levels.length, Math.max(1, houseLv | 0));
    const name = L.FAME_TITLES[lv - 1], bonus = Math.round((levels[lv - 1].effect.orderBonus || 0) * 100);
    const top = lv >= levels.length;
    const tg = top ? "Bậc Nhà cao nhất rồi, cả làng ngước nhìn!" : lv >= 8 ? "Nhà cao cửa rộng, danh tiếng vang xa khắp vùng." : lv >= 5 ? "Nhà mới khang trang, khách tới đặt hàng nườm nượp." : "Nhà đẹp hơn, đơn hàng trả thêm xu, sướng ghê!";
    return { game: "nong-trai", title: clip(`“${name}”`), lines: [`Nhà: bậc ★${lv - 1}`, `Đơn hàng trả thêm: +${bonus} % xu`, lines[0], lines[1]], tagline: tg, accent: "#9fd86f" };
  }
  const t = title || v.title;
  const head = t ? `Danh hiệu “${t}”` : `Nông trại cấp ${s.level}`;
  const tg = v.unlocked >= v.total ? "Đủ cả cuốn sổ, nhà nông kiêm nhà sưu tầm!" : t ? "Danh hiệu mới, cả xóm phải gọi bằng anh/chị." : "Sổ còn trống nhiều, mai đi gom tiếp.";
  return { game: "nong-trai", title: clip(head), lines, tagline: tg, accent: "#9fd86f" };
}
