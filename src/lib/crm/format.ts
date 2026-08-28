/**
 * Shared money formatter for the CRM: Mexican pesos with no decimal places
 * (e.g. `$12,500`), used consistently across every CRM section and modal.
 */
export function formatCurrencyMXN(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}
