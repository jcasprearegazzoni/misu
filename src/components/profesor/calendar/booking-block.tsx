"use client";

import { CalendarSlotGroup } from "./slot-groups";

type BookingBlockProps = {
  slot: CalendarSlotGroup;
  compact?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
};

const statusDotClass: Record<CalendarSlotGroup["status"], string> = {
  pendiente: "bg-amber-500",
  confirmado: "bg-emerald-500",
  cancelado: "bg-red-500",
};

function getStatusTitle(slot: CalendarSlotGroup) {
  if (slot.is_finalized) {
    return "Finalizada";
  }
  if (slot.status === "pendiente") {
    return "Pendiente";
  }
  if (slot.status === "confirmado") {
    return "Confirmada";
  }
  return "Cancelada";
}

export function BookingBlock({ slot, compact = false, isSelected = false, onSelect }: BookingBlockProps) {
  const containerClass = compact
    ? `overflow-hidden rounded-md border px-1.5 py-1 text-[10px] shadow-sm ${
        isSelected ? "border-zinc-900 bg-white ring-1 ring-zinc-900" : "border-zinc-300 bg-white"
      }`
    : `overflow-hidden rounded-md border p-2 text-xs shadow-sm ${
        isSelected ? "border-zinc-900 bg-white ring-1 ring-zinc-900" : "border-zinc-300 bg-white"
      }`;

  const dotClass = slot.is_finalized ? "bg-sky-500" : statusDotClass[slot.status];
  const dotTitle = getStatusTitle(slot);

  return (
    <button type="button" className={`${containerClass} text-left`} onClick={onSelect}>
      <p className="truncate font-semibold leading-tight text-zinc-900">
        {slot.type === "individual"
          ? slot.bookings[0]?.alumno_name ?? "Alumno"
          : `${slot.occupied_count}/${slot.capacity} alumnos`}
      </p>
      <div className="mt-0.5 flex items-center gap-1">
        <p className="truncate text-zinc-700">
          {slot.type_label}
        </p>
        <span
          className={`inline-block h-2 w-2 rounded-full ${dotClass}`}
          title={dotTitle}
          aria-label={dotTitle}
        />
      </div>
    </button>
  );
}
