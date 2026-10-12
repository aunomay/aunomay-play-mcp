/** Client for the public Aunomay Play catalog API (https://play.aunomay.com/api/v1). */

export const SITE_URL = (process.env.AUNOMAY_SITE_URL || "https://play.aunomay.com").replace(/\/+$/, "");
const API_BASE = (process.env.AUNOMAY_API_BASE || `${SITE_URL}/api/v1`).replace(/\/+$/, "");

export const LANGUAGES = ["en", "vi", "fr", "es", "th", "zh", "ja"] as const;
export type Language = (typeof LANGUAGES)[number];
export const SORTS = ["relevance", "new", "popular", "top"] as const;

export interface GameSummary {
  id: number;
  slug: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  mobile: boolean;
  plays: number;
  likes: number;
  dislikes: number;
}

export interface GameDetail extends GameSummary {
  instructions: string;
  image: string;
  categories: { slug: string; name: string; url: string }[];
  tags: string[];
  languages: Record<string, string>;
  updated: string | null;
}

export interface GameList {
  total: number;
  limit: number;
  offset: number;
  sort: string;
  games: GameSummary[];
  category?: { slug: string; url: string };
  language: string;
}

export interface Category {
  slug: string;
  name: string;
  games: number;
  url: string;
}

export class AunomayApiError extends Error {
  constructor(public status: number, public code: string) {
    super(`Aunomay Play API error ${status}: ${code}`);
  }
}

type Query = Record<string, string | number | boolean | undefined>;

async function get<T>(path: string, query: Query = {}, revalidate = 300): Promise<T> {
  const url = new URL(API_BASE + path);
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "" || value === false) continue;
    url.searchParams.set(key, value === true ? "1" : String(value));
  }
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "AunomayPlayMCP/1.0 (+https://play.aunomay.com)" },
    signal: AbortSignal.timeout(10_000),
    // Catalog data changes rarely; share the CDN/data cache across requests.
    ...(revalidate > 0 ? { next: { revalidate } } : { cache: "no-store" as const }),
  });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON error page */
  }
  if (!res.ok) {
    const code = (body as { error?: string } | null)?.error || "request_failed";
    throw new AunomayApiError(res.status, code);
  }
  return body as T;
}

export function searchGames(opts: {
  query?: string;
  category?: string;
  sort?: string;
  mobileOnly?: boolean;
  limit?: number;
  offset?: number;
  language?: Language;
}) {
  return get<GameList>("/games", {
    q: opts.query?.trim(),
    category: opts.category?.trim(),
    sort: opts.sort,
    mobile: opts.mobileOnly,
    limit: opts.limit,
    offset: opts.offset,
    lang: opts.language,
  });
}

export function getGame(slug: string, language?: Language) {
  return get<{ game: GameDetail; similar: GameSummary[]; language: string }>(
    `/games/${encodeURIComponent(slug.trim())}`,
    { lang: language },
  );
}

export function listCategories(language?: Language) {
  return get<{ categories: Category[]; language: string }>("/categories", { lang: language });
}

export function randomGame(opts: { category?: string; mobileOnly?: boolean; language?: Language }) {
  return get<{ game: GameSummary; language: string }>(
    "/random",
    { category: opts.category?.trim(), mobile: opts.mobileOnly, lang: opts.language },
    0,
  );
}

/** Adds UTM tags so traffic from AI assistants is visible in the site's analytics. */
export function withUtm(url: string, source = "mcp") {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", source);
    u.searchParams.set("utm_medium", "ai_assistant");
    u.searchParams.set("utm_campaign", "aunomay_mcp");
    return u.toString();
  } catch {
    return url;
  }
}
