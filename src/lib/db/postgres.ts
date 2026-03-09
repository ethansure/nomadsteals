// Postgres client for NomadSteals
// Uses @vercel/postgres for seamless Vercel + Supabase integration

import { sql } from '@vercel/postgres';
import { Deal, DealStatus, DealType } from '../types';

// Initialize database schema
export async function initSchema(): Promise<void> {
  // Create deals table
  await sql`
    CREATE TABLE IF NOT EXISTS deals (
      id VARCHAR(255) PRIMARY KEY,
      deal_signature VARCHAR(512) UNIQUE,
      type VARCHAR(50) DEFAULT 'flight',
      title TEXT NOT NULL,
      description TEXT,
      original_price INTEGER,
      current_price INTEGER NOT NULL,
      currency VARCHAR(10) DEFAULT 'USD',
      savings_percent INTEGER,
      value_score INTEGER DEFAULT 50,
      origin_city VARCHAR(255),
      origin_code VARCHAR(10),
      destination_city VARCHAR(255) NOT NULL,
      destination_code VARCHAR(10),
      departure_date DATE,
      return_date DATE,
      book_by_date DATE,
      travel_window VARCHAR(100),
      airline VARCHAR(100),
      booking_url TEXT,
      image_url TEXT,
      source VARCHAR(100) NOT NULL,
      includes JSONB DEFAULT '[]',
      restrictions JSONB DEFAULT '[]',
      tags JSONB DEFAULT '[]',
      is_hot_deal BOOLEAN DEFAULT FALSE,
      is_expiring_soon BOOLEAN DEFAULT FALSE,
      is_historic_low BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      status VARCHAR(20) DEFAULT 'active',
      posted_at TIMESTAMP WITH TIME ZONE,
      scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      expired_at TIMESTAMP WITH TIME ZONE,
      archived_at TIMESTAMP WITH TIME ZONE,
      views INTEGER DEFAULT 0,
      saves INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  // Create indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_deals_value_score ON deals(value_score DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_deals_is_active ON deals(is_active)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_deals_scraped_at ON deals(scraped_at DESC)`;

  // Create stats table
  await sql`
    CREATE TABLE IF NOT EXISTS deal_stats (
      id SERIAL PRIMARY KEY,
      total_deals INTEGER DEFAULT 0,
      active_deals INTEGER DEFAULT 0,
      hot_deals INTEGER DEFAULT 0,
      avg_savings INTEGER DEFAULT 0,
      source_breakdown JSONB DEFAULT '{}',
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  // Insert initial stats row
  await sql`INSERT INTO deal_stats (id, total_deals) VALUES (1, 0) ON CONFLICT (id) DO NOTHING`;

  console.log('[Postgres] Schema initialized');
}

// Convert database row to Deal object
function rowToDeal(row: Record<string, unknown>): Deal {
  return {
    id: row.id as string,
    dealSignature: row.deal_signature as string | undefined,
    type: ((row.type as string) || 'flight') as DealType,
    title: row.title as string,
    description: (row.description as string) || '',
    originalPrice: row.original_price as number,
    currentPrice: row.current_price as number,
    currency: (row.currency as string) || 'USD',
    savingsPercent: row.savings_percent as number,
    valueScore: row.value_score as number,
    originCity: row.origin_city as string | undefined,
    originCode: row.origin_code as string | undefined,
    destinationCity: row.destination_city as string,
    destinationCode: row.destination_code as string | undefined,
    departureDate: row.departure_date as string | undefined,
    returnDate: row.return_date as string | undefined,
    bookByDate: row.book_by_date as string,
    travelWindow: row.travel_window as string | undefined,
    airline: row.airline as string | undefined,
    bookingUrl: row.booking_url as string,
    imageUrl: (row.image_url as string) || '',
    source: row.source as string,
    includes: (row.includes as string[]) || [],
    restrictions: (row.restrictions as string[]) || [],
    tags: (row.tags as string[]) || [],
    isHotDeal: (row.is_hot_deal as boolean) || false,
    isExpiringSoon: (row.is_expiring_soon as boolean) || false,
    isHistoricLow: (row.is_historic_low as boolean) || false,
    isActive: row.is_active as boolean,
    status: row.status as DealStatus,
    postedAt: row.posted_at ? new Date(row.posted_at as string).toISOString() : new Date().toISOString(),
    scrapedAt: row.scraped_at ? new Date(row.scraped_at as string).toISOString() : undefined,
    firstSeenAt: row.first_seen_at ? new Date(row.first_seen_at as string).toISOString() : undefined,
    lastSeenAt: row.last_seen_at ? new Date(row.last_seen_at as string).toISOString() : undefined,
    expiredAt: row.expired_at ? new Date(row.expired_at as string).toISOString() : undefined,
    archivedAt: row.archived_at ? new Date(row.archived_at as string).toISOString() : undefined,
    views: (row.views as number) || 0,
    saves: (row.saves as number) || 0,
    updatedAt: row.updated_at ? new Date(row.updated_at as string).toISOString() : new Date().toISOString(),
  };
}

// Get all active deals
export async function getDeals(): Promise<Deal[]> {
  const { rows } = await sql`
    SELECT * FROM deals 
    WHERE is_active = true AND status = 'active'
    ORDER BY value_score DESC
    LIMIT 100
  `;
  return rows.map(row => rowToDeal(row as Record<string, unknown>));
}

// Get top deals by value score (for KV cache)
export async function getTopDeals(limit: number = 50): Promise<Deal[]> {
  const { rows } = await sql`
    SELECT * FROM deals 
    WHERE is_active = true AND status = 'active'
    ORDER BY value_score DESC
    LIMIT ${limit}
  `;
  return rows.map(row => rowToDeal(row as Record<string, unknown>));
}

// Get all deals including archived
export async function getAllDeals(): Promise<Deal[]> {
  const { rows } = await sql`SELECT * FROM deals ORDER BY value_score DESC`;
  return rows.map(row => rowToDeal(row as Record<string, unknown>));
}

// Get filtered deals with pagination
export async function getFilteredDeals(filters: {
  type?: string;
  destination?: string;
  origin?: string;
  maxPrice?: number;
  minValueScore?: number;
  isHotDeal?: boolean;
  status?: DealStatus | 'all';
  days?: number;
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ deals: Deal[]; total: number }> {
  const limit = filters.limit || 20;
  const offset = filters.offset || 0;
  
  let result;
  let countResult;
  
  if (filters.status === 'all') {
    result = await sql`
      SELECT * FROM deals 
      ORDER BY value_score DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    countResult = await sql`SELECT COUNT(*) as count FROM deals`;
  } else if (filters.status === 'expired' || filters.status === 'archived') {
    result = await sql`
      SELECT * FROM deals 
      WHERE status = ${filters.status}
      ORDER BY value_score DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    countResult = await sql`SELECT COUNT(*) as count FROM deals WHERE status = ${filters.status}`;
  } else {
    result = await sql`
      SELECT * FROM deals 
      WHERE status = 'active' AND is_active = true
      ORDER BY value_score DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    countResult = await sql`SELECT COUNT(*) as count FROM deals WHERE status = 'active' AND is_active = true`;
  }
  
  return {
    deals: result.rows.map(row => rowToDeal(row as Record<string, unknown>)),
    total: parseInt(countResult.rows[0].count as string, 10),
  };
}

