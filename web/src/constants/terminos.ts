/**
 * Versión actual de los Términos y Condiciones. Si el texto cambia de forma
 * relevante, subir este número (no alcanza con editar el texto solo) -- eso
 * hace que a TODAS las personas les vuelva a aparecer la casilla destildada,
 * y no van a poder confirmar un pedido hasta que vuelvan a aceptar.
 *
 * IMPORTANTE: este número también está hardcodeado en supabase-schema.sql
 * (el default de profiles.terminos_version_aceptada es 0, no este número --
 * la comparación "¿aceptó la versión vigente?" se hace en el frontend).
 */
export const TERMINOS_VERSION_ACTUAL = 1;
