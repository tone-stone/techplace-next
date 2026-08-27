import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export default function LegalDocument({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="max-w-3xl mx-auto px-4">
      <Link
        href="/legal"
        className="inline-flex items-center gap-1.5 text-sm text-gray-300 hover:text-brand-blue transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Todos los documentos legales
      </Link>

      <h1 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{title}</h1>
      <p className="text-sm text-gray-400 mb-10">Última actualización: {updated}</p>

      <div className="tp-dark-card rounded-3xl p-6 sm:p-10 space-y-6 text-gray-300 leading-relaxed text-justify [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:text-left [&_h2]:pt-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-indigo-300 [&_h3]:text-left [&_strong]:text-white [&_a]:text-brand-blue [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2">
        {children}
      </div>
    </div>
  );
}
