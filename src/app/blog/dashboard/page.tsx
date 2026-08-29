import { redirect } from "next/navigation";

/**
 * The blog dashboard was merged into the CRM dashboard's "Blog" module.
 * This route stays only to redirect old bookmarks.
 */
export default function BlogDashboardRedirect() {
  redirect("/admin");
}
