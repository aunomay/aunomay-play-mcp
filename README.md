# Aunomay Play MCP Server

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Faunomay%2Faunomay-play-mcp&env=AUNOMAY_SITE_URL&envDescription=Aunomay%20Play%20site%20URL&project-name=aunomay-play-mcp)

A [Model Context Protocol](https://modelcontextprotocol.io) server that lets ChatGPT, Claude, Cursor and other AI assistants search and launch free HTML5 browser games from **[Aunomay Play](https://play.aunomay.com)**. You don't need to download anything or sign up, and the games work on desktop and mobile.

- **Live demo:** https://aunomay-play-mcp.vercel.app
- **MCP endpoint:** `https://aunomay-play-mcp.vercel.app/mcp` (Streamable HTTP, read-only, no auth)
- Built with Next.js App Router, [`mcp-handler`](https://www.npmjs.com/package/mcp-handler) and MCP SDK v2. It's ready for Vercel Fluid compute.

## Tools

| Tool | What it does |
| --- | --- |
| `search_games` | Find games by keyword and/or category, sorted by relevance, newest, most played or top rated. Can return mobile-ready games only. |
| `get_game` | Shows a game's description, how to play, categories, mobile support, available languages and similar games. |
| `list_categories` | Lists categories with game counts. |
| `random_game` | Picks a random game, optionally from one category or mobile-ready only. |
| `search` / `fetch` | The standard pair that ChatGPT connectors and deep research use. |

Every tool is read-only (`readOnlyHint: true`). Tools accept `language`: `en`, `vi`, `fr`, `es`, `th`, `zh` or `ja`. In ChatGPT, `search_games`, `get_game` and `random_game` show game cards with a **Play now** button (Apps SDK widget `ui://widget/aunomay-games-v1.html`).

There is also one prompt, `recommend_games`.

## Connect

```json
{ "mcpServers": { "aunomay-play": { "url": "https://aunomay-play-mcp.vercel.app/mcp" } } }
```

- **ChatGPT:** install Aunomay Play from the app directory. You can also turn on Developer mode, then create an app with the endpoint and choose no authentication.
- **Claude:** go to Settings → Connectors → Add custom connector. In Claude Code, run `claude mcp add --transport http aunomay-play https://aunomay-play-mcp.vercel.app/mcp`.
- **stdio-only clients:** run `npx -y mcp-remote https://aunomay-play-mcp.vercel.app/mcp`.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
npm test
```

`npm run dev` starts the server at http://localhost:3000/mcp. `npm test` runs a smoke test that calls every tool.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `AUNOMAY_SITE_URL` | `https://play.aunomay.com` | The site whose public catalog API (`/api/v1`) is read |
| `AUNOMAY_API_BASE` | `<site>/api/v1` | Overrides the API base |
| `NEXT_PUBLIC_BASE_URL` | Vercel production URL | Public URL shown on the landing page |
| `AUNOMAY_API_KEY` | — | Secret sent as `X-Aunomay-Mcp-Key`, so a Cloudflare WAF rule can skip bot protection for this server |
| `OPENAI_APPS_CHALLENGE` | — | Domain verification token served at `/.well-known/openai-apps-challenge` |

## Data and privacy

The server only reads published games from the public Aunomay Play catalog API. It stores nothing and needs no keys. Game links carry `utm_source=mcp` or `utm_source=chatgpt` so that visits from AI assistants show up in the site's analytics. See [/privacy](https://aunomay-play-mcp.vercel.app/privacy).

## License

MIT © [Aunomay](https://play.aunomay.com)
