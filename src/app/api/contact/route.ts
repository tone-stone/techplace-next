import { NextResponse, type NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Server-side proxy for the public "Contáctanos" form. The browser used to
 * POST straight to Formspree; routing it through here lets us add abuse
 * controls the client can't enforce, and keeps the request same-origin (so
 * the CSP `connect-src`/`form-action 'self'` no longer needs a Formspree
 * exception).
 *
 * Defenses, in order:
 *  1. Rate limit by client IP.
 *  2. Honeypot field (`_gotcha`) — must stay empty.
 *  3. Time trap (`_ts`) — reject submits faster than a human could fill the
 *     form, or from a page left open for hours.
 *  4. Shape/size validation.
 *
 * A bot that trips the honeypot or time trap gets a normal-looking `200` so
 * it can't tell it was filtered; real failures return `400`/`429`.
 */

const FORMSPREE_ENDPOINT =
  process.env.FORMSPREE_ENDPOINT || "https://formspree.io/f/xwpbgpkr";

const RATE_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 }; // 5 per 10 min per IP
const MIN_FILL_MS = 3_000;
const MAX_AGE_MS = 60 * 60 * 1000;

const MAX = { name: 120, email: 200, mensaje: 5000 } as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Bot-friendly fake success — used when a filter trips silently. */
const fakeOk = () => NextResponse.json({ ok: true });

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const rl = rateLimit(`contact:${ip}`, RATE_LIMIT);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Demasiados intentos. Espera unos minutos." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida" }, { status: 400 });
  }

  const str = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" ? v.trim() : "";
  };

  // 2. Honeypot: a real user never sees or fills this.
  if (str("_gotcha")) {
    console.warn(`[contact] honeypot tripped from ${ip}`);
    return fakeOk();
  }

  // 3. Time trap.
  const ts = Number(str("_ts"));
  const age = Number.isFinite(ts) ? Date.now() - ts : NaN;
  if (!Number.isFinite(age) || age < MIN_FILL_MS || age > MAX_AGE_MS) {
    console.warn(`[contact] time trap tripped from ${ip} (age=${age})`);
    return fakeOk();
  }

  // 4. Validation.
  const name = str("name").slice(0, MAX.name);
  const email = str("email").slice(0, MAX.email);
  const mensaje = str("mensaje").slice(0, MAX.mensaje);
  if (!name || !mensaje || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Revisa el nombre, el correo y el mensaje." },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ name, email, mensaje }),
    });
    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, error: "No se pudo enviar. Intenta más tarde o escríbenos por WhatsApp." },
        { status: 502 },
      );
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudo enviar. Intenta más tarde o escríbenos por WhatsApp." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
