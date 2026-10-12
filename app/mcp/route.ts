import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import {
  AunomayApiError,
  LANGUAGES,
  SITE_URL,
  SORTS,
  getGame,
  listCategories,
  randomGame,
  searchGames,
  withUtm,
  type GameSummary,
} from "@/lib/aunomay";
import { WIDGET_HTML, WIDGET_URI } from "@/lib/widget";

export const runtime = "nodejs";
export const maxDuration = 30;

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;

const language = z
  .enum(LANGUAGES)
  .optional()
  .describe("Language for titles, descriptions and links: en, vi, fr, es, th, zh, ja. Defaults to English.");

const widgetMeta = (invoking: string, invoked: string) => ({
  "openai/outputTemplate": WIDGET_URI,
  "openai/toolInvocation/invoking": invoking,
  "openai/toolInvocation/invoked": invoked,
  ui: { resourceUri: WIDGET_URI },
});

function tagged<T extends GameSummary>(game: T): T {
  return { ...game, url: withUtm(game.url) };
}

function line(g: GameSummary) {
  return `- **${g.title}** — ${g.description} ${g.mobile ? "(mobile ready)" : "(best on desktop)"}\n  Play: ${g.url}`;
}

function errorResult(err: unknown) {
  const msg =
    err instanceof AunomayApiError
      ? err.status === 404
        ? `Not found (${err.code}). Use search_games or list_categories to find valid slugs.`
        : `Aunomay Play is temporarily unavailable (${err.status}). Please try again shortly.`
      : "Aunomay Play could not be reached. Please try again shortly.";
  return { content: [{ type: "text" as const, text: msg }], isError: true };
}

