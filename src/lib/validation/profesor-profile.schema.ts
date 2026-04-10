import { z } from "zod";

function emptyToUndefined(value: unknown) {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}

const optionalBioSchema = z.preprocess(
  emptyToUndefined,
  z.string().trim().max(300, "La bio puede tener como máximo 300 caracteres.").optional(),
);

export const profesorProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "El nombre es demasiado largo")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]+$/, "El nombre solo puede contener letras y espacios"),
  bio: optionalBioSchema,
  sport: z.enum(["tenis", "padel", "ambos"], "Seleccioná un deporte válido."),
  provincia: z.string().trim().min(1, "Seleccioná una provincia."),
  municipio: z.string().trim().min(1, "Seleccioná un municipio."),
  localidad: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
});

export type ProfesorProfileInput = z.infer<typeof profesorProfileSchema>;
