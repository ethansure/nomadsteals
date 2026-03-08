// Migration API - POST to migrate, GET for status
import { NextResponse } from 'next/server';
import { migrateFromBlob, getMigrationStatus } from '@/lib/db/migrate';

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

// POST - Run migration
export async function POST() {
  try {
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
