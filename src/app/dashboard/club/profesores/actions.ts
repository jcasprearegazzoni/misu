"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireClub } from "@/lib/auth/require-club";
import { invitarProfesorSchema } from "@/lib/validation/invitar-profesor.schema";
import { resend } from "@/lib/email/resend";

export type InvitarProfesorActionState = {
  error: string | null;
  success: string | null;
};

export type CancelarInvitacionActionState = {
  error: string | null;
  success: string | null;
};

export async function invitarProfesorAction(
  _prev: InvitarProfesorActionState,
  formData: FormData,
): Promise<InvitarProfesorActionState> {
  const club = await requireClub();

  const parsed = invitarProfesorSchema.safeParse({
    profesor_user_id: formData.get("profesor_user_id"),
  });

  if (!parsed.success) {
    return { error: "SeleccionÃ¡ un profesor vÃ¡lido.", success: null };
  }

  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("club_profesores")
    .select("id")
    .eq("club_id", club.id)
    .eq("profesor_id", parsed.data.profesor_user_id)
    .in("status", ["pendiente", "activo"])
    .maybeSingle();

  if (existing) {
    return { error: "Ese profesor ya estÃ¡ invitado o activo en tu club.", success: null };
  }

  const { error } = await supabase.from("club_profesores").upsert(
    {
      club_id: club.id,
      profesor_id: parsed.data.profesor_user_id,
      status: "pendiente",
      invited_at: new Date().toISOString(),
      responded_at: null,
    },
    { onConflict: "club_id,profesor_id" },
  );

  if (error) {
    console.error("[invitarProfesorAction] insert error:", error);
    return { error: "No se pudo enviar la invitaciÃ³n.", success: null };
  }

  const adminClient = createSupabaseAdminClient();

  const notifyPromise = adminClient.from("notifications").insert({
    user_id: parsed.data.profesor_user_id,
    type: "club_invitacion",
    title: "Un club te invitÃ³",
    message: `${club.nombre} te invitÃ³ a sumarte a su equipo de profesores.`,
  });

  const emailPromise = (async () => {
    const { data } = await adminClient.auth.admin.getUserById(parsed.data.profesor_user_id);
    const email = data?.user?.email;
    if (!email) return;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const link = `${siteUrl}/dashboard/profesor/ajustes`;

    await resend.emails.send({
      from: "misu <noreply@resend.dev>",
      to: email,
      subject: "Te invitaron a un club en misu",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2 style="margin: 0 0 12px;">${club.nombre} te invitÃ³</h2>
          <p>TenÃ©s una invitaciÃ³n pendiente para sumarte como profesor.</p>
          <p>
            <a href="${link}" style="display: inline-block; padding: 10px 16px; background: #f59e0b; color: #111; text-decoration: none; border-radius: 8px;">
              Ver invitaciÃ³n
            </a>
          </p>
        </div>
      `,
    });
  })();

  const results = await Promise.allSettled([notifyPromise, emailPromise]);
  results.forEach((result) => {
    if (result.status === "rejected") {
      console.error("No se pudo completar la notificaciÃ³n de invitaciÃ³n.", result.reason);
    }
  });

  revalidatePath("/dashboard/club/profesores");
  return { error: null, success: "InvitaciÃ³n enviada." };
}

export type EliminarProfesorActionState = {
  error: string | null;
  success: string | null;
};

export async function eliminarProfesorAction(
  _prev: EliminarProfesorActionState,
  formData: FormData,
): Promise<EliminarProfesorActionState> {
  const club = await requireClub();
  const profesorId = String(formData.get("profesor_id") ?? "");

  if (!profesorId) {
    return { error: "No se pudo eliminar el profesor.", success: null };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("club_profesores")
    .delete()
    .eq("club_id", club.id)
    .eq("profesor_id", profesorId);

  if (error) {
    return { error: "No se pudo eliminar el profesor.", success: null };
  }

  revalidatePath("/dashboard/club/profesores");
  return { error: null, success: "Profesor eliminado." };
}

export async function cancelarInvitacionAction(
  _prev: CancelarInvitacionActionState,
  formData: FormData,
): Promise<CancelarInvitacionActionState> {
  const club = await requireClub();
  const profesorId = String(formData.get("profesor_id") ?? "");

  if (!profesorId) {
    return { error: "No se pudo cancelar la invitaciÃ³n.", success: null };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("club_profesores")
    .delete()
    .eq("club_id", club.id)
    .eq("profesor_id", profesorId)
    .eq("status", "pendiente");

  if (error) {
    return { error: "No se pudo cancelar la invitaciÃ³n.", success: null };
  }

  revalidatePath("/dashboard/club/profesores");
  return { error: null, success: "InvitaciÃ³n cancelada." };
}

