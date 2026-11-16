import { NextResponse } from 'next/server';
import { getDbPath, openReadonlyDb } from '@/utils/dbPath';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/authOptions";
import { checkSuperUser } from '@/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const election = (searchParams.get('election') || 'vidhan_sabha').toLowerCase();
  const isVidhanSabha = election === 'vidhan_sabha';
  const dbPath = isVidhanSabha
    ? getDbPath('vidhan_sabha', 'vidhansabha.db')
    : getDbPath('nagar_parishad', 'voters.db');

  let db: any = null;
  try {
    const session: any = await getServerSession(authOptions);
    db = await openReadonlyDb(dbPath);

    let wardNumbers: number[] = [];
    if (isVidhanSabha) {
      const parts = await db.all('SELECT DISTINCT part_no as ward FROM voters WHERE part_no IS NOT NULL ORDER BY part_no ASC');
      wardNumbers = parts.map((p: any) => p.ward);
    } else {
      const wards = await db.all('SELECT DISTINCT ward FROM voters WHERE ward IS NOT NULL ORDER BY ward ASC');
      wardNumbers = wards.map((w: any) => w.ward);
    }

    // Role-based allowed_wards filter for paid booth workers
    if (session && session.user) {
      const role = session.user.role || 'public';
      const tier = session.user.subscription_tier || 'free';
      const allowed = session.user.allowed_wards;
      const { isSuperUser } = checkSuperUser(session.user);
      const isPaid = role === 'paid' || tier === 'paid';
      
      if (!isSuperUser && isPaid) {
        if (!allowed || allowed.trim() === '') {
          wardNumbers = [];
        } else if (allowed !== 'all') {
          const allowedArr = allowed.split(',').map((w: string) => parseInt(w.trim(), 10)).filter((w: number) => !isNaN(w));
          wardNumbers = wardNumbers.filter(w => allowedArr.includes(w));
        }
      }
    }

    const tableInfo = await db.all('PRAGMA table_info(voters)');
    const hasDeletedCol = tableInfo.some((c: any) => c.name === 'is_deleted_or_shifted');
    const countSql = hasDeletedCol
      ? 'SELECT COUNT(*) as total FROM voters WHERE (is_deleted_or_shifted = 0 OR is_deleted_or_shifted IS NULL)'
      : 'SELECT COUNT(*) as total FROM voters';
    const countRow = await db.get(countSql);
    return NextResponse.json({ 
      success: true, 
      data: wardNumbers, 
      totalVoters: countRow.total,
      election,
      electionName: isVidhanSabha ? 'विधान सभा (137-पचपदरा)' : 'नगर परिषद बालोतरा'
    });

  } catch (error: any) {
    console.error('Database error in /api/wards:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (db) {
      await db.close().catch((err: any) => console.error('Error closing wards DB:', err));
    }
  }
}
