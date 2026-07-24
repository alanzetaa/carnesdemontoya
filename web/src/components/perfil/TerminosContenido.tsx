// Texto de arranque para De Montoya -- pedido explícito del dueño de tener
// algo funcionando ya, se puede pulir más adelante. Ver reglas.md
// ("Términos y Condiciones").
export function TerminosContenido() {
  return (
    <div style={{ fontSize: 14, lineHeight: 1.6 }}>
      <p className="hint" style={{ marginTop: 0 }}>Última actualización: {new Date().toLocaleDateString("es-AR")}</p>

      <h4>1. Qué es esta plataforma</h4>
      <p>
        Carnes de Montoya vende cortes y combos de carne envasada al vacío, producidos en nuestro
        establecimiento en Entre Ríos (SENASA N.º 5620) y enviados a domicilio en Rosario y Buenos Aires.
        Desde acá armás tu pedido; la confirmación, el pago y la entrega se coordinan directamente con
        nosotros por WhatsApp o email.
      </p>

      <h4>2. El pedido es una solicitud, no una compra confirmada</h4>
      <p>
        Al confirmar tu pedido nos llega tu solicitud con el detalle y el total estimado. Esto{" "}
        <strong>no incluye el cobro</strong>: te contactamos para coordinar el pago (transferencia,
        efectivo u otro medio que acordemos) y la entrega. El pedido queda sujeto a la disponibilidad real
        de stock al momento de coordinarlo -- puede ocurrir, aunque tratamos de evitarlo, que algún corte
        se haya agotado entre que lo pediste y que te contactamos.
      </p>

      <h4>3. Zona de envío y cadena de frío</h4>
      <p>
        Hoy entregamos en Rosario y Buenos Aires, con vehículo refrigerado para mantener la cadena de frío
        hasta tu puerta. Si tu dirección queda fuera de esa zona, te avisamos al coordinar el pedido para
        ver alternativas.
      </p>

      <h4>4. Tus datos</h4>
      <p>
        Usamos tu nombre, dirección, email y (si lo cargás) WhatsApp exclusivamente para gestionar tus
        pedidos y contactarte por su entrega -- no se muestran a otros usuarios ni se usan con otro fin.
      </p>

      <h4>5. Tu responsabilidad</h4>
      <p>
        Sos responsable de que los datos de contacto y de envío que cargues sean correctos. Un domicilio
        incompleto o incorrecto puede demorar o impedir la entrega.
      </p>

      <h4>6. Cuentas</h4>
      <p>
        Nos reservamos el derecho de suspender o eliminar cuentas que incumplan estas condiciones o que
        generen un mal uso de la plataforma (pedidos falsos, datos inventados), sin que eso genere derecho
        a reclamo alguno.
      </p>

      <h4>7. Cambios en estos términos</h4>
      <p>Estos términos pueden actualizarse con el tiempo. Los cambios importantes se van a avisar dentro de la plataforma.</p>
    </div>
  );
}
