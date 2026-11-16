import path from 'path';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

/**
 * Deterministic database path resolution for GCP VM and local development.
 * Resolves subfolder datasets (vidhan_sabha / nagar_parishad) without sync bottlenecks.
 */
export function getDbPath(subfolder: 'vidhan_sabha' | 'nagar_parishad' | 'seeds', filename: string): string {
  return path.resolve(process.cwd(), 'data', subfolder, filename);
}

export function getElectionDbPath(election: string, type: 'voters' | 'houses'): string {
  const isVs = election === 'vidhan_sabha';
  const subfolder = isVs ? 'vidhan_sabha' : 'nagar_parishad';
  const filename = type === 'voters'
    ? (isVs ? 'vidhansabha.db' : 'voters.db')
    : (isVs ? 'vidhansabha_house.db' : 'houses.db');
  return getDbPath(subfolder, filename);
}

export async function openReadonlyDb(filePath: string): Promise<Database> {
  return open({
    filename: filePath,
    driver: sqlite3.Database,
    mode: sqlite3.OPEN_READONLY
  });
}

export async function resolveDynamicWard(vDb: Database, scopeCol: string, rawWard: string | number | null | undefined): Promise<number | null> {
  const parsed = rawWard !== null && rawWard !== undefined && rawWard !== '' ? parseInt(String(rawWard), 10) : NaN;
  if (!isNaN(parsed)) {
    const match = await vDb.get(`SELECT 1 FROM voters WHERE ${scopeCol} = ? LIMIT 1`, [parsed]);
    if (match) return parsed;
  }
  if (scopeCol === 'ward') {
    const ward5 = await vDb.get(`SELECT 1 FROM voters WHERE ward = 5 LIMIT 1`);
    if (ward5) return 5;
  }
  const first = await vDb.get(`SELECT DISTINCT ${scopeCol} as w FROM voters WHERE ${scopeCol} IS NOT NULL ORDER BY ${scopeCol} ASC LIMIT 1`);
  return first ? Number(first.w) : null;
}

