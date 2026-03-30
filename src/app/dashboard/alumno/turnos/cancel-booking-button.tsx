"use client";

import { cancelAlumnoBookingAction } from "./actions";

type Props = {
  bookingId: number;
};

export function CancelBookingButton({ bookingId }: Props) {
  return (
    <form action={cancelAlumnoBookingAction}>
      <input type="hidden" name="booking_id" value={bookingId} />
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm("Confirmas que queres cancelar esta clase?")) {
            e.preventDefault();
          }
        }}
        className="rounded-md border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
      >
        Cancelar clase
      </button>
    </form>
  );
}
