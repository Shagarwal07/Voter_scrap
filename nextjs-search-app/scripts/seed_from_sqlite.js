const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const dns = require('dns');

// 1. Load environment variables
const envLocalPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...values] = trimmed.split('=');
      const val = values.join('=').replace(/^["']|["']$/g, '').trim();
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  });
}

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error('[seed_from_sqlite] ERROR: DATABASE_URL is missing in .env.local');
  process.exit(1);
}

// 2. DNS resolver fallback
const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']);

async function getPoolConfig(dbUrl) {
  try {
    const parsed = new URL(dbUrl.replace(/^postgres:\/\//, 'http://').replace(/^postgresql:\/\//, 'http://'));
    const originalHost = parsed.hostname;

    const addresses = await new Promise((resolve) => {
      resolver.resolve4(originalHost, (err, addrs) => {
        if (!err && addrs && addrs.length > 0) resolve(addrs);
        else resolve(null);
      });
    });

    if (addresses && addresses[0]) {
      console.log(`[seed_from_sqlite] Resolved ${originalHost} -> ${addresses[0]} via Google DNS`);
      return {
        host: addresses[0],
        port: parseInt(parsed.port || '5432', 10),
        database: parsed.pathname.replace(/^\//, '') || 'neondb',
        user: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
        ssl: {
          servername: originalHost,
          rejectUnauthorized: false
        }
      };
    }
  } catch (e) {
    // fallback
  }

  return {
    connectionString: dbUrl,
    ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false }
  };
}

async function seed() {
  const sqliteFile = path.resolve(__dirname, '../data/seeds/auth_backup.db');
  if (!fs.existsSync(sqliteFile)) {
    console.error(`[seed_from_sqlite] SQLite file not found at: ${sqliteFile}`);
    process.exit(1);
  }

  console.log(`[seed_from_sqlite] Reading SQLite database: ${sqliteFile}`);
  const sqliteDb = await open({
    filename: sqliteFile,
    driver: sqlite3.Database,
    mode: sqlite3.OPEN_READONLY
  });

  const sqliteUsers = await sqliteDb.all('SELECT * FROM users');
  console.log(`[seed_from_sqlite] Found ${sqliteUsers.length} user(s) in SQLite:`);
  sqliteUsers.forEach(u => console.log(`  - ${u.email} (Role: ${u.role}, Wards: ${u.allowed_wards})`));

  let sqliteLimits = [];
  try {
    sqliteLimits = await sqliteDb.all('SELECT * FROM public_limits');
    console.log(`[seed_from_sqlite] Found ${sqliteLimits.length} rate-limit record(s) in SQLite.`);
  } catch (e) {
    // optional
  }
  await sqliteDb.close();

  // Connect to PostgreSQL
  const { Pool } = require('pg');
  const poolConfig = await getPoolConfig(databaseUrl);
  const pool = new Pool(poolConfig);

  console.log('[seed_from_sqlite] Connecting to Cloud PostgreSQL...');

  // Ensure tables exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT DEFAULT '',
      email TEXT UNIQUE NOT NULL,
      image TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'user',
      subscription_tier TEXT NOT NULL DEFAULT 'free',
      allowed_wards TEXT NOT NULL DEFAULT '',
      allowed_galis TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS public_limits (
      ip TEXT PRIMARY KEY,
      search_count INTEGER DEFAULT 0,
      last_reset BIGINT DEFAULT 0
    );
  `);

  // Migrate users
  for (const u of sqliteUsers) {
    const email = u.email.trim().toLowerCase();
    const role = u.role || 'user';
    const tier = (role === 'admin' || role === 'developer') ? 'paid' : 'free';
    const wards = u.allowed_wards || 'all';
    const name = u.name || (role === 'admin' ? 'Campaign Admin' : 'User');
    const image = u.image || '';

    await pool.query(`
      INSERT INTO users (name, email, image, role, subscription_tier, allowed_wards, allowed_galis)
      VALUES ($1, $2, $3, $4, $5, $6, 'all')
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        subscription_tier = EXCLUDED.subscription_tier,
        allowed_wards = EXCLUDED.allowed_wards,
        allowed_galis = 'all';
    `, [name, email, image, role, tier, wards]);

    console.log(`[seed_from_sqlite] Synced user to PostgreSQL: ${email} (Role: ${role})`);
  }

  // Migrate limits if any
  for (const l of sqliteLimits) {
    await pool.query(`
      INSERT INTO public_limits (ip, search_count, last_reset)
      VALUES ($1, $2, $3)
      ON CONFLICT (ip) DO UPDATE SET
        search_count = EXCLUDED.search_count,
        last_reset = EXCLUDED.last_reset;
    `, [l.ip, l.search_count, l.last_reset]);
  }

  // Verification: Print all users in PostgreSQL
  const currentUsers = await pool.query('SELECT id, email, role, subscription_tier, allowed_wards FROM users ORDER BY id ASC');
  console.log('\n[seed_from_sqlite] Current PostgreSQL Users:');
  currentUsers.rows.forEach(r => {
    console.log(`  [#${r.id}] ${r.email} | Role: ${r.role} | Tier: ${r.subscription_tier} | Wards: ${r.allowed_wards}`);
  });

  await pool.end();
  console.log('\n[seed_from_sqlite] Migration completed successfully.');
}

seed().catch(err => {
  console.error('[seed_from_sqlite] Migration error:', err);
  process.exit(1);
});

