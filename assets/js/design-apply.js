/* ============================================================
   design-apply.js — بيطبّق ملف التصميم (DESIGN) على الصفحة
   بيشغّل: توكنز الزخارف والخطوط + تعديلات العناصر + CSS مخصص
   بيقرأ المسودة المحلية أولاً (معاينة قبل النشر) لو موجودة
   ============================================================ */

(function () {
  "use strict";

  let draft = null;
  try { draft = JSON.parse(localStorage.getItem("attar_design_draft") || "null"); } catch (e) { /* تجاهل */ }
  const d = (draft && draft.version) ? draft : (typeof DESIGN !== "undefined" ? DESIGN : null);
  if (!d) return;

  const css = [];
  const rootVars = [];
  const t = d.tokens || {};

  if (t.patHero) rootVars.push("--pat-hero:var(--pattern-" + t.patHero + "-dark)");
  if (t.patDark) rootVars.push("--pat-dark:var(--pattern-" + t.patDark + "-dark)");
  if (t.patOlive) rootVars.push("--pat-olive:var(--pattern-" + t.patOlive + "-dark)");
  if (t.patLight) rootVars.push("--pat-light:var(--pattern-" + t.patLight + ")");
  if (t.patFooter) rootVars.push("--pat-footer:var(--pattern-" + t.patFooter + "-dark)");
  if (t.fontScale && +t.fontScale !== 1) rootVars.push("--font-scale:" + t.fontScale);
  if (t.radius != null && +t.radius !== 18) {
    rootVars.push("--radius:" + (+t.radius) + "px");
    rootVars.push("--radius-lg:" + (+t.radius + 8) + "px");
  }
  if (t.maxw && +t.maxw !== 1260) rootVars.push("--maxw:" + (+t.maxw) + "px");
  if (rootVars.length) css.push(":root{" + rootVars.join(";") + "}");
  if (t.motionHero === false) css.push(".hero-copy>*,.hero-visual{animation:none !important}");
  if (d.customCSS) css.push(d.customCSS);

  (d.overrides || []).forEach(function (o) {
    if (!o || !o.sel) return;
    const scoped = (o.page && o.page !== "*") ? 'body[data-page="' + o.page + '"] ' : "";
    if (o.css) css.push(scoped + o.sel + "{" + o.css + "}");
    if (o.hidden) css.push(scoped + o.sel + "{display:none !important}");
  });

  const st = document.createElement("style");
  st.id = "design-apply-style";
  st.textContent = css.join("\n");
  document.head.appendChild(st);

  /* تعديلات النصوص والصور — بعد ما السكربتات بتملأ المحتوى */
  function applyDomOverrides() {
    (d.overrides || []).forEach(function (o) {
      if (!o || !o.sel) return;
      if (o.text == null && !o.img) return;
      const scopeSel = (o.page && o.page !== "*") ? 'body[data-page="' + o.page + '"]' : "body";
      const scope = document.querySelector(scopeSel);
      if (!scope) return;
      let els = [];
      try { els = scope.querySelectorAll(o.sel); } catch (e) { return; }
      Array.prototype.forEach.call(els, function (el) {
        if (o.text != null) el.textContent = o.text;
        if (o.img) {
          el.setAttribute("src", o.img);
          if (o.alt != null) el.setAttribute("alt", o.alt);
        }
      });
    });
  }

  if (document.readyState === "complete") {
    applyDomOverrides();
  } else {
    window.addEventListener("load", applyDomOverrides);
  }
})();
