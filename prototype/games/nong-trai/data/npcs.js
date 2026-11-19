// Nhân vật (DESIGN-2.0 §5). portrait: ô chân dung trong assets/v3/<sheet>.webp (mặc định npc.webp; 128 px, 4 × 2). null ⇒ huy hiệu chữ cái màu.
export const NPCS = [
  { id: "chi-ba", name: "Chị Ba Lúa", role: "Quản lý nông trại", color: "#8a5a2b", initial: "B", portrait: { col: 3, row: 1 } },
  { id: "co-hai", name: "Cô Hai Hạt Giống", role: "Chủ chợ", color: "#4f8a2b", initial: "H", portrait: { col: 3, row: 0 } },
  { id: "bac-tu", name: "Bác Tư Lò Bánh", role: "Thợ làm bánh", color: "#b4532a", initial: "T", portrait: { col: 3, row: 0, sheet: "npc-2" } },
  { id: "anh-ut", name: "Anh Út Xe Tải", role: "Giao hàng", color: "#2f6fa8", initial: "Ú", portrait: { col: 3, row: 1, sheet: "npc-2" } },
];
export const NPC = Object.freeze(Object.assign(Object.create(null), Object.fromEntries(NPCS.map((n) => [n.id, n]))));
export const NPC_SHEET = { cols: 4, rows: 2, cell: 128 };
/** Cô Hai nói sau quầy chợ (xoay vòng). {up} ⇒ tên một món đang lên giá (nếu có). */
export const MARKET_LINES = [
  "Hôm nay {up} được giá đó con, bán đi!",
  "Hạt giống cô để sẵn, con gieo tới đâu trả tới đó.",
  "Trời này trồng ngô là trúng mùa nha.",
  "Giá đổi mỗi ba tiếng, canh mũi tên lên mà bán.",
  "Mứt dâu nhà làm bán chạy lắm, Bác Tư mê lắm.",
  "Đơn của bà con trả hơn chợ, nhớ giữ hàng cho đơn nghen.",
];
