export interface FormField {
  key: string;
  labelEn: string;
  labelBn: string;
  placeholderEn: string;
  placeholderBn: string;
  type: 'text' | 'tel' | 'email' | 'textarea' | 'select';
  required: boolean;
  options?: { label: string; value: string; labelBn?: string }[];
}

export interface CountryInfo {
  name: string;
  bengaliName: string;
  code: string;
  currency: string;
  currencySymbol: string;
  couriers: string[];
}

export const COUNTRIES: CountryInfo[] = [
  { name: "Algeria", bengaliName: "Algeria", code: "+213", currency: "DZD", currencySymbol: "DA", couriers: ["Yalidine Express", "Algérie Poste", "Nord et Sud"] },
  { name: "Angola", bengaliName: "Angola", code: "+244", currency: "AOA", currencySymbol: "Kz", couriers: ["Correios de Angola", "DHL Angola"] },
  { name: "Argentina", bengaliName: "Argentina", code: "+54", currency: "ARS", currencySymbol: "$", couriers: ["Correo Argentino", "Andreani", "OCA"] },
  { name: "Azerbaijan", bengaliName: "Azerbaijan", code: "+994", currency: "AZN", currencySymbol: "₼", couriers: ["Azerpost", "CDEK AZ", "166 Kuryer"] },
  { name: "Bahrain", bengaliName: "Bahrain", code: "+973", currency: "BHD", currencySymbol: "BD", couriers: ["Bahrain Post", "Aramex Bahrain", "DHL Bahrain"] },
  { name: "Bangladesh", bengaliName: "Bangladesh", code: "+880", currency: "BDT", currencySymbol: "৳", couriers: ["Steadfast Courier", "Pathao Courier", "RedX Delivery", "Paperfly", "eCourier", "Carrybee Courier"] },
  { name: "Bolivia", bengaliName: "Bolivia", code: "+591", currency: "BOB", currencySymbol: "Bs", couriers: ["Correios de Bolivia", "Courier Express BOB"] },
  { name: "Brazil", bengaliName: "Brazil", code: "+55", currency: "BRL", currencySymbol: "R$", couriers: ["Correios", "Jadlog", "Loggi", "Total Express"] },
  { name: "Bulgaria", bengaliName: "Bulgaria", code: "+359", currency: "BGN", currencySymbol: "lv", couriers: ["Econt Express", "Speedy", "Bulgarian Posts"] },
  { name: "Cambodia", bengaliName: "Cambodia", code: "+855", currency: "KHR", currencySymbol: "៛", couriers: ["J&T Express Cambodia", "VET Express"] },
  { name: "Chile", bengaliName: "Chile", code: "+56", currency: "CLP", currencySymbol: "$", couriers: ["Chilexpress", "Starken", "CorreosChile"] },
  { name: "Colombia", bengaliName: "Colombia", code: "+57", currency: "COP", currencySymbol: "$", couriers: ["Servientrega", "Coordinadora", "Envía", "Interrapidísimo"] },
  { name: "Costa Rica", bengaliName: "Costa Rica", code: "+506", currency: "CRC", currencySymbol: "₡", couriers: ["Correios de Costa Rica", "Moovin", "DHL CR"] },
  { name: "Croatia", bengaliName: "Croatia", code: "+385", currency: "EUR", currencySymbol: "€", couriers: ["Hrvatska Pošta", "DPD Croatia", "GLS Croatia"] },
  { name: "Cyprus", bengaliName: "Cyprus", code: "+357", currency: "EUR", currencySymbol: "€", couriers: ["Cyprus Post", "ACS Courier Cyprus"] },
  { name: "Czech Republic", bengaliName: "Czech Republic", code: "+420", currency: "CZK", currencySymbol: "Kč", couriers: ["Zásilkovna", "PPL", "Česká pošta"] },
  { name: "Dominican Republic", bengaliName: "Dominican Republic", code: "+1-809", currency: "DOP", currencySymbol: "RD$", couriers: ["Metropac", "Caribe Pack", "Domex DR"] },
  { name: "Ecuador", bengaliName: "Ecuador", code: "+593", currency: "USD", currencySymbol: "$", couriers: ["Servientrega Ecuador", "LAAR Courier", "Urbano"] },
  { name: "Egypt", bengaliName: "Egypt", code: "+20", currency: "EGP", currencySymbol: "E£", couriers: ["Aramex Egypt", "Bosta", "Mylerz", "Egypt Post"] },
  { name: "Estonia", bengaliName: "Estonia", code: "+372", currency: "EUR", currencySymbol: "€", couriers: ["Omniva EE", "DPD Estonia", "Itella Smartpost"] },
  { name: "Ethiopia", bengaliName: "Ethiopia", code: "+251", currency: "ETB", currencySymbol: "Br", couriers: ["EthioPost", "Eshi Express", "DHL Ethiopia"] },
  { name: "Ghana", bengaliName: "Ghana", code: "+233", currency: "GHS", currencySymbol: "GH₵", couriers: ["Ghana Post", "Aramex Ghana", "GIG Logistics GH"] },
  { name: "Greece", bengaliName: "Greece", code: "+30", currency: "EUR", currencySymbol: "€", couriers: ["ACS Courier", "Geniki Taxydromiki", "Hellenic Post (ELTA)", "Box Now"] },
  { name: "Guatemala", bengaliName: "Guatemala", code: "+502", currency: "GTQ", currencySymbol: "Q", couriers: ["Guatex", "Cargo Expreso", "Forza Delivery"] },
  { name: "Hungary", bengaliName: "Hungary", code: "+36", currency: "HUF", currencySymbol: "Ft", couriers: ["Foxpost", "DPD Hungary", "GLS Hungary", "Magyar Posta"] },
  { name: "India", bengaliName: "India", code: "+91", currency: "INR", currencySymbol: "₹", couriers: ["Delhivery", "Blue Dart", "Shadowfax", "Xpressbees", "DTDC"] },
  { name: "Indonesia", bengaliName: "Indonesia", code: "+62", currency: "IDR", currencySymbol: "Rp", couriers: ["JNE Express", "J&T Express", "SiCepat", "Anteraja"] },
  { name: "Iraq", bengaliName: "Iraq", code: "+964", currency: "IQD", currencySymbol: "ID", couriers: ["Sandooq", "Aramex Iraq", "DHL Iraq"] },
  { name: "Ivory Coast", bengaliName: "Ivory Coast", code: "+225", currency: "XOF", currencySymbol: "CFAF", couriers: ["La Poste de Côte d'Ivoire", "Colisas", "DHL CI"] },
  { name: "Jordan", bengaliName: "Jordan", code: "+962", currency: "JOD", currencySymbol: "JD", couriers: ["Aramex Jordan", "Jordan Post", "Sager Courier"] },
  { name: "Kazakhstan", bengaliName: "Kazakhstan", code: "+7", currency: "KZT", currencySymbol: "₸", couriers: ["Kazpost", "CDEK KZ", "Avis Logistics"] },
  { name: "Kenya", bengaliName: "Kenya", code: "+254", currency: "KES", currencySymbol: "KSh", couriers: ["Sendy", "Fargo Courier", "G4S Kenya"] },
  { name: "Kuwait", bengaliName: "Kuwait", code: "+965", currency: "KWD", currencySymbol: "KD", couriers: ["Kuwait Post", "Aramex Kuwait", "DHL Kuwait"] },
  { name: "Kyrgyzstan", bengaliName: "Kyrgyzstan", code: "+996", currency: "KGS", currencySymbol: "сом", couriers: ["Kyrgyz Pochtasy", "CDEK KG", "DHL KG"] },
  { name: "Laos", bengaliName: "Laos", code: "+856", currency: "LAK", currencySymbol: "₭", couriers: ["Anousith Express", "HAL Logistics", "Lao Post"] },
  { name: "Latvia", bengaliName: "Latvia", code: "+371", currency: "EUR", currencySymbol: "€", couriers: ["Omniva LV", "DPD Latvia", "Latvijas Pasts"] },
  { name: "Lebanon", bengaliName: "Lebanon", code: "+961", currency: "LBP", currencySymbol: "L£", couriers: ["LibanPost", "Aramex Lebanon", "Wakilni"] },
  { name: "Lithuania", bengaliName: "Lithuania", code: "+370", currency: "EUR", currencySymbol: "€", couriers: ["Omniva LT", "DPD Lithuania", "Lietuvos Paštas"] },
  { name: "Malaysia", bengaliName: "Malaysia", code: "+60", currency: "MYR", currencySymbol: "RM", couriers: ["Pos Laju", "J&T Express Malaysia", "Ninja Van MY"] },
  { name: "Maldives", bengaliName: "Maldives", code: "+960", currency: "MVR", currencySymbol: "Rf", couriers: ["Maldives Post", "Redbox Maldives", "Island Express"] },
  { name: "Mexico", bengaliName: "Mexico", code: "+52", currency: "MXN", currencySymbol: "$", couriers: ["Estafeta", "Redpack", "DHL México", "FedEx México"] },
  { name: "Morocco", bengaliName: "Morocco", code: "+212", currency: "MAD", currencySymbol: "DH", couriers: ["Barid Al-Maghrib", "Aramex Morocco", "Ghazala"] },
  { name: "Myanmar", bengaliName: "Myanmar", code: "+95", currency: "MMK", currencySymbol: "Ks", couriers: ["Royal Express", "Marathon Myanmar", "RGO47"] },
  { name: "Nepal", bengaliName: "Nepal", code: "+977", currency: "NPR", currencySymbol: "₨", couriers: ["Pathao Nepal", "Upaya CityCargo", "Namaste Cargo"] },
  { name: "Nigeria", bengaliName: "Nigeria", code: "+234", currency: "NGN", currencySymbol: "₦", couriers: ["GIG Logistics", "Sendbox", "Red Star Express"] },
  { name: "Oman", bengaliName: "Oman", code: "+968", currency: "OMR", currencySymbol: "OMR", couriers: ["Oman Post", "Aramex Oman", "Asyad Express"] },
  { name: "Pakistan", bengaliName: "Pakistan", code: "+92", currency: "PKR", currencySymbol: "₨", couriers: ["TCS", "Leopard Courier", "M&P", "Call Courier"] },
  { name: "Peru", bengaliName: "Peru", code: "+51", currency: "PEN", currencySymbol: "S/", couriers: ["Olva Courier", "Serpost", "Shalom", "Scharff"] },
  { name: "Philippines", bengaliName: "Philippines", code: "+63", currency: "PHP", currencySymbol: "₱", couriers: ["LBC Express", "J&T Express Philippines", "Ninja Van PH"] },
  { name: "Poland", bengaliName: "Poland", code: "+48", currency: "PLN", currencySymbol: "zł", couriers: ["InPost", "DPD Poland", "DHL Parcel PL", "Poczta Polska"] },
  { name: "Qatar", bengaliName: "Qatar", code: "+974", currency: "QAR", currencySymbol: "QR", couriers: ["Q-Post", "Aramex Qatar", "DHL Qatar"] },
  { name: "Romania", bengaliName: "Romania", code: "+40", currency: "RON", currencySymbol: "lei", couriers: ["Fan Courier", "Sameday Courier", "Poșta Română"] },
  { name: "Russia", bengaliName: "Russia", code: "+7", currency: "RUB", currencySymbol: "₽", couriers: ["Russian Post", "CDEK", "Boxberry", "SDEK"] },
  { name: "Saudi Arabia", bengaliName: "Saudi Arabia", code: "+966", currency: "SAR", currencySymbol: "SR", couriers: ["Aramex", "SMSA Express", "SPL (Saudi Post)", "Zajil"] },
  { name: "Senegal", bengaliName: "Senegal", code: "+221", currency: "XOF", currencySymbol: "CFAF", couriers: ["La Poste Sénégal", "Colis Sénégal", "DHL SN"] },
  { name: "Serbia", bengaliName: "Serbia", code: "+381", currency: "RSD", currencySymbol: "din", couriers: ["Post Express", "Bex Express", "Daily Express"] },
  { name: "Slovakia", bengaliName: "Slovakia", code: "+421", currency: "EUR", currencySymbol: "€", couriers: ["Packeta SZ", "Slovenská pošta", "DPD SK"] },
  { name: "South Africa", bengaliName: "South Africa", code: "+27", currency: "ZAR", currencySymbol: "R", couriers: ["The Courier Guy", "RAM Hand-to-Hand", "Dawn Wing"] },
  { name: "Sri Lanka", bengaliName: "Sri Lanka", code: "+94", currency: "LKR", currencySymbol: "රු", couriers: ["Pronto Lanka", "Koombiyo Delivery", "Certis Lanka"] },
  { name: "Tanzania", bengaliName: "Tanzania", code: "+255", currency: "TZS", currencySymbol: "TSh", couriers: ["Tanzania Post (TPC)", "DHL Tanzania"] },
  { name: "Thailand", bengaliName: "Thailand", code: "+66", currency: "THB", currencySymbol: "฿", couriers: ["Kerry Express TH", "Flash Express TH", "J&T Express Thailand"] },
  { name: "Tunisia", bengaliName: "Tunisia", code: "+216", currency: "TND", currencySymbol: "DT", couriers: ["Aramex Tunisia", "La Poste Tunisienne", "First Delivery"] },
  { name: "Turkey", bengaliName: "Turkey", code: "+90", currency: "TRY", currencySymbol: "₺", couriers: ["Yurtiçi Kargo", "Aras Kargo", "MNG Kargo", "PTT Kargo"] },
  { name: "Uganda", bengaliName: "Uganda", code: "+256", currency: "UGX", currencySymbol: "USh", couriers: ["Posta Uganda", "DHL Uganda", "Aramex Uganda"] },
  { name: "Ukraine", bengaliName: "Ukraine", code: "+380", currency: "UAH", currencySymbol: "₴", couriers: ["Nova Poshta", "Ukrposhta", "Meest Express"] },
  { name: "United Arab Emirates (UAE)", bengaliName: "United Arab Emirates (UAE)", code: "+971", currency: "AED", currencySymbol: "د.إ", couriers: ["Aramex UAE", "Fetchr", "Emirates Post", "Careem Delivery"] },
  { name: "Uzbekistan", bengaliName: "Uzbekistan", code: "+998", currency: "UZS", currencySymbol: "so'm", couriers: ["Uzpost", "Fargo Uz", "CDEK UZ"] },
  { name: "Vietnam", bengaliName: "Vietnam", code: "+84", currency: "VND", currencySymbol: "₫", couriers: ["Giao Hang Nhanh (GHN)", "Giao Hang Tiet Kiem (GHTK)"] },
  { name: "Zambia", bengaliName: "Zambia", code: "+260", currency: "ZMW", currencySymbol: "ZK", couriers: ["ZamPost", "DHL Zambia"] },
  { name: "Zimbabwe", bengaliName: "Zimbabwe", code: "+263", currency: "USD", currencySymbol: "$", couriers: ["Zimpost", "DHL Zimbabwe", "Swift Zimbabwe"] }
];

