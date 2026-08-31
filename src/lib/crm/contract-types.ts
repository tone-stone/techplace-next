/**
 * Pure types + constants + mappers for the service catalog and client
 * contracts. Kept out of the `"use server"` files (`services.ts`,
 * `contracts.ts`), which may only export async functions.
 */

export type ServiceUnit = "hora" | "mes" | "proyecto";
export const SERVICE_UNITS: ServiceUnit[] = ["hora", "mes", "proyecto"];
export const UNIT_LABELS: Record<ServiceUnit, string> = {
  hora: "Por hora",
  mes: "Mensual",
  proyecto: "Por proyecto",
};

export type ContractStatus =
  | "borrador"
  | "activo"
  | "suspendido"
  | "vencido"
  | "cancelado";
export const CONTRACT_STATUSES: ContractStatus[] = [
  "borrador",
  "activo",
  "suspendido",
  "vencido",
  "cancelado",
];
export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  borrador: "Borrador",
  activo: "Activo",
  suspendido: "Suspendido",
  vencido: "Vencido",
  cancelado: "Cancelado",
};

export type BillingCycle = "mensual" | "trimestral" | "anual";

export type CrmService = {
  id: string;
  name: string;
  description: string | null;
  unit: ServiceUnit;
  defaultRate: number;
  active: boolean;
  createdAt: string;
};

export type CrmContract = {
  id: string;
  clientId: string;
  title: string;
  status: ContractStatus;
  startDate: string | null;
  endDate: string | null;
  includedHours: number | null;
  slaHours: number | null;
  billingAmount: number | null;
  billingCycle: BillingCycle | null;
  notes: string | null;
  createdAt: string;
};

export type ContractServiceLine = {
  id: string;
  contractId: string;
  serviceId: string;
  quantity: number;
  rate: number | null;
  notes: string | null;
};

export type ContractDetail = {
  contract: CrmContract;
  services: ContractServiceLine[];
};

export function mapService(row: {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  default_rate: number | string;
  active: boolean;
  created_at: string;
}): CrmService {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    unit: row.unit as ServiceUnit,
    defaultRate: Number(row.default_rate),
    active: row.active,
    createdAt: row.created_at,
  };
}

export function mapContract(row: {
  id: string;
  client_id: string;
  title: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  included_hours: number | string | null;
  sla_hours: number | null;
  billing_amount: number | string | null;
  billing_cycle: string | null;
  notes: string | null;
  created_at: string;
}): CrmContract {
  return {
    id: row.id,
    clientId: row.client_id,
    title: row.title,
    status: row.status as ContractStatus,
    startDate: row.start_date,
    endDate: row.end_date,
    includedHours: row.included_hours == null ? null : Number(row.included_hours),
    slaHours: row.sla_hours,
    billingAmount: row.billing_amount == null ? null : Number(row.billing_amount),
    billingCycle: (row.billing_cycle as BillingCycle | null) ?? null,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export function mapContractService(row: {
  id: string;
  contract_id: string;
  service_id: string;
  quantity: number | string;
  rate: number | string | null;
  notes: string | null;
}): ContractServiceLine {
  return {
    id: row.id,
    contractId: row.contract_id,
    serviceId: row.service_id,
    quantity: Number(row.quantity),
    rate: row.rate == null ? null : Number(row.rate),
    notes: row.notes,
  };
}
