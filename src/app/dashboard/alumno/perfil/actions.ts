"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AlumnoPerfilActionResult = {
  errors: string[];
  redirectTo: string | null;
};

// --- Schemas ---
const nameSchema = z
  .string()
  .trim()
  .min(2, "El nombre debe tener al menos 2 caracteres.")
  .max(80, "El nombre es demasiado largo.")
  .regex(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]+$/, "El nombre solo puede contener letras y espacios.");

const sportSchema = z.enum(["tenis", "padel", "ambos"], {
  message: "Seleccioná un deporte válido.",
});

const categoryPadelSchema = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : v),
  z.enum(["Principiante", "8va", "7ma", "6ta", "5ta", "4ta", "3ra", "2da", "1ra"]).nullable(),
);

const categoryTenisSchema = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : v),
  z.enum(["Principiante", "Intermedio", "Avanzado"]).nullable(),
);

const branchSchema = z.enum(["Caballero", "Dama"], {
  message: "Seleccioná una rama válida.",
});

const provinciaSchema = z.string().trim().min(1, "Seleccioná una provincia.");
const municipioSchema = z.string().trim().min(1, "Seleccioná un municipio.");
const localidadSchema = z.string().trim().min(1, "Ingresá tu localidad.").max(100);
const celularSchema = z.string().trim().min(1, "Ingresá tu número de celular.").max(20);
const booleanCheckboxSchema = z.preprocess((val) => val === "on" || val === true || val === "si", z.boolean());

export async function saveAlumnoProfileAction(formData: FormData): Promise<AlumnoPerfilActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { errors: ["No autenticado."], redirectTo: null };
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!currentProfile || currentProfile.role !== "alumno") {
    return { errors: ["Solo los alumnos pueden editar este perfil."], redirectTo: null };
  }

  const errors: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePayload: Record<string, any> = {};

  // Nombre
  const nameParsed = nameSchema.safeParse(formData.get("name"));
  if (nameParsed.success) updatePayload.name = nameParsed.data;
  else errors.push(nameParsed.error.issues[0]?.message ?? "Nombre inválido.");

  // Rama
  const branchParsed = branchSchema.safeParse(formData.get("branch"));
  if (branchParsed.success) updatePayload.branch = branchParsed.data;
  else errors.push(branchParsed.error.issues[0]?.message ?? "Rama inválida.");

  // Deporte
  const sportParsed = sportSchema.safeParse(formData.get("sport"));
  if (sportParsed.success) updatePayload.sport = sportParsed.data;
  else errors.push(sportParsed.error.issues[0]?.message ?? "Deporte inválido.");
  const sport = sportParsed.success ? sportParsed.data : null;

  // Categoría pádel
  const categoryPadelParsed = categoryPadelSchema.safeParse(formData.get("category_padel"));
  const needsPadel = sport === "padel" || sport === "ambos";
  if (needsPadel) {
    if (!categoryPadelParsed.success || categoryPadelParsed.data === null)
      errors.push("Seleccioná tu categoría de pádel.");
    else updatePayload.category_padel = categoryPadelParsed.data;
  } else {
    updatePayload.category_padel = null;
  }

  // Categoría tenis
  const categoryTenisParsed = categoryTenisSchema.safeParse(formData.get("category_tenis"));
  const needsTenis = sport === "tenis" || sport === "ambos";
  if (needsTenis) {
    if (!categoryTenisParsed.success || categoryTenisParsed.data === null)
      errors.push("Seleccioná tu categoría de tenis.");
    else updatePayload.category_tenis = categoryTenisParsed.data;
  } else {
    updatePayload.category_tenis = null;
  }

  // Provincia
  const provinciaParsed = provinciaSchema.safeParse(formData.get("provincia"));
  if (provinciaParsed.success) updatePayload.provincia = provinciaParsed.data;
  else errors.push(provinciaParsed.error.issues[0]?.message ?? "Seleccioná una provincia.");

  // Municipio
  const municipioParsed = municipioSchema.safeParse(formData.get("municipio"));
  if (municipioParsed.success) updatePayload.zone = municipioParsed.data;
  else errors.push(municipioParsed.error.issues[0]?.message ?? "Seleccioná un municipio.");

  // Localidad: obligatoria fuera de CABA (en CABA el barrio ya la reemplaza)
  const esCaba = provinciaParsed.success && provinciaParsed.data === "caba";
  if (esCaba) {
    updatePayload.localidad = null;
  } else {
    const localidadParsed = localidadSchema.safeParse(formData.get("localidad"));
    if (localidadParsed.success) updatePayload.localidad = localidadParsed.data;
    else errors.push(localidadParsed.error.issues[0]?.message ?? "Ingresá tu localidad.");
  }

  // Celular
  const celularParsed = celularSchema.safeParse(formData.get("celular"));
  if (celularParsed.success) updatePayload.celular = celularParsed.data;
  else errors.push(celularParsed.error.issues[0]?.message ?? "Ingresá tu número de celular.");

  // Checkboxes
  const hasPaletaParsed = booleanCheckboxSchema.safeParse(formData.get("has_paleta"));
  updatePayload.has_paleta = hasPaletaParsed.success ? hasPaletaParsed.data : false;

  const hasRaquetaParsed = booleanCheckboxSchema.safeParse(formData.get("has_raqueta"));
  updatePayload.has_raqueta = hasRaquetaParsed.success ? hasRaquetaParsed.data : false;

  // Guardar campos válidos siempre (con o sin errores)
  if (Object.keys(updatePayload).length > 0) {
    const { error: dbError } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("user_id", user.id);

    if (dbError) {
      return { errors: ["No se pudo guardar el perfil. Intentá nuevamente."], redirectTo: null };
    }
  }

  if (errors.length > 0) {
    return { errors, redirectTo: null };
  }

  // Todo válido: invalidar caché y devolver redirect
  revalidatePath("/dashboard/alumno/perfil");
  revalidatePath("/dashboard/alumno/turnos");

  return { errors: [], redirectTo: "/dashboard/alumno/perfil?updated=1" };
}
