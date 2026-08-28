/**
 * Public blog index at `/blog` — lists every published article as cards,
 * with client-side category filtering handled by `BlogListClient`. Also
 * defines this route's SEO metadata (OpenGraph/Twitter cards) and revalidates
 * on a timer instead of rendering fully dynamically.
 */
import type { Metadata } from "next";
import Aurora from "@/components/landing/Aurora";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import Reveal from "@/components/landing/Reveal";
import BlogPostCard from "@/components/blog/BlogPostCard";
import BlogListClient from "@/components/blog/BlogListClient";
import { getPublishedArticles } from "@/lib/blog/articles";

// Articles rarely change more than a few times a day; revalidating on a
// timer instead of on every request avoids a live Supabase round-trip per
// visit (this route was fully dynamic — ƒ in the build output).
export const revalidate = 60;

const TITLE = "Blog | TechPlace";
const DESCRIPTION =
  "Noticias, tendencias y guías sobre desarrollo de software, ciberseguridad e inteligencia artificial, escritas por el equipo de TechPlace en Tijuana.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/blog",
    type: "website",
    images: ["/img/logos/techplace-brand.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/img/logos/techplace-brand.webp"],
  },
};

/**
 * Fetches all published articles and hands them, pre-rendered as
 * `BlogPostCard` nodes, to `BlogListClient` for interactive filtering.
 */
export default async function BlogPage() {
  const articles = await getPublishedArticles();
  const categories = Array.from(new Set(articles.map((post) => post.category)));

  const items = articles.map((post) => ({
    category: post.category,
    node: <BlogPostCard key={post.slug} post={post} />,
  }));

  return (
    <div className="text-white font-sans">
      <Aurora />
      <Navbar />

      <main className="relative pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Reveal>
            <h1 className="tp-heading font-heading text-4xl md:text-5xl font-extrabold mb-4 tracking-tight drop-shadow-lg">
              Blog TechPlace
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-2xl mx-auto text-gray-300 text-lg font-light mb-10">
              Noticias, tendencias y guías sobre desarrollo, ciberseguridad e inteligencia artificial.
            </p>
          </Reveal>

          <BlogListClient items={items} categories={categories} />
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
