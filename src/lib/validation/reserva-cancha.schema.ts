import { z } from "zod";

export const reservaCanchaSchema = z.object({
  club_id: z.coerce.number().int().positive(),
  cancha_id: z.coerce.number().int().positive(),
  deporte: z.enum(["tenis", "padel", "futbol"]),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  duracion_minutos: z.coerce.number().int().refine((value) => [60, 90, 120].includes(value)),
  nombre: z.string().trim().min(2, "El nombre es obligatorio."),
  telefono: z.string().trim().min(6, "El celular es obligatorio."),
  email: z.string().trim().email("El email no es válido."),
});

export type ReservaCanchaInput = z.infer<typeof reservaCanchaSchema>;
