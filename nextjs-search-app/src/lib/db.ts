import type { Pool } from 'pg';

export interface IAuthDb {
  get<T = any>(sql: string, params?: any[]): Promise<T | undefined>;
  all<T = any>(sql: string, params?: any[]): Promise<T[]>;
  run(sql: string, params?: any[]): Promise<{ lastID?: number | string; changes?: number }>;
  exec(sql: string): Promise<void>;
}

declare global {
  var _authDbPool: Pool | undefined;
  var _authDbInitPromise: Promise<void> | undefined;
}

const toPg = (sql: string) => {
  let i = 1;
  return sql.replace(/\?/g, () => `$${i++}`);
};

import dns from 'dns';

const dnsResolver = new dns.Resolver();
dnsResolver.setServers(['8.8.8.8', '1.1.1.1']);

let _initPoolPromise: Promise<Pool> | null = null;

async function getPool(): Promise<Pool> {
  if (global._authDbPool) return global._authDbPool;
  if (!_initPoolPromise) {
    _initPoolPromise = (async () => {
      const url = process.env.DATABASE_URL?.trim();
      if (!url) throw new Error('[Auth Error] DATABASE_URL is not set in .env.local');

      const { Pool } = require('pg');
      let poolConfig: any = {
        connectionString: url,
        ssl: url.includes('localhost') ? false : { rejectUnauthorized: false },
        max: 10,
      };

      try {
        const parsed = new URL(url.replace(/^postgres:\/\//, 'http://').replace(/^postgresql:\/\//, 'http://'));
        const originalHost = parsed.hostname;
        if (!['localhost', '127.0.0.1'].includes(originalHost)) {
          const addresses = await new Promise<string[]>((resolve) => {
            dnsResolver.resolve4(originalHost, (err, addrs) => {
              if (!err && addrs && addrs.length > 0) resolve(addrs);
              else resolve([]);
            });
          });

          if (addresses.length > 0) {
            poolConfig = {
              host: addresses[0],
              port: parseInt(parsed.port || '5432', 10),
              database: parsed.pathname.replace(/^\//, '') || 'neondb',
              user: decodeURIComponent(parsed.username),
              password: decodeURIComponent(parsed.password),
              ssl: {
                servername: originalHost,
                rejectUnauthorized: false,
              },
              max: 10,
            };
          }
        }
      } catch {
        // Fallback to raw connection string
      }

      global._authDbPool = new Pool(poolConfig);
      return global._authDbPool!;
    })();
  }
  return _initPoolPromise;
}

async function ensureTables(pool: Pool) {
  if (!global._authDbInitPromise) {
    global._authDbInitPromise = (async () => {
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

      const dev = (process.env.DEVELOPER_EMAIL || '').trim().toLowerCase();
      const admin = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
      const upsert = (email: string, role: string, name: string) =>
        pool.query(
          `INSERT INTO users (name, email, role, subscription_tier, allowed_wards, allowed_galis)
           VALUES ($1, $2, $3, 'paid', 'all', 'all')
           ON CONFLICT (email) DO UPDATE SET role = $3, subscription_tier = 'paid', allowed_wards = 'all', allowed_galis = 'all'`,
          [name, email, role]
        );

      if (dev) await upsert(dev, 'developer', 'Lead Developer').catch(() => {});
      if (admin && admin !== dev) await upsert(admin, 'admin', 'Campaign Administrator').catch(() => {});
    })().catch((err) => {
      global._authDbInitPromise = undefined;
      throw err;
    });
  }
  return global._authDbInitPromise;
}

/**
 * Returns the centralized PostgreSQL database connection for authentication, user RBAC, and rate limits.
 */
export async function getAuthDb(): Promise<IAuthDb> {
  const pool = await getPool();
  await ensureTables(pool);

  return {
    get: async <T = any>(sql: string, params: any[] = []) =>
      (await pool.query(toPg(sql), params)).rows[0] as T | undefined,
    all: async <T = any>(sql: string, params: any[] = []) =>
      (await pool.query(toPg(sql), params)).rows as T[],
    run: async (sql: string, params: any[] = []) => {
      let pgSql = toPg(sql);
      if (/^\s*INSERT\s+INTO\s+users\b/i.test(pgSql) && !/RETURNING/i.test(pgSql)) {
        pgSql += ' RETURNING id';
      }
      const res = await pool.query(pgSql, params);
      return { lastID: res.rows?.[0]?.id, changes: res.rowCount ?? 0 };
    },
    exec: (sql: string) => pool.query(sql).then(() => {}),
  };
}
