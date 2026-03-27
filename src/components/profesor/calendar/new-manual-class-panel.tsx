"use client";

import { useActionState, useMemo, useState } from "react";
import { createManualBookingAction } from "@/app/dashboard/profesor/calendario/manual-booking-actions";
import { buildHalfHourTimeOptions } from "./time-options";

type AlumnoOption = {
  user_id: string;
  name: string;
};

type NewManualClassPanelProps = {
  alumnos: AlumnoOption[];
};

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function NewManualClassPanel({ alumnos }: NewManualClassPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStartTime, setSelectedStartTime] = useState("08:00");
  const [selectedEndTime, setSelectedEndTime] = useState("09:00");
  const [state, formAction, isPending] = useActionState(createManualBookingAction, {
    error: null,
    success: null,
  });

  const minDate = useMemo(() => getTodayIsoDate(), []);
  const timeOptions = useMemo(() => buildHalfHourTimeOptions({ startHour: 6, endHour: 23 }), []);
  const endTimeOptions = useMemo(() => {
    return timeOptions.filter((option) => option.value > selectedStartTime);
  }, [selectedStartTime, timeOptions]);

  return (
    <section className="mt-4 rounded-lg border border-zinc-300 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Carga manual</h2>
          <p className="text-xs text-zinc-600">Carga manual de una clase por parte del profesor.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
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
              defaultValue=""
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
                className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900"
              />
            </label>

            <label className="grid gap-1 text-xs text-zinc-700">
              Modalidad
              <select
                name="type"
                defaultValue="individual"
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
                    const nextEnd = timeOptions.find((option) => option.value > nextStart)?.value ?? nextStart;
                    setSelectedEndTime(nextEnd);
                  }
                }}
              >
                {timeOptions.map((option) => (
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
                {endTimeOptions.map((option) => (
                  <option key={`manual-end-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

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
            disabled={isPending || alumnos.length === 0}
            className="h-9 rounded-md bg-zinc-900 px-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "Creando..." : "Crear clase"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
