"use client";

import { useMemo, useState } from "react";
import { formatUserDate } from "@/lib/format/date";
import {
  formatHourLabel,
  getBookingPosition,
  getHourTicks,
  getTimelineHeight,
  getTimelineStartMinute,
  PIXELS_PER_MINUTE,
} from "./time-utils";
import { CalendarBookingItem } from "./types";
import { BookingBlock } from "./booking-block";
import { BookingDetailContent } from "./booking-detail-content";
import { groupDayBookingsBySlot } from "./slot-groups";

type WeekTimelineProps = {
  days: Array<{
    date: string;
    items: CalendarBookingItem[];
  }>;
};

export function WeekTimeline({ days }: WeekTimelineProps) {
  const hourTicks = getHourTicks();
  const timelineHeight = getTimelineHeight();
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

            {daySlots.map((day) => (
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

                {day.slots.map((slot) => {
                  const position = getBookingPosition(slot.start_time, slot.end_time, { minHeight: 64 });
                  return (
                    <div
                      key={slot.slot_key}
                      className="absolute left-1 right-1 z-10"
                      style={{
                        top: `${position.top}px`,
                        height: `${position.height}px`,
                      }}
                    >
                      <BookingBlock
                        slot={slot}
                        compact
                        isSelected={slot.slot_key === selectedSlot?.slot_key}
                        onSelect={() => {
                          setSelectedSlotKey(slot.slot_key);
                          setSelectedBookingId(slot.bookings[0]?.id ?? null);
                        }}
                      />
                    </div>
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
                <BookingDetailContent item={selectedItem} />
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
