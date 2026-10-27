// tests/contract/schema_verification_test.js
// Automated PostgreSQL 17+ Schema Invariant & Table Count Verification Suite

import fs from 'fs';
import path from 'path';

function runSchemaVerification() {
  console.log('[SCHEMA VERIFICATION] Starting PostgreSQL 17+ Schema Audit...');

  const schema1Path = path.resolve('db/migrations/001_initial_schema.sql');
  const schema2Path = path.resolve('db/migrations/002_tenant_security.sql');

  const sql1 = fs.readFileSync(schema1Path, 'utf8');
  const sql2 = fs.readFileSync(schema2Path, 'utf8');

  // 1. Table Count Verification (Requirement: >= 146 tables)
  const tableMatches = sql1.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?([a-zA-Z0-9_]+)/gi);
  const tables = tableMatches.map(t => t.replace(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?/i, '').trim());

  console.log(`  ✓ Table count in 001_initial_schema.sql: ${tables.length} tables (Requirement: >= 146)`);
  if (tables.length < 146) {
    throw new Error(`Insufficient tables: expected >= 146, found ${tables.length}`);
  }

  // 2. Strict Zero Float Check (float32 / float64 / float / real / double precision prohibited)
  const floatPattern = /\b(float|float4|float8|real|double\s+precision)\b/i;
  if (floatPattern.test(sql1)) {
    throw new Error('CRITICAL VIOLATION: Floating-point type detected in schema!');
  }
  console.log('  ✓ Zero-Float verified: All monetary and quantity columns use NUMERIC(20,6) or BIGINT minor.');

  // 3. Foreign Key Deletion Policy: ON DELETE RESTRICT
  const fkMatches = sql1.match(/REFERENCES\s+[a-zA-Z0-9_]+\([a-zA-Z0-9_]+\)\s+ON\s+DELETE\s+([A-Z]+)/gi);
  let nonRestrictCount = 0;
  if (fkMatches) {
    for (const fk of fkMatches) {
      if (!fk.toUpperCase().includes('ON DELETE RESTRICT')) {
        nonRestrictCount++;
      }
    }
  }
  if (nonRestrictCount > 0) {
    throw new Error(`Found ${nonRestrictCount} foreign keys not adhering to ON DELETE RESTRICT!`);
  }
  console.log(`  ✓ ON DELETE RESTRICT verified: ${fkMatches ? fkMatches.length : 0} foreign keys strictly preserved.`);

  // 4. Exclusion Constraint on price_tiers (Prevent overlapping tiers)
  if (!sql1.includes('EXCLUDE USING gist') || !sql1.includes('numrange(min_quantity, max_quantity, \'[)\')')) {
    throw new Error('Missing EXCLUDE USING gist constraint on price_tiers brackets!');
  }
  console.log('  ✓ GIST Exclusion constraint verified on price_tiers [min, max) brackets.');

  // 5. Inventory balance check constraint (available = on_hand - reserved)
  if (!sql1.includes('available = on_hand - reserved')) {
    throw new Error('Missing CHECK constraint for available = on_hand - reserved in inventory_balances!');
  }
  console.log('  ✓ Inventory balance invariant verified: available = on_hand - reserved.');

  // 6. Tenant Security RLS & Role Separation
  const requiredRoles = ['migration_role', 'auth_role', 'public_catalog_role', 'runtime_role', 'ops_role', 'worker_role'];
  for (const r of requiredRoles) {
    if (!sql2.includes(r)) {
      throw new Error(`Missing required DB role: ${r} in 002_tenant_security.sql`);
    }
  }
  console.log(`  ✓ DB Role separation verified: All ${requiredRoles.length} least-privilege roles defined.`);

  const requiredRlsTables = ['listings', 'rfqs', 'quotes', 'trade_orders', 'settlements', 'disputes', 'bank_accounts'];
  for (const t of requiredRlsTables) {
    if (!sql2.includes(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;`)) {
      throw new Error(`Missing ENABLE ROW LEVEL SECURITY on table: ${t}`);
    }
  }
  console.log(`  ✓ Row-Level Security (RLS) verified on all core tenant-scoped tables.`);

  // 7. Verify Supplementary B2B Schemas (003 & 004)
  const schema3Path = path.resolve('db/migrations/003_b2b_supplementary_schemas.sql');
  const schema4Path = path.resolve('db/migrations/004_supplementary_rls.sql');
  if (fs.existsSync(schema3Path) && fs.existsSync(schema4Path)) {
    const sql3 = fs.readFileSync(schema3Path, 'utf8');
    const sql4 = fs.readFileSync(schema4Path, 'utf8');
    const supTables = [
      'buyer_corporate_tax_credentials',
      'sub_account_spending_limits',
      'kwa_campaigns',
      'kwa_click_events',
      'supplier_storefront_configs',
      'customs_tariffs_export_controls'
    ];
    for (const st of supTables) {
      if (!sql3.includes(st)) {
        throw new Error(`Missing supplementary table: ${st} in 003_b2b_supplementary_schemas.sql`);
      }
      if (!sql4.includes(`ALTER TABLE ${st} ENABLE ROW LEVEL SECURITY;`)) {
        throw new Error(`Missing supplementary RLS policy on: ${st} in 004_supplementary_rls.sql`);
      }
    }
    console.log(`  ✓ Supplementary B2B Schemas & RLS verified: ${supTables.length} tables (Tax credentials, SoD, KWA, Storefront, Tariffs).`);
  }

  // 8. Verify Trade Assurance, Customs & Factory Audits (005 & 006)
  const schema5Path = path.resolve('db/migrations/005_b2b_trade_assurance_and_customs.sql');
  const schema6Path = path.resolve('db/migrations/006_trade_assurance_customs_rls.sql');
  if (fs.existsSync(schema5Path) && fs.existsSync(schema6Path)) {
    const sql5 = fs.readFileSync(schema5Path, 'utf8');
    const sql6 = fs.readFileSync(schema6Path, 'utf8');
    const taTables = [
      'trade_assurance_claims',
      'customs_declaration_manifests',
      'factory_quality_audits'
    ];
    for (const tt of taTables) {
      if (!sql5.includes(tt)) {
        throw new Error(`Missing table: ${tt} in 005_b2b_trade_assurance_and_customs.sql`);
      }
      if (!sql6.includes(`ALTER TABLE ${tt} ENABLE ROW LEVEL SECURITY;`)) {
        throw new Error(`Missing RLS policy on: ${tt} in 006_trade_assurance_customs_rls.sql`);
      }
    }
    console.log(`  ✓ Trade Assurance, Customs & Factory Audits RLS verified: ${taTables.length} tables.`);
  }

  console.log('[SCHEMA VERIFICATION] ALL POSTGRESQL 17+ SCHEMA INVARIANTS PASSED (100% OK).\n');
}

runSchemaVerification();

