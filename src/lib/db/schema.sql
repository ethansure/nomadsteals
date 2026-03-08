-- NomadSteals Database Schema
-- Vercel Postgres (Neon)

-- Deals table - stores all discovered deals
CREATE TABLE IF NOT EXISTS deals (
  id VARCHAR(255) PRIMARY KEY,
  deal_signature VARCHAR(512) UNIQUE,
  
  -- Basic info
  type VARCHAR(50) DEFAULT 'flight',
  title TEXT NOT NULL,
  description TEXT,
  
  -- Pricing
  original_price INTEGER,
  current_price INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  savings_percent INTEGER,
  value_score INTEGER DEFAULT 50,
  
  -- Route info
  origin_city VARCHAR(255),
  origin_code VARCHAR(10),
  destination_city VARCHAR(255) NOT NULL,
  destination_code VARCHAR(10),
  
  -- Dates
  departure_date DATE,
  return_date DATE,
  book_by_date DATE,
  travel_window VARCHAR(100),
  
  -- Booking
  airline VARCHAR(100),
  booking_url TEXT,
  image_url TEXT,
  source VARCHAR(100) NOT NULL,
  
  -- Metadata
  includes TEXT[], -- Array of included items
  restrictions TEXT[], -- Array of restrictions
  tags TEXT[],
  
  -- Flags
  is_hot_deal BOOLEAN DEFAULT FALSE,
  is_expiring_soon BOOLEAN DEFAULT FALSE,
  is_historic_low BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'active', -- active, expired, archived
  
  -- Timestamps
  posted_at TIMESTAMP WITH TIME ZONE,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expired_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  
  -- Stats
  views INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_deals_value_score ON deals(value_score DESC);
CREATE INDEX IF NOT EXISTS idx_deals_destination ON deals(destination_code);
CREATE INDEX IF NOT EXISTS idx_deals_origin ON deals(origin_code);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_is_active ON deals(is_active);
CREATE INDEX IF NOT EXISTS idx_deals_is_hot_deal ON deals(is_hot_deal);
CREATE INDEX IF NOT EXISTS idx_deals_scraped_at ON deals(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_book_by_date ON deals(book_by_date);
CREATE INDEX IF NOT EXISTS idx_deals_source ON deals(source);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_deals_active_hot ON deals(is_active, is_hot_deal, value_score DESC);
CREATE INDEX IF NOT EXISTS idx_deals_route ON deals(origin_code, destination_code);

-- Stats table - for quick stats retrieval
CREATE TABLE IF NOT EXISTS deal_stats (
  id SERIAL PRIMARY KEY,
  total_deals INTEGER DEFAULT 0,
  active_deals INTEGER DEFAULT 0,
  hot_deals INTEGER DEFAULT 0,
  avg_savings INTEGER DEFAULT 0,
  source_breakdown JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial stats row
INSERT INTO deal_stats (id, total_deals) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;

-- Price history for tracking trends
CREATE TABLE IF NOT EXISTS price_history (
  id SERIAL PRIMARY KEY,
  route_key VARCHAR(20) NOT NULL, -- e.g., "JFK-LHR"
  average_price INTEGER,
  min_price INTEGER,
  max_price INTEGER,
  data_points INTEGER DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(route_key)
);

CREATE INDEX IF NOT EXISTS idx_price_history_route ON price_history(route_key);
