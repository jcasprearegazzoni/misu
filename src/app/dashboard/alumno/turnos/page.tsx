import Link from "next/link";
import { redirect } from "next/navigation";
import { formatUserDate, formatUserDateTime } from "@/lib/format/date";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { acceptSoloDecisionAction, cancelSoloDecisionAction } from "@/app/dashboard/alumno/decisiones/actions";
import { CancelBookingButton } from "./cancel-booking-button";

type AlumnoTab = "reservar" | "mis-clases" | "decisiones";

type BookingRow = {
  id: number;
  profesor_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: "individual" | "dobles" | "trio" | "grupal";
  status: "pendiente" | "confirmado" | "cancelado";
  package_consumed: boolean;
};

type ProfesorRow = {
  user_id: string;
  name: string;
  username: string | null;
  cancel_without_charge_hours: number | null;
};

type DecisionRow = {
  id: number;
  booking_id: number;
  status: "pendiente";
  decision_deadline_at: string | null;
  created_at: string;
};

type StudentPackageRow = {
  id: number;
  classes_remaining: number;
  paid: boolean;
  // Supabase puede devolver el join como objeto o array según la versión del cliente.
  package: { name: string; total_classes: number } | { name: string; total_classes: number }[] | null;
};

const statusLabel: Record<BookingRow["status"], string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmada",
  cancelado: "Cancelada",
};

const typeLabel: Record<BookingRow["type"], string> = {
  individual: "Individual",
  dobles: "Dobles",
  trio: "Trio",
  grupal: "Grupal",
};

const URGENT_WINDOW_MS = 6 * 60 * 60 * 1000;

function parseTab(value?: string): AlumnoTab {
  if (value === "reservar" || value === "mis-clases" || value === "decisiones") {
    return value;
  }
  return "reservar";
}

function isFinalizedBooking(booking: BookingRow) {
  if (booking.status === "cancelado") {
    return false;
  }
  const endDateTime = new Date(`${booking.date}T${booking.end_time.slice(0, 8)}-03:00`);
  return endDateTime.getTime() < Date.now();
}

