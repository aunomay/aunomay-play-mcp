import { SITE_URL, listCategories, searchGames, type Category, type GameSummary } from "@/lib/aunomay";
import { baseUrl } from "@/lib/base-url";

export const revalidate = 3600;

const TOOLS = [
  ["search_games", "Find games by keyword or category, sorted by relevance, newest, most played or top rated."],
  ["get_game", "Description, how to play, categories, mobile support, languages and similar games."],
  ["list_categories", "All game categories with the number of games in each."],
  ["random_game", "One random pick, optionally from a category or mobile-friendly only."],
  ["search / fetch", "The standard pair ChatGPT uses for connectors and deep research."],
] as const;

async function catalog(): Promise<{ games: GameSummary[]; categories: Category[] }> {
  try {
    const [games, cats] = await Promise.all([searchGames({ sort: "popular", limit: 12 }), listCategories()]);
    return { games: games.games, categories: cats.categories.slice(0, 16) };
  } catch {
    return { games: [], categories: [] };
  }
}

export default async function Home() {
  const endpoint = `${baseUrl()}/mcp`;
  const { games, categories } = await catalog();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Aunomay Play MCP Server",
    applicationCategory: "GameApplication",
    operatingSystem: "Any",
    url: baseUrl(),
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: "Aunomay", url: SITE_URL },
    isRelatedTo: { "@type": "WebSite", name: "Aunomay Play", url: SITE_URL },
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="hero">
        <span className="badge">Model Context Protocol · ChatGPT App</span>
        <h1>Aunomay Play MCP Server</h1>
        <p>
          Let ChatGPT, Claude, Cursor and any MCP client search and launch free HTML5 games from{" "}
          <a href={SITE_URL}>Aunomay Play</a>. No download, no sign-up, works on desktop and mobile.
        </p>
        <div className="cta">
          <a className="btn primary" href={SITE_URL}>Play games on Aunomay Play</a>
          <a className="btn" href="#connect">Connect your AI assistant</a>
        </div>
      </header>

      <section id="connect">
        <h2>MCP endpoint</h2>
        <div className="card">
          <p>Streamable HTTP, no authentication, read-only:</p>
          <pre><code>{endpoint}</code></pre>
        </div>
      </section>

      <section>
        <h2>Connect</h2>
        <div className="grid">
          <div className="card">
            <h3>ChatGPT</h3>
            <p>Install Aunomay Play from the ChatGPT app directory, or turn on Developer mode in Settings → Apps and create an app with the endpoint above (authentication: none).</p>
          </div>
          <div className="card">
            <h3>Claude</h3>
            <p>Settings → Connectors → Add custom connector, then paste the endpoint. In Claude Code: <code>claude mcp add --transport http aunomay-play {endpoint}</code></p>
          </div>
          <div className="card">
            <h3>Cursor / VS Code / Windsurf</h3>
            <pre><code>{JSON.stringify({ mcpServers: { "aunomay-play": { url: endpoint } } }, null, 2)}</code></pre>
          </div>
          <div className="card">
            <h3>stdio-only clients</h3>
            <pre><code>{`npx -y mcp-remote ${endpoint}`}</code></pre>
          </div>
        </div>
      </section>

      <section>
        <h2>Tools</h2>
        <div className="grid">
          {TOOLS.map(([name, desc]) => (
            <div className="card" key={name}>
              <h3><code>{name}</code></h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
        <p>All tools are read-only and only return published games. Try asking: “Find me a relaxing puzzle game I can play on my phone.”</p>
      </section>

      {games.length > 0 && (
        <section>
          <h2>Popular games on Aunomay Play</h2>
          <ul>
            {games.map((g) => (
              <li key={g.id}>
                <a href={g.url}>{g.title}</a> — {g.description}
              </li>
            ))}
          </ul>
        </section>
      )}

      {categories.length > 0 && (
        <section>
          <h2>Game categories</h2>
          <p>
            {categories.map((c, i) => (
              <span key={c.slug}>
                {i > 0 && " · "}
                <a href={c.url}>{c.name}</a>
              </span>
            ))}
          </p>
        </section>
      )}

      <footer>
        <p>
          Built by <a href={SITE_URL}>Aunomay Play</a> — free online HTML5 games. Data comes from the public{" "}
          <a href={`${SITE_URL}/api/v1`}>Aunomay Play catalog API</a>. <a href="/privacy">Privacy</a> · Contact:{" "}
          <a href="mailto:support@aunomay.com">support@aunomay.com</a>
        </p>
      </footer>
    </main>
  );
}
