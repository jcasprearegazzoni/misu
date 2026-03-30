import { redirect } from "next/navigation";

export default function ProfesorBookingsRedirectPage() {
  redirect("/dashboard/profesor/calendario?filter=pendientes");
}
