import type { MetadataRoute } from "next";

/**
 * Next.js file convention that generates `/robots.txt`. Allows crawling of
 * the whole site except the blog's authenticated/admin routes, and points
 * crawlers to the generated sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/blog/dashboard", "/blog/login", "/admin", "/login"],
    },
    sitemap: "https://techplacetj.com/sitemap.xml",
  };
}
