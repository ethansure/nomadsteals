// Postgres client for NomadSteals
// Uses Supabase Postgres via POSTGRES_URL

import { Pool } from 'pg';
import { Deal, DealStatus, DealType } from '../types';

// Connection pool (reused across requests)
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('POSTGRES_URL or DATABASE_URL not configured');
    }
    
    // Supabase requires SSL but we need to accept their cert
    const sslConfig = connectionString.includes('supabase') 
      ? { rejectUnauthorized: false }
      : process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false }
        : false;
    
    pool = new Pool({
      connectionString,
      ssl: sslConfig,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

// Initialize database schema
export async function initSchema(): Promise<void> {
  const client = await getPool().connect();
  try {
    // Create deals table
    await client.query(`
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
        includes TEXT[],
        restrictions TEXT[],
        tags TEXT[],
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
    `);

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_deals_value_score ON deals(value_score DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_deals_is_active ON deals(is_active)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_deals_scraped_at ON deals(scraped_at DESC)`);

    // Create stats table
    await client.query(`
      CREATE TABLE IF NOT EXISTS deal_stats (
        id SERIAL PRIMARY KEY,
        total_deals INTEGER DEFAULT 0,
        active_deals INTEGER DEFAULT 0,
        hot_deals INTEGER DEFAULT 0,
        avg_savings INTEGER DEFAULT 0,
        source_breakdown JSONB DEFAULT '{}',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Insert initial stats row
    await client.query(`INSERT INTO deal_stats (id, total_deals) VALUES (1, 0) ON CONFLICT (id) DO NOTHING`);

    console.log('[Postgres] Schema initialized');
  } finally {
    client.release();
  }
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
    includes: row.includes as string[] | undefined,
    restrictions: row.restrictions as string[] | undefined,
    tags: (row.tags as string[]) || [],
    isHotDeal: (row.is_hot_deal as boolean) || false,
    isExpiringSoon: (row.is_expiring_soon as boolean) || false,
    isHistoricLow: (row.is_historic_low as boolean) || false,
    isActive: row.is_active as boolean,
    status: row.status as DealStatus,
    postedAt: row.posted_at ? (row.posted_at as Date).toISOString() : new Date().toISOString(),
    scrapedAt: row.scraped_at ? (row.scraped_at as Date).toISOString() : undefined,
    firstSeenAt: row.first_seen_at ? (row.first_seen_at as Date).toISOString() : undefined,
    lastSeenAt: row.last_seen_at ? (row.last_seen_at as Date).toISOString() : undefined,
    expiredAt: row.expired_at ? (row.expired_at as Date).toISOString() : undefined,
    archivedAt: row.archived_at ? (row.archived_at as Date).toISOString() : undefined,
    views: (row.views as number) || 0,
    saves: (row.saves as number) || 0,
    updatedAt: row.updated_at ? (row.updated_at as Date).toISOString() : new Date().toISOString(),
  };
}

// Get all active deals
export async function getDeals(): Promise<Deal[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(`
      SELECT * FROM deals 
      WHERE is_active = true AND status = 'active'
      ORDER BY value_score DESC
      LIMIT 100
    `);
    return result.rows.map(rowToDeal);
  } finally {
    client.release();
  }
}

// Get top deals by value score (for KV cache)
export async function getTopDeals(limit: number = 50): Promise<Deal[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(`
      SELECT * FROM deals 
      WHERE is_active = true AND status = 'active'
      ORDER BY value_score DESC
      LIMIT $1
    `, [limit]);
    return result.rows.map(rowToDeal);
  } finally {
    client.release();
  }
}

// Get all deals including archived
export async function getAllDeals(): Promise<Deal[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(`
      SELECT * FROM deals ORDER BY value_score DESC
    `);
    return result.rows.map(rowToDeal);
  } finally {
    client.release();
  }
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
  const client = await getPool().connect();
  try {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Status filter
    if (filters.status === 'all') {
      // No status filter
    } else if (filters.status === 'expired' || filters.status === 'archived') {
      conditions.push(`status = $${paramIndex++}`);
      params.push(filters.status);
    } else {
      conditions.push(`status = 'active'`);
      if (!filters.includeInactive) {
        conditions.push(`is_active = true`);
      }
    }

    // Freshness filter
    if (filters.days && filters.days > 0) {
      conditions.push(`scraped_at >= NOW() - INTERVAL '${filters.days} days'`);
    }

    // Type filter
    if (filters.type) {
      conditions.push(`type = $${paramIndex++}`);
      params.push(filters.type);
    }

    // Destination filter
    if (filters.destination) {
      conditions.push(`(LOWER(destination_city) LIKE $${paramIndex} OR LOWER(destination_code) = $${paramIndex + 1})`);
      params.push(`%${filters.destination.toLowerCase()}%`);
      params.push(filters.destination.toLowerCase());
      paramIndex += 2;
    }

    // Origin filter
    if (filters.origin) {
      conditions.push(`(LOWER(origin_city) LIKE $${paramIndex} OR LOWER(origin_code) = $${paramIndex + 1})`);
      params.push(`%${filters.origin.toLowerCase()}%`);
      params.push(filters.origin.toLowerCase());
      paramIndex += 2;
    }

    // Price filter
    if (filters.maxPrice) {
      conditions.push(`current_price <= $${paramIndex++}`);
      params.push(filters.maxPrice);
    }

    // Value score filter
    if (filters.minValueScore) {
      conditions.push(`value_score >= $${paramIndex++}`);
      params.push(filters.minValueScore);
    }

    // Hot deal filter
    if (filters.isHotDeal) {
      conditions.push(`is_hot_deal = true`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await client.query(`SELECT COUNT(*) FROM deals ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    const dataResult = await client.query(`
      SELECT * FROM deals ${whereClause}
      ORDER BY value_score DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `, [...params, limit, offset]);

    return {
      deals: dataResult.rows.map(rowToDeal),
      total,
    };
  } finally {
    client.release();
  }
}

// Upsert deals (insert or update)
export async function upsertDeals(deals: Deal[]): Promise<number> {
  if (deals.length === 0) return 0;

  const client = await getPool().connect();
  try {
    let upsertedCount = 0;

    for (const deal of deals) {
      const result = await client.query(`
        INSERT INTO deals (
          id, deal_signature, type, title, description,
          original_price, current_price, currency, savings_percent, value_score,
          origin_city, origin_code, destination_city, destination_code,
          departure_date, return_date, book_by_date, travel_window,
          airline, booking_url, image_url, source,
          includes, restrictions, tags,
          is_hot_deal, is_expiring_soon, is_historic_low, is_active, status,
          posted_at, scraped_at, first_seen_at, last_seen_at,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14,
          $15, $16, $17, $18,
          $19, $20, $21, $22,
          $23, $24, $25,
          $26, $27, $28, $29, $30,
          $31, $32, $33, $34,
          NOW(), NOW()
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
      `, [
        deal.id,
        deal.dealSignature,
        deal.type || 'flight',
        deal.title,
        deal.description,
        deal.originalPrice,
        deal.currentPrice,
        deal.currency || 'USD',
        deal.savingsPercent,
        deal.valueScore,
        deal.originCity,
        deal.originCode,
        deal.destinationCity,
        deal.destinationCode,
        deal.departureDate,
        deal.returnDate,
        deal.bookByDate,
        deal.travelWindow,
        deal.airline,
        deal.bookingUrl,
        deal.imageUrl,
        deal.source,
        deal.includes,
        deal.restrictions,
        deal.tags,
        deal.isHotDeal || false,
        deal.isExpiringSoon || false,
        deal.isHistoricLow || false,
        deal.isActive !== false,
        deal.status || 'active',
        deal.postedAt,
        deal.scrapedAt || new Date().toISOString(),
        deal.firstSeenAt || new Date().toISOString(),
        deal.lastSeenAt || new Date().toISOString(),
      ]);

      if (result.rowCount && result.rowCount > 0) {
        upsertedCount++;
      }
    }

    return upsertedCount;
  } finally {
    client.release();
  }
}

// Mark stale deals as inactive
export async function markStaleDealsInactive(hoursThreshold: number = 24): Promise<number> {
  const client = await getPool().connect();
  try {
    const result = await client.query(`
      UPDATE deals 
      SET is_active = false, updated_at = NOW()
      WHERE is_active = true 
        AND last_seen_at < NOW() - INTERVAL '${hoursThreshold} hours'
    `);
    return result.rowCount || 0;
  } finally {
    client.release();
  }
}

// Archive expired deals
export async function archiveExpiredDeals(): Promise<number> {
  const client = await getPool().connect();
  try {
    const result = await client.query(`
      UPDATE deals 
      SET status = 'expired', expired_at = NOW(), archived_at = NOW(), updated_at = NOW()
      WHERE status = 'active' 
        AND book_by_date < CURRENT_DATE
    `);
    return result.rowCount || 0;
  } finally {
    client.release();
  }
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
  const client = await getPool().connect();
  try {
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_deals,
        COUNT(*) FILTER (WHERE is_active = true AND status = 'active') as active_deals,
        COUNT(*) FILTER (WHERE is_hot_deal = true AND is_active = true) as hot_deals,
        COALESCE(AVG(savings_percent) FILTER (WHERE is_active = true), 0) as avg_savings,
        COUNT(*) FILTER (WHERE status IN ('expired', 'archived')) as archived_deals
      FROM deals
    `);

    const sourceResult = await client.query(`
      SELECT source, COUNT(*) as count 
      FROM deals 
      WHERE is_active = true AND status = 'active'
      GROUP BY source
    `);

    const sourceBreakdown: Record<string, number> = {};
    for (const row of sourceResult.rows) {
      sourceBreakdown[row.source] = parseInt(row.count, 10);
    }

    const stats = statsResult.rows[0];
    return {
      totalDeals: parseInt(stats.total_deals, 10),
      activeDeals: parseInt(stats.active_deals, 10),
      hotDeals: parseInt(stats.hot_deals, 10),
      avgSavings: Math.round(parseFloat(stats.avg_savings)),
      archivedDeals: parseInt(stats.archived_deals, 10),
      sourceBreakdown,
      updatedAt: new Date().toISOString(),
    };
  } finally {
    client.release();
  }
}

// Update stats table
export async function updateStatsTable(): Promise<void> {
  const stats = await getStats();
  const client = await getPool().connect();
  try {
    await client.query(`
      UPDATE deal_stats SET
        total_deals = $1,
        active_deals = $2,
        hot_deals = $3,
        avg_savings = $4,
        source_breakdown = $5,
        updated_at = NOW()
      WHERE id = 1
    `, [
      stats.totalDeals,
      stats.activeDeals,
      stats.hotDeals,
      stats.avgSavings,
      JSON.stringify(stats.sourceBreakdown),
    ]);
  } finally {
    client.release();
  }
}

// Check if Postgres is configured and working
export async function isConfigured(): Promise<boolean> {
  try {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) return false;
    
    const client = await getPool().connect();
    try {
      await client.query('SELECT 1');
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[Postgres] Connection check failed:', error);
    return false;
  }
}
