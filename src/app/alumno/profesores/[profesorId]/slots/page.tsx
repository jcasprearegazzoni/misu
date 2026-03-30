import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ profesorId: string }>;
  searchParams?: Promise<{ weekOffset?: string; day?: string }>;
};

export default async function AlumnoProfesorSlotsRedirectPage({ params, searchParams }: PageProps) {
  const { profesorId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const supabase = await createSupabaseServerClient();

  const { data: profesor } = await supabase
    .from("profiles")
    .select("username, role")
    .eq("user_id", profesorId)
    .eq("role", "profesor")
    .single();

  if (!profesor?.username) {
    redirect("/dashboard/alumno/turnos?tab=reservar");
  }

  const query = new URLSearchParams();
  if (resolvedSearchParams?.weekOffset) {
    query.set("weekOffset", resolvedSearchParams.weekOffset);
  }
  if (resolvedSearchParams?.day) {
    query.set("day", resolvedSearchParams.day);
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  redirect(`/p/${profesor.username}${suffix}`);
}
