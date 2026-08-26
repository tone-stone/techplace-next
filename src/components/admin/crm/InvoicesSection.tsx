import { formatCurrencyMXN, type Invoice } from "@/lib/crm/mock-data";
import StatusBadge from "./StatusBadge";

export default function InvoicesSection({ invoices }: { invoices: Invoice[] }) {
  const totalPending = invoices
    .filter((i) => i.status === "enviada" || i.status === "vencida")
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white">Facturación y cotizaciones ({invoices.length})</h2>
        <p className="text-sm text-gray-400">
          Pendiente por cobrar: <span className="font-bold text-white">{formatCurrencyMXN(totalPending)}</span>
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-150 text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400">
              <th className="pb-3 font-medium">Folio</th>
              <th className="pb-3 font-medium">Cliente</th>
              <th className="pb-3 font-medium">Emitida</th>
              <th className="pb-3 font-medium">Vence</th>
              <th className="pb-3 font-medium">Estado</th>
              <th className="pb-3 text-right font-medium">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="py-3 font-medium text-white">{invoice.number}</td>
                <td className="py-3 text-gray-300">{invoice.client}</td>
                <td className="py-3 text-gray-400">{invoice.issuedDate}</td>
                <td className="py-3 text-gray-400">{invoice.dueDate}</td>
                <td className="py-3">
                  <StatusBadge status={invoice.status} />
                </td>
                <td className="py-3 text-right font-semibold text-white">
                  {formatCurrencyMXN(invoice.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
