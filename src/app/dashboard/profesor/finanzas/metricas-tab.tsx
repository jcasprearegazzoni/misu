import { formatAmount } from "@/lib/finanzas/date-helpers";

type MetricasTabProps = {
  clasesEsteMes: number;
  alumnosActivosEsteMes: number;
  alumnosActivosMesAnterior: number;
  ticketPromedio: number;
  tasaRetencion: number;
  alumnosNuevos: number;
  revenueUltimos6Meses: Array<{ mes: string; total: number }>;
  clasesPorTipo: { individual: number; dobles: number; trio: number; grupal: number };
  topAlumnos: Array<{ alumno_id: string; nombre: string; total: number; pagos: number }>;
  heatmap: Record<number, Record<number, number>>;
};

// Días de la semana ordenados lunes→domingo
const DAY_COLUMNS = [
  { key: 1, label: "Lun" },
  { key: 2, label: "Mar" },
  { key: 3, label: "Mié" },
  { key: 4, label: "Jue" },
  { key: 5, label: "Vie" },
  { key: 6, label: "Sáb" },
  { key: 0, label: "Dom" },
] as const;

// Franjas horarias del día
const TIME_SLOTS = [
  { start: 6, end: 8, label: "6–8" },
  { start: 8, end: 10, label: "8–10" },
  { start: 10, end: 12, label: "10–12" },
  { start: 12, end: 14, label: "12–14" },
  { start: 14, end: 16, label: "14–16" },
  { start: 16, end: 18, label: "16–18" },
  { start: 18, end: 20, label: "18–20" },
  { start: 20, end: 22, label: "20–22" },
] as const;

// Altura máxima de barra en píxeles para el gráfico
const BAR_MAX_PX = 88;

function retencionColor(tasa: number): string {
  if (tasa >= 70) return "var(--success)";
  if (tasa >= 40) return "var(--warning)";
  return "var(--error)";
}

function retencionIcon(tasa: number): string {
  if (tasa >= 70) return "↑";
  if (tasa >= 40) return "→";
  return "↓";
}

