(function () {
  "use strict";
  // Lụm Kèo — trang chủ "The Grand Arcade Lobby" (docs/homepage-redesign-spec.md).
  // 3 tầng: (1) hero trượt nhiều game + sảnh chờ trực tiếp · (2) kho game theo danh mục (cùng lưới 6 ô) · (3) footer.
  var GAMES = window.GAMES, CATS = window.CATEGORIES, SLIDES = window.HERO_SLIDES || [];
  var SHELVES = window.SHELVES || [], duelIds = window.DUEL_IDS || [];
  var QUICK = window.QUICK_PLAY || [], DAILY = window.DAILY_GAMES || {}, SW = window.SEARCH_WORDS || {}, SPONSOR = window.SPONSOR || null;
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

  // Ảnh thumb: srcset bản nửa cỡ (assets/thumbs/half/, 360w hoặc 240w) + bản gốc ⇒ thẻ nhỏ / điện thoại tải bản nhẹ.
  function halfSrc(src) { return src.replace("assets/thumbs/", "assets/thumbs/half/"); }
  function srcsetOf(g) { var w = g.tw || 720; return halfSrc(g.thumb) + " " + (w / 2) + "w, " + g.thumb + " " + w + "w"; }
  // Ảnh lưới game / Mở phòng nhanh: chưa gắn src (data-src) — IntersectionObserver gắn khi ảnh sắp vào màn (≤ 300 px),
  // thay cho loading="lazy" của trình duyệt (tải trước tới 1.250–2.500 px ⇒ điện thoại tải gần hết lưới ngay lúc đầu).
  // sizes: bề rộng ô thật theo bố cục styles.css (6/5/4/3 cột).
  var TILE_SIZES = "(max-width: 720px) 34vw, (max-width: 1023px) 25vw, (max-width: 1180px) 20vw, 200px";
  function imgHTML(g, sizes, eager) {
    if (eager) return '<img src="' + halfSrc(g.thumb) + '" srcset="' + srcsetOf(g) + '" sizes="' + sizes + '" alt="" loading="lazy" decoding="async" />';
    return '<img data-src="' + halfSrc(g.thumb) + '" data-srcset="' + srcsetOf(g) + '" sizes="' + sizes + '" alt="" decoding="async" />';
  }
  function showImg(img) {
    if (img.dataset.srcset) { img.srcset = img.dataset.srcset; img.removeAttribute("data-srcset"); }
    if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute("data-src"); }
  }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); showImg(e.target); } });
  }, { rootMargin: "300px 0px" }) : null;
  function lazyIn(root) { [].forEach.call(root.querySelectorAll("img[data-src]"), function (img) { if (io) io.observe(img); else showImg(img); }); }
  function unlazyIn(root) { if (io) [].forEach.call(root.querySelectorAll("img[data-src]"), function (img) { io.unobserve(img); }); }
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
    // Slide 1 tải ngay (ưu tiên cao); slide sau chỉ gắn src khi sắp tới lượt (loadSlide) để không tranh băng thông lúc đầu.
    var set = srcsetOf(g), sizes = "(max-width: 720px) 45vw, 720px";
    var img = i ? '<img data-src="' + g.thumb + '" data-srcset="' + set + '" sizes="' + sizes + '" alt="" decoding="async" />'
      : '<img src="' + g.thumb + '" srcset="' + set + '" sizes="' + sizes + '" alt="" decoding="async" fetchpriority="high" />';
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
    // Slide 1 đã viết sẵn trong index.html (ảnh LCP tải sớm, giữ chỗ) ⇒ giữ nguyên node đó, chỉ nối các slide sau.
    var pre = track.querySelector(".slide");
    if (slides.length && pre && pre.dataset.id === slides[0].g.id && track.children.length === 1) {
      pre.setAttribute("aria-label", "1 / " + slides.length + ": " + slides[0].g.name);
      track.insertAdjacentHTML("beforeend", slides.slice(1).map(function (x, i) { return slideHTML(x, i + 1); }).join(""));
    } else {
      track.innerHTML = slides.map(slideHTML).join("");
    }
    dots.innerHTML = slides.map(function (x, i) {
      return '<button type="button" class="hero__dot" data-i="' + i + '" aria-label="' + x.g.name + '"></button>';
    }).join("");
    heroEl.classList.toggle("is-single", slides.length < 2);
    heroEl.classList.remove("is-loading"); // hiện nút ‹ › (ẩn tới khi có slide để khỏi đè tiêu đề sảnh)
    goSlide(0, true);
  }
  // Gắn ảnh cho slide i, và slide kế tiếp khi trang đã tải xong (chuẩn bị cho lần tự chuyển / vuốt).
  var pageLoaded = document.readyState === "complete";
  function loadSlide(i) {
    var el = track.children[i], img = el && el.querySelector("img[data-src]");
    if (img) showImg(img);
  }
  function loadAround(i) {
    loadSlide(i);
    if (pageLoaded && slides.length > 1) loadSlide((i + 1) % slides.length);
  }
  if (!pageLoaded) window.addEventListener("load", function () { pageLoaded = true; loadAround(state.slide); });
  function goSlide(i, instant) {
    var n = slides.length; if (!n) return;
    state.slide = (i + n) % n;
    loadAround(state.slide);
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
    var empty = !status && !rooms.length;
    $("lobby").classList.remove("is-loading");
    $("lobby").classList.toggle("is-empty", empty);
    $("lobby").classList.toggle("has-rooms", rooms.length > 0);
    $("quickTitle").textContent = empty ? "Chưa có phòng nào đang chờ · mở phòng nhanh" : "Mở phòng mới";
  }
  // Mở phòng nhanh: mỗi game đối kháng một ô ảnh, bấm là vào màn tạo phòng của game đó.
  // Điện thoại (≤ 720 px) khối này bị ẩn ⇒ không dựng, không tải ảnh; màn rộng ra (xoay ngang / kéo cửa sổ) thì dựng lúc đó.
  var mqPhone = window.matchMedia("(max-width: 720px)"), quickDone = false;
  function renderQuick() {
    if (quickDone || mqPhone.matches) return;
    quickDone = true;
    var box = $("quickGrid");
    box.innerHTML = duelIds.map(byId).filter(function (g) { return g && !soon(g); }).map(function (g) {
      return '<a class="quick__item" href="' + href(g) + '"><span class="quick__art">' + imgHTML(g, "(max-width: 1180px) 130px, 150px") + '</span><span class="quick__name">' + esc(g.name) + "</span></a>";
    }).join("");
    lazyIn(box);
  }
  if (mqPhone.addEventListener) mqPhone.addEventListener("change", renderQuick); else mqPhone.addListener(renderQuick);
  function fetchLobby() {
    return fetch("/api/lobby", { signal: AbortSignal.timeout(8000) }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  // Lần đầu dùng request đã gửi từ <head> (window.__lobbyP); lỗi ⇒ thử lại 1 lần sau 1 giây rồi mới báo lỗi.
  var firstLobby = window.__lobbyP || null;
  async function refreshRooms() {
    if (!document.hidden) {
      try {
        var data;
        try { data = await (firstLobby || fetchLobby()); }
        catch (e) { firstLobby = null; await new Promise(function (r) { setTimeout(r, 1000); }); data = await fetchLobby(); }
        renderRooms(data.rooms.filter(function (r) { return duelIds.includes(r.game); }));
      } catch {
        renderRooms([], "Tạm thời không tải được danh sách phòng.");
      }
      firstLobby = null;
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
      '<span class="room__art">' + imgHTML(g, "56px", true) + "</span>" +
      '<span class="room__info"><span class="room__name">' + g.name + ' <span class="room__no">#' + esc(r.code) + "</span></span>" +
        '<span class="room__meta"><span class="room__host"><img src="assets/ui/icon-chu-phong.png" alt="" width="16" height="16" />' + esc(r.host) + "</span>" +
        '<span class="room__side">' + seatsHTML(r) + '<span class="room__cnt">' + r.have + "/" + r.max + '<span class="sr-only"> người</span></span></span></span></span>' +
      '<a class="btn btn--teal btn--sm room__go" href="' + esc(roomHref(r.game, r.code)) + '" aria-label="Vào phòng ' + g.name + " " + esc(r.code) + ", " + r.have + " trên " + r.max + ' người">Vào</a>' +
    "</li>";
  }

  // ---------- TẦNG 2: kho game ----------
  // "★ Thử thách" trên thẻ Sudoku / 2048 / Đố Vui (P-E): link riêng sang chế độ thử thách hôm nay, đặt CẠNH thẻ (không lồng link).
  // Số đề = cùng công thức dayNumber() của games/_shared/daily.js (ngày ra mắt 24/11/2026 giờ VN); đã xong ⇒ "✓ Thử thách #N".
  var DAY = Math.max(1, Math.floor((Date.now() + 252e5 - Date.UTC(2026, 10, 24)) / 864e5) + 1);
  function dailyDone(id) {
    try { var st = JSON.parse(localStorage.getItem("wgp.daily.v1") || "null"); var g = st && st.games && st.games[id]; return !!(g && g.days && g.days[DAY]); } catch (e) { return false; }
  }
  function chalHTML(g) {
    var d = DAILY[g.id]; if (!d || soon(g)) return "";
    var done = dailyDone(d.id);
    return '<a class="tile__chal' + (done ? " is-done" : "") + '" href="../games/' + d.path + '/?daily=1" data-daily="' + d.id + '" aria-label="' + esc(g.name) +
      ": thử thách hôm nay #" + DAY + (done ? ", đã xong" : "") + '">' + (done ? "✓ Thử thách #" + DAY : "★ Thử thách") + "</a>";
  }
  function tileHTML(g) {
    var chal = chalHTML(g);
    return chal ? '<div class="tile-wrap">' + tileInner(g) + chal + "</div>" : tileInner(g);
  }
  // Thẻ "Tài trợ" (HOME-11): cùng cỡ thẻ game, nhãn "Tài trợ" rõ ràng, cuối kệ cuối cùng. Hình vẽ bằng CSS (không cần ảnh mới).
  function sponsorHTML() {
    if (!SPONSOR || !SPONSOR.name) return "";
    var url = /^https:\/\/\S+$/i.test(SPONSOR.url || "") ? SPONSOR.url : "";
    var tag = url ? "a" : "article";
    var link = url ? ' href="' + esc(url) + '" target="_blank" rel="sponsored noopener"' : "";
    return "<" + tag + ' class="card tile tile--sponsor" data-id="sponsor"' + link + ' aria-label="Tài trợ: ' + esc(SPONSOR.name) + " — " + esc(SPONSOR.text) + '">' +
      '<span class="tile__art sponsor__art" aria-hidden="true"><span class="badge badge--sponsor">Tài trợ</span>' +
        '<span class="sponsor__bubble">ABC</span><span class="sponsor__brand">' + esc(SPONSOR.name) + "</span></span>" +
      '<span class="tile__body"><span class="card__name">' + esc(SPONSOR.name) + '</span><span class="meta sponsor__meta">' + esc(SPONSOR.text) + "</span></span></" + tag + ">";
  }
  function tileInner(g) {
    var upcoming = soon(g);
    var tag = upcoming ? "article" : "a";
    var link = upcoming ? "" : ' href="' + href(g) + '"';
    var badge = upcoming ? '<span class="badge badge--soon" aria-hidden="true">Sắp ra mắt</span>' : badgeHTML(g);
    var detail = upcoming ? '<p class="meta sr-only">Sắp ra mắt</p>' : metaHTML(g);
    return "<" + tag + ' class="card tile" data-id="' + g.id + '"' + link + ">" +
      '<span class="tile__art">' + imgHTML(g, TILE_SIZES) + badge + "</span>" +
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
  function shelfHTML(cls, title, hint, list, extra) {
    return '<div class="shelf shelf--' + cls + '" id="' + cls + '"><h3 class="shelf__title">' + title + ' <span class="count">' + list.length +
      '</span>' + (hint ? '<span class="shelf__hint">' + hint + '</span>' : "") + '</h3>' + tileGridHTML(list, extra) + "</div>";
  }
  function tileGridHTML(list, extra) {
    return '<div class="tiles">' + playableFirst(list).map(tileHTML).join("") + (extra || "") + "</div>";
  }

  // Tìm kiếm (HOME-09): khớp tên + thể loại (kệ, danh mục) + số người ("2 nguoi" khớp cả "2–4 người") + chế độ. Không dấu, mọi từ phải có.
  // Có từ khoá thì tìm trong TẤT CẢ game (bỏ lọc tab đang chọn — trước đây giới hạn trong tab mà không báo).
  var catLabel = {}; CATS.forEach(function (c) { catLabel[c.id] = c.label; });
  function haystack(g) {
    if (g._hay) return g._hay;
    var grp = group(g), p = String(g.players || ""), nums = p.match(/\d+/g) || [], words = [g.name, catLabel[grp] || "", catLabel[g.cat] || "", p, SW[grp] || "", SW[g.cat] || ""];
    if (nums.length === 2) for (var k = +nums[0]; k <= +nums[1]; k++) words.push(k + " nguoi");
    words.push(g.mode === "solo" ? SW.solo || "" : g.mode === "multi" ? SW.multi || "" : (SW.solo || "") + " " + (SW.multi || ""));
    if (DAILY[g.id]) words.push("thu thach hom nay daily");
    return (g._hay = " " + fold(words.join(" ")).replace(/[–—-]/g, " ").replace(/\s+/g, " ") + " ");
  }
  function matches(g) {
    if (state.q) {
      var hay = haystack(g), toks = fold(state.q).split(/\s+/).filter(Boolean);
      // số ("2", "4") phải là nguyên một từ: "2 nguoi" không được khớp "2048 … 1 nguoi"
      return toks.every(function (t) { return hay.indexOf(/^\d+$/.test(t) ? " " + t + " " : t) !== -1; });
    }
    return state.cat === "all" || group(g) === state.cat;
  }
  function countIn(catId) {
    return GAMES.filter(function (g) {
      return catId === "all" || group(g) === catId;
    }).length;
  }
  function renderChips() {
    chips.innerHTML = CATS.map(function (c) {
      return '<button type="button" class="tab" data-cat="' + c.id + '" aria-pressed="' + (!state.q && c.id === state.cat) + '">' +
        c.label + ' <span class="tab__n">' + countIn(c.id) + "</span></button>";
    }).join("");
  }
  function renderGrid() {
    var list = GAMES.filter(matches), html = "";
    if (state.cat === "all" && !state.q) {
      // "Tất cả": các kệ theo đúng thứ tự SHELVES; mỗi game đúng 1 kệ.
      SHELVES.forEach(function (sh) {
        var items = sh.cat === "duel" ? duelIds.map(byId).filter(Boolean) : list.filter(function (g) { return group(g) === sh.cat; });
        if (items.length) html += shelfHTML(sh.cat, sh.title, sh.hint, items, sh === SHELVES[SHELVES.length - 1] ? sponsorHTML() : "");
      });
      var rest = list.filter(function (g) { return !SHELVES.some(function (sh) { return sh.cat === group(g); }); });
      if (rest.length) html += shelfHTML("other", "Game khác", "", rest);
    } else if (list.length) {
      html = '<div class="shelf shelf--flat">' + tileGridHTML(list) + "</div>";
    }
    unlazyIn(grid);
    grid.innerHTML = html;
    lazyIn(grid);
    count.textContent = list.length;
    var label = CATS.filter(function (c) { return c.id === state.cat; })[0].label;
    $("gamesTitle").firstChild.textContent = (state.q ? "Kết quả tìm kiếm " : state.cat === "all" ? "Tất cả game " : label + " ");
    empty.hidden = list.length > 0;
    if (!list.length) {
      // Trạng thái rỗng: nói rõ từ khoá + gợi ý 4 game hay chơi
      $("emptyMsg").textContent = state.q ? "Không tìm thấy game nào cho “" + state.q + "”." : "Chưa có game nào ở mục này.";
      var box = $("emptyTiles"); unlazyIn(box);
      box.innerHTML = ["co-ca-ngua", "dao-vang", "co-caro", "tiem-tra-sua"].map(byId).filter(Boolean).map(tileHTML).join("");
      lazyIn(box);
    }
  }

  // ---------- Chơi ngay (HOME-02): dải 2 hàng cuộn ngang dưới slide, chỉ hiện trên điện thoại ----------
  function renderQuickPlay() {
    var row = $("qpRow"); if (!row) return;
    // Ô viết sẵn trong index.html (giữ chỗ từ lần vẽ đầu — CLS) khớp QUICK_PLAY ⇒ giữ nguyên, chỉ gắn ảnh lười.
    var pre = [].map.call(row.children, function (a) { return a.dataset.id; }).join();
    if (pre && pre === QUICK.filter(function (id) { var g = byId(id); return g && !soon(g); }).join()) { lazyIn(row); return; }
    row.innerHTML = QUICK.map(byId).filter(function (g) { return g && !soon(g); }).map(function (g) {
      return '<a class="card tile tile--qp" href="' + href(g) + '" data-id="' + g.id + '"><span class="tile__art">' + imgHTML(g, "(max-width: 720px) 32vw, 1px") +
        '</span><span class="tile__body"><span class="card__name">' + esc(g.name) + "</span></span></a>";
    }).join("");
    lazyIn(row);
  }

  function renderFeatured() { $("featuredSection").hidden = !!state.q; }
  function renderAll() { renderChips(); renderFeatured(); renderGrid(); }
  // Quay lại từ thử thách (bfcache) / tab khác ghi kết quả ⇒ nhãn "★ Thử thách" ↔ "✓ Thử thách #N"
  function refreshChal() {
    [].forEach.call(document.querySelectorAll(".tile__chal"), function (a) {
      var done = dailyDone(a.dataset.daily), g = byId(a.parentNode.querySelector(".tile").dataset.id);
      if (a.classList.contains("is-done") === done) return;
      a.classList.toggle("is-done", done);
      a.textContent = done ? "✓ Thử thách #" + DAY : "★ Thử thách";
      a.setAttribute("aria-label", g.name + ": thử thách hôm nay #" + DAY + (done ? ", đã xong" : ""));
    });
  }
  window.addEventListener("pageshow", refreshChal);
  window.addEventListener("storage", function (e) { if (!e.key || e.key === "wgp.daily.v1") refreshChal(); });

  chips.addEventListener("click", function (e) {
    var b = e.target.closest(".tab");
    if (!b) return;
    state.cat = b.dataset.cat;
    if (state.q) { $("q").value = ""; state.q = ""; renderFeatured(); } // bấm tab khi đang tìm ⇒ bỏ từ khoá, xem đúng tab đó
    renderChips(); renderGrid();
  });
  $("q").addEventListener("input", function (e) {
    state.q = e.target.value.trim();
    renderChips(); renderFeatured(); renderGrid();
  });
  $("clearSearch").addEventListener("click", function () {
    $("q").value = ""; state.q = ""; state.cat = "all";
    renderAll();
  });
  // Điện thoại: ô tìm kiếm nằm dưới thanh logo — đặt bằng CSS (.topbar--search trong portal-pixel.css), không di chuyển bằng JS
  // (trước đây placeSearch() chạy sau lần vẽ đầu ⇒ ô tìm ép logo xuống 2 dòng rồi nhảy, góp phần CLS).

  // Mã phòng gồm 5 ký tự ở tất cả game multiplayer (HOME-04: không maxlength — lọc RỒI mới cắt, dán cả câu vẫn ra mã).
  // Dán "Mã: WEBYS" / " WEBYS" / "vào phòng WEBYS nhé" ⇒ lấy cụm đúng 5 chữ-số đứng riêng: ưu tiên cụm có số, rồi cụm gõ HOA sẵn, rồi cụm cuối.
  function pickCode(raw) {
    raw = String(raw);
    var toks = raw.split(/[^A-Za-z0-9]+/).filter(function (t) { return t.length === 5; });
    if (toks.length > 1 || (toks.length === 1 && /[^A-Za-z0-9]/.test(raw.trim()))) {
      return (toks.filter(function (t) { return /\d/.test(t); })[0] || toks.filter(function (t) { return t === t.toUpperCase(); })[0] || toks[toks.length - 1]).toUpperCase();
    }
    return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
  }
  function cleanCode(input) {
    var v = pickCode(input.value);
    if (input.value !== v) input.value = v;
  }
  window.__pickCode = pickCode; // để test
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

  renderHero(); renderQuickPlay(); renderAll(); renderQuick(); arm(); refreshRooms();
  var invite = new URLSearchParams(location.search).get("room");
  if (invite && /^[A-Z0-9]{5}$/i.test(invite)) {
    inl.value = invite.toUpperCase();
    tryJoin(inl, inlErr);
  }
})();
