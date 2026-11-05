# Naira Vaults (Netlify version)

Track USD loans invested in naira. Each vault is one loan with its interest and the investments inside it.
Live USD/NGN rate, daily history, your rate (market rate + your gap), Max safe rate, push alerts, PIN and biometric lock.

## Deploy on Netlify
1. Push this folder to a GitHub repo.
2. Netlify > Add new site > Import an existing project > pick the repo. No build command is needed; the publish folder and functions folder come from netlify.toml.
3. Generate push keys on your computer: `npx web-push generate-vapid-keys`
4. Netlify > Site configuration > Environment variables, add:
   - `VAPID_PUBLIC` and `VAPID_PRIVATE` (from step 3)
   - `APP_KEY` (a long random string; this is your server key)
   - optional: `VAPID_EMAIL` (mailto:you@example.com), `RATE_URL`
5. Trigger a deploy. Netlify gives you an https address.

Dragging the folder into Netlify's drop zone will not install the function packages. Use the GitHub import or the Netlify CLI (`netlify deploy --prod`).

## Use it
1. Open the site, create your 4-digit PIN, then set a recovery question and biometrics in Settings.
2. Settings > Edit settings > paste the server key. Live rates load.
3. Settings > Turn on push alerts > Send a test alert.
4. Create a vault and add its investments.

## Good to know
- The rate check runs every 30 minutes as a Netlify scheduled function (UTC cron). It only runs on the published production deploy. If your plan limits how often it can run, change the schedule in `netlify/functions/pull-rate.mjs` to `@hourly`.
- Data is kept in Netlify Blobs, so it survives redeploys.
- Rate source: open.er-api.com (the market rate, not the parallel-market rate). To use another source, set `RATE_URL` to an endpoint that returns `{ "rates": { "NGN": 1500 } }`.
- History starts the day the first rate is saved. Older days are not back-filled.
- Your loan figures are encrypted on your device. The server only keeps each vault's name, Max safe rate, safety margin, rate gap, due dates and your push subscription.
- iPhone: open the site in Safari, Share > Add to Home Screen, then turn on push from the installed app.
