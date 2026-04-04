/**
 * Genera un slug de username a partir de un nombre.
 * Remueve tildes, convierte a minúsculas y concatena las palabras sin separador.
 * Ej: "Juan Cruz" → "juancruz", "Club Tenis Norte" → "clubtenisnorte"
 */
export function slugifyUsername(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // eliminar tildes
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "") // eliminar todo lo que no sea letra o número
    .slice(0, 25); // dejar margen para sufijo numérico en caso de conflicto
}

/**
 * Genera un username único verificando contra la DB.
 * Intenta el slug base, luego slug1, slug2... hasta encontrar uno libre.
 */
export async function generateUniqueUsername(
  name: string,
  checkExists: (username: string) => Promise<boolean>,
): Promise<string> {
  const base = slugifyUsername(name) || "usuario";

  if (!(await checkExists(base))) return base;

  for (let i = 1; i <= 99; i++) {
    const candidate = `${base}${i}`;
    if (!(await checkExists(candidate))) return candidate;
  }

  // Fallback improbable: sufijo con timestamp reducido
  return `${base}${Date.now().toString(36).slice(-4)}`;
}
