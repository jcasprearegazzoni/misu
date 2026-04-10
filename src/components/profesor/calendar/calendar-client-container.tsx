"use client";

import { useState } from "react";
import { NewManualClassPanel } from "./new-manual-class-panel";
import { WeekTimeline } from "./week-timeline";
import type { CalendarBookingItem } from "./types";

type AlumnoOption = {
  user_id: string;
  name: string;
};

type CalendarPrefill = {
  date: string;
  startTime: string;
  endTime: string;
};

type CalendarClientContainerProps = {
  alumnos: AlumnoOption[];
  profesorSport: "tenis" | "padel" | "ambos" | null;
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
  selectedDay: string;
  dayLinks: Array<{ date: string; href: string }>;
  prevHref: string;
  todayHref: string;
  nextHref: string;
};

export function CalendarClientContainer({
  alumnos,
  profesorSport,
  availabilityRanges,
  days,
  blockedRanges,
  selectedDay,
  dayLinks,
  prevHref,
  todayHref,
  nextHref,
}: CalendarClientContainerProps) {
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [prefill, setPrefill] = useState<CalendarPrefill | null>(null);

  return (
    <>
      <NewManualClassPanel
        alumnos={alumnos}
        profesorSport={profesorSport}
        availabilityRanges={availabilityRanges}
        isOpen={isManualOpen}
        onOpenChange={setIsManualOpen}
        prefill={prefill}
        onConsumePrefill={() => setPrefill(null)}
      />
      <WeekTimeline
        days={days}
        availability={availabilityRanges}
        blockedRanges={blockedRanges}
        selectedDay={selectedDay}
        dayLinks={dayLinks}
        prevHref={prevHref}
        todayHref={todayHref}
        nextHref={nextHref}
        onCreateSlot={(slot) => {
          setPrefill(slot);
          setIsManualOpen(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </>
  );
}