export function getCourierConfig(courierName: string, countryName: string): { name: string; requiredFields: string[]; website: string } {
  const nameLower = courierName.toLowerCase();
  let fields: string[] = ["API Key", "Client ID"];
  let domain = nameLower.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  let tld = "com";

  if (countryName === "Bangladesh") {
    tld = "com.bd";
    if (nameLower.includes("steadfast")) {
      fields = ["API Token", "Secret Key"];
      domain = "steadfast.com.bd";
    } else if (nameLower.includes("pathao")) {
      fields = ["Client ID", "Client Secret", "Store ID", "Username", "Password"];
      domain = "merchant.pathao.com";
    } else if (nameLower.includes("redx")) {
      fields = ["App ID", "Secret Token"];
      domain = "redx.com.bd";
    } else if (nameLower.includes("paperfly")) {
      fields = ["API Key", "Username", "Password"];
      domain = "paperfly.com.bd";
    } else if (nameLower.includes("ecourier")) {
      fields = ["User ID", "API Key", "API Secret"];
      domain = "ecourier.com.bd";
    } else if (nameLower.includes("carrybee") || nameLower.includes("carry bee")) {
      fields = ["API Key", "API Secret", "Store ID / Merchant ID", "Client Username"];
      domain = "carrybee.com.bd";
    }
    return {
      name: courierName,
      requiredFields: fields,
      website: `https://${domain}`
    };
  }

  // General Couriers
  if (nameLower.includes("aramex")) {
    fields = ["API Username", "API Password", "Account Number", "Account Pin", "Account Entity"];
    domain = "aramex.com";
  } else if (nameLower.includes("dhl")) {
    fields = ["DHL Client ID", "DHL Client Secret", "Billing Account Number"];
    domain = "dhl.com";
  } else if (nameLower.includes("fedex")) {
    fields = ["FedEx API Key", "FedEx Secret Key", "Account Number"];
    domain = "fedex.com";
  } else if (nameLower.includes("j&t") || nameLower.includes("jt express")) {
    fields = ["Customer Code", "API Password", "VIP Code / Sender Code"];
    domain = "jtexpress.com";
  } else if (nameLower.includes("delhivery")) {
    fields = ["API Token", "Client Name (ID)", "Pickup Location ID"];
    domain = "delhivery.com";
  } else if (nameLower.includes("blue dart")) {
    fields = ["License Key", "Login ID", "Area Code / Customer Code"];
    domain = "bluedart.com";
  } else if (nameLower.includes("shadowfax")) {
    fields = ["Shadowfax Client Token", "Username", "Password"];
    domain = "shadowfax.in";
  } else if (nameLower.includes("xpressbees")) {
    fields = ["Xpressbees Secret Token", "Billing Account Code"];
    domain = "xpressbees.com";
  } else if (nameLower.includes("tcs")) {
    fields = ["TCS API Key", "TCS Account Number", "Client Code"];
    domain = "tcscourier.com";
  } else if (nameLower.includes("leopard")) {
    fields = ["API Key", "API Password", "Vendor ID"];
    domain = "leopardscourier.com";
  } else if (nameLower.includes("cdek") || nameLower.includes("sdek")) {
    fields = ["CDEK Account ID", "CDEK Secure Password"];
    domain = "cdek.ru";
  } else if (nameLower.includes("russian post")) {
    fields = ["Access Token", "Login / Username", "Password"];
    domain = "pochta.ru";
  } else if (nameLower.includes("correios")) {
    fields = ["Correios User Log", "Contract Access Card Number", "API Merchant Token"];
    domain = "correios.com.br";
  } else if (nameLower.includes("yurti") || nameLower.includes("aras") || nameLower.includes("mng") || nameLower.includes("ptt")) {
    fields = ["API Username", "API Password", "Customer Account Key"];
    domain = nameLower.includes("yurtici") ? "yurticikargo.com" : nameLower.includes("aras") ? "araskargo.com.tr" : nameLower.includes("mng") ? "mngkargo.com.tr" : "ptt.gov.tr";
  } else if (nameLower.includes("omniva")) {
    fields = ["Username", "Password", "Contract Number"];
    domain = "omniva.ee";
  } else if (nameLower.includes("dpd")) {
    fields = ["DPD API Username", "DPD API Password", "Contract Account Number"];
    domain = "dpd.com";
  } else if (nameLower.includes("gls")) {
    fields = ["GLS Client Key", "GLS API Password", "Sender Code"];
    domain = "gls-group.eu";
  } else if (nameLower.includes("servientrega")) {
    fields = ["Servientrega ID Billing", "API User Code", "API Password"];
    domain = "servientrega.com";
  } else if (nameLower.includes("novaposhta") || nameLower.includes("nova poshta")) {
    fields = ["Nova Poshta API Key"];
    domain = "novaposhta.ua";
  } else if (nameLower.includes("post express") || nameLower.includes("posta")) {
    fields = ["API Access Token", "Merchant Account ID"];
  }

  // Adjust website domains for some common patterns
  if (domain === nameLower.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')) {
    domain = `${domain}.${tld}`;
  }

  return {
    name: courierName,
    requiredFields: fields,
    website: `https://${domain}`
  };
}

