"use client";

import { useMemo, useState } from "react";
import { formatUserDate } from "@/lib/format/date";
import {
  CALENDAR_END_HOUR,
  CALENDAR_START_HOUR,
  formatHourLabel,
  getBookingPosition,
  getHourTicks,
  getTimelineStartMinute,
  PIXELS_PER_MINUTE,
  parseTimeToMinutes,
} from "./time-utils";
import { CalendarBookingItem } from "./types";
import { BookingDetailContent } from "./booking-detail-content";
import { groupDayBookingsBySlot } from "./slot-groups";

type TimelineAvailabilityRange = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
};

type WeekTimelineProps = {
  days: Array<{
    date: string;
    items: CalendarBookingItem[];
  }>;
  availability: TimelineAvailabilityRange[];
  blockedRanges: Array<{
    start_at: string;
    end_at: string;
  }>;
};

type CalendarCell = {
  key: string;
  date: string;
  start_time: string;
  end_time: string;
  top: number;
  height: number;
  state: "available" | "blocked" | "occupied";
  slot: ReturnType<typeof groupDayBookingsBySlot>[number] | null;
};

function getDayOfWeekFromIsoDate(dateIso: string) {
  return new Date(`${dateIso}T00:00:00`).getDay();
}

function hhmmToTimeValue(value: string) {
  return `${value.slice(0, 5)}:00`;
}

