"use client";

import { useActionState } from "react";
import { saveProfesorAlumnoNoteAction } from "@/app/dashboard/profesor/calendario/note-actions";

type ProfesorNoteEditorProps = {
  alumnoId: string;
  initialNote: string;
};

export function ProfesorNoteEditor({ alumnoId, initialNote }: ProfesorNoteEditorProps) {
  const [state, formAction, isPending] = useActionState(saveProfesorAlumnoNoteAction, {
    error: null,
    success: null,
  });

  return (
    <form action={formAction} className="grid gap-2">
      <input type="hidden" name="alumno_id" value={alumnoId} />
      <textarea
        name="note"
        defaultValue={initialNote}
        rows={4}
        placeholder="Escribe una nota privada sobre este alumno..."
        className="w-full rounded-md border px-3 py-2 text-sm"
        style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--foreground)" }}
      />

      {state.error ? (
        <p className="text-xs" style={{ color: "var(--error)" }}>
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-xs" style={{ color: "var(--success)" }}>
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="h-9 rounded-md px-3 text-sm font-semibold text-white disabled:opacity-60"
        style={{ background: "var(--misu)" }}
      >
        {isPending ? "Guardando..." : "Guardar"}
      </button>
    </form>
  );
}
