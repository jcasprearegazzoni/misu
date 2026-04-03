import { z } from "zod";

function emptyToUndefined(value: unknown) {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}

// Schema para crear/editar un club placeholder (datos públicos).
export const placeholderClubSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre del club debe tener al menos 2 caracteres.")
    .max(80, "El nombre del club puede tener como máximo 80 caracteres."),
  direccion: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(160, "La dirección puede tener como máximo 160 caracteres.").optional(),
  ),
});

// Schema para editar costos de cancha en la relación club-profesor.
export const clubCostSchema = z
  .object({
    club_id: z.coerce.number().int().positive("Club inválido."),
    court_cost_mode: z.enum(["fixed_per_hour", "per_student_percentage"], {
      message: "Seleccioná un modo de costo válido.",
    }),
    court_cost_per_hour: z.preprocess(
      emptyToUndefined,
      z.coerce
        .number()
        .positive("Ingresá un costo por hora mayor a 0.")
        .max(99999999.99)
        .optional(),
    ),
    court_percentage_per_student: z.preprocess(
      emptyToUndefined,
      z.coerce
        .number()
        .positive("Ingresá un porcentaje mayor a 0.")
        .max(100, "El porcentaje no puede superar 100.")
        .optional(),
    ),
  })
  .superRefine((value, ctx) => {
    if (value.court_cost_mode === "fixed_per_hour" && value.court_cost_per_hour === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["court_cost_per_hour"],
        message: "Ingresá el costo por hora de la cancha.",
      });
    }
    if (
      value.court_cost_mode === "per_student_percentage" &&
      value.court_percentage_per_student === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["court_percentage_per_student"],
        message: "Ingresá el porcentaje por alumno.",
      });
    }
  });

export const clubIdSchema = z.object({
  club_id: z.coerce.number().int().positive("Club inválido."),
});

export type PlaceholderClubInput = z.infer<typeof placeholderClubSchema>;
export type ClubCostInput = z.infer<typeof clubCostSchema>;
