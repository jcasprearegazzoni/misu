"use client";

import { useMemo, useState } from "react";
import { formatUserDate } from "@/lib/format/date";
import { CalendarBookingItem } from "./types";
import { MobileEventSheet } from "./mobile-event-sheet";
import { groupDayBookingsBySlot } from "./slot-groups";
import { AvailabilityRange } from "./time-options";

type MobileAgendaProps = {
  days: Array<{
    date: string;
    items: CalendarBookingItem[];
  }>;
  selectedDay: string;
  availabilityRanges: AvailabilityRange[];
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

function getSlotStatus(slot: { status: CalendarBookingItem["status"]; is_finalized: boolean }) {
  if (slot.is_finalized) {
    return {
      label: "Finalizada",
      className: "border-sky-300 bg-sky-100 text-sky-800",
    };
  }

  return {
    label: statusLabel[slot.status],
    className: statusClass[slot.status],
  };
}

export function MobileAgenda({ days, selectedDay, availabilityRanges }: MobileAgendaProps) {
  const [openedSlotKey, setOpenedSlotKey] = useState<string | null>(null);

  const day = days.find((value) => value.date === selectedDay) ?? days[0];
  const slotGroups = useMemo(
    () => groupDayBookingsBySlot(day.items),
    [day.items],
  );
  const openedSlot = slotGroups.find((slot) => slot.slot_key === openedSlotKey) ?? null;

  return (
    <section className="mt-6 grid gap-3 md:hidden">
      <div className="rounded-lg border border-zinc-300 bg-white p-3">
        <p className="text-sm font-semibold text-zinc-900">{formatUserDate(day.date)}</p>

        {slotGroups.length === 0 ? (
          <p className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
            Sin clases para este dia.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {slotGroups.map((slot) => (
              <li key={slot.slot_key}>
                {(() => {
                  const slotStatus = getSlotStatus(slot);
                  return (
                <button
                  type="button"
                  onClick={() => setOpenedSlotKey(slot.slot_key)}
                  className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-left"
                >
                  <p className="text-sm font-semibold text-zinc-900">
                    {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                  </p>
                  <p className="truncate text-sm text-zinc-700">
                    {slot.type === "individual"
                      ? slot.bookings[0]?.alumno_name ?? "Alumno"
                      : `${slot.occupied_count}/${slot.capacity} alumnos`}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-zinc-700">
                      {slot.type_label}
                      {slot.type !== "individual" ? ` (${slot.occupied_count}/${slot.capacity})` : ""}
                    </span>
                    <span
                      className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium ${slotStatus.className}`}
                    >
                      {slotStatus.label}
                    </span>
                  </div>
                </button>
                  );
                })()}
              </li>
            ))}
          </ul>
        )}
      </div>

      <MobileEventSheet
        key={openedSlot?.slot_key ?? "empty"}
        slot={openedSlot}
        availabilityRanges={availabilityRanges}
        onClose={() => setOpenedSlotKey(null)}
      />
    </section>
  );
}
