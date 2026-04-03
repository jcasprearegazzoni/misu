import { z } from "zod";

function emptyToUndefined(value: unknown) {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}

export const clubPerfilSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres."),
  username: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .min(3, "Minimo 3 caracteres")
      .max(30, "Maximo 30 caracteres")
      .regex(/^[a-z0-9_-]+$/, "Solo letras minusculas, numeros, guiones y guiones bajos")
      .optional(),
  ),
  direccion: z.preprocess(emptyToUndefined, z.string().trim().max(200).optional()),
  telefono: z.preprocess(emptyToUndefined, z.string().trim().max(30).optional()),
  email_contacto: z.preprocess(
    emptyToUndefined,
    z.string().trim().email("Ingresá un email válido.").optional(),
  ),
  website: z.preprocess(emptyToUndefined, z.string().trim().max(200).optional()),
  tiene_bar: z.boolean().default(false),
  tiene_estacionamiento: z.boolean().default(false),
  alquila_paletas: z.boolean().default(false),
  alquila_raquetas: z.boolean().default(false),
  tiene_vestuario: z.boolean().default(false),
  tiene_parrilla: z.boolean().default(false),
});

export type ClubPerfilInput = z.infer<typeof clubPerfilSchema>;
