import { checkIsAdmin } from './lib/adminConfig';

export interface InventoryItem {
  id: string;
  userId: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
  landingPrice?: number;
  proPrice?: number;
  skuCode?: string;
  supplierId?: string;
  supplierName?: string;
  stock: number;
  isUnlimitedStock?: boolean;
  image?: string;
  images?: string[];
  details?: string;
  color?: string;
  size?: string;
  weight?: string;
  automationEnabled?: boolean;
  fbKeywords?: string;
  replyTemplate?: string;
  igAutomationEnabled?: boolean;
  igKeywords?: string;
  igReplyTemplate?: string;
  waAutomationEnabled?: boolean;
  waKeywords?: string;
  waReplyTemplate?: string;
  tgAutomationEnabled?: boolean;
  tgKeywords?: string;
  tgReplyTemplate?: string;
  wechatAutomationEnabled?: boolean;
  wechatKeywords?: string;
  wechatReplyTemplate?: string;
  viberAutomationEnabled?: boolean;
  viberKeywords?: string;
  viberReplyTemplate?: string;
  lineAutomationEnabled?: boolean;
  lineKeywords?: string;
  lineReplyTemplate?: string;
  tiktokAutomationEnabled?: boolean;
  tiktokKeywords?: string;
  tiktokReplyTemplate?: string;
  category?: string;
  discount?: number;
  isPublic?: boolean;
  dragonBotEnabled?: boolean;
  hasWarranty?: boolean;
  warrantyDuration?: string;
  hasReplacement?: boolean;
  replacementDuration?: string;
  aiKnowledge?: string;
  videoUrl?: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  id?: string;
  name: string;
  phone: string;
  email: string;
  country: string;
  address?: string;
  profileImage?: string;
  storeName?: string;
  businessName?: string;
  businessDescription?: string;
  role?: string;
  coverImage?: string;
  createdAt: string;
  lastActive?: string;
  dragonBotEnabled?: boolean;
  globalBotActive?: boolean;
  isAdmin?: boolean;
  socialLinks?: {
    facebook?: string;
    tiktok?: string;
    whatsapp?: string;
    website?: string;
  };
  stats?: {
    ordersSent: number;
    ordersReceived: number;
    aiUsageCount: number;
  };
  subscriptions?: {
    [planId: string]: {
      status: 'free_tier' | 'pending' | 'active' | 'expired';
      activatedAt?: string;
      expiresAt?: string;
      requestedAt?: string;
      paymentMethod?: string;
      senderAccount?: string;
      transactionId?: string;
      isDragonBotOption?: boolean;
      priceApplied?: number;
      dragonBotStatus?: string;
      dragonBotPaymentMethod?: string;
      dragonBotSenderAccount?: string;
      dragonBotTransactionId?: string;
      dragonBotPriceApplied?: number;
    };
  };
}

export interface SaasPlan {
  id: string;
  name: string;
  priceText: string;
  price: number;
  freeDays: number;
  duration: string;
  description: string;
  requiresDragonOption?: boolean;
  dragonOptionText?: string;
  dragonOptionPriceAdd?: number;
}

