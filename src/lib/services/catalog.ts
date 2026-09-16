/**
 * Registry of TechPlace's service offerings. One entry per service, shared
 * by three places so a service is described in a single spot:
 *
 *   - the landing "Servicios" section (`cardDescription` / `cardCtaLabel`)
 *   - its detail page at `/servicios/[slug]`
 *   - the `/servicios` index and the sitemap
 *
 * Only services with `published: true` render a full detail page; the rest
 * show a short placeholder page until their content is written.
 *
 * Prices are a starting point for standard projects and are calibrated to
 * the Mexican market (2025–2026). Each `priceMXN` carries a comment with its
 * market range, the source, and the weighted average; the full analysis and
 * sources live in `docs/precios-mercado.md`. `null` in a package price means
 * "a cotización" (custom quote).
 *
 * TODO: once prices are confirmed with the team, seed the fixed-price
 * packages into the CRM service catalog (`crm_services`) with a migration so
 * quotes/contracts can pick them as line items.
 */
import {
  BrainCircuit,
  Network,
  Server,
  ShieldCheck,
  Smartphone,
  SquareCode,
  type LucideIcon,
} from "lucide-react";

/** A fixed-price tier (or "a cotización" when both prices are `null`). */
export type ServicePackage = {
  name: string;
  /** Starting price in MXN, or `null` for "a cotización". */
  priceMXN: number | null;
  /** Approximate starting price in USD, or `null` for "a cotización". */
  priceUSD: number | null;
  /** Billing period shown after the price, e.g. "mes". Omit for a one-off price. */
  period?: string;
  blurb: string;
  features: string[];
  /** Visually emphasized as the recommended option. */
  highlighted?: boolean;
  /** Low end of the comparable Mexican-market range (MXN), for the price bar. */
  marketLow?: number;
  /** High end of the comparable market range (MXN). */
  marketHigh?: number;
  /** Render the high end as "$X+" (open-ended range). */
  marketPlus?: boolean;
};

/** One "qué desarrollamos" entry on a detail page. */
export type ServiceDeliverable = { title: string; description: string };

/** A concrete "where you'd use this" example on a detail page. */
export type ServiceUseCase = { title: string; description: string };

/** A product TechPlace has already built, shown as proof of capability. */
export type ServiceShowcaseItem = {
  /** Product name, may include a trailing emoji (e.g. "GastroGo 🍽️"). */
  name: string;
  summary: string;
  highlights?: string[];
};

/** One process step ("cómo trabajamos"). */
export type ServiceStep = { title: string; description: string };

/** A grouped list of technologies shown as chips. */
export type ServiceStackGroup = { group: string; items: string[] };

/** A single frequently-asked question. */
export type ServiceFaq = { q: string; a: string };

export type Service = {
  slug: string;
  icon: LucideIcon;
  title: string;

  // --- Landing card (`#servicios`) ---
  /** Short pitch shown on the landing card. No technology lists here. */
  cardDescription: string;
  /** Call-to-action label on the landing card. */
  cardCtaLabel: string;

  // --- Detail page (`/servicios/[slug]`) ---
  /** When false, the detail page renders a short "coming soon" placeholder. */
  published: boolean;
  /** One-line hero subtitle. */
  tagline: string;
  /** Intro paragraphs under the hero. */
  intro: string[];
  whatWeBuild?: ServiceDeliverable[];
  /** Products or client engagements shown as proof of capability. */
  showcase?: ServiceShowcaseItem[];
  /** Heading for the showcase section. Default: "Soluciones que hemos desarrollado". */
  showcaseTitle?: string;
  /** Subtitle under the showcase heading. */
  showcaseNote?: string;
  /** "Casos de uso": concrete examples of where a client would use this. */
  useCases?: ServiceUseCase[];
  howWeWork?: ServiceStep[];
  stack?: ServiceStackGroup[];
  packages?: ServicePackage[];
  /** Note shown under the pricing grid. */
  quoteNote?: string;
  faqs?: ServiceFaq[];
};

