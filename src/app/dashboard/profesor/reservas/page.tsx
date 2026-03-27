import { redirect } from "next/navigation";

export default async function ProfesorReservasRedirectPage() {
  redirect("/dashboard/profesor/calendario?filter=pendientes");
}
