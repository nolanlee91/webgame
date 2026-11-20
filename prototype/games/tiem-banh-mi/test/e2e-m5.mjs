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

/** Không nút nào bị che: với từng nút (Giao, Hoàn tác, dải bước, nút dock) cuộn tới, elementFromPoint ở tâm + 4 góc trong phải trúng chính nút;
 *  thông báo đang hiện (pointer-events: none nên elementFromPoint không thấy) không được giao hình chữ nhật với nút nào. Gọi khi ổ đã gói. */
export async function coverChecks(ctx, tag) {
  const { b, check } = ctx;
  // bắn vài thông báo (lỗi thao tác hiện toast) rồi đo ngay
  await b.ev("__game.act({type:'take'});__game.act({type:'slice'});__game.act({type:'pin',cid:-1})");
  const res = await b.ev(`(()=>{
    const sels=['[data-act="serve"]','[data-act="undo"]','#bench .steps li','#dock button'];
    const out=[];const toasts=[...document.querySelectorAll('#toasts .toast')].filter(t=>getComputedStyle(t).display!=='none').map(t=>t.getBoundingClientRect());
    const hit=(r,e)=>{const pts=[[.5,.5],[.15,.2],[.85,.2],[.15,.8],[.85,.8]];return pts.every(([fx,fy])=>{const x=r.left+r.width*fx,y=r.top+r.height*fy;if(x<0||y<0||x>innerWidth||y>innerHeight)return true;const t=document.elementFromPoint(x,y);return !!t&&(t===e||e.contains(t))})};
    const inter=(a,c)=>a.left<c.right&&a.right>c.left&&a.top<c.bottom&&a.bottom>c.top;
    for(const sel of sels){for(const e of document.querySelectorAll(sel)){if(e.closest('[hidden]')||getComputedStyle(e).display==='none'||!e.getBoundingClientRect().width)continue;
      if(!e.closest('#dock'))e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();
      out.push({sel,txt:(e.textContent||'').trim().slice(0,12),ok:hit(r,e),toast:toasts.some(t=>inter(t,r))});}}
    return JSON.stringify({n:out.length,toasts:toasts.length,bad:out.filter(x=>!x.ok||x.toast)});})()`).then(JSON.parse);
  check(`${tag}: không nút nào bị che (Giao, Hoàn tác, dải bước, dock) — elementFromPoint + thông báo không đè`, res.n >= 4 && res.bad.length === 0, JSON.stringify(res).slice(0, 400));
  // bong bóng thoại đục và không đè chip HUD / viên Lò
  const bub = await b.ev(`(()=>{const hud=[...document.querySelectorAll('#hud .chip,#pills > *')].map(e=>e.getBoundingClientRect()).filter(r=>r.width);
    const inter=(a,c)=>a.left<c.right&&a.right>c.left&&a.top<c.bottom&&a.bottom>c.top;
    return JSON.stringify([...document.querySelectorAll('.bubble')].filter(e=>!e.hidden).map(e=>{const cs=getComputedStyle(e);const r=e.getBoundingClientRect();return {op:cs.opacity,bg:cs.backgroundColor,hud:hud.some(h=>inter(h,r))}}))})()`).then(JSON.parse);
  check(`${tag}: bong bóng thoại đục, không đè HUD`, bub.every((x) => x.op === "1" && !/rgba\(.*, 0\.[0-9]+\)$/.test(x.bg) && !x.hud), JSON.stringify(bub));
}
/** Khách đang chờ đứng đúng một chỗ trong manifest.placements (queueSpots / cartQueueSpots); người đầu hàng ở chỗ gần chủ tiệm nhất. */
export async function queueChecks(ctx, tag) {
  const { b, check } = ctx;
  const r = await b.ev(`(()=>{const s=__game.state,P=__game.scene.points;const m=s.shop?'queueSpots':'cartQueueSpots';
    return (async()=>{const man=await (await fetch('data/asset-manifest.json?v=b3')).json();
      const spots=man.placements[m];const w=s.shift.customers.filter(c=>c.phase==='wait'&&!c.pre);
      const pos=w.map(c=>__game.scene.posOf(s,c.id));
      const onSpot=pos.every(p=>spots.some(q=>Math.abs(q[0]-p[0])<1&&Math.abs(q[1]-p[1])<1));
      const baker=s.shop?man.placements.baker.at:man.placements['cart-baker'].at;
      const front=spots.reduce((a,q)=>Math.abs(q[0]-baker[0])<Math.abs(a[0]-baker[0])?q:a,spots[0]);
      return JSON.stringify({n:w.length,onSpot,front:P.queue[0][0]===front[0]&&P.queue[0][1]===front[1],pos});})();})()`).then(JSON.parse);
  check(`${tag}: khách chờ đứng đúng chỗ xếp hàng của manifest, đầu hàng gần chủ tiệm`, r.n >= 1 && r.onSpot && r.front, JSON.stringify(r));
}
