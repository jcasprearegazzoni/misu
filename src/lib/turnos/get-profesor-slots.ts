import { formatUserDate } from "@/lib/format/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateSlots } from "@/lib/turnos/generate-slots";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type AvailabilityRow = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  club_id?: number | null;
  club_nombre?: string | null;
};

type BlockedDateRow = {
  start_at: string;
  end_at: string;
};

type OccupancyRow = {
  date: string;
  start_time: string;
  end_time: string;
  type: "individual" | "dobles" | "trio" | "grupal";
  active_count: number;
};

type SlotType = OccupancyRow["type"];
const typeLabel: Record<SlotType, string> = {
  individual: "Individual",
  dobles: "Dobles",
  trio: "Trio",
  grupal: "Grupal",
};

export type ProfesorSlotItem = {
  slotKey: string;
  date: string;
  startTime: string;
  endTime: string;
  timeLabel: string;
  clubNombre: string | null;
  slotInfoLabel: string;
  fixedType: SlotType | null;
};

export type ProfesorSlotsDayGroup = {
  key: string;
  label: string;
  items: ProfesorSlotItem[];
};

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

function getCapacityByType(type: SlotType) {
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

function getOccupancyKey(date: string, startTime: string, endTime: string) {
  return `${date}|${normalizeTimeKey(startTime)}|${normalizeTimeKey(endTime)}`;
}

export function getTodayDateIso() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now);
}

export function parseWeekOffset(value?: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return 0;
  }
  return Math.min(52, Math.max(0, parsed));
}

export function getWeekBounds(weekOffset: number) {
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

function groupSlotsByDay(
  slots: Array<{
    startAt: Date;
    dateKey: string;
    startTimeKey: string;
    endTimeKey: string;
    startLabel: string;
    endLabel: string;
    clubNombre: string | null;
  }>,
  weekDates: string[],
  slotOccupancyMap: Map<string, OccupancyRow>,
) {
  const groupsMap = new Map<string, ProfesorSlotsDayGroup>();

  for (const date of weekDates) {
    groupsMap.set(date, {
      key: date,
      label: formatUserDate(date),
      items: [],
    });
  }

  for (const slot of slots) {
    const occupancy = slotOccupancyMap.get(getOccupancyKey(slot.dateKey, slot.startTimeKey, slot.endTimeKey));
    const capacity = occupancy ? getCapacityByType(occupancy.type) : null;
    const slotInfoLabel = occupancy
      ? `Tipo fijo: ${typeLabel[occupancy.type]} (${occupancy.active_count}/${capacity})`
      : "Libre";

    groupsMap.get(slot.dateKey)?.items.push({
      slotKey: slot.startAt.toISOString(),
      date: slot.dateKey,
      startTime: slot.startTimeKey,
      endTime: slot.endTimeKey,
      timeLabel: `${slot.startLabel} - ${slot.endLabel}`,
      clubNombre: slot.clubNombre ?? null,
      slotInfoLabel,
      fixedType: occupancy?.type ?? null,
    });
  }

  return weekDates.map((date) => groupsMap.get(date)!);
}

export async function getProfesorSlotsByWeek(params: {
  supabase: SupabaseServerClient;
  profesorId: string;
  weekOffset: number;
  selectedDayParam?: string;
}) {
  const { supabase, profesorId, weekOffset, selectedDayParam } = params;
  const todayIso = getTodayDateIso();
  const { weekDates, start, endExclusive } = getWeekBounds(weekOffset);
  const selectedDay = weekDates.includes(selectedDayParam ?? "")
    ? (selectedDayParam as string)
    : weekOffset === 0 && weekDates.includes(todayIso)
      ? todayIso
      : weekDates[0];

  const [availabilityResult, blockedDatesResult, occupancyResult] = await Promise.all([
    supabase.rpc("get_profesor_weekly_availability", {
      p_profesor_id: profesorId,
    }),
    supabase.rpc("get_profesor_blocked_ranges", {
      p_profesor_id: profesorId,
      p_date_from: start,
      p_date_to: endExclusive,
    }),
    supabase.rpc("get_active_slot_occupancy", {
      p_profesor_id: profesorId,
      p_date_from: start,
      p_date_to: endExclusive,
    }),
  ]);

  if (availabilityResult.error || blockedDatesResult.error || occupancyResult.error) {
    throw new Error("No se pudieron cargar los slots del profesor.");
  }

  const availability = (availabilityResult.data ?? []) as AvailabilityRow[];
  const blockedDates = (blockedDatesResult.data ?? []) as BlockedDateRow[];
  const slotOccupancy = (occupancyResult.data ?? []) as OccupancyRow[];
  const slotOccupancyMap = new Map(
    slotOccupancy.map((item) => [getOccupancyKey(item.date, item.start_time, item.end_time), item]),
  );

  const slots = generateSlots({
    availability,
    blockedDates,
    slotOccupancy,
    daysAhead: 7,
    now: new Date(),
    startDate: new Date(`${start}T00:00:00-03:00`),
  });

  const groupedSlots = groupSlotsByDay(
    slots.map((slot) => ({
      startAt: slot.startAt,
      dateKey: slot.dateKey,
      startTimeKey: slot.startTimeKey,
      endTimeKey: slot.endTimeKey,
      startLabel: slot.startLabel,
      endLabel: slot.endLabel,
      clubNombre: slot.clubNombre ?? null,
    })),
    weekDates,
    slotOccupancyMap,
  );

  const selectedGroup = groupedSlots.find((group) => group.key === selectedDay) ?? groupedSlots[0];

  return {
    weekOffset,
    todayIso,
    weekDates,
    selectedDay,
    groupedSlots,
    selectedGroup,
  };
}
