"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { formatBytes, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from "@/lib/blog/media-limits";

type MediaDropzoneProps = {
  label: string;
  accept: string;
  kind: "image" | "video";
  file: File | null;
  existingUrl?: string | null;
  onChange: (file: File | null) => void;
};

export default function MediaDropzone({
  label,
  accept,
  kind,
  file,
  existingUrl = null,
  onChange,
}: MediaDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const maxBytes = kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;

  const blobUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  const previewUrl = blobUrl ?? existingUrl;

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const handleFiles = (files: FileList | null) => {
    const picked = files?.[0];
    if (!picked) return;

    if (picked.size > maxBytes) {
      setError(`Pesa ${formatBytes(picked.size)} — el máximo permitido es ${formatBytes(maxBytes)}.`);
      return;
    }

    setError(null);
    onChange(picked);
  };

  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">
        {label} <span className="text-gray-500">(máx. {formatBytes(maxBytes)})</span>
      </label>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
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
          handleFiles(e.dataTransfer.files);
        }}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-5 text-center transition-colors ${
          dragOver ? "border-indigo-400 bg-indigo-500/10" : "border-white/15 hover:border-indigo-400/40"
        }`}
      >
        {previewUrl ? (
          kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="mx-auto max-h-32 rounded-lg object-contain" />
          ) : (
            <video src={previewUrl} className="mx-auto max-h-32 rounded-lg" controls />
          )
        ) : (
          <>
            <UploadCloud className="mx-auto h-7 w-7 text-indigo-300 mb-2" strokeWidth={1.5} />
            <p className="text-xs text-gray-400">
              Arrastra o haz clic para subir {kind === "image" ? "una foto" : "un video"}
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      {file ? (
        <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
          <span className="truncate">
            {file.name} · {formatBytes(file.size)}
          </span>
          <button
            type="button"
            onClick={() => {
              setError(null);
              onChange(null);
            }}
            className="flex shrink-0 items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
          >
            <X className="h-3 w-3" /> Quitar
          </button>
        </div>
      ) : (
        existingUrl && (
          <p className="mt-2 text-xs text-gray-500">Actual — haz clic para reemplazar</p>
        )
      )}
    </div>
  );
}
