"use client";

import { useActionState, useState } from "react";
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

  const [cancelHours, setCancelHours] = useState(initialValues.cancel_without_charge_hours);
  const [soloHours, setSoloHours] = useState(initialValues.solo_warning_hours);
  const [deadlineMinutes, setDeadlineMinutes] = useState(initialValues.solo_decision_deadline_minutes);

  const deadlineHours = Math.round(Number(deadlineMinutes) / 60);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between gap-4 px-4 py-3" style={{ background: "var(--surface-2)" }}>
          <div className="min-w-0">
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Cancelación sin cobro</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Horas de anticipación mínimas para cancelar sin cargo.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <input
              type="number"
              name="cancel_without_charge_hours"
              min={0}
              max={168}
              value={cancelHours}
              onChange={(e) => setCancelHours(e.target.value)}
              className="input h-9 w-14 !py-0 text-center font-semibold leading-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-sm" style={{ color: "var(--muted)" }}>h</span>
          </div>
        </div>

        <div style={{ height: "1px", background: "var(--border)" }} />

        <div className="flex items-center justify-between gap-4 px-4 py-3" style={{ background: "var(--surface-2)" }}>
          <div className="min-w-0">
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Aviso &quot;quedó solo&quot;</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Horas antes de la clase en que se activa el aviso.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <input
              type="number"
              name="solo_warning_hours"
              min={0}
              max={168}
              value={soloHours}
              onChange={(e) => setSoloHours(e.target.value)}
              className="input h-9 w-14 !py-0 text-center font-semibold leading-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-sm" style={{ color: "var(--muted)" }}>h</span>
          </div>
        </div>

        <div style={{ height: "1px", background: "var(--border)" }} />

        <div className="flex items-center justify-between gap-4 px-4 py-3" style={{ background: "var(--surface-2)" }}>
          <div className="min-w-0">
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Plazo de respuesta</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Minutos que tiene el alumno para responder al aviso de &quot;quedó solo&quot;.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <input
              type="number"
              name="solo_decision_deadline_minutes"
              min={1}
              max={10080}
              value={deadlineMinutes}
              onChange={(e) => setDeadlineMinutes(e.target.value)}
              className="input h-9 w-16 !py-0 text-center font-semibold leading-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-sm" style={{ color: "var(--muted)" }}>min</span>
            {deadlineHours > 0 && (
              <span className="text-xs" style={{ color: "var(--muted-2)" }}>({deadlineHours}h)</span>
            )}
          </div>
        </div>
      </div>

      {state.error ? <p className="alert-error">{state.error}</p> : null}
      {state.success ? <p className="alert-success">{state.success}</p> : null}

      <div className="flex justify-end">
        <button type="submit" disabled={isPending} className="btn-primary w-full justify-center sm:w-auto disabled:opacity-60">
          {isPending ? "Guardando..." : "Guardar ajustes"}
        </button>
      </div>
    </form>
  );
}
