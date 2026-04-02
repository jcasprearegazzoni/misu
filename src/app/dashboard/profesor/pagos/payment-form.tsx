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
  if (!booking) return "";
  if (booking.type === "individual") return priceIndividual && priceIndividual > 0 ? String(priceIndividual) : "";
  if (booking.type === "dobles") return priceDobles && priceDobles > 0 ? String(priceDobles) : "";
  if (booking.type === "trio") return priceTrio && priceTrio > 0 ? String(priceTrio) : "";
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
    <form action={formAction} className="grid gap-4">
      <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
        Registrar cobro manual
      </h2>

      <label className="label">
        <span>Clase (opcional)</span>
        <select
          name="booking_id"
          value={selectedBookingId}
          onChange={(event) => {
            const bookingId = event.target.value;
            setSelectedBookingId(bookingId);
            const booking = bookingMap.get(bookingId);
            if (!booking) return;
            setSelectedAlumnoId(booking.alumno_id);
            const suggested = getSuggestedAmount(
              booking,
              priceIndividual,
              priceDobles,
              priceTrio,
              priceGrupal,
            );
            if (suggested) setAmountValue(suggested);
          }}
          className="select"
        >
          <option value="">Sin clase asociada</option>
          {bookings.map((booking) => (
            <option key={booking.id} value={booking.id}>
              #{booking.id} - {booking.alumno_name} - {booking.date} ({booking.start_time.slice(0, 5)} a{" "}
              {booking.end_time.slice(0, 5)})
            </option>
          ))}
        </select>
      </label>

      <label className="label">
        <span>Alumno</span>
        <select
          name="alumno_id"
          value={selectedAlumnoId}
          onChange={(event) => setSelectedAlumnoId(event.target.value)}
          disabled={hasBookingSelected}
          className="select disabled:opacity-50"
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

      <label className="label">
        <span>Monto</span>
        <input
          type="number"
          name="amount"
          min="0.01"
          step="0.01"
          placeholder="0.00"
          value={amountValue}
          onChange={(event) => setAmountValue(event.target.value)}
          className="input"
          required
        />
      </label>

      <label className="label">
        <span>Método</span>
        <select name="method" defaultValue="efectivo" className="select">
          <option value="efectivo">Efectivo</option>
          <option value="transferencia_directa">Transferencia directa</option>
        </select>
      </label>

      <label className="label">
        <span>Tipo</span>
        <select name="type" defaultValue="clase" className="select">
          <option value="clase">Clase</option>
          <option value="paquete">Paquete</option>
          <option value={"seña"}>Seña</option>
          <option value="diferencia_cobro">Diferencia de cobro</option>
          <option value="reembolso">Reembolso</option>
        </select>
      </label>

      <label className="label">
        <span>Nota (opcional)</span>
        <textarea name="note" className="input min-h-20" placeholder="Detalle breve del cobro" />
      </label>

      {state.error ? <p className="alert-error">{state.error}</p> : null}
      {state.success ? <p className="alert-success">{state.success}</p> : null}

      <div className="flex justify-end">
        <button type="submit" disabled={isPending} className="btn-primary w-full justify-center sm:w-auto disabled:opacity-60">
          {isPending ? "Guardando..." : "Registrar pago"}
        </button>
      </div>
    </form>
  );
}
