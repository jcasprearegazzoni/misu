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
  sport: "tenis" | "padel" | "ambos" | null;
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

  const [{ data: bookingsData }, { data: profesoresData }, { data: proximaReservaCanchaData }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("id, date, start_time, end_time, type, status, profesor_id, sport")
        .eq("alumno_id", profile.user_id)
        .in("status", ["pendiente", "confirmado"])
        .order("date", { ascending: true })
        .order("start_time", { ascending: true }),
      supabase.from("profiles").select("user_id, name, sport").eq("role", "profesor"),
      proximaReservaCanchaPromise,
    ]);

  const bookings = (bookingsData ?? []) as BookingRow[];
  const profesores = (profesoresData ?? []) as ProfesorRow[];
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
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-3 py-6 sm:px-4 sm:py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl" style={{ color: "var(--foreground)" }}>
          Hola, <span style={{ color: "var(--misu)" }}>{firstName}</span> 👋
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
          ¿Qué querés hacer hoy?
        </p>
      </header>

      {proximaClase ? (
        <div
          className="mb-6 rounded-2xl p-5"
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
          className="mb-6 rounded-2xl border p-4"
          style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
        >
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted-2)" }}>
            Próxima reserva de cancha
          </p>
          <p className="mt-2 text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {clubNombre} — {reservaCancha.deporte === "padel" ? "Padel" : reservaCancha.deporte === "tenis" ? "Tenis" : "Futbol"}
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {formatReservaFecha(reservaCancha.fecha, reservaCancha.hora_inicio, reservaCancha.hora_fin)}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              Estado:
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-xs"
              style={
                reservaCancha.estado === "confirmada"
                  ? { background: "var(--success-bg)", color: "var(--success)" }
                  : { background: "var(--warning-bg)", color: "var(--warning)" }
              }
            >
              {reservaCancha.estado}
            </span>
          </div>
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

        <Link
          href="/dashboard/alumno/perfil"
          className="group rounded-2xl border p-6 transition-all sm:col-span-2"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-black"
              style={{
                background: "var(--misu-subtle)",
                border: "1px solid var(--border-misu)",
                color: "var(--misu)",
              }}
            >
              {firstName[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: "var(--foreground)" }}>
                Mi perfil
              </h2>
              <p className="mt-0.5 text-sm" style={{ color: "var(--muted)" }}>
                Actualizá tu categoría, zona y equipo para que tu profe te conozca mejor.
              </p>
            </div>
            <svg
              className="ml-auto h-4 w-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--muted-2)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </Link>
      </div>
    </main>
  );
}

