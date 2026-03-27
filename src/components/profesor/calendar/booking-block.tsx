"use client";

import { CalendarBookingItem } from "./types";

type BookingBlockProps = {
  item: CalendarBookingItem;
  compact?: boolean;
  isSelected?: boolean;
  onSelect?: (id: number) => void;
};

const statusDotClass: Record<CalendarBookingItem["status"], string> = {
  pendiente: "bg-amber-500",
  confirmado: "bg-emerald-500",
  cancelado: "bg-red-500",
};

export function BookingBlock({ item, compact = false, isSelected = false, onSelect }: BookingBlockProps) {
  const containerClass = compact
    ? `overflow-hidden rounded-md border px-1.5 py-1 text-[10px] shadow-sm ${
        isSelected ? "border-zinc-900 bg-white ring-1 ring-zinc-900" : "border-zinc-300 bg-white"
      }`
    : `overflow-hidden rounded-md border p-2 text-xs shadow-sm ${
        isSelected ? "border-zinc-900 bg-white ring-1 ring-zinc-900" : "border-zinc-300 bg-white"
      }`;

  return (
    <button type="button" className={`${containerClass} text-left`} onClick={() => onSelect?.(item.id)}>
      <p className="truncate font-semibold leading-tight text-zinc-900">{item.alumno_name}</p>
      <div className="mt-0.5 flex items-center gap-1">
        <p className="truncate text-zinc-700">{item.type_label}</p>
        <span
          className={`inline-block h-2 w-2 rounded-full ${statusDotClass[item.status]}`}
          title={item.status === "pendiente" ? "Pendiente" : item.status === "confirmado" ? "Confirmada" : "Cancelada"}
          aria-label={item.status === "pendiente" ? "Pendiente" : item.status === "confirmado" ? "Confirmada" : "Cancelada"}
        />
      </div>
    </button>
  );
}
