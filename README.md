# Naira Vaults (Netlify version)

Track USD loans invested in naira. Each vault is one loan with its interest, fee, repayments and the investments inside it.
Live USD/NGN market rate, Monierate black market rate, daily history, Max safe rate, push alerts, PIN and biometric lock, and encrypted sync between devices.

## Deploy on Netlify
1. Push this folder to a GitHub repo and import it in Netlify. No build command is needed.
2. Generate push keys on your computer: `npx web-push generate-vapid-keys`
3. Netlify > Site configuration > Environment variables:
   - `VAPID_PUBLIC` and `VAPID_PRIVATE` (from step 2)
   - `VAPID_EMAIL` (your real address as `mailto:you@yourmail.com`)
   - `APP_KEY` (a long random string; this is your server key)
   - `MONIERATE_KEY` (your Monierate API key; keep it out of the code and out of GitHub)
   - optional: `RATE_URL` (another market-rate source that returns `{ "rates": { "NGN": 1500 } }`)
4. Redeploy after adding or changing any variable.

Dragging the folder into Netlify's drop zone will not install the function packages. Use the GitHub import or `netlify deploy --prod`.

## Scheduled jobs (UTC cron)
- `pull-rate`: market rate every 30 minutes, then checks every vault and sends alerts. If your plan limits scheduled-function frequency, change it to `@hourly` in `netlify/functions/pull-rate.mjs`.
- `pull-parallel`: Monierate parallel (black market) rate at 09:00 and 13:00 UTC, which is 10:00 and 14:00 in Lagos. That is about 60 requests a month. A rate that looks wrong next to the market rate (under 70% or over 150% of it) is rejected, and the last good value is kept and marked as old in the app.
Scheduled functions only run on the published production deploy.

## First use
1. Create your 4-digit PIN. In Settings, set a recovery question and turn on biometrics.
2. Settings > Edit settings > paste the server key. Rates load.
3. Settings > Turn on push alerts > Send a test alert. The test tells you if something is wrong.
4. Create a vault (term quick-picks, origination fee, optional monthly payment from the offer) and add its investments.

## Sync between devices
- Settings > Turn on sync on your first device. Choose a sync passphrase of 8 or more characters.
- On a new device, on the PIN screen choose **Sync from another device**. Enter the server key, the sync passphrase and a new PIN for that device.
- Data is encrypted on the device before upload. The server only holds the encrypted copy. Without the sync passphrase it cannot be read, so write the passphrase down.
- Each device keeps its own PIN, biometrics and recovery question. If both devices change data at once, the app asks which version to keep.
- To use an existing online copy on a device that already has its own data, install fresh and choose Sync from another device.

## Good to know
- Black market column: Monierate's value shows by default. Tap a cell to enter your own rate (marked ✎); enter 0 to go back to the automatic value. Monierate's parallel figure is an aggregate and can differ from the aboki dealer rate on their website, so compare them for a few days.
- Colours: green means positive and red means negative everywhere. Safe, Getting close and Losing keep green, amber and red.
- History starts the day the first rate is saved. Older days are not back-filled.
- Your loan figures never leave the device unencrypted. The server keeps each vault's name, Max safe rate, safety margin, rate gap and due dates for alerts, plus your push subscription.
- Monthly repayment vaults: open the app after each repayment date so alerts use the updated Max safe rate.
- iPhone: open the site in Safari, Share > Add to Home Screen, then turn on push from the installed app.
