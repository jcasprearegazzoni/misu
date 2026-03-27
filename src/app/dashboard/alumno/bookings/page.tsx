import { redirect } from "next/navigation";

export default function AlumnoBookingsPage() {
  redirect("/dashboard/alumno/turnos?tab=mis-clases");
}
