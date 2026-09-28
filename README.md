# Chandi Paath — PWA

A seven-day Sri Chandi Paath (Durga Saptashati) tracker. Pick a start day, follow each day's chapters and the full order of reading, and keep a history of every round. Tithis follow the Telugu lunar calendar (at Hyderabad sunrise) and are calculated on the phone, so the app works offline.

```
index.html              the app
manifest.webmanifest    install metadata (name, icons, colours)
sw.js                   offline support
icons/                  app icons
apps-script/Code.gs     optional Google Sheets sync
```

## 1. GitHub Pages

The workflow in `.github/workflows/pages.yml` publishes the site on every push to `main`. It only copies the app files (`index.html`, `manifest.webmanifest`, `sw.js`, `icons/`), so `apps-script/` and this README are not served.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**. Then open the **Actions** tab and re-run *Deploy to GitHub Pages* if the first run failed before Pages was switched on.

The app is served at **https://balendus.github.io/chandi-paath/**.

## 2. Install it on your phone

- **iPhone:** open the site in **Safari** → Share → **Add to Home Screen**.
- **Android:** open it in **Chrome** → ⋮ menu → **Install app** (or *Add to Home screen*).

It opens full screen, works without internet, and keeps your rounds on the phone.

## 3. Optional: sync to Google Sheets

This gives you a History sheet (one row per day of every round) and lets a second phone load the same rounds.

1. Create a new Google Sheet, for example *Chandi Paath*.
2. **Extensions → Apps Script**. Delete the sample code, paste in `apps-script/Code.gs`, and save.
3. **Deploy → New deployment** → type **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**, allow the permissions it asks for, and copy the **Web app URL** (it ends in `/exec`).
5. In the app, open **History → Google Sheets sync**, paste the URL, and tap **Connect Google Sheet**.

After that the app syncs automatically a moment after every change, and pulls from the sheet whenever you open it. **Sync now** forces a sync. On a second phone, paste the same URL to load your history.

Keep the URL to yourself: anyone who has it can read and change the sync data. If it leaks, create a new deployment in Apps Script and paste the new URL into the app.

If you later edit `Code.gs`, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.

## Updating the app

When you change `index.html`, also bump `VERSION` at the top of `sw.js` (for example `chandi-v2`) and push. Installed copies pick up the new version the next time they are opened online.

## Notes

- Tithis are computed for sunrise at Hyderabad. A tithi that changes within a few minutes of sunrise can show a day off, so check a panchangam for important dates.
- Your data lives in the phone's browser storage for this site. Uninstalling the app or clearing Safari/Chrome site data erases it unless Google Sheets sync is on.
