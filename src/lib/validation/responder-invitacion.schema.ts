import { z } from "zod";

export const responderInvitacionSchema = z.object({
  club_profesores_id: z.coerce.number().int().positive(),
  respuesta: z.enum(["aceptar", "rechazar"]),
  merge_club_id: z.preprocess(
    (val) => (val === null || val === "" || val === undefined ? undefined : val),
    z.coerce.number().int().positive().optional(),
  ),
});

export type ResponderInvitacionInput = z.infer<typeof responderInvitacionSchema>;
