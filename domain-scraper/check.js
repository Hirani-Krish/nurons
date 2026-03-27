/**
 * check.js — Domain availability checker for GitHub Actions.
 * 
 * Reads words from data/words.json, checks RDAP, saves results.
 * Designed to run in 2-3 minute bursts every 30 minutes.
 * 
 * Files it reads/writes:
 *   data/words.json      — Full word list (generated once)
 *   data/progress.json   — Current position + stats
 *   data/available.txt   — All available domains found (append-only)
 *   data/errors.log      — Error history (append-only)
 */

const fs = require('fs');
const path = require('path');

// ===== Configuration =====
const BATCH_SIZE = 200;           // Words per run (200 × 0.6s ≈ 2 minutes)
const DELAY_MS = 600;             // Delay between requests
const MAX_BACKOFF_MS = 30000;     // Max retry wait
const MAX_RETRIES = 4;            // Retries per word on failure
const RDAP_URL = 'https://rdap.org/domain/';

// ===== File Paths =====
const DATA_DIR = path.join(__dirname, 'data');
const WORDS_FILE = path.join(DATA_DIR, 'words.json');
const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');
const AVAILABLE_FILE = path.join(DATA_DIR, 'available.txt');
const ERRORS_FILE = path.join(DATA_DIR, 'errors.log');

// ===== Main =====
async function main() {
  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  // Load word list
  if (!fs.existsSync(WORDS_FILE)) {
    logError('words.json not found! Run generate_words.js first.');
    process.exit(1);
  }
  const words = JSON.parse(fs.readFileSync(WORDS_FILE, 'utf8'));
  console.log(`📚 Dictionary loaded: ${words.length} words`);

  // Load progress
  let progress = loadProgress();
  console.log(`📍 Resuming from index ${progress.currentIndex} (${progress.totalChecked} checked, ${progress.totalAvailable} available)`);

  // Check if complete
  if (progress.currentIndex >= words.length) {
    console.log('🏁 All words have been checked! Dictionary exhausted.');
    console.log(`📊 Final: ${progress.totalAvailable} available out of ${progress.totalChecked} checked.`);
    return;
  }

  // Process batch
  const startIndex = progress.currentIndex;
  const endIndex = Math.min(startIndex + BATCH_SIZE, words.length);
  let batchAvailable = 0;
  let batchErrors = 0;

  console.log(`\n🔍 Checking words ${startIndex + 1} to ${endIndex} of ${words.length}...\n`);

  for (let i = startIndex; i < endIndex; i++) {
    const word = words[i];
    const domain = `${word}.com`;

    try {
      const available = await checkDomain(word);
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
      logError(`Failed checking ${domain}: ${err.message}`);
      console.log(`  ⚠️  ${domain} — ERROR: ${err.message}`);
    }

    progress.currentIndex = i + 1;

    // Save progress every 10 words (crash recovery)
    if ((i - startIndex) % 10 === 0) {
      saveProgress(progress);
    }

    // Rate limit
    if (i < endIndex - 1) {
      await delay(DELAY_MS);
    }
  }

  // Final save
  saveProgress(progress);

  // Summary
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📊 Batch Summary:`);
  console.log(`   Checked this run:  ${endIndex - startIndex}`);
  console.log(`   Available found:   ${batchAvailable}`);
  console.log(`   Errors:            ${batchErrors}`);
  console.log(`   ─────────────────────────────`);
  console.log(`   Total checked:     ${progress.totalChecked} / ${words.length}`);
  console.log(`   Total available:   ${progress.totalAvailable}`);
  console.log(`   Remaining:         ${words.length - progress.currentIndex}`);
  console.log(`   Progress:          ${((progress.currentIndex / words.length) * 100).toFixed(2)}%`);
  console.log(`${'─'.repeat(50)}`);
}

// ===== RDAP Domain Check =====
async function checkDomain(word) {
  const url = `${RDAP_URL}${word}.com`;
  let backoff = 1000;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, { method: 'HEAD' });

      if (res.status === 200) return false;   // Registered (taken)
      if (res.status === 404) return true;    // Not found (available!)

      if (res.status === 429) {
        // Rate limited — back off
        console.log(`    ⏳ Rate limited on ${word}.com, waiting ${backoff}ms...`);
        await delay(backoff);
        backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
        continue;
      }

      // Any other status — treat as "taken" (safe default)
      logError(`Unexpected HTTP ${res.status} for ${word}.com`);
      return false;

    } catch (err) {
      if (attempt < MAX_RETRIES) {
        console.log(`    🔄 Retry ${attempt + 1}/${MAX_RETRIES} for ${word}.com...`);
        await delay(backoff);
        backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
      } else {
        throw err;
      }
    }
  }

  return false;
}

// ===== File Helpers =====
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    } catch (err) {
      logError(`Corrupted progress.json, starting fresh: ${err.message}`);
    }
  }
  return {
    currentIndex: 0,
    totalChecked: 0,
    totalAvailable: 0,
    startedAt: new Date().toISOString()
  };
}

function saveProgress(progress) {
  progress.lastUpdated = new Date().toISOString();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
}

function appendAvailable(domain) {
  fs.appendFileSync(AVAILABLE_FILE, domain + '\n', 'utf8');
}

function logError(message) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(ERRORS_FILE, entry, 'utf8');
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== Run =====
main().catch(err => {
  logError(`FATAL: ${err.message}\n${err.stack}`);
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
