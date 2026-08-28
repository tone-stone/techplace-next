/**
 * `/legal/privacidad`: Privacy Notice (Aviso de Privacidad) required under
 * the LFPDPPP, covering what personal data is collected and how it's used.
 * Static content rendered through `LegalDocument`, with `Fill` marking
 * legal-entity values still pending completion.
 */
import type { Metadata } from "next";
import LegalDocument from "@/components/legal/LegalDocument";
import Fill from "@/components/legal/Fill";

export const metadata: Metadata = {
  title: "Aviso de Privacidad | TechPlace",
  description: "Aviso de privacidad de TechPlace conforme a la LFPDPPP.",
  alternates: { canonical: "/legal/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <LegalDocument title="Aviso de Privacidad" updated="26 de agosto de 2026">
      <p>
        <Fill>razón social o nombre completo del titular</Fill>, con nombre comercial{" "}
        <strong>TechPlace</strong> (&quot;TechPlace&quot;, &quot;el Responsable&quot;), con domicilio en{" "}
        <Fill>domicilio fiscal completo</Fill>, Tijuana, Baja California, México, es responsable del
        tratamiento de tus datos personales conforme a la Ley Federal de Protección de Datos Personales
        en Posesión de los Particulares (&quot;LFPDPPP&quot;) y su Reglamento.
      </p>

      <h2>1. Datos personales que recabamos</h2>
      <p>Dependiendo de cómo interactúes con nosotros, podemos recabar:</p>
      <ul>
        <li>
          <strong>Formulario de contacto y cotizaciones:</strong> nombre, correo electrónico, teléfono, y
          el contenido del mensaje que nos envíes.
        </li>
        <li>
          <strong>Clientes con proyecto activo:</strong> nombre de contacto, empresa, correo, teléfono,
          y los datos comerciales necesarios para elaborar cotizaciones, contratos y facturas (montos,
          fechas de pago, historial de comunicación con nuestro equipo).
        </li>
        <li>
          <strong>Portal de Redacción:</strong> correo electrónico y contraseña (almacenada de forma
          cifrada) del personal autorizado de TechPlace; no de visitantes del público en general.
        </li>
        <li>
          <strong>Navegación del Sitio:</strong> datos técnicos básicos que tu navegador envía a
          nuestros proveedores de hosting e infraestructura (dirección IP, tipo de dispositivo) con
          fines de seguridad y funcionamiento del Sitio.
        </li>
      </ul>
      <p>No recabamos datos personales sensibles a través del Sitio ni de nuestro CRM interno.</p>

      <h2>2. Finalidades del tratamiento</h2>
      <p><strong>Finalidades primarias</strong> (necesarias para dar el servicio que solicitas):</p>
      <ul>
        <li>Responder a tu solicitud de contacto o cotización.</li>
        <li>Elaborar propuestas, contratos y facturas si te conviertes en cliente.</li>
        <li>Dar seguimiento y soporte a proyectos de desarrollo contratados.</li>
        <li>Administrar el acceso del personal autorizado al Portal de Redacción.</li>
      </ul>
      <p><strong>Finalidades secundarias</strong> (no indispensables, puedes oponerte sin afectar la relación con nosotros):</p>
      <ul>
        <li>Enviarte información sobre nuevos servicios o contenido del blog.</li>
        <li>Fines estadísticos internos sobre el uso del Sitio.</li>
      </ul>
      <p>
        Si no deseas que tus datos se usen para las finalidades secundarias, puedes indicarlo enviando
        un correo a <a href="mailto:info@techplacetj.com">info@techplacetj.com</a> con el asunto
        &quot;Oposición a finalidades secundarias&quot;.
      </p>

      <h2>3. Transferencias de datos</h2>
      <p>
        Para operar el Sitio y nuestros servicios, compartimos datos personales con los siguientes
        terceros, únicamente en la medida necesaria para prestar el servicio contratado:
      </p>
      <ul>
        <li>
          <strong>Supabase Inc.</strong> — almacenamiento de la base de datos del Portal de Redacción y
          del CRM (infraestructura ubicada fuera de México).
        </li>
        <li>
          <strong>Cloudinary Ltd.</strong> — almacenamiento de imágenes y video usados en el blog y en
          cotizaciones (infraestructura ubicada fuera de México).
        </li>
        <li>
          <strong>Formspree, Inc.</strong> — procesamiento del formulario de contacto del Sitio.
        </li>
        <li>
          <strong>Vercel Inc.</strong> — hosting y entrega del Sitio.
        </li>
      </ul>
      <p>
        Estas transferencias se realizan al amparo del artículo 37 de la LFPDPPP, exclusivamente para
        que dichos proveedores presten servicios a nombre y por cuenta de TechPlace, bajo obligaciones
        contractuales de confidencialidad y seguridad. No vendemos ni rentamos tus datos personales a
        terceros con fines de mercadotecnia ajenos a TechPlace.
      </p>

      <h2>4. Derechos ARCO</h2>
      <p>
        Tienes derecho a Acceder a tus datos personales, Rectificarlos si son inexactos, Cancelarlos
        cuando consideres que no se requieren para alguna de las finalidades señaladas, y Oponerte al
        tratamiento de los mismos para fines específicos (&quot;Derechos ARCO&quot;), así como a revocar
        el consentimiento que en su caso nos hayas otorgado.
      </p>
      <p>Para ejercer tus derechos ARCO, envía una solicitud a <a href="mailto:info@techplacetj.com">info@techplacetj.com</a> que incluya:</p>
      <ol>
        <li>Nombre completo y correo electrónico de contacto.</li>
        <li>Documento que acredite tu identidad (o de tu representante, en su caso).</li>
        <li>Descripción clara del derecho que deseas ejercer.</li>
        <li>Cualquier documento que facilite localizar tus datos personales.</li>
      </ol>
      <p>
        Responderemos tu solicitud en un plazo máximo de 20 días hábiles, conforme al artículo 32 de la
        LFPDPPP.
      </p>

      <h2>5. Uso de cookies y tecnologías de rastreo</h2>
      <p>
        Actualmente el Sitio no utiliza cookies de rastreo publicitario ni herramientas de analítica de
        terceros. Si esto cambia, actualizaremos este Aviso e implementaremos el mecanismo de
        consentimiento correspondiente antes de activarlas.
      </p>

      <h2>6. Menores de edad</h2>
      <p>
        El Sitio y los servicios de TechPlace están dirigidos a personas mayores de edad que actúan en
        representación de una empresa o negocio. No recabamos intencionalmente datos de menores de edad.
      </p>

      <h2>7. Cambios a este Aviso</h2>
      <p>
        Este Aviso de Privacidad puede actualizarse para reflejar cambios legislativos, en nuestras
        prácticas internas, o en los servicios que ofrecemos. La versión vigente siempre estará
        disponible en esta página, con su fecha de última actualización.
      </p>

      <h2>8. Contacto</h2>
      <p>
        Responsable del tratamiento de datos:{" "}
        <a href="mailto:info@techplacetj.com">info@techplacetj.com</a> · 664 342 56 15 · Tijuana, Baja
        California, México.
      </p>
    </LegalDocument>
  );
}
