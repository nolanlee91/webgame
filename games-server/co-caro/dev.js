// Chạy thử Cờ Caro online trên máy: node games-server/co-caro/dev.js  (PORT mặc định 8768)
process.env.COCARO_ONLINE = "1";
process.env.PORT = process.env.PORT || "8768";
require("../../server.js").listen(Number(process.env.PORT), () => console.log(`Mở http://localhost:${process.env.PORT}/games/co-caro/`));
