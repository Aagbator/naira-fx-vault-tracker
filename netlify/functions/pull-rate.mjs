import { pullRate } from '../lib/core.mjs';

export default async () => {
  try { await pullRate(); } catch (e) { console.error('Rate fetch failed:', e.message); }
};

// Every 30 minutes (UTC). If your plan limits this, change to "@hourly".
export const config = { schedule: '*/30 * * * *' };
