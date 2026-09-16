/**
 * Date-urgency helpers shared across the CRM for anything with a due date:
 * plan renewals, payments, quote validity, and task due dates. Centralizing
 * the "overdue / due soon / fine" thresholds here keeps badges and sort
 * order consistent everywhere they're used.
 */

export type DueDateUrgency = "vencido" | "por_vencer" | "al_dia";

const DUE_SOON_WINDOW_DAYS = 7;

/**
 * Classifies a due date (YYYY-MM-DD) against today: overdue, due within the
 * next week, or fine for now. Used for both plan renewal dates and payment
 * due dates so their badges/sorting stay consistent.
 */
export function getDueDateUrgency(dueDate: string, today: Date = new Date()): DueDateUrgency {
  const due = new Date(`${dueDate}T00:00:00`);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((due.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "vencido";
  if (diffDays <= DUE_SOON_WINDOW_DAYS) return "por_vencer";
  return "al_dia";
}

/** Number of calendar days between `today` and `dueDate` (negative if past). */
export function daysUntil(dueDate: string, today: Date = new Date()): number {
  const due = new Date(`${dueDate}T00:00:00`);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((due.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}
