"use server";

/**
 * Server actions and data-access functions for blog articles: public reads
 * (published articles only, via the public Supabase client) for the blog
 * pages, and staff-gated reads/writes (via the authenticated Supabase
 * client) for the dashboard, including cover/video/gallery uploads to
 * Cloudinary. Staff access is gated by `requireStaff()`, which in turn
 * checks `canAccessBlog()` — so this covers blog admins/redactors and the
 * CRM general admin, not just "any authenticated staff".
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import cloudinary from "@/lib/cloudinary";
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, formatBytes } from "@/lib/blog/media-limits";
import { canAccessBlog, canDeleteArticles, type ProfileRole } from "@/lib/auth/roles";

export type ManagedArticle = {
  id: string;
  slug: string;
  title: string;
  authorName: string;
  category: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  videoUrl: string | null;
  galleryUrls: string[];
  status: "draft" | "published";
  date: string;
};

export type ArticleActionState = { error: string } | { success: true } | null;

// Builds a URL-safe slug from an article title, with a random suffix to
// avoid collisions between similarly titled articles.
function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base || "articulo"}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Auth/authorization gate for every dashboard-only action below: requires a
 * signed-in user whose profile passes `canAccessBlog()` (blog admin, blog
 * redactor, or the CRM general admin — not just "any authenticated staff").
 *
 * @returns The failure reason on rejection, or the user's id and profile on
 * success.
 */
async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const, error: "No autenticado" };

  const { data: profile } = await supabase.from("profiles").select("team, role").eq("id", user.id).single();
  if (!profile || !canAccessBlog(profile as ProfileRole)) {
    return { ok: false as const, error: "No tienes un perfil de equipo asociado" };
  }

  return { ok: true as const, userId: user.id, profile: profile as ProfileRole };
}

// Converts a raw `articles` table row (snake_case) into the camelCase
// `ManagedArticle` shape used throughout the app.
function mapRow(row: {
  id: string;
  slug: string;
  title: string;
  author_name: string;
  category: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  video_url: string | null;
  gallery_urls: string[] | null;
  status: "draft" | "published";
  created_at: string;
}): ManagedArticle {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    authorName: row.author_name,
    category: row.category,
    excerpt: row.excerpt,
    content: row.content,
    coverImageUrl: row.cover_image_url,
    videoUrl: row.video_url,
    galleryUrls: row.gallery_urls ?? [],
    status: row.status,
    date: row.created_at.slice(0, 10),
  };
}

/**
 * Estimates reading time for an article's HTML content from its word count
 * (~200 words/minute), rounded up to at least 1 minute.
 */
