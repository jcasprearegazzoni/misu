"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createManualBookingAction } from "@/app/dashboard/profesor/calendario/manual-booking-actions";
import {
  AvailabilityRange,
  buildEndOptionsForDateAndStart,
  buildStartOptionsForDate,
  getOneHourLaterOrNextAvailable,
} from "./time-options";

type AlumnoOption = {
  user_id: string;
  name: string;
};

type NewManualClassPanelProps = {
  alumnos: AlumnoOption[];
  availabilityRanges: AvailabilityRange[];
};

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function NewManualClassPanel({ alumnos, availabilityRanges }: NewManualClassPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAlumnoId, setSelectedAlumnoId] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayIsoDate());
  const [selectedType, setSelectedType] = useState<"individual" | "dobles" | "trio" | "grupal">("individual");
  const [selectedStartTime, setSelectedStartTime] = useState("");
  const [selectedEndTime, setSelectedEndTime] = useState("");
  const [state, formAction, isPending] = useActionState(createManualBookingAction, {
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

  useEffect(() => {
    const onCreateSlot = (event: Event) => {
      const customEvent = event as CustomEvent<{
        date: string;
        startTime: string;
        endTime: string;
      }>;
      const payload = customEvent.detail;
      if (!payload) {
        return;
      }

      setIsOpen(true);
      setSelectedDate(payload.date);
      setSelectedStartTime(payload.startTime);
      setSelectedEndTime(payload.endTime);
    };

    window.addEventListener("calendar:create-slot", onCreateSlot);
    return () => window.removeEventListener("calendar:create-slot", onCreateSlot);
  }, []);

  return (
    <section className="mt-4 rounded-lg border border-zinc-300 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Carga manual</h2>
          <p className="text-xs text-zinc-600">Carga manual de una clase por parte del profesor.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => {
              const nextOpen = !prev;
              if (nextOpen) {
                const nextStartOptions = buildStartOptionsForDate(selectedDate, availabilityRanges);
                const startValue = nextStartOptions[0]?.value ?? "";
                setSelectedStartTime(startValue);
                const nextEndOptions = buildEndOptionsForDateAndStart(selectedDate, startValue, availabilityRanges);
                setSelectedEndTime(getOneHourLaterOrNextAvailable(startValue, nextEndOptions));
              }
              return nextOpen;
            });
          }}
          className="h-9 rounded-md border border-zinc-300 bg-zinc-100 px-3 text-xs font-medium text-zinc-800"
        >
          {isOpen ? "Cerrar" : "Crear clase"}
        </button>
      </div>

      {isOpen ? (
        <form action={formAction} className="mt-3 grid gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <label className="grid gap-1 text-xs text-zinc-700">
            Alumno
            <select
              name="alumno_id"
              required
              value={selectedAlumnoId}
              onChange={(event) => setSelectedAlumnoId(event.target.value)}
              className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900"
            >
              <option value="" disabled>
                Seleccionar alumno
              </option>
              {alumnos.map((alumno) => (
                <option key={alumno.user_id} value={alumno.user_id}>
                  {alumno.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-xs text-zinc-700">
              Fecha
              <input
                type="date"
                name="date"
                min={minDate}
                required
                value={selectedDate}
                onChange={(event) => {
                  const nextDate = event.target.value;
                  setSelectedDate(nextDate);

                  const nextStartOptions = buildStartOptionsForDate(nextDate, availabilityRanges);
                  const startValue = nextStartOptions[0]?.value ?? "";
                  setSelectedStartTime(startValue);

                  const nextEndOptions = buildEndOptionsForDateAndStart(nextDate, startValue, availabilityRanges);
                  setSelectedEndTime(getOneHourLaterOrNextAvailable(startValue, nextEndOptions));
                }}
                className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900"
              />
            </label>

            <label className="grid gap-1 text-xs text-zinc-700">
              Modalidad
              <select
                name="type"
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value as "individual" | "dobles" | "trio" | "grupal")}
                className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900"
              >
                <option value="individual">Individual</option>
                <option value="dobles">Dobles</option>
                <option value="trio">Trio</option>
                <option value="grupal">Grupal</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-xs text-zinc-700">
              Hora inicio
              <select
                name="start_time"
                required
                className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900"
                value={selectedStartTime}
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
                  <option key={`manual-start-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-xs text-zinc-700">
              Hora fin
              <select
                name="end_time"
                required
                className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900"
                value={selectedEndTime}
                onChange={(event) => setSelectedEndTime(event.target.value)}
              >
                <option value="" disabled>
                  Seleccionar
                </option>
                {endTimeOptions.map((option) => (
                  <option key={`manual-end-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {startTimeOptions.length === 0 ? (
            <p className="rounded-md border border-amber-300 bg-amber-100 px-3 py-2 text-xs text-amber-800">
              No hay disponibilidad configurada para la fecha elegida.
            </p>
          ) : null}

          {alumnos.length === 0 ? (
            <p className="rounded-md border border-amber-300 bg-amber-100 px-3 py-2 text-xs text-amber-800">
              Aun no hay alumnos relacionados a este profesor. Para crear una clase manual, primero debe existir al
              menos un alumno con reserva o paquete asignado.
            </p>
          ) : null}

          {state.error ? (
            <p className="rounded-md border border-red-300 bg-red-100 px-3 py-2 text-xs text-red-700">{state.error}</p>
          ) : null}
          {state.success ? (
            <p className="rounded-md border border-emerald-300 bg-emerald-100 px-3 py-2 text-xs text-emerald-700">
              {state.success}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending || alumnos.length === 0 || startTimeOptions.length === 0 || endTimeOptions.length === 0}
            className="h-9 rounded-md bg-zinc-900 px-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "Creando..." : "Crear clase"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
