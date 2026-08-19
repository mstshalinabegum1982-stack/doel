export interface LandingPageData {
  id: string;
  storeName: string;
  userId?: string;
  logo?: string;
  productId?: string;
  productDetails?: {
    title: string;
    price: number;
    offerPrice?: number;
    discount?: number;
    image?: string;
    gallery?: string[];
  };
  theme?: string;
  country?: string;
  createdAt?: any;
}

export interface ProWebsiteData {
  id: string;
  slug: string;
  brandName: string;
  userId?: string;
  dragonBotEnabled?: boolean;
  isStarEnabled?: boolean;
  logo?: string;
  bannerImage?: string;
  coverImage?: string;
  heroImage?: string;
  catalog?: any[];
  colors?: {
    theme: string;
  };
  defaultCountry?: string;
  createdAt?: any;
  paymentStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  paymentPhone?: string;
  paymentTrxId?: string;
  paymentSubmittedAt?: string;
  paymentApprovedAt?: string;
  selectedPlan?: '1_month' | '3_months' | '6_months' | '1_year';
  activeUntil?: string;
  botPaymentStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  botSelectedPlan?: '1_month' | '3_months';
  botExpiryTime?: string;
}

export interface CustomDeliveryCharge {
  area: string;
  charge: number;
  subAreas?: string[];
}

export interface StoreCategory {
  id: string;
  name: string;
  imageUrl?: string;
}

export interface CatalogSubscription {
  paymentStatus: 'none' | 'trial' | 'pending' | 'approved' | 'rejected';
  selectedPlan: '1_month' | '3_months' | '6_months' | '1_year';
  selectedCurrency?: 'BDT' | 'USD';
  activeUntil: string;
  trialExpiresAt: string;
  paymentPhone?: string;
  paymentTrxId?: string;
}

export interface UserProfile {
  country?: string;
  currency?: string;
  [key: string]: any;
}
