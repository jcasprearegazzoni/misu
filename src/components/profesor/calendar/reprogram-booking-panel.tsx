"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { reprogramBookingAction } from "@/app/dashboard/profesor/calendario/actions";
import type { BookingType } from "@/types/booking";
import {
  AvailabilityRange,
  buildEndOptionsForDateAndStart,
  buildStartOptionsForDate,
  getOneHourLaterOrNextAvailable,
} from "./time-options";

type ReprogramBookingPanelProps = {
  isOpen: boolean;
  onRequestClose: () => void;
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

function formatDateIsoFromDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function shiftMonth(monthIso: string, deltaMonths: number) {
  const base = new Date(`${monthIso}T00:00:00-03:00`);
  base.setDate(1);
  base.setMonth(base.getMonth() + deltaMonths);
  return formatDateIsoFromDate(base).slice(0, 7) + "-01";
}

function formatMonthTitle(monthIso: string) {
  const date = new Date(`${monthIso}T00:00:00-03:00`);
  const month = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
  const year = new Intl.DateTimeFormat("es-AR", {
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
  return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
}

function buildMonthCells(monthIso: string) {
  const monthStart = new Date(`${monthIso}T00:00:00-03:00`);
  monthStart.setDate(1);

  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const jsDay = monthStart.getDay();
  const mondayIndex = (jsDay + 6) % 7;

  const cells: Array<string | null> = [];
  for (let i = 0; i < mondayIndex; i += 1) cells.push(null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(monthStart);
    date.setDate(day);
    cells.push(formatDateIsoFromDate(date));
  }

  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function ReprogramBookingPanel({
  isOpen,
  onRequestClose,
  bookingId,
  currentDate,
  currentStartTime,
  currentEndTime,
  currentType,
  packageConsumed,
  hasCoveragePayment,
  availabilityRanges,
}: ReprogramBookingPanelProps) {
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [selectedType, setSelectedType] = useState<BookingType>(currentType);
  const initialStart = normalizeTimeToHHMM(currentStartTime);
  const initialEnd = normalizeTimeToHHMM(currentEndTime);
  const [selectedStartTime, setSelectedStartTime] = useState(initialStart);
  const [selectedEndTime, setSelectedEndTime] = useState(initialEnd);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerMonthIso, setPickerMonthIso] = useState(`${selectedDate.slice(0, 7)}-01`);
  const [state, formAction, isPending] = useActionState(reprogramBookingAction, {
    error: null,
    success: null,
  });
  const datePickerRef = useRef<HTMLDivElement | null>(null);

  const minDate = useMemo(() => getTodayIsoDate(), []);
  const weekDayHeaders = ["L", "M", "X", "J", "V", "S", "D"] as const;
  const pickerMonthTitle = useMemo(() => formatMonthTitle(pickerMonthIso), [pickerMonthIso]);
  const pickerMonthCells = useMemo(() => buildMonthCells(pickerMonthIso), [pickerMonthIso]);
  const startTimeOptions = useMemo(() => {
    return buildStartOptionsForDate(selectedDate, availabilityRanges);
  }, [availabilityRanges, selectedDate]);
  const endTimeOptions = useMemo(() => {
    return buildEndOptionsForDateAndStart(selectedDate, selectedStartTime, availabilityRanges);
  }, [availabilityRanges, selectedDate, selectedStartTime]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onRequestClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onRequestClose]);

  useEffect(() => {
    if (state.success) {
      onRequestClose();
    }
  }, [state.success, onRequestClose]);

  useEffect(() => {
    if (!isDatePickerOpen) return undefined;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (!datePickerRef.current?.contains(target)) {
        setIsDatePickerOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDatePickerOpen]);

  if (!isOpen) {
    return null;
  }

  function applySelectedDate(nextDate: string) {
    setSelectedDate(nextDate);
    const nextStartOptions = buildStartOptionsForDate(nextDate, availabilityRanges);
    const startValue = nextStartOptions[0]?.value ?? "";
    setSelectedStartTime(startValue);
    const nextEndOptions = buildEndOptionsForDateAndStart(nextDate, startValue, availabilityRanges);
    setSelectedEndTime(getOneHourLaterOrNextAvailable(startValue, nextEndOptions));
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-3 sm:items-center sm:p-5" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={onRequestClose}
        aria-label="Cerrar reprogramacion"
      />

      <div
        className="relative z-10 w-full max-w-[680px] max-h-[88vh] overflow-y-auto rounded-t-2xl border p-4 shadow-2xl sm:max-h-none sm:overflow-visible sm:rounded-2xl sm:p-5"
        style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-base font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
              Reprogramar clase
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {currentDate} - {initialStart} - {initialEnd}
            </p>
          </div>
          <button
            type="button"
            onClick={onRequestClose}
            className="rounded-md border px-3 py-1.5 text-xs font-medium"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--muted)" }}
          >
            Cerrar
          </button>
        </div>

        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="booking_id" value={bookingId} />
          <input type="hidden" name="new_type" value={selectedType} />
          <input type="hidden" name="new_date" value={selectedDate} />

          <div className="grid gap-3 sm:grid-cols-3">
            <div ref={datePickerRef} className="relative">
              <label className="grid gap-1 text-xs font-medium" style={{ color: "var(--muted)" }}>
                Fecha nueva
                <button
                  type="button"
                  className="h-10 rounded-md border px-3 text-left text-sm font-semibold"
                  style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--foreground)" }}
                  onClick={() => {
                    setPickerMonthIso(`${selectedDate.slice(0, 7)}-01`);
                    setIsDatePickerOpen((prev) => !prev);
                  }}
                >
                  {selectedDate}
                </button>
              </label>

              {isDatePickerOpen ? (
                <div
                  className="absolute left-0 top-full z-20 mt-1 w-[260px] rounded-xl border p-2 text-left shadow-lg"
                  style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <button
                      type="button"
                      className="rounded-md px-2 py-1 text-xs font-semibold"
                      style={{ color: "var(--muted)", background: "var(--surface-2)" }}
                      aria-label="Mes anterior"
                      onClick={() => setPickerMonthIso((prev) => shiftMonth(prev, -1))}
                    >
                      {"<"}
                    </button>
                    <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                      {pickerMonthTitle}
                    </p>
                    <button
                      type="button"
                      className="rounded-md px-2 py-1 text-xs font-semibold"
                      style={{ color: "var(--muted)", background: "var(--surface-2)" }}
                      aria-label="Mes siguiente"
                      onClick={() => setPickerMonthIso((prev) => shiftMonth(prev, 1))}
                    >
                      {">"}
                    </button>
                  </div>

                  <div className="mb-1 grid grid-cols-7 gap-1">
                    {weekDayHeaders.map((dayHeader) => (
                      <p
                        key={`weekday-${dayHeader}`}
                        className="text-center text-[10px] font-semibold"
                        style={{ color: "var(--muted)" }}
                      >
                        {dayHeader}
                      </p>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {pickerMonthCells.map((dateIso, index) => {
                      if (!dateIso) {
                        return <span key={`empty-${index}`} className="block h-8" />;
                      }

                      const isPast = dateIso < minDate;
                      const isSelected = dateIso === selectedDate;

                      return (
                        <button
                          key={`day-${dateIso}`}
                          type="button"
                          className="flex h-8 items-center justify-center rounded-md text-xs font-semibold"
                          style={{
                            background: isSelected ? "var(--misu)" : "var(--surface-2)",
                            color: isSelected ? "#fff" : isPast ? "var(--muted)" : "var(--foreground)",
                            opacity: isPast ? 0.5 : 1,
                          }}
                          disabled={isPast}
                          onClick={() => {
                            applySelectedDate(dateIso);
                            setIsDatePickerOpen(false);
                          }}
                        >
                          {Number(dateIso.slice(-2))}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <label className="grid gap-1 text-xs font-medium" style={{ color: "var(--muted)" }}>
              Inicio
              <select
                name="new_start_time"
                value={selectedStartTime}
                className="h-10 rounded-md border px-3 text-sm"
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
            <label className="grid gap-1 text-xs font-medium" style={{ color: "var(--muted)" }}>
              Fin
              <select
                name="new_end_time"
                value={selectedEndTime}
                className="h-10 rounded-md border px-3 text-sm"
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

          <label className="grid gap-1 text-xs font-medium sm:max-w-[320px]" style={{ color: "var(--muted)" }}>
            Modalidad
            <select
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value as BookingType)}
              className="h-10 rounded-md border px-3 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--foreground)" }}
            >
              <option value="individual">Individual</option>
              <option value="dobles">Dobles</option>
              <option value="trio">Trio</option>
              <option value="grupal">Grupal</option>
            </select>
          </label>

          <div className="grid gap-1">
            {packageConsumed ? (
              <p className="text-xs" style={{ color: "var(--warning)" }}>
                Esta clase ya consumio paquete. Al reprogramar se mantiene ese consumo.
              </p>
            ) : null}

            {hasCoveragePayment ? (
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Esta clase ya tiene cobro asociado. El pago se mantiene en el mismo booking.
              </p>
            ) : null}

            {state.error ? (
              <p className="text-xs" style={{ color: "var(--error)" }}>
                {state.error}
              </p>
            ) : null}

            {startTimeOptions.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--warning)" }}>
                No hay disponibilidad configurada para esa fecha.
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isPending || startTimeOptions.length === 0 || endTimeOptions.length === 0}
            className="mt-1 h-10 rounded-md px-3 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "var(--misu)" }}
          >
            {isPending ? "Guardando..." : "Confirmar reprogramacion"}
          </button>
        </form>
      </div>
    </div>
  );
}
