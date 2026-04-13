import Link from "next/link";
import { redirect } from "next/navigation";
import { requireClub } from "@/lib/auth/require-club";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileBottomNav, type MobileBottomNavItem } from "@/components/mobile-bottom-nav";

const clubBottomNavItems: MobileBottomNavItem[] = [
  {
    href: "/dashboard/club",
    label: "Inicio",
    match: ["/dashboard/club"],
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
    href: "/dashboard/club/calendario",
    label: "Calendario",
    match: ["/dashboard/club", "/dashboard/club/calendario*"],
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
    href: "/dashboard/club/finanzas",
    label: "Finanzas",
    match: ["/dashboard/club/finanzas*"],
    iconActive: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
        <path d="M3 13h2v7H3v-7zm4-6h2v13H7V7zm4-4h2v17h-2V3zm4 8h2v9h-2v-9zm4-4h2v13h-2V7z" />
      </svg>
    ),
    iconInactive: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-6 w-6" aria-hidden="true">
        <rect x="3" y="12" width="4" height="8" rx="1" />
        <rect x="9.5" y="7" width="4" height="13" rx="1" />
        <rect x="16" y="3" width="4" height="17" rx="1" />
      </svg>
    ),
  },
  {
    href: "/dashboard/club/programas",
    label: "Programas",
    match: ["/dashboard/club/programas*"],
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
    href: "/dashboard/club/ajustes",
    label: "Ajustes",
    match: ["/dashboard/club/ajustes*"],
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

async function signOutClubAction() {
  "use server";

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export default async function ClubDashboardLayout({ children }: { children: React.ReactNode }) {
  const club = await requireClub();

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--background)" }}>
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--nav-bg)",
          backdropFilter: "blur(16px)",
        }}
      >
        <nav className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-6">
            <Link href="/dashboard/club" className="flex items-center">
              <span
                className="text-base font-black tracking-tighter logo-glow"
                style={{ color: "var(--misu)" }}
              >
                misu
              </span>
            </Link>
            <div className="hidden h-5 md:block" style={{ width: "1px", background: "var(--border)" }} />
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/dashboard/club/calendario" className="btn-ghost text-sm">
                Calendario
              </Link>
              <Link href="/dashboard/club/finanzas" className="btn-ghost text-sm">
                Finanzas
              </Link>
              <Link href="/dashboard/club/programas" className="btn-ghost text-sm">
                Programas
              </Link>
              <Link href="/dashboard/club/ajustes" className="btn-ghost text-sm">
                Ajustes
              </Link>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <details className="relative shrink-0">
            <summary
              className="flex max-w-[52vw] cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition sm:max-w-none"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            >
              <span className="block truncate">{club.nombre}</span>
              <span aria-hidden="true" style={{ color: "var(--muted)" }}>
                ▾
              </span>
            </summary>

            <div
              className="absolute right-0 top-12 z-30 w-48 rounded-xl p-1.5 shadow-xl"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
              }}
            >
              <Link
                href="/dashboard/club/perfil"
                className="btn-ghost w-full justify-start rounded-lg text-sm"
                style={{ padding: "0.5rem 0.75rem" }}
              >
                Mi perfil
              </Link>
              <form action={signOutClubAction}>
                <button
                  type="submit"
                  className="btn-ghost w-full justify-start rounded-lg text-sm"
                  style={{ padding: "0.5rem 0.75rem", color: "var(--error)" }}
                >
                  Cerrar sesión
                </button>
              </form>
            </div>
          </details>
          </div>
        </nav>
      </header>

      <main className="pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
      <MobileBottomNav ariaLabel="Navegacion principal club" items={clubBottomNavItems} />
    </div>
  );
}
