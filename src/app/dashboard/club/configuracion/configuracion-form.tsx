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
  const [isOpen, setIsOpen] = useState(false);

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
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="group flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
      >
        <h2 className="text-base font-semibold sm:text-lg" style={{ color: "var(--foreground)" }}>
          Ajustes generales
        </h2>
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-200 group-hover:border-[var(--accent)] group-hover:text-[var(--foreground)]"
          style={{ borderColor: "var(--border)", color: "var(--muted)", background: "var(--surface-1)" }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className={`h-5 w-5 transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
          >
            <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {isOpen ? (
        <form action={formAction} className="mt-4 grid gap-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <div
              className="rounded-xl border p-4 transition-colors"
              style={{
                borderColor: confirmacionAutomatica ? "var(--success-border)" : "var(--border)",
                background: confirmacionAutomatica ? "var(--success-bg)" : "var(--surface-2)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                    Confirmacion automatica
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                    Las reservas se confirman sin aprobacion manual.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={confirmacionAutomatica}
                  onClick={() => setConfirmacionAutomatica((prev) => !prev)}
                  className="relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-200"
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
              </div>

              {/* Input oculto: se envia "on" cuando el switch esta activo */}
              {confirmacionAutomatica && (
                <input type="hidden" name="confirmacion_automatica" value="on" />
              )}
            </div>

            <div
              className="rounded-xl border p-4"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
            >
              <label className="label">
                <span>Cancelacion anticipada</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="cancelacion_horas_limite"
                    min={0}
                    max={168}
                    value={cancelacionHorasLimite}
                    onChange={(event) => setCancelacionHorasLimite(event.target.value)}
                    className="input h-10 min-w-[3.5rem] text-center font-semibold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    style={{
                      MozAppearance: "textfield",
                      width: `${Math.max(2, cancelacionHorasLimite.length || 1) + 2}ch`,
                    }}
                  />
                  <span className="whitespace-nowrap text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    horas antes
                  </span>
                </div>
              </label>
              <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
                Los alumnos pueden cancelar hasta ese tiempo antes del inicio.
              </p>
            </div>
          </div>

          {state.error ? <p className="alert-error">{state.error}</p> : null}
          {state.success ? <p className="alert-success">{state.success}</p> : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full justify-center transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
            >
              {isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
