// Seed script to generate initial demo deals
// Run with: npx ts-node scripts/seed-deals.ts

import { generateDemoDeals } from '../src/lib/api/deal-aggregator';
import { promises as fs } from 'fs';
import path from 'path';

async function seed() {
  console.log('🌱 Seeding demo deals...');
  
  const dataDir = path.join(process.cwd(), 'data');
  const dealsFile = path.join(dataDir, 'deals.json');
  const statsFile = path.join(dataDir, 'stats.json');
  
  // Ensure data directory exists
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
  
  // Generate demo deals
  const deals = generateDemoDeals();
  
  const dealsData = {
    deals,
    lastUpdated: new Date().toISOString(),
    fetchedSources: ['Demo Data'],
  };
  
  const statsData = {
    totalDeals: deals.length,
    avgSavings: Math.round(deals.reduce((acc, d) => acc + d.savingsPercent, 0) / deals.length),
    hotDeals: deals.filter(d => d.isHotDeal).length,
    updatedAt: new Date().toISOString(),
    sourceBreakdown: { 'Demo Data': deals.length },
  };
  
  await fs.writeFile(dealsFile, JSON.stringify(dealsData, null, 2));
  await fs.writeFile(statsFile, JSON.stringify(statsData, null, 2));
  
  console.log(`✅ Seeded ${deals.length} demo deals`);
  console.log(`   Hot deals: ${statsData.hotDeals}`);
  console.log(`   Avg savings: ${statsData.avgSavings}%`);
}

seed().catch(console.error);
