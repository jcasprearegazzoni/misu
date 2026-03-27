import { FrequentScheduleManager } from "./frequent-schedule-manager";

type AvailabilityRow = {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
};

type HorarioFrecuenteTabProps = {
  availability: AvailabilityRow[];
};

export function HorarioFrecuenteTab({ availability }: HorarioFrecuenteTabProps) {
  return (
    <section className="mt-4">
      <FrequentScheduleManager availability={availability} />
    </section>
  );
}
