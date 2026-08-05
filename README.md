# 1st Mobile Infantry

Official fan / community site for the **1st Mobile Infantry (1st Division)**.

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

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Use defaults (`npm run build`)
4. Deploy
5. Optional: add a custom domain in **Project → Settings → Domains**

## Notes

- Discord invite is set in `src/data/unit.ts` (`unit.discordInvite`)
- Company logos and site background live in `public/`
- Bugs-killed counter is a shared world-clock tally (with WebSocket in long-running servers)

Unofficial fan tribute. Not affiliated with any studio or publisher.

## Live dropship total (Discord AAR bot)

The home page **Total dropships** stat is pulled from your Discord bot's HTTP API:

```
GET /stats  →  { "totalDropships": number, "totalPoints": number }
```

1. Host the bot so `/stats` is reachable on the public internet (Railway, Render, VPS, etc.)
2. In Vercel → Project → Settings → Environment Variables, set:

```
DROPSHIP_STATS_URL=https://YOUR-BOT-PUBLIC-URL/stats
```

3. Redeploy the site.

Until that variable is set, the dropship tile shows "—" and "Connect bot API".
