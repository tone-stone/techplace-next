export type BriefState = { success: true; message: string } | { success: false; message: string } | null;

export type BriefStatus = "nuevo" | "en revisión" | "cotizado" | "descartado";

export const BRIEF_STATUSES: BriefStatus[] = ["nuevo", "en revisión", "cotizado", "descartado"];

export type ManagedBrief = {
  id: string;
  createdAt: string;
  status: BriefStatus;
  fullName: string;
  businessName: string | null;
  email: string;
  phone: string;
  industry: string | null;
  hasWebsite: boolean;
  currentWebsiteUrl: string | null;
  projectType: string;
  projectGoal: string;
  targetAudience: string | null;
  problemToSolve: string | null;
  pagesEstimate: string | null;
  features: string[];
  paymentGateway: string | null;
  integrations: string | null;
  hasBranding: string | null;
  referenceSites: string | null;
  contentReady: string | null;
  visualStyle: string | null;
  hasDomainHosting: string | null;
  techPreference: string | null;
  needsMaintenance: string | null;
  budgetRange: string;
  timeline: string;
  additionalNotes: string | null;
};
