import { z } from "zod";

export const createProgramSchema = z
  .object({
    nombre: z.string().min(1, "El nombre es requerido.").max(100),
    descripcion: z.string().max(500).optional(),
    categoria: z.string().max(60).optional(),
    nivel: z.enum(["libre", "principiante", "intermedio", "avanzado"]).default("libre"),
    deporte: z.enum(["tenis", "padel", "ambos"]).default("tenis"),
    tipo_clase: z.enum(["individual", "dobles", "trio", "grupal"]).default("individual"),
    total_clases: z.coerce.number().int().positive("El total de clases debe ser mayor a 0."),
    precio: z.coerce.number().min(0, "El precio no puede ser negativo."),
    cupo_max: z.coerce.number().int().positive().nullable().optional(),
    fecha_inicio: z.string().min(1, "La fecha de inicio es requerida."),
    fecha_fin: z.string().min(1, "La fecha de fin es requerida."),
    dias_semana: z
      .array(z.coerce.number().int().min(0).max(6))
      .min(1, "Selecciona al menos un día."),
    hora_inicio: z.string().min(1, "La hora de inicio es requerida."),
    hora_fin: z.string().min(1, "La hora de fin es requerida."),
    visibilidad: z.enum(["privado", "publico"]).default("privado"),
  })
  .refine((data) => data.fecha_fin >= data.fecha_inicio, {
    message: "La fecha de fin debe ser igual o posterior a la fecha de inicio.",
    path: ["fecha_fin"],
  })
  .refine((data) => data.hora_fin > data.hora_inicio, {
    message: "La hora de fin debe ser posterior a la hora de inicio.",
    path: ["hora_fin"],
  });

export const assignStudentProgramSchema = z.object({
  alumno_id: z.string().uuid("Alumno inválido."),
  program_id: z.coerce.number().int().positive("Programa inválido."),
});

export const markStudentProgramPaidSchema = z.object({
  student_program_id: z.coerce.number().int().positive("Inscripción inválida."),
});
