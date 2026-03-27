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
  const flatItems = useMemo(() => days.flatMap((day) => day.items), [days]);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(flatItems[0]?.id ?? null);
  const selectedItem = flatItems.find((item) => item.id === selectedBookingId) ?? null;

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

            {days.map((day) => (
              <div
                key={day.date}
                className="relative overflow-hidden rounded-md border border-zinc-200 bg-white"
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

                {day.items.map((item) => {
                  const position = getBookingPosition(item.start_time, item.end_time, { minHeight: 64 });
                  return (
                    <div
                      key={item.id}
                      className="absolute left-1 right-1 z-10"
                      style={{
                        top: `${position.top}px`,
                        height: `${position.height}px`,
                      }}
                    >
                      <BookingBlock
                        item={item}
                        compact
                        isSelected={item.id === selectedBookingId}
                        onSelect={setSelectedBookingId}
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
