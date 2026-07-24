-- ============================================================================
-- Carnes de Montoya — carga inicial de productos (cortes y combos)
-- ============================================================================
-- Datos tomados de los flyers "Caja Familiar de Montoya" y "De Montoya
-- Premium". Correr una sola vez en el SQL Editor de Supabase, DESPUÉS de
-- supabase-schema.sql.
--
-- El stock inicial es un valor de arranque (placeholder) para que el
-- catálogo no aparezca vacío -- ajustalo a la cantidad real desde HQ De
-- Montoya > Stock apenas tengas el número real de cada corte/combo.
-- Las fotos no se cargan acá (hay que subirlas a mano desde HQ, editando
-- cada producto) porque las imágenes de los flyers no son fotos de
-- producto en sí.
-- ============================================================================

insert into public.productos (nombre, descripcion, categoria, precio, unidad, peso_referencia, stock, activo, orden)
values
  (
    'Caja Familiar de Montoya',
    'Simplificamos tus comidas diarias: 1,2 kg Corte Premium para horno/parrilla, 1,5 kg Milanesa feteada lista, 1,5 kg Picada Smash-Burger y 1 kg Pulpa especial para guisos.',
    'combo',
    17300,
    'kg',
    'Caja de 5 / 5,5 kg — total aprox. $85.000–$95.000',
    15,
    true,
    1
  ),
  (
    'Lomo',
    'Corte premium envasado al vacío, madurado entre 7 y 21 días.',
    'corte',
    30000,
    'kg',
    null,
    20,
    true,
    1
  ),
  (
    'Entraña',
    'Corte premium envasado al vacío, madurado entre 7 y 21 días.',
    'corte',
    28000,
    'kg',
    null,
    20,
    true,
    2
  ),
  (
    'Ojo de Bife',
    'Corte premium envasado al vacío, madurado entre 7 y 21 días.',
    'corte',
    27000,
    'kg',
    null,
    20,
    true,
    3
  ),
  (
    'Bife de Chorizo',
    'Corte premium envasado al vacío, madurado entre 7 y 21 días.',
    'corte',
    25000,
    'kg',
    null,
    20,
    true,
    4
  ),
  (
    'Asado Banderita',
    'Corte premium envasado al vacío, madurado entre 7 y 21 días.',
    'corte',
    20000,
    'kg',
    null,
    20,
    true,
    5
  );
