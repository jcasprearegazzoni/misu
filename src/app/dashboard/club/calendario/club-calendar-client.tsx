"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import esLocale from "@fullcalendar/core/locales/es";
import type { EventClickArg } from "@fullcalendar/core";
import { cancelarReservaAction, confirmarReservaAction } from "./actions";

type Deporte = "tenis" | "padel" | "futbol";
type CalendarView = "week" | "day";

type CalendarEvent = {
  id: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  startIso: string;
  endIso: string;
  canchaNombre: string;
  deporte: Deporte;
  duracionMinutos: number;
  estado: "pendiente" | "confirmada" | "cancelada";
  tipo: "alquiler" | "clase";
  organizadorNombre: string | null;
  organizadorEmail: string | null;
  organizadorTelefono: string | null;
};

type ClubCalendarClientProps = {
  deporte: Deporte;
  fecha: string;
  view: CalendarView;
  hasViewParam: boolean;
  deportesVisibles: Deporte[];
  eventos: CalendarEvent[];
};

function getDeporteLabel(value: Deporte) {
  if (value === "tenis") return "Tenis";
  if (value === "padel") return "Padel";
  return "Futbol";
}

function getTipoLabel(tipo: CalendarEvent["tipo"]) {
  return tipo === "alquiler" ? "Alquiler" : "Clase";
}

function formatFechaLarga(fecha: string) {
  const [year, month, day] = fecha.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(date);
}

function toDateIsoArg(date: Date) {
  const formatter = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function getTodayIsoArg() {
  return toDateIsoArg(new Date());
}

function addDaysIso(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function startOfWeekIso(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  const day = date.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diffToMonday);
  return date.toISOString().slice(0, 10);
}

export function ClubCalendarClient({
  deporte,
  fecha,
  view,
  hasViewParam,
  deportesVisibles,
  eventos,
}: ClubCalendarClientProps) {
  const router = useRouter();
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  useEffect(() => {
    setSelectedEventId(null);
  }, [deporte, fecha, view]);

  useEffect(() => {
    if (hasViewParam) return;
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 639px)").matches) return;

    const params = new URLSearchParams();
    params.set("deporte", deporte);
    params.set("fecha", fecha);
    params.set("view", "day");
    router.replace(`/dashboard/club/calendario?${params.toString()}`);
  }, [hasViewParam, router, deporte, fecha]);

  const selectedEvent = useMemo(
    () => eventos.find((evento) => evento.id === selectedEventId) ?? null,
    [eventos, selectedEventId],
  );

  const fcEvents = useMemo(
    () =>
      eventos.map((evento) => ({
        id: String(evento.id),
        title: `${evento.canchaNombre} · ${getTipoLabel(evento.tipo)}`,
        start: evento.startIso,
        end: evento.endIso,
        classNames: [`club-event-${evento.estado}`, `club-event-${evento.tipo}`],
      })),
    [eventos],
  );

  const goTo = (next: { deporte?: Deporte; fecha?: string; view?: CalendarView }) => {
    const params = new URLSearchParams();
    params.set("deporte", next.deporte ?? deporte);
    params.set("fecha", next.fecha ?? fecha);
    params.set("view", next.view ?? view);
    router.push(`/dashboard/club/calendario?${params.toString()}`);
  };

  const fechaBase = view === "week" ? startOfWeekIso(fecha) : fecha;
  const prevFecha = addDaysIso(fechaBase, view === "week" ? -7 : -1);
  const nextFecha = addDaysIso(fechaBase, view === "week" ? 7 : 1);
  const onToday = () => goTo({ fecha: getTodayIsoArg() });

  const onEventClick = (arg: EventClickArg) => {
    const id = Number(arg.event.id);
    if (Number.isInteger(id)) {
      setSelectedEventId(id);
    }
  };

  return (
    <section className="card p-4 sm:p-5">
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
                onClick={() => goTo({ deporte: deporteItem })}
              >
                {getDeporteLabel(deporteItem)}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-ghost text-sm" onClick={() => goTo({ fecha: prevFecha })}>
            ←
          </button>
          <button type="button" className="btn-ghost text-sm" onClick={onToday}>
            Hoy
          </button>
          <button type="button" className="btn-ghost text-sm" onClick={() => goTo({ fecha: nextFecha })}>
            →
          </button>
          <div className="ml-2 flex items-center rounded-lg border p-1" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs font-medium transition"
              style={view === "week" ? { background: "var(--misu)", color: "#fff" } : { color: "var(--muted)" }}
              onClick={() => goTo({ view: "week" })}
            >
              Semana
            </button>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs font-medium transition"
              style={view === "day" ? { background: "var(--misu)", color: "#fff" } : { color: "var(--muted)" }}
              onClick={() => goTo({ view: "day" })}
            >
              Dia
            </button>
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
        {formatFechaLarga(fecha)}
      </p>

      {eventos.length === 0 ? (
        <div
          className="mt-4 rounded-xl border px-4 py-6 text-center text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--muted)" }}
        >
          No hay reservas para este rango.
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
            <FullCalendar
              plugins={[timeGridPlugin]}
              initialView={view === "week" ? "timeGridWeek" : "timeGridDay"}
              initialDate={fecha}
              firstDay={1}
              allDaySlot={false}
              nowIndicator
              locale={esLocale}
              headerToolbar={false}
              height="auto"
              slotMinTime="06:00:00"
              slotMaxTime="24:00:00"
              expandRows
              events={fcEvents}
              eventClick={onEventClick}
            />
          </div>

          <aside className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
            {!selectedEvent ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Selecciona una reserva para ver detalle y acciones.
              </p>
            ) : (
              <div className="grid gap-3">
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  {selectedEvent.canchaNombre}
                </p>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {selectedEvent.horaInicio.slice(0, 5)} - {selectedEvent.horaFin.slice(0, 5)} · {selectedEvent.duracionMinutos} min
                </p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {formatFechaLarga(selectedEvent.fecha)}
                </p>

                <div className="flex flex-wrap gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={
                      selectedEvent.estado === "confirmada"
                        ? { background: "var(--success-bg)", color: "var(--success)" }
                        : selectedEvent.estado === "pendiente"
                          ? { background: "var(--warning-bg)", color: "var(--warning)" }
                          : { background: "var(--surface-1)", color: "var(--muted)" }
                    }
                  >
                    {selectedEvent.estado}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={
                      selectedEvent.tipo === "alquiler"
                        ? { background: "rgba(59,130,246,.16)", color: "#93c5fd" }
                        : { background: "rgba(249,115,22,.16)", color: "#fdba74" }
                    }
                  >
                    {getTipoLabel(selectedEvent.tipo)}
                  </span>
                </div>

                <div className="rounded-lg border p-3 text-xs" style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--muted)" }}>
                  <p>Organizador: {selectedEvent.organizadorNombre ?? "Sin datos"}</p>
                  {selectedEvent.organizadorEmail ? <p className="mt-1">Email: {selectedEvent.organizadorEmail}</p> : null}
                  {selectedEvent.organizadorTelefono ? <p className="mt-1">Telefono: {selectedEvent.organizadorTelefono}</p> : null}
                </div>

                {(selectedEvent.estado === "pendiente" || selectedEvent.estado === "confirmada") ? (
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
              </div>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
