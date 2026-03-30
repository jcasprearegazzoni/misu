export type TimeOption = {
  value: string;
  label: string;
};

export type AvailabilityRange = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

type BuildHalfHourTimeOptionsParams = {
  startHour?: number;
  endHour?: number;
};

export function buildHalfHourTimeOptions(params?: BuildHalfHourTimeOptionsParams) {
  const startHour = params?.startHour ?? 6;
  const endHour = params?.endHour ?? 23;
  const options: TimeOption[] = [];

  for (let hour = startHour; hour <= endHour; hour += 1) {
    for (let minute = 0; minute < 60; minute += 30) {
      const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      options.push({ value, label: value });
    }
  }

  return options;
}

function parseTimeToMinutes(value: string) {
  const [hoursPart, minutesPart] = value.slice(0, 5).split(":");
  return Number(hoursPart) * 60 + Number(minutesPart);
}

function minutesToHHMM(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getDayOfWeekFromDateIso(dateIso: string) {
  return new Date(`${dateIso}T00:00:00-03:00`).getDay();
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

export function buildStartOptionsForDate(
  dateIso: string,
  availabilityRanges: AvailabilityRange[],
): TimeOption[] {
  if (!dateIso) {
    return [];
  }

  const dayOfWeek = getDayOfWeekFromDateIso(dateIso);
  const rawValues: string[] = [];

  for (const range of availabilityRanges) {
    if (range.day_of_week !== dayOfWeek) {
      continue;
    }

    const startMinutes = parseTimeToMinutes(range.start_time);
    const endMinutes = parseTimeToMinutes(range.end_time);
    for (let minute = startMinutes; minute + 30 <= endMinutes; minute += 30) {
      rawValues.push(minutesToHHMM(minute));
    }
  }

  return uniqueSorted(rawValues).map((value) => ({ value, label: value }));
}

export function buildEndOptionsForDateAndStart(
  dateIso: string,
  startTime: string,
  availabilityRanges: AvailabilityRange[],
): TimeOption[] {
  if (!dateIso || !startTime) {
    return [];
  }

  const dayOfWeek = getDayOfWeekFromDateIso(dateIso);
  const startMinutes = parseTimeToMinutes(startTime);
  const rawValues: string[] = [];

  for (const range of availabilityRanges) {
    if (range.day_of_week !== dayOfWeek) {
      continue;
    }

    const rangeStart = parseTimeToMinutes(range.start_time);
    const rangeEnd = parseTimeToMinutes(range.end_time);
    if (startMinutes < rangeStart || startMinutes >= rangeEnd) {
      continue;
    }

    for (let minute = startMinutes + 30; minute <= rangeEnd; minute += 30) {
      rawValues.push(minutesToHHMM(minute));
    }
  }

  return uniqueSorted(rawValues).map((value) => ({ value, label: value }));
}

export function getOneHourLaterOrNextAvailable(startTime: string, options: TimeOption[]) {
  const [hoursPart, minutesPart] = startTime.split(":");
  const oneHourLater = `${String(Number(hoursPart) + 1).padStart(2, "0")}:${minutesPart}`;
  const exactHourOption = options.find((option) => option.value === oneHourLater);
  if (exactHourOption) {
    return exactHourOption.value;
  }

  return options[0]?.value ?? startTime;
}
