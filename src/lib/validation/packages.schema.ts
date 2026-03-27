import { z } from "zod";

export const createPackageSchema = z.object({
  name: z.string().trim().min(1, "El nombre del paquete es obligatorio.").max(120),
  total_classes: z.coerce.number().int("Total de clases invalido.").positive("Debe ser mayor a 0."),
  price: z.coerce.number().positive("El precio debe ser mayor a 0."),
  description: z.preprocess(
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
    z.string().max(500, "La descripcion no puede superar 500 caracteres.").optional(),
  ),
});

export const assignStudentPackageSchema = z.object({
  alumno_id: z.uuid("Alumno invalido."),
  package_id: z.coerce.number().int().positive("Paquete invalido."),
});

export const markStudentPackagePaidSchema = z.object({
  student_package_id: z.coerce.number().int().positive("Asignacion invalida."),
});

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type AssignStudentPackageInput = z.infer<typeof assignStudentPackageSchema>;

