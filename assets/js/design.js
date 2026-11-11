/* تصميم الموقع — الأنماط والزخارف والحركة والتعديلات البصرية
   الملف ده بيتحدث تلقائياً من لوحة التحكم والمحرر البصري
   التعديلات دي منقول من مسودة المالك اللي عملها بالمحرر البصري */

const DESIGN = {
  "version": 1,
  "tokens": {
    "patHero": "octagon",
    "patDark": "star",
    "patOlive": "zellige",
    "patLight": "star",
    "patFooter": "none",
    "fontScale": 1,
    "radius": 18,
    "maxw": 1260,
    "motionHero": true
  },
  "overrides": [
    {
      "page": "home",
      "sel": "#coffeeKicker",
      "css": "font-size:72px;line-height:2.6;;",
      "text": "شقير العطار"
    },
    {
      "page": "home",
      "sel": "main section:nth-of-type(2) > div:nth-of-type(1)",
      "css": "font-size:29px;font-family:var(--font-head);;"
    },
    {
      "page": "home",
      "sel": "main section:nth-of-type(1) > div:nth-of-type(1)",
      "css": "background-image:none;"
    },
    {
      "page": "home",
      "sel": "main #heroPoints > li:nth-of-type(1)",
      "text": "جميع انواع البن ",
      "textPath": [
        1
      ]
    },
    {
      "page": "home",
      "sel": "main #heroPoints > li:nth-of-type(3)",
      "text": " اطلب على واتساب او استلم من العطارة",
      "textPath": [
        1
      ]
    },
    {
      "page": "products",
      "sel": "#resultCount",
      "text": "اشهر منتجات العطار",
      "textPath": [
        0
      ]
    },
    {
      "page": "products",
      "sel": "main #resultCount > b:nth-of-type(1)",
      "text": ""
    },
    {
      "page": "products",
      "sel": "#prodHeroTitle",
      "text": "المنتجات عندنا مبتخلصش جبنالكو الاكثر طلبا"
    },
    {
      "page": "coffee",
      "sel": "#roastTitle",
      "text": "الاكثر مبيعا"
    },
    {
      "page": "home",
      "sel": "#waelBtn",
      "hidden": true
    }
  ],
  "customCSS": ""
};
