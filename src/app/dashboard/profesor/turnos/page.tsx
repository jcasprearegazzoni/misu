import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

export default async function ProfesorTurnosPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "profesor") {
    redirect("/dashboard/alumno/turnos");
  }

  // Clases es la pantalla operativa principal del profesor.
  // Se resuelve directamente en Calendario para evitar menús intermedios.
  redirect("/dashboard/profesor/calendario");
}
