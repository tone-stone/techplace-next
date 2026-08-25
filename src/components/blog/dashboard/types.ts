export type DashboardRole = "admin" | "redactor";

export type ActivityAction = "creó" | "editó" | "eliminó";

export type ActivityEntry = {
  id: string;
  actor: string;
  action: ActivityAction;
  title: string;
  timestamp: string;
};
