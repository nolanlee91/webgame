(function () {
  "use strict";
  var GAMES = window.GAMES, CATS = window.CATEGORIES, FEAT = window.FEATURED || { picks: [] };
  var RECENT_KEY = "wgp.recent";
  var state = { cat: "all", q: "" };

  var $ = function (id) { return document.getElementById(id); };
  var grid = $("grid"), chips = $("chips"), count = $("count"), empty = $("empty");

  // Bỏ dấu tiếng Việt để tìm "dao vang" vẫn ra "Đào Vàng".
  function fold(s) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
  }

  // Icon tạm cho game chưa có ảnh (SVG nét, lưới 24).
  var ICONS = {
    snake: '<path d="M4 18c3 0 3-4 6-4s3 4 6 4 4-3 4-6-2-6-6-6H9"/><circle cx="9" cy="6" r="1.5"/>',
    bubble: '<circle cx="8" cy="9" r="4"/><circle cx="16" cy="8" r="3"/><circle cx="13" cy="16" r="4"/>',
    "2048": '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>',
    dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2"/><circle cx="15" cy="15" r="1.2"/><circle cx="15" cy="9" r="1.2"/><circle cx="9" cy="15" r="1.2"/>',
    bomb: '<circle cx="11" cy="14" r="7"/><path d="m16 9 3-3M19 3v2M21 5h-2"/>',
    bow: '<path d="M5 3c9 3 13 7 16 16"/><path d="M5 3 21 19"/><path d="M17 21h4v-4"/>',
    blocks: '<path d="M3 21h6v-6H3zM9 21h6v-6H9zM9 15h6V9H9zM15 21h6v-6h-6z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8 11h6M11 8v6"/>',
    car: '<path d="M3 16h18l-2-5-4-1-3-3H7l-2 4-2 1z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
    sprout: '<path d="M12 21V11M12 11c0-4-3-6-7-6 0 4 3 6 7 6zM12 13c0-3 3-5 7-5 0 3-3 5-7 5z"/>',
    candy: '<circle cx="12" cy="12" r="5"/><path d="m7 8-4-2 1 5M17 16l4 2-1-5"/>',
    sudoku: '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>'
  };
  var PEOPLE1 = '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>';
  var PEOPLE2 = '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>';

  function byId(id) { return GAMES.filter(function (g) { return g.id === id; })[0]; }
  // Game đã có bản chơi thật thì mở thẳng (field url trong games.js); game chưa làm vẫn vào trang chờ play.html.
  function href(g) { return g.url || "play.html?game=" + encodeURIComponent(g.id); }

  function thumbHTML(g, src) {
    if (src || g.thumb) {
      return '<img src="' + (src || g.thumb) + '" alt="" loading="lazy" decoding="async" />';
    }
    return '<div class="ph" style="--h:' + (g.hue || 200) + '" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24">' + (ICONS[g.icon] || "") + "</svg></div>";
  }
  function badgeHTML(g) {
    if (!g.badge) return "";
    return '<span class="badge badge--' + (g.badge === "Hot" ? "hot" : "new") + '">' + g.badge + "</span>";
  }
  function metaHTML(g) {
    var multi = g.mode !== "solo";
    return '<p class="meta' + (multi ? " meta--multi" : "") + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true">' + (multi ? PEOPLE2 : PEOPLE1) + "</svg>" +
      "<span>" + g.players + (multi ? '<span class="sr-only">, chơi cùng bạn được</span>' : "") + "</span></p>";
  }

  // 1) Thẻ chính (lớn nhất trang)
  function heroHTML(g) {
    return '<a class="card hero frame" href="' + href(g) + '" data-id="' + g.id + '">' +
      '<span class="hero__art">' + thumbHTML(g, FEAT.heroImage) + "</span>" +
      '<span class="hero__info">' +
        '<span class="hero__tags">' + badgeHTML(g) + '<span class="hero__kicker">Game của tuần</span></span>' +
        '<h3 class="hero__name">' + g.name + "</h3>" +
        '<span class="hero__text">' + (FEAT.heroText || "") + "</span>" +
        '<span class="hero__row">' + metaHTML(g) + '<span class="btn btn--gold btn--lg" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>Chơi ngay</span></span>' +
      "</span></a>";
  }

  // 2) Thẻ nổi bật (vừa) — tên + nút "Chơi ngay" xanh ngọc như concept V4
  function pickHTML(g) {
    return '<a class="card pick frame" href="' + href(g) + '" data-id="' + g.id + '">' +
      '<span class="pick__art">' + thumbHTML(g) + badgeHTML(g) + "</span>" +
      '<span class="pick__body"><span class="pick__text"><h3 class="card__name">' + g.name + "</h3>" + metaHTML(g) + "</span>" +
      '<span class="btn btn--teal btn--sm" aria-hidden="true">Chơi ngay</span></span></a>';
  }

  // 3) Ô game thường (nhỏ, dễ quét mắt)
  function tileHTML(g) {
    return '<a class="card tile" href="' + href(g) + '" data-id="' + g.id + '">' +
      '<span class="tile__art">' + thumbHTML(g) + badgeHTML(g) +
        '<span class="tile__play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span></span>' +
      '<span class="tile__body"><h3 class="card__name">' + g.name + "</h3>" + metaHTML(g) + "</span></a>";
  }

  // 4) "Chơi tiếp" — thẻ mini, điểm nhấn phụ
  function miniHTML(g) {
    return '<a class="card mini" href="' + href(g) + '" data-id="' + g.id + '">' +
      '<span class="mini__art">' + thumbHTML(g) + "</span>" +
      '<span class="mini__name">' + g.name + "</span></a>";
  }

  function matches(g) {
    if (state.cat === "multi" && g.mode === "solo") return false;
    if (state.cat !== "all" && state.cat !== "multi" && g.cat !== state.cat) return false;
    if (state.q && fold(g.name).indexOf(fold(state.q)) === -1) return false;
    return true;
  }

  function renderFeatured() {
    var hero = byId(FEAT.hero);
    var picks = (FEAT.picks || []).map(byId).filter(Boolean);
    $("featured").innerHTML = (hero ? heroHTML(hero) : "") + '<div class="picks">' + picks.map(pickHTML).join("") + "</div>";
    $("featuredSection").hidden = !!state.q;
  }

  function renderChips() {
    chips.innerHTML = CATS.map(function (c) {
      return '<button type="button" class="tab" data-cat="' + c.id + '" aria-pressed="' + (c.id === state.cat) + '">' + c.label + "</button>";
    }).join("");
  }

  function renderGrid() {
    var list = GAMES.filter(matches);
    var html;
    if (state.cat === "all" && !state.q) {
      // Xem tất cả: chia nhóm theo loại để dễ quét mắt, có khoảng nghỉ giữa các nhóm.
      html = CATS.filter(function (c) { return c.id !== "all" && c.id !== "multi"; }).map(function (c) {
        var items = list.filter(function (g) { return g.cat === c.id; });
        return '<div class="group"><h3 class="group__title">' + c.label + ' <span class="count">' + items.length + "</span></h3>" +
          '<div class="tiles">' + items.map(tileHTML).join("") + "</div></div>";
      }).join("");
    } else {
      html = '<div class="tiles">' + list.map(tileHTML).join("") + "</div>";
    }
    grid.innerHTML = list.length ? html : "";
    count.textContent = list.length;
    var label = CATS.filter(function (c) { return c.id === state.cat; })[0].label;
    $("gamesTitle").firstChild.textContent = (state.q ? "Kết quả tìm kiếm " : state.cat === "all" ? "Tất cả game " : label + " ");
    empty.hidden = list.length > 0;
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

  function renderAll() { renderChips(); renderFeatured(); renderGrid(); renderRecent(); }

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
    if (a) pushRecent(a.dataset.id);
  });

  // Mobile: chuyển ô tìm kiếm từ thanh trên xuống đầu trang để thanh trên chỉ còn 1 hàng gọn.
  var searchEl = document.querySelector(".search"), topInner = document.querySelector(".topbar__inner");
  var mq = window.matchMedia("(max-width: 720px)");
  function placeSearch() {
    if (mq.matches) $("mobileSearchSlot").appendChild(searchEl);
    else topInner.insertBefore(searchEl, $("roomInline"));
  }
  (mq.addEventListener ? mq.addEventListener("change", placeSearch) : mq.addListener(placeSearch));
  placeSearch();

  // Mã phòng: 6 ký tự chữ + số (theo ux-ui-spec). Dùng chung cho ô trên thanh trên (desktop) và hộp thoại (mobile).
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
  $("openRoom").addEventListener("click", function () {
    err.textContent = ""; code.value = "";
    dlg.showModal(); code.focus();
  });
  $("roomCancel").addEventListener("click", function () { dlg.close(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  code.addEventListener("input", function () { cleanCode(code); err.textContent = ""; });
  $("roomForm").addEventListener("submit", function (e) { e.preventDefault(); tryJoin(code, err); });

  renderAll();
})();
