// Chạy thử Cờ Cá Ngựa online trên máy: node games-server/co-ca-ngua/dev.js  (PORT mặc định 8767)
process.env.COCANGUA_ONLINE = "1";
process.env.PORT = process.env.PORT || "8767";
require("../../server.js").listen(Number(process.env.PORT), () => console.log(`Mở http://localhost:${process.env.PORT}/games/co-ca-ngua/`));
