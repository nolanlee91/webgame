// Bot tham lam chơi thử từng màn để chỉnh độ khó: node tools/sim.mjs [số ván mỗi màn]
import { LEVELS, newGame, shoot, bestShot, swapBalls, clone } from "../logic.js";
const games = +process.argv[2] || 30, jit = +(process.argv[3] || 0) * Math.PI / 180; // tham số 2: độ lệch tay (độ) giả lập người chơi
for (let lv = 1; lv <= LEVELS.length; lv++) {
  let won = 0, stars = [0, 0, 0, 0], left = 0, t0 = Date.now();
  for (let g = 0; g < games; g++) {
    const s = newGame({ level: lv, seed: 1000 + g * 7 });
    while (s.status === "playing") {
      let b = bestShot(s, 60);
      const t = clone(s); swapBalls(t); const b2 = bestShot(t, 60);
      if (b2.score > b.score) { swapBalls(s); b = b2; }
      shoot(s, b.a + (jit ? (Math.random() * 2 - 1) * jit : 0));
    }
    if (s.status === "won") { won++; stars[s.stars]++; left += s.shots; }
  }
  console.log(`màn ${lv}: thắng ${won}/${games}  sao1/2/3 ${stars.slice(1).join("/")}  dư TB ${(won ? left / won : 0).toFixed(1)}  ${Date.now() - t0}ms`);
}