export function getOfflineCouriers(countryName: string): { name: string; requiredFields: string[]; website: string }[] {
  const country = getCountry(countryName);
  if (!country) return [];
  return country.couriers.map(courierName => getCourierConfig(courierName, country.name));
}

export function getCountry(name: string): CountryInfo | undefined {
  return COUNTRIES.find(c => c.name.toLowerCase() === name.toLowerCase() || c.bengaliName.toLowerCase() === name.toLowerCase());
}

export function getCurrencySymbol(countryName: string): string {
  const match = getCountry(countryName);
  return match ? match.currencySymbol : "৳";
}

export function getAggregatedAddress(countryName: string, data: any): string {
  const fields = getCheckoutFormFields(countryName);
  const parts: string[] = [];
  fields.forEach(f => {
    if (f.key !== 'name' && f.key !== 'phone') {
      const val = data[f.key];
      if (val) {
        if (f.key === 'location') {
          parts.push(val === 'dhaka_inside' ? "Inside Dhaka" : "Outside Dhaka");
        } else {
          parts.push(`${f.labelEn}: ${val}`);
        }
      }
    }
  });
  if (parts.length === 0 && data.address) {
    parts.push(data.address);
  }
  parts.push(countryName);
  return parts.join(', ');
}

export function getCheckoutFormFields(countryName: string): FormField[] {
  const country = getCountry(countryName);
  const name = country ? country.name : "Bangladesh";

  // Default core fields collected for all
  const coreName: FormField = {
    key: "name",
    labelEn: "Full Name",
    labelBn: "আপনার পূর্ণ নাম",
    placeholderEn: "Enter your full name",
    placeholderBn: "আপনার পুরো নাম লিখুন",
    type: "text",
    required: true
  };

  const corePhone: FormField = {
    key: "phone",
    labelEn: "Phone / WhatsApp Number",
    labelBn: "মোবাইল নম্বর",
    placeholderEn: "e.g. +1234567890",
    placeholderBn: "উদাহরণ: ০১৭XXXXXXXX",
    type: "tel",
    required: true
  };

  // 1. Bangladesh Order Format
  if (name === "Bangladesh") {
    return [
      coreName,
      corePhone,
      {
        key: "address",
        labelEn: "Detailed Delivery Address",
        labelBn: "পূর্ণাঙ্গ ডেলিভারী ঠিকানা",
        placeholderEn: "Village/Road, Thana, District & Landmark",
        placeholderBn: "গ্রাম/রোড নম্বর, থানা, জেলা এবং পরিচিত ঠিকানা দিন",
        type: "textarea",
        required: true
      },
      {
        key: "location",
        labelEn: "Delivery Location",
        labelBn: "ডেলিভারি এরিয়া",
        placeholderEn: "Please select delivery zone",
        placeholderBn: "ডেলিভারি লোকেশন সিলেক্ট করুন",
        type: "select",
        required: true,
        options: [
          { label: "Inside Dhaka (ঢাকার ভিতরে)", value: "dhaka_inside", labelBn: "ঢাকার ভিতরে" },
          { label: "Outside Dhaka (ঢাকার বাইরে)", value: "dhaka_outside", labelBn: "ঢাকার বাইরে" }
        ]
      }
    ];
  }

  // 2. India Order Format
  if (name === "India") {
    return [
      coreName,
      corePhone,
      {
        key: "state",
        labelEn: "State",
        labelBn: "রাজ্য (State)",
        placeholderEn: "e.g. West Bengal, Delhi",
        placeholderBn: "উদাহরণ: পশ্চিমবঙ্গ, দিল্লি",
        type: "text",
        required: true
      },
      {
        key: "city",
        labelEn: "City / Town",
        labelBn: "শহর (City)",
        placeholderEn: "e.g. Kolkata, Mumbai",
        placeholderBn: "উদাহরণ: কলকাতা, মুম্বাই",
        type: "text",
        required: true
      },
      {
        key: "postalCode",
        labelEn: "ZIP / PIN Code",
        labelBn: "পিন কোড (PIN Code)",
        placeholderEn: "6-digit PIN code",
        placeholderBn: "৬ ডিজিটের পিন কোড দিন",
        type: "text",
        required: true
      },
      {
        key: "address",
        labelEn: "Detailed Address",
        labelBn: "পূর্ণ ঠিকানা (Address)",
        placeholderEn: "Flat/House no, Street name, Area",
        placeholderBn: "ফ্ল্যাট/বাড়ি নম্বর, গ্রাম/রাস্তা, এলাকা",
        type: "textarea",
        required: true
      },
      {
        key: "landmark",
        labelEn: "Landmark (Optional)",
        labelBn: "কাছাকাছি পরিচিত স্থান (ঐচ্ছিক)",
        placeholderEn: "e.g. near hospital",
        placeholderBn: "যেমন: হাসপাতালের পাশে",
        type: "text",
        required: false
      }
    ];
  }

  // 3. Middle East / Arab (Saudi Arabia, UAE, Qatar, Oman, Kuwait, Bahrain, Jordan, Lebanon, Iraq, Egypt, Morocco, Tunisia, Algeria)
  const isMiddleEast = ["Saudi Arabia", "United Arab Emirates (UAE)", "Qatar", "Oman", "Kuwait", "Bahrain", "Jordan", "Lebanon", "Iraq", "Egypt", "Morocco", "Tunisia", "Algeria"].includes(name);

  if (isMiddleEast) {
    const isGCC = ["Saudi Arabia", "United Arab Emirates (UAE)", "Qatar", "Oman", "Kuwait", "Bahrain"].includes(name);
    return [
      coreName,
      {
        ...corePhone,
        labelEn: "WhatsApp Number (Active)",
        labelBn: "সক্রিয় হোয়াটসঅ্যাপ নম্বর",
        placeholderEn: "WhatsApp number with country code",
        placeholderBn: "কোড সহ হোয়াটসঅ্যাপ নম্বর দিন"
      },
      {
        key: "state",
        labelEn: isGCC ? "Emirate / Province" : "Governorate / Region",
        labelBn: isGCC ? "ইমারত / প্রদেশ" : "প্রদেশ / রাজ্য (Governorate)",
        placeholderEn: "e.g. Riyadh, Dubai, Cairo",
        placeholderBn: "যেমন: রিয়াদ, দুবাই, কায়রো",
        type: "text",
        required: true
      },
      {
        key: "city",
        labelEn: "City",
        labelBn: "শহর (City)",
        placeholderEn: "Enter your city",
        placeholderBn: "আপনার শহরের নাম দিন",
        type: "text",
        required: true
      },
      {
        key: "landmark",
        labelEn: "District / Neighborhood Name",
        labelBn: "পাড়া / মহল্লা বা জেলা অঞ্চল",
        placeholderEn: "e.g. Al-Hamra, Deira",
        placeholderBn: "যেমন: আল-হামরা, দেইরা",
        type: "text",
        required: true
      },
      {
        key: "address",
        labelEn: "Street Number, Building & Apartment",
        labelBn: "রাস্তা নম্বর, ভবন ও ফ্ল্যাট নম্বর",
        placeholderEn: "Street address, Building / Villa No, Apartment details",
        placeholderBn: "রাস্তা নম্বর, ভিলা/বাড়ি নম্বর, অ্যাপার্টমেন্ট বিবরণ",
        type: "textarea",
        required: true
      }
    ];
  }

  // 4. South East Asia COD market (Indonesia, Philippines, Vietnam, Thailand, Malaysia, Myanmar, Cambodia, Laos)
  const isSouthEastAsia = ["Indonesia", "Philippines", "Vietnam", "Thailand", "Malaysia", "Myanmar", "Cambodia", "Laos"].includes(name);

  if (isSouthEastAsia) {
    return [
      coreName,
      corePhone,
      {
        key: "state",
        labelEn: "Province / Region",
        labelBn: "রাজ্য / প্রদেশ (Province)",
        placeholderEn: "Enter Province",
        placeholderBn: "প্রদেশ সিলেক্ট বা টাইপ করুন",
        type: "text",
        required: true
      },
      {
        key: "city",
        labelEn: "City / Municipality",
        labelBn: "শহর / পৌরসভা",
        placeholderEn: "Enter City",
        placeholderBn: "শহর বা পৌরসভার নাম",
        type: "text",
        required: true
      },
      {
        key: "landmark",
        labelEn: "District / Ward / Barangay / Subdistrict",
        labelBn: "ওয়ার্ড / বার Barangay / সাবডিস্ট্রিক্ট",
        placeholderEn: "Detailed locality details",
        placeholderBn: "মহল্লা, সাবডিস্ট্রিক্ট বা সাবডিভিশন",
        type: "text",
        required: true
      },
      {
        key: "postalCode",
        labelEn: "Postal Code",
        labelBn: "পোস্টাল কোড (Postcode)",
        placeholderEn: "e.g. 10110, 4000",
        placeholderBn: "পোস্টাল জিপ কোড দিন",
        type: "text",
        required: true
      },
      {
        key: "address",
        labelEn: "Street Address & House No.",
        labelBn: "রাস্তা ও বাড়ির নম্বর ঠিকানা",
        placeholderEn: "Lot/House number, Street Name",
        placeholderBn: "বাড়ি নম্বর, ফ্ল্যাট বা রোডের বিবরণ দিন",
        type: "textarea",
        required: true
      }
    ];
  }

  // 5. Latin America Cash markets & National IDs (Mexico, Colombia, Peru, Chile, Argentina, Brazil, Ecuador, Guatemala, Bolivia, Costa Rica, Dominican Republic)
  const isLatinAmerica = ["Mexico", "Colombia", "Peru", "Chile", "Argentina", "Brazil", "Ecuador", "Guatemala", "Bolivia", "Costa Rica", "Dominican Republic"].includes(name);

  if (isLatinAmerica) {
    let taxLabelEn = "National ID / ID Number";
    let taxLabelBn = "জাতীয় পরিচয়পত্র নম্বর (DNI/National ID)";
    let taxPlaceholder = "Enter National ID number";
    
    if (name === "Brazil") {
      taxLabelEn = "CPF (Cadastro de Pessoas Físicas)";
      taxLabelBn = "সিপিএফ নম্বর (CPF)";
      taxPlaceholder = "000.000.000-00";
    } else if (name === "Chile") {
      taxLabelEn = "RUT Number";
      taxLabelBn = "রুট নম্বর (RUT)";
    } else if (name === "Mexico") {
      taxLabelEn = "RFC / CURP (ID Document)";
      taxLabelBn = "আরএফসি আইডি (RFC/CURP)";
    }

    return [
      coreName,
      corePhone,
      {
        key: "nationalId",
        labelEn: taxLabelEn,
        labelBn: taxLabelBn,
        placeholderEn: taxPlaceholder,
        placeholderBn: "ডেলিভারি বুকিংয়ের জন্য আইডি নম্বর দিন",
        type: "text",
        required: true
      },
      {
        key: "state",
        labelEn: "State / Department",
        labelBn: "রাজ্য / ডিপার্টমেন্ট (Departamento)",
        placeholderEn: "Enter state/department",
        placeholderBn: "স্টেট অথবা অঞ্চল দিন",
        type: "text",
        required: true
      },
      {
        key: "city",
        labelEn: "City",
        labelBn: "শহর (City)",
        placeholderEn: "Enter your city",
        placeholderBn: "শহরের নাম দিন",
        type: "text",
        required: true
      },
      {
        key: "postalCode",
        labelEn: "Postal Code",
        labelBn: "পোস্টাল কোড",
        placeholderEn: "ZIP/Postal Code",
        placeholderBn: "পোস্টাল কোড দিন",
        type: "text",
        required: true
      },
      {
        key: "address",
        labelEn: "Full Address",
        labelBn: "পূর্ণাঙ্গ ঠিকানা (Dirección)",
        placeholderEn: "Street name, House/Apartment number, Neighborhood",
        placeholderBn: "রাস্তা, বাড়ির নং, ফ্ল্যাট নং, এলাকা বিস্তারিত দিন",
        type: "textarea",
        required: true
      }
    ];
  }

  // 6. Europe & Email (Poland, Romania, Hungary, Greece, Czech Republic, Slovakia, Bulgaria, Croatia, Serbia, Ukraine, Lithuania, Latvia, Estonia, Cyprus, Turkey, Russia)
  const isEuropeOrCIS = ["Poland", "Romania", "Hungary", "Greece", "Czech Republic", "Slovakia", "Bulgaria", "Croatia", "Serbia", "Ukraine", "Lithuania", "Latvia", "Estonia", "Cyprus", "Turkey", "Russia"].includes(name);

  if (isEuropeOrCIS) {
    return [
      coreName,
      corePhone,
      {
        key: "email",
        labelEn: "Email Address (for order tracking)",
        labelBn: "ইমেইল এড্রেস",
        placeholderEn: "yourname@example.com",
        placeholderBn: "ইমেইল দিন (অর্ডার ট্র্যাকিংয়ের জন্য)",
        type: "email",
        required: true
      },
      {
        key: "city",
        labelEn: "City / Town",
        labelBn: "শহর (City)",
        placeholderEn: "Enter city name",
        placeholderBn: "আপনার শহরের নাম দিন",
        type: "text",
        required: true
      },
      {
        key: "postalCode",
        labelEn: "Postal / ZIP Code",
        labelBn: "পোস্টাল কোড (Postcode)",
        placeholderEn: "Postal Code",
        placeholderBn: "পোস্টাল জিপ কোড দিন",
        type: "text",
        required: true
      },
      {
        key: "address",
        labelEn: "Full Address / Parcel Locker Code (if applicable)",
        labelBn: "পূর্ণাঙ্গ ঠিকানা অথবা পার্সেল লকার কোড",
        placeholderEn: "Street, House No, Apartment or nearest Parcel Point Id",
        placeholderBn: "রাস্তা, হাউজ নং, ফ্ল্যাট বা নিকটস্থ পার্সেল লকার কোড দিন",
        type: "textarea",
        required: true
      }
    ];
  }

  // 7. Africa (Nigeria, Kenya, South Africa, Ghana, Uganda, Tanzania, Ivory Coast, Senegal, Ethiopia, Angola, Zimbabwe, Zambia)
  return [
    coreName,
    corePhone,
    {
      key: "state",
      labelEn: "State / County / Region",
      labelBn: "অঞ্চল বা প্রদেশ (Region / State)",
      placeholderEn: "Enter State/County",
      placeholderBn: "প্রদেশ বা রিজিয়ন লিখুন",
      type: "text",
      required: true
    },
    {
      key: "city",
      labelEn: "City / Town",
      labelBn: "শহর বা লোকালিটি",
      placeholderEn: "Enter City",
      placeholderBn: "আপনার শহর বা লোকালিটি নাম দিন",
      type: "text",
      required: true
    },
    {
      key: "address",
      labelEn: "Detailed Delivery Address & Landmark",
      labelBn: "পূর্ণাঙ্গ ডেলিভারী ঠিকানা এবং পরিচিত স্থান",
      placeholderEn: "StreetAddress, Block, nearest well-known Shop or Station",
      placeholderBn: "রাস্তা বা রোড, ব্লক এবং কাছাকাছি কোনো পরিচিত ল্যান্ডমার্ক দিন",
      type: "textarea",
      required: true
    }
  ];
}

