export interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  house_number?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  suburb?: string;
  city_district?: string;
  state?: string;
}

export interface NominatimResult {
  display_name: string;
  address?: NominatimAddress;
}

/** Arma un texto legible (calle+altura, localidad, provincia) a partir de una sugerencia de Nominatim. */
export function formatUbicacionSugerencia(d: NominatimResult): string {
  const a = d.address ?? {};
  const calle = a.road ?? a.pedestrian ?? "";
  const numero = a.house_number ?? "";
  const localidad = a.city ?? a.town ?? a.village ?? a.municipality ?? a.suburb ?? a.city_district ?? "";
  const provincia = a.state ?? "";

  const partes: string[] = [];
  if (calle) partes.push(calle + (numero ? ` ${numero}` : ""));
  if (localidad) partes.push(localidad);
  if (provincia && provincia !== localidad) partes.push(provincia);

  return partes.length ? partes.join(", ") : d.display_name;
}

/** Localidad sola (sin calle ni provincia), para guardar en profiles.localidad. */
export function extraerLocalidad(d: NominatimResult): string {
  const a = d.address ?? {};
  return a.city ?? a.town ?? a.village ?? a.municipality ?? a.suburb ?? a.city_district ?? "";
}

/** Provincia sola, para guardar en profiles.provincia. */
export function extraerProvincia(d: NominatimResult): string {
  return d.address?.state ?? "";
}
