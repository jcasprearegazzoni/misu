"use client";

import { useActionState, useMemo, useState } from "react";
import { reprogramBookingAction } from "@/app/dashboard/profesor/calendario/actions";
import { buildHalfHourTimeOptions } from "./time-options";

type ReprogramBookingPanelProps = {
  bookingId: number;
  currentDate: string;
  currentStartTime: string;
  currentEndTime: string;
  packageConsumed: boolean;
  hasCoveragePayment: boolean;
  compact?: boolean;
};

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeTimeToHHMM(value: string) {
  return value.slice(0, 5);
}

export function ReprogramBookingPanel({
  bookingId,
  currentDate,
  currentStartTime,
  currentEndTime,
  packageConsumed,
  hasCoveragePayment,
  compact = false,
}: ReprogramBookingPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const initialStart = normalizeTimeToHHMM(currentStartTime);
  const initialEnd = normalizeTimeToHHMM(currentEndTime);
  const [selectedStartTime, setSelectedStartTime] = useState(initialStart);
  const [selectedEndTime, setSelectedEndTime] = useState(initialEnd);
  const [state, formAction, isPending] = useActionState(reprogramBookingAction, {
    error: null,
    success: null,
  });

  const buttonClass = compact
    ? "rounded-md border border-zinc-300 bg-white px-1.5 py-1 text-[10px] font-medium text-zinc-700"
    : "rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700";

  const minDate = useMemo(() => getTodayIsoDate(), []);
  const timeOptions = useMemo(() => buildHalfHourTimeOptions({ startHour: 6, endHour: 23 }), []);
  const endTimeOptions = useMemo(() => {
    return timeOptions.filter((option) => option.value > selectedStartTime);
  }, [selectedStartTime, timeOptions]);

  return (
    <div className="mt-1 grid gap-1">
      <button type="button" onClick={() => setIsOpen((prev) => !prev)} className={buttonClass}>
        {isOpen ? "Cerrar" : "Reprogramar"}
      </button>

      {isOpen ? (
        <form action={formAction} className="grid gap-1 rounded-md border border-zinc-300 bg-zinc-50 p-2">
          <input type="hidden" name="booking_id" value={bookingId} />

          <label className="grid gap-0.5 text-[10px] text-zinc-700">
            Fecha nueva
            <input
              type="date"
              name="new_date"
              min={minDate}
              defaultValue={currentDate}
              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-900"
              required
            />
          </label>

          <div className="grid grid-cols-2 gap-1">
            <label className="grid gap-0.5 text-[10px] text-zinc-700">
              Inicio
              <select
                name="new_start_time"
                value={selectedStartTime}
                className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-900"
                required
                onChange={(event) => {
                  const nextStart = event.target.value;
                  setSelectedStartTime(nextStart);
                  if (selectedEndTime <= nextStart) {
                    const nextEnd = timeOptions.find((option) => option.value > nextStart)?.value ?? nextStart;
                    setSelectedEndTime(nextEnd);
                  }
                }}
              >
                {timeOptions.map((option) => (
                  <option key={`reprogram-start-${bookingId}-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-0.5 text-[10px] text-zinc-700">
              Fin
              <select
                name="new_end_time"
                value={selectedEndTime}
                className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-900"
                required
                onChange={(event) => setSelectedEndTime(event.target.value)}
              >
                {endTimeOptions.map((option) => (
                  <option key={`reprogram-end-${bookingId}-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {packageConsumed ? (
            <p className="text-[10px] text-amber-700">
              Esta clase ya consumio paquete. Al reprogramar se mantiene ese consumo.
            </p>
          ) : null}

          {hasCoveragePayment ? (
            <p className="text-[10px] text-zinc-700">
              Esta clase ya tiene cobro asociado. El pago se mantiene en el mismo booking.
            </p>
          ) : null}

          {state.error ? <p className="text-[10px] text-red-700">{state.error}</p> : null}
          {state.success ? <p className="text-[10px] text-emerald-700">{state.success}</p> : null}

          <button
            type="submit"
            disabled={isPending}
            className="h-8 rounded-md bg-zinc-900 px-2 text-[11px] font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "Guardando..." : "Confirmar reprogramacion"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
