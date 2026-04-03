import { z } from "zod";

export const invitarProfesorSchema = z.object({
  profesor_user_id: z.string().uuid("Profesor inválido."),
});

export type InvitarProfesorInput = z.infer<typeof invitarProfesorSchema>;