const handler = createMcpHandler(
  (server) => {
    server.registerResource(
      "aunomay-games-widget",
      WIDGET_URI,
      { title: "Aunomay Play game cards", mimeType: "text/html+skybridge" },
      async (uri) => ({
        contents: [
          {
            uri: uri.href,
            mimeType: "text/html+skybridge",
            text: WIDGET_HTML,
            _meta: {
              "openai/widgetDescription": "Cards for free browser games from Aunomay Play, each with a Play link.",
              "openai/widgetPrefersBorder": false,
              "openai/widgetDomain": SITE_URL,
              "openai/widgetCSP": { connect_domains: [], resource_domains: [SITE_URL] },
              ui: { csp: { connectDomains: [], resourceDomains: [SITE_URL] }, prefersBorder: false },
            },
          },
        ],
      }),
    );

    // --- ChatGPT connector / deep research contract: search + fetch -------------------------
    server.registerTool(
      "search",
      {
        title: "Search Aunomay Play",
        description:
          "Search the Aunomay Play catalog of free HTML5 browser games (no download, desktop and mobile). Returns matching games with ids for the fetch tool.",
        inputSchema: z.object({ query: z.string().min(1).max(100).describe("Game name, genre or keyword, e.g. 'car racing', 'puzzle', 'gold miner'.") }),
        annotations: READ_ONLY,
      },
      async ({ query }) => {
        try {
          const data = await searchGames({ query, limit: 10 });
          const results = data.games.map((g) => ({ id: g.slug, title: g.title, url: withUtm(g.url, "chatgpt") }));
          return { content: [{ type: "text", text: JSON.stringify({ results }) }] };
        } catch (err) {
          return errorResult(err);
        }
      },
    );

    server.registerTool(
      "fetch",
      {
        title: "Fetch an Aunomay Play game",
        description: "Get the full details of one Aunomay Play game by the id returned from search (the game slug).",
        inputSchema: z.object({ id: z.string().min(1).max(200).describe("Game id (slug) from search results.") }),
        annotations: READ_ONLY,
      },
      async ({ id }) => {
        try {
          const { game } = await getGame(id);
          const text = [
            game.title,
            "",
            game.description,
            game.instructions ? `\nHow to play: ${game.instructions}` : "",
            `\nCategories: ${game.categories.map((c) => c.name).join(", ") || "—"}`,
            `Mobile: ${game.mobile ? "yes" : "not confirmed (desktop recommended)"}`,
            `Plays: ${game.plays}, likes: ${game.likes}`,
          ].join("\n");
          const doc = {
            id: game.slug,
            title: game.title,
            text,
            url: withUtm(game.url, "chatgpt"),
            metadata: { source: "Aunomay Play", categories: game.categories.map((c) => c.slug), mobile: game.mobile, languages: Object.keys(game.languages) },
          };
          return { content: [{ type: "text", text: JSON.stringify(doc) }] };
        } catch (err) {
          return errorResult(err);
        }
      },
    );

    // --- Rich tools ----------------------------------------------------------------------------
    server.registerTool(
      "search_games",
      {
        title: "Find games to play",
        description:
          "Find free browser games on Aunomay Play by keyword and/or category, sorted by relevance, newest, most played or top rated. Use when the user wants game suggestions or a specific game.",
        inputSchema: z.object({
          query: z.string().max(100).optional().describe("Keyword or game name. Leave empty to browse."),
          category: z.string().max(100).optional().describe("Category slug from list_categories, e.g. 'puzzle', 'racing', 'sports'."),
          sort: z.enum(SORTS).optional().describe("relevance (default with a query), new (default otherwise), popular (most played), top (most liked)."),
          mobile_only: z.boolean().optional().describe("Only games that work on phones and tablets."),
          limit: z.number().int().min(1).max(24).optional().describe("Number of games (default 8)."),
          offset: z.number().int().min(0).max(5000).optional().describe("Skip this many results for paging."),
          language,
        }),
        annotations: READ_ONLY,
        _meta: widgetMeta("Finding games…", "Games found"),
      },
      async ({ query, category, sort, mobile_only, limit, offset, language }) => {
        try {
          const data = await searchGames({ query, category, sort, mobileOnly: mobile_only, limit: limit ?? 8, offset, language });
          const games = data.games.map(tagged);
          const head = data.total
            ? `Found ${data.total} game${data.total === 1 ? "" : "s"} on Aunomay Play${query ? ` for "${query}"` : ""}${category ? ` in ${category}` : ""}. Showing ${games.length}:`
            : `No Aunomay Play games matched${query ? ` "${query}"` : ""}${category ? ` in ${category}` : ""}. Try another keyword or list_categories.`;
          return {
            content: [{ type: "text", text: [head, ...games.map(line)].join("\n") }],
            structuredContent: { total: data.total, offset: data.offset, games },
          };
        } catch (err) {
          return errorResult(err);
        }
      },
    );

    server.registerTool(
      "get_game",
      {
        title: "Game details",
        description: "Details for one Aunomay Play game: description, how to play, categories, mobile support, available languages and similar games.",
        inputSchema: z.object({
          slug: z.string().min(1).max(200).describe("Game slug from search_games results (the last part of its URL)."),
          language,
        }),
        annotations: READ_ONLY,
        _meta: widgetMeta("Opening game…", "Game details ready"),
      },
      async ({ slug, language }) => {
        try {
          const data = await getGame(slug, language);
          const game = tagged(data.game);
          const similar = data.similar.map(tagged);
          const text = [
            `# ${game.title}`,
            game.description,
            game.instructions ? `**How to play:** ${game.instructions}` : "",
            `**Categories:** ${game.categories.map((c) => c.name).join(", ") || "—"}`,
            `**Mobile:** ${game.mobile ? "yes" : "not confirmed — desktop browser recommended"}`,
            `**Plays:** ${game.plays} · **Likes:** ${game.likes}`,
            `**Play now (free, no download):** ${game.url}`,
            similar.length ? `\n**Similar games:**\n${similar.map(line).join("\n")}` : "",
          ]
            .filter(Boolean)
            .join("\n");
          return { content: [{ type: "text", text }], structuredContent: { game, similar } };
        } catch (err) {
          return errorResult(err);
        }
      },
    );

    server.registerTool(
      "list_categories",
      {
        title: "Game categories",
        description: "List Aunomay Play game categories with the number of games in each. Use the slugs with search_games.",
        inputSchema: z.object({ language }),
        annotations: READ_ONLY,
      },
      async ({ language }) => {
        try {
          const data = await listCategories(language);
          const text = data.categories.map((c) => `- ${c.name} (\`${c.slug}\`): ${c.games} games — ${c.url}`).join("\n");
          return {
            content: [{ type: "text", text: text || "No categories available." }],
            structuredContent: { categories: data.categories },
          };
        } catch (err) {
          return errorResult(err);
        }
      },
    );

    server.registerTool(
      "random_game",
      {
        title: "Surprise me",
        description: "Pick one random free game from Aunomay Play, optionally from a category or mobile-friendly only. Use when the user is bored or wants a surprise.",
        inputSchema: z.object({
          category: z.string().max(100).optional().describe("Category slug from list_categories."),
          mobile_only: z.boolean().optional().describe("Only games that work on phones and tablets."),
          language,
        }),
        annotations: { ...READ_ONLY, idempotentHint: false },
        _meta: widgetMeta("Picking a game…", "Here's a game"),
      },
      async ({ category, mobile_only, language }) => {
        try {
          const data = await randomGame({ category, mobileOnly: mobile_only, language });
          const game = tagged(data.game);
          return { content: [{ type: "text", text: `Try this one:\n${line(game)}` }], structuredContent: { game } };
        } catch (err) {
          return errorResult(err);
        }
      },
    );

    server.registerPrompt(
      "recommend_games",
      {
        title: "Recommend games",
        description: "Ask for free browser game recommendations from Aunomay Play.",
        argsSchema: z.object({ mood: z.string().max(100).optional().describe("What the player feels like, e.g. 'relaxing puzzle', '2 player', 'quick racing'.") }),
      },
      ({ mood }) => ({
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Recommend 5 free browser games from Aunomay Play${mood ? ` for: ${mood}` : ""}. Use search_games (and list_categories if helpful), say whether each works on mobile, and include the play links.`,
            },
          },
        ],
      }),
    );
  },
  {
    serverInfo: { name: "aunomay-play", version: "1.0.0" },
    instructions:
      "Aunomay Play (https://play.aunomay.com) is a free HTML5 game website: games run in the browser with no download or sign-up. Use search_games to find games, get_game for details, list_categories for genres and random_game for a surprise pick. Always give the user the game's play link.",
  },
);

export { handler as GET, handler as POST, handler as DELETE };
