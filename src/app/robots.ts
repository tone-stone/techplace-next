import type { MetadataRoute } from "next";

/**
 * Next.js file convention that generates `/robots.txt`. Allows crawling of
 * the whole site except the authenticated dashboard and login, and points
 * crawlers to the generated sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/login", "/blog/dashboard", "/blog/login"],
    },
    sitemap: "https://techplacetj.com/sitemap.xml",
  };
}
