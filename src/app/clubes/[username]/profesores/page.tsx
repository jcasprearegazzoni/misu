import Link from "next/link";
import { notFound } from "next/navigation";
import { AppNavbar } from "@/components/app-navbar";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ username: string }>;
};

type ProfesorRow = {
  name: string;
  username: string | null;
  sport: "tenis" | "padel" | "ambos" | null;
  bio: string | null;
};

function getSportLabel(sport: ProfesorRow["sport"]) {
  if (sport === "tenis") return "Tenis";
  if (sport === "padel") return "Padel";
  if (sport === "ambos") return "Tenis y padel";
  return null;
}

export default async function ProfesoresClubPage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createSupabaseServerClient();

  // Obtener el club por username mediante la función RPC pública
  const { data: clubRows } = await supabase.rpc("get_public_club_by_username", {
    p_username: username,
  });
  const club = (clubRows ?? [])[0] ?? null;
  if (!club) notFound();

  // Obtener profesores activos del club
  const { data: profesoresData } = await supabase
    .from("club_profesores")
    .select("profiles!club_profesores_profesor_profile_fkey(name, username, sport, bio)")
    .eq("club_id", club.id)
    .eq("status", "activo");

  const profesores = (profesoresData ?? [])
    .map((row) => {
      const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return p as ProfesorRow | null;
    })
    .filter((p): p is ProfesorRow => p !== null);

  return (
    <>
      <AppNavbar />
      <main className="min-h-screen" style={{ background: "var(--background)" }}>
        {/* Header */}
        <div
          className="border-b"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
        >
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
            {/* Breadcrumb */}
            <Link
              href={`/clubes/${club.username}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
              style={{ color: "var(--misu)" }}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {club.nombre}
            </Link>

            <h1 className="mt-3 text-3xl font-black tracking-tight" style={{ color: "var(--foreground)" }}>
              Profesores
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              Staff docente de {club.nombre}
            </p>
          </div>
        </div>

        {/* Contenido */}
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          {profesores.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Este club todavía no tiene profesores publicados.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {profesores.map((profesor) => (
                <div
                  key={`${profesor.name}-${profesor.username ?? "x"}`}
                  className="flex flex-col justify-between rounded-2xl border p-5"
                  style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
                >
                  <div>
                    {/* Avatar placeholder con inicial */}
                    <div
                      className="mb-3 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                      style={{ background: "var(--misu)", color: "var(--background)" }}
                    >
                      {profesor.name.charAt(0).toUpperCase()}
                    </div>

                    <p className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
                      {profesor.name}
                    </p>

                    {getSportLabel(profesor.sport) ? (
                      <p className="mt-0.5 text-xs font-medium" style={{ color: "var(--misu)" }}>
                        {getSportLabel(profesor.sport)}
                      </p>
                    ) : null}

                    {profesor.bio?.trim() ? (
                      <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                        {profesor.bio.trim()}
                      </p>
                    ) : null}
                  </div>

                  {profesor.username ? (
                    <Link
                      href={`/p/${profesor.username}`}
                      className="mt-4 inline-flex items-center gap-1 text-xs font-semibold"
                      style={{ color: "var(--misu-light)" }}
                    >
                      Ver perfil completo →
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
