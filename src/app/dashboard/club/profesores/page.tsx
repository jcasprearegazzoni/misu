import { requireClub } from "@/lib/auth/require-club";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CancelarInvitacionForm } from "./cancelar-invitacion-form";
import { EliminarProfesorForm } from "./eliminar-profesor-form";
import { InvitarProfesorForm } from "./invitar-profesor-form";

type ClubProfesorRow = {
  status: "pendiente" | "activo" | "inactivo";
  invited_at: string | null;
  profesor_id: string;
};

type ProfesorSearchRow = {
  user_id: string;
  name: string | null;
  username: string | null;
  sport: string | null;
  zone: string | null;
  provincia: string | null;
};

function StatusPill({ status }: { status: "pendiente" | "activo" | "inactivo" }) {
  const styles =
    status === "activo"
      ? { background: "var(--success-bg)", color: "var(--success)" }
      : status === "pendiente"
        ? { background: "var(--warning-bg)", color: "var(--warning)" }
        : { background: "var(--muted-2)", color: "var(--muted)" };

  const label = status === "activo" ? "Activo" : status === "pendiente" ? "Pendiente" : "Inactivo";

  return (
    <span className="pill text-xs" style={styles}>
      {label}
    </span>
  );
}

export default async function ClubProfesoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const club = await requireClub();
  const supabase = await createSupabaseServerClient();
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const { data: clubProfesoresData } = await supabase
    .from("club_profesores")
    .select("status, invited_at, profesor_id")
    .eq("club_id", club.id)
    .in("status", ["pendiente", "activo"])
    .order("status", { ascending: true });

  const clubProfesores = (clubProfesoresData ?? []) as ClubProfesorRow[];
  const existingProfesorIds = new Set(clubProfesores.map((item) => item.profesor_id));

  const profesorIds = Array.from(existingProfesorIds);
  const { data: perfilesData } =
    profesorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, name, username, sport, zone, provincia")
          .in("user_id", profesorIds)
      : { data: [] as ProfesorSearchRow[] };

  const perfilesMap = new Map(
    (perfilesData ?? []).map((perfil) => [perfil.user_id, perfil]),
  );

  let searchResults: ProfesorSearchRow[] = [];
  if (query.length >= 2) {
    const { data: searchData } = await supabase
      .from("profiles")
      .select("user_id, name, username, sport, zone, provincia")
      .eq("role", "profesor")
      .or(
        `name.ilike.%${query}%,username.ilike.%${query}%,zone.ilike.%${query}%,provincia.ilike.%${query}%`,
      )
      .limit(20);

    searchResults = (searchData ?? []).filter((row) => !existingProfesorIds.has(row.user_id));
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--foreground)" }}>
          Profesores
        </h1>
      </header>

      <section className="card space-y-4 p-5">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
            Profesores en el club
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Gestioná los profesores vinculados a tu club.
          </p>
        </div>

        {clubProfesores.length === 0 ? (
          <div className="rounded-lg border px-4 py-6 text-sm" style={{ borderColor: "var(--border)" }}>
            <p style={{ color: "var(--muted)" }}>Todavía no tenés profesores en tu club.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clubProfesores.map((item) => (
              <div
                key={item.profesor_id}
                className="flex flex-col gap-3 rounded-lg border px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {perfilesMap.get(item.profesor_id)?.name ?? "Profesor sin nombre"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    @{perfilesMap.get(item.profesor_id)?.username ?? "sin-usuario"} ·{" "}
                    {perfilesMap.get(item.profesor_id)?.sport ?? "Sin deporte"} ·{" "}
                    {perfilesMap.get(item.profesor_id)?.zone ??
                      perfilesMap.get(item.profesor_id)?.provincia ??
                      "Sin zona"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={item.status} />
                  {item.status === "pendiente" ? (
                    <CancelarInvitacionForm profesorId={item.profesor_id} />
                  ) : item.status === "activo" ? (
                    <EliminarProfesorForm
                      profesorId={item.profesor_id}
                      profesorNombre={perfilesMap.get(item.profesor_id)?.name ?? "este profesor"}
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <details className="card group p-5" open>
        <summary className="flex cursor-pointer items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
              Buscar profesor
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              Invitá profesores a sumarse a tu club.
            </p>
          </div>
          <span className="transition-transform group-open:rotate-180" style={{ color: "var(--muted)" }}>
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.7a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </summary>

        <div className="mt-4 space-y-4">
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end" method="get">
            <label className="label flex-1">
              <span>Buscar por nombre, usuario o zona</span>
              <input
                name="q"
                defaultValue={query}
                className="input"
                placeholder="Ej: Juan, usuario, Palermo"
              />
            </label>
            <button className="btn-primary h-10" type="submit">
              Buscar
            </button>
          </form>

          {query.length >= 2 ? (
            searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((result) => (
                  <div
                    key={result.user_id}
                    className="flex flex-col gap-3 rounded-lg border px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                  >
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                        {result.name ?? "Profesor sin nombre"}
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        @{result.username ?? "sin-usuario"} · {result.sport ?? "Sin deporte"} ·{" "}
                        {result.zone ?? result.provincia ?? "Sin zona"}
                      </p>
                    </div>
                    <InvitarProfesorForm profesorUserId={result.user_id} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border px-4 py-6 text-sm" style={{ borderColor: "var(--border)" }}>
                <p style={{ color: "var(--muted)" }}>No se encontraron profesores con ese nombre.</p>
              </div>
            )
          ) : (
            <div className="rounded-lg border px-4 py-6 text-sm" style={{ borderColor: "var(--border)" }}>
              <p style={{ color: "var(--muted)" }}>Ingresá al menos 2 caracteres para buscar.</p>
            </div>
          )}
        </div>
      </details>
    </main>
  );
}
