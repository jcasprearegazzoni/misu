"use client";

import { useState } from "react";
import { NewManualClassPanel } from "./new-manual-class-panel";
import { WeekTimeline } from "./week-timeline";
import type { CalendarBookingItem } from "./types";

type AlumnoOption = {
  user_id: string;
  name: string;
};

type ClubOption = {
  id: number;
  nombre: string;
  canchas: Array<{ id: number; nombre: string; deporte: string }>;
};

type CalendarPrefill = {
  date: string;
  startTime: string;
  endTime: string;
};

type CalendarClientContainerProps = {
  alumnos: AlumnoOption[];
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
  nextHref: string;
  clubOptions: ClubOption[];
};

export function CalendarClientContainer({
  alumnos,
  availabilityRanges,
  days,
  blockedRanges,
  selectedDay,
  dayLinks,
  prevHref,
  nextHref,
  clubOptions,
}: CalendarClientContainerProps) {
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [prefill, setPrefill] = useState<CalendarPrefill | null>(null);

  return (
    <>
      <NewManualClassPanel
        alumnos={alumnos}
        availabilityRanges={availabilityRanges}
        isOpen={isManualOpen}
        onOpenChange={setIsManualOpen}
        prefill={prefill}
        onConsumePrefill={() => setPrefill(null)}
        clubOptions={clubOptions}
      />
      <WeekTimeline
        days={days}
        availability={availabilityRanges}
        blockedRanges={blockedRanges}
        selectedDay={selectedDay}
        dayLinks={dayLinks}
        prevHref={prevHref}
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
