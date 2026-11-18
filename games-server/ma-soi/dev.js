// Chạy thử Ma Sói online trên máy: node games-server/ma-soi/dev.js  (PORT mặc định 8766, MASOI_SPEED tuỳ chọn)
process.env.MASOI_ONLINE = "1";
process.env.PORT = process.env.PORT || "8766";
require("../../server.js").listen(Number(process.env.PORT), () => console.log(`Mở http://localhost:${process.env.PORT}/games/ma-soi/`));
