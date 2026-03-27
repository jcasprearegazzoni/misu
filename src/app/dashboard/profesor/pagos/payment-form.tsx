"use client";

import { useActionState, useMemo, useState } from "react";
import { createPaymentAction } from "./actions";

type AlumnoOption = {
  user_id: string;
  label: string;
};

type BookingOption = {
  id: number;
  alumno_id: string;
  alumno_name: string;
  date: string;
  start_time: string;
  end_time: string;
  type: "individual" | "dobles" | "trio" | "grupal";
};

type PaymentFormProps = {
  alumnos: AlumnoOption[];
  bookings: BookingOption[];
  priceIndividual: number | null;
  priceDobles: number | null;
  priceTrio: number | null;
  priceGrupal: number | null;
};

function getSuggestedAmount(
  booking: BookingOption | undefined,
  priceIndividual: number | null,
  priceDobles: number | null,
  priceTrio: number | null,
  priceGrupal: number | null,
) {
  if (!booking) {
    return "";
  }

  if (booking.type === "individual") {
    return priceIndividual && priceIndividual > 0 ? String(priceIndividual) : "";
  }

  if (booking.type === "dobles") {
    return priceDobles && priceDobles > 0 ? String(priceDobles) : "";
  }

  if (booking.type === "trio") {
    return priceTrio && priceTrio > 0 ? String(priceTrio) : "";
  }

  return priceGrupal && priceGrupal > 0 ? String(priceGrupal) : "";
}

export function PaymentForm({
  alumnos,
  bookings,
  priceIndividual,
  priceDobles,
  priceTrio,
  priceGrupal,
}: PaymentFormProps) {
  const [state, formAction, isPending] = useActionState(createPaymentAction, {
    error: null,
    success: null,
  });
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [selectedAlumnoId, setSelectedAlumnoId] = useState("");
  const [amountValue, setAmountValue] = useState("");

  const bookingMap = useMemo(
    () => new Map(bookings.map((booking) => [String(booking.id), booking])),
    [bookings],
  );

  const hasBookingSelected = selectedBookingId.length > 0;

  return (
    <form action={formAction} className="mt-6 grid gap-4 rounded-lg border border-zinc-300 bg-white p-4">
      <h2 className="text-lg font-semibold text-zinc-900">Registrar cobro manual</h2>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Booking (opcional)</span>
        <select
          name="booking_id"
          value={selectedBookingId}
          onChange={(event) => {
            const bookingId = event.target.value;
            setSelectedBookingId(bookingId);

            const booking = bookingMap.get(bookingId);
            if (!booking) {
              return;
            }

            // Al elegir booking, se autocompleta alumno y monto sugerido.
            setSelectedAlumnoId(booking.alumno_id);
            const suggested = getSuggestedAmount(
              booking,
              priceIndividual,
              priceDobles,
              priceTrio,
              priceGrupal,
            );
            if (suggested) {
              setAmountValue(suggested);
            }
          }}
          className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
        >
          <option value="">Sin booking asociado</option>
          {bookings.map((booking) => (
            <option key={booking.id} value={booking.id}>
              #{booking.id} - {booking.alumno_name} - {booking.date} ({booking.start_time.slice(0, 5)} a{" "}
              {booking.end_time.slice(0, 5)})
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Alumno</span>
        <select
          name="alumno_id"
          value={selectedAlumnoId}
          onChange={(event) => setSelectedAlumnoId(event.target.value)}
          disabled={hasBookingSelected}
          className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20 disabled:bg-zinc-100 disabled:text-zinc-600"
          required
        >
          <option value="">Seleccionar alumno</option>
          {alumnos.map((alumno) => (
            <option key={alumno.user_id} value={alumno.user_id}>
              {alumno.label}
            </option>
          ))}
        </select>
        {hasBookingSelected ? <input type="hidden" name="alumno_id" value={selectedAlumnoId} /> : null}
      </label>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Monto</span>
        <input
          type="number"
          name="amount"
          min="0.01"
          step="0.01"
          placeholder="0.00"
          value={amountValue}
          onChange={(event) => setAmountValue(event.target.value)}
          className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
          required
        />
      </label>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Metodo</span>
        <select
          name="method"
          defaultValue="efectivo"
          className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
        >
          <option value="efectivo">Efectivo</option>
          <option value="transferencia_directa">Transferencia directa</option>
        </select>
      </label>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Tipo</span>
        <select
          name="type"
          defaultValue="clase"
          className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
        >
          <option value="clase">Clase</option>
          <option value="paquete">Paquete</option>
          <option value={"se\u00f1a"}>Sena</option>
          <option value="diferencia_cobro">Diferencia de cobro</option>
          <option value="reembolso">Reembolso</option>
        </select>
      </label>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Nota (opcional)</span>
        <textarea
          name="note"
          className="min-h-20 rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
          placeholder="Detalle breve del cobro"
        />
      </label>

      {state.error ? (
        <p className="rounded-lg border border-red-300 bg-red-100 px-3 py-2 text-sm font-medium text-red-800">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-lg border border-emerald-300 bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800">
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Guardando..." : "Registrar pago"}
      </button>
    </form>
  );
}
