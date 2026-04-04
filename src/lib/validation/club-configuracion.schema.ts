import { z } from "zod";

function parseMinutes(value: string) {
  const [hours, minutes] = value.split(":").map((item) => Number(item));
  return hours * 60 + minutes;
}

function isValidRange(start: string, end: string) {
  const startMinutes = parseMinutes(start);
  const endMinutes = parseMinutes(end);
  const normalizedEnd = endMinutes <= startMinutes ? endMinutes + 24 * 60 : endMinutes;
  return normalizedEnd > startMinutes;
}

export const configuracionSchema = z.object({
  confirmacion_automatica: z.boolean().default(true),
  cancelacion_horas_limite: z.coerce
    .number()
    .int("Ingresa un numero entero de horas.")
    .min(0, "La cancelacion no puede ser negativa.")
    .max(168, "La cancelacion no puede superar 168 horas."),
});

export const disponibilidadSchema = z.object({
  id: z.preprocess((value) => (value === "" || value === null ? undefined : value), z.coerce.number().int().positive().optional()),
  deporte: z.enum(["tenis", "padel", "futbol"]),
  day_of_week: z.coerce.number().int().min(0, "Dia invalido.").max(6, "Dia invalido."),
  apertura: z.string().regex(/^\d{2}:\d{2}$/, "El horario de apertura no es valido."),
  cierre: z.string().regex(/^\d{2}:\d{2}$/, "El horario de cierre no es valido."),
  duraciones: z.array(z.number().int().positive()).min(1, "Selecciona al menos una duracion."),
}).refine((value) => isValidRange(value.apertura, value.cierre), {
  message: "La jornada horaria no es valida.",
  path: ["cierre"],
});

export const franjaPrecioSchema = z.object({
  id: z.preprocess((value) => (value === "" || value === null ? undefined : value), z.coerce.number().int().positive().optional()),
  deporte: z.enum(["tenis", "padel", "futbol"]),
  desde: z.string().regex(/^\d{2}:\d{2}$/, "El horario de inicio no es valido."),
  hasta: z.string().regex(/^\d{2}:\d{2}$/, "El horario de cierre no es valido."),
  duracion_minutos: z.coerce
    .number()
    .int("La duracion debe ser un valor entero.")
    .refine((value) => [60, 90, 120].includes(value), "Selecciona una duracion valida."),
  precio: z.coerce.number().min(0, "El precio no puede ser negativo."),
}).refine((value) => isValidRange(value.desde, value.hasta), {
  message: "La franja horaria no es valida.",
  path: ["hasta"],
});

export type ConfiguracionInput = z.infer<typeof configuracionSchema>;
export type DisponibilidadInput = z.infer<typeof disponibilidadSchema>;
export type FranjaPrecioInput = z.infer<typeof franjaPrecioSchema>;
