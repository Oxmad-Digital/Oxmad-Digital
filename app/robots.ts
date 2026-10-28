import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Cloudflare prepends its managed AI-crawler rules to this file in production.
// The admin and client areas stay crawlable so that their noindex tag is seen.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
