import { Deal, DealFilters, SortOption } from "./types";

/**
 * Calculate Value Score based on multiple factors
 * Score ranges from 0-100, higher is better
 */
export function calculateValueScore(deal: {
  currentPrice: number;
  originalPrice: number;
  historicalAvgPrice?: number;
  isHistoricLow?: boolean;
  daysUntilExpiry?: number;
  popularity?: number;
}): number {
  let score = 50; // Base score
  
  // Savings factor (0-30 points)
  const savingsPercent = ((deal.originalPrice - deal.currentPrice) / deal.originalPrice) * 100;
  score += Math.min(savingsPercent * 0.6, 30);
  
  // Historical comparison (0-20 points)
  if (deal.historicalAvgPrice) {
    const vsHistorical = ((deal.historicalAvgPrice - deal.currentPrice) / deal.historicalAvgPrice) * 100;
    score += Math.min(Math.max(vsHistorical * 0.4, 0), 20);
  }
  
  // Historic low bonus (10 points)
  if (deal.isHistoricLow) {
    score += 10;
  }
  
  // Urgency factor (0-5 points) - deals expiring soon get slight boost
  if (deal.daysUntilExpiry && deal.daysUntilExpiry <= 3) {
    score += 5;
  }
  
  // Popularity validation (0-5 points)
  if (deal.popularity && deal.popularity > 1000) {
    score += Math.min(deal.popularity / 5000, 5);
  }
  
  return Math.min(Math.round(score), 100);
}

/**
 * Get color class based on Value Score
 */
export function getValueScoreColor(score: number): string {
  if (score >= 90) return "bg-emerald-500";
  if (score >= 80) return "bg-green-500";
  if (score >= 70) return "bg-lime-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-gray-500";
}

/**
 * Get Value Score label
 */
export function getValueScoreLabel(score: number): string {
  if (score >= 95) return "Incredible Value";
  if (score >= 90) return "Exceptional";
  if (score >= 80) return "Great Value";
  if (score >= 70) return "Good Value";
  if (score >= 60) return "Fair Value";
  if (score >= 50) return "Average";
  return "Below Average";
}

/**
 * Filter deals based on criteria
 */
export function filterDeals(deals: Deal[], filters: DealFilters): Deal[] {
  return deals.filter(deal => {
    // Type filter
    if (filters.types && filters.types.length > 0 && !filters.types.includes(deal.type)) {
      return false;
    }
    
    // Origin city filter
    if (filters.originCity && deal.originCity?.toLowerCase() !== filters.originCity.toLowerCase()) {
      return false;
    }
    
    // Destination city filter
    if (filters.destinationCity && deal.destinationCity.toLowerCase() !== filters.destinationCity.toLowerCase()) {
      return false;
    }
    
    // Max price filter
    if (filters.maxPrice && deal.currentPrice > filters.maxPrice) {
      return false;
    }
    
    // Min value score filter
    if (filters.minValueScore && deal.valueScore < filters.minValueScore) {
      return false;
    }
    
    // Date filters
    if (filters.departureAfter && deal.departureDate && deal.departureDate < filters.departureAfter) {
      return false;
    }
    if (filters.departureBefore && deal.departureDate && deal.departureDate > filters.departureBefore) {
      return false;
    }
    
    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag => deal.tags.includes(tag));
      if (!hasMatchingTag) return false;
    }
    
    return true;
  });
}

/**
 * Sort deals based on sort option
 */
export function sortDeals(deals: Deal[], sortBy: SortOption): Deal[] {
  const sorted = [...deals];
  
  switch (sortBy) {
    case "newest":
      return sorted.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
    case "price-low":
      return sorted.sort((a, b) => a.currentPrice - b.currentPrice);
    case "price-high":
      return sorted.sort((a, b) => b.currentPrice - a.currentPrice);
    case "value-score":
      return sorted.sort((a, b) => b.valueScore - a.valueScore);
    case "savings":
      return sorted.sort((a, b) => b.savingsPercent - a.savingsPercent);
    case "expiring-soon":
      return sorted.sort((a, b) => {
        if (a.isExpiringSoon && !b.isExpiringSoon) return -1;
        if (!a.isExpiringSoon && b.isExpiringSoon) return 1;
        return new Date(a.bookByDate).getTime() - new Date(b.bookByDate).getTime();
      });
    case "popularity":
      return sorted.sort((a, b) => (b.views + b.saves * 3) - (a.views + a.saves * 3));
    default:
      return sorted;
  }
}

/**
 * Format price with currency
 */
export function formatPrice(price: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Get time ago string
 */
export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

/**
 * Generate slug from city name
 */
export function generateSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/**
 * Search deals by query
 */
export function searchDeals(deals: Deal[], query: string): Deal[] {
  if (!query.trim()) return deals;
  
  const searchTerms = query.toLowerCase().split(/\s+/);
  
  return deals.filter(deal => {
    const searchText = [
      deal.title,
      deal.description,
      deal.originCity,
      deal.destinationCity,
      deal.airline,
      deal.hotel,
      ...deal.tags,
    ].filter(Boolean).join(" ").toLowerCase();
    
    return searchTerms.every(term => searchText.includes(term));
  });
}
