"use client";

import { useActionState } from "react";
import { buyPackageAction } from "./actions";

type BuyPackageFormProps = {
  packageId: number;
  profesorId: string;
  packageName: string;
  totalClasses: number;
  price: number;
};

function formatAmount(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function BuyPackageForm({ packageId, profesorId, packageName, totalClasses, price }: BuyPackageFormProps) {
  const [state, formAction, isPending] = useActionState(buyPackageAction, {
    error: null,
    success: null,
  });

  if (state.success) {
    return (
      <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        {state.success}
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-2">
      <input type="hidden" name="package_id" value={packageId} />
      <input type="hidden" name="profesor_id" value={profesorId} />

      <div>
        <p className="text-sm font-semibold text-zinc-900">{packageName}</p>
        <p className="text-xs text-zinc-600">{totalClasses} clases · {formatAmount(price)}</p>
      </div>

      {state.error ? (
        <p className="text-xs text-red-700">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Enviando..." : "Solicitar paquete"}
      </button>
    </form>
  );
}
