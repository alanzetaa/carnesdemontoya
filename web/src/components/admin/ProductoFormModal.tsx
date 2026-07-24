import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "../ui/Modal";
import { supabase, PRODUCTOS_BUCKET, fotoProductoUrl } from "../../lib/supabaseClient";
import { useToast } from "../../context/ToastContext";
import { productoSchema, type ProductoFormValues } from "./productoSchema";
import type { ProductoRow } from "../../lib/database.types";

interface Props {
  open: boolean;
  producto: ProductoRow | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ProductoFormModal({ open, producto, onClose, onSaved }: Props) {
  const { showToast } = useToast();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductoFormValues>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      categoria: "corte",
      precio: 0,
      unidad: "kg",
      pesoReferencia: "",
      stock: 0,
      activo: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    setArchivo(null);
    reset(
      producto
        ? {
            nombre: producto.nombre,
            descripcion: producto.descripcion ?? "",
            categoria: producto.categoria,
            precio: producto.precio,
            unidad: producto.unidad,
            pesoReferencia: producto.peso_referencia ?? "",
            stock: producto.stock,
            activo: producto.activo,
          }
        : {
            nombre: "",
            descripcion: "",
            categoria: "corte",
            precio: 0,
            unidad: "kg",
            pesoReferencia: "",
            stock: 0,
            activo: true,
          }
    );
  }, [open, producto, reset]);

  async function onSubmit(values: ProductoFormValues) {
    let imagenUrl = producto?.imagen_url ?? null;

    if (archivo) {
      setSubiendo(true);
      const path = `${crypto.randomUUID()}-${archivo.name}`;
      const { error: uploadError } = await supabase.storage.from(PRODUCTOS_BUCKET).upload(path, archivo);
      setSubiendo(false);
      if (uploadError) {
        showToast(uploadError.message);
        return;
      }
      imagenUrl = path;
    }

    const payload = {
      nombre: values.nombre.trim(),
      descripcion: values.descripcion?.trim() || null,
      categoria: values.categoria,
      precio: values.precio,
      unidad: values.unidad,
      peso_referencia: values.pesoReferencia?.trim() || null,
      stock: values.stock,
      activo: values.activo,
      imagen_url: imagenUrl,
    };

    const { error } = producto
      ? await supabase.from("productos").update(payload).eq("id", producto.id)
      : await supabase.from("productos").insert(payload);

    if (error) {
      showToast(error.message);
      return;
    }
    showToast(producto ? "Producto actualizado." : "Producto creado.");
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={producto ? "Editar producto" : "Nuevo producto"} maxWidth={480}>
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
        <div className="form-row">
          <div className="field">
            <label htmlFor="prNombre">Nombre *</label>
            <input id="prNombre" {...register("nombre")} />
            {errors.nombre && <p className="field-error">{errors.nombre.message}</p>}
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="prDescripcion">Descripción</label>
            <textarea id="prDescripcion" rows={2} {...register("descripcion")} />
          </div>
        </div>
        <div className="form-row two-cols">
          <div className="field">
            <label htmlFor="prCategoria">Categoría *</label>
            <select id="prCategoria" {...register("categoria")}>
              <option value="corte">Corte</option>
              <option value="combo">Combo / caja</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="prUnidad">Unidad *</label>
            <select id="prUnidad" {...register("unidad")}>
              <option value="kg">kg</option>
              <option value="caja">caja</option>
              <option value="unidad">unidad</option>
            </select>
          </div>
        </div>
        <div className="form-row two-cols">
          <div className="field">
            <label htmlFor="prPrecio">Precio ($) *</label>
            <input id="prPrecio" type="number" step="1" {...register("precio", { valueAsNumber: true })} />
            {errors.precio && <p className="field-error">{errors.precio.message}</p>}
          </div>
          <div className="field">
            <label htmlFor="prStock">Stock *</label>
            <input id="prStock" type="number" step="0.5" {...register("stock", { valueAsNumber: true })} />
            {errors.stock && <p className="field-error">{errors.stock.message}</p>}
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="prPeso">Peso de referencia (ej. "5/5,5 kg")</label>
            <input id="prPeso" {...register("pesoReferencia")} />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="prFoto">Foto</label>
            <input
              id="prFoto"
              type="file"
              accept="image/*"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            />
            {producto?.imagen_url && !archivo && (
              <img
                src={fotoProductoUrl(producto.imagen_url)}
                alt=""
                style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, marginTop: 8 }}
              />
            )}
          </div>
        </div>
        <label className="checkbox-row">
          <input type="checkbox" {...register("activo")} />
          <span>Visible en el catálogo</span>
        </label>
        <div className="form-actions">
          <button type="button" className="btn btn-outline-dark" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-dark" disabled={isSubmitting || subiendo}>
            {subiendo ? "Subiendo…" : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
