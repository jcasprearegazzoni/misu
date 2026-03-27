"use client";

import { CalendarBookingItem } from "./types";
import { BookingDetailContent } from "./booking-detail-content";

type MobileEventSheetProps = {
  item: CalendarBookingItem | null;
  onClose: () => void;
};

export function MobileEventSheet({ item, onClose }: MobileEventSheetProps) {
  if (!item) {
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

      <div className="absolute inset-x-0 bottom-0 z-50 rounded-t-2xl border border-zinc-300 bg-white p-4 shadow-2xl">
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
        <BookingDetailContent item={item} />
      </div>
    </div>
  );
}
