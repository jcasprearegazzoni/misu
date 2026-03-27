"use client";

import { useActionState } from "react";
import { saveProfesorOperationalSettingsAction } from "./actions";

type SettingsFormProps = {
  initialValues: {
    cancel_without_charge_hours: string;
    solo_warning_hours: string;
    solo_decision_deadline_minutes: string;
  };
};

export function ProfesorSettingsForm({ initialValues }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(saveProfesorOperationalSettingsAction, {
    error: null,
    success: null,
  });

  return (
    <form action={formAction} className="mt-6 grid gap-4">
      <div className="rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-700">
        <p>
          Diferencia clave:
          <strong> Aviso de quedo solo</strong> define cuando se muestra la decision.
          <strong> Tiempo de respuesta</strong> define cuanto tiempo tiene el alumno para contestar.
        </p>
      </div>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Cancelacion sin cobro: horas minimas de anticipacion</span>
        <span className="text-xs font-normal text-zinc-600">
          Ejemplo: 6 significa que si cancela con menos de 6 horas, ya no entra en sin cobro.
        </span>
        <input
          type="number"
          name="cancel_without_charge_hours"
          defaultValue={initialValues.cancel_without_charge_hours}
          min="0"
          max="168"
          step="1"
          className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
          placeholder="Ejemplo: 24"
        />
      </label>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Aviso de quedo solo: horas antes de la clase</span>
        <span className="text-xs font-normal text-zinc-600">
          Ejemplo: 24 significa que el aviso se habilita solo cuando faltan 24 horas o menos.
        </span>
        <input
          type="number"
          name="solo_warning_hours"
          defaultValue={initialValues.solo_warning_hours}
          min="0"
          max="168"
          step="1"
          className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
          placeholder="Ejemplo: 24"
        />
      </label>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Tiempo de respuesta del alumno (en minutos)</span>
        <span className="text-xs font-normal text-zinc-600">
          Ejemplo: 1440 equivale a 24 horas para responder si pasa a individual o cancela.
        </span>
        <input
          type="number"
          name="solo_decision_deadline_minutes"
          defaultValue={initialValues.solo_decision_deadline_minutes}
          min="1"
          max="10080"
          step="1"
          className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
          placeholder="Ejemplo: 1440 (24 horas)"
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
        {isPending ? "Guardando..." : "Guardar configuracion"}
      </button>
    </form>
  );
}
