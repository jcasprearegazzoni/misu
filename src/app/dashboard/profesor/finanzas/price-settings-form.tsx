"use client";

import { useActionState } from "react";
import { useState } from "react";
import { saveProfesorPriceSettingsAction } from "./actions";

type PriceSettingsFormProps = {
  initialValues: {
    price_individual: string;
    price_dobles: string;
    price_trio: string;
    price_grupal: string;
    court_cost_mode: "fixed_per_hour" | "per_student_percentage";
    court_cost_per_hour: string;
    court_percentage_per_student: string;
  };
};

export function PriceSettingsForm({ initialValues }: PriceSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(saveProfesorPriceSettingsAction, {
    error: null,
    success: null,
  });
  const [selectedMode, setSelectedMode] = useState(initialValues.court_cost_mode);

  return (
    <form action={formAction} className="mt-2 grid gap-3 rounded-lg border border-zinc-300 bg-white p-3">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
      <label className="grid min-w-0 gap-1 text-sm font-medium text-zinc-800">
        <span>Precio individual</span>
        <input
          type="number"
          name="price_individual"
          defaultValue={initialValues.price_individual}
          min="0"
          step="0.01"
          className="w-full min-w-0 rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
          placeholder="0.00"
        />
      </label>

      <label className="grid min-w-0 gap-1 text-sm font-medium text-zinc-800">
        <span>Precio dobles</span>
        <input
          type="number"
          name="price_dobles"
          defaultValue={initialValues.price_dobles}
          min="0"
          step="0.01"
          className="w-full min-w-0 rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
          placeholder="0.00"
        />
      </label>

      <label className="grid min-w-0 gap-1 text-sm font-medium text-zinc-800">
        <span>Precio trio</span>
        <input
          type="number"
          name="price_trio"
          defaultValue={initialValues.price_trio}
          min="0"
          step="0.01"
          className="w-full min-w-0 rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
          placeholder="0.00"
        />
      </label>

      <label className="grid min-w-0 gap-1 text-sm font-medium text-zinc-800">
        <span>Precio grupal</span>
        <input
          type="number"
          name="price_grupal"
          defaultValue={initialValues.price_grupal}
          min="0"
          step="0.01"
          className="w-full min-w-0 rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
          placeholder="0.00"
        />
      </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
      <label className="grid min-w-0 gap-1 text-sm font-medium text-zinc-800">
        <span>Modelo de costo de cancha</span>
        <select
          name="court_cost_mode"
          value={selectedMode}
          onChange={(event) =>
            setSelectedMode(event.target.value as "fixed_per_hour" | "per_student_percentage")
          }
          className="w-full min-w-0 rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
        >
          <option value="fixed_per_hour">Costo fijo por hora</option>
          <option value="per_student_percentage">Porcentaje por alumno</option>
        </select>
      </label>

      <label className="grid min-w-0 gap-1 text-sm font-medium text-zinc-800">
        <span>Costo de cancha por hora</span>
        <input
          type="number"
          name="court_cost_per_hour"
          defaultValue={initialValues.court_cost_per_hour}
          min="0"
          step="0.01"
          disabled={selectedMode !== "fixed_per_hour"}
          className="w-full min-w-0 rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
          placeholder="0.00"
        />
      </label>
      </div>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Porcentaje por alumno (%)</span>
        <input
          type="number"
          name="court_percentage_per_student"
          defaultValue={initialValues.court_percentage_per_student}
          min="0"
          max="100"
          step="0.01"
          disabled={selectedMode !== "per_student_percentage"}
          className="w-full min-w-0 rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
          placeholder="Ej: 30"
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

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="h-9 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          {isPending ? "Guardando..." : "Guardar precios"}
        </button>
      </div>
    </form>
  );
}
