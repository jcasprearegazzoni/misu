import { redirect } from "next/navigation";

export default function DisponibilidadRedirectPage() {
  redirect("/dashboard/profesor/clases/disponibilidad");
}

