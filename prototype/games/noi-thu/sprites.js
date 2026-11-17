// 16 mặt thú pixel 16×16 — vẽ bằng code (không dùng ảnh AI). Mỗi hàng chỉ ghi NỬA TRÁI (8 ô),
// nửa phải lật gương tự động nên mặt luôn cân đối. Ký tự = ô màu theo bảng pal (chung + riêng từng con), "." = trong suốt.
// Viền ngoài 1 ô tối (k) đúng Art Bible V5 mục 2.1.
export const BASE = { k: "#2b1d14", e: "#18100c", w: "#ffffff", n: "#d9576b", p: "#f3a3b0", o: "#f08a24" };

export const ANIMALS = [
  { id: "meo", name: "Mèo", pal: { a: "#a9afb8", b: "#6f7680", c: "#f6f1e8" }, rows: [
    "........", ".kk.....", ".kak....", ".kpak...", ".kppakkk", ".kaaaaab", "kaaaaaaa", "kaaaaaab",
    "kaaweaaa", "kaaeeaaa", "kcaaaaaa", "kccaacnn", ".kccccck", "..kccckc", "...kkkkk", "........"] },
  { id: "tho", name: "Thỏ", pal: { a: "#f4f1ec", b: "#d8d0c4" }, rows: [
    "..kk....", ".kak....", ".kpak...", ".kpak...", ".kpak...", ".kpakkkk", "..kaaaaa", ".kaaaaaa",
    "kaaaaaaa", "kaaweaaa", "kaaeeaaa", "kppaaaan", "kbaaaakk", ".kbaaaak", "..kkbbbb", "....kkkk"] },
  { id: "cao", name: "Cáo", pal: { a: "#e8762d", b: "#7a3212", c: "#f7efe3" }, rows: [
    "........", "k.......", "kk......", "kbk.....", "kbak....", "kaaakkkk", "kaaaaaaa", "kaaaaaaa",
    "kaaweaaa", "kaaeeaaa", "kccaaaaa", ".kcccccc", "..kcccce", "...kcccc", "....kkkk", "........"] },
  { id: "gau-truc", name: "Gấu trúc", pal: { a: "#f4f1ec", d: "#2a2a2e" }, rows: [
    "........", "........", ".dd.....", "dddkkkkk", "ddaaaaaa", "kdaaaaaa", "kaaaaaaa", "kadddaaa",
    "kadwdaaa", "kadddaaa", "kaaaaaaa", "kaaaaaad", ".kaaaaka", ".kaaaaaa", "..kkaaaa", "....kkkk"] },
  { id: "cho", name: "Chó", pal: { a: "#d39a5a", b: "#7a4a22", c: "#f2dfc0" }, rows: [
    "........", "........", "...kkkkk", "..kaaaaa", "kkaaaaaa", "kbbaaaaa", "kbbaaaaa", "kbbaaaaa",
    "kbbweaaa", "kbbeeaaa", "kbkaaaaa", ".kaacccc", ".kacccce", "..kccckc", "...kcccc", "....kkkk"] },
  { id: "heo", name: "Heo", pal: { a: "#f0a3ac", b: "#c95f72", c: "#f9c9cf" }, rows: [
    "........", "..kk....", "..kbk...", "..kbbkkk", "..kaaaaa", ".kaaaaaa", "kaaaaaaa", "kaaweaaa",
    "kaaeeaaa", "kaaaaaaa", "kaaakkkk", "kaaakccc", "kaaakcec", "kaaakccc", ".kaaakkk", "..kkkkkk"] },
  { id: "ech", name: "Ếch", pal: { a: "#6fbf4a", b: "#3d7a2a", c: "#bfe39a" }, rows: [
    "........", "........", "..kkk...", ".kwwwk..", "kwweewkk", "kwweewaa", "kawwwaaa", "kaaaaaaa",
    "kaaaaaaa", "kpaaaaaa", "kakaaaaa", "kaakkkkk", ".kaccccc", "..kkkkkk", "........", "........"] },
  { id: "ga-con", name: "Gà con", pal: { a: "#f5cf3c", b: "#d9a520" }, rows: [
    "........", ".......k", "......ka", "...kkkaa", "..kaaaaa", ".kaaaaaa", ".kaaaaaa", "kaaweaaa",
    "kaaeeaaa", "kpaaaaoo", "kaaaaaao", ".kaaaaaa", ".kbaaaaa", "..kbbaaa", "...kkkkk", "........"] },
  { id: "gau", name: "Gấu", pal: { a: "#9a6233", b: "#5e3a1c", c: "#dcb88e" }, rows: [
    "........", "........", ".kkk....", "kabakkkk", "kabaaaaa", ".kaaaaaa", "kaaaaaaa", "kaaweaaa",
    "kaaeeaaa", "kaaaaccc", "kaaaccce", "kaaaccck", ".kaaaccc", ".kaaaaaa", "..kkaaaa", "....kkkk"] },
  { id: "chuot", name: "Chuột", pal: { a: "#b9b3ae", b: "#8a837d" }, rows: [
    ".kkk....", "kappk...", "kpppk...", "kpppkkkk", ".kkaaaaa", "..kaaaaa", ".kaaaaaa", "kaaweaaa",
    "kaaeeaaa", "kaaaaaaa", ".kaaaaan", ".kbaaakk", "..kbaaaa", "...kbbbb", "....kkkk", "........"] },
  { id: "bo", name: "Bò", pal: { a: "#f4f1ec", d: "#2b2b2b", c: "#f2b6b0", h: "#e8d9a8" }, rows: [
    "........", "..hk....", "..hhkkkk", "..kaaaaa", "kkaaddaa", "kakaddaa", "kkaaaaaa", ".kaweaaa",
    ".kaeeaaa", ".kaaaaaa", ".kcccccc", "kccccecc", "kccccccc", ".kcccccc", "..kkkkkk", "........"] },
  { id: "cu-meo", name: "Cú mèo", pal: { a: "#8a5a34", b: "#d1b083" }, rows: [
    "........", ".k......", ".kakkkkk", ".kaaaaaa", "kaaaaaaa", "kawwwwaa", "kaweewaa", "kaweewaa",
    "kawwwwao", "kbaaaaao", "kbbbaaaa", ".kbbbbbb", ".kbbkbbb", "..kbbbbb", "...kkkkk", "........"] },
  { id: "khi", name: "Khỉ", pal: { a: "#8f5a33", c: "#f0c9a0" }, rows: [
    "........", "........", "...kkkkk", "..kaaaaa", ".kaaaaaa", "kkaacccc", "kcaccccc", "kcacwecc",
    "kkaceecc", ".kaccccc", ".kacccce", ".kaccckc", "..kacccc", "...kkkkk", "........", "........"] },
  { id: "ho", name: "Hổ", pal: { a: "#f08a2a", d: "#2b1d14", c: "#fbf3e6" }, rows: [
    "........", "........", ".kk.....", ".kckkkkk", "kaaaadaa", "kaaaadaa", "kdaaaaaa", "kdaweaaa",
    "kaaeeaaa", "kdaaaaaa", "kccaaccc", "kcccccce", ".kcccckk", "..kcccck", "...kkkkk", "........"] },
  { id: "chim-canh-cut", name: "Chim cánh cụt", pal: { d: "#26303a", c: "#f4f1ec" }, rows: [
    "........", "........", "...kkkkk", "..kddddd", ".kdddddd", ".kddcccc", "kddccccc", "kdccwecc",
    "kdcceecc", "kdccccoo", "kdccccco", ".kdccccc", ".kddcccc", "..kddccc", "...kkkkk", "........"] },
  { id: "cuu", name: "Cừu", pal: { w: "#f2ead8", d: "#4a3a33", y: "#ffffff", p: "#e58c98" }, rows: [
    "........", "..kk.kk.", ".kwwkwwk", "kwwwwwww", "kwwwwwww", "kddwdddd", "kkdwdddd", ".kwdyydd",
    ".kwdeydd", ".kwddddd", ".kwddddp", "..kddddd", "...kdddd", "....kkkk", "........", "........"] },
];

