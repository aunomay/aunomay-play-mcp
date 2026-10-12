// Smoke test: node scripts/smoke.mjs [endpoint]  (default http://localhost:3000/mcp)
// Calls initialize, tools/list and every tool over Streamable HTTP; exits 1 on any failure.
const endpoint = process.argv[2] || process.env.MCP_URL || "http://localhost:3000/mcp";
let id = 0, failed = 0;

async function rpc(method, params = {}) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", "Mcp-Protocol-Version": "2025-06-18" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
  });
  const raw = await res.text();
  const json = raw.trim().startsWith("{") ? JSON.parse(raw) : JSON.parse(raw.split("\n").filter((l) => l.startsWith("data:")).pop().slice(5));
  if (json.error) throw new Error(`${method}: ${JSON.stringify(json.error)}`);
  return json.result;
}

function check(name, ok, info = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${info ? "  " + info : ""}`);
  if (!ok) failed++;
}

const init = await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "smoke", version: "1" } });
check("initialize", init.serverInfo?.name === "aunomay-play", init.serverInfo?.name);
const { tools } = await rpc("tools/list");
const names = tools.map((t) => t.name).sort();
check("tools/list", ["fetch", "get_game", "list_categories", "random_game", "search", "search_games"].every((n) => names.includes(n)), names.join(","));
check("all tools read-only", tools.every((t) => t.annotations?.readOnlyHint === true));
const call = (name, args) => rpc("tools/call", { name, arguments: args });

const s = await call("search", { query: "car" });
const results = JSON.parse(s.content[0].text).results;
check("search", Array.isArray(results), `${results.length} results`);
if (results[0]) {
  const f = await call("fetch", { id: results[0].id });
  const doc = JSON.parse(f.content[0].text);
  check("fetch", doc.id === results[0].id && !!doc.text && !!doc.url, doc.title);
}
const sg = await call("search_games", { sort: "popular", limit: 3 });
check("search_games", !sg.isError && sg.structuredContent.games.length > 0, `${sg.structuredContent?.games?.length} games`);
const slug = sg.structuredContent?.games?.[0]?.slug;
if (slug) {
  const g = await call("get_game", { slug, language: "vi" });
  check("get_game", !g.isError && g.structuredContent.game.slug, g.structuredContent?.game?.title);
}
const c = await call("list_categories", {});
check("list_categories", !c.isError && c.structuredContent.categories.length > 0, `${c.structuredContent?.categories?.length} categories`);
const r = await call("random_game", { mobile_only: true });
check("random_game", !r.isError && !!r.structuredContent.game.url, r.structuredContent?.game?.title);
const nf = await call("get_game", { slug: "this-game-does-not-exist-xyz" });
check("get_game not found -> isError", nf.isError === true);
const { resources } = await rpc("resources/list");
check("widget resource", resources.some((x) => x.mimeType === "text/html+skybridge"));

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
