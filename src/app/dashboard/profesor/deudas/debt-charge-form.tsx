"use client";

import { useActionState } from "react";
import { createDebtChargeAction } from "./actions";

type DebtChargeFormProps = {
  bookingId: number;
  alumnoId: string;
  estimatedAmount: number;
};

export function DebtChargeForm({ bookingId, alumnoId, estimatedAmount }: DebtChargeFormProps) {
  const [state, formAction, isPending] = useActionState(createDebtChargeAction, {
    error: null,
    success: null,
  });

  return (
    <form action={formAction} className="flex min-w-[280px] flex-col gap-2">
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="alumno_id" value={alumnoId} />

      <div className="flex items-center gap-2">
        <input
          type="number"
          name="amount"
          min="0.01"
          step="0.01"
          defaultValue={estimatedAmount > 0 ? estimatedAmount : undefined}
          placeholder="Monto"
          className="input w-28 px-2 py-1 text-xs"
          required
        />
        <select
          name="method"
          defaultValue="efectivo"
          className="select px-2 py-1 text-xs"
        >
          <option value="efectivo">Efectivo</option>
          <option value="transferencia_directa">Transferencia</option>
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary px-3 py-1.5 text-xs disabled:opacity-60"
        >
          {isPending ? "Cobrando..." : "Cobrar"}
        </button>
      </div>

      <input
        type="text"
        name="note"
        placeholder="Nota opcional"
        className="input px-2 py-1 text-xs"
      />

      {state.error ? <p className="text-xs" style={{ color: "var(--error)" }}>{state.error}</p> : null}
      {state.success ? <p className="text-xs" style={{ color: "var(--success)" }}>{state.success}</p> : null}
    </form>
  );
}

