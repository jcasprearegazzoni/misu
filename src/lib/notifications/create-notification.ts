import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { NotificationType } from "./types";

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
};

export async function createNotification(input: CreateNotificationInput) {
  try {
    const supabase = createSupabaseAdminClient();

    // Inserta la notificacion con service role para no exponer permisos al frontend.
    await supabase.from("notifications").insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
    });
  } catch {
    // Si falta la variable de service role en local, no rompe el flujo principal.
    return;
  }
}
