/**
 * Cloud PostgreSQL Auth DB Initializer
 * Connects to DATABASE_URL and creates/verifies users and public_limits tables in Postgres.
 */

const path = require('path');
const fs = require('fs');

// Attempt to load .env.local
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
if (!databaseUrl || (!databaseUrl.startsWith('postgres://') && !databaseUrl.startsWith('postgresql://'))) {
  console.error('[init_auth_db] ERROR: DATABASE_URL is not set or not a valid PostgreSQL URL in .env.local');
  console.error('Please configure DATABASE_URL="postgresql://..." to initialize your PostgreSQL Auth DB.');
  process.exit(1);
}

const dns = require('dns');
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
      console.log(`[init_auth_db] Resolved host ${originalHost} -> ${addresses[0]} via Google DNS`);
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
    // Fall back to standard connection string
  }

  return {
    connectionString: dbUrl,
    ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false }
  };
}

let Pool;
try {
  Pool = require('pg').Pool;
} catch (e) {
  console.error('[init_auth_db] ERROR: "pg" driver is not installed. Please run: npm install pg');
  process.exit(1);
}

async function initPostgresAuth() {
  const config = await getPoolConfig(databaseUrl);
  const pool = new Pool(config);

  try {
    console.log('[init_auth_db] Connecting to Cloud PostgreSQL...');
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
    console.log('[init_auth_db] Successfully created/verified PostgreSQL users and public_limits tables.');

    // Seed superuser accounts if configured
    const devEmail = (process.env.DEVELOPER_EMAIL || '').trim().toLowerCase();
    const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();

    if (devEmail) {
      await pool.query(`
        INSERT INTO users (name, email, role, subscription_tier, allowed_wards, allowed_galis)
        VALUES ('Lead Developer', $1, 'developer', 'paid', 'all', 'all')
        ON CONFLICT(email) DO UPDATE SET 
          role = 'developer',
          subscription_tier = 'paid',
          allowed_wards = 'all',
          allowed_galis = 'all'
      `, [devEmail]);
      console.log(`[init_auth_db] Superuser account ensured for Developer: ${devEmail}`);
    }

    if (adminEmail && adminEmail !== devEmail) {
      await pool.query(`
        INSERT INTO users (name, email, role, subscription_tier, allowed_wards, allowed_galis)
        VALUES ('Campaign Administrator', $1, 'admin', 'paid', 'all', 'all')
        ON CONFLICT(email) DO UPDATE SET 
          role = 'admin',
          subscription_tier = 'paid',
          allowed_wards = 'all',
          allowed_galis = 'all'
      `, [adminEmail]);
      console.log(`[init_auth_db] Superuser account ensured for Admin: ${adminEmail}`);
    }

    console.log('[init_auth_db] Database initialization completed successfully.');
  } catch (err) {
    console.error('[init_auth_db] Initialization error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initPostgresAuth();
