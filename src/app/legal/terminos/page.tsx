/**
 * `/legal/terminos`: Terms and Conditions governing use of the site and the
 * blog's writer portal. Static content rendered through `LegalDocument`,
 * with `Fill` marking legal-entity values still pending completion.
 */
import type { Metadata } from "next";
import LegalDocument from "@/components/legal/LegalDocument";
import Fill from "@/components/legal/Fill";

export const metadata: Metadata = {
  title: "Términos y Condiciones | TechPlace",
  description: "Términos y condiciones de uso del sitio web y portal de blog de TechPlace.",
  alternates: { canonical: "/legal/terminos" },
};

export default function TerminosPage() {
  return (
    <LegalDocument title="Términos y Condiciones" updated="26 de agosto de 2026">
      <p>
        Estos Términos y Condiciones (los &quot;Términos&quot;) regulan el acceso y uso del sitio web
        techplacetj.com y sus subdominios (el &quot;Sitio&quot;), operado por{" "}
        <Fill>razón social o nombre completo del titular</Fill>, con nombre comercial{" "}
        <strong>TechPlace</strong> (&quot;TechPlace&quot;, &quot;nosotros&quot;), con domicilio en{" "}
        <Fill>domicilio fiscal completo</Fill>, Tijuana, Baja California, México, y RFC{" "}
        <Fill>RFC</Fill>. Al navegar o usar el Sitio, aceptas estos Términos en su totalidad; si no
        estás de acuerdo, debes dejar de usarlo.
      </p>

      <h2>1. Descripción del servicio</h2>
      <p>
        El Sitio presenta los servicios de desarrollo web, aplicaciones móviles y ciberseguridad que
        ofrece TechPlace, publica contenido editorial a través del blog, y aloja un portal privado
        (&quot;Portal de Redacción&quot;) para el personal autorizado de TechPlace. El uso del Sitio con
        fines informativos o de contacto es gratuito; los servicios profesionales de desarrollo se rigen
        por contratos independientes celebrados por escrito con cada cliente (ver, por ejemplo, el{" "}
        <a href="/legal/desarrollo-a-medida">Contrato de Desarrollo a la Medida</a>).
      </p>

      <h2>2. Uso permitido</h2>
      <p>Al usar el Sitio te comprometes a:</p>
      <ul>
        <li>Proporcionar información veraz en el formulario de contacto y en cualquier solicitud de cotización.</li>
        <li>No usar el Sitio para fines ilícitos, fraudulentos, o que infrinjan derechos de terceros.</li>
        <li>
          No intentar vulnerar la seguridad del Sitio, del Portal de Redacción, ni de los sistemas que
          los soportan (incluye pruebas de intrusión no autorizadas, scraping automatizado agresivo, o
          intentos de acceso a cuentas ajenas).
        </li>
        <li>No copiar, reproducir o distribuir el contenido del Sitio con fines comerciales sin autorización previa por escrito.</li>
      </ul>

      <h2>3. Propiedad intelectual</h2>
      <p>
        El diseño, código, marca, logotipos, textos, imágenes y demás contenido del Sitio son propiedad
        de TechPlace o se usan bajo licencia, y están protegidos por la Ley Federal del Derecho de Autor
        y la Ley Federal de Protección a la Propiedad Industrial. Ninguna disposición de estos Términos
        transfiere derecho alguno sobre dicho contenido, salvo autorización expresa por escrito.
      </p>
      <p>
        El contenido publicado en el blog puede citarse parcialmente con fines periodísticos o
        educativos, siempre que se cite la fuente y se enlace al artículo original.
      </p>

      <h2>4. Portal de Redacción y cuentas de acceso</h2>
      <p>
        El acceso al Portal de Redacción está restringido a personal autorizado por TechPlace. Cada
        usuario es responsable de mantener la confidencialidad de sus credenciales y de toda actividad
        realizada bajo su cuenta. TechPlace puede suspender o cancelar el acceso de cualquier usuario en
        cualquier momento, sin previo aviso, ante un uso indebido o sospecha de compromiso de la cuenta.
      </p>

      <h2>5. Formulario de contacto y comunicaciones</h2>
      <p>
        Al enviar el formulario de contacto, aceptas ser contactado por TechPlace a través del correo
        electrónico, teléfono o WhatsApp que proporciones, con el único fin de dar seguimiento a tu
        solicitud. El tratamiento de estos datos se describe en el{" "}
        <a href="/legal/privacidad">Aviso de Privacidad</a>.
      </p>

      <h2>6. Enlaces a terceros</h2>
      <p>
        El Sitio puede incluir enlaces a sitios de terceros (por ejemplo, redes sociales, WhatsApp, o
        proyectos del portafolio de clientes). TechPlace no controla ni se hace responsable del
        contenido, políticas de privacidad o prácticas de esos terceros.
      </p>

      <h2>7. Limitación de responsabilidad</h2>
      <p>
        El Sitio se ofrece &quot;tal cual&quot; y &quot;según disponibilidad&quot;. TechPlace no
        garantiza que el Sitio esté libre de interrupciones o errores, y no será responsable por daños
        indirectos derivados del uso o imposibilidad de uso del Sitio, salvo en los casos en que la
        legislación mexicana aplicable no permita dicha limitación.
      </p>

      <h2>8. Modificaciones</h2>
      <p>
        TechPlace puede modificar estos Términos en cualquier momento. Los cambios entran en vigor al
        publicarse en esta página, indicando la fecha de &quot;Última actualización&quot;. El uso
        continuado del Sitio después de una modificación constituye tu aceptación de los nuevos
        Términos.
      </p>

      <h2>9. Ley aplicable y jurisdicción</h2>
      <p>
        Estos Términos se rigen por las leyes federales de los Estados Unidos Mexicanos. Para cualquier
        controversia derivada de su interpretación o cumplimiento, las partes se someten a la
        jurisdicción de los tribunales competentes de Tijuana, Baja California, renunciando a cualquier
        otro fuero que pudiera corresponderles por razón de su domicilio presente o futuro.
      </p>

      <h2>10. Contacto</h2>
      <p>
        Dudas sobre estos Términos: <a href="mailto:info@techplacetj.com">info@techplacetj.com</a> ·
        664 342 56 15.
      </p>
    </LegalDocument>
  );
}
