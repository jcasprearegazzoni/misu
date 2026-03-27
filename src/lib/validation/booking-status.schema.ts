import { z } from "zod";

export const bookingStatusUpdateSchema = z.object({
  bookingId: z.coerce.number().int().positive("Booking invalido."),
  status: z.enum(["confirmado", "cancelado"], "Estado invalido."),
});

export type BookingStatusUpdateInput = z.infer<typeof bookingStatusUpdateSchema>;
