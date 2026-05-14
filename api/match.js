// api/match.js
// Vercel serverless function — keeps your Anthropic API key server-side.
// The frontend calls /api/match instead of Anthropic directly.
//
// Deploy: this file lives at /api/match.js in your project root.
// Vercel auto-detects it as a serverless endpoint at https://yoursite.com/api/match
//
// Environment variable needed in Vercel dashboard:
//   ANTHROPIC_API_KEY = sk-ant-...

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text } = req.body

  if (!text || typeof text !== 'string' || text.length > 2000) {
    return res.status(400).json({ error: 'Invalid input' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: `Match the user's situation to class action settlements. Respond ONLY with JSON {"summary":"1-2 empathetic sentences","matchIds":["id1","id2"]}.

Available settlements:
TECH: t1=Facebook Biometric(Illinois+photos 2011-2022,$397), t2=Google Location(Android+Maps 2014-2023,$250), t3=TikTok COPPA(users 2019-2023,$167), t4=T-Mobile Breach(customer before Aug 2021,$25000), t5=Amazon Prime(unexpected charges 2018-2023,$100), t6=Apple MacBook(2015-2019 keyboard,$395), t7=Equifax Breach(2017 breach,$20000), t8=Zoom Data(registered 2013-2021,$85)
AUTO: a1=Takata Airbag(Honda/Toyota/Ford/BMW airbag recall), a2=VW Dieselgate(VW/Audi TDI diesel 2009-2016), a3=Ford Transmission(Focus/Fiesta 2011-2016), a4=GM Ignition(Cobalt/Ion/G5 2003-2014), a5=Honda Oil(CR-V/Civic/Accord 1.5T 2016-2021), a6=Tesla Autopilot(Tesla 2016-2024), a7=Chrysler HEMI(Ram/Jeep/Dodge 2019-2024), a8=Subaru Oil(Outback/Legacy/Forester 2011-2015)
FOOD: f1=Red Bull(bought 2002-2014,$15), f2=Snapple All Natural(bought 2007-2014,$50), f3=Subway Footlong(bought 2009-2016,$35), f4=Cheez-It/Kelloggs(bought 2018-2023,$45), f5=Nutella(bought 2008-2012,$20), f6=Naked Juice(bought 2007-2013,$75)
PHARMA: p1=JnJ Talcum Powder(used baby powder+ovarian cancer/mesothelioma,$25000+), p2=Roundup/Bayer(glyphosate+non-hodgkins lymphoma,$100000+), p3=Philips CPAP(DreamStation/System One 2009-2021,$7500), p4=3M Military Earplugs(veteran/military 2003-2015+hearing loss,$15000), p5=Exactech Implants(hip/knee/ankle implant failure,$50000), p6=Generic Drug Price Fixing(prescription drugs 2009-2020,$500)
HOUSING: h1=Wells Fargo Fake Accounts(customer 2002-2017,$5000), h2=Rocket Mortgage Fees(mortgage 2015-2023,$3500), h3=NAR Realtor Commission(sold home 2014-2024,$2000), h4=Tenant Screening(denied housing 2015-2023,$1500), h5=Nationstar Mortgage(loan serviced 2012-2020,$800), h6=Payday Lenders(high-rate loan 2008-2022,$400)

Be generous in matching.`,
        messages: [{ role: 'user', content: text }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic API error:', err)
      return res.status(502).json({ error: 'Upstream API error' })
    }

    const data = await response.json()
    const raw = data.content?.map(b => b.text || '').join('') || '{}'
    const clean = raw.replace(/```json|```/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch {
      parsed = { summary: 'Found some potential matches. Check the highlighted cases below.', matchIds: [] }
    }

    // Rate limit: add cache-control so Vercel doesn't cache personal responses
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json(parsed)

  } catch (err) {
    console.error('Handler error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
