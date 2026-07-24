# Reglas de la plataforma — Carnes de Montoya

Este archivo es distinto de [CLAUDE.md](CLAUDE.md): CLAUDE.md documenta
**cómo está armado** el código. Acá se documentan las **reglas de
negocio** — el "por qué" y "cómo se comporta" la plataforma de cara a quien
la usa.

## El pedido es una solicitud, no un cobro

**Decisión explícita del dueño**: por ahora no hay cobro online (sin
Mercado Pago ni ningún otro medio de pago integrado). Confirmar el pedido en
la plataforma solo genera la solicitud — un mail a `ventas@demontoya.com`
con el detalle y otro de confirmación al comprador — y el pago y la entrega
se coordinan después, directamente por WhatsApp o email. Si en algún
momento se decide cobrar online, es un cambio grande (cuenta de Mercado Pago
business, webhooks, conciliación) para charlar aparte.

## Stock automático, con precio y datos del comprador "congelados"

**Decisión explícita del dueño**: a diferencia de un simple número de
referencia, el stock de cada corte/combo se descuenta automáticamente
cuando se confirma un pedido (`crear_pedido`, ver CLAUDE.md), y se reintegra
si el pedido se cancela desde HQ.

Todo lo que podría cambiar después de hecho el pedido queda **guardado como
foto del momento** (snapshot) en las tablas `pedidos`/`pedido_items`, no
como referencia a otra tabla:

- El **precio** de cada ítem es el que tenía el producto al momento de
  pedir — si el admin sube el precio de un corte después, los pedidos
  viejos no cambian.
- El **nombre, apellido y email del comprador** se copian a `pedidos` en
  vez de depender de `profiles` — así, si HQ borra el perfil de esa
  persona (ver más abajo), el pedido sigue apareciendo completo en el
  historial de HQ, no desaparece ni queda con datos vacíos.

## Zona de envío y cadena de frío

Hoy se envía solo a **Rosario** y **Buenos Aires**, con vehículo
refrigerado. No hay un bloqueo automático por código postal o provincia en
el formulario — se avisa por texto en el catálogo/checkout y, si alguien de
otra zona hace un pedido, se resuelve al coordinar por WhatsApp (no es una
regla dura del sistema, es una conversación con el cliente).

## Registro simple, sin DNI/CUIT

**Decisión explícita del dueño**: el registro tiene que ser "más básico"
que en Metales Julio. Los únicos datos obligatorios son nombre, apellido,
email y dirección de envío; WhatsApp es opcional. No se pide DNI ni CUIT
(sí se pedían en Metales Julio, por el tipo de comunidad que es).

## Cuentas: suspender y eliminar

**Decisión explícita del dueño** ("HQ con toda la data para manejar stock,
estadísticas, borrar perfiles, suspender, etc"): desde HQ De Montoya se
puede **suspender** una cuenta por un plazo (1/7/30 días o indefinido) —
mientras está suspendida, `crear_pedido` rechaza nuevos pedidos con un
mensaje claro, aunque la persona siga pudiendo iniciar sesión y ver su
historial. También se puede **eliminar el perfil** — esto borra sus datos
de `profiles`, pero no la cuenta de autenticación (`auth.users`, requiere la
service_role key, se hace a mano desde el Dashboard si hace falta) ni su
historial de pedidos (que queda con los datos del comprador "congelados",
ver arriba).

## Catálogo solo para cuentas registradas

**Decisión explícita del dueño** (revisada después de ver la landing con el
catálogo público: "los productos tienen que aparecer una vez que
ingresas"): el catálogo con precios **no se muestra en la landing
pública** — se ve una página de presentación de la marca ("Qué vas a
encontrar" con las categorías, sin precios ni fotos de producto puntuales)
pensada para dar ganas de crear una cuenta. Recién adentro (`/catalogo`,
con sesión iniciada) se ve el catálogo real con precios y stock, y ahí se
arma el carrito y se confirma el pedido. La tabla `productos` tiene RLS que
bloquea la lectura a `anon` (sin sesión) — ni siquiera pegándole directo a
la API se puede ver el catálogo sin cuenta.

## Términos y Condiciones

Mismo mecanismo que Metales Julio: versionados con un número
(`TERMINOS_VERSION_ACTUAL` en `constants/terminos.ts`). Si el texto cambia
de forma relevante, se sube ese número y a todas las cuentas les vuelve a
aparecer la casilla destildada — no pueden confirmar un nuevo pedido hasta
volver a aceptar.

## Mails de pedido, no de mensajería

A diferencia de Metales Julio (que tiene mensajería interna entre
miembros), acá no hay chat: el único mail automático es el de "pedido
nuevo" (a ventas y de confirmación al comprador). No hay preferencia de
"avisarme por mail" para destildar — son transaccionales, no notificaciones
opcionales.
