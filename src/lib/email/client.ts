/**
 * Minimal Resend REST wrapper for transactional mail (billing reminders and the
 * internal collections digest). No SDK — a single `fetch` to the Resend API.
 * When `RESEND_API_KEY` is unset (local dev, CI, first deploy) it logs and
 * no-ops so callers don't have to special-case it.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Last-resort sender when neither the arg nor `BILLING_FROM_EMAIL` is set. */
const DEFAULT_FROM = "TechPlace <no-reply@techplacetj.com>";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
};

export type SendEmailResult =
  | { ok: true; id: string | null; skipped?: boolean }
  | { ok: false; error: string };

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = input.from || process.env.BILLING_FROM_EMAIL || DEFAULT_FROM;
  const to = Array.isArray(input.to) ? input.to : [input.to];

  if (to.length === 0) return { ok: false, error: "Sin destinatarios" };

  if (!apiKey) {
    console.info(
      `[email] RESEND_API_KEY no configurada — se omite envío a ${to.join(", ")}: "${input.subject}"`
    );
    return { ok: true, id: null, skipped: true };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject: input.subject, html: input.html }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 200)}` };
    }
    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id ?? null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error de red al enviar correo" };
  }
}
