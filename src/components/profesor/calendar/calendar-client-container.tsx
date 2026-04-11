"use client";

import { WeekTimeline } from "./week-timeline";
import type { CalendarBookingItem } from "./types";

type AlumnoOption = {
  user_id: string;
  name: string;
};

type CalendarClientContainerProps = {
  alumnos: AlumnoOption[];
  profesorSport: "tenis" | "padel" | "ambos" | null;
  deportes: Array<{
    key: "tenis" | "padel";
    label: string;
    href: string;
  }>;
  deporteActivo: "tenis" | "padel" | null;
  availabilityRanges: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    slot_duration_minutes: number;
  }>;
  days: Array<{
    date: string;
    items: CalendarBookingItem[];
  }>;
  blockedRanges: Array<{
    start_at: string;
    end_at: string;
  }>;
  view: "week" | "day";
  selectedDay: string;
  dayLinks: Array<{ date: string; href: string }>;
  weekPrevHref: string;
  weekTodayHref: string;
  weekNextHref: string;
  dayPrevHref: string;
  dayTodayHref: string;
  dayNextHref: string;
};

export function CalendarClientContainer({
  alumnos: _alumnos,
  profesorSport: _profesorSport,
  deportes,
  deporteActivo,
  availabilityRanges,
  days,
  blockedRanges,
  view,
  selectedDay,
  dayLinks,
  weekPrevHref,
  weekTodayHref,
  weekNextHref,
  dayPrevHref,
  dayTodayHref,
  dayNextHref,
}: CalendarClientContainerProps) {
  return (
    <WeekTimeline
      deportes={deportes}
      deporteActivo={deporteActivo}
      days={days}
      availability={availabilityRanges}
      blockedRanges={blockedRanges}
      view={view}
      selectedDay={selectedDay}
      dayLinks={dayLinks}
      weekPrevHref={weekPrevHref}
      weekTodayHref={weekTodayHref}
      weekNextHref={weekNextHref}
      dayPrevHref={dayPrevHref}
      dayTodayHref={dayTodayHref}
      dayNextHref={dayNextHref}
    />
  );
}

