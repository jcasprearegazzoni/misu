// Constantes horarias del calendario del club (06:00–24:00)
export const CLUB_START_HOUR = 8;
export const CLUB_END_HOUR = 24;
export const PIXELS_PER_MINUTE = 0.9;

export function getClubTimelineHeight() {
  return (CLUB_END_HOUR - CLUB_START_HOUR) * 60 * PIXELS_PER_MINUTE;
}

export function getClubHourTicks() {
  const ticks: number[] = [];
  for (let hour = CLUB_START_HOUR; hour <= CLUB_END_HOUR; hour++) {
    ticks.push(hour);
  }
  return ticks;
}

export function formatHourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function parseTimeToMinutes(value: string) {
  const [hoursPart, minutesPart] = value.split(":");
  return Number(hoursPart) * 60 + Number(minutesPart);
}

// Calcula top y height en píxeles para posicionar un bloque en el timeline
export function getClubBlockPosition(startTime: string, endTime: string) {
  const timelineStart = CLUB_START_HOUR * 60;
  const timelineEnd = CLUB_END_HOUR * 60;

  const start = Math.min(Math.max(parseTimeToMinutes(startTime), timelineStart), timelineEnd);
  const end = Math.min(Math.max(parseTimeToMinutes(endTime), timelineStart), timelineEnd);

  const top = (start - timelineStart) * PIXELS_PER_MINUTE;
  const height = Math.max((end - start) * PIXELS_PER_MINUTE, 36);

  return { top, height };
}


