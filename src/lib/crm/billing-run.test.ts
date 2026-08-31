import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Mocks --------------------------------------------------------------------
const { sendEmail } = vi.hoisted(() => ({
  sendEmail: vi.fn(async () => ({ ok: true as const, id: null, skipped: true })),
}));
vi.mock("@/lib/email/client", () => ({ sendEmail }));

type Result = { data: unknown; error: unknown };

/** State the fake Supabase client reads/writes so assertions can inspect it. */
const db = {
  plans: [] as Record<string, unknown>[],
  insertedPayments: [] as Record<string, unknown>[],
  planUpdates: [] as Record<string, unknown>[],
  history: [] as Record<string, unknown>[],
};

/** Chainable query-builder stub: every filter returns `this`; awaiting or
 *  calling `maybeSingle()` resolves based on the table + verb seen so far. */
function makeClient() {
  const builder = (table: string) => {
    let verb: "select" | "insert" | "update" = "select";
    let payload: Record<string, unknown> | undefined;

    const resolve = (): Result => {
      if (table === "crm_plans" && verb === "select") return { data: db.plans, error: null };
      if (table === "crm_plans" && verb === "update") {
        db.planUpdates.push(payload!);
        return { data: null, error: null };
      }
      if (table === "crm_payments" && verb === "insert") {
        db.insertedPayments.push(payload!);
        return { data: null, error: null };
      }
      if (table === "crm_payments" && verb === "update") return { data: [], error: null };
      if (table === "crm_payments" && verb === "select") return { data: [], error: null };
      if (table === "crm_client_history" && verb === "insert") {
        db.history.push(payload!);
        return { data: null, error: null };
      }
      if (table === "app_settings") {
        return { data: { org_name: "TechPlace", billing_from_email: null, billing_reminder_lead_days: 3 }, error: null };
      }
      if (table === "profiles") return { data: [], error: null };
      return { data: null, error: null };
    };

    const chain: Record<string, unknown> = {};
    const passthrough = () => chain;
    for (const m of ["select", "eq", "lte", "lt", "in", "order", "is"]) chain[m] = passthrough;
    chain.insert = (p: Record<string, unknown>) => {
      verb = "insert";
      payload = p;
      return chain;
    };
    chain.update = (p: Record<string, unknown>) => {
      verb = "update";
      payload = p;
      return chain;
    };
    chain.maybeSingle = async () => resolve();
    chain.then = (onFulfilled: (r: Result) => unknown) => Promise.resolve(resolve()).then(onFulfilled);
    return chain;
  };
  return { from: (t: string) => builder(t) };
}

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => makeClient() }));

// --- SUT (imported after mocks) --------------------------------------------
const { advanceDueDate, toISODate, runBillingCycle } = await import("./billing-run");

beforeEach(() => {
  db.plans = [];
  db.insertedPayments = [];
  db.planUpdates = [];
  db.history = [];
  sendEmail.mockClear();
});

describe("advanceDueDate", () => {
  it("adds one month for a monthly cycle", () => {
    expect(advanceDueDate("2026-01-15", "mensual", 15)).toBe("2026-02-15");
  });

  it("clamps day 31 to the last day of a short month", () => {
    expect(advanceDueDate("2026-01-31", "mensual", 31)).toBe("2026-02-28");
    expect(advanceDueDate("2024-01-31", "mensual", 31)).toBe("2024-02-29"); // leap year
  });

  it("rolls over the year", () => {
    expect(advanceDueDate("2026-12-10", "mensual", 10)).toBe("2027-01-10");
  });

  it("adds three months for trimestral and twelve for anual", () => {
    expect(advanceDueDate("2026-01-05", "trimestral", 5)).toBe("2026-04-05");
    expect(advanceDueDate("2026-01-05", "anual", 5)).toBe("2027-01-05");
  });

  it("lands on the plan's cutoff day even if the source date drifted", () => {
    expect(advanceDueDate("2026-03-10", "mensual", 1)).toBe("2026-04-01");
  });
});

describe("toISODate", () => {
  it("formats as YYYY-MM-DD", () => {
    expect(toISODate(new Date("2026-08-31T15:00:00Z"))).toBe("2026-08-31");
  });
});

describe("runBillingCycle", () => {
  it("generates a charge, advances the plan, logs history, and is idempotent", async () => {
    db.plans = [
      {
        id: "plan-1",
        client_id: "cli-1",
        name: "Soporte mensual",
        amount: 5000,
        billing_cycle: "mensual",
        cutoff_day: 1,
        next_due_date: "2026-08-01",
        last_billed_date: null,
      },
    ];

    const first = await runBillingCycle(new Date("2026-08-31T15:00:00Z"));
    expect(first.generated).toBe(1);
    expect(db.insertedPayments).toHaveLength(1);
    expect(db.insertedPayments[0]).toMatchObject({ client_id: "cli-1", plan_id: "plan-1", amount: 5000, due_date: "2026-08-01", status: "pendiente" });
    expect(db.planUpdates[0]).toMatchObject({ next_due_date: "2026-09-01", last_billed_date: "2026-08-01" });
    expect(db.history[0]).toMatchObject({ client_id: "cli-1", entry_type: "pago" });

    // Second run the same day: the plan now shows last_billed_date === next_due_date.
    db.plans[0].last_billed_date = "2026-08-01";
    db.plans[0].next_due_date = "2026-08-01"; // still <= today, but already billed
    db.insertedPayments = [];
    const second = await runBillingCycle(new Date("2026-08-31T15:00:00Z"));
    expect(second.generated).toBe(0);
    expect(db.insertedPayments).toHaveLength(0);
  });

  it("does nothing when no plan is due", async () => {
    db.plans = [];
    const result = await runBillingCycle(new Date("2026-08-31T15:00:00Z"));
    expect(result).toMatchObject({ generated: 0, markedOverdue: 0, remindersSent: 0 });
  });
});