// Upsert deals (insert or update)
export async function upsertDeals(deals: Deal[]): Promise<number> {
  if (deals.length === 0) return 0;
  
  let upsertedCount = 0;

  for (const deal of deals) {
    try {
      await sql`
        INSERT INTO deals (
          id, deal_signature, type, title, description,
          original_price, current_price, currency, savings_percent, value_score,
          origin_city, origin_code, destination_city, destination_code,
          departure_date, return_date, book_by_date, travel_window,
          airline, booking_url, image_url, source,
          includes, restrictions, tags,
          is_hot_deal, is_expiring_soon, is_historic_low, is_active, status,
          posted_at, scraped_at, first_seen_at, last_seen_at
        ) VALUES (
          ${deal.id}, ${deal.dealSignature || null}, ${deal.type || 'flight'}, ${deal.title}, ${deal.description || ''},
          ${deal.originalPrice}, ${deal.currentPrice}, ${deal.currency || 'USD'}, ${deal.savingsPercent}, ${deal.valueScore},
          ${deal.originCity || null}, ${deal.originCode || null}, ${deal.destinationCity}, ${deal.destinationCode || null},
          ${deal.departureDate || null}, ${deal.returnDate || null}, ${deal.bookByDate}, ${deal.travelWindow || null},
          ${deal.airline || null}, ${deal.bookingUrl}, ${deal.imageUrl || ''}, ${deal.source},
          ${JSON.stringify(deal.includes || [])}, ${JSON.stringify(deal.restrictions || [])}, ${JSON.stringify(deal.tags || [])},
          ${deal.isHotDeal || false}, ${deal.isExpiringSoon || false}, ${deal.isHistoricLow || false}, ${deal.isActive !== false}, ${deal.status || 'active'},
          ${deal.postedAt || new Date().toISOString()}, ${deal.scrapedAt || new Date().toISOString()}, ${deal.firstSeenAt || new Date().toISOString()}, ${deal.lastSeenAt || new Date().toISOString()}
        )
        ON CONFLICT (id) DO UPDATE SET
          current_price = EXCLUDED.current_price,
          original_price = EXCLUDED.original_price,
          savings_percent = EXCLUDED.savings_percent,
          value_score = EXCLUDED.value_score,
          book_by_date = EXCLUDED.book_by_date,
          is_hot_deal = EXCLUDED.is_hot_deal,
          is_expiring_soon = EXCLUDED.is_expiring_soon,
          is_active = true,
          last_seen_at = NOW(),
          updated_at = NOW()
      `;
      upsertedCount++;
    } catch (error) {
      console.error(`[Postgres] Failed to upsert deal ${deal.id}:`, error);
    }
  }

  return upsertedCount;
}