export const SAAS_PLANS: SaasPlan[] = [
  {
    id: "messenger_cart",
    name: "Messenger Order Cart",
    price: 200,
    freeDays: 10,
    duration: "1 Month",
    priceText: "৳200 / 1 Month",
    description: "1-month package to select products directly in Messenger and use the cart. 10 days of usage absolutely free!"
  },
  {
    id: "my_catalog",
    name: "My Catalog",
    price: 500,
    freeDays: 7,
    duration: "Monthly",
    priceText: "৳500 / Month",
    description: "Digital catalog display and management service for your products. Includes a 7-day free trial."
  },
  {
    id: "landing_pages",
    name: "Landing Pages",
    price: 2000,
    freeDays: 7,
    duration: "1 Year",
    priceText: "৳2000 / Year",
    description: "Attractive sales landing page creation and hosting. (Note: +৳1000/month if DOEL messenger automation is activated)",
    requiresDragonOption: true,
    dragonOptionText: "Activate DOEL messenger chat automation (+৳1000/month)",
    dragonOptionPriceAdd: 1000
  },
  {
    id: "public_website",
    name: "Public Pro Website",
    price: 1000,
    freeDays: 7,
    duration: "Monthly",
    priceText: "৳1000 / Month",
    description: "Modern public website for your business. (Note: +৳2500/month, total ৳3500/month if Dragon automation messenger bot is activated)",
    requiresDragonOption: true,
    dragonOptionText: "Turn on Dragon's automation messenger bot (+৳2500, total ৳3500/month)",
    dragonOptionPriceAdd: 2500
  },
  {
    id: "fb_reply",
    name: "Facebook Reply Automation",
    price: 500,
    freeDays: 3,
    duration: "Monthly",
    priceText: "৳500 / Month",
    description: "Automated comment & post replies on Facebook. Includes a 3-day free tier."
  },
  {
    id: "fb_messenger_reply",
    name: "Facebook Messenger Page Reply",
    price: 1000,
    freeDays: 3,
    duration: "Monthly",
    priceText: "৳1000 / Month",
    description: "Fast automated replies for customer inboxes on each of your Facebook pages. Includes a 3-day free tier."
  },
  {
    id: "ig_messenger",
    name: "Instagram Messenger Reply",
    price: 1000,
    freeDays: 3,
    duration: "Monthly",
    priceText: "৳1000 / Month",
    description: "Automated replies in Instagram direct messages. Includes a 3-day free tier."
  },
  {
    id: "wa_reply",
    name: "WhatsApp Reply Automation",
    price: 1500,
    freeDays: 3,
    duration: "Monthly",
    priceText: "৳1500 / Month",
    description: "Fast and accurate automated replies in WhatsApp messages. Includes a 3-day free tier."
  },
  {
    id: "other_messengers",
    name: "Telegram, WeChat, Viber & LINE Automation",
    price: 1000,
    freeDays: 3,
    duration: "Monthly",
    priceText: "৳1000 / Month (all combined)",
    description: "Automatic reply features for Telegram, WeChat, Viber, and LINE combined. Includes a 3-day free tier."
  },
  {
    id: "location_link",
    name: "Inventory Location Link Page",
    price: 500,
    freeDays: 7,
    duration: "Monthly",
    priceText: "৳500 / Month",
    description: "Usage of inventory location tracking links. Includes a 7-day free tier."
  }
];

export interface ChatThread {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  updatedAt: string;
  // UI helper fields
  otherUser?: UserProfile;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text?: string;
  image?: string;
  type: 'text' | 'image' | 'order' | 'payment_request' | 'deleted' | 'call' | 'voice';
  orderId?: string;
  createdAt: string;
  replyToId?: string;
  replyToText?: string;
  voiceUrl?: string;
  voiceDuration?: number;
  paymentData?: any;
  status?: 'sent' | 'delivered' | 'seen';
  deliveredAt?: string;
  seenAt?: string;
}

export interface Order {
  id: string;
  senderId: string;
  receiverId: string;
  participants?: string[];
  productImage?: string;
  productName: string;
  buyPrice: number;
  sellPrice: number;
  skuCode?: string;
  deliveryCharge: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  size?: string;
  color?: string;
  weight?: string;
  quantity?: number;
  productImages?: string[];
  status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'paid' | 'return' | 'fraud_return' | 'deleted' | 'cancelled' | 'paid_delivery' | 'paid_return';
  isForwarded?: boolean;
  forwardedToId?: string;
  forwardedToName?: string;
  forwardedFromId?: string;
  forwardedFromName?: string;
  courierName?: string;
  courierTrackingId?: string;
  courierNote?: string;
  deliveryManName?: string;
  deliveryManPhone?: string;
  deliveryManAssigned?: boolean;
  latitude?: number;
  longitude?: number;
  gpsAddress?: string;
  trackingMethod?: 'manual' | 'gps';
  platform?: 'internal' | 'facebook' | 'whatsapp' | 'tiktok' | 'viber' | 'telegram' | 'line' | 'wechat' | 'website' | 'landing_page';
  platformId?: string; // page id, account id, or slug
  platformName?: string; // page name, brand name
  pageId?: string;
  websiteId?: string;
  siteId?: string;
  landingPageId?: string;
  storeName?: string;
  details?: string;
  fraudToken?: string;
  items?: any[];
  createdAt: string;
}

