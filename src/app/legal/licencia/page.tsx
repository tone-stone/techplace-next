/**
 * `/legal/licencia`: Software License Agreement template used as a starting
 * point when licensing TechPlace-built software to clients. Static content
 * rendered through `LegalDocument`, with `Fill` marking per-project values
 * still pending completion.
 */
import type { Metadata } from "next";
import LegalDocument from "@/components/legal/LegalDocument";
import Fill from "@/components/legal/Fill";

export const metadata: Metadata = {
  title: "Contrato de Licencia de Software | TechPlace",
  description: "Modelo de contrato de licencia de software desarrollado por TechPlace.",
  alternates: { canonical: "/legal/licencia" },
};

export default function LicenciaPage() {
  return (
    <LegalDocument title="Contrato de Licencia de Software" updated="26 de agosto de 2026">
      <p className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200">
        Este documento es un <strong>modelo</strong> que TechPlace usa como punto de partida para
        licenciar el software que entrega a sus clientes. Los datos entre <Fill>corchetes</Fill> se
        completan y se firman de forma independiente para cada proyecto — este modelo no constituye,
        por sí solo, un contrato vigente con nadie.
      </p>

      <p>
        Contrato de licencia de uso de software (el &quot;Contrato&quot;) que celebran, por una parte,{" "}
        <Fill>razón social o nombre completo del titular</Fill>, con nombre comercial{" "}
        <strong>TechPlace</strong>, a quien en lo sucesivo se le denominará &quot;EL LICENCIANTE&quot;, y
        por la otra, <Fill>razón social o nombre del cliente</Fill>, a quien en lo sucesivo se le
        denominará &quot;EL LICENCIATARIO&quot;, de conformidad con las siguientes declaraciones y
        cláusulas.
      </p>

      <h2>Declaraciones</h2>
      <p>
        <strong>I.</strong> EL LICENCIANTE declara ser una entidad dedicada al desarrollo de software,
        con capacidad jurídica y técnica para desarrollar y licenciar el software objeto de este
        Contrato (el &quot;Software&quot;), identificado como <Fill>nombre/descripción del software</Fill>.
      </p>
      <p>
        <strong>II.</strong> EL LICENCIATARIO declara contar con capacidad jurídica para obligarse en
        los términos de este Contrato y tener interés en obtener una licencia de uso sobre el Software.
      </p>

      <h2>Cláusulas</h2>

      <h3>Primera. Objeto</h3>
      <p>
        EL LICENCIANTE otorga a EL LICENCIATARIO una licencia{" "}
        <Fill>exclusiva / no exclusiva</Fill>, intransferible salvo pacto en contrario, para usar el
        Software conforme a los términos de este Contrato. Esta licencia no implica la cesión de los
        derechos de autor sobre el código fuente, los cuales permanecen en favor de EL LICENCIANTE salvo
        que exista un contrato de cesión de derechos independiente (ver el{" "}
        <a href="/legal/desarrollo-a-medida">Contrato de Desarrollo a la Medida</a>).
      </p>

      <h3>Segunda. Alcance de uso</h3>
      <p>La licencia autoriza a EL LICENCIATARIO a:</p>
      <ul>
        <li>Instalar y ejecutar el Software en <Fill>número/tipo de instalaciones o dominios autorizados</Fill>.</li>
        <li>Usar el Software para los fines propios de su operación, sin sublicenciarlo a terceros salvo autorización expresa.</li>
      </ul>
      <p>Queda expresamente prohibido, salvo autorización escrita de EL LICENCIANTE:</p>
      <ul>
        <li>Descompilar, aplicar ingeniería inversa, o intentar obtener el código fuente del Software.</li>
        <li>Revender, sublicenciar o distribuir el Software a terceros.</li>
        <li>Remover avisos de derechos de autor o de propiedad del Software.</li>
      </ul>

      <h3>Tercera. Vigencia</h3>
      <p>
        Este Contrato entra en vigor en la fecha de su firma y tendrá una vigencia de{" "}
        <Fill>plazo o &quot;indefinida&quot;</Fill>, sujeta al pago puntual de las contraprestaciones
        pactadas en la cláusula Cuarta.
      </p>

      <h3>Cuarta. Contraprestación</h3>
      <p>
        Como contraprestación por la licencia, EL LICENCIATARIO pagará a EL LICENCIANTE{" "}
        <Fill>monto y forma de pago — único / mensual / anual</Fill>. El incumplimiento de pago por más
        de <Fill>número</Fill> días naturales faculta a EL LICENCIANTE a suspender el acceso al Software
        sin responsabilidad de su parte.
      </p>

      <h3>Quinta. Garantía y soporte</h3>
      <p>
        EL LICENCIANTE garantiza que el Software funcionará conforme a las especificaciones acordadas
        durante <Fill>periodo de garantía</Fill> contado a partir de la entrega. El soporte técnico
        posterior a este periodo, en su caso, se rige por un acuerdo de servicio independiente.
      </p>

      <h3>Sexta. Propiedad intelectual</h3>
      <p>
        EL LICENCIANTE es y seguirá siendo titular de todos los derechos de autor, marcas y demás
        derechos de propiedad intelectual sobre el Software, incluyendo mejoras o modificaciones que
        desarrolle, salvo aquellas expresamente cedidas por escrito a EL LICENCIATARIO.
      </p>

      <h3>Séptima. Limitación de responsabilidad</h3>
      <p>
        EL LICENCIANTE no será responsable por daños indirectos, pérdida de datos o de ganancias
        derivados del uso del Software, salvo en los casos de dolo o negligencia grave imputable a EL
        LICENCIANTE.
      </p>

      <h3>Octava. Terminación</h3>
      <p>
        Cualquiera de las partes podrá dar por terminado este Contrato ante un incumplimiento grave de
        la otra parte, previa notificación por escrito con <Fill>número</Fill> días de anticipación para
        subsanarlo. Al término del Contrato, EL LICENCIATARIO deberá cesar todo uso del Software.
      </p>

      <h3>Novena. Confidencialidad</h3>
      <p>
        Ambas partes se obligan a mantener confidencial la información técnica y comercial intercambiada
        con motivo de este Contrato, y a no divulgarla a terceros sin consentimiento previo por escrito.
      </p>

      <h3>Décima. Legislación aplicable y jurisdicción</h3>
      <p>
        Este Contrato se interpreta conforme a la Ley Federal del Derecho de Autor y demás legislación
        federal mexicana aplicable. Para cualquier controversia, las partes se someten a los tribunales
        competentes de Tijuana, Baja California, renunciando a cualquier otro fuero.
      </p>

      <p>
        Leído que fue el presente Contrato y enteradas las partes de su contenido y alcance legal, lo
        firman de conformidad en la ciudad de Tijuana, Baja California, a los <Fill>día</Fill> días del
        mes de <Fill>mes</Fill> de <Fill>año</Fill>.
      </p>
    </LegalDocument>
  );
}
