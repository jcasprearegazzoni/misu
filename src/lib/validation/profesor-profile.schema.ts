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
    .max(30, "El username puede tener como maximo 30 caracteres.")
    .regex(/^[A-Za-z0-9_]+$/, "El username solo puede contener letras, numeros y guion bajo.")
    .optional(),
);

const optionalUrlSchema = z.preprocess(
  emptyToUndefined,
  z.url("Ingresa una URL valida para el avatar.").optional(),
);

const optionalBioSchema = z.preprocess(
  emptyToUndefined,
  z.string().trim().max(300, "La bio puede tener como maximo 300 caracteres.").optional(),
);

export const profesorProfileSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres."),
  username: optionalUsernameSchema,
  avatar_url: optionalUrlSchema,
  bio: optionalBioSchema,
  sport: z.enum(["tenis", "padel", "ambos"], "Selecciona un deporte valido."),
});

export type ProfesorProfileInput = z.infer<typeof profesorProfileSchema>;
