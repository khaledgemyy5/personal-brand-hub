#!/usr/bin/env node
/**
 * Supabase Health Check Script
 * 
 * Checks connectivity to Supabase and validates schema setup.
 * 
 * Usage:
 *   node scripts/supabase-health.mjs
 * 
 * Environment variables required:
 *   VITE_SUPABASE_URL - Your Supabase project URL
 *   VITE_SUPABASE_ANON_KEY - Your Supabase anon/public key
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function log(status, message) {
  const icon = status === 'ok' ? `${GREEN}✓${RESET}` : status === 'warn' ? `${YELLOW}⚠${RESET}` : `${RED}✗${RESET}`;
  console.log(`  ${icon} ${message}`);
}

async function checkTable(tableName) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=id&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (res.status === 200) {
      const data = await res.json();
      return { ok: true, count: data.length, message: `Found ${data.length} row(s)` };
    } else if (res.status === 404) {
      return { ok: false, message: 'Table does not exist' };
    } else {
      const text = await res.text();
      return { ok: false, message: `HTTP ${res.status}: ${text.slice(0, 100)}` };
    }
  } catch (e) {
    return { ok: false, message: e.message };
  }
}

async function main() {
  console.log('\n🔍 Supabase Health Check\n');

  // Check env vars
  console.log('Environment:');
  if (!SUPABASE_URL) {
    log('error', 'VITE_SUPABASE_URL is not set');
    process.exit(1);
  }
  log('ok', `VITE_SUPABASE_URL: ${SUPABASE_URL}`);

  if (!SUPABASE_ANON_KEY) {
    log('error', 'VITE_SUPABASE_ANON_KEY is not set');
    process.exit(1);
  }
  log('ok', `VITE_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY.slice(0, 20)}...`);

  // Check connectivity
  console.log('\nConnectivity:');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
      },
    });
    if (res.ok) {
      log('ok', 'Supabase REST API reachable');
    } else {
      log('error', `Supabase REST API returned ${res.status}`);
    }
  } catch (e) {
    log('error', `Cannot reach Supabase: ${e.message}`);
    process.exit(1);
  }

  // Check tables
  console.log('\nTables:');
  
  const tables = ['site_settings', 'projects', 'writing_categories', 'writing_items'];
  let allOk = true;

  for (const table of tables) {
    const result = await checkTable(table);
    if (result.ok) {
      log('ok', `${table}: ${result.message}`);
    } else {
      log('error', `${table}: ${result.message}`);
      allOk = false;
    }
  }

  // Check public view
  console.log('\nViews:');
  const viewResult = await checkTable('public_site_settings');
  if (viewResult.ok) {
    log('ok', `public_site_settings: ${viewResult.message}`);
  } else {
    log('error', `public_site_settings: ${viewResult.message}`);
    allOk = false;
  }

  // Summary
  console.log('\n' + '─'.repeat(40));
  if (allOk) {
    console.log(`${GREEN}✓ All checks passed!${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`${YELLOW}⚠ Some checks failed.${RESET}`);
    console.log(`  Run docs/sql/000_all.sql in Supabase SQL Editor.\n`);
    process.exit(1);
  }
}

main().catch(e => {
  console.error(`${RED}Error:${RESET}`, e.message);
  process.exit(1);
});
