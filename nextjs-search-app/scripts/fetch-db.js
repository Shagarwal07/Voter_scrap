const fs = require('fs');
const path = require('path');

// Automatically load local environment variables for pre-build script
function loadEnv() {
  const envFiles = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../.env')
  ];

  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      try {
        const content = fs.readFileSync(envFile, 'utf8');
        content.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [key, ...values] = trimmed.split('=');
            const cleanKey = key.trim();
            const val = values.join('=').replace(/^["']|["']$/g, '').trim();
            if (!process.env[cleanKey]) {
              process.env[cleanKey] = val;
            }
          }
        });
      } catch (e) {
        // Silently continue
      }
    }
  }
}

loadEnv();

async function fetchDatabases() {
  const dbDir = path.resolve(process.cwd(), 'data');

  // Check for GCP credentials in environment
  const clientEmail = process.env.GCP_CLIENT_EMAIL;
  const privateKey = process.env.GCP_PRIVATE_KEY;
  const projectId = process.env.GCP_PROJECT_ID;
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  const hasDirectCreds = Boolean(clientEmail && privateKey);
  const hasKeyFile = Boolean(keyFile && fs.existsSync(keyFile));

  console.log('[fetch-db] Checking environment:');
  console.log(`[fetch-db] - GCP_PROJECT_ID: ${projectId ? 'Set' : 'Missing'}`);
  console.log(`[fetch-db] - GCP_CLIENT_EMAIL: ${clientEmail ? 'Set' : 'Missing'}`);
  console.log(`[fetch-db] - GCP_PRIVATE_KEY: ${privateKey ? 'Set (' + privateKey.length + ' chars)' : 'Missing'}`);
  if (keyFile) {
    console.log(`[fetch-db] - GOOGLE_APPLICATION_CREDENTIALS: ${hasKeyFile ? 'File exists' : 'File missing'}`);
  }

  if (!hasDirectCreds && !hasKeyFile && !projectId) {
    console.warn('[fetch-db] No GCP credentials detected.');
    console.warn('[fetch-db] Skipping cloud database download (build will continue with local electoral data).');
    return;
  }

  console.log('[fetch-db] Connecting to Google Cloud Storage...');

  try {
    const { Storage } = require('@google-cloud/storage');
    const storageOptions = {};
    if (projectId) storageOptions.projectId = projectId;

    if (hasDirectCreds) {
      storageOptions.credentials = {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
      };
    } else if (hasKeyFile) {
      storageOptions.keyFilename = keyFile;
    }

    const storage = new Storage(storageOptions);
    const bucketName = process.env.GCS_BUCKET_NAME || process.env.ARCHIVE_BUCKET_NAME || 'ocr-voter-lists-archive';
    const datasetName = process.env.DATASET_NAME || 'nagar_parishad';
    const isVs = datasetName === 'vidhan_sabha';
    const votersFilename = isVs ? 'vidhansabha.db' : 'voters.db';
    const housesFilename = isVs ? 'vidhansabha_house.db' : 'houses.db';

    console.log(`[fetch-db] Using bucket: ${bucketName} (dataset: ${datasetName})`);
    const bucket = storage.bucket(bucketName);

    const datasetDir = path.join(dbDir, datasetName);
    if (!fs.existsSync(datasetDir)) fs.mkdirSync(datasetDir, { recursive: true });

    const syncFile = async (filename) => {
      const target = path.join(datasetDir, filename);
      if (!fs.existsSync(target) || fs.statSync(target).size === 0) {
        console.log(`[fetch-db] Downloading ${datasetName}/Database/${filename} ...`);
        await bucket.file(`${datasetName}/Database/${filename}`).download({ destination: target });
        console.log(`[fetch-db] Downloaded ${filename}`);
      } else {
        console.log(`[fetch-db] ${datasetName}/${filename} exists.`);
      }
    };

    await syncFile(votersFilename);
    await syncFile(housesFilename).catch(err => console.warn(`[fetch-db] Could not sync ${housesFilename}:`, err.message));

  } catch (err) {
    console.error('[fetch-db] Failed to fetch databases from GCS:', err.message);
    // Allow the build to continue rather than hard crashing
  }
}

fetchDatabases();
