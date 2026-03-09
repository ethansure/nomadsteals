// Postgres client for NomadSteals
// Uses postgres.js for Supabase connection

import postgres from 'postgres';
import { Deal, DealStatus, DealType } from '../types';

// Singleton SQL client
let sql: ReturnType<typeof postgres> | null = null;

function getSQL() {
  if (!sql) {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('POSTGRES_URL or DATABASE_URL not configured');
    }
    
    sql = postgres(connectionString, {
      ssl: 'require',
      max: 10,
      idle_timeout: 30,
      connect_timeout: 10,
    });
  }
  return sql;
}

// Check if Postgres is configured
export async function isConfigured(): Promise<boolean> {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  return !!connectionString;
}

// Initialize database schema
export async function initSchema(): Promise<void> {
  const db = getSQL();
  
  await db`
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

  await db`CREATE INDEX IF NOT EXISTS idx_deals_value_score ON deals(value_score DESC)`;
  await db`CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status)`;
  await db`CREATE INDEX IF NOT EXISTS idx_deals_is_active ON deals(is_active)`;
  await db`CREATE INDEX IF NOT EXISTS idx_deals_scraped_at ON deals(scraped_at DESC)`;

  await db`
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

  await db`INSERT INTO deal_stats (id, total_deals) VALUES (1, 0) ON CONFLICT (id) DO NOTHING`;

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
    postedAt: row.posted_at ? String(row.posted_at) : new Date().toISOString(),
    scrapedAt: row.scraped_at ? String(row.scraped_at) : undefined,
    firstSeenAt: row.first_seen_at ? String(row.first_seen_at) : undefined,
    lastSeenAt: row.last_seen_at ? String(row.last_seen_at) : undefined,
    expiredAt: row.expired_at ? String(row.expired_at) : undefined,
    archivedAt: row.archived_at ? String(row.archived_at) : undefined,
    views: (row.views as number) || 0,
    saves: (row.saves as number) || 0,
    updatedAt: row.updated_at ? String(row.updated_at) : new Date().toISOString(),
  };
}

// Get all active deals
export async function getDeals(): Promise<Deal[]> {
  const db = getSQL();
  const rows = await db`
    SELECT * FROM deals 
    WHERE is_active = true AND status = 'active'
    ORDER BY value_score DESC
    LIMIT 100
  `;
  return rows.map(row => rowToDeal(row as Record<string, unknown>));
}

// Get top deals by value score
export async function getTopDeals(limit: number = 50): Promise<Deal[]> {
  const db = getSQL();
  const rows = await db`
    SELECT * FROM deals 
    WHERE is_active = true AND status = 'active'
    ORDER BY value_score DESC
    LIMIT ${limit}
  `;
  return rows.map(row => rowToDeal(row as Record<string, unknown>));
}

// Get all deals including archived
export async function getAllDeals(): Promise<Deal[]> {
  const db = getSQL();
  const rows = await db`SELECT * FROM deals ORDER BY value_score DESC`;
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
  const db = getSQL();
  const limit = filters.limit || 20;
  const offset = filters.offset || 0;
  
  let rows;
  let countResult;
  
  if (filters.status === 'all') {
    rows = await db`
      SELECT * FROM deals 
      ORDER BY value_score DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    countResult = await db`SELECT COUNT(*)::int as count FROM deals`;
  } else if (filters.status === 'expired' || filters.status === 'archived') {
    rows = await db`
      SELECT * FROM deals 
      WHERE status = ${filters.status}
      ORDER BY value_score DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    countResult = await db`SELECT COUNT(*)::int as count FROM deals WHERE status = ${filters.status}`;
  } else {
    rows = await db`
      SELECT * FROM deals 
      WHERE status = 'active' AND is_active = true
      ORDER BY value_score DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    countResult = await db`SELECT COUNT(*)::int as count FROM deals WHERE status = 'active' AND is_active = true`;
  }
  
  return {
    deals: rows.map(row => rowToDeal(row as Record<string, unknown>)),
    total: countResult[0].count as number,
  };
}

// Upsert deals (insert or update)
export async function upsertDeals(deals: Deal[]): Promise<number> {
  if (deals.length === 0) return 0;
  
  const db = getSQL();
  let upsertedCount = 0;

  for (const deal of deals) {
    try {
      await db`
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
  const db = getSQL();
  const result = await db`
    UPDATE deals 
    SET is_active = false, updated_at = NOW()
    WHERE is_active = true 
      AND last_seen_at < NOW() - INTERVAL '1 hour' * ${hoursThreshold}
  `;
  return result.count;
}

// Archive expired deals
export async function archiveExpiredDeals(): Promise<number> {
  const db = getSQL();
  const result = await db`
    UPDATE deals 
    SET status = 'expired', expired_at = NOW(), archived_at = NOW(), updated_at = NOW()
    WHERE status = 'active' 
      AND book_by_date < CURRENT_DATE
  `;
  return result.count;
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
  const db = getSQL();
  
  const statsResult = await db`
    SELECT 
      COUNT(*)::int as total_deals,
      COUNT(*) FILTER (WHERE is_active = true AND status = 'active')::int as active_deals,
      COUNT(*) FILTER (WHERE is_hot_deal = true AND is_active = true)::int as hot_deals,
      COALESCE(AVG(savings_percent) FILTER (WHERE is_active = true), 0)::int as avg_savings,
      COUNT(*) FILTER (WHERE status IN ('expired', 'archived'))::int as archived_deals
    FROM deals
  `;

  const sourceResult = await db`
    SELECT source, COUNT(*)::int as count 
    FROM deals 
    WHERE is_active = true AND status = 'active'
    GROUP BY source
  `;

  const sourceBreakdown: Record<string, number> = {};
  for (const row of sourceResult) {
    sourceBreakdown[row.source as string] = row.count as number;
  }

  const stats = statsResult[0];
  return {
    totalDeals: stats.total_deals as number,
    activeDeals: stats.active_deals as number,
    hotDeals: stats.hot_deals as number,
    avgSavings: stats.avg_savings as number,
    archivedDeals: stats.archived_deals as number,
    sourceBreakdown,
    updatedAt: new Date().toISOString(),
  };
}

// Update stats table
export async function updateStatsTable(): Promise<void> {
  const stats = await getStats();
  const db = getSQL();
  
  await db`
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
