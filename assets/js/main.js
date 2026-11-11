/* ============================================================
   main.js — منطق الموقع المشترك بين كل الصفحات
   كل النصوص والصور بتتقرأ من content.js + config.js
   ============================================================ */

(function () {
  "use strict";

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.prototype.slice.call((ctx || document).querySelectorAll(sel));

  const H = CONTENT.home;
  const P = CONTENT.pages;
  const C = CONTENT.common;

  /* ---------- أيقونات SVG ---------- */

  const I = {
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    store: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l1.5-5.5A1.6 1.6 0 0 1 6.04 2.3h11.92a1.6 1.6 0 0 1 1.54 1.2L21 9"/><path d="M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9"/><path d="M3 9h18M9 21v-6h6v6"/></svg>'
  };

  /* ---------- أدوات مساعدة ---------- */

  const arDigits = (n) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el && value != null) el.textContent = value;
  };
  const setHTML = (id, value) => {
    const el = document.getElementById(id);
    if (el && value != null) el.innerHTML = value;
  };
  const setAttr = (id, attr, value) => {
    const el = document.getElementById(id);
    if (el && value != null) el.setAttribute(attr, value);
  };

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    r = Math.round((t - r) * p + r);
    g = Math.round((t - g) * p + g);
    b = Math.round((t - b) * p + b);
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  let svgUid = 0;

  /* جرة زجاجية بغطاء نحاسي — بديل موحد لصور المنتجات */
  function jarSVG(color, seed, opts) {
    opts = opts || {};
    svgUid++;
    const uid = "j" + svgUid;
    let s = (seed * 2654435761 + svgUid * 97) % 4294967296;
    const rnd = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
    let dots = "";
    for (let i = 0; i < 30; i++) {
      const x = 52 + rnd() * 96;
      const y = 94 + rnd() * 100;
      dots += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (rnd() * 2 + 0.8).toFixed(1) +
        '" fill="' + shade(color, -0.45) + '" opacity="' + (rnd() * 0.3 + 0.1).toFixed(2) + '"/>';
    }
    let beans = "";
    if (opts.beans) {
      for (let j = 0; j < 7; j++) {
        const x = 62 + rnd() * 76;
        const y = 102 + rnd() * 86;
        beans += '<g transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') rotate(' + Math.round(rnd() * 180) + ')">' +
          '<ellipse rx="8" ry="11.5" fill="' + shade(color, -0.35) + '"/>' +
          '<path d="M0 -8 Q -3.5 0 0 8" stroke="' + shade(color, 0.3) + '" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>';
      }
    }
    return '<svg viewBox="0 0 200 232" role="img" aria-hidden="true">' +
      '<defs>' +
      '<radialGradient id="' + uid + '" cx="50%" cy="28%" r="85%">' +
      '<stop offset="0%" stop-color="' + shade(color, 0.3) + '"/>' +
      '<stop offset="60%" stop-color="' + color + '"/>' +
      '<stop offset="100%" stop-color="' + shade(color, -0.32) + '"/>' +
      '</radialGradient>' +
      '<linearGradient id="' + uid + 'b" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#D6BF88"/>' +
      '<stop offset="45%" stop-color="#B59A62"/>' +
      '<stop offset="100%" stop-color="#8F7748"/>' +
      '</linearGradient>' +
      '<clipPath id="' + uid + 'c"><rect x="48" y="86" width="104" height="116" rx="12"/></clipPath>' +
      '</defs>' +
      '<ellipse cx="100" cy="210" rx="66" ry="9" fill="rgba(45,33,25,0.14)"/>' +
      '<rect x="36" y="60" width="128" height="146" rx="20" fill="rgba(255,255,255,0.55)" stroke="rgba(45,33,25,0.18)" stroke-width="2"/>' +
      '<g clip-path="url(#' + uid + 'c)">' +
      '<rect x="48" y="86" width="104" height="116" fill="url(#' + uid + ')"/>' +
      dots + beans +
      '</g>' +
      '<rect x="48" y="86" width="104" height="116" rx="12" fill="none" stroke="rgba(45,33,25,0.15)" stroke-width="1.5"/>' +
      '<rect x="52" y="96" width="10" height="98" rx="5" fill="rgba(255,255,255,0.4)"/>' +
      '<rect x="68" y="100" width="5" height="56" rx="2.5" fill="rgba(255,255,255,0.22)"/>' +
      '<circle cx="100" cy="24" r="8" fill="url(#' + uid + 'b)"/>' +
      '<path d="M54 56 C54 34 76 30 100 30 C124 30 146 34 146 56 L146 60 L54 60 Z" fill="url(#' + uid + 'b)"/>' +
      '<rect x="48" y="56" width="104" height="10" rx="5" fill="#A8905C"/>' +
      '<rect x="48" y="56" width="104" height="4" rx="2" fill="rgba(255,255,255,0.25)"/>' +
      '</svg>';
  }

  function tileBG(color) {
    return "background:linear-gradient(165deg," + shade(color, 0.88) + "," + shade(color, 0.6) + ")";
  }

  /* ---------- واتساب ---------- */

  function waLink(text) {
    return "https://wa.me/" + SITE.whatsapp + "?text=" + encodeURIComponent(text);
  }

  function productMsg(name, qty) {
    return SITE.msgs.product.replace("{name}", name).replace("{qty}", qty || "١");
  }

  function catName(id) { return CATS[id] ? CATS[id].name : ""; }

  function findProduct(id) {
    for (let i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i];
    return null;
  }

  /* ---------- قوالب الكروت ---------- */

  function renderGrid(el, list) {
    if (!el) return;
    const t = P.products;
    if (!list.length) {
      el.innerHTML = '<div class="empty-state">' + I.search +
        '<h3>' + t.emptyTitle + '</h3><p>' + t.emptySub + '</p>' +
        '<a class="btn btn-wa" target="_blank" rel="noopener" href="' + waLink(SITE.msgs.general) + '">' + I.wa + " " + t.emptyBtn + '</a></div>';
      return;
    }
    el.innerHTML = '<div class="menu-list">' + list.map((p, i) =>
      '<a class="menu-item reveal" href="product.html?id=' + p.id + '" style="--pc:' + p.color + '">' +
      '<span class="mi-num num">' + arDigits(String(i + 1).padStart(2, "0")) + "</span>" +
      '<span class="mi-main"><span class="mi-name">' + p.name + "</span></span>" +
      '<span class="mi-leader"></span>' +
      '<span class="mi-cat">' + catName(p.cat) + "</span>" +
      "</a>"
    ).join("") + "</div>";
    observeReveal(el);
  }

  /* ---------- الثيم من config ---------- */

  function injectTheme() {
    const t = SITE.theme;
    if (!t) return;
    const st = document.createElement("style");
    st.textContent =
      ":root{--olive:" + t.olive + ";--olive-deep:color-mix(in srgb," + t.olive + " 82%,#000);" +
      "--espresso:" + t.espresso + ";--espresso-deep:color-mix(in srgb," + t.espresso + " 85%,#000);" +
      "--ivory:" + t.ivory + ";--sand:" + t.sand + ";--brass:" + t.brass + ";--brass-deep:color-mix(in srgb," + t.brass + " 78%,#000);" +
      "--terra:" + t.terra + "}";
    document.head.appendChild(st);
  }

  /* ---------- الهيدر ---------- */

  function brandHTML(latino) {
    return '<a class="brand" href="index.html" aria-label="' + SITE.name + '">' +
      '<svg class="brand-mark" viewBox="0 0 64 64" aria-hidden="true">' +
      '<rect width="64" height="64" rx="16" fill="#344532"/>' +
      '<path d="M32 16c8.8 0 16 7.2 16 16v14a2 2 0 0 1-2 2H18a2 2 0 0 1-2-2V32c0-8.8 7.2-16 16-16z" fill="none" stroke="#B59A62" stroke-width="3"/>' +
      '<path d="M32 26c0 6-3 9-8 10 1-6 4-9 8-10z" fill="#7BA05B"/>' +
      '<path d="M32 26c0 6 3 9 8 10-1-6-4-9-8-10z" fill="#A76545"/>' +
      '<circle cx="32" cy="24" r="2.4" fill="#B59A62"/></svg>' +
      '<span class="brand-text"><span class="brand-name">' + SITE.name + '</span>' +
      (latino === false ? "" : '<span class="brand-latin">' + SITE.nameLatin + '</span>') +
      '</span></a>';
  }

  function initHeader() {
    const mount = $("#app-header");
    if (!mount) return;
    const page = document.body.dataset.page || "";
    const links = C.nav.map((n) =>
      '<a href="' + n.href + '"' + (n.page === page ? ' class="active" aria-current="page"' : "") + ">" + n.label + "</a>"
    ).join("");

    mount.innerHTML =
      '<a class="skip-link" href="#main-content">تخطَّ إلى المحتوى</a>' +
      '<div class="announce">' + CONTENT.announce + '</div>' +
      '<header class="site-header"><div class="container header-inner">' +
      brandHTML() +
      '<nav class="nav-links" aria-label="التنقل الرئيسي">' + links + '</nav>' +
      '<div class="nav-actions">' +
      '<button class="icon-btn search-open" aria-label="بحث في المنتجات">' + I.search + '</button>' +
      '<a class="btn btn-olive btn-sm header-wa" target="_blank" rel="noopener" href="' + waLink(SITE.msgs.general) + '">' + I.wa + ' واتساب</a>' +
      '<button class="icon-btn menu-btn" aria-label="فتح القائمة">' + I.menu + '</button>' +
      '</div></div></header>' +
      '<div class="drawer-overlay" id="drawerOverlay"></div>' +
      '<aside class="drawer" id="drawer" aria-label="قائمة التنقل">' +
      '<div class="drawer-head">' + brandHTML(false) + '<button class="drawer-close" aria-label="إغلاق القائمة">✕</button></div>' +
      '<label class="drawer-field">' + I.search + '<input type="search" id="drawerSearch" placeholder="دور على منتج…"></label>' +
      '<nav class="drawer-links">' + links + "</nav>" +
      '<div class="drawer-foot">' +
      '<a class="btn btn-wa" target="_blank" rel="noopener" href="' + waLink(SITE.msgs.general) + '">' + I.wa + ' تواصل معانا على واتساب</a>' +
      '<div class="drawer-phones">' +
      SITE.phones.map((p) => '<a href="tel:' + p.tel + '"><span class="num">' + p.label + "</span>" + I.phone + "</a>").join("") +
      "</div></div></aside>";

    const drawer = $("#drawer"), overlay = $("#drawerOverlay");
    const openDrawer = () => { drawer.classList.add("open"); overlay.classList.add("open"); document.body.style.overflow = "hidden"; };
    const closeDrawer = () => { drawer.classList.remove("open"); overlay.classList.remove("open"); document.body.style.overflow = ""; };
    $(".menu-btn", mount).addEventListener("click", openDrawer);
    $(".drawer-close", mount).addEventListener("click", closeDrawer);
    overlay.addEventListener("click", closeDrawer);
    $$(".drawer-links a", mount).forEach((a) => a.addEventListener("click", closeDrawer));
    $("#drawerSearch").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.value.trim()) {
        closeDrawer();
        window.location.href = "products.html?q=" + encodeURIComponent(e.target.value.trim());
      }
    });
  }

  /* ---------- الفوتر ---------- */

  function initFooter() {
    const mount = $("#app-footer");
    if (!mount) return;
    const F = H.footer;
    const catLinks =
      '<li><a href="coffee.html">' + C.nav[2].label + '</a></li>' +
      '<li><a href="spices.html">' + C.nav[3].label + '</a></li>' +
      '<li><a href="herbs.html">' + C.nav[4].label + '</a></li>' +
      '<li><a href="products.html?cat=grains">الحبوب والبقوليات</a></li>' +
      '<li><a href="products.html?cat=herbs">الأعشاب والشاي</a></li>' +
      '<li><a href="products.html?cat=other">منتجات أخرى</a></li>';
    const navLinks = C.nav.map((n) => '<li><a href="' + n.href + '">' + n.label + "</a></li>").join("");

    mount.innerHTML =
      '<footer class="site-footer"><div class="container">' +
      '<div class="footer-grid">' +
      '<div class="footer-brand-col">' + brandHTML() +
      '<p class="footer-about">' + F.about + '</p></div>' +
      '<div><h4 class="footer-title">' + F.catsTitle + '</h4><ul class="footer-links">' + catLinks + "</ul></div>" +
      '<div><h4 class="footer-title">' + F.linksTitle + '</h4><ul class="footer-links">' + navLinks + "</ul></div>" +
      '<div><h4 class="footer-title">' + F.contactTitle + '</h4><ul class="footer-contact">' +
      "<li>" + I.pin + "<span>" + SITE.addressAr + "</span></li>" +
      SITE.phones.map((p) => '<li>' + I.phone + '<a href="tel:' + p.tel + '"><span class="num">' + p.label + "</span></a></li>").join("") +
      '<li>' + I.wa + '<a target="_blank" rel="noopener" href="' + waLink(SITE.msgs.general) + '">' + F.waLink + '</a></li>' +
      '<li>' + I.store + '<a target="_blank" rel="noopener" href="' + SITE.mapsUrl + '">' + F.mapsLink + "</a></li>" +
      "</ul></div></div>" +
      '<div class="footer-bottom"><span>' + F.copyright + ' © <span class="num">' + new Date().getFullYear() + "</span> " + SITE.name + "</span>" +
      "<span>" + SITE.tagline + "</span></div>" +
      "</div></footer>" +
      '<a class="float-wa" target="_blank" rel="noopener" aria-label="' + C.waFloatLabel + '" href="' + waLink(SITE.msgs.general) + '">' + I.wa + "</a>";
  }

  /* ---------- البحث ---------- */

  function normalizeAr(str) {
    return (str || "")
      .replace(/[\u064B-\u0652\u0640]/g, "")
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/\s+/g, " ")
      .trim();
  }

  function searchProducts(q) {
    const nq = normalizeAr(q);
    if (!nq) return [];
    return PRODUCTS.filter((p) => {
      const hay = normalizeAr(p.name + " " + catName(p.cat) + " " + (p.brand || ""));
      return hay.indexOf(nq) !== -1;
    });
  }

  function initSearch() {
    const overlay = $("#searchOverlay");
    if (!overlay) return;
    overlay.innerHTML =
      '<div class="search-modal" role="dialog" aria-modal="true" aria-label="بحث المنتجات">' +
      '<div class="search-modal-head">' + I.search +
      '<input type="search" id="searchInput" placeholder="اكتب اسم المنتج… مثلاً: كمون، بن، ورد">' +
      '<button class="search-close" aria-label="إغلاق البحث">✕</button></div>' +
      '<div class="search-results" id="searchResults"><p class="search-hint">اكتب أول حروف اسم المنتج وهنعرضلك النتايج فوراً.</p></div></div>';

    const input = $("#searchInput"), results = $("#searchResults");

    const renderResults = () => {
      const q = input.value.trim();
      if (!q) { results.innerHTML = '<p class="search-hint">اكتب أول حروف اسم المنتج وهنعرضلك النتايج فوراً.</p>'; return; }
      const found = searchProducts(q).slice(0, 9);
      if (!found.length) {
        results.innerHTML = '<p class="search-hint">مفيش نتايج لـ «' + q + "». جرب كلمة تانية أو كلمنا واتساب.</p>";
        return;
      }
      results.innerHTML = found.map((p) =>
        '<a class="search-item" href="product.html?id=' + p.id + '">' +
        '<span class="si-text"><span class="si-name">' + p.name + '</span><br><span class="si-cat">' + catName(p.cat) + "</span></span>" +
        '<span class="si-arrow">' + I.arrow + "</span></a>"
      ).join("");
    };

    const openSearch = () => { overlay.classList.add("open"); document.body.style.overflow = "hidden"; setTimeout(() => input.focus(), 60); };
    const closeSearch = () => { overlay.classList.remove("open"); document.body.style.overflow = ""; input.value = ""; renderResults(); };

    $$(".search-open").forEach((b) => b.addEventListener("click", openSearch));
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeSearch(); });
    $(".search-close", overlay).addEventListener("click", closeSearch);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && overlay.classList.contains("open")) closeSearch(); });
    input.addEventListener("input", renderResults);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && input.value.trim()) {
        window.location.href = "products.html?q=" + encodeURIComponent(input.value.trim());
      }
    });
  }

  /* ---------- أنيميشن الظهور ---------- */

  let io = null;
  function observeReveal(ctx) {
    if (!("IntersectionObserver" in window)) {
      $$(".reveal", ctx).forEach((el) => el.classList.add("in"));
      return;
    }
    if (!io) {
      io = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
      }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });
    }
    $$(".reveal:not(.in)", ctx).forEach((el) => io.observe(el));
  }

  /* ---------- كروت درجات التحميص ---------- */

  function renderRoasts() {
    const roasts = $("#roastGrid");
    if (!roasts) return;
    const RL = H.roastLevels;
    roasts.innerHTML = '<div class="menu-list">' + PRODUCTS.filter((p) => p.cat === "coffee").map((p, i) => {
      const lv = RL[p.roast] || RL.medium;
      return '<a class="menu-item reveal reveal-d' + (i + 1) + '" href="product.html?id=' + p.id + '" style="--pc:' + p.color + '">' +
        '<span class="mi-num num">' + arDigits(String(i + 1).padStart(2, "0")) + "</span>" +
        '<span class="mi-main"><span class="mi-name">' + p.name + '</span><span class="mi-desc">' + lv.desc + "</span></span>" +
        '<span class="mi-leader"></span>' +
        '<span class="mi-level" style="color:' + p.color + '">' + lv.label + "</span>" +
        "</a>";
    }).join("") + "</div>";
  }

  /* ---------- الصفحة الرئيسية ---------- */

  function renderHome() {
    /* الهيرو */
    const hero = H.hero;
    setText("heroKicker", hero.kicker);
    setHTML("heroTitle", hero.title + ' <span class="accent">' + hero.titleAccent + "</span>");
    setText("heroSub", hero.sub);
    setText("heroCta1", hero.cta1);
    setText("heroCta2", hero.cta2);
    setHTML("heroPoints", (hero.points || []).map((pt) =>
      '<li>' + I.check + " " + pt + "</li>").join(""));
    setAttr("heroEntrance", "src", hero.entranceImg);
    setAttr("heroEntrance", "alt", hero.entranceAlt || "");
    setAttr("heroBack", "src", hero.backImg);
    setAttr("heroBack", "alt", hero.backAlt || "");
    setHTML("heroChip", "<span>" + hero.chipMain + "<small>" + hero.chipSub + "</small></span>");

    renderRoasts();

    /* القهوة */
    setText("coffeeTitle", H.coffee.title);
    setText("coffeeSub", H.coffee.sub);
    setText("coffeeMoreBtn", H.coffee.moreBtn);
    setText("coffeeKicker", H.coffee.kicker);

    /* أقسام العطارة */
    setText("catsTitle", H.cats.title);
    setText("catsSub", H.cats.sub);
    setText("catsKicker", H.cats.kicker);
    setHTML("catGrid", (H.cats.items || []).map((c) =>
      '<a class="cat-card reveal" href="' + c.href + '">' +
      '<img src="' + c.img + '" alt="' + c.t + '" loading="lazy" style="object-position:' + (c.pos || "center") + '">' +
      '<div class="cat-body"><h3>' + c.t + "</h3><p>" + c.d + "</p>" +
      '<span class="cat-cta">' + C.moreLabel + " " + I.arrow + "</span></div></a>").join(""));

    /* البهارات المميزة */
    setText("spiceTitle", H.spices.title);
    setText("spiceSub", H.spices.sub);
    setText("spiceKicker", H.spices.kicker);
    setText("spiceMoreBtn", H.spices.moreBtn);
    setHTML("spiceGrid", (H.spices.items || []).map((s) => {
      const p = findProduct(s.id);
      if (!p) return "";
      return '<a class="spice-card reveal" href="product.html?id=' + p.id + '">' +
        '<span class="sp-name">' + (s.label || p.name) + "</span>" +
        '<span class="sp-cat">توابل وبهارات</span></a>';
    }).join(""));

    /* تجربة العطارة */
    setText("storeKicker", H.store.kicker);
    setText("storeTitle", H.store.title);
    setText("storeSub", H.store.sub);
    setText("storeBtn", H.store.btn);
    setHTML("storeList", (H.store.list || []).map((li) =>
      '<li>' + I.check + " " + li + "</li>").join(""));
    setAttr("galleryMain", "src", H.store.galleryMain);
    setAttr("galleryMain", "alt", H.store.galleryMainAlt || "");
    setHTML("galleryRow", (H.store.galleryRow || []).map((g) =>
      '<figure class="g-item"><img src="' + g.img + '" alt="' + (g.alt || "") + '" loading="lazy"></figure>').join(""));

    /* منتجات مختارة */
    setText("featuredTitle", H.featured.title);
    setText("featuredSub", H.featured.sub);
    setText("featuredKicker", H.featured.kicker);
    setText("featuredMoreBtn", H.featured.moreBtn);
    renderGrid($("#featuredGrid"), (H.featured.items || []).map(findProduct).filter(Boolean));

    /* Wael Food */
    setText("waelKicker", H.wael.kicker);
    setHTML("waelTitle", H.wael.title);
    setText("waelSub", H.wael.sub);
    setText("waelBtn", H.wael.btn);
    setText("waelTag", H.wael.tag);
    setHTML("waelPoints", (H.wael.points || []).map((li) =>
      '<li>' + I.check + " " + li + "</li>").join(""));
    setAttr("waelImg", "src", H.wael.img);
    setAttr("waelImg", "alt", H.wael.imgAlt || "");
    setAttr("waelImg", "style", "object-position:" + (H.wael.imgPos || "center"));

    /* المكان */
    setText("locKicker", H.location.kicker);
    setText("locTitle", H.location.title);
    setText("locSub", H.location.sub);
    setText("locAddressLabel", H.location.addressLabel);
    setText("locPhoneLabel", H.location.phoneLabel);
    setText("locBtn1", H.location.btn1);
    setText("locBtn2", H.location.btn2);
    const map = $("#homeMap");
    if (map) map.src = SITE.mapsEmbed;

    /* واتساب */
    setText("waTitle", H.wa.title);
    setText("waSub", H.wa.sub);
    setText("waBtn", H.wa.btn);
  }

  /* ---------- صفحة المنتجات ---------- */

  function renderProductsPage() {
    const t = P.products;
    setText("prodHeroTitle", t.heroTitle);
    setText("prodHeroSub", t.heroSub);
    const field = $("#pageSearch");
    if (field) field.placeholder = t.searchPlaceholder;

    const grid = $("#productsGrid");
    if (!grid) return;
    const chips = $("#catChips");
    const count = $("#resultCount");
    const params = new URLSearchParams(window.location.search);
    let activeCat = params.get("cat") || "all";
    let q = params.get("q") || "";

    chips.innerHTML = '<button class="chip" data-cat="all">' + t.allChip + "</button>" +
      Object.keys(CATS).map((k) =>
        '<button class="chip" data-cat="' + k + '">' + CATS[k].name + "</button>"
      ).join("");

    field.value = q;

    const syncChips = () => {
      $$(".chip", chips).forEach((c) => c.classList.toggle("active", c.dataset.cat === activeCat));
    };

    const apply = () => {
      let list = PRODUCTS.slice();
      if (activeCat !== "all") list = list.filter((p) => p.cat === activeCat);
      if (q) list = searchProducts(q);
      if (q || activeCat !== "all") {
        count.innerHTML = t.resultsPrefix + ": <b class='num'>" + arDigits(list.length) + "</b> " + t.resultsLabel + (q ? " لكلمة «" + q + "»" : "");
      } else {
        count.innerHTML = t.allLabel + ": <b class='num'>" + arDigits(list.length) + "</b> " + t.resultsLabel;
      }
      renderGrid(grid, list);
    };

    chips.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      activeCat = chip.dataset.cat;
      syncChips();
      apply();
    });

    let timer = null;
    field.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => { q = field.value.trim(); apply(); }, 160);
    });

    syncChips();
    apply();
  }

  /* ---------- صفحة تفاصيل المنتج ---------- */

  function renderProductPage() {
    const t = P.product;
    const wrap = $("#productDetail");
    if (!wrap) return;
    const id = new URLSearchParams(window.location.search).get("id");
    const p = findProduct(id);

    if (!p) {
      wrap.innerHTML = '<div class="empty-state" style="grid-column:1/-1">' + I.search +
        '<h3>' + t.notFoundTitle + '</h3><p>' + t.notFoundSub + '</p>' +
        '<a class="btn btn-olive" href="products.html">' + t.notFoundBtn + '</a></div>';
      return;
    }

    setText("crumbName", p.name);
    document.title = p.name + " — " + SITE.name;

    wrap.innerHTML =
      '<div class="detail-visual reveal in">' +
      '<span class="dv-cat">' + catName(p.cat) + (p.brand ? " · " + p.brand : "") + "</span>" +
      '<h2 class="dv-name">' + p.name + "</h2>" +
      '<span class="dv-rule" style="background:' + p.color + '"></span>' +
      "</div>" +
      '<div class="detail-info reveal in">' +
      '<span class="pc-cat">' + catName(p.cat) + (p.brand ? " · " + p.brand : "") + "</span>" +
      "<h1>" + p.name + "</h1>" +
      '<p class="section-sub" style="margin-top:0">' + t.introLine.replace("{store}", SITE.name) + "</p>" +
      '<div class="price-card">' +
      '<p class="price-label">' + t.priceLabel + '</p>' +
      '<p class="price-value">' + C.priceNote + '</p>' +
      '<p class="price-note">' + t.priceNoteLabel + '</p>' +
      "</div>" +
      '<div class="buy-row">' +
      '<div class="qty-stepper" aria-label="' + t.qtyLabel + '">' +
      '<button type="button" id="qtyMinus" aria-label="' + t.qtyMinus + '">−</button>' +
      '<span class="qty-val num" id="qtyVal">١</span>' +
      '<button type="button" id="qtyPlus" aria-label="' + t.qtyPlus + '">+</button>' +
      "</div>" +
      '<a class="btn btn-wa btn-lg" id="waOrder" target="_blank" rel="noopener" href="' + waLink(productMsg(p.name)) + '">' + I.wa + " " + t.orderBtn + "</a>" +
      "</div>" +
      '<div class="detail-note">' + I.info + "<span>" + t.orderNote.replace("{address}", SITE.addressShort) + "</span></div>" +
      "</div>";

    let qty = 1;
    const val = $("#qtyVal"), order = $("#waOrder");
    const sync = () => {
      val.textContent = arDigits(qty);
      order.href = waLink(productMsg(p.name, arDigits(qty)));
    };
    $("#qtyMinus").addEventListener("click", () => { if (qty > 1) { qty--; sync(); } });
    $("#qtyPlus").addEventListener("click", () => { if (qty < 99) { qty++; sync(); } });

    const rel = $("#relatedGrid");
    if (rel) {
      const related = PRODUCTS.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 4);
      if (related.length) {
        $("#relatedWrap").style.display = "";
        setText("relTitle", t.relatedTitle);
        setText("relKicker", t.relatedKicker);
        renderGrid(rel, related);
      }
    }
  }

  /* ---------- صفحات الأقسام ---------- */

  function renderCategoryPages() {
    const page = document.body.dataset.page;
    if (page === "coffee") {
      const t = P.coffee;
      setText("heroTitle", t.heroTitle);
      setText("heroSub", t.heroSub);
      setText("heroBtn1", t.btn1);
      setText("heroBtn2", t.btn2);
      setAttr("heroImg", "src", t.heroImg);
      setAttr("heroImg", "alt", t.heroImgAlt || "");
      setAttr("heroImg", "style", "object-position:" + (t.heroImgPos || "center"));
      setText("roastKicker", t.roastKicker);
      setText("roastTitle", t.roastTitle);
      setText("roastSub", t.roastSub);
      setText("gridHead-coffee", t.gridHead);
      renderRoasts();
    }
    if (page === "spices") {
      const t = P.spices;
      setText("heroTitle", t.heroTitle);
      setText("heroSub", t.heroSub);
      setText("heroBtn1", t.btn1);
      setText("heroBtn2", t.btn2);
      setAttr("heroImg", "src", t.heroImg);
      setAttr("heroImg", "alt", t.heroImgAlt || "");
      setAttr("heroImg", "style", "object-position:" + (t.heroImgPos || "center"));
      setText("gridHead-ground", t.groundHead);
      setText("gridHead-whole", t.wholeHead);
    }
    if (page === "herbs") {
      const t = P.herbs;
      setText("heroTitle", t.heroTitle);
      setText("heroSub", t.heroSub);
      setText("heroBtn1", t.btn1);
      setText("heroBtn2", t.btn2);
      setAttr("heroImg", "src", t.heroImg);
      setAttr("heroImg", "alt", t.heroImgAlt || "");
      setAttr("heroImg", "style", "object-position:" + (t.heroImgPos || "center"));
      setText("gridHead-herbs", t.herbsHead);
      setText("gridHead-grains", t.grainsHead);
    }

    const map = { coffee: ["coffee"], spices: ["ground", "whole"], herbs: ["herbs", "grains"] };
    const catsForPage = map[page];
    if (!catsForPage) return;
    catsForPage.forEach((catKey) => {
      const grid = $("#cat-" + catKey);
      if (!grid) return;
      const list = PRODUCTS.filter((p) => p.cat === catKey);
      const countEl = $("#count-" + catKey);
      if (countEl) countEl.textContent = "(" + arDigits(list.length) + " منتج)";
      renderGrid(grid, list);
    });
  }

  /* ---------- صفحة التواصل ---------- */

  function renderContact() {
    const t = P.contact;
    setText("contactHeroTitle", t.heroTitle);
    setText("contactHeroSub", t.heroSub);
    setText("addressLabel", t.addressLabel);
    setText("phoneTitle", t.phoneTitle);
    setText("waLabel", t.waLabel);
    setText("waValue", t.waValue);
    setAttr("contactTelBtn", "href", "tel:" + (SITE.phones[0] ? SITE.phones[0].tel : ""));
    setText("contactTelBtn", t.btn1);
    setText("btn2", t.btn2);
    setText("btn3", t.btn3);
    const list = $("#contactPhones");
    if (list) {
      list.innerHTML = SITE.phones.map((p) =>
        '<div class="contact-row"><span class="contact-ic">' + I.phone + "</span>" +
        '<div><h4>' + t.phoneTitle + '</h4><a href="tel:' + p.tel + '"><span class="num">' + p.label + "</span></a></div></div>"
      ).join("");
    }
    const map = $("#contactMap");
    if (map) {
      map.src = SITE.mapsEmbed;
      map.title = t.mapTitle;
    }
  }

  /* ---------- صفحة عن العطارة ---------- */

  function renderAbout() {
    const t = P.about;
    setText("heroTitle", t.heroTitle);
    setText("heroSub", t.heroSub);
    setText("heroBtn1", t.btn1);
    setText("heroBtn2", t.btn2);
    setAttr("heroImg", "src", t.heroImg);
    setAttr("heroImg", "alt", t.heroImgAlt || "");
    setText("storyKicker", t.storyKicker);
    setText("storyTitle", t.storyTitle);
    setHTML("storyParas", (t.paragraphs || []).map((par) =>
      '<p style="color:#5A4F3F;margin-bottom:14px">' + par + "</p>").join(""));
    setAttr("storyImg", "src", t.storyImg);
    setAttr("storyImg", "alt", t.storyImgAlt || "");
    setAttr("storyImg", "style", "object-position:" + (t.storyImgPos || "center"));
    setText("galleryKicker", t.galleryKicker);
    setText("galleryTitle", t.galleryTitle);
    setText("gallerySub", t.gallerySub);
    setAttr("galleryMain", "src", t.galleryMain);
    setAttr("galleryMain", "alt", t.galleryMainAlt || "");
    setHTML("galleryRow", (t.galleryRow || []).map((g) =>
      '<figure class="g-item"><img src="' + g.img + '" alt="' + (g.alt || "") + '" loading="lazy"></figure>').join(""));
    setText("bandTitle", t.bandTitle);
    setText("bandSub", t.bandSub);
    setText("bandBtn1", t.bandBtn1);
    setText("bandBtn2", t.bandBtn2);
  }

  /* ---------- SEO ---------- */

  function applySEO() {
    const page = document.body.dataset.page;
    const seo = P.seo[page];
    if (!seo) return;
    if (page !== "product") {
      document.title = seo.title;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", seo.desc);
    }
  }

  /* ---------- تشغيل ---------- */

  function init() {
    injectTheme();
    applySEO();
    initHeader();
    initFooter();
    initSearch();

    const page = document.body.dataset.page;
    if (page === "home") renderHome();
    if (page === "products") renderProductsPage();
    if (page === "product") renderProductPage();
    if (page === "coffee" || page === "spices" || page === "herbs") renderCategoryPages();
    if (page === "contact") renderContact();
    if (page === "about") renderAbout();

    observeReveal(document);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
