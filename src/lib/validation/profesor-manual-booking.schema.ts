import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export const profesorManualBookingSchema = z
  .object({
    alumno_id: z.uuid("Selecciona un alumno valido."),
    date: z.string().regex(dateRegex, "Selecciona una fecha valida."),
    start_time: z.string().regex(timeRegex, "Selecciona una hora de inicio valida."),
    end_time: z.string().regex(timeRegex, "Selecciona una hora de fin valida."),
    type: z.enum(["individual", "dobles", "trio", "grupal"], "Tipo de clase invalido."),
  })
  .refine((data) => timeToMinutes(data.start_time) < timeToMinutes(data.end_time), {
    message: "La hora de inicio debe ser menor que la hora de fin.",
    path: ["end_time"],
  });

export type ProfesorManualBookingInput = z.infer<typeof profesorManualBookingSchema>;
