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
          if (!confirm("¿Confirmás que querés cancelar esta clase?")) {
            e.preventDefault();
          }
        }}
        className="rounded-md border px-2.5 py-1 text-xs font-medium transition"
        style={{
          borderColor: "var(--error-border)",
          background: "var(--error-bg)",
          color: "#fca5a5",
        }}
      >
        Cancelar clase
      </button>
    </form>
  );
}
