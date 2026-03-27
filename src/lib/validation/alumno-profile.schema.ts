import { z } from "zod";

const categorySchema = z.enum(
  ["Principiante", "8va", "7ma", "6ta", "5ta", "4ta", "3ra", "2da", "1ra"],
  "Selecciona una categoria valida.",
);

const branchSchema = z.enum(["Caballero", "Dama"], "Selecciona una rama valida.");

const hasEquipmentSchema = z
  .enum(["si", "no"], "Selecciona si tienes paleta o raqueta.")
  .transform((value) => value === "si");

export const alumnoProfileSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres."),
  category: categorySchema,
  branch: branchSchema,
  has_equipment: hasEquipmentSchema,
});

export type AlumnoProfileInput = z.infer<typeof alumnoProfileSchema>;
