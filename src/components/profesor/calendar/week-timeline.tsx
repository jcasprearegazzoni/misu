"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CALENDAR_END_HOUR,
  CALENDAR_START_HOUR,
  formatHourLabel,
  getBookingPosition,
  getHourTicks,
  getTimelineStartMinute,
  parseTimeToMinutes,
  PIXELS_PER_MINUTE,
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
  selectedDay: string;
  dayLinks: Array<{ date: string; href: string }>;
  prevHref: string;
  nextHref: string;
  onCreateSlot?: (slot: { date: string; startTime: string; endTime: string }) => void;
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

function getOccupiedEventVisual(slot: NonNullable<CalendarCell["slot"]>) {
  if (slot.is_finalized) {
    if (slot.has_financial_pending) {
      return {
        background: "color-mix(in srgb, var(--warning) 22%, var(--surface-1))",
        color: "var(--warning)",
        borderLeftColor: "var(--warning)",
      };
    }

    return {
      background: "color-mix(in srgb, var(--success) 22%, var(--surface-1))",
      color: "var(--success)",
      borderLeftColor: "var(--success)",
    };
  }

  if (slot.status === "pendiente") {
    return {
      background: "color-mix(in srgb, var(--warning) 22%, var(--surface-1))",
      color: "var(--warning)",
      borderLeftColor: "var(--warning)",
    };
  }

  if (slot.occupied_count >= slot.capacity) {
    return {
      background: "color-mix(in srgb, var(--success) 22%, var(--surface-1))",
      color: "var(--success)",
      borderLeftColor: "var(--success)",
    };
  }

  return {
    background: "color-mix(in srgb, var(--warning) 22%, var(--surface-1))",
    color: "var(--warning)",
    borderLeftColor: "var(--warning)",
  };
}

