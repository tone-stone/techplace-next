"use client";

/**
 * Drag-and-drop / click-to-browse picker for an article's extra photo
 * gallery, used inside `ArticleForm`. Enforces the gallery size limits from
 * `media-limits.ts`, previews newly picked files via object URLs, and lets
 * the user remove either a newly added file or a previously saved gallery
 * image.
 */

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { formatBytes, MAX_GALLERY_IMAGES, MAX_IMAGE_BYTES } from "@/lib/blog/media-limits";
import FitImage from "../FitImage";

type GalleryDropzoneProps = {
  files: File[];
  existingUrls: string[];
  onFilesChange: (files: File[]) => void;
  onRemoveExisting: (url: string) => void;
};

/**
 * Renders the dropzone plus a thumbnail grid combining already-saved
 * gallery images (`existingUrls`) and newly picked files (`files`), each
 * removable independently.
 *
 * @param onRemoveExisting - Called when a previously saved gallery image is
 * removed; new files are removed locally via `onFilesChange` instead.
 */
export default function GalleryDropzone({
  files,
  existingUrls,
  onFilesChange,
  onRemoveExisting,
}: GalleryDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    // Object URLs need paired create/revoke lifecycle management, which only
    // an effect's cleanup function provides — this isn't a redundant
    // prop-to-state sync (useMemo can't revoke the *previous* URLs when it
    // recomputes), so setState here is the correct pattern despite the rule.
    const urls = files.map((file) => URL.createObjectURL(file));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const totalCount = files.length + existingUrls.length;

  const addFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setError(null);

    const incoming = Array.from(list);
    const remainingSlots = MAX_GALLERY_IMAGES - totalCount;

    if (remainingSlots <= 0) {
      setError(`Ya tienes el máximo de ${MAX_GALLERY_IMAGES} fotos.`);
      return;
    }

    const accepted: File[] = [];
    for (const file of incoming) {
      if (accepted.length >= remainingSlots) {
        setError(`Solo puedes agregar hasta ${MAX_GALLERY_IMAGES} fotos en total.`);
        break;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setError(`"${file.name}" pesa ${formatBytes(file.size)} — el máximo es ${formatBytes(MAX_IMAGE_BYTES)}.`);
        continue;
      }
      accepted.push(file);
    }

    if (accepted.length > 0) onFilesChange([...files, ...accepted]);
  };

  const removeNewFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">
        Galería de fotos ({totalCount}/{MAX_GALLERY_IMAGES})
      </label>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-4 text-center transition-colors ${
          dragOver ? "border-indigo-400 bg-indigo-500/10" : "border-white/15 hover:border-indigo-400/40"
        }`}
      >
        <ImagePlus className="mx-auto h-6 w-6 text-indigo-300 mb-1.5" strokeWidth={1.5} />
        <p className="text-xs text-gray-400">
          Arrastra o haz clic para agregar fotos · máx. {formatBytes(MAX_IMAGE_BYTES)} c/u
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {(existingUrls.length > 0 || previews.length > 0) && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {existingUrls.map((url) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-white/10">
              <FitImage src={url} sizes="120px" />
              <button
                type="button"
                onClick={() => onRemoveExisting(url)}
                aria-label="Quitar foto"
                className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {previews.map((url, i) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-indigo-400/30">
              <FitImage src={url} sizes="120px" />
              <button
                type="button"
                onClick={() => removeNewFile(i)}
                aria-label="Quitar foto"
                className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
