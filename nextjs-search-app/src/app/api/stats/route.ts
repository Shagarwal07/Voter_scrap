import { NextResponse } from 'next/server';
import fs from 'fs';
import { getElectionDbPath, openReadonlyDb } from '@/utils/dbPath';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const election = (searchParams.get('election') || 'vidhan_sabha').toLowerCase();
  const isVidhanSabha = election === 'vidhan_sabha';
  const dbPath = getElectionDbPath(election, 'voters');

  if (!fs.existsSync(dbPath)) {
    return NextResponse.json({ 
      success: false, 
      error: `Electoral database for ${election} (${election === 'vidhan_sabha' ? 'Vidhan Sabha' : 'Nagar Parishad'}) is not found locally. Please run fetch-db.js to sync.` 
    }, { status: 503 });
  }

  let db: any = null;
  try {
    db = await openReadonlyDb(dbPath);

    // 1. Determine column name (part_no for Vidhan Sabha, ward for Nagar Parishad)
    const wardCol = isVidhanSabha ? 'part_no' : 'ward';

    // Dynamically check if is_deleted_or_shifted column exists
    const tableInfo = await db.all('PRAGMA table_info(voters)');
    const hasDeletedCol = tableInfo.some((c: any) => c.name === 'is_deleted_or_shifted');
    const activeCondition = hasDeletedCol ? 'WHERE (is_deleted_or_shifted = 0 OR is_deleted_or_shifted IS NULL)' : '';

    const statsQuery = `
      SELECT 
        ${wardCol} as ward,
        COUNT(*) as total,
        SUM(CASE WHEN gender = 'male' THEN 1 ELSE 0 END) as male,
        SUM(CASE WHEN gender = 'female' THEN 1 ELSE 0 END) as female,
        SUM(CASE WHEN gender != 'male' AND gender != 'female' THEN 1 ELSE 0 END) as other
      FROM voters 
      ${activeCondition}
      GROUP BY ${wardCol}
      ORDER BY ${wardCol} ASC
    `;
    const wardStats = await db.all(statsQuery);

    // 2. For each ward/part, get active serial numbers and calculate missing
    const results = [];
    
    for (const stat of wardStats) {
      if (!stat.ward) continue;
      
      const maxRow = await db.get(
        `SELECT MAX(serial_number) as maxSerial FROM voters WHERE ${wardCol} = ?`,
        [stat.ward]
      );
      const maxSerial = maxRow?.maxSerial || 0;

      const activeQuery = hasDeletedCol 
        ? `SELECT serial_number FROM voters WHERE ${wardCol} = ? AND (is_deleted_or_shifted = 0 OR is_deleted_or_shifted IS NULL) ORDER BY serial_number ASC`
        : `SELECT serial_number FROM voters WHERE ${wardCol} = ? ORDER BY serial_number ASC`;

      const serialsResult = await db.all(activeQuery, [stat.ward]);
      const activeSerials = new Set(
        serialsResult.map((row: any) => row.serial_number).filter((s: any) => s !== null && s !== undefined)
      );
      
      const missing: number[] = [];
      if (maxSerial > 0) {
        for (let i = 1; i <= maxSerial; i++) {
          if (!activeSerials.has(i)) {
            missing.push(i);
          }
        }
      }

      results.push({
        ward: stat.ward,
        total: stat.total,
        male: stat.male || 0,
        female: stat.female || 0,
        other: stat.other || 0,
        missing: missing
      });
    }

    return NextResponse.json({ success: true, data: results, election });

  } catch (error: any) {
    console.error('Database stats error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (db) {
      await db.close().catch((err: any) => console.error('Error closing stats DB:', err));
    }
  }
}
