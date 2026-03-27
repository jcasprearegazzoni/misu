import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateSlots } from "@/lib/turnos/generate-slots";
import { WeekCalendarStrip } from "@/components/calendar/week-calendar-strip";
import { ReserveSlotForm } from "./reserve-slot-form";

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

const typeLabel: Record<BookingRow["type"], string> = {
  individual: "Individual",
  dobles: "Dobles",
  trio: "Trio",
  grupal: "Grupal",
};

function getWeekBounds(weekOffset: number) {
  const now = new Date();
  const local = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = local.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(local);
  monday.setDate(local.getDate() + mondayOffset);
  monday.setDate(monday.getDate() + weekOffset * 7);

  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);

  const weekDates: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    weekDates.push(`${y}-${m}-${d}`);
  }

  const start = weekDates[0];
  const nextY = nextMonday.getFullYear();
  const nextM = String(nextMonday.getMonth() + 1).padStart(2, "0");
  const nextD = String(nextMonday.getDate()).padStart(2, "0");
  const endExclusive = `${nextY}-${nextM}-${nextD}`;

  return { weekDates, start, endExclusive };
}

function parseWeekOffset(value?: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return 0;
  }
  return Math.min(52, Math.max(0, parsed));
}

type DayGroup = {
  key: string;
  label: string;
  items: Array<{
    slotKey: string;
    date: string;
    startTime: string;
    endTime: string;
    timeLabel: string;
    slotInfoLabel: string;
    fixedType: "individual" | "dobles" | "trio" | "grupal" | null;
  }>;
};

function getCapacityByType(type: "individual" | "dobles" | "trio" | "grupal") {
  if (type === "individual") {
    return 1;
  }

  if (type === "dobles") {
    return 2;
  }

  if (type === "trio") {
    return 3;
  }

  return 4;
}

function normalizeTimeKey(value: string) {
  const normalized = value.trim();
  if (normalized.length >= 8) {
    return normalized.slice(0, 8);
  }

  if (normalized.length === 5) {
    return `${normalized}:00`;
  }

  return normalized;
}

function getOccupancyKey(date: string, startTime: string, endTime: string) {
  return `${date}|${normalizeTimeKey(startTime)}|${normalizeTimeKey(endTime)}`;
}

function groupSlotsByDay(
  slots: Array<{
    startAt: Date;
    dateLabel: string;
    dateKey: string;
    startTimeKey: string;
    endTimeKey: string;
    startLabel: string;
    endLabel: string;
  }>,
  slotOccupancyMap: Map<string, BookingRow>,
) {
  const groupsMap = new Map<string, DayGroup>();

  for (const slot of slots) {
    const occupancy = slotOccupancyMap.get(
      getOccupancyKey(slot.dateKey, slot.startTimeKey, slot.endTimeKey),
    );
    const capacity = occupancy ? getCapacityByType(occupancy.type) : null;
    const slotInfoLabel = occupancy
      ? `Tipo fijo: ${typeLabel[occupancy.type]} (${occupancy.active_count}/${capacity})`
      : "Libre";

    if (!groupsMap.has(slot.dateKey)) {
      groupsMap.set(slot.dateKey, {
        key: slot.dateKey,
        label: slot.dateLabel,
        items: [],
      });
    }

    groupsMap.get(slot.dateKey)?.items.push({
      slotKey: slot.startAt.toISOString(),
      date: slot.dateKey,
      startTime: slot.startTimeKey,
      endTime: slot.endTimeKey,
      timeLabel: `${slot.startLabel} - ${slot.endLabel}`,
      slotInfoLabel,
      fixedType: occupancy?.type ?? null,
    });
  }

  return Array.from(groupsMap.values());
}

function getSlotVisualState(slotInfoLabel: string) {
  if (slotInfoLabel === "Libre") {
    return {
      label: "Disponible",
      className: "border-emerald-300 bg-emerald-50 text-emerald-800",
    };
  }

  return {
    label: "Con modalidad fija",
    className: "border-amber-300 bg-amber-50 text-amber-800",
  };
}

