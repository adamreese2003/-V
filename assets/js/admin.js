/* ============================================================
   admin.js — لوحة تحكم عطارة شقير العطار
   تعديل كل بيانات الموقع والنشر مباشرة على جيت هاب
   ============================================================ */

(function () {
  "use strict";

  const REPO = "adamreese2003/-V";
  const BRANCH = "main";
  const RAW = "https://raw.githubusercontent.com/" + REPO + "/" + BRANCH + "/";
  const API = "https://api.github.com/repos/" + REPO + "/contents/";
  const TOKEN_KEY = "attar_admin_token";
  const DRAFT_KEY = "attar_admin_draft";

  const KNOWN_IMAGES = [
    "entrance.jpg", "interior-counter.png", "interior-aisle.png", "brass-jars.png",
    "brass-jars-2.png", "bins-grains.png", "aisle-pasta.png", "bg-spoons.webp", "bg-spice-market.jpg"
  ];

  /* ---------- الحالة ---------- */

  let D = null;        // { config, content, products:{cats, items} }
  let ORIG = null;     // نسخة أصلية للمقارنة
  let IMAGES = KNOWN_IMAGES.slice();
  let sourceMode = "live";

  /* ---------- أدوات ---------- */

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.prototype.slice.call((c || document).querySelectorAll(s));

  const clone = (o) => JSON.parse(JSON.stringify(o));

  function getPath(obj, path) {
    return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
  }
  function setPath(obj, path, value) {
    const keys = path.split(".");
    const last = keys.pop();
    const target = keys.reduce((o, k) => o[k], obj);
    target[last] = value;
  }

  let toastTimer = null;
  function toast(msg, kind) {
    const t = $("#toast");
    t.textContent = msg;
    t.className = "ad-toast show " + (kind || "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = "ad-toast"; }, 3200);
  }

  function b64encode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function slugify(name) {
    return "p-" + Date.now().toString(36);
  }

  /* ---------- التخزين ---------- */

  const getToken = () => localStorage.getItem(TOKEN_KEY) || "";
  const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
  const clearToken = () => localStorage.removeItem(TOKEN_KEY);

  function authHeaders() {
    const h = { Accept: "application/vnd.github+json" };
    if (getToken()) h.Authorization = "Bearer " + getToken();
    return h;
  }

  /* ---------- تحميل البيانات ---------- */

  async function fetchText(url) {
    const r = await fetch(url + (url.indexOf("?") > -1 ? "&" : "?") + "t=" + Date.now());
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.text();
  }

  function parseConst(text, name) {
    return new Function(text + "\nreturn " + name + ";")();
  }

  async function loadAllFrom(base) {
    const config = parseConst(await fetchText(base + "assets/js/config.js"), "SITE");
    const content = parseConst(await fetchText(base + "assets/js/content.js"), "CONTENT");
    const cats = parseConst(await fetchText(base + "assets/js/products.js"), "CATS");
    const items = parseConst(await fetchText(base + "assets/js/products.js"), "PRODUCTS");
    return { config, content, products: { cats, items } };
  }

  async function loadData(useDraft) {
    /* مصدر واحد للبيانات — كل الملفات من النسخة المنشورة أو كلها من المحلي */
    try {
      D = await loadAllFrom(RAW);
      sourceMode = "live";
    } catch (e) {
      D = await loadAllFrom("");
      sourceMode = "local";
    }
    ORIG = clone(D);
    if (!useDraft) saveDraft();
  }

  function saveDraft() {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(D)); } catch (e) { /* مساحة ممتلئة */ }
  }

  function draftExists() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return false;
      const d = JSON.parse(raw);
      return JSON.stringify(d.config) !== JSON.stringify(ORIG.config) ||
             JSON.stringify(d.content) !== JSON.stringify(ORIG.content) ||
             JSON.stringify(d.products) !== JSON.stringify(ORIG.products);
    } catch (e) { return false; }
  }

  function restoreDraft() {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY));
    D = d;
    toast("تم استرجاع المسودة المحفوظة", "ok");
  }

  /* ---------- تتبع التعديلات ---------- */

  function dirtyFiles() {
    const list = [];
    if (JSON.stringify(D.config) !== JSON.stringify(ORIG.config)) list.push({ path: "assets/js/config.js", label: "الإعدادات والتواصل والألوان", make: makeConfig });
    if (JSON.stringify(D.content) !== JSON.stringify(ORIG.content)) list.push({ path: "assets/js/content.js", label: "النصوص والمحتوى", make: makeContent });
    if (JSON.stringify(D.products) !== JSON.stringify(ORIG.products)) list.push({ path: "assets/js/products.js", label: "المنتجات والأقسام", make: makeProducts });
    return list;
  }

  const makeConfig = () => '/* إعدادات الموقع — يتحدث تلقائياً من لوحة التحكم */\nconst SITE = ' + JSON.stringify(D.config, null, 2) + ';\n';
  const makeContent = () => '/* محتوى الموقع — يتحدث تلقائياً من لوحة التحكم */\nconst CONTENT = ' + JSON.stringify(D.content, null, 2) + ';\n';
  const makeProducts = () => '/* كتالوج المنتجات — يتحدث تلقائياً من لوحة التحكم */\n\nconst CATS = ' + JSON.stringify(D.products.cats, null, 2) + ';\n\nconst PRODUCTS = ' + JSON.stringify(D.products.items, null, 2) + ';\n';

  function markDirty() {
    const n = dirtyFiles().length;
    const badge = $("#changesBadge");
    const btn = $("#publishBtn");
    if (n > 0) {
      badge.hidden = false;
      badge.textContent = n;
      btn.disabled = false;
    } else {
      badge.hidden = true;
      btn.disabled = true;
    }
    saveDraft();
    renderPending();
  }

  function changed(cb) {
    markDirty();
    cb && cb();
  }

  /* ---------- عناصر الفورم ---------- */

  function fieldWrap(label, input) {
    const w = document.createElement("div");
    w.className = "ad-field";
    const l = document.createElement("label");
    l.textContent = label;
    w.appendChild(l);
    w.appendChild(input);
    return w;
  }

  function textField(path, label, root) {
    const input = document.createElement("input");
    input.type = "text";
    input.value = getPath(root, path) || "";
    input.addEventListener("input", () => { setPath(root, path, input.value); changed(); });
    return fieldWrap(label, input);
  }

  function textAreaField(path, label, root) {
    const input = document.createElement("textarea");
    input.value = getPath(root, path) || "";
    input.addEventListener("input", () => { setPath(root, path, input.value); changed(); });
    return fieldWrap(label, input);
  }

  function imageField(path, label, root) {
    const wrap = document.createElement("div");
    const input = document.createElement("input");
    input.type = "text";
    input.value = getPath(root, path) || "";
    const select = document.createElement("select");
    select.innerHTML = '<option value="">— اختار صورة —</option>' +
      IMAGES.map((im) => '<option value="assets/img/' + im + '">' + im + "</option>").join("") +
      '<option value="__custom">مسار خارجي / مخصص…</option>';
    select.value = input.value;
    if (!select.value) select.value = "__custom";
    select.addEventListener("change", () => {
      if (select.value === "__custom") { input.style.display = ""; }
      else { input.style.display = "none"; input.value = select.value; setPath(root, path, input.value); changed(); }
    });
    input.addEventListener("input", () => { setPath(root, path, input.value); changed(); });
    if (select.value !== "__custom") input.style.display = "none";
    wrap.appendChild(fieldWrap(label + " (اختار من القايمة)", select));
    wrap.appendChild(fieldWrap(label + " (أو اكتب المسار)", input));
    return wrap;
  }

  function colorField(path, label, root) {
    const wrap = document.createElement("div");
    wrap.className = "ad-color-item";
    const input = document.createElement("input");
    input.type = "color";
    input.value = getPath(root, path) || "#000000";
    const span = document.createElement("span");
    span.textContent = label;
    input.addEventListener("input", () => { setPath(root, path, input.value); changed(); });
    wrap.appendChild(input);
    wrap.appendChild(span);
    return wrap;
  }

  function listTextEditor(path, label, root) {
    const wrap = document.createElement("div");
    const arr = getPath(root, path) || [];
    const render = () => {
      wrap.innerHTML = "";
      arr.forEach((item, i) => {
        const row = document.createElement("div");
        row.className = "ad-list-item";
        const input = document.createElement("input");
        input.type = "text";
        input.value = item;
        input.style.border = "1.5px solid var(--line)";
        input.style.borderRadius = "10px";
        input.style.padding = "7px 12px";
        input.style.fontFamily = "inherit";
        input.style.width = "100%";
        input.addEventListener("input", () => { arr[i] = input.value; changed(); });
        const btns = document.createElement("div");
        btns.className = "prod-actions";
        const del = document.createElement("button");
        del.className = "ad-btn danger-ghost mini";
        del.type = "button";
        del.textContent = "🗑";
        del.addEventListener("click", () => { arr.splice(i, 1); changed(); render(); });
        btns.appendChild(del);
        row.appendChild(input);
        row.appendChild(btns);
        wrap.appendChild(row);
      });
      const add = document.createElement("button");
      add.className = "ad-btn soft mini";
      add.type = "button";
      add.textContent = "+ إضافة عنصر";
      add.addEventListener("click", () => { arr.push("عنصر جديد"); changed(); render(); });
      wrap.appendChild(add);
    };
    render();
    return fieldWrap(label, wrap);
  }

  function objListEditor(path, label, root, fields, labels) {
    const wrap = document.createElement("div");
    const arr = getPath(root, path) || [];
    const render = () => {
      wrap.innerHTML = "";
      arr.forEach((item, i) => {
        const row = document.createElement("div");
        row.className = "ad-list-item";
        const grid = document.createElement("div");
        grid.style.display = "grid";
        grid.style.gridTemplateColumns = "repeat(auto-fit, minmax(180px, 1fr))";
        grid.style.gap = "8px";
        grid.style.width = "100%";
        fields.forEach((f) => {
          if (f.type === "image") grid.appendChild(imageField(f.k, labels[f.k] || f.k, item));
          else {
            const inp = document.createElement("input");
            inp.type = "text";
            inp.value = item[f.k] || "";
            inp.placeholder = labels[f.k] || f.k;
            inp.style.border = "1.5px solid var(--line)";
            inp.style.borderRadius = "10px";
            inp.style.padding = "7px 12px";
            inp.style.fontFamily = "inherit";
            inp.addEventListener("input", () => { item[f.k] = inp.value; changed(); });
            grid.appendChild(inp);
          }
        });
        const btns = document.createElement("div");
        btns.className = "prod-actions";
        const del = document.createElement("button");
        del.className = "ad-btn danger-ghost mini";
        del.type = "button";
        del.textContent = "🗑";
        del.addEventListener("click", () => { arr.splice(i, 1); changed(); render(); });
        btns.appendChild(del);
        row.appendChild(grid);
        row.appendChild(btns);
        wrap.appendChild(row);
      });
      const add = document.createElement("button");
      add.className = "ad-btn soft mini";
      add.type = "button";
      add.textContent = "+ إضافة عنصر";
      add.addEventListener("click", () => {
        const fresh = {};
        fields.forEach((f) => { fresh[f.k] = ""; });
        arr.push(fresh);
        changed();
        render();
      });
      wrap.appendChild(add);
    };
    render();
    return fieldWrap(label, wrap);
  }

  function productRefList(path, label, root) {
    const wrap = document.createElement("div");
    const arr = getPath(root, path) || [];
    const options = D.products.items.map((p) => '<option value="' + p.id + '">' + p.name + "</option>").join("");
    const render = () => {
      wrap.innerHTML = "";
      arr.forEach((item, i) => {
        const row = document.createElement("div");
        row.className = "ad-list-item";
        const grid = document.createElement("div");
        grid.style.display = "grid";
        grid.style.gridTemplateColumns = "1fr 1fr";
        grid.style.gap = "8px";
        grid.style.width = "100%";
        const sel = document.createElement("select");
        sel.innerHTML = options;
        sel.value = item.id || "";
        sel.style.border = "1.5px solid var(--line)";
        sel.style.borderRadius = "10px";
        sel.style.padding = "7px 12px";
        sel.style.fontFamily = "inherit";
        sel.addEventListener("change", () => { item.id = sel.value; changed(); });
        const inp = document.createElement("input");
        inp.type = "text";
        inp.value = item.label || "";
        inp.placeholder = "الاسم المعروض";
        inp.style.border = "1.5px solid var(--line)";
        inp.style.borderRadius = "10px";
        inp.style.padding = "7px 12px";
        inp.style.fontFamily = "inherit";
        inp.addEventListener("input", () => { item.label = inp.value; changed(); });
        grid.appendChild(sel);
        grid.appendChild(inp);
        const btns = document.createElement("div");
        btns.className = "prod-actions";
        const del = document.createElement("button");
        del.className = "ad-btn danger-ghost mini";
        del.type = "button";
        del.textContent = "🗑";
        del.addEventListener("click", () => { arr.splice(i, 1); changed(); render(); });
        btns.appendChild(del);
        row.appendChild(grid);
        row.appendChild(btns);
        wrap.appendChild(row);
      });
      const add = document.createElement("button");
      add.className = "ad-btn soft mini";
      add.type = "button";
      add.textContent = "+ إضافة";
      add.addEventListener("click", () => { arr.push({ id: (D.products.items[0] || {}).id || "", label: "" }); changed(); render(); });
      wrap.appendChild(add);
    };
    render();
    return fieldWrap(label, wrap);
  }

  function idListEditor(path, label, root) {
    const wrap = document.createElement("div");
    const arr = getPath(root, path) || [];
    const options = D.products.items.map((p) => '<option value="' + p.id + '">' + p.name + "</option>").join("");
    const render = () => {
      wrap.innerHTML = "";
      arr.forEach((id, i) => {
        const row = document.createElement("div");
        row.className = "ad-list-item";
        const sel = document.createElement("select");
        sel.innerHTML = options;
        sel.value = id;
        sel.style.border = "1.5px solid var(--line)";
        sel.style.borderRadius = "10px";
        sel.style.padding = "7px 12px";
        sel.style.fontFamily = "inherit";
        sel.style.width = "100%";
        sel.addEventListener("change", () => { arr[i] = sel.value; changed(); });
        const btns = document.createElement("div");
        btns.className = "prod-actions";
        const del = document.createElement("button");
        del.className = "ad-btn danger-ghost mini";
        del.type = "button";
        del.textContent = "🗑";
        del.addEventListener("click", () => { arr.splice(i, 1); changed(); render(); });
        btns.appendChild(del);
        row.appendChild(sel);
        row.appendChild(btns);
        wrap.appendChild(row);
      });
      const add = document.createElement("button");
      add.className = "ad-btn soft mini";
      add.type = "button";
      add.textContent = "+ إضافة منتج";
      add.addEventListener("click", () => { arr.push((D.products.items[0] || {}).id || ""); changed(); render(); });
      wrap.appendChild(add);
    };
    render();
    return fieldWrap(label, wrap);
  }

  /* ---------- مجموعات المحتوى (سكيما) ---------- */

  function group(title, open) {
    const det = document.createElement("details");
    det.className = "ad-group";
    if (open) det.open = true;
    const sum = document.createElement("summary");
    sum.textContent = title;
    const body = document.createElement("div");
    body.className = "ad-group-body";
    det.appendChild(sum);
    det.appendChild(body);
    return { det, body };
  }

  function fieldByType(item, root) {
    switch (item.t) {
      case "textarea": return textAreaField(item.p, item.l, root);
      case "image": return imageField(item.p, item.l, root);
      case "list-text": return listTextEditor(item.p, item.l, root);
      case "gallery-row": return objListEditor(item.p, item.l, root, [{ k: "img", type: "image" }, { k: "alt" }], { img: "الصورة", alt: "الوصف البديل" });
      case "cat-items": return objListEditor(item.p, item.l, root, [{ k: "t" }, { k: "d" }, { k: "img", type: "image" }, { k: "pos" }, { k: "href" }], { t: "الاسم", d: "الوصف", img: "الصورة", pos: "موضع الصورة", href: "الرابط" });
      case "product-refs": return productRefList(item.p, item.l, root);
      case "id-list": return idListEditor(item.p, item.l, root);
      case "nav": return objListEditor(item.p, item.l, root, [{ k: "label" }], { label: "اسم الزر" });
      default: return textField(item.p, item.l, root);
    }
  }

  const CONTENT_SCHEMA = [
    { title: "الشريط العلوي + القوائم", items: [
      { p: "announce", l: "نص الشريط العلوي" },
      { p: "common.priceNote", l: "جملة الاستفسار عن السعر", t: "textarea" },
      { p: "common.orderBtn", l: "زر الطلب (كروت المنتجات)" },
      { p: "common.moreLabel", l: "كلمة تصفح القسم" },
      { p: "common.waFloatLabel", l: "زر الواتساب العائم (للقراءة التقنية)" },
      { p: "common.nav", l: "قائمة التنقل (الترتيب بالحذف والإضافة)", t: "nav" }
    ]},
    { title: "الهيرو — الصفحة الرئيسية", open: true, items: [
      { p: "home.hero.kicker", l: "الشريط الصغير فوق العنوان" },
      { p: "home.hero.title", l: "العنوان (الجزء الأول)" },
      { p: "home.hero.titleAccent", l: "العنوان (الجزء الملون بالذهبي)" },
      { p: "home.hero.sub", l: "الوصف", t: "textarea" },
      { p: "home.hero.cta1", l: "زر رئيسي" },
      { p: "home.hero.cta2", l: "زر ثانوي" },
      { p: "home.hero.points", l: "النقاط تحت الأزرار", t: "list-text" },
      { p: "home.hero.entranceImg", l: "صورة الواجهة (الأساسية)", t: "image" },
      { p: "home.hero.entranceAlt", l: "وصف صورة الواجهة" },
      { p: "home.hero.backImg", l: "الصورة الخلفية الصغيرة", t: "image" },
      { p: "home.hero.backAlt", l: "وصف الصورة الخلفية" },
      { p: "home.hero.chipMain", l: "كارت العنوان — السطر الأول" },
      { p: "home.hero.chipSub", l: "كارت العنوان — السطر الصغير" }
    ]},
    { title: "سيكشن القهوة + درجات التحميص", items: [
      { p: "home.coffee.kicker", l: "العنوان الصغير" },
      { p: "home.coffee.title", l: "العنوان" },
      { p: "home.coffee.sub", l: "الوصف" },
      { p: "home.coffee.moreBtn", l: "زر المزيد" },
      { p: "home.roastLevels.light.label", l: "فاتح — الاسم" },
      { p: "home.roastLevels.light.desc", l: "فاتح — الوصف" },
      { p: "home.roastLevels.medium.label", l: "وسط — الاسم" },
      { p: "home.roastLevels.medium.desc", l: "وسط — الوصف" },
      { p: "home.roastLevels.dark.label", l: "غامق — الاسم" },
      { p: "home.roastLevels.dark.desc", l: "غامق — الوصف" }
    ]},
    { title: "سيكشن أقسام العطارة (الكروت الكبيرة)", items: [
      { p: "home.cats.kicker", l: "العنوان الصغير" },
      { p: "home.cats.title", l: "العنوان" },
      { p: "home.cats.sub", l: "الوصف", t: "textarea" },
      { p: "home.cats.items", l: "كروت الأقسام", t: "cat-items" }
    ]},
    { title: "سيكشن البهارات المميزة", items: [
      { p: "home.spices.kicker", l: "العنوان الصغير" },
      { p: "home.spices.title", l: "العنوان" },
      { p: "home.spices.sub", l: "الوصف" },
      { p: "home.spices.moreBtn", l: "زر المزيد" },
      { p: "home.spices.items", l: "البهارات المعروضة", t: "product-refs" }
    ]},
    { title: "سيكشن تجربة العطارة + المعرض", items: [
      { p: "home.store.kicker", l: "العنوان الصغير" },
      { p: "home.store.title", l: "العنوان" },
      { p: "home.store.sub", l: "الوصف", t: "textarea" },
      { p: "home.store.list", l: "قائمة المميزات", t: "list-text" },
      { p: "home.store.btn", l: "زر المزيد" },
      { p: "home.store.galleryMain", l: "الصورة الكبيرة", t: "image" },
      { p: "home.store.galleryMainAlt", l: "وصف الصورة الكبيرة" },
      { p: "home.store.galleryRow", l: "صف الصور الصغيرة", t: "gallery-row" }
    ]},
    { title: "سيكشن منتجات مختارة", items: [
      { p: "home.featured.kicker", l: "العنوان الصغير" },
      { p: "home.featured.title", l: "العنوان" },
      { p: "home.featured.sub", l: "الوصف", t: "textarea" },
      { p: "home.featured.moreBtn", l: "زر المزيد" },
      { p: "home.featured.items", l: "المنتجات المعروضة", t: "id-list" }
    ]},
    { title: "سيكشن Wael Food", items: [
      { p: "home.wael.kicker", l: "العنوان الصغير" },
      { p: "home.wael.title", l: "العنوان" },
      { p: "home.wael.sub", l: "الوصف", t: "textarea" },
      { p: "home.wael.points", l: "النقاط", t: "list-text" },
      { p: "home.wael.btn", l: "الزر" },
      { p: "home.wael.img", l: "الصورة", t: "image" },
      { p: "home.wael.imgAlt", l: "وصف الصورة" },
      { p: "home.wael.imgPos", l: "موضع الصورة (center 38% مثلاً)" },
      { p: "home.wael.tag", l: "الشريط الصغير على الصورة" }
    ]},
    { title: "سيكشن المكان + الواتساب (الرئيسية)", items: [
      { p: "home.location.kicker", l: "العنوان الصغير" },
      { p: "home.location.title", l: "العنوان" },
      { p: "home.location.sub", l: "الوصف", t: "textarea" },
      { p: "home.location.addressLabel", l: "عنوان حقل العنوان" },
      { p: "home.location.phoneLabel", l: "عنوان حقل الهاتف" },
      { p: "home.location.btn1", l: "زر الخريطة" },
      { p: "home.location.btn2", l: "زر التواصل" },
      { p: "home.wa.title", l: "عنوان سيكشن الواتساب" },
      { p: "home.wa.sub", l: "وصف سيكشن الواتساب", t: "textarea" },
      { p: "home.wa.btn", l: "زر الواتساب" }
    ]},
    { title: "الفوتر", items: [
      { p: "home.footer.about", l: "نبذة الفوتر", t: "textarea" },
      { p: "home.footer.catsTitle", l: "عنوان الأقسام" },
      { p: "home.footer.linksTitle", l: "عنوان الروابط" },
      { p: "home.footer.contactTitle", l: "عنوان التواصل" },
      { p: "home.footer.mapsLink", l: "رابط الخريطة" },
      { p: "home.footer.waLink", l: "رابط الواتساب" },
      { p: "home.footer.copyright", l: "جملة الحقوق" }
    ]},
    { title: "صفحة القهوة والبن", items: [
      { p: "pages.coffee.heroTitle", l: "العنوان" },
      { p: "pages.coffee.heroSub", l: "الوصف", t: "textarea" },
      { p: "pages.coffee.heroImg", l: "صورة الهيرو", t: "image" },
      { p: "pages.coffee.heroImgAlt", l: "وصف الصورة" },
      { p: "pages.coffee.heroImgPos", l: "موضع الصورة" },
      { p: "pages.coffee.btn1", l: "زر 1" },
      { p: "pages.coffee.btn2", l: "زر 2" },
      { p: "pages.coffee.roastKicker", l: "عنوان صغير" },
      { p: "pages.coffee.roastTitle", l: "العنوان الرئيسي" },
      { p: "pages.coffee.roastSub", l: "الوصف", t: "textarea" },
      { p: "pages.coffee.gridHead", l: "عنوان قايمة المنتجات" }
    ]},
    { title: "صفحة التوابل والبهارات", items: [
      { p: "pages.spices.heroTitle", l: "العنوان" },
      { p: "pages.spices.heroSub", l: "الوصف", t: "textarea" },
      { p: "pages.spices.heroImg", l: "صورة الهيرو", t: "image" },
      { p: "pages.spices.heroImgAlt", l: "وصف الصورة" },
      { p: "pages.spices.heroImgPos", l: "موضع الصورة" },
      { p: "pages.spices.btn1", l: "زر 1" },
      { p: "pages.spices.btn2", l: "زر 2" },
      { p: "pages.spices.groundHead", l: "عنوان المطحونة" },
      { p: "pages.spices.wholeHead", l: "عنوان الحبوب الكاملة" }
    ]},
    { title: "صفحة الأعشاب والحبوب", items: [
      { p: "pages.herbs.heroTitle", l: "العنوان" },
      { p: "pages.herbs.heroSub", l: "الوصف", t: "textarea" },
      { p: "pages.herbs.heroImg", l: "صورة الهيرو", t: "image" },
      { p: "pages.herbs.heroImgAlt", l: "وصف الصورة" },
      { p: "pages.herbs.heroImgPos", l: "موضع الصورة" },
      { p: "pages.herbs.btn1", l: "زر 1" },
      { p: "pages.herbs.btn2", l: "زر 2" },
      { p: "pages.herbs.herbsHead", l: "عنوان الأعشاب" },
      { p: "pages.herbs.grainsHead", l: "عنوان الحبوب" }
    ]},
    { title: "صفحة كل المنتجات", items: [
      { p: "pages.products.heroTitle", l: "العنوان" },
      { p: "pages.products.heroSub", l: "الوصف", t: "textarea" },
      { p: "pages.products.searchPlaceholder", l: "نص خانة البحث" },
      { p: "pages.products.allChip", l: "زر الكل" },
      { p: "pages.products.resultsLabel", l: "كلمة منتج" },
      { p: "pages.products.resultsPrefix", l: "كلمة النتايج" },
      { p: "pages.products.allLabel", l: "جملة كل المنتجات" },
      { p: "pages.products.emptyTitle", l: "عنوان حالة الفراغ" },
      { p: "pages.products.emptySub", l: "وصف حالة الفراغ", t: "textarea" },
      { p: "pages.products.emptyBtn", l: "زر حالة الفراغ" }
    ]},
    { title: "صفحة تفاصيل المنتج", items: [
      { p: "pages.product.notFoundTitle", l: "عنوان المنتج غير الموجود" },
      { p: "pages.product.notFoundSub", l: "وصف المنتج غير الموجود" },
      { p: "pages.product.notFoundBtn", l: "زر المنتج غير الموجود" },
      { p: "pages.product.priceLabel", l: "عنوان السعر" },
      { p: "pages.product.priceNoteLabel", l: "ملاحظة الأوزان", t: "textarea" },
      { p: "pages.product.introLine", l: "جملة التعريف (استخدم {store})" },
      { p: "pages.product.orderNote", l: "ملاحظة الطلب (استخدم {address})" },
      { p: "pages.product.relatedKicker", l: "عنوان المشابهة الصغير" },
      { p: "pages.product.relatedTitle", l: "عنوان المشابهة" },
      { p: "pages.product.orderBtn", l: "زر الطلب" }
    ]},
    { title: "صفحة عن العطارة", items: [
      { p: "pages.about.heroTitle", l: "عنوان الهيرو" },
      { p: "pages.about.heroSub", l: "وصف الهيرو", t: "textarea" },
      { p: "pages.about.heroImg", l: "صورة الهيرو", t: "image" },
      { p: "pages.about.btn1", l: "زر 1" },
      { p: "pages.about.btn2", l: "زر 2" },
      { p: "pages.about.storyKicker", l: "العنوان الصغير" },
      { p: "pages.about.storyTitle", l: "عنوان الحكاية" },
      { p: "pages.about.paragraphs", l: "فقرات الحكاية", t: "list-text" },
      { p: "pages.about.storyImg", l: "صورة الحكاية", t: "image" },
      { p: "pages.about.galleryKicker", l: "عنوان المعرض الصغير" },
      { p: "pages.about.galleryTitle", l: "عنوان المعرض" },
      { p: "pages.about.gallerySub", l: "وصف المعرض" },
      { p: "pages.about.galleryMain", l: "صورة المعرض الكبيرة", t: "image" },
      { p: "pages.about.galleryRow", l: "صف صور المعرض", t: "gallery-row" },
      { p: "pages.about.bandTitle", l: "عنوان الختام" },
      { p: "pages.about.bandSub", l: "وصف الختام", t: "textarea" },
      { p: "pages.about.bandBtn1", l: "زر الختام 1" },
      { p: "pages.about.bandBtn2", l: "زر الختام 2" }
    ]},
    { title: "صفحة تواصل معنا", items: [
      { p: "pages.contact.heroTitle", l: "العنوان" },
      { p: "pages.contact.heroSub", l: "الوصف", t: "textarea" },
      { p: "pages.contact.addressLabel", l: "عنوان العنوان" },
      { p: "pages.contact.phoneTitle", l: "عنوان الهاتف" },
      { p: "pages.contact.waLabel", l: "عنوان الواتساب" },
      { p: "pages.contact.waValue", l: "قيمة الواتساب" },
      { p: "pages.contact.btn1", l: "زر الاتصال" },
      { p: "pages.contact.btn2", l: "زر الخريطة" },
      { p: "pages.contact.btn3", l: "زر الواتساب" }
    ]},
    { title: "عناوين المتصفح والوصف (SEO)", items: [
      { p: "pages.seo.home.title", l: "الرئيسية — العنوان" },
      { p: "pages.seo.home.desc", l: "الرئيسية — الوصف", t: "textarea" },
      { p: "pages.seo.products.title", l: "المنتجات — العنوان" },
      { p: "pages.seo.coffee.title", l: "القهوة — العنوان" },
      { p: "pages.seo.spices.title", l: "التوابل — العنوان" },
      { p: "pages.seo.herbs.title", l: "الأعشاب — العنوان" },
      { p: "pages.seo.about.title", l: "عن العطارة — العنوان" },
      { p: "pages.seo.contact.title", l: "تواصل معنا — العنوان" }
    ]}
  ];

  function renderContentEditor() {
    const root = $("#contentEditor");
    root.innerHTML = "";
    CONTENT_SCHEMA.forEach((g) => {
      const { det, body } = group(g.title, g.open);
      g.items.forEach((item) => body.appendChild(fieldByType(item, D.content)));
      root.appendChild(det);
    });
  }

  /* ---------- محرر المنتجات ---------- */

  let prodFilter = "all";

  function renderCatsEditor() {
    const root = $("#catsEditor");
    root.innerHTML = "";
    Object.keys(D.products.cats).forEach((k) => {
      const row = document.createElement("div");
      row.className = "cat-name-row";
      const lbl = document.createElement("span");
      lbl.textContent = k + ":";
      const input = document.createElement("input");
      input.type = "text";
      input.value = D.products.cats[k].name;
      input.addEventListener("input", () => { D.products.cats[k].name = input.value; changed(); });
      row.appendChild(lbl);
      row.appendChild(input);
      root.appendChild(row);
    });
  }

  function renderProductsEditor() {
    const filterRoot = $("#prodFilter");
    filterRoot.innerHTML = "";
    const cats = [{ all: "الكل" }].concat(Object.keys(D.products.cats).map((k) => ({ k, name: D.products.cats[k].name })));
    cats.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ad-chip" + ((c.all && prodFilter === "all") || c.k === prodFilter ? " active" : "");
      b.textContent = c.all || c.name;
      b.addEventListener("click", () => { prodFilter = c.all ? "all" : c.k; renderProductsEditor(); });
      filterRoot.appendChild(b);
    });

    const root = $("#productsEditor");
    root.innerHTML = "";
    const list = D.products.items.filter((p) => prodFilter === "all" || p.cat === prodFilter);
    $("#prodCount").textContent = "(" + D.products.items.length + " منتج)";

    list.forEach((p) => {
      const realIndex = D.products.items.indexOf(p);
      const row = document.createElement("div");
      row.className = "prod-row" + (p.cat === "coffee" ? " coffee" : "");

      const color = document.createElement("input");
      color.type = "color";
      color.value = p.color || "#B59A62";
      color.title = "لون الجرة";
      color.addEventListener("input", () => { p.color = color.value; changed(); });

      const name = document.createElement("input");
      name.type = "text";
      name.value = p.name;
      name.placeholder = "اسم المنتج";
      name.addEventListener("input", () => { p.name = name.value; changed(); });

      const cat = document.createElement("select");
      Object.keys(D.products.cats).forEach((k) => {
        const o = document.createElement("option");
        o.value = k;
        o.textContent = D.products.cats[k].name;
        cat.appendChild(o);
      });
      cat.value = p.cat;
      cat.addEventListener("change", () => { p.cat = cat.value; changed(); renderProductsEditor(); });

      const brand = document.createElement("input");
      brand.type = "text";
      brand.value = p.brand || "";
      brand.placeholder = "ماركة (اختياري)";
      brand.addEventListener("input", () => { p.brand = brand.value || undefined; if (!brand.value) delete p.brand; changed(); });

      row.appendChild(color);
      row.appendChild(name);
      row.appendChild(cat);
      if (p.cat === "coffee") {
        const roast = document.createElement("select");
        [["light", "فاتح"], ["medium", "وسط"], ["dark", "غامق"]].forEach((r) => {
          const o = document.createElement("option");
          o.value = r[0];
          o.textContent = "تحميص " + r[1];
          roast.appendChild(o);
        });
        roast.value = p.roast || "medium";
        roast.addEventListener("change", () => { p.roast = roast.value; changed(); });
        row.appendChild(roast);
      } else {
        row.appendChild(brand);
      }

      const actions = document.createElement("div");
      actions.className = "prod-actions";

      const up = document.createElement("button");
      up.type = "button";
      up.className = "ad-btn soft mini";
      up.textContent = "↑";
      up.title = "تقديم";
      up.addEventListener("click", () => {
        if (realIndex > 0) {
          const tmp = D.products.items[realIndex - 1];
          D.products.items[realIndex - 1] = p;
          D.products.items[realIndex] = tmp;
          changed();
          renderProductsEditor();
        }
      });

      const down = document.createElement("button");
      down.type = "button";
      down.className = "ad-btn soft mini";
      down.textContent = "↓";
      down.title = "تأخير";
      down.addEventListener("click", () => {
        if (realIndex < D.products.items.length - 1) {
          const tmp = D.products.items[realIndex + 1];
          D.products.items[realIndex + 1] = p;
          D.products.items[realIndex] = tmp;
          changed();
          renderProductsEditor();
        }
      });

      const del = document.createElement("button");
      del.type = "button";
      del.className = "ad-btn danger-ghost mini";
      del.textContent = "🗑";
      del.title = "حذف";
      del.addEventListener("click", () => {
        if (confirm("متأكد من حذف «" + p.name + "» من الموقع؟")) {
          D.products.items.splice(realIndex, 1);
          changed();
          renderProductsEditor();
        }
      });

      actions.appendChild(up);
      actions.appendChild(down);
      actions.appendChild(del);
      row.appendChild(actions);
      root.appendChild(row);
    });
  }

  $("#addProductBtn").addEventListener("click", () => {
    const name = prompt("اسم المنتج الجديد:");
    if (!name || !name.trim()) return;
    D.products.items.push({
      id: slugify(name),
      name: name.trim(),
      cat: prodFilter === "all" ? "other" : prodFilter,
      color: "#B59A62"
    });
    changed();
    renderProductsEditor();
    toast("تمت إضافة المنتج — اضغط «نشر التغييرات» ليظهر على الموقع", "ok");
  });

  /* ---------- الهوية والتواصل ---------- */

  function renderIdentityEditor() {
    const root = $("#identityEditor");
    root.innerHTML = "";
    root.appendChild(textField("name", "اسم العطارة (عربي)", D.config));
    root.appendChild(textField("nameLatin", "الاسم اللاتيني", D.config));
    root.appendChild(textField("tagline", "الجملة التعريفية (بتظهر في الفوتر)", D.config));
  }

  function renderContactEditor() {
    const root = $("#contactEditor");
    root.innerHTML = "";

    const wa = textField("whatsapp", "رقم واتساب (بصيغة دولية: 201095752548)", D.config);
    root.appendChild(wa);

    const phonesWrap = document.createElement("div");
    const renderPhones = () => {
      phonesWrap.innerHTML = "";
      D.config.phones.forEach((p, i) => {
        const row = document.createElement("div");
        row.className = "ad-list-item";
        const grid = document.createElement("div");
        grid.style.display = "grid";
        grid.style.gridTemplateColumns = "1fr 1.4fr";
        grid.style.gap = "8px";
        grid.style.width = "100%";
        const lbl = document.createElement("input");
        lbl.type = "text";
        lbl.value = p.label;
        lbl.placeholder = "الرقم المعروض";
        lbl.style.border = "1.5px solid var(--line)";
        lbl.style.borderRadius = "10px";
        lbl.style.padding = "7px 12px";
        lbl.style.fontFamily = "inherit";
        lbl.addEventListener("input", () => { p.label = lbl.value; changed(); });
        const tel = document.createElement("input");
        tel.type = "text";
        tel.value = p.tel;
        tel.placeholder = "صيغة الاتصال الدولية +201095752548";
        tel.dir = "ltr";
        tel.style.border = "1.5px solid var(--line)";
        tel.style.borderRadius = "10px";
        tel.style.padding = "7px 12px";
        tel.style.fontFamily = "inherit";
        tel.addEventListener("input", () => { p.tel = tel.value; changed(); });
        grid.appendChild(lbl);
        grid.appendChild(tel);
        const btns = document.createElement("div");
        btns.className = "prod-actions";
        const del = document.createElement("button");
        del.className = "ad-btn danger-ghost mini";
        del.type = "button";
        del.textContent = "🗑";
        del.addEventListener("click", () => { D.config.phones.splice(i, 1); changed(); renderPhones(); });
        btns.appendChild(del);
        row.appendChild(grid);
        row.appendChild(btns);
        phonesWrap.appendChild(row);
      });
      const add = document.createElement("button");
      add.className = "ad-btn soft mini";
      add.type = "button";
      add.textContent = "+ إضافة رقم";
      add.addEventListener("click", () => { D.config.phones.push({ label: "", tel: "+20" }); changed(); renderPhones(); });
      phonesWrap.appendChild(add);
    };
    renderPhones();
    root.appendChild(fieldWrap("أرقام الهاتف", phonesWrap));

    root.appendChild(textAreaField("addressAr", "العنوان بالعربي (كامل)", D.config));
    root.appendChild(textField("addressShort", "العنوان المختصر (بيرد في رسايل الطلب)", D.config));
    root.appendChild(textAreaField("addressEn", "العنوان بالإنجليزي (لتحديث رابط الخريطة)", D.config));

    const mapsRow = document.createElement("div");
    mapsRow.style.marginBottom = "14px";
    const mapsBtn = document.createElement("button");
    mapsBtn.type = "button";
    mapsBtn.className = "ad-btn soft";
    mapsBtn.textContent = "تحديث روابط الخريطة من العنوان الإنجليزي";
    mapsBtn.addEventListener("click", () => {
      const q = encodeURIComponent(D.config.addressEn);
      D.config.mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + q;
      D.config.mapsEmbed = "https://www.google.com/maps?q=" + q + "&output=embed&hl=ar";
      changed();
      toast("تم تحديث روابط الخريطة", "ok");
    });
    mapsRow.appendChild(mapsBtn);
    root.appendChild(mapsRow);
  }

  function renderMsgsEditor() {
    const root = $("#msgsEditor");
    root.innerHTML = "";
    root.appendChild(textAreaField("msgs.product", "رسالة طلب منتج ({name} و {qty} بيتستبدلوا أوتوماتيك)", D.config));
    root.appendChild(textAreaField("msgs.general", "رسالة الاستفسار العام", D.config));
  }

  function renderThemeEditor() {
    const root = $("#themeEditor");
    root.innerHTML = "";
    const colors = [
      ["olive", "الأخضر الزيتوني (الهوية)"],
      ["espresso", "البني الغامق (الخلفيات)"],
      ["ivory", "العاجي (الخلفيات الفاتحة)"],
      ["sand", "الرملي"],
      ["brass", "النحاسي (الأزرار واللمسات)"],
      ["terra", "الطوبي"]
    ];
    colors.forEach((c) => root.appendChild(colorField("theme." + c[0], c[1], D.config)));
  }

  /* ---------- الصور ---------- */

  async function loadImages() {
    try {
      const r = await fetch(API + "assets/img?ref=" + BRANCH, { headers: { Accept: "application/vnd.github+json" } });
      if (r.ok) {
        const j = await r.json();
        if (Array.isArray(j)) {
          const names = j.filter((f) => f.type === "file").map((f) => f.name);
          IMAGES = names.length ? names : KNOWN_IMAGES.slice();
        }
      }
    } catch (e) {
      IMAGES = KNOWN_IMAGES.slice();
    }
    renderImagesList();
  }

  function renderImagesList() {
    const root = $("#imagesList");
    root.innerHTML = "";
    IMAGES.forEach((name) => {
      const card = document.createElement("div");
      card.className = "ad-img-card";
      const img = document.createElement("img");
      img.src = RAW + "assets/img/" + name + "?t=" + Date.now();
      img.loading = "lazy";
      const cap = document.createElement("div");
      cap.className = "ad-img-name";
      cap.textContent = name;
      card.appendChild(img);
      card.appendChild(cap);
      root.appendChild(card);
    });
  }

  $("#uploadImageBtn").addEventListener("click", async () => {
    const fileInput = $("#imageFile");
    const status = $("#uploadStatus");
    if (!fileInput.files || !fileInput.files[0]) {
      status.className = "ad-upload-status err";
      status.textContent = "اختار صورة الأول.";
      return;
    }
    if (!getToken()) {
      status.className = "ad-upload-status err";
      status.textContent = "اربط جيت هاب الأول من تبويب «النشر والربط».";
      return;
    }
    const file = fileInput.files[0];
    if (file.size > 4 * 1024 * 1024) {
      status.className = "ad-upload-status err";
      status.textContent = "الصورة أكبر من 4 ميجا — صغّرها الأول.";
      return;
    }
    try {
      status.className = "ad-upload-status";
      status.textContent = "جاري الرفع…";
      const buf = await file.arrayBuffer();
      let bin = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const content = btoa(bin);
      await ghPutFile("assets/img/" + file.name, content, "رفع صورة: " + file.name);
      if (IMAGES.indexOf(file.name) === -1) IMAGES.push(file.name);
      renderImagesList();
      status.className = "ad-upload-status ok";
      status.textContent = "تم رفع الصورة ✓ — استخدمها دلوقتي من أي حقل صورة (assets/img/" + file.name + ")";
      fileInput.value = "";
    } catch (e) {
      status.className = "ad-upload-status err";
      status.textContent = "فشل الرفع: " + e.message;
    }
  });

  /* ---------- النشر ---------- */

  function ghHeaders(extra) {
    const h = Object.assign({ Accept: "application/vnd.github+json" }, extra || {});
    h.Authorization = "Bearer " + getToken();
    return h;
  }

  async function ghPutFile(path, contentB64, message) {
    let sha = null;
    try {
      const r = await fetch(API + path + "?ref=" + BRANCH, { headers: ghHeaders() });
      if (r.ok) sha = (await r.json()).sha;
    } catch (e) { /* ملف جديد */ }
    const body = { message, content: contentB64, branch: BRANCH };
    if (sha) body.sha = sha;
    const pr = await fetch(API + path, {
      method: "PUT",
      headers: ghHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(body)
    });
    if (!pr.ok) {
      const txt = await pr.text();
      throw new Error(pr.status + " " + txt.slice(0, 160));
    }
  }

  async function publish() {
    if (!getToken()) {
      toast("اربط جيت هاب الأول من تبويب «النشر والربط»", "err");
      switchTab("publish");
      return;
    }
    const files = dirtyFiles();
    if (!files.length) { toast("مفيش تعديلات للنشر"); return; }
    const btn = $("#publishBtn");
    btn.disabled = true;
    try {
      for (let i = 0; i < files.length; i++) {
        toast("جاري النشر (" + (i + 1) + "/" + files.length + "): " + files[i].label);
        await ghPutFile(files[i].path, b64encode(files[i].make()), "تحديث من لوحة التحكم: " + files[i].label);
      }
      ORIG = clone(D);
      markDirty();
      toast("تم النشر ✓ — الموقع هيتحدث خلال دقيقة أو اتنين", "ok");
      renderPending();
    } catch (e) {
      toast("فشل النشر: " + e.message, "err");
      markDirty();
    }
    btn.disabled = dirtyFiles().length === 0;
  }

  function renderPending() {
    const root = $("#pendingChanges");
    if (!root) return;
    const files = dirtyFiles();
    root.innerHTML = "";
    if (!files.length) {
      root.innerHTML = '<p class="ad-hint">مفيش تعديلات غير منشورة. كل حاجة على الموقع محدثة ✓</p>';
      return;
    }
    files.forEach((f) => {
      const row = document.createElement("div");
      row.className = "ad-pending-item";
      row.innerHTML = "<span>" + f.label + "</span><code>" + f.path + "</code>";
      root.appendChild(row);
    });
  }

  function renderTokenStatus() {
    const root = $("#tokenStatus");
    const has = !!getToken();
    root.innerHTML = has
      ? '<div class="ad-token-status connected">متصل بجيت هاب ✓ — تقدر تنشر تعديلاتك وترفع صور.</div>'
      : '<div class="ad-token-status disconnected">غير متصل — تقدر تتفرج وتجرب، بس للنشر لازم تربط جيت هاب بالـ Token.</div>';
  }

  $("#saveTokenBtn").addEventListener("click", async () => {
    const val = $("#tokenInput").value.trim();
    if (!val) { toast("الصق الـ Token الأول", "err"); return; }
    setToken(val);
    try {
      const r = await fetch("https://api.github.com/user", { headers: ghHeaders() });
      if (r.ok) {
        const j = await r.json();
        renderTokenStatus();
        $("#tokenInput").value = "";
        toast("تم الربط بنجاح ✓ (حساب: " + j.login + ")", "ok");
      } else {
        clearToken();
        renderTokenStatus();
        toast("الـ Token مش شغال — اتأكد منه وإن صلاحيات Contents مفعلة", "err");
      }
    } catch (e) {
      clearToken();
      renderTokenStatus();
      toast("مشكلة اتصال بجيت هاب", "err");
    }
  });

  $("#clearTokenBtn").addEventListener("click", () => {
    clearToken();
    renderTokenStatus();
    toast("تم إلغاء الربط");
  });

  /* ---------- التبويبات ---------- */

  function switchTab(id) {
    $$(".ad-tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === id));
    $$(".ad-panel").forEach((p) => p.classList.toggle("active", p.id === "panel-" + id));
    if (id === "images") loadImages();
  }

  $$(".ad-tab").forEach((t) => t.addEventListener("click", () => switchTab(t.dataset.tab)));

  /* ---------- التشغيل ---------- */

  $("#publishBtn").addEventListener("click", publish);
  $("#reloadBtn").addEventListener("click", async () => {
    if (dirtyFiles().length && !confirm("فيه تعديلات مش منشورة — التحديث هيمسحها. متأكد؟")) return;
    await boot(false);
    toast("تم تحديث البيانات");
  });

  async function boot(askDraft) {
    try {
      await loadData(false);
    } catch (e) {
      $("#connStatus").textContent = "تعذر تحميل البيانات";
      toast("تعذر تحميل البيانات: " + e.message, "err");
      return;
    }
    const conn = $("#connStatus");
    conn.className = "ad-conn " + (sourceMode === "live" ? "live" : "local");
    conn.textContent = sourceMode === "live" ? "متصل بالنسخة المنشورة" : "نسخة محلية (مش المنشورة)";

    if (askDraft && draftExists()) {
      if (confirm("فيه مسودة تعديلات محفوظة من آخر مرة — تسترجعها؟")) restoreDraft();
    }

    renderCatsEditor();
    renderProductsEditor();
    renderContentEditor();
    renderIdentityEditor();
    renderContactEditor();
    renderMsgsEditor();
    renderThemeEditor();
    renderTokenStatus();
    renderPending();
    markDirty();
    loadImages();
  }

  boot(true);
})();
