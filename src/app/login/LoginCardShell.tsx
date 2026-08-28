"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Purely presentational wrapper that fades/slides the login card in on
 * mount. Shared by both the CRM and blog login pages so they get identical
 * entrance motion around whatever content each one renders.
 */

/** Animated glass-panel shell for a login card. @param children Card content (form, headings, etc). */
export default function LoginCardShell({ children }: { children: ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="tp-glass w-full max-w-md mx-auto p-6 sm:p-8 rounded-3xl relative z-20"
    >
      {children}
    </motion.main>
  );
}
