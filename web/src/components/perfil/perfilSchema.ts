import { z } from "zod";

export const perfilSchema = z.object({
  nombre: z.string().min(1, "Campo obligatorio"),
  apellido: z.string().min(1, "Campo obligatorio"),
  direccion: z.string().min(6, "Ingresá tu dirección completa"),
  localidad: z.string().optional(),
  provincia: z.string().optional(),
  whatsapp: z
    .string()
    .optional()
    .refine((v) => !v || v.replace(/\D/g, "").length >= 8, {
      message: "Ingresá un WhatsApp válido (con código de área)",
    }),
  terminosAceptados: z
    .boolean()
    .refine((v) => v === true, { message: "Tenés que aceptar los Términos y Condiciones para continuar" }),
});

export type PerfilFormValues = z.infer<typeof perfilSchema>;
