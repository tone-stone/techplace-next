/**
 * Note stamped on the `crm_contracts` row that a recurring plan auto-creates as
 * its mirror service. Used to hide that contract from the plain "Servicios"
 * list (it belongs under "Planes recurrentes") even when the `contract_id`
 * link is missing — e.g. pairs created before migration 0032. Kept in its own
 * module so both `"use server"` code and client components can import it.
 */
export const PLAN_MIRROR_NOTE = "Servicio generado automáticamente desde el plan de cobro.";
