import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Mocks --------------------------------------------------------------------
const { sendEmail, sendWhatsApp } = vi.hoisted(() => ({
  sendEmail: vi.fn(async () => ({ ok: true as const, id: null, skipped: true })),
  sendWhatsApp: vi.fn(async () => ({ ok: true as const, sent: 1 })),
}));
vi.mock("@/lib/email/client", () => ({ sendEmail }));
vi.mock("@/lib/whatsapp/client", () => ({
  sendWhatsApp,
  whatsappConfigured: () => true,
  parseRecipientList: (raw: string | null) => (raw ? ["whatsapp:+526640000000"] : []),
}));

type Rows = Record<string, unknown>[];
const db: {
  settings: Record<string, unknown> | null;
  tasks: Rows;
  projects: Rows;
  tickets: Rows;
  staff: Rows;
} = { settings: null, tasks: [], projects: [], tickets: [], staff: [] };

function makeClient() {
  const builder = (table: string) => {
    const resolveList = (): { data: unknown; error: null } => {
      if (table === "crm_tasks") return { data: db.tasks, error: null };
      if (table === "crm_projects") return { data: db.projects, error: null };
      if (table === "it_tickets") return { data: db.tickets, error: null };
      if (table === "profiles") return { data: db.staff, error: null };
      return { data: [], error: null };
    };
    const chain: Record<string, unknown> = {};
    const pass = () => chain;
    for (const m of ["select", "eq", "neq", "not", "lte", "lt", "in", "is", "order"]) chain[m] = pass;
    chain.maybeSingle = async () => ({ data: db.settings, error: null });
    chain.then = (onF: (r: unknown) => unknown) => Promise.resolve(resolveList()).then(onF);
    return chain;
  };
  return { from: (t: string) => builder(t) };
}
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => makeClient() }));

const { runAgendaCycle } = await import("./agenda-run");

beforeEach(() => {
  db.settings = null;
  db.tasks = [];
  db.projects = [];
  db.tickets = [];
  db.staff = [];
  sendEmail.mockClear();
  sendWhatsApp.mockClear();
});

describe("runAgendaCycle", () => {
  it("does nothing and sends nothing when there is nothing due", async () => {
    const res = await runAgendaCycle(new Date("2026-09-02T15:00:00Z"));
    expect(res).toMatchObject({ items: 0, emailSent: false, whatsappSent: false });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(sendWhatsApp).not.toHaveBeenCalled();
  });

  it("collects tasks/projects/tickets and emails the internal digest", async () => {
    db.staff = [{ email: "admin@techplace.mx" }];
    db.tasks = [{ title: "Renovar dominio", due_date: "2026-09-03", status: "por_hacer", crm_clients: { company: "Acme" } }];
    db.projects = [{ name: "Rediseño", due_date: "2026-09-01", status: "en_progreso", crm_clients: { company: "Beta" } }];
    db.tickets = [
      { number: "TK-9", subject: "Caída", sla_due_at: "2026-09-02T18:00:00Z", status: "abierto", crm_clients: null },
    ];

    const res = await runAgendaCycle(new Date("2026-09-02T15:00:00Z"));

    expect(res).toMatchObject({ items: 3, tasks: 1, projects: 1, tickets: 1, emailSent: true });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const [arg] = sendEmail.mock.calls[0] as unknown as [{ to: string[]; subject: string }];
    expect(arg.to).toEqual(["admin@techplace.mx"]);
    expect(arg.subject).toMatch(/3 pendiente/);
  });

  it("also sends the WhatsApp digest when enabled with an internal list", async () => {
    db.settings = { notify_whatsapp_enabled: true, notify_internal_whatsapp: "6640000000" };
    db.staff = [{ email: "admin@techplace.mx" }];
    db.tasks = [{ title: "X", due_date: "2026-09-02", status: "por_hacer", crm_clients: null }];

    const res = await runAgendaCycle(new Date("2026-09-02T15:00:00Z"));

    expect(res.whatsappSent).toBe(true);
    expect(sendWhatsApp).toHaveBeenCalledTimes(1);
  });
});
