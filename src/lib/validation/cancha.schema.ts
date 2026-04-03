import { z } from "zod";

export const canchaSchema = z.object({
  nombre: z.string().trim().min(1, "Ingresá un nombre para la cancha."),
  deporte: z.enum(["tenis", "padel", "futbol", "otro"], "Seleccioná un deporte válido."),
  pared: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.string().nullable(),
  ),
  superficie: z.enum(
    ["sintetico", "polvo_ladrillo", "cemento", "blindex", "f5", "f7", "f8", "f11", "otro"],
    "Seleccioná una característica válida.",
  ),
  techada: z.preprocess((val) => val === "on", z.boolean()).default(false),
  iluminacion: z.preprocess((val) => val === "on", z.boolean()).default(false),
}).superRefine((value, ctx) => {
  if (value.deporte === "padel") {
    const pared = typeof value.pared === "string" ? value.pared : null;
    if (!pared) {
      ctx.addIssue({
        code: "custom",
        path: ["pared"],
        message: "Seleccioná el tipo de pared.",
      });
    }
    if (pared && !["blindex", "muro", "mixto"].includes(pared)) {
      ctx.addIssue({
        code: "custom",
        path: ["pared"],
        message: "Seleccioná una pared válida.",
      });
    }
  }
});

export type CanchaInput = z.infer<typeof canchaSchema>;
