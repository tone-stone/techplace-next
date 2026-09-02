/**
 * Minimal Twilio WhatsApp wrapper — the WhatsApp counterpart of
 * `src/lib/email/client.ts`. No SDK: a single form-encoded `fetch` to the
 * Twilio Messages API with Basic auth. When the `TWILIO_*` env vars are unset
 * (local dev, CI, first deploy) it logs and no-ops so callers don't have to
 * special-case it.
 *
 * Env:
 *   TWILIO_ACCOUNT_SID     — starts with "AC…"
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_WHATSAPP_FROM   — the sender, e.g. "whatsapp:+14155238886"
 */

export type SendWhatsAppInput = {
  to: string | string[];
  /** Plain text (WhatsApp supports *bold*, _italic_, no HTML). */
  body: string;
};

export type SendWhatsAppResult =
  | { ok: true; sent: number; skipped?: boolean }
  | { ok: false; error: string };

/** True when all three Twilio vars are present. */
export function whatsappConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_FROM
  );
}

/**
 * Normalizes a raw phone string to a `whatsapp:+E164` address, or `null` when
 * it can't be made sense of. Bare 10-digit numbers are assumed Mexican (+52).
 */
export function toWhatsAppAddress(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const hadPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  let e164: string;
  if (hadPlus) {
    e164 = digits.length >= 8 && digits.length <= 15 ? digits : "";
  } else if (digits.length === 10) {
    e164 = `52${digits}`; // Mexico, national number
  } else if (digits.length === 12 && digits.startsWith("52")) {
    e164 = digits;
  } else if (digits.length === 13 && digits.startsWith("521")) {
    e164 = `52${digits.slice(3)}`; // legacy "1" after country code
  } else if (digits.length >= 11 && digits.length <= 15) {
    e164 = digits; // already includes a country code
  } else {
    return null;
  }
  if (!e164) return null;
  return `whatsapp:+${e164}`;
}

/**
 * Parses a free-text list of numbers separated by commas, semicolons or
 * newlines (spaces *within* a number are fine — they're stripped).
 */
export function parseRecipientList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  for (const part of raw.split(/[\n,;]+/)) {
    const addr = toWhatsAppAddress(part.trim());
    if (addr) seen.add(addr);
  }
  return [...seen];
}

/**
 * Sends the same `body` to every recipient (one Twilio call each). Returns
 * `ok:true` if at least one message was accepted; individual failures are
 * folded into the error string only when *all* of them fail.
 */
export async function sendWhatsApp(input: SendWhatsAppInput): Promise<SendWhatsAppResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  const rawList = Array.isArray(input.to) ? input.to : [input.to];
  const recipients = [
    ...new Set(rawList.map((r) => toWhatsAppAddress(r)).filter((r): r is string => !!r)),
  ];

  if (recipients.length === 0) return { ok: false, error: "Sin destinatarios de WhatsApp válidos" };

  if (!sid || !token || !from) {
    console.info(
      `[whatsapp] TWILIO_* no configurado — se omite envío a ${recipients.join(", ")}: "${input.body.slice(0, 60)}…"`
    );
    return { ok: true, sent: 0, skipped: true };
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const fromAddr = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;

  let sent = 0;
  const failures: string[] = [];
  for (const to of recipients) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ From: fromAddr, To: to, Body: input.body }),
      });
      if (res.ok) {
        sent++;
      } else {
        const text = await res.text();
        failures.push(`${to}: Twilio ${res.status} ${text.slice(0, 160)}`);
      }
    } catch (err) {
      failures.push(`${to}: ${err instanceof Error ? err.message : "error de red"}`);
    }
  }

  if (sent === 0) return { ok: false, error: failures.join(" | ") || "No se envió ningún WhatsApp" };
  return { ok: true, sent };
}
