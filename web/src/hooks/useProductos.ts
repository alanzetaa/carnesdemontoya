import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

/** Catálogo público: solo productos activos, ordenados como los dejó el admin. */
export function useProductos() {
  return useQuery({
    queryKey: ["productos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .eq("activo", true)
        .order("categoria")
        .order("orden");
      if (error) throw error;
      return data;
    },
  });
}
