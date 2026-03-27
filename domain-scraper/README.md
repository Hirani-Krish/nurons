# Domain Scraper (Automated)

Automated `.com` domain availability checker that runs via **GitHub Actions**.

## How It Works
1. GitHub Actions runs every **30 minutes**
2. Each run checks **200 words** from the dictionary
3. Available domains are saved to `data/available.txt`
4. Progress is tracked in `data/progress.json`
5. Errors are logged in `data/errors.log`

## Setup (One-Time)
```bash
# Generate the word list
cd domain-scraper
node generate_words.js

# Commit and push — automation starts automatically
git add .
git commit -m "Add domain scraper"
git push
```

## Files
| File | Purpose |
|---|---|
| `check.js` | Main checker script (runs on GitHub) |
| `generate_words.js` | One-time word list generator |
| `data/words.json` | Dictionary (alphabetic + hyphens + numbers) |
| `data/progress.json` | Current scan position + stats |
| `data/available.txt` | All available domains found |
| `data/errors.log` | Error history with timestamps |

## Monitoring
- **Actions tab** → See live logs for each run
- **`data/available.txt`** → Open anytime to see found domains
- **`data/errors.log`** → Check if something went wrong
- **Email** → GitHub sends you an email if a run fails
