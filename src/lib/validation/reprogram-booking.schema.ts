import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

const bookingTypeEnum = z.enum(["individual", "dobles", "trio", "grupal"]);

export const reprogramBookingSchema = z
  .object({
    booking_id: z.coerce.number().int().positive("Booking invalido."),
    new_date: z.string().regex(dateRegex, "Selecciona una fecha valida."),
    new_start_time: z.string().regex(timeRegex, "Selecciona una hora de inicio valida."),
    new_end_time: z.string().regex(timeRegex, "Selecciona una hora de fin valida."),
    new_type: bookingTypeEnum.optional(),
  })
  .refine((data) => timeToMinutes(data.new_start_time) < timeToMinutes(data.new_end_time), {
    message: "La hora de inicio debe ser menor que la hora de fin.",
    path: ["new_end_time"],
  });

export type ReprogramBookingInput = z.infer<typeof reprogramBookingSchema>;
