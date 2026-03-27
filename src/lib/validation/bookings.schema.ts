import { z } from "zod";

export const createBookingSchema = z.object({
  profesor_id: z.uuid("Profesor invalido."),
  date: z.iso.date("Fecha invalida."),
  start_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, "Hora de inicio invalida."),
  end_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, "Hora de fin invalida."),
  type: z.enum(["individual", "dobles", "trio", "grupal"], "Tipo de clase invalido."),
  weeks_count: z.coerce
    .number()
    .int("Selecciona una cantidad de semanas valida.")
    .refine((value) => [1, 4, 8].includes(value), "Selecciona 1, 4 o 8 semanas."),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