export default async function AlumnoProfesorSlotsPage({
  params,
  searchParams,
}: {
  params: Promise<{ profesorId: string }>;
  searchParams?: Promise<{ weekOffset?: string; day?: string }>;
}) {
  const { profesorId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const weekOffset = parseWeekOffset(resolvedSearchParams?.weekOffset);
  const { weekDates, start, endExclusive } = getWeekBounds(weekOffset);
  const selectedDay = weekDates.includes(resolvedSearchParams?.day ?? "")
    ? (resolvedSearchParams?.day as string)
    : weekDates[0];
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: alumnoProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!alumnoProfile || alumnoProfile.role !== "alumno") {
    redirect("/dashboard/profesor");
  }

  const { data: profesorProfile } = await supabase
    .from("profiles")
    .select("user_id, role, name")
    .eq("user_id", profesorId)
    .single();

  if (!profesorProfile || profesorProfile.role !== "profesor") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-10">
        <h1 className="text-2xl font-semibold text-zinc-900">Reservar clase</h1>
        <p className="mt-4 text-sm text-zinc-700">No se encontro el profesor solicitado.</p>
      </main>
    );
  }

  const { data: availabilityData } = await supabase.rpc("get_profesor_weekly_availability", {
    p_profesor_id: profesorId,
  });
  const { data: blockedDatesData } = await supabase.rpc("get_profesor_blocked_ranges", {
    p_profesor_id: profesorId,
    p_date_from: start,
    p_date_to: endExclusive,
  });
  const { data: bookingsData } = await supabase.rpc("get_active_slot_occupancy", {
    p_profesor_id: profesorId,
    p_date_from: start,
    p_date_to: endExclusive,
  });

  const availability = (availabilityData ?? []) as AvailabilityRow[];
  const blockedDates = (blockedDatesData ?? []) as BlockedDateRow[];
  const slotOccupancy = (bookingsData ?? []) as BookingRow[];
  const slotOccupancyMap = new Map(
    slotOccupancy.map((item) => [
      getOccupancyKey(item.date, item.start_time, item.end_time),
      item,
    ]),
  );
  const slots = generateSlots({
    availability,
    blockedDates,
    slotOccupancy,
    daysAhead: 7,
    now: new Date(`${start}T00:00:00-03:00`),
  });
  const groupedSlots = groupSlotsByDay(slots, slotOccupancyMap);
  const selectedGroup = groupedSlots.find((group) => group.key === selectedDay);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Reservar clase</h1>
      <p className="mt-2 text-sm text-zinc-700">Profesor: {profesorProfile.name}</p>
      <p className="mt-1 text-sm text-zinc-600">
        Elige fecha, horario y tipo de clase. Veras disponibilidad de los proximos 30 dias.
      </p>

      <div className="mt-4">
        <Link
          href="/dashboard/alumno/profesores"
          className="inline-flex rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-100"
        >
          Cambiar profesor
        </Link>
      </div>

      <WeekCalendarStrip
        weekDates={weekDates}
        selectedDay={selectedDay}
        tone="booking"
        subtitle="Semana para reservar"
        prevHref={`/alumno/profesores/${profesorId}/slots?weekOffset=${Math.max(0, weekOffset - 1)}&day=${selectedDay}`}
        nextHref={`/alumno/profesores/${profesorId}/slots?weekOffset=${weekOffset + 1}&day=${selectedDay}`}
        dayHrefBuilder={(date) => `/alumno/profesores/${profesorId}/slots?weekOffset=${weekOffset}&day=${date}`}
        resetHref={weekOffset !== 0 ? `/alumno/profesores/${profesorId}/slots?weekOffset=0&day=${weekDates[0]}` : undefined}
      />

      {!selectedGroup || selectedGroup.items.length === 0 ? (
        <p className="mt-6 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-700">
          No hay clases disponibles para este dia.
        </p>
      ) : (
        <section className="mt-6 rounded-xl border border-zinc-300 bg-white px-4 py-3">
          <p className="text-sm font-semibold text-zinc-900">{selectedGroup.label}</p>
          <div className="mt-3 grid gap-2">
            {selectedGroup.items.map((item) => (
              <div
                key={item.slotKey}
                className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{item.timeLabel}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getSlotVisualState(item.slotInfoLabel).className}`}
                      >
                        {getSlotVisualState(item.slotInfoLabel).label}
                      </span>
                      <span className="text-xs text-zinc-600">{item.slotInfoLabel}</span>
                    </div>
                  </div>

                  <div className="min-w-40">
                    <ReserveSlotForm
                      profesorId={profesorId}
                      date={item.date}
                      startTime={item.startTime}
                      endTime={item.endTime}
                      fixedType={item.fixedType}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
