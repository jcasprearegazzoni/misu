"use client";

import { useMemo, useState } from "react";
import { formatUserDate } from "@/lib/format/date";
import { CalendarBookingItem } from "./types";
import { MobileEventSheet } from "./mobile-event-sheet";

type MobileAgendaProps = {
  days: Array<{
    date: string;
    items: CalendarBookingItem[];
  }>;
  selectedDay: string;
};

const statusLabel: Record<CalendarBookingItem["status"], string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmada",
  cancelado: "Cancelada",
};

const statusClass: Record<CalendarBookingItem["status"], string> = {
  pendiente: "border-amber-300 bg-amber-100 text-amber-800",
  confirmado: "border-emerald-300 bg-emerald-100 text-emerald-800",
  cancelado: "border-red-300 bg-red-100 text-red-800",
};

export function MobileAgenda({ days, selectedDay }: MobileAgendaProps) {
  const [openedEventId, setOpenedEventId] = useState<number | null>(null);

  const day = days.find((value) => value.date === selectedDay) ?? days[0];
  const sortedItems = useMemo(
    () => [...day.items].sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [day.items],
  );
  const openedItem = sortedItems.find((item) => item.id === openedEventId) ?? null;

  return (
    <section className="mt-6 grid gap-3 md:hidden">
      <div className="rounded-lg border border-zinc-300 bg-white p-3">
        <p className="text-sm font-semibold text-zinc-900">{formatUserDate(day.date)}</p>

        {sortedItems.length === 0 ? (
          <p className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
            Sin clases para este dia.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {sortedItems.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setOpenedEventId(item.id)}
                  className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-left"
                >
                  <p className="text-sm font-semibold text-zinc-900">
                    {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
                  </p>
                  <p className="truncate text-sm text-zinc-700">{item.alumno_name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-zinc-700">{item.type_label}</span>
                    <span
                      className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium ${statusClass[item.status]}`}
                    >
                      {statusLabel[item.status]}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <MobileEventSheet item={openedItem} onClose={() => setOpenedEventId(null)} />
    </section>
  );
}
