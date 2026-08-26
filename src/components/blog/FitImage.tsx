import Image from "next/image";

/**
 * Fills its (relative, overflow-hidden) parent box with a blurred, scaled-up
 * copy of the image as a backdrop, then the full image on top scaled to fit —
 * so nothing gets cropped but the box never looks empty around it.
 *
 * Goes through next/image so Vercel resizes/re-encodes these instead of
 * shipping full-resolution originals (some covers were 1MB+ at thumbnail size).
 * Local blob:/data: previews (unsaved file picks) skip the optimizer since
 * next/image can't fetch those through Vercel's image endpoint.
 *
 * The blurred backdrop is desktop-only: it's a second full network fetch +
 * decode of the same image just for letterbox filler, and a blog grid can
 * render a dozen of these at once. `hidden` means it never gets a layout
 * box, so the lazy-loaded <img> never intersects and never fetches on
 * mobile — real bandwidth/CPU savings on the devices that need it most,
 * not just a display toggle.
 */
export default function FitImage({
  src,
  alt = "",
  sizes = "(min-width: 1024px) 400px, 100vw",
}: {
  src: string;
  alt?: string;
  sizes?: string;
}) {
  const isLocalPreview = src.startsWith("blob:") || src.startsWith("data:");

  return (
    <>
      <div className="hidden md:block">
        <Image
          src={src}
          alt=""
          aria-hidden
          fill
          unoptimized={isLocalPreview}
          sizes={sizes}
          className="scale-110 object-cover blur-2xl"
        />
      </div>
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized={isLocalPreview}
        sizes={sizes}
        className="object-contain"
      />
    </>
  );
}