export const SERVICES: Service[] = [
  {
    slug: "desarrollo-web",
    icon: SquareCode,
    title: "Desarrollo web a la medida",
    cardDescription:
      "No solo hacemos sitios web, construimos soluciones digitales. Desde landing pages y sitios corporativos hasta e-commerce, aplicaciones web, CRM, ERP, sistemas de soporte IT y plataformas SaaS.",
    cardCtaLabel: "Ver el servicio y precios",

    published: true,
    tagline:
      "De una idea a una solución completa: sitios, tiendas y plataformas hechos a la medida de tu negocio.",
    intro: [
      "En TechPlace desarrollamos software web de principio a fin. Diseñamos la interfaz, programamos el front y el back, montamos la base de datos y desplegamos en producción — todo con un mismo equipo de ingeniería.",
      "Trabajamos tanto en código puro (HTML, CSS y JavaScript) cuando el proyecto pide máximo rendimiento y control, como con frameworks modernos —React, Vue y Next.js— cuando necesitas una aplicación rica e interactiva. En el back usamos Node.js, NestJS, PHP o Python según lo que mejor se ajuste al proyecto, con bases de datos relacionales (PostgreSQL, MySQL) o no relacionales (MongoDB).",
      "Aplicamos desarrollo asistido por IA en todo el ciclo para entregar más rápido, sin sacrificar calidad, escalabilidad ni SEO técnico.",
    ],
    whatWeBuild: [
      {
        title: "Landing pages",
        description:
          "Páginas de una sola meta: captar leads o lanzar un producto. Carga en milisegundos, copy orientado a conversión y medición desde el primer clic.",
      },
      {
        title: "Sitios corporativos",
        description:
          "La cara digital de tu empresa: institucional, multi-idioma, con blog y un CMS para que tu equipo edite el contenido sin depender de nosotros.",
      },
      {
        title: "Tiendas en línea (e-commerce)",
        description:
          "Catálogo, carrito, pagos y envíos. Integración con pasarelas mexicanas e internacionales y con tu sistema de inventario.",
      },
      {
        title: "Aplicaciones web a la medida",
        description:
          "Software que vive en el navegador: portales de clientes, paneles internos, calculadoras, reservas. Diseñado alrededor de tu proceso, no de una plantilla.",
      },
      {
        title: "CRM, ERP y sistemas de gestión",
        description:
          "Centraliza clientes, ventas, inventario, facturación y operación en una sola herramienta, con los permisos y reportes que tu negocio necesita.",
      },
      {
        title: "Sistemas de soporte IT",
        description:
          "Mesa de ayuda con tickets, SLAs, seguimiento de horas y contratos. El mismo tipo de sistema que usamos para dar soporte a nuestros clientes.",
      },
      {
        title: "Plataformas SaaS",
        description:
          "Producto multi-tenant listo para vender por suscripción: registro, planes, cobros recurrentes y aislamiento de datos por cliente.",
      },
    ],
    useCases: [
      {
        title: "Despacho que solo llegaba a clientes por recomendación",
        description:
          "Un despacho contable no aparecía en Google y perdía prospectos. Le hicimos un sitio corporativo con blog y formularios que entran directo a su correo. Hoy la mitad de sus consultas nuevas llegan por búsquedas.",
      },
      {
        title: "Tienda física que quería vender en línea",
        description:
          "Una distribuidora tomaba pedidos por WhatsApp con un catálogo en PDF. Montamos un e-commerce con pago en línea, cálculo de envíos y panel de pedidos conectado a su inventario. Ahora procesa órdenes las 24 horas sin captura manual.",
      },
      {
        title: "Operación entera en hojas de cálculo",
        description:
          "Una empresa de servicios manejaba clientes, cotizaciones y proyectos en un Excel compartido que ya no daba más. Le desarrollamos una plataforma a la medida con roles, historial y reportes. El cierre de mes pasó de días a horas.",
      },
      {
        title: "Herramienta interna con potencial de producto",
        description:
          "Un cliente tenía un sistema interno que otras empresas de su ramo querían usar. Lo convertimos en una plataforma SaaS multi-tenant con registro, planes y cobro recurrente, y hoy lo operan como producto propio.",
      },
    ],
    howWeWork: [
      {
        title: "Descubrimiento",
        description:
          "Entendemos tu negocio, tus usuarios y el objetivo del proyecto. Salimos con un alcance escrito y un presupuesto cerrado.",
      },
      {
        title: "Diseño",
        description:
          "Wireframes y diseño visual de las pantallas clave. Lo validamos contigo antes de escribir código.",
      },
      {
        title: "Desarrollo",
        description:
          "Entregas parciales cada 1–2 semanas para que veas avance real y ajustes sobre la marcha.",
      },
      {
        title: "Pruebas y lanzamiento",
        description:
          "QA, optimización de rendimiento y SEO técnico, despliegue en producción y capacitación a tu equipo.",
      },
      {
        title: "Soporte y evolución",
        description:
          "Garantía posterior a la entrega y planes de mantenimiento para seguir mejorando el producto.",
      },
    ],
    stack: [
      { group: "Front", items: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Vue", "Next.js"] },
      { group: "Back", items: ["Node.js", "NestJS", "PHP", "Python"] },
      { group: "Bases de datos", items: ["PostgreSQL", "MySQL", "MongoDB"] },
      { group: "Infraestructura", items: ["Vercel", "AWS", "Google Cloud", "Docker"] },
      { group: "IA en el desarrollo", items: ["ChatGPT", "Claude Code", "Gemini", "Grok", "Cursor"] },
    ],
    packages: [
      {
        name: "Landing Page",
        // Mercado MX ~$7,000–$22,000 (BastianSoft 2025); promedio ~$12,000. Ver docs/precios-mercado.md
        priceMXN: 12000,
        priceUSD: 650,
        marketLow: 7000,
        marketHigh: 22000,
        blurb: "Una página, un objetivo.",
        features: [
          "1 a 3 secciones a la medida",
          "Diseño responsivo original (sin plantilla)",
          "Formulario de contacto + WhatsApp",
          "SEO on-page y analítica",
          "Publicación y dominio configurado",
          "Entrega en 1–2 semanas",
        ],
      },
      {
        name: "Sitio Corporativo",
        // Mercado MX ~$18,000–$55,000 (BastianSoft 2025); promedio ~$38,000. Ver docs/precios-mercado.md
        priceMXN: 38000,
        priceUSD: 2050,
        marketLow: 18000,
        marketHigh: 55000,
        blurb: "Tu empresa en la web, editable por tu equipo.",
        highlighted: true,
        features: [
          "Hasta 8 páginas",
          "CMS para editar textos, imágenes y blog",
          "Multi-idioma opcional",
          "SEO técnico y velocidad optimizada",
          "Integraciones (formularios, CRM, chat)",
          "Capacitación de uso",
          "Entrega en 3–5 semanas",
        ],
      },
      {
        name: "E-commerce",
        // Mercado MX ~$35,000–$95,000 básico (BastianSoft / Tiendanube); promedio ~$60,000. Ver docs/precios-mercado.md
        priceMXN: 60000,
        priceUSD: 3250,
        marketLow: 35000,
        marketHigh: 95000,
        blurb: "Vende en línea con todo integrado.",
        features: [
          "Catálogo con variantes de producto",
          "Carrito y checkout",
          "Pasarela de pago (Stripe, Mercado Pago, PayPal)",
          "Cálculo de envíos y cupones",
          "Panel de pedidos e inventario",
          "Entrega en 5–8 semanas",
        ],
      },
      {
        name: "Plataforma a la medida",
        // A cotización. Mercado MX ~$150,000–$600,000+ (BastianSoft plataformas headless). Ver docs/precios-mercado.md
        priceMXN: null,
        priceUSD: null,
        marketLow: 150000,
        marketHigh: 600000,
        marketPlus: true,
        blurb: "CRM, ERP, SaaS o sistema interno.",
        features: [
          "Alcance definido contigo en la fase de descubrimiento",
          "Arquitectura full-stack a la medida",
          "Roles, permisos y reportería",
          "Integraciones con tus sistemas actuales",
          "Presupuesto y calendario cerrados antes de empezar",
        ],
      },
    ],
    quoteNote:
      "Los precios son un punto de partida para proyectos estándar e incluyen diseño, desarrollo y publicación. El costo final depende del alcance, las integraciones y el contenido. Todo proyecto arranca con una propuesta escrita y un presupuesto cerrado — sin sorpresas.",
    faqs: [
      {
        q: "¿Los precios incluyen el diseño?",
        a: "Sí. Todos nuestros proyectos incluyen diseño original y responsivo; no partimos de plantillas compradas salvo que tú lo prefieras para reducir el costo.",
      },
      {
        q: "¿De quién es el código cuando terminan?",
        a: "Tuyo. Al liquidar el proyecto te cedemos los derechos patrimoniales del código desarrollado a la medida, conforme a nuestro contrato de desarrollo a la medida.",
      },
      {
        q: "¿Dan mantenimiento después de entregar?",
        a: "Sí. Cada entrega incluye un periodo de garantía y ofrecemos planes de mantenimiento mensual para actualizaciones, soporte y mejoras.",
      },
      {
        q: "¿Cuánto tarda un proyecto?",
        a: "Una landing, 1–2 semanas; un sitio corporativo, 3–5; un e-commerce, 5–8; una plataforma a la medida se estima en la fase de descubrimiento.",
      },
      {
        q: "¿Trabajan con clientes fuera de Tijuana?",
        a: "Sí. Operamos desde Tijuana y trabajamos de forma remota con clientes en todo México y en Estados Unidos.",
      },
      {
        q: "¿Pueden retomar un proyecto que empezó otra agencia?",
        a: "En la mayoría de los casos sí. Hacemos una auditoría del código actual y te decimos si conviene continuarlo o rehacer ciertas partes.",
      },
    ],
  },

  {
    slug: "inteligencia-artificial",
    icon: BrainCircuit,
    title: "Inteligencia artificial y automatización",
    cardDescription:
      "Menos tareas repetitivas, más tiempo para hacer crecer tu negocio. Automatizamos tu operación con IA y n8n: conectamos WhatsApp, correo y tus sistemas en asistentes, respuestas automáticas, reportes y flujos a la medida.",
    cardCtaLabel: "Explorar servicio",

    published: true,
    tagline:
      "Convertimos procesos manuales en flujos inteligentes: IA y n8n conectando tus herramientas, tus canales y tus datos.",
    intro: [
      "La inteligencia artificial y la automatización sirven para lo mismo: quitarle a tu equipo el trabajo repetitivo. Conectamos las herramientas que ya usas —WhatsApp, correo, tu CRM, tus hojas de cálculo— y montamos flujos que responden, notifican, registran y reportan solos.",
      "Trabajamos con n8n como motor de automatización y con las APIs de los principales modelos de IA (OpenAI, Anthropic y otros) para las partes que requieren entender lenguaje: clasificar un mensaje, redactar una respuesta, resumir un documento o consultar tu información en lenguaje natural. Cada flujo queda monitoreado, con alertas si algo falla.",
      "También usamos IA internamente para acelerar etapas del desarrollo, el análisis, las pruebas y la documentación — siempre con revisión y control técnico de por medio. Es una herramienta nuestra, no un atajo que baje la calidad de lo que entregamos.",
    ],
    whatWeBuild: [
      {
        title: "Automatización inteligente",
        description:
          "Flujos que conectan tus sistemas y canales: formulario → CRM, lead → WhatsApp, notificaciones automáticas, generación de documentos, y reportes y gráficas que se arman y se envían solos. Motor: n8n, webhooks y APIs.",
      },
      {
        title: "Soluciones con inteligencia artificial",
        description:
          "Chatbots y asistentes —para clientes o para uso interno—, consulta de tu información en lenguaje natural, generación y análisis de contenido, procesamiento de documentos e integración de APIs de IA dentro de tus aplicaciones.",
      },
      {
        title: "IA aplicada al desarrollo",
        description:
          "Usamos herramientas de IA —ChatGPT, Claude Code, Gemini, Grok y Cursor— para acelerar ciertas etapas del desarrollo de software, el análisis, las pruebas y la documentación, siempre con revisión y control técnico en cada entrega.",
      },
    ],
    useCases: [
      {
        title: "Leads que se enfriaban antes de la primera respuesta",
        description:
          "Una inmobiliaria recibía consultas por Facebook, web y WhatsApp y tardaba horas en contestar. Un flujo en n8n registra cada lead en el CRM, manda una primera respuesta con IA y avisa al asesor. El primer contacto bajó de horas a segundos.",
      },
      {
        title: "Soporte respondiendo lo mismo todo el día",
        description:
          "Un negocio contestaba una y otra vez las mismas preguntas de horarios, precios y estatus de pedido. Le hicimos un asistente con IA conectado a su información real que resuelve la mayoría de las consultas y escala a una persona solo cuando hace falta.",
      },
      {
        title: "Reportes que alguien armaba a mano cada lunes",
        description:
          "El equipo dedicaba media mañana a copiar datos de varias fuentes a un reporte. Automatizamos la extracción, el cálculo y el envío: cada lunes el reporte con gráficas llega solo al correo de dirección.",
      },
      {
        title: "Documentos que había que leer y capturar",
        description:
          "Un área administrativa capturaba a mano los datos de contratos y facturas que llegaban por correo. Un flujo con IA los lee, extrae los campos y los deja en el sistema, con una persona validando solo los casos dudosos.",
      },
    ],
    howWeWork: [
      {
        title: "Mapeo del proceso",
        description:
          "Revisamos la tarea o el flujo que quieres automatizar: qué lo dispara, qué pasos tiene, dónde se pierde tiempo y qué sistemas toca.",
      },
      {
        title: "Diseño del flujo",
        description:
          "Definimos el flujo completo —disparadores, integraciones, puntos de decisión y dónde entra la IA— y lo validamos contigo antes de construirlo.",
      },
      {
        title: "Construcción",
        description:
          "Montamos el flujo en n8n, conectamos las APIs y las cuentas necesarias y lo probamos con casos reales.",
      },
      {
        title: "Puesta en marcha",
        description:
          "Lo dejamos corriendo con monitoreo y alertas, y capacitamos a tu equipo para operarlo y ajustarlo.",
      },
      {
        title: "Mejora continua",
        description:
          "Ajustamos, agregamos pasos y cubrimos casos nuevos conforme tu operación cambia.",
      },
    ],
    stack: [
      { group: "Automatización", items: ["n8n", "Webhooks", "APIs REST", "Cron"] },
      {
        group: "Inteligencia artificial",
        items: ["OpenAI", "Anthropic", "Embeddings / RAG", "Whisper (voz)"],
      },
      {
        group: "Canales",
        items: ["WhatsApp Business API", "Gmail / Outlook", "Telegram", "Slack"],
      },
      {
        group: "Datos y reportes",
        items: ["PostgreSQL", "Google Sheets", "Looker Studio", "Generación de PDF"],
      },
      {
        group: "IA en el desarrollo",
        items: ["ChatGPT", "Claude Code", "Gemini", "Grok", "Cursor"],
      },
    ],
    packages: [
      {
        name: "Automatización puntual",
        // Mercado MX ~$15,000–$40,000 (GNB Labs "flujo simple" $15k–$35k); promedio ~$25,000. Ver docs/precios-mercado.md
        priceMXN: 20000,
        priceUSD: 1080,
        marketLow: 15000,
        marketHigh: 40000,
        blurb: "Un flujo, resuelto de principio a fin.",
        features: [
          "1 proceso automatizado (ej. leads → CRM + WhatsApp)",
          "Integración con tus cuentas y sistemas",
          "Pruebas con casos reales",
          "Monitoreo y alertas básicas",
          "Documentación del flujo",
        ],
      },
      {
        name: "Proyecto de automatización + IA",
        // Mercado MX ~$60,000–$200,000 (GNB "multi-flujo con IA" $80k–$250k; chatbots $60k–$180k); promedio ~$110,000. Ver docs/precios-mercado.md
        priceMXN: 95000,
        priceUSD: 5130,
        marketLow: 60000,
        marketHigh: 200000,
        blurb: "Varios flujos y un asistente, conectados entre sí.",
        highlighted: true,
        features: [
          "Mapeo de procesos de un área completa",
          "Varios flujos en n8n integrados",
          "Asistente o chatbot con IA sobre tu información",
          "Reportes y gráficas automáticos",
          "Capacitación al equipo",
        ],
      },
      {
        name: "Retainer de operación",
        // Mercado MX ~$18,000–$40,000/mes (GNB retainer Starter $20k / Growth $40k); promedio ~$25,000/mes. Ver docs/precios-mercado.md
        priceMXN: 20000,
        priceUSD: 1080,
        period: "mes",
        marketLow: 18000,
        marketHigh: 40000,
        blurb: "Automatización e IA como servicio continuo.",
        features: [
          "Bolsa de horas mensual",
          "Nuevos flujos y ajustes bajo demanda",
          "Monitoreo activo y corrección de fallas",
          "Optimización y nuevos casos de uso",
          "Facturación mensual",
        ],
      },
    ],
    quoteNote:
      "Las automatizaciones se cotizan por alcance: número de flujos, sistemas a integrar y volumen. Te damos un presupuesto cerrado después del mapeo inicial. Algunos costos de terceros (API de WhatsApp, créditos de IA) se facturan aparte o directamente a tu cuenta.",
    faqs: [
      {
        q: "¿Qué es n8n?",
        a: "Es la plataforma de automatización que usamos como motor de los flujos: conecta apps y APIs sin depender de un servicio cerrado. Puede vivir en tu propia infraestructura, así que los datos y las integraciones quedan bajo tu control.",
      },
      {
        q: "¿Necesito mis propias cuentas de OpenAI o de WhatsApp?",
        a: "En general sí: la API de WhatsApp Business y los créditos de IA se contratan a tu nombre para que el servicio sea tuyo y el costo sea transparente. Te ayudamos a darlas de alta y configurarlas.",
      },
      {
        q: "¿Mi información se queda en la IA?",
        a: "No para entrenar modelos. Usamos las APIs en el modo que no retiene datos para entrenamiento, y en los casos sensibles el procesamiento se puede acotar o mantener dentro de tu infraestructura.",
      },
      {
        q: "¿Se puede conectar con el sistema que ya uso?",
        a: "Casi siempre. Si tiene API o webhooks —la mayoría de CRMs, ERPs, hojas de cálculo y herramientas SaaS los tienen—, lo conectamos. Si no, buscamos una vía alterna.",
      },
      {
        q: "¿Qué pasa si un flujo falla?",
        a: "Cada flujo queda con monitoreo y alertas: si algo se rompe, se te avisa y se reintenta automáticamente cuando aplica. Con retainer, nosotros lo corregimos.",
      },
      {
        q: "¿Cuánto tarda montar una automatización?",
        a: "Un flujo puntual, de días a 2 semanas. Un proyecto de varios flujos con IA, de 3 a 6 semanas según las integraciones.",
      },
    ],
  },

  {
    slug: "aplicaciones-moviles",
    icon: Smartphone,
    title: "Desarrollo de aplicaciones multiplataforma",
    cardDescription:
      "Una solución, todos tus dispositivos. Creamos aplicaciones para iOS, Android y Web con una sola base de código: desde productos especializados hasta plataformas completas para operar tu negocio, con integraciones, notificaciones y sistemas a la medida.",
    cardCtaLabel: "Explorar servicio",

    published: true,
    tagline:
      "Una sola base de código para iOS, Android y Web — desde una app especializada hasta el sistema que opera tu negocio.",
    intro: [
      "Desarrollamos aplicaciones multiplataforma con React Native: una sola base de código que corre en iOS, Android y Web. Eso significa un producto coherente en todos lados, menos tiempo de desarrollo y un solo lugar donde corregir y mejorar.",
      "Hacemos desde apps especializadas para un público concreto hasta plataformas completas de operación —punto de venta, comandas, inventarios, administración— con integración a APIs y sistemas, notificaciones push y trabajo sin conexión. Publicamos en App Store y Google Play y damos mantenimiento evolutivo.",
    ],
    whatWeBuild: [
      {
        title: "Apps de negocio a la medida",
        description:
          "Portales de clientes, apps para equipos en campo, catálogos, reservas y programas de lealtad. Diseñadas alrededor de tu proceso, no de una plantilla.",
      },
      {
        title: "Sistemas de punto de venta y operación",
        description:
          "POS, comandas, inventarios y administración para restaurantes y comercios —como GastroGo—, todo en un mismo producto multiplataforma.",
      },
      {
        title: "Productos digitales para un nicho",
        description:
          "Apps especializadas que resuelven una necesidad concreta de un público, como Hueso Time para músicos.",
      },
      {
        title: "Integración con tus sistemas",
        description:
          "Conexión con tu ERP, CRM, pasarelas de pago, facturación o APIs propias, con sincronización y trabajo sin conexión cuando hace falta.",
      },
      {
        title: "Publicación y mantenimiento",
        description:
          "Gestionamos el alta, las fichas y las actualizaciones en App Store y Google Play, y el mantenimiento evolutivo del producto.",
      },
    ],
    showcase: [
      {
        name: "GastroGo 🍽️",
        summary:
          "Plataforma de punto de venta y operación para restaurantes y comercios pequeños. Cubre la operación completa y corre en Web, iOS y Android con la misma cuenta.",
        highlights: [
          "Punto de venta para restaurante y para mini comercio",
          "Comandas y flujo de meseros a cocina",
          "Inventarios y catálogo de productos",
          "Reportes de ventas y panel de administración",
          "Multiplataforma: Web + iOS + Android",
        ],
      },
      {
        name: "Hueso Time 🎵",
        summary:
          "App para músicos que organiza el repertorio y genera setlists automáticamente. Pensada para usarse antes y durante la presentación.",
        highlights: [
          "Gestión de repertorio",
          "Generación automática de setlists",
          "iOS, Android y Web",
        ],
      },
    ],
    useCases: [
      {
        title: "Técnicos en campo coordinados por llamada y papel",
        description:
          "Una empresa de mantenimiento asignaba trabajos por teléfono y llenaba formatos en papel. Le hicimos una app con órdenes de trabajo, fotos, firma del cliente y sincronización cuando hay señal. La oficina ve el avance en tiempo real.",
      },
      {
        title: "Programa de lealtad que vivía en papel",
        description:
          "Una cadena de cafeterías premiaba a clientes frecuentes con sellos en una tarjeta. Le hicimos una app con registro, puntos y notificaciones de promociones; el cliente la trae en el teléfono y la cafetería ve el consumo real.",
      },
    ],
    howWeWork: [
      {
        title: "Definición del producto",
        description:
          "Aterrizamos qué hace la app, para quién y en qué plataformas. Salimos con un alcance escrito y un presupuesto cerrado.",
      },
      {
        title: "Diseño de la experiencia",
        description:
          "Flujos y pantallas clave, pensadas para móvil y para web. Las validamos contigo antes de programar.",
      },
      {
        title: "Desarrollo multiplataforma",
        description:
          "Una base de código en React Native para iOS, Android y Web, con entregas parciales cada 1–2 semanas.",
      },
      {
        title: "Pruebas en dispositivos reales",
        description:
          "QA en teléfonos y navegadores, ajustes de rendimiento y preparación de las fichas de tienda.",
      },
      {
        title: "Publicación y evolución",
        description:
          "Alta en App Store y Google Play, y mantenimiento evolutivo con nuevas versiones.",
      },
    ],
    stack: [
      { group: "App", items: ["React Native", "Expo", "TypeScript"] },
      { group: "Web", items: ["React", "Next.js"] },
      { group: "Backend y datos", items: ["Node.js", "PostgreSQL", "APIs REST"] },
      {
        group: "Servicios",
        items: ["Notificaciones push", "Pagos", "App Store", "Google Play"],
      },
      {
        group: "IA en el desarrollo",
        items: ["ChatGPT", "Claude Code", "Gemini", "Grok", "Cursor"],
      },
    ],
    packages: [
      {
        name: "App a la medida (MVP)",
        // Mercado MX ~$50,000–$120,000 (Creaun.app MVP básico desde $50k, pro $80k–$120k); promedio ~$70,000. Ver docs/precios-mercado.md
        priceMXN: 60000,
        priceUSD: 3250,
        marketLow: 50000,
        marketHigh: 120000,
        blurb: "La primera versión funcional de tu idea.",
        features: [
          "Pantallas y flujo principal definidos contigo",
          "iOS, Android y Web desde una base de código",
          "Conexión a un backend nuevo o a tu API",
          "Publicación en App Store y Google Play",
          "Entrega en 6–10 semanas",
        ],
      },
      {
        name: "App de negocio",
        // Mercado MX ~$120,000–$300,000 (Creaun app completa $120k–$200k, compleja $150k–$300k; Magokoro sencilla $150k+); promedio ~$170,000. Ver docs/precios-mercado.md
        priceMXN: 150000,
        priceUSD: 8100,
        marketLow: 120000,
        marketHigh: 300000,
        blurb: "Varios módulos, roles e integraciones.",
        highlighted: true,
        features: [
          "Varios módulos y roles de usuario",
          "Integración con tus sistemas (ERP, CRM, pagos)",
          "Notificaciones push y trabajo sin conexión",
          "Panel administrativo web",
          "Entrega en 3–5 meses",
        ],
      },
      {
        name: "Plataforma de operación (POS / ERP)",
        // A cotización. Mercado MX ~$300,000–$600,000+ (Magokoro app media $400k–$900k). Ver docs/precios-mercado.md
        priceMXN: null,
        priceUSD: null,
        marketLow: 300000,
        marketHigh: 600000,
        marketPlus: true,
        blurb: "Tipo GastroGo: la operación completa de tu negocio.",
        features: [
          "Punto de venta, comandas e inventarios",
          "Administración, productos y reportes",
          "Multiplataforma y multiusuario",
          "Alcance y calendario cerrados en la definición",
        ],
      },
    ],
    quoteNote:
      "El costo depende del número de pantallas, las integraciones y si hay backend nuevo o se conecta a uno existente. Las cuentas de desarrollador de App Store (US$99/año) y Google Play (US$25, pago único) se registran a tu nombre. Presupuesto cerrado tras la definición del producto.",
    faqs: [
      {
        q: "¿Una sola base de código para las tres plataformas?",
        a: "Sí. Con React Native el mismo código corre en iOS, Android y Web. Se ajustan detalles por plataforma, pero no se desarrolla tres veces.",
      },
      {
        q: "¿La app funciona sin conexión?",
        a: "Puede. Para operación crítica —como un punto de venta— guardamos los datos en el dispositivo y sincronizamos cuando vuelve la señal.",
      },
      {
        q: "¿Ustedes publican la app en las tiendas?",
        a: "Sí. Gestionamos el alta, las fichas y las actualizaciones en App Store y Google Play. Las cuentas de desarrollador van a tu nombre.",
      },
      {
        q: "¿De quién es el código?",
        a: "Tuyo, al liquidar el proyecto, conforme a nuestro contrato de desarrollo a la medida.",
      },
      {
        q: "¿Pueden retomar una app que ya existe?",
        a: "Depende de con qué esté hecha. Si es React Native o Flutter, normalmente sí; si es nativa pura, evaluamos si conviene continuar o migrar.",
      },
      {
        q: "¿Cuánto tarda?",
        a: "Un MVP, de 6 a 10 semanas. Una plataforma de operación con varios módulos, de 3 a 6 meses según el alcance.",
      },
    ],
  },

  {
    slug: "ciberseguridad",
    icon: ShieldCheck,
    title: "Ciberseguridad y pentesting",
    cardDescription:
      "Antes de que lo encuentre un atacante, lo encontramos nosotros. Probamos tus aplicaciones, servidores y redes buscando la forma de entrar, y te entregamos un informe con los hallazgos priorizados y cómo cerrarlos.",
    cardCtaLabel: "Explorar servicio",

    published: true,
    tagline:
      "Encontramos las vulnerabilidades antes que un atacante — y te decimos cómo cerrarlas.",
    intro: [
      "Evaluamos la seguridad de lo que expones: aplicaciones web y móviles, APIs, servidores y redes. Lo hacemos con la misma metodología que usaría un atacante real —reconocimiento, explotación y escalada— pero de forma controlada y acordada contigo.",
      "El entregable no es una lista de alertas de un escáner: es un informe con cada hallazgo explicado, su riesgo real para tu negocio, la evidencia y los pasos concretos para corregirlo, más un resumen ejecutivo para dirección.",
      "También hacemos hardening y acompañamiento: dejar servidores, redes y pipelines con una configuración segura, y guiar a tu equipo para que la seguridad no dependa de una sola auditoría al año.",
    ],
    whatWeBuild: [
      {
        title: "Pruebas de penetración (pentesting)",
        description:
          "Intento controlado de vulnerar tus aplicaciones web y móviles, APIs e infraestructura, siguiendo OWASP y buenas prácticas del sector. Con o sin credenciales, según el escenario que quieras probar.",
      },
      {
        title: "Análisis de vulnerabilidades",
        description:
          "Barrido de sistemas, dependencias y configuraciones para detectar fallas conocidas, versiones sin parchar y servicios expuestos de más.",
      },
      {
        title: "Auditoría de seguridad",
        description:
          "Revisión de arquitectura, manejo de credenciales, cifrado, respaldos, permisos y registro de eventos contra un checklist de referencia.",
      },
      {
        title: "Hardening de servidores y redes",
        description:
          "Configuración segura de servidores Linux, firewall, accesos SSH, segmentación de red y endurecimiento de contenedores Docker.",
      },
      {
        title: "Seguridad en el ciclo de desarrollo",
        description:
          "Revisión de repositorios y pipelines: secretos filtrados en Git, control de accesos, escaneo de dependencias y despliegues seguros.",
      },
      {
        title: "Retest y acompañamiento",
        description:
          "Segunda pasada para confirmar que las correcciones cierran el hallazgo, y apoyo a tu equipo durante la remediación.",
      },
    ],
    useCases: [
      {
        title: "Validar una plataforma antes de salir a producción",
        description:
          "Una fintech quería asegurarse de que su plataforma resistiera antes del lanzamiento. Hicimos pruebas de penetración sobre la app y la infraestructura y entregamos un informe con hallazgos priorizados; los críticos se corrigieron antes de abrir al público.",
      },
      {
        title: "Requisito de un cliente o de cumplimiento",
        description:
          "A una empresa de software un cliente grande le exigía una prueba de penetración anual como condición del contrato. Hicimos la prueba y entregamos el informe ejecutivo y la carta de resultados que su cliente necesitaba.",
      },
      {
        title: "Sospecha de que algo no está bien",
        description:
          "Un negocio notaba accesos raros y correos de phishing dirigidos. Revisamos servidores, cuentas y configuración de correo, cerramos los huecos y dejamos monitoreo básico de accesos.",
      },
    ],
    howWeWork: [
      {
        title: "Alcance y autorización",
        description:
          "Definimos por escrito qué se prueba, cómo, cuándo y con qué límites. Sin autorización firmada no se toca nada.",
      },
      {
        title: "Reconocimiento",
        description:
          "Mapeamos la superficie expuesta: dominios, servicios, versiones y puntos de entrada.",
      },
      {
        title: "Explotación controlada",
        description:
          "Intentamos vulnerar lo identificado —autenticación, lógica de negocio, inyección, configuración— documentando cada paso con evidencia.",
      },
      {
        title: "Informe",
        description:
          "Entregamos hallazgos priorizados por riesgo real, con evidencia, impacto y pasos de corrección, más un resumen ejecutivo para dirección.",
      },
      {
        title: "Retest",
        description:
          "Cuando corriges, volvemos a probar los hallazgos para confirmar que quedaron cerrados.",
      },
    ],
    stack: [
      { group: "Pentesting", items: ["Burp Suite", "Nmap", "Metasploit", "OWASP ZAP"] },
      { group: "Análisis", items: ["Nessus / OpenVAS", "Nuclei", "testssl.sh"] },
      { group: "Infraestructura", items: ["Linux", "Docker", "Wireshark"] },
      { group: "Código y secretos", items: ["gitleaks", "Trivy", "Dependabot"] },
      { group: "Referencias", items: ["OWASP Top 10", "OWASP ASVS", "CIS Benchmarks"] },
    ],
    packages: [
      {
        name: "Pentest de aplicación",
        // Mercado MX ~$12,000–$35,000 (Genghis web media $14k–$20k, compleja $20k–$35k); promedio ~$22,000. Ver docs/precios-mercado.md
        priceMXN: 25000,
        priceUSD: 1350,
        marketLow: 12000,
        marketHigh: 35000,
        blurb: "Una app web o móvil y su API.",
        features: [
          "Pruebas siguiendo OWASP Top 10 / ASVS",
          "Con y sin credenciales",
          "Informe técnico + resumen ejecutivo",
          "Retest de hallazgos dentro de 30 días",
        ],
      },
      {
        name: "Pentest + infraestructura",
        // Mercado MX ~$32,000–$70,000 (Genghis app compleja $35k + infra interna $18k–$40k); promedio ~$45,000. Ver docs/precios-mercado.md
        priceMXN: 55000,
        priceUSD: 2970,
        marketLow: 32000,
        marketHigh: 70000,
        blurb: "Aplicación, servidores y red.",
        highlighted: true,
        features: [
          "Todo lo del pentest de aplicación",
          "Servidores, servicios expuestos y segmentación de red",
          "Revisión de configuración y hardening",
          "Carta de resultados para clientes o cumplimiento",
          "Retest de hallazgos dentro de 30 días",
        ],
      },
      {
        name: "Programa continuo",
        // Mercado MX ~$15,000–$25,000/mes (proporcional; sin comparable directo publicado). Ver docs/precios-mercado.md
        priceMXN: 15000,
        priceUSD: 810,
        period: "mes",
        marketLow: 15000,
        marketHigh: 25000,
        blurb: "Pruebas periódicas y acompañamiento.",
        features: [
          "Pruebas recurrentes según calendario",
          "Revisión de cambios y nuevas funciones",
          "Escaneo continuo de dependencias",
          "Acompañamiento a tu equipo en remediación",
        ],
      },
    ],
    quoteNote:
      "El precio depende del tamaño de la aplicación (número de funciones y roles), del alcance de infraestructura y de si se prueba con o sin credenciales. Toda prueba requiere una autorización firmada y una ventana acordada. El retest de los hallazgos corregidos va incluido en los primeros 30 días.",
    faqs: [
      {
        q: "¿Necesito autorizar la prueba por escrito?",
        a: "Sí, siempre. Definimos alcance, método, fechas y límites en un documento firmado antes de empezar. Es lo que separa una prueba legítima de un ataque.",
      },
      {
        q: "¿La prueba puede tirar mis sistemas?",
        a: "El riesgo se minimiza: acordamos ventanas de prueba, evitamos técnicas destructivas salvo que las pidas en un entorno de staging, y mantenemos contacto durante la ejecución.",
      },
      {
        q: "¿Prueban en producción o en un ambiente de pruebas?",
        a: "Lo que prefieras. Producción da el resultado más realista; staging permite ser más agresivo sin riesgo. A veces se combinan.",
      },
      {
        q: "¿Qué recibo al final?",
        a: "Un informe técnico con cada hallazgo (evidencia, impacto y cómo corregirlo) y un resumen ejecutivo para dirección. Si tu cliente o una norma lo pide, también una carta de resultados.",
      },
      {
        q: "¿Incluye volver a probar después de corregir?",
        a: "Sí, el retest de los hallazgos está incluido dentro de los 30 días siguientes a la entrega del informe.",
      },
      {
        q: "¿Con qué frecuencia debería hacerlo?",
        a: "Al menos una vez al año, y además después de cambios grandes: nueva funcionalidad crítica, migración de infraestructura o un incidente.",
      },
    ],
  },

  {
    slug: "hosting",
    icon: Server,
    title: "Hosting y correo empresarial",
    cardDescription:
      "Tu infraestructura y tu correo, funcionando sin que tengas que pensar en ellos. Gestionamos hosting, dominios, servidores y correo corporativo bajo tu dominio —Google Workspace, Microsoft 365 o una solución open source— monitoreados y respaldados.",
    cardCtaLabel: "Explorar servicio",

    published: true,
    tagline:
      "Hosting, dominios y correo corporativo gestionados, monitoreados y respaldados — en la plataforma que más te convenga.",
    intro: [
      "Nos hacemos cargo de la parte que tiene que estar siempre encendida: el hosting de tu sitio o aplicación, los dominios y DNS, los servidores y el correo corporativo bajo tu propio dominio. Tú te olvidas de renovaciones, caídas y configuraciones; nosotros lo monitoreamos y lo respaldamos.",
      "Trabajamos con la plataforma que mejor se ajuste a cada caso: Vercel para sitios y apps modernas; HostGator y Hostinger para hosting tradicional; AWS, Google Cloud o Azure cuando el proyecto necesita infraestructura a la medida. Para correo, Google Workspace o Microsoft 365, y para quien prefiere no depender de una suscripción, una solución open source (Nextcloud con suite ofimática) sobre servidor Linux.",
      "Ya gestionamos el correo y la infraestructura de varios clientes —desde organismos hasta empresas— con setups distintos según sus necesidades y su presupuesto.",
    ],
    whatWeBuild: [
      {
        title: "Hosting de sitios y aplicaciones",
        description:
          "Publicación y administración en Vercel, HostGator o Hostinger, con certificados SSL, dominios y despliegues.",
      },
      {
        title: "Infraestructura en la nube",
        description:
          "Servidores y servicios en AWS, Google Cloud o Azure cuando el proyecto necesita más control: bases de datos, almacenamiento, redes y escalado.",
      },
      {
        title: "Dominios y DNS",
        description:
          "Registro y administración de dominios, configuración de DNS, registros de correo (SPF, DKIM, DMARC) y renovaciones al día.",
      },
      {
        title: "Correo Google Workspace / Microsoft 365",
        description:
          "Alta del dominio, creación de cuentas, migración desde tu correo actual, grupos, alias y políticas de seguridad.",
      },
      {
        title: "Correo y nube open source",
        description:
          "Nextcloud con suite ofimática sobre servidor Linux propio: correo, archivos y calendario sin licencias por usuario.",
      },
      {
        title: "Monitoreo, respaldos y soporte",
        description:
          "Vigilancia de disponibilidad, respaldos periódicos con restauración probada y un punto de contacto para cuando algo falla.",
      },
    ],
    showcase: [
      {
        // TODO: confirmar consentimiento del cliente para nombrarlo en el sitio
        name: "Tijuana Innovadora",
        summary:
          "Gestionamos y administramos su correo institucional en Google Workspace: cuentas, dominio, seguridad y soporte a usuarios.",
        highlights: [
          "Correo institucional en Google Workspace",
          "Administración de cuentas y grupos",
          "Configuración de dominio y DNS",
          "Soporte a usuarios",
        ],
      },
      {
        // TODO: confirmar nombre completo y consentimiento del cliente
        name: "Prosin",
        summary:
          "Correo corporativo sobre Microsoft 365, con administración de licencias, cuentas y políticas de seguridad.",
        highlights: [
          "Microsoft 365",
          "Gestión de licencias y cuentas",
          "Políticas de seguridad y respaldo",
        ],
      },
      {
        name: "Clientes con enfoque open source",
        summary:
          "Correo, archivos y ofimática en Nextcloud sobre servidor Linux administrado, sin costo por usuario.",
        highlights: [
          "Nextcloud + suite ofimática",
          "Servidor Linux administrado",
          "Sin licencias por usuario",
        ],
      },
    ],
    showcaseTitle: "Clientes que ya gestionamos",
    showcaseNote:
      "Correo e infraestructura en producción, con setups distintos según cada necesidad y presupuesto.",
    useCases: [
      {
        title: "Sitio lento y correo que se iba a spam",
        description:
          "Un despacho tenía su web en un hosting lento y su correo en cuentas poco confiables. Migramos el sitio a infraestructura gestionada y el correo a un dominio propio en Google Workspace, sin perder mensajes ni tiempo fuera de servicio.",
      },
      {
        title: "De un correo gratuito al dominio de la empresa",
        description:
          "Un negocio operaba con cuentas @gmail. Registramos su dominio, montamos Google Workspace, migramos correos y contactos y configuramos SPF/DKIM/DMARC. Nada se perdió y dejaron de caer en spam.",
      },
      {
        title: "Bajar el costo de licencias de correo",
        description:
          "Una organización con muchos usuarios pagaba una licencia por cada cuenta, aunque varias casi no se usaban. Movimos a los usuarios ligeros a una solución open source (Nextcloud) y dejamos las licencias de pago solo para quien las necesita.",
      },
    ],
    howWeWork: [
      {
        title: "Diagnóstico",
        description:
          "Revisamos qué tienes hoy: hosting, dominios, correo, respaldos y a qué proveedor le estás pagando.",
      },
      {
        title: "Propuesta de plataforma",
        description:
          "Recomendamos la combinación que mejor equilibra costo, control y facilidad para tu caso, y te la explicamos sin tecnicismos.",
      },
      {
        title: "Migración",
        description:
          "Movemos sitio, dominios y correo en una ventana acordada, sin perder mensajes ni tiempo fuera de servicio. Configuramos DNS y registros de correo.",
      },
      {
        title: "Puesta a punto",
        description:
          "SSL, respaldos automáticos, monitoreo de disponibilidad y accesos documentados.",
      },
      {
        title: "Gestión continua",
        description:
          "Renovaciones, actualizaciones, altas y bajas de cuentas y soporte cuando lo necesitas.",
      },
    ],
    stack: [
      { group: "Hosting", items: ["Vercel", "HostGator", "Hostinger"] },
      { group: "Nube", items: ["AWS", "Google Cloud", "Azure"] },
      { group: "Correo", items: ["Google Workspace", "Microsoft 365", "Nextcloud"] },
      { group: "Servidor", items: ["Linux", "Docker", "Suite ofimática open source"] },
      { group: "Dominios y DNS", items: ["Registro de dominios", "SPF / DKIM / DMARC", "Cloudflare"] },
    ],
    packages: [
      {
        name: "Correo corporativo",
        // Cuota de gestión. Mercado MX ~$1,500–$3,000/mes (mantenimiento TI $800–$6,000/mes). Licencias GWS aparte: Starter $140 / Standard $280 / Plus $440 usuario/mes +IVA. Ver docs/precios-mercado.md
        priceMXN: 1500,
        priceUSD: 85,
        period: "mes",
        marketLow: 1500,
        marketHigh: 3000,
        blurb: "Google Workspace o Microsoft 365 gestionado.",
        features: [
          "Alta de dominio y cuentas",
          "Migración inicial desde tu correo actual",
          "SPF / DKIM / DMARC configurados",
          "Altas, bajas y soporte a usuarios",
          "Licencias del proveedor facturadas aparte",
        ],
      },
      {
        name: "Hosting gestionado",
        // Cuota de gestión. Mercado MX ~$1,500–$3,500/mes (hosting adm. $1,200–$8,000/año + mantenimiento $800–$6,000/mes, BastianSoft). Ver docs/precios-mercado.md
        priceMXN: 2500,
        priceUSD: 135,
        period: "mes",
        marketLow: 1500,
        marketHigh: 3500,
        blurb: "Tu sitio o app publicada y monitoreada.",
        highlighted: true,
        features: [
          "Publicación, SSL y despliegues",
          "Dominio y DNS administrados",
          "Respaldos automáticos con restauración probada",
          "Monitoreo de disponibilidad",
          "Punto de contacto para incidencias",
        ],
      },
      {
        name: "Infraestructura en la nube",
        // A cotización (gestión + consumo del proveedor aparte). Ver docs/precios-mercado.md
        priceMXN: null,
        priceUSD: null,
        blurb: "AWS, Google Cloud o Azure a la medida.",
        features: [
          "Arquitectura según carga y presupuesto",
          "Servidores, bases de datos y almacenamiento",
          "Monitoreo, respaldos y alertas",
          "Optimización continua de costos",
        ],
      },
    ],
    quoteNote:
      "Las cuotas son de gestión: las licencias de Google Workspace o Microsoft 365 y el consumo de la nube (AWS/GCP/Azure) se facturan por separado, normalmente a tu cuenta para que el costo sea transparente. El setup inicial y la migración se cotizan una sola vez (aprox. $3,000–$15,000 según el número de cuentas y el tamaño del sitio).",
    faqs: [
      {
        q: "¿Las licencias de Google Workspace / Microsoft 365 van incluidas?",
        a: "No. Nuestra cuota es por la gestión; las licencias se contratan a tu nombre y las pagas al proveedor directamente. Así el servicio es tuyo y el costo es claro.",
      },
      {
        q: "¿Pueden migrar mi correo sin que pierda mensajes?",
        a: "Sí. La migración copia correos, contactos y calendarios antes de cambiar el dominio, con una ventana acordada. El objetivo es cero pérdida y cero tiempo fuera.",
      },
      {
        q: "¿Qué es la opción open source?",
        a: "Nextcloud con suite ofimática sobre un servidor Linux: correo, archivos y calendario sin pagar una licencia por usuario. Conviene cuando hay muchos usuarios ligeros; requiere un servidor que nosotros administramos.",
      },
      {
        q: "¿Se quedan con el control de mis dominios y cuentas?",
        a: "No. Los dominios y las cuentas de proveedor se registran a tu nombre; nosotros los administramos con los accesos que nos autorices y te los entregamos documentados.",
      },
      {
        q: "¿Qué pasa si el sitio se cae un domingo?",
        a: "El monitoreo nos avisa y actuamos según el acuerdo de soporte. Con plan gestionado hay un punto de contacto para incidencias.",
      },
      {
        q: "¿Puedo empezar con lo que ya tengo?",
        a: "Sí. Hacemos un diagnóstico de tu hosting y correo actuales y te decimos qué conviene dejar igual, qué mover y qué está costando de más.",
      },
    ],
  },

  {
    slug: "consultoria-it",
    icon: Network,
    title: "Consultoría IT",
    cardDescription:
      "Antes de invertir en tecnología, decide con criterio. Diagnosticamos lo que tienes, definimos la arquitectura y el plan de migración, y te acompañamos en la adopción — priorizando por impacto y riesgo.",
    cardCtaLabel: "Explorar servicio",

    published: true,
    tagline:
      "Decisiones de tecnología con criterio: diagnóstico, arquitectura y una hoja de ruta priorizada que tu equipo puede ejecutar.",
    intro: [
      "Te ayudamos a tomar las decisiones de tecnología que salen caras si se toman mal: qué construir y qué comprar, monolito o microservicios, en qué nube, cuándo migrar y en qué orden. Partimos de tu operación real y de tus objetivos de negocio, no de la moda del momento.",
      "El entregable es concreto: un diagnóstico de lo que tienes, una arquitectura objetivo y una hoja de ruta priorizada por impacto y riesgo, con estimaciones de esfuerzo y costo. Algo que tu equipo —o cualquier proveedor— puede ejecutar.",
      "Si quieres, nos quedamos durante la ejecución: decisiones técnicas sobre la marcha, revisión de avances y acompañamiento a tu equipo en la adopción de las nuevas plataformas.",
    ],
    whatWeBuild: [
      {
        title: "Diagnóstico tecnológico",
        description:
          "Revisión de sistemas, integraciones, infraestructura, costos y riesgos. Salimos con un mapa claro de lo que tienes y dónde duele.",
      },
      {
        title: "Definición de arquitectura",
        description:
          "Arquitectura objetivo según carga, equipo y presupuesto: monolito o microservicios, base de datos, integraciones y despliegue.",
      },
      {
        title: "Plan de migración",
        description:
          "Ruta por fases para migrar sistemas, datos o infraestructura sin detener la operación, priorizada por impacto y riesgo.",
      },
      {
        title: "Selección de plataformas y proveedores",
        description:
          "Comparación objetiva de opciones —build vs buy, nube, herramientas— con criterios, costos y una recomendación por escrito.",
      },
      {
        title: "Revisión de código y de equipo",
        description:
          "Auditoría del estado del código, los procesos de desarrollo y las prácticas del equipo, con recomendaciones accionables.",
      },
      {
        title: "Acompañamiento en la adopción",
        description:
          "Presencia durante la ejecución: decisiones técnicas, revisión de avances y transferencia de conocimiento a tu equipo.",
      },
    ],
    showcase: [
      {
        name: "Gobierno del Estado",
        summary:
          "Implementación de Nextcloud a nivel estatal sobre servidores Ubuntu: correo, archivos y colaboración self-hosted, sin licencias por usuario.",
        highlights: [
          "Nextcloud en servidores Ubuntu",
          "Despliegue a escala estatal",
          "Sin costo de licencia por usuario",
          "Alternativa open source a suites de suscripción",
        ],
      },
    ],
    showcaseTitle: "Un despliegue destacado",
    showcaseNote: "Trabajo en producción a escala de gobierno.",
    useCases: [
      {
        title: "Creció al doble y los sistemas no daban abasto",
        description:
          "Una empresa duplicó su tamaño en un año y su tecnología empezó a frenar la operación. Hicimos un diagnóstico y una hoja de ruta de arquitectura y migraciones, priorizada por impacto y riesgo, para crecer sin rehacer todo de golpe.",
      },
      {
        title: "¿Construir a la medida o comprar una plataforma?",
        description:
          "Una empresa dudaba entre pagar un SaaS caro o desarrollar lo suyo. Comparamos costo total a tres años, riesgos y tiempos; la recomendación fue un híbrido: comprar el core y desarrollar solo las integraciones.",
      },
      {
        title: "El proveedor se iba y nadie sabía cómo estaba armado",
        description:
          "Una compañía dependía de un desarrollador externo que dejaba el proyecto. Documentamos la arquitectura, identificamos los riesgos y preparamos un plan de traspaso para el nuevo equipo.",
      },
    ],
    howWeWork: [
      {
        title: "Entrevistas y revisión",
        description:
          "Hablamos con las personas clave —negocio y técnicas— y revisamos sistemas, código, contratos y facturas de proveedores.",
      },
      {
        title: "Diagnóstico",
        description:
          "Consolidamos hallazgos: qué funciona, qué es riesgo, qué está costando de más y qué frena el crecimiento.",
      },
      {
        title: "Arquitectura y hoja de ruta",
        description:
          "Definimos el estado objetivo y una ruta por fases, priorizada por impacto y riesgo, con estimaciones de esfuerzo y costo.",
      },
      {
        title: "Presentación a dirección",
        description:
          "Exponemos el diagnóstico y el plan en lenguaje de negocio, con las decisiones que hay que tomar y sus implicaciones.",
      },
      {
        title: "Acompañamiento (opcional)",
        description:
          "Nos quedamos durante la ejecución para revisar avances y resolver decisiones técnicas.",
      },
    ],
    stack: [
      {
        group: "Arquitectura",
        items: ["Monolito / microservicios", "APIs REST", "Colas y eventos", "Multi-tenant"],
      },
      { group: "Nube", items: ["AWS", "Google Cloud", "Azure", "Vercel"] },
      { group: "Datos", items: ["PostgreSQL", "MySQL", "MongoDB", "Migraciones"] },
      { group: "Prácticas", items: ["Git", "CI/CD", "Docker", "Observabilidad"] },
      { group: "Referencias", items: ["Well-Architected", "12-Factor App", "C4 model"] },
    ],
    packages: [
      {
        name: "Diagnóstico y hoja de ruta",
        // Mercado MX ~$25,000–$90,000 (Magokoro diagnóstico $25k–$80k; con roadmap completo $60k–$150k); promedio ~$50,000. Ver docs/precios-mercado.md
        priceMXN: 45000,
        priceUSD: 2430,
        marketLow: 25000,
        marketHigh: 90000,
        blurb: "Diagnóstico + arquitectura objetivo + plan priorizado.",
        highlighted: true,
        features: [
          "Entrevistas y revisión de sistemas",
          "Informe de diagnóstico",
          "Diagrama de arquitectura objetivo",
          "Hoja de ruta por fases con estimaciones",
          "Presentación a dirección",
          "Entrega en 2–4 semanas",
        ],
      },
      {
        name: "Segunda opinión",
        // Mercado MX ~$8,000–$15,000 (Magokoro "sesión única de consulta"); promedio ~$11,000. Ver docs/precios-mercado.md
        priceMXN: 9000,
        priceUSD: 500,
        marketLow: 8000,
        marketHigh: 15000,
        blurb: "Una decisión puntual: build vs buy, elección de nube, revisar una propuesta.",
        features: [
          "Revisión enfocada del tema",
          "Comparativa con criterios y costos",
          "Recomendación por escrito",
          "Entrega en ~1 semana",
        ],
      },
      {
        name: "Acompañamiento",
        // Mercado MX ~$15,000–$50,000/mes (Magokoro "retainer mensual"); promedio ~$25,000/mes. Ver docs/precios-mercado.md
        priceMXN: 20000,
        priceUSD: 1080,
        period: "mes",
        marketLow: 15000,
        marketHigh: 50000,
        blurb: "Un arquitecto disponible para tu equipo.",
        features: [
          "Bolsa de horas mensual",
          "Decisiones técnicas y revisión de avances",
          "Disponibilidad acordada",
          "Facturación mensual",
        ],
      },
    ],
    quoteNote:
      "El precio depende del tamaño de la operación —número de sistemas, integraciones y equipos involucrados— y de la profundidad del diagnóstico. El acompañamiento posterior se contrata aparte, por horas o por retainer. Toda la documentación que generamos queda para ti.",
    faqs: [
      {
        q: "¿Necesito contratar también el desarrollo con ustedes?",
        a: "No. El diagnóstico y la hoja de ruta son independientes: los puede ejecutar tu equipo o cualquier proveedor. Que lo hagamos nosotros es una conversación aparte y sin compromiso.",
      },
      {
        q: "¿Cuánto dura un diagnóstico?",
        a: "Normalmente de 2 a 4 semanas, según el número de sistemas y de personas que haya que entrevistar.",
      },
      {
        q: "¿Qué me llevo al final?",
        a: "Un informe de diagnóstico, un diagrama de arquitectura objetivo y una hoja de ruta por fases con estimaciones de esfuerzo y costo, más una presentación para dirección.",
      },
      {
        q: "¿Trabajan con mi equipo actual o lo reemplazan?",
        a: "Trabajamos con tu equipo. El objetivo es que ellos queden con el criterio y la documentación para seguir solos.",
      },
      {
        q: "¿Firman acuerdo de confidencialidad?",
        a: "Sí. Todo lo que revisamos —código, contratos, números— se maneja bajo confidencialidad.",
      },
      {
        q: "¿Sirve si somos una empresa pequeña?",
        a: "Sí. En una empresa pequeña una buena decisión temprana de arquitectura o de proveedor evita gastos grandes más adelante.",
      },
    ],
  },
];

/** Look up one service by slug. */
export function getService(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

/** Format a MXN amount as e.g. "$12,000 MXN". */
export function formatMXN(amount: number): string {
  return `$${amount.toLocaleString("es-MX")} MXN`;
}

/** Format a USD amount as e.g. "US$700". */
export function formatUSD(amount: number): string {
  return `US$${amount.toLocaleString("en-US")}`;
}
