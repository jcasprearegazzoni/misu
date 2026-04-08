"use client";

import { useMemo, useState } from "react";
import {
  CLUB_START_HOUR,
  CLUB_END_HOUR,
  formatHourLabel,
  getClubBlockPosition,
  getClubHourTicks,
  getClubTimelineHeight,
} from "./club-time-utils";
import { cancelarReservaAction, confirmarReservaAction } from "@/app/dashboard/club/calendario/actions";

type Deporte = "tenis" | "padel" | "futbol";
type CalendarView = "week" | "day";

type CalendarEvent = {
  id: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  canchaNombre: string;
  deporte: Deporte;
  duracionMinutos: number;
  estado: "pendiente" | "confirmada" | "cancelada";
  tipo: "alquiler" | "clase";
  organizadorNombre: string | null;
  organizadorEmail: string | null;
  organizadorTelefono: string | null;
};

type ClubWeekTimelineProps = {
  events: CalendarEvent[];
  days: string[];
  view: CalendarView;
  deporte: Deporte;
  deportesVisibles: Deporte[];
  fecha: string;
  onGoTo: (next: { deporte?: Deporte; fecha?: string; view?: CalendarView }) => void;
};

// Calcula semana y navegación
function startOfWeekIso(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  const day = date.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diffToMonday);
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
    weekday: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  })
    .format(date)
    .replace(".", "")
    .slice(0, 2);
  const day = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
  return {
    weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
    day,
  };
}

function getDeporteLabel(value: Deporte) {
  if (value === "tenis") return "Tenis";
  if (value === "padel") return "Padel";
  return "Futbol";
}

// Retorna los estilos del bloque según estado y tipo
function getEventBlockStyle(event: CalendarEvent, isSelected: boolean) {
  const baseStyle = (() => {
    if (event.estado === "confirmada") {
      return {
        background: "color-mix(in srgb, var(--success) 22%, var(--surface-1))",
        color: "var(--success)",
        borderColor: "color-mix(in srgb, var(--success) 62%, var(--border))",
      };
    }
    if (event.estado === "pendiente") {
      return {
        background: "color-mix(in srgb, var(--warning) 22%, var(--surface-1))",
        color: "var(--warning)",
        borderColor: "color-mix(in srgb, var(--warning) 62%, var(--border))",
      };
    }
    return {
      background: "var(--surface-2)",
      color: "var(--muted)",
      borderColor: "var(--border)",
    };
  })();

  if (isSelected) {
    return {
      ...baseStyle,
      background: `color-mix(in srgb, ${baseStyle.background} 78%, var(--foreground) 22%)`,
    };
  }

  return baseStyle;
}

// Badge de tipo
function TipoBadge({ tipo }: { tipo: CalendarEvent["tipo"] }) {
  const style =
    tipo === "alquiler"
      ? { background: "rgba(59,130,246,.16)", color: "#93c5fd" }
      : { background: "rgba(249,115,22,.16)", color: "#fdba74" };
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={style}>
      {tipo === "alquiler" ? "Alquiler" : "Clase"}
    </span>
  );
}

// Badge de estado
function EstadoBadge({ estado }: { estado: CalendarEvent["estado"] }) {
  const style =
    estado === "confirmada"
      ? { background: "var(--success-bg)", color: "var(--success)" }
      : estado === "pendiente"
        ? { background: "var(--warning-bg)", color: "var(--warning)" }
        : { background: "var(--surface-1)", color: "var(--muted)" };
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-semibold capitalize" style={style}>
      {estado}
    </span>
  );
}

