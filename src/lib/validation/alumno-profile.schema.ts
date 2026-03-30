import { z } from "zod";

const categorySchema = z.enum(
  ["Principiante", "8va", "7ma", "6ta", "5ta", "4ta", "3ra", "2da", "1ra"],
  "Selecciona una categoria valida.",
);

const branchSchema = z.enum(["Caballero", "Dama"], "Selecciona una rama valida.");

// El checkbox envía "on" cuando está marcado y null cuando no lo está.
const hasEquipmentSchema = z.preprocess(
  (val) => val === "on" || val === "si",
  z.boolean(),
);

export const alumnoProfileSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres."),
  category: categorySchema,
  branch: branchSchema,
  provincia: z.string().trim().min(1, "Seleccioná una provincia."),
  municipio: z.string().trim().min(1, "Seleccioná un municipio."),
  has_equipment: hasEquipmentSchema,
});

export type AlumnoProfileInput = z.infer<typeof alumnoProfileSchema>;
