/**
 * Fills its (relative, overflow-hidden) parent box with a blurred, scaled-up
 * copy of the image as a backdrop, then the full image on top scaled to fit —
 * so nothing gets cropped but the box never looks empty around it.
 */
export default function FitImage({ src, alt = "" }: { src: string; alt?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="relative h-full w-full object-contain" />
    </>
  );
}
