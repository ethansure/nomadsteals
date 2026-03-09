// Migration API - POST to migrate, GET for status
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { migrateFromBlob, getMigrationStatus } from '@/lib/db/migrate';
import * as postgres from '@/lib/db/postgres';

export const dynamic = 'force-dynamic';

// GET - Check migration status
export async function GET() {
  try {
    const status = await getMigrationStatus();
    return NextResponse.json({
      success: true,
      status,
      envVars: {
        POSTGRES_URL: !!process.env.POSTGRES_URL,
        DATABASE_URL: !!process.env.DATABASE_URL,
        NEON_DATABASE_URL: !!process.env.NEON_DATABASE_URL,
        NEON_POSTGRES_URL: !!process.env.NEON_POSTGRES_URL,
        REDIS_URL: !!process.env.REDIS_URL,
        KV_REST_API_URL: !!process.env.KV_REST_API_URL,
        BLOB_READ_WRITE_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}

// POST - Run migration or reset
// ?reset=true to drop and recreate tables
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reset = searchParams.get('reset') === 'true';
    
    if (reset) {
      await postgres.resetSchema();
      return NextResponse.json({
        success: true,
        message: 'Schema reset complete. Run scraper to populate data.',
      });
    }
    
    const result = await migrateFromBlob();
    return NextResponse.json({
      success: result.errors.length === 0,
      result,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}
