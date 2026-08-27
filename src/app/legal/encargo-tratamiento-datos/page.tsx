import type { Metadata } from "next";
import LegalDocument from "@/components/legal/LegalDocument";
import Fill from "@/components/legal/Fill";

export const metadata: Metadata = {
  title: "Contrato de Encargo de Tratamiento de Datos | TechPlace",
  description: "Modelo de contrato de encargo de tratamiento de datos personales conforme a la LFPDPPP.",
  alternates: { canonical: "/legal/encargo-tratamiento-datos" },
};

export default function EncargoTratamientoDatosPage() {
  return (
    <LegalDocument title="Contrato de Encargo de Tratamiento de Datos" updated="26 de agosto de 2026">
      <p className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200">
        Este documento es un <strong>modelo</strong>. Se usa cuando, al desarrollar u operar un
        proyecto para un cliente, TechPlace llega a tratar datos personales de los usuarios finales de
        ese cliente (por ejemplo, al alojar una base de datos o un CRM que el cliente opera). Los datos
        entre <Fill>corchetes</Fill> se completan por proyecto — este modelo no constituye, por sí solo,
        un contrato vigente con nadie.
      </p>

      <p>
        Contrato de encargo de tratamiento de datos personales (el &quot;Contrato&quot;) que celebran,
        por una parte, <Fill>razón social o nombre del cliente</Fill>, a quien en lo sucesivo se le
        denominará &quot;EL RESPONSABLE&quot;, y por la otra,{" "}
        <Fill>razón social o nombre completo del titular</Fill>, con nombre comercial{" "}
        <strong>TechPlace</strong>, a quien en lo sucesivo se le denominará &quot;EL ENCARGADO&quot;,
        conforme al artículo 3, fracción IX, y al artículo 49 del Reglamento de la LFPDPPP, y sujeto a
        las siguientes declaraciones y cláusulas.
      </p>

      <h2>Declaraciones</h2>
      <p>
        <strong>I.</strong> EL RESPONSABLE declara ser el titular de las decisiones sobre el
        tratamiento de los datos personales objeto de este Contrato, en su calidad de &quot;responsable&quot;
        conforme a la LFPDPPP.
      </p>
      <p>
        <strong>II.</strong> EL ENCARGADO declara contar con la infraestructura técnica y las medidas
        de seguridad necesarias para tratar datos personales por cuenta de EL RESPONSABLE, en el marco
        del proyecto <Fill>nombre/descripción del proyecto</Fill> desarrollado u operado para EL
        RESPONSABLE.
      </p>

      <h2>Cláusulas</h2>

      <h3>Primera. Objeto</h3>
      <p>
        EL RESPONSABLE encomienda a EL ENCARGADO el tratamiento de los datos personales que se detallan
        en el Anexo A de este Contrato, exclusivamente para las finalidades ahí descritas y en el marco
        del proyecto referido en la Declaración II.
      </p>

      <h3>Segunda. Instrucciones</h3>
      <p>
        EL ENCARGADO únicamente tratará los datos personales conforme a las instrucciones documentadas
        de EL RESPONSABLE. Si EL ENCARGADO considera que alguna instrucción infringe la LFPDPPP o su
        Reglamento, lo notificará de inmediato a EL RESPONSABLE, sin estar obligado a ejecutarla hasta
        que se subsane.
      </p>

      <h3>Tercera. Obligaciones de EL ENCARGADO</h3>
      <p>EL ENCARGADO se obliga a:</p>
      <ul>
        <li>Tratar los datos personales únicamente conforme a las instrucciones de EL RESPONSABLE.</li>
        <li>
          Implementar y mantener medidas de seguridad administrativas, técnicas y físicas razonables
          para proteger los datos personales contra daño, pérdida, alteración, acceso o tratamiento no
          autorizado.
        </li>
        <li>
          Guardar confidencialidad respecto de los datos personales tratados, incluso después de
          concluida la relación con EL RESPONSABLE.
        </li>
        <li>
          Notificar a EL RESPONSABLE, sin dilación indebida y en un plazo no mayor a{" "}
          <Fill>número</Fill> horas, cualquier vulneración de seguridad que afecte de forma
          significativa los derechos patrimoniales o morales de los titulares.
        </li>
        <li>
          No transferir los datos personales a un tercero distinto de EL RESPONSABLE, salvo que este lo
          autorice expresamente o la transferencia sea exigida por autoridad competente.
        </li>
        <li>
          En caso de subcontratar a otro proveedor (&quot;subencargado&quot;) para prestar parte del
          servicio (por ejemplo, hosting o almacenamiento en la nube), imponerle contractualmente las
          mismas obligaciones de este Contrato y notificarlo previamente a EL RESPONSABLE.
        </li>
        <li>
          Al término de la relación, según instruya EL RESPONSABLE: devolver los datos personales
          tratados, o suprimirlos de forma segura, salvo obligación legal de conservarlos.
        </li>
        <li>
          Colaborar con EL RESPONSABLE para atender solicitudes de derechos ARCO de los titulares de los
          datos, y para responder requerimientos del INAI u otra autoridad competente.
        </li>
      </ul>

      <h3>Cuarta. Subencargados autorizados</h3>
      <p>
        A la fecha de este Contrato, EL RESPONSABLE autoriza a EL ENCARGADO a apoyarse en los siguientes
        subencargados para prestar el servicio: <Fill>lista de proveedores de infraestructura, p. ej. Supabase, Cloudinary, Vercel</Fill>.
        Cualquier subencargado adicional requiere autorización previa de EL RESPONSABLE conforme a la
        cláusula Tercera.
      </p>

      <h3>Quinta. Auditoría</h3>
      <p>
        EL RESPONSABLE podrá solicitar a EL ENCARGADO, con una anticipación razonable, evidencia
        documental del cumplimiento de las obligaciones de seguridad y confidencialidad establecidas en
        este Contrato.
      </p>

      <h3>Sexta. Responsabilidad</h3>
      <p>
        EL ENCARGADO será responsable frente a EL RESPONSABLE por los daños derivados del tratamiento de
        datos personales que sean atribuibles a su incumplimiento de este Contrato o de la LFPDPPP.
      </p>

      <h3>Séptima. Vigencia</h3>
      <p>
        Este Contrato estará vigente mientras subsista la prestación de servicios entre las partes
        respecto del proyecto referido en la Declaración II, y sobrevivirá su terminación en lo relativo
        a confidencialidad y devolución o supresión de datos.
      </p>

      <h3>Octava. Legislación aplicable y jurisdicción</h3>
      <p>
        Este Contrato se interpreta conforme a la LFPDPPP, su Reglamento, y demás legislación federal
        mexicana aplicable. Para cualquier controversia, las partes se someten a los tribunales
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
