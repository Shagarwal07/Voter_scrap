import { NextResponse } from 'next/server';
import { getElectionDbPath, openReadonlyDb } from '@/utils/dbPath';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/authOptions";
import { checkSuperUser } from '@/utils/auth';

export const dynamic = 'force-dynamic';

interface GaliScope {
  isAll: boolean;
  isUnassigned: boolean;
  allowedList: string[];
}

/**
 * Parses user session into deterministic geographical clearance.
 */
function parseGaliScope(isSuperUser: boolean, isPaid: boolean, rawAllowed?: string | null): GaliScope {
  if (isSuperUser) {
    return { isAll: true, isUnassigned: false, allowedList: [] };
  }
  if (!isPaid) {
    return { isAll: false, isUnassigned: true, allowedList: [] };
  }
  const allowed = (rawAllowed || '').trim();
  if (!allowed) {
    return { isAll: false, isUnassigned: true, allowedList: [] };
  }
  if (allowed.toLowerCase() === 'all') {
    return { isAll: true, isUnassigned: false, allowedList: ['all'] };
  }
  const allowedList = allowed.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  return { isAll: false, isUnassigned: allowedList.length === 0, allowedList };
}

/**
 * Checks if target block/slip and gali are permitted under user's assigned jurisdiction.
 * Supports hierarchical inheritance: Block permission implies access to all galis within that block.
 */
function isTargetAllowed(
  scope: GaliScope,
  isVidhanSabha: boolean,
  block: string,
  gali: string
): boolean {
  if (scope.isAll) return true;
  if (scope.isUnassigned) return false;

  const bLower = (block || '').trim().toLowerCase();
  const gLower = (gali || '').trim().toLowerCase();

  if (isVidhanSabha) {
    const match = bLower.match(/(?:(?:भाग|part)\s*(\d+)\s*-\s*)?(?:slip|पर्ची)\s*(\d+)/i);
    const partNum = match && match[1] ? match[1] : '';
    const slipNum = match && match[2] ? match[2].padStart(2, '0') : '';
    const canonicalSlip = slipNum ? `slip ${slipNum}` : '';

    return scope.allowedList.some(item => {
      if (bLower && item === bLower) return true;
      if (partNum && (item === `part ${partNum}` || item === `part ${parseInt(partNum, 10)}`)) return true;
      if (partNum && canonicalSlip && item === `part ${partNum} - ${canonicalSlip}`) return true;
      if (canonicalSlip && item === canonicalSlip) return true;
      return false;
    });
  } else {
    return scope.allowedList.some(item => {
      // 1. Whole block clearance
      if (bLower && item === bLower) return true;

      // 2. Exact "Block - Gali" clearance
      const fullLabel = (bLower && gLower) ? `${bLower} - ${gLower}` : '';
      if (fullLabel && item === fullLabel) return true;

      // 3. User selected parent block only, and has a street in this block
      if (bLower && !gLower && item.startsWith(`${bLower} - `)) return true;

      // 4. Standalone gali match
      if (gLower && item === gLower) return true;

      return false;
    });
  }
}

/**
 * Injects SQL scoping conditions when a restricted paid user searches by name without selecting a block.
 * Prevents cross-ward/cross-beat data leakage.
 */
function buildAutoScopeSql(
  scope: GaliScope,
  isVidhanSabha: boolean,
  alias = ''
): { sqlClause: string; params: (string | number)[] } {
  const pfx = alias ? `${alias}.` : '';
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (scope.isAll) {
    return { sqlClause: '', params: [] };
  }
  if (scope.isUnassigned) {
    return { sqlClause: ' AND 1=0', params: [] };
  }

  for (const item of scope.allowedList) {
    if (isVidhanSabha) {
      // Skip Nagar Parishad items when querying Vidhan Sabha
      if (!item.includes('part') && !item.includes('slip') && !item.includes('पर्ची') && !item.includes('भाग')) {
        continue;
      }
      const match = item.match(/(?:(?:भाग|part)\s*(\d+)\s*-\s*)?(?:slip|पर्ची)\s*(\d+)/i);
      if (match) {
        const part = match[1] ? parseInt(match[1], 10) : null;
        const slipNum = match[2];
        const slipFormatted = `Slip ${slipNum.padStart(2, '0')}`;
        const slipAlt = `Slip ${parseInt(slipNum, 10)}`;

        if (part !== null) {
          clauses.push(`(${pfx}part_no = ? AND (${pfx}slip_label = ? OR ${pfx}slip_label = ?))`);
          params.push(part, slipFormatted, slipAlt);
        } else {
          clauses.push(`(${pfx}slip_label = ? OR ${pfx}slip_label = ?)`);
          params.push(slipFormatted, slipAlt);
        }
      } else if (item.startsWith('part ')) {
        const part = parseInt(item.replace('part ', '').trim(), 10);
        if (!isNaN(part)) {
          clauses.push(`(${pfx}part_no = ?)`);
          params.push(part);
        }
      }
    } else {
      // Skip Vidhan Sabha items when querying Nagar Parishad
      if (item.startsWith('part ') || item.startsWith('भाग ') || item.includes('slip') || item.includes('पर्ची')) {
        continue;
      }
      // Nagar Parishad
      if (item.includes(' - ')) {
        const parts = item.split(' - ');
        const b = parts[0].trim();
        const g = parts.slice(1).join(' - ').trim();
        clauses.push(`(LOWER(${pfx}block) = ? AND LOWER(${pfx}gali) = ?)`);
        params.push(b, g);
      } else {
        // Whole block assigned
        clauses.push(`(LOWER(${pfx}block) = ?)`);
        params.push(item);
      }
    }
  }

  if (clauses.length === 0) {
    return { sqlClause: ' AND 1=0', params: [] }; // No matching jurisdiction for this election
  }

  return {
    sqlClause: ` AND (${clauses.join(' OR ')})`,
    params
  };
}

