import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseRecipientList,
  sendWhatsApp,
  toWhatsAppAddress,
  whatsappConfigured,
} from "./client";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("toWhatsAppAddress", () => {
  it("assumes Mexico for a bare 10-digit number", () => {
    expect(toWhatsAppAddress("664 123 4567")).toBe("whatsapp:+526641234567");
  });

  it("keeps an explicit + country code", () => {
    expect(toWhatsAppAddress("+1 (415) 523-8886")).toBe("whatsapp:+14155238886");
  });

  it("strips a legacy 1 after the Mexican country code", () => {
    expect(toWhatsAppAddress("5216641234567")).toBe("whatsapp:+526641234567");
    expect(toWhatsAppAddress("526641234567")).toBe("whatsapp:+526641234567");
  });

  it("rejects junk and empties", () => {
    expect(toWhatsAppAddress("")).toBeNull();
    expect(toWhatsAppAddress(null)).toBeNull();
    expect(toWhatsAppAddress("12345")).toBeNull();
  });
});

describe("parseRecipientList", () => {
  it("splits on commas / semicolons / newlines, keeps spaces inside a number, and dedupes", () => {
    expect(parseRecipientList("6641234567, +52 664 123 4567\n5551112222")).toEqual([
      "whatsapp:+526641234567",
      "whatsapp:+525551112222",
    ]);
  });

  it("returns [] for blank input", () => {
    expect(parseRecipientList("")).toEqual([]);
    expect(parseRecipientList(null)).toEqual([]);
  });
});

describe("whatsappConfigured", () => {
  it("is false without all three env vars", () => {
    vi.stubEnv("TWILIO_ACCOUNT_SID", "AC123");
    expect(whatsappConfigured()).toBe(false);
  });

  it("is true with all three", () => {
    vi.stubEnv("TWILIO_ACCOUNT_SID", "AC123");
    vi.stubEnv("TWILIO_AUTH_TOKEN", "tok");
    vi.stubEnv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886");
    expect(whatsappConfigured()).toBe(true);
  });
});

describe("sendWhatsApp", () => {
  it("no-ops (skipped) when Twilio env vars are missing", async () => {
    const res = await sendWhatsApp({ to: "6641234567", body: "hola" });
    expect(res).toMatchObject({ ok: true, sent: 0, skipped: true });
  });

  it("errors when no recipient can be parsed", async () => {
    const res = await sendWhatsApp({ to: "nope", body: "hola" });
    expect(res.ok).toBe(false);
  });

  it("POSTs one Twilio message per recipient when configured", async () => {
    vi.stubEnv("TWILIO_ACCOUNT_SID", "AC123");
    vi.stubEnv("TWILIO_AUTH_TOKEN", "tok");
    vi.stubEnv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886");
    const fetchMock = vi.fn(async () => ({ ok: true, text: async () => "" }) as Response);
    vi.stubGlobal("fetch", fetchMock);

    const res = await sendWhatsApp({ to: ["6641234567", "5551112222"], body: "hola" });

    expect(res).toEqual({ ok: true, sent: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json");
    expect(init.body?.toString()).toContain("To=whatsapp%3A%2B526641234567");
  });

  it("reports failure when every send fails", async () => {
    vi.stubEnv("TWILIO_ACCOUNT_SID", "AC123");
    vi.stubEnv("TWILIO_AUTH_TOKEN", "tok");
    vi.stubEnv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 401, text: async () => "bad auth" }) as Response)
    );

    const res = await sendWhatsApp({ to: "6641234567", body: "hola" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("401");
  });
});
