// Placeholder data for the TechPlace CRM dashboard UI. Not backed by Supabase yet —
// swap these for real queries once the CRM tables exist.

export type ClientStatus = "lead" | "negociacion" | "activo" | "inactivo";
export type ProjectStatus = "planeacion" | "en_progreso" | "revision" | "completado";
export type InvoiceStatus = "borrador" | "enviada" | "pagada" | "vencida";

export type Client = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: ClientStatus;
  service: string;
  value: number;
  since: string;
};

export type Project = {
  id: string;
  name: string;
  client: string;
  status: ProjectStatus;
  progress: number;
  dueDate: string;
  budget: number;
};

export type Invoice = {
  id: string;
  number: string;
  client: string;
  amount: number;
  status: InvoiceStatus;
  issuedDate: string;
  dueDate: string;
};

export const MOCK_CLIENTS: Client[] = [
  {
    id: "c1",
    name: "Marcela Ibarra",
    company: "Tijuana Innovadora",
    email: "marcela@tijuanainnovadora.org",
    phone: "664 123 4567",
    status: "activo",
    service: "Desarrollo Web",
    value: 45000,
    since: "2026-03-12",
  },
  {
    id: "c2",
    name: "Daniel Prieto",
    company: "Property Dreamz",
    email: "daniel@propertydreamz.com",
    phone: "664 234 5678",
    status: "activo",
    service: "Plataforma Web",
    value: 128000,
    since: "2026-01-22",
  },
  {
    id: "c3",
    name: "Sofía Larrea",
    company: "Noticias 33",
    email: "sofia@noticias33.com",
    phone: "664 345 6789",
    status: "negociacion",
    service: "Ciberseguridad",
    value: 32000,
    since: "2026-07-02",
  },
  {
    id: "c4",
    name: "Rubén Castañeda",
    company: "Old Souls Restaurante",
    email: "ruben@oldsoulsrestaurante.com",
    phone: "664 456 7890",
    status: "activo",
    service: "Desarrollo Web",
    value: 18000,
    since: "2025-11-08",
  },
  {
    id: "c5",
    name: "Alejandra Nuño",
    company: "Cervantes Quijano Abogados",
    email: "alejandra@cqabogados.mx",
    phone: "664 567 8901",
    status: "lead",
    service: "Panel Administrativo",
    value: 60000,
    since: "2026-08-10",
  },
  {
    id: "c6",
    name: "Iván Morales",
    company: "BelIndustrial",
    email: "ivan@belindustrial.com",
    phone: "664 678 9012",
    status: "inactivo",
    service: "SEO Local",
    value: 12000,
    since: "2025-06-15",
  },
  {
    id: "c7",
    name: "Paulina Rentería",
    company: "Rentas TJ",
    email: "paulina@rentastj.com",
    phone: "664 789 0123",
    status: "lead",
    service: "Consultoría IT",
    value: 25000,
    since: "2026-08-20",
  },
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: "p1",
    name: "Rediseño institucional",
    client: "Tijuana Innovadora",
    status: "en_progreso",
    progress: 65,
    dueDate: "2026-09-30",
    budget: 45000,
  },
  {
    id: "p2",
    name: "App de rentas bilingüe",
    client: "Property Dreamz",
    status: "revision",
    progress: 90,
    dueDate: "2026-09-10",
    budget: 128000,
  },
  {
    id: "p3",
    name: "Auditoría de seguridad",
    client: "Noticias 33",
    status: "planeacion",
    progress: 10,
    dueDate: "2026-10-15",
    budget: 32000,
  },
  {
    id: "p4",
    name: "Sitio web + reservaciones",
    client: "Old Souls Restaurante",
    status: "completado",
    progress: 100,
    dueDate: "2026-07-01",
    budget: 18000,
  },
  {
    id: "p5",
    name: "Panel de gestión de casos",
    client: "Cervantes Quijano Abogados",
    status: "planeacion",
    progress: 5,
    dueDate: "2026-11-20",
    budget: 60000,
  },
];

export const MOCK_INVOICES: Invoice[] = [
  {
    id: "i1",
    number: "TP-2026-014",
    client: "Property Dreamz",
    amount: 64000,
    status: "pagada",
    issuedDate: "2026-08-01",
    dueDate: "2026-08-15",
  },
  {
    id: "i2",
    number: "TP-2026-015",
    client: "Tijuana Innovadora",
    amount: 22500,
    status: "enviada",
    issuedDate: "2026-08-12",
    dueDate: "2026-08-27",
  },
  {
    id: "i3",
    number: "TP-2026-016",
    client: "Old Souls Restaurante",
    amount: 18000,
    status: "pagada",
    issuedDate: "2026-07-01",
    dueDate: "2026-07-15",
  },
  {
    id: "i4",
    number: "TP-2026-017",
    client: "Cervantes Quijano Abogados",
    amount: 15000,
    status: "vencida",
    issuedDate: "2026-07-20",
    dueDate: "2026-08-04",
  },
  {
    id: "i5",
    number: "TP-2026-018",
    client: "Noticias 33",
    amount: 32000,
    status: "borrador",
    issuedDate: "2026-08-22",
    dueDate: "2026-09-05",
  },
];

export function formatCurrencyMXN(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}
