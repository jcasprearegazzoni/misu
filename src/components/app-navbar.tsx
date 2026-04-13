import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { markAllNotificationsAsReadAction, markNotificationAsReadAction } from "@/app/dashboard/notificaciones/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UserMenu } from "@/components/user-menu";
import { MobileBottomNav, type MobileBottomNavItem } from "@/components/mobile-bottom-nav";
import { NotificationsMenu } from "@/components/notifications-menu";
import { ThemeToggle } from "@/components/theme-toggle";

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
  { href: "/dashboard/profesor", label: "Inicio" },
  { href: "/dashboard/profesor/turnos", label: "Clases" },
  { href: "/dashboard/profesor/finanzas", label: "Finanzas" },
  { href: "/dashboard/profesor/ajustes", label: "Ajustes" },
];

const profesorBottomNavItems: MobileBottomNavItem[] = [
  {
    href: "/dashboard/profesor",
    label: "Inicio",
    match: ["/dashboard/profesor"],
    iconActive: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
        <path d="M11.293 2.293a1 1 0 0 1 1.414 0l8 8a1 1 0 0 1-1.414 1.414L19 11.414V20a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4h-2v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8.586l-.293.293a1 1 0 0 1-1.414-1.414l8-8Z" />
      </svg>
    ),
    iconInactive: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-6 w-6" aria-hidden="true">
        <path d="M3 12L12 3l9 9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 10v11h14V10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/dashboard/profesor/turnos",
    label: "Clases",
    match: ["/dashboard/profesor/turnos", "/dashboard/profesor/calendario*"],
    iconActive: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
        <path d="M8 7a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1H8V7ZM3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Zm2 2v8h14v-8H5Zm2 2h2v2H7v-2Zm4 0h2v2h-2v-2Zm4 0h2v2h-2v-2Z" />
      </svg>
    ),
    iconInactive: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-6 w-6" aria-hidden="true">
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 3v4M16 3v4M3 11h18" />
      </svg>
    ),
  },
  {
    href: "/dashboard/profesor/programas",
    label: "Programas",
    match: ["/dashboard/profesor/programas*"],
    iconActive: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
        <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3H4V6ZM3 11v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7H3Zm6 2h6a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2Z" />
      </svg>
    ),
    iconInactive: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-6 w-6" aria-hidden="true">
        <rect x="3" y="9" width="18" height="12" rx="2" />
        <path d="M3 9l2-5h14l2 5" />
        <path d="M9 13h6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/dashboard/profesor/finanzas",
    label: "Finanzas",
    match: ["/dashboard/profesor/finanzas*", "/dashboard/profesor/pagos*", "/dashboard/profesor/deudas*"],
    iconActive: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
        <path d="M4 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4Zm8 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM6.5 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm11 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM4 15.5A2.5 2.5 0 0 1 6.5 13h11a2.5 2.5 0 0 1 2.5 2.5v.5H4v-.5Z" />
      </svg>
    ),
    iconInactive: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-6 w-6" aria-hidden="true">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M2 10h4M18 10h4M2 14h4M18 14h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/dashboard/profesor/ajustes",
    label: "Ajustes",
    match: ["/dashboard/profesor/ajustes*", "/dashboard/profesor/perfil*", "/dashboard/profesor/configuracion*"],
    iconActive: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
        <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" clipRule="evenodd" />
      </svg>
    ),
    iconInactive: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-6 w-6" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const alumnoBottomNavItems: MobileBottomNavItem[] = [
  {
    href: "/dashboard/alumno",
    label: "Inicio",
    match: ["/dashboard/alumno"],
    iconActive: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
        <path d="M11.293 2.293a1 1 0 0 1 1.414 0l8 8a1 1 0 0 1-1.414 1.414L19 11.414V20a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4h-2v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8.586l-.293.293a1 1 0 0 1-1.414-1.414l8-8Z" />
      </svg>
    ),
    iconInactive: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-6 w-6" aria-hidden="true">
        <path d="M3 12L12 3l9 9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 10v11h14V10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/dashboard/alumno/turnos",
    label: "Clases",
    match: ["/dashboard/alumno/turnos*"],
    iconActive: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
        <path d="M8 7a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1H8V7ZM3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Zm2 2v8h14v-8H5Zm2 2h2v2H7v-2Zm4 0h2v2h-2v-2Zm4 0h2v2h-2v-2Z" />
      </svg>
    ),
    iconInactive: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-6 w-6" aria-hidden="true">
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 3v4M16 3v4M3 11h18" />
      </svg>
    ),
  },
  {
    href: "/dashboard/alumno/reservas",
    label: "Reservas",
    match: ["/dashboard/alumno/reservas*"],
    iconActive: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
        <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm0 5a1 1 0 0 1 1 1v3.586l2.707 2.707a1 1 0 0 1-1.414 1.414l-3-3A1 1 0 0 1 11 12V8a1 1 0 0 1 1-1Z" />
      </svg>
    ),
    iconInactive: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-6 w-6" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const alumnoLinks: NavItem[] = [
  { href: "/dashboard/alumno", label: "Inicio" },
  { href: "/dashboard/alumno/turnos", label: "Clases" },
  { href: "/dashboard/alumno/reservas", label: "Reservas" },
];

