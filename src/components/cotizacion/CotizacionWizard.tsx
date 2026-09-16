"use client";

import { useActionState, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  Send,
  User,
} from "lucide-react";
import { submitProjectBrief } from "@/lib/briefs/actions";
import type { BriefState } from "@/lib/briefs/types";

const STEPS = [
  "Contacto",
  "Tu proyecto",
  "Alcance",
  "Diseño y contenido",
  "Presupuesto y tiempos",
];

const FEATURES = [
  "Catálogo de productos",
  "Carrito de compras y pagos en línea",
  "Blog o artículos",
  "Formulario de contacto",
  "Reservas o citas en línea",
  "Panel de administración",
  "Multilenguaje",
  "Integración con redes sociales",
  "Chat en vivo o WhatsApp",
  "Registro e inicio de sesión de usuarios",
  "Newsletter / email marketing",
];

const inputCls =
  "tp-glass-input w-full px-4 py-3 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition duration-200";
const labelCls = "block text-sm font-semibold text-gray-200 mb-2";
// El popup nativo de <select> ignora el glassmorphism y usa fondo blanco por defecto en
// la mayoría de navegadores; sin esto las opciones quedan en texto blanco sobre blanco.
const optionCls = "bg-[#150c1e] text-white";
const selectStyle: React.CSSProperties = { colorScheme: "dark" };

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {required && <span className="text-purple-400"> *</span>}
      </label>
      {children}
    </div>
  );
}

function RadioRow({
  name,
  options,
  required,
}: {
  name: string;
  options: string[];
  required?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => (
        <label
          key={opt}
          className="tp-glass-input flex items-center gap-2 px-4 py-2.5 rounded-2xl cursor-pointer text-sm text-gray-200 has-checked:ring-2 has-checked:ring-brand-blue has-checked:text-white"
        >
          <input type="radio" name={name} value={opt} required={required} className="accent-brand-blue" />
          {opt}
        </label>
      ))}
    </div>
  );
}

const initialState: BriefState = null;

