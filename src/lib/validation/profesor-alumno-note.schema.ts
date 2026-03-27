import { z } from "zod";

export const profesorAlumnoNoteSchema = z.object({
  alumno_id: z.uuid("Alumno invalido."),
  note: z
    .string()
    .trim()
    .max(2000, "La nota no puede superar 2000 caracteres."),
});

export type ProfesorAlumnoNoteInput = z.infer<typeof profesorAlumnoNoteSchema>;
