"use client";

import { useActionState, useEffect, useState } from "react";
import {
  upsertConfiguracionAction,
  type ClubConfiguracionActionState,
} from "./actions";

type ConfiguracionFormProps = {
  initialValues: {
    confirmacion_automatica: boolean;
    cancelacion_horas_limite: number;
  };
};

const initialState: ClubConfiguracionActionState = {
  error: null,
  success: null,
  submitted: {},
};

export function ConfiguracionForm({ initialValues }: ConfiguracionFormProps) {
  const [state, formAction, isPending] = useActionState(upsertConfiguracionAction, initialState);
  const [confirmacionAutomatica, setConfirmacionAutomatica] = useState(initialValues.confirmacion_automatica);
  const [cancelacionHorasLimite, setCancelacionHorasLimite] = useState(
    String(initialValues.cancelacion_horas_limite),
  );

  useEffect(() => {
    if (!state.error) return;
    if (state.submitted.confirmacion_automatica !== undefined) {
      setConfirmacionAutomatica(state.submitted.confirmacion_automatica === "on");
    }
    if (state.submitted.cancelacion_horas_limite !== undefined) {
      setCancelacionHorasLimite(state.submitted.cancelacion_horas_limite);
    }
  }, [state.error, state.submitted]);

  return (
    <section className="card p-5 sm:p-6">
      <h2 className="text-base font-semibold sm:text-lg" style={{ color: "var(--foreground)" }}>
        Ajustes generales
      </h2>

      <form action={formAction} className="mt-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Confirmación automática
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={confirmacionAutomatica}
              onClick={() => setConfirmacionAutomatica((prev) => !prev)}
              className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-200"
              style={{
                background: confirmacionAutomatica ? "var(--success)" : "var(--surface-1)",
                borderColor: confirmacionAutomatica ? "var(--success)" : "var(--border)",
              }}
            >
              <span
                className="inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200"
                style={{ transform: confirmacionAutomatica ? "translateX(24px)" : "translateX(2px)" }}
              />
            </button>
            {confirmacionAutomatica && (
              <input type="hidden" name="confirmacion_automatica" value="on" />
            )}
          </div>

          <div className="hidden h-5 sm:block" style={{ width: "1px", background: "var(--border)" }} />

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Cancelación anticipada
            </span>
            <input
              type="number"
              name="cancelacion_horas_limite"
              min={0}
              max={168}
              value={cancelacionHorasLimite}
              onChange={(event) => setCancelacionHorasLimite(event.target.value)}
              className="input h-9 min-w-[3.5rem] text-center font-semibold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              style={{
                MozAppearance: "textfield",
                width: `${Math.max(2, cancelacionHorasLimite.length || 1) + 2}ch`,
              }}
            />
            <span className="whitespace-nowrap text-sm" style={{ color: "var(--muted)" }}>
              horas antes
            </span>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="btn-primary h-9 px-4 sm:ml-auto"
          >
            {isPending ? "Guardando..." : "Guardar"}
          </button>
        </div>

        {state.error ? <p className="alert-error mt-4">{state.error}</p> : null}
        {state.success ? <p className="alert-success mt-4">{state.success}</p> : null}
      </form>
    </section>
  );
}
