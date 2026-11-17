// Từ điển nhỏ cố định cho test hợp đồng (không phụ thuộc words.json đang được soạn).
export const TEST_WORDS = [
  'học tập', 'tập vở', 'vở viết', 'viết thư', 'thư từ', 'từ điển', 'điển hình', 'hình ảnh', 'ảnh chụp',
  'tập thể', 'thể thao', 'thao tác', 'học sinh', 'sinh nhật', 'nhật ký', 'ký ức',
  'hoà bình', 'bình minh', 'minh hoạ', 'mặt trời', 'trời xanh', 'xanh lá', 'lá cây', 'cây cối', 'cối xay',
  'xay lúa', 'lúa gạo', 'gạo nếp', 'bàn ghế', 'ghế gỗ', 'gỗ lim',
  'số ba', 'ba ba', // 'ba ba' là đường nối duy nhất của chính nó ⇒ kiểm tra từ cụt tính SAU khi trừ từ vừa dùng
];
export const MATCH = 'm1';
export const SEATS = [
  { kind: 'human', id: 'an', name: 'An', token: 'tok-an' },
  { kind: 'human', id: 'binh', name: 'Bình', token: 'tok-binh' },
];
export const SERVER_T0 = 1_000_000;  // giờ server giả
export const CLIENT_T0 = 5_000;      // giờ client giả — lệch hẳn để kiểm tra bù lệch giờ