function groupBookingsByDate(bookings: BookingRow[]) {
  const groupsMap = new Map<string, BookingRow[]>();

  for (const booking of bookings) {
    if (!groupsMap.has(booking.date)) {
      groupsMap.set(booking.date, []);
    }
    groupsMap.get(booking.date)?.push(booking);
  }

  return Array.from(groupsMap.entries())
    .map(([date, dayBookings]) => ({
      date,
      label: formatUserDate(date),
      bookings: dayBookings.sort((a, b) => a.start_time.localeCompare(b.start_time)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

type AlumnoTurnosPageProps = {
  searchParams?: Promise<{ tab?: string }>;
};

export default async function AlumnoTurnosPage({ searchParams }: AlumnoTurnosPageProps) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "alumno") {
    redirect("/dashboard/profesor/turnos");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const activeTab = parseTab(resolvedSearchParams?.tab);

  const supabase = await createSupabaseServerClient();

  const [{ data: profesoresData }, { data: bookingsData }, { data: decisionsData }, { data: studentPackagesData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, name, username, cancel_without_charge_hours")
      .eq("role", "profesor")
      .order("name", { ascending: true }),
    supabase
      .from("bookings")
      .select("id, profesor_id, date, start_time, end_time, type, status, package_consumed")
      .eq("alumno_id", profile.user_id)
      .in("status", ["pendiente", "confirmado"])
      .order("date", { ascending: true })
      .order("start_time", { ascending: true }),
    supabase
      .from("booking_solo_decisions")
      .select("id, booking_id, status, decision_deadline_at, created_at")
      .eq("alumno_id", profile.user_id)
      .eq("status", "pendiente")
      .order("decision_deadline_at", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("student_packages")
      .select("id, classes_remaining, paid, package:packages(name, total_classes)")
      .eq("alumno_id", profile.user_id)
      .gt("classes_remaining", 0)
      .order("created_at", { ascending: false }),
  ]);

  const profesores = (profesoresData ?? []) as ProfesorRow[];
  const bookings = (bookingsData ?? []) as BookingRow[];
  const decisions = (decisionsData ?? []) as DecisionRow[];
  const studentPackages = (studentPackagesData ?? []) as StudentPackageRow[];

  const profesorMap = new Map(profesores.map((row) => [row.user_id, row]));
  const bookingsByDate = groupBookingsByDate(bookings);
  const bookingMap = new Map(bookings.map((booking) => [booking.id, booking]));
  const pendingDecisionsCount = decisions.length;
  const now = new Date().getTime();

  const tabs: Array<{ key: AlumnoTab; label: string; badge?: number }> = [
    { key: "reservar", label: "Reservar" },
    { key: "mis-clases", label: "Mis clases" },
    {
      key: "decisiones",
      label: "Decisiones",
      badge: pendingDecisionsCount > 0 ? pendingDecisionsCount : undefined,
    },
  ];

  // El perfil se considera incompleto si el alumno nunca eligió su categoría.
  const perfilCompleto = profile.category !== null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-8 sm:px-6 sm:py-10">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-black tracking-tight sm:text-3xl"
          style={{ color: "var(--foreground)" }}
        >
          Clases
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
          Reservá, gestioná y decidí desde una sola pantalla.
        </p>
      </div>

      {/* Perfil incompleto */}
      {!perfilCompleto ? (
        <div className="alert-warning mt-5" style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <span style={{ flexShrink: 0 }}>⚠️</span>
          <div>
            <p className="font-semibold" style={{ color: "var(--warning)", marginBottom: "6px" }}>
              Completá tu perfil
            </p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Agregá tu categoría y rama para que el profesor pueda conocerte antes de la clase.
            </p>
            <Link
              href="/dashboard/alumno/perfil"
              className="mt-3 inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold transition"
              style={{
                background: "var(--warning-bg)",
                border: "1px solid var(--warning-border)",
                color: "var(--warning)",
              }}
            >
              Ir a mi perfil →
            </Link>
          </div>
        </div>
      ) : null}

      {/* Tabs */}
      <div
        className="mt-6 flex gap-1 rounded-xl p-1"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", display: "inline-flex" }}
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Link
              key={tab.key}
              href={`/dashboard/alumno/turnos?tab=${tab.key}`}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
              style={
                isActive
                  ? { background: "var(--misu)", color: "#fff", boxShadow: "0 2px 12px var(--misu-glow)" }
                  : { color: "var(--muted)" }
              }
            >
              {tab.label}
              {tab.badge ? (
                <span
                  className="rounded-full px-1.5 py-0.5 text-xs font-bold"
                  style={
                    isActive
                      ? { background: "rgba(255,255,255,0.2)", color: "#fff" }
                      : { background: "var(--error)", color: "#fff" }
                  }
                >
                  {tab.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      {/* Tab: Reservar */}
      {activeTab === "reservar" ? (
        <section className="mt-6 card p-5">
          <p className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
            Elegir profesor
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Seleccioná un profesor para ver su semana y reservar una clase.
          </p>

          {profesores.length === 0 ? (
            <div
              className="mt-4 rounded-lg px-4 py-4 text-sm text-center"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--muted)",
              }}
            >
              No hay profesores cargados por el momento.
            </div>
          ) : (
            <ul className="mt-4 grid gap-2">
              {profesores.map((profesor) => (
                <li
                  key={profesor.user_id}
                  className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                      style={{
                        background: "var(--misu-subtle)",
                        border: "1px solid var(--border-misu)",
                        color: "var(--misu)",
                      }}
                    >
                      {profesor.name[0]?.toUpperCase()}
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      {profesor.name}
                    </p>
                  </div>
                  {profesor.username ? (
                    <Link
                      href={`/p/${profesor.username}`}
                      className="btn-primary text-xs"
                      style={{ padding: "0.4rem 0.9rem" }}
                    >
                      Ver semana
                    </Link>
                  ) : (
                    <span
                      className="text-xs rounded-lg px-3 py-1.5"
                      style={{
                        background: "var(--surface-3)",
                        border: "1px solid var(--border)",
                        color: "var(--muted-2)",
                      }}
                    >
                      Sin link público
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {/* Tab: Mis clases */}
      {activeTab === "mis-clases" ? (
        <section className="mt-6 grid gap-4">
          {/* Créditos de paquete */}
          {studentPackages.length > 0 ? (
            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--success-bg)",
                border: "1px solid var(--success-border)",
              }}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--success)" }}>
                📦 Créditos de paquete disponibles
              </p>
              <ul className="mt-3 grid gap-2">
                {studentPackages.map((pkg) => {
                  const pkgData = Array.isArray(pkg.package) ? pkg.package[0] : pkg.package;
                  const nombre = pkgData?.name ?? "Paquete";
                  const total = pkgData?.total_classes ?? 0;
                  return (
                    <li
                      key={pkg.id}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
                      style={{
                        background: "rgba(34,197,94,0.06)",
                        border: "1px solid rgba(34,197,94,0.15)",
                      }}
                    >
                      <span style={{ color: "var(--muted)" }}>
                        {nombre} ({total} clases)
                      </span>
                      <span className="font-bold" style={{ color: "var(--success)" }}>
                        {pkg.classes_remaining} restantes
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {/* Reservas por fecha */}
          {bookingsByDate.length === 0 ? (
            <div
              className="card px-4 py-6 text-center text-sm"
              style={{ color: "var(--muted)" }}
            >
              Aún no tenés clases reservadas.
            </div>
          ) : (
            bookingsByDate.map((group) => (
              <section
                key={group.date}
                className="card overflow-hidden"
              >
                <header
                  className="px-4 py-3"
                  style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}
                >
                  <h2 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                    {group.label}
                  </h2>
                </header>
                <ul className="grid gap-2 p-3">
                  {group.bookings.map((booking) => {
                    const isFinalized = isFinalizedBooking(booking);
                    const isPaid = booking.package_consumed;

                    const computedStatusLabel = isFinalized
                      ? isPaid ? "Finalizada — paquete" : "Finalizada"
                      : statusLabel[booking.status];

                    const statusStyle = isFinalized
                      ? isPaid
                        ? "badge-confirmed"
                        : "badge-pending"
                      : booking.status === "confirmado"
                        ? "badge-confirmed"
                        : booking.status === "pendiente"
                          ? "badge-pending"
                          : "badge-cancelled";

                    return (
                      <li
                        key={booking.id}
                        className="rounded-xl px-4 py-3 text-sm"
                        style={{
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold" style={{ color: "var(--foreground)" }}>
                            {booking.start_time.slice(0, 5)} — {booking.end_time.slice(0, 5)}
                          </p>
                          <span className={statusStyle}>{computedStatusLabel}</span>
                        </div>

                        {isFinalized ? (
                          <p
                            className="mt-1 text-xs"
                            style={{
                              color: isPaid ? "var(--success)" : "var(--warning)",
                              fontWeight: 500,
                            }}
                          >
                            {isPaid ? "✓ Cubierta por paquete" : "⏳ Pendiente de pago — coordiná con tu profesor"}
                          </p>
                        ) : null}

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: "var(--muted)" }}>
                          <span>Prof: {profesorMap.get(booking.profesor_id)?.name ?? "Profesor"}</span>
                          <span>Tipo: {typeLabel[booking.type]}</span>
                        </div>

                        {(() => {
                          const profesor = profesorMap.get(booking.profesor_id);
                          const cancelWindowHours = Number(profesor?.cancel_without_charge_hours ?? 0);
                          const bookingStart = new Date(`${booking.date}T${booking.start_time.slice(0, 8)}-03:00`);
                          const nowDate = new Date();
                          const minCancelDate = new Date(
                            bookingStart.getTime() - cancelWindowHours * 60 * 60 * 1000,
                          );
                          const canCancelByWindow = cancelWindowHours <= 0 || nowDate <= minCancelDate;
                          const canCancelStatus = booking.status === "pendiente" || booking.status === "confirmado";

                          if (!canCancelStatus) return null;

                          if (!canCancelByWindow) {
                            return (
                              <p className="mt-2 text-xs" style={{ color: "var(--muted-2)" }}>
                                Ya pasó el plazo de cancelación del profesor.
                              </p>
                            );
                          }

                          return (
                            <div className="mt-2">
                              <CancelBookingButton bookingId={booking.id} />
                            </div>
                          );
                        })()}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </section>
      ) : null}

      {/* Tab: Decisiones */}
      {activeTab === "decisiones" ? (
        <section className="mt-6 grid gap-3">
          {decisions.length === 0 ? (
            <div
              className="card px-4 py-6 text-center text-sm"
              style={{ color: "var(--muted)" }}
            >
              ✓ Sin decisiones pendientes
            </div>
          ) : (
            decisions.map((decision) => {
              const booking = bookingMap.get(decision.booking_id);

              if (!booking) {
                return (
                  <div
                    key={decision.id}
                    className="card px-4 py-3 text-sm"
                    style={{ color: "var(--muted)" }}
                  >
                    Reserva no disponible.
                  </div>
                );
              }

              const deadline = decision.decision_deadline_at ? new Date(decision.decision_deadline_at) : null;
              const isUrgent = deadline ? deadline.getTime() - now < URGENT_WINDOW_MS : false;

              return (
                <article
                  key={decision.id}
                  className="rounded-xl px-4 py-4 text-sm"
                  style={{
                    background: isUrgent ? "var(--error-bg)" : "var(--surface-1)",
                    border: `1px solid ${isUrgent ? "var(--error-border)" : "var(--border)"}`,
                  }}
                >
                  <p className="font-bold" style={{ color: "var(--foreground)" }}>
                    {formatUserDate(booking.date)} — {booking.start_time.slice(0, 5)} a {booking.end_time.slice(0, 5)}
                  </p>
                  <p className="mt-1" style={{ color: "var(--muted)" }}>
                    Profesor: {profesorMap.get(booking.profesor_id)?.name ?? "No disponible"}
                  </p>
                  <p style={{ color: "var(--muted)" }}>Tipo actual: {typeLabel[booking.type]}</p>

                  <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                    Quedaste solo/a en esta clase grupal. Podés aceptarla como clase individual o cancelar la reserva.
                  </p>

                  {deadline ? (
                    <p
                      className="mt-1.5 text-sm font-medium"
                      style={{ color: isUrgent ? "var(--error)" : "var(--muted)" }}
                    >
                      {isUrgent ? "⏰ Expira pronto — " : "Vence: "}
                      {formatUserDateTime(decision.decision_deadline_at!)}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <form action={acceptSoloDecisionAction}>
                      <input type="hidden" name="decision_id" value={decision.id} />
                      <button
                        className="rounded-lg px-4 py-2 text-xs font-bold text-white transition"
                        style={{ background: "var(--success)" }}
                      >
                        ✓ Aceptar individual
                      </button>
                    </form>

                    <form action={cancelSoloDecisionAction}>
                      <input type="hidden" name="decision_id" value={decision.id} />
                      <button
                        className="rounded-lg px-4 py-2 text-xs font-bold text-white transition"
                        style={{ background: "var(--error)" }}
                      >
                        ✕ Cancelar reserva
                      </button>
                    </form>
                  </div>
                </article>
              );
            })
          )}
        </section>
      ) : null}

      {/* CTA flotante mobile */}
      <div
        className="fixed inset-x-0 bottom-0 z-20 p-3 md:hidden"
        style={{
          background: "rgba(12,12,14,0.9)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid var(--border)",
        }}
      >
        {pendingDecisionsCount > 0 && activeTab !== "decisiones" ? (
          <Link
            href="/dashboard/alumno/turnos?tab=decisiones"
            className="btn-primary inline-flex h-12 w-full items-center justify-center rounded-xl text-sm"
            style={{ background: "var(--error)" }}
          >
            ⚠️ Ver decisiones ({pendingDecisionsCount})
          </Link>
        ) : activeTab !== "reservar" ? (
          <Link
            href="/dashboard/alumno/turnos?tab=reservar"
            className="btn-primary inline-flex h-12 w-full items-center justify-center rounded-xl text-sm"
          >
            Reservar clase
          </Link>
        ) : (
          <Link
            href="/dashboard/alumno/turnos?tab=mis-clases"
            className="btn-secondary inline-flex h-12 w-full items-center justify-center rounded-xl text-sm"
          >
            Ver mis clases
          </Link>
        )}
      </div>
      <div className="h-16 md:hidden" />
    </main>
  );
}
