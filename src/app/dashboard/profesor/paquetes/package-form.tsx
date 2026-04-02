"use client";

import { useActionState } from "react";
import { createPackageAction } from "./actions";

export function PackageForm() {
  const [state, formAction, isPending] = useActionState(createPackageAction, {
    error: null,
    success: null,
  });

  return (
    <form action={formAction} className="grid gap-3">
      <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
        Crear paquete
      </h2>

      <label className="grid gap-1 text-sm font-medium" style={{ color: "var(--muted)" }}>
        <span>Nombre</span>
        <input
          name="name"
          type="text"
          className="rounded-lg px-3 py-2 text-sm outline-none transition"
          style={{
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--foreground)",
          }}
          placeholder="Ej: Pack 8 clases"
          required
        />
      </label>

      <label className="grid gap-1 text-sm font-medium" style={{ color: "var(--muted)" }}>
        <span>Total de clases</span>
        <input
          name="total_classes"
          type="number"
          min="1"
          step="1"
          className="rounded-lg px-3 py-2 text-sm outline-none transition"
          style={{
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--foreground)",
          }}
          required
        />
      </label>

      <label className="grid gap-1 text-sm font-medium" style={{ color: "var(--muted)" }}>
        <span>Precio</span>
        <input
          name="price"
          type="number"
          min="0.01"
          step="0.01"
          className="rounded-lg px-3 py-2 text-sm outline-none transition"
          style={{
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--foreground)",
          }}
          required
        />
      </label>

      <label className="grid gap-1 text-sm font-medium" style={{ color: "var(--muted)" }}>
        <span>Descripción (opcional)</span>
        <textarea
          name="description"
          className="min-h-20 rounded-lg px-3 py-2 text-sm outline-none transition"
          style={{
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--foreground)",
          }}
          placeholder="Detalle breve del paquete"
        />
      </label>

      {state.error ? (
        <p className="rounded-lg px-3 py-2 text-sm font-medium" style={{ border: "1px solid var(--error-border)", background: "var(--error-bg)", color: "#fca5a5" }}>
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-lg px-3 py-2 text-sm font-medium" style={{ border: "1px solid var(--success-border)", background: "var(--success-bg)", color: "#86efac" }}>
          {state.success}
        </p>
      ) : null}

      <button type="submit" disabled={isPending} className="btn-secondary w-full justify-center disabled:opacity-60">
        {isPending ? "Guardando..." : "Crear paquete"}
      </button>
    </form>
  );
}
