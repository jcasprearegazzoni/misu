import { z } from "zod";

function emptyToUndefined(value: unknown) {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}

const optionalPriceSchema = z.preprocess(
  emptyToUndefined,
  z.coerce.number().min(0, "El precio no puede ser negativo.").optional(),
);

const optionalPercentageSchema = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number()
    .min(0, "El porcentaje no puede ser negativo.")
    .max(100, "El porcentaje maximo es 100.")
    .optional(),
);

const optionalHoursSchema = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number()
    .int("Las horas deben ser un numero entero.")
    .min(0, "Las horas no pueden ser negativas.")
    .max(168, "El maximo permitido es 168 horas.")
    .optional(),
);

const optionalDeadlineMinutesSchema = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number()
    .int("Los minutos deben ser un numero entero.")
    .min(1, "El minimo permitido es 1 minuto.")
    .max(10080, "El maximo permitido es 10080 minutos.")
    .optional(),
);

export const profesorPriceSettingsSchema = z.object({
  price_individual: optionalPriceSchema,
  price_dobles: optionalPriceSchema,
  price_trio: optionalPriceSchema,
  price_grupal: optionalPriceSchema,
  court_cost_mode: z.enum(["fixed_per_hour", "per_student_percentage"], "Selecciona un modo valido."),
  court_cost_per_hour: optionalPriceSchema,
  court_percentage_per_student: optionalPercentageSchema,
});

export const profesorOperationalSettingsSchema = z.object({
  cancel_without_charge_hours: optionalHoursSchema,
  solo_warning_hours: optionalHoursSchema,
  solo_decision_deadline_minutes: optionalDeadlineMinutesSchema,
});

export type ProfesorPriceSettingsInput = z.infer<typeof profesorPriceSettingsSchema>;
export type ProfesorOperationalSettingsInput = z.infer<typeof profesorOperationalSettingsSchema>;