// Mark stale deals as inactive
export async function markStaleDealsInactive(hoursThreshold: number = 24): Promise<number> {
  const result = await sql`
    UPDATE deals 
    SET is_active = false, updated_at = NOW()
    WHERE is_active = true 
      AND last_seen_at < NOW() - INTERVAL '1 hour' * ${hoursThreshold}
  `;
  return result.rowCount || 0;
}

// Archive expired deals
export async function archiveExpiredDeals(): Promise<number> {
  const result = await sql`
    UPDATE deals 
    SET status = 'expired', expired_at = NOW(), archived_at = NOW(), updated_at = NOW()
    WHERE status = 'active' 
      AND book_by_date < CURRENT_DATE
  `;
  return result.rowCount || 0;
}

// Get stats
export async function getStats(): Promise<{
  totalDeals: number;
  activeDeals: number;
  hotDeals: number;
  avgSavings: number;
  archivedDeals: number;
  sourceBreakdown: Record<string, number>;
  updatedAt: string;
}> {
  const statsResult = await sql`
    SELECT 
      COUNT(*) as total_deals,
      COUNT(*) FILTER (WHERE is_active = true AND status = 'active') as active_deals,
      COUNT(*) FILTER (WHERE is_hot_deal = true AND is_active = true) as hot_deals,
      COALESCE(AVG(savings_percent) FILTER (WHERE is_active = true), 0) as avg_savings,
      COUNT(*) FILTER (WHERE status IN ('expired', 'archived')) as archived_deals
    FROM deals
  `;

  const sourceResult = await sql`
    SELECT source, COUNT(*) as count 
    FROM deals 
    WHERE is_active = true AND status = 'active'
    GROUP BY source
  `;

  const sourceBreakdown: Record<string, number> = {};
  for (const row of sourceResult.rows) {
    sourceBreakdown[row.source as string] = parseInt(row.count as string, 10);
  }

  const stats = statsResult.rows[0];
  return {
    totalDeals: parseInt(stats.total_deals as string, 10),
    activeDeals: parseInt(stats.active_deals as string, 10),
    hotDeals: parseInt(stats.hot_deals as string, 10),
    avgSavings: Math.round(parseFloat(stats.avg_savings as string) || 0),
    archivedDeals: parseInt(stats.archived_deals as string, 10),
    sourceBreakdown,
    updatedAt: new Date().toISOString(),
  };
}

// Update stats table
export async function updateStatsTable(): Promise<void> {
  const stats = await getStats();
  
  await sql`
    UPDATE deal_stats SET
      total_deals = ${stats.totalDeals},
      active_deals = ${stats.activeDeals},
      hot_deals = ${stats.hotDeals},
      avg_savings = ${stats.avgSavings},
      source_breakdown = ${JSON.stringify(stats.sourceBreakdown)},
      updated_at = NOW()
    WHERE id = 1
  `;
}

// Check if Postgres is configured and working
export async function isConfigured(): Promise<boolean> {
  try {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) return false;
    
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error('[Postgres] Connection check failed:', error);
    return false;
  }
}