// 20 icon đồ vật/trái cây — cũng vẽ bằng code, cùng khung 16×16, cùng viền tối. 16 thú + 20 icon = 36 loại ô.
// Đây là bộ hình tạm (placeholder): khi chủ dự án duyệt bộ 36 hình thật, chỉ cần thay mảng này (hoặc thay renderAnimal
// bằng cắt từ ảnh) — logic không phụ thuộc hình, chỉ dùng số thứ tự loại.
export const ITEMS = [
  { id: "tao", name: "Táo", pal: { a: "#d93a32", b: "#8e1f1a", g: "#4caf3d", s: "#6b4423" }, rows: [
    "........", ".......s", ".....ggs", "..kkkkkk", ".kawaaaa", "kawwaaaa", "kawaaaaa", "kaaaaaaa",
    "kaaaaaaa", "kaaaaaaa", "kbaaaaaa", ".kbaaaaa", ".kbbaaaa", "..kbbbbb", "...kkkkk", "........"] },
  { id: "dau", name: "Dâu", pal: { a: "#e0393e", g: "#4caf3d", y: "#f8e08e" }, rows: [
    "........", "...gg.gg", "..kggggg", ".kaaagga", "kaaaaaaa", "kayaaaya", "kaaaayaa", ".kayaaaa",
    ".kaaaaya", "..kayaaa", "..kaaaaa", "...kaaya", "....kaaa", ".....kaa", "......kk", "........"] },
  { id: "nam", name: "Nấm", pal: { a: "#d63c34", c: "#efe0c0" }, rows: [
    "........", "........", "....kkkk", "..kkaaaa", ".kawwaaa", "kaaaaaww", "kawaaaww", "kawwaaaa",
    "kkkkkkkk", "....kccc", "....kcec", "....kccc", "...kcccc", "...kkkkk", "........", "........"] },
  { id: "la", name: "Lá", pal: { g: "#5bb04a", d: "#2f6e2a" }, rows: [
    "......kk", ".....kgd", "....kggd", "...kgggd", "..kggggd", "..kgdggd", ".kgggdgd", ".kggggdd",
    ".kgdgggd", ".kggdggd", "..kgggdd", "..kggggd", "...kgggd", "....kkkd", ".......d", ".......d"] },
  { id: "hoa", name: "Hoa", pal: { m: "#f07aa6", y: "#ffd23e", g: "#4caf3d" }, rows: [
    "........", "....kkkk", "..kkmmmm", ".kmmmmmm", ".kmmmkkk", "kmmmkyyy", "kmmmkyyy", "kmmmkyyy",
    ".kmmmkkk", ".kmmmmmm", "..kkmmmm", "....kkkg", "....gg.g", ".....ggg", ".......g", "........"] },
  { id: "sao", name: "Ngôi sao", pal: { y: "#ffd23e", d: "#d99a1c" }, rows: [
    "........", ".......k", "......ky", "......ky", ".....kyy", "kkkkkkyy", "kyyyyyyy", ".kyyyyyy",
    "..kyyyyy", "...kyyyy", "...kyyyy", "..kyyyyk", "..kyykk.", ".kykk...", ".kk.....", "........"] },
  { id: "tim", name: "Trái tim", pal: { a: "#e8405a" }, rows: [
    "........", "........", "..kkkk..", ".kwaaakk", "kwwaaaaa", "kwaaaaaa", "kaaaaaaa", "kaaaaaaa",
    ".kaaaaaa", "..kaaaaa", "...kaaaa", "....kaaa", ".....kaa", "......kk", "........", "........"] },
  { id: "mat-troi", name: "Mặt trời", pal: { y: "#ffcf3a", o: "#f08a24" }, rows: [
    ".......o", ".o.....o", "..o.....", ".....kkk", "....kyyy", "...kyyyy", "...kyyyy", "oo.kyyyy",
    "...kyyyy", "...kyyyy", "....kyyy", ".....kkk", "..o.....", ".o.....o", ".......o", "........"] },
  { id: "may", name: "Mây", pal: { w: "#e9f2fa", b: "#a9c3db" }, rows: [
    "........", "........", "........", ".....kkk", "..kkkwww", ".kwwwwww", ".kwwwwww", "kwwwwwww",
    "kwwwwwww", "kbwwwwww", ".kbbbbbb", "..kkkkkk", "........", "........", "........", "........"] },
  { id: "giot-nuoc", name: "Giọt nước", pal: { c: "#3f97d8", l: "#a8dcf7" }, rows: [
    "......kk", "......kc", ".....kcc", ".....kcc", "....kccc", "...kcccc", "..klcccc", "..klcccc",
    ".kllcccc", ".klccccc", ".kcccccc", ".kcccccc", "..kccccc", "...kkkkk", "........", "........"] },
  { id: "chuong", name: "Chuông", pal: { y: "#f2b632", d: "#a8741a" }, rows: [
    "........", ".......k", "......kk", ".....kyy", "....kyyy", "...kywyy", "...kywyy", "...kyyyy",
    "..kyyyyy", "..kyyyyy", ".kyyyyyy", "kddddddd", "kkkkkkkk", ".....kdd", "......kk", "........"] },
  { id: "kim-cuong", name: "Kim cương", pal: { c: "#5fd0e8", l: "#c9f3fb", d: "#2a8fb0" }, rows: [
    "........", "........", "...kkkkk", "..klllcl", ".kllllcc", "kkkkkkkk", ".kccdccc", "..kccdcc",
    "...kccdc", "....kccd", ".....kcc", "......kc", ".......k", "........", "........", "........"] },
  { id: "co-bon-la", name: "Cỏ bốn lá", pal: { g: "#4caf50", d: "#2e7d32" }, rows: [
    "........", "..kkkk..", ".kggggk.", "kgggggk.", "kgggggdk", ".kkkgddd", "...kkddd", ".kkkgddd",
    "kgggggdd", "kggggggk", ".kggggk.", "..kkkk.d", ".......d", "......d.", "........", "........"] },
  { id: "hat-de", name: "Hạt dẻ", pal: { a: "#c58a4a", c: "#6b4423", s: "#4a2f18" }, rows: [
    ".......k", ".......s", "....kkks", "..kkcccc", ".kcccccc", "kcckccck", "kkkkkkkk", ".kaaaaaa",
    ".kawaaaa", ".kaaaaaa", "..kaaaaa", "..kaaaaa", "...kaaaa", "....kkaa", "......kk", "........"] },
  { id: "trung", name: "Trứng", pal: { u: "#fbf6ea", s: "#ddcfb2", t: "#c9a26a" }, rows: [
    "........", "......kk", ".....kuu", "....kuuu", "...kwuuu", "..kwuutu", "..kuuuuu", ".kuuuuuu",
    ".kutuuuu", ".kuuuuut", ".kuuuuuu", ".ksuuuuu", "..ksuuuu", "...kssss", "....kkkk", "........"] },
  { id: "dua-hau", name: "Dưa hấu", pal: { r: "#e8404a", g: "#3f9a3c", l: "#bfe39a" }, rows: [
    "........", "........", "........", "........", "kkkkkkkk", "krrrrrrr", "klrrerrr", "klrrrrer",
    ".klrrrrr", ".kglrrrr", "..kgllll", "...kgggg", "....kkkk", "........", "........", "........"] },
  { id: "banh", name: "Bánh", pal: { f: "#f5a9c4", c: "#d9a25a", d: "#a8741a", r: "#d93a32" }, rows: [
    "........", "......kk", "......kr", "...kkkff", "..kfffff", ".kfwffff", ".kffffff", "kfffffff",
    "kkkkkkkk", ".kcdcdcd", ".kcdcdcd", "..kcdcdc", "..kcdcdc", "...kkkkk", "........", "........"] },
  { id: "ca-rot", name: "Cà rốt", pal: { o: "#f08a24", g: "#4caf3d" }, rows: [
    "....g..g", ".....g.g", "......gg", ".....kkk", "....kooo", "....kooo", "....kook", ".....koo",
    ".....koo", ".....koo", "......ko", "......ko", ".......k", "........", "........", "........"] },
  { id: "keo", name: "Kẹo", pal: { a: "#9c5bd6", l: "#d6b3f2" }, rows: [
    "........", "........", "........", "........", "........", "kk...kkk", "kak.kaal", "kaakaala",
    "kaakaaaa", "kak.kaaa", "kk...kkk", "........", "........", "........", "........", "........"] },
  { id: "kem", name: "Kem", pal: { s: "#8fe0c0", c: "#d9a25a", d: "#a8741a" }, rows: [
    "........", "......kk", "....kkss", "...kssss", "..kswsss", "..ksssss", ".kssssss", ".kkkkkkk",
    "..kcdccd", "...kcdcc", "...kdccd", "....kcdc", ".....kcc", "......kc", ".......k", "........"] },
];

// Toàn bộ 36 loại ô theo thứ tự dùng trong game (loại 1..36).
export const TILES = [...ANIMALS, ...ITEMS];

// Vẽ 1 con thú ra canvas 16×16 (dùng lại nhiều lần, phóng to bằng drawImage tắt làm mịn).
export function renderAnimal(a, doc = document) {
  const cv = doc.createElement("canvas"); cv.width = 16; cv.height = 16;
  const x = cv.getContext("2d"); const pal = { ...BASE, ...a.pal };
  a.rows.forEach((half, r) => {
    const row = half + [...half].reverse().join("");
    [...row].forEach((ch, c) => { if (ch !== "." && pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(c, r, 1, 1); } });
  });
  return cv;
}
