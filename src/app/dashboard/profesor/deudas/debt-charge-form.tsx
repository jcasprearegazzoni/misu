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
    <form action={formAction} className="flex min-w-[320px] flex-col gap-2">
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
          className="w-28 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900"
          required
        />
        <select
          name="method"
          defaultValue="efectivo"
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900"
        >
          <option value="efectivo">Efectivo</option>
          <option value="transferencia_directa">Transferencia</option>
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
        >
          {isPending ? "Cobrando..." : "Cobrar"}
        </button>
      </div>

      <input
        type="text"
        name="note"
        placeholder="Nota opcional"
        className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900"
      />

      {state.error ? <p className="text-xs text-red-700">{state.error}</p> : null}
      {state.success ? <p className="text-xs text-emerald-700">{state.success}</p> : null}
    </form>
  );
}

