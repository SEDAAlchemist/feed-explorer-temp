// Throwaway test: does a Vercel Function's IP reach Binance, or get 451'd?
// Deploy in any Vercel project (Pro/Enterprise team) at path: api/binance-check.js
// Then open  https://<your-deployment>/api/binance-check
//
// 200 for both endpoints  → Binance is reachable from Vercel → cron is viable.
// 451 (or 403) for either → blocked, same as GitHub Actions → use the SEDA-infra cron.
//
// To give it the best chance, pin a non-US region: add to vercel.json →
//   { "functions": { "api/binance-check.js": { "maxDuration": 15 } },
//     "regions": ["fra1"] }        // fra1 = Frankfurt

export const config = { maxDuration: 15 };

export default async function handler(req, res) {
  const targets = [
    'https://api.binance.com/api/v3/ping',    // spot
    'https://fapi.binance.com/fapi/v1/ping',  // futures
  ];
  const results = {};
  for (const url of targets) {
    try {
      const r = await fetch(url);
      results[url] = r.status;                // want 200; 451/403 = blocked
    } catch (e) {
      results[url] = 'ERROR: ' + e.message;
    }
  }
  res.status(200).json({
    ranInRegion: process.env.VERCEL_REGION || 'unknown',
    results,
  });
}
