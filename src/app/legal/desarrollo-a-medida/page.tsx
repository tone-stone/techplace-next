import type { Metadata } from "next";
import LegalDocument from "@/components/legal/LegalDocument";
import Fill from "@/components/legal/Fill";

export const metadata: Metadata = {
  title: "Contrato de Desarrollo a la Medida | TechPlace",
  description: "Modelo de contrato de desarrollo de software a la medida con cesión de derechos.",
  alternates: { canonical: "/legal/desarrollo-a-medida" },
};

export default function DesarrolloAMedidaPage() {
  return (
    <LegalDocument title="Contrato de Desarrollo a la Medida" updated="26 de agosto de 2026">
      <p className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200">
        Este documento es un <strong>modelo</strong> que TechPlace usa como punto de partida para
        proyectos de desarrollo a la medida. Los datos entre <Fill>corchetes</Fill> se completan y se
        firman de forma independiente para cada proyecto — este modelo no constituye, por sí solo, un
        contrato vigente con nadie.
      </p>

      <p>
        Contrato de prestación de servicios de desarrollo de software a la medida, con cesión de
        derechos patrimoniales de autor (el &quot;Contrato&quot;) que celebran, por una parte,{" "}
        <Fill>razón social o nombre completo del titular</Fill>, con nombre comercial{" "}
        <strong>TechPlace</strong>, a quien en lo sucesivo se le denominará &quot;EL DESARROLLADOR&quot;,
        y por la otra, <Fill>razón social o nombre del cliente</Fill>, a quien en lo sucesivo se le
        denominará &quot;EL CLIENTE&quot;, conforme a las siguientes declaraciones y cláusulas.
      </p>

      <h2>Declaraciones</h2>
      <p>
        <strong>I.</strong> EL DESARROLLADOR declara dedicarse profesionalmente al desarrollo de
        software y contar con el personal y la capacidad técnica para desarrollar el proyecto descrito
        en el Anexo A (el &quot;Proyecto&quot;).
      </p>
      <p>
        <strong>II.</strong> EL CLIENTE declara tener interés en que se desarrolle el Proyecto conforme
        a las especificaciones que se detallan en el Anexo A, y contar con la capacidad para cubrir la
        contraprestación pactada.
      </p>

      <h2>Cláusulas</h2>

      <h3>Primera. Objeto</h3>
      <p>
        EL DESARROLLADOR se obliga a diseñar, desarrollar y entregar a EL CLIENTE el Proyecto descrito en
        el Anexo A, conforme al alcance, funcionalidades y criterios de aceptación ahí establecidos.
      </p>

      <h3>Segunda. Entregables y plazos</h3>
      <p>
        Los entregables, hitos y fechas estimadas de entrega se detallan en el Anexo A. Los plazos
        podrán ajustarse por mutuo acuerdo escrito ante cambios de alcance solicitados por EL CLIENTE,
        o por causas de fuerza mayor.
      </p>

      <h3>Tercera. Contraprestación y forma de pago</h3>
      <p>
        EL CLIENTE pagará a EL DESARROLLADOR la cantidad de <Fill>monto total</Fill>, conforme al
        siguiente calendario: <Fill>anticipo / pagos por hito / pago único, con montos y fechas</Fill>.
        Los pagos que se retrasen más de <Fill>número</Fill> días naturales generarán una suspensión de
        actividades sin responsabilidad para EL DESARROLLADOR, sin perjuicio de exigir el cumplimiento
        del pago.
      </p>

      <h3>Cuarta. Cesión de derechos patrimoniales de autor</h3>
      <p>
        Una vez que EL CLIENTE cubra la totalidad de la contraprestación pactada en la cláusula
        Tercera, EL DESARROLLADOR cede a EL CLIENTE, de forma <strong>exclusiva, total y definitiva</strong>,
        los derechos patrimoniales de autor sobre el código fuente desarrollado específicamente para el
        Proyecto, conforme a los artículos 24, 25 y 83 de la Ley Federal del Derecho de Autor, incluyendo
        los derechos de reproducción, distribución, transformación y comunicación pública de dicho
        código.
      </p>
      <p>
        Antes de completarse el pago total, EL CLIENTE cuenta únicamente con una licencia de uso del
        Proyecto en el estado de avance entregado, en los términos que acuerden las partes.
      </p>

      <h3>Quinta. Exclusiones de la cesión</h3>
      <p>La cesión de la cláusula Cuarta <strong>no incluye</strong>:</p>
      <ul>
        <li>
          Componentes de terceros, bibliotecas de código abierto (&quot;open source&quot;), o software
          preexistente de EL DESARROLLADOR que se integre al Proyecto — estos se rigen por sus propias
          licencias, y EL DESARROLLADOR únicamente garantiza tener derecho legítimo para usarlos e
          integrarlos.
        </li>
        <li>
          Herramientas, frameworks, componentes genéricos o código base propio de EL DESARROLLADOR que
          no sean exclusivos del Proyecto y que EL DESARROLLADOR reutilice en otros proyectos.
        </li>
      </ul>

      <h3>Sexta. Derechos morales</h3>
      <p>
        Conforme a los artículos 18 y 19 de la Ley Federal del Derecho de Autor, los derechos morales
        sobre el código desarrollado son <strong>inalienables, imprescriptibles, irrenunciables e
        inembargables</strong>, y permanecen en todo momento con las personas físicas que efectivamente
        lo programaron, con independencia de la cesión de derechos patrimoniales pactada en la cláusula
        Cuarta. EL CLIENTE reconoce este derecho y se obliga a respetarlo.
      </p>

      <h3>Séptima. Garantía y corrección de errores</h3>
      <p>
        EL DESARROLLADOR garantiza que el Proyecto funcionará conforme a las especificaciones del Anexo
        A durante <Fill>periodo de garantía, p. ej. 30 días</Fill> posteriores a la entrega final,
        periodo durante el cual corregirá sin costo adicional los defectos atribuibles a su desarrollo.
        Esta garantía no cubre fallas causadas por modificaciones realizadas por terceros ajenos a EL
        DESARROLLADOR, ni por el uso del Proyecto fuera de las condiciones acordadas.
      </p>

      <h3>Octava. Soporte posterior a la entrega</h3>
      <p>
        Cualquier soporte, mantenimiento o desarrollo adicional posterior al periodo de garantía se
        pactará mediante un acuerdo de servicio independiente.
      </p>

      <h3>Novena. Confidencialidad</h3>
      <p>
        Ambas partes se obligan a mantener confidencial la información técnica, comercial y de negocio
        que se intercambien con motivo del Proyecto, y a no divulgarla a terceros sin consentimiento
        previo por escrito, salvo requerimiento de autoridad competente.
      </p>

      <h3>Décima. Datos personales</h3>
      <p>
        Si el Proyecto implica que EL DESARROLLADOR trate datos personales de usuarios finales de EL
        CLIENTE, dicho tratamiento se sujeta al{" "}
        <a href="/legal/encargo-tratamiento-datos">Contrato de Encargo de Tratamiento de Datos</a>{" "}
        correspondiente, que forma parte integral de la relación contractual entre las partes.
      </p>

      <h3>Décima primera. Terminación anticipada</h3>
      <p>
        Cualquiera de las partes podrá dar por terminado este Contrato ante un incumplimiento grave de
        la otra parte no subsanado dentro de los <Fill>número</Fill> días siguientes a su notificación
        por escrito. En caso de terminación anticipada, EL CLIENTE pagará el trabajo efectivamente
        realizado hasta ese momento, y la cesión de derechos de la cláusula Cuarta operará únicamente
        sobre el código correspondiente a los hitos ya pagados en su totalidad.
      </p>

      <h3>Décima segunda. Legislación aplicable y jurisdicción</h3>
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
