const APP_TIMEZONE = "America/Argentina/Buenos_Aires";
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ARGENTINA_OFFSET = "-03:00";

function parseUserDateInput(value: string | Date) {
  if (value instanceof Date) {
    return value;
  }

  if (DATE_ONLY_REGEX.test(value)) {
    // Evita corrimiento de dia por parseo UTC en fechas "YYYY-MM-DD".
    return new Date(`${value}T00:00:00${ARGENTINA_OFFSET}`);
  }

  return new Date(value);
}

function capitalize(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatUserDate(value: string | Date) {
  const date = parseUserDateInput(value);
  const weekday = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    timeZone: APP_TIMEZONE,
  }).format(date);
  const dayMonthYear = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    timeZone: APP_TIMEZONE,
  }).format(date);

  return `${capitalize(weekday)} ${dayMonthYear}`;
}

export function formatUserTime(value: string | Date) {
  const date = parseUserDateInput(value);
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: APP_TIMEZONE,
  }).format(date);
}

export function formatUserDateTime(value: string | Date) {
  return `${formatUserDate(value)} ${formatUserTime(value)}`;
}
