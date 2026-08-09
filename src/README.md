# 1st Mobile Infantry

Official fan / community site for the **1st Mobile Infantry (1st Division)**.

**Live site:** [https://1st-mobile-infantry.vercel.app/](https://1st-mobile-infantry.vercel.app/)  
**GitHub:** [https://github.com/ccmatrix501-spec/1st-Mobile-Infantry](https://github.com/ccmatrix501-spec/1st-Mobile-Infantry)

## Stack

- React 19 + TypeScript
- TanStack Start / Router
- Vite + Tailwind CSS v4
- Deploy target: Vercel

## Local setup

```bash
npm install
npm run dev
```

App runs at `http://localhost:8080`.

## Scripts

| Command | Purpose |
|--------|---------|
| `npm run dev` | Dev server on `0.0.0.0:8080` |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check |

---

## Deployment checklist

### A. First-time Vercel setup (only once)

1. [ ] Create a GitHub repo (or use `ccmatrix501-spec/1st-Mobile-Infantry`)
2. [ ] Push the project to the **`main`** branch
3. [ ] Go to [vercel.com](https://vercel.com) → **Add New Project** → import that repo
4. [ ] Framework / build defaults are fine (`npm run build`)
5. [ ] Click **Deploy** and wait for a green success
6. [ ] Confirm the site opens (e.g. `https://1st-mobile-infantry.vercel.app/`)

### B. Environment variables (Vercel)

**Project → Settings → Environment Variables** — set for **Production** (and Preview if you want):

| Name | Value | Required? |
|------|--------|-----------|
| `DROPSHIP_STATS_URL` | `https://1st-mi-aar-production-1522.up.railway.app/stats` | Optional (built-in default matches this) |

1. [ ] Add / confirm `DROPSHIP_STATS_URL` (no `:8080` or `:3000` on the URL)
2. [ ] Save
3. [ ] **Redeploy** after changing env vars (Deployments → ⋮ → Redeploy)

### C. Update the live site (every time you change the code)

1. [ ] Unzip / copy the new project files over your local repo (or merge changes)
2. [ ] Do **not** delete `public/` portraits/logos you still need
3. [ ] Optional local check:
   ```bash
   npm install
   npm run build
   npm run typecheck
   ```
4. [ ] Commit and push to **`main`**:
   ```bash
   git add .
   git commit -m "Update 1st MI site"
   git push origin main
   ```
5. [ ] Open Vercel → **Deployments** → wait for the new deploy to finish (Ready)
6. [ ] Hard-refresh the live site (`Ctrl/Cmd + Shift + R`) or open a private window
7. [ ] Spot-check:
   - [ ] Home loads (not blank / no red “Failed to fetch module”)
   - [ ] **Bugs killed** still counting up
   - [ ] **Total dropships completed** shows a number (from Railway bot)
   - [ ] Leadership names + portraits
   - [ ] Join Now! → Discord

### D. Bug counter (important)

The kill total is a **time-based formula**, not a database:

- Start + (seconds since epoch × kills per second)
- If you **change** `src/lib/bugs-killed.ts` (base, rate, or epoch), the live number **can jump**
- If you leave that file alone (or keep the same values), the counter **continues** after deploy

1. [ ] Only edit `bugs-killed.ts` when you intend to change start number or speed
2. [ ] After deploy, confirm the number is still in the expected range

### E. Dropships (Discord AAR bot on Railway)

1. [ ] Bot is running on Railway
2. [ ] Public URL works in a browser (no port):
   ```
   https://1st-mi-aar-production-1522.up.railway.app/stats
   ```
3. [ ] Returns JSON like `{ "totalDropships": 1664, "totalPoints": … }`
4. [ ] Site env / default points at that same URL

### F. Custom domain (optional)

1. [ ] Buy a domain you own
2. [ ] Vercel → Project → **Settings → Domains** → add domain
3. [ ] At the registrar, set the **A / CNAME** records Vercel shows (no `https://`, no port)
4. [ ] Wait for DNS → status **Valid**
5. [ ] Open the custom domain and confirm the site

### G. If something breaks

| Symptom | Fix |
|---------|-----|
| Blank page / “Failed to fetch dynamically imported module” | Redeploy latest Production; hard-refresh |
| Dropships show “—” / offline | Check Railway bot + `/stats` URL + `DROPSHIP_STATS_URL` |
| Leadership empty | Ensure roster `tier` is `"command"` / `"captain"` (lowercase) |
| Bug number jumped | You changed `bugs-killed.ts` base/rate/epoch — re-anchor if needed |
| Wrong old content | Confirm Vercel deployed the newest Git commit on `main` |

---

## Notes

- Discord invite: `src/data/unit.ts` → `unit.discordInvite`
- Leadership roster + portraits: `src/data/unit.ts` + files in `public/roster-*.jpg`
- Company logos / background: `public/`
- Bugs killed logic: `src/lib/bugs-killed.ts`
- Dropship proxy: `src/lib/dropship-stats-fn.ts`

Unofficial fan tribute. Not affiliated with any studio or publisher.
