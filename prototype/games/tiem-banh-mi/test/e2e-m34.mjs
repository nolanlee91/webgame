// E2E M3 + M4 (gọi từ test/e2e.mjs): tua tiến trình tới cấp 7 bằng hook __game, thuê tiệm bằng nút thật, cảnh tiệm, đơn đặt trước,
// bong bóng không che mặt chủ tiệm, Drama (chân dung HD, chọn bằng nút thật), Sổ: đổi tính cách ngay trên review rồi trả lời,
// chốt ca ⇒ thẻ Nhật Ký vẽ trên journal-card, Chơi lại ngày hôm nay (xác nhận + bản dự phòng).
import { sleep } from "./cdp.mjs";

export async function playM34(ctx, tag, shots = true) {
  const { b, OUT, PORT, BASE, check, pressSel, S, waitFor, clearDialogs } = ctx;
  await b.send("Page.navigate", { url: "about:blank" }); await sleep(300);
  await b.send("Storage.clearDataForOrigin", { origin: `http://127.0.0.1:${PORT}`, storageTypes: "local_storage" });
  await b.nav(BASE);
  check(`${tag}: màn chào có 4 thẻ tính cách`, (await b.ev("document.querySelectorAll('.pcard').length")) === 4);
  await pressSel('.pcard[data-persona="cucsuc"]');
  await pressSel("#introGo");
  check(`${tag}: tính cách chọn ở màn chào được lưu`, (await S("s.owner.persona")) === "cucsuc");
  await b.ev(`(()=>{const s=__game.state;s.level=7;s.xp=870;s.money=900;s.day=8;s.tutorialDone=true;s.rep=62;
    const L=[["Chị Uyên","office",2,"Dặn không hành mà hành ngập.","onionAnyway"],["Bin","student",5,"Giòn rụm, mai ghé nữa.","good"],["Anh Hải","worker",3,"Ổ ổn, chờ hơi lâu.","slow"]];
    for(const [name,arch,stars,line,reason] of L){s.nextReviewId++;s.feed.unshift({id:s.nextReviewId,day:7,name,arch,stars,line,reason,recipe:"cha-lua",src:"quan",reply:null});}
    s.drama.pending=null;__game.save();__game.overlays.prep(s);})()`);
  check(`${tag}: Chuẩn bị ca hỏi thuê mặt bằng ở cấp 7`, await waitFor(`!!document.querySelector('[data-act="rentShop"]')`));
  if (shots) await b.shot(`${OUT}/${tag}-m1-hoi-thue.png`);
  await pressSel('[data-act="rentShop"]');
  check(`${tag}: thuê tiệm ⇒ s.shop, lò gas, kỷ niệm xe đẩy trong Nhật Ký`, (await S("s.shop&&s.oven==='gas'&&s.journal[0].kind==='cart'")) === true);
  await waitFor("document.querySelector('#move').hidden", 6000);
  check(`${tag}: cảnh tiệm dùng shop-scene + shop-counter-foreground`, await waitFor(`!!document.querySelector('.stage img[src$="shop-scene.webp"]')&&!!document.querySelector('.stage img[src$="shop-counter-foreground.webp"]')`, 4000));
  await pressSel('[data-tab="pre"]');
  await pressSel('[data-act="acceptOffer"]');
  check(`${tag}: nhận đơn đặt trước ở Chuẩn bị ca (cọc vào tiền)`, (await S("s.preorders.filter(p=>p.day===s.day).length")) === 1);
  if (shots) await b.shot(`${OUT}/${tag}-m2-don-dat.png`);
  await pressSel('[data-tab="shop"]');
  if (shots) await b.shot(`${OUT}/${tag}-m3-nang-cap.png`);
  await pressSel('[data-tab="oven"]'); await pressSel('[data-act="prepBake"]');
  await waitFor("document.querySelector('.minioven .oven-lbl.golden')!==null", 12000); await pressSel('[data-act="prepPull"]');
  await pressSel("#openShop");
  check(`${tag}: mở ca ở tiệm, 2 ngăn lò, phiếu đặt trước có hạn`, (await waitFor("!!__game.state.shift")) && (await S("s.shift.oven.length")) === 2 && (await S("s.shift.customers.some(c=>c.pre)")));
  await b.ev("__game.state.shift.drama.max=0");
  let cid = null;
  for (let i = 0; i < 200 && cid === null; i++) { cid = await S("(s.shift.customers.find(c=>c.phase==='wait'&&!c.pre)||{}).id??null"); if (cid === null) await b.ev("__game.advance(300)"); }
  await b.ev("__game.advance(300)"); await sleep(120);
  const over = await b.ev(`(()=>{const f=__game.scene.bakerFace,w=document.querySelector('#scene').getBoundingClientRect(),out=[];
    for(const e of document.querySelectorAll('.bubble')){if(e.hidden)continue;const r=e.getBoundingClientRect(),x0=r.left-w.left,y0=r.top-w.top;out.push(x0<f.x1&&x0+r.width>f.x0&&y0<f.y1&&y0+r.height>f.y0)}return JSON.stringify(out)})()`);
  check(`${tag}: bong bóng thoại không che mặt chủ tiệm`, !JSON.parse(over).some(Boolean), over);
  check(`${tag}: khung cảnh thấy cả chủ tiệm và khách đầu hàng`, await b.ev(`(()=>{const v=__game.visibleRect(),P=__game.scene.points;return P.baker[0]>=v.x0&&P.baker[0]<=v.x1&&P.queue[0][0]>=v.x0&&P.queue[0][0]<=v.x1})()`));
  if (shots) await b.shot(`${OUT}/${tag}-m4-tiem-khach.png`);
  const r0 = await b.ev(`JSON.stringify(__game.openEvent("D02"))`);
  check(`${tag}: mở được hội thoại Drama (D02)`, await waitFor("__game.overlay==='event'", 3000), r0);
  await sleep(400);
  const frame = await b.ev(`(document.querySelector('#sheet .portrait')||{dataset:{}}).dataset.frame||''`);
  check(`${tag}: chân dung HD của Mẹ (drama-portraits-hd)`, frame.startsWith("drama/me"), frame);
  if (shots) await b.shot(`${OUT}/${tag}-m5-drama.png`);
  for (let i = 0; i < 6 && (await b.ev("__game.overlay==='event'")); i++) {
    if (await b.ev(`!!document.querySelector('#sheet [data-act="eventNext"],#sheet [data-act="eventDone"]')`)) await pressSel('#sheet [data-act="eventNext"], #sheet [data-act="eventDone"]');
    else await pressSel("#sheet .choice:not(:disabled)");
  }
  check(`${tag}: chọn xong Drama ⇒ lịch sử + khoảnh khắc Nhật Ký, ca chạy tiếp`, (await S("s.drama.history.length>=1&&s.shift.moments.some(m=>m.kind==='drama')")) === true && (await b.ev("__game.overlay")) === null);
  if (tag === "mobile") await pressSel('#dock [data-dock="book"]'); else await pressSel("#bookBtn");
  check(`${tag}: mở Sổ quản lý`, await waitFor("__game.overlay==='notebook'", 3000));
  const rid = await S("s.feed.find(r=>!r.reply&&r.reason==='onionAnyway').id");
  await pressSel(`#sheet [data-review="${rid}"]`);
  await pressSel('#sheet .persona-switch [data-persona="lay"]');
  check(`${tag}: đổi tính cách ngay trên review (cục súc → lầy lội)`, (await S("s.owner.persona")) === "lay" && (await S("s.owner.switches.length")) >= 1);
  await pressSel("#sheet [data-reply]");
  check(`${tag}: trả lời review kiểu lầy lội, lưu dưới review kèm hậu quả`, (await S(`(s.feed.find(r=>r.id===${rid}).reply||{}).persona`)) === "lay");
  if (shots) await b.shot(`${OUT}/${tag}-m6-so-review.png`);
  await pressSel('#sheet [data-tab="journal"]');
  if (shots) await b.shot(`${OUT}/${tag}-m7-so-nhat-ky.png`);
  await pressSel('#sheet [data-act="closeBook"]');
  await b.ev("__game.state.shift.schedule=[]");
  for (let i = 0; i < 300 && (await S("!!s.shift")); i++) {
    await b.ev("__game.advance(3000)"); await clearDialogs();
    if (await b.ev("__game.overlay==='event'")) await b.ev("document.querySelector('#sheet .choice:not(:disabled), #sheet [data-act=eventDone]')?.click()");
  }
  for (let i = 0; i < 5 && (await b.ev("__game.overlay==='event'")); i++) await b.ev("document.querySelector('#sheet .choice:not(:disabled), #sheet [data-act=eventDone], #sheet [data-act=eventNext]')?.click()");
  check(`${tag}: chốt ca ở tiệm có câu Nhật Ký`, (await waitFor("__game.overlay==='summary'", 6000)) && !!(await S("s.lastSummary.headline")));
  if (shots) await b.shot(`${OUT}/${tag}-m8-chot-ca.png`);
  await pressSel('[data-act="journal"]');
  check(`${tag}: thẻ Nhật Ký vẽ xong trên journal-card`, await waitFor("document.querySelector('#journalCanvas')?.dataset.ready==='1'", 6000));
  await sleep(300);
  if (shots) await b.shot(`${OUT}/${tag}-m9-the-nhat-ky.png`);
  await pressSel('[data-act="closeJournal"]');
  const day = await S("s.lastSummary.day");
  await pressSel('[data-act="replayDay"]');
  check(`${tag}: Chơi lại ngày hôm nay hỏi xác nhận`, await waitFor("__game.overlay==='confirm-replay'"));
  await pressSel('[data-act="replayYes"]');
  await sleep(900); await b.waitGame(); await waitFor("!!document.querySelector('#app.ready')", 8000);
  check(`${tag}: chơi lại ⇒ về đầu ngày ${day}, bản trước ở .before-replay`, (await S("s.day")) === day && !(await S("!!s.shift")) && !!(await b.ev("localStorage.getItem('wgp.tiembanhmi.v1.before-replay')")));
}
