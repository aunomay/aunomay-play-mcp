import type { MetadataRoute } from "next";
import { baseUrl } from "@/lib/base-url";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${baseUrl()}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl()}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
