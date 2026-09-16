/**
 * Shared types for the blog dashboard component tree: the role used for
 * dashboard rendering/preview and the shape of an in-session activity log
 * entry.
 */

/** Role used to decide which dashboard view renders, and to preview the other view as a real admin. */
export type DashboardRole = "admin" | "redactor";

/** Verb (in Spanish, matching the UI's activity log copy) describing what a dashboard action did to an article. */
export type ActivityAction = "creó" | "editó" | "eliminó";

/** One row in the in-session (not persisted) activity log shown to admins. */
export type ActivityEntry = {
  id: string;
  actor: string;
  action: ActivityAction;
  title: string;
  timestamp: string;
};
