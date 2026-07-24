// Edge Function de Supabase: avisa por mail cuando entra un pedido nuevo en
// Carnes de Montoya.
//
// Se dispara desde un Database Webhook (Dashboard > Database > Webhooks) con
// evento "insert" sobre la tabla public.pedidos.
//
// Cómo desplegarla: Supabase Dashboard > Edge Functions > "New function",
// pegar este archivo tal cual (no hace falta la CLI de Supabase ni Node).
// Después hay que cargar el secret RESEND_API_KEY (Edge Functions > Settings
// de esta función). SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY ya los inyecta
// Supabase automáticamente en cualquier Edge Function, no hace falta cargarlos.
//
// Importante: sin verificar un dominio propio en Resend, solo se puede
// mandar mail a la casilla con la que te registraste en Resend (modo
// sandbox) -- ni ventas@demontoya.com ni el mail del comprador van a recibir
// nada hasta verificar un dominio (Resend > Domains, un par de registros
// DNS).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE_URL = "https://carnesdemontoya.vercel.app/";
const FROM_EMAIL = "De Montoya <onboarding@resend.dev>";
const VENTAS_EMAIL = "ventas@demontoya.com";

function formatearMoneda(valor: number): string {
  return valor.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

Deno.serve(async (req) => {
  const payload = await req.json();

  if (payload.type !== "INSERT" || payload.table !== "pedidos") {
    return new Response("ignorado", { status: 200 });
  }

  const pedido = payload.record;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: items } = await admin
    .from("pedido_items")
    .select("nombre_producto, cantidad, precio_unitario, subtotal")
    .eq("pedido_id", pedido.id)
    .order("id");

  const filasItems = (items ?? [])
    .map(
      (it: { nombre_producto: string; cantidad: number; precio_unitario: number; subtotal: number }) =>
        `<tr>
          <td style="padding:4px 8px;">${it.nombre_producto}</td>
          <td style="padding:4px 8px;text-align:right;">${it.cantidad}</td>
          <td style="padding:4px 8px;text-align:right;">${formatearMoneda(it.precio_unitario)}</td>
          <td style="padding:4px 8px;text-align:right;">${formatearMoneda(it.subtotal)}</td>
        </tr>`
    )
    .join("");

  const tablaItems = `
    <table style="border-collapse:collapse;width:100%;margin:12px 0;">
      <thead>
        <tr style="background:#f0ece3;">
          <th style="padding:4px 8px;text-align:left;">Producto</th>
          <th style="padding:4px 8px;text-align:right;">Cant.</th>
          <th style="padding:4px 8px;text-align:right;">Precio</th>
          <th style="padding:4px 8px;text-align:right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${filasItems}</tbody>
    </table>
  `;

  const htmlVentas = `
    <h2>Pedido nuevo — ${pedido.comprador_nombre} ${pedido.comprador_apellido}</h2>
    <p><strong>Email:</strong> ${pedido.comprador_email}<br/>
    <strong>WhatsApp:</strong> ${pedido.whatsapp_contacto || "(no cargó)"}<br/>
    <strong>Dirección de envío:</strong> ${pedido.direccion_envio}</p>
    ${pedido.notas ? `<p><strong>Notas:</strong> ${pedido.notas}</p>` : ""}
    ${tablaItems}
    <p><strong>Total: ${formatearMoneda(pedido.total)}</strong></p>
    <p style="color:#555;">Coordinar pago y entrega directamente con el cliente.</p>
  `;

  const resendVentas = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: VENTAS_EMAIL,
      subject: `Pedido nuevo de ${pedido.comprador_nombre} ${pedido.comprador_apellido} — ${formatearMoneda(pedido.total)}`,
      html: htmlVentas,
    }),
  });

  if (!resendVentas.ok) {
    const detalle = await resendVentas.text();
    return new Response("error al mandar el mail a ventas: " + detalle, { status: 500 });
  }

  const htmlComprador = `
    <p>¡Hola ${pedido.comprador_nombre}! Recibimos tu pedido en De Montoya.</p>
    ${tablaItems}
    <p><strong>Total: ${formatearMoneda(pedido.total)}</strong></p>
    <p>Te vamos a contactar por WhatsApp o email para coordinar el pago y la entrega.</p>
    <p style="color:#555;">Gracias por elegirnos.<br/>De Montoya — Carnes Entrerrianas, desde 1882.</p>
  `;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: pedido.comprador_email,
      subject: "Recibimos tu pedido — De Montoya",
      html: htmlComprador,
    }),
  });

  return new Response("ok", { status: 200 });
});
