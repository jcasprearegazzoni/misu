import Link from "next/link";
import { requireClub } from "@/lib/auth/require-club";

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
            <Link href="/dashboard/club/perfil" className="flex items-center">
              <span
                className="text-base font-black tracking-tighter logo-glow"
                style={{ color: "var(--misu)" }}
              >
                misu
              </span>
            </Link>
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/dashboard/club/perfil" className="btn-ghost text-sm">
                Perfil
              </Link>
              <Link href="/dashboard/club/profesores" className="btn-ghost text-sm">
                Profesores
              </Link>
              <Link href="/dashboard/club/canchas" className="btn-ghost text-sm">
                Canchas
              </Link>
              <Link href="/dashboard/club/calendario" className="btn-ghost text-sm">
                Calendario
              </Link>
              <Link href="/dashboard/club/configuracion" className="btn-ghost text-sm">
                Configuracion
              </Link>
            </div>
          </div>

          <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {club.nombre}
          </span>
        </nav>
      </header>

      <main>{children}</main>
    </div>
  );
}
