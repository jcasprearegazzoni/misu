import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateSlots } from "@/lib/turnos/generate-slots";

type AvailabilityRow = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
};

type BlockedDateRow = {
  start_at: string;
  end_at: string;
};

type BookingRow = {
  date: string;
  start_time: string;
  end_time: string;
  type: "individual" | "dobles" | "trio" | "grupal";
  active_count: number;
};

function getDateRangeForNextDays(daysAhead: number) {
  const today = new Date();
  const from = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(today);
  const toDate = new Date(today.getTime() + (daysAhead - 1) * 24 * 60 * 60 * 1000);
  const to = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(toDate);

  return { from, to };
}

type DayGroup = {
  key: string;
  label: string;
  items: Array<{
    slotKey: string;
    timeLabel: string;
  }>;
};

function groupSlotsByDay(
  slots: Array<{
    startAt: Date;
    startLabel: string;
    endLabel: string;
    dateLabel: string;
  }>,
) {
  const groupsMap = new Map<string, DayGroup>();

  for (const slot of slots) {
    const dayKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(slot.startAt);

    if (!groupsMap.has(dayKey)) {
      groupsMap.set(dayKey, {
        key: dayKey,
        label: slot.dateLabel,
        items: [],
      });
    }

    groupsMap.get(dayKey)?.items.push({
      slotKey: slot.startAt.toISOString(),
      timeLabel: `${slot.startLabel} - ${slot.endLabel}`,
    });
  }

  return Array.from(groupsMap.values());
}

export default async function SlotsProfesorPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "profesor") {
    redirect("/dashboard/alumno");
  }

  const supabase = await createSupabaseServerClient();

  const { data: availabilityData } = await supabase
    .from("availability")
    .select("day_of_week, start_time, end_time, slot_duration_minutes")
    .eq("profesor_id", profile.user_id);

  const { data: blockedDatesData } = await supabase
    .from("blocked_dates")
    .select("start_at, end_at")
    .eq("profesor_id", profile.user_id);

  const { from, to } = getDateRangeForNextDays(30);
  const { data: bookingsData } = await supabase.rpc("get_active_slot_occupancy", {
    p_profesor_id: profile.user_id,
    p_date_from: from,
    p_date_to: to,
  });

  const availability = (availabilityData ?? []) as AvailabilityRow[];
  const blockedDates = (blockedDatesData ?? []) as BlockedDateRow[];
  const slotOccupancy = (bookingsData ?? []) as BookingRow[];
  const slots = generateSlots({
    availability,
    blockedDates,
    slotOccupancy,
    daysAhead: 30,
  });
  const groupedSlots = groupSlotsByDay(slots);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-3 py-6 sm:px-4 sm:py-8">
      <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl">Slots disponibles</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Horarios disponibles agrupados por dia para los proximos 30 dias.
      </p>

      {slots.length === 0 ? (
        <p className="mt-6 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-700">
          No hay slots disponibles en los proximos 30 dias.
        </p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {groupedSlots.map((dayGroup) => (
            <li key={dayGroup.key} className="rounded-xl border border-zinc-300 bg-white px-4 py-3">
              <p className="text-sm font-semibold text-zinc-900">{dayGroup.label}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {dayGroup.items.map((item) => (
                  <span
                    key={item.slotKey}
                    className="inline-flex rounded-md border border-zinc-400 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-900"
                  >
                    {item.timeLabel}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
