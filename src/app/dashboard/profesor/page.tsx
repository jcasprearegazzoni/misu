import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatUserDate } from "@/lib/format/date";

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

const statusLabel: Record<BookingStatus, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmada",
  cancelado: "Cancelada",
};

function getTodayIsoInArgentina() {
  const now = new Date();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function getNowTimeInArgentina() {
  const now = new Date();
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);
}

function parseTimeToSeconds(timeValue: string) {
  const normalized = timeValue.slice(0, 8);
  const [hoursRaw, minutesRaw, secondsRaw] = normalized.split(":");
  const hours = Number(hoursRaw ?? 0);
  const minutes = Number(minutesRaw ?? 0);
  const seconds = Number(secondsRaw ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
}

export default async function DashboardProfesorPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "profesor") {
    redirect("/dashboard/alumno/turnos");
  }

  const supabase = await createSupabaseServerClient();
  const todayIso = getTodayIsoInArgentina();
  const nowTime = getNowTimeInArgentina();

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
    new Set([...todayClasses.map((item) => item.alumno_id), ...upcomingClasses.map((item) => item.alumno_id)]),
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

  const nowTimeInSeconds = parseTimeToSeconds(nowTime);
  const nextClass =
    upcomingClasses.find(
      (item) => item.date > todayIso || (item.date === todayIso && parseTimeToSeconds(item.start_time) >= nowTimeInSeconds),
    ) ??
    null;

  const quickLinks = [
    {
      href: "/dashboard/profesor/calendario",
      title: "Calendario",
      description: "Ver agenda semanal y gestionar clases.",
    },
    {
      href: "/dashboard/profesor/finanzas",
      title: "Finanzas",
      description: "Revisar cobros, pagos y estado económico.",
    },
    {
      href: "/dashboard/profesor/paquetes",
      title: "Paquetes",
      description: "Administrar paquetes y asignaciones.",
    },
    {
      href: "/dashboard/profesor/ajustes",
      title: "Ajustes",
      description: "Acceder a configuración y datos de perfil.",
    },
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-3 py-6 sm:px-4 sm:py-8">
      <header>
        <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--foreground)" }}>
          Inicio
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
          Resumen diario de tu actividad.
        </p>
      </header>

      {hasAnyError ? (
        <p className="alert-error mt-6">No se pudieron cargar los datos del dashboard.</p>
      ) : (
        <>
          <section className="card mt-6 p-4">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
                Próxima clase
              </h2>
              {nextClass ? (
                <Link
                  href="/dashboard/profesor/calendario"
                  className="shrink-0 text-xs font-semibold"
                  style={{ color: "var(--misu)" }}
                >
                  Ver calendario →
                </Link>
              ) : null}
            </div>

            {nextClass ? (
              <div
                className="mt-3 flex items-center gap-4 rounded-xl border px-4 py-3"
                style={{
                  borderColor: "var(--border-misu)",
                  background: "var(--misu-subtle)",
                }}
              >
                {/* Hora */}
                <div className="shrink-0 text-center">
                  <p
                    className="text-xl font-black leading-none tabular-nums"
                    style={{ color: "var(--misu)" }}
                  >
                    {nextClass.start_time.slice(0, 5)}
                  </p>
                  <p
                    className="mt-0.5 text-xs leading-none tabular-nums"
                    style={{ color: "var(--muted)" }}
                  >
                    {nextClass.end_time.slice(0, 5)}
                  </p>
                </div>

                <div
                  className="h-10 w-px shrink-0"
                  style={{ background: "var(--border-misu)" }}
                />

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-semibold leading-tight"
                    style={{ color: "var(--foreground)" }}
                  >
                    {new Intl.DateTimeFormat("es-AR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      timeZone: "America/Argentina/Buenos_Aires",
                    }).format(new Date(`${nextClass.date}T12:00:00-03:00`))}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                    {alumnoNameMap.get(nextClass.alumno_id) ?? "Alumno"}
                    {" · "}{typeLabel[nextClass.type]}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
                No hay próximas clases agendadas.
              </p>
            )}
          </section>

          <section className="card mt-6 p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
                Clases de hoy
              </h2>
              <span
                className="rounded-full border px-2 py-0.5 text-[11px] font-medium"
                style={{ borderColor: "var(--border)", color: "var(--muted)" }}
              >
                {formatUserDate(todayIso)}
              </span>
            </div>

            {todayClasses.length === 0 ? (
              <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
                No tenés clases programadas para hoy.
              </p>
            ) : (
              <ul className="mt-3 grid gap-1.5">
                {todayClasses.map((item) => {
                  const isPendiente = item.status === "pendiente";
                  return (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
                      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                    >
                      {/* Hora bloque */}
                      <div className="w-[42px] shrink-0 text-right">
                        <p
                          className="text-sm font-bold leading-tight tabular-nums"
                          style={{ color: "var(--foreground)" }}
                        >
                          {item.start_time.slice(0, 5)}
                        </p>
                        <p
                          className="text-[10px] leading-tight tabular-nums"
                          style={{ color: "var(--muted)" }}
                        >
                          {item.end_time.slice(0, 5)}
                        </p>
                      </div>

                      <div
                        className="h-7 w-px shrink-0"
                        style={{ background: "var(--border)" }}
                      />

                      {/* Nombre + tipo */}
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate text-sm font-medium"
                          style={{ color: "var(--foreground)" }}
                        >
                          {alumnoNameMap.get(item.alumno_id) ?? "Alumno"}
                        </p>
                        <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                          {typeLabel[item.type]}
                        </p>
                      </div>

                      {/* Badge */}
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={
                          isPendiente
                            ? { background: "var(--warning-bg)", color: "var(--warning)" }
                            : { background: "var(--success-bg)", color: "var(--success)" }
                        }
                      >
                        {statusLabel[item.status]}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="mt-6">
            <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
              Accesos rápidos
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {quickLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="card block p-4 transition-opacity hover:opacity-90"
                >
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
