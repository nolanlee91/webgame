// Chạy thử Cờ Tỷ Phú online trên máy: node games-server/co-ty-phu/dev.js  (PORT mặc định 8769)
process.env.PORT = process.env.PORT || "8769";
require("../../server.js").listen(Number(process.env.PORT), () => console.log(`Mở http://localhost:${process.env.PORT}/games/co-ty-phu/`));
