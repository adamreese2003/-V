/* ============================================================
   تصميم الموقع — الأنماط والزخارف والحركة والتعديلات البصرية
   الملف ده بيتحدث تلقائياً من لوحة التحكم والمحرر البصري
   ============================================================ */

const DESIGN = {
  version: 1,
  tokens: {
    /* الزخارف: none | star | octagon | zellige | diamond | hex | dots | diag | circles | najma */
    patHero: "octagon",
    patDark: "star",
    patOlive: "zellige",
    patLight: "star",
    patFooter: "none",
    fontScale: 1,
    radius: 18,
    maxw: 1260,
    motionHero: true
  },
  overrides: [
    /* تعديلات يدوية من المالك — إخفاء زر Wael Food في الرئيسية */
    { page: "home", sel: "#waelBtn", props: {}, raw: "", hidden: true }
  ],
  customCSS: ""
};
