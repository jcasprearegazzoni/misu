"use client";

import { useActionState } from "react";
import { addBlockedDateAction } from "./actions";

export function BlockedDatesForm() {
  const [state, formAction, isPending] = useActionState(addBlockedDateAction, {
    error: null,
    success: null,
  });

  return (
    <form action={formAction} className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4">
      <h2 className="text-base font-semibold text-zinc-900">Agregar bloqueo por rango</h2>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Inicio</span>
        <input
          type="datetime-local"
          name="start_at"
          className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
          required
        />
      </label>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Fin</span>
        <input
          type="datetime-local"
          name="end_at"
          className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
          required
        />
      </label>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Motivo (opcional)</span>
        <input
          type="text"
          name="reason"
          className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-500 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
          placeholder="Ej: torneo personal"
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
        {isPending ? "Guardando..." : "Agregar bloqueo"}
      </button>
    </form>
  );
}
