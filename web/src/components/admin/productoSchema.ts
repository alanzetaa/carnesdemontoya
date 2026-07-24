import { z } from "zod";

export const productoSchema = z.object({
  nombre: z.string().min(1, "Campo obligatorio"),
  descripcion: z.string().optional(),
  categoria: z.enum(["corte", "combo"]),
  precio: z.number().positive("Tiene que ser mayor a 0"),
  unidad: z.enum(["kg", "caja", "unidad"]),
  pesoReferencia: z.string().optional(),
  stock: z.number().min(0, "No puede ser negativo"),
  activo: z.boolean(),
});

export type ProductoFormValues = z.infer<typeof productoSchema>;
