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
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
      <p className="font-semibold text-zinc-900">Notas del profesor</p>

      <form action={formAction} className="mt-2 grid gap-2">
        <input type="hidden" name="alumno_id" value={alumnoId} />
        <textarea
          name="note"
          defaultValue={initialNote}
          rows={4}
          placeholder="Escribe una nota privada sobre este alumno..."
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        />

        {state.error ? <p className="text-xs text-red-700">{state.error}</p> : null}
        {state.success ? <p className="text-xs text-emerald-700">{state.success}</p> : null}

        <button
          type="submit"
          disabled={isPending}
          className="h-9 rounded-md bg-zinc-900 px-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "Guardando..." : "Guardar"}
        </button>
      </form>
    </div>
  );
}
