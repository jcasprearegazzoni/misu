import { z } from "zod";

export const createDebtChargeSchema = z.object({
  booking_id: z.coerce.number().int().positive("Booking invalido."),
  alumno_id: z.uuid("Alumno invalido."),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0."),
  method: z.enum(["efectivo", "transferencia_directa"], "Metodo invalido."),
  note: z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return undefined;
      }

      const trimmed = value.trim();
      if (trimmed.length === 0) {
        return undefined;
      }

      return trimmed;
    },
    z.string().max(500, "La nota no puede superar 500 caracteres.").optional(),
  ),
});

export type CreateDebtChargeInput = z.infer<typeof createDebtChargeSchema>;

