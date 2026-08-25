"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

export default function LoginCardShell({ children }: { children: ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="tp-glass w-full max-w-md mx-auto p-8 rounded-3xl relative z-20"
    >
      {children}
    </motion.main>
  );
}
