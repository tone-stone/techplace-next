import Aurora from "@/components/landing/Aurora";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import Reveal from "@/components/landing/Reveal";
import BlogPostCard from "@/components/blog/BlogPostCard";
import BlogListClient from "@/components/blog/BlogListClient";
import { getPublishedArticles } from "@/lib/blog/articles";

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

          <Reveal delay={0.15}>
            <BlogListClient items={items} categories={categories} />
          </Reveal>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
