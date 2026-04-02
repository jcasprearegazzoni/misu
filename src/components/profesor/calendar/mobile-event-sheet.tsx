"use client";

import { useState } from "react";
import { BookingDetailContent } from "./booking-detail-content";
import { CalendarSlotGroup } from "./slot-groups";
import { AvailabilityRange } from "./time-options";

type MobileEventSheetProps = {
  slot: CalendarSlotGroup | null;
  availabilityRanges: AvailabilityRange[];
  onClose: () => void;
};

export function MobileEventSheet({ slot, availabilityRanges, onClose }: MobileEventSheetProps) {
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(slot?.bookings[0]?.id ?? null);

  if (!slot) {
    return null;
  }

  const selectedBooking = slot.bookings.find((booking) => booking.id === selectedBookingId) ?? slot.bookings[0] ?? null;

  if (!selectedBooking) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 md:hidden" aria-modal="true" role="dialog">
      <button className="absolute inset-0 bg-black/45" type="button" onClick={onClose} aria-label="Cerrar detalle" />

      <div
        className="absolute inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border p-4 shadow-2xl"
        style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <p className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
            Detalle de clase
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border px-2 py-1 text-xs"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          >
            Cerrar
          </button>
        </div>
        {slot.bookings.length > 1 ? (
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              Alumnos en este horario
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {slot.bookings.map((booking) => (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => setSelectedBookingId(booking.id)}
                  className="rounded-full border px-2.5 py-1 text-xs font-medium"
                  style={
                    selectedBookingId === booking.id
                      ? { borderColor: "var(--misu)", background: "var(--misu)", color: "#fff" }
                      : { borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--muted)" }
                  }
                >
                  {booking.alumno_name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <BookingDetailContent item={selectedBooking} availabilityRanges={availabilityRanges} />
      </div>
    </div>
  );
}
