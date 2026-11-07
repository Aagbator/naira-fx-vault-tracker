import { read, write, del, pullRate, notify } from '../lib/core.mjs';

export const config = { path: '/api/*' };
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } });

export default async (req) => {
  if (!process.env.APP_KEY || req.headers.get('x-app-key') !== process.env.APP_KEY) return json({ error: 'Wrong server key' }, 401);
  const route = `${req.method} ${new URL(req.url).pathname.replace(/^\/api/, '')}`;
  const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
  try {
    switch (route) {
      case 'GET /vapid': return json({ key: process.env.VAPID_PUBLIC });
      case 'GET /rate': return json((await read('latest', null)) ?? (await pullRate()));
      case 'GET /rates': return json(await read('rates', {}));
      case 'POST /subscribe': { const s = await read('subs', {}); s[body.deviceId] = body.subscription; await write('subs', s); return json({ ok: 1 }); }
      case 'POST /watches': { const w = await read('watches', {}); w[body.deviceId] = body.watches; await write('watches', w); return json({ ok: 1 }); }
      case 'POST /test': { const s = await read('subs', {}); const r = await notify(s, body.deviceId, { title: 'Test alert', body: 'Push alerts are working.' }); if (r.gone) await write('subs', s); return json(r); }
      case 'GET /parallel': return json({ days: await read('parallel', {}), latest: await read('parallelLatest', null), lastError: await read('parallelError', null) });
      case 'GET /sync': return json(await read('sync', null));
      case 'POST /sync': {
        const cur = await read('sync', null), ver = cur ? cur.version : 0;
        if (body.baseVersion !== ver) return json({ conflict: true, version: ver }, 409);
        const rec = { version: ver + 1, updatedAt: new Date().toISOString(), salt: body.blob.salt, wrapPass: body.blob.wrapPass, data: body.blob.data };
        await write('sync', rec);
        return json({ version: rec.version });
      }
      case 'DELETE /sync': await del('sync'); return json({ ok: 1 });
      default: return json({ error: 'Not found' }, 404);
    }
  } catch (e) { return json({ error: e.message }, 500); }
};
