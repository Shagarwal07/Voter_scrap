import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/authOptions";
import { getGcsBucket } from '@/utils/gcs';
import { checkSuperUser } from '@/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session: any = await getServerSession(authOptions);
  const role = session?.user?.role || 'public';
  const tier = session?.user?.subscription_tier || 'free';
  const { isSuperUser } = checkSuperUser(session?.user);
  const isPaid = role === 'paid' || tier === 'paid';

  if (!isSuperUser && !isPaid) {
    return NextResponse.json({ error: 'Unauthorized: Subscription required to download reports.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const rawFile = searchParams.get('file') || '';
  const election = (searchParams.get('election') || 'vidhan_sabha').toLowerCase();
  const datasetName = election === 'vidhan_sabha' ? 'vidhan_sabha' : 'nagar_parishad';

  // Sanitize filename to prevent directory traversal
  const fileName = path.basename(rawFile);
  if (!fileName || !fileName.endsWith('.pdf')) {
    return NextResponse.json({ error: 'Invalid file parameter.' }, { status: 400 });
  }

  // Filter 2: Enforce allowed_wards for paid users
  if (!isSuperUser && isPaid) {
    const allowed = session?.user?.allowed_wards;
    if (!allowed || allowed.trim() === '') {
      return NextResponse.json({
        error: 'Your account is Paid, but no specific wards/areas have been assigned yet. Please contact developer for assistance: +91 8890106858'
      }, { status: 403 });
    }
    if (allowed !== 'all') {
      const allowedArr = allowed.split(',').map((w: string) => parseInt(w.trim(), 10)).filter((w: number) => !isNaN(w));

      let fileWard: number | null = null;
      const partMatch = fileName.match(/Part_(\d+)/i);
      if (partMatch) {
        fileWard = parseInt(partMatch[1], 10);
      } else if (fileName.toLowerCase().startsWith('slip_')) {
        fileWard = 92;
      } else {
        const wardMatch = fileName.match(/Ward_?(\d+)/i);
        if (wardMatch) fileWard = parseInt(wardMatch[1], 10);
      }

      if (fileWard === null) {
        return NextResponse.json({
          error: 'Access restricted: Unable to verify ward authorization for this report. Collective reports are reserved for full-access accounts.'
        }, { status: 403 });
      }

      if (!allowedArr.includes(fileWard)) {
        return NextResponse.json({
          error: `Access restricted: You do not have permissions to download reports for Ward/Part ${fileWard}. Contact developer: +91 8890106858`
        }, { status: 403 });
      }
    }
  }

  // 1. Try streaming from Google Cloud Storage
  try {
    const bucket = getGcsBucket();
    if (bucket) {
      const gcsFile = bucket.file(`${datasetName}/Reports/${fileName}`);

      const [exists] = await gcsFile.exists().catch(() => [false]);
      if (exists) {
        const [buffer] = await gcsFile.download();
        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${fileName}"`,
          },
        });
      }
    }
  } catch (gcsErr) {
    console.warn('[reports/download] GCS stream failed, trying local disk fallback:', gcsErr);
  }

  // 2. Try streaming from local GCP VM disk
  const localDiskPath = path.join(process.cwd(), 'public', 'reports', datasetName, fileName);
  if (fs.existsSync(localDiskPath)) {
    const fileBuffer = fs.readFileSync(localDiskPath);
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  }

  return NextResponse.json({ error: 'Report PDF not found in cloud storage or local disk.' }, { status: 404 });
}

