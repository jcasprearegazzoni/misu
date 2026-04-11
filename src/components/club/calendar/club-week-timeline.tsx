"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CLUB_START_HOUR,
  PIXELS_PER_MINUTE,
  formatHourLabel,
  getClubHourTicks,
  getClubTimelineHeight,
} from "./club-time-utils";

type Deporte = "tenis" | "padel" | "futbol";
type CalendarView = "week" | "day";

type CalendarEvent = {
  id: number;
  canchaId: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  canchaNombre: string;
  deporte: Deporte;
  duracionMinutos: number;
  estado: "pendiente" | "confirmada" | "cancelada";
  tipo: "alquiler" | "clase";
  profesorNombre: string | null;
  organizadorNombre: string | null;
  organizadorEmail: string | null;
  organizadorTelefono: string | null;
};

type CalendarCourt = {
  id: number;
  nombre: string;
};

type ClubWeekTimelineProps = {
  events: CalendarEvent[];
  days: string[];
  view: CalendarView;
  deporte: Deporte;
  deportesVisibles: Deporte[];
  fecha: string;
  canchas: CalendarCourt[];
  onGoTo: (next: { deporte?: Deporte; fecha?: string; view?: CalendarView }) => void;
};

// Unidad visual: eventos con el mismo slot exacto agrupados, con carril asignado
type SlotUnit = {
  key: string;
  events: CalendarEvent[];
  startMin: number;
  endMin: number;
  top: number;
  height: number;
  laneIndex: number; // carril horizontal (para unidades que se solapan)
  laneCount: number; // total de carriles simultáneos
};

// ---------- helpers ----------

function startOfWeekIso(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  const day = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() + (day === 0 ? -6 : 1 - day));
  return date.toISOString().slice(0, 10);
}

function addDaysIso(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getTodayIsoArg() {
  const formatter = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((p) => p.type === "year")?.value ?? "0000";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function formatMonthLabel(dateIso: string) {
  const date = new Date(`${dateIso}T00:00:00-03:00`);
  const label = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatDayChip(dateIso: string) {
  const date = new Date(`${dateIso}T00:00:00-03:00`);
  const weekday = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    timeZone: "America/Argentina/Buenos_Aires",
  })
    .format(date);
  const day = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
  return { weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1), day };
}

function getDeporteLabel(value: Deporte) {
  if (value === "tenis") return "Tenis";
  if (value === "padel") return "Padel";
  return "Futbol";
}

function parseTimeToMinutes(value: string) {
  const [h = "0", m = "0"] = value.slice(0, 5).split(":");
  return Number(h) * 60 + Number(m);
}

function buildUnitSelectionKey(dayIso: string, unitKey: string) {
  return `${dayIso}__${unitKey}`;
}

// Agrupa eventos con el mismo slot exacto (inicio + fin) en unidades,
// luego asigna carriles (lanes) a las unidades que se solapan en tiempo.
// Resultado: mismo slot → un solo bloque; slots distintos solapados → lado a lado.
function computeSlotUnits(events: CalendarEvent[]): SlotUnit[] {
  if (events.length === 0) return [];

  // Paso 1: agrupar por slot exacto
  const bySlot = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = `${event.horaInicio.slice(0, 5)}|${event.horaFin.slice(0, 5)}`;
    const existing = bySlot.get(key) ?? [];
    existing.push(event);
    bySlot.set(key, existing);
  }

  // Paso 2: crear unidades ordenadas por inicio
  const units: SlotUnit[] = Array.from(bySlot.entries())
    .map(([key, slotEvents]) => {
      const startMin = parseTimeToMinutes(slotEvents[0]!.horaInicio);
      const endMin = startMin + slotEvents[0]!.duracionMinutos;
      return {
        key,
        events: slotEvents,
        startMin,
        endMin,
        top: (startMin - CLUB_START_HOUR * 60) * PIXELS_PER_MINUTE,
        height: Math.max((endMin - startMin) * PIXELS_PER_MINUTE, 24),
        laneIndex: 0,
        laneCount: 1,
      };
    })
    .sort((a, b) => a.startMin - b.startMin);

  // Paso 3: asignar carril libre a cada unidad
  const laneEnds: number[] = [];
  for (const unit of units) {
    let lane = laneEnds.findIndex((end) => end <= unit.startMin);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = unit.endMin;
    unit.laneIndex = lane;
  }

  // Paso 4: calcular total de carriles simultáneos por unidad
  for (const unit of units) {
    const maxLane = units
      .filter((other) => other.startMin < unit.endMin && unit.startMin < other.endMin)
      .reduce((max, other) => Math.max(max, other.laneIndex), 0);
    unit.laneCount = maxLane + 1;
  }

  return units;
}

