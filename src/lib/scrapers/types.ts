// Scraper types

export type ScraperSource = 'secretflying' | 'theflightdeal' | 'travelpirates' | 'airfarewatchdog' | 'skiplagged' | 'cruisecritic' | 'travelzoo';

export interface ScrapedDeal {
  id: string;
  source: ScraperSource;
  title: string;
  origin: string;
  originCode?: string;
  destination: string;
  destinationCode?: string;
  price: number;
  originalPrice: number;
  currency: string;
  originalUrl: string;
  imageUrl?: string;
  postedAt: Date;
  scrapedAt: Date;
  isRoundtrip: boolean;
  airline?: string;
  valueScore: number;
  savingsPercent: number;
  isHotDeal: boolean;
  description?: string;
  tags: string[];
}

export interface ScrapeResult {
  deals: ScrapedDeal[];
  source: ScraperSource;
  fetchedAt: Date;
  error?: string;
}
