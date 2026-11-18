// Chạy thử Ai Là Nội Gián online trên máy: node games-server/ai-la-noi-gian/dev.js  (PORT mặc định 8770, NOIGIAN_SPEED tuỳ chọn)
process.env.PORT = process.env.PORT || "8770";
require("../../server.js").listen(Number(process.env.PORT), () => console.log(`Mở http://localhost:${process.env.PORT}/games/ai-la-noi-gian/`));
