import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { supabase } from "../lib/supabaseClient";
import { useNominatimSearch } from "../hooks/useNominatimSearch";
import { formatUbicacionSugerencia, extraerLocalidad, extraerProvincia, type NominatimResult } from "../utils/ubicacion";
import { normalizeWhatsapp, formatWhatsappDisplay } from "../utils/format";
import { perfilSchema, type PerfilFormValues } from "../components/perfil/perfilSchema";
import { TerminosModal } from "../components/perfil/TerminosModal";
import { TERMINOS_VERSION_ACTUAL } from "../constants/terminos";

export function PerfilPage() {
  const { session, profile, refetchProfile } = useAuth();
  const { showToast } = useToast();
  const [terminosOpen, setTerminosOpen] = useState(false);
  const [direccionQuery, setDireccionQuery] = useState("");
  const [direccionVerificada, setDireccionVerificada] = useState(false);
  const [sugerenciasVisibles, setSugerenciasVisibles] = useState(false);
  const [localidadSeleccionada, setLocalidadSeleccionada] = useState<{ localidad: string; provincia: string } | null>(
    null
  );
  const { suggestions, loading: buscandoDireccion } = useNominatimSearch(direccionQuery);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilSchema),
    defaultValues: { nombre: "", apellido: "", direccion: "", whatsapp: "", terminosAceptados: false },
  });

  useEffect(() => {
    if (!profile) return;
    reset({
      nombre: profile.nombre,
      apellido: profile.apellido,
      direccion: profile.direccion,
      whatsapp: profile.whatsapp ? formatWhatsappDisplay(profile.whatsapp) : "",
      terminosAceptados: profile.terminos_version_aceptada >= TERMINOS_VERSION_ACTUAL,
    });
    setDireccionQuery(profile.direccion ?? "");
    setDireccionVerificada(Boolean(profile.direccion));
    if (profile.localidad || profile.provincia) {
      setLocalidadSeleccionada({ localidad: profile.localidad ?? "", provincia: profile.provincia ?? "" });
    }
  }, [profile, reset]);

  function elegirSugerencia(s: NominatimResult) {
    const texto = formatUbicacionSugerencia(s);
    setValue("direccion", texto, { shouldValidate: true });
    setDireccionQuery(texto);
    setDireccionVerificada(true);
    setSugerenciasVisibles(false);
    setLocalidadSeleccionada({ localidad: extraerLocalidad(s), provincia: extraerProvincia(s) });
  }

  async function onSubmit(values: PerfilFormValues) {
    if (!session) return;
    const { error } = await supabase.from("profiles").upsert({
      id: session.user.id,
      nombre: values.nombre.trim(),
      apellido: values.apellido.trim(),
      email: session.user.email ?? "",
      direccion: values.direccion.trim(),
      localidad: localidadSeleccionada?.localidad || profile?.localidad || null,
      provincia: localidadSeleccionada?.provincia || profile?.provincia || null,
      whatsapp: values.whatsapp ? normalizeWhatsapp(values.whatsapp) : null,
      terminos_version_aceptada: TERMINOS_VERSION_ACTUAL,
      terminos_aceptados_at: new Date().toISOString(),
    });
    if (error) {
      showToast(error.message);
      return;
    }
    await refetchProfile();
    showToast("Perfil guardado.");
  }

  return (
    <div className="app-content-inner">
      <h2>Mi perfil</h2>
      <p className="hint">
        Completá tus datos de envío — los usamos para coordinar la entrega de tus pedidos.
      </p>
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} style={{ maxWidth: 520 }}>
        <div className="form-row two-cols">
          <div className="field">
            <label htmlFor="pNombre">Nombre *</label>
            <input id="pNombre" {...register("nombre")} />
            {errors.nombre && <p className="field-error">{errors.nombre.message}</p>}
          </div>
          <div className="field">
            <label htmlFor="pApellido">Apellido *</label>
            <input id="pApellido" {...register("apellido")} />
            {errors.apellido && <p className="field-error">{errors.apellido.message}</p>}
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="pEmail">Email</label>
            <input id="pEmail" value={session?.user.email ?? ""} disabled />
          </div>
        </div>

        <div className="form-row">
          <div className="field autocomplete-wrap">
            <label htmlFor="pDireccion">Dirección de envío *</label>
            <Controller
              name="direccion"
              control={control}
              render={({ field }) => (
                <div className="field-with-check">
                  <input
                    id="pDireccion"
                    {...field}
                    autoComplete="off"
                    placeholder="Calle, altura, localidad"
                    onChange={(e) => {
                      field.onChange(e);
                      setDireccionQuery(e.target.value);
                      setDireccionVerificada(false);
                      setSugerenciasVisibles(true);
                    }}
                    onFocus={() => setSugerenciasVisibles(true)}
                    onBlur={() => {
                      field.onBlur();
                      window.setTimeout(() => setSugerenciasVisibles(false), 150);
                    }}
                  />
                  {direccionVerificada && <span className="field-check" title="Dirección verificada">✓</span>}
                </div>
              )}
            />
            {sugerenciasVisibles && (buscandoDireccion || suggestions.length > 0) && (
              <ul className="autocomplete-suggestions">
                {buscandoDireccion && <li className="autocomplete-loading">Buscando…</li>}
                {suggestions.map((s, i) => (
                  <li key={i}>
                    <button type="button" onMouseDown={() => elegirSugerencia(s)}>
                      {formatUbicacionSugerencia(s)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {errors.direccion && <p className="field-error">{errors.direccion.message}</p>}
            <p className="hint" style={{ margin: "4px 0 0" }}>
              Elegí una sugerencia de la lista para verificar la dirección (recomendado, no obligatorio).
            </p>
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="pWhatsapp">WhatsApp (opcional)</label>
            <input id="pWhatsapp" placeholder="Ej: 011 15-1234-5678" {...register("whatsapp")} />
            {errors.whatsapp && <p className="field-error">{errors.whatsapp.message}</p>}
          </div>
        </div>

        <label className="checkbox-row">
          <input type="checkbox" {...register("terminosAceptados")} />
          <span>
            Acepto los{" "}
            <button type="button" className="link-btn" onClick={() => setTerminosOpen(true)}>
              Términos y Condiciones
            </button>
          </span>
        </label>
        {errors.terminosAceptados && <p className="field-error">{errors.terminosAceptados.message}</p>}

        <div className="form-actions">
          <button type="submit" className="btn btn-dark" disabled={isSubmitting}>
            Guardar perfil
          </button>
        </div>
      </form>

      <TerminosModal open={terminosOpen} onClose={() => setTerminosOpen(false)} />
    </div>
  );
}
