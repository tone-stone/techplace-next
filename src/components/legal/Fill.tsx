// Marks a placeholder that needs a real value (razón social, RFC, domicilio
// fiscal, etc.) before a document is legally usable — visually distinct so
// it can't be missed and accidentally published as-is.
export default function Fill({ children }: { children: string }) {
  return (
    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-sm text-amber-300 not-italic">
      [COMPLETAR: {children}]
    </span>
  );
}
