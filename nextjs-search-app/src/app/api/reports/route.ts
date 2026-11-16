import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDbPath, openReadonlyDb } from '@/utils/dbPath';
import { getGcsBucket } from '@/utils/gcs';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/authOptions";
import { checkSuperUser } from '@/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session: any = await getServerSession(authOptions);
  const role = session?.user?.role || 'public';
  const tier = session?.user?.subscription_tier || 'free';
  const { isSuperUser } = checkSuperUser(session?.user);
  const isPaid = role === 'paid' || tier === 'paid';

  if (!isSuperUser && !isPaid) {
    return NextResponse.json({ 
      success: false, 
      error: 'Feature locked: Voter Slips & PDF Reports are exclusive to Paid campaign subscribers and Administrators.',
      code: 'SUBSCRIPTION_REQUIRED'
    }, { status: 403 });
  }

  // Filter 2: Enforce allowed_wards for paid users (by default empty/NULL)
  let allowedWardArr: number[] = [];
  if (!isSuperUser && isPaid) {
    const allowed = session?.user?.allowed_wards;
    if (!allowed || allowed.trim() === '') {
      return NextResponse.json({ 
        success: true, 
        files: [],
        reports: [],
        election: (new URL(request.url).searchParams.get('election') || 'vidhan_sabha').toLowerCase()
      });
    }
    if (allowed !== 'all') {
      allowedWardArr = allowed.split(',').map((w: string) => parseInt(w.trim(), 10)).filter((w: number) => !isNaN(w));
    }
  }

  const { searchParams } = new URL(request.url);
  const election = (searchParams.get('election') || 'vidhan_sabha').toLowerCase();
  const isVidhanSabha = election === 'vidhan_sabha';
  const datasetName = isVidhanSabha ? 'vidhan_sabha' : 'nagar_parishad';

  try {
    const bucket = getGcsBucket();

    // Helper to generate download URL
    const getReportUrl = async (fileName: string) => {
      let downloadUrl = `/api/reports/download?file=${encodeURIComponent(fileName)}&election=${election}`;
      if (bucket) {
        try {
          const gcsPath = `${datasetName}/Reports/${fileName}`;
          const gcsFile = bucket.file(gcsPath);
          const [signedUrl] = await gcsFile.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
          });
          downloadUrl = signedUrl;
        } catch {
          // Fall back to download endpoint
        }
      }
      return downloadUrl;
    };

    // 2. Discover files locally on disk
    const targetDir = path.join(process.cwd(), 'public', 'reports', datasetName);
    let diskFiles: string[] = [];
    if (fs.existsSync(targetDir)) {
      diskFiles = fs.readdirSync(targetDir).filter((f) => f.endsWith('.pdf'));
    }

    if (isVidhanSabha) {
      // ----------------------------------------------------
      // VIDHAN SABHA MODE (Parts 95 & 92)
      // ----------------------------------------------------
      const allPdfFiles = diskFiles;

      // Query house and voter counts from databases
      const dbPath = getDbPath('vidhan_sabha', 'vidhansabha_house.db');
      const vsDbPath = getDbPath('vidhan_sabha', 'vidhansabha.db');
      let slipStats: Record<string, { houses: number; voters: number }> = {};
      let partTotals: Record<number, { houses: number; voters: number }> = {};
      let rollTotals: Record<number, { total: number; active: number; deleted: number }> = {};

      try {
        if (fs.existsSync(dbPath)) {
          const db = await openReadonlyDb(dbPath);
          const rows = await db.all<{ part_no: number; slip_label: string; total_houses: number; total_voters: number }[]>(`
            SELECT part_no, slip_label, COUNT(id) as total_houses, SUM(total_members) as total_voters 
            FROM houses 
            GROUP BY part_no, slip_label
          `);
          const partRows = await db.all<{ part_no: number; total_houses: number; total_voters: number }[]>(`
            SELECT part_no, COUNT(id) as total_houses, SUM(total_members) as total_voters 
            FROM houses 
            GROUP BY part_no
          `);
          await db.close();

          for (const pr of partRows) {
            partTotals[pr.part_no] = { houses: pr.total_houses, voters: pr.total_voters };
          }

          for (const r of rows) {
            const partPrefix = r.part_no === 95 ? 'part_95_' : '';
            const key = `${partPrefix}${r.slip_label.replace(' ', '_')}_report.pdf`.toLowerCase();
            slipStats[key] = {
              houses: r.total_houses,
              voters: r.total_voters,
            };
          }
        }

        if (fs.existsSync(vsDbPath)) {
          const vsDb = await openReadonlyDb(vsDbPath);
          const vsRows = await vsDb.all<{ part_no: number; total: number; deleted: number }[]>(`
            SELECT part_no, COUNT(*) as total, SUM(CASE WHEN is_deleted_or_shifted = 1 THEN 1 ELSE 0 END) as deleted 
            FROM voters 
            GROUP BY part_no
          `);
          await vsDb.close();
          for (const vr of vsRows) {
            rollTotals[vr.part_no] = { total: vr.total, active: vr.total - (vr.deleted || 0), deleted: vr.deleted || 0 };
          }
        }
      } catch (err) {
        console.warn('[reports] Database stats query error:', err);
      }

      // Dynamic sorting: Order by part number ascending, then Category (Master -> Slips -> Leftovers)
      allPdfFiles.sort((a, b) => {
        const getPriority = (f: string) => {
          const partMatch = f.match(/Part_(\d+)/i);
          const partNum = partMatch ? parseInt(partMatch[1], 10) : (f.toLowerCase().startsWith('slip_') ? 92 : 99);
          let catPriority = 50;
          if (f.includes('All_') || f.includes('Combined') || f.includes('Master')) catPriority = 10;
          else if (f.includes('Leftover') || f.includes('Remaining')) catPriority = 90;
          return partNum * 100 + catPriority;
        };
        const pA = getPriority(a);
        const pB = getPriority(b);
        if (pA !== pB) return pA - pB;
        return a.localeCompare(b);
      });

      const reports = await Promise.all(
        allPdfFiles.map(async (file) => {
          const downloadUrl = await getReportUrl(file);
          const lower = file.toLowerCase();
          const stat = slipStats[lower];

          // Master Report Match
          const masterMatch = file.match(/Part_(\d+)_All_(\d+)/i);
          if (masterMatch) {
            const pNum = parseInt(masterMatch[1], 10);
            const slipCount = masterMatch[2];
            const pStat = partTotals[pNum];
            return {
              file,
              url: downloadUrl,
              displayName: `भाग ${pNum}: सभी ${slipCount} पर्चियाँ मास्टर रिपोर्ट`,
              displayNameEn: `Part ${pNum}: All ${slipCount} Slips Master Report`,
              block: `भाग संख्या ${pNum} (बालोतरा)`,
              gali: `सभी ${slipCount} पर्चियाँ (${pStat?.houses || 0} मकान समूह)`,
              totalVoters: pStat?.voters || 0,
              category: 'master' as const,
              part: pNum,
            };
          }

          // Leftover Voters Match
          const leftoverMatch = file.match(/Part_(\d+)_Leftover/i);
          if (leftoverMatch) {
            const pNum = parseInt(leftoverMatch[1], 10);
            const roll = rollTotals[pNum];
            const sloped = partTotals[pNum]?.voters || 0;
            const leftoverCount = roll ? roll.total - sloped : 0;
            return {
              file,
              url: downloadUrl,
              displayName: `भाग ${pNum}: शेष मतदाता सूची`,
              displayNameEn: `Part ${pNum}: Leftover Voters List`,
              block: `भाग संख्या ${pNum} (बालोतरा)`,
              gali: `पर्चियों से शेष रहे मतदाता (${leftoverCount > 0 ? `${leftoverCount} मतदाता` : 'शेष सूची'})`,
              totalVoters: leftoverCount,
              category: 'other' as const,
              part: pNum,
            };
          }

          // Individual Slip Match
          const slipMatch = file.match(/(?:Part_(\d+)_)?Slip_(\d+)/i);
          let pNum = 95;
          if (slipMatch && slipMatch[1]) {
            pNum = parseInt(slipMatch[1], 10);
          } else if (file.toLowerCase().startsWith('part_92') || file.toLowerCase().startsWith('slip_')) {
            pNum = 92;
          }
          const slipNum = slipMatch ? slipMatch[2] : '01';

          return {
            file,
            url: downloadUrl,
            displayName: `भाग ${pNum} - पर्ची ${parseInt(slipNum, 10)} रिपोर्ट`,
            displayNameEn: `Part ${pNum} - Slip ${slipNum} Report`,
            block: `भाग संख्या ${pNum} (बालोतरा)`,
            gali: stat ? `पर्ची ${slipNum} • ${stat.houses} मकान समूह` : `मतदाता पर्ची ${slipNum}`,
            totalVoters: stat?.voters || 0,
            category: 'slip' as const,
            part: pNum,
            slipNum,
          };
        })
      );

      const filteredReports = allowedWardArr.length > 0 
        ? reports.filter((r: any) => allowedWardArr.includes(Number(r.part)))
        : reports;

      return NextResponse.json({
        success: true,
        files: allPdfFiles,
        reports: filteredReports,
        election,
        storageSource: bucket ? 'Google Cloud Storage (GCS Signed URLs)' : 'Local File Server',
      });
    } else {
      // ----------------------------------------------------
      // NAGAR PARISHAD MODE (Dynamically queried from databases)
      // ----------------------------------------------------
      const npFiles = diskFiles;
      const dbPath = getDbPath('nagar_parishad', 'houses.db');
      const npVotersDbPath = getDbPath('nagar_parishad', 'voters.db');

      let countsMap: Record<string, { block: string; gali: string; ward: number; totalVoters: number }> = {};
      let totalAssignedVoters = 0;
      try {
        if (fs.existsSync(dbPath)) {
          const db = await openReadonlyDb(dbPath);
          const tableCols = await db.all('PRAGMA table_info(houses)');
          const hasWardCol = tableCols.some((c: any) => c.name === 'ward');
          const wardSelect = hasWardCol ? 'h.ward,' : '5 as ward,';

          const rows = await db.all<{ block: string; gali: string; ward: number; total_voters: number }[]>(`
            SELECT h.block, h.gali, ${wardSelect} COUNT(m.id) as total_voters 
            FROM houses h 
            LEFT JOIN house_members m ON h.id = m.house_id 
            GROUP BY h.block, h.gali
          `);
          await db.close();

          for (const r of rows) {
            const safeBlock = String(r.block).replace(/[/\\ ]/g, '_');
            const safeGali = String(r.gali).replace(/[/\\ ]/g, '_');
            const key = `Block_${safeBlock}_Gali_${safeGali}.pdf`.toLowerCase();
            countsMap[key] = {
              block: r.block,
              gali: r.gali,
              ward: r.ward || 5,
              totalVoters: r.total_voters,
            };
            totalAssignedVoters += r.total_voters || 0;
          }
        }
      } catch (dbErr) {
        console.warn('[reports] Nagar Parishad database stats query error:', dbErr);
      }

      // Query dynamic ward stats from voters.db
      let wardStatsMap: Record<number, { total: number; minSerial: number; maxSerial: number }> = {};
      try {
        if (fs.existsSync(npVotersDbPath)) {
          const vDb = await openReadonlyDb(npVotersDbPath);
          const wRows = await vDb.all<{ ward: number; total: number; minSerial: number; maxSerial: number }[]>(`
            SELECT ward, COUNT(*) as total, MIN(serial_number) as minSerial, MAX(serial_number) as maxSerial 
            FROM voters 
            GROUP BY ward
          `);
          await vDb.close();
          for (const wr of wRows) {
            wardStatsMap[wr.ward] = {
              total: wr.total,
              minSerial: wr.minSerial || 1,
              maxSerial: wr.maxSerial || wr.total,
            };
          }
        }
      } catch (vErr) {
        console.warn('[reports] Nagar Parishad voters db error:', vErr);
      }

      const defaultWard = Object.keys(wardStatsMap).length > 0 ? Number(Object.keys(wardStatsMap)[0]) : 5;

      const reports = await Promise.all(
        npFiles.map(async (file) => {
          const downloadUrl = await getReportUrl(file);
          const match = countsMap[file.toLowerCase()];
          let displayName = file.replace('.pdf', '').replace(/_/g, ' ');
          let block = match?.block || '';
          let gali = match?.gali || '';
          let totalVoters = match ? match.totalVoters : 0;

          // Dynamically detect ward number from database match or filename
          const wardMatch = file.match(/Ward_?(\d+)/i);
          const wardNum = match?.ward || (wardMatch ? parseInt(wardMatch[1], 10) : defaultWard);
          const currentWardStat = wardStatsMap[wardNum];

          const isMaster =
            file.toLowerCase().includes('electoral_roll') ||
            file.toLowerCase().includes('alphabetical_roll') ||
            file.toLowerCase().includes('master');
          const isRemaining = file.toLowerCase().includes('remaining') || file.toLowerCase().includes('leftover');

          let category: 'master' | 'slip' | 'other' = 'slip';
          let displayNameEn = displayName;
          if (isMaster) {
            category = 'master';
            totalVoters = currentWardStat ? currentWardStat.total : 0;
            if (file.toLowerCase().includes('alphabetical')) {
              displayName = `वार्ड ${wardNum}: वर्णमाला मतदाता सूची`;
              displayNameEn = `Ward No. ${wardNum} Alphabetical Voter Roll`;
            } else {
              const minS = currentWardStat?.minSerial || 1;
              const maxS = currentWardStat?.maxSerial || totalVoters;
              displayName = `वार्ड ${wardNum}: संपूर्ण मतदाता सूची (क्रमांक ${minS}-${maxS})`;
              displayNameEn = `Ward No. ${wardNum} Complete Electoral Roll (Serial Wise ${minS}-${maxS})`;
            }
            block = `Ward ${wardNum}`;
            gali = 'All Galis';
          } else if (isRemaining) {
            category = 'other';
            const totalInWard = currentWardStat ? currentWardStat.total : totalAssignedVoters;
            const remainingCount = Math.max(0, totalInWard - totalAssignedVoters);
            displayName = `वार्ड ${wardNum}: शेष मतदाता सूची`;
            displayNameEn = `Ward ${wardNum}: Remaining Voters Report`;
            block = `Ward ${wardNum}`;
            gali = `शेष मतदाता (${remainingCount > 0 ? `${remainingCount} मतदाता` : 'पर्चियों से शेष'})`;
            totalVoters = remainingCount;
          } else {
            category = 'slip';
            // Clean up stuttered tokens (e.g. Block Block A -> Block A, Gali Gali -> Gali)
            let cleanBlock = match?.block || '';
            let cleanGali = match?.gali || '';

            if (!cleanBlock || !cleanGali) {
              let cleanStr = file.replace(/\.pdf$/i, '').replace(/_/g, ' ');
              cleanStr = cleanStr.replace(/\bBlock\s+Block\b/gi, 'Block').replace(/\bGali\s+Gali\b/gi, 'Gali').replace(/\s+/g, ' ').trim();
              const m = cleanStr.match(/^Block\s+(.*?)\s+Gali\s+(.*)$/i);
              if (m) {
                cleanBlock = `Block ${m[1].trim()}`;
                cleanGali = `Gali ${m[2].trim()}`;
              } else {
                cleanGali = cleanStr;
              }
            } else {
              cleanBlock = cleanBlock.replace(/\bBlock\s+Block\b/gi, 'Block').trim();
              cleanGali = cleanGali.replace(/\bGali\s+Gali\b/gi, 'Gali').trim();
            }

            const cleanBlockHi = cleanBlock.replace(/^Block\s*/i, 'ब्लॉक ');
            const cleanGaliHi = cleanGali.replace(/^Gali\s*/i, 'गली ');

            const isDuplicate = cleanBlock.toLowerCase().trim() === cleanGali.toLowerCase().trim();
            displayName = cleanBlock && !isDuplicate ? `${cleanBlockHi} • ${cleanGaliHi}` : cleanGaliHi;
            displayNameEn = cleanBlock && !isDuplicate ? `${cleanBlock} • ${cleanGali}` : cleanGali;
            block = `वार्ड ${wardNum} (बालोतरा)`;
            gali = cleanBlock && !isDuplicate ? `${cleanBlock} • ${cleanGali}` : cleanGali;
          }

          return {
            file,
            url: downloadUrl,
            displayName,
            displayNameEn,
            block,
            gali,
            totalVoters,
            category,
            part: wardNum,
          };
        })
      );

      const filteredNpReports = allowedWardArr.length > 0 
        ? reports.filter((r: any) => allowedWardArr.includes(Number(r.part)))
        : reports;

      return NextResponse.json({
        success: true,
        files: npFiles,
        reports: filteredNpReports,
        election,
        storageSource: bucket ? 'Google Cloud Storage (GCS Signed URLs)' : 'Local File Server',
      });
    }
  } catch (error: any) {
    console.error('Reports API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
