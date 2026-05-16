// api/scraper.js
// Automated settlement scraper — runs on a cron schedule via Vercel.
// Scrapes ClassAction.org and checks for new settlements.
// New cases are enriched by Claude AI and saved to Supabase.
//
// Set up Vercel Cron in vercel.json:
//   "crons": [{ "path": "/api/scraper", "schedule": "0 */6 * * *" }]
// This runs every 6 hours automatically.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const CRON_SECRET  = process.env.CRON_SECRET; // set this in Vercel env vars

// ── SOURCES TO SCRAPE ────────────────────────────────────────────────────────
const SOURCES = [
  {
    id: 'classaction_org',
    name: 'ClassAction.org',
    url: 'https://www.classaction.org/news/settlements',
    type: 'html',
  },
  {
    id: 'top_class_actions',
    name: 'TopClassActions.com',
    url: 'https://topclassactions.com/lawsuit-settlements/open-settlements/',
    type: 'html',
  },
];

// ── HELPERS ──────────────────────────────────────────────────────────────────
async function supabaseQuery(endpoint, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options.headers || {}),
    },
  });
  return response.json();
}

async function log(source, action, detail, case_id = null) {
  await supabaseQuery('scraper_log', {
    method: 'POST',
    body: JSON.stringify({ source, action, detail, case_id }),
  });
}

// ── EXPIRE OLD CASES ─────────────────────────────────────────────────────────
async function expireOldCases() {
  // Fetch all active cases with a deadline_date
  const cases = await supabaseQuery(
    'cases?status=eq.active&deadline_date=not.is.null&select=id,company,deadline_date'
  );

  const today = new Date().toISOString().split('T')[0];
  let expired = 0;

  for (const c of cases) {
    if (c.deadline_date < today) {
      await supabaseQuery(`cases?id=eq.${c.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'expired', updated_at: new Date().toISOString() }),
      });
      await log('system', 'Case expired', `${c.company} — deadline was ${c.deadline_date}`, c.id);
      expired++;
    }
  }

  return expired;
}

// ── SCRAPE SOURCE ─────────────────────────────────────────────────────────────
async function scrapeSource(source) {
  try {
    const response = await fetch(source.url, {
      headers: { 'User-Agent': 'ClaimCheck/1.0 (settlement aggregator)' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;
    const html = await response.text();

    // Extract text content (strip HTML tags for Claude to analyze)
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 8000); // Claude context limit

    return text;
  } catch (err) {
    console.error(`Scrape error for ${source.id}:`, err.message);
    return null;
  }
}

// ── AI ENRICHMENT ─────────────────────────────────────────────────────────────
async function enrichWithClaude(rawText, sourceName) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `You are a legal data extraction AI for ClaimCheck, a class action settlement aggregator.
Extract NEW class action settlements from scraped web content. 
Ignore settlements already in these categories if they look familiar: Tech/Privacy, Automotive, Food/CPG, Pharma/Medical, Housing/Finance.
Focus on NEW settlements not commonly known.

For each new settlement found, extract and respond ONLY with valid JSON array (no markdown):
[{
  "id": "unique_short_id_no_spaces",
  "cat": "tech|auto|food|pharma|housing",
  "company": "Company Name",
  "icon": "single emoji",
  "title": "Full Settlement Name",
  "desc": "One sentence description under 120 chars",
  "detail": "2-3 sentence detail about the case",
  "payout": 500,
  "ps": "$500",
  "deadline": "Mon DD, YYYY or Ongoing",
  "deadline_date": "YYYY-MM-DD or null",
  "urgent": false,
  "firm": "Law Firm Name",
  "firm_ppl": 200,
  "qs": [{"id":"q1","text":"Qualifying question?","req":true}]
}]

If no new settlements found, return empty array: []`,
      messages: [{
        role: 'user',
        content: `Extract new class action settlements from this ${sourceName} page content:\n\n${rawText}`,
      }],
    }),
  });

  const data = await response.json();
  const raw = data.content?.map(b => b.text || '').join('') || '[]';

  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    return [];
  }
}

// ── SAVE NEW CASES ────────────────────────────────────────────────────────────
async function saveNewCases(newCases, sourceId) {
  let saved = 0;

  for (const c of newCases) {
    // Check if case already exists
    const existing = await supabaseQuery(`cases?id=eq.${c.id}&select=id`);
    if (existing.length > 0) continue;

    // Insert new case
    const result = await supabaseQuery('cases', {
      method: 'POST',
      body: JSON.stringify({ ...c, source: sourceId }),
    });

    if (result && !result.error) {
      await log(sourceId, 'New case detected', `${c.company}: ${c.title}`, c.id);
      saved++;
    }
  }

  return saved;
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Security: verify this is a legitimate cron call
  const authHeader = req.headers['authorization'];
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY || !ANTHROPIC_KEY) {
    return res.status(500).json({ error: 'Missing environment variables' });
  }

  const results = {
    timestamp: new Date().toISOString(),
    expired: 0,
    scraped: [],
    new_cases: 0,
    errors: [],
  };

  try {
    // Step 1: Expire old cases
    results.expired = await expireOldCases();
    console.log(`Expired ${results.expired} old cases`);

    // Step 2: Scrape each source
    for (const source of SOURCES) {
      try {
        console.log(`Scraping ${source.name}...`);
        const text = await scrapeSource(source);

        if (!text) {
          results.errors.push(`Failed to scrape ${source.name}`);
          continue;
        }

        await log(source.id, 'Scrape complete', `${text.length} chars extracted`);

        // Step 3: AI enrichment
        const newCases = await enrichWithClaude(text, source.name);
        console.log(`Found ${newCases.length} potential new cases from ${source.name}`);

        // Step 4: Save new cases
        const saved = await saveNewCases(newCases, source.id);
        results.new_cases += saved;

        results.scraped.push({
          source: source.name,
          found: newCases.length,
          saved,
        });

        await log(source.id, 'Scrape cycle complete', `${saved} new cases saved`);

      } catch (err) {
        results.errors.push(`${source.name}: ${err.message}`);
        console.error(`Error scraping ${source.name}:`, err);
      }
    }

  } catch (err) {
    console.error('Scraper fatal error:', err);
    results.errors.push(err.message);
  }

  console.log('Scraper results:', JSON.stringify(results));
  return res.status(200).json(results);
}
