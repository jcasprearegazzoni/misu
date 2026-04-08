"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CLUB_START_HOUR,
  CLUB_END_HOUR,
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

type SlotBase = {
  horaInicio: string;
  horaFin: string;
  top: number;
  height: number;
};

type SlotCourtGroup = {
  canchaId: number;
  canchaNombre: string;
  items: CalendarEvent[];
};

type SlotSummary = SlotBase & {
  key: string;
  fecha: string;
  occupiedCount: number;
  totalCourts: number;
  alquilerCount: number;
  claseCount: number;
  itemsByCourt: SlotCourtGroup[];
};

const ACTIVE_OCCUPANCY_STATES = new Set<CalendarEvent["estado"]>(["pendiente", "confirmada"]);

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

function parseTimeToMinutes(value: string) {
  const [hoursPart = "0", minutesPart = "0"] = value.slice(0, 5).split(":");
  return Number(hoursPart) * 60 + Number(minutesPart);
}

function minutesToTime(minutesTotal: number) {
  const normalized = ((minutesTotal % 1440) + 1440) % 1440;
  const hh = Math.floor(normalized / 60);
  const mm = normalized % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`;
}

function overlapsInterval(startA: string, endA: string, startB: string, endB: string) {
  const aStart = parseTimeToMinutes(startA);
  const aEnd = parseTimeToMinutes(endA);
  const bStart = parseTimeToMinutes(startB);
  const bEnd = parseTimeToMinutes(endB);
  return aStart < bEnd && bStart < aEnd;
}

function buildHourlySlots(): SlotBase[] {
  const slots: SlotBase[] = [];

  for (let hour = CLUB_START_HOUR; hour < CLUB_END_HOUR; hour += 1) {
    const startMinutes = hour * 60;
    const endMinutes = (hour + 1) * 60;

    slots.push({
      horaInicio: minutesToTime(startMinutes),
      horaFin: minutesToTime(endMinutes),
      top: (startMinutes - CLUB_START_HOUR * 60) * PIXELS_PER_MINUTE,
      height: 60 * PIXELS_PER_MINUTE,
    });
  }

  return slots;
}

function getSlotToneStyle(occupiedCount: number, totalCourts: number, isSelected: boolean) {
  const ratio = totalCourts > 0 ? occupiedCount / totalCourts : 0;

  const base =
    occupiedCount === 0
      ? {
          background: "var(--surface-1)",
          borderColor: "var(--border)",
          color: "var(--muted)",
        }
      : ratio <= 0.4
        ? {
            background: "color-mix(in srgb, var(--success) 18%, var(--surface-1))",
            borderColor: "color-mix(in srgb, var(--success) 65%, var(--border))",
            color: "var(--success)",
          }
        : ratio <= 0.8
          ? {
              background: "color-mix(in srgb, var(--warning) 18%, var(--surface-1))",
              borderColor: "color-mix(in srgb, var(--warning) 65%, var(--border))",
              color: "var(--warning)",
            }
          : {
              background: "color-mix(in srgb, var(--error) 18%, var(--surface-1))",
              borderColor: "color-mix(in srgb, var(--error) 65%, var(--border))",
              color: "var(--error)",
            };

  if (!isSelected) return base;

  return {
    ...base,
    background: `color-mix(in srgb, ${base.background} 76%, var(--foreground) 24%)`,
  };
}

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

type SlotDetailsContentProps = {
  slot: SlotSummary;
  pendingAction: { reservaId: number; estado: "confirmada" | "cancelada" } | null;
  actionError: string | null;
  onChangeEstado: (reservaId: number, estado: "confirmada" | "cancelada") => Promise<void>;
};

function SlotDetailsContent({ slot, pendingAction, actionError, onChangeEstado }: SlotDetailsContentProps) {
  return (
    <div className="grid gap-3">
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          {slot.horaInicio.slice(0, 5)} - {slot.horaFin.slice(0, 5)}
        </p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
          {slot.occupiedCount} / {slot.totalCourts} canchas ocupadas - {slot.alquilerCount} alquileres - {slot.claseCount} clases
        </p>
      </div>

      {actionError ? (
        <div
          className="rounded-lg border px-3 py-2 text-xs"
          style={{ borderColor: "var(--error-border)", background: "var(--error-bg)", color: "var(--error)" }}
        >
          {actionError}
        </div>
      ) : null}

      {slot.itemsByCourt.length === 0 ? (
        <div
          className="rounded-lg border p-3 text-xs"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--muted)" }}
        >
          No hay reservas activas en esta franja.
        </div>
      ) : (
        <div className="grid gap-2">
          {slot.itemsByCourt.map((courtGroup) => (
            <div
              key={courtGroup.canchaId}
              className="rounded-lg border p-3"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
            >
              <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                {courtGroup.canchaNombre}
              </p>

              <div className="mt-2 grid gap-2">
                {courtGroup.items.map((item) => (
                  <div key={item.id} className="rounded-md border p-2" style={{ borderColor: "var(--border)" }}>
                    <div className="flex flex-wrap items-center gap-2">
                      <EstadoBadge estado={item.estado} />
                      <TipoBadge tipo={item.tipo} />
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        {item.horaInicio.slice(0, 5)} - {item.horaFin.slice(0, 5)} - {item.duracionMinutos} min
                      </p>
                    </div>

                    <div className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
                      {item.tipo === "clase" ? (
                        <>
                          <p>Profesor: {item.organizadorNombre ?? "Sin datos"}</p>
                          <p className="mt-1">Esta clase es de solo lectura para el club.</p>
                        </>
                      ) : (
                        <>
                          <p>Organizador: {item.organizadorNombre ?? "Sin datos"}</p>
                          {item.organizadorEmail ? <p className="mt-1">Email: {item.organizadorEmail}</p> : null}
                          {item.organizadorTelefono ? <p className="mt-1">Telefono: {item.organizadorTelefono}</p> : null}
                        </>
                      )}
                    </div>

                    {item.tipo === "alquiler" && (item.estado === "pendiente" || item.estado === "confirmada") ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.estado === "pendiente" ? (
                          <button
                            type="button"
                            className="btn-primary text-xs"
                            onClick={() => onChangeEstado(item.id, "confirmada")}
                            disabled={
                              pendingAction?.reservaId === item.id && pendingAction?.estado === "confirmada"
                            }
                          >
                            {pendingAction?.reservaId === item.id && pendingAction?.estado === "confirmada"
                              ? "Confirmando..."
                              : "Confirmar"}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="btn-ghost text-xs"
                          style={{ color: "var(--error)" }}
                          onClick={() => onChangeEstado(item.id, "cancelada")}
                          disabled={pendingAction?.reservaId === item.id && pendingAction?.estado === "cancelada"}
                        >
                          {pendingAction?.reservaId === item.id && pendingAction?.estado === "cancelada"
                            ? "Cancelando..."
                            : "Cancelar"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ClubWeekTimeline({
  events,
  days,
  view,
  deporte,
  deportesVisibles,
  fecha,
  canchas,
  onGoTo,
}: ClubWeekTimelineProps) {
  const router = useRouter();
  const hourTicks = getClubHourTicks();
  const timelineHeight = getClubTimelineHeight();
  const hourlySlots = useMemo(() => buildHourlySlots(), []);

  const [selectedSlotKey, setSelectedSlotKey] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ reservaId: number; estado: "confirmada" | "cancelada" } | null>(
    null,
  );
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

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const day of days) {
      map.set(day, []);
    }
    for (const event of events) {
      const list = map.get(event.fecha);
      if (list) list.push(event);
    }

    for (const [key, list] of map.entries()) {
      map.set(
        key,
        [...list].sort((a, b) => parseTimeToMinutes(a.horaInicio) - parseTimeToMinutes(b.horaInicio)),
      );
    }

    return map;
  }, [events, days]);

  const totalCourts = canchas.length;

  // Construimos una matriz por dia y franja de 1 hora para escalar en alta simultaneidad.
  const slotsByDay = useMemo(() => {
    const map = new Map<string, SlotSummary[]>();

    for (const day of days) {
      const dayEvents = eventsByDay.get(day) ?? [];

      const daySlots = hourlySlots.map((slotBase) => {
        const slotItems = dayEvents.filter((item) =>
          overlapsInterval(slotBase.horaInicio, slotBase.horaFin, item.horaInicio, item.horaFin),
        );

        const activeItems = slotItems.filter((item) => ACTIVE_OCCUPANCY_STATES.has(item.estado));

        const occupiedCourts = new Set(activeItems.map((item) => item.canchaId));
        const alquilerCourts = new Set(activeItems.filter((item) => item.tipo === "alquiler").map((item) => item.canchaId));
        const claseCourts = new Set(activeItems.filter((item) => item.tipo === "clase").map((item) => item.canchaId));

        const groupedByCourt = new Map<number, SlotCourtGroup>();

        for (const item of slotItems) {
          const existing = groupedByCourt.get(item.canchaId);
          if (existing) {
            existing.items.push(item);
            continue;
          }

          groupedByCourt.set(item.canchaId, {
            canchaId: item.canchaId,
            canchaNombre: item.canchaNombre,
            items: [item],
          });
        }

        const itemsByCourt = Array.from(groupedByCourt.values())
          .map((group) => ({
            ...group,
            items: group.items.sort((a, b) => parseTimeToMinutes(a.horaInicio) - parseTimeToMinutes(b.horaInicio)),
          }))
          .sort((a, b) => a.canchaNombre.localeCompare(b.canchaNombre, "es"));

        return {
          key: `${day}|${slotBase.horaInicio}`,
          fecha: day,
          horaInicio: slotBase.horaInicio,
          horaFin: slotBase.horaFin,
          top: slotBase.top,
          height: slotBase.height,
          occupiedCount: occupiedCourts.size,
          totalCourts,
          alquilerCount: alquilerCourts.size,
          claseCount: claseCourts.size,
          itemsByCourt,
        } satisfies SlotSummary;
      });

      map.set(day, daySlots);
    }

    return map;
  }, [days, eventsByDay, hourlySlots, totalCourts]);

  const selectedSlot = useMemo(() => {
    if (!selectedSlotKey) return null;

    for (const day of days) {
      const daySlots = slotsByDay.get(day) ?? [];
      const match = daySlots.find((slot) => slot.key === selectedSlotKey);
      if (match) return match;
    }

    return null;
  }, [selectedSlotKey, slotsByDay, days]);

  const visibleDays = view === "day" ? [fecha] : days;

  const fechaBase = view === "week" ? startOfWeekIso(fecha) : fecha;
  const prevFecha = addDaysIso(fechaBase, view === "week" ? -7 : -1);
  const nextFecha = addDaysIso(fechaBase, view === "week" ? 7 : 1);
  const monthLabel = formatMonthLabel(days[0] ?? fecha);

  const gridCols = view === "day" ? "grid-cols-[58px_minmax(0,1fr)]" : "grid-cols-[58px_repeat(7,minmax(0,1fr))]";

  return (
    <section className="card p-3 sm:p-4">
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
          <button type="button" className="btn-ghost text-sm" onClick={() => onGoTo({ fecha: prevFecha })}>
            {"<"}
          </button>
          <button type="button" className="btn-ghost text-sm" onClick={() => onGoTo({ fecha: getTodayIsoArg() })}>
            Hoy
          </button>
          <button type="button" className="btn-ghost text-sm" onClick={() => onGoTo({ fecha: nextFecha })}>
            {">"}
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
              Dia
            </button>
          </div>
        </div>
      </div>

      <p className="mt-3 text-3xl font-bold leading-none" style={{ color: "var(--foreground)" }}>
        {monthLabel}
      </p>

      <div className={`mt-3 ${selectedSlot ? "grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]" : ""}`}>
        <div className="overflow-x-auto">
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

          <div className={`mt-2 grid ${gridCols} gap-2`}>
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

            {visibleDays.map((day) => {
              const daySlots = slotsByDay.get(day) ?? [];

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
                  {hourTicks.map((hour) => {
                    const top = (hour - CLUB_START_HOUR) * 60 * PIXELS_PER_MINUTE;
                    return (
                      <div
                        key={hour}
                        className="absolute left-0 right-0 border-t"
                        style={{ top, borderColor: "var(--border)" }}
                      />
                    );
                  })}

                  {daySlots.map((slot) => {
                    const isSelected = selectedSlotKey === slot.key;
                    const tone = getSlotToneStyle(slot.occupiedCount, slot.totalCourts, isSelected);

                    return (
                      <button
                        key={slot.key}
                        type="button"
                        className="absolute left-0 right-0 z-10 rounded border px-2 py-1 text-left transition"
                        style={{
                          top: `${slot.top + 1}px`,
                          height: `${Math.max(slot.height - 2, 40)}px`,
                          ...tone,
                        }}
                        onClick={() => {
                          setActionError(null);
                          setSelectedSlotKey((current) => (current === slot.key ? null : slot.key));
                        }}
                      >
                        {slot.totalCourts === 0 ? (
                          <p className="truncate text-[11px] font-semibold leading-tight">Sin canchas activas</p>
                        ) : (
                          <>
                            <p className="truncate text-[11px] font-semibold leading-tight">
                              {slot.occupiedCount} / {slot.totalCourts} canchas ocupadas
                            </p>
                            <p className="truncate text-[10px] leading-tight opacity-85">
                              {slot.alquilerCount} alquileres · {slot.claseCount} clases
                            </p>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {selectedSlot ? (
          <aside
            className="hidden rounded-xl border p-4 lg:block"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
          >
            <SlotDetailsContent
              slot={selectedSlot}
              pendingAction={pendingAction}
              actionError={actionError}
              onChangeEstado={handleChangeEstado}
            />
          </aside>
        ) : null}
      </div>

      {selectedSlot ? (
        <div className="fixed inset-0 z-50 lg:hidden" aria-modal="true" role="dialog">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            onClick={() => setSelectedSlotKey(null)}
            aria-label="Cerrar detalle"
          />
          <div
            className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl border p-4"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                Detalle de franja
              </p>
              <button type="button" className="btn-ghost text-xs" onClick={() => setSelectedSlotKey(null)}>
                Cerrar
              </button>
            </div>
            <SlotDetailsContent
              slot={selectedSlot}
              pendingAction={pendingAction}
              actionError={actionError}
              onChangeEstado={handleChangeEstado}
            />
          </div>
        </div>
      ) : null}

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

