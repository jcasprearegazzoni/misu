import { z } from "zod";

function emptyToUndefined(value: unknown) {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export const availabilitySchema = z
  .object({
    id: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
    day_of_week: z.coerce
      .number()
      .int("Selecciona un dia valido.")
      .min(0, "Selecciona un dia valido.")
      .max(6, "Selecciona un dia valido."),
    start_time: z.string().regex(timeRegex, "Hora de inicio invalida."),
    end_time: z.string().regex(timeRegex, "Hora de fin invalida."),
    slot_duration_minutes: z.coerce
      .number()
      .int("La duracion debe ser un numero entero.")
      .positive("La duracion debe ser mayor a 0."),
  })
  .refine((data) => timeToMinutes(data.start_time) < timeToMinutes(data.end_time), {
    message: "La hora de inicio debe ser menor que la hora de fin.",
    path: ["end_time"],
  });

export const blockedDateSchema = z.object({
  start_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Selecciona una fecha y hora inicial valida."),
  end_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Selecciona una fecha y hora final valida."),
  reason: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(200, "El motivo puede tener como maximo 200 caracteres.").optional(),
  ),
}).refine((data) => new Date(data.start_at) < new Date(data.end_at), {
  message: "La fecha y hora de inicio debe ser menor que la de fin.",
  path: ["end_at"],
});

export type AvailabilityInput = z.infer<typeof availabilitySchema>;
export type BlockedDateInput = z.infer<typeof blockedDateSchema>;
