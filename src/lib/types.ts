// Travel Deals Type Definitions

export type DealType = "flight" | "hotel" | "package" | "cruise";
export type DealStatus = "active" | "expired" | "archived";

export interface Deal {
  id: string;
  type: DealType;
  title: string;
  description: string;
  
  // Pricing
  originalPrice: number;
  currentPrice: number;
  currency: string;
  savingsPercent: number;
  
  // Value Score (1-100)
  valueScore: number;
  
  // Locations
  originCity?: string;
  originCode?: string;
  destinationCity: string;
  destinationCode?: string;
  
  // Dates
  departureDate?: string;
  returnDate?: string;
  bookByDate: string;
  travelWindow?: string;
  
  // Details
  airline?: string;
  hotel?: string;
  nights?: number;
  includes?: string[];
  restrictions?: string[];
  
  // Media
  imageUrl: string;
  
  // Booking
  bookingUrl: string;
  source: string;
  
  // Meta
  postedAt: string;
  updatedAt: string;
  views: number;
  saves: number;
  
  // Tags
  tags: string[];
  isHotDeal: boolean;
  isExpiringSoon: boolean;
  isHistoricLow: boolean;
  
  // Status & Archive
  status?: DealStatus;
  expiredAt?: string;
  archivedAt?: string;
  
  // Freshness tracking
  scrapedAt?: string;      // when we found it (ISO timestamp)
  firstSeenAt?: string;    // first time we saw this deal
  lastSeenAt?: string;     // last time it appeared in scrape
  isActive?: boolean;      // still showing in source (not stale)
  dealSignature?: string;  // unique signature for deduplication
}

export interface City {
  code: string;
  name: string;
  country: string;
  imageUrl: string;
  dealCount: number;
  avgSavings: number;
  slug?: string;
}

export interface DealFilters {
  types?: DealType[];
  originCity?: string;
  destinationCity?: string;
  maxPrice?: number;
  minValueScore?: number;
  departureAfter?: string;
  departureBefore?: string;
  tags?: string[];
}

export type SortOption = 
  | "newest"
  | "price-low"
  | "price-high"
  | "value-score"
  | "savings"
  | "expiring-soon"
  | "popularity";

export interface PriceHistory {
  date: string;
  price: number;
}

export interface DealWithHistory extends Deal {
  priceHistory: PriceHistory[];
  avgPrice: number;
  lowestPrice: number;
  highestPrice: number;
}