export interface DeliveryConfig {
  deliveryLabelInside: string;
  deliveryLabelInsideBn: string;
  deliveryLabelOutside: string;
  deliveryLabelOutsideBn: string;
  deliveryChargeInside: number;
  deliveryChargeOutside: number;
}

export function getDefaultDeliveryConfig(countryName: string): DeliveryConfig {
  const country = getCountry(countryName);
  const name = country ? country.name : "Bangladesh";
  const currency = country ? country.currency : "BDT";

  if (name === "Bangladesh") {
    return {
      deliveryLabelInside: "Inside Dhaka",
      deliveryLabelInsideBn: "ঢাকার ভিতরে",
      deliveryLabelOutside: "Outside Dhaka",
      deliveryLabelOutsideBn: "ঢাকার বাইরে",
      deliveryChargeInside: 80,
      deliveryChargeOutside: 130
    };
  }

  // 1. India
  if (name === "India") {
    return {
      deliveryLabelInside: "Local Delivery",
      deliveryLabelInsideBn: "লোকাল ডেলিভারি",
      deliveryLabelOutside: "Outside State",
      deliveryLabelOutsideBn: "রাজ্যের বাইরে",
      deliveryChargeInside: 60,
      deliveryChargeOutside: 120
    };
  }

  // 2. Middle East / Gulf
  const isMiddleEast = ["Saudi Arabia", "United Arab Emirates (UAE)", "Qatar", "Oman", "Kuwait", "Bahrain", "Jordan", "Lebanon", "Iraq", "Egypt", "Morocco", "Tunisia", "Algeria"].includes(name);
  if (isMiddleEast) {
    const isGCC = ["Saudi Arabia", "United Arab Emirates (UAE)", "Qatar", "Oman", "Kuwait", "Bahrain"].includes(name);
    return {
      deliveryLabelInside: "Local Delivery",
      deliveryLabelInsideBn: "লোকাল ডেলিভারি",
      deliveryLabelOutside: "Outside City",
      deliveryLabelOutsideBn: "শহরের বাইরে",
      deliveryChargeInside: isGCC ? 15 : 25,
      deliveryChargeOutside: isGCC ? 25 : 45
    };
  }

  // 3. Pakistan
  if (name === "Pakistan") {
    return {
      deliveryLabelInside: "Local Delivery",
      deliveryLabelInsideBn: "লোকাল ডেলিভারি",
      deliveryLabelOutside: "Outside City",
      deliveryLabelOutsideBn: "শহরের বাইরে",
      deliveryChargeInside: 150,
      deliveryChargeOutside: 250
    };
  }

  // 4. Nepal
  if (name === "Nepal") {
    return {
      deliveryLabelInside: "Local Delivery",
      deliveryLabelInsideBn: "লোকাল ডেলিভারি",
      deliveryLabelOutside: "Outside Valley",
      deliveryLabelOutsideBn: "ভ্যালির বাইরে",
      deliveryChargeInside: 100,
      deliveryChargeOutside: 150
    };
  }

  // 5. Sri Lanka
  if (name === "Sri Lanka") {
    return {
      deliveryLabelInside: "Local Delivery",
      deliveryLabelInsideBn: "লোকাল ডেলিভারি",
      deliveryLabelOutside: "Outside District",
      deliveryLabelOutsideBn: "জেলার বাইরে",
      deliveryChargeInside: 300,
      deliveryChargeOutside: 500
    };
  }

  // General fallback by currency
  let chargeInside = 10;
  let chargeOutside = 20;

  if (currency === "USD" || currency === "EUR" || currency === "GBP" || currency === "CAD" || currency === "AUD") {
    chargeInside = 5;
    chargeOutside = 10;
  } else if (currency === "BRL" || currency === "MXN" || currency === "ZAR") {
    chargeInside = 40;
    chargeOutside = 80;
  } else if (currency === "RUB" || currency === "UAH") {
    chargeInside = 250;
    chargeOutside = 450;
  } else if (currency === "IDR" || currency === "VND" || currency === "KHR") {
    chargeInside = 15000;
    chargeOutside = 30000;
  } else if (currency === "THB" || currency === "PHP" || currency === "MYR") {
    chargeInside = 40;
    chargeOutside = 80;
  }

  return {
    deliveryLabelInside: "Local Delivery",
    deliveryLabelInsideBn: "লোকাল ডেলিভারি",
    deliveryLabelOutside: "Outside City / Region",
    deliveryLabelOutsideBn: "শহর বা অঞ্চলের বাইরে",
    deliveryChargeInside: chargeInside,
    deliveryChargeOutside: chargeOutside
  };
}
