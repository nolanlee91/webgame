// Chạy thử Cờ Vua online trên máy: node games-server/co-vua/dev.js  (PORT mặc định 8768)
process.env.COVUA_ONLINE = "1";
process.env.PORT = process.env.PORT || "8768";
require("../../server.js").listen(Number(process.env.PORT), () => console.log(`Mở http://localhost:${process.env.PORT}/games/co-vua/`));
