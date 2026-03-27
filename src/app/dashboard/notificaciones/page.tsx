import { redirect } from "next/navigation";
import { formatUserDate } from "@/lib/format/date";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { markAllNotificationsAsReadAction, markNotificationAsReadAction } from "./actions";

type NotificationRow = {
  id: number;
  type: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

export default async function NotificacionesPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, message, read_at, created_at")
    .eq("user_id", profile.user_id)
    .order("created_at", { ascending: false });

  const notifications = (data ?? []) as NotificationRow[];
  const unreadCount = notifications.filter((item) => !item.read_at).length;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Notificaciones</h1>
          <p className="mt-1 text-sm text-zinc-600">Eventos importantes de tu cuenta.</p>
        </div>
        {unreadCount > 0 ? (
          <form action={markAllNotificationsAsReadAction}>
            <button className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100">
              Limpiar todas
            </button>
          </form>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <p className="mt-6 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-700">
          No tienes notificaciones por el momento.
        </p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {notifications.map((notification) => {
            const isRead = Boolean(notification.read_at);

            if (!isRead) {
              return (
                <li key={notification.id}>
                  <form action={markNotificationAsReadAction}>
                    <input type="hidden" name="notification_id" value={notification.id} />
                    <button
                      type="submit"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-left text-sm hover:bg-zinc-50"
                    >
                      <p className="font-medium text-zinc-900">{notification.title}</p>
                      <p className="mt-1 text-zinc-700">{notification.message}</p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {formatUserDate(notification.created_at)} - No leida
                      </p>
                    </button>
                  </form>
                </li>
              );
            }

            return (
              <li key={notification.id} className="rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm">
                <p className="font-medium text-zinc-900">{notification.title}</p>
                <p className="mt-1 text-zinc-700">{notification.message}</p>
                <p className="mt-1 text-xs text-zinc-600">{formatUserDate(notification.created_at)} - Leida</p>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
