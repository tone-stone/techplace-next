import { redirect } from "next/navigation";

/**
 * The blog portal was merged into the single `/login` + `/admin` dashboard.
 * This route stays only to redirect old bookmarks.
 */
export default function BlogLoginRedirect() {
  redirect("/login");
}