export function ClubWeekTimeline({
  events,
  days,
  view,
  deporte,
  deportesVisibles,
  fecha,
  onGoTo,
}: ClubWeekTimelineProps) {
  const hourTicks = getClubHourTicks();
  const timelineHeight = getClubTimelineHeight();

  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  // Agrupar eventos por fecha
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const day of days) {
      map.set(day, []);
    }
    for (const event of events) {
      const list = map.get(event.fecha);
      if (list) list.push(event);
    }
    return map;
  }, [events, days]);

  // Columnas a renderizar según vista
  const visibleDays = view === "day" ? [fecha] : days;

  const fechaBase = view === "week" ? startOfWeekIso(fecha) : fecha;
  const prevFecha = addDaysIso(fechaBase, view === "week" ? -7 : -1);
  const nextFecha = addDaysIso(fechaBase, view === "week" ? 7 : 1);
  const monthLabel = formatMonthLabel(days[0] ?? fecha);

  // Número de columnas del grid: 1 hora + N días
  const gridCols = view === "day" ? "grid-cols-[58px_minmax(0,1fr)]" : "grid-cols-[58px_repeat(7,minmax(0,1fr))]";

  return (
    <section className="card p-3 sm:p-4">
      {/* Header: filtros de deporte + nav + toggle */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {deportesVisibles.map((deporteItem) => {
            const active = deporteItem === deporte;
            return (
              <button
                key={deporteItem}
                type="button"
                className="rounded-full border px-3 py-1.5 text-xs font-semibold transition"
                style={
                  active
                    ? { background: "var(--misu)", color: "#fff", borderColor: "var(--misu)" }
                    : { background: "var(--surface-2)", color: "var(--muted)", borderColor: "var(--border)" }
                }
                onClick={() => onGoTo({ deporte: deporteItem })}
              >
                {getDeporteLabel(deporteItem)}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn-ghost text-sm"
            onClick={() => onGoTo({ fecha: prevFecha })}
          >
            ←
          </button>
          <button
            type="button"
            className="btn-ghost text-sm"
            onClick={() => onGoTo({ fecha: getTodayIsoArg() })}
          >
            Hoy
          </button>
          <button
            type="button"
            className="btn-ghost text-sm"
            onClick={() => onGoTo({ fecha: nextFecha })}
          >
            →
          </button>
          <div
            className="ml-2 flex items-center rounded-lg border p-1"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
          >
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs font-medium transition"
              style={view === "week" ? { background: "var(--misu)", color: "#fff" } : { color: "var(--muted)" }}
              onClick={() => onGoTo({ view: "week" })}
            >
              Semana
            </button>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs font-medium transition"
              style={view === "day" ? { background: "var(--misu)", color: "#fff" } : { color: "var(--muted)" }}
              onClick={() => onGoTo({ view: "day" })}
            >
              Día
            </button>
          </div>
        </div>
      </div>

      {/* Mes */}
      <p className="mt-3 text-3xl font-bold leading-none" style={{ color: "var(--foreground)" }}>
        {monthLabel}
      </p>

      {/* Grid principal + panel lateral */}
      <div className={`mt-3 ${selectedEvent ? "grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]" : ""}`}>
        <div className="overflow-x-auto">
          {/* Cabecera de días */}
          <div className={`grid ${gridCols} gap-2`}>
            <div />
            {visibleDays.map((day) => {
              const chip = formatDayChip(day);
              const isToday = day === getTodayIsoArg();
              return (
                <div
                  key={`header-${day}`}
                  className="rounded-lg border px-1 py-0.5 text-center"
                  style={{
                    borderColor: isToday ? "var(--misu)" : "var(--border)",
                    background: isToday ? "color-mix(in srgb, var(--misu) 12%, var(--surface-2))" : "var(--surface-2)",
                    color: "var(--foreground)",
                  }}
                >
                  <p className="text-[10px] font-medium leading-3" style={{ color: "var(--muted)" }}>
                    {chip.weekday}
                  </p>
                  <p className="mt-0.5 text-[19px] font-semibold leading-4">{chip.day}</p>
                </div>
              );
            })}
          </div>

          {/* Grid de timeline */}
          <div className={`mt-2 grid ${gridCols} gap-2`}>
            {/* Columna de horas */}
            <div className="relative" style={{ height: `${timelineHeight}px` }}>
              {hourTicks.map((hour) => {
                const top = (hour - CLUB_START_HOUR) * 60 * 0.9;
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

            {/* Columnas de días */}
            {visibleDays.map((day) => {
              const dayEvents = eventsByDay.get(day) ?? [];
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
                  {/* Líneas de hora */}
                  {hourTicks.map((hour) => {
                    const top = (hour - CLUB_START_HOUR) * 60 * 0.9;
                    return (
                      <div
                        key={hour}
                        className="absolute left-0 right-0 border-t"
                        style={{ top, borderColor: "var(--border)" }}
                      />
                    );
                  })}
                  {/* Líneas de media hora */}
                  {hourTicks.slice(0, -1).map((hour) => {
                    const top = (hour - CLUB_START_HOUR) * 60 * 0.9 + 30 * 0.9;
                    return (
                      <div
                        key={`half-${hour}`}
                        className="absolute left-0 right-0 border-t border-dashed"
                        style={{ top, borderColor: "var(--border)" }}
                      />
                    );
                  })}

                  {/* Bloques de eventos */}
                  {dayEvents.map((event) => {
                    const { top, height } = getClubBlockPosition(event.horaInicio, event.horaFin);
                    const isSelected = event.id === selectedEventId;
                    const blockStyle = getEventBlockStyle(event, isSelected);

                    return (
                      <button
                        key={event.id}
                        type="button"
                        className="absolute left-0 right-0 z-10 overflow-hidden rounded border-[2px] px-1.5 py-1 text-left transition"
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          ...blockStyle,
                        }}
                        onClick={() => setSelectedEventId(isSelected ? null : event.id)}
                      >
                        <p className="truncate text-xs font-semibold leading-snug">
                          {event.tipo === "clase"
                            ? `Clase de ${event.organizadorNombre ?? "Profesor"}`
                            : event.canchaNombre}
                        </p>
                        <p className="truncate text-[10px] opacity-75">
                          {event.horaInicio.slice(0, 5)} – {event.horaFin.slice(0, 5)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel lateral de detalle */}
        {selectedEvent ? (
          <aside
            className="rounded-xl border p-4"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
          >
            <div className="grid gap-3">
              {/* Título */}
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  {selectedEvent.tipo === "clase"
                    ? `Clase de ${selectedEvent.organizadorNombre ?? "Profesor"}`
                    : selectedEvent.canchaNombre}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                  {selectedEvent.horaInicio.slice(0, 5)} – {selectedEvent.horaFin.slice(0, 5)} · {selectedEvent.duracionMinutos} min
                </p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <EstadoBadge estado={selectedEvent.estado} />
                <TipoBadge tipo={selectedEvent.tipo} />
              </div>

              {/* Datos del organizador / cancha */}
              <div
                className="rounded-lg border p-3 text-xs"
                style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--muted)" }}
              >
                {selectedEvent.tipo === "clase" ? (
                  <>
                    <p>Cancha: {selectedEvent.canchaNombre}</p>
                    <p className="mt-1">Profesor: {selectedEvent.organizadorNombre ?? "Sin datos"}</p>
                  </>
                ) : (
                  <>
                    <p>Organizador: {selectedEvent.organizadorNombre ?? "Sin datos"}</p>
                    {selectedEvent.organizadorEmail ? (
                      <p className="mt-1">Email: {selectedEvent.organizadorEmail}</p>
                    ) : null}
                    {selectedEvent.organizadorTelefono ? (
                      <p className="mt-1">Teléfono: {selectedEvent.organizadorTelefono}</p>
                    ) : null}
                  </>
                )}
              </div>

              {/* Acciones: solo para alquileres */}
              {selectedEvent.tipo === "alquiler" &&
              (selectedEvent.estado === "pendiente" || selectedEvent.estado === "confirmada") ? (
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.estado === "pendiente" ? (
                    <form action={confirmarReservaAction}>
                      <input type="hidden" name="reserva_id" value={selectedEvent.id} />
                      <button type="submit" className="btn-primary text-xs">
                        Confirmar
                      </button>
                    </form>
                  ) : null}
                  <form action={cancelarReservaAction}>
                    <input type="hidden" name="reserva_id" value={selectedEvent.id} />
                    <button type="submit" className="btn-ghost text-xs" style={{ color: "var(--error)" }}>
                      Cancelar
                    </button>
                  </form>
                </div>
              ) : null}

              {/* Indicador de solo lectura para clases de profesores */}
              {selectedEvent.tipo === "clase" ? (
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  Esta clase es gestionada por el profesor.
                </p>
              ) : null}
            </div>
          </aside>
        ) : null}
      </div>

      {/* Estado vacío */}
      {events.length === 0 ? (
        <div
          className="mt-4 rounded-xl border px-4 py-6 text-center text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--muted)" }}
        >
          No hay reservas para este rango.
        </div>
      ) : null}
    </section>
  );
}
