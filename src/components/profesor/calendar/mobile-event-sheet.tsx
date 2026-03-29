"use client";

import { useState } from "react";
import { BookingDetailContent } from "./booking-detail-content";
import { CalendarSlotGroup } from "./slot-groups";

type MobileEventSheetProps = {
  slot: CalendarSlotGroup | null;
  onClose: () => void;
};

export function MobileEventSheet({ slot, onClose }: MobileEventSheetProps) {
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(slot?.bookings[0]?.id ?? null);

  if (!slot) {
    return null;
  }

  const selectedBooking =
    slot.bookings.find((booking) => booking.id === selectedBookingId) ?? slot.bookings[0] ?? null;

  if (!selectedBooking) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 md:hidden" aria-modal="true" role="dialog">
      <button
        className="absolute inset-0 bg-black/30"
        type="button"
        onClick={onClose}
        aria-label="Cerrar detalle"
      />

      <div className="absolute inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-zinc-300 bg-white p-4 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <p className="text-base font-semibold text-zinc-900">Detalle de clase</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700"
          >
            Cerrar
          </button>
        </div>
        {slot.bookings.length > 1 ? (
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">Alumnos en este horario</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {slot.bookings.map((booking) => (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => setSelectedBookingId(booking.id)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                    selectedBookingId === booking.id
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-300 bg-white text-zinc-700"
                  }`}
                >
                  {booking.alumno_name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <BookingDetailContent item={selectedBooking} />
      </div>
    </div>
  );
}
