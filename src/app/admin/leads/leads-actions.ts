"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireAdmin() {
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

  if (!profile || profile.role !== "admin") redirect("/");
  return user;
}

export async function approveLeadAction(formData: FormData) {
  await requireAdmin();

  const leadId = Number(formData.get("lead_id"));

  if (!Number.isInteger(leadId) || leadId <= 0) {
    return;
  }

  const admin = createSupabaseAdminClient();

  const { data: lead, error: leadError } = await admin
    .from("club_leads")
    .select("id, email, nombre, status, direccion, cuit, telefono")
    .eq("id", leadId)
    .single();

  if (leadError || !lead) {
    return;
  }

  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(lead.email, {
    data: {
      nombre_club: lead.nombre,
    },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/club/setup-password`,
  });

  if (inviteError) {
    console.error("[approveLeadAction] inviteError:", inviteError);
    throw new Error("No se pudo enviar la invitación por email.");
  }

  const invitedUserId = inviteData.user?.id;

  if (!invitedUserId) {
    throw new Error("No se pudo obtener el usuario invitado.");
  }

  const { error: metadataError } = await admin.auth.admin.updateUserById(invitedUserId, {
    app_metadata: { role: "club" },
  });

  if (metadataError) {
    throw new Error("No se pudo asignar el rol de club en auth.");
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ role: "club" })
    .eq("user_id", invitedUserId);

  if (profileError) {
    throw new Error("No se pudo actualizar el rol en profiles.");
  }

  const { error: clubInsertError } = await admin.from("clubs").insert({
    user_id: invitedUserId,
    nombre: lead.nombre,
    direccion: lead.direccion ?? null,
    cuit: lead.cuit ?? null,
    telefono: lead.telefono ?? null,
    email_contacto: lead.email,
    is_placeholder: false,
  });

  if (clubInsertError) {
    throw new Error("No se pudo crear el club para el usuario invitado.");
  }

  const { error: updateError } = await admin
    .from("club_leads")
    .update({
      status: "aprobado",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (updateError) {
    return;
  }

  revalidatePath("/admin/leads");
}

export async function rejectLeadAction(formData: FormData) {
  await requireAdmin();

  const leadId = Number(formData.get("lead_id"));

  if (!Number.isInteger(leadId) || leadId <= 0) {
    return;
  }

  const admin = createSupabaseAdminClient();

  await admin
    .from("club_leads")
    .update({
      status: "rechazado",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  revalidatePath("/admin/leads");
}
