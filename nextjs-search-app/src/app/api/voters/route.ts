import { NextResponse } from 'next/server';
import fs from 'fs';
import { getElectionDbPath, openReadonlyDb } from '@/utils/dbPath';
import { getAuthDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/authOptions";
import { checkSuperUser } from '@/utils/auth';

export const dynamic = 'force-dynamic';

// In-memory rate limiter for paid users (30 requests per minute per IP to prevent runaway bot loops)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export async function GET(request: Request) {
  let ip = request.headers.get('x-forwarded-for') || 'unknown_ip';
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim(); // Prevent IP spoofing by strictly taking the true original IP
  }

  const now = Date.now();
  const windowMs24h = 24 * 60 * 60 * 1000; // 24 hours for freemium

  const { searchParams } = new URL(request.url);
  
  // Anti-Scraping: Strip SQL wildcard characters (% and _) from user query to prevent database dumping
  const rawQuery = (searchParams.get('q') || '').trim();
  const query = rawQuery.replace(/[%_]/g, '');
  const type = searchParams.get('type') || 'name'; // 'name', 'voter_id', 'house', 'serial', 'relative_name'
  const election = (searchParams.get('election') || 'vidhan_sabha').toLowerCase();
  const isVidhanSabha = election === 'vidhan_sabha';
  const wardCol = isVidhanSabha ? 'part_no' : 'ward';

  const rawWard = (searchParams.get('ward') || '').trim();
  let targetWard: number | null = null;
  if (rawWard !== '') {
    const parsed = parseInt(rawWard, 10);
    if (isNaN(parsed) || parsed <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid ward/part parameter' }, { status: 400 });
    }
    targetWard = parsed;
  }

  let db: any = null;
  try {
    const session: any = await getServerSession(authOptions);
    const role = session?.user?.role || 'public';
    const { isDeveloper, isAdmin, isSuperUser } = checkSuperUser(session?.user);
    const isPaid = role === 'paid' || session?.user?.subscription_tier === 'paid';
    const isPrivileged = isSuperUser || isPaid;

    // --- ANTI-SCRAPING & DATA LEAK DEFENSES ---

    // Rule 1: Public users (not logged in) can ONLY search by Voter ID
    if (role === 'public' && type !== 'voter_id') {
      return NextResponse.json({ 
        success: false, 
        error: 'Public users can only search by Voter ID. Please sign in with Google to search by Name.' 
      }, { status: 403 });
    }

    // Rule 2: Unauthenticated and guest users CANNOT browse or dump the database with an empty query
    if (!isPrivileged && !query) {
      return NextResponse.json({ 
        success: true, 
        data: [], 
        message: 'Please enter a search query (Voter ID, name, or house number).',
        pagination: { currentPage: 1, totalPages: 0, totalItems: 0, limit: 25 }
      });
    }

    // Rule 3: Enforce minimum query length to prevent single-letter scraping sweeps
    if (!isPrivileged && query) {
      const minLength = (type === 'voter_id' || type === 'serial') ? 2 : 3;
      if (query.length < minLength) {
        return NextResponse.json({ 
          success: false, 
          error: `Search query too short. Please enter at least ${minLength} characters.` 
        }, { status: 400 });
      }
    }

    // Rule 4: Pagination clamping (Superusers get up to 200/page, Paid get 100/page, Free get 25/page)
    let limit = Number(searchParams.get('limit')) || 25;
    if (!Number.isFinite(limit)) limit = 25;
    if (isSuperUser) {
      limit = Math.min(Math.max(1, limit), 200);
    } else if (isPaid) {
      limit = Math.min(Math.max(1, limit), 100);
    } else {
      limit = Math.min(Math.max(1, limit), 25);
    }

    let page = Number(searchParams.get('page')) || 1;
    if (!Number.isFinite(page) || page < 1) page = 1;

    // Rule 5: Hard cap on deep pagination only for non-privileged free/public users
    if (!isPrivileged && page > 4) {
      return NextResponse.json({ 
        success: false, 
        error: 'Pagination limit reached. Please refine your search query for more specific results.',
        code: 'PAGE_LIMIT_EXCEEDED' 
      }, { status: 403 });
    }

    // --- RATE LIMITING LOGIC ---
    if (isSuperUser) {
      // RULE: Developers and Admins can search WITHOUT ANY LIMIT (Zero throttling, Zero quotas)
    } else if (isPaid) {
      // TIER 2: PAID USERS - Unlimited daily total, 30 requests/minute safety guard against bot loops
      const rateLimitData = rateLimitMap.get(ip);
      const windowMs = 60 * 1000;
      if (rateLimitData) {
        if (now > rateLimitData.resetTime) {
          rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
        } else {
          rateLimitData.count++;
          if (rateLimitData.count > 30) {
            return NextResponse.json({ 
              success: false, 
              error: 'Rate limit exceeded. Please wait a minute before searching again.', 
              code: 'RATE_LIMIT_PAID' 
            }, { status: 429 });
          }
        }
      } else {
        rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      }
    } else {
      // TIER 1: PUBLIC & FREE GUESTS - Persistent IP or User Email tracking in PostgreSQL
      const isGuestUser = role === 'guest' || role === 'user';
      const clientEmail = session?.user?.email ? session.user.email.toLowerCase().trim() : null;
      const clientIdentifier = (isGuestUser && clientEmail) ? `user:${clientEmail}` : `ip:${ip}`;
      const quotaLimit = isGuestUser ? 4 : 2; // Public gets 2, Guests get 4 total

      const authDb = await getAuthDb();
      try {
        await authDb.run(`
          INSERT INTO public_limits (ip, search_count, last_reset) 
          VALUES (?, 1, ?)
          ON CONFLICT(ip) DO UPDATE SET 
            search_count = CASE 
              WHEN ? > public_limits.last_reset + ? THEN 1 
              ELSE public_limits.search_count + 1 
            END,
            last_reset = CASE 
              WHEN ? > public_limits.last_reset + ? THEN ? 
              ELSE public_limits.last_reset 
            END
        `, [clientIdentifier, now, now, windowMs24h, now, windowMs24h, now]);

        const record = await authDb.get('SELECT search_count FROM public_limits WHERE ip = ?', [clientIdentifier]);
        const currentCount = record?.search_count || 1;

        if (currentCount > quotaLimit) {
          const code = isGuestUser ? 'QUOTA_EXCEEDED_GUEST' : 'QUOTA_EXCEEDED_PUBLIC';
          return NextResponse.json({ 
            success: false, 
            error: 'Daily search limit exceeded.', 
            code 
          }, { status: 429 });
        }
      } catch (authErr) {
        console.error("Auth DB rate limit error:", authErr);
      }
    }
    // --- END RATE LIMITING ---

    let allowedArr: number[] = [];
    
    // Ward / Part Restriction Enforcement
    if (isSuperUser) {
      // Developers and Admins have unrestricted access across all parts / wards
    } else if (isPaid) {
      const allowed = session?.user?.allowed_wards;
      if (allowed === 'all') {
        // Allowed all
      } else if (allowed && allowed.trim() !== '') {
        allowedArr = allowed.split(',').map((w: string) => parseInt(w.trim(), 10)).filter((w: number) => !isNaN(w));
        if (targetWard !== null && !allowedArr.includes(targetWard)) {
          return NextResponse.json({ success: false, error: 'Forbidden part/ward access' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ success: false, error: 'Your account has not been assigned to any wards or parts. Please contact the administrator.' }, { status: 403 });
      }
    } else if (role === 'user' || role === 'guest') {
      const allowed = session?.user?.allowed_wards;
      if (allowed && allowed !== 'all' && allowed.trim() !== '') {
        allowedArr = allowed.split(',').map((w: string) => parseInt(w.trim(), 10)).filter((w: number) => !isNaN(w));
        if (targetWard !== null && !allowedArr.includes(targetWard)) {
          return NextResponse.json({ success: false, error: 'Forbidden part/ward access' }, { status: 403 });
        }
      }
    }

    const dbPath = getElectionDbPath(election, 'voters');
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ 
        success: false, 
        error: `Electoral database for ${election} (${election === 'vidhan_sabha' ? 'Vidhan Sabha' : 'Nagar Parishad'}) is not found locally. Please run fetch-db.js to sync.` 
      }, { status: 503 });
    }

    db = await openReadonlyDb(dbPath);

    const tableInfo = await db.all('PRAGMA table_info(voters)');
    const hasDeletedCol = tableInfo.some((c: any) => c.name === 'is_deleted_or_shifted');
    const activeCondition = hasDeletedCol ? ' AND (is_deleted_or_shifted = 0 OR is_deleted_or_shifted IS NULL)' : '';

    let voters: any[] = [];
    let totalItems = 0;
    let totalPages = 1;
    let currentPage = page;

    const executePaginatedSql = async (baseQuery: string, countQuery: string, params: any[]) => {
      const [countResult, dataResult] = await Promise.all([
        db.get(countQuery, params),
        db.all(`${baseQuery} LIMIT ? OFFSET ?`, [...params, limit, (Math.max(1, page) - 1) * limit])
      ]);
      
      totalItems = countResult?.total || 0;
      totalPages = Math.max(1, Math.ceil(totalItems / limit));
      currentPage = Math.min(Math.max(1, page), totalPages);
      
      if (page > totalPages) {
        const safeOffset = (currentPage - 1) * limit;
        return await db.all(`${baseQuery} LIMIT ? OFFSET ?`, [...params, limit, safeOffset]);
      }
      return dataResult;
    };

    if (query) {
      if (type === 'voter_id') {
        let baseSql = `SELECT * FROM voters WHERE voter_id LIKE ? ${activeCondition}`;
        let countSql = `SELECT COUNT(*) as total FROM voters WHERE voter_id LIKE ? ${activeCondition}`;
        let params: (string | number)[] = [`%${query.toUpperCase()}%`];
        
        if (targetWard !== null) {
          baseSql += ` AND ${wardCol} = ?`;
          countSql += ` AND ${wardCol} = ?`;
          params.push(targetWard);
        } else if (allowedArr.length > 0) {
          const inClause = `AND ${wardCol} IN (${allowedArr.map(() => '?').join(',')})`;
          baseSql += ` ${inClause}`;
          countSql += ` ${inClause}`;
          params.push(...allowedArr);
        }
        
        voters = await executePaginatedSql(baseSql, countSql, params);

      } else if (type === 'serial') {
        const serialNum = parseInt(query, 10);
        if (isNaN(serialNum)) {
          return NextResponse.json({ success: false, error: 'Serial number must be a valid integer' }, { status: 400 });
        }
        
        let baseSql = `SELECT * FROM voters WHERE serial_number = ? ${activeCondition}`;
        let countSql = `SELECT COUNT(*) as total FROM voters WHERE serial_number = ? ${activeCondition}`;
        let params: (string | number)[] = [serialNum];
        
        if (targetWard !== null) {
          baseSql += ` AND ${wardCol} = ?`;
          countSql += ` AND ${wardCol} = ?`;
          params.push(targetWard);
        } else if (allowedArr.length > 0) {
          const inClause = `AND ${wardCol} IN (${allowedArr.map(() => '?').join(',')})`;
          baseSql += ` ${inClause}`;
          countSql += ` ${inClause}`;
          params.push(...allowedArr);
        }
        
        voters = await executePaginatedSql(baseSql, countSql, params);

      } else if (type === 'house') {
        let baseSql = `SELECT * FROM voters WHERE house_number LIKE ? ${activeCondition}`;
        let countSql = `SELECT COUNT(*) as total FROM voters WHERE house_number LIKE ? ${activeCondition}`;
        let params: (string | number)[] = [`%${query}%`];
        
        if (targetWard !== null) {
          baseSql += ` AND ${wardCol} = ?`;
          countSql += ` AND ${wardCol} = ?`;
          params.push(targetWard);
        } else if (allowedArr.length > 0) {
          const inClause = `AND ${wardCol} IN (${allowedArr.map(() => '?').join(',')})`;
          baseSql += ` ${inClause}`;
          countSql += ` ${inClause}`;
          params.push(...allowedArr);
        }
        
        voters = await executePaginatedSql(baseSql, countSql, params);

      } else if (type === 'relative_name') {
        let baseSql = `SELECT * FROM voters WHERE relative_name_hi LIKE ? ${activeCondition}`;
        let countSql = `SELECT COUNT(*) as total FROM voters WHERE relative_name_hi LIKE ? ${activeCondition}`;
        let params: (string | number)[] = [`%${query}%`];
        
        if (targetWard !== null) {
          baseSql += ` AND ${wardCol} = ?`;
          countSql += ` AND ${wardCol} = ?`;
          params.push(targetWard);
        } else if (allowedArr.length > 0) {
          const inClause = `AND ${wardCol} IN (${allowedArr.map(() => '?').join(',')})`;
          baseSql += ` ${inClause}`;
          countSql += ` ${inClause}`;
          params.push(...allowedArr);
        }
        
        voters = await executePaginatedSql(baseSql, countSql, params);

      } else {
        // Name Search (name_hi or relative_name_hi)
        let baseSql = `SELECT * FROM voters WHERE (name_hi LIKE ? OR relative_name_hi LIKE ?) ${activeCondition}`;
        let countSql = `SELECT COUNT(*) as total FROM voters WHERE (name_hi LIKE ? OR relative_name_hi LIKE ?) ${activeCondition}`;
        let params: (string | number)[] = [`%${query}%`, `%${query}%`];
        
        if (targetWard !== null) {
          baseSql += ` AND ${wardCol} = ?`;
          countSql += ` AND ${wardCol} = ?`;
          params.push(targetWard);
        } else if (allowedArr.length > 0) {
          const inClause = `AND ${wardCol} IN (${allowedArr.map(() => '?').join(',')})`;
          baseSql += ` ${inClause}`;
          countSql += ` ${inClause}`;
          params.push(...allowedArr);
        }
        
        voters = await executePaginatedSql(baseSql, countSql, params);
      }
    } else {
      // Privileged browsing without a search query
      let baseSql = `SELECT * FROM voters WHERE 1=1 ${activeCondition}`;
      let countSql = `SELECT COUNT(*) as total FROM voters WHERE 1=1 ${activeCondition}`;
      let params: (string | number)[] = [];
      
      if (targetWard !== null) {
        baseSql += ` AND ${wardCol} = ?`;
        countSql += ` AND ${wardCol} = ?`;
        params = [targetWard];
      } else if (allowedArr.length > 0) {
        const inClause = `AND ${wardCol} IN (${allowedArr.map(() => '?').join(',')})`;
        baseSql += ` ${inClause}`;
        countSql += ` ${inClause}`;
        params = allowedArr;
      }
      
      voters = await executePaginatedSql(baseSql, countSql, params);
    }
    // Normalize field representation for both Vidhan Sabha (part_no) and Nagar Parishad (ward)
    voters = voters.map((voter: any) => ({
      ...voter,
      ward: voter.ward || voter.part_no || '',
    }));

    // Mask Voter ID for non-privileged users
    if (!isPrivileged) {
      voters = voters.map((voter: any) => {
        const { id, ...safeRecord } = voter;
        let maskedId = '***';
        if (voter.voter_id && voter.voter_id.length > 4) {
          const v = voter.voter_id;
          maskedId = v.substring(0, 3) + '****' + v.substring(v.length - 3);
        }
        return { ...safeRecord, voter_id: maskedId };
      });
    }

    return NextResponse.json({
      success: true,
      data: voters,
      election,
      pagination: {
        currentPage,
        totalPages,
        totalItems,
        limit,
      },
    });

  } catch (error: any) {
    console.error('Database error in /api/voters:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (db) {
      await db.close().catch((err: any) => console.error('Error closing voter DB:', err));
    }
  }
}
