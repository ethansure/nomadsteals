// Vercel Postgres client
import { sql } from '@vercel/postgres';
import { Deal, DealStatus } from '../types';

// Convert database row to Deal object
function rowToDeal(row: any): Deal {
  return {
    id: row.id,
    type: row.type || 'flight',
    title: row.title,
    description: row.description,
    originalPrice: row.original_price,
    currentPrice: row.current_price,
    currency: row.currency || 'USD',
    savingsPercent: row.savings_percent,
    valueScore: row.value_score,
    originCity: row.origin_city,
    originCode: row.origin_code,
    destinationCity: row.destination_city,
    destinationCode: row.destination_code,
    departureDate: row.departure_date,
    returnDate: row.return_date,
    bookByDate: row.book_by_date,
    travelWindow: row.travel_window,
    airline: row.airline,
    bookingUrl: row.booking_url,
    imageUrl: row.image_url,
    source: row.source,
    includes: row.includes || [],
    restrictions: row.restrictions || [],
    tags: row.tags || [],
    isHotDeal: row.is_hot_deal,
    isExpiringSoon: row.is_expiring_soon,
    isHistoricLow: row.is_historic_low,
    isActive: row.is_active,
    status: row.status as DealStatus,
    postedAt: row.posted_at,
    scrapedAt: row.scraped_at,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    expiredAt: row.expired_at,
    archivedAt: row.archived_at,
    views: row.views || 0,
    saves: row.saves || 0,
    dealSignature: row.deal_signature,
    updatedAt: row.updated_at,
  };
}

// Check if Postgres is configured
export function isPostgresConfigured(): boolean {
  return !!process.env.POSTGRES_URL;
}

