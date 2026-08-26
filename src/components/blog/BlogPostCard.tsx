import Link from "next/link";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { CATEGORY_ICONS, formatPostDate } from "@/lib/blog-posts";
import { estimateReadTime, type ManagedArticle } from "@/lib/blog/articles";
import FitImage from "./FitImage";

export default async function BlogPostCard({ post }: { post: ManagedArticle }) {
  const Icon = CATEGORY_ICONS[post.category];
  const readTime = await estimateReadTime(post.content);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="tp-blog-card group flex h-full w-full flex-col overflow-hidden rounded-2xl transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="relative flex h-40 items-center justify-center overflow-hidden bg-linear-to-br from-indigo-950/70 via-slate-900/60 to-black/50">
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(79,70,229,0.22)_0,transparent_60%)]" />
        {post.coverImageUrl ? (
          <FitImage
            src={post.coverImageUrl}
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 100vw"
          />
        ) : (
          Icon && (
            <Icon
              className="h-14 w-14 text-indigo-300 drop-shadow-[0_0_10px_rgba(99,102,241,0.45)] transition-transform duration-300 group-hover:scale-110"
              strokeWidth={1.5}
            />
          )
        )}
        <span className="absolute top-3 left-3 rounded-full border border-indigo-400/30 bg-black/40 px-3 py-1 text-xs font-medium text-indigo-300 backdrop-blur-sm">
          {post.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="mb-2 text-lg font-bold text-white group-hover:text-indigo-300 transition-colors duration-300">
          {post.title}
        </h3>
        <p className="mb-4 flex-1 text-sm text-gray-300 text-justify">{post.excerpt}</p>

        <div className="mb-3 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> {formatPostDate(post.date)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {readTime}
          </span>
        </div>

        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-blue group-hover:underline">
          Leer más <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
