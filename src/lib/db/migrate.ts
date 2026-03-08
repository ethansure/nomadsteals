// Migration script: Blob → Postgres
// Run this once to migrate existing deals from Vercel Blob to Supabase Postgres

import * as postgres from './postgres';
import { getAllDealsFromBlob, getArchivedDealsFromBlob } from '../api/blob-store';

export async function migrateFromBlob(): Promise<{
  activeDeals: number;
  archivedDeals: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let activeCount = 0;
  let archivedCount = 0;

  console.log('[Migration] Starting Blob → Postgres migration...');

  // Initialize Postgres schema
  try {
    await postgres.initSchema();
    console.log('[Migration] Postgres schema initialized');
  } catch (error) {
    errors.push(`Schema init failed: ${error}`);
    return { activeDeals: 0, archivedDeals: 0, errors };
  }

  // Migrate active deals
  try {
    console.log('[Migration] Fetching active deals from Blob...');
    const activeDeals = await getAllDealsFromBlob();
    console.log(`[Migration] Found ${activeDeals.length} active deals`);

    if (activeDeals.length > 0) {
      activeCount = await postgres.upsertDeals(activeDeals);
      console.log(`[Migration] Migrated ${activeCount} active deals to Postgres`);
    }
  } catch (error) {
    errors.push(`Active deals migration failed: ${error}`);
  }

  // Migrate archived deals
  try {
    console.log('[Migration] Fetching archived deals from Blob...');
    const archivedDeals = await getArchivedDealsFromBlob();
    console.log(`[Migration] Found ${archivedDeals.length} archived deals`);

    if (archivedDeals.length > 0) {
      archivedCount = await postgres.upsertDeals(archivedDeals);
      console.log(`[Migration] Migrated ${archivedCount} archived deals to Postgres`);
    }
  } catch (error) {
    errors.push(`Archived deals migration failed: ${error}`);
  }

  // Update stats
  try {
    await postgres.updateStatsTable();
    console.log('[Migration] Stats table updated');
  } catch (error) {
    errors.push(`Stats update failed: ${error}`);
  }

  console.log('[Migration] Complete!');
  console.log(`  Active deals: ${activeCount}`);
  console.log(`  Archived deals: ${archivedCount}`);
  if (errors.length > 0) {
    console.log(`  Errors: ${errors.join(', ')}`);
  }

  return { activeDeals: activeCount, archivedDeals: archivedCount, errors };
}

// Check migration status
export async function getMigrationStatus(): Promise<{
  postgresConfigured: boolean;
  postgresReachable: boolean;
  dealsInPostgres: number;
}> {
  const status = {
    postgresConfigured: !!(process.env.POSTGRES_URL || process.env.DATABASE_URL),
    postgresReachable: false,
    dealsInPostgres: 0,
  };

  if (status.postgresConfigured) {
    try {
      status.postgresReachable = await postgres.isConfigured();
      if (status.postgresReachable) {
        const stats = await postgres.getStats();
        status.dealsInPostgres = stats.totalDeals;
      }
    } catch (error) {
      console.error('[Migration] Status check error:', error);
    }
  }

  return status;
}
