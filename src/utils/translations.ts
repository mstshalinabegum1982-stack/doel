export interface TranslationDictionary {
  [key: string]: {
    [lang: string]: string;
  };
}

export const COUNTRY_TO_LANG: { [country: string]: string } = {
  "Algeria": "ar",
  "Angola": "pt",
  "Argentina": "es",
  "Azerbaijan": "ru",
  "Bahrain": "ar",
  "Bangladesh": "bn",
  "Bolivia": "es",
  "Brazil": "pt",
  "Bulgaria": "bg",
  "Cambodia": "km",
  "Chile": "es",
  "Colombia": "es",
  "Costa Rica": "es",
  "Croatia": "hr",
  "Cyprus": "el",
  "Czech Republic": "cs",
  "Dominican Republic": "es",
  "Ecuador": "es",
  "Egypt": "ar",
  "Estonia": "en",
  "Ethiopia": "en",
  "Ghana": "en",
  "Greece": "el",
  "Guatemala": "es",
  "Hungary": "hu",
  "India": "hi",
  "Indonesia": "id",
  "Iraq": "ar",
  "Ivory Coast": "fr",
  "Jordan": "ar",
  "Kazakhstan": "ru",
  "Kenya": "en",
  "Kuwait": "ar",
  "Kyrgyzstan": "ru",
  "Laos": "en",
  "Latvia": "en",
  "Lebanon": "ar",
  "Lithuania": "en",
  "Malaysia": "ms",
  "Maldives": "en",
  "Mexico": "es",
  "Morocco": "ar",
  "Myanmar": "my",
  "Nepal": "ne",
  "Nigeria": "en",
  "Oman": "ar",
  "Pakistan": "ur",
  "Peru": "es",
  "Philippines": "tl",
  "Poland": "pl",
  "Qatar": "ar",
  "Romania": "ro",
  "Russia": "ru",
  "Saudi Arabia": "ar",
  "Senegal": "fr",
  "Serbia": "sr",
  "Slovakia": "sk",
  "South Africa": "en",
  "Sri Lanka": "si",
  "Tanzania": "en",
  "Thailand": "th",
  "Tunisia": "ar",
  "Turkey": "tr",
  "Uganda": "en",
  "Ukraine": "uk",
  "United Arab Emirates (UAE)": "ar",
  "Uzbekistan": "ru",
  "Vietnam": "vi",
  "Zambia": "en",
  "Zimbabwe": "en"
};