export async function estimateReadTime(html: string): Promise<string> {
  const words = html
    .replace(/<[^>]*>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min`;
}

/**
 * Fetches every published article via the public Supabase client, newest
 * first — used by the public blog pages, which don't need staff access.
 */
export async function getPublishedArticles(): Promise<ManagedArticle[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  return (data ?? []).map(mapRow);
}

/**
 * Fetches every published article except the one at `excludeSlug`, for the
 * "related articles" carousel on a post page.
 */
export async function getOtherArticles(excludeSlug: string): Promise<ManagedArticle[]> {
  const articles = await getPublishedArticles();
  return articles.filter((a) => a.slug !== excludeSlug);
}

/**
 * Fetches a single published article by slug, or `null` if it doesn't
 * exist or isn't published.
 */
export async function getPublishedArticleBySlug(slug: string): Promise<ManagedArticle | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .eq("slug", slug)
    .single();

  return data ? mapRow(data) : null;
}

/**
 * Fetches every article (draft and published) for the dashboard's article
 * list. Staff-gated via `requireStaff()`.
 */
export async function listArticles(): Promise<{ articles: ManagedArticle[] } | { error: string }> {
  const check = await requireStaff();
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { data, error } = await supabase.from("articles").select("*").order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { articles: (data ?? []).map(mapRow) };
}

/**
 * Uploads a file to Cloudinary under `techplace-blog/{folder}`, rejecting
 * it up front if it exceeds `maxBytes`. Images are normalized to WebP;
 * videos are uploaded as-is.
 *
 * @returns The uploaded asset's secure (HTTPS) URL.
 */
async function uploadMedia(file: File, folder: "covers" | "videos" | "gallery", maxBytes: number): Promise<string> {
  if (file.size > maxBytes) {
    throw new Error(`"${file.name}" pesa ${formatBytes(file.size)} — el máximo es ${formatBytes(maxBytes)}.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const resourceType = folder === "videos" ? "video" : "image";

  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `techplace-blog/${folder}`,
        resource_type: resourceType,
        // Normalize every uploaded photo to WebP for smaller, consistent file sizes.
        ...(resourceType === "image" ? { format: "webp" } : {}),
      },
      (error, result) => {
        if (error || !result) {
          reject(new Error(error?.message ?? "Error subiendo el archivo a Cloudinary"));
          return;
        }
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
}

// Extracts the non-empty File entries submitted under the `galleryImages` field.
function galleryFilesFrom(formData: FormData): File[] {
  return formData
    .getAll("galleryImages")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

/**
 * Server action backing "Publicar artículo": validates required fields,
 * uploads any cover/video/gallery media, and inserts a new published
 * article row. Staff-gated via `requireStaff()`.
 */
export async function createArticleAction(
  _prevState: ArticleActionState,
  formData: FormData
): Promise<ArticleActionState> {
  const check = await requireStaff();
  if (!check.ok) return { error: check.error };

  const title = String(formData.get("title") ?? "").trim();
  const authorName = String(formData.get("authorName") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const content = String(formData.get("content") ?? "");
  const coverImage = formData.get("coverImage") as File | null;
  const video = formData.get("video") as File | null;
  const galleryFiles = galleryFilesFrom(formData);

  if (!title || !authorName || !excerpt || !content) {
    return { error: "Completa título, autor, extracto y contenido" };
  }

  let coverImageUrl: string | null = null;
  let videoUrl: string | null = null;
  const galleryUrls: string[] = [];
  try {
    if (coverImage && coverImage.size > 0) coverImageUrl = await uploadMedia(coverImage, "covers", MAX_IMAGE_BYTES);
    if (video && video.size > 0) videoUrl = await uploadMedia(video, "videos", MAX_VIDEO_BYTES);
    for (const file of galleryFiles) {
      galleryUrls.push(await uploadMedia(file, "gallery", MAX_IMAGE_BYTES));
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error subiendo el archivo" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("articles").insert({
    slug: slugify(title),
    title,
    author_name: authorName,
    category,
    excerpt,
    content,
    cover_image_url: coverImageUrl,
    video_url: videoUrl,
    gallery_urls: galleryUrls,
    status: "published",
    author_id: check.userId,
  });

  if (error) return { error: error.message };

  revalidatePath("/blog");
  return { success: true };
}

/**
 * Server action backing "Guardar cambios": validates required fields,
 * uploads any newly picked media (keeping previously saved gallery URLs the
 * user didn't remove), and updates the article row. Staff-gated via
 * `requireStaff()`.
 */
export async function updateArticleAction(
  _prevState: ArticleActionState,
  formData: FormData
): Promise<ArticleActionState> {
  const check = await requireStaff();
  if (!check.ok) return { error: check.error };

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const authorName = String(formData.get("authorName") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const content = String(formData.get("content") ?? "");
  const coverImage = formData.get("coverImage") as File | null;
  const video = formData.get("video") as File | null;
  const galleryFiles = galleryFilesFrom(formData);
  const keepGalleryUrls = formData.getAll("keepGalleryUrls").map(String);

  if (!id || !title || !authorName || !excerpt || !content) {
    return { error: "Completa título, autor, extracto y contenido" };
  }

  const update: Record<string, unknown> = {
    title,
    author_name: authorName,
    category,
    excerpt,
    content,
  };

  try {
    if (coverImage && coverImage.size > 0) {
      update.cover_image_url = await uploadMedia(coverImage, "covers", MAX_IMAGE_BYTES);
    }
    if (video && video.size > 0) {
      update.video_url = await uploadMedia(video, "videos", MAX_VIDEO_BYTES);
    }
    const newGalleryUrls: string[] = [];
    for (const file of galleryFiles) {
      newGalleryUrls.push(await uploadMedia(file, "gallery", MAX_IMAGE_BYTES));
    }
    update.gallery_urls = [...keepGalleryUrls, ...newGalleryUrls];
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error subiendo el archivo" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("articles").update(update).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/blog");
  revalidatePath(`/blog/${id}`);
  return { success: true };
}

/**
 * Server action backing article deletion. Staff-gated via `requireStaff()`
 * and further restricted to admins via `canDeleteArticles()` — a redactor
 * passes the staff check but is rejected here.
 */
export async function deleteArticleAction(id: string): Promise<ArticleActionState> {
  const check = await requireStaff();
  if (!check.ok) return { error: check.error };
  if (!canDeleteArticles(check.profile)) return { error: "Solo un administrador puede eliminar artículos" };

  const supabase = await createClient();
  const { error } = await supabase.from("articles").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/blog");
  return { success: true };
}
