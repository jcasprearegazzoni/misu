import { redirect } from "next/navigation";

export default function AlumnoDecisionesPage() {
  redirect("/dashboard/alumno/turnos?tab=decisiones");
}
