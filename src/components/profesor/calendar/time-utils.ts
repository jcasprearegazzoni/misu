export const CALENDAR_START_HOUR = 8;
export const CALENDAR_END_HOUR = 22;
export const PIXELS_PER_MINUTE = 0.9;
const DEFAULT_MIN_BLOCK_HEIGHT = 72;

export function parseTimeToMinutes(value: string) {
  const [hoursPart, minutesPart] = value.split(":");
  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);
  return hours * 60 + minutes;
}

export function getTimelineStartMinute() {
  return CALENDAR_START_HOUR * 60;
}

export function getTimelineEndMinute() {
  return CALENDAR_END_HOUR * 60;
}

export function getTimelineHeight() {
  return (getTimelineEndMinute() - getTimelineStartMinute()) * PIXELS_PER_MINUTE;
}

export function getHourTicks() {
  const ticks: number[] = [];
  for (let hour = CALENDAR_START_HOUR; hour <= CALENDAR_END_HOUR; hour += 1) {
    ticks.push(hour);
  }
  return ticks;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function getBookingPosition(
  startTime: string,
  endTime: string,
  options?: {
    minHeight?: number;
  },
) {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  const timelineStart = getTimelineStartMinute();
  const timelineEnd = getTimelineEndMinute();

  const clampedStart = clamp(start, timelineStart, timelineEnd);
  const clampedEnd = clamp(end, timelineStart, timelineEnd);
  const top = (clampedStart - timelineStart) * PIXELS_PER_MINUTE;
  const rawHeight = Math.max((clampedEnd - clampedStart) * PIXELS_PER_MINUTE, 0);
  const minHeight = options?.minHeight ?? DEFAULT_MIN_BLOCK_HEIGHT;
  const height = Math.max(rawHeight, minHeight);

  return { top, height };
}

export function formatHourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}