// Get all active deals with optional filters
export async function getDealsFromPostgres(options: {
  limit?: number;
  offset?: number;
  destination?: string;
  origin?: string;
  minValueScore?: number;
  isHotDeal?: boolean;
  includeInactive?: boolean;
} = {}): Promise<{ deals: Deal[]; total: number }> {
  if (!isPostgresConfigured()) {
    return { deals: [], total: 0 };
  }

  const {
    limit = 50,
    offset = 0,
    destination,
    origin,
    minValueScore,
    isHotDeal,
    includeInactive = false,
  } = options;

  try {
    // Build WHERE clause
    const conditions: string[] = [];
    if (!includeInactive) {
      conditions.push("is_active = true AND status = 'active'");
    }
    if (destination) {
      conditions.push(`(LOWER(destination_city) LIKE LOWER('%${destination}%') OR LOWER(destination_code) = LOWER('${destination}'))`);
    }
    if (origin) {
      conditions.push(`(LOWER(origin_city) LIKE LOWER('%${origin}%') OR LOWER(origin_code) = LOWER('${origin}'))`);
    }
    if (minValueScore) {
      conditions.push(`value_score >= ${minValueScore}`);
    }
    if (isHotDeal) {
      conditions.push('is_hot_deal = true');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await sql.query(`SELECT COUNT(*) as count FROM deals ${whereClause}`);
    const total = parseInt(countResult.rows[0].count);

    // Get deals
    const result = await sql.query(`
      SELECT * FROM deals 
      ${whereClause}
      ORDER BY value_score DESC, scraped_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const deals = result.rows.map(rowToDeal);
    return { deals, total };
  } catch (error) {
    console.error('[Postgres] Error fetching deals:', error);
    return { deals: [], total: 0 };
  }
}

// Get hot deals (top by value score)
export async function getHotDealsFromPostgres(limit: number = 50): Promise<Deal[]> {
  if (!isPostgresConfigured()) return [];

  try {
    const result = await sql.query(`
      SELECT * FROM deals 
      WHERE is_active = true AND status = 'active'
      ORDER BY value_score DESC, is_hot_deal DESC
      LIMIT ${limit}
    `);
    return result.rows.map(rowToDeal);
  } catch (error) {
    console.error('[Postgres] Error fetching hot deals:', error);
    return [];
  }
}

// Get deal by ID
export async function getDealByIdFromPostgres(id: string): Promise<Deal | null> {
  if (!isPostgresConfigured()) return null;

  try {
    const result = await sql.query(`SELECT * FROM deals WHERE id = $1`, [id]);
    if (result.rows.length === 0) return null;
    return rowToDeal(result.rows[0]);
  } catch (error) {
    console.error('[Postgres] Error fetching deal by ID:', error);
    return null;
  }
}

// Save/upsert deals
export async function saveDealsToPostgres(deals: Deal[]): Promise<number> {
  if (!isPostgresConfigured() || deals.length === 0) return 0;

  const now = new Date().toISOString();
  let savedCount = 0;

  try {
    for (const deal of deals) {
      const signature = deal.dealSignature || createDealSignature(deal);
      
      await sql.query(`
        INSERT INTO deals (
          id, deal_signature, type, title, description,
          original_price, current_price, currency, savings_percent, value_score,
          origin_city, origin_code, destination_city, destination_code,
          departure_date, return_date, book_by_date, travel_window,
          airline, booking_url, image_url, source,
          includes, restrictions, tags,
          is_hot_deal, is_expiring_soon, is_historic_low, is_active, status,
          posted_at, scraped_at, first_seen_at, last_seen_at,
          views, saves, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14,
          $15, $16, $17, $18,
          $19, $20, $21, $22,
          $23, $24, $25,
          $26, $27, $28, $29, $30,
          $31, $32, $33, $34,
          $35, $36, $37
        )
        ON CONFLICT (deal_signature) DO UPDATE SET
          current_price = EXCLUDED.current_price,
          original_price = EXCLUDED.original_price,
          savings_percent = EXCLUDED.savings_percent,
          value_score = EXCLUDED.value_score,
          last_seen_at = EXCLUDED.last_seen_at,
          is_active = true,
          updated_at = EXCLUDED.updated_at
      `, [
        deal.id, signature, deal.type || 'flight', deal.title, deal.description,
        deal.originalPrice, deal.currentPrice, deal.currency || 'USD', deal.savingsPercent, deal.valueScore,
        deal.originCity, deal.originCode, deal.destinationCity, deal.destinationCode,
        deal.departureDate, deal.returnDate, deal.bookByDate, deal.travelWindow,
        deal.airline, deal.bookingUrl, deal.imageUrl, deal.source,
        deal.includes || [], deal.restrictions || [], deal.tags || [],
        deal.isHotDeal, deal.isExpiringSoon, deal.isHistoricLow, true, 'active',
        deal.postedAt, now, deal.firstSeenAt || now, now,
        deal.views || 0, deal.saves || 0, now
      ]);
      
      savedCount++;
    }

    // Update stats
    await updateStatsInPostgres();
    
    console.log(`[Postgres] Saved ${savedCount} deals`);
    return savedCount;
  } catch (error) {
    console.error('[Postgres] Error saving deals:', error);
    return savedCount;
  }
}

// Mark stale deals as inactive
export async function markStaleDealsInPostgres(hoursThreshold: number = 24): Promise<number> {
  if (!isPostgresConfigured()) return 0;

  try {
    const result = await sql.query(`
      UPDATE deals 
      SET is_active = false, status = 'archived', archived_at = NOW()
      WHERE is_active = true 
        AND last_seen_at < NOW() - INTERVAL '${hoursThreshold} hours'
    `);
    
    const count = result.rowCount || 0;
    if (count > 0) {
      console.log(`[Postgres] Marked ${count} stale deals as inactive`);
      await updateStatsInPostgres();
    }
    return count;
  } catch (error) {
    console.error('[Postgres] Error marking stale deals:', error);
    return 0;
  }
}

// Archive expired deals
export async function archiveExpiredDealsInPostgres(): Promise<number> {
  if (!isPostgresConfigured()) return 0;

  try {
    const result = await sql.query(`
      UPDATE deals 
      SET status = 'expired', expired_at = NOW()
      WHERE status = 'active' AND book_by_date < CURRENT_DATE
    `);
    
    const count = result.rowCount || 0;
    if (count > 0) {
      console.log(`[Postgres] Archived ${count} expired deals`);
      await updateStatsInPostgres();
    }
    return count;
  } catch (error) {
    console.error('[Postgres] Error archiving expired deals:', error);
    return 0;
  }
}

// Get stats
export async function getStatsFromPostgres(): Promise<{
  totalDeals: number;
  activeDeals: number;
  hotDeals: number;
  avgSavings: number;
  sourceBreakdown: Record<string, number>;
}> {
  if (!isPostgresConfigured()) {
    return { totalDeals: 0, activeDeals: 0, hotDeals: 0, avgSavings: 0, sourceBreakdown: {} };
  }

  try {
    const result = await sql.query(`
      SELECT 
        COUNT(*) as total_deals,
        COUNT(*) FILTER (WHERE is_active = true AND status = 'active') as active_deals,
        COUNT(*) FILTER (WHERE is_hot_deal = true AND is_active = true) as hot_deals,
        COALESCE(AVG(savings_percent) FILTER (WHERE is_active = true), 0) as avg_savings
      FROM deals
    `);

    const sourceResult = await sql.query(`
      SELECT source, COUNT(*) as count 
      FROM deals 
      WHERE is_active = true AND status = 'active'
      GROUP BY source
    `);

    const sourceBreakdown: Record<string, number> = {};
    for (const row of sourceResult.rows) {
      sourceBreakdown[row.source] = parseInt(row.count);
    }

    const row = result.rows[0];
    return {
      totalDeals: parseInt(row.total_deals),
      activeDeals: parseInt(row.active_deals),
      hotDeals: parseInt(row.hot_deals),
      avgSavings: Math.round(parseFloat(row.avg_savings)),
      sourceBreakdown,
    };
  } catch (error) {
    console.error('[Postgres] Error fetching stats:', error);
    return { totalDeals: 0, activeDeals: 0, hotDeals: 0, avgSavings: 0, sourceBreakdown: {} };
  }
}

// Update stats in database
async function updateStatsInPostgres(): Promise<void> {
  try {
    const stats = await getStatsFromPostgres();
    await sql.query(`
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
      JSON.stringify(stats.sourceBreakdown)
    ]);
  } catch (error) {
    console.error('[Postgres] Error updating stats:', error);
  }
}

// Create deal signature for deduplication
function createDealSignature(deal: Deal): string {
  if (deal.bookingUrl && !deal.bookingUrl.includes('google.com/travel')) {
    return `url:${deal.bookingUrl}`;
  }
  return `route:${deal.originCode || deal.originCity || ''}-${deal.destinationCode || deal.destinationCity}-${deal.currentPrice}-${deal.source}`;
}

// Initialize database (create tables if not exist)
export async function initializePostgres(): Promise<boolean> {
  if (!isPostgresConfigured()) return false;

  try {
    // Run schema SQL
    await sql.query(`
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

    await sql.query(`
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

    await sql.query(`
      INSERT INTO deal_stats (id, total_deals) VALUES (1, 0) ON CONFLICT (id) DO NOTHING
    `);

    // Create indexes
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_deals_value_score ON deals(value_score DESC)`);
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_deals_is_active ON deals(is_active)`);
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status)`);

    console.log('[Postgres] Database initialized');
    return true;
  } catch (error) {
    console.error('[Postgres] Error initializing database:', error);
    return false;
  }
}
