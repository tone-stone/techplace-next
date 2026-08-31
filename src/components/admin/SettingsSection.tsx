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

export type EnvStatus = { resend: boolean; cron: boolean; fromEmail: boolean };

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

          <label className="block sm:max-w-xs">
            <span className="text-xs text-gray-400">Días de anticipación del recordatorio</span>
            <input
              name="billingReminderLeadDays"
              type="number"
              min="0"
              max="60"
              defaultValue={settings.billingReminderLeadDays}
              className={`mt-1 ${FIELD}`}
            />
          </label>

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
        <h2 className="mb-1 text-lg font-bold text-white">Automatización de cobranza</h2>
        <p className="mb-4 text-xs text-gray-500">
          Estas variables se configuran en Vercel → Settings → Environment Variables (y luego Redeploy).
          El CRM funciona sin ellas; solo no corre el cron ni se envían correos.
        </p>
        <div className="space-y-2">
          <StatusRow
            ok={env.cron}
            label="CRON_SECRET"
            hint="falta — el cron diario responde 401 y no genera cargos"
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
        </div>
      </div>
    </div>
  );
}
