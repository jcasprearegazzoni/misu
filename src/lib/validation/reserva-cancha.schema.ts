import { z } from "zod";

export const reservaCanchaSchema = z.object({
  club_id: z.coerce.number().int().positive(),
  cancha_id: z.coerce.number().int().positive(),
  deporte: z.enum(["tenis", "padel", "futbol"]),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  duracion_minutos: z.coerce.number().int().refine((value) => [60, 90, 120].includes(value)),
  nombre: z.string().trim().min(2),
  telefono: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().min(6).optional(),
  ),
  email: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().email().optional(),
  ),
});

export type ReservaCanchaInput = z.infer<typeof reservaCanchaSchema>;
