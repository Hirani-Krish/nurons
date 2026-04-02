const fs = require('fs');
const path = require('path');
const dns = require('dns').promises; // ADDED: Built-in DNS module

// ===== Configuration =====
// We can now increase the batch size because DNS is much faster!
const BATCH_SIZE = 1000;           
const DELAY_MS = 200;             // Lowered delay since we hit RDAP less often
const MAX_BACKOFF_MS = 10000;     
const MAX_RETRIES = 2;            
const RDAP_URL = 'https://rdap.org/domain/';

// ===== File Paths =====
const DATA_DIR = path.join(__dirname, 'data');
const WORDS_FILE = path.join(DATA_DIR, 'words.json');
const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');
const AVAILABLE_FILE = path.join(DATA_DIR, 'available.txt');
const ERRORS_FILE = path.join(DATA_DIR, 'errors.log');

// ===== Main =====
async function main() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(WORDS_FILE)) {
    logError('words.json not found! Run generate_words.js first.');
    process.exit(1);
  }
  const words = JSON.parse(fs.readFileSync(WORDS_FILE, 'utf8'));
  let progress = loadProgress();
  
  if (progress.currentIndex >= words.length) {
    console.log('🏁 All words checked!');
    return;
  }

  const startIndex = progress.currentIndex;
  const endIndex = Math.min(startIndex + BATCH_SIZE, words.length);
  let batchAvailable = 0;
  let batchErrors = 0;

  console.log(`\n🔍 Checking words ${startIndex + 1} to ${endIndex}...\n`);

  for (let i = startIndex; i < endIndex; i++) {
    const word = words[i];
    const domain = `${word}.com`;

    try {
      const available = await checkDomainFast(domain); // Use new fast function
      progress.totalChecked++;

      if (available) {
        progress.totalAvailable++;
        batchAvailable++;
        appendAvailable(domain);
        console.log(`  ✅ ${domain} — AVAILABLE`);
      } else {
        console.log(`  ❌ ${domain} — taken`);
      }
    } catch (err) {
      batchErrors++;
      progress.totalChecked++;
      console.log(`  ⚠️  ${domain} — ERROR: ${err.message}`);
    }

    progress.currentIndex = i + 1;

    if ((i - startIndex) % 20 === 0) saveProgress(progress);
    
    // Only delay briefly
    if (i < endIndex - 1) await delay(DELAY_MS);
  }

  saveProgress(progress);
  console.log(`\n📊 Batch Done: ${batchAvailable} available found.`);
}

// ===== DNS FAST-PATH & RDAP CHECK =====
async function checkDomainFast(domain) {
  // STEP 1: Fast DNS Check. If it resolves, it is definitely taken.
  try {
    const records = await dns.resolveAny(domain);
    if (records && records.length > 0) {
      return false; // Taken! No need to hit RDAP.
    }
  } catch (err) {
    // ENOTFOUND means no DNS records. It MIGHT be available.
    // We must proceed to Step 2 to be sure.
    if (err.code !== 'ENOTFOUND' && err.code !== 'ENODATA') {
      return false; // Treat other DNS errors as taken to be safe
    }
  }

  // STEP 2: Only hit RDAP if DNS is empty
  const url = `${RDAP_URL}${domain}`;
  let backoff = 1000;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, { method: 'HEAD' });

      if (res.status === 200) return false;   // Registered (taken)
      if (res.status === 404) return true;    // Not found (available!)

      if (res.status === 429) {
        await delay(backoff);
        backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
        continue;
      }
      return false; 

    } catch (err) {
      if (attempt < MAX_RETRIES) {
        await delay(backoff);
        backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
      } else {
        throw err;
      }
    }
  }
  return false;
}

// ===== File Helpers (Unchanged) =====
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  return { currentIndex: 0, totalChecked: 0, totalAvailable: 0 };
}
function saveProgress(progress) { fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8'); }
function appendAvailable(domain) { fs.appendFileSync(AVAILABLE_FILE, domain + '\n', 'utf8'); }
function logError(message) { fs.appendFileSync(ERRORS_FILE, `[${new Date().toISOString()}] ${message}\n`, 'utf8'); }
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

main().catch(err => process.exit(1));
