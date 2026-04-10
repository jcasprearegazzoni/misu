"use client";

import { useActionState, useState } from "react";
import { saveProfesorPriceSettingsAction } from "./actions";

type TipoClase = "individual" | "dobles" | "trio" | "grupal";

const TIPOS: Array<{ key: TipoClase; label: string; descripcion: string }> = [
  { key: "individual", label: "Individual", descripcion: "1 alumno" },
  { key: "dobles", label: "Dobles", descripcion: "2 alumnos" },
  { key: "trio", label: "Trío", descripcion: "3 alumnos" },
  { key: "grupal", label: "Grupal", descripcion: "4+ alumnos" },
];

type PriceSettingsFormProps = {
  initialValues: {
    price_individual: string;
    price_dobles: string;
    price_trio: string;
    price_grupal: string;
  };
};

export function PriceSettingsForm({ initialValues }: PriceSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(saveProfesorPriceSettingsAction, {
    error: null,
    success: null,
  });

  // Inicializa el checkbox como activo si el precio ya tiene valor
  const [enabled, setEnabled] = useState<Record<TipoClase, boolean>>({
    individual: initialValues.price_individual !== "",
    dobles: initialValues.price_dobles !== "",
    trio: initialValues.price_trio !== "",
    grupal: initialValues.price_grupal !== "",
  });
  const [prices, setPrices] = useState<Record<TipoClase, string>>({
    individual: initialValues.price_individual,
    dobles: initialValues.price_dobles,
    trio: initialValues.price_trio,
    grupal: initialValues.price_grupal,
  });

  function toggle(key: TipoClase) {
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <form action={formAction} className="grid gap-4">
      <p className="mb-3 text-xs" style={{ color: "var(--muted)" }}>
        Solo los tipos de clase habilitados se envían. Los deshabilitados se borran de tu perfil.
      </p>

      <div className="grid gap-2 sm:grid-cols-2 sm:items-start">
        {TIPOS.map(({ key, label, descripcion }) => {
          const isEnabled = enabled[key];
          const fieldName = `price_${key}` as const;

          return (
            <div
              key={key}
              className="overflow-hidden rounded-xl border transition-all"
              style={{
                borderColor: isEnabled ? "var(--misu)" : "var(--border)",
                background: isEnabled
                  ? "color-mix(in srgb, var(--misu) 6%, var(--surface-1))"
                  : "var(--surface-1)",
              }}
            >
              <label
                className="flex cursor-pointer items-center gap-3 px-4 py-3"
                htmlFor={`enable_${key}`}
              >
                <input
                  type="checkbox"
                  id={`enable_${key}`}
                  checked={isEnabled}
                  onChange={() => toggle(key)}
                  className="h-4 w-4 cursor-pointer rounded accent-[var(--misu)]"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {label}
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {descripcion}
                  </p>
                </div>
                {isEnabled && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{
                      background: "color-mix(in srgb, var(--misu) 18%, transparent)",
                      color: "var(--misu)",
                    }}
                  >
                    Activo
                  </span>
                )}
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateRows: isEnabled ? "1fr" : "0fr",
                  transition: "grid-template-rows 0.2s ease",
                }}
              >
                <div style={{ overflow: "hidden" }}>
                  <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: "var(--border)" }}>
                    <label className="label" htmlFor={`${fieldName}_input`}>
                      <span className="text-xs" style={{ color: "var(--muted)" }}>
                        Precio por clase ({label.toLowerCase()})
                      </span>
                      <div className="relative mt-1">
                        <span
                          className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-medium"
                          style={{ color: "var(--muted)" }}
                        >
                          $
                        </span>
                        <input
                          type="number"
                          id={`${fieldName}_input`}
                          name={isEnabled ? fieldName : undefined}
                          value={prices[key]}
                          onChange={(e) => setPrices((prev) => ({ ...prev, [key]: e.target.value }))}
                          min="0"
                          step="1"
                          className="input w-full"
                          style={{ paddingLeft: "2rem" }}
                          placeholder="0"
                        />
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {state.error ? <p className="alert-error">{state.error}</p> : null}
      {state.success ? <p className="alert-success">{state.success}</p> : null}

      <div className="flex justify-end">
        <button type="submit" disabled={isPending} className="btn-primary disabled:opacity-60">
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
