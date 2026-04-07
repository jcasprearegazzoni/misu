import { z } from "zod";

const categoryPadelSchema = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : v),
  z.enum(["Principiante", "8va", "7ma", "6ta", "5ta", "4ta", "3ra", "2da", "1ra"]).nullable(),
);

const categoryTenisSchema = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : v),
  z.enum(["Principiante", "Intermedio", "Avanzado"]).nullable(),
);

export const alumnoProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(80, "El nombre es demasiado largo")
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]+$/, "El nombre solo puede contener letras y espacios"),
    sport: z.enum(["tenis", "padel", "ambos"], { message: "Seleccioná un deporte válido." }),
    category_padel: categoryPadelSchema,
    category_tenis: categoryTenisSchema,
    branch: z.enum(["Caballero", "Dama"], { message: "Seleccioná una rama válida." }),
    provincia: z.string().trim().min(1, "Seleccioná una provincia."),
    municipio: z.string().trim().min(1, "Seleccioná un municipio."),
    localidad: z.string().trim().max(100).optional(),
    celular: z.string().trim().max(20).optional(),
    has_paleta: z.preprocess((val) => val === "on" || val === "si", z.boolean()),
    has_raqueta: z.preprocess((val) => val === "on" || val === "si", z.boolean()),
  })
  .superRefine((data, ctx) => {
    if ((data.sport === "padel" || data.sport === "ambos") && data.category_padel === null) {
      ctx.addIssue({
        code: "custom",
        path: ["category_padel"],
        message: "Seleccioná tu categoría de pádel.",
      });
    }
    if ((data.sport === "tenis" || data.sport === "ambos") && data.category_tenis === null) {
      ctx.addIssue({
        code: "custom",
        path: ["category_tenis"],
        message: "Seleccioná tu categoría de tenis.",
      });
    }
  });

export type AlumnoProfileInput = z.infer<typeof alumnoProfileSchema>;
