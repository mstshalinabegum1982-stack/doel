export interface InventoryItem {
  id: string;
  name: string;
  sellPrice?: number;
  landingPrice?: number;
  buyPrice?: number;
  image?: string;
  images?: string[];
  color?: string;
  size?: string;
  weight?: string;
  details?: string;
  hasWarranty?: boolean;
  warrantyDuration?: string;
  hasReplacement?: boolean;
  replacementDuration?: string;
  videoUrl?: string;
  isPublic?: boolean;
  category?: string;
}

export interface LandingPageData {
  id: string;
  userId: string;
  storeName: string;
  logo?: string;
  productId?: string;
  videoUrl?: string;
  productDetails?: {
    title: string;
    details?: string;
    price: number;
    offerPrice: number;
    discount?: number;
    colors?: string[];
    sizes?: string[];
    weight?: string;
    warranty?: boolean;
    guarantee?: boolean;
    hasWarranty?: boolean;
    warrantyDuration?: string;
    hasReplacement?: boolean;
    replacementDuration?: string;
    offerDuration?: number;
  };
  deliveryCharges?: {
    inside: number;
    outside: number;
    insideLabel?: string;
    outsideLabel?: string;
    qtyBasedEnabled?: boolean;
    incrementPerQty?: number;
  };
  paymentSettings?: {
    cod?: boolean;
    advance?: boolean;
  };
  shortDetails?: string;
  theme?: 'light' | 'dark' | 'galaxy' | 'bubble' | 'cinematic';
  headerBg?: 'black' | 'white';
  bodyBg?: 'black' | 'white';
  footerBg?: 'black' | 'white';
  buttonBg?: string;
  buttonTextColor?: string;
  extraImages?: string[];
  messagingChannel?: string;
  messagingNumber?: string;
  email?: string;
  socialLinks?: {
    youtube?: string;
    tiktok?: string;
    fbPage?: string;
    instagram?: string;
  };
  country?: string;
  language?: string;
  requireLocationTracking?: boolean;
  dragonBotEnabled?: boolean;
  botPaymentStatus?: 'pending' | 'approved' | 'rejected' | 'none';
  botSelectedPlan?: '1_month' | '3_months';
  botExpiryTime?: string;
  botPaymentPhone?: string;
  botPaymentTrxId?: string;
  botPaymentSubmittedAt?: string;
  paymentStatus?: 'none' | 'pending' | 'approved' | 'trial' | 'rejected';
  status?: string;
  trialExpiresAt?: string;
  customDomain?: string;
  domainVerificationStatus?: 'pending' | 'verified' | 'failed';
  customDeliveryCharges?: { area: string; charge: number }[];
  orderCartConfig?: {
    currencySymbol: string;
    paymentMethods: string[];
    checkoutFields: string[];
  };
  tracking?: {
    facebook?: string;
    tiktok?: string;
    gtm?: string;
    clarity?: string;
    ga4?: string;
  };
  createdAt?: any;
  updatedAt?: any;
  views?: number;
  orders?: number;
}

export interface LandingPageFormData {
  storeName: string;
  logo: string;
  productId: string;
  videoUrl: string;
  productDetails: {
    title: string;
    details: string;
    price: number;
    offerPrice: number;
    discount: number;
    colors: string[];
    sizes: string[];
    weight: string;
    warranty: boolean;
    guarantee: boolean;
    offerDuration: number;
  };
  deliveryCharges: {
    inside: number;
    outside: number;
    insideLabel: string;
    outsideLabel: string;
    qtyBasedEnabled: boolean;
    incrementPerQty: number;
  };
  paymentSettings: {
    cod: boolean;
    advance: boolean;
  };
  shortDetails: string;
  theme: 'light' | 'dark' | 'galaxy' | 'bubble' | 'cinematic';
  headerBg: 'black' | 'white';
  bodyBg: 'black' | 'white';
  footerBg: 'black' | 'white';
  buttonBg: string;
  buttonTextColor: string;
  extraImages: string[];
  messagingChannel: string;
  messagingNumber: string;
  email: string;
  socialLinks: {
    youtube: string;
    tiktok: string;
    fbPage: string;
    instagram: string;
  };
  country: string;
  language: string;
  requireLocationTracking: boolean;
  dragonBotEnabled: boolean;
  orderCartConfig: {
    currencySymbol: string;
    paymentMethods: string[];
    checkoutFields: string[];
  };
  customDeliveryCharges: { area: string; charge: number }[];
  tracking: {
    facebook: string;
    tiktok: string;
    gtm: string;
    clarity?: string;
    ga4: string;
  };
}
