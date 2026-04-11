import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type BookingRow = {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  type: "individual" | "dobles" | "trio" | "grupal";
  status: "pendiente" | "confirmado" | "cancelado";
  profesor_id: string;
  sport: "tenis" | "padel" | null;
};

type ProfesorRow = {
  user_id: string;
  name: string;
};

type ProximaReservaCanchaRow = {
  id: number;
  reservas_cancha:
    | {
        id: number;
        fecha: string;
        hora_inicio: string;
        hora_fin: string;
        deporte: "tenis" | "padel" | "futbol";
        estado: "pendiente" | "confirmada";
        clubs: { nombre: string } | Array<{ nombre: string }> | null;
      }
    | Array<{
        id: number;
        fecha: string;
        hora_inicio: string;
        hora_fin: string;
        deporte: "tenis" | "padel" | "futbol";
        estado: "pendiente" | "confirmada";
        clubs: { nombre: string } | Array<{ nombre: string }> | null;
      }>
    | null;
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

export default async function DashboardAlumnoPage() {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "alumno") redirect("/dashboard/profesor/turnos");

  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const proximaReservaCanchaPromise = user
    ? supabase
        .from("reserva_participantes")
        .select(`
          id,
          reservas_cancha!inner (
            id,
            fecha,
            hora_inicio,
            hora_fin,
            deporte,
            estado,
            clubs!inner (
              nombre
            )
          )
        `)
        .eq("user_id", user.id)
        .gte("reservas_cancha.fecha", new Date().toISOString().slice(0, 10))
        .in("reservas_cancha.estado", ["pendiente", "confirmada"])
        .order("fecha", { ascending: true, referencedTable: "reservas_cancha" })
        .order("hora_inicio", { ascending: true, referencedTable: "reservas_cancha" })
        .limit(1)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const [
    { data: bookingsData, error: bookingsError },
    { data: proximaReservaCanchaData, error: proximaReservaCanchaError },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, date, start_time, end_time, type, status, profesor_id, sport")
      .eq("alumno_id", profile.user_id)
      .in("status", ["pendiente", "confirmado"])
      .order("date", { ascending: true })
      .order("start_time", { ascending: true }),
    proximaReservaCanchaPromise,
  ]);

  // Si falla cualquier consulta base del dashboard, mostramos estado de error.
  const hasLoadError = Boolean(bookingsError || proximaReservaCanchaError);
  if (hasLoadError) {
    return (
      <main className="mx-auto flex w-full max-w-[1600px] flex-col px-3 py-6 sm:px-4 sm:py-10">
        <p className="alert-error">No se pudieron cargar los datos del dashboard. Intentá de nuevo.</p>
      </main>
    );
  }

  const bookings = (bookingsData ?? []) as BookingRow[];
  const profesorIds = Array.from(new Set(bookings.map((booking) => booking.profesor_id).filter(Boolean)));
  let profesores: ProfesorRow[] = [];

  if (profesorIds.length > 0) {
    const { data: profesoresData } = await supabase
      .from("profiles")
      .select("user_id, name")
      .in("user_id", profesorIds);

    profesores = (profesoresData ?? []) as ProfesorRow[];
  }

  const profesorMap = new Map(profesores.map((p) => [p.user_id, p]));
  const proximaReservaParticipante = (proximaReservaCanchaData ?? null) as ProximaReservaCanchaRow | null;
  const reservaCancha = Array.isArray(proximaReservaParticipante?.reservas_cancha)
    ? (proximaReservaParticipante?.reservas_cancha[0] ?? null)
    : (proximaReservaParticipante?.reservas_cancha ?? null);

  // Primera clase futura
  const proximaClase =
    bookings.find((b) => {
      const start = new Date(`${b.date}T${b.start_time.slice(0, 8)}-03:00`);
      return start.getTime() > now.getTime();
    }) ?? null;

  const totalClasesPendientes = bookings.length;
  const firstName = profile.name.split(" ")[0] ?? profile.name;
  const clubNombre = Array.isArray(reservaCancha?.clubs)
    ? (reservaCancha?.clubs[0]?.nombre ?? "Club")
    : (reservaCancha?.clubs?.nombre ?? "Club");

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col px-3 py-6 sm:px-4 sm:py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl" style={{ color: "var(--foreground)" }}>
          Hola, <span style={{ color: "var(--misu)" }}>{firstName}</span>
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
          ¿Qué querés hacer hoy?
        </p>
      </header>

      {proximaClase || reservaCancha ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          {proximaClase ? (
        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--misu-subtle)", border: "1px solid var(--border-misu)" }}
        >
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--misu)" }}>
            Próxima clase
          </p>
          <p className="mt-2 text-2xl font-black tracking-tight" style={{ color: "var(--foreground)" }}>
            {proximaClase.start_time.slice(0, 5)}
            <span className="text-base font-semibold" style={{ color: "var(--muted)" }}>
              {" "}
              – {proximaClase.end_time.slice(0, 5)}
            </span>
          </p>
          <p className="mt-0.5 text-sm" style={{ color: "var(--foreground)" }}>
            {new Intl.DateTimeFormat("es-AR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              timeZone: "America/Argentina/Buenos_Aires",
            }).format(new Date(`${proximaClase.date}T12:00:00-03:00`))}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Prof: <strong>{profesorMap.get(proximaClase.profesor_id)?.name ?? "—"}</strong>
              {proximaClase.sport ? (
                <>
                  {" "}
                  · <strong>{proximaClase.sport === "tenis" ? "Tenis" : "Pádel"}</strong>
                </>
              ) : null}
            </p>
            <Link
              href="/dashboard/alumno/turnos?tab=mis-clases"
              className="text-xs font-semibold"
              style={{ color: "var(--misu)" }}
            >
              Ver todas →
            </Link>
          </div>
        </div>
      ) : null}

      {reservaCancha ? (
        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--success-bg)", border: "1px solid var(--success-border)" }}
        >
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--success)" }}>
            Próxima reserva de cancha
          </p>
          <p className="mt-2 text-2xl font-black tracking-tight" style={{ color: "var(--foreground)" }}>
            {reservaCancha.hora_inicio.slice(0, 5)}
            <span className="text-base font-semibold" style={{ color: "var(--muted)" }}>
              {" "}
              – {reservaCancha.hora_fin.slice(0, 5)}
            </span>
          </p>
          <p className="mt-0.5 text-sm" style={{ color: "var(--foreground)" }}>
            {new Intl.DateTimeFormat("es-AR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              timeZone: "America/Argentina/Buenos_Aires",
            }).format(new Date(`${reservaCancha.fecha}T12:00:00-03:00`))}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {clubNombre}
              {" · "}
              <strong>
                {reservaCancha.deporte === "padel"
                  ? "Pádel"
                  : reservaCancha.deporte === "tenis"
                    ? "Tenis"
                    : "Fútbol"}
              </strong>
              {" · "}
              <span
                style={
                  reservaCancha.estado === "confirmada"
                    ? { color: "var(--success)" }
                    : { color: "var(--warning)" }
                }
              >
                {reservaCancha.estado}
              </span>
            </p>
            <Link
              href="/dashboard/alumno/reservas"
              className="text-xs font-semibold"
              style={{ color: "var(--success)" }}
            >
              Ver todas →
            </Link>
          </div>
        </div>
                ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/alumno/turnos"
          className="group rounded-2xl border p-6 transition-all"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
        >
          <div
            className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: "var(--misu-subtle)", border: "1px solid var(--border-misu)" }}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--misu)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h2 className="text-base font-bold" style={{ color: "var(--foreground)" }}>
            Clases
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            Tomá clases y mejorá tu juego. Reservá con tu profe, gestioná tus turnos y seguí tu progreso.
          </p>
          {totalClasesPendientes > 0 ? (
            <p className="mt-4 text-xs font-semibold" style={{ color: "var(--misu)" }}>
              {totalClasesPendientes} {totalClasesPendientes === 1 ? "clase próxima" : "clases próximas"} →
            </p>
          ) : (
            <p className="mt-4 text-xs" style={{ color: "var(--muted-2)" }}>
              Sin clases reservadas →
            </p>
          )}
        </Link>

        <Link
          href="/dashboard/alumno/reservas"
          className="group rounded-2xl border p-6 transition-all"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
        >
          <div
            className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: "var(--misu-subtle)", border: "1px solid var(--border-misu)" }}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--misu)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h2 className="text-base font-bold" style={{ color: "var(--foreground)" }}>Reservas</h2>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            Reservá tu cancha cuando quieras. Encontrá el club más cercano y elegí tu horario al instante.
          </p>
          <p className="mt-4 text-xs" style={{ color: "var(--muted-2)" }}>
            Ver reservas y clubes →
          </p>
        </Link>
      </div>
    </main>
  );
}

