import { ExternalLink } from "lucide-react";
import { FaFacebookF, FaInstagram } from "react-icons/fa6";
import Reveal from "./Reveal";
import { getSocialPosts, type SocialPost } from "@/lib/social/meta";

function formatPostDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

function excerpt(text: string | null, max = 140): string {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

// Meta's CDN serves media from many rotating, signed-URL hostnames
// (scontent-*.fbcdn.net, *.cdninstagram.com), so allowlisting them for
// next/image isn't practical — Meta already serves these pre-optimized, so a
// plain <img> is the right call here rather than double-processing them.
function PostCard({ post }: { post: SocialPost }) {
  const Icon = post.platform === "facebook" ? FaFacebookF : FaInstagram;

  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="tp-blog-card group flex h-full w-full flex-col overflow-hidden rounded-2xl transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="relative h-48 w-full overflow-hidden bg-black/30">
        {post.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <span
          className={`absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full text-white shadow-lg ${
            post.platform === "facebook" ? "bg-[#1877F2]" : "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]"
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="mb-3 flex-1 text-sm text-gray-300">{excerpt(post.message)}</p>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{formatPostDate(post.timestamp)}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-brand-blue group-hover:underline">
            Ver publicación <ExternalLink className="h-3 w-3" />
          </span>
        </div>
      </div>
    </a>
  );
}

export default async function RedesSociales() {
  const posts = await getSocialPosts();
  if (posts.length === 0) return null;

  return (
    <section id="redes-sociales" className="relative py-24">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <Reveal>
          <h2 className="tp-heading font-heading text-4xl md:text-5xl font-extrabold mb-4 tracking-tight drop-shadow-lg">
            Síguenos en redes
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="max-w-2xl mx-auto text-gray-300 text-lg font-light mb-14">
            Lo último que publicamos en Facebook e Instagram.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
          {posts.map((post, i) => (
            <Reveal key={post.id} delay={i * 0.08}>
              <PostCard post={post} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