export const TRANSLATIONS: TranslationDictionary = {
  add_to_cart: {
    bn: "এড কার্ট",
    en: "Add to Cart",
    ar: "أضف إلى السلة",
    es: "Añadir al Carrito",
    pt: "Adicionar ao Carrinho",
    fr: "Ajouter au panier",
    tr: "Sepete Ekle",
    ru: "Добавить в корзину",
    id: "Tambah ke Keranjang",
    ms: "Tambah ke Troly",
    vi: "Thêm vào giỏ hàng",
    th: "หยิบใส่ตะกร้า",
    hi: "कार्ट में जोड़ें",
    ur: "کارٹ میں شامل کریں",
    my: "လှည်းထဲသို့ထည့်ရန်",
    km: "បន្ថែមទៅកន្ត្រក",
    ne: "कार्टमा थप्नुहोस्",
    si: "කරත්තයට එක් කරන්න",
    uk: "Додати в кошик"
  },
  order_now: {
    bn: "অর্ডার করুন",
    en: "Order Now",
    ar: "اطلب الآن",
    es: "Ordenar Ahora",
    pt: "Pedir Agora",
    fr: "Commander maintenant",
    tr: "Şimdi Sipariş Ver",
    ru: "Заказать сейчас",
    id: "Pesan Sekarang",
    ms: "Pesan Sekarang",
    vi: "Đặt hàng ngay",
    th: "สั่งซื้อทันที",
    hi: "अभी ऑर्डर करें",
    ur: "ابھی آرڈر کریں",
    my: "အခုပဲမှာယူပါ",
    km: "បញ្ជាទិញឥឡូវនេះ",
    ne: "अहिले अर्डर गर्नुहोस्",
    si: "දැන් ඇණවුම් කරන්න",
    uk: "Замовити зараз"
  },
  search_placeholder: {
    bn: "সার্চ করুন...",
    en: "Search...",
    ar: "بحث...",
    es: "Buscar...",
    pt: "Buscar...",
    fr: "Rechercher...",
    tr: "Ara...",
    ru: "Поиск...",
    id: "Cari...",
    ms: "Cari...",
    vi: "Tìm kiếm...",
    th: "ค้นหา...",
    hi: "खोजें...",
    ur: "تلاش کریں...",
    my: "ရှာဖွေရန်...",
    km: "ស្វែងរក...",
    ne: "खोज्नुहोस्...",
    si: "සොයන්න...",
    uk: "Пошук..."
  },
  support1Title: {
    bn: "হেল্প ও সাপোর্ট সেন্টার",
    en: "Help & Support Center"
  },
  support1Content: {
    bn: "আমাদের ২৪/৭ কাস্টমার সাপোর্ট টিম আপনার সেবায় নিয়োজিত। যেকোনো প্রশ্ন বা অভিযোগের জন্য আমাদের হটলাইন নম্বরে অথবা সরাসরি চ্যাটে যোগাযোগ করুন।",
    en: "Our 24/7 customer support team is at your service. For any questions or complaints, contact our hotline number or chat with us directly."
  },
  support2Title: {
    bn: "রিটার্ন ও রিফান্ড পলিসি",
    en: "Return & Refund Policy"
  },
  support2Content: {
    bn: "পণ্য হাতে পাওয়ার পর কোনো ত্রুটি দেখা দিলে আমাদের দ্রুত জানান। ৭ দিনের মধ্যে পণ্য ফেরত বা পরিবর্তনের সুবিধা রয়েছে। রিফান্ড সংক্রান্ত সম্পূর্ণ গাইডলাইন এখানে পাবেন।",
    en: "If any defect is found after receiving the product, let us know quickly. There is a 7-day return or replacement facility. You will find the complete refund guidelines here."
  },
  support3Title: {
    bn: "অর্ডার ট্র্যাকিং গাইড",
    en: "Order Tracking Guide"
  },
  support3Content: {
    bn: "আপনার অর্ডারের বর্তমান স্ট্যাটাস জানতে আমাদের ট্র্যাকিং পেজ ভিজিট করুন এবং আপনার অর্ডার আইডি ব্যবহার করুন। ডেলিভারি সংক্রান্ত যেকোনো জিজ্ঞাসা এই পেজে পাবেন।",
    en: "To know the current status of your order, please visit our tracking page and use your order ID. Any delivery related queries can be found on this page."
  },
  help1Title: {
    bn: "ব্যবহারের শর্তাবলী",
    en: "Terms of Service"
  },
  help1Content: {
    bn: "আমাদের প্ল্যাটফর্ম বা ওয়েবসাইট ব্যবহার করে পণ্য অর্ডার করার পূর্বে দয়া করে আমাদের সাধারণ ব্যবহারের নিয়ম ও শর্তাবলী ভালোভাবে পড়ে নিন।",
    en: "Please read our general terms and conditions of use carefully before ordering products using our platform or website."
  },
  help2Title: {
    bn: "গোপনীয়তা নীতি",
    en: "Privacy Policy"
  },
  help2Content: {
    bn: "আমরা আপনার গোপনীয়তাকে সর্বোচ্চ মূল্যায়ন করি। আপনার ব্যক্তিগত তথ্য এবং যোগাযোগের তথ্য সম্পূর্ণ নিরাপদ এবং এনক্রিপ্ট রাখা হয়।",
    en: "We value your privacy highly. Your personal information and contact information are kept completely secure and encrypted."
  },
  help3Title: {
    bn: "অর্ডার সুরক্ষা নীতি",
    en: "Orders Protection"
  },
  help3Content: {
    bn: "গ্রাহকদের শতভাগ নিরবচ্ছিন্ন কেনাকাটার নিশ্চয়তা দিতে আমাদের কাছে রয়েছে ডবল-সিকিউরড ক্যাশ অন ডেলিভারি এবং গুণগত মানের শতভাগ জেনুইন ওয়্যারেন্টি।",
    en: "To ensure a 100% seamless shopping experience for our customers, we have double-secured Cash on Delivery and a 100% genuine quality warranty."
  },
  order_form_heading: {
    bn: "অর্ডার কনফার্ম করতে নিচে আপনার সঠিক তথ্য দিন",
    en: "Please provide correct information below to confirm order",
    ar: "يرجى تقديم المعلومات الصحيحة أدناه لتأكيد الطلب",
    es: "Por favor proporcione la información correcta a continuación para confirmar el pedido",
    pt: "Por favor forneça as informações corretas abaixo para confirmar o pedido",
    fr: "Veuillez fournir les informations correctes ci-dessous pour confirmer la commande",
    tr: "Siparişi onaylamak için lütfen aşağıdaki bilgileri doğru şekilde doldurun",
    ru: "Пожалуйста, предоставьте правильную информацию ниже для подтверждения заказа",
    id: "Silakan berikan informasi yang benar di bawah ini untuk mengonfirmasi pesanan",
    ms: "Sila berikan maklumat yang betul di bawah untuk mengesahkan pesanan",
    vi: "Vui lòng cung cấp thông tin chính xác bên dưới để xác nhận đơn hàng",
    th: "กรุณากรอกข้อมูลที่ถูกต้องด้านล่างเพื่อยืนยันการสั่งซื้อ",
    hi: "ऑर्डर की पुष्टि करने के लिए कृपया नीचे सही जानकारी दें",
    ur: "آرڈر کی تصدیق کے لیے براہ کرم نیچے درست معلومات فراہم کریں",
    my: "အော်ဒါအတည်ပြုရန် အောက်တွင် အချက်အလက်မှန်ကန်စွာ ဖြည့်စွက်ပါ",
    km: "សូមផ្តល់ព័ត៌មានត្រឹមត្រូវខាងក្រោមដើម្បីបញ្ជាក់ការបញ្ជាទិញ",
    ne: "कृपया अर्डर पुष्टि गर्न तल सही जानकारी दिनुहोस्",
    si: "ඇණවුම තහවුරු කිරීමට කරුණාකර පහතින් නිවැරදි තොරතුරු සපයන්න",
    uk: "Будь ласка, надайте правильну інформацію нижче для підтвердження замовлення"
  },
  place_order_btn: {
    bn: "অর্ডার কনফার্ম করুন",
    en: "Confirm Order",
    ar: "تأكيد الطلب",
    es: "Confirmar Pedido",
    pt: "Confirmar Pedido",
    fr: "Confirmer la commande",
    tr: "Siparişi Onayla",
    ru: "Подтвердить заказ",
    id: "Konfirmasi Pesanan",
    ms: "Sahkan Pesanan",
    vi: "Xác nhận đơn hàng",
    th: "ยืนยันการสั่งซื้อ",
    hi: "ऑर्डर की पुष्टि करें",
    ur: "آرڈر کی تصدیق کریں",
    my: "အော်ဒါအတည်ပြုပါ",
    km: "បញ្ជាក់ការបញ្ជាទិញ",
    ne: "अर्डर पुष्टि गर्नुहोस्",
    si: "ඇණවුම තහවුරු කරන්න",
    uk: "Підтвердити замовлення"
  },
  delivery_charge: {
    bn: "ডেলিভারি চার্জ",
    en: "Delivery Charge",
    ar: "رسوم التوصيل",
    es: "Costo de Envío",
    pt: "Taxa de Entrega",
    fr: "Frais de livraison",
    tr: "Teslimat Ücreti",
    ru: "Стоимость доставки",
    id: "Biaya Pengiriman",
    ms: "Caj Penghantaran",
    vi: "Phí vận chuyển",
    th: "ค่าจัดส่ง",
    hi: "डिलिवरी शुल्क",
    ur: "ڈلیوری چارجز",
    my: "ပို့ဆောင်ခ",
    km: "ថ្លៃសេវាដឹកជញ្ជូន",
    ne: "डिलिवरी शुल्क",
    si: "බෙදා හැරීමේ ගාස්තුව",
    uk: "Вартість доставки"
  },
  subtotal: {
    bn: "সাব টোটাল",
    en: "Subtotal",
    ar: "المجموع الفرعي",
    es: "Subtotal",
    pt: "Subtotal",
    fr: "Sous-total",
    tr: "Ara Toplam",
    ru: "Промежуточный итог",
    id: "Subtotal",
    ms: "Jumlah Kecil",
    vi: "Tạm tính",
    th: "ยอดรวมย่อย",
    hi: "उप-योग",
    ur: "ذیلی رقم",
    my: "စုစုပေါင်းအစ",
    km: "សរុបរង",
    ne: "उप-योग",
    si: "උප එකතුව",
    uk: "Проміжний підсумок"
  },
  total: {
    bn: "মোট খরচ",
    en: "Total Amount",
    ar: "المبلغ الإجمالي",
    es: "Total a Pagar",
    pt: "Total",
    fr: "Montant total",
    tr: "Toplam Tutar",
    ru: "Итоговая сумма",
    id: "Total Pembayaran",
    ms: "Jumlah Keseluruhan",
    vi: "Tổng cộng",
    th: "ยอดรวมทั้งหมด",
    hi: "कुल योग",
    ur: "کل رقم",
    my: "စုစုပေါင်း",
    km: "សរុប",
    ne: "कुल योग",
    si: "මුළු එකතුව",
    uk: "Загальна сума"
  },
  cod_text: {
    bn: "পণ্য হাতে পেয়ে টাকা পরিশোধ করুন (Cash on Delivery)",
    en: "Pay on delivery (Cash on Delivery)",
    ar: "الدفع عند الاستلام (كاش)",
    es: "Pago contra entrega (Efectivo)",
    pt: "Pague na entrega (Dinheiro)",
    fr: "Paiement à la livraison (En espèces)",
    tr: "Kapıda Ödeme (Nakit)",
    ru: "Оплата при получении (Наложенный платеж)",
    id: "Bayar di Tempat (COD)",
    ms: "Bayar Tunai Semasa Serahan (COD)",
    vi: "Thanh toán khi nhận hàng (COD)",
    th: "เก็บเงินปลายทาง (COD)",
    hi: "डिलिवरी पर नकद (COD)",
    ur: "ڈلیوری پر نقد ادائیگی (COD)",
    my: "ပစ္စည်းရောက်မှငွေချေစနစ် (COD)",
    km: "ទូទាត់ប្រាក់ពេលទំនិញដល់ដៃ (COD)",
    ne: "डिलिवरीमा नगद भुक्तानी (COD)",
    si: "භාණ්ඩ ලැබුණු පසු මුදල් ගෙවීම (COD)",
    uk: "Оплата при отриманні (COD)"
  },
  order_success_title: {
    bn: "অর্ডারটি সফল হয়েছে!",
    en: "Order Placed Successfully!",
    ar: "تم تقديم الطلب بنجاح!",
    es: "¡Pedido realizado con éxito!",
    pt: "Pedido realizado com sucesso!",
    fr: "Commande passée avec succès !",
    tr: "Sipariş Başarıyla Alındı!",
    ru: "Заказ успешно оформлен!",
    id: "Pesanan Berhasil Dibuat!",
    ms: "Pesanan Berjaya Dihantar!",
    vi: "Đặt hàng thành công!",
    th: "ทำการสั่งซื้อสำเร็จแล้ว!",
    hi: "ऑर्डर सफलतापूर्वक दर्ज हो गया है!",
    ur: "آرڈر کامیابی سے جمع ہو گیا!",
    my: "အော်ဒါတင်ခြင်း အောင်မြင်ပါသည်",
    km: "ការបញ្ជាទិញបានជោគជ័យ",
    ne: "अर्डर सफलतापूर्वक प्राप्त भयो",
    si: "ඇණවුම සාර්ථකව සිදු කරන ලදී",
    uk: "Замовлення успішно оформлено"
  },
  order_success_desc: {
    bn: "আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে। দ্রুত আমাদের প্রতিনিধি আপনার সাথে যোগাযোগ করবেন।",
    en: "Your order has been received successfully. Our representative will contact you shortly.",
    ar: "لقد تم استلام طلبك بنجاح. سيتصل بك ممثلنا قريبًا.",
    es: "Su pedido ha sido recibido con éxito. Nuestro representante se pondrá en contacto con usted en breve.",
    pt: "Seu pedido foi recebido com sucesso. Nosso representante entrará em contato em breve.",
    fr: "Votre commande a bien été reçue. Notre représentant vous contactera sous peu.",
    tr: "Siparişiniz başarıyla alındı. Temsilcimiz kısa süre içinde sizinle iletişime geçecektir.",
    ru: "Ваш заказ успешно получен. Наш представитель свяжется с вами в ближайшее время.",
    id: "Pesanan Anda telah berhasil diterima. Perwakilan kami akan segera menghubungi Anda.",
    ms: "Pesanan anda telah berjaya diterima. Wakil kami akan menghubungi anda sebentar lagi.",
    vi: "Đơn hàng của bạn đã được nhận thành công. Đại diện của chúng tôi sẽ liên hệ với bạn sớm.",
    th: "ได้รับคำสั่งซื้อของคุณเรียบร้อยแล้ว เจ้าหน้าที่ของเราจะติดต่อกลับโดยเร็วที่สุด",
    hi: "आपका ऑर्डर सफलतापूर्वक प्राप्त हो गया है। हमारे प्रतिनिधि शीघ्र ही आपसे संपर्क करेंगे।",
    ur: "آپ کا آرڈر کامیابی سے موصول ہو گیا ہے۔ ہمارا نمائندہ جلد ही آپ سے رابطہ کرے گا۔",
    my: "သင်၏အော်ဒါကို အောင်မြင်စွာ လက်ခံရရှိပါသည်။ ကျွန်ုပ်တို့၏ ကိုယ်စားလှယ်သည် မကြာမီ ဆက်သွယ်ပေးပါမည်။",
    km: "ការបញ្ជាទិញរបស់អ្នកត្រូវបានទទួលដោយជោគជ័យ។ ភ្នាក់ងាររបស់យើងនឹងទាក់ទងទៅអ្នកក្នុងពេលឆាប់ៗនេះ។",
    ne: "तपाईंको अर्डर सफलतापूर्वक प्राप्त भएको छ। हाम्रो प्रतिनिधिले छिट्टै तपाईंलाई सम्पर्क गर्नुहुनेछ।",
    si: "ඔබගේ ඇණවුම සාර්ථකව ලැබී ඇත. අපගේ නියෝජිතයෙකු ඉතා කෙටි කලකින් ඔබව සම්බන්ධ කර ගනු ඇත.",
    uk: "Ваше замовлення успішно отримано. Наш представник зв'яжеться з вами найближчим часом."
  },
  order_id: {
    bn: "অর্ডার নম্বর",
    en: "Order ID",
    ar: "رقم الطلب",
    es: "ID del Pedido",
    pt: "ID do Pedido",
    fr: "ID de commande",
    tr: "Sipariş Numarası",
    ru: "ID заказа",
    id: "ID Pesanan",
    ms: "ID Pesanan",
    vi: "Mã đơn hàng",
    th: "รหัสการสั่งซื้อ",
    hi: "ऑर्डर आईडी",
    ur: "آرڈر آئی ڈی",
    my: "အော်ဒါနံပါတ်",
    km: "លេខកូដបញ្ជាទិញ",
    ne: "अर्डर आईडी",
    si: "ඇණවුම් අංකය",
    uk: "ID замовлення"
  },
  close_btn: {
    bn: "ঠিক আছে (Close)",
    en: "Close",
    ar: "إغلاق",
    es: "Cerrar",
    pt: "Fechar",
    fr: "Fermer",
    tr: "Kapat",
    ru: "Закрыть",
    id: "Tutup",
    ms: "Tutup",
    vi: "Đóng",
    th: "ปิด",
    hi: "बंद करें",
    ur: "بند کریں",
    my: "ပိတ်ရန်",
    km: "បិទ",
    ne: "बन्द गर्नुहोस्",
    si: "වසා දමන්න",
    uk: "Закрити"
  },
  warranty: {
    bn: "সার্ভিস ওয়ারেন্টি",
    en: "Service Warranty",
    ar: "ضمان الخدمة",
    es: "Garantía de Servicio",
    pt: "Garantia de Serviço",
    fr: "Garantie de service",
    tr: "Servis Garantisi",
    ru: "Сервисная гарантия",
    id: "Garansi Layanan",
    ms: "Waranti Servis",
    vi: "Bảo hành dịch vụ",
    th: "การรับประกันบริการ",
    hi: "सेवा वारंटी",
    ur: "سروس वारनटी",
    my: "ဝန်ဆောင်မှုအာမခံ",
    km: "ការធានាសេវាកម្ម",
    ne: "सेवा वारेन्टी",
    si: "සේවා වගකීම",
    uk: "Сервісна гарантія"
  },
  guarantee: {
    bn: "রিপ্লেসমেন্ট গ্যারান্টি",
    en: "Replacement Guarantee",
    ar: "ضمان الاستبدال",
    es: "Garantía de Reemplazo",
    pt: "Garantia de Substituição",
    fr: "Garantie de remplacement",
    tr: "Değişim Garantisi",
    ru: "Гарантия замены",
    id: "Garansi Penggantian",
    ms: "Jaminan Penggantian",
    vi: "Cam kết đổi trả",
    th: "การรับประกันเปลี่ยนสินค้า",
    hi: "रिप्लेसमेंट गारंटी",
    ur: "تبدیلی کی گارنٹی",
    my: "အစားထိုးအာမခံ",
    km: "ការធានាប្តូរទំនិញ",
    ne: "प्रतिस्थापन ग्यारेन्टी",
    si: "භාණ්ඩ මාරු කිරීමේ වගකීම",
    uk: "Гарантія заміни"
  },
  offer_price: {
    bn: "অফার প্রাইস",
    en: "Offer Price",
    ar: "سعر العرض",
    es: "Precio de Oferta",
    pt: "Preço de Oferta",
    fr: "Prix de l'offre",
    tr: "Fırsat Fiyatı",
    ru: "Цена со скидкой",
    id: "Harga Promo",
    ms: "Harga Tawaran",
    vi: "Giá ưu đãi",
    th: "ราคาพิเศษ",
    hi: "ऑफर मूल्य",
    ur: "رعایتی قیمت",
    my: "အထူးဈေးနှုန်း",
    km: "តម្លៃពិសេស",
    ne: "विशेष अर्डर मूल्य",
    si: "විශේෂ මිල",
    uk: "Ціна пропозиції"
  },
  discount_tag: {
    bn: "অফার",
    en: "OFF",
    ar: "خصم",
    es: "DESCUENTO",
    pt: "DESCONTO",
    fr: "RÉDUCTION",
    tr: "İNDİRİM",
    ru: "СКИДКА",
    id: "DISKON",
    ms: "DISKON",
    vi: "GIẢM GIÁ",
    th: "ส่วนลด",
    hi: "छूट",
    ur: "رعایت",
    my: "လျှော့စျေး",
    km: "បញ្ចុះតម្លៃ",
    ne: "छूट",
    si: "මිල අඩු කිරීම",
    uk: "ЗНИЖКА"
  },
  call_btn: {
    bn: "সরাসরি কল করুন",
    en: "Call Now",
    ar: "اتصل الآن",
    es: "Llamar Ahora",
    pt: "Ligar Agora",
    fr: "Appeler maintenant",
    tr: "Şimdi Ara",
    ru: "Позвонить сейчас",
    id: "Hubungi Sekarang",
    ms: "Hubungi Sekarang",
    vi: "Gọi ngay",
    th: "โทรเลย",
    hi: "अभी कॉल करें",
    ur: "ابھی کال کریں",
    my: "ဖုန်းခေါ်ဆိုပါ",
    km: "ហៅទូរស័ព្ទឥឡូវនេះ",
    ne: "अहिले कल गर्नुहोस्",
    si: "දැන් අමතන්න",
    uk: "Зателефонувати"
  },
  whatsapp_btn: {
    bn: "হোয়াটসঅ্যাপ চ্যাট",
    en: "WhatsApp Chat",
    ar: "دردشة واتساب",
    es: "Chat de WhatsApp",
    pt: "Chat do WhatsApp",
    fr: "Chat WhatsApp",
    tr: "WhatsApp Sohbet",
    ru: "Чат в WhatsApp",
    id: "Chat WhatsApp",
    ms: "Sembang WhatsApp",
    vi: "Trò chuyện WhatsApp",
    th: "แชท WhatsApp",
    hi: "व्हाट्सएप चैट",
    ur: "واٹس ایپ چیٹ",
    my: "ဝက်စ်အက်ပ်မှဆက်သွယ်ပါ",
    km: "ជជែកតាម WhatsApp",
    ne: "व्हाट्सएप च्याट",
    si: "වට්ස්ඇප් හරහා සම්බන්ධ වන්න",
    uk: "Чат у WhatsApp"
  },
  my_orders_btn: {
    bn: "আমার অর্ডার",
    en: "My Orders",
    ar: "طلباتي",
    es: "Mis Pedidos",
    pt: "Meus Pedidos",
    fr: "Mes commandes",
    tr: "Siparişlerim",
    ru: "Мои заказы",
    id: "Pesanan Saya",
    ms: "Pesanan Saya",
    vi: "Đơn hàng của tôi",
    th: "คำสั่งซื้อของฉัน",
    hi: "मेरे ऑर्डर",
    ur: "میرے آرڈرز",
    my: "ကျွန်ုပ်၏အော်ဒါများ",
    km: "ការបញ្ជាទិញរបស់ខ្ញុំ",
    ne: "मेरो अर्डरहरू",
    si: "මගේ ඇණවුම්",
    uk: "Мої замовлення"
  },
  track_order_btn: {
    bn: "অর্ডার ট্র্যাক",
    en: "Track Order",
    ar: "تتبع الطلب",
    es: "Rastrear Pedido",
    pt: "Rastrear Pedido",
    fr: "Suivre la commande",
    tr: "Siparişi Takip Et",
    ru: "Отследить заказ",
    id: "Lacak Pesanan",
    ms: "Jejak Pesanan",
    vi: "Theo dõi đơn hàng",
    th: "ติดตามสถานะ",
    hi: "ऑर्डर ट्रैक करें",
    ur: "آرڈر ٹریک کریں",
    my: "အော်ဒါခြေရာခံရန်",
    km: "តាមដានការបញ្ជាទិញ",
    ne: "अर्डर ट्र्याक गर्नुहोस्",
    si: "ඇණවුම සොයාගන්න",
    uk: "Відстежити замовлення"
  },
  secure_checkout_text: {
    bn: "১০০% নিরাপদ ডেলিভারি কানেকশন",
    en: "100% Secure Delivery Connection",
    ar: "اتصال آمن بنسبة 100٪ للتسليم",
    es: "Conexión de entrega 100% segura",
    pt: "Conexão de entrega 100% segura",
    fr: "Connexion de livraison 100 % sécurisée",
    tr: "100% Güvenli Teslimat Bağlantısı",
    ru: "100% безопасное соединение",
    id: "Koneksi Pengiriman Aman 100%",
    ms: "Sambungan Penghantaran 100% Selamat",
    vi: "Kết nối giao hàng bảo mật 100%",
    th: "ระบบการจัดส่งปลอดภัย 100%",
    hi: "100% सुरक्षित डिलिवरी कनेक्शन",
    ur: "100٪ محفوظ ترسیल کا کنکشن",
    my: "၁၀၀% စိတ်ချရသော ပို့ဆောင်မှု ချိတ်ဆက်မှု",
    km: "ការតភ្ជាប់ការដឹកជញ្ជូនមានសុវត្ថិភាព 100%",
    ne: "१००% सुरक्षित डिलिवरी जडान",
    si: "100% සුරක්ෂිත බෙදාහැරීමේ සම්බන්ධතාවය",
    uk: "100% безпечне з'єднання доставки"
  },
  shopping_cart: {
    bn: "শপিং কার্ট",
    en: "Shopping Cart",
    ar: "عربة التسوق",
    es: "Carrito de Compra",
    pt: "Carrinho",
    fr: "Panier",
    tr: "Alışveriş Sepeti",
    ru: "Корзина",
    id: "Keranjang Belanja",
    ms: "Bakul Belanja",
    vi: "Giỏ hàng",
    th: "ตะกร้าสินค้า",
    hi: "शॉपिंग कार्ट",
    ur: "شاپنگ کارٹ",
    my: "စျေးဝယ်လှည်း",
    km: "រទេះទំនិញ",
    ne: "शपिंग कार्ट",
    si: "කරත්තය",
    uk: "Кошик"
  },
  cart_empty: {
    bn: "আপনার কার্টটি খালি!",
    en: "Your shopping bag is empty!",
    ar: "حقيبة التسوق الخاصة بك فارغة!",
    es: "¡Tu bolsa de compras está vacía!",
    pt: "Seu carrinho está vazio!",
    fr: "Votre panier est vide !",
    tr: "Alışveriş sepetiniz boş!",
    ru: "Ваша корзина пуста!",
    id: "Keranjang belanja Anda kosong!",
    ms: "Troly belanja anda kosong!",
    vi: "Giỏ hàng của bạn đang trống!",
    th: "ไม่มีสินค้าในตะกร้า!",
    hi: "आपका शॉपिंग बैग खाली है!",
    ur: "آپ کا شاپنگ بیگ خالی ہے!",
    my: "သင်၏စျေးဝယ်လှည်းမှာ လွတ်နေပါသည်",
    km: "កន្ត្រកទំនិញរបស់អ្នកគឺទទេ!",
    ne: "तपाईंको शपिंग ब्याग खाली छ!",
    si: "ඔබේ කරත්තය හිස් ය!",
    uk: "Ваш кошик порожній!"
  },
  quantity: {
    bn: "পরিমাণ",
    en: "Quantity",
    ar: "الكمية",
    es: "Cantidad",
    pt: "Quantidade",
    fr: "Quantité",
    tr: "Miktar",
    ru: "Количество",
    id: "Jumlah",
    ms: "Kuantiti",
    vi: "Số lượng",
    th: "จำนวน",
    hi: "मात्रा",
    ur: "مقدار",
    my: "အရေအတွက်",
    km: "បរិមាណ",
    ne: "मात्रा",
    si: "ප්‍රමාණය",
    uk: "Кількість"
  },
  size: {
    bn: "সাইজ",
    en: "Size",
    ar: "الحجم",
    es: "Talla",
    pt: "Tamanho",
    fr: "Taille",
    tr: "Beden",
    ru: "Размер",
    id: "Ukuran",
    ms: "Saiz",
    vi: "Kích thước",
    th: "ขนาด",
    hi: "आकार",
    ur: "سائز",
    my: "ဆိုဒ်",
    km: "ទំហំ",
    ne: "साइज",
    si: "ප්‍රමාණය",
    uk: "Розмір"
  },
  color: {
    bn: "কালার",
    en: "Color",
    ar: "اللون",
    es: "Color",
    pt: "Cor",
    fr: "Couleur",
    tr: "Renk",
    ru: "Цвет",
    id: "Warna",
    ms: "Warna",
    vi: "Màu sắc",
    th: "สี",
    hi: "रंग",
    ur: "رنگ",
    my: "အရောင်",
    km: "ពណ៌",
    ne: "रंग",
    si: "පැහැය",
    uk: "Колір"
  },
  delivery_info: {
    bn: "ডেলিভারি তথ্য",
    en: "Delivery Info",
    ar: "معلومات التسليم",
    es: "Información de Entrega",
    pt: "Informações de Entrega",
    fr: "Informations de livraison",
    tr: "Teslimat Bilgisi",
    ru: "Информация о доставке",
    id: "Informasi Pengiriman",
    ms: "Maklumat Penghantaran",
    vi: "Thông tin giao hàng",
    th: "ข้อมูลการจัดส่ง",
    hi: "डिलिवरी जानकारी",
    ur: "ترسیل کی معلومات",
    my: "ပို့ဆောင်မှုအချက်အလက်",
    km: "ព័ត៌មានដឹកជញ្ជូន",
    ne: "डिलिवरी जानकारी",
    si: "බෙදා හැරීමේ තොරතුරු",
    uk: "Інформація про доставку"
  },
  product_price: {
    bn: "পণ্যের মূল্য",
    en: "Product Price",
    ar: "سعر المنتج",
    es: "Precio del Producto",
    pt: "Preço do Produto",
    fr: "Prix du produit",
    tr: "Ürün Fiyatı",
    ru: "Цена товара",
    id: "Harga Produk",
    ms: "Harga Produk",
    vi: "Giá sản phẩm",
    th: "ราคาสินค้า",
    hi: "उत्पाद का मूल्य",
    ur: "مصنوعات کی قیمت",
    my: "ပစ္စည်းဈေးနှုန်း",
    km: "តម្លៃទំនិញ",
    ne: "उत्पाद मूल्य",
    si: "භාණ්ඩයේ මිල",
    uk: "Ціна товару"
  },
  prev_img: {
    bn: "পূর্ববর্তী ছবি",
    en: "Previous Image"
  },
  next_img: {
    bn: "পরবর্তী ছবি",
    en: "Next Image"
  },
  view_details: {
    bn: "বিস্তারিত",
    en: "View Details"
  },
  discount_tag_text: {
    bn: "অফার",
    en: "Offer"
  },
  no_product_found: {
    bn: "কোনো প্রোডাক্ট পাওয়া যায়নি",
    en: "No products found"
  },
  search_retry_keyword: {
    bn: "অন্য কোনো কি-ওয়ার্ড দিয়ে সার্চ করে চেষ্টা করুন",
    en: "Try searching with another keyword"
  },
  watch_video: {
    bn: "ভিডিও দেখুন",
    en: "Watch Video"
  },
  service_warranty: {
    bn: "সার্ভিস ওয়ারেন্টি",
    en: "Service Warranty"
  },
  replacement_guarantee: {
    bn: "রিপ্লেসমেন্ট গ্যারান্টি",
    en: "Replacement Guarantee"
  },
  full_details_heading: {
    bn: "ভূমিকা ও ডিটেইলস",
    en: "Full Details"
  },
  bullet_premium_quality: {
    bn: "প্রিমিয়াম কোয়ালিটি এবং নিখুঁত ফিনিশিং ও স্থায়িত্ব নিশ্চিত।",
    en: "Premium quality, perfect finishing and durability guaranteed."
  },
  bullet_cod_facility: {
    bn: "ক্যাশ অন ডেলিভারি সুবিধা (আগে প্রোডাক্ট চেক করে তারপর মূল্য দিন)।",
    en: "Cash on delivery facility (check the product first, then pay)."
  },
  bullet_safe_delivery: {
    bn: "দ্রুততম সময়ের মধ্যে আপনার দ্বারে সর্বোচ্চ নিরাপদ ডেলিভারি ব্যবস্থা।",
    en: "Fastest and safest delivery straight to your doorstep."
  },
  product_option_heading: {
    bn: "পণ্যের অপশন",
    en: "Product Options"
  },
  select_color: {
    bn: "সিলেক্ট কালার",
    en: "Select Color"
  },
  select_size: {
    bn: "সাইজ পছন্দ করুন",
    en: "Select Size"
  },
  select_weight: {
    bn: "ওজন সিলেক্ট করুন",
    en: "Select Weight"
  },
  delivery_charge_by_loc: {
    bn: "ডেলিভারী চার্জ লোকেশন অনুযায়ী",
    en: "Delivery Charge by Location"
  },
  inside_dhaka: {
    bn: "ঢাকার ভিতরে",
    en: "Inside Dhaka"
  },
  outside_dhaka: {
    bn: "ঢাকার বাইরে",
    en: "Outside Dhaka"
  },
  local_delivery: {
    bn: "লোকাল ডেলিভারি",
    en: "Local Delivery"
  },
  outside_city: {
    bn: "শহরের বাইরে",
    en: "Outside City"
  },
  area_based_delivery_charge: {
    bn: "এলাকা ভিত্তিক ডেলিভারী চার্জ",
    en: "Area-based Delivery Charge"
  },
  or_select_specific_area: {
    bn: "অথবা নির্দিষ্ট এরিয়া সিলেক্ট করুন",
    en: "Or Select Specific Area"
  },
  choose_area: {
    bn: "এরিয়া বেছে নিন",
    en: "Choose Area"
  },
  country_select: {
    bn: "দেশ সিলেক্ট করুন",
    en: "Select Country"
  },
  pro_70_countries: {
    bn: "৭০ টি দেশে সাজানো",
    en: "Arranged for 70 Countries"
  },
  submit_order_btn: {
    bn: "সাবমিট অর্ডার",
    en: "Submit Order"
  },
  contact_btn: {
    bn: "যোগাযোগ করুন",
    en: "Contact Us"
  },
  suggestions_heading: {
    bn: "সাজেসশন প্রডাক্ট",
    en: "Suggested Products"
  },
  suggestions_subheading: {
    bn: "আরও পছন্দ করতে পারেন",
    en: "You may also like"
  },
  alert_ok: {
    bn: "ঠিক আছে",
    en: "OK"
  },
  my_orders_desc: {
    bn: "এই ব্রাউজারে আপনার সম্পন্ন করা শেষ অর্ডারগুলোর অবস্থান এবং নিশ্চিত ট্র্যাকিং তালিকা",
    en: "Status and tracking list of your recently placed orders in this browser."
  },
  retrieving_orders: {
    bn: "অর্ডার ডাটা রিট্রিভ করা হচ্ছে",
    en: "Retrieving order data..."
  },
  no_order_history: {
    bn: "এখনো কোনো অর্ডার ইতিহাস নেই",
    en: "No order history found yet"
  },
  no_order_history_desc: {
    bn: "আপনি কোনো আইটেম অর্ডার করার পরই তা সরাসরি লাভ করতে পারবেন",
    en: "Once you order an item, it will appear here."
  },
  order_date: {
    bn: "তারিখ",
    en: "Date"
  },
  status_pending: {
    bn: "অপেক্ষমাণ",
    en: "Pending"
  },
  status_confirmed: {
    bn: "নিশ্চিত",
    en: "Confirmed"
  },
  status_delivered: {
    bn: "ডেলিভার্ড",
    en: "Delivered"
  },
  courier_tracking: {
    bn: "কুরিয়ার ট্র্যাকিং",
    en: "Courier Tracking"
  },
  short_intro: {
    bn: "শর্ট পরিচিতি",
    en: "Short Intro"
  },
  secured_by_firebase: {
    bn: "গুগল ফায়ারবেস সুরক্ষিত সার্টিফিকেট",
    en: "Google Firebase Secured Certificate"
  },
  powered_by: {
    bn: "পাওয়ার্ড বাই",
    en: "Powered by"
  },
  product_variant_missing: {
    bn: "প্রোডাক্ট কালার বা সাইজ সিলেক্ট করা নাই",
    en: "Product color or size is not selected"
  },
  gps_unsupported: {
    bn: "আপনার ব্রাউজারে জিপিএস লোকেশন ট্র্যাকিং সাপোর্ট করে না।",
    en: "Your browser does not support GPS location tracking."
  },
  location_not_found: {
    bn: "লোকেশন পারমিশন পাওয়া যায়নি।",
    en: "Location permission not found."
  },
  location_blocked: {
    bn: "ডেলিভারি এরিয়া ও নিরাপত্তা কনফার্মেশনের জন্য আপনার ব্রাউজারের লোকেশন পারমিশন এলাও করা বাধ্যতামূলক। অনুগ্রহ করে লোকেশন এলাও করে আবার ক্লিক করুন।",
    en: "Allowing location permission is mandatory to confirm delivery area and security. Please allow location and try again."
  },
  location_blocked_generic: {
    bn: "লোকেশন পারমিশন ব্লক করা আছে।",
    en: "Location permission is blocked."
  },
  location_error: {
    bn: "আপনার ডিভাইসের জিপিএস লোকেশন লোড করা সম্ভব হয়নি। অনুগ্রহ করে লোকেশন সেটিংস অন রয়েছে কিনা চেক করে আবার ট্রাই করুন।",
    en: "Could not load GPS location. Please check if location services are enabled and try again."
  },
  rate_limit_error: {
    bn: "দুঃখিত, আপনার ডিভাইস থেকে অতিরিক্ত অর্ডার রিকোয়েস্ট পাঠানো হয়েছে। অনুগ্রহ করে কিছু সময় পর পুনরায় চেষ্টা করুন।",
    en: "Too many order requests. Please try again later."
  },
  collections_catalog: {
    bn: "কালেকশন / ক্যাটালগ",
    en: "Collections / Catalog"
  },
  collections_subheading: {
    bn: "পছন্দসই প্রিমিয়াম প্রোডাক্টগুলো বেছে নিন নিচে ক্যাটাগরি বা ফিল্টার ব্যবহার করে।",
    en: "Choose your desired premium products using categories or filters below."
  },
  all_products: {
    bn: "সব প্রোডাক্ট",
    en: "All Products"
  },
  product_option_detail: {
    bn: "পণ্য #{{index}} এর অপশন",
    en: "Product #{{index}} Option"
  },
  product_option_detail_pub: {
    bn: "প্রোডাক্ট বিবরণ #{{index}}",
    en: "Product Details #{{index}}"
  },
  remove_item: {
    bn: "আইটেমটি বাদ দিন",
    en: "Remove item"
  },
  alternative_option: {
    bn: "বিকল্প",
    en: "Alternative"
  },
  my_orders_tab: {
    bn: "আমার অর্ডারসমূহ",
    en: "My Orders"
  },
  help_support_tab: {
    bn: "সহায়তা",
    en: "Help & Support"
  },
  company_support: {
    bn: "কোম্পানি সাপোর্ট",
    en: "Company Support"
  },
  customer_help: {
    bn: "কাস্টমার হেল্প",
    en: "Customer Help"
  },
  contacts_support: {
    bn: "যোগাযোগ এবং সহায়তা",
    en: "Contacts Support"
  },
  whatsapp_support: {
    bn: "হোয়াটসঅ্যাপ সাপোর্ট",
    en: "WhatsApp Support"
  },
  secure_payment: {
    bn: "নিরাপদ পেমেন্ট",
    en: "Secure Payment"
  },
  cash_on_delivery: {
    bn: "ক্যাশ অন ডেলিভারি",
    en: "Cash on Delivery"
  },
  all_rights_reserved: {
    bn: "সর্বস্বত্ব সংরক্ষিত।",
    en: "ALL RIGHTS RESERVED."
  },
  ssl_secured_cert: {
    bn: "ফায়ারবেস সুরক্ষিত SSL কানেকশন",
    en: "Firebase Secured SSL Connection"
  },
  powered_by_dragon: {
    bn: "Powered by DOELpro",
    en: "Powered by DOELpro"
  },
  about: {
    bn: "আমরা প্রতিটি পণ্যের গুণগত মান এবং সঠিক ডেলিভারী নিশ্চিত করি। আমাদের কাস্টমারদের সর্বোচ্চ সন্তুষ্টি আমাদের মূল লক্ষ্য।",
    en: "We guarantee premium product quality and absolute customer satisfaction across our listings."
  }
};

/**
 * Returns translation for a specific key based on the configured language and country fallback.
 */
export function translate(key: string, configLanguage?: string, countryName?: string): string {
  const dictionary = TRANSLATIONS[key];
  if (!dictionary) return "";

  // 1. Explicit config language choice
  if (configLanguage && configLanguage !== "auto") {
    if (dictionary[configLanguage]) {
      return dictionary[configLanguage];
    }
    return dictionary.en || "";
  }

  // 2. Auto resolve based on country name
  const resolvedLang = countryName ? (COUNTRY_TO_LANG[countryName] || "en") : "bn";
  if (dictionary[resolvedLang]) {
    return dictionary[resolvedLang];
  }

  return dictionary.en || "";
}
