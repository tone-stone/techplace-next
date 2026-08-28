import Reveal from "./Reveal";
import RedesCarousel from "./RedesCarousel";
import { getFacebookPosts } from "@/lib/social/meta";

/**
 * Server component for the "Síguenos en redes" landing section
 * (`#redes-sociales`): fetches the latest Facebook posts at render time and
 * displays them in a carousel. Renders nothing if no posts are available.
 */
export default async function RedesSociales() {
  const posts = await getFacebookPosts(9);
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
          <p className="max-w-2xl mx-auto text-gray-300 text-lg font-light mb-14 text-justify">
            Lo último que publicamos en nuestra página de Facebook.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <RedesCarousel posts={posts} />
        </Reveal>
      </div>
    </section>
  );
}
