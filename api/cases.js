// api/cases.js
// Serves active cases from Supabase to the frontend.
// Called by App.jsx on load instead of using hardcoded data.
// Vercel serverless function — runs server-side.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/cases?status=eq.active&order=urgent.desc,payout.desc`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`);
    }

    const cases = await response.json();
    return res.status(200).json({ cases, count: cases.length });

  } catch (err) {
    console.error('Cases API error:', err);
    return res.status(500).json({ error: 'Failed to load cases' });
  }
}
