import Link from "next/link";
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

type DayTimelineProps = {
  days: Array<{
    date: string;
    items: CalendarBookingItem[];
  }>;
  selectedDay: string;
  activeFilter: "pendientes" | "confirmadas" | "canceladas" | "todas";
};

function getDayShortLabel(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(parsed);
}

export function DayTimeline({ days, selectedDay, activeFilter }: DayTimelineProps) {
  const hourTicks = getHourTicks();
  const timelineHeight = getTimelineHeight();
  const timelineStart = getTimelineStartMinute();
  const day = days.find((value) => value.date === selectedDay) ?? days[0];

  return (
    <section className="mt-6 grid gap-3 md:hidden">
      <div className="flex flex-wrap gap-2">
        {days.map((value) => (
          <Link
            key={value.date}
            href={`/dashboard/profesor/calendario?filter=${activeFilter}&day=${value.date}`}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              day.date === value.date
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-300 bg-white text-zinc-800"
            }`}
          >
            {getDayShortLabel(value.date)}
          </Link>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-300 bg-white p-2">
        <p className="px-1 text-sm font-semibold text-zinc-900">{formatUserDate(day.date)}</p>
        <div className="mt-2 grid grid-cols-[48px_minmax(0,1fr)] gap-2">
          <div className="relative" style={{ height: `${timelineHeight}px` }}>
            {hourTicks.map((hour) => {
              const top = (hour * 60 - timelineStart) * PIXELS_PER_MINUTE;
              return (
                <div key={hour} className="absolute left-0 right-0 -translate-y-1/2 text-[10px] text-zinc-500" style={{ top }}>
                  {formatHourLabel(hour)}
                </div>
              );
            })}
          </div>

          <div className="relative overflow-hidden rounded-md border border-zinc-200 bg-zinc-50" style={{ height: `${timelineHeight}px` }}>
            {hourTicks.map((hour) => {
              const top = (hour * 60 - timelineStart) * PIXELS_PER_MINUTE;
              return <div key={hour} className="absolute left-0 right-0 border-t border-zinc-200" style={{ top }} />;
            })}

            {day.items.map((item) => {
              const position = getBookingPosition(item.start_time, item.end_time, { minHeight: 76 });
              return (
                <div
                  key={item.id}
                  className="absolute left-1 right-1 z-10"
                  style={{
                    top: `${position.top}px`,
                    height: `${position.height}px`,
                  }}
                >
                  <BookingBlock item={item} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
