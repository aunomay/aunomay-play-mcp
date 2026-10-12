import type { MetadataRoute } from "next";
import { baseUrl } from "@/lib/base-url";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: "/mcp" }], sitemap: `${baseUrl()}/sitemap.xml` };
}
