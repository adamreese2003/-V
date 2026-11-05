/* ============================================================
   كتالوج المنتجات — عطارة تامر العطار
   أسماء المنتجات منقولة كما هي من قائمة العطارة بدون تغيير.
   لا توجد أسعار أو أوزان مسجلة بعد — بتظهر رسالة استفسار.
   ============================================================ */

const CATS = {
  coffee: { name: "القهوة والبن", short: "القهوة" },
  grains: { name: "الحبوب والبقوليات", short: "الحبوب والبقوليات" },
  ground: { name: "التوابل والبهارات المطحونة", short: "بهارات مطحونة" },
  whole:  { name: "التوابل والحبوب الكاملة", short: "حبوب كاملة" },
  herbs:  { name: "الأعشاب والشاي والنباتات المجففة", short: "أعشاب وشاي" },
  other:  { name: "منتجات أخرى", short: "منتجات أخرى" }
};

/* color = اللون الطبيعي التقريبي للمنتج، بيتستخدم في كروت العرض */
const PRODUCTS = [
  /* ---------- القهوة والبن ---------- */
  { id: "coffee-light",   name: "بن برازيلي فاتح", cat: "coffee", color: "#B07A45", roast: "light" },
  { id: "coffee-medium",  name: "بن برازيلي وسط",  cat: "coffee", color: "#8A5A33", roast: "medium" },
  { id: "coffee-dark",    name: "بن برازيلي غامق", cat: "coffee", color: "#53371F", roast: "dark" },

  /* ---------- الحبوب والبقوليات ---------- */
  { id: "fasolia-red",      name: "فاصوليا حمراء",   cat: "grains", color: "#9E3B33" },
  { id: "balilla",          name: "بليلة",           cat: "grains", color: "#C9A96A" },
  { id: "adas-bagla",       name: "عدس بجبة",        cat: "grains", color: "#6E6247" },
  { id: "fol-madshoush",    name: "فول مدشوش",       cat: "grains", color: "#8A6B4F" },
  { id: "oats",             name: "شوفان",           cat: "grains", color: "#D3BC93" },
  { id: "fashaar",          name: "فشار",            cat: "grains", color: "#EFE3C8" },
  { id: "freekeh-baladi",   name: "فريك بلدي أخضر",  cat: "grains", color: "#7F8A57" },
  { id: "hummus",           name: "حمص",             cat: "grains", color: "#DFC9A0" },
  { id: "basmati",          name: "رز بسمتي",        cat: "grains", color: "#EDE3CD" },
  { id: "burghul",          name: "برغل",            cat: "grains", color: "#C99F5B" },
  { id: "burghul-khashab",  name: "برغل خشب",        cat: "grains", color: "#A87E42" },
  { id: "shair-baladi",     name: "شعير بلدي",       cat: "grains", color: "#C4A76E" },

  /* ---------- التوابل والبهارات المطحونة ---------- */
  { id: "kommoun",          name: "كمون",             cat: "ground", color: "#B98A4E" },
  { id: "felfel-aswad",     name: "فلفل أسود",        cat: "ground", color: "#3E362E" },
  { id: "shatta",           name: "شطة",              cat: "ground", color: "#A8402C" },
  { id: "kozbra",           name: "كزبرة",            cat: "ground", color: "#A9A266" },
  { id: "kari",             name: "كاري",             cat: "ground", color: "#CB9433" },
  { id: "rosemary-ground",  name: "روز ماري مطحون",   cat: "ground", color: "#6E7D54" },
  { id: "galangal-ground",  name: "خولنجان مطحون",    cat: "ground", color: "#C9C0A8" },
  { id: "nutmeg-ground",    name: "جوزة الطيب مطحونة", cat: "ground", color: "#9C6B4A" },
  { id: "zaatar-ground",    name: "زعتر مطحون",       cat: "ground", color: "#6F7D5A" },
  { id: "cinnamon",         name: "قرفة",             cat: "ground", color: "#9E5B33" },
  { id: "ginger",           name: "جنزبيل",           cat: "ground", color: "#D2B08C" },
  { id: "paprika-smoked",   name: "بابريكا مدخنة",    cat: "ground", color: "#A44A2A" },
  { id: "paprika",          name: "بابريكا عادية",    cat: "ground", color: "#B4552F" },
  { id: "white-pepper",     name: "فلفل أبيض",        cat: "ground", color: "#E5DCC8" },
  { id: "fish-spice",       name: "بهارات سمك",       cat: "ground", color: "#B0784F" },
  { id: "kurkum",           name: "كركم",             cat: "ground", color: "#D9A62F" },
  { id: "thomaa-ground",    name: "ثماء مطحون",       cat: "ground", color: "#8C6F4A" },

  /* ---------- التوابل والحبوب الكاملة ---------- */
  { id: "brazil-pepper",    name: "فلفل برازيلي حب",  cat: "whole", color: "#4A3A30" },
  { id: "kommoun-baladi",   name: "كمون بلدي",        cat: "whole", color: "#A9834C" },
  { id: "kozbra-green",     name: "كزبرة خضرا بلدي",  cat: "whole", color: "#9AA060" },
  { id: "habhan-amriki",    name: "حبهان أمريكي",     cat: "whole", color: "#5C4033" },
  { id: "nutmeg",           name: "جوزة الطيب",       cat: "whole", color: "#8E5F3E" },
  { id: "mestika",          name: "مستكة",            cat: "whole", color: "#D9CBA0" },
  { id: "sesame-white",     name: "سمسم أبيض هندي",   cat: "whole", color: "#EFE6CE" },
  { id: "sesame-toasted",   name: "سمسم محمص",        cat: "whole", color: "#C9A15F" },
  { id: "habat-el-baraka",  name: "حبة بركة",         cat: "whole", color: "#35302B" },
  { id: "thomaa",           name: "ثماء حب",          cat: "whole", color: "#8C6F4A" },

  /* ---------- الأعشاب والشاي والنباتات المجففة ---------- */
  { id: "green-tea",        name: "شاي أخضر",        cat: "herbs", color: "#6E8B5E" },
  { id: "halba-baladi",     name: "حلبة بلدي",       cat: "herbs", color: "#B9A15C" },
  { id: "violet-flower",    name: "زهرة البنفسج",    cat: "herbs", color: "#7A5FA0" },
  { id: "ward-mohammadi",   name: "ورد محمدي",       cat: "herbs", color: "#B46274" },
  { id: "star-flower",      name: "زهرة النجمة",     cat: "herbs", color: "#8A79A5" },
  { id: "yansoon",          name: "ينسون",           cat: "herbs", color: "#D9C684" },
  { id: "shamar",           name: "شمر",             cat: "herbs", color: "#C9C289" },
  { id: "karawya",          name: "كراوية",          cat: "herbs", color: "#C2A96A" },
  { id: "laban-zakar",      name: "لبان ذكر",        cat: "herbs", color: "#D8C9A2" },
  { id: "laban-somali",     name: "لبان صومالي",     cat: "herbs", color: "#E3D6B2" },
  { id: "naanaa-baladi",    name: "نعناع بلدي",      cat: "herbs", color: "#5F8A5E" },
  { id: "guava-leaves",     name: "ورق جوافة",       cat: "herbs", color: "#6B8A5A" },
  { id: "laura-leaves",     name: "ورق لورا",        cat: "herbs", color: "#5C6E45" },
  { id: "lion-leg",         name: "رجل الأسد",       cat: "herbs", color: "#A08F6A" },
  { id: "salamaka-leaves",  name: "ورق سلامكة",      cat: "herbs", color: "#55693F" },

  /* ---------- منتجات أخرى ---------- */
  { id: "cookie-drops",     name: "كوكيز دروبس",            cat: "other", color: "#B98A5C" },
  { id: "coconut",          name: "جوز هند",                cat: "other", color: "#EFE9DC" },
  { id: "dried-lime",       name: "لمون مجفف",              cat: "other", color: "#D9B84E" },
  { id: "milk-powder",      name: "لبن نيوزلندي كامل الدسم", cat: "other", color: "#EFE6D2" },
  { id: "pasta",            name: "جميع المكرونات",         cat: "other", color: "#D9B05C" },
  { id: "wael-food",        name: "جميع بهارات Wael Food",  cat: "other", color: "#4E7A3A", brand: "Wael Food" },
  { id: "ghala",            name: "غلا",                    cat: "other", color: "#B59A62" }
];
