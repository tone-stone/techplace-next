/**
 * `/legal` index page: lists every document in `LEGAL_DOCS` as a card
 * linking to its `/legal/[slug]` page.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { LEGAL_DOCS } from "@/lib/legal-docs";

export const metadata: Metadata = {
  title: "Documentos legales | TechPlace",
  description: "Términos y condiciones, aviso de privacidad y contratos de TechPlace.",
  alternates: { canonical: "/legal" },
};

export default function LegalIndexPage() {
  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="text-center mb-12">
        <h1 className="font-heading text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Documentos legales
        </h1>
        <p className="max-w-2xl mx-auto text-gray-300 text-lg font-light">
          Términos de uso, aviso de privacidad y los contratos que usamos con nuestros clientes.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {LEGAL_DOCS.map((doc) => (
          <Link
            key={doc.slug}
            href={`/legal/${doc.slug}`}
            className="tp-blog-card group flex flex-col gap-3 rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1"
          >
            <FileText className="h-6 w-6 text-indigo-300" strokeWidth={1.5} />
            <h2 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
              {doc.title}
            </h2>
            <p className="text-sm text-gray-400">{doc.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
