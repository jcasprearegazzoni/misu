import { FrequentScheduleManager } from "./frequent-schedule-manager";

type AvailabilityRow = {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  club_id: number | null;
};

type HorarioFrecuenteTabProps = {
  availability: AvailabilityRow[];
  clubs: Array<{ id: number; nombre: string }>;
};

export function HorarioFrecuenteTab({ availability, clubs }: HorarioFrecuenteTabProps) {
  return (
    <section className="mt-4">
      <FrequentScheduleManager availability={availability} clubs={clubs} />
    </section>
  );
}