async function signOutAction() {
  "use server";

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

function BellIcon() {
  return (
    <svg
      className="h-4 w-4"
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

function PublicNavbar() {
  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--nav-bg)",
        backdropFilter: "blur(16px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <nav className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-5">
        <Link href="/" className="flex shrink-0 items-center">
          <span
            className="text-base font-black tracking-tighter logo-glow"
            style={{ color: "var(--misu)" }}
          >
            misu
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="btn-ghost text-sm" style={{ padding: "0.35rem 0.75rem" }}>
            Iniciá sesión
          </Link>
          <Link href="/register" className="btn-primary text-sm" style={{ padding: "0.35rem 0.75rem" }}>
            Registrarse
          </Link>
        </div>
      </nav>
    </header>
  );
}

export async function AppNavbar() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return <PublicNavbar />;
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
  const bottomNavItems = profile.role === "profesor" ? profesorBottomNavItems : alumnoBottomNavItems;

  return (
    <>
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--nav-bg)",
          backdropFilter: "blur(16px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <nav className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-5">
          {/* Logo */}
          <Link
            href={profile.role === "profesor" ? "/dashboard/profesor" : "/dashboard/alumno/turnos"}
            className="flex shrink-0 items-center"
          >
            <span
              className="text-base font-black tracking-tighter logo-glow"
              style={{ color: "var(--misu)" }}
            >
              misu
            </span>
          </Link>

          {/* Separador vertical */}
          <div
            className="hidden h-5 md:block"
            style={{ width: "1px", background: "var(--border)" }}
          />

          {/* Links desktop */}
          <div className="hidden min-w-0 flex-1 items-center gap-1 md:flex">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="btn-ghost text-sm"
                style={{ padding: "0.35rem 0.75rem" }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Acciones derecha */}
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <NotificationsMenu
              unreadCount={unreadNotificationsCount}
              notifications={notifications}
              bellIcon={<BellIcon />}
              markAllAction={markAllNotificationsAsReadAction}
              markOneAction={markNotificationAsReadAction}
            />

            <UserMenu
              displayName={profile.name.split(" ")[0] || "Usuario"}
              profileHref={profile.role === "profesor" ? "/dashboard/profesor/ajustes#datos" : "/dashboard/alumno/perfil"}
              signOutAction={signOutAction}
            />
          </div>
        </nav>
      </header>

      <MobileBottomNav
        items={bottomNavItems}
        ariaLabel={profile.role === "profesor" ? "Navegacion principal profesor" : "Navegacion principal alumno"}
      />
    </>
  );
}


