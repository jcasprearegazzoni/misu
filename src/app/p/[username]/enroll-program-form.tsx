"use client";

import { useActionState, useEffect } from "react";
import { enrollProgramAction, pagarProgramaOnlineAction } from "./actions";

type EnrollProgramFormProps = {
  programId: number;
  profesorId: string;
  profesorUsername: string;
  programaNombre: string;
  totalClases: number;
  precio: number;
  gatewayEnabled: boolean;
};

export function EnrollProgramForm({
  programId,
  profesorId,
  profesorUsername,
  programaNombre,
  totalClases,
  precio,
  gatewayEnabled,
}: EnrollProgramFormProps) {
  const selectedAction = gatewayEnabled ? pagarProgramaOnlineAction : enrollProgramAction;

  const [state, formAction, isPending] = useActionState(selectedAction, {
    error: null,
    success: null,
  });

  useEffect(() => {
    // Si la acción devuelve una URL de checkout, redirige directamente a MercadoPago.
    if (gatewayEnabled && state.success && state.success.startsWith("http")) {
      window.location.href = state.success;
    }
  }, [gatewayEnabled, state.success]);

  if (state.success && (!gatewayEnabled || !state.success.startsWith("http"))) {
    return (
      <div
        className="rounded-lg border px-3 py-2 text-sm"
        style={{
          borderColor: "var(--success)",
          background: "color-mix(in srgb, var(--success) 10%, transparent)",
          color: "var(--success)",
        }}
      >
        {state.success}
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-2">
      <input type="hidden" name="program_id" value={programId} />
      <input type="hidden" name="profesor_id" value={profesorId} />
      <input type="hidden" name="profesor_username" value={profesorUsername} />

      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          {programaNombre} — {totalClases} clases — ${precio.toLocaleString("es-AR")}
        </p>
      </div>

      {state.error ? (
        <p className="text-xs" style={{ color: "var(--error)" }}>
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        style={{ background: "var(--misu)" }}
      >
        {isPending ? "Enviando..." : gatewayEnabled ? "Pagar online" : "Solicitar inscripción"}
      </button>
    </form>
  );
}
