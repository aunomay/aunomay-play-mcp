/** Canonical public origin of the production deployment. */
export const PRODUCTION_URL = "https://mcp.play.aunomay.com";

/** Public origin of this deployment (env override, production custom domain, preview URL, or local dev). */
export function baseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/+$/, "");
  if (process.env.VERCEL_ENV === "production") return PRODUCTION_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
