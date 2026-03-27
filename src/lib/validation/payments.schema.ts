import { z } from "zod";

export const createPaymentSchema = z.object({
  alumno_id: z.uuid("Alumno invalido."),
  booking_id: z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return undefined;
      }

      const trimmed = value.trim();
      if (trimmed.length === 0) {
        return undefined;
      }

      return Number(trimmed);
    },
    z.number().int().positive("Booking invalido.").optional(),
  ),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0."),
  method: z.enum(["efectivo", "transferencia_directa"], "Metodo invalido."),
  type: z.enum(
    ["clase", "paquete", "seña", "diferencia_cobro", "reembolso"],
    "Tipo de pago invalido.",
  ),
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

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

