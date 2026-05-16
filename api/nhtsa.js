export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, vin, make, model, year } = req.query;

  let url = '';

  if (type === 'decodeVin' && vin) {
    url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`;
  } else if (type === 'recallsByVin' && vin) {
    url = `https://api.nhtsa.dot.gov/recalls/recallsByVin?vin=${vin}`;
  } else if (type === 'recallsByVehicle' && make && year) {
    url = `https://api.nhtsa.dot.gov/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model || make)}&modelYear=${year}`;
  } else if (type === 'models' && make && year) {
    url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`;
  } else {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ClaimCheck/1.0' },
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'NHTSA API error' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('NHTSA proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
