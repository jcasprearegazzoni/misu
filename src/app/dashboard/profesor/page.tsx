import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type BookingStatus = "pendiente" | "confirmado" | "cancelado";
type BookingType = "individual" | "dobles" | "trio" | "grupal";

type BookingRow = {
  id: number;
  alumno_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: BookingType;
  status: BookingStatus;
};

type AlumnoProfileRow = {
  user_id: string;
  name: string | null;
};

const typeLabel: Record<BookingType, string> = {
  individual: "Individual",
  dobles: "Dobles",
  trio: "Trío",
  grupal: "Grupal",
};

function getTodayIsoInArgentina() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}


export default async function DashboardProfesorPage() {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "profesor") redirect("/dashboard/alumno/turnos");

  const supabase = await createSupabaseServerClient();
  const todayIso = getTodayIsoInArgentina();

  const [todayClassesResult, upcomingClassesResult] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, alumno_id, date, start_time, end_time, type, status")
      .eq("profesor_id", profile.user_id)
      .eq("date", todayIso)
      .in("status", ["pendiente", "confirmado"])
      .order("start_time", { ascending: true }),
    supabase
      .from("bookings")
      .select("id, alumno_id, date, start_time, end_time, type, status")
      .eq("profesor_id", profile.user_id)
      .gte("date", todayIso)
      .in("status", ["pendiente", "confirmado"])
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(50),
  ]);

  const hasLoadError = Boolean(todayClassesResult.error || upcomingClassesResult.error);
  const todayClasses = (todayClassesResult.data ?? []) as BookingRow[];
  const upcomingClasses = (upcomingClassesResult.data ?? []) as BookingRow[];

  const alumnoIds = Array.from(
    new Set([...todayClasses.map((c) => c.alumno_id), ...upcomingClasses.map((c) => c.alumno_id)]),
  );
  const alumnoProfilesResult =
    alumnoIds.length > 0
      ? await supabase.from("profiles").select("user_id, name").in("user_id", alumnoIds)
      : { data: [] as AlumnoProfileRow[], error: null };

  const alumnoProfiles = (alumnoProfilesResult.data ?? []) as AlumnoProfileRow[];
  const hasAnyError = hasLoadError || Boolean(alumnoProfilesResult.error);

  const alumnoNameMap = new Map<string, string>();
  for (const row of alumnoProfiles) {
    if (!alumnoNameMap.has(row.user_id)) {
      alumnoNameMap.set(row.user_id, row.name?.trim() || "Alumno");
    }
  }

  // Próximas clases agrupadas por día (desde mañana en adelante).
  const tomorrowIso = (() => {
    const [ty2, tm2, td2] = todayIso.split("-").map(Number);
    const tomorrow = new Date(ty2, (tm2 as number) - 1, (td2 as number) + 1);
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  })();

  const upcomingByDay: { dateIso: string; classes: BookingRow[] }[] = [];
  for (const cls of upcomingClasses) {
    if (cls.date <= todayIso) continue; // excluir hoy
    const last = upcomingByDay[upcomingByDay.length - 1];
    if (last && last.dateIso === cls.date) {
      last.classes.push(cls);
    } else {
      upcomingByDay.push({ dateIso: cls.date, classes: [cls] });
    }
  }

  // Saludo según hora local.
  const hourAr = Number(
    new Intl.DateTimeFormat("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
  );
  const greeting = hourAr < 12 ? "Buenos días" : hourAr < 19 ? "Buenas tardes" : "Buenas noches";

  // Fecha larga para el header.
  const todayLong = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const todayLongCapitalized = todayLong.charAt(0).toUpperCase() + todayLong.slice(1);


  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-8">
      {/* Header — saludo */}
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--misu)" }}>
          {greeting}
        </p>
        <h1 className="mt-0.5 text-2xl font-bold leading-tight" style={{ color: "var(--foreground)" }}>
          {profile.name}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          {todayLongCapitalized}
        </p>
      </header>

      {hasAnyError ? (
        <p className="alert-error">No se pudieron cargar los datos del dashboard.</p>
      ) : (
        <div className="grid gap-4">
          {/* Sección: Hoy */}
          <section className="card p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                Hoy
                {todayClasses.length > 0 && (
                  <span className="ml-2 text-xs font-normal" style={{ color: "var(--muted)" }}>
                    {todayClasses.length} {todayClasses.length === 1 ? "clase" : "clases"}
                  </span>
                )}
              </h2>
              {todayClasses.length > 0 && (
                <Link
                  href="/dashboard/profesor/turnos"
                  className="text-xs font-medium"
                  style={{ color: "var(--misu)" }}
                >
                  Ver todas →
                </Link>
              )}
            </div>

            {todayClasses.length === 0 ? (
              <div className="mt-4 flex flex-col items-center gap-3 py-4 text-center">
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  Sin clases hoy
                </p>
                <Link
                  href="/dashboard/profesor/turnos"
                  className="text-xs font-medium"
                  style={{ color: "var(--misu)" }}
                >
                  Agregar clase →
                </Link>
              </div>
            ) : (
              <ul className="mt-3 grid gap-2">
                {todayClasses.map((item) => {
                  const isPendiente = item.status === "pendiente";
                  return (
                    <li
                      key={item.id}
                      className="flex min-h-[52px] items-center gap-3 rounded-xl border px-3 py-3"
                      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                    >
                      {/* Hora */}
                      <div className="shrink-0 text-right" style={{ minWidth: "40px" }}>
                        <p className="text-sm font-bold tabular-nums" style={{ color: "var(--foreground)" }}>
                          {item.start_time.slice(0, 5)}
                        </p>
                        <p className="text-[10px] tabular-nums" style={{ color: "var(--muted)" }}>
                          {item.end_time.slice(0, 5)}
                        </p>
                      </div>

                      <div className="h-8 w-px shrink-0" style={{ background: "var(--border)" }} />

                      {/* Alumno + tipo */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                          {alumnoNameMap.get(item.alumno_id) ?? "Alumno"}
                        </p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>
                          {typeLabel[item.type]}
                        </p>
                      </div>

                      {/* Badge estado */}
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={
                          isPendiente
                            ? { background: "var(--warning-bg)", color: "var(--warning)" }
                            : { background: "var(--success-bg)", color: "var(--success)" }
                        }
                      >
                        {isPendiente ? "Pendiente" : "Confirmada"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Sección: Próximas */}
          {upcomingByDay.length > 0 && (
            <section className="card p-4">
              <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                Próximas
              </h2>

              <div className="mt-3 grid gap-4">
                {upcomingByDay.map(({ dateIso, classes }) => {
                  const isTomorrow = dateIso === tomorrowIso;
                  const dayLabel = isTomorrow
                    ? "Mañana"
                    : new Intl.DateTimeFormat("es-AR", {
                        timeZone: "America/Argentina/Buenos_Aires",
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      }).format(new Date(`${dateIso}T12:00:00`));
                  const dayLabelCapitalized = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);

                  return (
                    <div key={dateIso}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                        {dayLabelCapitalized}
                      </p>
                      <ul className="grid gap-2">
                        {classes.map((item) => {
                          const isPendiente = item.status === "pendiente";
                          return (
                            <li
                              key={item.id}
                              className="flex min-h-[48px] items-center gap-3 rounded-xl border px-3 py-2.5"
                              style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                            >
                              <div className="shrink-0 text-right" style={{ minWidth: "40px" }}>
                                <p className="text-sm font-bold tabular-nums" style={{ color: "var(--foreground)" }}>
                                  {item.start_time.slice(0, 5)}
                                </p>
                                <p className="text-[10px] tabular-nums" style={{ color: "var(--muted)" }}>
                                  {item.end_time.slice(0, 5)}
                                </p>
                              </div>

                              <div className="h-8 w-px shrink-0" style={{ background: "var(--border)" }} />

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                                  {alumnoNameMap.get(item.alumno_id) ?? "Alumno"}
                                </p>
                                <p className="text-xs" style={{ color: "var(--muted)" }}>
                                  {typeLabel[item.type]}
                                </p>
                              </div>

                              <span
                                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                style={
                                  isPendiente
                                    ? { background: "var(--warning-bg)", color: "var(--warning)" }
                                    : { background: "var(--success-bg)", color: "var(--success)" }
                                }
                              >
                                {isPendiente ? "Pendiente" : "Confirmada"}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
