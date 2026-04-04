import { z } from "zod";

export const canchaSchema = z
  .object({
    nombre: z.string().trim().min(1, "Ingresa un nombre para la cancha."),
    deporte: z.enum(["tenis", "padel", "futbol"], "Selecciona un deporte valido."),
    pared: z.preprocess(
      (value) => (value === "" || value === null || value === undefined ? null : value),
      z.string().nullable(),
    ),
    superficie: z.enum(
      ["sintetico", "polvo_ladrillo", "cemento", "blindex", "f5", "f7", "f8", "f11"],
      "Selecciona una caracteristica valida.",
    ),
    techada: z.preprocess((value) => value === "on", z.boolean()).default(false),
    iluminacion: z.preprocess((value) => value === "on", z.boolean()).default(false),
  })
  .superRefine((value, ctx) => {
    if (value.deporte === "padel") {
      const pared = typeof value.pared === "string" ? value.pared : null;
      if (!pared) {
        ctx.addIssue({
          code: "custom",
          path: ["pared"],
          message: "Selecciona el tipo de pared.",
        });
      }
      if (pared && !["blindex", "muro", "mixto"].includes(pared)) {
        ctx.addIssue({
          code: "custom",
          path: ["pared"],
          message: "Selecciona una pared valida.",
        });
      }
    }
  });

export type CanchaInput = z.infer<typeof canchaSchema>;
