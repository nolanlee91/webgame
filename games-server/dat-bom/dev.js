// Chạy thử Đặt Bom online trên máy: node games-server/dat-bom/dev.js  (PORT mặc định 8768)
process.env.PORT = process.env.PORT || "8768";
require("../../server.js").listen(Number(process.env.PORT), () => console.log(`Mở http://localhost:${process.env.PORT}/games/dat-bom/`));
