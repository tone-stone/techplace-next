"use client";

/**
 * Client-side wrapper around the blog index's article grid. Renders the
 * category filter pills and keeps the currently selected category in state,
 * filtering the pre-rendered article cards it receives from the server
 * without re-fetching anything.
 */

import { useMemo, useState, type ReactNode } from "react";
import Reveal from "@/components/landing/Reveal";

type BlogListItem = {
  category: string;
  node: ReactNode;
};

/**
 * Renders the category filter bar and the (possibly filtered) grid of blog
 * post cards, each wrapped in a `Reveal` for a staggered scroll-in
 * animation.
 *
 * @param items - Pre-rendered article cards paired with their category, so
 * filtering never needs to touch the server.
 */
export default function BlogListClient({
  items,
  categories,
}: {
  items: BlogListItem[];
  categories: string[];
}) {
  const [categoria, setCategoria] = useState<string | null>(null);

  const filtered = useMemo(
    () => (categoria ? items.filter((item) => item.category === categoria) : items),
    [items, categoria]
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-2 mb-14">
        <button
          type="button"
          onClick={() => setCategoria(null)}
          className={`rounded-full border px-4 py-2.5 text-sm font-medium transition-colors duration-200 ${
            categoria === null
              ? "border-purple-400 bg-purple-500/20 text-white"
              : "border-white/10 bg-white/5 text-gray-300 hover:border-purple-400/40 hover:text-white"
          }`}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoria(cat)}
            className={`rounded-full border px-4 py-2.5 text-sm font-medium transition-colors duration-200 ${
              categoria === cat
                ? "border-purple-400 bg-purple-500/20 text-white"
                : "border-white/10 bg-white/5 text-gray-300 hover:border-purple-400/40 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
        {filtered.map((item, i) => (
          <Reveal key={i} delay={i * 0.08}>
            {item.node}
          </Reveal>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-400 mt-10">No hay artículos en esta categoría todavía.</p>
      )}
    </>
  );
}
