import { z } from "zod";

export const createSoloDecisionSchema = z.object({
  bookingId: z.coerce.number().int().positive("Booking invalido."),
});

export const respondSoloDecisionSchema = z.object({
  decisionId: z.coerce.number().int().positive("Decision invalida."),
  action: z.enum(["aceptada_individual", "cancelada_alumno"], "Accion invalida."),
});

export type CreateSoloDecisionInput = z.infer<typeof createSoloDecisionSchema>;
export type RespondSoloDecisionInput = z.infer<typeof respondSoloDecisionSchema>;
