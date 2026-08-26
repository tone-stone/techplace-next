import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import Aurora from "@/components/landing/Aurora";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import BlogPostCard from "@/components/blog/BlogPostCard";
import FitImage from "@/components/blog/FitImage";
import PostGallery from "@/components/blog/PostGallery";
import RelatedArticlesCarousel from "@/components/blog/RelatedArticlesCarousel";
import { CATEGORY_ICONS, formatPostDate } from "@/lib/blog-posts";
import { estimateReadTime, getOtherArticles, getPublishedArticleBySlug } from "@/lib/blog/articles";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedArticleBySlug(slug);
  if (!post) return {};

  const url = `/blog/${post.slug}`;
  const image = post.coverImageUrl ?? "/img/logos/techplace-brand.webp";
  const title = `${post.title} | Blog TechPlace`;

  return {
    title,
    description: post.excerpt,
    keywords: [post.category, "TechPlace", "Blog", "Tijuana"],
    authors: [{ name: post.authorName }],
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      type: "article",
      publishedTime: post.date,
      authors: [post.authorName],
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [image],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedArticleBySlug(slug);
  if (!post) notFound();

  const Icon = CATEGORY_ICONS[post.category];
  const [otherArticles, readTime] = await Promise.all([
    getOtherArticles(post.slug),
    estimateReadTime(post.content),
  ]);

  const relatedItems = otherArticles.map((a) => ({
    slug: a.slug,
    category: a.category,
    authorName: a.authorName,
    node: <BlogPostCard key={a.slug} post={a} />,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImageUrl ?? "https://techplacetj.com/img/logos/techplace-brand.webp",
    datePublished: post.date,
    author: { "@type": "Person", name: post.authorName },
    publisher: {
      "@type": "Organization",
      name: "TechPlace",
      logo: {
        "@type": "ImageObject",
        url: "https://techplacetj.com/img/logos/techplace-icon.webp",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://techplacetj.com/blog/${post.slug}`,
    },
  };

  return (
    <div className="text-white font-sans">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Aurora />
      <Navbar />

      <main className="relative pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm text-gray-300 hover:text-brand-blue transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Volver al blog
            </Link>

            <span className="inline-block rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
              {post.category}
            </span>
          </div>

          <h1 className="font-heading text-3xl md:text-5xl font-extrabold tracking-tight mb-6">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-5 text-sm text-gray-400 mb-10">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4 text-indigo-400" /> {post.authorName}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-indigo-400" /> {formatPostDate(post.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-indigo-400" /> {readTime} de lectura
            </span>
          </div>

          <div className="relative mb-10 flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-indigo-950/70 via-slate-900/60 to-black/50">
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(79,70,229,0.22)_0,transparent_60%)]" />
            {post.coverImageUrl ? (
              <FitImage src={post.coverImageUrl} />
            ) : (
              Icon && (
                <Icon
                  className="h-20 w-20 text-indigo-300 drop-shadow-[0_0_14px_rgba(99,102,241,0.45)]"
                  strokeWidth={1.5}
                />
              )
            )}
          </div>

          <div
            className="tp-dark-card rounded-3xl p-6 sm:p-10 space-y-5 text-gray-300 leading-relaxed [&_p]:text-justify [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-white"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.galleryUrls.length > 0 && <PostGallery urls={post.galleryUrls} />}

          <div className="mt-12 flex flex-col items-center text-center tp-dark-card rounded-3xl p-8">
            <p className="text-white text-lg font-light mb-4">
              ¿Tienes un proyecto en mente? Hablemos de cómo hacerlo realidad.
            </p>
            <Link
              href="/#contacto"
              className="tp-btn-animated inline-block text-white px-8 py-3 rounded-full text-lg font-bold shadow-lg hover:scale-105 transition-transform duration-200"
            >
              Solicita tu consultoría gratis
            </Link>
          </div>

          {relatedItems.length > 0 && (
            <RelatedArticlesCarousel
              items={relatedItems}
              currentCategory={post.category}
              currentAuthor={post.authorName}
            />
          )}
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
