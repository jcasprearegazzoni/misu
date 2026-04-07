"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatHourLabel, getBookingPosition, getHourTicks, getTimelineHeight } from "./time-utils";
import { groupDayBookingsBySlot } from "./slot-groups";
import { AvailabilityRange } from "./time-options";
import { CalendarBookingItem } from "./types";
import { MobileEventSheet } from "./mobile-event-sheet";

type MobileSlotVisual = {
  background: string;
  color: string;
  borderLeftColor: string;
};

type MobileAgendaProps = {
  days: Array<{
    date: string;
    items: CalendarBookingItem[];
  }>;
  selectedDay: string;
  availabilityRanges: AvailabilityRange[];
  dayLinks: Array<{ date: string; href: string }>;
  prevDayHref: string;
  nextDayHref: string;
};

function getSlotVisual(slot: ReturnType<typeof groupDayBookingsBySlot>[number]): MobileSlotVisual {
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

  return {
    background: "color-mix(in srgb, var(--success) 22%, var(--surface-1))",
    color: "var(--success)",
    borderLeftColor: "var(--success)",
  };
}

function formatDaySelectLabel(dateIso: string) {
  const date = new Date(`${dateIso}T00:00:00-03:00`);
  const weekday = new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  })
    .format(date)
    .replace(".", "");
  const dm = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1, 3)} ${dm}`;
}

export function MobileAgenda({
  days,
  selectedDay,
  availabilityRanges,
  dayLinks,
  prevDayHref,
  nextDayHref,
}: MobileAgendaProps) {
  const [openedSlotKey, setOpenedSlotKey] = useState<string | null>(null);

  const day = days.find((value) => value.date === selectedDay) ?? days[0];
  const slotGroups = useMemo(() => groupDayBookingsBySlot(day.items), [day.items]);
  const openedSlot = slotGroups.find((slot) => slot.slot_key === openedSlotKey) ?? null;
  const hourTicks = getHourTicks();
  const timelineHeight = getTimelineHeight();
  const hrefByDate = useMemo(() => new Map(dayLinks.map((entry) => [entry.date, entry.href])), [dayLinks]);

  return (
    <section className="mt-6 grid gap-3 md:hidden">
      <div className="card p-3">
        <div className="flex items-center gap-2">
          <Link
            href={prevDayHref}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--foreground)" }}
            aria-label="Día anterior"
          >
            {"<"}
          </Link>
          <select
            value={selectedDay}
            onChange={(event) => {
              const href = hrefByDate.get(event.target.value);
              if (href) {
                window.location.href = href;
              }
            }}
            className="h-9 min-w-0 flex-1 rounded-lg border px-2 text-sm font-semibold leading-5 outline-none"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
            aria-label="Seleccionar día"
          >
            {dayLinks.map((entry) => (
              <option key={entry.date} value={entry.date}>
                {formatDaySelectLabel(entry.date)}
              </option>
            ))}
          </select>
          <Link
            href={nextDayHref}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--foreground)" }}
            aria-label="Día siguiente"
          >
            {">"}
          </Link>
        </div>

        <div className="mt-3 grid grid-cols-[52px_minmax(0,1fr)] gap-2">
          <div className="relative" style={{ height: `${timelineHeight}px` }}>
            {hourTicks.map((hour) => {
              const hourValue = `${String(hour).padStart(2, "0")}:00:00`;
              const top = getBookingPosition(hourValue, hourValue, { minHeight: 0 }).top;
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

          <div
            className="relative rounded-md border"
            style={{ height: `${timelineHeight}px`, borderColor: "var(--border)", background: "var(--surface-1)" }}
          >
            {hourTicks.map((hour) => {
              const hourValue = `${String(hour).padStart(2, "0")}:00:00`;
              const top = getBookingPosition(hourValue, hourValue, { minHeight: 0 }).top;
              return <div key={hour} className="absolute left-0 right-0 border-t" style={{ top, borderColor: "var(--border)" }} />;
            })}
            {hourTicks.slice(0, -1).map((hour) => {
              const halfValue = `${String(hour).padStart(2, "0")}:30:00`;
              const top = getBookingPosition(halfValue, halfValue, { minHeight: 0 }).top;
              return (
                <div
                  key={`half-${hour}`}
                  className="absolute left-0 right-0 border-t border-dashed"
                  style={{ top, borderColor: "var(--border)" }}
                />
              );
            })}

            {slotGroups.map((slot) => {
              const visual = getSlotVisual(slot);
              const position = getBookingPosition(slot.start_time, slot.end_time, { minHeight: 56 });

              return (
                <button
                  key={slot.slot_key}
                  type="button"
                  onClick={() => setOpenedSlotKey(slot.slot_key)}
                  className="absolute left-0 right-0 z-10 text-left"
                  style={{ top: `${position.top}px`, height: `${position.height}px` }}
                >
                  <div
                    className="h-full w-full overflow-hidden rounded-none border-[2px] px-2 py-1.5"
                    style={{
                      background: visual.background,
                      color: visual.color,
                      borderTopColor: "color-mix(in srgb, currentColor 62%, var(--border))",
                      borderBottomColor: "color-mix(in srgb, currentColor 62%, var(--border))",
                      borderLeftColor: "color-mix(in srgb, currentColor 68%, var(--border))",
                      borderRightColor: "color-mix(in srgb, currentColor 68%, var(--border))",
                    }}
                  >
                    <p className="truncate text-xs font-semibold leading-snug">
                      {slot.type_label}
                      {slot.type !== "individual" ? ` (${slot.occupied_count}/${slot.capacity})` : ""}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] opacity-80">
                      {slot.type === "individual" ? slot.bookings[0]?.alumno_name ?? "Alumno" : "Clase grupal"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {slotGroups.length === 0 ? (
          <p className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
            Sin clases para este día.
          </p>
        ) : null}
      </div>

      <MobileEventSheet
        key={openedSlot?.slot_key ?? "empty"}
        slot={openedSlot}
        availabilityRanges={availabilityRanges}
        onClose={() => setOpenedSlotKey(null)}
      />
    </section>
  );
}
