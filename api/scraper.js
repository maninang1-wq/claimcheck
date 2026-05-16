const SUPABASE_URL  = process.env.SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const CRON_SECRET   = process.env.CRON_SECRET;

const SOURCES = [
  { id: 'classaction_org',   url: 'https://www.classaction.org/news/settlements' },
  { id: 'top_class_actions', url: 'https://topclassactions.com/lawsuit-settlements/open-settlements/' },
];

async function supabase(endpoint, options = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options.headers || {}),
    },
  });
  return r.json();
}

async function log(source, action, detail, case_id = null) {
  await supabase('scraper_log', {
    method: 'POST',
    body: JSON.stringify({ source, action, detail, case_id }),
  });
}

async function expireOldCases() {
  const cases = await supabase(
    'cases?status=eq.active&deadline_date=not.is.null&select=id,company,deadline_date'
  );
  const today = new Date().toISOString().split('T')[0];
  let expired = 0;
  for (const c of cases) {
    if (c.deadline_date < today) {
      await supabase(`cases?id=eq.${c.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'expired', updated_at: new Date().toISOString() }),
      });
      await log('system', 'Case expired', `${c.company} — deadline was ${c.deadline_date}`, c.id);
      expired++;
    }
  }
  return expired;
}

async function scrapeSource(source) {
  try {
    const r = await fetch(source.url, {
      headers: { 'User-Agent': 'ClaimCheck/1.0 (settlement aggregator)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return null;
    const html = await r.text();
    return html
      .replace(/<script[^>]*>[sS]*?</script>/gi, '')
      .replace(/<style[^>]*>[sS]*?</style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/s+/g, ' ')
      .trim()
      .substring(0, 8000);
  } catch { return null; }
}

async function enrichWithClaude(text, sourceName) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `Extract NEW class action settlements from scraped web content.
Respond ONLY with a valid JSON array (no markdown, no explanation):
[{
  "id": "unique_short_id",
  "cat": "tech|auto|food|pharma|housing",
  "company": "Company Name",
  "icon": "single emoji",
  "title": "Full Settlement Name",
  "desc": "One sentence under 120 chars",
  "detail": "2-3 sentence detail",
  "payout": 500,
  "ps": "$500",
  "deadline": "Mon DD, YYYY or Ongoing",
  "deadline_date": "YYYY-MM-DD or null",
  "urgent": false,
  "firm": "Law Firm Name",
  "firm_ppl": 200,
  "qs": [{"id":"q1","text":"Qualifying question?","req":true}]
}]
If no new settlements found, return: []`,
      messages: [{ role: 'user', content: `Extract new settlements from ${sourceName}:

${text}` }],
    }),
  });
  const data = await r.json();
  const raw = data.content?.map(b => b.text || '').join('') || '[]';
  try { return JSON.parse(raw.replace(/```json|```/g, '').trim()); }
  catch { return []; }
}

async function saveNewCases(newCases, sourceId) {
  let saved = 0;
  for (const c of newCases) {
    const existing = await supabase(`cases?id=eq.${c.id}&select=id`);
    if (existing.length > 0) continue;
    const result = await supabase('cases', {
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

export default async function handler(req, res) {
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
    results.expired = await expireOldCases();

    for (const source of SOURCES) {
      try {
        const text = await scrapeSource(source);
        if (!text) { results.errors.push(`Failed to scrape ${source.id}`); continue; }

        await log(source.id, 'Scrape complete', `${text.length} chars`);

        const newCases = await enrichWithClaude(text, source.id);
        const saved    = await saveNewCases(newCases, source.id);

        results.new_cases += saved;
        results.scraped.push({ source: source.id, found: newCases.length, saved });
      } catch (err) {
        results.errors.push(`${source.id}: ${err.message}`);
      }
    }
  } catch (err) {
    results.errors.push(err.message);
  }

  return res.status(200).json(results);
}
