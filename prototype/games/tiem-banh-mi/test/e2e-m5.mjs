// E2E Milestone 5 (gọi từ test/e2e.mjs): âm thanh (không tải gì trước thao tác đầu, nhạc tải lười theo cảnh, nút 3 trạng thái, wgp.muted là công tắc tổng),
// bố cục mobile không che nút (elementFromPoint + giao hình chữ nhật với thông báo), khách đứng đúng chỗ xếp hàng theo manifest.placements.
import { sleep } from "./cdp.mjs";

const audioReq = (b) => b.ev("JSON.stringify(performance.getEntriesByType('resource').map(e=>e.name).filter(n=>n.includes('/assets/audio/')).map(n=>n.split('/').pop().split('?')[0]))").then(JSON.parse);

/** Gọi ngay sau khi mở trang mới (chưa thao tác gì). */
export async function audioBeforeGesture(ctx, tag) {
  const { b, check } = ctx;
  const req = await audioReq(b);
  const dbg = await b.ev("JSON.stringify(__game.sound())").then(JSON.parse);
  check(`${tag}: âm thanh — chưa thao tác thì không tạo AudioContext, không tải file nào`, req.length === 0 && dbg.ctx === null, JSON.stringify({ req, ctx: dbg.ctx }));
}
/** Gọi sau thao tác đầu tiên (đang ở màn chào / Chuẩn bị ca). */
export async function audioAfterGesture(ctx, tag) {
  const { b, check, waitFor } = ctx;
  await waitFor("__game.sound().ctx!==null", 3000);
  await sleep(900);
  const req = await audioReq(b);
  check(`${tag}: âm thanh — sau thao tác đầu: tải sẵn vài hiệu ứng nhỏ + nhạc chuẩn bị ca, chưa tải nhạc giờ cao điểm`,
    req.includes("bread-slice.mp3") && req.includes("prep-music-loop.mp3") && !req.includes("rush-music-loop.mp3"), req.join(","));
  // nút 3 trạng thái: bật hết → chỉ hiệu ứng → tắt (wgp.muted) → bật hết
  const st = [];
  for (let i = 0; i < 3; i++) {
    await b.ev("document.querySelector('#muteBtn').click()");
    st.push(await b.ev("JSON.stringify([document.querySelector('#muteBtn').dataset.mode,localStorage.getItem('wgp.muted'),localStorage.getItem('tbm.music')])"));
  }
  check(`${tag}: nút Tiếng 3 trạng thái (chỉ hiệu ứng → tắt bằng wgp.muted → bật hết)`,
    st[0].replace('null', '"0"') === '["sfx","0","0"]' && st[1] === '["off","1","0"]' && st[2] === '["all","0","1"]', st.join(" "));
  const miss = await b.ev("__game.sound().failed.length");
  check(`${tag}: âm thanh — không file nào lỗi tải`, miss === 0, String(miss));
}
/** Gọi khi ca đang mở: nhạc giờ cao điểm tải khi cần. */
export async function audioInShift(ctx, tag) {
  const { b, check } = ctx;
  await sleep(900);
  const req = await audioReq(b);
  const dbg = await b.ev("JSON.stringify(__game.sound())").then(JSON.parse);
  check(`${tag}: âm thanh — trong ca mới tải nhạc giờ cao điểm + phố sáng, mỗi file một lần`, req.includes("rush-music-loop.mp3") && req.includes("dawn-street-loop.mp3") && new Set(req).size === req.length,
    JSON.stringify({ req, loops: dbg.loops }));
}
