"use client";

import { useActionState, useMemo, useState } from "react";
import { reprogramBookingAction } from "@/app/dashboard/profesor/calendario/actions";
import {
  AvailabilityRange,
  buildEndOptionsForDateAndStart,
  buildStartOptionsForDate,
  getOneHourLaterOrNextAvailable,
} from "./time-options";

type BookingType = "individual" | "dobles" | "trio" | "grupal";

type ReprogramBookingPanelProps = {
  bookingId: number;
  currentDate: string;
  currentStartTime: string;
  currentEndTime: string;
  currentType: BookingType;
  packageConsumed: boolean;
  hasCoveragePayment: boolean;
  availabilityRanges: AvailabilityRange[];
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
  currentType,
  packageConsumed,
  hasCoveragePayment,
  availabilityRanges,
}: ReprogramBookingPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [selectedType, setSelectedType] = useState<BookingType>(currentType);
  const initialStart = normalizeTimeToHHMM(currentStartTime);
  const initialEnd = normalizeTimeToHHMM(currentEndTime);
  const [selectedStartTime, setSelectedStartTime] = useState(initialStart);
  const [selectedEndTime, setSelectedEndTime] = useState(initialEnd);
  const [state, formAction, isPending] = useActionState(reprogramBookingAction, {
    error: null,
    success: null,
  });

  const minDate = useMemo(() => getTodayIsoDate(), []);
  const startTimeOptions = useMemo(() => {
    return buildStartOptionsForDate(selectedDate, availabilityRanges);
  }, [availabilityRanges, selectedDate]);
  const endTimeOptions = useMemo(() => {
    return buildEndOptionsForDateAndStart(selectedDate, selectedStartTime, availabilityRanges);
  }, [availabilityRanges, selectedDate, selectedStartTime]);

  return (
    <div className="mt-1 grid gap-1">
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => {
            const nextOpen = !prev;
            if (nextOpen) {
              const nextStartOptions = buildStartOptionsForDate(selectedDate, availabilityRanges);
              const fallbackStart = nextStartOptions.find((option) => option.value === initialStart)?.value;
              const startValue = fallbackStart ?? nextStartOptions[0]?.value ?? "";
              setSelectedStartTime(startValue);
              const nextEndOptions = buildEndOptionsForDateAndStart(selectedDate, startValue, availabilityRanges);
              const fallbackEnd = nextEndOptions.find((option) => option.value === initialEnd)?.value;
              setSelectedEndTime(fallbackEnd ?? getOneHourLaterOrNextAvailable(startValue, nextEndOptions));
            }
            return nextOpen;
          });
        }}
        className="rounded-md border px-2 py-1 text-[11px] font-medium transition-opacity hover:opacity-90"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--foreground)" }}
      >
        {isOpen ? "Cerrar" : "Reprogramar"}
      </button>

      {isOpen ? (
        <form action={formAction} className="grid gap-1 rounded-md border p-2" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
          <input type="hidden" name="booking_id" value={bookingId} />
          <input type="hidden" name="new_type" value={selectedType} />

          <label className="grid gap-0.5 text-[10px]" style={{ color: "var(--muted)" }}>
            Fecha nueva
            <input
              type="date"
              name="new_date"
              min={minDate}
              value={selectedDate}
              className="h-8 rounded-md border px-2 text-xs"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--foreground)" }}
              required
              onChange={(event) => {
                const nextDate = event.target.value;
                setSelectedDate(nextDate);

                const nextStartOptions = buildStartOptionsForDate(nextDate, availabilityRanges);
                const startValue = nextStartOptions[0]?.value ?? "";
                setSelectedStartTime(startValue);

                const nextEndOptions = buildEndOptionsForDateAndStart(nextDate, startValue, availabilityRanges);
                setSelectedEndTime(getOneHourLaterOrNextAvailable(startValue, nextEndOptions));
              }}
            />
          </label>

          <div className="grid grid-cols-2 gap-1">
            <label className="grid gap-0.5 text-[10px]" style={{ color: "var(--muted)" }}>
              Inicio
              <select
                name="new_start_time"
                value={selectedStartTime}
                className="h-8 rounded-md border px-2 text-xs"
                style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--foreground)" }}
                required
                onChange={(event) => {
                  const nextStart = event.target.value;
                  setSelectedStartTime(nextStart);
                  if (selectedEndTime <= nextStart) {
                    const nextEndOptions = buildEndOptionsForDateAndStart(selectedDate, nextStart, availabilityRanges);
                    setSelectedEndTime(getOneHourLaterOrNextAvailable(nextStart, nextEndOptions));
                  }
                }}
              >
                <option value="" disabled>
                  Seleccionar
                </option>
                {startTimeOptions.map((option) => (
                  <option key={`reprogram-start-${bookingId}-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-0.5 text-[10px]" style={{ color: "var(--muted)" }}>
              Fin
              <select
                name="new_end_time"
                value={selectedEndTime}
                className="h-8 rounded-md border px-2 text-xs"
                style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--foreground)" }}
                required
                onChange={(event) => setSelectedEndTime(event.target.value)}
              >
                <option value="" disabled>
                  Seleccionar
                </option>
                {endTimeOptions.map((option) => (
                  <option key={`reprogram-end-${bookingId}-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-0.5 text-[10px]" style={{ color: "var(--muted)" }}>
            Modalidad
            <select
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value as BookingType)}
              className="h-8 rounded-md border px-2 text-xs"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--foreground)" }}
            >
              <option value="individual">Individual</option>
              <option value="dobles">Dobles</option>
              <option value="trio">Trío</option>
              <option value="grupal">Grupal</option>
            </select>
          </label>

          {packageConsumed ? (
            <p className="text-[10px]" style={{ color: "var(--warning)" }}>
              Esta clase ya consumió paquete. Al reprogramar se mantiene ese consumo.
            </p>
          ) : null}

          {hasCoveragePayment ? (
            <p className="text-[10px]" style={{ color: "var(--muted)" }}>
              Esta clase ya tiene cobro asociado. El pago se mantiene en el mismo booking.
            </p>
          ) : null}

          {state.error ? (
            <p className="text-[10px]" style={{ color: "var(--error)" }}>
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p className="text-[10px]" style={{ color: "var(--success)" }}>
              {state.success}
            </p>
          ) : null}
          {startTimeOptions.length === 0 ? (
            <p className="text-[10px]" style={{ color: "var(--warning)" }}>
              No hay disponibilidad configurada para esa fecha.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending || startTimeOptions.length === 0 || endTimeOptions.length === 0}
            className="h-8 rounded-md px-2 text-[11px] font-semibold text-white disabled:opacity-60"
            style={{ background: "var(--misu)" }}
          >
            {isPending ? "Guardando..." : "Confirmar reprogramación"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
