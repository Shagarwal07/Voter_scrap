import { Storage } from '@google-cloud/storage';
import fs from 'fs';

export function getGcsBucket() {
  const options: any = {};
  if (process.env.GCP_PROJECT_ID) options.projectId = process.env.GCP_PROJECT_ID;
  if (process.env.GCP_CLIENT_EMAIL && process.env.GCP_PRIVATE_KEY) {
    options.credentials = {
      client_email: process.env.GCP_CLIENT_EMAIL,
      private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    options.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }

  if (!options.credentials && !options.keyFilename && !process.env.GCP_PROJECT_ID) {
    return null;
  }

  const storage = new Storage(options);
  const bucketName = process.env.GCS_BUCKET_NAME || process.env.ARCHIVE_BUCKET_NAME || 'ocr-voter-lists-archive';
  return storage.bucket(bucketName);
}