export default function CotizacionWizard() {
  const [step, setStep] = useState(0);
  const [hasWebsite, setHasWebsite] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(submitProjectBrief, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const lastStep = STEPS.length - 1;

  function goNext() {
    const container = formRef.current?.querySelector<HTMLElement>(`[data-step="${step}"]`);
    if (container) {
      const invalid = container.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        ":invalid"
      );
      if (invalid) {
        invalid.reportValidity();
        return;
      }
    }
    setStep((s) => Math.min(s + 1, lastStep));
    window.scrollTo({ top: (formRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY - 120, behavior: "smooth" });
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  if (state?.success) {
    return (
      <div className="tp-glass rounded-3xl p-8 sm:p-12 text-center">
        <CheckCircle2 className="h-14 w-14 text-purple-400 mx-auto mb-4" />
        <h2 className="tp-heading font-heading text-2xl md:text-3xl font-extrabold mb-3">¡Listo!</h2>
        <p className="text-gray-300 max-w-md mx-auto">{state.message}</p>
      </div>
    );
  }

  return (
    <div className="tp-glass rounded-3xl p-6 sm:p-10">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2 text-xs sm:text-sm font-semibold text-gray-400">
          <span>
            Paso {step + 1} de {STEPS.length}: <span className="text-white">{STEPS[step]}</span>
          </span>
          <span>{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full tp-btn-animated"
            initial={false}
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      </div>

      <form ref={formRef} action={formAction} className="space-y-8">
        {/* Paso 1: Contacto y negocio */}
        <div data-step={0} className={step === 0 ? "space-y-5" : "hidden"}>
          <Field label="Tu nombre completo" required>
            <div className="relative">
              <input name="full_name" required placeholder="Ej. Ana García" className={`${inputCls} pl-12`} />
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
            </div>
          </Field>
          <Field label="Nombre de tu negocio o empresa">
            <div className="relative">
              <input name="business_name" placeholder="Ej. Panadería La Espiga" className={`${inputCls} pl-12`} />
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
            </div>
          </Field>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Email" required>
              <div className="relative">
                <input type="email" name="email" required placeholder="tu@correo.com" className={`${inputCls} pl-12`} />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
              </div>
            </Field>
            <Field label="Teléfono / WhatsApp" required>
              <div className="relative">
                <input type="tel" name="phone" required placeholder="664 000 0000" className={`${inputCls} pl-12`} />
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
              </div>
            </Field>
          </div>
          <Field label="¿A qué giro o industria se dedica tu negocio?">
            <input name="industry" placeholder="Ej. Restaurantes, salud, retail, servicios profesionales…" className={inputCls} />
          </Field>
          <div onChange={(e) => setHasWebsite((e.target as HTMLInputElement).value)}>
            <Field label="¿Ya tienes una página web actualmente?" required>
              <RadioRow name="has_website" options={["Sí", "No"]} required />
            </Field>
          </div>
          {hasWebsite === "Sí" && (
            <Field label="¿Cuál es la URL de tu sitio actual?">
              <input name="current_website_url" placeholder="https://" className={inputCls} />
            </Field>
          )}
        </div>

        {/* Paso 2: Tipo de proyecto y objetivos */}
        <div data-step={1} className={step === 1 ? "space-y-5" : "hidden"}>
          <Field label="¿Qué tipo de proyecto necesitas?" required>
            <select name="project_type" required defaultValue="" className={inputCls} style={selectStyle}>
              <option value="" disabled className={optionCls}>
                Selecciona una opción
              </option>
              <option className={optionCls}>Sitio web informativo</option>
              <option className={optionCls}>Tienda en línea / E-commerce</option>
              <option className={optionCls}>Landing page</option>
              <option className={optionCls}>Sistema web a medida o app</option>
              <option className={optionCls}>Rediseño de un sitio existente</option>
              <option className={optionCls}>No estoy seguro, necesito asesoría</option>
            </select>
          </Field>
          <Field label="¿Cuál es el objetivo principal del proyecto?" required>
            <select name="project_goal" required defaultValue="" className={inputCls} style={selectStyle}>
              <option value="" disabled className={optionCls}>
                Selecciona una opción
              </option>
              <option className={optionCls}>Vender productos o servicios en línea</option>
              <option className={optionCls}>Generar clientes potenciales (leads)</option>
              <option className={optionCls}>Dar información de la empresa / presencia digital</option>
              <option className={optionCls}>Recibir reservas o citas</option>
              <option className={optionCls}>Ofrecer un portal para usuarios registrados</option>
              <option className={optionCls}>Otro</option>
            </select>
          </Field>
          <Field label="¿Quién es tu público objetivo o cliente ideal?">
            <textarea name="target_audience" rows={3} placeholder="Ej. Dueños de restaurantes en Tijuana, jóvenes de 20-35 años…" className={inputCls} />
          </Field>
          <Field label="¿Qué problema quieres resolver o qué resultado esperas lograr?">
            <textarea name="problem_to_solve" rows={3} placeholder="Cuéntanos el contexto: qué pasa hoy y qué te gustaría que pasara" className={inputCls} />
          </Field>
        </div>

        {/* Paso 3: Alcance y funcionalidades */}
        <div data-step={2} className={step === 2 ? "space-y-5" : "hidden"}>
          <Field label="¿Cuántas páginas o secciones necesitas aproximadamente?">
            <select name="pages_estimate" defaultValue="" className={inputCls} style={selectStyle}>
              <option value="" disabled className={optionCls}>
                Selecciona una opción
              </option>
              <option className={optionCls}>1 sola página (landing)</option>
              <option className={optionCls}>2 a 5 páginas</option>
              <option className={optionCls}>6 a 10 páginas</option>
              <option className={optionCls}>Más de 10 páginas</option>
              <option className={optionCls}>No estoy seguro</option>
            </select>
          </Field>
          <Field label="¿Qué funcionalidades necesitas? (selecciona todas las que apliquen)">
            <div className="grid sm:grid-cols-2 gap-2.5">
              {FEATURES.map((f) => (
                <label
                  key={f}
                  className="tp-glass-input flex items-center gap-2.5 px-4 py-2.5 rounded-2xl cursor-pointer text-sm text-gray-200 has-checked:ring-2 has-checked:ring-brand-blue has-checked:text-white"
                >
                  <input type="checkbox" name="features" value={f} className="accent-brand-blue" />
                  {f}
                </label>
              ))}
            </div>
          </Field>
          <Field label="¿Necesitas cobrar en línea? ¿Con qué pasarela de pago, si ya lo sabes?">
            <input name="payment_gateway" placeholder="Ej. Stripe, PayPal, Conekta, o no estoy seguro" className={inputCls} />
          </Field>
          <Field label="¿Necesitas integrar el sitio con otros sistemas que ya usas?">
            <textarea name="integrations" rows={2} placeholder="Ej. Facturación, CRM, inventario, sistema de reservaciones…" className={inputCls} />
          </Field>
        </div>

        {/* Paso 4: Diseño y contenido */}
        <div data-step={3} className={step === 3 ? "space-y-5" : "hidden"}>
          <Field label="¿Ya tienes marca, logo o manual de identidad?">
            <RadioRow name="has_branding" options={["Sí, completo", "Parcial (solo logo)", "No, necesito ayuda"]} />
          </Field>
          <Field label="¿Tienes sitios web de referencia que te gusten? Compártenos los links">
            <textarea name="reference_sites" rows={2} placeholder="https://... (uno o varios ejemplos que te gustaría usar de inspiración)" className={inputCls} />
          </Field>
          <Field label="¿Cuentas con el contenido listo (textos, fotos, videos)?">
            <RadioRow name="content_ready" options={["Sí, todo listo", "Parcialmente", "No, necesito ayuda a crearlo"]} />
          </Field>
          <Field label="¿Qué estilo visual buscas?">
            <RadioRow
              name="visual_style"
              options={["Minimalista", "Corporativo / serio", "Moderno / creativo", "Divertido / colorido", "No estoy seguro"]}
            />
          </Field>
        </div>

        {/* Paso 5: Técnico, presupuesto y tiempos */}
        <div data-step={4} className={step === 4 ? "space-y-5" : "hidden"}>
          <Field label="¿Ya tienes dominio y hosting?">
            <RadioRow name="has_domain_hosting" options={["Sí, ambos", "Solo el dominio", "Ninguno todavía"]} />
          </Field>
          <Field label="¿Tienes alguna preferencia o requerimiento técnico específico? (opcional)">
            <input name="tech_preference" placeholder="Ej. debe integrarse con un sistema que ya tenemos" className={inputCls} />
          </Field>
          <Field label="¿Necesitas mantenimiento continuo después de la entrega?">
            <RadioRow name="needs_maintenance" options={["Sí, mensual", "Solo la entrega inicial", "No estoy seguro"]} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Presupuesto aproximado" required>
              <select name="budget_range" required defaultValue="" className={inputCls} style={selectStyle}>
                <option value="" disabled className={optionCls}>
                  Selecciona un rango
                </option>
                <option className={optionCls}>Menos de $10,000 MXN</option>
                <option className={optionCls}>$10,000 – $25,000 MXN</option>
                <option className={optionCls}>$25,000 – $50,000 MXN</option>
                <option className={optionCls}>$50,000 – $100,000 MXN</option>
                <option className={optionCls}>Más de $100,000 MXN</option>
                <option className={optionCls}>Prefiero que me asesoren</option>
              </select>
            </Field>
            <Field label="¿Para cuándo lo necesitas?" required>
              <select name="timeline" required defaultValue="" className={inputCls} style={selectStyle}>
                <option value="" disabled className={optionCls}>
                  Selecciona una opción
                </option>
                <option className={optionCls}>Lo antes posible</option>
                <option className={optionCls}>En el próximo mes</option>
                <option className={optionCls}>En 1 a 3 meses</option>
                <option className={optionCls}>Flexible, sin fecha límite</option>
              </select>
            </Field>
          </div>
          <Field label="¿Algo más que quieras contarnos sobre tu proyecto?">
            <textarea name="additional_notes" rows={3} placeholder="Cualquier detalle adicional que nos ayude a entender mejor tu proyecto" className={inputCls} />
          </Field>
        </div>

        {state?.success === false && (
          <motion.p
            initial={{ x: -6 }}
            animate={{ x: [-6, 6, -4, 4, 0] }}
            transition={{ duration: 0.4 }}
            className="text-sm text-red-400"
          >
            {state.message}
          </motion.p>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold text-gray-300 hover:text-white disabled:opacity-0 disabled:pointer-events-none transition"
          >
            <ArrowLeft className="h-4 w-4" /> Atrás
          </button>

          {step < lastStep ? (
            <motion.button
              type="button"
              onClick={goNext}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="tp-btn-animated inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold text-white shadow-lg"
            >
              Siguiente <ArrowRight className="h-4 w-4" />
            </motion.button>
          ) : (
            <motion.button
              type="submit"
              disabled={pending}
              whileHover={{ scale: pending ? 1 : 1.03 }}
              whileTap={{ scale: pending ? 1 : 0.97 }}
              className="tp-btn-animated inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold text-white shadow-lg disabled:opacity-60"
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Enviar brief
                </>
              )}
            </motion.button>
          )}
        </div>
      </form>
    </div>
  );
}
