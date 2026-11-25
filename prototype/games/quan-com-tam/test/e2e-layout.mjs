// E2E bố cục nhiều khung (TLC2-02): máy tính bảng dọc 768×1024, điện thoại xoay ngang 844×390 / 740×360, tablet ngang 1024×768,
// điện thoại hẹp 360×800 / 320×568. Mở ca ngày 1 rồi kiểm: không tràn ngang; nút thanh bếp (+Than, Quạt, Nấu cơm, Rửa chén), 6 vỉ,
// ô bày, Giao, dock đều có, nằm trọn trong khung (sau khi cuộn vùng chứa nếu cần) và không bị phần tử khác che (elementFromPoint 5 điểm).
// Gọi từ e2e.mjs (phần mobile) hoặc chạy riêng: LAYOUT_ONLY=1 PORT=… node prototype/games/quan-com-tam/test/e2e.mjs <thư mục ảnh>
const VIEWS = [[768, 1024], [844, 390], [740, 360], [1024, 768], [360, 800], [320, 568]];
const MUST = ['[data-act="addCoal"]', '[data-act="fan"]', '[data-act="cookRice"]', '[data-act="wash"]', ".gchip", ".strip .lay", '[data-act="serve"]', '[data-act="undo"]'];

export async function runLayout({ b, check, sleep, OUT, BASE, PORT, waitFor }) {
  for (const [w, h] of VIEWS) {
    const tag = `${w}×${h}`;
    await b.view(w, h, true, 2); await b.touch(true);
    await b.send("Page.navigate", { url: "about:blank" }); await sleep(600);
    await b.send("Storage.clearDataForOrigin", { origin: `http://127.0.0.1:${PORT}`, storageTypes: "local_storage" });
    await b.nav(BASE);
    await waitFor("!!document.querySelector('#introGo')", 6000);
    await b.ev("document.querySelector('#introGo').click()");
    await waitFor("__game.overlay==='prep'");
    check(`${tag}: bảng Chuẩn bị không tràn ngang`, await b.ev("document.documentElement.scrollWidth<=document.documentElement.clientWidth"));
    await b.ev(`document.querySelector('[data-act="restockToday"]')?.click()`); await sleep(150);
    await b.ev(`document.querySelector('[data-tab="first"]')?.click()`); await sleep(150);
    for (const a of ["prepCook", "prepMoHanh", "prepLight"]) { await b.ev(`document.querySelector('[data-act="${a}"]')?.click()`); await sleep(120); }
    await b.ev("document.querySelector('#openShop').click()");
    check(`${tag}: mở quán`, await waitFor("!!__game.state.shift"));
    await b.ev("__game.advance(20000)"); await sleep(300);
    check(`${tag}: trong ca không tràn ngang`, await b.ev("document.documentElement.scrollWidth<=document.documentElement.clientWidth"), String(await b.ev("document.documentElement.scrollWidth")));
    const bad = await b.ev(`(()=>{const bad=[];for(const sel of ${JSON.stringify(MUST)}){const es=[...document.querySelectorAll(sel)].filter(e=>!e.closest('[hidden]'));if(!es.length){bad.push(sel+' không có');continue;}
      for(const e of es){e.scrollIntoView({block:'center',inline:'nearest'});const r=e.getBoundingClientRect();
        if(!r.width||!r.height){bad.push(sel+' ẩn');continue;}
        if(r.bottom>innerHeight+1||r.top<-1||r.right>innerWidth+1||r.left<-1){bad.push(sel+' ngoài khung '+Math.round(r.left)+','+Math.round(r.top));continue;}
        for(const[fx,fy]of[[.5,.5],[.2,.25],[.8,.25],[.2,.75],[.8,.75]]){const x=r.left+r.width*fx,y=r.top+r.height*fy,t=document.elementFromPoint(x,y);if(!t||!(t===e||e.contains(t))){bad.push(sel+(e.dataset.slot??e.dataset.layer??'')+' bị che bởi '+(t?t.className||t.tagName:'null'));break;}}}}
      document.querySelector('#app').scrollTop=0;return bad})()`);
    check(`${tag}: nút thanh bếp, vỉ, ô bày, Giao đều bấm được (không mất, không bị che)`, bad.length === 0, bad.slice(0, 3).join(" | "));
    await b.shot(`${OUT}/layout-${w}x${h}.png`);
  }
}
