import Link from "next/link";
import { redirect } from "next/navigation";
import { requireClub } from "@/lib/auth/require-club";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function signOutClubAction() {
  "use server";

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export default async function ClubDashboardLayout({ children }: { children: React.ReactNode }) {
  const club = await requireClub();

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          background: "rgba(12, 12, 14, 0.9)",
          backdropFilter: "blur(16px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-6">
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

          <details className="relative">
            <summary
              className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            >
              <span>{club.nombre}</span>
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
        </nav>
      </header>

      <main>{children}</main>
    </div>
  );
}
