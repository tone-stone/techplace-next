import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/blog/dashboard", "/blog/login", "/admin", "/login"],
    },
    sitemap: "https://techplacetj.com/sitemap.xml",
  };
}
