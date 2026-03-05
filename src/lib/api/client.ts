// Client-side API utilities

import { Deal } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export interface DealsResponse {
  success: boolean;
  deals: Deal[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  meta: {
    lastUpdated: string;
    sources: string[];
    stats: {
      totalDeals: number;
      avgSavings: number;
      hotDeals: number;
    };
  };
}

export interface StatsResponse {
  success: boolean;
  stats: {
    totalDeals: number;
    avgSavings: number;
    hotDeals: number;
    updatedAt: string;
    sources: string[];
    sourceBreakdown: Record<string, number>;
  };
}

export interface DealFilters {
  type?: string;
  destination?: string;
  origin?: string;
  maxPrice?: number;
  minValueScore?: number;
  hot?: boolean;
  limit?: number;
  offset?: number;
}

// Fetch deals with optional filters
export async function fetchDeals(filters: DealFilters = {}): Promise<DealsResponse> {
  const params = new URLSearchParams();
  
  if (filters.type) params.set('type', filters.type);
  if (filters.destination) params.set('destination', filters.destination);
  if (filters.origin) params.set('origin', filters.origin);
  if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
  if (filters.minValueScore) params.set('minValueScore', String(filters.minValueScore));
  if (filters.hot) params.set('hot', 'true');
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.offset) params.set('offset', String(filters.offset));
  
  const url = `${API_BASE}/api/deals${params.toString() ? '?' + params.toString() : ''}`;
  
  const response = await fetch(url, {
    next: { revalidate: 300 }, // Cache for 5 minutes
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch deals: ${response.status}`);
  }
  
  return response.json();
}

// Fetch a single deal by ID
export async function fetchDeal(id: string): Promise<{ success: boolean; deal: Deal }> {
  const response = await fetch(`${API_BASE}/api/deals/${id}`, {
    next: { revalidate: 300 },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch deal: ${response.status}`);
  }
  
  return response.json();
}

// Fetch deals for a specific city
export async function fetchCityDeals(slug: string): Promise<{ success: boolean; deals: Deal[]; total: number }> {
  const response = await fetch(`${API_BASE}/api/cities/${slug}/deals`, {
    next: { revalidate: 300 },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch city deals: ${response.status}`);
  }
  
  return response.json();
}

// Fetch stats
export async function fetchStats(): Promise<StatsResponse> {
  const response = await fetch(`${API_BASE}/api/stats`, {
    next: { revalidate: 60 }, // Cache for 1 minute
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch stats: ${response.status}`);
  }
  
  return response.json();
}

// Trigger manual refresh (requires auth)
export async function triggerRefresh(secret: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/api/deals`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secret}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to refresh deals: ${response.status}`);
  }
  
  return response.json();
}

// Format relative time for "last updated" display
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
