(function () {
  "use strict";
  // Lụm Kèo — trang chủ "The Grand Arcade Lobby" (docs/homepage-redesign-spec.md).
  // 4 tầng: (1) game tiêu điểm + sảnh chờ trực tiếp · (2) chơi tiếp · (3) kệ Đối kháng + Thư viện chơi nhanh · (4) footer.
  var GAMES = window.GAMES, CATS = window.CATEGORIES, FEAT = window.FEATURED || {};
  var ROOMS = window.LOBBY_ROOMS || [], DUELS = window.DUELS || [];
  var RECENT_KEY = "wgp.recent", MUTE_KEY = "wgp.muted";
  var state = { cat: "all", q: "" };

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

  // ---------- TẦNG 1: game tiêu điểm ----------
  function heroHTML(g) {
    return '<a class="card hero px-panel' + soonCls(g) + '" href="' + href(g) + '" data-id="' + g.id + '">' +
      '<span class="hero__art">' + imgHTML(g, FEAT.heroImage) + "</span>" +
      '<span class="hero__info">' +
        '<span class="hero__tags"><span class="kicker">Tựa game của tuần</span>' + badgeHTML(g) + "</span>" +
        '<h3 class="hero__name">' + g.name + "</h3>" +
        '<span class="hero__text">' + (FEAT.heroText || "") + "</span>" +
        '<span class="hero__row">' +
          '<span class="btn btn--gold btn--lg" aria-hidden="true"><svg class="px-svg" viewBox="0 0 16 16"><path d="M4 2h2v12H4zM6 3h2v10H6zM8 4h2v8H8zM10 5h2v6h-2zM12 7h1v2h-1z"/></svg>Chơi ngay</span>' +
          '<span class="hero__stats">' + metaHTML(g) + '<span class="hero__stat"><span class="live" aria-hidden="true"></span>' + (FEAT.stat || "") + "</span></span>" +
        "</span>" +
      "</span></a>";
  }
  function renderFeatured() {
    var hero = byId(FEAT.hero);
    $("featured").innerHTML = hero ? heroHTML(hero) : "";
    $("featuredSection").hidden = !!state.q;
  }

  // ---------- TẦNG 1: sảnh chờ trực tiếp (số giả) ----------
  function roomHref(r) { var g = byId(r.game); return g && g.url ? g.url : "play.html?room=" + r.code; }
  function seatsHTML(r) {
    var s = "";
    for (var i = 0; i < r.max; i++) s += '<i class="' + (i < r.have ? "on" : "") + '"></i>';
    return '<span class="seats" aria-hidden="true">' + s + "</span>";
  }
  function renderRooms() {
    $("rooms").innerHTML = ROOMS.map(function (r) {
      var g = byId(r.game); if (!g) return "";
      return '<li class="room' + soonCls(g) + '">' +
        '<span class="room__art">' + imgHTML(g) + "</span>" +
        '<span class="room__info"><span class="room__name">' + g.name + ' <span class="room__no">#' + r.no + "</span></span>" +
          '<span class="room__host"><img src="assets/ui/icon-chu-phong.png" alt="" width="16" height="16" />' + esc(r.host) + "</span></span>" +
        '<span class="room__side">' + seatsHTML(r) + '<span class="room__cnt">' + r.have + "/" + r.max + '<span class="sr-only"> người</span></span></span>' +
        '<a class="btn btn--teal btn--sm room__go" href="' + roomHref(r) + '" data-room="' + r.code + '" aria-label="Vào phòng ' + g.name + " số " + r.no + ", " + r.have + " trên " + r.max + ' người' + (soon(g) ? ", đang cập nhật" : "") + '">' + (soon(g) ? "Sắp có" : "Vào") + "</a>" +
      "</li>";
    }).join("");
  }

  // ---------- TẦNG 2: chơi tiếp ----------
  function miniHTML(g) {
    return '<a class="card mini' + soonCls(g) + '" href="' + href(g) + '" data-id="' + g.id + '">' +
      '<span class="mini__art">' + imgHTML(g) + "</span>" +
      '<span class="mini__name">' + g.name + soonSr(g) + "</span></a>";
  }
  function getRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch (e) { return []; }
  }
  function pushRecent(id) {
    var r = getRecent().filter(function (x) { return x !== id; });
    r.unshift(id);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(r.slice(0, 4))); } catch (e) {}
  }
  function renderRecent() {
    var list = getRecent().map(byId).filter(Boolean);
    $("recentSection").hidden = list.length === 0 || !!state.q;
    $("recent").innerHTML = list.map(miniHTML).join("");
  }

  // ---------- TẦNG 3: kệ game ----------
  // Thẻ Đối kháng (3:2): huy hiệu nhiều người + số phòng đang mở + nút "Rủ bạn".
  function duelHTML(g) {
    var d = DUELS.filter(function (x) { return x.id === g.id; })[0] || {};
    return '<a class="card duel px-panel' + soonCls(g) + '" href="' + href(g) + '" data-id="' + g.id + '">' +
      '<span class="duel__art">' + imgHTML(g) + badgeHTML(g) +
        '<span class="duel__mp">' + pxIcon(P2) + "Nhiều người</span></span>" +
      '<span class="duel__body"><span class="duel__text"><h3 class="card__name">' + g.name + soonSr(g) + "</h3>" +
        '<span class="duel__meta">' + metaHTML(g) + '<span class="duel__rooms"><span class="live" aria-hidden="true"></span>' + (d.rooms || 0) + " phòng mở</span></span></span>" +
        '<span class="btn btn--sm ' + (soon(g) ? "btn--off" : "btn--teal") + '" aria-hidden="true">' + (soon(g) ? "Sắp có" : "Rủ bạn") + "</span></span></a>";
  }
  // Ô Thư viện chơi nhanh (4:3, gọn).
  function tileHTML(g) {
    return '<a class="card tile' + soonCls(g) + '" href="' + href(g) + '" data-id="' + g.id + '">' +
      '<span class="tile__art">' + imgHTML(g) + badgeHTML(g) + "</span>" +
      '<span class="tile__body"><h3 class="card__name">' + g.name + soonSr(g) + "</h3>" + metaHTML(g) + "</span></a>";
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
    var list = GAMES.filter(matches);
    var duels = duelIds.map(byId).filter(function (g) { return g && matches(g); });
    var lib = list.filter(function (g) { return duelIds.indexOf(g.id) === -1; });
    var html = "";
    if (duels.length) html += '<div class="shelf shelf--duel"><h3 class="shelf__title">Đối kháng đông người <span class="count">' + duels.length +
      '</span><span class="shelf__hint">Rủ bạn vào phòng, chơi ngay trên trình duyệt</span></h3><div class="duels">' + duels.map(duelHTML).join("") + "</div></div>";
    if (lib.length) html += '<div class="shelf shelf--lib"><h3 class="shelf__title">Thư viện chơi nhanh <span class="count">' + lib.length +
      '</span><span class="shelf__hint">Một mình cũng vui, bấm là chơi</span></h3><div class="tiles">' + lib.map(tileHTML).join("") + "</div></div>";
    grid.innerHTML = html;
    count.textContent = list.length;
    var label = CATS.filter(function (c) { return c.id === state.cat; })[0].label;
    $("gamesTitle").firstChild.textContent = (state.q ? "Kết quả tìm kiếm " : state.cat === "all" ? "Tất cả game " : label + " ");
    empty.hidden = list.length > 0;
  }

  function renderAll() { renderChips(); renderFeatured(); renderRooms(); renderGrid(); renderRecent(); }

  chips.addEventListener("click", function (e) {
    var b = e.target.closest(".tab");
    if (!b) return;
    state.cat = b.dataset.cat;
    renderChips(); renderGrid();
  });
  $("q").addEventListener("input", function (e) {
    state.q = e.target.value.trim();
    renderFeatured(); renderGrid(); renderRecent();
  });
  $("clearSearch").addEventListener("click", function () {
    $("q").value = ""; state.q = ""; state.cat = "all";
    renderAll();
  });
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a.card");
    // Chỉ ghi "chơi tiếp" cho game chơi được thật.
    if (a && !a.classList.contains("is-soon")) pushRecent(a.dataset.id);
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

  renderAll();
})();
