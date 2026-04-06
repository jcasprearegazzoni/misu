import Link from "next/link";
import { requireClub } from "@/lib/auth/require-club";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ReservaHoyRow = {
  id: number;
  cancha_id: number;
  deporte: "tenis" | "padel" | "futbol";
  hora_inicio: string;
  duracion_minutos: number;
  estado: "pendiente" | "confirmada";
  tipo: "alquiler" | "clase";
  canchas: { nombre: string } | Array<{ nombre: string }> | null;
};

type ProximaReservaRow = {
  id: number;
  cancha_id: number;
  deporte: "tenis" | "padel" | "futbol";
  fecha: string;
  hora_inicio: string;
  duracion_minutos: number;
  estado: "pendiente" | "confirmada";
  tipo: "alquiler" | "clase";
  canchas: { nombre: string } | Array<{ nombre: string }> | null;
};

function getEstadoBadgeStyle(estado: "pendiente" | "confirmada") {
  if (estado === "confirmada") {
    return {
      background: "var(--success-bg)",
      color: "var(--success)",
    };
  }

  return {
    background: "var(--warning-bg)",
    color: "var(--warning)",
  };
}

function getDeporteLabel(deporte: "tenis" | "padel" | "futbol") {
  if (deporte === "tenis") return "Tenis";
  if (deporte === "padel") return "Padel";
  return "Futbol";
}

function getCanchaNombre(canchas: { nombre: string } | Array<{ nombre: string }> | null, canchaId: number) {
  if (!canchas) {
    return `Cancha ${canchaId}`;
  }

  if (Array.isArray(canchas)) {
    return canchas[0]?.nombre ?? `Cancha ${canchaId}`;
  }

  return canchas.nombre;
}

function formatFechaHeader(dateIso: string) {
  const date = new Date(`${dateIso}T12:00:00.000Z`);
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(date);
}

function formatFechaCompacta(dateIso: string) {
  const date = new Date(`${dateIso}T12:00:00.000Z`);
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export default async function ClubDashboardPage() {
  const club = await requireClub();
  const supabase = await createSupabaseServerClient();
  const hoy = new Date().toISOString().slice(0, 10);

  const [reservasHoyResult, proximasResult, canchasResult] = await Promise.all([
    supabase
      .from("reservas_cancha")
      .select("id, cancha_id, deporte, hora_inicio, duracion_minutos, estado, tipo, canchas(nombre)")
      .eq("club_id", club.id)
      .eq("fecha", hoy)
      .in("estado", ["pendiente", "confirmada"])
      .order("hora_inicio", { ascending: true }),
    supabase
      .from("reservas_cancha")
      .select("id, cancha_id, deporte, fecha, hora_inicio, duracion_minutos, estado, tipo, canchas(nombre)")
      .eq("club_id", club.id)
      .gt("fecha", hoy)
      .in("estado", ["pendiente", "confirmada"])
      .order("fecha", { ascending: true })
      .order("hora_inicio", { ascending: true })
      .limit(5),
    supabase.from("canchas").select("id, nombre, deporte").eq("club_id", club.id).eq("activa", true),
  ]);

  const reservasHoy = (reservasHoyResult.data ?? []) as ReservaHoyRow[];
  const proximasReservas = (proximasResult.data ?? []) as ProximaReservaRow[];
  const canchasActivasCount = canchasResult.data?.length ?? 0;
  const hasError = Boolean(reservasHoyResult.error || proximasResult.error || canchasResult.error);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      <header className="card p-5">
        <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--foreground)" }}>
          Hola, {club.nombre}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          {formatFechaHeader(hoy)}
        </p>
      </header>

      {hasError ? (
        <section className="card p-5">
          <p className="text-sm" style={{ color: "var(--warning)" }}>
            No se pudo cargar el resumen operativo.
          </p>
        </section>
      ) : (
        <>
          <section className="card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                Hoy
              </h2>
              <span className="text-sm" style={{ color: "var(--muted)" }}>
                {reservasHoy.length} reservas
              </span>
            </div>

            {reservasHoy.length === 0 ? (
              <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
                Sin reservas para hoy.
              </p>
            ) : (
              <div className="mt-3 grid gap-2">
                {reservasHoy.map((reserva) => (
                  <div
                    key={reserva.id}
                    className="rounded-xl border px-3 py-2"
                    style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                        {reserva.hora_inicio.slice(0, 5)} · {getCanchaNombre(reserva.canchas, reserva.cancha_id)} ·{" "}
                        {getDeporteLabel(reserva.deporte)}
                      </p>
                      <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={getEstadoBadgeStyle(reserva.estado)}>
                        {reserva.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {proximasReservas.length > 0 ? (
            <section className="card p-5">
              <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                Próximas reservas
              </h2>
              <div className="mt-3 grid gap-2">
                {proximasReservas.map((reserva) => (
                  <div
                    key={reserva.id}
                    className="rounded-xl border px-3 py-2"
                    style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm" style={{ color: "var(--foreground)" }}>
                        {formatFechaCompacta(reserva.fecha)} · {reserva.hora_inicio.slice(0, 5)} ·{" "}
                        {getCanchaNombre(reserva.canchas, reserva.cancha_id)} · {getDeporteLabel(reserva.deporte)}
                      </p>
                      <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={getEstadoBadgeStyle(reserva.estado)}>
                        {reserva.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="card p-5">
            <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
              Accesos rápidos
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              {canchasActivasCount} canchas activas
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Link
                href="/dashboard/club/calendario"
                className="rounded-xl border p-4 transition-opacity hover:opacity-90"
                style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
              >
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  Calendario
                </p>
              </Link>

              <Link
                href="/dashboard/club/ajustes"
                className="rounded-xl border p-4 transition-opacity hover:opacity-90"
                style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
              >
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  Ajustes
                </p>
              </Link>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
