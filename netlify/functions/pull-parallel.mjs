import { pullParallel, parallelFailed } from '../lib/core.mjs';

export default async () => {
  try { await pullParallel(); }
  catch (e) { console.error('Monierate check failed:', e.message); await parallelFailed(e); }
};

// 10:00 and 14:00 Lagos time (UTC+1, no daylight saving) = 09:00 and 13:00 UTC.
export const config = { schedule: '0 9,13 * * *' };
