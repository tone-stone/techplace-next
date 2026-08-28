/**
 * Server-side client for the Meta (Facebook) Graph API, powering the
 * "Síguenos en redes" section with recent Facebook Page posts and Instagram
 * Business media, normalized into a single `SocialPost` shape and sorted by
 * recency. Entirely optional: without `META_PAGE_ID`, `META_IG_BUSINESS_ID`,
 * and `META_PAGE_ACCESS_TOKEN` configured (or on any fetch/API failure),
 * every function here resolves to an empty list instead of throwing, so the
 * site works fine with the section simply not rendering.
 */
export type SocialPost = {
  id: string;
  platform: "facebook" | "instagram";
  message: string | null;
  imageUrl: string | null;
  permalink: string;
  timestamp: string;
};

type FacebookPostRow = {
  id: string;
  message?: string;
  full_picture?: string;
  permalink_url: string;
  created_time: string;
};

type InstagramMediaRow = {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
};

const GRAPH_VERSION = "v21.0";
// Refresh hourly — this is a marketing section, not a live feed, and keeps
// well within Graph API rate limits for a single page + IG account.
const REVALIDATE_SECONDS = 3600;

// Meta credentials come from a Facebook Page + linked Instagram Business
// account set up outside this codebase (see .env.example). Until those are
// configured, every function here returns an empty list instead of
// throwing, so the site works normally with the section just not rendering.
/**
 * Fetches recent posts from the configured Facebook Page via the Graph API.
 * @param limit Maximum number of posts to request.
 * @returns Normalized posts, or `[]` if Meta credentials are missing or the request fails.
 */
export async function getFacebookPosts(limit = 6): Promise<SocialPost[]> {
  const pageId = process.env.META_PAGE_ID;
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!pageId || !token) return [];

  try {
    const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/posts`);
    url.searchParams.set("fields", "id,message,full_picture,permalink_url,created_time");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("access_token", token);

    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return [];

    const data = (await res.json()) as { data?: FacebookPostRow[] };
    return (data.data ?? []).map((post) => ({
      id: post.id,
      platform: "facebook" as const,
      message: post.message ?? null,
      imageUrl: post.full_picture ?? null,
      permalink: post.permalink_url,
      timestamp: post.created_time,
    }));
  } catch {
    return [];
  }
}

/**
 * Fetches recent media from the configured Instagram Business account via the Graph API.
 * @param limit Maximum number of media items to request.
 * @returns Normalized posts (video items without a thumbnail are dropped), or `[]` if Meta credentials are missing or the request fails.
 */
export async function getInstagramPosts(limit = 6): Promise<SocialPost[]> {
  const igBusinessId = process.env.META_IG_BUSINESS_ID;
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!igBusinessId || !token) return [];

  try {
    const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${igBusinessId}/media`);
    url.searchParams.set("fields", "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("access_token", token);

    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return [];

    const data = (await res.json()) as { data?: InstagramMediaRow[] };
    return (data.data ?? [])
      .map((post) => ({
        id: post.id,
        platform: "instagram" as const,
        message: post.caption ?? null,
        // Video posts don't expose a directly embeddable image via media_url
        // in the same way — use the thumbnail instead so the card always has
        // a picture.
        imageUrl: (post.media_type === "VIDEO" ? post.thumbnail_url : post.media_url) ?? null,
        permalink: post.permalink,
        timestamp: post.timestamp,
      }))
      .filter((post) => post.imageUrl !== null);
  } catch {
    return [];
  }
}

/**
 * Fetches Facebook and Instagram posts in parallel and merges them into one feed, newest first.
 * @param limitPerPlatform Maximum number of posts to request from each platform.
 */
export async function getSocialPosts(limitPerPlatform = 6): Promise<SocialPost[]> {
  const [facebook, instagram] = await Promise.all([
    getFacebookPosts(limitPerPlatform),
    getInstagramPosts(limitPerPlatform),
  ]);

  return [...facebook, ...instagram].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
