"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Lock, LogIn, Mail } from "lucide-react";
import { motion } from "motion/react";
import { login, type LoginState } from "@/lib/auth/actions";

const inputClasses =
  "tp-glass-input w-full pl-12 pr-4 py-3 rounded-xl text-purple-100 placeholder-purple-400 focus:border-brand-blue focus:ring focus:ring-brand-blue/40 outline-none transition";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <motion.button
      type="submit"
      disabled={pending}
      whileHover={{ scale: pending ? 1 : 1.02 }}
      whileTap={{ scale: pending ? 1 : 0.98 }}
      className="tp-btn-animated w-full py-3 rounded-xl font-bold text-white relative shadow-lg transition-opacity duration-200 disabled:opacity-60"
    >
      <span className="inline-flex items-center gap-2">
        <LogIn className="h-4 w-4" />
        {pending ? "Entrando…" : "Entrar"}
      </span>
    </motion.button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(login, null);
  const [prevState, setPrevState] = useState(state);
  const [shake, setShake] = useState(0);

  if (state !== prevState) {
    setPrevState(state);
    setShake((n) => n + 1);
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="relative">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
        <input
          type="email"
          name="email"
          required
          placeholder="Tu Email"
          autoComplete="email"
          className={inputClasses}
        />
      </div>

      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
        <input
          type="password"
          name="password"
          required
          placeholder="Contraseña"
          autoComplete="current-password"
          className={inputClasses}
        />
      </div>

      {state?.error && (
        <motion.p
          key={shake}
          initial={{ x: -6, opacity: 0 }}
          animate={{ x: [-6, 6, -4, 4, 0], opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-red-400 text-sm text-center"
        >
          {state.error}
        </motion.p>
      )}

      <SubmitButton />
    </form>
  );
}
