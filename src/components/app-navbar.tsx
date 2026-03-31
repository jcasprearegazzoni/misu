import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { markAllNotificationsAsReadAction, markNotificationAsReadAction } from "@/app/dashboard/notificaciones/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UserMenu } from "@/components/user-menu";
import { MobileNavMenu } from "@/components/mobile-nav-menu";
import { NotificationsMenu } from "@/components/notifications-menu";

type NavItem = {
  href: string;
  label: string;
};

type NotificationRow = {
  id: number;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

const profesorLinks: NavItem[] = [
  { href: "/dashboard/profesor/turnos", label: "Clases" },
  { href: "/dashboard/profesor/finanzas", label: "Finanzas" },
  { href: "/dashboard/profesor/configuracion", label: "Configuracion" },
];

const alumnoLinks: NavItem[] = [{ href: "/dashboard/alumno/turnos", label: "Clases" }];

async function signOutAction() {
  "use server";

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

function BellIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 0 0-5-5.9V4a1 1 0 0 0-2 0v1.1A6 6 0 0 0 6 11v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
      <path d="M9 17a3 3 0 0 0 6 0" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export async function AppNavbar() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return null;
  }

  const links = profile.role === "profesor" ? profesorLinks : alumnoLinks;
  const supabase = await createSupabaseServerClient();

  const [{ count: unreadCount }, notificationsResult] = await Promise.all([
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.user_id)
      .is("read_at", null),
    supabase
      .from("notifications")
      .select("id, title, message, read_at, created_at")
      .eq("user_id", profile.user_id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const unreadNotificationsCount = unreadCount ?? 0;
  const notifications = (notificationsResult.data ?? []) as NotificationRow[];

  return (
    <header className="border-b border-zinc-300 bg-white">
      <nav className="mx-auto flex w-full max-w-6xl items-center gap-2 px-3 py-2 sm:px-4">
        <Link href={profile.role === "profesor" ? "/dashboard/profesor/turnos" : "/dashboard/alumno/turnos"}>
          <span className="text-sm font-bold tracking-tight text-misu">misu</span>
        </Link>

        <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <MobileNavMenu links={links} menuIcon={<MenuIcon />} />

        <div className="ml-auto flex items-center gap-2">
          <NotificationsMenu
            unreadCount={unreadNotificationsCount}
            notifications={notifications}
            bellIcon={<BellIcon />}
            markAllAction={markAllNotificationsAsReadAction}
            markOneAction={markNotificationAsReadAction}
          />

          <UserMenu
            displayName={profile.name.split(" ")[0] || "Usuario"}
            profileHref={profile.role === "profesor" ? "/dashboard/profesor/perfil" : "/dashboard/alumno/perfil"}
            signOutAction={signOutAction}
          />
        </div>
      </nav>
    </header>
  );
}
