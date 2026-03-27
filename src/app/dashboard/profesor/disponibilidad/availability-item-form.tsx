"use client";

import { useActionState } from "react";
import { deleteAvailabilityAction, saveAvailabilityAction } from "./actions";

const dayOptions = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miercoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sabado" },
];

type AvailabilityItemFormProps = {
  availability: {
    id: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    slot_duration_minutes: number;
  };
};

export function AvailabilityItemForm({ availability }: AvailabilityItemFormProps) {
  const [state, formAction, isPending] = useActionState(saveAvailabilityAction, {
    error: null,
    success: null,
  });

  return (
    <form action={formAction} className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4">
      <input type="hidden" name="id" value={availability.id} />
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-900">Editar disponibilidad</h3>
        <button
          formAction={deleteAvailabilityAction}
          className="h-7 w-7 rounded-md border border-red-300 text-sm font-semibold text-red-700 hover:bg-red-50"
          title="Eliminar disponibilidad"
        >
          X
        </button>
      </div>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Dia de la semana</span>
        <select
          name="day_of_week"
          defaultValue={availability.day_of_week}
          className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
        >
          {dayOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-zinc-800">
          <span>Hora inicio</span>
          <input
            type="time"
            name="start_time"
            defaultValue={availability.start_time.slice(0, 5)}
            className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
            required
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-zinc-800">
          <span>Hora fin</span>
          <input
            type="time"
            name="end_time"
            defaultValue={availability.end_time.slice(0, 5)}
            className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
            required
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Duracion de la clase (minutos)</span>
        <input
          type="number"
          name="slot_duration_minutes"
          defaultValue={availability.slot_duration_minutes}
          min={1}
          className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
          required
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
        {isPending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