export async function GET(request: Request) {
  const session: any = await getServerSession(authOptions);
  const role = session?.user?.role || 'public';
  const tier = session?.user?.subscription_tier || 'free';
  const { isSuperUser } = checkSuperUser(session?.user);
  const isPaid = role === 'paid' || tier === 'paid';

  const { searchParams } = new URL(request.url);
  const election = (searchParams.get('election') || 'nagar_parishad').toLowerCase();
  const isVidhanSabha = election === 'vidhan_sabha';
  const isMeta = searchParams.get('meta') === 'true';
  const query = (searchParams.get('q') || '').trim().replace(/[%_]/g, '');
  const block = (searchParams.get('block') || '').trim().replace(/[%_]/g, '');
  const gali = (searchParams.get('gali') || '').trim().replace(/[%_]/g, '');

  // 1. Feature Gate: Only Developer, Admin, and Paid users can query voter records in houses
  if (!isMeta && !isSuperUser && !isPaid) {
    return NextResponse.json({
      success: false,
      error: 'Feature locked: Gali & Household Finder is exclusive to Paid campaign subscribers and Administrators.',
      code: 'SUBSCRIPTION_REQUIRED'
    }, { status: 403 });
  }

  // 2. Parse geographical clearance
  const scope = parseGaliScope(isSuperUser, isPaid, session?.user?.allowed_galis);

  // 3. Metadata handler (populates dropdowns safely and scoped to user beat)
  if (isMeta) {
    if (!isSuperUser && !isPaid) {
      return NextResponse.json({ success: true, mapping: {}, election });
    }
    if (scope.isUnassigned) {
      return NextResponse.json({ success: true, mapping: {}, election });
    }

    const dbPath = getElectionDbPath(election, 'houses');
    try {
      const db = await openReadonlyDb(dbPath);

      try {
        if (election === 'vidhan_sabha') {
          const rows = await db.all<{ part_no: number; slip_label: string; batch_label: string; house_name: string }[]>(`
            SELECT part_no, slip_label, batch_label, house_name 
            FROM houses 
            ORDER BY part_no ASC, slip_id ASC, house_num ASC
          `);
          const mapping: Record<string, string[]> = {};
          for (const r of rows) {
            const b = r.part_no ? `Part ${r.part_no} - ${r.slip_label}` : r.slip_label;
            if (!isTargetAllowed(scope, true, b, r.batch_label)) {
              continue; // Drop slips outside user's assigned beat
            }
            if (!mapping[b]) mapping[b] = [];
            if (!mapping[b].includes(r.batch_label)) {
              mapping[b].push(r.batch_label);
            }
          }
          return NextResponse.json({ success: true, mapping, election });
        } else {
          const rows = await db.all<{ block: string; gali: string }[]>(`
            SELECT DISTINCT block, gali 
            FROM houses 
            WHERE block IS NOT NULL AND gali IS NOT NULL
            ORDER BY block ASC, gali ASC
          `);
          const mapping: Record<string, string[]> = {};
          for (const r of rows) {
            if (!isTargetAllowed(scope, false, r.block, r.gali)) {
              continue; // Drop streets outside user's assigned beat
            }
            if (!mapping[r.block]) mapping[r.block] = [];
            if (!mapping[r.block].includes(r.gali)) {
              mapping[r.block].push(r.gali);
            }
          }
          return NextResponse.json({ success: true, mapping, election });
        }
      } finally {
        await db.close();
      }
    } catch (err: any) {
      console.error('Houses metadata error:', err);
      return NextResponse.json({ success: true, mapping: {}, election });
    }
  }

  // 4. Input Validation: Unassigned paid accounts are not authorized for any section -> fallback empty data
  if (!isSuperUser && isPaid && scope.isUnassigned) {
    return NextResponse.json({ success: true, data: [], election });
  }

  // 5. Verification: When user selects a block/gali, verify permission against assigned scope
  if ((block || gali) && !isTargetAllowed(scope, isVidhanSabha, block, gali)) {
    return NextResponse.json({ success: true, data: [], election });
  }

  if (!query && !block && !gali) {
    return NextResponse.json({
      success: false,
      error: isVidhanSabha ? 'Please enter a name or select a Slip' : 'Please enter a name or select a Block/Gali'
    }, { status: 400 });
  }

  const dbPath = getElectionDbPath(election, 'houses');

  try {
    const db = await openReadonlyDb(dbPath);

    try {
      let sql = '';
      const params: any[] = [];

      // Detect schema columns dynamically to avoid querying non-existent columns (e.g. slip_label in Nagar Parishad)
      const tableInfo = await db.all<{ name: string }[]>('PRAGMA table_info(houses)');
      const colNames = new Set(tableInfo.map((c) => c.name.toLowerCase()));
      const hasPartNo = colNames.has('part_no');
      const hasSlipLabel = colNames.has('slip_label');
      const hasBatchLabel = colNames.has('batch_label');
      const hasBlock = colNames.has('block');
      const hasGali = colNames.has('gali');

      // Helper for explicit block/gali filtering
      const applyExplicitFilters = (alias = '') => {
        const pfx = alias ? `${alias}.` : '';
        let filterStr = '';

        if (isVidhanSabha) {
          if (block) {
            const match = block.match(/(?:(?:भाग|Part)\s*(\d+)\s*-\s*)?(?:Slip|पर्ची)\s*(\d+)/i);
            if (match) {
              const part = match[1];
              const slipNum = match[2];
              const slipFormatted = `Slip ${slipNum.padStart(2, '0')}`;
              const slipAlt = `Slip ${parseInt(slipNum, 10)}`;

              if (part && hasPartNo) {
                filterStr += ` AND ${pfx}part_no = ?`;
                params.push(parseInt(part, 10));
              }

              if (hasSlipLabel) {
                filterStr += ` AND (${pfx}slip_label = ? OR ${pfx}slip_label = ?)`;
                params.push(slipFormatted, slipAlt);
              } else if (hasBlock) {
                filterStr += ` AND ${pfx}block = ?`;
                params.push(slipFormatted);
              }
            } else {
              if (hasSlipLabel) {
                filterStr += ` AND ${pfx}slip_label = ?`;
                params.push(block);
              } else if (hasBlock) {
                filterStr += ` AND ${pfx}block = ?`;
                params.push(block);
              }
            }
          }
          if (gali) {
            const batchMatch = gali.match(/(?:House|मकान)\s*(\d+)/i);
            const batchVal = batchMatch ? `House ${batchMatch[1].padStart(2, '0')}` : gali;
            if (hasBatchLabel) {
              filterStr += ` AND ${pfx}batch_label = ?`;
              params.push(batchVal);
            } else if (hasGali) {
              filterStr += ` AND ${pfx}gali = ?`;
              params.push(batchVal);
            }
          }
        } else {
          // Nagar Parishad (only uses block & gali, never non-existent slip_label)
          if (block && hasBlock) {
            filterStr += ` AND LOWER(TRIM(${pfx}block)) = LOWER(TRIM(?))`;
            params.push(block);
          }
          if (gali && hasGali) {
            filterStr += ` AND LOWER(TRIM(${pfx}gali)) = LOWER(TRIM(?))`;
            params.push(gali);
          }
        }
        return filterStr;
      };

      if (query) {
        sql = `
          SELECT DISTINCT h.* 
          FROM houses h
          JOIN house_members m ON h.id = m.house_id
          WHERE m.name LIKE ?
        `;
        params.push(`%${query}%`);

        if (block || gali) {
          sql += applyExplicitFilters('h');
        } else {
          // If no block selected, auto-scope to permitted beat to prevent data leakage
          const autoScope = buildAutoScopeSql(scope, isVidhanSabha, 'h');
          sql += autoScope.sqlClause;
          params.push(...autoScope.params);
        }
      } else {
        sql = `SELECT * FROM houses WHERE 1=1`;
        if (block || gali) {
          sql += applyExplicitFilters();
        } else {
          const autoScope = buildAutoScopeSql(scope, isVidhanSabha);
          sql += autoScope.sqlClause;
          params.push(...autoScope.params);
        }
      }

      sql += ` LIMIT 50`;

      const houses = await db.all(sql, params);

      if (houses.length > 0) {
        const houseIds = houses.map(h => h.id);
        const placeholders = houseIds.map(() => '?').join(',');

        const selectPartCol = hasPartNo ? 'h.part_no as part_no' : 'NULL as part_no';
        const members = await db.all(
          `SELECT m.*, ${selectPartCol} 
           FROM house_members m 
           JOIN houses h ON m.house_id = h.id 
           WHERE m.house_id IN (${placeholders}) 
           ORDER BY m.house_id ASC, m.id ASC`,
          houseIds
        );

        const housesWithMembers = houses.map(house => {
          return {
            ...house,
            members: members.filter(m => m.house_id === house.id)
          };
        });

        return NextResponse.json({ success: true, data: housesWithMembers, election });
      } else {
        return NextResponse.json({ success: true, data: [], election });
      }

    } finally {
      await db.close();
    }
  } catch (error: any) {
    console.error('Houses Database error:', error);
    if (error.code === 'SQLITE_CANTOPEN') {
      return NextResponse.json({ success: true, data: [], election });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

