import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ReservasFilters } from "./reservas-filters";

type ClubRow = {
  id: number;
  nombre: string;
  username: string;
  direccion: string | null;
  canchas: Array<{ deporte: "tenis" | "padel" | "futbol" | "otro" }> | null;
};

type ReservaActivaParticipanteRow = {
  id: number;
  reservas_cancha:
    | {
        id: number;
        fecha: string;
        hora_inicio: string;
        hora_fin: string;
        deporte: "tenis" | "padel" | "futbol";
        estado: "pendiente" | "confirmada";
        clubs: { nombre: string; username: string } | Array<{ nombre: string; username: string }> | null;
      }
    | Array<{
        id: number;
        fecha: string;
        hora_inicio: string;
        hora_fin: string;
        deporte: "tenis" | "padel" | "futbol";
        estado: "pendiente" | "confirmada";
        clubs: { nombre: string; username: string } | Array<{ nombre: string; username: string }> | null;
      }>
    | null;
};

type ClubCard = {
  id: number;
  nombre: string;
  username: string;
  direccion: string | null;
  deportes: Array<"tenis" | "padel" | "futbol">;
};

type ReservaActivaCard = {
  id: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  deporte: "tenis" | "padel" | "futbol";
  estado: "pendiente" | "confirmada";
  clubNombre: string;
  clubUsername: string | null;
};

function formatReservaFecha(fecha: string, horaInicio: string, horaFin: string) {
  const [year, month, day] = fecha.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = date.toLocaleDateString("es-AR", { weekday: "short" });
  const wd = weekday.charAt(0).toUpperCase() + weekday.slice(1, 3);
  const d = String(day).padStart(2, "0");
  const m = String(month).padStart(2, "0");
  const inicio = horaInicio.slice(0, 5);
  const fin = horaFin.slice(0, 5);
  return `${wd} ${d}/${m} · ${inicio} → ${fin}`;
}

function getDeporteLabel(deporte: "tenis" | "padel" | "futbol") {
  if (deporte === "tenis") return "Tenis";
  if (deporte === "padel") return "Padel";
  return "Fútbol";
}

export default async function AlumnoReservasPage() {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "alumno") redirect("/dashboard/profesor/turnos");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const clubsResultPromise = supabase
    .from("clubs")
    .select(`
      id, nombre, username, direccion,
      canchas!inner (deporte)
    `)
    .eq("canchas.activa", true)
    .not("username", "is", null)
    .order("nombre", { ascending: true });

  const reservasActivasPromise = user
    ? supabase
        .from("reserva_participantes")
        .select(`
          id,
          reservas_cancha!inner (
            id, fecha, hora_inicio, hora_fin, deporte, estado,
            clubs!inner (nombre, username)
          )
        `)
        .eq("user_id", user.id)
        .in("reservas_cancha.estado", ["pendiente", "confirmada"])
        .gte("reservas_cancha.fecha", new Date().toISOString().slice(0, 10))
        .order("fecha", { ascending: true, referencedTable: "reservas_cancha" })
        .order("hora_inicio", { ascending: true, referencedTable: "reservas_cancha" })
        .limit(10)
    : Promise.resolve({ data: null, error: null });

  const [clubsResult, reservasActivasResult] = await Promise.all([clubsResultPromise, reservasActivasPromise]);

  const clubRows = (clubsResult.data ?? []) as ClubRow[];
  const clubsMap = new Map<number, ClubCard>();
  for (const row of clubRows) {
    const deportes = Array.from(
      new Set(
        (row.canchas ?? [])
          .map((cancha) => cancha.deporte)
          .filter((deporte): deporte is "tenis" | "padel" | "futbol" => deporte !== "otro"),
      ),
    );

    if (deportes.length === 0) {
      continue;
    }

    if (!clubsMap.has(row.id)) {
      clubsMap.set(row.id, {
        id: row.id,
        nombre: row.nombre,
        username: row.username,
        direccion: row.direccion,
        deportes,
      });
    }
  }
  const clubs = Array.from(clubsMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, "es-AR"));

  const reservasActivasRows = (reservasActivasResult.data ?? []) as ReservaActivaParticipanteRow[];
  const reservasActivas: ReservaActivaCard[] = reservasActivasRows
    .map((row) => {
      const reserva = Array.isArray(row.reservas_cancha) ? row.reservas_cancha[0] ?? null : row.reservas_cancha;
      if (!reserva) return null;
      const club = Array.isArray(reserva.clubs) ? reserva.clubs[0] ?? null : reserva.clubs;
      return {
        id: reserva.id,
        fecha: reserva.fecha,
        horaInicio: reserva.hora_inicio,
        horaFin: reserva.hora_fin,
        deporte: reserva.deporte,
        estado: reserva.estado,
        clubNombre: club?.nombre ?? "Club",
        clubUsername: club?.username ?? null,
      };
    })
    .filter((item): item is ReservaActivaCard => item !== null);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-3 py-6 sm:px-4 sm:py-8">
      <header>
        <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--foreground)" }}>
          Reservas
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
          Explorá clubes y gestioná tus reservas de cancha.
        </p>
      </header>

      {reservasActivas.length > 0 ? (
        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
            Mis reservas activas
          </h2>

          <div className="mt-3 grid gap-2">
            {reservasActivas.map((reserva) => (
              <div
                key={reserva.id}
                className="rounded-2xl border p-3"
                style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {reserva.clubNombre} · {getDeporteLabel(reserva.deporte)}
                  </p>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={
                      reserva.estado === "confirmada"
                        ? { background: "var(--success-bg)", color: "var(--success)" }
                        : { background: "var(--warning-bg)", color: "var(--warning)" }
                    }
                  >
                    {reserva.estado}
                  </span>
                </div>
                <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                  {formatReservaFecha(reserva.fecha, reserva.horaInicio, reserva.horaFin)}
                </p>
                {reserva.clubUsername ? (
                  <Link
                    href={`/clubes/${reserva.clubUsername}`}
                    className="mt-2 inline-flex text-xs font-semibold"
                    style={{ color: "var(--misu)" }}
                  >
                    Ver club →
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
          Explorar clubes
        </h2>
        <div className="mt-3">
          <ReservasFilters clubs={clubs} />
        </div>
      </section>
    </main>
  );
}
