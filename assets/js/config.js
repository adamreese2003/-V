/* ============================================================
   إعدادات الموقع — عطارة شقير العطار
   identity + contact + order messages
   بيتعدل من لوحة التحكم admin.html
   ============================================================ */

const SITE = {
  name: "شقير العطار",
  nameLatin: "Shaqir El Attar",
  tagline: "عطارة مصرية أصيلة في الرحاب",

  /* رقم واتساب بصيغة دولية بدون + أو أصفار */
  whatsapp: "201095752548",

  phones: [
    { label: "01095752548", tel: "+201095752548" },
    { label: "0226939339", tel: "+20226939339" },
    { label: "01111555862", tel: "+201111555862" }
  ],

  addressAr: "القاهرة الجديدة - الرحاب - سوق الرحاب التجاري القديم أمام كافيه ليالي المعز - محل 23",
  addressShort: "محل 23، سوق الرحاب التجاري القديم، أمام كافيه ليالي المعز",
  addressEn: "Shop 23, Old Rehab Commercial Market, Layali El Moez Cafe, Rehab, New Cairo, Cairo, Egypt",

  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Shop+23%2C+Old+Rehab+Commercial+Market%2C+Layali+El+Moez+Cafe%2C+Rehab%2C+New+Cairo%2C+Egypt",
  mapsEmbed: "https://www.google.com/maps?q=Old+Rehab+Commercial+Market+Layali+El+Moez+Cafe+Rehab+New+Cairo+Egypt&output=embed&hl=ar",

  msgs: {
    product: "السلام عليكم، كنت عايز أستفسر عن المنتج ده:\n\nاسم المنتج: {name}\n\nالكمية: {qty}\n\nممكن أعرف السعر والأوزان المتاحة؟",
    general: "السلام عليكم، حابب أستفسر عن منتجات العطارة والأسعار المتاحة."
  },

  /* ألوان الموقع — بتتحمل من theme.css أوتوماتيك مع كل تعديل */
  theme: {
    olive: "#344532",
    espresso: "#2D2119",
    ivory: "#F7F1E6",
    sand: "#D9C6A5",
    brass: "#B59A62",
    terra: "#A76545"
  }
};
