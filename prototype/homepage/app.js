(function () {
  "use strict";
  // Lụm Kèo — trang chủ "The Grand Arcade Lobby" (docs/homepage-redesign-spec.md).
  // 3 tầng: (1) hero trượt nhiều game + sảnh chờ trực tiếp · (2) kho game theo danh mục (cùng lưới 6 ô) · (3) footer.
  var GAMES = window.GAMES, CATS = window.CATEGORIES, SLIDES = window.HERO_SLIDES || [];
  var ROOMS = window.LOBBY_ROOMS || [], DUELS = window.DUELS || [], SHELVES = window.SHELVES || [];
  var MUTE_KEY = "wgp.muted", HERO_MS = 5500;
  var state = { cat: "all", q: "", roomGame: "all", slide: 0 };

  var $ = function (id) { return document.getElementById(id); };
  var grid = $("grid"), chips = $("chips"), count = $("count"), empty = $("empty");

  // Bỏ dấu tiếng Việt để tìm "dao vang" vẫn ra "Đào Vàng".
  function fold(s) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function byId(id) { return GAMES.filter(function (g) { return g.id === id; })[0]; }
  // Game đã có bản chơi thật thì mở thẳng (field url trong games.js); game chưa làm vẫn vào trang chờ play.html.
  function href(g) { return g.url || "play.html?game=" + encodeURIComponent(g.id); }
  // Game chưa có bản chơi thật → thẻ mờ ảnh + nhãn "Đang cập nhật".
  function soon(g) { return !g.url; }
  function soonCls(g) { return soon(g) ? " is-soon" : ""; }
  var SOON = '<span class="soon" aria-hidden="true">Đang cập nhật</span>';
  function soonSr(g) { return soon(g) ? '<span class="sr-only"> (đang cập nhật)</span>' : ""; }
  var duelIds = DUELS.map(function (d) { return d.id; });

  // Icon người chơi pixel 16×16 (vẽ bằng ô vuông, không nét cong).
  var P1 = '<path d="M6 1h4v1H6zM5 2h1v4H5zM10 2h1v4h-1zM6 6h4v1H6zM4 8h8v1H4zM3 9h1v5H3zM12 9h1v5h-1zM4 14h8v1H4z"/>';
  var P2 = '<path d="M3 2h4v1H3zM2 3h1v3H2zM7 3h1v3H7zM3 6h4v1H3zM1 8h8v1H1zM0 9h1v5H0zM9 9h1v5H9zM1 14h8v1H1zM10 2h3v1h-3zM13 3h1v3h-1zM10 6h3v1h-3zM11 8h4v1h-4zM15 9h1v5h-1zM12 14h3v1h-3z"/>';
  function pxIcon(path) { return '<svg class="px-svg" viewBox="0 0 16 16" aria-hidden="true">' + path + "</svg>"; }

  function imgHTML(g, src) {
    return '<img src="' + (src || g.thumb) + '" alt="" loading="lazy" decoding="async" />';
  }
  function badgeHTML(g) {
    if (soon(g)) return SOON;
    if (!g.badge) return "";
    return '<span class="badge badge--' + (g.badge === "Hot" ? "hot" : "new") + '">' + g.badge + "</span>";
  }
  function metaHTML(g) {
    var multi = g.mode !== "solo";
    return '<p class="meta' + (multi ? " meta--multi" : "") + '">' + pxIcon(multi ? P2 : P1) +
      "<span>" + g.players + (multi ? '<span class="sr-only">, chơi cùng bạn được</span>' : "") + "</span></p>";
  }

  // ---------- TẦNG 1: hero trượt (carousel) ----------
  var slides = SLIDES.map(function (s) { var g = byId(s.id); return g ? { g: g, s: s } : null; }).filter(Boolean);
  function slideHTML(x, i) {
    var g = x.g, s = x.s;
    var img = '<img src="' + g.thumb + '" alt="" decoding="async"' + (i ? ' loading="lazy"' : ' fetchpriority="high"') + " />";
    return '<a class="card slide' + soonCls(g) + '" href="' + href(g) + '" data-id="' + g.id + '" role="group" aria-roledescription="trang" aria-label="' + (i + 1) + " / " + slides.length + ": " + g.name + '">' +
      '<span class="hero__art">' + img + "</span>" +
      '<span class="hero__info">' +
        '<span class="hero__tags"><span class="kicker">' + esc(s.kicker || "") + "</span>" + badgeHTML(g) + "</span>" +
        '<h3 class="hero__name">' + g.name + "</h3>" +
        '<span class="hero__text">' + esc(s.text || "") + "</span>" +
        '<span class="hero__row">' +
          '<span class="btn btn--gold" aria-hidden="true"><svg class="px-svg" viewBox="0 0 16 16"><path d="M4 2h2v12H4zM6 3h2v10H6zM8 4h2v8H8zM10 5h2v6h-2zM12 7h1v2h-1z"/></svg>Chơi ngay</span>' +
          '<span class="hero__stats">' + metaHTML(g) + '<span class="hero__stat"><span class="live" aria-hidden="true"></span>' + esc(s.stat || "") + "</span></span>" +
        "</span>" +
      "</span></a>";
  }
  var track = $("heroTrack"), dots = $("heroDots"), heroEl = document.querySelector(".hero");
  function renderHero() {
    track.innerHTML = slides.map(slideHTML).join("");
    dots.innerHTML = slides.map(function (x, i) {
      return '<button type="button" class="hero__dot" data-i="' + i + '" aria-label="' + x.g.name + '"></button>';
    }).join("");
    heroEl.classList.toggle("is-single", slides.length < 2);
    goSlide(0, true);
  }
  function goSlide(i, instant) {
    var n = slides.length; if (!n) return;
    state.slide = (i + n) % n;
    track.classList.toggle("no-anim", !!instant);
    track.style.transform = "translateX(" + (-100 * state.slide) + "%)";
    [].forEach.call(track.children, function (el, k) {
      var on = k === state.slide;
      el.setAttribute("aria-hidden", String(!on)); el.tabIndex = on ? 0 : -1;
      if ("inert" in el) el.inert = !on;
    });
    [].forEach.call(dots.children, function (d, k) { d.setAttribute("aria-current", String(k === state.slide)); });
  }
  // Tự chuyển sau HERO_MS; dừng khi rê chuột / đang focus / tab ẩn; tắt hẳn nếu máy đặt "giảm chuyển động".
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches, timer = null, hold = 0;
  function arm() { clearTimeout(timer); if (!reduce && !hold && !document.hidden && slides.length > 1) timer = setTimeout(function () { goSlide(state.slide + 1); arm(); }, HERO_MS); }
  function pause() { hold++; clearTimeout(timer); }
  function resume() { hold = Math.max(0, hold - 1); arm(); }
  $("heroPrev").addEventListener("click", function () { goSlide(state.slide - 1); arm(); });
  $("heroNext").addEventListener("click", function () { goSlide(state.slide + 1); arm(); });
  dots.addEventListener("click", function (e) { var d = e.target.closest(".hero__dot"); if (d) { goSlide(+d.dataset.i); arm(); } });
  heroEl.addEventListener("mouseenter", pause); heroEl.addEventListener("mouseleave", resume);
  heroEl.addEventListener("focusin", pause); heroEl.addEventListener("focusout", resume);
  document.addEventListener("visibilitychange", arm);
  heroEl.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { goSlide(state.slide - 1); e.preventDefault(); }
    if (e.key === "ArrowRight") { goSlide(state.slide + 1); e.preventDefault(); }
  });
  // Vuốt ngang trên điện thoại để chuyển game; vuốt xong thì không tính là bấm vào thẻ.
  var sx = null, sy = 0, swiped = false;
  track.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; swiped = false; pause(); }, { passive: true });
  track.addEventListener("touchend", function (e) {
    if (sx == null) return;
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { swiped = true; goSlide(state.slide + (dx < 0 ? 1 : -1)); }
    resume();
  });
  track.addEventListener("click", function (e) { if (swiped) { e.preventDefault(); swiped = false; } }, true);

  // ---------- TẦNG 1: sảnh chờ trực tiếp (số giả) ----------
  function roomHref(r) { var g = byId(r.game); return g && g.url ? g.url : "play.html?room=" + r.code; }
  function seatsHTML(r) {
    var s = "";
    for (var i = 0; i < r.max; i++) s += '<i class="' + (i < r.have ? "on" : "") + '"></i>';
    return '<span class="seats" aria-hidden="true">' + s + "</span>";
  }
  function roomHTML(r) {
    var g = byId(r.game); if (!g) return "";
    return '<li class="room' + soonCls(g) + '">' +
      '<span class="room__art">' + imgHTML(g) + "</span>" +
      '<span class="room__info"><span class="room__name">' + g.name + ' <span class="room__no">#' + r.no + "</span></span>" +
        '<span class="room__meta"><span class="room__host"><img src="assets/ui/icon-chu-phong.png" alt="" width="16" height="16" />' + esc(r.host) + "</span>" +
        '<span class="room__side">' + seatsHTML(r) + '<span class="room__cnt">' + r.have + "/" + r.max + '<span class="sr-only"> người</span></span></span></span></span>' +
      '<a class="btn btn--teal btn--sm room__go" href="' + roomHref(r) + '" data-room="' + r.code + '" aria-label="Vào phòng ' + g.name + " số " + r.no + ", " + r.have + " trên " + r.max + ' người' + (soon(g) ? ", đang cập nhật" : "") + '">' + (soon(g) ? "Sắp có" : "Vào") + "</a>" +
    "</li>";
  }
  // Tab lọc phòng theo game (theo thứ tự xuất hiện trong danh sách phòng).
  var roomGames = ROOMS.map(function (r) { return r.game; }).filter(function (id, i, a) { return byId(id) && a.indexOf(id) === i; });
  function renderRooms() {
    var list = ROOMS.filter(function (r) { return state.roomGame === "all" || r.game === state.roomGame; });
    $("roomGames").innerHTML = ["all"].concat(roomGames).map(function (id) {
      var n = id === "all" ? ROOMS.length : ROOMS.filter(function (r) { return r.game === id; }).length;
      return '<button type="button" class="chip" data-g="' + id + '" aria-pressed="' + (id === state.roomGame) + '">' +
        (id === "all" ? "Tất cả" : byId(id).name) + ' <span class="tab__n">' + n + "</span></button>";
    }).join("");
    $("rooms").innerHTML = list.map(roomHTML).join("");
    $("roomCount").textContent = list.length;
  }
  $("roomGames").addEventListener("click", function (e) {
    var b = e.target.closest(".chip"); if (!b) return;
    state.roomGame = b.dataset.g; renderRooms();
    $("rooms").scrollTop = 0;
  });

  // ---------- TẦNG 2: kho game ----------
  // Mọi kệ dùng CÙNG một kiểu ô (4:3, lưới 6 ô/dòng). Game đối kháng có thêm nhãn số phòng đang mở trên ảnh.
  function tileHTML(g) {
    var d = DUELS.filter(function (x) { return x.id === g.id; })[0];
    var rooms = d && !soon(g) ? '<span class="tile__rooms"><span class="live" aria-hidden="true"></span>' + d.rooms + " phòng</span>" : "";
    return '<a class="card tile' + soonCls(g) + '" href="' + href(g) + '" data-id="' + g.id + '">' +
      '<span class="tile__art">' + imgHTML(g) + badgeHTML(g) + rooms + "</span>" +
      '<span class="tile__body"><h3 class="card__name">' + g.name + soonSr(g) + "</h3>" + metaHTML(g) + "</span></a>";
  }
  // Game chơi được lên trước, game "Đang cập nhật" xuống cuối (giữ thứ tự gốc trong từng nhóm).
  function playableFirst(list) {
    return list.map(function (g, i) { return [g, i]; })
      .sort(function (a, b) { return (soon(a[0]) - soon(b[0])) || (a[1] - b[1]); })
      .map(function (x) { return x[0]; });
  }
  function shelfHTML(cls, title, hint, list) {
    return '<div class="shelf shelf--' + cls + '"><h3 class="shelf__title">' + title + ' <span class="count">' + list.length +
      '</span><span class="shelf__hint">' + hint + '</span></h3><div class="tiles">' + playableFirst(list).map(tileHTML).join("") + "</div></div>";
  }

  function matches(g) {
    if (state.cat === "multi" && g.mode === "solo") return false;
    if (state.cat !== "all" && state.cat !== "multi" && g.cat !== state.cat) return false;
    if (state.q && fold(g.name).indexOf(fold(state.q)) === -1) return false;
    return true;
  }
  function countIn(catId) {
    return GAMES.filter(function (g) {
      return catId === "all" ? true : catId === "multi" ? g.mode !== "solo" : g.cat === catId;
    }).length;
  }
  function renderChips() {
    chips.innerHTML = CATS.map(function (c) {
      return '<button type="button" class="tab" data-cat="' + c.id + '" aria-pressed="' + (c.id === state.cat) + '">' +
        c.label + ' <span class="tab__n">' + countIn(c.id) + "</span></button>";
    }).join("");
  }
  function renderGrid() {
    var list = GAMES.filter(matches), html = "";
    if (state.cat === "all" && !state.q) {
      // "Tất cả": kệ Đối kháng đông người trước, rồi từng danh mục (không lặp game đã có ở kệ Đối kháng).
      var duels = duelIds.map(byId).filter(Boolean);
      html += shelfHTML("duel", "Đối kháng đông người", "Rủ bạn vào phòng, chơi ngay trên trình duyệt", duels);
      SHELVES.forEach(function (sh) {
        var items = list.filter(function (g) { return g.cat === sh.cat && duelIds.indexOf(g.id) === -1; });
        if (items.length) html += shelfHTML(sh.cat, sh.title, sh.hint, items);
      });
      var rest = list.filter(function (g) { return duelIds.indexOf(g.id) === -1 && !SHELVES.some(function (sh) { return sh.cat === g.cat; }); });
      if (rest.length) html += shelfHTML("other", "Game khác", "", rest);
    } else if (list.length) {
      html = '<div class="shelf shelf--flat"><div class="tiles">' + playableFirst(list).map(tileHTML).join("") + "</div></div>";
    }
    grid.innerHTML = html;
    count.textContent = list.length;
    var label = CATS.filter(function (c) { return c.id === state.cat; })[0].label;
    $("gamesTitle").firstChild.textContent = (state.q ? "Kết quả tìm kiếm " : state.cat === "all" ? "Tất cả game " : label + " ");
    empty.hidden = list.length > 0;
  }

  function renderFeatured() { $("featuredSection").hidden = !!state.q; }
  function renderAll() { renderChips(); renderFeatured(); renderRooms(); renderGrid(); }

  chips.addEventListener("click", function (e) {
    var b = e.target.closest(".tab");
    if (!b) return;
    state.cat = b.dataset.cat;
    renderChips(); renderGrid();
  });
  $("q").addEventListener("input", function (e) {
    state.q = e.target.value.trim();
    renderFeatured(); renderGrid();
  });
  $("clearSearch").addEventListener("click", function () {
    $("q").value = ""; state.q = ""; state.cat = "all";
    renderAll();
  });
  // Mobile: chuyển ô tìm kiếm từ thanh trên xuống đầu trang để thanh trên chỉ còn 1 hàng gọn.
  var searchEl = document.querySelector(".search"), topInner = document.querySelector(".topbar__inner");
  var mq = window.matchMedia("(max-width: 720px)");
  function placeSearch() {
    if (mq.matches) $("mobileSearchSlot").appendChild(searchEl);
    else topInner.insertBefore(searchEl, document.querySelector(".topbar__actions"));
  }
  (mq.addEventListener ? mq.addEventListener("change", placeSearch) : mq.addListener(placeSearch));
  placeSearch();

  // Mã phòng: 6 ký tự chữ + số. Dùng chung cho ô PIN ở sảnh chờ và hộp thoại "Nhập mã".
  function cleanCode(input) {
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  }
  function tryJoin(input, errEl) {
    if (!/^[A-Z0-9]{6}$/.test(input.value)) {
      errEl.textContent = "Mã phòng gồm đúng 6 chữ hoặc số.";
      input.focus();
      return;
    }
    location.href = "play.html?room=" + input.value;
  }

  var inl = $("roomInlineCode"), inlErr = $("roomInlineError");
  inl.addEventListener("input", function () { cleanCode(inl); inlErr.textContent = ""; });
  $("roomInline").addEventListener("submit", function (e) { e.preventDefault(); tryJoin(inl, inlErr); });

  var dlg = $("roomDialog"), code = $("roomCode"), err = $("roomError");
  function openDlg() { err.textContent = ""; code.value = ""; dlg.showModal(); code.focus(); }
  $("openRoom").addEventListener("click", openDlg);
  $("openRoom2").addEventListener("click", openDlg);
  $("roomCancel").addEventListener("click", function () { dlg.close(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  code.addEventListener("input", function () { cleanCode(code); err.textContent = ""; });
  $("roomForm").addEventListener("submit", function (e) { e.preventDefault(); tryJoin(code, err); });

  // Âm thanh portal: dùng chung khóa "wgp.muted" với các game (Đào Vàng, Cờ Cá Ngựa đọc khóa này).
  function isMuted() { try { return localStorage.getItem(MUTE_KEY) === "1"; } catch (e) { return false; } }
  function showSound() {
    var m = isMuted();
    $("soundTx").textContent = m ? "Âm thanh: tắt" : "Âm thanh: bật";
    $("soundIc").src = "assets/ui/icon-am-thanh-" + (m ? "tat" : "bat") + ".png";
    $("soundBtn").setAttribute("aria-pressed", String(m));
  }
  $("soundBtn").addEventListener("click", function () {
    try { localStorage.setItem(MUTE_KEY, isMuted() ? "0" : "1"); } catch (e) {}
    showSound();
  });
  showSound();

  renderHero(); renderAll(); arm();
})();
