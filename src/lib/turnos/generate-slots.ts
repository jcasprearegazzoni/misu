const ARGENTINA_TIMEZONE = "America/Argentina/Buenos_Aires";
const ARGENTINA_OFFSET = "-03:00";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

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

type SlotOccupancyRow = {
  date: string;
  start_time: string;
  end_time: string;
  type: "individual" | "dobles" | "trio" | "grupal";
  active_count: number;
};

export type GeneratedSlot = {
  startAt: Date;
  endAt: Date;
  dateLabel: string;
  startLabel: string;
  endLabel: string;
  dateKey: string;
  startTimeKey: string;
  endTimeKey: string;
  clubNombre: string | null;
};

function getArgentinaDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: ARGENTINA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return { year, month, day };
}

function getArgentinaDayOfWeek(date: Date) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: ARGENTINA_TIMEZONE,
    weekday: "short",
  }).format(date);

  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return dayMap[weekday] ?? 0;
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: ARGENTINA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  }).format(date);
}

function formatTimeLabel(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: ARGENTINA_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function overlapsBlockedRange(slotStart: Date, slotEnd: Date, blockedRanges: BlockedDateRow[]) {
  return blockedRanges.some((blocked) => {
    const blockedStart = new Date(blocked.start_at);
    const blockedEnd = new Date(blocked.end_at);

    return slotStart < blockedEnd && slotEnd > blockedStart;
  });
}

function formatTimeKey(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: ARGENTINA_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
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

function getSlotOccupancy(
  slotDate: string,
  slotStartTime: string,
  slotEndTime: string,
  slotOccupancy: SlotOccupancyRow[],
) {
  return (
    slotOccupancy.find((booked) => {
    const sameDate = booked.date === slotDate;
    const sameStart = normalizeTimeKey(booked.start_time) === normalizeTimeKey(slotStartTime);
    const sameEnd = normalizeTimeKey(booked.end_time) === normalizeTimeKey(slotEndTime);

    return sameDate && sameStart && sameEnd;
    }) ?? null
  );
}

export function generateSlots(params: {
  availability: AvailabilityRow[];
  blockedDates: BlockedDateRow[];
  slotOccupancy?: SlotOccupancyRow[];
  daysAhead?: number;
  now?: Date;
  startDate?: Date;
}) {
  const daysAhead = params.daysAhead ?? 30;
  const now = params.now ?? new Date();
  const slots: GeneratedSlot[] = [];

  const startDateReference = params.startDate ?? now;
  const startParts = getArgentinaDateParts(startDateReference);
  const startArgentinaMidnight = new Date(
    `${startParts.year}-${startParts.month}-${startParts.day}T00:00:00${ARGENTINA_OFFSET}`,
  );

  const slotOccupancy = params.slotOccupancy ?? [];

  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset += 1) {
    const dayStart = new Date(startArgentinaMidnight.getTime() + dayOffset * ONE_DAY_MS);
    const dayParts = getArgentinaDateParts(dayStart);
    const dateKey = `${dayParts.year}-${dayParts.month}-${dayParts.day}`;
    const dayOfWeek = getArgentinaDayOfWeek(dayStart);
    const dayAvailability = params.availability.filter((item) => item.day_of_week === dayOfWeek);

    for (const availability of dayAvailability) {
      let slotStart = new Date(`${dateKey}T${availability.start_time}${ARGENTINA_OFFSET}`);
      const availabilityEnd = new Date(`${dateKey}T${availability.end_time}${ARGENTINA_OFFSET}`);

      while (slotStart < availabilityEnd) {
        const slotEnd = new Date(
          slotStart.getTime() + availability.slot_duration_minutes * 60 * 1000,
        );

        if (slotEnd > availabilityEnd) {
          break;
        }

        const isPastSlot = slotEnd <= now;
        const isBlocked = overlapsBlockedRange(slotStart, slotEnd, params.blockedDates);
        const slotStartTimeKey = formatTimeKey(slotStart);
        const slotEndTimeKey = formatTimeKey(slotEnd);
        const occupancy = getSlotOccupancy(dateKey, slotStartTimeKey, slotEndTimeKey, slotOccupancy);
        const capacity = occupancy ? getCapacityByType(occupancy.type) : 0;
        const isFull = occupancy ? occupancy.active_count >= capacity : false;

        if (!isPastSlot && !isBlocked && !isFull) {
          slots.push({
            startAt: slotStart,
            endAt: slotEnd,
            dateLabel: formatDateLabel(slotStart),
            startLabel: formatTimeLabel(slotStart),
            endLabel: formatTimeLabel(slotEnd),
            dateKey,
            startTimeKey: slotStartTimeKey,
            endTimeKey: slotEndTimeKey,
            clubNombre: availability.club_nombre ?? null,
          });
        }

        slotStart = slotEnd;
      }
    }
  }

  return slots.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}