// Color según el mix de tipos de la unidad
function getUnitAccent(events: CalendarEvent[]) {
  const isAllCanceled = events.every((e) => e.estado === "cancelada");
  if (isAllCanceled) return "var(--error)";
  const hasAlquiler = events.some((e) => e.tipo === "alquiler");
  const hasClase = events.some((e) => e.tipo === "clase");
  if (hasAlquiler && hasClase) return "#a78bfa";
  if (hasClase) return "#fdba74";
  return "#93c5fd";
}

// ---------- UI components ----------

function EstadoBadge({ estado }: { estado: CalendarEvent["estado"] }) {
  const style =
    estado === "confirmada"
      ? { background: "var(--success-bg)", color: "var(--success)" }
      : estado === "pendiente"
        ? { background: "var(--warning-bg)", color: "var(--warning)" }
        : { background: "var(--error-bg)", color: "var(--error)" };
  return (
    <span className="rounded-full px-2 py-0.5 text-[15px] font-semibold capitalize leading-tight" style={style}>
      {estado}
    </span>
  );
}

function TipoBadge({ tipo }: { tipo: CalendarEvent["tipo"] }) {
  const style =
    tipo === "alquiler"
      ? { background: "rgba(59,130,246,.16)", color: "#93c5fd" }
      : { background: "rgba(249,115,22,.16)", color: "#fdba74" };
  return (
    <span className="rounded-full px-2 py-0.5 text-[15px] font-semibold leading-tight" style={style}>
      {tipo === "alquiler" ? "Alquiler" : "Clase"}
    </span>
  );
}

// Bloque visual de una SlotUnit en la timeline (con posición por carril)
function SlotUnitCard({
  unit,
  isSelected,
  onClick,
}: {
  unit: SlotUnit;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { events, top, height, laneIndex, laneCount } = unit;
  const accent = getUnitAccent(events);
  const isSingle = events.length === 1;
  const singleEvent = isSingle ? events[0]! : null;

  const bgMix = isSelected ? 28 : 14;
  const bg = `color-mix(in srgb, ${accent} ${bgMix}%, var(--surface-1))`;
  const leftPct = (laneIndex / laneCount) * 100;
  const widthPct = (1 / laneCount) * 100;

  const startLabel = events[0]!.horaInicio.slice(0, 5);
  const endLabel = events[0]!.horaFin.slice(0, 5);
  const activeCount = events.filter((e) => e.estado !== "cancelada").length;

  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute z-10 overflow-hidden rounded border-l-[3px] text-left transition-all"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left: `calc(${leftPct}% + 1px)`,
        width: `calc(${widthPct}% - 3px)`,
        padding: "3px 4px 3px 6px",
        background: bg,
        borderColor: accent,
        boxShadow: isSelected ? `0 0 0 1.5px ${accent}` : undefined,
      }}
    >
      <p className="truncate font-bold leading-tight" style={{ fontSize: "11px", color: accent }}>
        {startLabel}
        {height >= 30 && ` – ${endLabel}`}
      </p>

      {isSingle && singleEvent ? (
        <>
          {height >= 44 && (singleEvent.profesorNombre ?? singleEvent.organizadorNombre) && (
            <p
              className="truncate font-semibold leading-tight"
              style={{ fontSize: "14px", color: "var(--foreground)", marginTop: "1px" }}
            >
              {singleEvent.tipo === "clase"
                ? singleEvent.profesorNombre
                : singleEvent.organizadorNombre}
            </p>
          )}
          {height >= 62 && (
            <p
              className="truncate text-[11px] leading-tight sm:text-[10px]"
              style={{ color: "var(--muted)", marginTop: "1px" }}
            >
              {singleEvent.canchaNombre}
            </p>
          )}
        </>
      ) : (
        <>
          {height >= 38 && (
            <p
              className="truncate font-semibold leading-tight"
              style={{ fontSize: "14px", color: "var(--foreground)", marginTop: "1px" }}
            >
              {activeCount} activas
            </p>
          )}
        </>
      )}
    </button>
  );
}

