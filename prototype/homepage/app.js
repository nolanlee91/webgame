(function () {
  "use strict";
  // Lụm Kèo — trang chủ "The Grand Arcade Lobby" (docs/homepage-redesign-spec.md).
  // 3 tầng: (1) hero trượt nhiều game + sảnh chờ trực tiếp · (2) kho game theo danh mục (cùng lưới 6 ô) · (3) footer.
  var GAMES = window.GAMES, CATS = window.CATEGORIES, SLIDES = window.HERO_SLIDES || [];
  var SHELVES = window.SHELVES || [], duelIds = window.DUEL_IDS || [];
  var MUTE_KEY = "wgp.muted", HERO_MS = 5500;
  var state = { cat: "all", q: "", slide: 0 };

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
          '<span class="hero__stats">' + metaHTML(g) + "</span>" +
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

  // ---------- TẦNG 1: sảnh chờ trực tiếp ----------
  var roomQueryP = new Set(["ma-soi", "ai-la-noi-gian", "noi-tu", "dat-bom"]);
  var lastRoomHTML = "";
  function renderRooms(rooms, status) {
    var html = rooms.map(roomHTML).join("");
    if (html !== lastRoomHTML) {
      $("rooms").innerHTML = html;
      lastRoomHTML = html;
    }
    $("roomCount").textContent = status ? "" : rooms.length;
    var note = status || (rooms.length ? "" : "Chưa có phòng công khai đang chờ người.");
    if ($("roomStatus").textContent !== note) $("roomStatus").textContent = note;
    $("roomStatus").hidden = !note;
  }
  async function refreshRooms() {
    if (!document.hidden) {
      try {
        var response = await fetch("/api/lobby", { signal: AbortSignal.timeout(8000) });
        if (!response.ok) throw new Error(response.status);
        var data = await response.json();
        renderRooms(data.rooms.filter(function (r) { return duelIds.includes(r.game); }));
      } catch {
        renderRooms([], "Tạm thời không tải được danh sách phòng.");
      }
    }
    setTimeout(refreshRooms, 5000);
  }
  function roomHref(game, code) {
    return byId(game).url + "?" + (roomQueryP.has(game) ? "p" : "room") + "=" + encodeURIComponent(code);
  }
  function seatsHTML(r) {
    var s = "";
    for (var i = 0; i < r.max; i++) s += '<i class="' + (i < r.have ? "on" : "") + '"></i>';
    return '<span class="seats" aria-hidden="true">' + s + "</span>";
  }
  function roomHTML(r) {
    var g = byId(r.game); if (!g) return "";
    return '<li class="room' + soonCls(g) + '">' +
      '<span class="room__art">' + imgHTML(g) + "</span>" +
      '<span class="room__info"><span class="room__name">' + g.name + ' <span class="room__no">#' + esc(r.code) + "</span></span>" +
        '<span class="room__meta"><span class="room__host"><img src="assets/ui/icon-chu-phong.png" alt="" width="16" height="16" />' + esc(r.host) + "</span>" +
        '<span class="room__side">' + seatsHTML(r) + '<span class="room__cnt">' + r.have + "/" + r.max + '<span class="sr-only"> người</span></span></span></span></span>' +
      '<a class="btn btn--teal btn--sm room__go" href="' + esc(roomHref(r.game, r.code)) + '" aria-label="Vào phòng ' + g.name + " " + esc(r.code) + ", " + r.have + " trên " + r.max + ' người">Vào</a>' +
    "</li>";
  }

  // ---------- TẦNG 2: kho game ----------
  function tileHTML(g) {
    var upcoming = soon(g);
    var tag = upcoming ? "article" : "a";
    var link = upcoming ? "" : ' href="' + href(g) + '"';
    var badge = upcoming ? '<span class="badge badge--soon" aria-hidden="true">Sắp ra mắt</span>' : badgeHTML(g);
    var detail = upcoming ? '<p class="meta sr-only">Sắp ra mắt</p>' : metaHTML(g);
    return "<" + tag + ' class="card tile" data-id="' + g.id + '"' + link + ">" +
      '<span class="tile__art">' + imgHTML(g) + badge + "</span>" +
      '<span class="tile__body"><h3 class="card__name">' + g.name + "</h3>" + detail + "</span></" + tag + ">";
  }
  // Game chơi được lên trước, game "Đang cập nhật" xuống cuối (giữ thứ tự gốc trong từng nhóm).
  function playableFirst(list) {
    return list.map(function (g, i) { return [g, i]; })
      .sort(function (a, b) { return (soon(a[0]) - soon(b[0])) || (a[1] - b[1]); })
      .map(function (x) { return x[0]; });
  }
  // Kệ của 1 game: game đối kháng → "duel", còn lại theo danh mục. Tab lọc và kệ dùng CÙNG hàm này nên số luôn khớp.
  function group(g) { return duelIds.indexOf(g.id) !== -1 ? "duel" : g.cat; }
  function shelfHTML(cls, title, hint, list) {
    return '<div class="shelf shelf--' + cls + '" id="' + cls + '"><h3 class="shelf__title">' + title + ' <span class="count">' + list.length +
      '</span>' + (hint ? '<span class="shelf__hint">' + hint + '</span>' : "") + '</h3>' + tileGridHTML(list) + "</div>";
  }
  function tileGridHTML(list) {
    return '<div class="tiles">' + playableFirst(list).map(tileHTML).join("") + "</div>";
  }

  function matches(g) {
    if (state.cat !== "all" && group(g) !== state.cat) return false;
    if (state.q && fold(g.name).indexOf(fold(state.q)) === -1) return false;
    return true;
  }
  function countIn(catId) {
    return GAMES.filter(function (g) {
      return catId === "all" || group(g) === catId;
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
      // "Tất cả": các kệ theo đúng thứ tự SHELVES; mỗi game đúng 1 kệ.
      SHELVES.forEach(function (sh) {
        var items = sh.cat === "duel" ? duelIds.map(byId).filter(Boolean) : list.filter(function (g) { return group(g) === sh.cat; });
        if (items.length) html += shelfHTML(sh.cat, sh.title, sh.hint, items);
      });
      var rest = list.filter(function (g) { return !SHELVES.some(function (sh) { return sh.cat === group(g); }); });
      if (rest.length) html += shelfHTML("other", "Game khác", "", rest);
    } else if (list.length) {
      html = '<div class="shelf shelf--flat">' + tileGridHTML(list) + "</div>";
    }
    grid.innerHTML = html;
    count.textContent = list.length;
    var label = CATS.filter(function (c) { return c.id === state.cat; })[0].label;
    $("gamesTitle").firstChild.textContent = (state.q ? "Kết quả tìm kiếm " : state.cat === "all" ? "Tất cả game " : label + " ");
    empty.hidden = list.length > 0;
  }

  function renderFeatured() { $("featuredSection").hidden = !!state.q; }
  function renderAll() { renderChips(); renderFeatured(); renderGrid(); }

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
    else topInner.appendChild(searchEl);
  }
  (mq.addEventListener ? mq.addEventListener("change", placeSearch) : mq.addListener(placeSearch));
  placeSearch();

  // Mã phòng gồm 5 ký tự ở tất cả game multiplayer.
  function cleanCode(input) {
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
  }
  async function tryJoin(input, errEl) {
    var code = input.value, submit = $("roomInline").querySelector("button");
    $("roomMatches").replaceChildren();
    if (!/^[A-Z0-9]{5}$/.test(code)) {
      errEl.textContent = "Mã phòng gồm đúng 5 chữ hoặc số.";
      input.focus();
      return;
    }
    submit.disabled = true;
    errEl.textContent = "";
    try {
      var response = await fetch("/api/lobby/rooms/" + encodeURIComponent(code), { signal: AbortSignal.timeout(8000) });
      if (input.value !== code) return;
      if (response.status === 404) {
        errEl.textContent = "Phòng đã đóng hoặc mã phòng chưa đúng.";
        return;
      }
      if (!response.ok) throw new Error(response.status);
      var data = await response.json();
      if (input.value !== code) return;
      var games = data.games.filter(function (id) { return duelIds.includes(id); });
      if (games.length === 1) {
        location.href = roomHref(games[0], code);
      } else if (games.length > 1) {
        $("roomMatches").append("Chọn game của phòng này: ");
        games.forEach(function (id) {
          var link = document.createElement("a");
          link.className = "btn btn--sm";
          link.href = roomHref(id, code);
          link.textContent = byId(id).name;
          $("roomMatches").append(link);
        });
        $("roomMatches").querySelector("a").focus();
      } else {
        errEl.textContent = "Không tìm thấy phòng.";
      }
    } catch {
      if (input.value === code) errEl.textContent = "Tạm thời không tra được mã phòng. Hãy thử lại.";
    } finally {
      submit.disabled = false;
    }
  }

  // "Tạo phòng mới": mỗi game có phòng riêng ⇒ đưa người chơi tới kệ "Đối kháng đông người" để chọn game.
  $("createRoom").addEventListener("click", function (e) {
    e.preventDefault();
    if (state.cat !== "all" || state.q) { $("q").value = ""; state.q = ""; state.cat = "all"; renderAll(); }
    var d = $("duel"); if (!d) return;
    d.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    d.classList.remove("is-flash"); void d.offsetWidth; d.classList.add("is-flash");
  });

  var inl = $("roomInlineCode"), inlErr = $("roomInlineError");
  inl.addEventListener("input", function () { cleanCode(inl); inlErr.textContent = ""; $("roomMatches").replaceChildren(); });
  $("roomInline").addEventListener("submit", function (e) { e.preventDefault(); tryJoin(inl, inlErr); });


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

  renderHero(); renderAll(); arm(); refreshRooms();
  var invite = new URLSearchParams(location.search).get("room");
  if (invite && /^[A-Z0-9]{5}$/i.test(invite)) {
    inl.value = invite.toUpperCase();
    tryJoin(inl, inlErr);
  }
})();
