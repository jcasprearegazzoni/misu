import { requireClub } from "@/lib/auth/require-club";
import { getMonthRange } from "@/lib/finanzas/date-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ReservaCanchaRow = {
  id: number;
  cancha_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_minutos: number;
};

type CanchaRow = {
  id: number;
  nombre: string;
};

const dayColumns = [
  { key: 1, label: "Lun" },
  { key: 2, label: "Mar" },
  { key: 3, label: "Mie" },
  { key: 4, label: "Jue" },
  { key: 5, label: "Vie" },
  { key: 6, label: "Sab" },
  { key: 0, label: "Dom" },
] as const;

const timeSlots = [
  { start: 6, end: 8, label: "6-8" },
  { start: 8, end: 10, label: "8-10" },
  { start: 10, end: 12, label: "10-12" },
  { start: 12, end: 14, label: "12-14" },
  { start: 14, end: 16, label: "14-16" },
  { start: 16, end: 18, label: "16-18" },
  { start: 18, end: 20, label: "18-20" },
  { start: 20, end: 22, label: "20-22" },
] as const;

function getDaysInRange(startIso: string, endIso: string) {
  const startDate = new Date(startIso);
  const endDate = new Date(endIso);
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

function sumReservedHours(reservas: ReservaCanchaRow[]) {
  return reservas.reduce((acc, reserva) => acc + Number(reserva.duracion_minutos ?? 0) / 60, 0);
}

function buildHeatmap(reservas: ReservaCanchaRow[]) {
  const heatmap: Record<number, Record<number, number>> = {};

  for (const reserva of reservas) {
    const dayOfWeek = new Date(`${reserva.fecha}T12:00:00Z`).getUTCDay();
    const hour = Number.parseInt(reserva.hora_inicio.split(":")[0] ?? "", 10);

    if (Number.isNaN(hour) || hour < 6 || hour > 22) {
      continue;
    }

    if (!heatmap[dayOfWeek]) {
      heatmap[dayOfWeek] = {};
    }

    heatmap[dayOfWeek][hour] = (heatmap[dayOfWeek][hour] ?? 0) + 1;
  }

  return heatmap;
}

export default async function ClubFinanzasPage() {
  const club = await requireClub();
  const supabase = await createSupabaseServerClient();

  const currentMonth = getMonthRange(0);
  const previousMonth = getMonthRange(-1);
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  const [reservasMesActualResult, reservasMesAnteriorResult, canchasResult, heatmapReservasResult] =
    await Promise.all([
      supabase
        .from("reservas_cancha")
        .select("id, cancha_id, fecha, hora_inicio, hora_fin, duracion_minutos")
        .eq("club_id", club.id)
        .eq("estado", "confirmada")
        .gte("fecha", currentMonth.startIso.slice(0, 10))
        .lt("fecha", currentMonth.endIso.slice(0, 10)),
      supabase
        .from("reservas_cancha")
        .select("id, cancha_id, fecha, hora_inicio, hora_fin, duracion_minutos")
        .eq("club_id", club.id)
        .eq("estado", "confirmada")
        .gte("fecha", previousMonth.startIso.slice(0, 10))
        .lt("fecha", previousMonth.endIso.slice(0, 10)),
      supabase.from("canchas").select("id, nombre").eq("club_id", club.id).eq("activa", true),
      supabase
        .from("reservas_cancha")
        .select("id, cancha_id, fecha, hora_inicio, hora_fin, duracion_minutos")
        .eq("club_id", club.id)
        .eq("estado", "confirmada")
        .gte("fecha", threeMonthsAgo.toISOString().slice(0, 10))
        .lt("fecha", currentMonth.endIso.slice(0, 10)),
    ]);

  const hasLoadError = Boolean(
    reservasMesActualResult.error ||
      reservasMesAnteriorResult.error ||
      canchasResult.error ||
      heatmapReservasResult.error,
  );

  const reservasMesActual = (reservasMesActualResult.data ?? []) as ReservaCanchaRow[];
  const reservasMesAnterior = (reservasMesAnteriorResult.data ?? []) as ReservaCanchaRow[];
  const canchasActivas = (canchasResult.data ?? []) as CanchaRow[];
  const heatmapReservas = (heatmapReservasResult.data ?? []) as ReservaCanchaRow[];

  const diasMesActual = getDaysInRange(currentMonth.startIso, currentMonth.endIso);
  const diasMesAnterior = getDaysInRange(previousMonth.startIso, previousMonth.endIso);

  const slotsDisponiblesMesActual = 8 * diasMesActual;
  const slotsDisponiblesMesAnterior = 8 * diasMesAnterior;

  const ocupacionPorCancha = canchasActivas.map((cancha) => {
    const reservasCancha = reservasMesActual.filter((reserva) => reserva.cancha_id === cancha.id);
    const horasReservadas = sumReservedHours(reservasCancha);
    const ocupacionPct =
      slotsDisponiblesMesActual > 0 ? Math.min(100, (horasReservadas / slotsDisponiblesMesActual) * 100) : 0;

    return {
      canchaId: cancha.id,
      canchaNombre: cancha.nombre,
      horasReservadas,
      ocupacionPct,
    };
  });

  const ocupacionPromedioActual =
    ocupacionPorCancha.length > 0
      ? ocupacionPorCancha.reduce((acc, item) => acc + item.ocupacionPct, 0) / ocupacionPorCancha.length
      : 0;

  const ocupacionPromedioAnteriorPorCancha = canchasActivas.map((cancha) => {
    const reservasCancha = reservasMesAnterior.filter((reserva) => reserva.cancha_id === cancha.id);
    const horasReservadas = sumReservedHours(reservasCancha);
    return slotsDisponiblesMesAnterior > 0 ? Math.min(100, (horasReservadas / slotsDisponiblesMesAnterior) * 100) : 0;
  });

  const ocupacionPromedioAnterior =
    ocupacionPromedioAnteriorPorCancha.length > 0
      ? ocupacionPromedioAnteriorPorCancha.reduce((acc, item) => acc + item, 0) /
        ocupacionPromedioAnteriorPorCancha.length
      : 0;

  const deltaReservas = reservasMesActual.length - reservasMesAnterior.length;
  const horasReservadasMesActual = sumReservedHours(reservasMesActual);
  const horasReservadasMesAnterior = sumReservedHours(reservasMesAnterior);

  const heatmap = buildHeatmap(heatmapReservas);
  const heatmapValues = Object.values(heatmap).flatMap((hours) => Object.values(hours));
  const maxCount = Math.max(...heatmapValues, 1);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--foreground)" }}>
          Finanzas
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
          Seguimiento de reservas, ocupacion y rendimiento mensual.
        </p>
      </header>

      {hasLoadError ? (
        <div className="alert-error">No se pudieron cargar los datos financieros. Intenta nuevamente.</div>
      ) : null}

      <section>
        <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
          <article className="card px-4 py-4">
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              Reservas este mes
            </p>
            <p className="mt-2 text-2xl font-black leading-none" style={{ color: "var(--foreground)" }}>
              {reservasMesActual.length}
            </p>
          </article>
          <article className="card px-4 py-4">
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              vs mes anterior
            </p>
            <p
              className="mt-2 text-2xl font-black leading-none"
              style={{
                color: deltaReservas > 0 ? "var(--success)" : deltaReservas < 0 ? "var(--error)" : "var(--foreground)",
              }}
            >
              {deltaReservas > 0 ? "+" : ""}
              {deltaReservas}
            </p>
          </article>
          <article className="card px-4 py-4">
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              Canchas activas
            </p>
            <p className="mt-2 text-2xl font-black leading-none" style={{ color: "var(--foreground)" }}>
              {canchasActivas.length}
            </p>
          </article>
          <article className="card px-4 py-4">
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              Ocupacion promedio
            </p>
            <p className="mt-2 text-2xl font-black leading-none" style={{ color: "var(--foreground)" }}>
              {Math.round(ocupacionPromedioActual)}%
            </p>
          </article>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
          Ocupacion por cancha
        </h2>
        {canchasActivas.length === 0 ? (
          <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
            No hay canchas activas para mostrar.
          </p>
        ) : ocupacionPorCancha.length === 0 ? (
          <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
            Sin reservas confirmadas este mes.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {ocupacionPorCancha.map((item) => (
              <div key={item.canchaId}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span style={{ color: "var(--foreground)" }}>{item.canchaNombre}</span>
                  <span style={{ color: "var(--muted)" }}>{Math.round(item.ocupacionPct)}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full" style={{ background: "var(--surface-2)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.ocupacionPct}%`, background: "var(--misu)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card p-4">
        <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
          Franjas horarias mas reservadas (ultimos 3 meses)
        </h2>
        <div className="mt-4 overflow-x-auto">
          <div className="grid min-w-[640px] grid-cols-[70px_repeat(7,minmax(0,1fr))] gap-2">
            <div />
            {dayColumns.map((day) => (
              <div key={day.key} className="text-center text-xs" style={{ color: "var(--muted)" }}>
                {day.label}
              </div>
            ))}

            {timeSlots.map((slot) => (
              <div key={slot.label} className="contents">
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  {slot.label}
                </div>
                {dayColumns.map((day) => {
                  const slotCount = Array.from({ length: slot.end - slot.start }, (_, index) => {
                    const hour = slot.start + index;
                    return heatmap[day.key]?.[hour] ?? 0;
                  }).reduce((acc, value) => acc + value, 0);

                  if (slotCount === 0) {
                    return (
                      <div
                        key={`${slot.label}-${day.key}`}
                        className="h-8 rounded border"
                        style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                      />
                    );
                  }

                  const opacity = Math.max(0.15, Math.min(1, slotCount / maxCount));

                  return (
                    <div
                      key={`${slot.label}-${day.key}`}
                      className="h-8 rounded border"
                      style={{
                        background: "var(--misu)",
                        opacity,
                        borderColor: "var(--border)",
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="px-4 py-3">
          <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
            Comparativa mes actual vs anterior
          </h2>
        </div>
        <table className="table-dark">
          <thead>
            <tr>
              <th>Metrica</th>
              <th>Mes actual</th>
              <th>Mes anterior</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total reservas</td>
              <td>{reservasMesActual.length}</td>
              <td>{reservasMesAnterior.length}</td>
            </tr>
            <tr>
              <td>Horas reservadas</td>
              <td>{horasReservadasMesActual.toFixed(1)} h</td>
              <td>{horasReservadasMesAnterior.toFixed(1)} h</td>
            </tr>
            <tr>
              <td>Ocupacion promedio</td>
              <td>{Math.round(ocupacionPromedioActual)}%</td>
              <td>{Math.round(ocupacionPromedioAnterior)}%</td>
            </tr>
          </tbody>
        </table>
      </section>

    </main>
  );
}
