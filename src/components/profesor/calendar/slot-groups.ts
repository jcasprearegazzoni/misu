import { BookingStatus, BookingType, CalendarBookingItem } from "./types";

export type CalendarSlotGroup = {
  slot_key: string;
  date: string;
  start_time: string;
  end_time: string;
  type: BookingType;
  type_label: string;
  status: BookingStatus;
  occupied_count: number;
  capacity: number;
  bookings: CalendarBookingItem[];
};

function getCapacityByType(type: BookingType) {
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

function resolveSlotStatus(bookings: CalendarBookingItem[]): BookingStatus {
  if (bookings.some((item) => item.status === "pendiente")) {
    return "pendiente";
  }
  if (bookings.some((item) => item.status === "confirmado")) {
    return "confirmado";
  }
  return "cancelado";
}

function buildSlotKey(date: string, startTime: string, endTime: string) {
  return `${date}|${startTime}|${endTime}`;
}

export function groupDayBookingsBySlot(items: CalendarBookingItem[]) {
  const map = new Map<string, CalendarBookingItem[]>();

  for (const item of items) {
    const key = buildSlotKey(item.date, item.start_time, item.end_time);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)?.push(item);
  }

  const groups: CalendarSlotGroup[] = [];
  for (const [slotKey, bookings] of map.entries()) {
    const sorted = [...bookings].sort((a, b) => a.alumno_name.localeCompare(b.alumno_name, "es-AR"));
    const first = sorted[0];
    groups.push({
      slot_key: slotKey,
      date: first.date,
      start_time: first.start_time,
      end_time: first.end_time,
      type: first.type,
      type_label: first.type_label,
      status: resolveSlotStatus(sorted),
      occupied_count: sorted.length,
      capacity: getCapacityByType(first.type),
      bookings: sorted,
    });
  }

  return groups.sort((a, b) => a.start_time.localeCompare(b.start_time));
}

