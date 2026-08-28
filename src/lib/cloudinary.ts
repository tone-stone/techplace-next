/**
 * Shared Cloudinary SDK client used by the blog's media upload pipeline
 * (`lib/blog/articles.ts`) to store article cover images, videos, and
 * gallery photos.
 */

import { v2 as cloudinary } from "cloudinary";

// Reads CLOUDINARY_URL from the environment automatically.
cloudinary.config({ secure: true });

export default cloudinary;