export function WeekTimeline({
  days,
  availability,
  blockedRanges,
  selectedDay,
  dayLinks,
  prevHref,
  nextHref,
  onCreateSlot,
}: WeekTimelineProps) {
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
  const [isDetailOpen, setIsDetailOpen] = useState(true);

  const selectedItem =
    selectedSlot?.bookings.find((booking) => booking.id === selectedBookingId) ??
    selectedSlot?.bookings[0] ??
    null;

  const dayCells = useMemo(() => {
    return daySlots.map((day) => {
      const slotMap = new Map(
        day.slots.map((slot) => [normalizeSlotKey(day.date, slot.start_time, slot.end_time), slot]),
      );
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

          const position = getBookingPosition(hhmmToTimeValue(slotStart), hhmmToTimeValue(slotEnd), {
            minHeight: 0,
          });

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

  const monthLabel = formatMonthLabel(days[0]?.date ?? new Date().toISOString().slice(0, 10));

  return (
    <section className="mt-6 hidden md:block">
      <div className="card relative p-3">
        <div className={selectedItem && isDetailOpen ? "pr-[298px]" : ""}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-3xl font-bold leading-none" style={{ color: "var(--foreground)" }}>
              {monthLabel}
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={prevHref}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border text-base font-semibold transition"
                style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--foreground)" }}
                aria-label="Semana anterior"
              >
                {"<"}
              </Link>
              <Link
                href={nextHref}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border text-base font-semibold transition"
                style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--foreground)" }}
                aria-label="Semana siguiente"
              >
                {">"}
              </Link>
              {selectedItem ? (
                <button
                  type="button"
                  onClick={() => setIsDetailOpen((prev) => !prev)}
                  className="inline-flex h-8 items-center rounded-full border px-2.5 text-xs font-semibold transition"
                  style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--muted)" }}
                >
                  {isDetailOpen ? "Ocultar detalle" : "Ver detalle"}
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-[58px_repeat(7,minmax(0,1fr))] gap-2">
            <div />
            {days.map((day) => {
              const chip = formatDayChip(day.date);
              return (
                <div
                  key={`header-${day.date}`}
                  className="rounded-lg border px-1 py-0.5 text-center"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface-2)",
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

          <div className="mt-2 grid grid-cols-[58px_repeat(7,minmax(0,1fr))] gap-2">
            <div className="relative" style={{ height: `${timelineHeight}px` }}>
              {hourTicks.map((hour) => {
                const top = (hour * 60 - timelineStart) * PIXELS_PER_MINUTE;
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

            {dayCells.map((day) => (
              <div
                key={day.date}
                className="relative rounded-md border"
                style={{ height: `${timelineHeight}px`, borderColor: "var(--border)", background: "var(--surface-1)" }}
              >
                {hourTicks.map((hour) => {
                  const top = (hour * 60 - timelineStart) * PIXELS_PER_MINUTE;
                  return <div key={hour} className="absolute left-0 right-0 border-t" style={{ top, borderColor: "var(--border)" }} />;
                })}
                {hourTicks.slice(0, -1).map((hour) => {
                  const top = (hour * 60 + 30 - timelineStart) * PIXELS_PER_MINUTE;
                  return (
                    <div
                      key={`half-${hour}`}
                      className="absolute left-0 right-0 border-t border-dashed"
                      style={{ top, borderColor: "var(--border)" }}
                    />
                  );
                })}

                {day.cells.map((cell) => {
                  const occupiedSlot = cell.state === "occupied" ? cell.slot : null;
                  const occupiedEventVisual = occupiedSlot ? getOccupiedEventVisual(occupiedSlot) : null;

                  return (
                    <button
                      key={cell.key}
                      type="button"
                      className="absolute left-0 right-0 z-10"
                      style={{
                        top: `${cell.top}px`,
                        height: `${cell.height}px`,
                      }}
                      onClick={() => {
                        if (occupiedSlot) {
                          setSelectedSlotKey(occupiedSlot.slot_key);
                          setSelectedBookingId(occupiedSlot.bookings[0]?.id ?? null);
                          setIsDetailOpen(true);
                          return;
                        }

                        if (cell.state === "available") {
                          onCreateSlot?.({
                            date: cell.date,
                            startTime: cell.start_time.slice(0, 5),
                            endTime: cell.end_time.slice(0, 5),
                          });
                        }
                      }}
                    >
                      <div
                        className={`h-full w-full overflow-hidden text-left ${
                          occupiedSlot || cell.state === "blocked"
                            ? "rounded-none border-[2px] px-2 py-1.5"
                            : "rounded-none border-none"
                        }`}
                        style={
                          occupiedSlot
                            ? {
                                background:
                                  occupiedSlot.slot_key === selectedSlot?.slot_key
                                    ? `color-mix(in srgb, ${occupiedEventVisual?.background ?? "var(--surface-2)"} 78%, var(--foreground) 22%)`
                                    : occupiedEventVisual?.background,
                                color: occupiedEventVisual?.color,
                                borderTopColor:
                                  occupiedSlot.slot_key === selectedSlot?.slot_key
                                    ? "color-mix(in srgb, currentColor 80%, var(--foreground) 20%)"
                                    : "color-mix(in srgb, currentColor 62%, var(--border))",
                                borderBottomColor:
                                  occupiedSlot.slot_key === selectedSlot?.slot_key
                                    ? "color-mix(in srgb, currentColor 80%, var(--foreground) 20%)"
                                    : "color-mix(in srgb, currentColor 62%, var(--border))",
                                borderLeftColor: "color-mix(in srgb, currentColor 68%, var(--border))",
                                borderRightColor: "color-mix(in srgb, currentColor 68%, var(--border))",
                              }
                            : cell.state === "blocked"
                              ? {
                                  background: "color-mix(in srgb, var(--error) 20%, var(--surface-1))",
                                  color: "var(--error)",
                                  borderTopColor: "color-mix(in srgb, var(--error) 62%, var(--border))",
                                  borderBottomColor: "color-mix(in srgb, var(--error) 62%, var(--border))",
                                  borderLeftColor: "color-mix(in srgb, var(--error) 68%, var(--border))",
                                  borderRightColor: "color-mix(in srgb, var(--error) 68%, var(--border))",
                                }
                              : {
                                  background: "transparent",
                                }
                        }
                      >
                        {occupiedSlot ? (
                          <>
                            <p className="truncate text-xs font-semibold leading-snug">
                              {occupiedSlot.type_label}
                              {occupiedSlot.type !== "individual"
                                ? ` (${occupiedSlot.occupied_count}/${occupiedSlot.capacity})`
                                : ""}
                            </p>
                            <p className="mt-0.5 truncate text-[10px] opacity-80">
                              {occupiedSlot.type === "individual"
                                ? occupiedSlot.bookings[0]?.alumno_name ?? "Alumno"
                                : "Clase grupal"}
                            </p>
                          </>
                        ) : cell.state === "blocked" ? (
                          <p className="text-xs font-semibold leading-snug">Ausencia</p>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        {selectedItem && isDetailOpen ? (
          <aside className="absolute bottom-3 right-3 top-3 w-[280px] overflow-y-auto pl-3">
            <BookingDetailContent
              item={selectedItem}
              availabilityRanges={availability}
              timeRange={{ start: selectedItem.start_time, end: selectedItem.end_time }}
              slotBookings={selectedSlot?.bookings}
              selectedBookingId={selectedBookingId}
              onSelectBooking={(bookingId) => setSelectedBookingId(bookingId)}
            />
          </aside>
        ) : null}
      </div>
    </section>
  );
}
