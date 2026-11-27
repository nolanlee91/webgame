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
    // TLC22-06: trang cũ có thể ghi lại bản lưu lúc pagehide sau khi đã xoá ⇒ chưa thấy màn chào thì xoá + mở lại (tối đa 3 lần)
    for (let k = 0; k < 3; k++) {
      await b.send("Page.navigate", { url: "about:blank" }); await sleep(600);
      await b.send("Storage.clearDataForOrigin", { origin: `http://127.0.0.1:${PORT}`, storageTypes: "local_storage" });
      await b.nav(BASE);
      if (await waitFor("!!document.querySelector('#introGo')", 6000)) break;
    }
    await b.ev("document.querySelector('#introGo').click()");
    await waitFor("__game.overlay==='prep'");
    check(`${tag}: bảng Chuẩn bị không tràn ngang`, await b.ev("document.documentElement.scrollWidth<=document.documentElement.clientWidth"));
    // TLC22-04: bấm Mở quán khi chưa nấu cơm / nhóm bếp ⇒ hỏi lại (Chuẩn bị nhanh / Vẫn mở quán), ca chưa mở; Chuẩn bị nhanh lo đủ
    await b.ev("document.querySelector('#openShop').click()"); await sleep(200);
    check(`${tag}: mở quán rỗng ⇒ hỏi lại, nút Chuẩn bị nhanh + Vẫn mở quán bấm được`, !(await b.ev("!!__game.state.shift")) &&
      (await b.ev("['#quickPrep','#openAnyway'].every(q=>{const e=document.querySelector(q);if(!e)return false;e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect(),t=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.width>=44&&r.height>=44&&!!t&&e.contains(t)})")));
    await b.ev("document.querySelector('#quickPrep').click()"); await sleep(200);
    check(`${tag}: Chuẩn bị nhanh ⇒ có sườn ướp, nồi cơm, bếp đã nhóm`, await b.ev("(()=>{const s=__game.state;return s.stock['suon-uop']>0&&s.kitchen.rice>0&&s.kitchen.coal>0})()"));
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
  await runSoundHeader({ b, check, sleep, OUT, BASE, PORT, waitFor });
}

/** D9-decide: ≤ 360 px nút Tiếng chỉ còn biểu tượng (3 trạng thái khác nhau), ô tiền thấy trọn ở 320 / 360 cả lúc Chuẩn bị lẫn trong ca,
 *  ở mọi trạng thái tiếng và với tiền 150k / 123,4tr / 1,2 tỷ (lúc Chuẩn bị lớp phủ nằm trên thanh đầu nên chỉ đo khung, không đo che). Nút ≥ 44 × 44, chữ đủ ở aria-label + title. 390 px vẫn hiện chữ. */
export async function runSoundHeader({ b, check, sleep, OUT, BASE, PORT, waitFor }) {
  const look = () => b.ev(`JSON.stringify((()=>{const m=document.querySelector('#chips .chip.money'),cs=document.querySelector('#chips'),bt=document.querySelector('#muteBtn'),r=m.getBoundingClientRect(),c=cs.getBoundingClientRect(),q=bt.getBoundingClientRect();
    const t=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2),ico=bt.querySelector('.snd-ico'),lb=bt.querySelector('.snd-l');
    return {mode:bt.dataset.mode,money:m.querySelector('b').textContent,full:m.scrollWidth<=m.clientWidth+1&&r.left>=c.left-.5&&r.right<=c.right+.5&&r.right<=innerWidth&&r.width>20,hit:!!t&&m.contains(t),
      bw:Math.round(q.width),bh:Math.round(q.height),ico:!!ico&&ico.getBoundingClientRect().width>0,svg:ico?ico.innerHTML:"",lb:!!lb&&lb.getBoundingClientRect().width>0,aria:bt.getAttribute('aria-label'),title:bt.title,ov:document.documentElement.scrollWidth<=innerWidth}})())`).then(JSON.parse);
  const LABEL = { all: "Tiếng: bật", sfx: "Tiếng: hiệu ứng", off: "Tiếng: tắt" };
  for (const [w, h] of [[320, 568], [360, 640], [390, 844]]) {
    await b.view(w, h, true, 2); await b.touch(true);
    for (let k = 0; k < 3; k++) {
      await b.send("Page.navigate", { url: "about:blank" }); await sleep(600);
      await b.send("Storage.clearDataForOrigin", { origin: `http://127.0.0.1:${PORT}`, storageTypes: "local_storage" });
      await b.nav(BASE);
      if (await waitFor("!!document.querySelector('#introGo')", 6000)) break;
    }
    await b.ev("document.querySelector('#introGo').click()");
    await waitFor("__game.overlay==='prep'");
    for (const phase of ["chuẩn bị", "trong ca"]) {
      if (phase === "trong ca") {
        await b.ev("document.querySelector('#openShop').click()"); await sleep(200);
        await b.ev("document.querySelector('#quickPrep')?.click()"); await sleep(200);
        await b.ev("document.querySelector('#openShop').click()");
        await waitFor("!!__game.state.shift"); await b.ev("__game.advance(5000)"); await sleep(200);
      }
      const bad = [], svgs = {}, seen = new Set();
      for (const money of [150, 123456, 1200000]) for (let i = 0; i < 3; i++) {
        await b.ev(`__game.state.money=${money}`); await b.ev("document.querySelector('#muteBtn').click()"); await sleep(120);
        const L = await look(); svgs[L.mode] = L.svg; seen.add(L.money);
        const iconOnly = w <= 360;
        const ok = L.full && (L.hit || phase === "chuẩn bị") && L.bw >= 44 && L.bh >= 44 && L.ov && L.aria === LABEL[L.mode] && L.title.startsWith(LABEL[L.mode]) && (iconOnly ? L.ico && !L.lb : L.lb && !L.ico);
        if (!ok) bad.push(JSON.stringify({ ...L, svg: undefined }));
        if (OUT && money === 1200000 && w <= 360) await b.shot(`${OUT}/tieng-${w}x${h}-${phase === "trong ca" ? "ca" : "prep"}-${L.mode}.png`);
      }
      const distinct = new Set(Object.values(svgs)).size === 3 && Object.keys(svgs).length === 3;
      check(`D9 nút Tiếng ${w}×${h} ${phase}: ${w <= 360 ? "chỉ biểu tượng (3 kiểu khác nhau)" : "hiện chữ"}, ô tiền thấy trọn ở mọi trạng thái tiếng, nút ≥ 44 px`,
        bad.length === 0 && distinct, bad.slice(0, 2).join(" | ") || `${Object.keys(svgs).join("/")} · ${[...seen].join(" / ")}`);
    }
  }
}
