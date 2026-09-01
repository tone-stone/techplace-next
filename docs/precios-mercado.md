# Precios de mercado — referencia para negociación

Análisis de precios de mercado (México, 2025–2026) para los servicios de
TechPlace, usado para calibrar los paquetes en
[`src/lib/services/catalog.ts`](../src/lib/services/catalog.ts).

**Método.** Se priorizaron listas de precios publicadas de despachos
mexicanos especializados (Genghis en seguridad, GNB Labs / Gabriel Neuman en
n8n, Magokoro en consultoría, Creaun en apps, BastianSoft en web) por encima
de rangos genéricos de blogs. Se descartaron los "promedios de industria"
inflados (apps de $2M+, etc.) porque reflejan desarrollo nativo / agencia
grande / EE. UU., no un taller nearshore. El "promedio ponderado" es el punto
medio sesgado hacia esas fuentes especializadas.

**Advertencia.** Son precios *anunciados* (marketing), rangos amplios, sin
índice oficial. Referencia direccional, no datos de transacciones auditadas.
Conversión aproximada **$18.5 MXN/USD**. Todos los precios **+ IVA**.

Última actualización de la investigación: agosto 2026.

---

## Tabla: mercado vs. precio en el catálogo

| Servicio / paquete | Rango de mercado (MXN) | Promedio ponderado | Precio en catálogo | Nota |
|---|---|---|---|---|
| Landing page | $7,000 – $22,000 | ~$12,000 | **$12,000** | En punto |
| Sitio corporativo (CMS, multipágina) | $18,000 – $55,000 | ~$38,000 | **$38,000** | En punto |
| E-commerce (≤100 SKU) | $35,000 – $95,000 | ~$60,000 | **$60,000** | En punto |
| Plataforma a la medida (CRM/ERP/SaaS) | $150,000 – $600,000+ | cotización | **cotización** | Ancla ~$300,000 |
| App MVP (React Native) | $50,000 – $120,000 | ~$70,000 | **$60,000** | Banda baja a propósito |
| App de negocio (módulos + panel + integraciones) | $120,000 – $300,000 | ~$170,000 | **$150,000** | Banda media |
| Plataforma POS/ERP (tipo GastroGo) | $300,000 – $600,000+ | cotización | **cotización** | Ancla ~$300,000 |
| Automatización puntual (1 flujo n8n) | $15,000 – $40,000 | ~$25,000 | **$20,000** | Banda baja |
| Proyecto automatización + IA | $60,000 – $200,000 | ~$110,000 | **$95,000** | Banda media |
| Retainer IA / automatización | $18,000 – $40,000 /mes | ~$25,000/mes | **$20,000/mes** | Banda baja (= GNB Starter) |
| Pentest de aplicación | $12,000 – $35,000 | ~$22,000 | **$25,000** | Media-alta |
| Pentest + infraestructura | $32,000 – $70,000 | ~$45,000 | **$55,000** | Media-alta |
| Programa continuo de seguridad | $15,000 – $25,000 /mes | ~$18,000/mes | **$15,000/mes** | Banda baja |
| Diagnóstico + hoja de ruta (consultoría) | $25,000 – $90,000 | ~$50,000 | **$45,000** | Banda media |
| Segunda opinión / sesión única | $8,000 – $15,000 | ~$11,000 | **$9,000** | Banda baja |
| Acompañamiento / retainer consultoría | $15,000 – $50,000 /mes | ~$25,000/mes | **$20,000/mes** | Banda baja-media |
| Correo corporativo gestionado (cuota de gestión) | $1,500 – $3,000 /mes | ~$2,000/mes | **$1,500/mes** | + licencias aparte |
| Hosting gestionado | $1,500 – $3,500 /mes | ~$2,500/mes | **$2,500/mes** | + consumo aparte |
| Setup / migración de correo (one-time) | $3,000 – $15,000 | — | en `quoteNote` | Según nº de cuentas |

**Licencias Google Workspace** (pass-through al cliente, no es ingreso de
TechPlace): Business Starter **$140**, Standard **$280**, Plus **$440** por
usuario/mes (+IVA, plan anual). Cuentas de desarrollador: App Store **US$99/año**,
Google Play **US$25** pago único.

---

## Fundamento: por qué seguridad y consultoría cuestan como (o más que) un sitio web

No es una rareza de TechPlace — así lo cotiza todo el mercado mexicano:

| | Punto medio de mercado |
|---|---|
| Landing page | ~$12,000 |
| Pentest web (medio–complejo) | $14,000 – $35,000 |
| Diagnóstico de consultoría TI | $25,000 – $80,000 |
| Sitio corporativo | ~$38,000 |

