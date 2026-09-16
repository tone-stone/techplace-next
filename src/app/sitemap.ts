import type { MetadataRoute } from "next";
import { getPublishedArticles } from "@/lib/blog/articles";
import { LEGAL_DOCS } from "@/lib/legal-docs";
import { SERVICES } from "@/lib/services/catalog";

const BASE_URL = "https://techplacetj.com";

/**
 * Next.js file convention that generates `/sitemap.xml`. Combines the
 * static marketing/legal routes with one entry per published blog article
 * (fetched at build/request time) so new posts are picked up automatically.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getPublishedArticles();

  // Newest published article, so `/blog` reports a real last-modified date
  // instead of none (articles come back newest-first).
  const blogLastModified = articles[0] ? new Date(articles[0].date) : new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/blog`, lastModified: blogLastModified, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/servicios`, changeFrequency: "monthly", priority: 0.7 },
    ...SERVICES.map((service) => ({
      url: `${BASE_URL}/servicios/${service.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { url: `${BASE_URL}/legal`, changeFrequency: "yearly", priority: 0.3 },
    ...LEGAL_DOCS.map((doc) => ({
      url: `${BASE_URL}/legal/${doc.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];

  const articleRoutes: MetadataRoute.Sitemap = articles.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...articleRoutes];
}