function minutesToTimeValue(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`;
}

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB;
}

function normalizeSlotKey(date: string, startTime: string, endTime: string) {
  return `${date}|${startTime.slice(0, 5)}|${endTime.slice(0, 5)}`;
}

function getOccupiedBlockClass(slot: NonNullable<CalendarCell["slot"]>) {
  if (slot.is_finalized) {
    return "border-sky-400 bg-sky-100 text-sky-900";
  }

  if (slot.status === "pendiente") {
    return "border-zinc-500 bg-white text-zinc-900";
  }

  if (slot.occupied_count >= slot.capacity) {
    return "border-emerald-300 bg-emerald-100 text-emerald-900";
  }

  return "border-amber-300 bg-amber-100 text-amber-900";
}

function getOccupiedStatusLabel(slot: NonNullable<CalendarCell["slot"]>) {
  if (slot.is_finalized) {
    return "Finalizada";
  }
  if (slot.status === "pendiente") {
    return "Pendiente";
  }
  if (slot.occupied_count >= slot.capacity) {
    return "Completa";
  }
  return "Ocupada parcial";
}

function getOccupiedStatusBadgeClass(slot: NonNullable<CalendarCell["slot"]>) {
  if (slot.is_finalized) {
    return "border-sky-300 bg-sky-200 text-sky-900";
  }
  if (slot.status === "pendiente") {
    return "border-zinc-400 bg-zinc-100 text-zinc-700";
  }
  if (slot.occupied_count >= slot.capacity) {
    return "border-emerald-300 bg-emerald-200 text-emerald-900";
  }
  return "border-amber-300 bg-amber-200 text-amber-900";
}

export function WeekTimeline({ days, availability, blockedRanges }: WeekTimelineProps) {
  const hourTicks = getHourTicks();
  const timelineHeight = (CALENDAR_END_HOUR * 60 - CALENDAR_START_HOUR * 60) * PIXELS_PER_MINUTE;
  const timelineStart = getTimelineStartMinute();
  const daySlots = useMemo(
    () =>
      days.map((day) => ({
        date: day.date,
        slots: groupDayBookingsBySlot(day.items),
      })),
    [days],
  );
  const flatSlots = useMemo(() => daySlots.flatMap((day) => day.slots), [daySlots]);
  const [selectedSlotKey, setSelectedSlotKey] = useState<string | null>(flatSlots[0]?.slot_key ?? null);
  const selectedSlot = flatSlots.find((slot) => slot.slot_key === selectedSlotKey) ?? flatSlots[0] ?? null;
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(selectedSlot?.bookings[0]?.id ?? null);

  const selectedItem =
    selectedSlot?.bookings.find((booking) => booking.id === selectedBookingId) ??
    selectedSlot?.bookings[0] ??
    null;

  const dayCells = useMemo(() => {
    return daySlots.map((day) => {
      const slotMap = new Map(day.slots.map((slot) => [normalizeSlotKey(day.date, slot.start_time, slot.end_time), slot]));
      const dayOfWeek = getDayOfWeekFromIsoDate(day.date);
      const cells: CalendarCell[] = [];

      const dayAvailability = availability.filter((item) => item.day_of_week === dayOfWeek);
      for (const range of dayAvailability) {
        const startMinute = parseTimeToMinutes(range.start_time.slice(0, 5));
        const endMinute = parseTimeToMinutes(range.end_time.slice(0, 5));
        const slotDuration = Math.max(Number(range.slot_duration_minutes || 0), 30);

        for (
          let cursorMinute = startMinute;
          cursorMinute + slotDuration <= endMinute;
          cursorMinute += slotDuration
        ) {
          const slotStart = minutesToTimeValue(cursorMinute);
          const slotEnd = minutesToTimeValue(cursorMinute + slotDuration);
          const slotKey = normalizeSlotKey(day.date, slotStart, slotEnd);
          const slot = slotMap.get(slotKey) ?? null;
          const slotStartAt = new Date(`${day.date}T${slotStart}-03:00`);
          const slotEndAt = new Date(`${day.date}T${slotEnd}-03:00`);
          const isBlocked = blockedRanges.some((item) =>
            overlaps(slotStartAt, slotEndAt, new Date(item.start_at), new Date(item.end_at)),
          );

          const position = getBookingPosition(hhmmToTimeValue(slotStart), hhmmToTimeValue(slotEnd), { minHeight: 0 });

          cells.push({
            key: `${day.date}-${slotStart}-${slotEnd}`,
            date: day.date,
            start_time: slotStart,
            end_time: slotEnd,
            top: position.top,
            height: Math.max(position.height, 36),
            state: slot ? "occupied" : isBlocked ? "blocked" : "available",
            slot,
          });
        }
      }

      return {
        date: day.date,
        cells: cells.sort((a, b) => a.start_time.localeCompare(b.start_time)),
      };
    });
  }, [availability, blockedRanges, daySlots]);

  return (
    <section className="mt-6 hidden md:block">
      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-3">
        <div className="rounded-xl border border-zinc-300 bg-white p-3">
          <div className="grid grid-cols-[58px_repeat(7,minmax(0,1fr))] gap-2">
            <div />
            {days.map((day) => (
              <div
                key={day.date}
                className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-center text-xs font-semibold text-zinc-800"
              >
                {formatUserDate(day.date)}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-[58px_repeat(7,minmax(0,1fr))] gap-2">
            <div className="relative" style={{ height: `${timelineHeight}px` }}>
              {hourTicks.map((hour) => {
                const top = (hour * 60 - timelineStart) * PIXELS_PER_MINUTE;
                return (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 -translate-y-1/2 text-[11px] text-zinc-500"
                    style={{ top }}
                  >
                    {formatHourLabel(hour)}
                  </div>
                );
              })}
            </div>

            {dayCells.map((day) => (
              <div
                key={day.date}
                className="relative rounded-md border border-zinc-200 bg-white"
                style={{ height: `${timelineHeight}px` }}
              >
                {hourTicks.map((hour) => {
                  const top = (hour * 60 - timelineStart) * PIXELS_PER_MINUTE;
                  return (
                    <div key={hour} className="absolute left-0 right-0 border-t border-zinc-300" style={{ top }} />
                  );
                })}
                {hourTicks.slice(0, -1).map((hour) => {
                  const top = ((hour * 60 + 30) - timelineStart) * PIXELS_PER_MINUTE;
                  return (
                    <div
                      key={`half-${hour}`}
                      className="absolute left-0 right-0 border-t border-dashed border-zinc-200"
                      style={{ top }}
                    />
                  );
                })}

                {day.cells.map((cell) => {
                  const occupiedSlot = cell.state === "occupied" ? cell.slot : null;
                  const occupiedClass = occupiedSlot ? getOccupiedBlockClass(occupiedSlot) : "";
                  const occupiedStatus = occupiedSlot ? getOccupiedStatusLabel(occupiedSlot) : "";
                  const baseClass =
                    cell.state === "blocked"
                      ? "border-red-300 bg-red-100 text-red-900"
                      : cell.state === "available"
                        ? "border-zinc-300 bg-zinc-200 text-zinc-700"
                        : occupiedClass;

                  return (
                    <button
                      key={cell.key}
                      type="button"
                      className="absolute left-1 right-1 z-10"
                      style={{
                        top: `${cell.top}px`,
                        height: `${cell.height}px`,
                      }}
                      onClick={() => {
                        if (occupiedSlot) {
                          setSelectedSlotKey(occupiedSlot.slot_key);
                          setSelectedBookingId(occupiedSlot.bookings[0]?.id ?? null);
                          return;
                        }

                        if (cell.state === "available") {
                          window.dispatchEvent(
                            new CustomEvent("calendar:create-slot", {
                              detail: {
                                date: cell.date,
                                startTime: cell.start_time.slice(0, 5),
                                endTime: cell.end_time.slice(0, 5),
                              },
                            }),
                          );
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }}
                    >
                      <div
                        className={`h-full w-full overflow-hidden rounded-md border px-1.5 py-1 text-left text-[10px] ${baseClass} ${
                          occupiedSlot && occupiedSlot.slot_key === selectedSlot?.slot_key ? "ring-1 ring-zinc-900" : ""
                        }`}
                      >
                        {occupiedSlot ? (
                          <>
                            <p className="truncate font-semibold leading-tight">
                              {occupiedSlot.type === "individual"
                                ? occupiedSlot.bookings[0]?.alumno_name ?? "Alumno"
                                : `${occupiedSlot.occupied_count}/${occupiedSlot.capacity} alumnos`}
                            </p>
                            <p className="mt-0.5 truncate">
                              {occupiedSlot.type_label}
                              {occupiedSlot.type !== "individual"
                                ? ` (${occupiedSlot.occupied_count}/${occupiedSlot.capacity})`
                                : ""}
                            </p>
                            <div className="mt-0.5">
                              <span
                                className={`inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${getOccupiedStatusBadgeClass(occupiedSlot)}`}
                              >
                                {occupiedStatus}
                              </span>
                            </div>
                          </>
                        ) : cell.state === "blocked" ? (
                          <span className="inline-flex rounded-full border border-red-300 bg-red-200 px-1.5 py-0.5 text-[9px] font-semibold text-red-900">
                            Ausencia
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <aside className="sticky top-4 self-start rounded-xl border border-zinc-300 bg-white p-3">
          {selectedItem ? (
            <>
              <h3 className="text-sm font-semibold text-zinc-900">Detalle de clase</h3>
              {selectedSlot && selectedSlot.bookings.length > 1 ? (
                <div className="mt-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">Alumnos en este horario</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedSlot.bookings.map((booking) => (
                      <button
                        key={booking.id}
                        type="button"
                        onClick={() => setSelectedBookingId(booking.id)}
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                          selectedBookingId === booking.id
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-300 bg-white text-zinc-700"
                        }`}
                      >
                        {booking.alumno_name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="mt-2">
                <BookingDetailContent item={selectedItem} availabilityRanges={availability} />
              </div>
            </>
          ) : (
            <p className="text-sm text-zinc-600">Selecciona una clase del calendario para ver su detalle.</p>
          )}
        </aside>
      </div>
    </section>
  );
}
