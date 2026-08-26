"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import FitImage from "./FitImage";

export default function PostGallery({ urls }: { urls: string[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (openIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowRight") setOpenIndex((i) => (i === null ? i : (i + 1) % urls.length));
      if (e.key === "ArrowLeft") setOpenIndex((i) => (i === null ? i : (i - 1 + urls.length) % urls.length));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openIndex, urls.length]);

  return (
    <>
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {urls.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setOpenIndex(i)}
            aria-label="Ver foto en grande"
            className="group relative aspect-square w-full cursor-pointer overflow-hidden rounded-2xl border border-white/10 transition-transform duration-300 hover:-translate-y-1"
          >
            <FitImage src={url} />
            <span className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/15" />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/90 p-4 backdrop-blur-md tp-animate-fadein"
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 z-10 cursor-pointer rounded-full bg-black/40 p-2.5 text-gray-300 transition-colors hover:bg-black/60 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>

          {urls.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIndex((i) => (i === null ? i : (i - 1 + urls.length) % urls.length));
                }}
                aria-label="Foto anterior"
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-black/40 p-2.5 text-gray-300 transition-colors hover:bg-black/60 hover:text-white sm:left-4"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIndex((i) => (i === null ? i : (i + 1) % urls.length));
                }}
                aria-label="Foto siguiente"
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-black/40 p-2.5 text-gray-300 transition-colors hover:bg-black/60 hover:text-white sm:right-4"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={urls[openIndex]}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-[0_0_60px_rgba(0,0,0,0.6)]"
          />
        </div>
      )}
    </>
  );
}
