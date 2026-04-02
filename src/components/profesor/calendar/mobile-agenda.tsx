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

function getSlotStatus(slot: { status: CalendarBookingItem["status"]; is_finalized: boolean }) {
  if (slot.is_finalized) {
    return {
      label: "Finalizada",
      style: {
        borderColor: "var(--info-border)",
        background: "var(--info-bg)",
        color: "var(--info)",
      },
    };
  }

  if (slot.status === "confirmado") {
    return {
      label: statusLabel[slot.status],
      style: {
        borderColor: "var(--success-border)",
        background: "var(--success-bg)",
        color: "var(--success)",
      },
    };
  }

  if (slot.status === "pendiente") {
    return {
      label: statusLabel[slot.status],
      style: {
        borderColor: "var(--warning-border)",
        background: "var(--warning-bg)",
        color: "var(--warning)",
      },
    };
  }

  return {
    label: statusLabel[slot.status],
    style: {
      borderColor: "var(--error-border)",
      background: "var(--error-bg)",
      color: "#fca5a5",
    },
  };
}

export function MobileAgenda({ days, selectedDay, availabilityRanges }: MobileAgendaProps) {
  const [openedSlotKey, setOpenedSlotKey] = useState<string | null>(null);

  const day = days.find((value) => value.date === selectedDay) ?? days[0];
  const slotGroups = useMemo(() => groupDayBookingsBySlot(day.items), [day.items]);
  const openedSlot = slotGroups.find((slot) => slot.slot_key === openedSlotKey) ?? null;

  return (
    <section className="mt-6 grid gap-3 md:hidden">
      <div className="card p-3">
        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          {formatUserDate(day.date)}
        </p>

        {slotGroups.length === 0 ? (
          <p className="mt-3 rounded-md border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--muted)" }}>
            Sin clases para este día.
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
                      className="w-full rounded-md border px-3 py-2 text-left"
                      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                    >
                      <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </p>
                      <p className="truncate text-sm" style={{ color: "var(--muted)" }}>
                        {slot.type === "individual"
                          ? slot.bookings[0]?.alumno_name ?? "Alumno"
                          : `${slot.occupied_count}/${slot.capacity} alumnos`}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs" style={{ color: "var(--muted)" }}>
                          {slot.type_label}
                          {slot.type !== "individual" ? ` (${slot.occupied_count}/${slot.capacity})` : ""}
                        </span>
                        <span className="inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium" style={slotStatus.style}>
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
