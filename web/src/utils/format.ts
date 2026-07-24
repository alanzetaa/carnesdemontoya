export function capitalizarNombre(str: string | null | undefined): string {
  return String(str ?? "")
    .trim()
    .toLowerCase()
    .replace(/(^|\s|-)([a-zá-ú])/g, (_, sep: string, letra: string) => sep + letra.toUpperCase());
}

export function formatFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatFechaCorta(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export function formatMoneda(valor: number | null | undefined): string {
  return (valor ?? 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

/**
 * Normaliza cualquier formato en el que alguien tipee su WhatsApp
 * ("011 15-4123-4567", "+54 9 341 4123456", "1141234567"...) a un único
 * formato de guardado: solo dígitos, con prefijo "549" (código país +
 * indicador de celular), listo para usar en un link wa.me/<numero>. Así
 * "siempre sale lo mismo" sin importar cómo lo haya tipeado la persona.
 */
export function normalizeWhatsapp(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2); // salida internacional
  if (digits.startsWith("54")) digits = digits.slice(2);
  if (digits.startsWith("9")) digits = digits.slice(1);
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.startsWith("15")) digits = digits.slice(2); // "15" viejo pegado al número local
  return digits ? "549" + digits : "";
}

/**
 * Muestra el WhatsApp guardado (formato normalizado "549...") de forma
 * legible. No separa código de área del resto del número (varía entre 2 y 4
 * dígitos según la ciudad y no hay forma confiable de saber cuál sin una
 * tabla de prefijos) -- solo agrupa los últimos 4 dígitos con un guion, que
 * alcanza para que se lea bien.
 */
export function formatWhatsappDisplay(normalized: string | null | undefined): string {
  if (!normalized) return "—";
  const local = normalized.replace(/^549/, "");
  if (local.length <= 4) return `+54 9 ${local}`;
  return `+54 9 ${local.slice(0, -4)}-${local.slice(-4)}`;
}

export function whatsappLink(normalized: string | null | undefined, mensaje?: string): string {
  if (!normalized) return "#";
  const base = `https://wa.me/${normalized}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}
