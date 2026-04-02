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
    <form action={formAction} className="mt-4 grid gap-4">
      <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--muted)" }}>
        <p>
          El aviso de &quot;quedó solo&quot; define cuándo aparece la decisión.
          El tiempo de respuesta define cuántos minutos tiene el alumno para responder.
        </p>
      </div>

      <label className="label">
        <span>Cancelación sin cobro (horas de anticipación)</span>
        <span className="text-xs" style={{ color: "var(--muted-2)" }}>
          Ejemplo: 6 horas. Si cancela con menos, ya no entra en &quot;sin cobro&quot;.
        </span>
        <input
          type="number"
          name="cancel_without_charge_hours"
          defaultValue={initialValues.cancel_without_charge_hours}
          min="0"
          max="168"
          step="1"
          className="input"
          placeholder="Ejemplo: 24"
        />
      </label>

      <label className="label">
        <span>Aviso de &quot;quedó solo&quot; (horas antes de la clase)</span>
        <span className="text-xs" style={{ color: "var(--muted-2)" }}>
          Ejemplo: 24 horas. El aviso se habilita cuando faltan 24 horas o menos.
        </span>
        <input
          type="number"
          name="solo_warning_hours"
          defaultValue={initialValues.solo_warning_hours}
          min="0"
          max="168"
          step="1"
          className="input"
          placeholder="Ejemplo: 24"
        />
      </label>

      <label className="label">
        <span>Tiempo de respuesta del alumno (minutos)</span>
        <span className="text-xs" style={{ color: "var(--muted-2)" }}>
          Ejemplo: 1440 equivale a 24 horas para responder.
        </span>
        <input
          type="number"
          name="solo_decision_deadline_minutes"
          defaultValue={initialValues.solo_decision_deadline_minutes}
          min="1"
          max="10080"
          step="1"
          className="input"
          placeholder="Ejemplo: 1440"
        />
      </label>

      {state.error ? <p className="alert-error">{state.error}</p> : null}
      {state.success ? <p className="alert-success">{state.success}</p> : null}

      <div className="flex justify-end">
        <button type="submit" disabled={isPending} className="btn-secondary w-full justify-center sm:w-auto disabled:opacity-60">
          {isPending ? "Guardando..." : "Guardar ajustes"}
        </button>
      </div>
    </form>
  );
}