// Panel lateral con el detalle de todos los eventos de la unidad
function SlotUnitDetailContent({
  unit,
  pendingAction,
  actionError,
  onChangeEstado,
}: {
  unit: SlotUnit;
  pendingAction: { reservaId: number; estado: "confirmada" | "cancelada" } | null;
  actionError: string | null;
  onChangeEstado: (reservaId: number, estado: "confirmada" | "cancelada") => Promise<void>;
}) {
  const { events } = unit;

  // Agrupa por cancha para mejor lectura
  const byCourt = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const existing = byCourt.get(event.canchaNombre) ?? [];
    existing.push(event);
    byCourt.set(event.canchaNombre, existing);
  }

  const startLabel = events[0]!.horaInicio.slice(0, 5);
  const endLabel = events[0]!.horaFin.slice(0, 5);

  return (
    <div className="grid gap-3">
      {/* Resumen */}
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          {startLabel} – {endLabel}
        </p>
        <p className="mt-0.5 text-[15px]" style={{ color: "var(--muted)" }}>
          {events.length === 1
            ? "1 reserva en este horario"
            : `${events.length} reservas en este horario`}
        </p>
      </div>

      {actionError ? (
        <div
          className="rounded-lg border px-3 py-2 text-[15px]"
          style={{
            borderColor: "var(--error-border)",
            background: "var(--error-bg)",
            color: "var(--error)",
          }}
        >
          {actionError}
        </div>
      ) : null}

      {/* Canchas con sus reservas */}
      <div className="grid gap-2">
        {Array.from(byCourt.entries()).map(([canchaNombre, courtEvents]) => (
          <div
            key={canchaNombre}
            className="rounded-lg border p-3"
            style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
          >
            <p className="mb-2 text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>
              {canchaNombre}
            </p>

            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {courtEvents.map((event) => {
                const isClase = event.tipo === "clase";
                const displayName = isClase ? event.profesorNombre : event.organizadorNombre;

                return (
                  <div
                    key={event.id}
                    className="py-2 first:pt-0 last:pb-0"
                  >
                    {/* Badges + horario */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <EstadoBadge estado={event.estado} />
                      <TipoBadge tipo={event.tipo} />
                      <span className="text-[15px]" style={{ color: "var(--muted)" }}>
                        {event.horaInicio.slice(0, 5)} – {event.horaFin.slice(0, 5)}
                      </span>
                    </div>

                    {/* Nombre */}
                    <div className="mt-1.5 grid gap-0.5 text-[15px]" style={{ color: "var(--muted)" }}>
                      <p>
                        {isClase ? "Profesor" : "Organizador"}:{" "}
                        <span style={{ color: "var(--foreground)" }}>
                          {displayName ?? "Sin datos"}
                        </span>
                      </p>
                      {!isClase && event.organizadorEmail ? (
                        <p>
                          Email:{" "}
                          <span style={{ color: "var(--foreground)" }}>
                            {event.organizadorEmail}
                          </span>
                        </p>
                      ) : null}
                      {!isClase && event.organizadorTelefono ? (
                        <p>
                          Teléfono:{" "}
                          <span style={{ color: "var(--foreground)" }}>
                            {event.organizadorTelefono}
                          </span>
                        </p>
                      ) : null}
                      {isClase ? (
                        <p className="mt-0.5" style={{ color: "var(--muted)", opacity: 0.7 }}>
                          Solo lectura para el club.
                        </p>
                      ) : null}
                    </div>

                    {/* Acciones para alquileres */}
                    {event.tipo === "alquiler" &&
                    (event.estado === "pendiente" || event.estado === "confirmada") ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {event.estado === "pendiente" ? (
                          <button
                            type="button"
                            className="btn-primary text-[15px]"
                            onClick={() => onChangeEstado(event.id, "confirmada")}
                            disabled={
                              pendingAction?.reservaId === event.id &&
                              pendingAction?.estado === "confirmada"
                            }
                          >
                            {pendingAction?.reservaId === event.id &&
                            pendingAction?.estado === "confirmada"
                              ? "Confirmando..."
                              : "Confirmar"}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="btn-ghost text-[15px]"
                          style={{ color: "var(--error)" }}
                          onClick={() => {
                            // Confirmación explícita para evitar cancelaciones accidentales.
                            if (!window.confirm("¿Seguro que querés cancelar esta reserva?")) {
                              return;
                            }
                            onChangeEstado(event.id, "cancelada");
                          }}
                          disabled={
                            pendingAction?.reservaId === event.id &&
                            pendingAction?.estado === "cancelada"
                          }
                        >
                          {pendingAction?.reservaId === event.id &&
                          pendingAction?.estado === "cancelada"
                            ? "Cancelando..."
                            : "Cancelar"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Componente principal ----------

export function ClubWeekTimeline({
  events,
  days,
  view,
  deporte,
  deportesVisibles,
  fecha,
  canchas: _canchas,
  onGoTo,
}: ClubWeekTimelineProps) {
  const router = useRouter();
  const hourTicks = getClubHourTicks();
  const timelineHeight = getClubTimelineHeight();
  const navControlClass =
    "btn-ghost text-sm transition-all duration-150 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--misu)]";
  const segmentControlClass =
    "rounded-md px-2 py-1 text-xs font-medium transition-all duration-150 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--misu)]";
  const sportSegmentClass = segmentControlClass;

  const [selectedClusterKey, setSelectedClusterKey] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    reservaId: number;
    estado: "confirmada" | "cancelada";
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleChangeEstado(reservaId: number, estado: "confirmada" | "cancelada") {
    setActionError(null);
    setPendingAction({ reservaId, estado });
    try {
      const response = await fetch("/api/club/reservas/estado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reserva_id: reservaId, estado }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setActionError(body?.error ?? "No se pudo actualizar la reserva.");
        return;
      }
      router.refresh();
    } catch {
      setActionError("No se pudo actualizar la reserva.");
    } finally {
      setPendingAction(null);
    }
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsMobile(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const day of days) map.set(day, []);
    for (const event of events) {
      const list = map.get(event.fecha);
      if (list) list.push(event);
    }
    return map;
  }, [events, days]);

  const unitsByDay = useMemo(() => {
    const map = new Map<string, SlotUnit[]>();
    for (const day of days) {
      map.set(day, computeSlotUnits(eventsByDay.get(day) ?? []));
    }
    return map;
  }, [days, eventsByDay]);

  const effectiveView: CalendarView = isMobile === null ? view : isMobile ? "day" : "week";
  const visibleDays = effectiveView === "day" ? [fecha] : days;
  const fechaBase = effectiveView === "week" ? startOfWeekIso(fecha) : fecha;
  const prevFecha = addDaysIso(fechaBase, effectiveView === "week" ? -7 : -1);
  const nextFecha = addDaysIso(fechaBase, effectiveView === "week" ? 7 : 1);
  const monthLabel = formatMonthLabel(days[0] ?? fecha);
  const gridCols =
    effectiveView === "day"
      ? "grid-cols-[58px_minmax(0,1fr)]"
      : "grid-cols-[58px_repeat(7,minmax(0,1fr))]";

  const selectedUnit = useMemo(() => {
    for (const day of visibleDays) {
      const match = (unitsByDay.get(day) ?? []).find(
        (u) => buildUnitSelectionKey(day, u.key) === selectedClusterKey,
      );
      if (match) return match;
    }
    return null;
  }, [selectedClusterKey, unitsByDay, visibleDays]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-2.5 pt-2 sm:px-3 sm:pt-2.5">
          <div
            className="inline-flex items-center rounded-lg border p-1"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
          >
            {deportesVisibles.map((deporteItem) => {
              const active = deporteItem === deporte;
              return (
                <button
                  key={deporteItem}
                  type="button"
                  className={sportSegmentClass}
                  style={
                    active
                      ? {
                          background: "var(--misu)",
                          color: "#fff",
                        }
                      : {
                          color: "var(--muted)",
                          background: "transparent",
                        }
                  }
                  onClick={() => onGoTo({ deporte: deporteItem })}
                >
                  {getDeporteLabel(deporteItem)}
                </button>
              );
            })}
          </div>

      {/* Leyenda de colores: entre deportes y bloque de dias */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {(
          [
            { label: "Alquiler", color: "#93c5fd" },
            { label: "Clase", color: "#fdba74" },
            { label: "Mixto", color: "#a78bfa" },
            { label: "Cancelada", color: "var(--error)" },
          ] as const
        ).map(({ label, color }) => (
          <span key={label} className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
            {label}:
            <span
              className="inline-flex h-4 w-8 rounded-sm border border-l-[3px]"
              style={{
                borderColor: "var(--border)",
                borderLeftColor: color,
                background: `color-mix(in srgb, ${color} 14%, var(--surface-1))`,
              }}
            />
          </span>
        ))}
      </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <p className="mr-1 text-2xl font-bold leading-none sm:text-3xl" style={{ color: "var(--foreground)" }}>
              {monthLabel}
            </p>
            <button
              type="button"
              className={navControlClass}
              onClick={() => onGoTo({ fecha: prevFecha })}
              onMouseUp={(event) => event.currentTarget.blur()}
              onTouchEnd={(event) => event.currentTarget.blur()}
            >
              {"<"}
            </button>
            <button
              type="button"
              className={navControlClass}
              onClick={() => onGoTo({ fecha: getTodayIsoArg() })}
              onMouseUp={(event) => event.currentTarget.blur()}
              onTouchEnd={(event) => event.currentTarget.blur()}
            >
              Hoy
            </button>
            <button
              type="button"
              className={navControlClass}
              onClick={() => onGoTo({ fecha: nextFecha })}
              onMouseUp={(event) => event.currentTarget.blur()}
              onTouchEnd={(event) => event.currentTarget.blur()}
            >
              {">"}
            </button>
          </div>
        </div>

      <div className="card overflow-hidden">
      <section className="p-2.5 pt-1 sm:p-3 sm:pt-1.5">
        <div
        className={`mt-2 ${selectedUnit ? "grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]" : ""}`}
        >
        <div className="overflow-x-auto lg:overflow-visible">
          {/* Cabecera días */}
          <div className={`grid ${gridCols} gap-2`}>
            <div />
            {visibleDays.map((day) => {
              const chip = formatDayChip(day);
              const isToday = day === getTodayIsoArg();
              const shouldHighlightToday = effectiveView === "week" && isToday;
              return (
                <div
                  key={`header-${day}`}
                  className="rounded-lg border px-2 py-0.5 text-center"
                  style={{
                    borderColor: shouldHighlightToday ? "var(--misu)" : "var(--border)",
                    background: shouldHighlightToday
                      ? "color-mix(in srgb, var(--misu) 12%, var(--surface-2))"
                      : "var(--surface-2)",
                    color: "var(--foreground)",
                  }}
                >
                  {effectiveView === "day" ? (
                    <p className="text-[16px] font-semibold leading-5" style={{ color: "var(--foreground)" }}>
                      {chip.weekday} {chip.day}
                    </p>
                  ) : (
                    <>
                      <p className="text-[11px] font-medium leading-3" style={{ color: "var(--muted)" }}>
                        {chip.weekday}
                      </p>
                      <p className="mt-0.5 text-[19px] font-semibold leading-4">{chip.day}</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Timeline */}
          <div className={`mt-2 grid ${gridCols} gap-2`}>
            {/* Eje de horas */}
            <div className="relative" style={{ height: `${timelineHeight}px` }}>
              {hourTicks.map((hour) => {
                const top = (hour - CLUB_START_HOUR) * 60 * PIXELS_PER_MINUTE;
                return (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 -translate-y-1/2 text-[11px] leading-none"
                    style={{ top, color: "var(--muted)" }}
                  >
                    {formatHourLabel(hour)}
                  </div>
                );
              })}
            </div>

            {/* Columnas por día */}
            {visibleDays.map((day) => {
              return (
                <div
                  key={day}
                  className="relative rounded-md border"
                  style={{
                    height: `${timelineHeight}px`,
                    borderColor: "var(--border)",
                    background: "var(--surface-1)",
                  }}
                >
                  {/* Líneas guía */}
                  {hourTicks.map((hour) => (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 border-t"
                      style={{
                        top: (hour - CLUB_START_HOUR) * 60 * PIXELS_PER_MINUTE,
                        borderColor: "var(--border)",
                      }}
                    />
                  ))}

                  {/* SlotUnits de eventos */}
                  {(unitsByDay.get(day) ?? []).map((unit) => (
                    <SlotUnitCard
                      key={unit.key}
                      unit={unit}
                      isSelected={selectedClusterKey === buildUnitSelectionKey(day, unit.key)}
                      onClick={() => {
                        const currentSelection = buildUnitSelectionKey(day, unit.key);
                        setActionError(null);
                        setSelectedClusterKey((prev) =>
                          prev === currentSelection ? null : currentSelection,
                        );
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel lateral (desktop) */}
        {selectedUnit ? (
          <aside
            className="hidden rounded-xl border p-4 lg:block"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
          >
            <SlotUnitDetailContent
              unit={selectedUnit}
              pendingAction={pendingAction}
              actionError={actionError}
              onChangeEstado={handleChangeEstado}
            />
          </aside>
        ) : null}
      </div>

      {/* Bottom sheet móvil */}
      {selectedUnit ? (
        <div className="fixed inset-0 z-50 lg:hidden" aria-modal="true" role="dialog">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            onClick={() => setSelectedClusterKey(null)}
            aria-label="Cerrar detalle"
          />
          <div
            className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl border p-4"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                Detalle de reservas
              </p>
              <button
                type="button"
                className="btn-ghost text-xs"
                onClick={() => setSelectedClusterKey(null)}
              >
                Cerrar
              </button>
            </div>
            <SlotUnitDetailContent
              unit={selectedUnit}
              pendingAction={pendingAction}
              actionError={actionError}
              onChangeEstado={handleChangeEstado}
            />
          </div>
        </div>
      ) : null}

      {/* Estado vacío */}
      {events.length === 0 ? (
        <div
          className="mt-4 rounded-xl border px-4 py-6 text-center text-sm"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface-2)",
            color: "var(--muted)",
          }}
        >
          No hay reservas para este rango.
        </div>
      ) : null}
      </section>
      </div>
    </>
  );
}
