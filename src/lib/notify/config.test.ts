import { afterEach, describe, expect, it, vi } from "vitest";
import { parseEmailList, readNotifySettings } from "./config";

afterEach(() => vi.unstubAllEnvs());

describe("parseEmailList", () => {
  it("splits, trims, lowercases, dedupes and drops non-emails", () => {
    expect(parseEmailList("A@b.com, a@b.com\n c@d.mx ;x")).toEqual(["a@b.com", "c@d.mx"]);
    expect(parseEmailList("")).toEqual([]);
    expect(parseEmailList(null)).toEqual([]);
  });
});

const FULL = {
  org_name: "Voltlab",
  billing_from_email: "cobranza@voltlab.mx",
  billing_reminder_lead_days: 5,
  notify_whatsapp_enabled: true,
  notify_internal_whatsapp: "6641234567, 5551112222",
  notify_internal_email: "Ops@voltlab.mx\nfinanzas@voltlab.mx , not an email",
  agenda_reminder_lead_days: 4,
};

function stubTwilio() {
  vi.stubEnv("TWILIO_ACCOUNT_SID", "AC1");
  vi.stubEnv("TWILIO_AUTH_TOKEN", "tok");
  vi.stubEnv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886");
}

describe("readNotifySettings", () => {
  it("maps the full row and parses the internal WhatsApp list", async () => {
    stubTwilio();
    const s = await readNotifySettings(async () => ({ ...FULL }));
    expect(s).toMatchObject({
      orgName: "Voltlab",
      fromEmail: "cobranza@voltlab.mx",
      whatsappReady: true,
      billingReminderLeadDays: 5,
      agendaReminderLeadDays: 4,
    });
    expect(s.internalWhatsApp).toEqual(["whatsapp:+526641234567", "whatsapp:+525551112222"]);
    // lowercased, deduped, junk ("not an email") dropped
    expect(s.internalEmail).toEqual(["ops@voltlab.mx", "finanzas@voltlab.mx"]);
  });

  it("keeps WhatsApp off when the Twilio env vars are missing even if the flag is on", async () => {
    const s = await readNotifySettings(async () => ({ ...FULL }));
    expect(s.whatsappReady).toBe(false);
  });

  it("falls back through the column tiers when the newer selects throw (migrations pending)", async () => {
    const fetchRow = vi.fn(async (cols: string) => {
      if (cols.includes("notify_whatsapp_enabled")) throw new Error('column "notify_whatsapp_enabled" does not exist');
      return {
        org_name: "TechPlace",
        billing_from_email: null,
        billing_reminder_lead_days: 3,
      };
    });
    const s = await readNotifySettings(fetchRow);
    expect(fetchRow).toHaveBeenCalledTimes(3); // FULL → V35 → BASE
    expect(s).toMatchObject({
      orgName: "TechPlace",
      fromEmail: undefined,
      whatsappReady: false,
      internalWhatsApp: [],
      internalEmail: [],
      billingReminderLeadDays: 3,
      agendaReminderLeadDays: 2,
    });
  });

  it("returns hard defaults when there is no row at all", async () => {
    const s = await readNotifySettings(async () => null);
    expect(s).toMatchObject({ orgName: "TechPlace", billingReminderLeadDays: 3, agendaReminderLeadDays: 2 });
  });
});
