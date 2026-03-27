"use client";

import { useActionState } from "react";
import { createPackageAction } from "./actions";

export function PackageForm() {
  const [state, formAction, isPending] = useActionState(createPackageAction, {
    error: null,
    success: null,
  });

  return (
    <form action={formAction} className="mt-4 grid gap-3 rounded-lg border border-zinc-300 bg-white p-4">
      <h2 className="text-lg font-semibold text-zinc-900">Crear paquete</h2>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Nombre</span>
        <input
          name="name"
          type="text"
          className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
          placeholder="Ej: Pack 8 clases"
          required
        />
      </label>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Total de clases</span>
        <input
          name="total_classes"
          type="number"
          min="1"
          step="1"
          className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
          required
        />
      </label>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Precio</span>
        <input
          name="price"
          type="number"
          min="0.01"
          step="0.01"
          className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
          required
        />
      </label>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Descripcion (opcional)</span>
        <textarea
          name="description"
          className="min-h-20 rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
          placeholder="Detalle breve del paquete"
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
        {isPending ? "Guardando..." : "Crear paquete"}
      </button>
    </form>
  );
}

