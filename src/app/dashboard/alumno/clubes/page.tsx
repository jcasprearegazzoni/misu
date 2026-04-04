import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ClubRow = {
  id: number;
  nombre: string;
  username: string;
  direccion: string | null;
  tiene_bar: boolean;
  tiene_estacionamiento: boolean;
  alquila_paletas: boolean;
  alquila_raquetas: boolean;
  tiene_vestuario: boolean;
  tiene_parrilla: boolean;
};

export default async function AlumnoClubesPage() {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "alumno") redirect("/dashboard/profesor/turnos");

  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("clubs")
    .select("id, nombre, username, direccion, tiene_bar, tiene_estacionamiento, alquila_paletas, alquila_raquetas, tiene_vestuario, tiene_parrilla")
    .order("nombre", { ascending: true });

  const clubs = (data ?? []) as ClubRow[];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-3 py-6 sm:px-4 sm:py-8">
      <header>
        <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--foreground)" }}>
          Clubes
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
          Encontrá un club y reservá una cancha.
        </p>
      </header>

      <section className="mt-6">
        {clubs.length === 0 ? (
          <div className="card px-4 py-6 text-center text-sm" style={{ color: "var(--muted)" }}>
            No hay clubes disponibles por el momento.
          </div>
        ) : (
          <ul className="grid gap-3">
            {clubs.map((club) => {
              // Armar lista de servicios disponibles
              const servicios: string[] = [];
              if (club.tiene_bar) servicios.push("Bar");
              if (club.tiene_estacionamiento) servicios.push("Estacionamiento");
              if (club.tiene_vestuario) servicios.push("Vestuario");
              if (club.tiene_parrilla) servicios.push("Parrilla");
              if (club.alquila_paletas) servicios.push("Alquiler de paletas");
              if (club.alquila_raquetas) servicios.push("Alquiler de raquetas");

              return (
                <li
                  key={club.id}
                  className="rounded-2xl border p-4"
                  style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold" style={{ color: "var(--foreground)" }}>
                        {club.nombre}
                      </p>
                      {club.direccion ? (
                        <p className="mt-0.5 text-sm" style={{ color: "var(--muted)" }}>
                          {club.direccion}
                        </p>
                      ) : null}
                      {servicios.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {servicios.map((s) => (
                            <span
                              key={s}
                              className="rounded-md border px-2 py-0.5 text-xs font-medium"
                              style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--muted)" }}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <Link
                      href={`/clubes/${club.username}`}
                      className="btn-primary shrink-0 text-xs"
                      style={{ padding: "0.4rem 0.9rem" }}
                    >
                      Ver club
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