Un pentest complejo (7–12 días, especialista certificado OSCP/CEH) y un
diagnóstico de arquitectura están, en las listas públicas de **Genghis** y
**Magokoro**, al mismo nivel o por encima de un sitio corporativo.

### Argumentos para la mesa

1. **"Es el precio de mercado, no el mío."** Mostrar las listas públicas:
   Genghis (pentest $8k–$35k), Magokoro (diagnóstico $25k–$80k), GNB Labs
   (automatización $15k–$250k). TechPlace está en la banda media-baja de
   todas.
2. **El costo de equivocarse.** Un sitio malo se rehace. Una vulnerabilidad
   que se pasa = brecha + multa + cliente perdido. Una arquitectura mal
   elegida = años de deuda técnica. El análisis es seguro, no cosmético.
3. **Habilita ingresos.** Muchos contratos grandes y normas (ISO 27001, PCI,
   requisitos de proveedor) no se firman sin pentest. Ese informe abre
   contratos que valen mucho más que su costo.
4. **Escasez.** Una landing la hace cualquiera; un pentest serio o un
   diagnóstico de arquitectura, pocos.

### Tarifas por día de referencia (nearshore MX)

| Perfil | Tarifa/día aprox. (MXN) |
|---|---|
| Desarrollador mid | $3,600 – $5,200 |
| Full-stack senior | $5,000 – $8,000 |
| Pentester certificado / arquitecto | $8,000 – $16,000 (Cronoshare $800–$2,500/h; GNB $2,500–$4,000/h) |

Un consultor cobra en 1 día lo que un dev en 2–3. Es lo normal en cualquier
profesión: un abogado o un auditor entregan pocas hojas y cobran caro porque
el producto es el criterio, no el papel.

---

## Fuentes

**Desarrollo web / e-commerce**
- BastianSoft — Costo de página web México 2025: https://bastiansoft.com/blog/costo-pagina-web-negocios-mexico-2025
- BastianSoft — Precios páginas web México 2026: https://bastiansoft.com/blog/precios-paginas-web-mexico-2026
- GoDaddy — ¿Cuánto cuesta una página web en México?: https://www.godaddy.com/resources/latam/clientes/cuanto-cuesta-una-pagina-web-mexico
- Shortway — Página web: https://shortway.com.mx/cuanto-cuesta/pagina-web · Tienda en línea: https://shortway.com.mx/cuanto-cuesta/tienda-en-linea
- Magokoro — Precios desarrollo web México: https://www.magokoro.mx/blog/precios-desarrollo-web-mexico
- Tiendanube — Cuánto cuesta una tienda online: https://www.tiendanube.com/blog/cuanto-cuesta-una-tienda-online/

**Apps móviles**
- Creaun.app — Cuánto cuesta desarrollar app móvil México 2026: https://www.creaun.app/blog/cuanto-cuesta-desarrollar-app-movil-mexico-2026
- Magokoro — Costo de una app: https://www.magokoro.mx/blog/cuanto-cuesta-desarrollar-una-app-todo-lo-que-debes-saber-en-2025
- iTechDev — Costo de software a la medida en México: https://itechdev.com.mx/es/blog/costo-desarrollo-software-mexico

**IA / automatización**
- GNB Labs / Gabriel Neuman — Costo de implementación de n8n en México: https://www.gabrielneuman.com/costo-implementacion-n8n/
- Gabriel Neuman — Cuánto cuesta automatizar un proceso: https://www.gabrielneuman.com/cuanto-cuesta/
- IAmanos — Precios agencia IA México 2026: https://iamanos.com/blog/cuanto-cuesta-agencia-ia-mexico-precios-2026
- add.com.mx — Costo de implementar IA: https://add.com.mx/cuanto-cuesta-implementar-inteligencia-artificial-empresa/

**Ciberseguridad**
- Genghis — Costo de pentest en México: https://www.genghis.com.mx/blog/costo-pentest-mexico
- ZetTateK — Cuánto cuesta pentesting México: https://zettatek.com/cuanto-cuesta-pentesting-mexico/
- DeepStrike — Costo de las pruebas de penetración: https://deepstrike.io/blog/costo-de-las-pruebas-de-penetracion

**Consultoría IT**
- Magokoro — Consultoría para PyMEs en México: https://www.magokoro.mx/blog/consultoria-para-pymes-en-mexico
- Cronoshare — Cuánto cuesta una consultoría empresarial: https://www.cronoshare.com.mx/cuanto-cuesta/consultoria-empresarial

**Tarifas por hora / hosting / correo**
- Curotec — Nearshore developer hourly rates LATAM 2025: https://www.curotec.com/insights/latam-developer-hourly-rates-in-2025/
- NoriHost — Google Workspace precios México: https://norihost.com/google-workspace/precios-mexico
