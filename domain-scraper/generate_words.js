/**
 * generate_words.js — Downloads English dictionary and creates words.json.
 * 
 * INCLUDES: Pure alphabetic words, hyphenated words, words with numbers.
 * Sorted longest-first (10-char → 3-char) for higher availability hit rate.
 * 
 * Run once locally: node generate_words.js
 * Output: data/words.json
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = path.dirname(path.resolve(process.argv[1]));

function download(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
    
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, maxRedirects - 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  // Download primary dictionary (enable1 — 172K words)
  console.log('Downloading word list...');
  let rawData;
  try {
    rawData = await download('https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt');
  } catch (err) {
    console.error('Failed to download word list:', err.message);
    process.exit(1);
  }

  // Parse and filter
  const allWords = rawData
    .split(/\r?\n|\r/)
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length > 0);

  console.log(`Raw words downloaded: ${allWords.length}`);

  // Domain-valid filter:
  //   Length 3-10, chars a-z 0-9 hyphens
  //   No leading/trailing hyphens, no double hyphens
  const filtered = allWords.filter(w => {
    if (w.length < 3 || w.length > 10) return false;
    if (!/^[a-z0-9]/.test(w)) return false;            // Must start with alphanumeric
    if (!/[a-z0-9]$/.test(w)) return false;             // Must end with alphanumeric
    if (!/^[a-z0-9-]+$/.test(w)) return false;          // Only valid domain chars
    if (/--/.test(w)) return false;                      // No double hyphens
    return true;
  });

  // Deduplicate and sort longest-first
  const unique = [...new Set(filtered)];
  unique.sort((a, b) => {
    if (b.length !== a.length) return b.length - a.length;
    return a.localeCompare(b);
  });

  // Stats
  const pureAlpha = unique.filter(w => /^[a-z]+$/.test(w)).length;
  const withHyphens = unique.filter(w => w.includes('-')).length;
  const withNumbers = unique.filter(w => /[0-9]/.test(w)).length;

  console.log(`\nWord Statistics:`);
  console.log(`  Pure alphabetic: ${pureAlpha}`);
  console.log(`  With hyphens:    ${withHyphens}`);
  console.log(`  With numbers:    ${withNumbers}`);
  console.log(`  Total unique:    ${unique.length}`);

  // Write output
  const outputDir = path.join(SCRIPT_DIR, 'data');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, 'words.json');
  fs.writeFileSync(outputPath, JSON.stringify(unique), 'utf8');

  const sizeMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
  console.log(`\nSaved: ${outputPath} (${sizeMB} MB, ${unique.length} words)`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
