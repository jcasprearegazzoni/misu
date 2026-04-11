import Link from "next/link";
import { redirect } from "next/navigation";
import { requireClub } from "@/lib/auth/require-club";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";

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
            <div className="hidden h-5 sm:block" style={{ width: "1px", background: "var(--border)" }} />
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/dashboard/club/calendario" className="btn-ghost text-sm">
                Calendario
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
              <div className="mb-1 grid gap-1 sm:hidden">
                <Link
                  href="/dashboard/club/calendario"
                  className="btn-ghost w-full justify-start rounded-lg text-sm"
                  style={{ padding: "0.5rem 0.75rem" }}
                >
                  Calendario
                </Link>
                <Link
                  href="/dashboard/club/ajustes"
                  className="btn-ghost w-full justify-start rounded-lg text-sm"
                  style={{ padding: "0.5rem 0.75rem" }}
                >
                  Ajustes
                </Link>
                <div className="my-1 h-px" style={{ background: "var(--border)" }} />
              </div>
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

      <main>{children}</main>
    </div>
  );
}
