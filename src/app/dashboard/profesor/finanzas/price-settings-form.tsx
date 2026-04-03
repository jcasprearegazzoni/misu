"use client";

import { useActionState } from "react";
import { saveProfesorPriceSettingsAction } from "./actions";

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

  return (
    <form action={formAction} className="grid gap-3">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <label className="label min-w-0">
          <span>Precio individual</span>
          <input
            type="number"
            name="price_individual"
            defaultValue={initialValues.price_individual}
            min="0"
            step="0.01"
            className="input w-full min-w-0"
            placeholder="0.00"
          />
        </label>

        <label className="label min-w-0">
          <span>Precio dobles</span>
          <input
            type="number"
            name="price_dobles"
            defaultValue={initialValues.price_dobles}
            min="0"
            step="0.01"
            className="input w-full min-w-0"
            placeholder="0.00"
          />
        </label>

        <label className="label min-w-0">
          <span>Precio trío</span>
          <input
            type="number"
            name="price_trio"
            defaultValue={initialValues.price_trio}
            min="0"
            step="0.01"
            className="input w-full min-w-0"
            placeholder="0.00"
          />
        </label>

        <label className="label min-w-0">
          <span>Precio grupal</span>
          <input
            type="number"
            name="price_grupal"
            defaultValue={initialValues.price_grupal}
            min="0"
            step="0.01"
            className="input w-full min-w-0"
            placeholder="0.00"
          />
        </label>
      </div>

      {state.error ? <p className="alert-error">{state.error}</p> : null}
      {state.success ? <p className="alert-success">{state.success}</p> : null}

      <div className="flex justify-end">
        <button type="submit" disabled={isPending} className="btn-secondary disabled:opacity-60">
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
