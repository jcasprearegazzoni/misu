import { z } from "zod";

function emptyToUndefined(value: unknown) {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}

const optionalUsernameSchema = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .min(3, "El username debe tener al menos 3 caracteres.")
    .max(30, "El username puede tener como máximo 30 caracteres.")
    .regex(/^[A-Za-z0-9_]+$/, "El username solo puede contener letras, números y guion bajo.")
    .optional(),
);

const optionalBioSchema = z.preprocess(
  emptyToUndefined,
  z.string().trim().max(300, "La bio puede tener como máximo 300 caracteres.").optional(),
);

export const profesorProfileSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres."),
  username: optionalUsernameSchema,
  bio: optionalBioSchema,
  sport: z.enum(["tenis", "padel", "ambos"], "Seleccioná un deporte válido."),
  provincia: z.string().trim().min(1, "Seleccioná una provincia."),
  municipio: z.string().trim().min(1, "Seleccioná un municipio."),
});

export type ProfesorProfileInput = z.infer<typeof profesorProfileSchema>;
