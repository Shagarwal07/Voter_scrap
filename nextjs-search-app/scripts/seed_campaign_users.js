const path = require('path');
const fs = require('fs');
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
  console.error('[seed_campaign_users] ERROR: DATABASE_URL is missing in .env.local');
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

// 3. Campaign volunteer accounts from screenshots
const CAMPAIGN_USERS = [
  { name: 'Danik Bhaskar', email: 'mayankavasthi039@gmail.com', role: 'user', subscription_tier: 'paid', allowed_wards: '19' },
  { name: 'Pramod ji', email: 'pmgoyal04@gmail.com', role: 'user', subscription_tier: 'paid', allowed_wards: 'all' },
  { name: 'Bharat ji', email: 'bindal.bharat@gmail.com', role: 'user', subscription_tier: 'paid', allowed_wards: '3' },
  { name: 'Pankaj ji', email: 'pankajbansal612@gmail.com', role: 'user', subscription_tier: 'paid', allowed_wards: '11' },
  { name: 'Vishnu bhaiya', email: 'vishnuag901@gmail.com', role: 'user', subscription_tier: 'paid', allowed_wards: '3' },
  { name: 'Kunal BANSAL', email: 'kunalbansalrocks@gmail.com', role: 'user', subscription_tier: 'paid', allowed_wards: '3,5,11' },
  { name: 'Bharat ji Modi', email: 'bharatmanakmodi@gmail.com', role: 'user', subscription_tier: 'paid', allowed_wards: 'all' },
  { name: 'Gopal ji', email: 'gopalsain485@gmail.com', role: 'user', subscription_tier: 'paid', allowed_wards: '31' },
  { name: 'Meet ji', email: 'meetsain9@gmail.com', role: 'user', subscription_tier: 'paid', allowed_wards: '31' },
  { name: 'Bharat ji', email: 'bharatdaiya.balotra@gmail.com', role: 'user', subscription_tier: 'paid', allowed_wards: '31' },
  { name: 'Prithvi ji', email: 'prithvi106345@gmail.com', role: 'user', subscription_tier: 'paid', allowed_wards: '3,11' },
  { name: 'DILIP JI', email: 'dilipdhandhal28@gmail.com', role: 'user', subscription_tier: 'paid', allowed_wards: '3,11' },
  { name: 'M Vaishnav ji', email: 'mvaishnav84@gmail.com', role: 'user', subscription_tier: 'paid', allowed_wards: '31' },
  { name: '', email: 'ramaramsain82@gmail.com', role: 'user', subscription_tier: 'paid', allowed_wards: '31' },
  { name: 'Vinod-49', email: 'vinodborana680@gmail.com', role: 'user', subscription_tier: 'paid', allowed_wards: '49' },
  { name: 'Kheemar-49', email: 'kheemar49@gmail.com', role: 'user', subscription_tier: 'paid', allowed_wards: '49' },
  { name: 'Manohar-49', email: 'manohard72@gmail.com', role: 'user', subscription_tier: 'paid', allowed_wards: '49' },
  { name: 'RANA-49', email: 'rkrana8219@gmail.com', role: 'user', subscription_tier: 'paid', allowed_wards: '49' },
  { name: '', email: 'ummedsinght610@gmail.com', role: 'user', subscription_tier: 'paid', allowed_wards: '49' },
  { name: 'Campaign Administrator', email: 'rk.coachings20@gmail.com', role: 'admin', subscription_tier: 'paid', allowed_wards: 'all' }
];

async function seed() {
  const { Pool } = require('pg');
  const poolConfig = await getPoolConfig(databaseUrl);
  const pool = new Pool(poolConfig);

  console.log('[seed_campaign_users] Connecting to Cloud PostgreSQL...');
  
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
  `);

  console.log(`[seed_campaign_users] Upserting ${CAMPAIGN_USERS.length} campaign accounts...`);

  for (const user of CAMPAIGN_USERS) {
    const cleanEmail = user.email.trim().toLowerCase();
    await pool.query(`
      INSERT INTO users (name, email, role, subscription_tier, allowed_wards, allowed_galis)
      VALUES ($1, $2, $3, $4, $5, 'all')
      ON CONFLICT (email) DO UPDATE SET
        name = CASE WHEN users.name = '' OR users.name IS NULL THEN EXCLUDED.name ELSE users.name END,
        role = EXCLUDED.role,
        subscription_tier = EXCLUDED.subscription_tier,
        allowed_wards = EXCLUDED.allowed_wards,
        allowed_galis = 'all';
    `, [user.name, cleanEmail, user.role, user.subscription_tier, user.allowed_wards]);

    console.log(`  ✓ Synced: ${cleanEmail.padEnd(32)} | Wards: ${user.allowed_wards}`);
  }

  // Verification
  const total = await pool.query('SELECT count(*) as count FROM users');
  console.log(`\n[seed_campaign_users] Total users now in PostgreSQL: ${total.rows[0].count}`);

  const allUsers = await pool.query('SELECT id, name, email, role, subscription_tier, allowed_wards FROM users ORDER BY id ASC');
  console.log('\n[seed_campaign_users] Current Users List:');
  allUsers.rows.forEach(r => {
    console.log(`  [#${String(r.id).padStart(2)}] ${(r.name || 'No Name').padEnd(20)} | ${r.email.padEnd(32)} | ${r.subscription_tier.toUpperCase()} | Wards: ${r.allowed_wards}`);
  });

  await pool.end();
  console.log('\n[seed_campaign_users] All accounts successfully seeded into Cloud PostgreSQL.');
}

seed().catch(err => {
  console.error('[seed_campaign_users] Error:', err);
  process.exit(1);
});