export interface ProWebsite {
  id: string;
  userId: string;
  slug: string;
  brandName: string;
  websiteId?: string;
  websiteName?: string;
  siteTitle?: string;
  storeName?: string;
  title?: string;
  requireLocationTracking?: boolean;
  dragonBotEnabled?: boolean;
  isStarEnabled?: boolean;
  logo?: string;
  deliveryChargeInside?: number;
  deliveryChargeOutside?: number;
  deliveryLabelInside?: string;
  deliveryLabelOutside?: string;
  deliveryQtyBasedEnabled?: boolean;
  deliveryIncrementPerQty?: number;
  customDeliveryCharges?: { area: string; charge: number }[];
  covers: { url: string; link: string }[];
  featureTitle: string;
  description: string;
  categories: { id: string; name: string; image?: string }[];
  catalog: {
    id: string;
    name: string;
    price: number;
    comparePrice?: number;
    image: string;
    categoryId: string;
  }[];
  colors: {
    theme: string;
    title: string;
    storeNameColor?: string;
    description: string;
    price: string;
    discount: string;
    button: string;
    buttonText: string;
    headerBg?: 'black' | 'white';
    bodyBg?: 'black' | 'white';
    footerBg?: 'black' | 'white';
  };
  tracking: {
    facebook?: string;
    tiktok?: string;
    gtm?: string;
    clarity?: string;
    ga4?: string;
    hotjar?: string;
    conversionApi?: string;
  };
  footer: {
    whatsapp: string;
    email: string;
    about: string;
    help: string;
    service: string;
    support1Title?: string;
    support1Content?: string;
    support2Title?: string;
    support2Content?: string;
    support3Title?: string;
    support3Content?: string;
    help1Title?: string;
    help1Content?: string;
    help2Title?: string;
    help2Content?: string;
    help3Title?: string;
    help3Content?: string;
  };
  social: {
    tiktok?: string;
    facebook?: string;
    whatsapp?: string;
    youtube?: string;
    instagram?: string;
    linkedin?: string;
    x?: string;
    threads?: string;
  };
  coupons?: {
    code: string;
    description: string;
    discountType: 'percent' | 'flat';
    value: number;
    active: boolean;
  }[];
  marketingLinks?: {
    id: string;
    name: string;
    url: string;
    utmSource: string;
    clicks: number;
  }[];
  isPublic: boolean;
  defaultCountry?: string;
  language?: string;
  customDomain?: {
    domainName: string;
    isPrimary: boolean;
    dnsType: 'A' | 'CNAME';
    dnsValue: string;
    sslStatus: 'pending' | 'active' | 'failed';
    configuredAt?: string;
  };
  createdAt: string;
  updatedAt?: string;
  paymentStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  paymentPhone?: string;
  paymentTrxId?: string;
  paymentSubmittedAt?: string;
  paymentApprovedAt?: string;
  selectedPlan?: '1_month' | '3_months' | '6_months' | '1_year';
  activeUntil?: string;
  botPaymentStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  botSelectedPlan?: '1_month' | '3_months';
  botPaymentPhone?: string;
  botPaymentTrxId?: string;
  botPaymentSubmittedAt?: string;
  botPaymentApprovedAt?: string;
  botExpiryTime?: string;
}

export function isPlanActive(profile: any, planId: string): boolean {
  if (!profile) return false;

  // 1. Admin gets automatic testing access to everything
  if (checkIsAdmin(null, profile)) {
    return true;
  }

  // Find the plan details
  const plan = SAAS_PLANS.find(p => p.id === planId);
  const freeDays = plan ? plan.freeDays : 3;

  // 2. Is it explicitly approved and active by the admin?
  const sub = profile.subscriptions?.[planId];
  if (sub && sub.status === 'active') {
    if (sub.expiresAt) {
      return new Date().getTime() < new Date(sub.expiresAt).getTime();
    }
    return true; // Approved and active indefinitely
  }

  // 3. Otherwise, check if user is within the Free Tier period from account creation
  if (profile.createdAt) {
    const createdTime = new Date(profile.createdAt).getTime();
    if (!isNaN(createdTime)) {
      const freeTierMs = freeDays * 24 * 60 * 60 * 1000;
      const expiresTime = createdTime + freeTierMs;
      return new Date().getTime() < expiresTime;
    }
  }

  return false;
}