export function ProfesorMetricas({
  clasesEsteMes,
  alumnosActivosEsteMes,
  alumnosActivosMesAnterior,
  ticketPromedio,
  tasaRetencion,
  alumnosNuevos,
  revenueUltimos6Meses,
  clasesPorTipo,
  topAlumnos,
  heatmap,
}: MetricasTabProps) {
  // Cálculo de barras con altura en píxeles (evita el bug de height:% en flexbox)
  const maxTotal = Math.max(...revenueUltimos6Meses.map((i) => i.total), 0);
  const bars = revenueUltimos6Meses.map((item, idx) => ({
    ...item,
    barPx:
      maxTotal > 0
        ? Math.max(Math.round((item.total / maxTotal) * BAR_MAX_PX), item.total > 0 ? 3 : 0)
        : 0,
    isActual: idx === revenueUltimos6Meses.length - 1,
  }));

  // Totales para distribución por tipo
  const totalClasesTipo =
    clasesPorTipo.individual + clasesPorTipo.dobles + clasesPorTipo.trio + clasesPorTipo.grupal;

  const tipos = [
    { key: "individual" as const, label: "Individual", count: clasesPorTipo.individual },
    { key: "dobles" as const, label: "Dobles", count: clasesPorTipo.dobles },
    { key: "trio" as const, label: "Trío", count: clasesPorTipo.trio },
    { key: "grupal" as const, label: "Grupal", count: clasesPorTipo.grupal },
  ];

  // Valor máximo del heatmap para normalizar opacidades
  const heatmapMax = Math.max(
    ...Object.values(heatmap).flatMap((hours) => Object.values(hours)),
    1,
  );

  return (
    <div className="mt-6 space-y-4">
      {/* ── KPIs ─────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--foreground)" }}>
          Este mes
        </h2>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {/* Clases */}
          <article className="card px-4 py-4">
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              Clases confirmadas
            </p>
            <p className="mt-2 text-3xl font-black leading-none" style={{ color: "var(--foreground)" }}>
              {clasesEsteMes}
            </p>
          </article>

          {/* Alumnos activos */}
          <article className="card px-4 py-4">
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              Alumnos activos
            </p>
            <p className="mt-2 text-3xl font-black leading-none" style={{ color: "var(--foreground)" }}>
              {alumnosActivosEsteMes}
            </p>
            {alumnosNuevos > 0 && (
              <p className="mt-1 text-xs" style={{ color: "var(--success)" }}>
                +{alumnosNuevos} nuevos
              </p>
            )}
          </article>

          {/* Ticket promedio */}
          <article className="card px-4 py-4">
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              Ticket promedio
            </p>
            <p className="mt-2 text-2xl font-black leading-none" style={{ color: "var(--foreground)" }}>
              {ticketPromedio > 0 ? formatAmount(ticketPromedio) : "—"}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
              por alumno este mes
            </p>
          </article>

          {/* Retención */}
          <article className="card px-4 py-4">
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              Retención mensual
            </p>
            <p
              className="mt-2 text-3xl font-black leading-none"
              style={{ color: retencionColor(tasaRetencion) }}
            >
              {retencionIcon(tasaRetencion)} {alumnosActivosMesAnterior > 0 ? `${tasaRetencion}%` : "—"}
            </p>
            {alumnosActivosMesAnterior > 0 && (
              <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                de {alumnosActivosMesAnterior} del mes anterior
              </p>
            )}
          </article>
        </div>
      </section>

      {/* ── GRÁFICO DE INGRESOS ───────────────────────────────── */}
      <section className="card p-4">
        <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
          Ingresos últimos 6 meses
        </h2>

        {maxTotal === 0 ? (
          <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
            Sin datos de ingresos aún.
          </p>
        ) : (
          <div className="mt-5">
            {/* Barras — items-end alinea los bottoms al mismo baseline */}
            <div className="flex items-end gap-1.5" style={{ height: `${BAR_MAX_PX}px` }}>
              {bars.map((item) => (
                <div key={item.mes} className="flex-1 min-w-0">
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${item.barPx}px`,
                      background: "var(--misu)",
                      opacity: item.isActual ? 1 : 0.45,
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Línea base */}
            <div className="h-px w-full" style={{ background: "var(--border)" }} />

            {/* Labels del mes */}
            <div className="mt-1.5 flex gap-1.5">
              {bars.map((item) => (
                <div key={item.mes} className="flex-1 min-w-0 text-center">
                  <span
                    style={{
                      color: item.isActual ? "var(--foreground)" : "var(--muted)",
                      fontSize: "10px",
                      fontWeight: item.isActual ? 600 : 400,
                    }}
                  >
                    {item.mes}
                  </span>
                </div>
              ))}
            </div>

            {/* Totales debajo del label (solo el más alto y el actual) */}
            <div className="mt-3 flex gap-1.5">
              {bars.map((item) => (
                <div key={`amt-${item.mes}`} className="flex-1 min-w-0 text-center">
                  {item.isActual && item.total > 0 ? (
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "var(--foreground)", fontSize: "10px" }}
                    >
                      {formatAmount(item.total)}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── DISTRIBUCIÓN POR TIPO ─────────────────────────────── */}
      <section className="card p-4">
        <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
          Distribución por tipo de clase
        </h2>
        <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
          Clases confirmadas este mes
        </p>

        {totalClasesTipo === 0 ? (
          <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
            Sin clases confirmadas este mes.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {tipos.map((tipo) => {
              const pct = Math.round((tipo.count / totalClasesTipo) * 100);
              return (
                <div key={tipo.key}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span style={{ color: "var(--foreground)" }}>
                      {tipo.label}
                    </span>
                    <span className="tabular-nums" style={{ color: "var(--muted)" }}>
                      {tipo.count} · {pct}%
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-1.5 w-full rounded-full overflow-hidden"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: "var(--misu)" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── TOP ALUMNOS ──────────────────────────────────────── */}
      <section className="card overflow-hidden">
        <div className="px-4 py-3">
          <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
            Top alumnos por ingresos
          </h2>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Últimos 6 meses
          </p>
        </div>

        {topAlumnos.length === 0 ? (
          <p className="px-4 pb-4 text-sm" style={{ color: "var(--muted)" }}>
            Sin pagos registrados aún.
          </p>
        ) : (
          <table className="table-dark">
            <thead>
              <tr>
                <th>#</th>
                <th>Alumno</th>
                <th>Pagos</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {topAlumnos.map((alumno, idx) => (
                <tr key={alumno.alumno_id}>
                  <td className="tabular-nums" style={{ color: "var(--muted)" }}>
                    {idx + 1}
                  </td>
                  <td className="font-medium">{alumno.nombre}</td>
                  <td className="tabular-nums" style={{ color: "var(--muted)" }}>
                    {alumno.pagos}
                  </td>
                  <td className="font-semibold tabular-nums">{formatAmount(alumno.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ── HEATMAP ──────────────────────────────────────────── */}
      <section className="card p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
              Horarios más activos
            </h2>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Clases confirmadas en los últimos 3 meses
            </p>
          </div>
          {/* Leyenda */}
          <div className="flex shrink-0 items-center gap-1.5">
            <span style={{ color: "var(--muted)", fontSize: "10px" }}>Menos</span>
            {[0.1, 0.3, 0.55, 0.8, 1].map((op) => (
              <div
                key={op}
                className="h-3 w-3 rounded-sm"
                style={{ background: "var(--misu)", opacity: op }}
              />
            ))}
            <span style={{ color: "var(--muted)", fontSize: "10px" }}>Más</span>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div
            className="grid gap-1"
            style={{
              minWidth: "480px",
              gridTemplateColumns: "52px repeat(7, minmax(0, 1fr))",
            }}
          >
            {/* Header de días */}
            <div />
            {DAY_COLUMNS.map((day) => (
              <div
                key={day.key}
                className="py-0.5 text-center text-xs font-medium"
                style={{ color: "var(--muted)" }}
              >
                {day.label}
              </div>
            ))}

            {/* Filas por franja horaria */}
            {TIME_SLOTS.map((slot) => (
              <div key={slot.label} className="contents">
                {/* Label de horario */}
                <div
                  className="flex items-center text-xs"
                  style={{ color: "var(--muted)", fontSize: "10px" }}
                >
                  {slot.label}
                </div>

                {/* Celdas */}
                {DAY_COLUMNS.map((day) => {
                  // Sumar clases en cada hora de la franja
                  const count = Array.from(
                    { length: slot.end - slot.start },
                    (_, i) => heatmap[day.key]?.[slot.start + i] ?? 0,
                  ).reduce((acc, v) => acc + v, 0);

                  const opacity = count > 0 ? Math.max(0.15, Math.min(1, count / heatmapMax)) : 0;

                  return (
                    <div
                      key={`${slot.label}-${day.key}`}
                      className="h-7 rounded"
                      style={{
                        background: count > 0 ? "var(--misu)" : "var(--surface-2)",
                        opacity: count > 0 ? opacity : 1,
                        border: "1px solid var(--border)",
                      }}
                      title={count > 0 ? `${count} clase${count > 1 ? "s" : ""}` : undefined}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
