"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function markNotificationAsReadAction(formData: FormData) {
  const idRaw = formData.get("notification_id");
  const notificationId = Number(idRaw);

  if (!Number.isInteger(notificationId) || notificationId <= 0) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  // RLS asegura que solo el dueño pueda marcar su notificacion.
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id)
    .is("read_at", null);

  revalidatePath("/dashboard/notificaciones");
  revalidatePath("/", "layout");
}

export async function markAllNotificationsAsReadAction() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  revalidatePath("/dashboard/notificaciones");
  revalidatePath("/", "layout");
}
