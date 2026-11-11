/* ============================================================
   editor.js — المحرر البصري لموقع عطارة شقير العطار
   بيشتغل بس في وضع التحرير (?edit=1) — الزوار مش بيشوفوه
   اضغط على أي عنصر في الصفحة وعدّل: النص، الألوان، الزخارف،
   التباعد، الخطوط، الصور، الإخفاء، و CSS مخصص
   التعديلات بتتخزن محلياً وبتتنشر من لوحة التحكم
   ============================================================ */

(function () {
  "use strict";

  /* ---------- التفعيل ---------- */
  const qs = new URLSearchParams(location.search);
  const FLAG = "attar_edit_mode";
  const DRAFT_KEY = "attar_design_draft";
  if (qs.get("edit") === "1") localStorage.setItem(FLAG, "1");
  if (localStorage.getItem(FLAG) !== "1") return;

  const KNOWN_IMAGES = [
    "entrance.jpg", "interior-counter.png", "interior-aisle.png", "brass-jars.png",
    "brass-jars-2.png", "bins-grains.png", "aisle-pasta.png", "bg-spoons.webp", "bg-spice-market.jpg"
  ];

  const PATTERNS = [
    { id: "none",     name: "بلا زخرفة" },
    { id: "star",     name: "نجمة ثمانية" },
    { id: "octagon",  name: "ثماني وتصالب" },
    { id: "zellige",  name: "زليج" },
    { id: "diamond",  name: "معينات" },
    { id: "hex",      name: "سداسي" },
    { id: "dots",     name: "نقاط" },
    { id: "diag",     name: "خطوط مائلة" },
    { id: "circles",  name: "دوائر متداخلة" },
    { id: "najma",    name: "نجمة سداسية" }
  ];

  const SCOPES = [
    { sel: ".hero",                  tok: "patHero",  label: "زخرفة الهيرو (كل الصفحات)" },
    { sel: ".section-dark",          tok: "patDark",  label: "زخرفة الأقسام الغامقة" },
    { sel: ".section-olive",         tok: "patOlive", label: "زخرفة سيكشن الواتساب الأخضر" },
    { sel: ".section-pattern-light", tok: "patLight", label: "زخرفة الأقسام الفاتحة المرقشة" },
    { sel: ".page-hero",             tok: "patHero",  label: "زخرفة هيدر الصفحات الداخلية" },
    { sel: ".site-footer",           tok: "patFooter",label: "زخرفة الفوتر" }
  ];

  const SHADOWS = {
    "": "بدون",
    "var(--shadow-soft)": "ظل ناعم",
    "var(--shadow-lift)": "ظل مرتفع",
    "0 8px 22px color-mix(in srgb, var(--brass) 40%, transparent)": "توهج نحاسي"
  };

  const FONTS = {
    "": "الخط الحالي",
    "var(--font-body)": "Cairo",
    "var(--font-head)": "Amiri"
  };

  const pageKey = document.body.dataset.page || (location.pathname.split("/").pop() || "index").replace(".html", "");

  /* ---------- المسودة ---------- */
  let draft = null;
  try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch (e) { draft = null; }
  if (!draft || !draft.version) {
    draft = (typeof DESIGN !== "undefined" && DESIGN && DESIGN.version) ? JSON.parse(JSON.stringify(DESIGN)) : { version: 1, tokens: {}, overrides: [], customCSS: "" };
  }
  if (!draft.tokens) draft.tokens = {};
  if (!draft.overrides) draft.overrides = [];

  const undoStack = [];
  const originals = new Map(); // Element -> {text, src, alt}
  let selected = null;
  let selKey = null;
  let ovCur = null;
  let previewMode = false;
  let saveTimer = null;

  /* ---------- أدوات ---------- */
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const clone = (o) => JSON.parse(JSON.stringify(o));

  function snapshot() {
    undoStack.push(JSON.stringify(draft));
    if (undoStack.length > 60) undoStack.shift();
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch (e) { /* ممتلئة */ }
      try {
        if (window.opener && !window.opener.closed) window.opener.postMessage("attar-design-updated", "*");
      } catch (e) { /* تجاهل */ }
      const b = document.getElementById("edSaveState");
      if (b) { b.textContent = "تم الحفظ محلياً ✓"; b.classList.add("on"); }
    }, 350);
  }

  function findOv(page, sel) {
    return draft.overrides.find((o) => o.page === page && o.sel === sel) || null;
  }
  function ensureOv(sel) {
    let o = findOv(pageKey, sel);
    if (!o) { o = { page: pageKey, sel: sel, props: {}, raw: "" }; draft.overrides.push(o); }
    return o;
  }

  /* ---------- توليد الـ selector ---------- */
  function selFor(el) {
    if (el.id) return "#" + CSS.escape(el.id);
    const parts = [];
    let node = el;
    while (node && node !== document.body) {
      if (node.id) { parts.unshift("#" + CSS.escape(node.id)); break; }
      const tag = node.tagName.toLowerCase();
      let idx = 1, s = node;
      while ((s = s.previousElementSibling)) { if (s.tagName === node.tagName) idx++; }
      const seg = tag + (idx > 1 ? ":nth-of-type(" + idx + ")" : ":nth-of-type(1)");
      parts.unshift(seg);
      if (node.tagName === "SECTION" && parts.length > 0) break;
      if (parts.length >= 5) break;
      node = node.parentElement;
    }
    return "main " + parts.join(" > ");
  }

  function isDarkish(el) {
    let n = el;
    while (n && n !== document.body) {
      const cl = n.classList;
      if (cl && (cl.contains("section-dark") || cl.contains("section-olive") || cl.contains("hero") || cl.contains("page-hero") || cl.contains("site-footer") || cl.contains("drawer"))) return true;
      n = n.parentElement;
    }
    const bg = getComputedStyle(el).backgroundColor;
    const m = bg.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (m) {
      const lum = 0.299 * (+m[1]) + 0.587 * (+m[2]) + 0.114 * (+m[3]);
      return lum < 110;
    }
    return false;
  }

  /* ---------- CSS من الخصائص ---------- */
  function computedFirst(el, prop) {
    const v = getComputedStyle(el)[prop];
    return v && v !== "none" ? v : "";
  }

  function propsToCss(p) {
    let css = "";
    if (p.color) css += "color:" + p.color + ";";
    if (p.bg) css += "background-color:" + p.bg + ";";
    if (p.bw != null && p.bw !== "" && +p.bw > 0) css += "border-width:" + p.bw + "px;border-style:solid;";
    if (p.bc) css += "border-color:" + p.bc + ";";
    if (p.shadow != null && p.shadow !== "") css += "box-shadow:" + p.shadow + ";";
    if (p.opacity != null && p.opacity !== "" && +p.opacity < 1) css += "opacity:" + p.opacity + ";";
    const pads = [p.padT, p.padR, p.padB, p.padL];
    if (pads.some((v) => v != null && v !== "")) css += "padding:" + pads.map((v) => (v == null || v === "" ? "0" : (+v) + "px")).join(" ") + ";";
    const mars = [p.marT, p.marR, p.marB, p.marL];
    if (mars.some((v) => v != null && v !== "")) css += "margin:" + mars.map((v) => (v == null || v === "" ? "0" : (+v) + "px")).join(" ") + ";";
    if (p.radius != null && p.radius !== "") css += "border-radius:" + p.radius + "px;";
    if (p.fs) css += "font-size:" + p.fs + "px;";
    if (p.fw) css += "font-weight:" + p.fw + ";";
    if (p.ff) css += "font-family:" + p.ff + ";";
    if (p.lh) css += "line-height:" + p.lh + ";";
    if (p.ta) css += "text-align:" + p.ta + ";";
    if (p.ls != null && p.ls !== "") css += "letter-spacing:" + p.ls + "px;";
    if (p.pat) {
      css += "background-image:var(--pattern-" + p.pat + ");";
      css += "background-size:" + (p.patSize || 120) + "px;background-repeat:repeat;";
      if (p.patPos) css += "background-position:" + p.patPos + ";";
    } else if (p.pat === "" && p.patCleared) {
      css += "background-image:none;";
    }
    if (p.bgpos) css += "background-position:" + p.bgpos + ";";
    if (p.raw) css += p.raw;
    return css;
  }

  function syncOvCss(ov) {
    ov.css = propsToCss(Object.assign({}, ov.props, { raw: ov.raw }));
  }

  /* ---------- التطبيق المباشر ---------- */
  let liveStyle = null;
  function applyLive() {
    if (!liveStyle) {
      liveStyle = document.createElement("style");
      liveStyle.id = "editor-live-style";
      document.head.appendChild(liveStyle);
    }
    const css = [];
    draft.overrides.forEach((o) => {
      if (!o.sel || !o.css) return;
      const scoped = (o.page && o.page !== "*") ? 'body[data-page="' + o.page + '"] ' : "";
      css.push(scoped + o.sel + "{" + o.css + "}");
      if (o.hidden) css.push(scoped + o.sel + "{display:none !important}");
    });
    liveStyle.textContent = css.join("\n");
    scheduleSave();
  }

  function applyDomOv(ov) {
    if (!ov || !ov.sel) return;
    let els = [];
    try { els = document.querySelectorAll(ov.sel); } catch (e) { return; }
    els.forEach((el) => {
      if (ov.text != null && ov.text !== "") {
        if (!originals.has(el)) originals.set(el, { text: el.textContent, src: el.getAttribute("src"), alt: el.getAttribute("alt") });
        if (ov.textPath && ov.textPath.length) {
          let node = el;
          const path = ov.textPath.slice();
          while (path.length > 1 && node) node = node.childNodes[path.shift()];
          if (node && node.childNodes[path[0]]) node.childNodes[path[0]].textContent = ov.text;
        } else {
          el.textContent = ov.text;
        }
      }
      if (ov.img) {
        if (!originals.has(el)) originals.set(el, { text: el.textContent, src: el.getAttribute("src"), alt: el.getAttribute("alt") });
        el.setAttribute("src", ov.img);
        el.setAttribute("alt", ov.alt || "");
      }
    });
  }

  function restoreDom(sel) {
    let els = [];
    try { els = document.querySelectorAll(sel); } catch (e) { return; }
    els.forEach((el) => {
      const orig = originals.get(el);
      if (orig) {
        if (orig.text != null) el.textContent = orig.text;
        if (orig.src != null) el.setAttribute("src", orig.src);
        if (orig.alt != null) el.setAttribute("alt", orig.alt);
        originals.delete(el);
      }
    });
  }

  /* ---------- واجهة المحرر ---------- */
  const editorCSS = `
#edToolbar{position:fixed;bottom:0;inset-inline:0;z-index:99990;background:rgba(29,23,18,.97);color:#F7F1E6;display:flex;align-items:center;gap:12px;padding:10px 18px;font-family:Cairo,sans-serif;font-size:13px;box-shadow:0 -8px 30px rgba(0,0,0,.35);flex-wrap:wrap}
#edToolbar .ed-logo{font-weight:800;color:#B59A62;display:flex;align-items:center;gap:8px}
#edToolbar .ed-logo svg{width:20px;height:20px}
#edSelPath{flex:1;min-width:180px;background:rgba(247,241,230,.08);border:1px solid rgba(217,198,165,.25);border-radius:10px;padding:6px 12px;direction:ltr;text-align:left;font-family:monospace;font-size:11.5px;color:#D9C6A5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#edSaveState{color:#7BA05B;font-weight:600;opacity:0;transition:opacity .3s}
#edSaveState.on{opacity:1}
.ed-btn{background:rgba(247,241,230,.1);border:1px solid rgba(217,198,165,.3);color:#F7F1E6;border-radius:10px;padding:7px 14px;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;transition:background .15s}
.ed-btn:hover{background:rgba(181,154,98,.3)}
.ed-btn.primary{background:#B59A62;color:#241A10;border-color:#B59A62}
.ed-btn.primary:hover{background:#C9AF77}
.ed-btn.warn{color:#E8A598}
#edInspector{position:fixed;bottom:64px;inset-inline-start:14px;z-index:99991;width:330px;max-height:min(64vh,640px);overflow-y:auto;background:rgba(252,248,239,.98);color:#2D2119;border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,.3);border:1px solid rgba(181,154,98,.4);font-family:Cairo,sans-serif;display:none}
#edInspector.open{display:block}
#edInspector .ed-head{position:sticky;top:0;background:#344532;color:#F7F1E6;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:8px}
#edInspector .ed-head strong{font-size:13px}
#edInspector .ed-head button{background:none;border:none;color:#F7F1E6;cursor:pointer;font-size:16px;line-height:1}
.ed-empty{padding:22px 18px;font-size:12.5px;color:#7C7060;line-height:2}
.ed-group{border-bottom:1px solid rgba(45,33,25,.08)}
.ed-group>summary{padding:11px 16px;font-weight:700;font-size:12.5px;cursor:pointer;color:#344532;list-style:none;display:flex;align-items:center;gap:8px}
.ed-group>summary::-webkit-details-marker{display:none}
.ed-group>summary::before{content:"◂";color:#B59A62;font-size:11px;transition:transform .2s}
.ed-group[open]>summary::before{transform:rotate(-90deg)}
.ed-body{padding:4px 16px 16px;display:grid;gap:10px}
.ed-row{display:grid;gap:5px}
.ed-row>label{font-size:11px;font-weight:600;color:#7C7060}
.ed-row input[type=text],.ed-row textarea,.ed-row select{border:1.5px solid rgba(45,33,25,.18);border-radius:10px;padding:7px 10px;font-family:inherit;font-size:12.5px;background:#fff;width:100%}
.ed-row textarea{min-height:60px;resize:vertical}
.ed-range{display:grid;grid-template-columns:1fr 46px;align-items:center;gap:8px}
.ed-range input[type=range]{width:100%;accent-color:#B59A62}
.ed-range output{font-size:11px;font-weight:700;color:#344532;text-align:center;direction:ltr}
.ed-color{display:flex;align-items:center;gap:9px}
.ed-color input[type=color]{width:34px;height:30px;border:1px solid rgba(45,33,25,.2);border-radius:8px;padding:2px;background:#fff;flex:none}
.ed-color span{font-size:11px;font-weight:600;color:#7C7060;flex:1}
.ed-patgrid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.ed-pat{border:1.5px solid rgba(45,33,25,.15);background:#fff;border-radius:10px;padding:8px 6px;font-size:11px;font-weight:600;color:#5A4F3F;cursor:pointer;font-family:inherit;transition:all .15s}
.ed-pat:hover{border-color:#B59A62}
.ed-pat.on{background:#344532;color:#F7F1E6;border-color:#344532}
.ed-pat .ed-sw{display:block;height:26px;border-radius:6px;margin-bottom:5px;background-color:#F7F1E6}
.ed-pat.dark-sw .ed-sw{background-color:#2D2119}
.ed-hint{font-size:10.5px;color:#A99D89;line-height:1.8}
.ed-danger{background:rgba(167,101,69,.1);color:#A76545;border-color:rgba(167,101,69,.4)}
.ed-danger:hover{background:rgba(167,101,69,.2)}
#edHover{position:fixed;z-index:99980;pointer-events:none;border:2px dashed rgba(181,154,98,.9);border-radius:6px;display:none;background:rgba(181,154,98,.08)}
#edOutline{position:fixed;z-index:99981;pointer-events:none;border:2px solid #B59A62;border-radius:6px;display:none;box-shadow:0 0 0 4px rgba(181,154,98,.25)}
#edOutline::after{content:attr(data-label);position:absolute;top:-26px;inset-inline-start:-2px;background:#B59A62;color:#241A10;font-family:Cairo,sans-serif;font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:7px;white-space:nowrap}
body.ed-off #edHover,body.ed-off #edOutline{display:none !important}
#edToolbar .ed-note{font-size:11px;color:rgba(217,198,165,.75)}
@media (max-width:640px){#edInspector{width:calc(100vw - 28px)}}
`;

  const style = document.createElement("style");
  style.id = "editor-css";
  style.textContent = editorCSS;
  document.head.appendChild(style);

  /* شريط الأدوات */
  const bar = document.createElement("div");
  bar.id = "edToolbar";
  bar.innerHTML =
    '<span class="ed-logo"><svg viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#344532"/><path d="M32 16c8.8 0 16 7.2 16 16v14a2 2 0 0 1-2 2H18a2 2 0 0 1-2-2V32c0-8.8 7.2-16 16-16z" fill="none" stroke="#B59A62" stroke-width="3"/></svg> المحرر البصري</span>' +
    '<span id="edSelPath">اضغط على أي عنصر في الصفحة…</span>' +
    '<span id="edSaveState"></span>' +
    '<button class="ed-btn" id="edPreviewBtn" type="button">معاينة</button>' +
    '<button class="ed-btn" id="edUndoBtn" type="button">تراجع</button>' +
    '<button class="ed-btn ed-danger" id="edResetElBtn" type="button" disabled>إلغاء تعديلات العنصر</button>' +
    '<button class="ed-btn warn" id="edResetAllBtn" type="button">استرجاع الأصلي</button>' +
    '<button class="ed-btn primary" id="edExitBtn" type="button">حفظ وخروج</button>' +
    '<span class="ed-note">Shift+كليك = العنصر الأب · Esc = إلغاء التحديد</span>';
  document.body.appendChild(bar);

  const inspector = document.createElement("div");
  inspector.id = "edInspector";
  inspector.innerHTML = '<div class="ed-empty">اضغط على أي عنصر في الصفحة لتعديله — النصوص والألوان والزخارف والتباعد وكل حاجة.</div>';
  document.body.appendChild(inspector);

  const hover = document.createElement("div");
  hover.id = "edHover";
  document.body.appendChild(hover);
  const outline = document.createElement("div");
  outline.id = "edOutline";
  document.body.appendChild(outline);

  /* ---------- التحديد ---------- */
  function select(el) {
    if (!el || el === document.body || el === document.documentElement || el === bar || bar.contains(el) || el === inspector || inspector.contains(el)) return;
    selected = el;
    selKey = selFor(el);
    ovCur = ensureOv(selKey);
    document.getElementById("edSelPath").textContent = selKey;
    document.getElementById("edResetElBtn").disabled = !(ovCur.css || ovCur.text != null || ovCur.img || ovCur.hidden);
    renderInspector();
    positionOutline();
    outline.style.display = "block";
  }

  function deselect() {
    selected = null; selKey = null; ovCur = null;
    outline.style.display = "none";
    inspector.classList.remove("open");
    inspector.innerHTML = '<div class="ed-empty">اضغط على أي عنصر في الصفحة لتعديله — النصوص والألوان والزخارف والتباعد وكل حاجة.</div>';
    document.getElementById("edSelPath").textContent = "اضغط على أي عنصر في الصفحة…";
    document.getElementById("edResetElBtn").disabled = true;
  }

  function positionOutline() {
    if (!selected) return;
    const r = selected.getBoundingClientRect();
    outline.style.top = r.top + "px";
    outline.style.left = r.left + "px";
    outline.style.width = r.width + "px";
    outline.style.height = r.height + "px";
    outline.dataset.label = selected.tagName.toLowerCase() + (selected.className && typeof selected.className === "string" ? "." + selected.className.trim().split(/\s+/).slice(0, 2).join(".") : "");
  }
  window.addEventListener("scroll", () => { if (selected) positionOutline(); }, { passive: true });
  window.addEventListener("resize", () => { if (selected) positionOutline(); });

  document.addEventListener("mousemove", (e) => {
    if (previewMode) return;
    const t = e.target;
    if (!t || t === document.body || t === document.documentElement || bar.contains(t) || inspector.contains(t) || t === hover || t === outline) { hover.style.display = "none"; return; }
    const r = t.getBoundingClientRect();
    hover.style.display = "block";
    hover.style.top = r.top + "px";
    hover.style.left = r.left + "px";
    hover.style.width = r.width + "px";
    hover.style.height = r.height + "px";
  }, { capture: true });

  document.addEventListener("click", (e) => {
    if (previewMode) return;
    if (bar.contains(e.target) || inspector.contains(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    let t = e.target;
    if (t === hover || t === outline) return;
    if (e.shiftKey && t.parentElement) t = t.parentElement;
    if (t.closest("#edToolbar") || t.closest("#edInspector")) return;
    select(t);
  }, { capture: true });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") deselect();
  });

  /* ---------- أدوات بناء الحقول ---------- */
  function group(title, open) {
    const det = document.createElement("details");
    det.className = "ed-group";
    if (open) det.open = true;
    det.innerHTML = "<summary>" + title + "</summary>";
    const body = document.createElement("div");
    body.className = "ed-body";
    det.appendChild(body);
    return { det, body };
  }

  function setProp(k, v) {
    snapshot();
    ovCur.props[k] = v;
    syncOvCss(ovCur);
    applyLive();
  }

  function initFromComputed(el, k, prop, num) {
    if (ovCur.props[k] != null) return ovCur.props[k];
    const v = getComputedStyle(el)[prop];
    if (num) { const m = parseFloat(v); return isNaN(m) ? "" : Math.round(m); }
    return v === "none" ? "" : v;
  }

  function rangeRow(label, val, min, max, step, onInput, suffix) {
    const w = document.createElement("div");
    w.className = "ed-row";
    w.innerHTML = "<label>" + label + "</label>";
    const r = document.createElement("div");
    r.className = "ed-range";
    const inp = document.createElement("input");
    inp.type = "range"; inp.min = min; inp.max = max; inp.step = step || 1; inp.value = val == null || val === "" ? min : val;
    const out = document.createElement("output");
    out.textContent = (val == null || val === "" ? "—" : val + (suffix || ""));
    inp.addEventListener("input", () => { out.textContent = inp.value + (suffix || ""); onInput(inp.value === String(min) && min === 0 ? "" : inp.value); });
    r.appendChild(inp); r.appendChild(out);
    w.appendChild(r);
    return w;
  }

  function colorRow(label, val, onChange) {
    const w = document.createElement("div");
    w.className = "ed-row";
    const c = document.createElement("div");
    c.className = "ed-color";
    const inp = document.createElement("input");
    inp.type = "color";
    const m = (val || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    inp.value = m ? "#" + [1, 2, 3].map((i) => (+m[i]).toString(16).padStart(2, "0")).join("") : (val && val[0] === "#" ? val : "#000000");
    const sp = document.createElement("span");
    sp.textContent = label;
    inp.addEventListener("input", () => onChange(inp.value));
    c.appendChild(inp); c.appendChild(sp);
    w.appendChild(c);
    return w;
  }

  function selectRow(label, options, val, onChange) {
    const w = document.createElement("div");
    w.className = "ed-row";
    w.innerHTML = "<label>" + label + "</label>";
    const sel = document.createElement("select");
    options.forEach((o) => {
      const op = document.createElement("option");
      op.value = o[0]; op.textContent = o[1];
      sel.appendChild(op);
    });
    sel.value = val || "";
    sel.addEventListener("change", () => onChange(sel.value));
    w.appendChild(sel);
    return w;
  }

  function textAreaRow(label, val, onChange, hint) {
    const w = document.createElement("div");
    w.className = "ed-row";
    w.innerHTML = "<label>" + label + "</label>" + (hint ? '<div class="ed-hint">' + hint + "</div>" : "");
    const ta = document.createElement("textarea");
    ta.value = val || "";
    ta.addEventListener("input", () => onChange(ta.value));
    w.appendChild(ta);
    return w;
  }

  /* ---------- لوحة الخصائص ---------- */
  function renderInspector() {
    const el = selected;
    inspector.classList.add("open");
    inspector.innerHTML = "";
    const head = document.createElement("div");
    head.className = "ed-head";
    head.innerHTML = "<strong>تعديل العنصر</strong>";
    const x = document.createElement("button");
    x.type = "button"; x.textContent = "✕"; x.setAttribute("aria-label", "إغلاق");
    x.addEventListener("click", deselect);
    head.appendChild(x);
    inspector.appendChild(head);

    /* النصوص */
    const elementKids = el.querySelectorAll("*");
    const ownTextNodes = Array.prototype.filter.call(el.childNodes, (n) => n.nodeType === 3 && n.textContent.trim());
    if (elementKids.length === 0 && ownTextNodes.length <= 1) {
      const g = group("النص", true);
      g.body.appendChild(textAreaRow("نص العنصر", ovCur.text != null ? ovCur.text : el.textContent, (v) => {
        snapshot();
        if (v === el.textContent) { delete ovCur.text; } else { ovCur.text = v; delete ovCur.textPath; }
        applyLive();
        applyDomOv(ovCur);
        document.getElementById("edResetElBtn").disabled = !(ovCur.css || ovCur.text != null || ovCur.img || ovCur.hidden);
      }, "للتعديل الدائم لكل نصوص الموقع استخدم تبويب «النصوص والمحتوى» في لوحة التحكم."));
      inspector.appendChild(g.det);
    } else if (ownTextNodes.length) {
      const g = group("النصوص", true);
      ownTextNodes.forEach((tn) => {
        const idx = Array.prototype.indexOf.call(el.childNodes, tn);
        const preview = tn.textContent.trim().slice(0, 26);
        g.body.appendChild(textAreaRow("الجزء «" + preview + "…»", tn.textContent, (v) => {
          snapshot();
          ovCur.text = v;
          ovCur.textPath = [idx];
          applyLive();
          applyDomOv(ovCur);
          document.getElementById("edResetElBtn").disabled = false;
        }, "ده جزء من العنصر بس — باقي الأجزاء الملونة ليها خانة لو حدها، أو عدّل العنصر الأب بـ Shift+كليك."));
      });
      inspector.appendChild(g.det);
    }

    /* الصورة */
    if (el.tagName === "IMG") {
      const g = group("الصورة", true);
      const w = document.createElement("div");
      w.className = "ed-row";
      w.innerHTML = "<label>اختار صورة</label>";
      const sel = document.createElement("select");
      sel.innerHTML = '<option value="">— زي ما هي —</option>' +
        KNOWN_IMAGES.map((im) => '<option value="assets/img/' + im + '">' + im + "</option>").join("") +
        '<option value="__custom">مسار مخصص…</option>';
      sel.addEventListener("change", () => {
        if (sel.value === "__custom") {
          const p = prompt("اكتب مسار الصورة (assets/img/...):");
          if (!p) { sel.value = ""; return; }
          setImg(p);
        } else if (sel.value) setImg(sel.value);
        else clearImg();
      });
      function setImg(src) {
        snapshot();
        ovCur.img = src;
        ovCur.alt = el.getAttribute("alt") || "";
        applyLive();
        applyDomOv(ovCur);
        document.getElementById("edResetElBtn").disabled = false;
      }
      function clearImg() { snapshot(); delete ovCur.img; restoreDom(selKey); applyLive(); }
      w.appendChild(sel);
      g.body.appendChild(w);
      g.body.appendChild(textAreaRow("الوصف البديل (alt)", ovCur.alt != null ? ovCur.alt : (el.getAttribute("alt") || ""), (v) => {
        snapshot(); ovCur.alt = v;
        el.setAttribute("alt", v);
        applyLive();
      }));
      g.body.appendChild(Object.assign(document.createElement("div"), { className: "ed-hint", textContent: "لرفع صور جديدة: تبويب «الصور» في لوحة التحكم." }));
      inspector.appendChild(g.det);
    }

    /* الألوان */
    const gc = group("الألوان والظلال");
    gc.body.appendChild(colorRow("لون النص", ovCur.props.color || computedFirst(el, "color"), (v) => { setProp("color", v); }));
    gc.body.appendChild(colorRow("لون الخلفية", ovCur.props.bg || computedFirst(el, "backgroundColor") || "#ffffff", (v) => { setProp("bg", v); }));
    const shSel = selectRow("الظل", Object.keys(SHADOWS).map((k) => [k, SHADOWS[k]]), ovCur.props.shadow || "", (v) => { setProp("shadow", v); });
    gc.body.appendChild(shSel);
    gc.body.appendChild(rangeRow("الشفافية", ovCur.props.opacity || (getComputedStyle(el).opacity !== "1" ? getComputedStyle(el).opacity : ""), 0.1, 1, 0.05, (v) => { setProp("opacity", v === "" ? "" : v); }));
    inspector.appendChild(gc.det);

    /* الزخرفة */
    const gp = group("الزخرفة والخلفية");
    const scope = SCOPES.find((s) => el.matches && el.matches(s.sel));
    if (scope) {
      gp.body.appendChild(Object.assign(document.createElement("div"), { className: "ed-hint", textContent: "العنصر ده من الأقسام الرئيسية — الزخرفة اللي بتختاره هنا بتتطبق على نفس القسم في كل الصفحات." }));
      gp.body.appendChild(selectRow(scope.label, PATTERNS.map((p) => [p.id, p.name]), draft.tokens[scope.tok] || "", (v) => {
        snapshot();
        if (v) draft.tokens[scope.tok] = v; else delete draft.tokens[scope.tok];
        applyTokenLive();
      }));
    }
    const patGrid = document.createElement("div");
    patGrid.className = "ed-patgrid";
    const dark = isDarkish(el);
    PATTERNS.forEach((p) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ed-pat" + ((ovCur.props.pat || "") === p.id ? " on" : "") + (dark ? " dark-sw" : "");
      b.innerHTML = '<span class="ed-sw" style="background-image:var(--pattern-' + p.id + (dark ? "-dark" : "") + ');background-size:34px"></span>' + p.name;
      b.addEventListener("click", () => {
        snapshot();
        if (p.id === "none") { ovCur.props.pat = ""; ovCur.props.patCleared = true; }
        else { ovCur.props.pat = p.id + (dark ? "-dark" : ""); ovCur.props.patCleared = false; }
        if (!ovCur.props.patSize) ovCur.props.patSize = 120;
        syncOvCss(ovCur);
        applyLive();
        renderInspector();
      });
      patGrid.appendChild(b);
    });
    gp.body.appendChild(Object.assign(document.createElement("div"), { className: "ed-hint", textContent: "أو زخرفة هذا العنصر لوحده:" }));
    gp.body.appendChild(patGrid);
    gp.body.appendChild(rangeRow("حجم الزخرفة", ovCur.props.patSize || 120, 40, 300, 10, (v) => { setProp("patSize", v); }, "px"));
    inspector.appendChild(gp.det);

    /* التخطيط */
    const gl = group("التباعد والتخطيط");
    const cs = getComputedStyle(el);
    gl.body.appendChild(rangeRow("تباعد داخلي فوق", ovCur.props.padT != null ? ovCur.props.padT : parseFloat(cs.paddingTop), 0, 120, 2, (v) => { setProp("padT", v); }, "px"));
    gl.body.appendChild(rangeRow("تباعد داخلي تحت", ovCur.props.padB != null ? ovCur.props.padB : parseFloat(cs.paddingBottom), 0, 120, 2, (v) => { setProp("padB", v); }, "px"));
    gl.body.appendChild(rangeRow("تباعد داخلي يمين", ovCur.props.padR != null ? ovCur.props.padR : parseFloat(cs.paddingRight), 0, 120, 2, (v) => { setProp("padR", v); }, "px"));
    gl.body.appendChild(rangeRow("تباعد داخلي شمال", ovCur.props.padL != null ? ovCur.props.padL : parseFloat(cs.paddingLeft), 0, 120, 2, (v) => { setProp("padL", v); }, "px"));
    gl.body.appendChild(rangeRow("مسافة خارجية فوق", ovCur.props.marT != null ? ovCur.props.marT : parseFloat(cs.marginTop), 0, 120, 2, (v) => { setProp("marT", v); }, "px"));
    gl.body.appendChild(rangeRow("مسافة خارجية تحت", ovCur.props.marB != null ? ovCur.props.marB : parseFloat(cs.marginBottom), 0, 120, 2, (v) => { setProp("marB", v); }, "px"));
    gl.body.appendChild(rangeRow("استدارة الحواف", ovCur.props.radius != null ? ovCur.props.radius : parseFloat(cs.borderTopLeftRadius), 0, 999, 2, (v) => { setProp("radius", v); }, "px"));
    gl.body.appendChild(rangeRow("سماكة الحدود", ovCur.props.bw != null ? ovCur.props.bw : (parseFloat(cs.borderTopWidth) || 0), 0, 10, 1, (v) => { setProp("bw", v); }, "px"));
    gl.body.appendChild(colorRow("لون الحدود", ovCur.props.bc || (cs.borderTopStyle !== "none" ? cs.borderTopColor : "#B59A62"), (v) => { setProp("bc", v); }));
    inspector.appendChild(gl.det);

    /* الخط */
    const gt = group("الخط والنص");
    gt.body.appendChild(rangeRow("حجم الخط", ovCur.props.fs != null ? ovCur.props.fs : parseFloat(getComputedStyle(el).fontSize), 9, 72, 1, (v) => { setProp("fs", v); }, "px"));
    gt.body.appendChild(selectRow("نوع الخط", Object.keys(FONTS).map((k) => [k, FONTS[k]]), ovCur.props.ff || "", (v) => { setProp("ff", v); }));
    gt.body.appendChild(selectRow("ثقل الخط", [["", "الحالي"], ["300", "خفيف"], ["400", "عادي"], ["500", "متوسط"], ["600", "نصف عريض"], ["700", "عريض"], ["800", "عريض جداً"]], ovCur.props.fw || "", (v) => { setProp("fw", v); }));
    gt.body.appendChild(rangeRow("ارتفاع السطر", ovCur.props.lh != null ? ovCur.props.lh : (parseFloat(getComputedStyle(el).lineHeight) / parseFloat(getComputedStyle(el).fontSize)).toFixed(2), 1, 2.6, 0.05, (v) => { setProp("lh", v); }));
    gt.body.appendChild(selectRow("المحاذاة", [["", "الحالي"], ["start", "البداية"], ["center", "الوسط"], ["end", "النهاية"]], ovCur.props.ta || "", (v) => { setProp("ta", v); }));
    gt.body.appendChild(rangeRow("تباعد الحروف", ovCur.props.ls != null ? ovCur.props.ls : 0, -2, 8, 0.5, (v) => { setProp("ls", v); }, "px"));
    inspector.appendChild(gt.det);

    /* إعدادات */
    const gx = group("إعدادات العنصر");
    const hideBtn = document.createElement("button");
    hideBtn.type = "button";
    hideBtn.className = "ed-btn ed-danger";
    hideBtn.style.width = "100%";
    hideBtn.textContent = ovCur.hidden ? "إظهار العنصر (مخفي حالياً)" : "إخفاء العنصر من الموقع";
    hideBtn.addEventListener("click", () => {
      snapshot();
      ovCur.hidden = !ovCur.hidden;
      applyLive();
      renderInspector();
    });
    gx.body.appendChild(hideBtn);
    const raw = textAreaRow("CSS مخصص (لكل حاجة مش موجودة فوق)", ovCur.raw || "", (v) => {
      snapshot();
      ovCur.raw = v;
      syncOvCss(ovCur);
      applyLive();
    }, "مثال: transform:rotate(-2deg); أو أي خاصية CSS — بتطبق على العنصر مباشرة.");
    gx.body.appendChild(raw);
    const selRow = document.createElement("div");
    selRow.className = "ed-row";
    selRow.innerHTML = '<label>عنوان العنصر (selector)</label><input type="text" readonly value="' + esc(selKey) + '" style="direction:ltr;text-align:left;font-family:monospace;font-size:11px">';
    gx.body.appendChild(selRow);
    inspector.appendChild(gx.det);
  }

  /* ---------- التوكنز (زخارف الأقسام العامة) ---------- */
  let tokenStyle = null;
  function applyTokenLive() {
    if (!tokenStyle) {
      tokenStyle = document.createElement("style");
      tokenStyle.id = "editor-token-style";
      document.head.appendChild(tokenStyle);
    }
    const t = draft.tokens || {};
    const map = [
      ["patHero", "--pat-hero", "-dark"],
      ["patDark", "--pat-dark", "-dark"],
      ["patOlive", "--pat-olive", "-dark"],
      ["patLight", "--pat-light", ""],
      ["patFooter", "--pat-footer", "-dark"]
    ];
    const roots = [];
    map.forEach((m) => { if (t[m[0]]) roots.push(m[1] + ":var(--pattern-" + t[m[0]] + m[2] + ")"); });
    if (t.fontScale && +t.fontScale !== 1) roots.push("--font-scale:" + t.fontScale);
    if (t.radius != null && +t.radius !== 18) { roots.push("--radius:" + (+t.radius) + "px"); roots.push("--radius-lg:" + (+t.radius + 8) + "px"); }
    if (t.maxw && +t.maxw !== 1260) roots.push("--maxw:" + (+t.maxw) + "px");
    tokenStyle.textContent = (roots.length ? ":root{" + roots.join(";") + "}" : "") + (t.motionHero === false ? "\n.hero-copy>*,.hero-visual{animation:none !important}" : "");
    scheduleSave();
  }
  applyTokenLive();

  /* ---------- أزرار الشريط ---------- */
  document.getElementById("edPreviewBtn").addEventListener("click", function () {
    previewMode = !previewMode;
    document.body.classList.toggle("ed-off", previewMode);
    this.textContent = previewMode ? "تعديل" : "معاينة";
    this.classList.toggle("primary", previewMode);
    hover.style.display = "none";
    if (previewMode) outline.style.display = "none";
    else if (selected) positionOutline(), outline.style.display = "block";
  });

  document.getElementById("edUndoBtn").addEventListener("click", () => {
    if (!undoStack.length) return;
    draft = JSON.parse(undoStack.pop());
    if (selKey) {
      ovCur = findOv(pageKey, selKey);
      restoreDom(selKey);
      (draft.overrides || []).filter((o) => o.page === pageKey && o.sel === selKey).forEach(applyDomOv);
      renderInspector();
    }
    applyLive();
    applyTokenLive();
  });

  document.getElementById("edResetElBtn").addEventListener("click", () => {
    if (!selKey) return;
    snapshot();
    draft.overrides = draft.overrides.filter((o) => !(o.page === pageKey && o.sel === selKey));
    restoreDom(selKey);
    ovCur = null;
    applyLive();
    const keep = selected;
    deselect();
    if (keep) select(keep);
  });

  document.getElementById("edResetAllBtn").addEventListener("click", () => {
    if (!confirm("ده هيرجع كل تعديلات التصميم (في كل الصفحات) للنسخة الأصلية. متأكد؟")) return;
    snapshot();
    draft = { version: 1, tokens: {}, overrides: [], customCSS: "" };
    originals.forEach((v, el) => {
      if (v.text != null) el.textContent = v.text;
      if (v.src != null) el.setAttribute("src", v.src);
      if (v.alt != null) el.setAttribute("alt", v.alt);
    });
    originals.clear();
    localStorage.removeItem(DRAFT_KEY);
    applyLive();
    applyTokenLive();
    deselect();
  });

  document.getElementById("edExitBtn").addEventListener("click", () => {
    localStorage.removeItem(FLAG);
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch (e) { /* تجاهل */ }
    try { if (window.opener && !window.opener.closed) window.opener.postMessage("attar-design-updated", "*"); } catch (e) { /* تجاهل */ }
    const url = new URL(location.href);
    url.searchParams.delete("edit");
    location.href = url.toString();
  });
})();
