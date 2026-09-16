"use client";

/**
 * "Configuración" screen: edits the single `app_settings` row (org name, the
 * cobranza "from" address, reminder lead days) and shows a read-only status of
 * the environment variables the cobranza cron/email depend on. Reached from the
 * gear button in the sidebar footer; dios/admin only.
 */

import { useActionState } from "react";
import { CheckCircle2, Settings, XCircle } from "lucide-react";
import { updateAppSettingsAction, type AppSettings } from "@/lib/settings";
import type { CrmActionState } from "@/lib/crm/clients";

export type EnvStatus = { resend: boolean; cron: boolean; fromEmail: boolean; twilio: boolean };

const FIELD =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40";

function StatusRow({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
      ) : (
        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
      )}
      <div>
        <span className={ok ? "text-gray-200" : "text-gray-300"}>{label}</span>
        <span className="text-gray-500"> — {ok ? "configurado" : hint}</span>
      </div>
    </div>
  );
}

export default function SettingsSection({
  settings,
  env,
}: {
  settings: AppSettings;
  env: EnvStatus;
}) {
  const [state, formAction] = useActionState<CrmActionState, FormData>(
    async (prev, formData) => updateAppSettingsAction(prev, formData),
    null
  );

  return (
    <div className="space-y-6">
      <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <Settings className="h-5 w-5 text-sky-300" /> Organización
        </h2>

        <form action={formAction} className="space-y-4">
          <label className="block">
            <span className="text-xs text-gray-400">Nombre de la organización</span>
            <input name="orgName" required defaultValue={settings.orgName} className={`mt-1 ${FIELD}`} />
          </label>

          <label className="block">
            <span className="text-xs text-gray-400">
              Correo remitente de cobranza (recordatorios y resumen)
            </span>
            <input
              name="billingFromEmail"
              type="email"
              defaultValue={settings.billingFromEmail ?? ""}
              placeholder="cobranza@techplacetj.com"
              className={`mt-1 ${FIELD}`}
            />
            <span className="mt-1 block text-[11px] text-gray-500">
              El dominio debe estar verificado en Resend para que los correos lleguen.
            </span>
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs text-gray-400">Días de anticipación del recordatorio de cobro</span>
              <input
                name="billingReminderLeadDays"
                type="number"
                min="0"
                max="60"
                defaultValue={settings.billingReminderLeadDays}
                className={`mt-1 ${FIELD}`}
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">Días de anticipación de la agenda diaria</span>
              <input
                name="agendaReminderLeadDays"
                type="number"
                min="0"
                max="30"
                defaultValue={settings.agendaReminderLeadDays}
                className={`mt-1 ${FIELD}`}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs text-gray-400">
              Correos que reciben los avisos internos (resumen de cobranza, agenda, cotización aceptada)
            </span>
            <textarea
              name="notifyInternalEmail"
              rows={2}
              defaultValue={settings.notifyInternalEmail}
              placeholder="tonnestone@gmail.com, avilla@voltlabagency.com"
              className={`mt-1 resize-y ${FIELD}`}
            />
            <span className="mt-1 block text-[11px] text-gray-500">
              Se suman a los perfiles dios/admin. Separa con coma o salto de línea. Para que lleguen a
              Gmail/Outlook, el dominio de <span className="font-mono">BILLING_FROM_EMAIL</span> debe estar
              verificado en Resend.
            </span>
          </label>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <label className="flex items-center gap-2 text-sm text-gray-200">
              <input
                type="checkbox"
                name="notifyWhatsappEnabled"
                defaultChecked={settings.notifyWhatsappEnabled}
                className="h-4 w-4"
              />
              Enviar también por WhatsApp (además del correo)
            </label>
            <p className="mt-1 text-[11px] text-gray-500">
              Requiere las variables <span className="font-mono">TWILIO_*</span> configuradas en Vercel.
              Aplica a recordatorios de cobro, cotizaciones y la agenda.
            </p>
            <label className="mt-3 block">
              <span className="text-xs text-gray-400">
                Números internos para alertas por WhatsApp (resumen de cobranza, cotización aceptada, agenda)
              </span>
              <textarea
                name="notifyInternalWhatsapp"
                rows={2}
                defaultValue={settings.notifyInternalWhatsapp}
                placeholder="+52 664 123 4567, 6641234568"
                className={`mt-1 resize-y ${FIELD}`}
              />
              <span className="mt-1 block text-[11px] text-gray-500">
                Separa con coma o salto de línea. Un número de 10 dígitos se asume de México (+52).
              </span>
            </label>
          </div>

          {state && "error" in state && <p className="text-sm text-red-400">{state.error}</p>}
          {state && "success" in state && (
            <p className="text-sm text-emerald-400">Configuración guardada.</p>
          )}

          <button
            type="submit"
            className="cursor-pointer rounded-full bg-sky-500/20 px-5 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/30"
          >
            Guardar
          </button>
        </form>
      </div>

      <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
        <h2 className="mb-1 text-lg font-bold text-white">Automatización y notificaciones</h2>
        <p className="mb-4 text-xs text-gray-500">
          Estas variables se configuran en Vercel → Settings → Environment Variables (y luego Redeploy).
          El CRM funciona sin ellas; solo no corren los crons ni se envían mensajes. Crons:{" "}
          <span className="font-mono">/api/cron/cobranza</span> y{" "}
          <span className="font-mono">/api/cron/agenda</span>.
        </p>
        <div className="space-y-2">
          <StatusRow
            ok={env.cron}
            label="CRON_SECRET"
            hint="falta — los crons diarios responden 401 y no generan cargos ni avisos"
          />
          <StatusRow
            ok={env.resend}
            label="RESEND_API_KEY"
            hint="falta — no se envía ningún correo (lo demás sigue)"
          />
          <StatusRow
            ok={env.fromEmail}
            label="BILLING_FROM_EMAIL"
            hint="opcional — sin ella se usa un remitente por defecto"
          />
          <StatusRow
            ok={env.twilio}
            label="TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM"
            hint="faltan — el envío por WhatsApp se omite aunque esté activado arriba"
          />
        </div>
      </div>
    </div>
  );
}
