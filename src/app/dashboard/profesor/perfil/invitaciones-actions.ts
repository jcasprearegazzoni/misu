"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { responderInvitacionSchema } from "@/lib/validation/responder-invitacion.schema";

export type InvitacionActionState = {
  error: string | null;
  success: string | null;
};

async function requireProfesor() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "profesor") {
    redirect("/dashboard/alumno");
  }

  return { supabase, userId: user.id };
}

export async function responderInvitacionAction(
  _prev: InvitacionActionState,
  formData: FormData,
): Promise<InvitacionActionState> {
  const { supabase, userId } = await requireProfesor();

  const parsed = responderInvitacionSchema.safeParse({
    club_profesores_id: formData.get("club_profesores_id"),
    respuesta: formData.get("respuesta"),
    merge_club_id: formData.get("merge_club_id"),
  });

  if (!parsed.success) {
    return { error: "RevisÃ¡ los datos de la invitaciÃ³n.", success: null };
  }

  const { data: invitacion } = await supabase
    .from("club_profesores")
    .select("id, club_id, status")
    .eq("id", parsed.data.club_profesores_id)
    .eq("profesor_id", userId)
    .eq("status", "pendiente")
    .single();

  if (!invitacion) {
    return { error: "No se encontrÃ³ la invitaciÃ³n.", success: null };
  }

  if (parsed.data.respuesta === "rechazar") {
    const { error } = await supabase
      .from("club_profesores")
      .update({ status: "inactivo", responded_at: new Date().toISOString() })
      .eq("id", invitacion.id);

    if (error) {
      return { error: "No se pudo rechazar la invitaciÃ³n.", success: null };
    }

    revalidatePath("/dashboard/profesor/ajustes");
    return { error: null, success: "InvitaciÃ³n rechazada." };
  }

  // Validar placeholder antes de hacer cualquier cambio
  if (parsed.data.merge_club_id) {
    const { data: placeholder } = await supabase
      .from("clubs")
      .select("id")
      .eq("id", parsed.data.merge_club_id)
      .eq("created_by_profesor_id", userId)
      .eq("is_placeholder", true)
      .single();

    if (!placeholder) {
      return { error: "El club a vincular no es vÃ¡lido.", success: null };
    }
  }

  const { error: acceptError } = await supabase
    .from("club_profesores")
    .update({ status: "activo", responded_at: new Date().toISOString() })
    .eq("id", invitacion.id);

  if (acceptError) {
    return { error: "No se pudo aceptar la invitaciÃ³n.", success: null };
  }

  if (parsed.data.merge_club_id) {
    await supabase
      .from("availability")
      .update({ club_id: invitacion.club_id })
      .eq("club_id", parsed.data.merge_club_id)
      .eq("profesor_id", userId);

    await supabase
      .from("club_profesores")
      .update({ merged_from_club_id: parsed.data.merge_club_id })
      .eq("id", invitacion.id);

    await supabase.from("clubs").delete().eq("id", parsed.data.merge_club_id);
  }

  revalidatePath("/dashboard/profesor/ajustes");
  return { error: null, success: "Â¡Bienvenido al club!" };
}

