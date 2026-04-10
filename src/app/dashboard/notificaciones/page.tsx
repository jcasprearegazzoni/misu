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
    <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-3 py-6 sm:px-4 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--foreground)" }}>
            Notificaciones
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Eventos importantes de tu cuenta.
          </p>
        </div>
        {unreadCount > 0 ? (
          <form action={markAllNotificationsAsReadAction}>
            <button className="btn-secondary">Marcar todas como leídas</button>
          </form>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <p className="card mt-6 px-4 py-3 text-sm" style={{ color: "var(--muted)" }}>
          No tenés notificaciones por el momento.
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
                      className="w-full rounded-lg border px-4 py-3 text-left text-sm transition"
                      style={{ borderColor: "var(--border-misu)", background: "var(--surface-1)" }}
                    >
                      <p className="font-medium" style={{ color: "var(--foreground)" }}>
                        {notification.title}
                      </p>
                      <p className="mt-1" style={{ color: "var(--muted)" }}>
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs" style={{ color: "var(--misu-light)" }}>
                        {formatUserDate(notification.created_at)} · No leída
                      </p>
                    </button>
                  </form>
                </li>
              );
            }

            return (
              <li key={notification.id} className="card px-4 py-3 text-sm">
                <p className="font-medium" style={{ color: "var(--foreground)" }}>
                  {notification.title}
                </p>
                <p className="mt-1" style={{ color: "var(--muted)" }}>
                  {notification.message}
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--muted-2)" }}>
                  {formatUserDate(notification.created_at)} · Leída
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
