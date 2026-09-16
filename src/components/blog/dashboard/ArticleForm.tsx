"use client";

/**
 * Create/edit form for a single blog article — title, author, category,
 * excerpt, rich-text content, cover image, video, and photo gallery — used
 * by both the admin and redactor dashboards (styled per `role`). Submits to
 * the `createArticleAction`/`updateArticleAction` server actions.
 */

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { PenSquare, Send, X } from "lucide-react";
import { CATEGORIES } from "@/lib/blog-posts";
import { createArticleAction, updateArticleAction, type ManagedArticle } from "@/lib/blog/articles";
import GalleryDropzone from "./GalleryDropzone";
import MediaDropzone from "./MediaDropzone";
import RichTextEditor from "./RichTextEditor";
import type { DashboardRole } from "./types";

// Whether stripped-of-tags HTML content has no visible text — used to block
// submitting an empty article body.
function isHtmlEmpty(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").trim() === "";
}

const inputClassesIndigo =
  "tp-glass-input w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:border-indigo-400 focus:ring focus:ring-indigo-400/30 outline-none transition";
const inputClassesPurple =
  "tp-glass-input w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:border-purple-400 focus:ring focus:ring-purple-400/30 outline-none transition";

type ArticleFormProps = {
  editingArticle: ManagedArticle | null;
  defaultAuthor: string;
  role: DashboardRole;
  onSaved: (title: string, mode: "creó" | "editó") => void;
  onCancelEdit: () => void;
};

/**
 * Renders the article form, seeded from `editingArticle` when editing (the
 * parent remounts this component via `key` on the target's id, so this
 * component's own state only ever needs to track ONE editing target for its
 * lifetime). Calls `onSaved` after a successful create/update.
 *
 * @param role - Styles the form (indigo for redactor, purple for admin);
 * has no effect on what the form can submit.
 */
export default function ArticleForm({
  editingArticle,
  defaultAuthor,
  role,
  onSaved,
  onCancelEdit,
}: ArticleFormProps) {
  const isAdmin = role === "admin";
  const cardClass = isAdmin ? "tp-dark-card-admin" : "tp-dark-card";
  const iconClass = isAdmin ? "text-purple-300" : "text-indigo-300";
  const inputClasses = isAdmin ? inputClassesPurple : inputClassesIndigo;
  const formRef = useRef<HTMLFormElement>(null);
  // Initial values only — the parent keys this component on
  // `editingArticle?.id`, so switching edit targets (or entering/leaving
  // "new article" mode) remounts it with fresh initial state instead of
  // needing an effect to re-sync fields on every prop change. That also
  // means a background refetch that hands down a new `editingArticle`
  // object for the *same* id no longer clobbers in-progress unsaved edits.
  const [title, setTitle] = useState(editingArticle?.title ?? "");
  const [author, setAuthor] = useState(editingArticle?.authorName ?? defaultAuthor);
  const [category, setCategory] = useState(editingArticle?.category ?? CATEGORIES[0]);
  const [excerpt, setExcerpt] = useState(editingArticle?.excerpt ?? "");
  const [content, setContent] = useState(editingArticle?.content ?? "");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [keepGalleryUrls, setKeepGalleryUrls] = useState<string[]>(editingArticle?.galleryUrls ?? []);
  const [confirmation, setConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const confirmationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmationTimeout.current) clearTimeout(confirmationTimeout.current);
    };
  }, []);

  useEffect(() => {
    // Mount-only: this instance is dedicated to one editing target for its
    // whole lifetime (remounts via `key` when that target changes), so
    // there's no case where it should scroll again after the initial mount.
    if (editingArticle) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !excerpt.trim() || isHtmlEmpty(content)) return;
    setError(null);

    const formData = new FormData();
    formData.set("title", title);
    formData.set("authorName", author);
    formData.set("category", category);
    formData.set("excerpt", excerpt);
    formData.set("content", content);
    if (coverImage) formData.set("coverImage", coverImage);
    if (video) formData.set("video", video);
    galleryFiles.forEach((file) => formData.append("galleryImages", file));
    keepGalleryUrls.forEach((url) => formData.append("keepGalleryUrls", url));
    if (editingArticle) formData.set("id", editingArticle.id);

    startTransition(async () => {
      const result = editingArticle
        ? await updateArticleAction(null, formData)
        : await createArticleAction(null, formData);

      if (result && "error" in result) {
        setError(result.error);
        return;
      }

      onSaved(title, editingArticle ? "editó" : "creó");

      if (!editingArticle) {
        setTitle("");
        setAuthor(defaultAuthor);
        setExcerpt("");
        setContent("");
        setCoverImage(null);
        setVideo(null);
        setGalleryFiles([]);
        setKeepGalleryUrls([]);
      }
      setConfirmation(true);
      if (confirmationTimeout.current) clearTimeout(confirmationTimeout.current);
      confirmationTimeout.current = setTimeout(() => setConfirmation(false), 3000);
    });
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={`${cardClass} rounded-3xl p-6 sm:p-8 space-y-5 scroll-mt-24`}
    >
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          <PenSquare className={`h-5 w-5 ${iconClass}`} />
          {editingArticle ? "Editar artículo" : "Nuevo artículo"}
        </h2>
        {editingArticle && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Cancelar
          </button>
        )}
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Título</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Título del artículo"
          className={inputClasses}
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Nombre del redactor</label>
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
          placeholder="Quién firma el artículo"
          className={inputClasses}
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Categoría</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClasses}>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat} className="bg-[#0d0c16]">
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Extracto</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          required
          rows={2}
          placeholder="Resumen breve para la tarjeta del blog"
          className={`${inputClasses} resize-none`}
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Contenido</label>
        <RichTextEditor value={content} onChange={setContent} placeholder="Escribe el artículo completo…" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <MediaDropzone
          label="Foto de portada"
          accept="image/*"
          kind="image"
          file={coverImage}
          existingUrl={editingArticle?.coverImageUrl ?? null}
          onChange={setCoverImage}
        />
        <MediaDropzone
          label="Video"
          accept="video/*"
          kind="video"
          file={video}
          existingUrl={editingArticle?.videoUrl ?? null}
          onChange={setVideo}
        />
      </div>

      <GalleryDropzone
        files={galleryFiles}
        existingUrls={keepGalleryUrls}
        onFilesChange={setGalleryFiles}
        onRemoveExisting={(url) => setKeepGalleryUrls((prev) => prev.filter((u) => u !== url))}
      />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="tp-btn-animated inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 font-bold text-white shadow-lg transition-transform hover:scale-105 disabled:opacity-60"
        >
          <Send className="h-4 w-4" />{" "}
          {pending ? "Guardando…" : editingArticle ? "Guardar cambios" : "Publicar artículo"}
        </button>
        {confirmation && (
          <p className="text-sm text-green-400">
            {editingArticle ? "¡Cambios guardados!" : "¡Publicado! Ya está en el blog real."}
          </p>
        )}
      </div>
    </form>
  );
}
