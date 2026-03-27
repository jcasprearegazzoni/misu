import { redirect } from "next/navigation";

export default function AlumnoProfesoresPage() {
  redirect("/dashboard/alumno/turnos?tab=reservar");
}
