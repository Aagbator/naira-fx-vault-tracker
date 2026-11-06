import { getStore } from '@netlify/blobs';
import webpush from 'web-push';

const store = () => getStore('naira-vaults');
export const read = async (k, d) => (await store().get(k, { type: 'json' })) ?? d;
export const write = (k, v) => store().setJSON(k, v);
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
const LABEL = { safe: 'Safe', close: 'Getting close', losing: 'Losing' };
const statusOf = (w, your) => (your >= w.maxSafe ? 'losing' : your >= w.maxSafe - w.margin ? 'close' : 'safe');

let ready = false;
function setup() {
  if (ready) return;
  webpush.setVapidDetails(process.env.VAPID_EMAIL || 'mailto:you@example.com', process.env.VAPID_PUBLIC, process.env.VAPID_PRIVATE);
  ready = true;
}

export async function notify(subs, deviceId, payload) {
  const sub = subs[deviceId];
  if (!sub) return { ok: false, reason: 'no-subscription' };
  try { setup(); await webpush.sendNotification(sub, JSON.stringify(payload)); return { ok: true }; }
  catch (e) {
    const gone = e.statusCode === 404 || e.statusCode === 410;
    if (gone) delete subs[deviceId];
    console.error('Push failed:', e.statusCode, e.body || e.message);
    return { ok: false, gone, status: e.statusCode, reason: gone ? 'subscription-expired' : 'push-failed', detail: String(e.body || e.message || e).slice(0, 160) };
  }
}

async function check(api) {
  const [subs, watches, status, sent] = await Promise.all([read('subs', {}), read('watches', {}), read('status', {}), read('sent', {})]);
  let subsChanged = false;
  const send = async (dev, p) => { const r = await notify(subs, dev, p); if (r.gone) subsChanged = true; };
  for (const [dev, list] of Object.entries(watches)) {
    for (const w of list) {
      const your = api + (w.gap || 0), st = statusOf(w, your), key = `${dev}:${w.id}`;
      if (status[key] && status[key] !== st) {
        await send(dev, { title: `${w.name}: ${LABEL[st]}`, body: `Your rate ₦${your.toFixed(2)}. Max safe rate ₦${w.maxSafe.toFixed(2)}. Room left ₦${(w.maxSafe - your).toFixed(2)}.` });
      }
      status[key] = st;
      for (const m of w.dates || []) {
        const days = Math.round((new Date(m.date) - new Date(today())) / 864e5);
        for (const d of [3, 0]) {
          const k = `${key}:${m.label}:${m.date}:${d}`;
          if (days === d && !sent[k]) {
            sent[k] = 1;
            await send(dev, { title: `${w.name}: ${m.label}`, body: d ? `Due in ${d} days (${m.date}).` : `Due today (${m.date}).` });
          }
        }
      }
    }
  }
  await Promise.all([write('status', status), write('sent', sent), subsChanged ? write('subs', subs) : null]);
}

export async function pullRate() {
  const r = await fetch(process.env.RATE_URL || 'https://open.er-api.com/v6/latest/USD');
  const rate = Number((await r.json()).rates?.NGN);
  if (!rate) throw new Error('no NGN rate in response');
  const rates = await read('rates', {});
  rates[today()] = rate;
  const latest = { rate, at: new Date().toISOString() };
  await Promise.all([write('rates', rates), write('latest', latest)]);
  await check(rate);
  return latest;
}
