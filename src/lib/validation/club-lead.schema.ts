import { z } from "zod";

export const clubLeadSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres.").max(100),
  direccion: z.string().trim().min(5, "Ingresá la dirección del club.").max(200),
  cuit: z
    .string()
    .trim()
    .regex(/^[0-9\-]{10,13}$/, "El CUIT debe tener entre 10 y 13 caracteres (solo números y guiones)."),
  email: z.string().trim().email("Ingresá un email válido."),
  telefono: z.string().trim().min(6, "Ingresá un teléfono válido.").max(20),
  mensaje: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(500).optional(),
  ),
});

export type ClubLeadInput = z.infer<typeof clubLeadSchema>;
