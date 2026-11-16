import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

// Initialize Storage with credentials if provided in env vars, otherwise default (works locally with gcloud CLI)
const storageOptions: any = {};
if (process.env.GCP_PROJECT_ID) {
  storageOptions.projectId = process.env.GCP_PROJECT_ID;
}
if (process.env.GCP_CLIENT_EMAIL && process.env.GCP_PRIVATE_KEY) {
  storageOptions.credentials = {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  storageOptions.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
}
const storage = new Storage(storageOptions);

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || process.env.ARCHIVE_BUCKET_NAME || 'ocr-voter-lists-archive';

// In-memory rate limiting map. 
// Note: In a serverless environment (like Vercel), this will reset on cold starts.
// For strict rate limiting in production, replace this with a Redis store (e.g., Upstash).
const rateLimitMap = new Map<string, { count: number; firstRequestTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 5;

// Cloudflare Turnstile verification endpoint
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function POST(request: Request) {
  try {
    const { ward, token, action, pdfType } = await request.json();

    // 1. Get Client IP (for rate limiting)
    // Next.js standard way to get IP on edge/serverless platforms
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1';

    // 2. Rate Limiting Check (5 per hour)
    const now = Date.now();
    const rateData = rateLimitMap.get(ip);

    if (rateData) {
      if (now - rateData.firstRequestTime < RATE_LIMIT_WINDOW_MS) {
        if (rateData.count >= MAX_REQUESTS_PER_WINDOW) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Maximum 5 PDF downloads per hour allowed.' },
            { status: 429 }
          );
        }
        // Increment count
        rateLimitMap.set(ip, { ...rateData, count: rateData.count + 1 });
      } else {
        // Reset window
        rateLimitMap.set(ip, { count: 1, firstRequestTime: now });
      }
    } else {
      // First request
      rateLimitMap.set(ip, { count: 1, firstRequestTime: now });
    }

    // 3. Verify Cloudflare Turnstile Token
    // We expect the user to put their secret key in process.env.TURNSTILE_SECRET_KEY
    // Using a dummy key if not found, just so development doesn't break entirely.
    const secretKey = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA'; 
    
    if (!token) {
       return NextResponse.json({ error: 'Security token missing.' }, { status: 400 });
    }

    const verifyFormData = new FormData();
    verifyFormData.append('secret', secretKey);
    verifyFormData.append('response', token);
    verifyFormData.append('remoteip', ip);

    const turnstileResponse = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: verifyFormData,
    });

    const turnstileResult = await turnstileResponse.json();

    if (!turnstileResult.success) {
      return NextResponse.json({ error: 'Security verification failed. Are you a bot?' }, { status: 403 });
    }

    // 4. Verification successful, generate a secure Presigned URL
    // Format the ward number to match the bucket structure
    let fileName = '';
    if (pdfType === 'with_photo') {
      // With photo PDFs are named like "05.pdf"
      const twoDigitWard = String(ward).padStart(2, '0');
      fileName = `${twoDigitWard}.pdf`;
    } else {
      // Without photo PDFs are named like "Ward No-005-Part No-001.pdf"
      const paddedWard = String(ward).padStart(3, '0');
      fileName = `Ward No-${paddedWard}-Part No-001.pdf`; 
    }
    
    const folderName = pdfType === 'without_photo' ? 'updated_pdf_without_photo' : 'updated_pdf_with_photo';
    const filePath = `nagar_parishad/${folderName}/${fileName}`; 
    
    try {
      // Generate a v4 signed URL that expires in 15 minutes
      const options: any = {
        version: 'v4',
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      };

      if (action === 'download') {
        options.responseDisposition = `attachment; filename="Ward_${ward}_Voter_List.pdf"`;
      }

      const [securePdfUrl] = await storage
        .bucket(BUCKET_NAME)
        .file(filePath)
        .getSignedUrl(options);

      return NextResponse.json({ url: securePdfUrl });
    } catch (gcsError: any) {
      console.error("GCS Signed URL Error:", gcsError);
      return NextResponse.json({ 
        error: 'Failed to generate secure PDF link. Server might be missing Google Cloud credentials.' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('PDF Fetch Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
